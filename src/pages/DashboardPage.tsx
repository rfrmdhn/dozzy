import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { OrganizationInput } from '../types';

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
                        + New Organization
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Hours Logged</span>
                        <div className="stat-card-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-500)' }}>⏱️</div>
                    </div>
                    <div className="stat-card-value">{formatTime(stats.totalTime)}</div>
                    <div className="stat-card-change positive">↗ +12% this week</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Active Orgs</span>
                        <div className="stat-card-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>🏢</div>
                    </div>
                    <div className="stat-card-value">{stats.activeOrgs}</div>
                    <div className="stat-card-change">Across all workspaces</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Pending Tasks</span>
                        <div className="stat-card-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>📋</div>
                    </div>
                    <div className="stat-card-value">{stats.pendingTasks}</div>
                    <div className="stat-card-change">Needs attention</div>
                </div>
            </div>

            {/* Organizations Section */}
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Your Organizations</h2>
                    <button className="btn btn-ghost" onClick={() => navigate('/organizations')}>
                        View All
                    </button>
                </div>

                {isLoading ? (
                    <div className="empty-state">
                        <div className="loading-spinner" />
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏢</div>
                        <h3 className="empty-state-title">No organizations yet</h3>
                        <p className="empty-state-description">
                            Create your first organization to start managing projects and tasks.
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Create Organization
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
                                    <div className="org-card-icon">🏢</div>
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
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => handleDelete(org.id, e)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
        }
      `}</style>
        </div>
    );
}
