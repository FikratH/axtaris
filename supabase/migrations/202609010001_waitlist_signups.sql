create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null check (role in ('candidate','employer')),
  locale text not null default 'az' check (locale in ('az','en','ru')),
  source text not null default 'landing',
  consent boolean not null,
  consent_text_version text not null default 'v1',
  created_at timestamptz not null default now()
);
create unique index waitlist_signups_email_role_key on public.waitlist_signups (lower(email), role);
alter table public.waitlist_signups enable row level security;
revoke all on public.waitlist_signups from anon, authenticated;
grant insert on public.waitlist_signups to anon;
create policy waitlist_insert_anon on public.waitlist_signups for insert to anon with check (consent = true);
