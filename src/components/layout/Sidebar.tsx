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
    const { projectId } = useParams();
    const { organizations, fetchOrganizations } = useOrgStore();
    const { isSidebarOpen } = useUIStore(); // Optionally utilize sidebar toggle state

    // Local state for sidebar data to avoid conflicting with global active project list
    const [sidebarProjects, setSidebarProjects] = useState<Record<string, ProjectWithOrg[]>>({});
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const [loadingOrgs, setLoadingOrgs] = useState<Record<string, boolean>>({});

    // Initial fetch of organizations
    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    // Auto-expand based on active project params or other logic could go here
    // But since we don't know the org of the active project until we fetch it, 
    // we might need to rely on the active project store for *initial* expansion if we wanted that.
    // For now, consistent with lazy loading, we start collapsed or user manually expands.

    const handleToggleExpand = async (orgId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const isExpanding = !expandedItems[orgId];

        setExpandedItems(prev => ({
            ...prev,
            [orgId]: isExpanding
        }));

        // Fetch projects if expanding and not yet loaded
        if (isExpanding && !sidebarProjects[orgId]) {
            setLoadingOrgs(prev => ({ ...prev, [orgId]: true }));
            const { projects, error } = await projectRepository.fetchByOrg(orgId);
            setLoadingOrgs(prev => ({ ...prev, [orgId]: false }));

            if (!error && projects) {
                setSidebarProjects(prev => ({
                    ...prev,
                    [orgId]: projects as ProjectWithOrg[]
                }));
            }
        }
    };

    const toggleProjectExpand = (projId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

                        return (
                            <div key={org.id} className="nav-tree-item">
                                <div
                                    className="nav-item level-1 expandable"
                                    onClick={(e) => handleToggleExpand(org.id, e)}
                                >
                                    <div className="nav-item-icon">
                                        {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                    </div>
                                    <BuildingIcon size={16} />
                                    <span className="truncate">{org.name}</span>
                                </div>

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
                                                const isActive = projectId === project.id;

                                                return (
                                                    <div key={project.id}>
                                                        <div
                                                            className={`nav-item level-2 expandable ${isActive ? 'active-parent' : ''}`}
                                                            onClick={(e) => toggleProjectExpand(project.id, e)}
                                                        >
                                                            <div className="nav-item-icon">
                                                                {isProjectExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                                            </div>
                                                            <FolderIcon size={16} />
                                                            <span className="truncate">{project.name}</span>
                                                        </div>

                                                        {isProjectExpanded && (
                                                            <div className="nav-children">
                                                                <NavLink to={`/projects/${project.id}/tasks`} className="nav-item level-3">
                                                                    <KanbanIcon size={14} /> <span>Tasks</span>
                                                                </NavLink>
                                                                {/* Other project views can be added here */}
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
