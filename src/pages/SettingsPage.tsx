import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SettingsIcon, UserIcon, BellIcon, EyeIcon, LogOutIcon } from '../components/icons';

type SettingsTab = 'general' | 'notifications' | 'appearance';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        updates: false,
    });
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="page-container">
            <div className="settings-header">
                <div className="header-icon">
                    <SettingsIcon size={32} />
                </div>
                <div className="header-content">
                    <h1 className="header-title">Settings</h1>
                    <p className="header-description">Manage your account and application preferences</p>
                </div>
            </div>

            <div className="settings-layout">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <button
                        className={`sidebar-item ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <UserIcon size={20} />
                        <span>General</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <BellIcon size={20} />
                        <span>Notifications</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        <EyeIcon size={20} />
                        <span>Appearance</span>
                    </button>

                    <div className="sidebar-divider" />

                    <button className="sidebar-item danger" onClick={handleLogout}>
                        <LogOutIcon size={20} />
                        <span>Log Out</span>
                    </button>
                </div>

                {/* Content */}
                <div className="settings-content">
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <h2 className="section-title">Profile Information</h2>
                            <div className="form-group">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={user?.email || ''}
                                    disabled
                                />
                                <span className="help-text">Your email address is managed via Supabase Auth</span>
                            </div>
                            <div className="form-group mt-4">
                                <label className="label">User ID</label>
                                <code className="code-block">{user?.id}</code>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h2 className="section-title">Notification Preferences</h2>
                            <div className="toggle-group">
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <div className="toggle-label">Email Notifications</div>
                                        <div className="toggle-desc">Receive updates via email</div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={notifications.email}
                                            onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <div className="toggle-label">Push Notifications</div>
                                        <div className="toggle-desc">Receive real-time alerts</div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={notifications.push}
                                            onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="settings-section">
                            <h2 className="section-title">Theme Settings</h2>
                            <div className="theme-options">
                                <div
                                    className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <div className="theme-preview light"></div>
                                    <span>Light Mode</span>
                                </div>
                                <div
                                    className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <div className="theme-preview dark"></div>
                                    <span>Dark Mode</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .settings-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-4);
                    margin-bottom: var(--space-8);
                }

                .header-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 64px;
                    height: 64px;
                    background: var(--color-primary-100);
                    color: var(--color-primary-600);
                    border-radius: var(--radius-xl);
                }

                .header-title {
                    font-size: var(--font-size-2xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-gray-900);
                    margin-bottom: var(--space-1);
                }

                .header-description {
                    color: var(--color-gray-500);
                }

                .settings-layout {
                    display: grid;
                    grid-template-columns: 240px 1fr;
                    gap: var(--space-8);
                    align-items: start;
                }

                .settings-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-2);
                    background: var(--color-white);
                    padding: var(--space-4);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--color-gray-200);
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    padding: var(--space-3);
                    border: none;
                    background: none;
                    text-align: left;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-gray-600);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .sidebar-item:hover {
                    background: var(--color-gray-50);
                    color: var(--color-gray-900);
                }

                .sidebar-item.active {
                    background: var(--color-primary-50);
                    color: var(--color-primary-600);
                }

                .sidebar-item.danger {
                    color: var(--color-error);
                }

                .sidebar-item.danger:hover {
                    background: var(--color-error-light);
                }

                .sidebar-divider {
                    height: 1px;
                    background: var(--color-gray-200);
                    margin: var(--space-2) 0;
                }

                .settings-content {
                    background: var(--color-white);
                    padding: var(--space-8);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--color-gray-200);
                    min-height: 400px;
                }

                .section-title {
                    font-size: var(--font-size-xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-gray-900);
                    margin-bottom: var(--space-6);
                    padding-bottom: var(--space-4);
                    border-bottom: 1px solid var(--color-gray-200);
                }

                .form-group {
                    margin-bottom: var(--space-6);
                }

                .label {
                    display: block;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-gray-700);
                    margin-bottom: var(--space-2);
                }

                .input {
                    display: block;
                    width: 100%;
                    max-width: 400px;
                    padding: var(--space-2) var(--space-3);
                    border: 1px solid var(--color-gray-300);
                    border-radius: var(--radius-md);
                    font-size: var(--font-size-sm);
                    background: var(--color-gray-50);
                }
                
                .help-text {
                    display: block;
                    font-size: var(--font-size-xs);
                    color: var(--color-gray-500);
                    margin-top: var(--space-2);
                }

                .code-block {
                    display: block;
                    padding: var(--space-2) var(--space-3);
                    background: var(--color-gray-100);
                    border-radius: var(--radius-md);
                    font-family: monospace;
                    font-size: var(--font-size-xs);
                    color: var(--color-gray-700);
                }

                .toggle-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-6);
                }

                .toggle-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    max-width: 500px;
                }

                .toggle-label {
                    font-weight: var(--font-weight-medium);
                    color: var(--color-gray-900);
                }

                .toggle-desc {
                    font-size: var(--font-size-sm);
                    color: var(--color-gray-500);
                }

                /* Switch toggle styles */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }

                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--color-gray-300);
                    transition: .4s;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                }

                input:checked + .slider {
                    background-color: var(--color-primary-500);
                }

                input:checked + .slider:before {
                    transform: translateX(20px);
                }

                .slider.round {
                    border-radius: 24px;
                }

                .slider.round:before {
                    border-radius: 50%;
                }

                .theme-options {
                    display: flex;
                    gap: var(--space-6);
                }

                .theme-card {
                    cursor: pointer;
                    text-align: center;
                }

                .theme-preview {
                    width: 120px;
                    height: 80px;
                    border-radius: var(--radius-lg);
                    border: 2px solid var(--color-gray-200);
                    margin-bottom: var(--space-2);
                    transition: all var(--transition-fast);
                }

                .theme-card.active .theme-preview {
                    border-color: var(--color-primary-500);
                    box-shadow: 0 0 0 4px var(--color-primary-100);
                }

                .theme-preview.light {
                    background: #ffffff;
                }

                .theme-preview.dark {
                    background: #1f2937;
                }

                @media (max-width: 768px) {
                    .settings-layout {
                        grid-template-columns: 1fr;
                        gap: var(--space-6);
                    }

                    .settings-sidebar {
                        flex-direction: row;
                        overflow-x: auto;
                        padding-bottom: var(--space-2);
                    }

                    .sidebar-item {
                        white-space: nowrap;
                    }
                }
            `}</style>
        </div>
    );
}
