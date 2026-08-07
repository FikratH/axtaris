-- ============================================================
-- P0 data-loss fix: concurrent profile saves can wipe an entire child
-- table (work_experiences / education / language_skills /
-- certifications).
--
-- The client's reconcileChildRows() did INSERT (round trip 1) then
-- DELETE-not-in-just-inserted (round trip 2) as two SEPARATE requests.
-- Two overlapping saves (double-tap, two devices, or a slow network
-- interleaving them) each delete rows they don't recognize as "theirs" —
-- reproduced in src/services/candidateVacancyService.reconcile.test.ts
-- with a stateful fake: the table ends up completely empty.
--
-- Fix: do both the insert and the delete inside ONE SECURITY DEFINER
-- function call — one statement, one transaction — AND serialize
-- concurrent calls for the same (candidate, table) with a transaction-
-- scoped advisory lock, so a second overlapping save waits for the first
-- to fully commit and correctly sees its rows as "already there" rather
-- than racing to delete them. This makes concurrent saves resolve to
-- ordinary last-write-wins (whichever call's transaction commits last
-- reflects in the table), matching how two sequential saves from one
-- device already behave — not silent total loss.
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
SET search_path = public
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

  -- Serialize concurrent reconciles for this exact (candidate, table) pair.
  -- Released automatically at transaction (= function call) end.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_candidate_id::text || ':' || p_table, 0));

  IF jsonb_array_length(p_rows) > 0 THEN
    -- jsonb_populate_recordset leaves any column absent from the JSON as a
    -- literal NULL rather than applying the table's DEFAULT (unlike a
    -- normal PostgREST insert, which omits the column entirely) — inject
    -- id/created_at explicitly so the NOT NULL primary key doesn't fail.
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

REVOKE ALL ON FUNCTION public.reconcile_candidate_child_rows(TEXT, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconcile_candidate_child_rows(TEXT, UUID, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.reconcile_candidate_child_rows(TEXT, UUID, JSONB) TO authenticated;

COMMIT;
