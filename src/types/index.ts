// Dozzy - Type Definitions

// ============================================
// Database Entity Types
// ============================================

export interface User {
    id: string;
    email: string;
    username?: string;
    created_at: string;
    updated_at: string;
}

export interface Organization {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    labels: string[];
    due_date: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface TimeLog {
    id: string;
    task_id: string;
    start_time: string;
    end_time: string | null;
    duration: number | null; // in minutes
    notes: string | null;
    created_at: string;
}

// ============================================
// Form/Input Types
// ============================================

export interface OrganizationInput {
    name: string;
    description?: string;
}

export interface ProjectInput {
    organization_id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
}

export interface TaskInput {
    project_id: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    labels?: string[];
    due_date?: string;
}

export interface TimeLogInput {
    task_id: string;
    start_time: string;
    end_time?: string;
    duration?: number;
    notes?: string;
}

// ============================================
// Report Types
// ============================================

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface ReportFilter {
    organization_id?: string;
    project_id?: string;
    period: ReportPeriod;
    start_date: string;
    end_date: string;
}

export interface ReportSummary {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    total_time_minutes: number;
    tasks_by_project: {
        project_id: string;
        project_name: string;
        task_count: number;
        completed_count: number;
        time_minutes: number;
    }[];
}

// ============================================
// UI State Types
// ============================================

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface AppNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: string;
}
