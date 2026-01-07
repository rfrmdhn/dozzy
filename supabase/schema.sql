-- ============================================
-- Dozzy Database Schema (Idempotent)
-- ============================================
-- This script is safe to run multiple times.
-- Run this in your Supabase SQL Editor.

-- ============================================
-- Users Table (Public Profile)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Organizations Table
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remove legacy user_id column if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'user_id') THEN
    ALTER TABLE organizations DROP COLUMN user_id;
  END IF;
END $$;

-- ============================================
-- Organization Members Table (RBAC Junction)
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('active', 'in_progress', 'completed', 'on_hold', 'archived')),
  type VARCHAR(50) DEFAULT 'software',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  labels TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  type VARCHAR(50) DEFAULT 'task',
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Time Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop ALL existing policies (clean slate)
-- ============================================
-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Public can lookup by username" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- Organizations
DROP POLICY IF EXISTS "Users can manage own organizations" ON organizations;
DROP POLICY IF EXISTS "Any user can create organizations" ON organizations;
DROP POLICY IF EXISTS "Org members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Admin/Editor can update organizations" ON organizations;
DROP POLICY IF EXISTS "Only admin can delete organizations" ON organizations;
-- Organization Members
DROP POLICY IF EXISTS "Org members can view member list" ON organization_members;
DROP POLICY IF EXISTS "Admin/Editor can add members" ON organization_members;
DROP POLICY IF EXISTS "Admin/Editor can remove members" ON organization_members;
DROP POLICY IF EXISTS "Only admin can update roles" ON organization_members;
-- Projects
DROP POLICY IF EXISTS "Users can manage projects in their orgs" ON projects;
DROP POLICY IF EXISTS "Org members can view projects" ON projects;
DROP POLICY IF EXISTS "Admin/Editor can manage projects" ON projects;
DROP POLICY IF EXISTS "Admin/Editor can insert projects" ON projects;
DROP POLICY IF EXISTS "Admin/Editor can update projects" ON projects;
DROP POLICY IF EXISTS "Admin/Editor can delete projects" ON projects;
-- Tasks
DROP POLICY IF EXISTS "Users can manage tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Org members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can update tasks" ON tasks;
DROP POLICY IF EXISTS "Viewer can update task status" ON tasks;
DROP POLICY IF EXISTS "Admin/Editor can delete tasks" ON tasks;
-- Time Logs
DROP POLICY IF EXISTS "Users can manage time logs for their tasks" ON time_logs;
DROP POLICY IF EXISTS "Org members can view time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can manage time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can insert time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can update time logs" ON time_logs;
DROP POLICY IF EXISTS "Admin/Editor can delete time logs" ON time_logs;

-- ============================================
-- Users RLS Policies
-- ============================================
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public can lookup by username" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- Organization Members RLS Policies
-- ============================================
-- Allow users to view their own membership directly
-- Also allow viewing other members if they belong to the same organization
-- Helper function to avoid recursion in RLS
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN ARRAY(
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Allow users to view their own membership directly
-- Also allow viewing other members if they belong to the same organization
CREATE POLICY "Org members can view member list" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    organization_id = ANY(get_user_org_ids())
  );

CREATE POLICY "Admin/Editor can add members" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'editor')
    )
    OR NOT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
    )
  );

CREATE POLICY "Admin/Editor can remove members" ON organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.role = 'admin' OR (om.role = 'editor' AND organization_members.role != 'admin'))
    )
  );

CREATE POLICY "Only admin can update roles" ON organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- ============================================
-- Organizations RLS Policies
-- ============================================
CREATE POLICY "Any user can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Org members can view organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin/Editor can update organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Only admin can delete organizations" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- ============================================
-- Projects RLS Policies
-- ============================================
-- ============================================
-- Project Members Table
-- ============================================
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- Projects RLS Policies
-- ============================================
DROP POLICY IF EXISTS "Org members can view projects" ON projects;

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

CREATE POLICY "Admin/Editor can insert projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor can delete projects" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = projects.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'editor')
    )
  );

-- ============================================
-- Tasks RLS Policies
-- ============================================
CREATE POLICY "Org members can view tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = tasks.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin/Editor can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = tasks.project_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = tasks.project_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'editor')
    )
  );

-- Viewer can only update task status (handled at application level)
-- RLS allows update if user is member, field restriction in app
CREATE POLICY "Viewer can update task status" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = tasks.project_id AND om.user_id = auth.uid() AND om.role = 'viewer'
    )
  );

CREATE POLICY "Admin/Editor can delete tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = tasks.project_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'editor')
    )
  );

-- ============================================
-- Time Logs RLS Policies
-- ============================================
CREATE POLICY "Org members can view time logs" ON time_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE t.id = time_logs.task_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin/Editor can insert time logs" ON time_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE t.id = time_logs.task_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor can update time logs" ON time_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE t.id = time_logs.task_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin/Editor can delete time logs" ON time_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE t.id = time_logs.task_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'editor')
    )
  );

-- ============================================
-- Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_org_members_updated_at ON organization_members;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Trigger: Auto-add org creator as admin
-- ============================================
CREATE OR REPLACE FUNCTION add_org_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role, invited_by)
  VALUES (NEW.id, auth.uid(), 'admin', auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION add_org_creator_as_admin();

-- ============================================
-- User Sync Trigger (Auth -> Public)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
