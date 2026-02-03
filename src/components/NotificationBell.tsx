import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, Settings, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { notificationService, type Notification, type NotificationType } from '@/lib/notifications';

interface NotificationBellProps {
    className?: string;
}

const typeIcons: Record<NotificationType, string> = {
    milestone_reminder: '🎯',
    step_reminder: '✨',
    streak_alert: '🔥',
    achievement: '🏆',
    social: '👋',
    system: '📢'
};

const typeColors: Record<NotificationType, string> = {
    milestone_reminder: 'bg-purple-500/20 border-purple-500/30',
    step_reminder: 'bg-blue-500/20 border-blue-500/30',
    streak_alert: 'bg-orange-500/20 border-orange-500/30',
    achievement: 'bg-yellow-500/20 border-yellow-500/30',
    social: 'bg-green-500/20 border-green-500/30',
    system: 'bg-slate-500/20 border-slate-500/30'
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
    const { user } = useAuth();
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Subscribe to notifications
    useEffect(() => {
        if (!user) return;

        const unsubscribe = notificationService.subscribeToNotifications(user.uid, (notifs) => {
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }, [user]);

    // Request notification permission on first open
    useEffect(() => {
        if (isOpen && !hasRequestedPermission && 'Notification' in window) {
            notificationService.requestPermission().then(() => {
                setHasRequestedPermission(true);
            });
        }
    }, [isOpen, hasRequestedPermission]);

    // Close drawer when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const unreadCount = notificationService.getUnreadCount(notifications);

    const handleNotificationClick = async (notification: Notification) => {
        if (!user) return;

        // Mark as read
        if (!notification.isRead && notification.id) {
            await notificationService.markAsRead(notification.id, user.uid);
        }

        // Navigate if there's an action URL
        if (notification.actionUrl) {
            setIsOpen(false);
            navigate(notification.actionUrl);
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        await notificationService.markAllAsRead(user.uid);
    };

    const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        if (!user || !notificationId) return;
        await notificationService.deleteNotification(notificationId, user.uid);
    };

    const handleClearAll = async () => {
        if (!user) return;
        await notificationService.clearAll(user.uid);
    };

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!user) return null;

    return (
        <div className={`relative ${className}`} ref={drawerRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
                <Bell className="w-5 h-5 text-white" />

                {/* Unread Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Notification Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 w-80 sm:w-96 max-h-[70vh] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="font-display font-bold text-white text-lg">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleClearAll}
                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-red-400"
                                            title="Clear all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/profile');
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                    title="Notification settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-white/30" />
                                    </div>
                                    <p className="text-white/60 font-medium mb-1">All caught up!</p>
                                    <p className="text-white/40 text-sm">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`relative p-4 cursor-pointer transition-colors hover:bg-white/5 ${
                                                !notification.isRead ? 'bg-white/[0.02]' : ''
                                            }`}
                                        >
                                            {/* Unread Indicator */}
                                            {!notification.isRead && (
                                                <div
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: currentTheme.colors.primary }}
                                                />
                                            )}

                                            <div className="flex gap-3 pl-3">
                                                {/* Icon */}
                                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${typeColors[notification.type]}`}>
                                                    {notification.icon || typeIcons[notification.type]}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-white' : 'text-white/80'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-white/40 whitespace-nowrap">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-white/60 text-xs mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>

                                                    {/* Action URL indicator */}
                                                    {notification.actionUrl && (
                                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-white/40">
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>Click to view</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => handleDeleteNotification(e, notification.id!)}
                                                    className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-white/40 hover:text-red-400"
                                                    title="Delete notification"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Browser Notification Permission */}
                        {'Notification' in window && Notification.permission === 'default' && (
                            <div className="p-3 border-t border-white/10 bg-white/5">
                                <button
                                    onClick={async () => {
                                        await notificationService.requestPermission();
                                        setHasRequestedPermission(true);
                                    }}
                                    className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: currentTheme.colors.primary + '20',
                                        color: currentTheme.colors.primary
                                    }}
                                >
                                    Enable Push Notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
