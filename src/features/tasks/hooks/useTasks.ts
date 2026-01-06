import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Task, TaskInput, TaskStatus } from '../../../types';

interface UseTasksReturn {
    tasks: Task[];
    isLoading: boolean;
    error: Error | null;
    create: (input: TaskInput) => Promise<Task | null>;
    update: (id: string, input: Partial<TaskInput>) => Promise<boolean>;
    updateStatus: (id: string, status: TaskStatus) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

export function useTasks(projectId?: string): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
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
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
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

    const create = useCallback(async (input: TaskInput): Promise<Task | null> => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    ...input,
                    status: input.status || 'todo',
                    priority: input.priority || 'medium',
                    labels: input.labels || [],
                })
                .select()
                .single();

            if (error) throw error;
            setTasks((prev) => [data, ...prev]);
            return data;
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
        async (id: string, status: TaskStatus): Promise<boolean> => {
            try {
                const updateData: Partial<Task> = {
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
