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
} from '../atoms/icons';
import './styles/Sidebar.css';

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


        </aside>
    );
}
