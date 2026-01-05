import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TimeLog, TimeLogInput } from '../types';

interface UseTimeLogsReturn {
    timeLogs: TimeLog[];
    totalMinutes: number;
    isLoading: boolean;
    error: Error | null;
    create: (input: TimeLogInput) => Promise<TimeLog | null>;
    update: (id: string, input: Partial<TimeLogInput>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

export function useTimeLogs(taskId?: string): UseTimeLogsReturn {
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    const fetchTimeLogs = useCallback(async () => {
        if (!taskId) {
            setTimeLogs([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('task_id', taskId)
                .order('start_time', { ascending: false });

            if (error) throw error;
            setTimeLogs(data || []);
            setError(null);
        } catch (err) {
            setError(err as Error);
            setTimeLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchTimeLogs();
    }, [fetchTimeLogs]);

    const calculateDuration = (startTime: string, endTime?: string): number => {
        if (!endTime) return 0;
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return Math.round((end - start) / (1000 * 60)); // Convert to minutes
    };

    const create = useCallback(
        async (input: TimeLogInput): Promise<TimeLog | null> => {
            try {
                const duration =
                    input.duration ?? calculateDuration(input.start_time, input.end_time);

                const { data, error } = await supabase
                    .from('time_logs')
                    .insert({
                        ...input,
                        duration,
                    })
                    .select()
                    .single();

                if (error) throw error;
                setTimeLogs((prev) => [data, ...prev]);
                return data;
            } catch (err) {
                setError(err as Error);
                return null;
            }
        },
        []
    );

    const update = useCallback(
        async (id: string, input: Partial<TimeLogInput>): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from('time_logs')
                    .update(input)
                    .eq('id', id);

                if (error) throw error;
                setTimeLogs((prev) =>
                    prev.map((log) => (log.id === id ? { ...log, ...input } : log))
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
            const { error } = await supabase.from('time_logs').delete().eq('id', id);

            if (error) throw error;
            setTimeLogs((prev) => prev.filter((log) => log.id !== id));
            return true;
        } catch (err) {
            setError(err as Error);
            return false;
        }
    }, []);

    return {
        timeLogs,
        totalMinutes,
        isLoading,
        error,
        create,
        update,
        remove,
        refresh: fetchTimeLogs,
    };
}

// Helper function to format minutes as hours:minutes
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
}

export default useTimeLogs;
