-- Fixes the admin dashboard's approve/reject buttons, which were
-- silently failing because there was no UPDATE policy for the anon role.
-- Run this once in Supabase SQL Editor.

create policy "Admin dashboard can update status"
  on members
  for update
  to anon
  using (true)
  with check (true);
