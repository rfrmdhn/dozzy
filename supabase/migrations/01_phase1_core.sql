-- Migration: 01_phase1_core
-- Description: Adds support for Issue Types, Sub-tasks, Assignees, and Project Types.

-- 1. Create ENUMs
CREATE TYPE task_type AS ENUM ('task', 'bug');
CREATE TYPE project_type AS ENUM ('kanban', 'list');

-- 2. Update Projects Table
ALTER TABLE projects 
ADD COLUMN type project_type NOT NULL DEFAULT 'kanban';

-- 3. Update Tasks Table
ALTER TABLE tasks
ADD COLUMN type task_type NOT NULL DEFAULT 'task',
ADD COLUMN parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
ADD COLUMN assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Create Indexes for Performance
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_type ON tasks(type);
