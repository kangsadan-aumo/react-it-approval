-- We need to add an RLS policy that allows Admins to update other users' records in the `users` table.
-- Currently, `CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (auth.uid() = id);`
-- only lets a person update their own row.
-- Let's add a policy for Admins.

CREATE POLICY "Admins can update all users" 
ON public.users 
FOR UPDATE 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
