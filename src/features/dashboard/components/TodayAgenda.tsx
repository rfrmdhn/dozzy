import { CheckCircleIcon, Card, Badge } from '../../../components';
import type { AgendaTask } from '../../../types';

interface TodayAgendaProps {
    tasks: AgendaTask[];
    isLoading: boolean;
}

type BadgeVariant = 'primary' | 'warning' | 'info' | 'neutral';

function getTypeBadgeVariant(type: AgendaTask['type']): BadgeVariant {
    switch (type) {
        case 'design': return 'primary';
        case 'meeting': return 'warning';
        case 'admin': return 'neutral';
        default: return 'info';
    }
}

export function TodayAgenda({ tasks, isLoading }: TodayAgendaProps) {
    if (isLoading) {
        return (
            <div className="sidebar-section">
                <div className="sidebar-header-row">
                    <h3 className="sidebar-title">Today's Agenda</h3>
                </div>
                <div className="empty-state-small">
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="sidebar-section">
            <div className="sidebar-header-row">
                <h3 className="sidebar-title">Today's Agenda</h3>
            </div>
            {tasks.length === 0 ? (
                <Card className="empty-agenda-card">
                    <div className="empty-state-small">
                        <CheckCircleIcon size={24} />
                        <span>No tasks due today</span>
                    </div>
                </Card>
            ) : (
                <div className="agenda-list">
                    {tasks.map(task => (
                        <Card key={task.id} className="agenda-card">
                            <input type="checkbox" className="agenda-checkbox" />
                            <div className="agenda-content">
                                <div className="agenda-title">{task.title}</div>
                                <div className="agenda-meta">
                                    <Badge variant={getTypeBadgeVariant(task.type)} size="sm">
                                        {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                                    </Badge>
                                    {task.due_time && (
                                        <span className={`agenda-time ${task.priority === 'high' ? 'agenda-time--urgent' : ''}`}>
                                            • {task.priority === 'high' ? 'Due ' : ''}{task.due_time}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
