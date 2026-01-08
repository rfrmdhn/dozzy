-- ============================================
-- Dozzy Master Schema Migration
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. USERS & ORGANIZATIONS (Core Identity)
-- ============================================

-- Users Table (Mapping auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID, -- Primary/Last active org
  role TEXT CHECK (role IN ('admin','member','guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Organization Members (Global org access)
CREATE TABLE IF NOT EXISTS public.organization_members (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
   user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
   role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
   created_at TIMESTAMPTZ DEFAULT NOW(),
   UNIQUE(organization_id, user_id)
);

-- ============================================
-- 2. PROJECTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL, -- Optional link to team
  owner_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  start_date DATE,
  due_date DATE,
  icon TEXT,
  color TEXT,
  view_preferences JSONB DEFAULT '{}'::jsonb, -- Store view settings (list/board/etc)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Sections (for Board/List grouping)
CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TASKS SYSTEM (Work Graph)
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- Denormalized for RLS efficiency
  title TEXT NOT NULL,
  description JSONB, -- Rich text support
  status TEXT DEFAULT 'todo', -- Can be customizable later, but standard for now
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.users(id),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, -- For Subtasks
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-Project Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.project_tasks (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.project_sections(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, task_id)
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'blocking' CHECK (type IN ('blocking', 'waiting')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id) -- Prevent duplicate edges
);

-- ============================================
-- 4. CUSTOM FIELDS
-- ============================================

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'currency', 'percentage', 'enum', 'date', 'boolean', 'person')),
  config JSONB DEFAULT '{}'::jsonb, -- Store select options, formatting rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Values for custom fields (Entity-Attribute-Value pattern)
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('task', 'project')),
  entity_id UUID NOT NULL, -- Logical reference
  value JSONB, -- Store the actual value (flexible)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(custom_field_id, entity_id)
);

-- ============================================
-- 5. SOCIAL & ACTIVITY
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content JSONB NOT NULL, -- Rich text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity/Audit Log
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  entity_type TEXT NOT NULL, -- task, project, comment, etc
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- create, update, delete
  metadata JSONB, -- Previous value, New value, changes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task ON public.project_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);


-- ============================================
-- 7. TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orgs_modtime BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Sync (Auth -> Public)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 8. RLS POLICIES (Strict Hierarchy)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check Org Membership
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users
CREATE POLICY "Users can view self" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update self" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view colleagues" ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_members colleagues
    WHERE colleagues.user_id = users.id
    AND colleagues.organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  )
);

-- Organizations
CREATE POLICY "View own orgs" ON public.organizations FOR SELECT USING (
  is_org_member(id)
);
CREATE POLICY "Create orgs" ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Only admin updates
CREATE POLICY "Admin update org" ON public.organizations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Projects
CREATE POLICY "View projects in my org" ON public.projects FOR SELECT USING (
  is_org_member(organization_id)
);
-- TODO: Refine for private projects/teams

-- Tasks
CREATE POLICY "View tasks in my org" ON public.tasks FOR SELECT USING (
  is_org_member(organization_id)
);

CREATE POLICY "Create tasks in my org" ON public.tasks FOR INSERT WITH CHECK (
  is_org_member(organization_id)
);

CREATE POLICY "Update tasks in my org" ON public.tasks FOR UPDATE USING (
  is_org_member(organization_id)
);

-- Activity Logs
CREATE POLICY "View relevant activity" ON public.activity_logs FOR SELECT USING (
   is_org_member(organization_id)
);

-- ============================================
-- 9. RPCs for Application Logic
-- ============================================

-- Create a workspace/org with initial data
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  owner_id UUID
) RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create Org
  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_name, owner_id)
  RETURNING id INTO new_org_id;

  -- Add Owner as Admin
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, owner_id, 'admin');

  -- Create 'General' Team
  INSERT INTO public.teams (organization_id, name, privacy)
  VALUES (new_org_id, 'General', 'public');

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
