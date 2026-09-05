create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.app_status (
  id boolean primary key default true check (id),
  ativo boolean not null default true,
  mensagem text not null default 'Estamos em atualização. Voltamos já!',
  updated_at timestamptz not null default now()
);
grant select on public.app_status to anon, authenticated;
grant update on public.app_status to authenticated;
grant all on public.app_status to service_role;
alter table public.app_status enable row level security;
create policy "Anyone can read app status" on public.app_status for select to anon, authenticated using (true);
create policy "Admins can update app status" on public.app_status for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.app_status (id) values (true);

-- primeiro utilizador registado torna-se administrador
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users order by created_at asc limit 1
on conflict do nothing;