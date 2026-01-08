import { ActivityLogList } from '../../../components/molecules'; // Use direct path if barrel export has issues or use index

interface TaskActivityProps {
    taskId: string;
}

export function TaskActivity({ taskId }: TaskActivityProps) {
    return (
        <div className="task-activity max-h-[400px] overflow-y-auto custom-scrollbar">
            <ActivityLogList entityType="task" entityId={taskId} showTitle={false} />
        </div>
    );
}

