-- =============================================================================
-- V1 fixes: catch resolution on INSERT, journal_entry unique + soft delete
--
-- Two defects found by actually running the four V1 migrations (never done
-- before this), not by reading them. Both are in unreleased DDL — nothing has
-- run against a real project and no app code depends on this schema yet — so
-- this is a new migration rather than an edit to the four already merged.
--
-- 1. `tg_catch_resolution` only fired BEFORE UPDATE. D22's lifecycle diagram
--    (ontology.md §2.2) has a second entry point straight into `confirmed`:
--    "[*] --> confirmed : full catch form (the angler said what it was)".
--    Inserting a catch that way hit `catch_unresolved_is_unresolved`, because
--    nothing set `resolved_at`/`resolved_by` on an INSERT. The fix widens the
--    trigger to `BEFORE INSERT OR UPDATE` and guards every OLD reference
--    behind `tg_op = 'UPDATE'`, since OLD does not exist on INSERT.
--
-- 2. `journal_entry`'s `unique (angler_id, entry_date)` did not exclude
--    soft-deleted rows. D23 makes the day page the primary writing surface,
--    so a soft-deleted entry permanently blocking a rewrite of that date
--    would surface immediately and look exactly like data loss. Swapped for
--    a partial unique index on `deleted_at is null`, same effective name.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fix 1: catch resolution guard also fires on INSERT
-- -----------------------------------------------------------------------------

drop trigger if exists tg_catch_resolution on public.catch;

create or replace function public.tg_catch_resolution_guard()
returns trigger language plpgsql as $$
begin
  -- D22: only a human moves a mark, and nothing ever goes back to unresolved.
  -- OLD does not exist on INSERT, so this check only makes sense on UPDATE.
  if tg_op = 'UPDATE' then
    if old.resolution_state <> 'unresolved' and new.resolution_state = 'unresolved' then
      raise exception
        'a resolved mark cannot return to unresolved (D22): % -> unresolved', old.resolution_state
        using errcode = 'check_violation';
    end if;
  end if;

  -- Record the act of resolving, whether the row arrived already resolved
  -- (the full catch form inserting straight to `confirmed`, D22's other entry
  -- point) or was resolved by a later UPDATE (the needs-details queue). Never
  -- overwrite a value the client explicitly set. `tg_op = 'INSERT' or ...`
  -- short-circuits before the OLD reference, which is what makes this safe to
  -- run in both trigger contexts.
  if new.resolution_state <> 'unresolved'
     and (tg_op = 'INSERT' or new.resolution_state <> old.resolution_state) then
    if new.resolved_at is null then
      new.resolved_at := now();
    end if;
    if new.resolved_by is null then
      new.resolved_by := new.angler_id;
    end if;
  end if;

  return new;
end $$;

create trigger tg_catch_resolution before insert or update on public.catch
  for each row execute function public.tg_catch_resolution_guard();

comment on function public.tg_catch_resolution_guard() is
  'D22. Fires on INSERT and UPDATE. A row inserted already resolved (the full catch '
  'form) and a row resolved later (the needs-details queue) both get resolved_at/'
  'resolved_by filled in if the client did not supply them. Never returns to '
  'unresolved once left. ontology.md §2.2.';

-- -----------------------------------------------------------------------------
-- Fix 2: journal_entry uniqueness must not survive a soft delete
-- -----------------------------------------------------------------------------

alter table public.journal_entry
  drop constraint if exists journal_entry_angler_id_entry_date_key;

create unique index if not exists journal_entry_angler_id_entry_date_key
  on public.journal_entry (angler_id, entry_date)
  where deleted_at is null;

comment on index public.journal_entry_angler_id_entry_date_key is
  'Partial, not a table constraint: (angler_id, entry_date) is unique only among '
  'live rows. A soft-deleted day''s entry must not permanently block a rewrite of '
  'that date — D23 makes the day page the primary writing surface, so this would '
  'surface immediately and look like data loss.';
