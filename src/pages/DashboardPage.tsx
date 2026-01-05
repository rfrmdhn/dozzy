import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { OrganizationInput } from '../types';
import { ClockIcon, BuildingIcon, CheckCircleIcon, EditIcon, TrashIcon, FolderIcon, PlusIcon, PlayIcon, PauseIcon, ArrowUpIcon } from '../components/icons';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { organizations, isLoading, create, update, remove } = useOrganizations();
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<string | null>(null);
    const [stats, setStats] = useState({ totalTime: 0, activeOrgs: 0, pendingTasks: 0 });
    const [formData, setFormData] = useState<OrganizationInput>({
        name: '',
        description: '',
    });
    const [todayTasks, setTodayTasks] = useState<Array<{ id: string; title: string; status: string; project_name?: string; due_date?: string }>>([]);
    const [activeProjects, setActiveProjects] = useState<Array<{ id: string; name: string; org_name: string; org_id: string; progress: number; due_date?: string }>>([]);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerDescription, setTimerDescription] = useState('');

    const greeting = getGreeting();
    const userName = user?.email?.split('@')[0] || 'User';

    // Fetch stats
    useEffect(() => {
        async function fetchStats() {
            if (!user) return;

            // Get pending tasks count
            const { count: taskCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'done');

            // Get time logs total
            const { data: timeLogs } = await supabase
                .from('time_logs')
                .select('duration');

            const totalMinutes = timeLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;

            setStats({
                totalTime: totalMinutes,
                activeOrgs: organizations.length,
                pendingTasks: taskCount || 0,
            });
        }

        fetchStats();
    }, [user, organizations.length]);

    // Fetch today's tasks and active projects
    useEffect(() => {
        async function fetchTodayData() {
            if (!user) return;

            // Get tasks due today
            const today = new Date().toISOString().split('T')[0];
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title, status, due_date, projects(name)')
                .lte('due_date', today + 'T23:59:59')
                .neq('status', 'done')
                .limit(5);

            if (tasks) {
                setTodayTasks(tasks.map(t => {
                    const proj = t.projects as unknown as { name: string } | null;
                    return {
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        project_name: proj?.name,
                        due_date: t.due_date
                    };
                }));
            }

            // Get active projects
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name, due_date, organizations(id, name)')
                .eq('status', 'active')
                .limit(5);

            if (projects) {
                setActiveProjects(projects.map(p => {
                    const org = p.organizations as unknown as { id: string; name: string } | null;
                    return {
                        id: p.id,
                        name: p.name,
                        org_name: org?.name || 'Unknown',
                        org_id: org?.id || '',
                        progress: Math.floor(Math.random() * 100),
                        due_date: p.due_date
                    };
                }));
            }
        }

        fetchTodayData();
    }, [user]);

    // Timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timerRunning) {
            interval = setInterval(() => {
                setTimerSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    function formatTime(minutes: number) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    function formatTimerTime(seconds: number) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function formatDate(dateStr?: string) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingOrg) {
            await update(editingOrg, formData);
        } else {
            await create(formData);
        }
        handleCloseModal();
    };

    const handleEdit = (org: { id: string; name: string; description: string | null }) => {
        setEditingOrg(org.id);
        setFormData({ name: org.name, description: org.description || '' });
        setShowModal(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this organization? All projects and tasks will be removed.')) {
            await remove(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrg(null);
        setFormData({ name: '', description: '' });
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-greeting">
                        {greeting}, {userName}
                    </h1>
                    <p className="dashboard-subtitle">
                        You have {stats.pendingTasks} tasks pending. Stay productive!
                    </p>
                </div>
                <div className="dashboard-header-right">
                    <div className="today-date">
                        <span className="date-label">TODAY</span>
                        <span className="date-value">{new Date().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <PlusIcon size={16} /> New Task
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Hours Logged</span>
                        <div className="stat-card-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-500)' }}><ClockIcon size={20} /></div>
                    </div>
                    <div className="stat-card-value">{formatTime(stats.totalTime)}</div>
                    <div className="stat-card-change positive"><ArrowUpIcon size={14} /> +12% this week</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Active Orgs</span>
                        <div className="stat-card-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}><BuildingIcon size={20} /></div>
                    </div>
                    <div className="stat-card-value">{stats.activeOrgs}</div>
                    <div className="stat-card-change">Across all workspaces</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Pending Tasks</span>
                        <div className="stat-card-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}><CheckCircleIcon size={20} /></div>
                    </div>
                    <div className="stat-card-value">{stats.pendingTasks}</div>
                    <div className="stat-card-change">{stats.pendingTasks > 2 ? 'High Priority' : 'On track'}</div>
                </div>
            </div>

            {/* Organizations Section */}
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Your Organizations</h2>
                    {organizations.length > 0 && (
                        <button className="btn btn-link" onClick={() => navigate('/organizations')}>
                            View All
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="empty-state">
                        <div className="loading-spinner" />
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><BuildingIcon size={48} /></div>
                        <h3 className="empty-state-title">No organizations yet</h3>
                        <p className="empty-state-description">
                            Create your first organization to start managing projects and tasks.
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <PlusIcon size={16} /> Create Organization
                        </button>
                    </div>
                ) : (
                    <div className="org-grid">
                        {organizations.slice(0, 4).map((org) => (
                            <div
                                key={org.id}
                                className="org-card"
                                onClick={() => navigate(`/organizations/${org.id}/projects`)}
                            >
                                <div className="org-card-image">
                                    <div className="org-card-icon"><BuildingIcon size={24} /></div>
                                </div>
                                <div className="org-card-content">
                                    <div className="org-card-name">{org.name}</div>
                                    {org.description && (
                                        <div className="org-card-description">{org.description}</div>
                                    )}
                                    <div className="org-card-meta">
                                        <span className="org-card-meta-item">Active</span>
                                    </div>
                                </div>
                                <div className="org-card-actions" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleEdit(org)}
                                    >
                                        <EditIcon size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => handleDelete(org.id, e)}
                                    >
                                        <TrashIcon size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dashboard Grid: Agenda + Timer Side Panel */}
            <div className="dashboard-grid">
                <div className="dashboard-main">
                    {/* Active Projects Table */}
                    <div className="section">
                        <div className="section-header">
                            <h2 className="section-title">Active Projects</h2>
                        </div>
                        {activeProjects.length === 0 ? (
                            <div className="empty-state-small">
                                <FolderIcon size={24} />
                                <span>No active projects</span>
                            </div>
                        ) : (
                            <div className="projects-table">
                                <div className="table-header">
                                    <span>Project Name</span>
                                    <span>Organization</span>
                                    <span>Progress</span>
                                    <span>Due Date</span>
                                </div>
                                {activeProjects.map(project => (
                                    <div
                                        key={project.id}
                                        className="table-row"
                                        onClick={() => navigate(`/organizations/${project.org_id}/projects/${project.id}/tasks`)}
                                    >
                                        <span className="project-name">{project.name}</span>
                                        <span className="project-org">{project.org_name}</span>
                                        <span className="project-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                            <span>{project.progress}%</span>
                                        </span>
                                        <span className="project-due">{formatDate(project.due_date) || 'No date'}</span>
                                    </div>
                                ))}
                                <button className="btn btn-link view-all-btn" onClick={() => navigate('/organizations')}>
                                    View All Projects
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-sidebar">
                    {/* Today's Agenda */}
                    <div className="sidebar-card">
                        <h3 className="sidebar-card-title">Today's Agenda</h3>
                        {todayTasks.length === 0 ? (
                            <div className="empty-state-small">
                                <CheckCircleIcon size={24} />
                                <span>No tasks due today</span>
                            </div>
                        ) : (
                            <div className="agenda-list">
                                {todayTasks.map(task => (
                                    <div key={task.id} className="agenda-item">
                                        <input type="checkbox" className="agenda-checkbox" />
                                        <div className="agenda-content">
                                            <div className="agenda-title">{task.title}</div>
                                            <div className="agenda-meta">
                                                <span className={`status-badge status-${task.status}`}>{task.status}</span>
                                                {task.due_date && <span>Due {formatDate(task.due_date)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Timer */}
                    <div className="timer-card">
                        <div className="timer-header">
                            <ClockIcon size={20} />
                            <span>Track Time</span>
                        </div>
                        <input
                            type="text"
                            className="timer-input"
                            placeholder="What are you working on?"
                            value={timerDescription}
                            onChange={(e) => setTimerDescription(e.target.value)}
                        />
                        <div className="timer-display">{formatTimerTime(timerSeconds)}</div>
                        <button
                            className={`timer-btn ${timerRunning ? 'running' : ''}`}
                            onClick={() => setTimerRunning(!timerRunning)}
                        >
                            {timerRunning ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingOrg ? 'Edit Organization' : 'New Organization'}
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Acme Corp, Personal"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group mt-4">
                                <label className="input-label">Description (optional)</label>
                                <textarea
                                    className="input"
                                    placeholder="Brief description of this organization"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
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
                                    {editingOrg ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-8);
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .dashboard-greeting {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          margin-bottom: var(--space-1);
        }

        .dashboard-subtitle {
          color: var(--color-gray-500);
        }

        .dashboard-header-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .today-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .date-label {
          font-size: var(--font-size-xs);
          color: var(--color-primary-500);
          font-weight: var(--font-weight-medium);
        }

        .date-value {
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
          font-weight: var(--font-weight-medium);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }

        .section {
          margin-bottom: var(--space-8);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
        }

        .org-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-4);
        }

        .org-card {
          position: relative;
        }

        .org-card-actions {
          position: absolute;
          top: var(--space-3);
          right: var(--space-3);
          display: flex;
          gap: var(--space-1);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .org-card:hover .org-card-actions {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
          }

          .dashboard-header-right {
            width: 100%;
            justify-content: space-between;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: var(--space-6);
          margin-top: var(--space-6);
        }

        .dashboard-main {
          min-width: 0;
        }

        .dashboard-sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .sidebar-card {
          background: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .sidebar-card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-4);
        }

        .agenda-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .agenda-item {
          display: flex;
          gap: var(--space-3);
          align-items: flex-start;
        }

        .agenda-checkbox {
          margin-top: 4px;
        }

        .agenda-content {
          flex: 1;
        }

        .agenda-title {
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-900);
          margin-bottom: var(--space-1);
        }

        .agenda-meta {
          display: flex;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .timer-card {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          color: white;
        }

        .timer-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .timer-input {
          width: 100%;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-3);
          color: white;
          margin-bottom: var(--space-3);
        }

        .timer-input::placeholder {
          color: rgba(255,255,255,0.7);
        }

        .timer-display {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          font-family: monospace;
          text-align: center;
          margin-bottom: var(--space-3);
        }

        .timer-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: white;
          color: var(--color-primary-500);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin: 0 auto;
          transition: transform 0.2s;
        }

        .timer-btn:hover {
          transform: scale(1.1);
        }

        .timer-btn.running {
          background: rgba(255,255,255,0.9);
        }

        .projects-table {
          background: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr;
          padding: var(--space-3) var(--space-4);
          background: var(--color-gray-50);
          border-bottom: 1px solid var(--color-gray-200);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-500);
          text-transform: uppercase;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr;
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-gray-100);
          cursor: pointer;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: var(--color-gray-50);
        }

        .project-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-900);
        }

        .project-org {
          color: var(--color-primary-500);
        }

        .project-progress {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--color-gray-200);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary-500);
          transition: width 0.3s;
        }

        .project-due {
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
        }

        .view-all-btn {
          width: 100%;
          padding: var(--space-3);
          text-align: center;
        }

        .empty-state-small {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-6);
          color: var(--color-gray-400);
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--color-primary-500);
          cursor: pointer;
          font-weight: var(--font-weight-medium);
        }

        .btn-link:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
}
