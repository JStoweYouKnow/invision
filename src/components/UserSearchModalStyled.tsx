import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MessageCircle, Loader2 } from 'lucide-react';
import { firestoreService, type UserProfile } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (userId: string) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose, onSelectUser }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);

        if (!term.trim() || !user) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await firestoreService.searchUsers(term, user.uid);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (userId: string) => {
        onSelectUser(userId);
        onClose();
        setSearchTerm('');
        setSearchResults([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] pointer-events-none">
                {/* Backdrop - pointer-events-auto to capture clicks */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                />

                {/* Modal - pointer-events-auto */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 20 }}
                    className="absolute right-4 top-24 w-[90vw] max-w-[450px] max-h-[600px] !bg-white !text-black rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col pointer-events-auto"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-brand-purple" />
                            New Conversation
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-6 border-b border-slate-100 shrink-0">
                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search users by name or email..."
                                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 text-slate-900 placeholder:text-slate-400"
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-purple animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {!searchTerm.trim() ? (
                            <div className="text-center py-12 text-slate-500">
                                <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-sm">Search for users to start a conversation</p>
                            </div>
                        ) : searchResults.length === 0 && !isSearching ? (
                            <div className="text-center py-12 text-slate-500">
                                <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-sm">No users found</p>
                                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {searchResults.map((userProfile) => (
                                    <button
                                        key={userProfile.uid}
                                        onClick={() => handleSelectUser(userProfile.uid)}
                                        className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition-all hover:border-brand-purple/30 hover:shadow-sm flex items-center gap-4 group"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-indigo to-brand-purple flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden"
                                            style={{ width: '48px', height: '48px', minWidth: '48px' }}
                                        >
                                            {userProfile.photoURL ? (
                                                <img
                                                    src={userProfile.photoURL}
                                                    alt={userProfile.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                userProfile.displayName?.[0]?.toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 truncate group-hover:text-brand-purple transition-colors">
                                                {userProfile.displayName || 'Anonymous'}
                                            </div>
                                            <p className="text-xs text-slate-600 truncate">
                                                {userProfile.email}
                                            </p>
                                            {userProfile.bio && (
                                                <p className="text-xs text-slate-600 truncate mt-1">
                                                    {userProfile.bio}
                                                </p>
                                            )}
                                        </div>
                                        <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-brand-purple transition-colors shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
