import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { SavedGoal } from '@/lib/firestore';
import type { Voyage, Achievement } from '@/types';
import {
    Target,
    Calendar,
    TrendingUp,
    Star,
    Rocket,
    Compass,
    Award,
    ChevronRight,
} from 'lucide-react';

interface MissionControlProps {
    goals: SavedGoal[];
    activeVoyages?: Voyage[];
    recentAchievements?: Achievement[];
    userName?: string;
    onGoalSelect?: (goalId: string) => void;
    onViewCosmos?: () => void;
}

// Derive status from plan progress
const getGoalStatus = (goal: SavedGoal): 'completed' | 'active' | 'charted' => {
    const phases = goal.plan?.timeline || [];
    if (phases.length === 0) return 'charted';
    const completed = phases.filter(p => p.isCompleted).length;
    if (completed === phases.length) return 'completed';
    if (completed > 0) return 'active';
    return 'charted';
};

// Get stats from goals
const calculateStats = (goals: SavedGoal[]) => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => getGoalStatus(g) === 'completed').length;
    const activeGoals = goals.filter(g => getGoalStatus(g) === 'active').length;

    let totalWaypoints = 0;
    let completedWaypoints = 0;

    goals.forEach(goal => {
        const phases = goal.plan?.timeline || [];
        totalWaypoints += phases.length;
        completedWaypoints += phases.filter(p => p.isCompleted).length;
    });

    const overallProgress = totalWaypoints > 0
        ? Math.round((completedWaypoints / totalWaypoints) * 100)
        : 0;

    return {
        totalGoals,
        completedGoals,
        activeGoals,
        totalWaypoints,
        completedWaypoints,
        overallProgress,
    };
};

// Get the most active/recent voyage
const getCurrentVoyage = (goals: SavedGoal[]) => {
    const activeGoals = goals.filter(g => getGoalStatus(g) === 'active');
    if (activeGoals.length === 0) return null;

    // Find goal with most recent activity or highest progress
    return activeGoals.reduce((best, current) => {
        const currentPhases = current.plan?.timeline || [];
        const bestPhases = best.plan?.timeline || [];
        const currentCompleted = currentPhases.filter(p => p.isCompleted).length;
        const bestCompleted = bestPhases.filter(p => p.isCompleted).length;
        return currentCompleted >= bestCompleted ? current : best;
    });
};

