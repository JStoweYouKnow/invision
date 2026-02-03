export interface User {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    email: string | null;
    bio?: string;
    followers?: string[];
    following?: string[];
}

// Pause history for life disruptions
export interface PauseRecord {
    id: string;
    pausedAt: number;          // timestamp when paused
    resumedAt?: number;        // timestamp when resumed (undefined if still paused)
    reason: string;
    reasonCategory: 'health' | 'family' | 'work' | 'travel' | 'mental' | 'other';
    daysShifted?: number;      // how much all dates moved on resume
}

// Goal insights for pattern detection
export interface GoalInsights {
    totalDateChanges: number;
    totalExtensions: number;
    totalReschedules: number;
    averageExtensionDays: number;
    mostCommonChangeReason: DateChangeReason | null;
    weekOfMostChanges: number | null;        // week number when most changes happen
    completionRateAfterExtension: number;    // 0-1
    streakWithoutChanges: number;            // days since last change
    pauseCount: number;
    totalPauseDays: number;
}

export interface Goal {
    id: string;
    userId: string;
    title: string;
    description: string;
    originalInput: string; // The text, URL, or image prompt
    status: 'draft' | 'active' | 'completed' | 'archived' | 'paused';
    imageUrl?: string;
    createdAt: number;
    deadline?: number;
    // Pause functionality
    pausedAt?: number;           // timestamp when currently paused
    pauseReason?: string;
    pauseReasonCategory?: 'health' | 'family' | 'work' | 'travel' | 'mental' | 'other';
    pauseHistory?: PauseRecord[];
}

// Date change tracking for accountability
export type DateChangeType = 'extend' | 'reschedule' | 'pause_resume';

export type DateChangeReason =
    | 'life_event'
    | 'underestimated_effort'
    | 'priorities_shifted'
    | 'health_issue'
    | 'work_crisis'
    | 'other';

export interface DateChange {
    id: string;
    previousDate: string;      // YYYY-MM-DD
    newDate: string;           // YYYY-MM-DD
    changedAt: number;         // timestamp
    reason: DateChangeReason;
    explanation: string;       // user-provided explanation
    changeType: DateChangeType;
    daysDiff: number;          // positive = extended, negative = rescheduled earlier
}

// Step change tracking
export type StepChangeType = 'add' | 'remove' | 'edit' | 'reorder';

export interface StepChange {
    id: string;
    changeType: StepChangeType;
    changedAt: number;
    stepIndex: number;
    previousValue?: {
        text?: string;
        date?: string;
        habit?: string;
    };
    newValue?: {
        text?: string;
        date?: string;
        habit?: string;
    };
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    date?: number; // Timestamp
    isCompleted: boolean;
    dateHistory?: DateChange[];  // Track all date modifications
    stepHistory?: StepChange[];  // Track step modifications
}

export interface Plan {
    id: string;
    goalId: string;
    timeline: Milestone[];
    sources: { title: string; url: string }[];
    createdAt: number;
}

/* ═══════════════════════════════════════════════════════════════
   COSMIC JOURNEY TYPES
   ═══════════════════════════════════════════════════════════════ */

// Celestial object types for goals
export type CelestialType = 'planet' | 'moon' | 'gasGiant' | 'icePlanet' | 'star' | 'galaxy';

// Status of a celestial destination (goal)
export type DestinationStatus = 'undiscovered' | 'charted' | 'enRoute' | 'arrived' | 'archived';

// Status of a voyage (project)
export type VoyageStatus = 'planning' | 'launched' | 'cruising' | 'approaching' | 'landed';

// Types of waypoints (tasks)
export type WaypointType = 'asteroid' | 'moon' | 'nebula' | 'comet' | 'meteor';

// Status of a waypoint (task)
export type WaypointStatus = 'locked' | 'available' | 'inProgress' | 'completed';

// Extended Goal with cosmic properties
export interface CosmicGoal extends Goal {
    celestialType: CelestialType;
    destinationStatus: DestinationStatus;
    distanceFromOrigin: number; // Visual scale 1-100
}

// Waypoint represents a task in the cosmic journey
export interface Waypoint {
    id: string;
    taskId: string;
    type: WaypointType;
    status: WaypointStatus;
    position: number; // 0-100 along trajectory
    isUrgent?: boolean;
    title: string;
    description?: string;
    dueDate?: number;
}

// Voyage represents a project/journey to a goal
export interface Voyage {
    id: string;
    projectId: string;
    goalId: string;
    status: VoyageStatus;
    progress: number; // 0-100
    waypoints: Waypoint[];
    startedAt?: number;
    completedAt?: number;
}

// Vision board item as a star in a constellation
export interface VisionStar {
    id: string;
    imageUrl: string;
    title: string;
    description?: string;
    position: { x: number; y: number }; // Position in constellation
}

// Star pattern for constellations
export interface StarPattern {
    points: { x: number; y: number }[]; // Relative positions
    connections: [number, number][]; // Lines between star indices
}

// Constellation grouping vision board items
export interface Constellation {
    id: string;
    name: string; // User-defined, e.g., "The Creator"
    stars: VisionStar[];
    pattern: StarPattern;
    isActive?: boolean;
}

// Voyager position in the cosmos
export interface VoyagerPosition {
    x: number;
    y: number;
    currentVoyageId?: string;
    currentWaypointId?: string;
}

// The Guide's contextual state
export interface GuideContext {
    activeGoal?: Goal;
    activeVoyage?: Voyage;
    currentLocation: 'home' | 'cosmos' | 'planet' | 'voyage' | 'constellation';
}

// Achievement types for celebrations
export type AchievementType = 'waypoint' | 'milestone' | 'goal' | 'constellation';

// Achievement data for celebrations
export interface Achievement {
    id: string;
    type: AchievementType;
    title: string;
    description: string;
    earnedAt: number;
    stats?: {
        daysToComplete?: number;
        waypointsCleared?: number;
        streakDays?: number;
    };
}
