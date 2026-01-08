import { useState } from 'react';
import { useTimeLogs, formatDuration } from '../hooks/useTimeLogs';
import type { Task } from '../../../types';
import { TrashIcon, Modal, Input, Button } from '../../../components';

interface TimeLogModalProps {
    task: Task;
    onClose: () => void;
}

export function TimeLogModal({ task, onClose }: TimeLogModalProps) {
    const { timeLogs, totalMinutes, create, remove } = useTimeLogs(task.id);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startTime || !endTime) return;

        await create({
            task_id: task.id,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            note: notes || undefined,
        });

        setStartTime('');
        setEndTime('');
        setNotes('');
    };

    return (
        <Modal
            isOpen={true} // Controlled by parent conditional rendering usually
            onClose={onClose}
            title="Time Logs"
        >
            <div className="time-header">
                <div className="time-task-name">{task.title}</div>
                <div className="time-total">
                    <span className="time-total-label">TOTAL TIME</span>
                    <span className="time-total-value">{formatDuration(totalMinutes)}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="time-form">
                <div className="time-form-label">Add Manual Entry</div>
                <div className="time-form-row">
                    <Input
                        placeholder="Note (e.g., Research)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        containerClassName="flex-1"
                    />
                    <Input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                    />
                    <Input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="primary">Log</Button>
                </div>
            </form>

            {timeLogs.length > 0 && (
                <div className="time-logs-table">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time Range</th>
                                <th>Note</th>
                                <th>Duration</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td>
                                        {new Date(log.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        {log.end_time && ` - ${new Date(log.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                                    </td>
                                    <td>{log.note || '-'}</td>
                                    <td>{formatDuration(log.duration || 0)}</td>
                                    <td>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(log.id)}
                                        >
                                            <TrashIcon size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
