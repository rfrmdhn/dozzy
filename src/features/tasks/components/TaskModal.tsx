import { useState } from 'react';
import type { TaskPriority, CustomField } from '../../../types';
import { Modal, Input, Select, Button } from '../../../components';
import { TaskComments } from './TaskComments';
import { TaskActivity } from './TaskActivity';

interface TaskFormData {
    title: string;
    description: string;
    status: string;
    priority: TaskPriority;
    due_date: string;
    custom_field_values?: Record<string, any>;
}

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: TaskFormData;
    setFormData: (data: any) => void;
    isEditing: boolean;
    taskId?: string | null;
    customFields?: CustomField[];
}

export function TaskModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    setFormData,
    isEditing,
    taskId,
    customFields = []
}: TaskModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

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

    const handleCustomFieldChange = (fieldId: string, value: any) => {
        setFormData({
            ...formData,
            custom_field_values: {
                ...(formData.custom_field_values || {}),
                [fieldId]: value
            }
        });
    };

    const renderCustomField = (field: CustomField) => {
        const value = formData.custom_field_values?.[field.id] || '';

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        key={field.id}
                        label={field.name}
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        containerClassName="mt-4"
                    />
                );
            case 'number':
            case 'currency':
            case 'percentage':
                return (
                    <Input
                        key={field.id}
                        label={field.name}
                        type="number"
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        containerClassName="mt-4"
                    />
                );
            case 'enum':
                const options = (field.config as any)?.options?.map((opt: string) => ({ value: opt, label: opt })) || [];
                return (
                    <Select
                        key={field.id}
                        label={field.name}
                        options={options}
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        containerClassName="mt-4"
                    />
                );
            default:
                return null;
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} type="button">
                Close
            </Button>
            {activeTab === 'details' && (
                <Button type="submit" onClick={onSubmit}>
                    {isEditing ? 'Save Changes' : 'Create Task'}
                </Button>
            )}
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Task Details' : 'New Task'}
            footer={footer}
        >
            {isEditing && (
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Comments
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'activity' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        Activity
                    </button>
                </div>
            )}

            <div className="tab-content min-h-[300px]">
                {activeTab === 'details' && (
                    <form onSubmit={onSubmit}>
                        <div className="input-group">
                            <Input
                                label="Title"
                                placeholder="Task title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                autoFocus={!isEditing}
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
                                    setFormData({ ...formData, status: e.target.value })
                                }
                                containerClassName="input-group"
                            />
                            <Select
                                label="Priority"
                                options={priorityOptions}
                                value={formData.priority || 'medium'}
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

                        {customFields.length > 0 && (
                            <>
                                <div className="divider mt-6 mb-4" />
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Fields</h4>
                                {customFields.map(renderCustomField)}
                            </>
                        )}
                    </form>
                )}

                {activeTab === 'comments' && taskId && (
                    <TaskComments taskId={taskId} />
                )}

                {activeTab === 'activity' && taskId && (
                    <TaskActivity taskId={taskId} />
                )}
            </div>
        </Modal>
    );
}
