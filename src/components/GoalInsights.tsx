import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Clock, Target, BarChart3, Lightbulb } from 'lucide-react';
import { differenceInDays, differenceInWeeks } from 'date-fns';
import type { GeneratedPlan } from '@/lib/gemini';
import type { DateChange, DateChangeReason, GoalInsights as GoalInsightsType, PauseRecord } from '@/types';

interface GoalInsightsProps {
    plan: GeneratedPlan;
    pauseHistory?: PauseRecord[];
    goalCreatedAt: number;
    className?: string;
    compact?: boolean;
    onInsightClick?: () => void;
}

// Extend the milestone type to include dateHistory
interface MilestoneWithHistory {
    date: string;
    milestone: string;
    description: string;
    steps: { text: string; date: string; habit?: string }[];
    isCompleted?: boolean;
    dateHistory?: DateChange[];
}

// Calculate insights from plan data
function calculateInsights(
    timeline: MilestoneWithHistory[],
    pauseHistory: PauseRecord[],
    goalCreatedAt: number
): GoalInsightsType {
    // Gather all date changes from all milestones
    const allChanges: DateChange[] = timeline.flatMap(m => m.dateHistory || []);

    const extensions = allChanges.filter(c => c.changeType === 'extend');
    const reschedules = allChanges.filter(c => c.changeType === 'reschedule');

    // Calculate average extension days
    const avgExtensionDays = extensions.length > 0
        ? Math.round(extensions.reduce((sum, c) => sum + c.daysDiff, 0) / extensions.length)
        : 0;

    // Find most common reason
    const reasonCounts: Record<string, number> = {};
    allChanges.forEach(c => {
        reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1;
    });
    const mostCommonReason = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as DateChangeReason | undefined || null;

    // Analyze week patterns - when do most changes happen relative to milestone date?
    const weekPatterns: Record<number, number> = {};
    allChanges.forEach(c => {
        // Calculate which week of the milestone this change happened
        const milestone = timeline.find(m =>
            (m.dateHistory || []).some(dh => dh.id === c.id)
        );
        if (milestone) {
            const milestoneStart = goalCreatedAt; // Approximate
            const changeTime = c.changedAt;
            const weekNum = Math.floor(differenceInWeeks(changeTime, milestoneStart));
            weekPatterns[weekNum] = (weekPatterns[weekNum] || 0) + 1;
        }
    });
    const weekOfMostChanges = Object.entries(weekPatterns)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Calculate streak without changes
    const lastChangeTime = allChanges.length > 0
        ? Math.max(...allChanges.map(c => c.changedAt))
        : goalCreatedAt;
    const streakWithoutChanges = differenceInDays(new Date(), lastChangeTime);

    // Pause statistics
    const totalPauseDays = pauseHistory.reduce((sum, p) => sum + (p.daysShifted || 0), 0);

    return {
        totalDateChanges: allChanges.length,
        totalExtensions: extensions.length,
        totalReschedules: reschedules.length,
        averageExtensionDays: avgExtensionDays,
        mostCommonChangeReason: mostCommonReason,
        weekOfMostChanges: weekOfMostChanges ? parseInt(weekOfMostChanges) + 1 : null, // 1-indexed for display
        completionRateAfterExtension: 0, // Would need completion data to calculate
        streakWithoutChanges,
        pauseCount: pauseHistory.length,
        totalPauseDays,
    };
}

// Get contextual insight message
function getInsightMessage(insights: GoalInsightsType): { type: 'success' | 'warning' | 'info'; message: string; tip?: string } | null {
    // Positive: Long streak without changes
    if (insights.streakWithoutChanges > 14 && insights.totalDateChanges > 0) {
        return {
            type: 'success',
            message: `${insights.streakWithoutChanges} days without deadline changes`,
            tip: "You're building consistent habits!"
        };
    }

    // Warning: Pattern of extensions
    if (insights.totalExtensions >= 3) {
        const reasonText = insights.mostCommonChangeReason
            ? `Most common reason: "${insights.mostCommonChangeReason.replace('_', ' ')}"`
            : '';

        return {
            type: 'warning',
            message: `You've extended deadlines ${insights.totalExtensions} times`,
            tip: insights.averageExtensionDays > 0
                ? `Average extension: ${insights.averageExtensionDays} days. ${reasonText}`
                : reasonText
        };
    }

    // Info: Week pattern detected
    if (insights.weekOfMostChanges && insights.totalDateChanges >= 2) {
        return {
            type: 'info',
            message: `Most deadline changes happen in week ${insights.weekOfMostChanges}`,
            tip: "Consider adjusting your initial timeline estimates"
        };
    }

    // Positive: Moving dates earlier
    if (insights.totalReschedules > insights.totalExtensions && insights.totalReschedules > 0) {
        return {
            type: 'success',
            message: `You've moved ${insights.totalReschedules} deadlines earlier`,
            tip: "Great momentum - you're ahead of schedule!"
        };
    }

    return null;
}

