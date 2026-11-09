-- 每条收藏只属于一位已登录用户；客户端使用公开密钥，权限由 RLS 强制执行。
create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  signature text not null check (length(signature) between 1 and 1024),
  ids text[] not null check (cardinality(ids) between 1 and 30),
  grams jsonb not null default '{}'::jsonb check (jsonb_typeof(grams) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, signature)
);

create index if not exists recipe_favorites_user_created_at_idx
  on public.recipe_favorites (user_id, created_at desc);

alter table public.recipe_favorites enable row level security;
revoke all on public.recipe_favorites from anon, authenticated;
grant select, insert, delete on public.recipe_favorites to authenticated;

create policy "Users read own favorites"
  on public.recipe_favorites for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add own favorites"
  on public.recipe_favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users delete own favorites"
  on public.recipe_favorites for delete to authenticated
  using ((select auth.uid()) = user_id);
