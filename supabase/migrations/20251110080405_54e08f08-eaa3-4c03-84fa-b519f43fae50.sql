-- Gate-G: Documents Hub v1 - Part 2.3 (Hotfix)
-- Enable RLS on documentation table

-- Enable RLS on the documentation table (read-only, no policies needed)
ALTER TABLE public._gate_g_rls_intentions ENABLE ROW LEVEL SECURITY;

-- Add a permissive SELECT policy for documentation purposes
CREATE POLICY "Documentation table is readable by all authenticated users"
ON public._gate_g_rls_intentions
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Documentation table is readable by all authenticated users" 
ON public._gate_g_rls_intentions IS 
'Allows all authenticated users to read RLS policy intentions for documentation purposes. This table contains no sensitive data, only policy documentation.';