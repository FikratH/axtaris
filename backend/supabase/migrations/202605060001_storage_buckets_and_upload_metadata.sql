-- AxtarIS Commercial V1 storage buckets, policies, and upload metadata.
-- Run this against Supabase/Postgres before enabling real file upload.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.uploaded_files
  ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user
  ON public.uploaded_files(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_storage
  ON public.uploaded_files(storage_bucket, storage_path);

DROP POLICY IF EXISTS "uploaded_files_all" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_select" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_insert" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_update" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_delete" ON public.uploaded_files;

CREATE POLICY "uploaded_files_select"
  ON public.uploaded_files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "uploaded_files_insert"
  ON public.uploaded_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uploaded_files_update"
  ON public.uploaded_files
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uploaded_files_delete"
  ON public.uploaded_files
  FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'cv-uploads',
    'cv-uploads',
    false,
    10485760,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  ),
  (
    'company-media',
    'company-media',
    true,
    5242880,
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.current_user_owns_company(company_id_text TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE companies.id::text = company_id_text
      AND companies.owner_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.current_user_owns_company(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_owns_company(TEXT) TO authenticated;

DROP POLICY IF EXISTS "cv_uploads_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "company_media_public_select" ON storage.objects;
DROP POLICY IF EXISTS "company_media_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "company_media_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "company_media_owner_delete" ON storage.objects;

CREATE POLICY "cv_uploads_owner_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "cv_uploads_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "cv_uploads_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "cv_uploads_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'candidates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars_public_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "company_media_public_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'company-media');

CREATE POLICY "company_media_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  );

CREATE POLICY "company_media_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  )
  WITH CHECK (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  );

CREATE POLICY "company_media_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'company-media'
    AND (storage.foldername(name))[1] = 'companies'
    AND public.current_user_owns_company((storage.foldername(name))[2])
  );
