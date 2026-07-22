-- Allow the trusted server-side Telegram auth function to create and update
-- the matching application profile. RLS bypass alone does not grant table privileges.
grant select, insert, update
on table public.users
to service_role;
