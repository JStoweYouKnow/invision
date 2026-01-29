import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, Globe, User, MessageCircle, LayoutDashboard } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/lib/firestore';

interface NavigationMenuProps {
    className?: string;
    demoMode?: boolean;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ className = "", demoMode = false }) => {
    const location = useLocation();
    const { openDrawer } = useMessaging();
    const { user } = useAuth();
    const pathname = location.pathname;
    const [totalUnread, setTotalUnread] = useState(0);

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

    const linkBaseClass = "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:outline-none no-underline whitespace-nowrap";
    const activeClass = "bg-white/20 text-white shadow-lg shadow-white/5 font-bold border border-white/20";
    const inactiveClass = "text-white hover:bg-white/10";

    return (
        <div className={`flex flex-wrap justify-center items-center p-1.5 bg-black/20 backdrop-blur-md rounded-[32px] shrink-0 ${className}`}>
            <Link
                to="/"
                className={`${linkBaseClass} ${isActive('/') && pathname === '/' ? activeClass : inactiveClass}`}
            >
                <Star className="w-4 h-4" />
                <span>New Vision</span>
            </Link>

            <Link
                to={demoMode ? "/demo" : "/dashboard"}
                className={`${linkBaseClass} ${isActive('/dashboard') ? activeClass : inactiveClass}`}
            >
                <LayoutDashboard className="w-4 h-4" />
                <span>My Visions</span>
            </Link>

            <Link
                to={demoMode ? "/demo/community" : "/community"}
                className={`${linkBaseClass} ${isActive('/community') ? activeClass : inactiveClass}`}
            >
                <Globe className="w-4 h-4" />
                <span>Community</span>
            </Link>

            <button
                onClick={() => openDrawer()}
                className={`${linkBaseClass} ${inactiveClass} bg-transparent border-none cursor-pointer relative`}
                style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', color: 'white' }}
            >
                <div className="relative">
                    <MessageCircle className="w-4 h-4" style={{ color: 'white' }} />
                    {totalUnread > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </div>
                    )}
                </div>
                <span style={{ color: 'white' }}>Messages</span>
            </button>

            <Link
                to={demoMode ? "/demo/profile" : "/profile"}
                className={`${linkBaseClass} ${isActive('/profile') ? activeClass : inactiveClass}`}
            >
                <User className="w-4 h-4" />
                <span>Profile</span>
            </Link>
        </div>
    );
};
