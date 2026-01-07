-- Create Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Project Members RLS
-- 1. Org Admins can manage all project members
-- 2. Project Leads can manage members of their project
-- 3. Members can view other members in same project
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
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Trigger to auto-add creator
CREATE OR REPLACE FUNCTION handle_new_project_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'lead');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_project_member();

-- Helper function for Project Access Check (Recursion safe)
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


-- ==========================================
-- UPDATE RLS POLICIES
-- ==========================================

-- PROJECTS
DROP POLICY IF EXISTS "Org members can view projects" ON projects;
DROP POLICY IF EXISTS "Project Access Policy" ON projects; -- Clean up if exists

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

-- TASKS
DROP POLICY IF EXISTS "Org members can view tasks" ON tasks;
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
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Also update INSERT/UPDATE/DELETE for Tasks to require Project Membership (or Admin)
DROP POLICY IF EXISTS "Users can manage tasks in their projects" ON tasks; -- Old policy

CREATE POLICY "Project members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
     -- Project Member (any role) OR Org Admin
     EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
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

CREATE POLICY "Project members can update tasks" ON tasks
  FOR UPDATE USING (
     -- Project Member OR Org Admin
     EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
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
