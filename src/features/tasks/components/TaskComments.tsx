import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Comment } from '../../../types';
import { Button } from '../../../components'; // Assuming Button exists
// import { UserAvatar } from '../../../components'; // Use if available

interface TaskCommentsProps {
    taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchComments();

        // Realtime subscription
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
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*, user:users(full_name, avatar_url)') // Join user info
            .eq('task_id', taskId)
            .order('created_at', { ascending: true }); // Oldest first

        if (!error) {
            setComments(data as any || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsLoading(true);
        const { error } = await supabase
            .from('comments')
            .insert({
                task_id: taskId,
                content: { text: newComment }, // JSONB structure
                user_id: (await supabase.auth.getUser()).data.user?.id
            });

        setIsLoading(false);
        if (!error) {
            setNewComment('');
            // Subscription will trigger refresh
        } else {
            console.error('Failed to post comment', error);
        }
    };

    return (
        <div className="task-comments">
            <div className="comments-list space-y-4 mb-4 max-h-60 overflow-y-auto">
                {comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
                {comments.map((comment: any) => (
                    <div key={comment.id} className="comment-item flex gap-3">
                        <div className="comment-avatar w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                            {comment.user?.avatar_url ? (
                                <img src={comment.user.avatar_url} alt="User" />
                            ) : (
                                <span className="flex items-center justify-center h-full text-xs font-bold text-gray-500">
                                    {(comment.user?.full_name || 'U').charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="comment-content flex-1 bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm text-gray-900">{comment.user?.full_name || 'Unknown'}</span>
                                <span className="text-xs text-gray-400">
                                    {new Date(comment.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {comment.content?.text || ''}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ask a question or post an update..."
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                    <Button type="submit" disabled={isLoading || !newComment.trim()}>
                        Post Comment
                    </Button>
                </div>
            </form>
        </div>
    );
}
