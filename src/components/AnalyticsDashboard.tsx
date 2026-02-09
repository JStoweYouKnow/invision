import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Target, Flame, Trophy, Calendar,
    CheckCircle2, Clock, Zap, BarChart3, Activity,
    Brain, Sparkles, ArrowRight, Link2, Lightbulb, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { firestoreService, type SavedGoal } from '@/lib/firestore';
import { geminiService, type JourneySynthesis } from '@/lib/gemini';
import { MOCK_GOALS } from '@/lib/mockData';

interface AnalyticsData {
    totalGoals: number;
    completedMilestones: number;
    totalMilestones: number;
    completedSteps: number;
    totalSteps: number;
    currentStreak: number;
    longestStreak: number;
    goalsThisMonth: number;
    completionRate: number;
    averageMilestonesPerGoal: number;
    recentActivity: ActivityItem[];
    weeklyProgress: number[];
}

interface ActivityItem {
    id: string;
    type: 'goal_created' | 'milestone_completed' | 'step_completed';
    title: string;
    date: Date;
    goalTitle: string;
}

interface StatCardProps {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
    trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subValue, color, trend }) => {

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl p-5 bg-white/5 backdrop-blur-md border border-white/10"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    {subValue && (
                        <p className="text-sm text-white/60 mt-1">{subValue}</p>
                    )}
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                            {Math.abs(trend)}% vs last week
                        </div>
                    )}
                </div>
                <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
            </div>

            {/* Decorative gradient */}
            <div
                className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: color }}
            />
        </motion.div>
    );
};

const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
    progress,
    size = 120,
    strokeWidth = 8
}) => {
    const { currentTheme } = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={currentTheme.colors.primary}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
            </div>
        </div>
    );
};

const WeeklyChart: React.FC<{ data: number[] }> = ({ data }) => {
    const { currentTheme } = useTheme();
    const maxValue = Math.max(...data, 1);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex items-end justify-between gap-2 h-32">
            {data.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                        className="w-full rounded-t-lg"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / maxValue) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                    <span className="text-[10px] text-white/50 uppercase">{days[index]}</span>
                </div>
            ))}
        </div>
    );
};

