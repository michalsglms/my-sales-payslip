CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
BEGIN
  -- Bootstrap allowance: if no admins exist yet, allow first role insert
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';

  IF admin_count = 0 AND TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Otherwise require the caller to already be an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can modify user roles';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_changes_insert ON public.user_roles;
DROP TRIGGER IF EXISTS enforce_role_changes_update ON public.user_roles;
DROP TRIGGER IF EXISTS enforce_role_changes_delete ON public.user_roles;

CREATE TRIGGER enforce_role_changes_insert
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_changes();

CREATE TRIGGER enforce_role_changes_update
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_changes();

CREATE TRIGGER enforce_role_changes_delete
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_changes();