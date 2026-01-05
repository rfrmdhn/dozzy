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
    const [_organization, setOrganization] = useState<Organization | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
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

    const completedCount = tasks.filter((t) => t.status === 'done').length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    const filteredTasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    const getStatusBadgeClass = (status: TaskStatus) => {
        switch (status) {
            case 'todo': return 'badge-todo';
            case 'in_progress': return 'badge-in-progress';
            case 'done': return 'badge-done';
            default: return '';
        }
    };

    const getPriorityIcon = (priority: TaskPriority) => {
        switch (priority) {
            case 'high': return '🚩';
            case 'medium': return '🚩';
            case 'low': return '🚩';
            default: return '🚩';
        }
    };

    return (
        <div className="page-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span>🏢</span>
                <Link to="/">Organization</Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{project?.name || 'Project'}</span>
            </div>

            {/* Project Header */}
            <div className="project-header">
                <div className="project-header-content">
                    <h1 className="project-header-title">{project?.name || 'Project'}</h1>
                    {project?.description && (
                        <p className="project-header-description">{project.description}</p>
                    )}
                </div>
                <div className="project-header-actions">
                    <button className="btn btn-secondary" disabled title="Coming soon">✏️ Edit Details</button>
                    <button className="btn btn-secondary" disabled title="Coming soon">📤 Share</button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="project-progress">
                <div className="progress-header">
                    <span>Project Progress</span>
                    <span className="progress-value">{progress}%</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Toolbar */}
            <div className="tasks-toolbar">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="toolbar-actions">
                    <button className="btn btn-secondary btn-sm active">☰ List</button>
                    <button className="btn btn-secondary btn-sm" disabled title="Coming soon">⊞ Board</button>
                    <button className="btn btn-secondary btn-sm" disabled title="Coming soon">🔽 Filter</button>
                    <button className="btn btn-secondary btn-sm" disabled title="Coming soon">↕️ Sort</button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + New Task
                    </button>
                </div>
            </div>

            {/* Tasks Table */}
            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <h3 className="empty-state-title">
                        {searchQuery ? 'No tasks found' : 'No tasks yet'}
                    </h3>
                    <p className="empty-state-description">
                        {searchQuery
                            ? 'Try a different search term.'
                            : 'Create your first task to get started.'}
                    </p>
                    {!searchQuery && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Create Task
                        </button>
                    )}
                </div>
            ) : (
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
                            {filteredTasks.map((task) => (
                                <tr key={task.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'done'}
                                            onChange={(e) =>
                                                updateStatus(task.id, e.target.checked ? 'done' : 'todo')
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
                                                📅 {new Date(task.due_date).toLocaleDateString('en-US', {
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
                                                onClick={() => handleOpenTimeLog(task)}
                                                title="Log time"
                                            >
                                                ⏱️
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleEdit(task)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleDelete(task.id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                        <div className="pagination">
                            <button className="btn btn-secondary btn-sm" disabled>Previous</button>
                            <button className="btn btn-secondary btn-sm" disabled>Next</button>
                        </div>
                    </div>
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
        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
        }

        .project-header-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--space-2);
        }

        .project-header-description {
          color: var(--color-gray-500);
        }

        .project-header-actions {
          display: flex;
          gap: var(--space-2);
        }

        .project-progress {
          background: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .progress-value {
          color: var(--color-primary-500);
          font-weight: var(--font-weight-semibold);
        }

        .tasks-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
        }

        .search-input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          padding-left: 40px;
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
          background: var(--color-white);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .toolbar-actions {
          display: flex;
          gap: var(--space-2);
        }

        .task-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-primary-500);
          cursor: pointer;
        }

        .priority-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-sm);
          text-transform: capitalize;
        }

        .priority-indicator.priority-high {
          color: var(--color-error);
        }

        .priority-indicator.priority-medium {
          color: var(--color-warning);
        }

        .priority-indicator.priority-low {
          color: var(--color-gray-500);
        }

        .due-date {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .row-actions {
          display: flex;
          gap: var(--space-1);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        tr:hover .row-actions {
          opacity: 1;
        }

        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          border-top: 1px solid var(--color-gray-100);
        }

        .pagination {
          display: flex;
          gap: var(--space-2);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        @media (max-width: 768px) {
          .project-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .tasks-toolbar {
            flex-direction: column;
          }

          .search-box {
            max-width: none;
          }

          .toolbar-actions {
            flex-wrap: wrap;
            justify-content: center;
          }

          .form-row {
            grid-template-columns: 1fr;
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
            <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">⏱️ Time Logs</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

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
                        <input
                            type="text"
                            className="input"
                            placeholder="Note (e.g., Research)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <input
                            type="time"
                            className="input"
                            value={startTime.split('T')[1]?.substring(0, 5) || ''}
                            onChange={(e) => setStartTime(`${new Date().toISOString().split('T')[0]}T${e.target.value}`)}
                            required
                        />
                        <input
                            type="time"
                            className="input"
                            value={endTime.split('T')[1]?.substring(0, 5) || ''}
                            onChange={(e) => setEndTime(`${new Date().toISOString().split('T')[0]}T${e.target.value}`)}
                            required
                        />
                        <button type="submit" className="btn btn-primary">Log</button>
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
                                        <td>{log.notes || '-'}</td>
                                        <td>{formatDuration(log.duration || 0)}</td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => remove(log.id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <style>{`
          .time-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-4);
            background: var(--color-gray-50);
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-6);
          }

          .time-task-name {
            font-weight: var(--font-weight-semibold);
            color: var(--color-gray-900);
          }

          .time-total {
            text-align: right;
          }

          .time-total-label {
            display: block;
            font-size: var(--font-size-xs);
            color: var(--color-gray-500);
            margin-bottom: var(--space-1);
          }

          .time-total-value {
            font-size: var(--font-size-2xl);
            font-weight: var(--font-weight-bold);
            color: var(--color-primary-500);
          }

          .time-form {
            margin-bottom: var(--space-6);
          }

          .time-form-label {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--color-gray-700);
            margin-bottom: var(--space-3);
          }

          .time-form-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr auto;
            gap: var(--space-2);
          }

          .time-logs-table {
            border: 1px solid var(--color-gray-200);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }

          @media (max-width: 640px) {
            .time-form-row {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
            </div>
        </div>
    );
}
