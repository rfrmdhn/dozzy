import { Modal } from '../molecules/Modal';
import { Button } from '../atoms/Button';
import { Input } from '../molecules/Input';
import { useState, useEffect } from 'react';

interface OrgEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: { name: string; description: string };
    onSubmit: (data: { name: string; description: string }) => void;
}

export function OrgEditModal({ isOpen, onClose, initialData, onSubmit }: OrgEditModalProps) {
    const [formData, setFormData] = useState(initialData);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Organization"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit}>Save Changes</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <Input
                    label="Name"
                    placeholder="Organization name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                />

                <div className="input-group mt-4">
                    <label className="input-label">Description</label>
                    <textarea
                        className="input"
                        placeholder="Brief description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                </div>
            </form>
        </Modal>
    );
}
