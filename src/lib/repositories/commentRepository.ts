import { supabase } from '../supabase';
import type { CommentWithUser } from '../../types';

export const commentRepository = {
    async fetchByTask(taskId: string): Promise<{ comments: CommentWithUser[]; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, user:users(id, full_name, avatar_url)')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { comments: (data as any) || [], error: null };
        } catch (err) {
            return { comments: [], error: err as Error };
        }
    },

    async create(taskId: string, userId: string, content: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    task_id: taskId,
                    user_id: userId,
                    content: { text: content } // Assuming content is JSON
                });

            if (error) throw error;
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }
};
