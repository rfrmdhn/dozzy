import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../../projects/hooks/useOrganizations';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ClockIcon, BuildingIcon, CheckCircleIcon, FolderIcon, PlusIcon, PlayIcon, PauseIcon, ArrowUpIcon, Button, Card, Input, Modal, Badge } from '../../../components';
import { OrganizationCard } from '../../../components/molecules';
import '../styles/DashboardPage.css';

// Local type for org form (extends schema which lacks description)
interface OrgFormData {
    name: string;
    description: string;
}

// Types for dashboard data
interface ActiveProject {
    id: string;
    name: string;
    org_name: string;
    org_id: string;
    progress: number;
    due_date?: string;
}

interface AgendaTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    project_name?: string;
    due_date?: string;
    due_time?: string;
    type: 'design' | 'meeting' | 'admin' | 'task';
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { organizations, isLoading, create, update, remove } = useOrganizations();
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<string | null>(null);
    const [stats, setStats] = useState({ totalTime: 0, activeOrgs: 0, pendingTasks: 0, highPriorityCount: 0, weeklyChange: 0 });
    const [formData, setFormData] = useState<OrgFormData>({
        name: '',
        description: '',
    });
    const [todayTasks, setTodayTasks] = useState<AgendaTask[]>([]);
    const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
    const [orgStats, setOrgStats] = useState<Record<string, { projectCount: number; memberCount: number }>>({});
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

            // Get high priority pending tasks
            const { count: highPriorityCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'done')
                .eq('priority', 'high');

            // Get time logs total
            const { data: timeLogs } = await supabase
                .from('time_logs')
                .select('duration');

            const totalMinutes = timeLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;

            // Get time logged this week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: weekLogs } = await supabase
                .from('time_logs')
                .select('duration')
                .gte('created_at', weekAgo.toISOString());

            const weekMinutes = weekLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;

            // Calculate rough weekly change percentage
            const previousWeekMinutes = totalMinutes - weekMinutes;
            const weeklyChange = previousWeekMinutes > 0
                ? Math.round(((weekMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)
                : weekMinutes > 0 ? 100 : 0;

            setStats({
                totalTime: totalMinutes,
                activeOrgs: organizations.length,
                pendingTasks: taskCount || 0,
                highPriorityCount: highPriorityCount || 0,
                weeklyChange,
            });
        }

        fetchStats();
    }, [user, organizations.length]);

    // Fetch organization stats (project count per org)
    useEffect(() => {
        async function fetchOrgStats() {
            if (!user || organizations.length === 0) return;

            const orgIds = organizations.map(o => o.id);
            const { data: projects } = await supabase
                .from('projects')
                .select('organization_id')
                .in('organization_id', orgIds);

            if (projects) {
                const counts: Record<string, { projectCount: number; memberCount: number }> = {};
                orgIds.forEach(id => {
                    counts[id] = {
                        projectCount: projects.filter(p => p.organization_id === id).length,
                        memberCount: 1, // Single user app for now
                    };
                });
                setOrgStats(counts);
            }
        }

        fetchOrgStats();
    }, [user, organizations]);

    // Fetch today's tasks and active projects with real progress
    useEffect(() => {
        async function fetchTodayData() {
            if (!user) return;

            // Get tasks due today or overdue
            const today = new Date().toISOString().split('T')[0];
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title, status, priority, due_date, labels, projects(name)')
                .lte('due_date', today + 'T23:59:59')
                .neq('status', 'done')
                .limit(5);

            if (tasks) {
                setTodayTasks(tasks.map(t => {
                    const proj = t.projects as unknown as { name: string } | null;
                    // Determine task type from labels or priority
                    let type: AgendaTask['type'] = 'task';
                    const labels = t.labels || [];
                    if (labels.includes('design') || labels.includes('Design')) type = 'design';
                    else if (labels.includes('meeting') || labels.includes('Meeting')) type = 'meeting';
                    else if (labels.includes('admin') || labels.includes('Admin')) type = 'admin';

                    // Format due time
                    let due_time = '';
                    if (t.due_date) {
                        const date = new Date(t.due_date);
                        due_time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    }

                    return {
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        priority: t.priority,
                        project_name: proj?.name,
                        due_date: t.due_date,
                        due_time,
                        type,
                    };
                }));
            }

            // Get active projects with real progress calculation
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name, end_date, organizations(id, name)')
                .limit(5);

            if (projects) {
                const projectsWithProgress: ActiveProject[] = await Promise.all(
                    projects.map(async (p) => {
                        const org = p.organizations as unknown as { id: string; name: string } | null;

                        // Calculate real progress from tasks
                        const { count: totalTasks } = await supabase
                            .from('tasks')
                            .select('*', { count: 'exact', head: true })
                            .eq('project_id', p.id);

                        const { count: doneTasks } = await supabase
                            .from('tasks')
                            .select('*', { count: 'exact', head: true })
                            .eq('project_id', p.id)
                            .eq('status', 'done');

                        const progress = totalTasks && totalTasks > 0
                            ? Math.round((doneTasks || 0) / totalTasks * 100)
                            : 0;

                        return {
                            id: p.id,
                            name: p.name,
                            org_name: org?.name || 'Unknown',
                            org_id: org?.id || '',
                            progress,
                            due_date: p.end_date,
                        };
                    })
                );
                setActiveProjects(projectsWithProgress);
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

    function getProgressColor(progress: number): string {
        if (progress >= 70) return 'var(--color-primary-500)';
        if (progress >= 40) return 'var(--color-purple-500, #8b5cf6)';
        return 'var(--color-warning, #f97316)';
    }

    function getTypeBadgeVariant(type: AgendaTask['type']): 'primary' | 'warning' | 'info' | 'neutral' {
        switch (type) {
            case 'design': return 'primary';
            case 'meeting': return 'warning';
            case 'admin': return 'neutral';
            default: return 'info';
        }
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

    const handleEdit = (org: any) => {
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

    const modalFooter = (
        <>
            <Button
                variant="secondary"
                onClick={handleCloseModal}
                type="button"
            >
                Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit}>
                {editingOrg ? 'Save Changes' : 'Create'}
            </Button>
        </>
    );

    return (
        <div className="page-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-greeting">
                        {greeting}, {userName}
                    </h1>
                    <p className="dashboard-subtitle">
                        You have {stats.pendingTasks} tasks due today. Stay productive!
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
                    <Button variant="primary" onClick={() => navigate('/projects')}>
                        <PlusIcon size={16} /> New Task
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Hours Logged</span>
                        <div className="stat-card-icon stat-card-icon--primary"><ClockIcon size={20} /></div>
                    </div>
                    <div className="stat-card-value">{formatTime(stats.totalTime)}</div>
                    <div className={`stat-card-change ${stats.weeklyChange >= 0 ? 'positive' : 'negative'}`}>
                        <ArrowUpIcon size={14} /> {stats.weeklyChange >= 0 ? '+' : ''}{stats.weeklyChange}% this week
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Active Orgs</span>
                        <div className="stat-card-icon stat-card-icon--info"><BuildingIcon size={20} /></div>
                    </div>
                    <div className="stat-card-value">{stats.activeOrgs}</div>
                    <div className="stat-card-change">Across {organizations.length > 1 ? `${organizations.length} workspaces` : '1 workspace'}</div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Pending Tasks</span>
                        <div className="stat-card-icon stat-card-icon--warning"><CheckCircleIcon size={20} /></div>
                    </div>
                    <div className="stat-card-value">{stats.pendingTasks}</div>
                    <div className="stat-card-change">{stats.highPriorityCount} High Priority</div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content-grid">
                {/* Left Side: Orgs + Projects */}
                <div className="dashboard-main-content">
                    {/* Organizations Section */}
                    <div className="section">
                        <div className="section-header">
                            <h2 className="section-title">Your Organizations</h2>
                            {organizations.length > 0 && (
                                <Button variant="link" onClick={() => navigate('/organizations')} className="view-all-btn">
                                    View All
                                </Button>
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
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <PlusIcon size={16} /> Create Organization
                                </Button>
                            </div>
                        ) : (
                            <div className="org-grid">
                                {organizations.slice(0, 2).map((org, index) => (
                                    <OrganizationCard
                                        key={org.id}
                                        id={org.id}
                                        name={org.name}
                                        description={(org as any).description || ''}
                                        variant={index % 2 === 0 ? 'dark' : 'teal'}
                                        projectCount={orgStats[org.id]?.projectCount || 0}
                                        memberCount={orgStats[org.id]?.memberCount || 1}
                                        onClick={() => navigate(`/organizations/${org.id}/projects`)}
                                        onEdit={() => handleEdit(org)}
                                        onDelete={(e) => handleDelete(org.id, e)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

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
                                        onClick={() => navigate(`/projects/${project.id}/tasks`)}
                                    >
                                        <span className="project-name">{project.name}</span>
                                        <span className="project-org">{project.org_name}</span>
                                        <span className="project-progress">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${project.progress}%`,
                                                        backgroundColor: getProgressColor(project.progress)
                                                    }}
                                                ></div>
                                            </div>
                                            <span>{project.progress}%</span>
                                        </span>
                                        <span className="project-due">{formatDate(project.due_date) || 'No date'}</span>
                                    </div>
                                ))}
                                <Button variant="link" className="view-all-btn" onClick={() => navigate('/projects')}>
                                    View All Projects
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Agenda + Timer */}
                <div className="dashboard-sidebar">
                    {/* Today's Agenda */}
                    <div className="sidebar-section">
                        <div className="sidebar-header-row">
                            <h3 className="sidebar-title">Today's Agenda</h3>
                        </div>
                        {todayTasks.length === 0 ? (
                            <Card className="empty-agenda-card">
                                <div className="empty-state-small">
                                    <CheckCircleIcon size={24} />
                                    <span>No tasks due today</span>
                                </div>
                            </Card>
                        ) : (
                            <div className="agenda-list">
                                {todayTasks.map(task => (
                                    <Card key={task.id} className="agenda-card">
                                        <input type="checkbox" className="agenda-checkbox" />
                                        <div className="agenda-content">
                                            <div className="agenda-title">{task.title}</div>
                                            <div className="agenda-meta">
                                                <Badge variant={getTypeBadgeVariant(task.type)} size="sm">
                                                    {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                                                </Badge>
                                                {task.due_time && (
                                                    <span className={`agenda-time ${task.priority === 'high' ? 'agenda-time--urgent' : ''}`}>
                                                        • {task.priority === 'high' ? 'Due ' : ''}{task.due_time}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Timer */}
                    <Card className="timer-card">
                        <div className="timer-header">
                            <ClockIcon size={20} />
                            <span>Track Time</span>
                            <button className="timer-menu-btn">•••</button>
                        </div>
                        <Input
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
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingOrg ? 'Edit Organization' : 'New Organization'}
                footer={modalFooter}
            >
                <div className="input-field-group">
                    <Input
                        label="Name"
                        placeholder="e.g., Acme Corp, Personal"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        autoFocus
                    />
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
                </div>
            </Modal>
        </div>
    );
}
