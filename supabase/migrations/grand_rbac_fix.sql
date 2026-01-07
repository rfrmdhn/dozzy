-- ==============================================================================
-- GRAND RBAC FIX
-- Consolidates all Project-Level RBAC logic and fixes duplicate/legacy policies.
-- ==============================================================================

-- 1. HELPER FUNCTIONS (SECURITY DEFINER to avoid recursion)
-- =========================================================

CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN ARRAY(
    SELECT project_id
    FROM project_members
    WHERE user_id = auth.uid()
  );
END;
$$;

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

-- 2. PROJECTS TABLE RLS
-- =========================================================
DROP POLICY IF EXISTS "Org members can view projects" ON projects;
DROP POLICY IF EXISTS "Project Access Policy" ON projects;

CREATE POLICY "Project Access Policy" ON projects
  FOR SELECT USING (
    -- 1. Org Admin
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
    OR
    -- 2. Project Member
    id = ANY(get_user_project_ids())
  );

-- 3. PROJECT MEMBERS TABLE RLS
-- =========================================================
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
    -- Member in Project
    is_project_member(project_id)
  );

-- 4. TASKS TABLE RLS
-- =========================================================
DROP POLICY IF EXISTS "Org members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Task Access Policy" ON tasks;
DROP POLICY IF EXISTS "Users can manage tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Viewer can update task status" ON tasks;

-- Unified SELECT Policy
CREATE POLICY "Task View Policy" ON tasks
  FOR SELECT USING (
    -- Org Admin
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = tasks.project_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
    OR
    -- Project Member
    is_project_member(project_id)
  );

-- Unified INSERT Policy
CREATE POLICY "Task Insert Policy" ON tasks
  FOR INSERT WITH CHECK (
     -- Member (Lead/Member only? or all? Let's say all members for now, or stick to Lead/Member as per standard)
     -- Let's allow all members to create tasks for flexibility, or check exact role if needed.
     -- Implementation plan said: "Project members can view tasks".
     -- User requirement: "Project members".
     -- Safe bet: All members.
     is_project_member(project_id)
     OR
     -- Org Admin
     EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = tasks.project_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Unified UPDATE Policy
CREATE POLICY "Task Update Policy" ON tasks
  FOR UPDATE USING (
    is_project_member(project_id)
    OR
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = tasks.project_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Unified DELETE Policy
CREATE POLICY "Task Delete Policy" ON tasks
  FOR DELETE USING (
     -- Only Lead or Admin?
     -- Let's stick to: Project Member (Lead) OR Org Admin
     -- Checking role in project_members
     EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'lead'
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


-- 5. TIME LOGS TABLE RLS
-- =========================================================
DROP POLICY IF EXISTS "Org members can view time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can insert time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can update time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can delete time logs" ON time_logs;

-- View Policy
CREATE POLICY "TimeLog View Policy" ON time_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = time_logs.task_id
      AND (
         is_project_member(t.project_id)
         OR
         EXISTS (
           SELECT 1 FROM projects p
           JOIN organization_members om ON p.organization_id = om.organization_id
           WHERE p.id = t.project_id
           AND om.user_id = auth.uid()
           AND om.role = 'admin'
         )
      )
    )
  );

-- Insert Policy
CREATE POLICY "TimeLog Insert Policy" ON time_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = time_logs.task_id
      AND (
         is_project_member(t.project_id)
         OR
         EXISTS (
           SELECT 1 FROM projects p
           JOIN organization_members om ON p.organization_id = om.organization_id
           WHERE p.id = t.project_id
           AND om.user_id = auth.uid()
           AND om.role = 'admin'
         )
      )
    )
  );

-- Update Policy
CREATE POLICY "TimeLog Update Policy" ON time_logs
  FOR UPDATE USING (
    -- Only own logs or Admin/Lead?
    -- Usually users update their own logs.
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE t.id = time_logs.task_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Delete Policy
CREATE POLICY "TimeLog Delete Policy" ON time_logs
  FOR DELETE USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE t.id = time_logs.task_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );
