import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useTimeLogs, formatDuration } from '../hooks/useTimeLogs';
import { supabase } from '../lib/supabase';
import type { Task, TaskInput, TaskStatus, TaskPriority, Project, Organization } from '../types';

export default function TasksPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { tasks, isLoading, create, update, updateStatus, remove } = useTasks(projectId);
    const [project, setProject] = useState<Project | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
    const [formData, setFormData] = useState<Omit<TaskInput, 'project_id'>>({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
    });

    useEffect(() => {
        if (projectId) {
            supabase
                .from('projects')
                .select('*, organizations(*)')
                .eq('id', projectId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setProject(data);
                        setOrganization(data.organizations as Organization);
                    }
                });
        }
    }, [projectId]);

    const filteredTasks =
        filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;

        if (editingTask) {
            await update(editingTask, formData);
        } else {
            await create({ ...formData, project_id: projectId });
        }
        handleCloseModal();
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task.id);
        setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date?.split('T')[0] || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this task?')) {
            await remove(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
        });
    };

    const handleOpenTimeLog = (task: Task) => {
        setSelectedTask(task);
        setShowTimeModal(true);
    };

    return (
        <div className="page-container">
            <div className="breadcrumb">
                <Link to="/">Dashboard</Link>
                <span className="breadcrumb-separator">/</span>
                <Link to={`/organizations/${organization?.id}/projects`}>
                    {organization?.name || 'Org'}
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span>{project?.name || 'Tasks'}</span>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{project?.name || 'Tasks'}</h1>
                    <p className="text-muted">
                        {tasks.filter((t) => t.status === 'done').length} of {tasks.length} completed
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Task
                </button>
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs">
                {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
                    <button
                        key={status}
                        className={`filter-tab ${filter === status ? 'active' : ''}`}
                        onClick={() => setFilter(status)}
                    >
                        {status === 'all'
                            ? 'All'
                            : status === 'todo'
                                ? 'To Do'
                                : status === 'in_progress'
                                    ? 'In Progress'
                                    : 'Done'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <h3 className="empty-state-title">
                        {filter === 'all' ? 'No tasks yet' : 'No tasks in this status'}
                    </h3>
                    <p className="empty-state-description">
                        {filter === 'all'
                            ? 'Create your first task to get started.'
                            : 'Try selecting a different filter.'}
                    </p>
                    {filter === 'all' && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Create Task
                        </button>
                    )}
                </div>
            ) : (
                <div className="task-list">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={updateStatus}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onTimeLog={handleOpenTimeLog}
                        />
                    ))}
                </div>
            )}

            {/* Task Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingTask ? 'Edit Task' : 'New Task'}
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Task title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group mt-4">
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Task details"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="form-row mt-4">
                                <div className="input-group">
                                    <label className="input-label">Status</label>
                                    <select
                                        className="input"
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({ ...formData, status: e.target.value as TaskStatus })
                                        }
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Priority</label>
                                    <select
                                        className="input"
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({ ...formData, priority: e.target.value as TaskPriority })
                                        }
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div className="input-group mt-4">
                                <label className="input-label">Due Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.due_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, due_date: e.target.value })
                                    }
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTask ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Time Log Modal */}
            {showTimeModal && selectedTask && (
                <TimeLogModal
                    task={selectedTask}
                    onClose={() => {
                        setShowTimeModal(false);
                        setSelectedTask(null);
                    }}
                />
            )}

            <style>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
          font-size: var(--font-size-sm);
          color: var(--color-gray-400);
          flex-wrap: wrap;
        }

        .breadcrumb a {
          color: var(--color-gray-400);
        }

        .breadcrumb a:hover {
          color: var(--color-white);
        }

        .breadcrumb-separator {
          color: var(--color-gray-600);
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: var(--space-2) var(--space-4);
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          color: var(--color-gray-400);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-sm);
        }

        .filter-tab:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--color-white);
        }

        .filter-tab.active {
          background: linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600));
          border-color: transparent;
          color: var(--color-white);
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}

