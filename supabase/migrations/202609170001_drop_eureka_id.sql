-- Participants are no longer asked for a Eureka ID, so the stored values and
-- the index that looked them up are removed.
drop index if exists public.profiles_eureka_id_lookup;

update public.profiles
set data = data - 'eurekaId'
where data ? 'eurekaId';
