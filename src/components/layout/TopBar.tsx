import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SearchIcon, BellIcon, HelpCircleIcon, GridIcon, LogOutIcon, UserIcon, SettingsIcon } from '../icons';
import './styles/TopBar.css';

export default function TopBar() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="app-switcher">
                    <GridIcon size={20} />
                </div>
                <Link to="/" className="logo">
                    <div className="logo-icon">D</div>
                    <span className="logo-text">Dozzy</span>
                </Link>
                <nav className="topbar-nav">
                    <Link to="/my-work" className="nav-item">Your Work</Link>
                    <Link to="/projects" className="nav-item">Projects</Link>
                    <div className="nav-item">Filters</div>
                    <Link to="/" className="nav-item">Dashboards</Link>
                    <div className="nav-item">People</div>
                    <div className="nav-item dropdown-trigger">Apps</div>
                </nav>
                <button className="btn btn-primary btn-sm create-btn" onClick={() => navigate('/projects/new')}>Create</button>
            </div>

            <div className="topbar-right">
                <div className="search-container">
                    <SearchIcon size={16} className="search-icon" />
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <button className="btn btn-icon" title="Notifications"><BellIcon size={20} /></button>
                <button className="btn btn-icon" title="Help"><HelpCircleIcon size={20} /></button>

                <div className="user-menu-container" ref={menuRef}>
                    <div
                        className="user-avatar"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        {userInitials}
                    </div>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <div className="user-dropdown-header">
                                <span className="user-email">{user?.email}</span>
                            </div>
                            <div className="user-dropdown-divider" />
                            <Link
                                to="/settings"
                                className="user-dropdown-item"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <SettingsIcon size={16} />
                                <span>Settings</span>
                            </Link>
                            <Link
                                to="/profile"
                                className="user-dropdown-item"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <UserIcon size={16} />
                                <span>Profile</span>
                            </Link>
                            <div className="user-dropdown-divider" />
                            <button className="user-dropdown-item danger" onClick={handleLogout}>
                                <LogOutIcon size={16} />
                                <span>Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>


        </header>
    );
}
