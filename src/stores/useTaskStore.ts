import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

// Helper types
type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

// Standardized structure for UI
export type TaskWithSection = Task & {
    section_id: string | null;
    order_index: number;
    custom_field_values?: Record<string, any>; // Map fieldId -> value
};

interface TaskState {
    tasks: TaskWithSection[];
    isLoading: boolean;

    fetchProjectTasks: (projectId: string) => Promise<void>;
    createTask: (
        task: Partial<TaskInsert>,
        projectId: string,
        sectionId?: string,
        customFieldValues?: Record<string, any>
    ) => Promise<void>;
    updateTask: (
        taskId: string,
        updates: Partial<Task>,
        customFieldValues?: Record<string, any>
    ) => Promise<void>;
    moveTask: (taskId: string, projectId: string, newSectionId: string | null, newIndex: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,

    fetchProjectTasks: async (projectId) => {
        set({ isLoading: true });
        try {
            // Join tasks with project info
            // TODO: Also fetch custom_field_values? specific to this project's org
            const { data, error } = await supabase
                .from('project_tasks')
                .select(`
                    section_id,
                    order_index,
                    task:tasks (*)
                `)
                .eq('project_id', projectId);

            if (error) throw error;

            // TODO: Fetch all custom field values for these lists of tasks to display in grid? 
            // For now, simple mapping
            const formattedTasks: TaskWithSection[] = (data || []).map((item: any) => ({
                ...item.task,
                section_id: item.section_id,
                order_index: item.order_index,
                custom_field_values: {} // Placeholder until we fetch them
            }));

            set({ tasks: formattedTasks, isLoading: false });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            set({ isLoading: false });
        }
    },

    createTask: async (task, projectId, sectionId, customFieldValues) => {
        try {
            // 1. Create Task
            const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    ...task,
                    organization_id: (task as any).organization_id, // Ensure this is passed
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // 2. Link to Project
            const { error: linkError } = await supabase
                .from('project_tasks')
                .insert({
                    project_id: projectId,
                    task_id: newTask.id,
                    section_id: sectionId || null
                });

            if (linkError) throw linkError;

            // 3. Insert Custom Fields if any
            if (customFieldValues && Object.keys(customFieldValues).length > 0) {
                const cfInserts = Object.entries(customFieldValues).map(([fieldId, value]) => ({
                    custom_field_id: fieldId,
                    entity_type: 'task',
                    entity_id: newTask.id,
                    value: value
                }));

                const { error: cfError } = await supabase
                    .from('custom_field_values')
                    .insert(cfInserts as any); // Cast for strict typing issues

                if (cfError) console.error('Error saving custom fields:', cfError);
            }

            // Refresh
            get().fetchProjectTasks(projectId);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    },

    updateTask: async (taskId, updates, customFieldValues) => {
        try {
            // Optimistic update for standard fields
            const currentTasks = get().tasks;
            const updatedTasks = currentTasks.map(t =>
                t.id === taskId ? { ...t, ...updates } : t
            );
            set({ tasks: updatedTasks });

            // 1. Update standard fields
            if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', taskId);

                if (error) {
                    set({ tasks: currentTasks }); // Revert
                    throw error;
                }
            }

            // 2. Update Custom Fields (Upsert)
            if (customFieldValues && Object.keys(customFieldValues).length > 0) {
                // For each field, we upsert
                const upserts = Object.entries(customFieldValues).map(([fieldId, value]) => ({
                    custom_field_id: fieldId,
                    entity_type: 'task',
                    entity_id: taskId,
                    value: value
                }));

                // Supabase upsert requires unique constraint on (custom_field_id, entity_id) which we have
                const { error: cfError } = await supabase
                    .from('custom_field_values')
                    .upsert(upserts as any, { onConflict: 'custom_field_id, entity_id' });

                if (cfError) console.error('Error updating custom fields:', cfError);
            }

        } catch (error) {
            console.error('Error updating task:', error);
        }
    },

    moveTask: async (taskId, projectId, newSectionId, newIndex) => {
        try {
            // Optimistic update could go here, but reordering is complex state-wise.
            // For now, rely on refresh or simple optimistic swap if critical.

            const { error } = await supabase
                .rpc('move_task', {
                    p_task_id: taskId,
                    p_project_id: projectId,
                    p_new_section_id: newSectionId,
                    p_new_index: newIndex
                });

            if (error) throw error;

            // Refresh
            get().fetchProjectTasks(projectId);

        } catch (error) {
            console.error('Error moving task:', error);
        }
    }
}));