export const MissionControl: React.FC<MissionControlProps> = ({
    goals,
    // activeVoyages prop available but not yet used
    recentAchievements = [],
    userName = 'Voyager',
    onGoalSelect,
    onViewCosmos,
}) => {
    const navigate = useNavigate();
    const stats = useMemo(() => calculateStats(goals), [goals]);
    const currentVoyage = useMemo(() => getCurrentVoyage(goals), [goals]);

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Handle goal click
    const handleGoalClick = (goalId: string) => {
        if (onGoalSelect) {
            onGoalSelect(goalId);
        } else {
            navigate(`/plan/${goalId}`);
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 lg:p-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <motion.div
                        className="p-2 rounded-xl bg-purple-500/20"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(168, 85, 247, 0.3)',
                                '0 0 30px rgba(168, 85, 247, 0.5)',
                                '0 0 20px rgba(168, 85, 247, 0.3)',
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Compass className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    <span className="text-purple-300 text-sm font-medium uppercase tracking-wider">
                        Mission Control
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-outfit font-bold text-white mb-1">
                    {getGreeting()}, {userName}
                </h1>
                <p className="text-white/60">
                    Your cosmic journey awaits. Here's your mission status.
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        label: 'Destinations',
                        value: stats.totalGoals,
                        icon: Target,
                        color: 'purple',
                    },
                    {
                        label: 'Discovered',
                        value: stats.completedGoals,
                        icon: Star,
                        color: 'yellow',
                    },
                    {
                        label: 'Active Voyages',
                        value: stats.activeGoals,
                        icon: Rocket,
                        color: 'blue',
                    },
                    {
                        label: 'Overall Progress',
                        value: `${stats.overallProgress}%`,
                        icon: TrendingUp,
                        color: 'green',
                    },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative overflow-hidden rounded-2xl p-5"
                        style={{
                            background: 'rgba(15, 5, 41, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div
                                className={`p-2 rounded-lg bg-${stat.color}-500/20`}
                                style={{
                                    background: `rgba(${stat.color === 'purple' ? '168, 85, 247' : stat.color === 'yellow' ? '251, 191, 36' : stat.color === 'blue' ? '59, 130, 246' : '34, 197, 94'}, 0.2)`,
                                }}
                            >
                                <stat.icon
                                    className="w-5 h-5"
                                    style={{
                                        color: stat.color === 'purple' ? '#a855f7' : stat.color === 'yellow' ? '#fbbf24' : stat.color === 'blue' ? '#3b82f6' : '#22c55e',
                                    }}
                                />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {stat.value}
                        </div>
                        <div className="text-sm text-white/50">{stat.label}</div>

                        {/* Decorative glow */}
                        <div
                            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                            style={{
                                background: stat.color === 'purple' ? '#a855f7' : stat.color === 'yellow' ? '#fbbf24' : stat.color === 'blue' ? '#3b82f6' : '#22c55e',
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Current Voyage Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-2 rounded-3xl p-6"
                    style={{
                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(168, 85, 247, 0.1))',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-outfit font-semibold text-white flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-purple-400" />
                            Current Voyage
                        </h2>
                        {onViewCosmos && (
                            <button
                                onClick={onViewCosmos}
                                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                View Cosmos <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {currentVoyage ? (
                        <div
                            className="rounded-2xl p-5 cursor-pointer transition-all hover:bg-white/5"
                            style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                            onClick={() => currentVoyage.id && handleGoalClick(currentVoyage.id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {currentVoyage.title}
                                    </h3>
                                    <p className="text-sm text-white/50 line-clamp-2">
                                        {currentVoyage.plan?.description || 'Charting your course...'}
                                    </p>
                                </div>
                                <div className="text-3xl">🪐</div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-white/60 mb-1">
                                    <span>Journey Progress</span>
                                    <span>
                                        {currentVoyage.plan?.timeline.filter(p => p.isCompleted).length || 0}/
                                        {currentVoyage.plan?.timeline.length || 0} waypoints
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                            background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${((currentVoyage.plan?.timeline.filter(p => p.isCompleted).length || 0) / (currentVoyage.plan?.timeline.length || 1)) * 100}%`,
                                        }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    />
                                </div>
                            </div>

                            {/* Next waypoint */}
                            {(() => {
                                const nextWaypoint = currentVoyage.plan?.timeline.find(p => !p.isCompleted);
                                if (!nextWaypoint) return null;
                                return (
                                    <div className="flex items-center gap-2 text-sm text-purple-300">
                                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                        <span>Next: {nextWaypoint.milestone}</span>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-3">🚀</div>
                            <p className="text-white/50">No active voyages</p>
                            <p className="text-sm text-white/30">
                                Chart a new destination to begin your journey
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Upcoming Milestones */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-3xl p-6"
                    style={{
                        background: 'rgba(15, 5, 41, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <h2 className="text-xl font-outfit font-semibold text-white flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        Upcoming Waypoints
                    </h2>

                    <div className="space-y-3">
                        {goals
                            .filter(g => getGoalStatus(g) === 'active')
                            .flatMap(goal => {
                                const upcomingPhases = (goal.plan?.timeline || [])
                                    .filter(p => !p.isCompleted)
                                    .slice(0, 1)
                                    .map(phase => ({
                                        goalId: goal.id,
                                        goalTitle: goal.title,
                                        phase,
                                    }));
                                return upcomingPhases;
                            })
                            .slice(0, 4)
                            .map((item, idx) => (
                                <motion.div
                                    key={`${item.goalId}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    className="p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                    }}
                                    onClick={() => item.goalId && handleGoalClick(item.goalId)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate">
                                                {item.phase.milestone}
                                            </p>
                                            <p className="text-xs text-white/40 truncate">
                                                {item.goalTitle}
                                            </p>
                                            {item.phase.date && (
                                                <p className="text-xs text-blue-400 mt-1">
                                                    {item.phase.date}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                        {goals.filter(g => getGoalStatus(g) === 'active').length === 0 && (
                            <div className="text-center py-6 text-white/40 text-sm">
                                No upcoming waypoints
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 rounded-3xl p-6"
                    style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(168, 85, 247, 0.05))',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                    }}
                >
                    <h2 className="text-xl font-outfit font-semibold text-white flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Recent Achievements
                    </h2>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {recentAchievements.map((achievement, idx) => (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 + idx * 0.1 }}
                                className="flex-shrink-0 w-48 p-4 rounded-xl text-center"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                }}
                            >
                                <div className="text-3xl mb-2">
                                    {achievement.type === 'goal' ? '🪐' : achievement.type === 'milestone' ? '🎯' : '✦'}
                                </div>
                                <p className="text-sm font-medium text-white truncate">
                                    {achievement.title}
                                </p>
                                <p className="text-xs text-yellow-400 mt-1">
                                    {achievement.type === 'goal' ? 'World Discovered' : 'Waypoint Cleared'}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Destinations Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
            >
                <h2 className="text-xl font-outfit font-semibold text-white flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-400" />
                    All Destinations
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map((goal, idx) => {
                        const phases = goal.plan?.timeline || [];
                        const completed = phases.filter(p => p.isCompleted).length;
                        const progress = phases.length > 0 ? Math.round((completed / phases.length) * 100) : 0;

                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + idx * 0.05 }}
                                className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/5"
                                style={{
                                    background: 'rgba(15, 5, 41, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                                onClick={() => goal.id && handleGoalClick(goal.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white truncate">
                                            {goal.title}
                                        </h3>
                                        <p className="text-xs text-white/40">
                                            {phases.length} waypoints • {progress}% complete
                                        </p>
                                    </div>
                                    <div
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getGoalStatus(goal) === 'completed'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : getGoalStatus(goal) === 'active'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}
                                    >
                                        {getGoalStatus(goal) === 'completed' ? 'Arrived' : getGoalStatus(goal) === 'active' ? 'En Route' : 'Charted'}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${progress}%`,
                                            background: getGoalStatus(goal) === 'completed'
                                                ? '#fbbf24'
                                                : 'linear-gradient(90deg, #a855f7, #3b82f6)',
                                        }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}

                    {goals.length === 0 && (
                        <div className="col-span-full text-center py-12 text-white/40">
                            <div className="text-4xl mb-3">🌌</div>
                            <p>No destinations charted yet</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default MissionControl;
