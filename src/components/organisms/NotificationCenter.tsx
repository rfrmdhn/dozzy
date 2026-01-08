import { useState, useRef, useEffect } from 'react';
import { BellIcon, CheckCircleIcon } from '../atoms/icons';
import { useUserNotifications } from '../../hooks/useUserNotifications';
import { formatRelativeTime } from '../../lib/utils/date';
import type { Notification } from '../../lib/repositories/notificationRepository';

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllRead } = useUserNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getNotificationMessage = (n: Notification) => {
        if (n.payload && n.payload.message) return n.payload.message;

        // Fallback formatting based on event type
        const action = n.event_type.replace('_', ' ');
        return `${action} on ${n.entity_type}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <BellIcon size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animation-fade-in-down">
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllRead()}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                                <CheckCircleIcon size={12} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center text-gray-400">
                                <BellIcon size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors group relative"
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 mb-1 leading-snug">
                                                    {getNotificationMessage(n)}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatRelativeTime(n.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
