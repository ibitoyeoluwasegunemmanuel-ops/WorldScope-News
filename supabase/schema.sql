-- WorldScope News CMS foundation
-- Run in Supabase SQL Editor. Keep RLS enabled. Never expose a service_role key in browser code.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role text not null default 'reader' check (role in ('reader','reporter','editor','moderator','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.articles (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id),
 title text not null check (char_length(title) between 8 and 180),
 slug text unique,
 category text not null,
 summary text not null check (char_length(summary) between 20 and 500),
 body text not null,
 featured_image_url text,
 status text not null default 'draft' check (status in ('draft','in_review','approved','published','rejected','archived')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.article_sources (
 id uuid primary key default gen_random_uuid(),
 article_id uuid not null references public.articles(id) on delete cascade,
 added_by uuid not null references auth.users(id),
 title text not null,
 url text not null,
 source_type text not null check (source_type in ('primary','news','eyewitness','social','other')),
 notes text not null,
 checked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.article_corrections (
 id uuid primary key default gen_random_uuid(),
 article_id uuid not null references public.articles(id) on delete cascade,
 editor_id uuid not null references auth.users(id),
 correction text not null,
 reason text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 article_id uuid not null references public.articles(id) on delete cascade,
 display_name text not null,
 body text not null check (char_length(body) between 2 and 2000),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 moderated_at timestamptz,
 moderated_by uuid references auth.users(id)
);
create table if not exists public.opportunities (
 id uuid primary key default gen_random_uuid(),
 submitted_by uuid references auth.users(id),
 title text not null,
 opportunity_type text not null check (opportunity_type in ('job','internship','scholarship','grant','fellowship','tender','training','other')),
 organisation text not null,
 location text not null,
 eligibility text not null,
 deadline date,
 application_url text not null,
 original_source_url text not null,
 last_verified_at timestamptz not null,
 status text not null default 'draft' check (status in ('draft','in_review','published','expired','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 confirmed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.advertising_enquiries (
 id uuid primary key default gen_random_uuid(),
 organisation text not null,
 contact_name text not null,
 email text not null,
 phone text,
 campaign text not null,
 preferred_dates text,
 budget_range text,
 status text not null default 'new' check (status in ('new','contacted','proposal_sent','invoiced','paid','scheduled','closed')),
 created_at timestamptz not null default now()
);

create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;
create or replace function public.has_staff_role(allowed text[])
returns boolean language sql stable security definer set search_path=public
as $$ select coalesce(public.current_staff_role() = any(allowed),false) $$;

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.article_sources enable row level security;
alter table public.article_corrections enable row level security;
alter table public.comments enable row level security;
alter table public.opportunities enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.advertising_enquiries enable row level security;

create policy "staff read own profile" on public.profiles for select to authenticated using (id=auth.uid() or public.has_staff_role(array['admin','editor']));
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.has_staff_role(array['admin'])) with check (public.has_staff_role(array['admin']));
create policy "public read published articles" on public.articles for select to anon,authenticated using (status='published' or public.has_staff_role(array['reporter','editor','moderator','admin']));
-- Reporters may submit only their own drafts or items for editorial review.
-- Editors/admins have a separate policy for editorial workflow transitions.
create policy "reporters create reviewable articles" on public.articles
 for insert to authenticated
 with check (
  author_id=auth.uid()
  and public.has_staff_role(array['reporter'])
  and status in ('draft','in_review')
 );
create policy "editors create articles" on public.articles
 for insert to authenticated
 with check (
  author_id=auth.uid()
  and public.has_staff_role(array['editor','admin'])
 );
create policy "authors edit own drafts" on public.articles
 for update to authenticated
 using (
  author_id=auth.uid()
  and public.has_staff_role(array['reporter'])
  and status in ('draft','rejected')
 )
 with check (
  author_id=auth.uid()
  and public.has_staff_role(array['reporter'])
  and status in ('draft','in_review')
 );
create policy "editors manage article workflow" on public.articles
 for update to authenticated
 using (public.has_staff_role(array['editor','admin']))
 with check (public.has_staff_role(array['editor','admin']));
create policy "editors delete articles" on public.articles for delete to authenticated using (public.has_staff_role(array['admin']));
create policy "staff manage source records" on public.article_sources for all to authenticated using (public.has_staff_role(array['reporter','editor','admin'])) with check (public.has_staff_role(array['reporter','editor','admin']));
create policy "staff read corrections" on public.article_corrections for select to authenticated using (public.has_staff_role(array['editor','moderator','admin']));
create policy "editors add corrections" on public.article_corrections for insert to authenticated with check (editor_id=auth.uid() and public.has_staff_role(array['editor','admin']));
create policy "public read approved comments" on public.comments for select to anon,authenticated using (status='approved' or public.has_staff_role(array['moderator','editor','admin']));
create policy "public submit pending comments" on public.comments for insert to anon,authenticated with check (status='pending');
create policy "moderators review comments" on public.comments for update to authenticated using (public.has_staff_role(array['moderator','editor','admin'])) with check (public.has_staff_role(array['moderator','editor','admin']));
create policy "public read current opportunities" on public.opportunities for select to anon,authenticated using (status='published' and (deadline is null or deadline>=current_date));
create policy "staff manage opportunities" on public.opportunities for all to authenticated using (public.has_staff_role(array['reporter','editor','admin'])) with check (public.has_staff_role(array['reporter','editor','admin']));
create policy "public newsletter signup" on public.newsletter_subscribers for insert to anon,authenticated with check (confirmed_at is null);
create policy "staff read newsletter subscribers" on public.newsletter_subscribers for select to authenticated using (public.has_staff_role(array['admin','editor']));
create policy "staff update newsletter subscribers" on public.newsletter_subscribers for update to authenticated using (public.has_staff_role(array['admin','editor'])) with check (public.has_staff_role(array['admin','editor']));
create policy "admins delete newsletter subscribers" on public.newsletter_subscribers for delete to authenticated using (public.has_staff_role(array['admin']));
create policy "public submit ad enquiry" on public.advertising_enquiries for insert to anon,authenticated with check (status='new');
create policy "staff manage ad enquiries" on public.advertising_enquiries for select,update to authenticated using (public.has_staff_role(array['admin','editor'])) with check (public.has_staff_role(array['admin','editor']));

-- Automatically create a least-privilege reader profile for each new Auth user.
-- Keep editorial queue timestamps accurate after every article edit.
create or replace function public.set_article_updated_at()
returns trigger language plpgsql
as $$
begin
 new.updated_at = now();
 return new;
end;
$$;
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
 before update on public.articles
 for each row execute procedure public.set_article_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=public
as $ begin
 insert into public.profiles(id,display_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''),'reader') on conflict(id) do nothing;
 return new;
end; $;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_auth_user();

-- Create staff users through Supabase Auth invitations, then assign a role manually:
-- update public.profiles set role='admin', display_name='Newsroom Administrator' where id='<AUTH_USER_UUID>';
-- For each new Auth user, create their profile row explicitly as an admin.
