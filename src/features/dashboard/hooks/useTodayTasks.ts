import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AgendaTask, TaskPriority } from '../../../types';

interface UseTodayTasksOptions {
    userId: string | undefined;
}

interface UseTodayTasksReturn {
    tasks: AgendaTask[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useTodayTasks({ userId }: UseTodayTasksOptions): UseTodayTasksReturn {
    const [tasks, setTasks] = useState<AgendaTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const today = new Date().toISOString().split('T')[0];
            const { data, error: fetchError } = await supabase
                .from('tasks')
                .select('id, title, status, priority, due_date, labels, projects(name)')
                .lte('due_date', today + 'T23:59:59')
                .neq('status', 'done')
                .limit(5);

            if (fetchError) throw fetchError;

            const agendaTasks: AgendaTask[] = (data || []).map(t => {
                const proj = t.projects as unknown as { name: string } | null;

                // Determine task type from labels or priority
                let type: AgendaTask['type'] = 'task';
                const labels = (t.labels || []) as string[];
                if (labels.some(l => l.toLowerCase() === 'design')) type = 'design';
                else if (labels.some(l => l.toLowerCase() === 'meeting')) type = 'meeting';
                else if (labels.some(l => l.toLowerCase() === 'admin')) type = 'admin';

                // Format due time
                let due_time = '';
                if (t.due_date) {
                    const date = new Date(t.due_date);
                    due_time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                }

                return {
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority as TaskPriority,
                    project_name: proj?.name,
                    due_date: t.due_date ?? undefined,
                    due_time,
                    type,
                };
            });

            setTasks(agendaTasks);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, isLoading, error, refresh: fetchTasks };
}
