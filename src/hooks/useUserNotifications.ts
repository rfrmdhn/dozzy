import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { notificationRepository, type Notification } from '../lib/repositories';
import { useAuthStore } from '../stores/useAuthStore';

export function useUserNotifications() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        setIsLoading(true);
        const { notifications: data } = await notificationRepository.fetchUnread(user.id);
        setNotifications(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications();

        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        await notificationRepository.markAsRead(id);
    };

    const markAllRead = async () => {
        if (!user) return;
        setNotifications([]);
        await notificationRepository.markAllAsRead(user.id);
    };

    return {
        notifications,
        isLoading,
        markAsRead,
        markAllRead,
        unreadCount: notifications.length
    };
}
