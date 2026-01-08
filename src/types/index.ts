import type { Database } from './supabase';

// ============================================
// Base Types from Database Schema
// ============================================

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type ProjectTask = Database['public']['Tables']['project_tasks']['Row'];
export type ProjectSection = Database['public']['Tables']['project_sections']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type CustomField = Database['public']['Tables']['custom_fields']['Row'];
export type CustomFieldValue = Database['public']['Tables']['custom_field_values']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

// ============================================
// Extracted Enums/Unions
// ============================================

export type TaskPriority = Task['priority'];
export type TaskStatus = Task['status'];
export type CustomFieldType = CustomField['type'];
export type ProjectStatus = Project['status'];
export type UserRole = User['role'];

// ============================================
// Extended Types for UI
// ============================================

/**
 * Task with section info from project_tasks junction table
 * Used for task lists within a project context
 */
export interface TaskWithSection extends Task {
    section_id: string | null;
    order_index: number;
    custom_field_values?: Record<string, unknown>;
}

/**
 * Project with organization info
 * Used when displaying projects with their parent org
 */
export interface ProjectWithOrg extends Project {
    organization?: {
        id: string;
        name: string;
    } | null;
}

/**
 * Task with project reference
 * Used for cross-project task views
 */
export interface TaskWithProject extends Task {
    project?: {
        id: string;
        name: string;
    } | null;
}

/**
 * Comment with user info
 * Used for rendering comment lists
 */
export interface CommentWithUser extends Comment {
    user?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

/**
 * Activity log with user info
 */
export interface ActivityLogWithUser extends ActivityLog {
    user?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

// ============================================
// Form Input Types
// ============================================

export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

// ============================================
// Form Data Types (for controlled forms)
// ============================================

export interface TaskFormData {
    title: string;
    description: string;
    status: string;
    priority: TaskPriority;
    due_date: string;
    custom_field_values?: Record<string, unknown>;
}

export interface ProjectFormData {
    name: string;
    description: string;
    start_date: string | null;
    due_date: string | null;
    status: ProjectStatus;
    organization_id: string;
}

export interface OrganizationFormData {
    name: string;
    description: string;
}

// ============================================
// Time Log Types
// ============================================

export interface TimeLog {
    id: string;
    task_id: string;
    user_id: string;
    start_time: string;
    end_time?: string;
    duration: number;
    note?: string;
    created_at: string;
}

export interface TimeLogInput {
    task_id: string;
    start_time: string;
    end_time?: string;
    duration?: number;
    note?: string;
}

// ============================================
// Report Types
// ============================================

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

// ============================================
// Project Members
// ============================================

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    role: ProjectRole;
    created_at: string;
}

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

// ============================================
// Agenda/Dashboard Types
// ============================================

export interface AgendaTask {
    id: string;
    title: string;
    status: string | null;
    priority: TaskPriority;
    project_name?: string;
    due_date?: string;
    due_time?: string;
    type: 'design' | 'meeting' | 'admin' | 'task';
}

export interface ActiveProject {
    id: string;
    name: string;
    org_id: string;
    org_name: string;
    progress: number;
    due_date?: string | null;
}

export interface DashboardStats {
    totalTime: number;
    activeOrgs: number;
    pendingTasks: number;
    highPriorityCount: number;
    weeklyChange: number;
}

// ============================================
// Re-export Database type
// ============================================

export type { Database };
