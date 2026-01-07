import { useState, useEffect } from 'react';
import { NavLink, useParams, useLocation, Link } from 'react-router-dom';
import {
    LayoutIcon,
    ListIcon,
    CalendarIcon,
    FileTextIcon,
    SettingsIcon,
    KanbanIcon,
    BriefcaseIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    BuildingIcon,
    FolderIcon,
    PlusIcon
} from '../atoms/icons';
import { useOrganizations } from '../../features/projects/hooks/useOrganizations';
import { useProjects } from '../../features/projects/hooks/useProjects';
import { OrganizationModal } from '../organisms';
import './styles/Sidebar.css';

export default function Sidebar() {
    const { projectId } = useParams();
    const location = useLocation();
    const { organizations } = useOrganizations();
    const { projects } = useProjects();

    // State for expanded items (both orgs and projects)
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

    // Auto-expand based on active project
    useEffect(() => {
        if (projectId && projects.length > 0) {
            const project = projects.find(p => p.id === projectId);
            if (project && project.organization_id) {
                setExpandedItems(prev => ({
                    ...prev,
                    [project.organization_id]: true, // Expand Org
                    [projectId]: true // Expand Project
                }));
            }
        }
    }, [projectId, projects]);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Dashboard & Global Links */}
                <div className="nav-group">
                    <NavLink to="/" className="nav-item level-1" end>
                        <LayoutIcon size={18} /> <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/my-work" className="nav-item level-1">
                        <ListIcon size={18} /> <span>My Work</span>
                    </NavLink>
                </div>

                <div className="sidebar-divider" />

                {/* Organizations Hierarchy */}
                <div className="nav-group">
                    <div className="nav-section-header">
                        <Link to="/" className="nav-section-title hoverable">ORGANIZATIONS</Link>
                        <button
                            className="icon-btn-small"
                            onClick={() => setIsOrgModalOpen(true)}
                            title="New Organization"
                        >
                            <PlusIcon size={14} />
                        </button>
                    </div>

                    {organizations.map(org => {
                        const orgProjects = projects.filter(p => p.organization_id === org.id);
                        const isExpanded = expandedItems[org.id];

                        return (
                            <div key={org.id} className="nav-tree-item">
                                <div
                                    className="nav-item level-1 expandable"
                                    onClick={(e) => toggleExpand(org.id, e)}
                                >
                                    <div className="nav-item-icon">
                                        {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                    </div>
                                    <BuildingIcon size={16} />
                                    <span className="truncate">{org.name}</span>
                                </div>

                                {isExpanded && (
                                    <div className="nav-children">
                                        {/* Users Page */}
                                        <NavLink to={`/organizations/${org.id}/users`} className="nav-item level-2">
                                            <UsersIcon size={16} /> <span>Team</span>
                                        </NavLink>

                                        {orgProjects.length === 0 ? (
                                            <div className="nav-item level-2 empty-state">
                                                <span>No projects</span>
                                            </div>
                                        ) : (
                                            orgProjects.map(project => {
                                                const isProjectExpanded = expandedItems[project.id];
                                                const isActive = projectId === project.id;

                                                return (
                                                    <div key={project.id}>
                                                        <div
                                                            className={`nav-item level-2 expandable ${isActive ? 'active-parent' : ''}`}
                                                            onClick={(e) => toggleExpand(project.id, e)}
                                                        >
                                                            <div className="nav-item-icon">
                                                                {isProjectExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                                            </div>
                                                            <FolderIcon size={16} />
                                                            <span className="truncate">{project.name}</span>
                                                        </div>

                                                        {isProjectExpanded && (
                                                            <div className="nav-children">
                                                                <NavLink to={`/projects/${project.id}/board`} className="nav-item level-3">
                                                                    <KanbanIcon size={14} /> <span>Board</span>
                                                                </NavLink>
                                                                <NavLink to={`/projects/${project.id}/backlog`} className="nav-item level-3">
                                                                    <ListIcon size={14} /> <span>Backlog</span>
                                                                </NavLink>
                                                                <NavLink to={`/projects/${project.id}/roadmap`} className="nav-item level-3">
                                                                    <CalendarIcon size={14} /> <span>Roadmap</span>
                                                                </NavLink>
                                                                <NavLink to={`/projects/${project.id}/code`} className="nav-item level-3">
                                                                    <FileTextIcon size={14} /> <span>Code</span>
                                                                </NavLink>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="sidebar-divider" />

                {/* Other Apps */}
                <div className="nav-group">
                    <div className="nav-section-header">
                        <div className="nav-section-title">APPS</div>
                    </div>
                    <NavLink to="/reports" className="nav-item level-1">
                        <FileTextIcon size={18} /> <span>Reports</span>
                    </NavLink>
                    <NavLink to="/timesheets" className="nav-item level-1">
                        <ClockIcon size={18} /> <span>Timesheets</span>
                    </NavLink>
                </div>

                <div className="sidebar-bottom">
                    <NavLink to="/settings" className="nav-item level-1">
                        <SettingsIcon size={18} /> <span>Settings</span>
                    </NavLink>
                </div>
            </div>

            <OrganizationModal
                isOpen={isOrgModalOpen}
                onClose={() => setIsOrgModalOpen(false)}
            />
        </aside >
    );
}
