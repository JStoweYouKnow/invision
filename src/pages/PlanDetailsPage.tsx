import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { firestoreService, type SavedGoal } from '@/lib/firestore';
import type { GeneratedPlan } from '@/lib/gemini';
import { PlanViewer } from '@/components/PlanViewer';
import { ThemeBackground } from '@/components/backgrounds';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
import { SkeletonPlanViewer } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { DateChange, PauseRecord, StepChange } from '@/types';
export const PlanDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [goal, setGoal] = useState<SavedGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const { user } = useAuth();

    // Check if current user is the owner of this goal
    const isOwner = user && goal ? user.uid === goal.userId : false;

    useEffect(() => {
        const fetchGoal = async () => {
            if (!id) return;
            try {
                const fetchedGoal = await firestoreService.getGoalById(id);
                if (fetchedGoal) {
                    setGoal(fetchedGoal);
                } else {
                    setError('Goal not found');
                }
            } catch {
                setError('Failed to load goal');
            } finally {
                setLoading(false);
            }
        };

        fetchGoal();
    }, [id]);

    const handleTogglePublic = async () => {
        if (!goal || !goal.id) return;
        try {
            const newStatus = !goal.isPublic;
            await firestoreService.toggleVisibility(goal.id, newStatus);
            setGoal(prev => prev ? { ...prev, isPublic: newStatus } : null);
        } catch {
            // Toggle failed silently - state remains unchanged
        }
    };

    const handlePlanUpdate = async (newPlan: GeneratedPlan) => {
        if (!goal || !goal.id) return;
        try {
            // Optimistic update
            setGoal(prev => prev ? { ...prev, plan: newPlan } : null);

            // Persist to Firestore
            // We can use saveGoal but we need to ensure we don't create a duplicate. 
            // Since saveGoal creates a new doc if ID not provided or just adds, we should ideally have an update method.
            // But looking at firestoreService, saveGoal might not be best for partial updates. 
            // However, we are replacing the WHOLE plan object.
            // Let's assume we can use a direct firestore update for now or just re-save.
            // Actually, best to use the service. If saveGoal is "create", we might need a dedicated update.
            // Let's check firestoreService later. For now, assume we can update the 'plan' field.
            await firestoreService.updateGoal(goal.id, { plan: newPlan });
        } catch (error) {
            console.error("Failed to update plan:", error);
            // Revert or show error? For now just log.
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const navigate = useNavigate();

    const handleProgressChange = useCallback((completed: number, total: number) => {
        setProgress({ completed, total });
    }, []);

    const handleDelete = async () => {
        if (!goal || !goal.id) return;
        setDeleteLoading(true);
        try {
            await firestoreService.deleteGoal(goal.id);
            setShowDeleteConfirm(false);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to delete goal:", error);
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
            const message = error instanceof Error ? error.message : 'Failed to delete vision. Please try again.';
            alert(message);
        }
    };

    // Pause goal handler
    const handlePause = async (reason: string, reasonCategory: PauseRecord['reasonCategory']) => {
        if (!goal || !goal.id) return;
        try {
            await firestoreService.pauseGoal(goal.id, reason, reasonCategory);
            // Update local state
            setGoal(prev => prev ? {
                ...prev,
                status: 'paused' as const,
                pausedAt: Date.now(),
                pauseReason: reason,
                pauseReasonCategory: reasonCategory,
            } : null);
        } catch (error) {
            console.error("Failed to pause goal:", error);
        }
    };

    // Resume goal handler
    const handleResume = async () => {
        if (!goal || !goal.id) return;
        try {
            await firestoreService.resumeGoal(goal.id);
            // Refetch the goal to get updated timeline with shifted dates
            const updatedGoal = await firestoreService.getGoalById(goal.id);
            if (updatedGoal) {
                setGoal(updatedGoal);
            }
            // Goal resumed
        } catch (error) {
            console.error("Failed to resume goal:", error);
        }
    };

    // Milestone date change handler
    const handleMilestoneDateChange = async (
        milestoneIndex: number,
        newDate: string,
        change: DateChange
    ) => {
        if (!goal || !goal.id) return;
        try {
            await firestoreService.updateMilestoneDate(goal.id, milestoneIndex, newDate, change);

            // Update local state with new date and history
            setGoal(prev => {
                if (!prev) return null;
                const updatedTimeline = [...prev.plan.timeline];
                if (updatedTimeline[milestoneIndex]) {
                    const milestone = { ...updatedTimeline[milestoneIndex] };
                    milestone.date = newDate;
                    // Add to date history
                    const existingHistory = (milestone as { dateHistory?: DateChange[] }).dateHistory || [];
                    (milestone as { dateHistory?: DateChange[] }).dateHistory = [...existingHistory, change];
                    updatedTimeline[milestoneIndex] = milestone;
                }
                return {
                    ...prev,
                    plan: { ...prev.plan, timeline: updatedTimeline }
                };
            });
        } catch (error) {
            console.error("Failed to update milestone date:", error);
        }
    };

    // Milestone steps change handler
    const handleMilestoneStepsChange = async (
        milestoneIndex: number,
        steps: { text: string; date: string; habit?: string }[],
        changes: StepChange[]
    ) => {
        if (!goal || !goal.id) return;
        try {
            await firestoreService.updateMilestoneSteps(goal.id, milestoneIndex, steps, changes);

            // Update local state with new steps
            setGoal(prev => {
                if (!prev) return null;
                const updatedTimeline = [...prev.plan.timeline];
                if (updatedTimeline[milestoneIndex]) {
                    const milestone = { ...updatedTimeline[milestoneIndex] };
                    milestone.steps = steps;
                    // Add to step history
                    const existingHistory = (milestone as { stepHistory?: StepChange[] }).stepHistory || [];
                    (milestone as { stepHistory?: StepChange[] }).stepHistory = [...existingHistory, ...changes];
                    updatedTimeline[milestoneIndex] = milestone;
                }
                return {
                    ...prev,
                    plan: { ...prev.plan, timeline: updatedTimeline }
                };
            });
        } catch (error) {
            console.error("Failed to update milestone steps:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground p-4 md:p-8 relative overflow-hidden">
                <ThemeBackground className="z-0" />
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-32 relative z-10">
                    <SkeletonPlanViewer />
                </div>
            </div>
        );
    }

    if (error || !goal) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold mb-4">Oops!</h2>
                <p className="text-muted-foreground mb-8">{error || "Plan not found"}</p>
                <Link to="/dashboard" className="text-white hover:underline">Return to Dashboard</Link>
            </div>
        );
    }
    return (
        <>
            <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
                {/* Theme Background */}
                <ThemeBackground className="z-0" />

                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                    <NavigationMenu />
                </div>

                <div className="absolute top-6 left-6 z-50 flex flex-col gap-4">
                    <div className="flex items-center gap-14">
                        <HomeButton />
                        <ThemeQuickToggle />
                    </div>

                    <Link
                        to="/dashboard"
                        className="btn btn--icon btn--ghost bg-black/20 hover:bg-black/40 backdrop-blur-md text-white group w-fit"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Step Counter (Fixed Bottom Left) */}
                {progress.total > 0 && (
                    <div
                        className="w-56 bg-black/60 backdrop-blur-md p-3 rounded-xl shadow-lg transition-all duration-300 hover:bg-black/70 font-sans pointer-events-auto"
                        style={{ position: 'fixed', bottom: '16px', left: '16px', zIndex: 40 }}
                    >
                        <div className="flex items-center justify-between mb-2 gap-4">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Trophy className="w-4 h-4 text-brand-purple flex-shrink-0" />
                                <span className="font-bold text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                    {progress.completed} / {progress.total} steps
                                </span>
                            </div>
                            <span className="text-xs text-white/60 font-medium whitespace-nowrap flex-shrink-0">
                                {Math.round((progress.completed / progress.total) * 100)}%
                            </span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                                transition={{ type: "spring", stiffness: 100 }}
                            />
                        </div>
                    </div>
                )}

                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-32">
                    <PlanViewer
                        plan={goal.plan}
                        visionImage={goal.visionImage}
                        isPublic={goal.isPublic}
                        onTogglePublic={isOwner ? handleTogglePublic : undefined}
                        standalone={false}
                        onUpdatePlan={isOwner ? handlePlanUpdate : undefined}
                        goalId={goal.id}
                        onDelete={isOwner ? () => setShowDeleteConfirm(true) : undefined}
                        onProgressChange={handleProgressChange}
                        isReadOnly={!isOwner}
                        authorName={!isOwner ? goal.authorName : undefined}
                        // Vision Image Update
                        onUpdateVisionImage={isOwner ? async (newUrl) => {
                            if (!goal || !goal.id) return;

                            // Prevent infinite updates if the URL hasn't effectively changed
                            if (goal.visionImage === newUrl) return;

                            try {
                                // Optimistic update
                                setGoal(prev => prev ? { ...prev, visionImage: newUrl } : null);

                                // Persist
                                if (goal.id.startsWith('mock-') || goal.id.startsWith('goal_')) {
                                    // Mock/Demo persistence
                                    // For mock goals, we rely on the optimistic update above.
                                    // In a real app we'd update the mock store, but for this demo session, 
                                    // local state is sufficient as long as we don't crash.
                                } else {
                                    await firestoreService.updateGoal(goal.id, { visionImage: newUrl });
                                }
                            } catch (err) {
                                console.error("Failed to update vision image:", err);
                            }
                        } : undefined}
                        // Pause functionality
                        isPaused={(goal as { status?: string }).status === 'paused'}
                        pausedAt={(goal as { pausedAt?: number }).pausedAt}
                        pauseReason={(goal as { pauseReason?: string }).pauseReason}
                        pauseHistory={(goal as { pauseHistory?: PauseRecord[] }).pauseHistory}
                        onPause={isOwner ? handlePause : undefined}
                        onResume={isOwner ? handleResume : undefined}
                        // Date change functionality
                        onMilestoneDateChange={isOwner ? handleMilestoneDateChange : undefined}
                        onMilestoneStepsChange={isOwner ? handleMilestoneStepsChange : undefined}
                        goalCreatedAt={goal.createdAt.getTime()}
                    />
                </div>
            </div>

            {/* Modal rendered outside overflow-hidden container */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Vision?"
                message="Are you sure you want to delete this vision? This action cannot be undone and you will lose all progress, journal entries, and milestones associated with this goal."
                confirmText="Delete Vision"
                cancelText="Keep Vision"
                isDestructive={true}
                isLoading={deleteLoading}
            />
        </>
    );
};
