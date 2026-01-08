import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
// import { Activity } from 'lucide-react';

interface TaskActivityProps {
    taskId: string;
}

export function TaskActivity({ taskId }: TaskActivityProps) {
    const [logs, setLogs] = useState<any[]>([]); // Use appropriate type

    useEffect(() => {
        fetchLogs();
    }, [taskId]);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*, user:users(full_name)')
            .eq('entity_id', taskId)
            .eq('entity_type', 'task')
            .order('created_at', { ascending: false });

        if (!error) {
            setLogs(data || []);
        }
    };

    const formatAction = (action: string) => {
        switch (action) {
            case 'create': return 'created this task';
            case 'update': return 'updated this task';
            case 'delete': return 'deleted this task';
            default: return action;
        }
    };

    return (
        <div className="task-activity space-y-3">
            {logs.length === 0 && <p className="text-gray-500 text-sm">No activity recorded.</p>}
            {logs.map(log => (
                <div key={log.id} className="activity-item flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-gray-900">
                            {log.user?.full_name || 'System'}
                        </span>
                        {' '}{formatAction(log.action)}
                        <span className="text-gray-400 ml-2 text-xs">
                            {new Date(log.created_at).toLocaleString()}
                        </span>
                        {log.metadata && (
                            <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
                                {/* Simple metadata visualizer */}
                                {Object.keys(log.metadata).map(k => (
                                    <div key={k}>{k}: {JSON.stringify(log.metadata[k])}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
