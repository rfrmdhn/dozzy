import { Modal, Input, Select } from '../molecules';
import { Button } from '../atoms';
import type { Organization, Project } from '../../types';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    formData: Partial<Project>;
    setFormData: (data: Partial<Project>) => void;
    onSubmit: (e: React.FormEvent) => void;
    organizations?: Organization[];
    showOrgSelect?: boolean;
}

export function ProjectModal({
    isOpen,
    onClose,
    isEditing,
    formData,
    setFormData,
    onSubmit,
    organizations = [],
    showOrgSelect = false
}: ProjectModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Project' : 'New Project'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={(e: any) => onSubmit(e)}>
                        {isEditing ? 'Save Changes' : 'Create'}
                    </Button>
                </>
            }
        >
            <form onSubmit={onSubmit}>
                <Input
                    label="Name"
                    placeholder="Project name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                />

                {showOrgSelect && (
                    <Select
                        label="Organization"
                        value={formData.organization_id || ''}
                        onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                        options={organizations.map(org => ({ value: org.id, label: org.name }))}
                        placeholder="Select an organization"
                        containerClassName="mt-4"
                        required
                    />
                )}

                <div className="input-group mt-4">
                    <label className="input-label">Description</label>
                    <textarea
                        className="input"
                        placeholder="Brief description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className="form-row mt-4" style={{ display: 'flex', gap: '1rem' }}>
                    <Input
                        type="date"
                        label="Start Date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        containerClassName="flex-1"
                    />
                    <Input
                        type="date"
                        label="Due Date"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        containerClassName="flex-1"
                    />
                </div>
            </form>
        </Modal>
    );
}
