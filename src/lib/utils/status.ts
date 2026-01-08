import type { Database } from '../../types/supabase';

type TaskPriority = Database['public']['Tables']['tasks']['Row']['priority'];
type TaskStatus = string | null;
type ProjectStatus = Database['public']['Tables']['projects']['Row']['status'];

/**
 * Get CSS class for task status badge
 */
export function getStatusBadgeClass(status: TaskStatus): string {
    switch (status) {
        case 'todo':
            return 'badge-todo';
        case 'in_progress':
            return 'badge-in-progress';
        case 'done':
            return 'badge-done';
        default:
            return '';
    }
}

/**
 * Get display label for task status
 */
export function getStatusLabel(status: TaskStatus): string {
    switch (status) {
        case 'todo':
            return 'To Do';
        case 'in_progress':
            return 'In Progress';
        case 'done':
            return 'Done';
        default:
            return status || 'Unknown';
    }
}

/**
 * Get color for task priority
 */
export function getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
        case 'urgent':
            return 'var(--color-error)';
        case 'high':
            return 'var(--color-error)';
        case 'medium':
            return 'var(--color-warning)';
        case 'low':
            return 'var(--color-success)';
        default:
            return 'var(--color-gray-400)';
    }
}

/**
 * Get CSS class for priority badge
 */
export function getPriorityBadgeClass(priority: TaskPriority): string {
    switch (priority) {
        case 'urgent':
        case 'high':
            return 'badge-high';
        case 'medium':
            return 'badge-medium';
        case 'low':
            return 'badge-low';
        default:
            return 'badge-neutral';
    }
}

/**
 * Get display label for priority
 */
export function getPriorityLabel(priority: TaskPriority): string {
    if (!priority) return 'None';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Get badge configuration for project status
 */
export function getProjectStatusBadge(status: ProjectStatus): { variant: string; label: string } {
    const config: Record<NonNullable<ProjectStatus>, { variant: string; label: string }> = {
        active: { variant: 'active', label: 'Active' },
        completed: { variant: 'done', label: 'Completed' },
        on_hold: { variant: 'warning', label: 'On Hold' },
        archived: { variant: 'neutral', label: 'Archived' },
    };

    return (status && config[status]) || { variant: 'draft', label: status || 'Draft' };
}

/**
 * Get color for progress bar based on percentage
 */
export function getProgressColor(progress: number): string {
    if (progress >= 70) return 'var(--color-primary-500)';
    if (progress >= 40) return 'var(--color-purple-500, #8b5cf6)';
    return 'var(--color-warning, #f97316)';
}

/**
 * Status options for dropdowns
 */
export const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
] as const;

/**
 * Priority options for dropdowns
 */
export const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
] as const;

/**
 * Project status options for dropdowns
 */
export const PROJECT_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
] as const;

/**
 * Get initials from a full name
 */
export function getInitials(name: string): string {
    if (!name) return '';
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

