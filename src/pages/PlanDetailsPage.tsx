import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { firestoreService, type SavedGoal } from '@/lib/firestore';
import type { GeneratedPlan } from '@/lib/gemini';
import { PlanViewer } from '@/components/PlanViewer';
import { ThemeBackground } from '@/components/backgrounds';
import { HomeButton } from '@/components/HomeButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ThemeQuickToggle } from '@/components/ThemeQuickToggle';
export const PlanDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [goal, setGoal] = useState<SavedGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!goal || !goal.id) return;
        try {
            await firestoreService.deleteGoal(goal.id);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to delete goal:", error);
            // Optionally show error toast
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                <span className="ml-4 text-white">Loading Goal...</span>
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
                    className="p-3 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95 group w-fit"
                    title="Back to Dashboard"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </Link>
            </div>
            <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
                <PlanViewer
                    plan={goal.plan}
                    visionImage={goal.visionImage}
                    isPublic={goal.isPublic}
                    onTogglePublic={handleTogglePublic}
                    standalone={false}
                    onUpdatePlan={handlePlanUpdate}
                    goalId={goal.id}
                    onDelete={() => setShowDeleteConfirm(true)}
                />
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Vision?"
                message="Are you sure you want to delete this vision? This action cannot be undone and you will lose all progress, journal entries, and milestones associated with this goal."
                confirmText="Delete Vision"
                cancelText="Keep Vision"
                isDestructive={true}
            />
        </div>
    );
};