export const AnalyticsDashboard: React.FC = () => {
    const { user } = useAuth();
    const { currentTheme } = useTheme();
    const [goals, setGoals] = useState<SavedGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [synthesis, setSynthesis] = useState<JourneySynthesis | null>(null);
    const [synthesisLoading, setSynthesisLoading] = useState(false);
    const [synthesisError, setSynthesisError] = useState(false);

    useEffect(() => {
        const fetchGoals = async () => {
            if (!user) {
                setGoals(MOCK_GOALS);
                setLoading(false);
                return;
            }

            try {
                const userGoals = await firestoreService.getUserGoals(user.uid);
                setGoals(userGoals.length > 0 ? userGoals : MOCK_GOALS);
            } catch (error) {
                console.error('Failed to fetch goals for analytics:', error);
                setGoals(MOCK_GOALS);
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, [user]);

    const runSynthesis = useCallback(async () => {
        if (synthesisLoading || goals.length === 0) return;
        setSynthesisLoading(true);
        setSynthesisError(false);
        try {
            const goalsData = await Promise.all(goals.map(async (goal) => {
                let journalSnippets: string[] = [];
                try {
                    const entries = await firestoreService.getJournalEntries(goal.id || '');
                    journalSnippets = entries.slice(0, 3).map(e => e.content.slice(0, 120));
                } catch { /* no journal entries */ }

                return {
                    title: goal.title,
                    status: 'status' in goal ? String(goal.status) : 'active',
                    createdAt: goal.createdAt?.toLocaleDateString?.() || 'unknown',
                    milestones: (goal.plan?.timeline || []).map(m => ({
                        name: m.milestone,
                        completed: !!m.isCompleted,
                        dateChanges: 'dateHistory' in m && Array.isArray(m.dateHistory)
                            ? m.dateHistory.length
                            : 0
                    })),
                    journalSnippets,
                };
            }));
            const result = await geminiService.generateJourneySynthesis(goalsData);
            setSynthesis(result);
        } catch (error) {
            console.error('[Synthesis] Failed:', error);
            setSynthesisError(true);
        } finally {
            setSynthesisLoading(false);
        }
    }, [goals, synthesisLoading]);

    const analytics: AnalyticsData = useMemo(() => {
        const totalGoals = goals.length;
        let completedMilestones = 0;
        let totalMilestones = 0;
        let completedSteps = 0;
        let totalSteps = 0;

        // Calculate from goals
        goals.forEach(goal => {
            const milestones = goal.plan?.timeline || [];
            totalMilestones += milestones.length;

            milestones.forEach(milestone => {
                if (milestone.isCompleted) completedMilestones++;
                const steps = milestone.steps || [];
                totalSteps += steps.length;
                // For demo, simulate some completed steps
                completedSteps += Math.floor(steps.length * 0.3);
            });
        });

        // Calculate goals this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const goalsThisMonth = goals.filter(g => g.createdAt >= startOfMonth).length;

        // Simulate streak data
        const currentStreak = 7;
        const longestStreak = 14;

        // Completion rate
        const completionRate = totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0;

        // Average milestones per goal
        const averageMilestonesPerGoal = totalGoals > 0
            ? Math.round(totalMilestones / totalGoals)
            : 0;

        // Simulated weekly progress
        const weeklyProgress = [2, 4, 3, 5, 4, 6, 3];

        // Recent activity
        const recentActivity: ActivityItem[] = goals.slice(0, 3).map(goal => ({
            id: goal.id || '',
            type: 'goal_created' as const,
            title: `Created vision "${goal.title}"`,
            date: goal.createdAt,
            goalTitle: goal.title
        }));

        return {
            totalGoals,
            completedMilestones,
            totalMilestones,
            completedSteps,
            totalSteps,
            currentStreak,
            longestStreak,
            goalsThisMonth,
            completionRate,
            averageMilestonesPerGoal,
            recentActivity,
            weeklyProgress
        };
    }, [goals]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        <BarChart3 className="w-7 h-7" style={{ color: currentTheme.colors.primary }} />
                        Analytics
                    </h2>
                    <p className="text-white/60 text-sm mt-1">Track your vision journey</p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Target}
                    label="Total Visions"
                    value={analytics.totalGoals}
                    subValue={`${analytics.goalsThisMonth} this month`}
                    color={currentTheme.colors.primary}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Milestones Done"
                    value={analytics.completedMilestones}
                    subValue={`of ${analytics.totalMilestones} total`}
                    color="#10b981"
                />
                <StatCard
                    icon={Flame}
                    label="Current Streak"
                    value={`${analytics.currentStreak}d`}
                    subValue={`Best: ${analytics.longestStreak} days`}
                    color="#f97316"
                    trend={12}
                />
                <StatCard
                    icon={Zap}
                    label="Steps Completed"
                    value={analytics.completedSteps}
                    subValue={`of ${analytics.totalSteps} total`}
                    color="#8b5cf6"
                />
            </div>

            {/* Progress & Weekly Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Completion Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-white/10"
                >
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Overall Progress
                    </h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={analytics.completionRate} size={160} strokeWidth={12} />
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-white">{analytics.completedMilestones}</p>
                            <p className="text-xs text-white/50 uppercase">Completed</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{analytics.totalMilestones - analytics.completedMilestones}</p>
                            <p className="text-xs text-white/50 uppercase">Remaining</p>
                        </div>
                    </div>
                </motion.div>

                {/* Weekly Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-white/10"
                >
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Weekly Activity
                    </h3>
                    <WeeklyChart data={analytics.weeklyProgress} />
                    <div className="mt-4 text-center">
                        <p className="text-sm text-white/60">
                            <span className="text-white font-bold">{analytics.weeklyProgress.reduce((a, b) => a + b, 0)}</span> actions this week
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-white/10"
            >
                <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Activity
                </h3>
                <div className="space-y-3">
                    {analytics.recentActivity.length > 0 ? (
                        analytics.recentActivity.map((activity, index) => (
                            <div
                                key={activity.id || index}
                                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
                                >
                                    <Trophy className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{activity.title}</p>
                                    <p className="text-xs text-white/50">
                                        {activity.date.toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-white/50 py-8">No recent activity</p>
                    )}
                </div>
            </motion.div>

            {/* Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl p-6 border border-white/10"
                style={{
                    background: `linear-gradient(135deg, ${currentTheme.colors.primary}10, ${currentTheme.colors.accent}10)`
                }}
            >
                <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
                    AI Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-sm text-white">
                            You're averaging <span className="font-bold" style={{ color: currentTheme.colors.primary }}>{analytics.averageMilestonesPerGoal} milestones</span> per vision
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-sm text-white">
                            Your <span className="font-bold text-orange-400">{analytics.currentStreak}-day streak</span> is on fire! Keep it up!
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-sm text-white">
                            <span className="font-bold text-green-400">{analytics.completionRate}%</span> completion rate is excellent!
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Journey Synthesis — Gemini 3 Thinking Mode */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl border border-white/10 overflow-hidden"
                style={{
                    background: `linear-gradient(160deg, ${currentTheme.colors.primary}15, ${currentTheme.colors.accent}08, transparent)`
                }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider flex items-center gap-2">
                            <Brain className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                            Journey Synthesis
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 normal-case tracking-normal font-normal">
                                Gemini 3 Deep Reasoning
                            </span>
                        </h3>
                        {!synthesis && (
                            <button
                                onClick={runSynthesis}
                                disabled={synthesisLoading || goals.length === 0}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                                style={{
                                    backgroundColor: `${currentTheme.colors.primary}20`,
                                    color: currentTheme.colors.primary,
                                }}
                            >
                                {synthesisLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Thinking deeply...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Analyze My Journey
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {!synthesis && !synthesisLoading && !synthesisError && (
                            <motion.p
                                key="placeholder"
                                exit={{ opacity: 0 }}
                                className="text-white/40 text-sm text-center py-8"
                            >
                                Gemini will use deep reasoning to find hidden patterns across all your goals, journals, and milestones.
                            </motion.p>
                        )}

                        {synthesisLoading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-10 gap-3"
                            >
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                                    <div
                                        className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                                        style={{ borderColor: `${currentTheme.colors.primary}80`, borderTopColor: 'transparent' }}
                                    />
                                    <Brain className="absolute inset-0 m-auto w-5 h-5 text-white/60" />
                                </div>
                                <p className="text-white/50 text-sm">Deep reasoning across {goals.length} goals...</p>
                            </motion.div>
                        )}

                        {synthesisError && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8"
                            >
                                <p className="text-white/50 text-sm mb-3">Synthesis unavailable right now.</p>
                                <button
                                    onClick={runSynthesis}
                                    className="text-sm underline"
                                    style={{ color: currentTheme.colors.primary }}
                                >
                                    Try again
                                </button>
                            </motion.div>
                        )}

                        {synthesis && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-5"
                            >
                                {/* Narrative */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-start gap-3">
                                        <Eye className="w-4 h-4 mt-1 shrink-0" style={{ color: currentTheme.colors.primary }} />
                                        <p className="text-sm text-white/80 leading-relaxed italic">
                                            "{synthesis.overallNarrative}"
                                        </p>
                                    </div>
                                </div>

                                {/* Patterns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {synthesis.patterns.map((pattern, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{
                                                        backgroundColor: pattern.type === 'strength'
                                                            ? '#10b981'
                                                            : pattern.type === 'growth_area'
                                                                ? '#f59e0b'
                                                                : currentTheme.colors.primary
                                                    }}
                                                />
                                                <span className="text-xs font-medium text-white/50 uppercase">
                                                    {pattern.type === 'strength' ? 'Strength' : pattern.type === 'growth_area' ? 'Growth Area' : 'Pattern'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-white mb-1">{pattern.title}</p>
                                            <p className="text-xs text-white/60 leading-relaxed">{pattern.description}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Cross-Goal Connections */}
                                {synthesis.crossGoalConnections.length > 0 && (
                                    <div className="space-y-3">
                                        {synthesis.crossGoalConnections.map((conn, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-white/5 flex items-start gap-3">
                                                <Link2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: currentTheme.colors.accent }} />
                                                <div>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {conn.goals.map((g, j) => (
                                                            <span
                                                                key={j}
                                                                className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70"
                                                            >
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-white/60 leading-relaxed">{conn.insight}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Next Best Action */}
                                <div
                                    className="p-4 rounded-xl border"
                                    style={{
                                        borderColor: `${currentTheme.colors.primary}30`,
                                        backgroundColor: `${currentTheme.colors.primary}08`
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: currentTheme.colors.primary }} />
                                        <div>
                                            <p className="text-xs font-medium text-white/50 uppercase mb-1">Highest-Leverage Action</p>
                                            <p className="text-sm text-white font-medium flex items-center gap-2">
                                                <ArrowRight className="w-3 h-3 shrink-0" style={{ color: currentTheme.colors.primary }} />
                                                {synthesis.nextBestAction}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Motivational Reframe */}
                                <p className="text-xs text-white/40 text-center leading-relaxed px-4">
                                    {synthesis.motivationalReframe}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default AnalyticsDashboard;
