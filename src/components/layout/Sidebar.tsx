import { useState, useEffect } from 'react';
import { NavLink, useParams, Link } from 'react-router-dom';
import {
    LayoutIcon,
    ListIcon,
    // CalendarIcon, // Removed unused
    FileTextIcon,
    SettingsIcon,
    KanbanIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    BuildingIcon,
    FolderIcon,
    PlusIcon,
    UsersIcon
} from '../atoms/icons';
import { useOrgStore } from '../../stores/useOrgStore';
import { useUIStore } from '../../stores/useUIStore';
import { projectRepository, type ProjectWithOrg } from '../../lib/repositories';
import { OrganizationModal } from '../organisms';
import './styles/Sidebar.css';

export default function Sidebar() {
    const { projectId, orgId } = useParams(); // Get orgId from params as well
    const { organizations, fetchOrganizations } = useOrgStore();
    const { isSidebarOpen } = useUIStore();

    // Local state 
    const [sidebarProjects, setSidebarProjects] = useState<Record<string, ProjectWithOrg[]>>({});
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const [loadingOrgs, setLoadingOrgs] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    // Helper to fetch projects for an org
    const loadProjects = async (organizationId: string) => {
        if (sidebarProjects[organizationId]) return; // Already loaded

        setLoadingOrgs(prev => ({ ...prev, [organizationId]: true }));
        const { projects, error } = await projectRepository.fetchByOrg(organizationId);
        setLoadingOrgs(prev => ({ ...prev, [organizationId]: false }));

        if (!error && projects) {
            setSidebarProjects(prev => ({
                ...prev,
                [organizationId]: projects as ProjectWithOrg[]
            }));
        }
    };

    const toggleOrgExpand = async (organizationId: string) => {
        const isExpanding = !expandedItems[organizationId];

        setExpandedItems(prev => ({
            ...prev,
            [organizationId]: isExpanding
        }));

        if (isExpanding) {
            await loadProjects(organizationId);
        }
    };

    const toggleProjectExpand = (projId: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [projId]: !prev[projId]
        }));
    };

    if (!isSidebarOpen) return null;

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
                        const orgProjects = sidebarProjects[org.id] || [];
                        const isExpanded = expandedItems[org.id];
                        const isLoading = loadingOrgs[org.id];
                        // Active if current param matches orgId
                        const isActive = orgId === org.id;

                        return (
                            <div key={org.id} className="nav-tree-item">
                                {/* Organization Item */}
                                <NavLink
                                    to={`/organizations/${org.id}/projects`}
                                    className={`nav-item level-1 expandable ${isActive ? 'active' : ''}`}
                                    onClick={(e) => {
                                        // If clicking the link, ensure it's expanded
                                        if (!isExpanded) {
                                            toggleOrgExpand(org.id);
                                        }
                                    }}
                                >
                                    {/* Toggle Icon Block */}
                                    <div
                                        className="nav-item-icon"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleOrgExpand(org.id);
                                        }}
                                    >
                                        {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                    </div>
                                    <BuildingIcon size={16} />
                                    <span className="truncate">{org.name}</span>
                                </NavLink>

                                {isExpanded && (
                                    <div className="nav-children">
                                        {/* Team Link */}
                                        <NavLink to={`/organizations/${org.id}/users`} className="nav-item level-2">
                                            <UsersIcon size={16} /> <span>Team</span>
                                        </NavLink>

                                        {isLoading ? (
                                            <div className="nav-item level-2 text-muted">Loading...</div>
                                        ) : orgProjects.length === 0 ? (
                                            <div className="nav-item level-2 empty-state">
                                                <span>No projects</span>
                                            </div>
                                        ) : (
                                            orgProjects.map(project => {
                                                const isProjectExpanded = expandedItems[project.id];
                                                const isProjectActive = projectId === project.id; // Correct param check

                                                return (
                                                    <div key={project.id}>
                                                        <NavLink
                                                            to={`/projects/${project.id}/tasks`}
                                                            className={`nav-item level-2 expandable ${isProjectActive ? 'active-parent' : ''}`}
                                                            onClick={(e) => {
                                                                if (!isProjectExpanded) toggleProjectExpand(project.id);
                                                            }}
                                                        >
                                                            <div
                                                                className="nav-item-icon"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    toggleProjectExpand(project.id);
                                                                }}
                                                            >
                                                                {isProjectExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                                            </div>
                                                            <FolderIcon size={16} />
                                                            <span className="truncate">{project.name}</span>
                                                        </NavLink>

                                                        {isProjectExpanded && (
                                                            <div className="nav-children">
                                                                <NavLink to={`/projects/${project.id}/tasks`} className="nav-item level-3">
                                                                    <KanbanIcon size={14} /> <span>Tasks</span>
                                                                </NavLink>
                                                                {/* Potential future sub-items: Reports, Settings etc */}
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
