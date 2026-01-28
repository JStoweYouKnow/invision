export interface User {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    email: string | null;
    bio?: string;
    followers?: string[];
    following?: string[];
}

export interface Goal {
    id: string;
    userId: string;
    title: string;
    description: string;
    originalInput: string; // The text, URL, or image prompt
    status: 'draft' | 'active' | 'completed' | 'archived';
    imageUrl?: string;
    createdAt: number;
    deadline?: number;
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    date?: number; // Timestamp
    isCompleted: boolean;
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
