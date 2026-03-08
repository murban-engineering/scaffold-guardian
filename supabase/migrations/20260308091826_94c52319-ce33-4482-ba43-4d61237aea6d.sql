-- Add missing tables to realtime publication for full cross-user sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;