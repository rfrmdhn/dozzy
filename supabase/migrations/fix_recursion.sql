-- Helper function to check project membership without triggering RLS logic recursively
CREATE OR REPLACE FUNCTION is_project_member(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = _project_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Fix project_members policy to use the helper function
DROP POLICY IF EXISTS "Project members can view member list" ON project_members;
CREATE POLICY "Project members can view member list" ON project_members
  FOR SELECT USING (
    -- Admin in Org
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_members.project_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
    OR
    -- Member in Project (Using function to avoid recursion)
    is_project_member(project_id)
  );

-- Optimize Tasks Policy
DROP POLICY IF EXISTS "Task Access Policy" ON tasks;
CREATE POLICY "Task Access Policy" ON tasks
  FOR SELECT USING (
    -- 1. Org Admin (via Project)
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = tasks.project_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
    OR
    -- 2. Project Member
    is_project_member(project_id)
  );

-- Optimize Task Mutation Policies
DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
CREATE POLICY "Project members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
     EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('lead', 'member')
     )
     OR
     EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = tasks.project_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );
