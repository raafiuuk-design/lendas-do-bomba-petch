-- Server-only tables. Browser clients register through the Edge Function.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create table if not exists public.bomba_push_config (
 id integer primary key check(id=1), public_key text not null,
 private_key text not null, send_token text not null, live_hash text,
 checked_at timestamptz, last_sent_at timestamptz
);
create table if not exists public.bomba_push_subscriptions (
 endpoint text primary key, subscription jsonb not null,
 capability uuid not null, created_at timestamptz not null default now(), last_hash text
);
alter table public.bomba_push_config enable row level security;
alter table public.bomba_push_subscriptions enable row level security;
revoke all on public.bomba_push_config, public.bomba_push_subscriptions from public, anon, authenticated;
grant all on public.bomba_push_config, public.bomba_push_subscriptions to service_role;
-- Before scheduling: provision one persistent VAPID key pair and random send_token
-- into bomba_push_config (id=1) through a trusted administrative connection.
-- Never commit the private key or send token.
select cron.schedule('bomba-app-push-updates','*/5 * * * *',$job$
 select net.http_post(
  url := 'https://vgurvbdbpxcgkhmunlxr.supabase.co/functions/v1/bomba-app-push?action=check',
  headers := jsonb_build_object('Content-Type','application/json','x-bomba-token',
    (select send_token from public.bomba_push_config where id=1)),
  body := '{}'::jsonb, timeout_milliseconds := 60000
 );
$job$);
