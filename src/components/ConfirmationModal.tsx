import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false,
    isLoading = false
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] p-4"
                        style={{ width: '90%', maxWidth: '28rem' }}
                    >
                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-900" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                            <div className="p-8 text-center">
                                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-brand-purple/5 text-brand-purple'}`}>
                                    <AlertCircle className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-slate-900 font-outfit">{title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    {message}
                                </p>
                            </div>

                            <div className="flex bg-slate-50 border-t border-slate-100 p-6 gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors text-slate-600 disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-3 rounded-full font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDestructive
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                        : 'bg-brand-purple hover:bg-brand-purple/90 shadow-brand-purple/20'
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isDestructive ? null : <Check className="w-4 h-4" />}
                                            {confirmText}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
