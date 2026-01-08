import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTaskStore, type TaskWithSection } from '../../../stores/useTaskStore';
import { useProjectStore, type ProjectWithOrg } from '../../../stores/useProjectStore';
import { useOrgStore } from '../../../stores/useOrgStore';
import type { TaskFormData } from '../../../types';
import { SortIcon, PlusIcon, CloseIcon, Button, Input, Modal } from '../../../components';
import { BoardView } from '../components/BoardView';
import { ListView } from '../components/ListView';
import { TasksToolbar } from '../components/TasksToolbar';
import { ProjectHeader } from '../components/ProjectHeader';
import { TaskModal } from '../components/TaskModal';
import { TimeLogModal } from '../components/TimeLogModal';
import '../styles/TasksPage.css';

const DEFAULT_FORM_DATA: TaskFormData = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    custom_field_values: {},
};

export default function TasksPage() {
    const { projectId } = useParams<{ projectId: string }>();

    // Global Stores
    const { tasks, isLoading, error: storeError, fetchProjectTasks, createTask, updateTask, deleteTask } = useTaskStore();
    const { currentProject, fetchProjectDetails } = useProjectStore();
    const { customFields } = useOrgStore();

    // Local State
    const [project, setProject] = useState<ProjectWithOrg | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithSection | null>(null);
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState<TaskFormData>(DEFAULT_FORM_DATA);

    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('date');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Fetch project and tasks on mount
    useEffect(() => {
        if (projectId) {
            fetchProjectTasks(projectId);
            fetchProjectDetails(projectId);
        }
    }, [projectId, fetchProjectTasks, fetchProjectDetails]);

    // Sync project from store
    useEffect(() => {
        if (currentProject) {
            setProject(currentProject);
        }
    }, [currentProject]);

    const completedCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);
    const progress = useMemo(() => tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0, [tasks.length, completedCount]);

    // Filter tasks
    const filteredTasks = useMemo(() => tasks.filter((t) => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    }), [tasks, searchQuery, filterStatus]);

    // Sort tasks
    const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
        switch (sortBy) {
            case 'priority': {
                const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                return (priorityOrder[a.priority || 'medium'] ?? 2) - (priorityOrder[b.priority || 'medium'] ?? 2);
            }
            case 'name':
                return a.title.localeCompare(b.title);
            case 'date':
            default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    }), [filteredTasks, sortBy]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;

        const { custom_field_values, ...taskData } = formData;

        let success: boolean;
        if (editingTask) {
            success = await updateTask(editingTask, {
                title: taskData.title,
                description: taskData.description ? { text: taskData.description } : null,
                status: taskData.status,
                priority: taskData.priority,
                due_date: taskData.due_date || null,
            }, custom_field_values);
        } else {
            success = await createTask(
                {
                    title: taskData.title,
                    description: taskData.description ? { text: taskData.description } : null,
                    status: taskData.status,
                    priority: taskData.priority,
                    due_date: taskData.due_date || null,
                    organization_id: project?.organization_id,
                },
                projectId,
                undefined,
                custom_field_values
            );
        }

        if (success) {
            handleCloseModal();
        }
    };

    const handleEdit = (task: TaskWithSection) => {
        setEditingTask(task.id);
        const description = typeof task.description === 'object' && task.description !== null
            ? (task.description as { text?: string }).text || ''
            : '';
        setFormData({
            title: task.title,
            description,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            due_date: task.due_date?.split('T')[0] || '',
            custom_field_values: task.custom_field_values || {},
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!projectId) return;
        if (confirm('Delete this task?')) {
            await deleteTask(id, projectId);
        }
    };

    const updateStatus = async (taskId: string, newStatus: string | null) => {
        if (!newStatus) return;
        await updateTask(taskId, { status: newStatus });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setFormData(DEFAULT_FORM_DATA);
    };

    const handleOpenTimeLog = (task: TaskWithSection) => {
        setSelectedTask(task);
        setShowTimeModal(true);
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Project link copied to clipboard!');
    };

    const handleEditDetails = () => {
        setShowEditModal(true);
    };

    const editModalFooter = (
        <>
            <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                type="button"
            >
                Cancel
            </Button>
            <Button type="submit" onClick={() => setShowEditModal(false)}>
                Save Changes
            </Button>
        </>
    );

    const error = storeError;

    return (
        <div className="page-container">
            <ProjectHeader
                project={project}
                onEditDetails={handleEditDetails}
                onShare={handleShare}
                progress={progress}
            />

            <TasksToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onNewTask={() => setShowModal(true)}
                showFilterMenu={showFilterMenu}
                setShowFilterMenu={setShowFilterMenu}
                showSortMenu={showSortMenu}
                setShowSortMenu={setShowSortMenu}
            />

            {/* Tasks View */}
            {error ? (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ color: 'var(--color-error)' }}>
                        <CloseIcon size={48} />
                    </div>
                    <h3 className="empty-state-title text-error">Failed to load tasks</h3>
                    <p className="empty-state-description">
                        {error.message || 'There was an error loading your tasks. Please try again.'}
                    </p>
                    <Button variant="secondary" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            ) : isLoading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : sortedTasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><SortIcon size={48} /></div>
                    <h3 className="empty-state-title">
                        {searchQuery ? 'No tasks found' : 'No tasks yet'}
                    </h3>
                    <p className="empty-state-description">
                        {searchQuery
                            ? 'Try a different search term.'
                            : 'Create your first task to get started.'}
                    </p>
                    {!searchQuery && (
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            <PlusIcon size={16} /> Create Task
                        </Button>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                <ListView
                    tasks={sortedTasks}
                    onUpdateStatus={updateStatus}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLogTime={handleOpenTimeLog}
                />
            ) : (
                <BoardView
                    tasks={sortedTasks}
                    onUpdateStatus={updateStatus}
                    onEdit={handleEdit}
                    onLogTime={handleOpenTimeLog}
                />
            )}

            <TaskModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData as (data: TaskFormData) => void}
                isEditing={!!editingTask}
                taskId={editingTask}
                customFields={customFields}
            />

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Project Details"
                footer={editModalFooter}
            >
                <form onSubmit={(e) => { e.preventDefault(); setShowEditModal(false); }}>
                    <div className="input-group">
                        <Input
                            label="Project Name"
                            defaultValue={project?.name}
                            containerClassName="mb-0"
                            autoFocus
                        />
                    </div>
                    <div className="input-group mt-4">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input"
                            defaultValue={project?.description || ''}
                            rows={3}
                        />
                    </div>
                </form>
            </Modal>

            {showTimeModal && selectedTask && (
                <TimeLogModal
                    task={selectedTask}
                    onClose={() => {
                        setShowTimeModal(false);
                        setSelectedTask(null);
                    }}
                />
            )}
        </div>
    );
}
