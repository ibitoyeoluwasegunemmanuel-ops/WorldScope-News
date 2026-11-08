alter table public.articles add column if not exists is_featured boolean not null default false;
create or replace function public.enforce_article_editorial_workflow()
returns trigger language plpgsql security definer set search_path=public
as $$
declare staff_role text;
begin
 staff_role := public.current_staff_role();
 if staff_role is null then raise exception 'An authorised newsroom account is required'; end if;
 if staff_role not in ('admin','editor') then
  if tg_op='INSERT' then
   if new.author_id<>auth.uid() then raise exception 'Reporters may only create reports under their own account'; end if;
   if new.status not in ('draft','in_review') then raise exception 'Only an editor can approve or publish a report'; end if;
   new.published_at:=null; new.is_featured:=false;
  else
   if old.author_id<>auth.uid() or old.status not in ('draft','rejected') then raise exception 'You may only edit your own draft or rejected report'; end if;
   if new.author_id is distinct from old.author_id or new.status not in ('draft','in_review') or new.published_at is distinct from old.published_at or new.is_featured is distinct from old.is_featured then raise exception 'Only an editor can change approval, publication or homepage placement'; end if;
  end if;
 else
  if new.status='published' then new.published_at:=coalesce(new.published_at,now()); else new.published_at:=null; new.is_featured:=false; end if;
 end if;
 new.updated_at:=now(); return new;
end; $$;
drop trigger if exists articles_enforce_editorial_workflow on public.articles;
create trigger articles_enforce_editorial_workflow before insert or update on public.articles for each row execute function public.enforce_article_editorial_workflow();
comment on column public.articles.is_featured is 'Homepage lead story placement, controlled by editors/admins only';