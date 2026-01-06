import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { supabase } from '../../../lib/supabase';
import type { ProjectInput, Organization } from '../../../types';
import { BuildingIcon, CalendarIcon, UsersIcon, EditIcon, FolderIcon, PlusIcon, FilterIcon, SortIcon, SearchIcon, GridIcon, ListIcon, TrashIcon } from '../../../components/icons';
import '../styles/ProjectsPage.css';

export default function ProjectsPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { projects, isLoading, create, update, remove } = useProjects(orgId);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showOrgEditModal, setShowOrgEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [orgFormData, setOrgFormData] = useState({ name: '', description: '' });
    const [formData, setFormData] = useState<Omit<ProjectInput, 'organization_id'>>({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    useEffect(() => {
        if (orgId) {
            supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .single()
                .then(({ data }) => setOrganization(data));
        }
    }, [orgId]);

    // Calculate project progress (mock based on tasks)
    const getProjectProgress = () => Math.floor(Math.random() * 100);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        if (editingProject) {
            await update(editingProject, formData);
        } else {
            await create({ ...formData, organization_id: orgId });
        }
        handleCloseModal();
    };

    const handleEdit = (project: {
        id: string;
        name: string;
        description: string | null;
        start_date: string | null;
        end_date: string | null;
    }, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project.id);
        setFormData({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
        });
        setShowModal(true);
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
        setFormData({ name: '', description: '', start_date: '', end_date: '' });
    };

    return (
        <div className="page-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <Link to="/">Home</Link>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{organization?.name || 'Organization'}</span>
            </div>

            {/* Organization Header */}
            <div className="org-header">
                <div className="org-header-icon">
                    <BuildingIcon size={32} />
                </div>
                <div className="org-header-content">
                    <h1 className="org-header-title">{organization?.name || 'Organization'}</h1>
                    {organization?.description && (
                        <p className="org-header-description">{organization.description}</p>
                    )}
                    <div className="org-header-meta">
                        <span><CalendarIcon size={14} /> Created {organization?.created_at ? new Date(organization.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                        <span><UsersIcon size={14} /> {projects.length} Projects</span>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={() => {
                    if (organization) {
                        setOrgFormData({ name: organization.name, description: organization.description || '' });
                        setShowOrgEditModal(true);
                    }
                }}>
                    <EditIcon size={16} /> Edit Org
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <SearchIcon size={18} />
                <input
                    type="text"
                    placeholder="Search projects, tasks, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="dropdown">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowFilterMenu(!showFilterMenu)}>
                            <FilterIcon size={16} /> Filter
                        </button>
                        {showFilterMenu && (
                            <div className="dropdown-menu">
                                <button className={`dropdown-item ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}>All</button>
                                <button className={`dropdown-item ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => { setFilterStatus('active'); setShowFilterMenu(false); }}>Active</button>
                                <button className={`dropdown-item ${filterStatus === 'draft' ? 'active' : ''}`} onClick={() => { setFilterStatus('draft'); setShowFilterMenu(false); }}>Draft</button>
                                <button className={`dropdown-item ${filterStatus === 'delayed' ? 'active' : ''}`} onClick={() => { setFilterStatus('delayed'); setShowFilterMenu(false); }}>Delayed</button>
                            </div>
                        )}
                    </div>
                    <div className="dropdown">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowSortMenu(!showSortMenu)}>
                            <SortIcon size={16} /> Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Progress'}
                        </button>
                        {showSortMenu && (
                            <div className="dropdown-menu">
                                <button className={`dropdown-item ${sortBy === 'recent' ? 'active' : ''}`} onClick={() => { setSortBy('recent'); setShowSortMenu(false); }}>Recent</button>
                                <button className={`dropdown-item ${sortBy === 'name' ? 'active' : ''}`} onClick={() => { setSortBy('name'); setShowSortMenu(false); }}>Name</button>
                                <button className={`dropdown-item ${sortBy === 'progress' ? 'active' : ''}`} onClick={() => { setSortBy('progress'); setShowSortMenu(false); }}>Progress</button>
                            </div>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button className={`btn btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><GridIcon size={18} /></button>
                        <button className={`btn btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListIcon size={18} /></button>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <PlusIcon size={16} /> New Project
                </button>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FolderIcon size={48} /></div>
                    <h3 className="empty-state-title">No projects yet</h3>
                    <p className="empty-state-description">
                        Create your first project to start tracking tasks.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <PlusIcon size={16} /> Create Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => {
                        const progress = getProjectProgress();
                        return (
                            <div
                                key={project.id}
                                className="project-card"
                                onClick={() => navigate(`/projects/${project.id}/tasks`)}
                            >
                                <div className="project-card-header">
                                    <div className="project-card-icon"><FolderIcon size={24} /></div>
                                    <div className="project-card-info">
                                        <h3 className="project-card-name">{project.name}</h3>
                                        <span className="project-card-category">{project.description || 'No description'}</span>
                                    </div>
                                    <span className={`badge ${progress > 50 ? 'badge-active' : 'badge-draft'}`}>
                                        {progress > 70 ? 'Active' : progress > 30 ? 'In Progress' : 'Draft'}
                                    </span>
                                </div>

                                {project.description && (
                                    <p className="project-card-description">{project.description}</p>
                                )}

                                <div className="project-card-progress">
                                    <div className="progress-label">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className={`progress-bar ${progress > 70 ? 'success' : progress < 30 ? 'warning' : ''}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="project-card-footer">
                                    <div className="project-card-date">
                                        <CalendarIcon size={14} /> {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}
                                    </div>
                                    <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => handleEdit(project, e)}
                                        >
                                            <EditIcon size={16} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => handleDelete(project.id, e)}
                                        >
                                            <TrashIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Project Card */}
                    <div className="project-card add-new" onClick={() => setShowModal(true)}>
                        <div className="add-new-icon">
                            <PlusIcon size={24} />
                        </div>
                        <div className="add-new-text">Create New Project</div>
                        <div className="add-new-subtext">Start a new initiative</div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingProject ? 'Edit Project' : 'New Project'}
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
                                    placeholder="Project name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group mt-4">
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Brief description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="form-row mt-4">
                                <div className="input-group">
                                    <label className="input-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, start_date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">End Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.end_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, end_date: e.target.value })
                                        }
                                    />
                                </div>
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
                                    {editingProject ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Org Edit Modal */}
            {showOrgEditModal && (
                <div className="modal-overlay" onClick={() => setShowOrgEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Organization</h2>
                            <button className="modal-close" onClick={() => setShowOrgEditModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!orgId) return;
                            await supabase
                                .from('organizations')
                                .update(orgFormData)
                                .eq('id', orgId);
                            setOrganization(prev => prev ? { ...prev, ...orgFormData } : null);
                            setShowOrgEditModal(false);
                        }}>
                            <div className="input-group">
                                <label className="input-label">Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Organization name"
                                    value={orgFormData.name}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group mt-4">
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Brief description"
                                    value={orgFormData.description}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowOrgEditModal(false)}
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


        </div>
    );
}
