-- Add INSERT policy to allow users to join tenants
CREATE POLICY "Users can join tenants"
ON public.user_tenants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy to allow users to update their own tenant membership
CREATE POLICY "Users can update their own tenant membership"
ON public.user_tenants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy to allow users to leave tenants
CREATE POLICY "Users can leave tenants"
ON public.user_tenants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);