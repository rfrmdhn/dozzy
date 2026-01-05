import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/reports', label: 'Reports', icon: '📊' },
];

export default function MainLayout() {
    const { user, signOut } = useAuth();
    const location = useLocation();

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">Dozzy</div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button className="btn btn-ghost w-full" onClick={signOut}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="sidebar-logo">Dozzy</div>
                <button className="btn btn-ghost" onClick={signOut}>
                    Sign Out
                </button>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            <style>{`
        .sidebar-footer {
          margin-top: auto;
          padding-top: var(--space-4);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .user-info {
          padding: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .user-email {
          font-size: var(--font-size-sm);
          color: var(--color-gray-400);
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: var(--space-4);
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          justify-content: space-between;
          align-items: center;
          z-index: 50;
        }

        @media (max-width: 1024px) {
          .sidebar {
            display: none;
          }

          .mobile-header {
            display: flex;
          }

          .main-content {
            padding-top: 80px;
          }
        }
      `}</style>
        </div>
    );
}
