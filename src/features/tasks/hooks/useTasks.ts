import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { TaskInput, TaskWithSection } from '../../../types';

interface UseTasksReturn {
    tasks: TaskWithSection[];
    isLoading: boolean;
    error: Error | null;
    create: (input: TaskInput) => Promise<TaskWithSection | null>;
    update: (id: string, input: Partial<TaskInput>) => Promise<boolean>;
    updateStatus: (id: string, status: string) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

/**
 * Legacy hook for task management - prefer useTaskStore for new code
 * @deprecated Use useTaskStore instead
 */
export function useTasks(projectId?: string): UseTasksReturn {
    const [tasks, setTasks] = useState<TaskWithSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!projectId) {
            setTasks([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            // Use project_tasks junction table
            const { data, error } = await supabase
                .from('project_tasks')
                .select(`
                    section_id,
                    order_index,
                    task:tasks (*)
                `)
                .eq('project_id', projectId);

            if (error) throw error;

            const formattedTasks: TaskWithSection[] = (data || []).map((item: any) => ({
                ...item.task,
                section_id: item.section_id,
                order_index: item.order_index
            }));

            setTasks(formattedTasks);
            setError(null);
        } catch (err) {
            setError(err as Error);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const create = useCallback(async (input: TaskInput): Promise<TaskWithSection | null> => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    ...input,
                    status: input.status || 'todo',
                    priority: input.priority || 'medium',
                    tags: input.tags || [],
                })
                .select()
                .single();

            if (error) throw error;

            const newTask: TaskWithSection = { ...data, section_id: null, order_index: null };
            setTasks((prev) => [newTask, ...prev]);
            return newTask;
        } catch (err) {
            setError(err as Error);
            return null;
        }
    }, []);

    const update = useCallback(
        async (id: string, input: Partial<TaskInput>): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from('tasks')
                    .update(input)
                    .eq('id', id);

                if (error) throw error;
                setTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, ...input } : t))
                );
                return true;
            } catch (err) {
                setError(err as Error);
                return false;
            }
        },
        []
    );

    const updateStatus = useCallback(
        async (id: string, status: string): Promise<boolean> => {
            try {
                const updateData: Record<string, any> = {
                    status,
                    updated_at: new Date().toISOString(),
                };

                // Set completed_at when status changes to done
                if (status === 'done') {
                    updateData.completed_at = new Date().toISOString();
                } else {
                    updateData.completed_at = null;
                }

                const { error } = await supabase
                    .from('tasks')
                    .update(updateData)
                    .eq('id', id);

                if (error) throw error;
                setTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, ...updateData } : t))
                );
                return true;
            } catch (err) {
                setError(err as Error);
                return false;
            }
        },
        []
    );

    const remove = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);

            if (error) throw error;
            setTasks((prev) => prev.filter((t) => t.id !== id));
            return true;
        } catch (err) {
            setError(err as Error);
            return false;
        }
    }, []);

    return {
        tasks,
        isLoading,
        error,
        create,
        update,
        updateStatus,
        remove,
        refresh: fetchTasks,
    };
}

export default useTasks;
