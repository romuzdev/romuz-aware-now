
-- Force recreate trigger for updated_at column
DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles CASCADE;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

-- Verify trigger creation
SELECT 
  tgname,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'public.user_roles'::regclass;
