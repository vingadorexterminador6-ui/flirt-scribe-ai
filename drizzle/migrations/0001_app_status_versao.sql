alter table public.app_status add column if not exists versao integer not null default 1;
update public.app_status set versao = 1 where versao is null;