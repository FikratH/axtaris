-- Harden auth user provisioning for real Supabase Auth signups/admin-created users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'candidate')::user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

  IF COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'candidate') = 'candidate' THEN
    INSERT INTO public.candidate_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.candidate_subscriptions (user_id, plan, status, price_amount)
    VALUES (NEW.id, 'free', 'active', 0)
    ON CONFLICT DO NOTHING;
  ELSIF NEW.raw_user_meta_data->>'role' = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
      INSERT INTO public.companies (name, industry, owner_id)
      VALUES (NEW.raw_user_meta_data->>'company_name', 'General', NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
