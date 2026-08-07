-- ============================================================
-- HOTFIX for 202608070006_reconcile_child_rows_rpc.sql.
--
-- `SET search_path = public` excluded the `extensions` schema, where this
-- project's uuid-ossp extension actually lives (same reason
-- notifications_send_push's trigger pins `search_path=public,extensions,
-- vault` — established project pattern). Confirmed live:
-- `function uuid_generate_v4() does not exist` on every call. Add
-- `extensions` to the search path.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.reconcile_candidate_child_rows(
  p_table TEXT,
  p_candidate_id UUID,
  p_rows JSONB
)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  allowed_tables CONSTANT TEXT[] := ARRAY['work_experiences', 'education', 'language_skills', 'certifications'];
  rows_with_ids JSONB;
BEGIN
  IF p_table <> ALL(allowed_tables) THEN
    RAISE EXCEPTION 'reconcile_candidate_child_rows: invalid table %', p_table;
  END IF;

  IF NOT public.owns_candidate_profile(p_candidate_id) THEN
    RAISE EXCEPTION 'reconcile_candidate_child_rows: not authorized for candidate %', p_candidate_id;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_candidate_id::text || ':' || p_table, 0));

  IF jsonb_array_length(p_rows) > 0 THEN
    SELECT jsonb_agg(elem || jsonb_build_object('id', uuid_generate_v4(), 'created_at', NOW()))
    INTO rows_with_ids
    FROM jsonb_array_elements(p_rows) elem;

    RETURN QUERY EXECUTE format(
      $f$
      WITH inserted AS (
        INSERT INTO public.%1$I
        SELECT * FROM jsonb_populate_recordset(NULL::public.%1$I, $1)
        RETURNING id
      ),
      pruned AS (
        DELETE FROM public.%1$I
        WHERE candidate_id = $2 AND id NOT IN (SELECT id FROM inserted)
      )
      SELECT id FROM inserted
      $f$,
      p_table
    ) USING rows_with_ids, p_candidate_id;
  ELSE
    EXECUTE format('DELETE FROM public.%I WHERE candidate_id = $1', p_table) USING p_candidate_id;
    RETURN;
  END IF;
END;
$$;

COMMIT;
