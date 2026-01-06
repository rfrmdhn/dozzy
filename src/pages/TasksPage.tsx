import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useTimeLogs, formatDuration } from '../hooks/useTimeLogs';
import { supabase } from '../lib/supabase';
import type { Task, TaskInput, TaskStatus, TaskPriority, Project, Organization } from '../types';
import { BuildingIcon, EditIcon, ShareIcon, SearchIcon, ListIcon, KanbanIcon, FilterIcon, SortIcon, PlusIcon, CloseIcon, TrashIcon } from '../components/icons';
import { BoardView } from '../components/tasks/BoardView';
import { ListView } from '../components/tasks/ListView';

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
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('date');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

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

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Project link copied to clipboard!');
    };

    const handleEditDetails = () => {
        setShowEditModal(true);
    };

    return (
        <div className="page-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <BuildingIcon size={16} />
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
                    <button className="btn btn-secondary" onClick={handleEditDetails}><EditIcon size={16} /> Edit Details</button>
                    <button className="btn btn-secondary" onClick={handleShare}><ShareIcon size={16} /> Share</button>
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
                    <SearchIcon size={18} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="toolbar-actions">
                    <div className="view-toggle">
                        <button className={`btn btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListIcon size={18} /></button>
                        <button className={`btn btn-icon ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}><KanbanIcon size={18} /></button>
                    </div>
                    <div className="dropdown">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowFilterMenu(!showFilterMenu)}>
                            <FilterIcon size={16} /> Filter
                        </button>
                        {showFilterMenu && (
                            <div className="dropdown-menu">
                                <button className={`dropdown-item ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}>All</button>
                                <button className={`dropdown-item ${filterStatus === 'todo' ? 'active' : ''}`} onClick={() => { setFilterStatus('todo'); setShowFilterMenu(false); }}>To Do</button>
                                <button className={`dropdown-item ${filterStatus === 'in_progress' ? 'active' : ''}`} onClick={() => { setFilterStatus('in_progress'); setShowFilterMenu(false); }}>In Progress</button>
                                <button className={`dropdown-item ${filterStatus === 'done' ? 'active' : ''}`} onClick={() => { setFilterStatus('done'); setShowFilterMenu(false); }}>Done</button>
                            </div>
                        )}
                    </div>
                    <div className="dropdown">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowSortMenu(!showSortMenu)}>
                            <SortIcon size={16} /> Sort
                        </button>
                        {showSortMenu && (
                            <div className="dropdown-menu">
                                <button className={`dropdown-item ${sortBy === 'date' ? 'active' : ''}`} onClick={() => { setSortBy('date'); setShowSortMenu(false); }}>Date</button>
                                <button className={`dropdown-item ${sortBy === 'priority' ? 'active' : ''}`} onClick={() => { setSortBy('priority'); setShowSortMenu(false); }}>Priority</button>
                                <button className={`dropdown-item ${sortBy === 'name' ? 'active' : ''}`} onClick={() => { setSortBy('name'); setShowSortMenu(false); }}>Name</button>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <PlusIcon size={16} /> New Task
                    </button>
                </div>
            </div>

            {/* Tasks View */}
            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><SortIcon size={48} /></div>
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
                            <PlusIcon size={16} /> Create Task
                        </button>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                <ListView
                    tasks={filteredTasks}
                    onUpdateStatus={updateStatus}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLogTime={handleOpenTimeLog}
                />
            ) : (
                <BoardView
                    tasks={filteredTasks}
                    onUpdateStatus={updateStatus}
                    onEdit={handleEdit}
                    onLogTime={handleOpenTimeLog}
                />
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
                                <CloseIcon size={20} />
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

            {/* Edit Project Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Project Details</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); setShowEditModal(false); }}>
                            <div className="input-group">
                                <label className="input-label">Project Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    defaultValue={project?.name}
                                    autoFocus
                                />
                            </div>
                            <div className="input-group mt-4">
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input"
                                    defaultValue={project?.description || ''}
                                    rows={3}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
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
        .dropdown {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: var(--space-2);
          background: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 160px;
          z-index: 50;
          padding: var(--space-1);
        }

        .dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
          background: none;
          border: none;
          cursor: pointer;
          border-radius: var(--radius-sm);
        }

        .dropdown-item:hover {
          background: var(--color-gray-50);
        }

        .dropdown-item.active {
          color: var(--color-primary-600);
          background: var(--color-primary-50);
          font-weight: var(--font-weight-medium);
        }

        .view-toggle {
          display: flex;
          background: var(--color-gray-100);
          padding: 2px;
          border-radius: var(--radius-md);
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: var(--color-gray-500);
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .btn-icon:hover {
          color: var(--color-gray-700);
        }

        .btn-icon.active {
          background: var(--color-white);
          color: var(--color-primary-600);
          box-shadow: var(--shadow-sm);
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          margin-bottom: var(--space-4);
        }

        .breadcrumb a {
          color: inherit;
          text-decoration: none;
        }

        .breadcrumb a:hover {
          color: var(--color-primary-500);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
        }

        .project-header-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          margin-bottom: var(--space-1);
        }

        .project-header-description {
          color: var(--color-gray-500);
        }

        .project-header-actions {
          display: flex;
          gap: var(--space-3);
        }

        .project-progress {
          margin-bottom: var(--space-8);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-2);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
        }

        .progress-value {
          color: var(--color-primary-500);
          font-weight: var(--font-weight-semibold);
        }

        .progress-bar-container {
          height: 8px;
          background: var(--color-gray-100);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: var(--color-primary-500);
          border-radius: 4px;
          transition: width 0.5s ease-out;
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
          width: 300px;
        }

        .search-icon {
          position: absolute;
          left: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-gray-400);
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
          align-items: center;
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
          display: flex;
          align-items: center;
          gap: var(--space-2);
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
                    <h2 className="modal-title">Time Logs</h2>
                    <button className="modal-close" onClick={onClose}>
                        <CloseIcon size={20} />
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
                            type="datetime-local"
                            className="input"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                        <input
                            type="datetime-local"
                            className="input"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
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
                                                <TrashIcon size={16} />
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
