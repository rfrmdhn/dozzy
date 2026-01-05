import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizations';
import type { OrganizationInput } from '../types';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { organizations, isLoading, create, update, remove } = useOrganizations();
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<string | null>(null);
    const [formData, setFormData] = useState<OrganizationInput>({
        name: '',
        description: '',
    });

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

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this organization? All projects and tasks will be deleted.')) {
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
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="text-muted">Manage your organizations and track progress</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Organization
                </button>
            </div>

            {isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : organizations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📁</div>
                    <h3 className="empty-state-title">No organizations yet</h3>
                    <p className="empty-state-description">
                        Create your first organization to start managing projects and tasks.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Create Organization
                    </button>
                </div>
            ) : (
                <div className="content-grid">
                    {organizations.map((org) => (
                        <div
                            key={org.id}
                            className="card card-interactive"
                            onClick={() => navigate(`/organizations/${org.id}/projects`)}
                        >
                            <div className="card-header">
                                <h3 className="card-title">{org.name}</h3>
                                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleEdit(org)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(org.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            {org.description && (
                                <p className="card-description">{org.description}</p>
                            )}
                            <div className="card-footer">
                                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                                    Created {new Date(org.created_at).toLocaleDateString()}
                                </span>
                            </div>
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
                                    placeholder="e.g., Work, Personal"
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
        .card-actions {
          display: flex;
          gap: var(--space-1);
        }
      `}</style>
        </div>
    );
}
