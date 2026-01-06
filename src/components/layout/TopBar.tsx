import { Link } from 'react-router-dom';
import { SearchIcon, SettingsIcon, BellIcon, HelpCircleIcon, GridIcon } from '../icons';

export default function TopBar() {
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
                    <div className="nav-item">Your Work</div>
                    <div className="nav-item">Projects</div>
                    <div className="nav-item">Filters</div>
                    <div className="nav-item">Dashboards</div>
                    <div className="nav-item">People</div>
                    <div className="nav-item dropdown-trigger">Apps</div>
                </nav>
                <button className="btn btn-primary btn-sm create-btn">Create</button>
            </div>

            <div className="topbar-right">
                <div className="search-container">
                    <SearchIcon size={16} className="search-icon" />
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <button className="btn btn-icon"><BellIcon size={20} /></button>
                <button className="btn btn-icon"><HelpCircleIcon size={20} /></button>
                <button className="btn btn-icon"><SettingsIcon size={20} /></button>
                <div className="user-avatar">U</div>
            </div>

            <style>{`
                .topbar {
                    height: 56px;
                    background: var(--color-white);
                    border-bottom: 1px solid var(--color-gray-200);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 var(--space-4);
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                }

                .topbar-left {
                    display: flex;
                    align-items: center;
                    gap: var(--space-4);
                }

                .app-switcher {
                    color: var(--color-gray-500);
                    cursor: pointer;
                    padding: 4px;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    text-decoration: none;
                    color: var(--color-primary-600);
                    font-weight: bold;
                    margin-right: var(--space-2);
                }

                .logo-icon {
                    width: 24px;
                    height: 24px;
                    background: var(--color-primary-600);
                    color: white;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }

                .topbar-nav {
                    display: flex;
                    gap: var(--space-1);
                }

                .nav-item {
                    padding: var(--space-2) var(--space-3);
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--color-gray-600);
                    cursor: pointer;
                    border-radius: 4px;
                }

                .nav-item:hover {
                    background: var(--color-gray-100);
                    color: var(--color-primary-600);
                }

                .create-btn {
                    margin-left: var(--space-2);
                }

                .topbar-right {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                }

                .search-container {
                    position: relative;
                    margin-right: var(--space-2);
                }

                .search-input {
                    padding: 6px 12px 6px 32px;
                    border: 1px solid var(--color-gray-200);
                    border-radius: 4px;
                    font-size: 14px;
                    width: 200px;
                    transition: width 0.2s;
                }

                .search-input:focus {
                    width: 280px;
                    border-color: var(--color-primary-500);
                    outline: none;
                }

                .search-icon {
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-gray-400);
                    pointer-events: none;
                }

                .btn-icon {
                    background: none;
                    border: none;
                    color: var(--color-gray-500);
                    padding: 6px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-icon:hover {
                    background: var(--color-gray-100);
                    color: var(--color-gray-700);
                }

                .user-avatar {
                    width: 28px;
                    height: 28px;
                    background: var(--color-primary-100);
                    color: var(--color-primary-700);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 600;
                    margin-left: var(--space-2);
                    border: 2px solid var(--color-white);
                    box-shadow: 0 0 0 1px var(--color-gray-200);
                }
            `}</style>
        </header>
    );
}
