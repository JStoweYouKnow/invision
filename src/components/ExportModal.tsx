import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Image, FileJson, Share2, Copy, Check, Loader2, Calendar } from 'lucide-react';
import type { GeneratedPlan } from '@/lib/gemini';
import { exportAsImage, exportAsPDF, exportAsJSON, copyToClipboard, sharePlan } from '@/lib/export';
import { calendarService } from '@/lib/calendar';
import { useTheme } from '@/contexts/ThemeContext';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: GeneratedPlan;
    goalTitle: string;
    exportRef: React.RefObject<HTMLElement>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    plan,
    goalTitle,
    exportRef,
}) => {
    const { currentTheme } = useTheme();
    const [loading, setLoading] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async (type: 'image' | 'pdf' | 'json' | 'ical') => {
        setLoading(type);
        setError(null);

        try {
            const filename = `invision-${goalTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`;

            switch (type) {
                case 'image':
                    if (exportRef.current) {
                        await exportAsImage(exportRef.current, filename);
                    }
                    break;
                case 'pdf':
                    if (exportRef.current) {
                        await exportAsPDF(exportRef.current, plan, filename);
                    }
                    break;
                case 'json':
                    exportAsJSON(plan, goalTitle, filename);
                    break;
                case 'ical':
                    calendarService.exportToICS(plan, goalTitle);
                    break;
            }

            // Close modal on success
            setTimeout(() => onClose(), 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setLoading(null);
        }
    };

    const handleCopy = async () => {
        try {
            await copyToClipboard(plan);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Failed to copy to clipboard');
        }
    };

    const handleShare = async () => {
        const shared = await sharePlan(plan);
        if (!shared) {
            // Fallback to copy
            handleCopy();
        }
    };

    const exportOptions = [
        {
            id: 'image',
            label: 'Save as Image',
            description: 'Download as PNG for sharing',
            icon: Image,
        },
        {
            id: 'pdf',
            label: 'Save as PDF',
            description: 'Print-ready document',
            icon: Download,
        },
        {
            id: 'ical',
            label: 'Export to Calendar',
            description: 'iCal file for any calendar app',
            icon: Calendar,
        },
        {
            id: 'json',
            label: 'Export Data',
            description: 'Backup as JSON file',
            icon: FileJson,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4"
                    >
                        <div className="modal-macos rounded-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-black/10">
                                <h2 className="text-lg font-display font-bold text-black">
                                    Export Vision
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                                >
                                    <X className="w-5 h-5 text-black/60" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                {/* Export Options */}
                                {exportOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleExport(option.id as 'image' | 'pdf' | 'json' | 'ical')}
                                        disabled={loading !== null}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-black/10 bg-white/40 hover:bg-white/60 transition-all disabled:opacity-50 group"
                                    >
                                        <div
                                            className="p-3 rounded-xl"
                                            style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
                                        >
                                            {loading === option.id ? (
                                                <Loader2 className="w-6 h-6 animate-spin" style={{ color: currentTheme.colors.primary }} />
                                            ) : (
                                                <option.icon className="w-6 h-6" style={{ color: currentTheme.colors.primary }} />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-black group-hover:text-black">
                                                {option.label}
                                            </div>
                                            <div className="text-sm text-black/50">
                                                {option.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Divider */}
                                <div className="flex items-center gap-3 py-2">
                                    <div className="flex-1 h-px bg-black/10" />
                                    <span className="text-xs text-black/40 uppercase tracking-wider">or</span>
                                    <div className="flex-1 h-px bg-black/10" />
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10 transition-all"
                                    >
                                        <Share2 className="w-4 h-4 text-black/60" />
                                        <span className="text-sm text-black/80">Share</span>
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-black/10 bg-black/5 hover:bg-black/10 transition-all"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 text-green-400" />
                                                <span className="text-sm text-green-400">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 text-black/60" />
                                                <span className="text-sm text-black/80">Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
