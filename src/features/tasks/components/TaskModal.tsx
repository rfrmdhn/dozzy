import type { TaskInput, TaskStatus, TaskPriority } from '../../../types';

import { Modal, Input, Select, Button } from '../../../components';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: Omit<TaskInput, 'project_id'>;
    setFormData: (data: Omit<TaskInput, 'project_id'>) => void;
    isEditing: boolean;
}

export function TaskModal({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }: TaskModalProps) {
    const statusOptions = [
        { value: 'todo', label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'done', label: 'Done' },
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
    ];

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} type="button">
                Cancel
            </Button>
            <Button type="submit" onClick={onSubmit}>
                {isEditing ? 'Save' : 'Create'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Task' : 'New Task'}
            footer={footer}
        >
            <form onSubmit={onSubmit}>
                <div className="input-group">
                    <Input
                        label="Title"
                        placeholder="Task title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        autoFocus
                    />
                </div>
                <div className="input-group mt-4">
                    <label className="input-label">Description</label>
                    <textarea
                        className="input"
                        placeholder="Task details"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                    />
                </div>
                <div className="form-row mt-4">
                    <Select
                        label="Status"
                        options={statusOptions}
                        value={formData.status}
                        onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value as TaskStatus })
                        }
                        containerClassName="input-group"
                    />
                    <Select
                        label="Priority"
                        options={priorityOptions}
                        value={formData.priority}
                        onChange={(e) =>
                            setFormData({ ...formData, priority: e.target.value as TaskPriority })
                        }
                        containerClassName="input-group"
                    />
                </div>
                <div className="input-group mt-4">
                    <Input
                        label="Due Date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) =>
                            setFormData({ ...formData, due_date: e.target.value })
                        }
                    />
                </div>
            </form>
        </Modal>
    );
}
