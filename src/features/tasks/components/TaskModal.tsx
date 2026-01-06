import type { TaskInput, TaskStatus, TaskPriority } from '../../../types';
import { CloseIcon } from '../../../components/icons';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: Omit<TaskInput, 'project_id'>;
    setFormData: (data: Omit<TaskInput, 'project_id'>) => void;
    isEditing: boolean;
}

export function TaskModal({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }: TaskModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <CloseIcon size={20} />
                    </button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="input-group">
                        <label className="input-label">Title</label>
                        <input
                            type="text"
                            className="input"
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
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select
                                className="input"
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({ ...formData, status: e.target.value as TaskStatus })
                                }
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Priority</label>
                            <select
                                className="input"
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({ ...formData, priority: e.target.value as TaskPriority })
                                }
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group mt-4">
                        <label className="input-label">Due Date</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.due_date}
                            onChange={(e) =>
                                setFormData({ ...formData, due_date: e.target.value })
                            }
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Save' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
