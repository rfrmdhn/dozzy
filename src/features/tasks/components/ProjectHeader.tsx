import { Link } from 'react-router-dom';
import type { Project } from '../../../types';
import { BuildingIcon, EditIcon, ShareIcon } from '../../../components/atoms/icons';

interface ProjectHeaderProps {
    project: Project | null;
    onEditDetails: () => void;
    onShare: () => void;
    progress: number;
}

export function ProjectHeader({ project, onEditDetails, onShare, progress }: ProjectHeaderProps) {
    return (
        <>
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <BuildingIcon size={16} />
                <Link to="/">Organization</Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{project?.name || 'Project'}</span>
            </div>

            {/* Project Header */}
            <div className="project-header">
                <div className="project-header-content">
                    <h1 className="project-header-title">{project?.name || 'Project'}</h1>
                    {project?.description && (
                        <p className="project-header-description">{project.description}</p>
                    )}
                </div>
                <div className="project-header-actions">
                    <button className="btn btn-secondary" onClick={onEditDetails}>
                        <EditIcon size={16} /> Edit Details
                    </button>
                    <button className="btn btn-secondary" onClick={onShare}>
                        <ShareIcon size={16} /> Share
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="project-progress">
                <div className="progress-header">
                    <span>Project Progress</span>
                    <span className="progress-value">{progress}%</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </>
    );
}
