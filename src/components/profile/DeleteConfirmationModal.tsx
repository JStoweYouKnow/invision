import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    message?: string;
    title?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    message = "Are you sure you want to delete this?",
    title = "Confirm Deletion"
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch {
            setError("Failed to delete. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 modal-backdrop-macos z-[9998]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="modal-macos rounded-2xl overflow-hidden flex flex-col pointer-events-auto text-slate-900"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000000' }}
                        >
                            <div className="p-6 flex-shrink-0 flex items-center justify-between">
                                <h2 className="text-lg font-display font-bold flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 pb-6 text-center">
                                <p className="text-slate-600 mb-6">{message}</p>

                                {error && (
                                    <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center px-4">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors text-slate-500 border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isLoading}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    ) : null;
};