// Task Card Component
function TaskCard({
    task,
    onStatusChange,
    onEdit,
    onDelete,
    onTimeLog,
}: {
    task: Task;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onTimeLog: (task: Task) => void;
}) {
    const isDueSoon =
        task.due_date &&
        new Date(task.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000) &&
        task.status !== 'done';

    return (
        <div className={`task-card ${task.status === 'done' ? 'completed' : ''}`}>
            <div className="task-checkbox">
                <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={(e) =>
                        onStatusChange(task.id, e.target.checked ? 'done' : 'todo')
                    }
                />
            </div>
            <div className="task-content">
                <div className="task-header">
                    <h4 className="task-title">{task.title}</h4>
                    <div className="task-badges">
                        <span className={`badge badge-${task.status.replace('_', '-')}`}>
                            {task.status === 'todo'
                                ? 'To Do'
                                : task.status === 'in_progress'
                                    ? 'In Progress'
                                    : 'Done'}
                        </span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </div>
                </div>
                {task.description && <p className="task-description">{task.description}</p>}
                <div className="task-meta">
                    {task.due_date && (
                        <span className={`task-due ${isDueSoon ? 'due-soon' : ''}`}>
                            📅 {new Date(task.due_date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
            <div className="task-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onTimeLog(task)}>
                    ⏱️
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>
                    ✏️
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task.id)}>
                    🗑️
                </button>
            </div>

            <style>{`
        .task-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          padding: var(--space-5);
          background: var(--bg-card);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-xl);
          transition: all var(--transition-base);
        }

        .task-card:hover {
          background: var(--bg-card-hover);
        }

        .task-card.completed {
          opacity: 0.6;
        }

        .task-card.completed .task-title {
          text-decoration: line-through;
        }

        .task-checkbox input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--color-primary-500);
        }

        .task-content {
          flex: 1;
          min-width: 0;
        }

        .task-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .task-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-white);
          margin: 0;
        }

        .task-badges {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .task-description {
          margin-top: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-gray-400);
        }

        .task-meta {
          margin-top: var(--space-3);
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .task-due.due-soon {
          color: var(--color-warning);
        }

        .task-actions {
          display: flex;
          gap: var(--space-1);
        }

        @media (max-width: 640px) {
          .task-card {
            flex-wrap: wrap;
          }

          .task-actions {
            width: 100%;
            justify-content: flex-end;
            margin-top: var(--space-2);
          }
        }
      `}</style>
        </div>
    );
}

// Time Log Modal Component
function TimeLogModal({ task, onClose }: { task: Task; onClose: () => void }) {
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
            notes: notes || undefined,
        });

        setStartTime('');
        setEndTime('');
        setNotes('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Time Log: {task.title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="time-total">
                    <span className="time-total-label">Total Time</span>
                    <span className="time-total-value">{formatDuration(totalMinutes)}</span>
                </div>

                <form onSubmit={handleSubmit} className="time-form">
                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">Start</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">End</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group mt-4">
                        <label className="input-label">Notes</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="What did you work on?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4">
                        Add Time Entry
                    </button>
                </form>

                {timeLogs.length > 0 && (
                    <div className="time-log-list">
                        <h4>Recent Entries</h4>
                        {timeLogs.slice(0, 5).map((log) => (
                            <div key={log.id} className="time-log-item">
                                <div className="time-log-info">
                                    <span className="time-log-duration">
                                        {formatDuration(log.duration || 0)}
                                    </span>
                                    <span className="time-log-date">
                                        {new Date(log.start_time).toLocaleDateString()}
                                    </span>
                                    {log.notes && <span className="time-log-notes">{log.notes}</span>}
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => remove(log.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <style>{`
          .time-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-4);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2));
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-6);
          }

          .time-total-label {
            color: var(--color-gray-300);
            font-size: var(--font-size-sm);
          }

          .time-total-value {
            font-size: var(--font-size-2xl);
            font-weight: var(--font-weight-bold);
            background: linear-gradient(135deg, var(--color-primary-400), var(--color-secondary-400));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
          }

          .time-log-list {
            margin-top: var(--space-6);
            padding-top: var(--space-4);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .time-log-list h4 {
            font-size: var(--font-size-sm);
            color: var(--color-gray-400);
            margin-bottom: var(--space-3);
          }

          .time-log-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-3);
            background: var(--bg-glass);
            border-radius: var(--radius-md);
            margin-bottom: var(--space-2);
          }

          .time-log-info {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .time-log-duration {
            font-weight: var(--font-weight-medium);
            color: var(--color-white);
          }

          .time-log-date {
            font-size: var(--font-size-xs);
            color: var(--color-gray-500);
          }

          .time-log-notes {
            font-size: var(--font-size-xs);
            color: var(--color-gray-400);
          }

          @media (max-width: 480px) {
            .form-row {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
            </div>
        </div>
    );
}
