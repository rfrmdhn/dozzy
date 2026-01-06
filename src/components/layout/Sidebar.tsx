import { NavLink, useParams } from 'react-router-dom';
import {
    LayoutIcon,
    ListIcon,
    CalendarIcon,
    FileTextIcon,
    SettingsIcon,
    ChevronLeftIcon,
    KanbanIcon,
    BriefcaseIcon,
    ClockIcon
} from '../icons';

export default function Sidebar() {
    const { projectId } = useParams();

    // Contextual Navigation Logic
    const isProjectContext = !!projectId;

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {isProjectContext ? (
                    // Project Context Navigation
                    <div className="nav-group">
                        <div className="nav-group-header">
                            <div className="project-icon-placeholder">P</div>
                            <div className="project-info">
                                <div className="project-name">Project Name</div>
                                <div className="project-key">Software Project</div>
                            </div>
                        </div>

                        <div className="nav-section">
                            <div className="nav-section-title">PLANNING</div>
                            <NavLink to={`/projects/${projectId}/board`} className="nav-item">
                                <KanbanIcon size={18} /> <span>Board</span>
                            </NavLink>
                            <NavLink to={`/projects/${projectId}/backlog`} className="nav-item">
                                <ListIcon size={18} /> <span>Backlog</span>
                            </NavLink>
                            <NavLink to={`/projects/${projectId}/roadmap`} className="nav-item">
                                <CalendarIcon size={18} /> <span>Roadmap</span>
                            </NavLink>
                        </div>

                        <div className="nav-section">
                            <div className="nav-section-title">DEVELOPMENT</div>
                            <NavLink to={`/projects/${projectId}/code`} className="nav-item">
                                <FileTextIcon size={18} /> <span>Code</span>
                            </NavLink>
                        </div>
                    </div>
                ) : (
                    // Global/Dashboard Context Navigation
                    <div className="nav-group">
                        <div className="nav-section">
                            <NavLink to="/" className="nav-item" end>
                                <LayoutIcon size={18} /> <span>Dashboard</span>
                            </NavLink>
                            <NavLink to="/projects" className="nav-item">
                                <BriefcaseIcon size={18} /> <span>Projects</span>
                            </NavLink>
                            <NavLink to="/my-work" className="nav-item">
                                <ListIcon size={18} /> <span>My Work</span>
                            </NavLink>
                        </div>
                        <div className="nav-section">
                            <div className="nav-section-title">APPS</div>
                            <NavLink to="/reports" className="nav-item">
                                <FileTextIcon size={18} /> <span>Reports</span>
                            </NavLink>
                            <NavLink to="/timesheets" className="nav-item">
                                <ClockIcon size={18} /> <span>Timesheets</span>
                            </NavLink>
                        </div>
                    </div>
                )}

                <div className="sidebar-bottom">
                    <NavLink to="/settings" className="nav-item">
                        <SettingsIcon size={18} /> <span>Project Settings</span>
                    </NavLink>
                    <button className="collapse-btn">
                        <ChevronLeftIcon size={16} />
                    </button>
                </div>
            </div>

            <style>{`
                .sidebar {
                    width: 240px;
                    background: var(--color-gray-50);
                    border-right: 1px solid var(--color-gray-200);
                    height: calc(100vh - 56px); /* Subtract TopBar height */
                    position: fixed;
                    top: 56px;
                    left: 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-content {
                    padding: var(--space-4) var(--space-2);
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .nav-group-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin-bottom: var(--space-6);
                    padding: 0 var(--space-2);
                }

                .project-icon-placeholder {
                    width: 32px;
                    height: 32px;
                    background: var(--color-primary-600);
                    color: white;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                .project-info {
                    overflow: hidden;
                }

                .project-name {
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--color-gray-900);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .project-key {
                    font-size: 12px;
                    color: var(--color-gray-500);
                }

                .nav-section {
                    margin-bottom: var(--space-6);
                }

                .nav-section-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--color-gray-500);
                    margin-bottom: var(--space-2);
                    padding-left: var(--space-3);
                    letter-spacing: 0.5px;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    padding: var(--space-2) var(--space-3);
                    color: var(--color-gray-600);
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 14px;
                    margin-bottom: 2px;
                    transition: background 0.1s;
                }

                .nav-item:hover {
                    background: var(--color-gray-200);
                    color: var(--color-gray-900);
                }

                .nav-item.active {
                    background: var(--color-primary-50);
                    color: var(--color-primary-700);
                    font-weight: 500;
                }
                
                .nav-item.active svg {
                    color: var(--color-primary-600);
                }

                .sidebar-bottom {
                    margin-top: auto;
                    padding-top: var(--space-4);
                    border-top: 1px solid var(--color-gray-200);
                }

                .collapse-btn {
                    position: absolute;
                    bottom: var(--space-4);
                    right: -12px;
                    width: 24px;
                    height: 24px;
                    background: var(--color-white);
                    border: 1px solid var(--color-gray-200);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .sidebar:hover .collapse-btn {
                    opacity: 1;
                }
            `}</style>
        </aside>
    );
}
