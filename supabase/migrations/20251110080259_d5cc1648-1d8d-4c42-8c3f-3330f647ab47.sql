-- Gate-G: Documents Hub v1 - Part 2.3 (Fix)
-- Enable RLS on documentation table

-- Enable RLS on the documentation table (even though it's for internal use only)
ALTER TABLE public._gate_g_rls_intentions ENABLE ROW LEVEL SECURITY;

-- Add a simple policy so admins can view the documentation
CREATE POLICY "Admins can view RLS intentions"
ON public._gate_g_rls_intentions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

COMMENT ON POLICY "Admins can view RLS intentions" ON public._gate_g_rls_intentions IS
'Allows system admins to view the RLS policy documentation table for implementation reference.';