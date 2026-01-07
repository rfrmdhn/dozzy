import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsIcon, UserIcon, BellIcon, EyeIcon, LogOutIcon, Input } from '../../../components';
import '../styles/SettingsPage.css';

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
                            <Input
                                label="Email Address"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                helpText="Your email address is managed via Supabase Auth"
                                containerClassName="mb-6"
                            />
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


        </div>
    );
}
