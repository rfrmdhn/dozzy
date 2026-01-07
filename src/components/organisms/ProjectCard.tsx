import { FolderIcon, CalendarIcon, EditIcon, TrashIcon, Badge, Button } from '../atoms';

interface ProjectCardProps {
    project: any; // Using any for now to avoid rapid type refactoring, ideally Project
    progress: number;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    showOrgName?: boolean;
}

export function ProjectCard({ project, progress, onClick, onEdit, onDelete, showOrgName }: ProjectCardProps) {
    const getBadgeVariant = (prog: number) => {
        if (prog > 70) return 'active';
        if (prog > 30) return 'in_progress';
        return 'draft';
    };

    const getBadgeLabel = (prog: number) => {
        if (prog > 70) return 'Active';
        if (prog > 30) return 'In Progress';
        return 'Draft';
    };

    return (
        <div className="project-card" onClick={onClick}>
            <div className="project-card-header">
                <div className="project-card-icon"><FolderIcon size={24} /></div>
                <div className="project-card-info">
                    <h3 className="project-card-name">{project.name}</h3>
                    {showOrgName && (
                        <span className="project-card-org">
                            {project.organizations?.name || 'Unknown Org'}
                        </span>
                    )}
                    <span className="project-card-category">{project.description || 'No description'}</span>
                </div>
                <Badge variant={getBadgeVariant(progress)}>
                    {getBadgeLabel(progress)}
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
                    {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}
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
