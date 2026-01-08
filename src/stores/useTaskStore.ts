import { create } from 'zustand';
import { taskRepository, type TaskWithSection } from '../lib/repositories';
import type { Database } from '../types/supabase';

type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

interface TaskState {
    tasks: TaskWithSection[];
    isLoading: boolean;
    error: Error | null;

    // Actions
    fetchProjectTasks: (projectId: string) => Promise<void>;
    createTask: (
        task: Partial<TaskInsert>,
        projectId: string,
        sectionId?: string,
        customFieldValues?: Record<string, unknown>
    ) => Promise<boolean>;
    updateTask: (
        taskId: string,
        updates: Partial<TaskUpdate>,
        customFieldValues?: Record<string, unknown>
    ) => Promise<boolean>;
    deleteTask: (taskId: string, projectId: string) => Promise<boolean>;
    moveTask: (
        taskId: string,
        projectId: string,
        newSectionId: string | null,
        newIndex: number
    ) => Promise<boolean>;
    clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    fetchProjectTasks: async (projectId) => {
        set({ isLoading: true, error: null });

        const { tasks, error } = await taskRepository.fetchByProject(projectId);

        if (error) {
            set({ isLoading: false, error });
            console.error('Error fetching tasks:', error);
            return;
        }

        set({ tasks, isLoading: false });
    },

    createTask: async (task, projectId, sectionId, customFieldValues) => {
        const taskInsert: TaskInsert = {
            title: task.title || 'Untitled Task',
            organization_id: task.organization_id,
            description: task.description,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            due_date: task.due_date,
            assignee_id: task.assignee_id,
            author_id: task.author_id,
            tags: task.tags,
        };

        const { data, error } = await taskRepository.create(
            taskInsert,
            projectId,
            sectionId,
            customFieldValues
        );

        if (error) {
            set({ error });
            console.error('Error creating task:', error);
            return false;
        }

        // Refresh tasks list
        if (data) {
            await get().fetchProjectTasks(projectId);
        }

        return true;
    },

    updateTask: async (taskId, updates, customFieldValues) => {
        // Optimistic update
        const currentTasks = get().tasks;
        const updatedTasks = currentTasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
        );
        set({ tasks: updatedTasks });

        const { error } = await taskRepository.update(taskId, updates, customFieldValues);

        if (error) {
            // Revert on error
            set({ tasks: currentTasks, error });
            console.error('Error updating task:', error);
            return false;
        }

        return true;
    },

    deleteTask: async (taskId, projectId) => {
        // Optimistic update
        const currentTasks = get().tasks;
        set({ tasks: currentTasks.filter((t) => t.id !== taskId) });

        const { success, error } = await taskRepository.delete(taskId);

        if (error || !success) {
            // Revert on error
            set({ tasks: currentTasks, error });
            console.error('Error deleting task:', error);
            return false;
        }

        // Optionally refresh to ensure consistency
        await get().fetchProjectTasks(projectId);
        return true;
    },

    moveTask: async (taskId, projectId, newSectionId, newIndex) => {
        const { success, error } = await taskRepository.move(
            taskId,
            projectId,
            newSectionId,
            newIndex
        );

        if (error || !success) {
            set({ error });
            console.error('Error moving task:', error);
            return false;
        }

        // Refresh to get new order
        await get().fetchProjectTasks(projectId);
        return true;
    },

    clearError: () => set({ error: null }),
}));

// Re-export type for convenience
export type { TaskWithSection };
