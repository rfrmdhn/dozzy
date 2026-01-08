import { supabase } from '../supabase';

export interface Notification {
    id: string;
    organization_id: string;
    user_id: string;
    event_type: string;
    entity_type: string | null;
    entity_id: string | null;
    payload: Record<string, any> | null;
    is_read: boolean;
    created_at: string;
}

export const notificationRepository = {
    async fetchUnread(userId: string, limit = 20): Promise<{ notifications: Notification[]; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { notifications: data || [], error: null };
        } catch (err) {
            return { notifications: [], error: err as Error };
        }
    },

    async markAsRead(id: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    },

    async markAllAsRead(userId: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }
};
