import type { TaskWithSection } from '../../../types';
import { CalendarIcon, ClockIcon, EditIcon, TrashIcon, FlagIcon, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components';

interface ListViewProps {
    tasks: TaskWithSection[];
    onUpdateStatus: (id: string, status: string | null) => void;
    onEdit: (task: TaskWithSection) => void;
    onDelete: (id: string) => void;
    onLogTime: (task: TaskWithSection) => void;
}

import { getStatusBadgeClass, getStatusLabel, getPriorityColor } from '../../../lib/utils/status';

export function ListView({ tasks, onUpdateStatus, onEdit, onDelete, onLogTime }: ListViewProps) {

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ width: '40px' }}></TableHead>
                    <TableHead>Task Name</TableHead>
                    <TableHead style={{ width: '120px' }}>Status</TableHead>
                    <TableHead style={{ width: '100px' }}>Priority</TableHead>
                    <TableHead style={{ width: '120px' }}>Tags</TableHead>
                    <TableHead style={{ width: '140px' }}>Due Date</TableHead>
                    <TableHead style={{ width: '80px' }}></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell>
                            <input
                                type="checkbox"
                                checked={task.status === 'done'}
                                onChange={(e) =>
                                    onUpdateStatus(task.id, e.target.checked ? 'done' : 'todo')
                                }
                                className="task-checkbox"
                            />
                        </TableCell>
                        <TableCell>
                            <span className={`task-row-title ${task.status === 'done' ? 'completed' : ''}`}>
                                {task.title}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                {getStatusLabel(task.status)}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className={`priority-indicator priority-${task.priority}`}>
                                <FlagIcon size={14} style={{ color: getPriorityColor(task.priority) }} /> {task.priority}
                            </span>
                        </TableCell>
                        <TableCell>
                            {task.tags?.slice(0, 2).map((tag: string, i: number) => (
                                <span key={i} className="label-badge">#{tag}</span>
                            ))}
                        </TableCell>
                        <TableCell>
                            {task.due_date && (
                                <span className="due-date">
                                    <CalendarIcon size={14} /> {new Date(task.due_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="row-actions">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onLogTime(task)}
                                    title="Log time"
                                >
                                    <ClockIcon size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(task)}
                                    title="Edit"
                                >
                                    <EditIcon size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(task.id)}
                                    title="Delete"
                                >
                                    <TrashIcon size={16} />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
