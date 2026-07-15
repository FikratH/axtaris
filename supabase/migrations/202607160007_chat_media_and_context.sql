-- Chat image attachments (item 2a) + denormalized conversation context for
-- per-viewer titles and the header panel (items 2b, 3).

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'image')),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- image-only messages carry an empty body
ALTER TABLE public.messages ALTER COLUMN body SET DEFAULT '';

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS vacancy_title TEXT,
  ADD COLUMN IF NOT EXISTS candidate_name TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Private bucket for 1:1 chat images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media', 'chat-media', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "chat_media_member_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_member_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat_media_member_delete" ON storage.objects;

-- Path convention: conversations/{conversation_id}/{sender_id}/{ts}-file.ext
CREATE POLICY "chat_media_member_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'conversations'
    AND public.can_access_conversation(((storage.foldername(name))[2])::uuid)
  );

CREATE POLICY "chat_media_member_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'conversations'
    AND public.can_access_conversation(((storage.foldername(name))[2])::uuid)
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

CREATE POLICY "chat_media_member_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'conversations'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );
