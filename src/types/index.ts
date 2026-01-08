import type { Database } from './supabase';

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

// Extracted Enums/Unions
export type TaskPriority = Task['priority'];
export type TaskStatus = Task['status'];
export type CustomFieldType = CustomField['type'];
export type ProjectStatus = Project['status'];

// Combined types for UI
export type TaskWithSection = Task & {
    section_id: string | null;
    order_index: number | null;
    labels?: string[]; // Legacy UI compatibility
    custom_field_values?: Record<string, any>;
};

// Form Input Types
export type TaskInput = Database['public']['Tables']['tasks']['Insert'];
export type ProjectInput = Database['public']['Tables']['projects']['Insert'];
export type OrganizationInput = Database['public']['Tables']['organizations']['Insert'];

// Time Log Types (not in new schema, but for legacy hooks)
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

// Report Types
export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

// Project Members (legacy, for hooks)
export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    role: string;
    created_at: string;
}

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

// Re-export Database for convenience
export type { Database };
