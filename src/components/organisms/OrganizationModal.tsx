import { useState, useEffect } from 'react';
import { Button } from '../atoms';
import { Modal, Input } from '../molecules';
import { useOrganizations } from '../../features/projects/hooks/useOrganizations';

interface OrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    organization?: { id: string; name: string; description?: string }; // If provided, edit mode
    onSuccess?: () => void;
}

export function OrganizationModal({ isOpen, onClose, organization, onSuccess }: OrganizationModalProps) {
    const { create, update } = useOrganizations();
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (organization) {
            setFormData({ name: organization.name, description: organization.description || '' });
        } else {
            setFormData({ name: '', description: '' });
        }
    }, [organization, isOpen]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;

        setIsLoading(true);
        try {
            if (organization) {
                await update(organization.id, formData);
            } else {
                await create(formData);
            }
            if (onSuccess) onSuccess();
            onClose();
            // Reset form if creating
            if (!organization) setFormData({ name: '', description: '' });
        } catch (error) {
            console.error('Error saving organization:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isEditMode = !!organization;
    const title = isEditMode ? 'Edit Organization' : 'Add New Organization';
    const submitText = isEditMode ? 'Save Changes' : 'Create Organization';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={isLoading || !formData.name.trim()}>
                        {isLoading ? 'Saving...' : submitText}
                    </Button>
                </>
            }
        >
            <div className="modal-description">
                Organizations help you group projects and team members together in one workspace.
            </div>

            <div className="form-field">
                <label className="form-label">
                    Organization Name <span className="required">*</span>
                </label>
                <Input
                    placeholder="e.g. Acme Corp Design Team"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                />
            </div>

            <div className="form-field">
                <label className="form-label">
                    Description <span className="optional">(Optional)</span>
                </label>
                <textarea
                    className="input textarea"
                    placeholder="Briefly describe what this organization manages..."
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    disabled={isLoading}
                />
            </div>
        </Modal>
    );
}
