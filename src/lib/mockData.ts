import type { SavedGoal } from './firestore';

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    bio: string;
    preferences: {
        emailNotifications: boolean;
        publicProfile: boolean;
    };
}

export const MOCK_USER: UserProfile = {
    uid: 'demo-user',
    displayName: 'Alex Visionary',
    email: 'alex@invision.app',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    bio: 'Dreamer, explorer, and coffee enthusiast. I use InVision to map out my future creative projects and travel goals.',
    preferences: {
        emailNotifications: true,
        publicProfile: true
    }
};

export const MOCK_GOALS: SavedGoal[] = [
    {
        id: 'mock-1',
        userId: 'demo-user',
        title: 'Become a Professional Chef',
        description: 'Master the culinary arts and open my own bistro.',
        createdAt: new Date(),
        visionImage: 'https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?q=80&w=2000&auto=format&fit=crop',
        plan: {
            title: 'Become a Professional Chef',
            description: 'Master the culinary arts',
            timeline: [
                {
                    date: '2026-01-01',
                    milestone: 'Culinary Basics',
                    description: 'Learn knife skills and mother sauces',
                    steps: [
                        { text: 'Buy knife set', date: '2025-12-15' },
                        { text: 'Practice chopping', date: '2025-12-22' },
                        { text: 'Make bechamel', date: '2026-01-01' }
                    ],
                    isCompleted: true,
                    resources: []
                },
                {
                    date: '2026-03-01',
                    milestone: 'Advanced Techniques',
                    description: 'Sous vide and molecular gastronomy',
                    steps: [
                        { text: 'Buy sous vide', date: '2026-02-01' },
                        { text: 'Cook steak', date: '2026-02-15' },
                        { text: 'Make foam', date: '2026-03-01' }
                    ],
                    isCompleted: true,
                    resources: []
                },
                {
                    date: '2026-06-01',
                    milestone: 'Internship',
                    description: 'Work in a real kitchen',
                    steps: [
                        { text: 'Apply to restaurants', date: '2026-04-01' },
                        { text: 'Interview', date: '2026-05-01' },
                        { text: 'Start working', date: '2026-06-01' }
                    ],
                    isCompleted: false,
                    resources: []
                },
                {
                    date: '2027-01-01',
                    milestone: 'Open Bistro',
                    description: 'Launch my own place',
                    steps: [
                        { text: 'Find location', date: '2026-09-01' },
                        { text: 'Hire staff', date: '2026-11-01' },
                        { text: 'Grand opening', date: '2027-01-01' }
                    ],
                    isCompleted: false,
                    resources: []
                }
            ],
            sources: []
        },
        authorName: 'Gordon R.',
        authorPhoto: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=200&auto=format&fit=crop'
    },
    {
        id: 'mock-2',
        userId: 'demo-user',
        title: 'Learn to Surf',
        description: 'Catch the big waves in Hawaii.',
        createdAt: new Date(Date.now() - 86400000),
        visionImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=2000&auto=format&fit=crop',
        plan: {
            title: 'Learn to Surf',
            description: 'Catch the big waves',
            timeline: [
                {
                    date: '2026-02-01',
                    milestone: 'Swimming Skills',
                    description: 'Build endurance',
                    steps: [
                        { text: 'Swim 1km', date: '2026-01-15' },
                        { text: 'Tread water 10 mins', date: '2026-02-01' }
                    ],
                    isCompleted: true,
                    resources: []
                },
                {
                    date: '2026-03-01',
                    milestone: 'Balance Training',
                    description: 'Core strength',
                    steps: [
                        { text: 'Yoga', date: '2026-02-15' },
                        { text: 'Balance board', date: '2026-03-01' }
                    ],
                    isCompleted: false,
                    resources: []
                },
                {
                    date: '2026-04-01',
                    milestone: 'First Wave',
                    description: 'Catch a wave standing up',
                    steps: [
                        { text: 'Paddle out', date: '2026-03-15' },
                        { text: 'Pop up', date: '2026-03-25' },
                        { text: 'Ride', date: '2026-04-01' }
                    ],
                    isCompleted: false,
                    resources: []
                }
            ],
            sources: []
        },
        authorName: 'Kai Lenny',
        authorPhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
        isPublic: true
    }
];
