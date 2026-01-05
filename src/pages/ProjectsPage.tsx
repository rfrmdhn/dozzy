import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import type { ProjectInput, Organization } from '../types';

export default function ProjectsPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { projects, isLoading, create, update, remove } = useProjects(orgId);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<ProjectInput, 'organization_id'>>({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
    });

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
    }) => {
        setEditingProject(project.id);
        setFormData({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure? All tasks will be deleted.')) {
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
            <div className="breadcrumb">
                <Link to="/">Dashboard</Link>
                <span className="breadcrumb-separator">/</span>
                <span>{organization?.name || 'Projects'}</span>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{organization?.name || 'Projects'}</h1>
                    <p className="text-muted">Manage projects in this organization</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Project
                </button>
            </div>

            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <h3 className="empty-state-title">No projects yet</h3>
                    <p className="empty-state-description">
                        Create your first project to start tracking tasks.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="content-grid">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="card card-interactive"
                            onClick={() => navigate(`/projects/${project.id}/tasks`)}
                        >
                            <div className="card-header">
                                <h3 className="card-title">{project.name}</h3>
                                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleEdit(project)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(project.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            {project.description && (
                                <p className="card-description">{project.description}</p>
                            )}
                            {(project.start_date || project.end_date) && (
                                <div className="project-dates">
                                    {project.start_date && (
                                        <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                                    )}
                                    {project.end_date && (
                                        <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
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

            <style>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
          font-size: var(--font-size-sm);
          color: var(--color-gray-400);
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

        .card-actions {
          display: flex;
          gap: var(--space-1);
        }

        .project-dates {
          display: flex;
          gap: var(--space-4);
          margin-top: var(--space-3);
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
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
