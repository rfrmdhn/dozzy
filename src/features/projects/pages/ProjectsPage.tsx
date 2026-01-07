import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizations';
import { useProjects } from '../hooks/useProjects';
import { supabase } from '../../../lib/supabase';
import type { ProjectInput, Organization } from '../../../types';
import { FolderIcon, PlusIcon } from '../../../components';
import '../styles/ProjectsPage.css';

// Components
import { ProjectMembersModal } from '../components/ProjectMembersModal';

export default function ProjectsPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { projects, isLoading, create, update, remove } = useProjects(orgId);
    const { organizations } = useOrganizations();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showOrgEditModal, setShowOrgEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    // State for managing members
    const [managingProject, setManagingProject] = useState<any | null>(null); // Ideally Project type

    // ... existing ... (lines 22-73)
    const [orgFormData, setOrgFormData] = useState({ name: '', description: '' });
    const [formData, setFormData] = useState<ProjectInput>({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        organization_id: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        // ...
        // ...
        // ... (existing code)
        if (orgId) {
            supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .single()
                .then(({ data }) => setOrganization(data));
        }
    }, [orgId]);

    // Calculate project progress based on tasks
    const calculateProgress = (tasks?: { status: string }[]) => {
        if (!tasks || tasks.length === 0) return 0;
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        return Math.round((completed / total) * 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingProject) {
            await update(editingProject, formData);
        } else {
            const orgIdToUse = orgId || formData.organization_id;
            if (!orgIdToUse) {
                alert('Please select an organization');
                return;
            }
            await create({ ...formData, organization_id: orgIdToUse });
        }
        handleCloseModal();
    };

    const handleOrgEditSubmit = async (data: { name: string; description: string }) => {
        if (!orgId) return;
        await supabase
            .from('organizations')
            .update(data)
            .eq('id', orgId);
        setOrganization(prev => prev ? { ...prev, ...data } : null);
        setShowOrgEditModal(false);
    };

    const handleEdit = (project: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project.id);
        setFormData({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            organization_id: project.organization_id,
        });
        setShowModal(true);
    };

    const handleManageMembers = (project: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setManagingProject(project);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this project? All tasks will be removed.')) {
            await remove(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({ name: '', description: '', start_date: '', end_date: '', organization_id: '' });
    };

    const handleNewProject = () => {
        setEditingProject(null);
        setFormData({ name: '', description: '', start_date: '', end_date: '', organization_id: '' });
        setShowModal(true);
    };

    const openOrgEdit = () => {
        if (organization) {
            setOrgFormData({ name: organization.name, description: organization.description || '' });
            setShowOrgEditModal(true);
        }
    };

    // Filter and Sort Logic
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="page-container">
            {/* Breadcrumb ... (unchanged) */}
            <div className="breadcrumb">
                <Link to="/">Home</Link>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{orgId ? (organization?.name || 'Organization') : 'All Projects'}</span>
            </div>

            <OrgHeader
                organization={organization}
                orgId={orgId}
                projectCount={projects.length}
                onEditOrg={openOrgEdit}
            />

            <ProjectsToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onNewProject={handleNewProject}
            />

            {/* Projects Grid */}
            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FolderIcon size={48} /></div>
                    <h3 className="empty-state-title">No projects yet</h3>
                    <p className="empty-state-description">
                        Create your first project to start tracking tasks.
                    </p>
                    <Button variant="primary" onClick={handleNewProject} leftIcon={<PlusIcon size={16} />}>
                        Create Project
                    </Button>
                </div>
            ) : (
                <div className="projects-grid">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            progress={calculateProgress(project.tasks)}
                            onClick={() => navigate(`/projects/${project.id}/tasks`)}
                            onEdit={(e) => handleEdit(project, e)}
                            onManageMembers={(e) => handleManageMembers(project, e)}
                            onDelete={(e) => handleDelete(project.id, e)}
                            showOrgName={!orgId}
                        />
                    ))}

                    {/* Add New Project Card */}
                    <div className="project-card add-new" onClick={handleNewProject}>
                        <div className="add-new-icon">
                            <PlusIcon size={24} />
                        </div>
                        <div className="add-new-text">Create New Project</div>
                        <div className="add-new-subtext">Start a new initiative</div>
                    </div>
                </div>
            )}

            <ProjectModal
                isOpen={showModal}
                onClose={handleCloseModal}
                isEditing={!!editingProject}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                organizations={organizations}
                showOrgSelect={!orgId}
            />

            <OrgEditModal
                isOpen={showOrgEditModal}
                onClose={() => setShowOrgEditModal(false)}
                initialData={orgFormData}
                onSubmit={handleOrgEditSubmit}
            />

            {/* Project Members Modal */}
            {managingProject && (
                <ProjectMembersModal
                    isOpen={!!managingProject}
                    onClose={() => setManagingProject(null)}
                    project={managingProject}
                />
            )}
        </div>
    );
}
