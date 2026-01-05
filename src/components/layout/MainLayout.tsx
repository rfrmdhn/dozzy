import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/organizations', label: 'Organizations', icon: '🏢' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function MainLayout() {
    const { user, signOut } = useAuth();
    const location = useLocation();

    const getInitials = (email: string) => {
        return email?.substring(0, 2).toUpperCase() || 'U';
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo-icon">✓</div>
                    <div>
                        <div className="sidebar-logo-text">Dozzy</div>
                        <div className="sidebar-logo-subtext">Task Manager</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {getInitials(user?.email || '')}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">
                                {user?.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="sidebar-user-email">{user?.email}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost w-full mt-4" onClick={signOut}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-logo">
                    <span className="sidebar-logo-icon">✓</span>
                    <span className="sidebar-logo-text">Dozzy</span>
                </div>
                <button className="btn btn-ghost" onClick={signOut}>
                    Sign Out
                </button>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            <style>{`
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: var(--space-4);
          background: var(--color-white);
          border-bottom: 1px solid var(--color-gray-200);
          justify-content: space-between;
          align-items: center;
          z-index: 50;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .mobile-logo .sidebar-logo-icon {
          width: 32px;
          height: 32px;
          font-size: 1rem;
        }

        @media (max-width: 1024px) {
          .sidebar {
            display: none;
          }

          .mobile-header {
            display: flex;
          }

          .main-content {
            padding-top: 70px;
          }
        }
      `}</style>
        </div>
    );
}
