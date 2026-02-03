import React, { useState, useEffect } from 'react';
import { Tooltip } from '@/components/TooltipSystem';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Star, Globe, User, MessageCircle, LayoutDashboard, Bell } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/lib/firestore';
import { notificationService, type Notification } from '@/lib/notifications';

interface NavigationMenuProps {
    className?: string;
    demoMode?: boolean;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ className = "", demoMode = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { openDrawer } = useMessaging();
    const { user } = useAuth();
    const pathname = location.pathname;
    const [totalUnread, setTotalUnread] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);

    // Subscribe to notifications
    useEffect(() => {
        if (!user) return;

        const unsubscribe = notificationService.subscribeToNotifications(user.uid, (notifications: Notification[]) => {
            const unread = notificationService.getUnreadCount(notifications);
            setNotificationCount(unread);
        });

        return () => unsubscribe();
    }, [user]);

    // Subscribe to conversations to track unread count
    useEffect(() => {
        if (!user) {
            return;
        }

        const unsubscribe = firestoreService.subscribeToConversations(user.uid, (convs) => {
            const total = convs.reduce((sum, conv) => {
                return sum + (conv.unreadCounts?.[user.uid] || 0);
            }, 0);
            setTotalUnread(total);
        });

        return () => {
            unsubscribe();
            setTotalUnread(0);
        };
    }, [user]);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    // Mobile-first: larger touch targets on small screens, compact on desktop
    const linkBaseClass = "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-1.5 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none no-underline whitespace-nowrap min-w-[44px] min-h-[44px] md:min-h-0";
    const activeClass = "bg-white/20 text-white shadow-lg shadow-white/5 font-bold border border-white/20";
    const inactiveClass = "text-white hover:bg-white/10 active:bg-white/20";

    return (
        <div className={`flex flex-wrap justify-center items-center gap-1 p-1.5 md:p-1.5 bg-black/20 backdrop-blur-md rounded-[32px] shrink-0 ${className}`}>
            <Tooltip id="nav-new-vision" content="Start a new vision board" position="bottom" delay={200}>
                <Link
                    to="/"
                    className={`${linkBaseClass} ${isActive('/') && pathname === '/' ? activeClass : inactiveClass}`}
                    title="New Vision"
                >
                    <Star className="w-4 h-4" />
                    <span className="hidden md:inline">New Vision</span>
                </Link>
            </Tooltip>

            <Link
                to={demoMode ? "/demo" : "/dashboard"}
                className={`${linkBaseClass} ${isActive('/dashboard') ? activeClass : inactiveClass}`}
                title="My Visions"
            >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">My Visions</span>
            </Link>

            <Link
                to={demoMode ? "/demo/community" : "/community"}
                className={`${linkBaseClass} ${isActive('/community') ? activeClass : inactiveClass}`}
                title="Community"
            >
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline">Community</span>
            </Link>

            <button
                onClick={() => openDrawer()}
                className={`${linkBaseClass} ${inactiveClass} bg-transparent border-none cursor-pointer relative`}
                style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', color: 'white' }}
                title="Messages"
            >
                <div className="relative">
                    <MessageCircle className="w-4 h-4" style={{ color: 'white' }} />
                    {totalUnread > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </div>
                    )}
                </div>
                <span className="hidden md:inline" style={{ color: 'white' }}>Messages</span>
            </button>

            <button
                onClick={() => navigate(demoMode ? '/demo/profile?tab=notifications' : '/profile?tab=notifications')}
                className={`${linkBaseClass} ${inactiveClass} bg-transparent border-none cursor-pointer relative`}
                style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', color: 'white' }}
                title="Notifications"
            >
                <div className="relative">
                    <Bell className="w-4 h-4" style={{ color: 'white' }} />
                    {notificationCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </div>
                    )}
                </div>
                <span className="hidden md:inline" style={{ color: 'white' }}>Alerts</span>
            </button>

            <Link
                to={demoMode ? "/demo/profile" : "/profile"}
                className={`${linkBaseClass} ${isActive('/profile') ? activeClass : inactiveClass}`}
                title="Profile"
            >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Profile</span>
            </Link>
        </div>
    );
};
