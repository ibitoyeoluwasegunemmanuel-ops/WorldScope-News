-- WorldScope News advertising inventory and campaign schedule
create table if not exists public.advertisements (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 2 and 120),
 advertiser text not null check(char_length(advertiser) between 2 and 120),
 format text not null check(format in ('image','video')),
 placement text not null check(placement in ('top_leaderboard','homepage_rail','in_article','video_feature','footer_banner')),
 media_path text not null,
 click_url text,
 alt_text text not null default '',
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'draft' check(status in ('draft','scheduled','active','paused','ended')),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint advertisements_valid_window check(ends_at>starts_at)
);
alter table public.advertisements enable row level security;
drop policy if exists advertisements_public_active_read on public.advertisements;
create policy advertisements_public_active_read on public.advertisements for select to anon,authenticated using(status='active' and starts_at<=now() and ends_at>=now());
drop policy if exists advertisements_staff_read on public.advertisements;
create policy advertisements_staff_read on public.advertisements for select to authenticated using(private.current_staff_role() in ('admin','editor'));
drop policy if exists advertisements_staff_insert on public.advertisements;
create policy advertisements_staff_insert on public.advertisements for insert to authenticated with check(private.current_staff_role() in ('admin','editor') and created_by=auth.uid());
drop policy if exists advertisements_staff_update on public.advertisements;
create policy advertisements_staff_update on public.advertisements for update to authenticated using(private.current_staff_role() in ('admin','editor')) with check(private.current_staff_role() in ('admin','editor'));
drop policy if exists advertisements_staff_delete on public.advertisements;
create policy advertisements_staff_delete on public.advertisements for delete to authenticated using(private.current_staff_role() in ('admin','editor'));
grant select on public.advertisements to anon,authenticated;
grant insert,update,delete on public.advertisements to authenticated;
create index if not exists advertisements_active_placement_idx on public.advertisements(placement,status,starts_at,ends_at);
