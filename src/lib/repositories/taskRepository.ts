import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface TaskWithSection extends Task {
    section_id: string | null;
    order_index: number;
    custom_field_values?: Record<string, unknown>;
}

export interface FetchProjectTasksResult {
    tasks: TaskWithSection[];
    error: Error | null;
}

export interface TaskOperationResult {
    data: Task | null;
    error: Error | null;
}

/**
 * Repository for Task data access operations.
 * Centralizes all Supabase queries for tasks.
 */
export const taskRepository = {
    /**
     * Fetch all tasks for a project with section info
     */
    async fetchByProject(projectId: string): Promise<FetchProjectTasksResult> {
        try {
            const { data, error } = await supabase
                .from('project_tasks')
                .select(`
                    section_id,
                    order_index,
                    task:tasks (*)
                `)
                .eq('project_id', projectId);

            if (error) throw error;

            const tasks: TaskWithSection[] = (data || []).map((item) => {
                const taskData = item.task as unknown as Task;
                return {
                    ...taskData,
                    section_id: item.section_id,
                    order_index: item.order_index ?? 0,
                    custom_field_values: {},
                };
            });

            return { tasks, error: null };
        } catch (err) {
            return { tasks: [], error: err as Error };
        }
    },

    /**
     * Create a new task and link it to a project
     */
    async create(
        task: TaskInsert,
        projectId: string,
        sectionId?: string,
        customFieldValues?: Record<string, unknown>
    ): Promise<TaskOperationResult> {
        try {
            // 1. Create the task
            const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert(task)
                .select()
                .single();

            if (taskError) throw taskError;

            // 2. Link to project
            const { error: linkError } = await supabase
                .from('project_tasks')
                .insert({
                    project_id: projectId,
                    task_id: newTask.id,
                    section_id: sectionId || null,
                });

            if (linkError) throw linkError;

            // 3. Insert custom field values if any
            if (customFieldValues && Object.keys(customFieldValues).length > 0) {
                const cfInserts = Object.entries(customFieldValues).map(([fieldId, value]) => ({
                    custom_field_id: fieldId,
                    entity_type: 'task' as const,
                    entity_id: newTask.id,
                    value: value as Database['public']['Tables']['custom_field_values']['Insert']['value'],
                }));

                const { error: cfError } = await supabase
                    .from('custom_field_values')
                    .insert(cfInserts);

                if (cfError) {
                    console.error('Error saving custom fields:', cfError);
                }
            }

            return { data: newTask, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Update an existing task
     */
    async update(
        taskId: string,
        updates: TaskUpdate,
        customFieldValues?: Record<string, unknown>
    ): Promise<TaskOperationResult> {
        try {
            // 1. Update standard fields
            if (Object.keys(updates).length > 0) {
                const { data, error } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', taskId)
                    .select()
                    .single();

                if (error) throw error;

                // 2. Update custom fields (upsert)
                if (customFieldValues && Object.keys(customFieldValues).length > 0) {
                    const upserts = Object.entries(customFieldValues).map(([fieldId, value]) => ({
                        custom_field_id: fieldId,
                        entity_type: 'task' as const,
                        entity_id: taskId,
                        value: value as Database['public']['Tables']['custom_field_values']['Insert']['value'],
                    }));

                    const { error: cfError } = await supabase
                        .from('custom_field_values')
                        .upsert(upserts, { onConflict: 'custom_field_id,entity_id' });

                    if (cfError) {
                        console.error('Error updating custom fields:', cfError);
                    }
                }

                return { data, error: null };
            }

            return { data: null, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Update task status with completed_at handling
     */
    async updateStatus(taskId: string, status: string): Promise<TaskOperationResult> {
        try {
            const updateData: TaskUpdate = {
                status,
                updated_at: new Date().toISOString(),
            };

            // Set completed_at when status changes to done
            if (status === 'done') {
                updateData.completed_at = new Date().toISOString();
            } else {
                updateData.completed_at = null;
            }

            const { data, error } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', taskId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Delete a task
     */
    async delete(taskId: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            // First remove from project_tasks junction
            await supabase
                .from('project_tasks')
                .delete()
                .eq('task_id', taskId);

            // Then delete the task itself
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    },

    /**
     * Move a task to a new section/position using RPC
     */
    async move(
        taskId: string,
        projectId: string,
        newSectionId: string | null,
        newIndex: number
    ): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { error } = await supabase.rpc('move_task', {
                p_task_id: taskId,
                p_project_id: projectId,
                p_new_section_id: newSectionId,
                p_new_index: newIndex,
            });

            if (error) throw error;
            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    },
};

export default taskRepository;
