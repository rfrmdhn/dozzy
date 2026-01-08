import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTaskStore } from '../../../stores/useTaskStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useOrgStore } from '../../../stores/useOrgStore';
import { supabase } from '../../../lib/supabase';
import type { Organization, TaskWithSection } from '../../../types';
import { SortIcon, PlusIcon, CloseIcon, Button, Input, Modal } from '../../../components';
import { BoardView } from '../components/BoardView';
import { ListView } from '../components/ListView';
import { TasksToolbar } from '../components/TasksToolbar';
import { ProjectHeader } from '../components/ProjectHeader';
import { TaskModal } from '../components/TaskModal';
import { TimeLogModal } from '../components/TimeLogModal';
import '../styles/TasksPage.css';

// Type shim to handle legacy component expectations
type UI_Task = TaskWithSection;

export default function TasksPage() {
    const { projectId } = useParams<{ projectId: string }>();

    // Global Stores
    const { tasks, isLoading, fetchProjectTasks, createTask, updateTask } = useTaskStore();
    useProjectStore(); // Subscribe to project changes
    const { customFields } = useOrgStore();

    // Local State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [project, setProject] = useState<any | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_organization, setOrganization] = useState<Organization | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<UI_Task | null>(null);
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        custom_field_values: {}
    });

    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('date');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initial Fetch
    useEffect(() => {
        if (projectId) {
            fetchProjectTasks(projectId);

            supabase
                .from('projects')
                .select('*, organizations(*)')
                .eq('id', projectId)
                .single()
                .then(({ data, error }) => {
                    if (data) {
                        setProject(data);
                        setOrganization(data.organizations as any);
                    }
                    if (error) setError(error);
                });
        }
    }, [projectId, fetchProjectTasks]);

    const completedCount = tasks.filter((t) => t.status === 'done').length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    const filteredTasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;

        try {
            const { custom_field_values, ...taskData } = formData;

            if (editingTask) {
                await updateTask(editingTask, taskData, custom_field_values);
            } else {
                await createTask({ ...taskData, organization_id: project?.organization_id }, projectId, undefined, custom_field_values);
            }
            handleCloseModal();
        } catch (err) {
            console.error('Task operation failed', err);
        }
    };

    const handleEdit = (task: UI_Task) => {
        setEditingTask(task.id);
        setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date?.split('T')[0] || '',
            custom_field_values: (task as any).custom_field_values || {}
        });
        setShowModal(true);
    };

    const handleDelete = async (_id: string) => {
        if (confirm('Delete this task?')) {
            // TODO: await remove(_id);
            console.warn('Remove task not implemented in store yet');
        }
    };

    const updateStatus = async (taskId: string, newStatus: string | null) => {
        if (!newStatus) return;
        await updateTask(taskId, { status: newStatus });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
            custom_field_values: {}
        });
    };

    const handleOpenTimeLog = (task: UI_Task) => {
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
            ) : filteredTasks.length === 0 ? (
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
                    tasks={filteredTasks}
                    onUpdateStatus={updateStatus}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLogTime={handleOpenTimeLog}
                />
            ) : (
                <BoardView
                    tasks={filteredTasks}
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
                setFormData={setFormData}
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
