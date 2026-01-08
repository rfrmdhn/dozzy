import { useState } from 'react';
import { useTaskComments } from '../hooks/useTaskComments';
import { Button } from '../../../components';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getInitials } from '../../../lib/utils/status'; // Assuming utils exists, or create helper
import { formatDate } from '../../../lib/utils/date';

interface TaskCommentsProps {
    taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
    const { comments, isLoading, addComment } = useTaskComments(taskId);
    const { user } = useAuthStore();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsSubmitting(true);
        const success = await addComment(user.id, newComment);
        setIsSubmitting(false);

        if (success) {
            setNewComment('');
        }
    };

    return (
        <div className="task-comments">
            <div className="comments-list space-y-4 mb-4 max-h-60 overflow-y-auto">
                {isLoading && comments.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No comments yet. Be the first to start a discussion.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item flex gap-3 mb-4">
                            <div className="comment-avatar w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                                {comment.user?.avatar_url ? (
                                    <img src={comment.user.avatar_url} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-primary-600">
                                        {getInitials(comment.user?.full_name || 'U')}
                                    </span>
                                )}
                            </div>
                            <div className="comment-content flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-sm text-gray-900">{comment.user?.full_name || 'Unknown User'}</span>
                                    <span className="text-xs text-gray-400">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                    {typeof comment.content === 'object' && comment.content !== null && 'text' in comment.content
                                        ? (comment.content as any).text
                                        : JSON.stringify(comment.content)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ask a question or post an update..."
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                    <Button type="submit" disabled={isSubmitting || !newComment.trim()} size="sm">
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

