import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { type Task, type TaskStatus, type TaskPriority } from '../../types';
import { CalendarIcon, ClockIcon, FlagIcon } from '../icons';

interface BoardViewProps {
    tasks: Task[];
    onUpdateStatus: (id: string, status: TaskStatus) => void;
    onEdit: (task: Task) => void;
    onLogTime: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
];

export function BoardView({ tasks, onUpdateStatus, onEdit, onLogTime }: BoardViewProps) {
    const onDragEnd = (result: DropResult) => {
        const { destination, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === result.source.droppableId &&
            destination.index === result.source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as TaskStatus;
        onUpdateStatus(draggableId, newStatus);
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'high': return 'var(--color-error)';
            case 'medium': return 'var(--color-warning)';
            case 'low': return 'var(--color-success)';
            default: return 'var(--color-gray-400)';
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="board-container">
                {COLUMNS.map((column) => {
                    const columnTasks = tasks.filter((task) => task.status === column.id);

                    return (
                        <div key={column.id} className="board-column">
                            <div className="column-header">
                                <h3 className="column-title">
                                    {column.title} <span className="column-count">{columnTasks.length}</span>
                                </h3>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {columnTasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        className={`board-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => onEdit(task)}
                                                    >
                                                        <div className="card-header">
                                                            <div className="card-labels">
                                                                {task.labels?.map((label, i) => (
                                                                    <span key={i} className="card-label">
                                                                        {label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <button
                                                                className="btn-icon-sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onLogTime(task);
                                                                }}
                                                            >
                                                                <ClockIcon size={14} />
                                                            </button>
                                                        </div>
                                                        <h4 className={`card-title ${task.status === 'done' ? 'completed' : ''}`}>
                                                            {task.title}
                                                        </h4>
                                                        <div className="card-footer">
                                                            <div className="card-meta">
                                                                <FlagIcon size={14} style={{ color: getPriorityColor(task.priority) }} />
                                                                {task.due_date && (
                                                                    <span className="card-date">
                                                                        <CalendarIcon size={14} />
                                                                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
            <style>{`
                .board-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: var(--space-4);
                    height: calc(100vh - 280px); /* Approximate height */
                    overflow-x: auto;
                    padding-bottom: var(--space-4);
                }

                .board-column {
                    background: var(--color-gray-50);
                    border-radius: var(--radius-lg);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .column-header {
                    padding: var(--space-4);
                    border-bottom: 1px solid var(--color-gray-200);
                }

                .column-title {
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-gray-700);
                    text-transform: uppercase;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .column-count {
                    background: var(--color-gray-200);
                    color: var(--color-gray-600);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: var(--font-size-xs);
                }

                .column-content {
                    flex: 1;
                    padding: var(--space-3);
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-3);
                }

                .column-content.dragging-over {
                    background: var(--color-gray-100);
                }

                .board-card {
                    background: var(--color-white);
                    border: 1px solid var(--color-gray-200);
                    border-radius: var(--radius-md);
                    padding: var(--space-3);
                    box-shadow: var(--shadow-sm);
                    cursor: grab;
                    transition: box-shadow 0.2s, transform 0.2s;
                }

                .board-card:hover {
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-primary-200);
                }

                .board-card.dragging {
                    box-shadow: var(--shadow-lg);
                    transform: rotate(2deg);
                    border-color: var(--color-primary-500);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: var(--space-2);
                }

                .card-labels {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                }

                .card-label {
                    font-size: 10px;
                    background: var(--color-primary-50);
                    color: var(--color-primary-600);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: var(--font-weight-medium);
                }

                .card-title {
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-gray-900);
                    margin-bottom: var(--space-3);
                    line-height: 1.4;
                }

                .card-title.completed {
                    text-decoration: line-through;
                    color: var(--color-gray-500);
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .card-meta {
                    display: flex;
                    gap: var(--space-3);
                    align-items: center;
                }

                .card-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: var(--font-size-xs);
                    color: var(--color-gray-500);
                }

                .btn-icon-sm {
                    background: none;
                    border: none;
                    color: var(--color-gray-400);
                    cursor: pointer;
                    padding: 2px;
                    border-radius: 4px;
                }

                .btn-icon-sm:hover {
                    background: var(--color-gray-100);
                    color: var(--color-gray-600);
                }

                @media (max-width: 768px) {
                    .board-container {
                        grid-template-columns: 1fr;
                        height: auto;
                        overflow-x: hidden;
                    }
                    
                    .board-column {
                        height: auto;
                        min-height: 200px;
                    }
                }
            `}</style>
        </DragDropContext>
    );
}
