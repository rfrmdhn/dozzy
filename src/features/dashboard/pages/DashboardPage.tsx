import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrgStore } from '../../../stores/useOrgStore';
import { organizationRepository } from '../../../lib/repositories';
import { getGreeting, formatDateTime } from '../../../lib/utils/date';
import type { Organization, OrganizationFormData } from '../../../types';
import { PlusIcon, Button, Input, Modal } from '../../../components';
import { DashboardStatsSection } from '../components/DashboardStats';
import { OrganizationsSection } from '../components/OrganizationsSection';
import { ActiveProjectsTable } from '../components/ActiveProjectsTable';
import { TodayAgenda } from '../components/TodayAgenda';
import { QuickTimer } from '../components/QuickTimer';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { useActiveProjects } from '../hooks/useActiveProjects';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { organizations, isLoading: orgsLoading, fetchOrganizations, createOrganization, updateOrganization, deleteOrganization } = useOrgStore();

    // Custom hooks for data fetching
    const { stats } = useDashboardStats({ userId: user?.id, orgCount: organizations.length });
    const { tasks: todayTasks, isLoading: todayLoading } = useTodayTasks({ userId: user?.id });
    const { projects: activeProjects, isLoading: projectsLoading } = useActiveProjects({ userId: user?.id });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<string | null>(null);
    const [formData, setFormData] = useState<OrganizationFormData>({
        name: '',
        description: '',
    });

    // Organization stats
    const [orgStats, setOrgStats] = useState<Record<string, { projectCount: number; memberCount: number }>>({});

    const greeting = getGreeting();
    const userName = user?.email?.split('@')[0] || 'User';

    // Fetch organizations on mount
    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    // Fetch organization stats
    useEffect(() => {
        async function fetchOrgStats() {
            if (organizations.length === 0) return;

            const orgIds = organizations.map(o => o.id);
            const { stats: fetchedStats } = await organizationRepository.fetchWithStats(orgIds);
            setOrgStats(fetchedStats);
        }

        fetchOrgStats();
    }, [organizations]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingOrg) {
            await updateOrganization(editingOrg, { name: formData.name });
        } else if (user) {
            await createOrganization(formData.name, user.id);
        }
        handleCloseModal();
    };

    const handleEdit = (org: Organization) => {
        setEditingOrg(org.id);
        setFormData({
            name: org.name,
            description: (org as { description?: string }).description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this organization? All projects and tasks will be removed.')) {
            await deleteOrganization(id);
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
                        <span className="date-value">{formatDateTime(new Date().toISOString())}</span>
                    </div>
                    <Button variant="primary" onClick={() => navigate('/projects')}>
                        <PlusIcon size={16} /> New Task
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <DashboardStatsSection stats={stats} orgCount={organizations.length} />

            {/* Main Content Grid */}
            <div className="dashboard-content-grid">
                {/* Left Side: Orgs + Projects */}
                <div className="dashboard-main-content">
                    {/* Organizations Section */}
                    <OrganizationsSection
                        organizations={organizations}
                        orgStats={orgStats}
                        isLoading={orgsLoading}
                        onCreateOrg={() => setShowModal(true)}
                        onEditOrg={handleEdit}
                        onDeleteOrg={handleDelete}
                    />

                    {/* Active Projects Table */}
                    <ActiveProjectsTable
                        projects={activeProjects}
                        isLoading={projectsLoading}
                    />
                </div>

                {/* Right Sidebar: Agenda + Timer */}
                <div className="dashboard-sidebar">
                    {/* Today's Agenda */}
                    <TodayAgenda tasks={todayTasks} isLoading={todayLoading} />

                    {/* Quick Timer */}
                    <QuickTimer />
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
