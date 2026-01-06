import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

export default function MainLayout() {
    return (
        <div className="app-layout">
            <TopBar />
            <Sidebar />

            <main className="main-content">
                <Outlet />
            </main>

            <style>{`
                .app-layout {
                    min-height: 100vh;
                    background-color: var(--color-white);
                }

                .main-content {
                    margin-left: 240px; /* Sidebar width */
                    margin-top: 56px; /* TopBar height */
                    min-height: calc(100vh - 56px);
                    padding: var(--space-6);
                }

                @media (max-width: 1024px) {
                    .main-content {
                        margin-left: 0;
                    }
                }
            `}</style>
        </div>
    );
}
