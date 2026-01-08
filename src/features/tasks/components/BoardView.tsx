import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { TaskWithSection } from '../../../types';
import { CalendarIcon, ClockIcon, FlagIcon, Button, Card } from '../../../components';
import { getPriorityColor } from '../../../lib/utils/status';
import '../styles/BoardView.css';

interface BoardViewProps {
    tasks: TaskWithSection[];
    onUpdateStatus: (id: string, status: string | null) => void;
    onEdit: (task: TaskWithSection) => void;
    onLogTime: (task: TaskWithSection) => void;
}

const COLUMNS: { id: string; title: string }[] = [
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

        const newStatus = destination.droppableId;
        onUpdateStatus(draggableId, newStatus);
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
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <Card
                                                            className={`board-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                            onClick={() => onEdit(task)}
                                                        >
                                                            <div className="card-header">
                                                                <div className="card-labels">
                                                                    {task.tags?.map((tag: string, i: number) => (
                                                                        <span key={i} className="card-label">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="btn-icon-sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onLogTime(task);
                                                                    }}
                                                                >
                                                                    <ClockIcon size={14} />
                                                                </Button>
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
                                                        </Card>
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

        </DragDropContext>
    );
}
