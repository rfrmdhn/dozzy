import { supabase } from '../supabase';

export interface ActivityLog {
    id: string;
    organization_id: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    metadata: Record<string, any> | null;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export const activityLogRepository = {
    async fetchByEntity(entityType: string, entityId: string): Promise<{ logs: ActivityLog[]; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*, user:users(full_name, avatar_url)')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { logs: (data as any) || [], error: null };
        } catch (err) {
            return { logs: [], error: err as Error };
        }
    },

    async create(log: Omit<ActivityLog, 'id' | 'created_at' | 'user'>): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('activity_logs')
                .insert(log);

            if (error) throw error;
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }
};
