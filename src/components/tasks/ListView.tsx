import { type Task, type TaskStatus, type TaskPriority } from '../../types';
import { CalendarIcon, ClockIcon, EditIcon, TrashIcon, FlagIcon } from '../icons';

interface ListViewProps {
    tasks: Task[];
    onUpdateStatus: (id: string, status: TaskStatus) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onLogTime: (task: Task) => void;
}

export function ListView({ tasks, onUpdateStatus, onEdit, onDelete, onLogTime }: ListViewProps) {
    const getStatusBadgeClass = (status: TaskStatus) => {
        switch (status) {
            case 'todo': return 'badge-todo';
            case 'in_progress': return 'badge-in-progress';
            case 'done': return 'badge-done';
            default: return '';
        }
    };

    const getPriorityIcon = (priority: TaskPriority) => {
        const colors: Record<string, string> = {
            high: 'var(--color-error)',
            medium: 'var(--color-warning)',
            low: 'var(--color-success)'
        };
        return <FlagIcon size={14} style={{ color: colors[priority] || 'var(--color-gray-400)' }} />;
    };

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Task Name</th>
                        <th style={{ width: '120px' }}>Status</th>
                        <th style={{ width: '100px' }}>Priority</th>
                        <th style={{ width: '120px' }}>Labels</th>
                        <th style={{ width: '140px' }}>Due Date</th>
                        <th style={{ width: '80px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => (
                        <tr key={task.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={task.status === 'done'}
                                    onChange={(e) =>
                                        onUpdateStatus(task.id, e.target.checked ? 'done' : 'todo')
                                    }
                                    className="task-checkbox"
                                />
                            </td>
                            <td>
                                <span className={`task-row-title ${task.status === 'done' ? 'completed' : ''}`}>
                                    {task.title}
                                </span>
                            </td>
                            <td>
                                <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                    {task.status === 'todo'
                                        ? 'To Do'
                                        : task.status === 'in_progress'
                                            ? 'In Progress'
                                            : 'Done'}
                                </span>
                            </td>
                            <td>
                                <span className={`priority-indicator priority-${task.priority}`}>
                                    {getPriorityIcon(task.priority)} {task.priority}
                                </span>
                            </td>
                            <td>
                                {task.labels?.slice(0, 2).map((label, i) => (
                                    <span key={i} className="label-badge">#{label}</span>
                                ))}
                            </td>
                            <td>
                                {task.due_date && (
                                    <span className="due-date">
                                        <CalendarIcon size={14} /> {new Date(task.due_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                )}
                            </td>
                            <td>
                                <div className="row-actions">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => onLogTime(task)}
                                        title="Log time"
                                    >
                                        <ClockIcon size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => onEdit(task)}
                                        title="Edit"
                                    >
                                        <EditIcon size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => onDelete(task.id)}
                                        title="Delete"
                                    >
                                        <TrashIcon size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
