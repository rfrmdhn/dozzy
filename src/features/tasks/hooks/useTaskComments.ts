import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { commentRepository } from '../../../lib/repositories';
import { useNotification } from '../../../hooks/useNotification';
import type { CommentWithUser } from '../../../types';

export function useTaskComments(taskId: string) {
    const [comments, setComments] = useState<CommentWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const notification = useNotification(); // Use the standardized hook

    const fetchComments = async () => {
        // Only set loading on initial fetch if empty to avoid flicker on realtime updates
        if (comments.length === 0) setIsLoading(true);

        const { comments: data, error } = await commentRepository.fetchByTask(taskId);

        setIsLoading(false);

        if (error) {
            notification.error('Failed to load comments');
        } else {
            setComments(data);
        }
    };

    useEffect(() => {
        fetchComments();

        const channel = supabase
            .channel(`comments-${taskId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `task_id=eq.${taskId}`
                },
                () => {
                    fetchComments(); // Reload on change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId]);

    const addComment = async (userId: string, text: string) => {
        const { error } = await commentRepository.create(taskId, userId, text);
        if (error) {
            notification.error('Failed to post comment');
            return false;
        }
        return true;
    };

    return { comments, isLoading, addComment };
}
