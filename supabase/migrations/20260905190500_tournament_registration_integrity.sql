-- T-003 integrity follow-up: relational foreign keys prove existence, while these
-- guards prove tournament/organization consistency across team/boat/entry links.

create or replace function public.tg_validate_tournament_team_scope()
returns trigger language plpgsql as $$
declare
  tournament_org uuid;
begin
  select organization_id into tournament_org
    from public.tournament
   where id = new.tournament_id;

  if tournament_org is null or tournament_org <> new.organization_id then
    raise exception 'tournament_team organization must match tournament organization'
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

create trigger tg_tournament_team_scope
before insert or update of tournament_id, organization_id on public.tournament_team
for each row execute function public.tg_validate_tournament_team_scope();

create or replace function public.tg_validate_tournament_boat_scope()
returns trigger language plpgsql as $$
declare
  tournament_org uuid;
begin
  select organization_id into tournament_org
    from public.tournament
   where id = new.tournament_id;

  if tournament_org is null or tournament_org <> new.organization_id then
    raise exception 'tournament_boat organization must match tournament organization'
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

create trigger tg_tournament_boat_scope
before insert or update of tournament_id, organization_id on public.tournament_boat
for each row execute function public.tg_validate_tournament_boat_scope();

create or replace function public.tg_validate_tournament_entry_scope()
returns trigger language plpgsql as $$
declare
  tournament_org uuid;
  team_tournament uuid;
  team_org uuid;
  boat_tournament uuid;
  boat_org uuid;
begin
  select organization_id into tournament_org
    from public.tournament
   where id = new.tournament_id;

  if tournament_org is null or tournament_org <> new.organization_id then
    raise exception 'tournament_entry organization must match tournament organization'
      using errcode = 'foreign_key_violation';
  end if;

  if new.team_id is not null then
    select tournament_id, organization_id into team_tournament, team_org
      from public.tournament_team
     where id = new.team_id and deleted_at is null;
    if team_tournament is null
       or team_tournament <> new.tournament_id
       or team_org <> new.organization_id then
      raise exception 'entry team must belong to the same tournament and organization'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  if new.tournament_boat_id is not null then
    select tournament_id, organization_id into boat_tournament, boat_org
      from public.tournament_boat
     where id = new.tournament_boat_id;
    if boat_tournament is null
       or boat_tournament <> new.tournament_id
       or boat_org <> new.organization_id then
      raise exception 'entry boat must belong to the same tournament and organization'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  return new;
end $$;

create trigger tg_tournament_entry_scope
before insert or update of tournament_id, organization_id, team_id, tournament_boat_id
on public.tournament_entry
for each row execute function public.tg_validate_tournament_entry_scope();

create or replace function public.tg_validate_tournament_team_member_scope()
returns trigger language plpgsql as $$
declare
  team_tournament uuid;
  entry_tournament uuid;
begin
  select tournament_id into team_tournament
    from public.tournament_team
   where id = new.tournament_team_id and deleted_at is null;
  select tournament_id into entry_tournament
    from public.tournament_entry
   where id = new.tournament_entry_id and deleted_at is null;

  if team_tournament is null or entry_tournament is null or team_tournament <> entry_tournament then
    raise exception 'team member entry must belong to the same tournament as the team'
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

create trigger tg_tournament_team_member_scope
before insert or update of tournament_team_id, tournament_entry_id
on public.tournament_team_member
for each row execute function public.tg_validate_tournament_team_member_scope();
