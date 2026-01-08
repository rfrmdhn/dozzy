import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useOrgStore } from '../../../stores/useOrgStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { Project } from '../../../types';
import { FolderIcon, PlusIcon } from '../../../components';
import '../styles/ProjectsPage.css';

// Components
import { Button, OrgHeader, ProjectsToolbar, ProjectCard, ProjectModal, OrgEditModal } from '../../../components';
// import { ProjectMembersModal } from '../components/ProjectMembersModal'; // Commented out until refactored

export default function ProjectsPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    // Store hooks
    const { projects, isLoading, fetchProjects, createProject } = useProjectStore();
    const { organizations, fetchOrganizations, setCurrentOrg } = useOrgStore();
    const { user } = useAuthStore();

    const [showModal, setShowModal] = useState(false);
    const [showOrgEditModal, setShowOrgEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [orgFormData, setOrgFormData] = useState({ name: '', description: '' });

    // Form Data
    const [formData, setFormData] = useState<Partial<Project>>({
        name: '',
        description: '',
        start_date: null,
        due_date: null,
        organization_id: '',
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch Initial Data
    useEffect(() => {
        if (orgId) {
            fetchProjects(orgId);
            // Ensure orgs are loaded to find the current one
            if (organizations.length === 0) fetchOrganizations();
        }
    }, [orgId, fetchProjects, organizations.length, fetchOrganizations]);

    // Find current organization object
    const organization = organizations.find(o => o.id === orgId) || null;

    // Derived state
    const calculateProgress = (_project: Project) => {
        // TODO: Implement proper progress calculation from store derived data
        return 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingProject) {
            // await update(editingProject, formData); // TODO: Implement update in store
            alert('Update project not implemented yet');
        } else {
            const orgIdToUse = orgId || formData.organization_id;
            if (!orgIdToUse || !user) {
                alert('Please select an organization');
                return;
            }

            await createProject({
                ...formData,
                organization_id: orgIdToUse,
                owner_id: user.id
            });
        }
        handleCloseModal();
    };

    const handleOrgEditSubmit = async (_data: { name: string; description: string }) => {
        // TODO: Implement update org
        console.warn('Update org not implemented');
        setShowOrgEditModal(false);
    };

    const handleEdit = (project: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project.id);
        setFormData({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date || null,
            due_date: project.due_date || null,
            organization_id: project.organization_id,
        });
        setShowModal(true);
    };

    const handleDelete = async (_id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this project? All tasks will be removed.')) {
            // await remove(_id); // TODO: Implement remove in store
            console.warn('Delete project not implemented');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({ name: '', description: '', start_date: null, due_date: null, organization_id: '' });
    };

    const handleNewProject = () => {
        setEditingProject(null);
        setFormData({ name: '', description: '', start_date: null, due_date: null, organization_id: orgId || '' });
        setShowModal(true);
    };

    const openOrgEdit = () => {
        if (organization) {
            setOrgFormData({ name: organization.name, description: '' }); // description missing in type
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
            {/* Breadcrumb */}
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
                            progress={calculateProgress(project)} // Todo: Link tasks count
                            onClick={() => navigate(`/projects/${project.id}/tasks`)}
                            onEdit={(e) => handleEdit(project, e)}
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
        </div>
    );
}
