-- Perfis públicos (1:1 com auth.users) + bucket de fotos
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  cidade text not null default '',
  whatsapp text not null default '',
  birth_date date,
  email text,
  avatar_url text,
  faith_tradition text not null default 'prefiro_nao_informar',
  faith_detail text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.profiles is 'Dados do usuário após cadastro; preenchido via trigger a partir do user_metadata do Auth.';

create index profiles_faith_tradition_idx on public.profiles (faith_tradition);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  bd text := nullif(trim(meta ->> 'birth_date'), '');
begin
  insert into public.profiles (
    id,
    nome,
    cidade,
    whatsapp,
    birth_date,
    email,
    faith_tradition,
    faith_detail
  )
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'nome'), ''), 'Usuário'),
    coalesce(nullif(trim(meta ->> 'cidade'), ''), '—'),
    coalesce(nullif(trim(meta ->> 'whatsapp'), ''), '—'),
    case when bd is not null and bd ~ '^\d{4}-\d{2}-\d{2}$' then bd::date else null end,
    new.email,
    coalesce(nullif(trim(meta ->> 'faith_tradition'), ''), 'prefiro_nao_informar'),
    nullif(trim(meta ->> 'faith_detail'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Bucket de avatares (público para leitura)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
