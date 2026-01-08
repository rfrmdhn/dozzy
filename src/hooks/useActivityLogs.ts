import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { activityLogRepository, type ActivityLog } from '../lib/repositories/activityLogRepository';
import { useNotification } from './useNotification';

export function useActivityLogs(entityType: string, entityId: string) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const notification = useNotification();

    const fetchLogs = async () => {
        setIsLoading(true);
        const { logs: data, error } = await activityLogRepository.fetchByEntity(entityType, entityId);
        setIsLoading(false);

        if (error) {
            notification.error('Failed to load activity logs');
        } else {
            setLogs(data);
        }
    };

    useEffect(() => {
        if (!entityId) return;

        fetchLogs();

        const channel = supabase
            .channel(`logs-${entityType}-${entityId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_logs',
                    filter: `entity_id=eq.${entityId}`
                },
                () => {
                    fetchLogs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [entityType, entityId]);

    return { logs, isLoading };
}
