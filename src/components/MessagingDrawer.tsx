import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { firestoreService, type Conversation, type Message } from '@/lib/firestore';

export const MessagingDrawer: React.FC = () => {
    const { user } = useAuth();
    const { isDrawerOpen, closeDrawer, activeConversationId, openDrawer } = useMessaging();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to conversation list
    useEffect(() => {
        if (!user) return;
        const unsubscribe = firestoreService.subscribeToConversations(user.uid, (convs) => {
            setConversations(convs);
        });
        return () => unsubscribe();
    }, [user]);

    // Subscribe to active conversation messages
    useEffect(() => {
        if (!activeConversationId) {
            return;
        }
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
    }, [activeConversationId]);

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
                    {/* No Backdrop for Facebook-style popup, allows interaction with background */}

                    {/* Popup Window */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 right-4 w-full md:w-96 h-[500px] max-h-[70vh] border border-slate-200 border-b-0 rounded-t-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden bg-white"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {activeConversationId && (
                                    <button onClick={handleBackToList} className="md:hidden p-1 hover:bg-slate-100 rounded-full text-slate-600">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-brand-purple" />
                                {activeConversationId ? 'Chat' : 'Messages'}
                            </h2>
                            <button onClick={closeDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
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
                                        conversations.map(conv => (
                                            <button
                                                key={conv.id}
                                                onClick={() => handleSelectConversation(conv.id)}
                                                className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-100 transition-colors flex items-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20">
                                                    <User className="w-5 h-5 text-brand-indigo" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="font-semibold text-slate-900 truncate">
                                                            User {getOtherUserId(conv).slice(0, 6)}...
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {conv.updatedAt?.toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 truncate group-hover:text-slate-600">
                                                        {conv.lastMessage || 'Start a conversation'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
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
                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
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
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
