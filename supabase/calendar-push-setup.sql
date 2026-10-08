create table public.bomba_calendar_reminders (reminder_date date primary key,note text not null check (length(note) between 1 and 3000));
alter table public.bomba_calendar_reminders enable row level security;
grant select,insert,update,delete on public.bomba_calendar_reminders to anon,authenticated,service_role;
create policy calendar_public_read on public.bomba_calendar_reminders for select to anon,authenticated using(true);
create policy calendar_public_insert on public.bomba_calendar_reminders for insert to anon,authenticated with check(true);
create policy calendar_public_update on public.bomba_calendar_reminders for update to anon,authenticated using(true) with check(true);
create policy calendar_public_delete on public.bomba_calendar_reminders for delete to anon,authenticated using(true);
alter table public.bomba_push_config add column calendar_hash text;
alter table public.bomba_push_subscriptions add column last_error text;