export const GoalInsights: React.FC<GoalInsightsProps> = ({
    plan,
    pauseHistory = [],
    goalCreatedAt,
    className = '',
    compact = false,
    onInsightClick,
}) => {
    const insights = useMemo(() => {
        return calculateInsights(
            plan.timeline as MilestoneWithHistory[],
            pauseHistory,
            goalCreatedAt
        );
    }, [plan.timeline, pauseHistory, goalCreatedAt]);

    const insightMessage = useMemo(() => getInsightMessage(insights), [insights]);

    // Don't render if no meaningful insights
    if (insights.totalDateChanges === 0 && insights.pauseCount === 0) {
        return null;
    }

    if (compact) {
        // Compact badge version for headers/cards
        if (!insightMessage) return null;

        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onInsightClick}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${insightMessage.type === 'success'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : insightMessage.type === 'warning'
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    } ${className}`}
            >
                {insightMessage.type === 'success' && <Target className="w-3 h-3" />}
                {insightMessage.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                {insightMessage.type === 'info' && <Lightbulb className="w-3 h-3" />}
                <span className="max-w-[150px] truncate">{insights.totalDateChanges} date changes</span>
            </motion.button>
        );
    }

    // Full insights panel
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border ${insightMessage?.type === 'success'
                ? 'bg-green-50 border-green-200'
                : insightMessage?.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                } ${className}`}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <BarChart3 className={`w-5 h-5 ${insightMessage?.type === 'success'
                    ? 'text-green-600'
                    : insightMessage?.type === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`} />
                <h4 className="font-bold text-sm text-gray-800">Goal Insights</h4>
            </div>

            {/* Main Insight Message */}
            {insightMessage && (
                <div className={`p-3 rounded-xl mb-3 ${insightMessage.type === 'success'
                    ? 'bg-green-100/50'
                    : insightMessage.type === 'warning'
                        ? 'bg-amber-100/50'
                        : 'bg-blue-100/50'
                    }`}>
                    <p className={`font-medium text-sm ${insightMessage.type === 'success'
                        ? 'text-green-800'
                        : insightMessage.type === 'warning'
                            ? 'text-amber-800'
                            : 'text-blue-800'
                        }`}>
                        {insightMessage.message}
                    </p>
                    {insightMessage.tip && (
                        <p className={`text-xs mt-1 ${insightMessage.type === 'success'
                            ? 'text-green-600'
                            : insightMessage.type === 'warning'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }`}>
                            {insightMessage.tip}
                        </p>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-wide">Extensions</span>
                    </div>
                    <p className="font-bold text-lg text-gray-800">{insights.totalExtensions}</p>
                </div>
                <div className="text-center border-x border-gray-200">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-wide">Avg Days</span>
                    </div>
                    <p className="font-bold text-lg text-gray-800">
                        {insights.averageExtensionDays > 0 ? `+${insights.averageExtensionDays}` : '0'}
                    </p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Target className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-wide">Streak</span>
                    </div>
                    <p className="font-bold text-lg text-gray-800">{insights.streakWithoutChanges}d</p>
                </div>
            </div>

            {/* Pause Info */}
            {insights.pauseCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Paused {insights.pauseCount} time{insights.pauseCount > 1 ? 's' : ''} ({insights.totalPauseDays} days total)
                    </p>
                </div>
            )}
        </motion.div>
    );
};

// Export utility function for use elsewhere
export { calculateInsights };
