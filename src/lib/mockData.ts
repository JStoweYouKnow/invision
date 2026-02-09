import type { SavedGoal, UserProfile } from './firestore';

export const MOCK_USER: UserProfile = {
    uid: 'demo-user',
    displayName: 'Alex Visionary',
    email: 'alex@invision.app',
    photoURL: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=800&auto=format&fit=crop',
    bio: 'Dreamer, explorer, and coffee enthusiast. I use InVision to map out my future creative projects and travel goals.',
    preferences: {
        emailNotifications: true,
        publicProfile: true
    },
    friends: ['dummy_sarah'] // Start with Sarah as friend for demo? Or empty. Let's start empty.
};

export const MOCK_GOALS: SavedGoal[] = [
    {
        id: 'mock-goal-cyber',
        userId: 'demo-user',
        title: 'Cyberprototyping Studio',
        description: 'Design the first fully holographic living space.',
        createdAt: new Date(),
        visionImage: '/images/demo/cyber-studio.png',
        category: 'Career',
        celestialType: 'blackHole',
        plan: {
            title: 'Cyberprototyping Studio',
            description: 'Design the first fully holographic living space.',
            visionaryDescription: 'Design the first fully holographic living space.',
            timeline: [
                {
                    date: '2026-06-01',
                    milestone: 'Core Holographics',
                    description: 'Master volumetric projection logic and set up the initial laser grid.',
                    isCompleted: true,
                    steps: [
                        { text: 'Research volumetric displays', date: '2026-04-01', habit: 'Read optics papers daily' },
                        { text: 'Purchase laser diodes', date: '2026-04-15' },
                        { text: 'Build prototype frame', date: '2026-05-20' }
                    ],
                    resources: []
                },
                {
                    date: '2027-01-01',
                    milestone: 'Prototype Launch',
                    description: 'Unveil the "EtherRoom" concept to the design community.',
                    isCompleted: false,
                    steps: [
                        { text: 'Finalize software interface', date: '2026-09-01' },
                        { text: 'Invite beta testers', date: '2026-11-01' },
                        { text: 'Press release', date: '2026-12-15' }
                    ],
                    resources: []
                }
            ],
            sources: [
                { title: 'Volumetric Display Research', url: 'https://example.com/volumetric' },
                { title: 'Holographic User Interfaces', url: 'https://example.com/hui' }
            ]
        },
        authorName: 'Alex V.',
        authorPhoto: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'mock-goal-mars',
        userId: 'demo-user',
        title: 'Martian Greenhouse',
        description: 'Establish the first self-sustaining greenhouse on Mars topology.',
        createdAt: new Date(Date.now() - 86400000),
        visionImage: '/images/demo/mars-greenhouse.png',
        category: 'Education',
        celestialType: 'planet',
        plan: {
            title: 'Martian Greenhouse',
            description: 'Establish greenhouse on Mars.',
            visionaryDescription: 'Establish the first self-sustaining greenhouse on Mars topology.',
            timeline: [
                {
                    date: '2026-06-01',
                    milestone: 'Botany Selection',
                    description: 'Select potential plant candidates for low-gravity, high-radiation environments.',
                    isCompleted: true,
                    steps: [
                        { text: 'Review NASA archived data', date: '2026-02-01' },
                        { text: 'Select 5 candidate species', date: '2026-04-01' },
                        { text: 'Begin hydroponic tests', date: '2026-05-15' }
                    ],
                    resources: []
                },
                {
                    date: '2026-11-01',
                    milestone: 'Biosphere Design',
                    description: 'Architect the geodesic dome structure capable of withstanding dust storms.',
                    isCompleted: true,
                    steps: [
                        { text: 'Draft CAD blueprints', date: '2026-07-01' },
                        { text: 'Simulate wind loads', date: '2026-09-15' },
                        { text: 'Material stress testing', date: '2026-10-20' }
                    ],
                    resources: []
                },
                {
                    date: '2027-04-01',
                    milestone: 'Construction Logistics',
                    description: 'Plan the deployment of automated builder rovers.',
                    isCompleted: false,
                    steps: [
                        { text: 'Program rover pathfinding', date: '2027-01-10' },
                        { text: 'Test assembly sequence', date: '2027-03-01' }
                    ],
                    resources: []
                },
                {
                    date: '2027-09-01',
                    milestone: 'First Harvest',
                    description: 'Celebrate the first successful growth cycle of Martian red moss.',
                    isCompleted: false,
                    steps: [
                        { text: 'Monitor growth daily', date: '2027-06-01', habit: 'Log humidity levels' },
                        { text: 'Harvest samples', date: '2027-09-01' }
                    ],
                    resources: []
                }
            ],
            sources: [
                { title: 'NASA Mars Exploration Program', url: 'https://mars.nasa.gov' },
                { title: 'Botany in Microgravity', url: 'https://example.com/space-botany' }
            ]
        },
        authorName: 'Dr. Ares',
        authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
    },
    {
        id: 'mock-goal-deepsea',
        userId: 'demo-user',
        title: 'Bioluminescent Dive',
        description: 'Map the bioluminescent communication of deep sea leviathans.',
        createdAt: new Date(Date.now() - 172800000),
        visionImage: '/images/demo/biolum-dive.png',
        category: 'Travel',
        celestialType: 'icePlanet',
        plan: {
            title: 'Bioluminescent Dive',
            description: 'Map sea leviathans.',
            visionaryDescription: 'Map the bioluminescent communication of deep sea leviathans.',
            timeline: [
                {
                    date: '2026-05-01',
                    milestone: 'Deep Sea Certification',
                    description: 'Obtain necessary pilot certifications for high-pressure submersibles.',
                    isCompleted: true,
                    steps: [
                        { text: 'Complete PADI Advanced', date: '2026-02-15' },
                        { text: 'Submersible theory exam', date: '2026-04-20' }
                    ],
                    resources: []
                },
                {
                    date: '2026-09-01',
                    milestone: 'Expedition Planning',
                    description: 'Chart the course into the Mariana Trench sectors.',
                    isCompleted: true,
                    steps: [
                        { text: 'Analyze sonar maps', date: '2026-06-01' },
                        { text: 'Assemble crew', date: '2026-08-15' }
                    ],
                    resources: []
                },
                {
                    date: '2027-06-01',
                    milestone: 'The Descent',
                    description: 'Begin the dive to the abyssal zone.',
                    isCompleted: false,
                    steps: [
                        { text: 'Launch support vessel', date: '2027-05-20' },
                        { text: 'Begin dive sequence', date: '2027-06-01' }
                    ],
                    resources: []
                }
            ],
            sources: [
                { title: 'NOAA Ocean Exploration', url: 'https://oceanexplorer.noaa.gov' },
                { title: 'Bioluminescence Database', url: 'https://example.com/biolum' }
            ]
        },
        authorName: 'Marina D.',
        authorPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop'
    },
    {
        id: 'mock-goal-purity',
        userId: 'demo-user',
        title: 'Cloud Temple Retreat',
        description: 'Build a meditation retreat that floats above the cloudline.',
        createdAt: new Date(Date.now() - 259200000),
        visionImage: '/images/demo/cloud-temple.png',
        category: 'Health',
        celestialType: 'moon',
        plan: {
            title: 'Cloud Temple Retreat',
            description: 'Build a meditation retreat.',
            visionaryDescription: 'Build a meditation retreat that floats above the cloudline.',
            timeline: [
                {
                    date: '2026-04-01',
                    milestone: 'Architectural Concept',
                    description: 'Design the anti-gravity foundation platforms.',
                    isCompleted: true,
                    steps: [
                        { text: 'Sketch initial designs', date: '2026-02-01', habit: 'Daily meditation' },
                        { text: 'Consult with structural engineers', date: '2026-03-15' }
                    ],
                    resources: []
                },
                {
                    date: '2026-08-01',
                    milestone: 'Location Scouting',
                    description: 'Find the perfect mountain peak to anchor the floating structures.',
                    isCompleted: true,
                    steps: [
                        { text: 'Survey Himalayas', date: '2026-06-01' },
                        { text: 'Secure land rights', date: '2026-07-20' }
                    ],
                    resources: []
                },
                {
                    date: '2027-07-01',
                    milestone: 'Grand Opening',
                    description: 'Welcome the first monks and visitors to the sky temple.',
                    isCompleted: false,
                    steps: [
                        { text: 'Final safety inspection', date: '2027-06-01' },
                        { text: 'Opening ceremony', date: '2027-07-01' }
                    ],
                    resources: []
                }
            ],
            sources: [
                { title: 'Anti-Gravity Architecture', url: 'https://example.com/antigravity-arch' },
                { title: 'High Altitude Meditation', url: 'https://example.com/cloud-meditation' }
            ]
        },
        authorName: 'Alex V.',
        authorPhoto: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'mock-goal-quantum',
        userId: 'demo-user',
        title: 'Quantum Symphony',
        description: 'Compose a visual album based on string theory frequencies.',
        createdAt: new Date(Date.now() - 345600000),
        visionImage: '/images/demo/quantum-symphony.png',
        category: 'Creative',
        celestialType: 'star',
        plan: {
            title: 'Quantum Symphony',
            description: 'Compose a visual album.',
            visionaryDescription: 'Compose a visual album based on string theory frequencies.',
            timeline: [
                {
                    date: '2026-07-01',
                    milestone: 'Theory Study',
                    description: 'Translate mathematical string vibrations into audible frequencies.',
                    isCompleted: true,
                    steps: [
                        { text: 'Study Calabi-Yau manifolds', date: '2026-03-01' },
                        { text: 'Develop translation algorithm', date: '2026-06-15' }
                    ],
                    resources: []
                },
                {
                    date: '2026-12-01',
                    milestone: 'Composition',
                    description: 'Write the 4 movements of the symphony.',
                    isCompleted: true,
                    steps: [
                        { text: 'Movement 1: The Singularity', date: '2026-09-01' },
                        { text: 'Movement 2: Expansion', date: '2026-11-20' }
                    ],
                    resources: []
                },
                {
                    date: '2027-10-01',
                    milestone: 'Cosmic Premiere',
                    description: 'Live performance with real-time fractal visualization.',
                    isCompleted: false,
                    steps: [
                        { text: 'Book planetarium venue', date: '2027-05-01' },
                        { text: 'Rehearsals', date: '2027-08-01' }
                    ],
                    resources: []
                }
            ],
            sources: [
                { title: 'String Theory Visualization', url: 'https://example.com/string-theory' },
                { title: 'Fractal Music Generation', url: 'https://example.com/fractal-audio' }
            ]
        },
        authorName: 'Maestro X',
        authorPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop'
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
    },
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
    }
];
