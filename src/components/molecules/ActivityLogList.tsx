import { useActivityLogs } from '../../hooks/useActivityLogs';
import { formatRelativeTime } from '../../lib/utils/date';
import { getInitials } from '../../lib/utils/status';
import type { ActivityLog } from '../../lib/repositories/activityLogRepository';

interface ActivityLogListProps {
    entityType: string;
    entityId: string;
    showTitle?: boolean;
}

export function ActivityLogList({ entityType, entityId, showTitle = true }: ActivityLogListProps) {
    const { logs, isLoading } = useActivityLogs(entityType, entityId);

    if (isLoading && logs.length === 0) {
        return <div className="text-sm text-gray-500 py-2">Loading activity...</div>;
    }

    if (logs.length === 0) {
        return <div className="text-sm text-gray-400 py-2 italic whitespace-normal">No recent activity.</div>;
    }

    return (
        <div className="activity-log-list">
            {showTitle && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</h3>}
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {log.user?.avatar_url ? (
                                    <img src={log.user.avatar_url} alt={log.user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-bold text-gray-500">
                                        {getInitials(log.user?.full_name || 'System')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-900 break-words">
                                <span className="font-medium">{log.user?.full_name || 'System'}</span>
                                <span className="text-gray-600"> {formatAction(log)}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {formatRelativeTime(log.created_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatAction(log: ActivityLog): string {
    const { action, metadata } = log;

    // Customize messages based on action types
    switch (action) {
        case 'task.created':
            return 'created this task';
        case 'task.updated':
            // Check metadata for specific field updates if available
            if (metadata?.changes) {
                const fields = Object.keys(metadata.changes).join(', ');
                return `updated ${fields}`;
            }
            return 'updated this task';
        case 'task.status_changed':
            return `changed status to ${metadata?.status || 'unknown'}`;
        case 'task.moved':
            return 'moved this task';
        case 'task.deleted':
            return 'deleted this task';
        case 'comment.created':
            return 'commented';
        case 'project.created':
            return 'created this project';
        default:
            return action.replace('.', ' ');
    }
}
