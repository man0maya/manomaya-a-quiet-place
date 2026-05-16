-- Restore EXECUTE permissions on security helper functions
-- These were previously revoked, which broke RLS policies that rely on them
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Also ensure public can execute the reflections helper
GRANT EXECUTE ON FUNCTION public.get_public_reflections(int) TO anon, authenticated;
