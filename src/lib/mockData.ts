import type { SavedGoal, UserProfile } from './firestore';

export const MOCK_USER: UserProfile = {
    uid: 'demo-user',
    displayName: 'Alex Visionary',
    email: 'alex@invision.app',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    bio: 'Dreamer, explorer, and coffee enthusiast. I use InVision to map out my future creative projects and travel goals.',
    preferences: {
        emailNotifications: true,
        publicProfile: true
    },
    friends: ['dummy_sarah'] // Start with Sarah as friend for demo? Or empty. Let's start empty.
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
        authorPhoto: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=200&auto=format&fit=crop',
        category: 'Creative'
    },
    {
        id: 'mock-2',
        userId: 'demo-user',
        title: 'Learn to Surf',
        description: 'Catch the big waves in Hawaii.',
        createdAt: new Date(Date.now() - 86400000),
        visionImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=2000&auto=format&fit=crop',
        category: 'Health',
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
    }
];

export const MOCK_ADDITIONAL_USERS: UserProfile[] = [
    {
        uid: 'dummy_sarah',
        displayName: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        bio: 'Aspiring artist and nature lover. Dreaming of capturing the world on canvas.',
        preferences: {
            emailNotifications: false,
            publicProfile: true
        }
    },
    {
        uid: 'dummy_david',
        displayName: 'David Chen',
        email: 'david.c@example.com',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        bio: 'Tech enthusiast and marathon runner. Pushing limits every day.',
        preferences: {
            emailNotifications: false,
            publicProfile: true
        }
    }
];

export const MOCK_ADDITIONAL_GOALS: SavedGoal[] = [
    {
        id: 'goal_sarah_1',
        userId: 'dummy_sarah',
        title: 'Open an Art Gallery in Paris',
        description: 'To create a space where modern art meets nature in the heart of Montmartre.',
        createdAt: new Date(),
        visionImage: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?q=80&w=800&auto=format&fit=crop',
        celestialType: 'planet',
        isPublic: true,
        plan: {
            title: 'The Jenkins Gallery Project',
            description: 'To create a space where modern art meets nature in the heart of Montmartre.',
            timeline: [
                {
                    date: '2026-03-01',
                    milestone: 'Concept & Funding',
                    description: 'Finalize business plan and secure initial investment.',
                    steps: [
                        { text: 'Draft business proposal', date: '2026-02-15' },
                        { text: 'Meet with investors', date: '2026-02-28' },
                        { text: 'Register business entity in France', date: '2026-03-01' }
                    ],
                    isCompleted: true,
                    resources: []
                },
                {
                    date: '2026-05-15',
                    milestone: 'Location Scouting',
                    description: 'Find the perfect space in Montmartre.',
                    steps: [
                        { text: 'Contact commercial real estate agents', date: '2026-04-01' },
                        { text: 'Tour properties in 18th Arrondissement', date: '2026-04-15' },
                        { text: 'Sign lease', date: '2026-05-15' }
                    ],
                    isCompleted: false,
                    resources: []
                },
                {
                    date: '2026-08-01',
                    milestone: 'Curation & Renovation',
                    description: 'Prepare the space and select artists.',
                    steps: [
                        { text: 'Renovate gallery interior', date: '2026-06-01' },
                        { text: 'Call for submissions', date: '2026-06-15' },
                        { text: 'Select launch artists', date: '2026-07-20' }
                    ],
                    isCompleted: false,
                    resources: []
                },
                {
                    date: '2026-10-01',
                    milestone: 'Grand Opening',
                    description: 'Launch event for the gallery.',
                    steps: [
                        { text: 'Send invitations', date: '2026-09-01' },
                        { text: 'Press release', date: '2026-09-15' },
                        { text: 'Opening Night Gala', date: '2026-10-01' }
                    ],
                    isCompleted: false,
                    resources: []
                }
            ],
            sources: []
        },
        authorName: 'Sarah Jenkins',
        authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        category: 'Creative'
    },
    {
        id: 'goal_david_1',
        userId: 'dummy_david',
        title: 'Run the Boston Marathon',
        description: 'Qualify for and complete the Boston Marathon with a sub-3 hour time.',
        createdAt: new Date(),
        visionImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=800&auto=format&fit=crop',
        celestialType: 'star',
        isPublic: true,
        category: 'Health',
        plan: {
            title: 'Road to Boston',
            description: 'Qualify for and complete the Boston Marathon with a sub-3 hour time.',
            timeline: [
                {
                    date: '2026-04-01',
                    milestone: 'Base Construction',
                    description: 'Build aerobic base and consistency.',
                    steps: [
                        { text: 'Run 30 miles/week', date: '2026-02-15' },
                        { text: 'Strength training 2x/week', date: '2026-03-01' },
                        { text: 'Complete 10k tune-up race', date: '2026-03-20' }
                    ],
                    isCompleted: true,
                    resources: []
                },
                {
                    date: '2026-07-01',
                    milestone: 'Speed & Endurance',
                    description: 'Increase mileage and introduce threshold workouts.',
                    steps: [
                        { text: 'Run 50 miles/week', date: '2026-05-01' },
                        { text: 'Track workouts (intervals)', date: '2026-05-15' },
                        { text: 'Half-marathon time trial', date: '2026-06-15' }
                    ],
                    isCompleted: false,
                    resources: []
                },
                {
                    date: '2026-09-15',
                    milestone: 'Qualifying Race',
                    description: 'Run a BQ (Boston Qualifier) time.',
                    steps: [
                        { text: 'Taper week', date: '2026-09-01' },
                        { text: 'Carb load', date: '2026-09-12' },
                        { text: 'Run Marathon (Target < 3:00)', date: '2026-09-15' }
                    ],
                    isCompleted: false,
                    resources: []
                },
                {
                    date: '2027-04-19',
                    milestone: 'Boston Marathon',
                    description: 'The big day.',
                    steps: [
                        { text: 'Register for Boston', date: '2026-09-20' },
                        { text: 'Winter training block', date: '2027-01-01' },
                        { text: 'Race Day', date: '2027-04-19' }
                    ],
                    isCompleted: false,
                    resources: []
                }
            ],
            sources: []
        },
        authorName: 'David Chen',
        authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
    }
];
