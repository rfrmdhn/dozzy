import { FolderIcon, CalendarIcon, EditIcon, TrashIcon, Badge, Button } from '../atoms';
import { getProjectStatusBadge } from '../../lib/utils/status';
import { formatDate } from '../../lib/utils/date';
import type { ProjectWithOrg } from '../../types';

interface ProjectCardProps {
    project: ProjectWithOrg;
    progress: number;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    showOrgName?: boolean;
}

export function ProjectCard({ project, progress, onClick, onEdit, onDelete, showOrgName }: ProjectCardProps) {
    const statusBadge = getProjectStatusBadge(project.status);

    return (
        <div className="project-card" onClick={onClick}>
            <div className="project-card-header">
                <div className="project-card-icon"><FolderIcon size={24} /></div>
                <div className="project-card-info">
                    <h3 className="project-card-name">{project.name}</h3>
                    {showOrgName && (
                        <span className="project-card-org">
                            {project.organization?.name || 'Unknown Org'}
                        </span>
                    )}
                    <span className="project-card-category">{project.description || 'No description'}</span>
                </div>
                <Badge variant={statusBadge.variant as 'active' | 'done' | 'warning' | 'neutral'}>
                    {statusBadge.label}
                </Badge>
            </div>

            {project.description && (
                <p className="project-card-description">{project.description}</p>
            )}

            <div className="project-card-progress">
                <div className="progress-label">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="progress-bar-container">
                    <div
                        className={`progress-bar ${progress > 70 ? 'success' : progress < 30 ? 'warning' : ''}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="project-card-footer">
                <div className="project-card-date">
                    <CalendarIcon size={14} />
                    {project.due_date ? formatDate(project.due_date) : 'No due date'}
                </div>
                <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={onEdit} className="px-1">
                        <EditIcon size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDelete} className="px-1">
                        <TrashIcon size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
