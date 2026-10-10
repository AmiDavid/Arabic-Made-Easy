-- Arabic Made Easy security fix (2026-10-10), as applied to project mbamnlgcdfyrpuwyvsvm.
-- learner_state and study_events (TEF B2 Coach) are NOT touched.
-- Backup taken first: schema backup_2026_10_10 (not exposed to the API).

-- 1) Invite list + helpers ---------------------------------------------------
create table if not exists public.allowed_users (
  email text primary key check (email = lower(email)),
  role text not null default 'viewer' check (role in ('owner','editor','viewer')),
  display_name text,
  added_at timestamptz not null default now()
);
alter table public.allowed_users enable row level security;
revoke all on public.allowed_users from anon;
grant select on public.allowed_users to authenticated;
create policy "read own allowlist row" on public.allowed_users
  for select to authenticated using (email = lower((select auth.jwt()) ->> 'email'));
insert into public.allowed_users (email, role, display_name) values
  ('amidavid21@gmail.com', 'owner', 'Amichai'),
  ('zbounbasil@gmail.com', 'viewer', 'Basil')
on conflict (email) do update set role = excluded.role, display_name = excluded.display_name;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.app_role() returns text language sql stable security definer set search_path = ''
as $$ select role from public.allowed_users where email = lower(coalesce((select auth.jwt()) ->> 'email', '')) $$;
create or replace function private.can_read() returns boolean language sql stable security definer set search_path = ''
as $$ select private.app_role() is not null $$;
create or replace function private.can_edit() returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(private.app_role() in ('owner','editor'), false) $$;
revoke all on function private.app_role(), private.can_read(), private.can_edit() from public, anon;
grant execute on function private.app_role(), private.can_read(), private.can_edit() to authenticated;

-- 2) Rewrite the open policies in place --------------------------------------
alter policy "public read topics" on public.topics to authenticated using ((select private.can_read()));
alter policy "public read topics" on public.topics rename to "invited read topics";
alter policy "public write topics" on public.topics to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
alter policy "public write topics" on public.topics rename to "editors write topics";
alter policy "public read entries" on public.entries to authenticated using ((select private.can_read()));
alter policy "public read entries" on public.entries rename to "invited read entries";
alter policy "public write entries" on public.entries to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
alter policy "public write entries" on public.entries rename to "editors write entries";
alter policy "public read grammar" on public.grammar_rules to authenticated using ((select private.can_read()));
alter policy "public read grammar" on public.grammar_rules rename to "invited read grammar";
alter policy "public write grammar" on public.grammar_rules to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
alter policy "public write grammar" on public.grammar_rules rename to "editors write grammar";
alter policy "public read pages" on public.notebook_pages to authenticated using ((select private.can_read()));
alter policy "public read pages" on public.notebook_pages rename to "invited read pages";
alter policy "public write pages" on public.notebook_pages to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
alter policy "public write pages" on public.notebook_pages rename to "editors write pages";
alter policy "public read scans" on public.scans to authenticated using ((select private.can_edit()));
alter policy "public read scans" on public.scans rename to "editors read scans";
alter policy "public write scans" on public.scans to authenticated using ((select private.can_edit())) with check ((select private.can_edit()));
alter policy "public write scans" on public.scans rename to "editors write scans";
alter table public.reviews alter column user_id set default (auth.uid())::text;
alter table public.conversations alter column user_id set default (auth.uid())::text;
alter policy "public read reviews" on public.reviews to authenticated using (user_id = (select auth.uid())::text and (select private.can_read()));
alter policy "public read reviews" on public.reviews rename to "own reviews read";
alter policy "public write reviews" on public.reviews to authenticated using (user_id = (select auth.uid())::text and (select private.can_read())) with check (user_id = (select auth.uid())::text and (select private.can_read()));
alter policy "public write reviews" on public.reviews rename to "own reviews write";
alter policy "public read convos" on public.conversations to authenticated using (user_id = (select auth.uid())::text and (select private.can_read()));
alter policy "public read convos" on public.conversations rename to "own conversations read";
alter policy "public write convos" on public.conversations to authenticated using (user_id = (select auth.uid())::text and (select private.can_read())) with check (user_id = (select auth.uid())::text and (select private.can_read()));
alter policy "public write convos" on public.conversations rename to "own conversations write";

-- 3) No table privileges for the anonymous key -------------------------------
revoke all on public.topics, public.entries, public.grammar_rules, public.notebook_pages,
  public.scans, public.reviews, public.conversations from anon;

-- To invite someone later:
--   insert into public.allowed_users (email, role, display_name) values ('name@example.com', 'viewer', 'Name');
