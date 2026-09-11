-- Run this once in the Supabase SQL editor.
-- Replace the reset code before running this script and keep it private.

create table if not exists public.launch_state (
  id integer primary key check (id = 1),
  clicks integer not null default 0 check (clicks between 0 and 1000)
);

insert into public.launch_state (id, clicks)
values (1, 0)
on conflict (id) do nothing;

create table if not exists public.launch_admin (
  id boolean primary key default true check (id = true),
  reset_code text not null
);

insert into public.launch_admin (id, reset_code)
values (true, 'REPLACE_WITH_A_PRIVATE_RESET_CODE')
on conflict (id) do nothing;

alter table public.launch_state enable row level security;
alter table public.launch_admin enable row level security;

drop policy if exists "Anyone can read launch state" on public.launch_state;
create policy "Anyone can read launch state"
on public.launch_state for select
to anon, authenticated
using (true);

create or replace function public.increment_clicks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_clicks integer;
begin
  update public.launch_state
  set clicks = least(clicks + 1, 1000)
  where id = 1
  returning clicks into next_clicks;
  return next_clicks;
end;
$$;

grant execute on function public.increment_clicks() to anon, authenticated;

create or replace function public.reset_launch(reset_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if reset_code is null or reset_code <> (select launch_admin.reset_code from public.launch_admin where id = true) then
    raise exception 'Invalid reset code';
  end if;

  update public.launch_state set clicks = 0 where id = 1;
  return true;
end;
$$;

grant execute on function public.reset_launch(text) to anon, authenticated;

alter publication supabase_realtime add table public.launch_state;
