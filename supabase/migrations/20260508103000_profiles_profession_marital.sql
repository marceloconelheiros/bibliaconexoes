-- Perfil: profissão e estado civil

alter table public.profiles add column if not exists profissao text not null default '';

alter table public.profiles add column if not exists estado_civil text not null default 'prefiro_nao_informar';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_estado_civil_valid'
  ) then
    alter table public.profiles
      add constraint profiles_estado_civil_valid
      check (
        estado_civil in (
          'solteiro',
          'casado',
          'uniao_estavel',
          'divorciado',
          'viuvo',
          'prefiro_nao_informar'
        )
      );
  end if;
end $$;
