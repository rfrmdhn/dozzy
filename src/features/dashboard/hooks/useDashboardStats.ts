import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { DashboardStats } from '../../../types';

interface UseDashboardStatsOptions {
    userId: string | undefined;
    orgCount: number;
}

interface UseDashboardStatsReturn {
    stats: DashboardStats;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useDashboardStats({ userId, orgCount }: UseDashboardStatsOptions): UseDashboardStatsReturn {
    const [stats, setStats] = useState<DashboardStats>({
        totalTime: 0,
        activeOrgs: 0,
        pendingTasks: 0,
        highPriorityCount: 0,
        weeklyChange: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Get pending tasks count
            const { count: taskCount, error: taskError } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'done');

            if (taskError) throw taskError;

            // Get high priority pending tasks
            const { count: highPriorityCount, error: hpError } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'done')
                .eq('priority', 'high');

            if (hpError) throw hpError;

            // Get time logs total
            const { data: timeLogs, error: tlError } = await supabase
                .from('time_logs')
                .select('duration');

            if (tlError) throw tlError;

            const totalMinutes = timeLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;

            // Get time logged this week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: weekLogs, error: wlError } = await supabase
                .from('time_logs')
                .select('duration')
                .gte('created_at', weekAgo.toISOString());

            if (wlError) throw wlError;

            const weekMinutes = weekLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;

            // Calculate rough weekly change percentage
            const previousWeekMinutes = totalMinutes - weekMinutes;
            const weeklyChange = previousWeekMinutes > 0
                ? Math.round(((weekMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)
                : weekMinutes > 0 ? 100 : 0;

            setStats({
                totalTime: totalMinutes,
                activeOrgs: orgCount,
                pendingTasks: taskCount || 0,
                highPriorityCount: highPriorityCount || 0,
                weeklyChange,
            });
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, orgCount]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, error, refresh: fetchStats };
}
