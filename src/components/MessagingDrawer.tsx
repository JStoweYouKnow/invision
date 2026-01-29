import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageCircle, ChevronLeft, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { firestoreService, type Conversation, type Message, type UserProfile } from '@/lib/firestore';
import { UserSearchModal as UserSearchModalStyled } from '@/components/UserSearchModalStyled';

export const MessagingDrawer: React.FC = () => {
    const { user } = useAuth();
    const { isDrawerOpen, closeDrawer, activeConversationId, openDrawer } = useMessaging();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
    const [showSearchModal, setShowSearchModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to conversation list
    useEffect(() => {
        if (!user) return;
        const unsubscribe = firestoreService.subscribeToConversations(user.uid, (convs) => {
            setConversations(convs);

            // Fetch user profiles for all participants
            const allParticipantIds = new Set<string>();
            convs.forEach(conv => {
                conv.participantIds.forEach(id => {
                    if (id !== user.uid) {
                        allParticipantIds.add(id);
                    }
                });
            });

            if (allParticipantIds.size > 0) {
                firestoreService.getUserProfiles(Array.from(allParticipantIds)).then(profiles => {
                    setUserProfiles(profiles);
                });
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Subscribe to active conversation messages
    useEffect(() => {
        if (!activeConversationId || !user) {
            return;
        }

        // Mark conversation as read
        firestoreService.markConversationAsRead(activeConversationId, user.uid);

        const unsubscribe = firestoreService.subscribeToMessages(activeConversationId, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
        return () => {
            unsubscribe();
            // Clear messages on cleanup (when conversation changes)
            setMessages([]);
        };
    }, [activeConversationId, user]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeConversationId || !user) return;

        const text = inputValue;
        setInputValue('');

        try {
            await firestoreService.sendMessage(activeConversationId, {
                senderId: user.uid,
                senderName: user.displayName || 'Anonymous',
                text,
                role: 'user'
            });
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    const handleSelectConversation = (convId: string) => {
        openDrawer(convId);
    };

    const handleBackToList = () => {
        openDrawer(undefined); // Keep open, clear ID
    };

    // Helper to get other participant ID (simplified)
    const getOtherUserId = (conv: Conversation) => {
        if (!user) return 'unknown';
        return conv.participantIds.find(id => id !== user.uid) || 'unknown';
    };

    // Helper to get other user's profile
    const getOtherUserProfile = (conv: Conversation): UserProfile | null => {
        const otherUserId = getOtherUserId(conv);
        return userProfiles.get(otherUserId) || null;
    };

    // Handle new conversation from search
    const handleStartNewConversation = async (targetUserId: string) => {
        if (!user) return;
        try {
            const conversationId = await firestoreService.createConversation([user.uid, targetUserId]);
            openDrawer(conversationId);
            setShowSearchModal(false);
        } catch (error) {
            console.error("Failed to start conversation", error);
        }
    };

    // Get active conversation's other user
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const activeOtherUser = activeConversation ? getOtherUserProfile(activeConversation) : null;

    // If not logged in, show a fallback UI instead of null
    if (!user) {
        return (
            <AnimatePresence>
                {isDrawerOpen && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 right-4 w-full md:w-96 h-[500px] max-h-[70vh] border border-slate-200 border-b-0 rounded-t-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden bg-white"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex-1" />
                            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-brand-purple" />
                                Messages
                            </h2>
                            <div className="flex-1 flex justify-end">
                                <button onClick={closeDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sign in to Chat</h3>
                            <p className="text-slate-500 mb-6">Join the community to message other visionaries.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] h-[600px] max-h-[85vh] z-[9999] p-0 pointer-events-none"
                    >
                        <div
                            className="flex flex-col h-full bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-200"
                            style={{ backgroundColor: '#ffffff', color: '#000000' }}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    {activeConversationId && (
                                        <button onClick={handleBackToList} className="md:hidden p-1 hover:bg-slate-100 rounded-full text-slate-600">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                                    {activeConversationId && activeOtherUser ? (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-indigo to-brand-purple flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                                {activeOtherUser.photoURL ? (
                                                    <img src={activeOtherUser.photoURL} alt={activeOtherUser.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    activeOtherUser.displayName?.[0]?.toUpperCase() || 'U'
                                                )}
                                            </div>
                                            {activeOtherUser.displayName || 'User'}
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="w-5 h-5 text-brand-purple" />
                                            Messages
                                        </>
                                    )}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {!activeConversationId && (
                                        <button
                                            onClick={() => setShowSearchModal(true)}
                                            className="p-2 hover:bg-brand-purple/10 rounded-full text-brand-purple transition-colors"
                                            title="New conversation"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={closeDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50">
                                {!activeConversationId ? (
                                    // Conversation List
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {conversations.length === 0 ? (
                                            <div className="text-center text-slate-500 mt-10">
                                                <p>No messages yet.</p>
                                                <p className="text-sm">Explore the galaxy to find fellow voyagers!</p>
                                            </div>
                                        ) : (
                                            conversations.map(conv => {
                                                const otherUser = getOtherUserProfile(conv);
                                                const unreadCount = user ? (conv.unreadCounts?.[user.uid] || 0) : 0;

                                                return (
                                                    <button
                                                        key={conv.id}
                                                        onClick={() => handleSelectConversation(conv.id)}
                                                        className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-100 transition-colors flex items-center gap-4 group relative"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-indigo to-brand-purple flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                                                            {otherUser?.photoURL ? (
                                                                <img
                                                                    src={otherUser.photoURL}
                                                                    alt={otherUser.displayName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                otherUser?.displayName?.[0]?.toUpperCase() || 'U'
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <span className="font-semibold text-slate-900 truncate">
                                                                    {otherUser?.displayName || `User ${getOtherUserId(conv).slice(0, 6)}...`}
                                                                </span>
                                                                <span className="text-xs text-slate-400 ml-2 shrink-0">
                                                                    {conv.updatedAt?.toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 truncate group-hover:text-slate-600">
                                                                {conv.lastMessage || 'Start a conversation'}
                                                            </p>
                                                        </div>
                                                        {unreadCount > 0 && (
                                                            <div className="absolute top-2 right-2 bg-brand-purple text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                                {unreadCount > 9 ? '9+' : unreadCount}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                ) : (
                                    // Active Chat View
                                    <>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages.map((msg) => {
                                                const isMe = msg.senderId === user.uid;
                                                return (
                                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <div
                                                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                                                ? 'bg-brand-purple text-white rounded-br-none'
                                                                : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                                                                }`}
                                                        >
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input */}
                                        <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-200 bg-white">
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    placeholder="Type a message..."
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 text-slate-900 placeholder:text-slate-400"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!inputValue.trim()}
                                                    className="p-2 bg-brand-purple text-white rounded-full hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* User Search Modal */}
                    <UserSearchModalStyled
                        isOpen={showSearchModal}
                        onClose={() => setShowSearchModal(false)}
                        onSelectUser={handleStartNewConversation}
                    />
                </>
            )}
        </AnimatePresence>
    );
};
