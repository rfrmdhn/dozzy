import { useNavigate } from 'react-router-dom';
import { FolderIcon, Button } from '../../../components';
import { formatDate } from '../../../lib/utils/date';
import { getProgressColor } from '../../../lib/utils/status';
import type { ActiveProject } from '../../../types';

interface ActiveProjectsTableProps {
    projects: ActiveProject[];
    isLoading: boolean;
}

export function ActiveProjectsTable({ projects, isLoading }: ActiveProjectsTableProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Active Projects</h2>
                </div>
                <div className="empty-state-small">
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="section">
            <div className="section-header">
                <h2 className="section-title">Active Projects</h2>
            </div>
            {projects.length === 0 ? (
                <div className="empty-state-small">
                    <FolderIcon size={24} />
                    <span>No active projects</span>
                </div>
            ) : (
                <div className="projects-table">
                    <div className="table-header">
                        <span>Project Name</span>
                        <span>Organization</span>
                        <span>Progress</span>
                        <span>Due Date</span>
                    </div>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className="table-row"
                            onClick={() => navigate(`/projects/${project.id}/tasks`)}
                        >
                            <span className="project-name">{project.name}</span>
                            <span className="project-org">{project.org_name}</span>
                            <span className="project-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${project.progress}%`,
                                            backgroundColor: getProgressColor(project.progress)
                                        }}
                                    ></div>
                                </div>
                                <span>{project.progress}%</span>
                            </span>
                            <span className="project-due">{formatDate(project.due_date) || 'No date'}</span>
                        </div>
                    ))}
                    <Button variant="link" className="view-all-btn" onClick={() => navigate('/projects')}>
                        View All Projects
                    </Button>
                </div>
            )}
        </div>
    );
}
