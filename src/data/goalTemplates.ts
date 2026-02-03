export interface GoalTemplate {
    category: string;
    icon: string;
    goals: string[];
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
    {
        category: 'Health & Wellness',
        icon: '💪',
        goals: [
            "Train for and complete a marathon",
            "Master the art of sourdough baking",
            "Switch to a plant-based diet for 30 days",
            "Establish a consistent 6AM morning routine",
            "Learn to swim and swim 1km non-stop"
        ]
    },
    {
        category: 'Career & Growth',
        icon: '🚀',
        goals: [
            "Transition into a Product Management role",
            "Launch a profitable side business",
            "Learn Python and build a web scraper",
            "Public speak at a local tech meetup",
            "Read 24 books in one year"
        ]
    },
    {
        category: 'Adventure & Travel',
        icon: '🌍',
        goals: [
            "Backpack through Southeast Asia",
            "Visit all 7 continents",
            "Learn to scuba dive and get PADI certified",
            "Road trip across the USA on Route 66",
            "Climb Mount Kilimanjaro"
        ]
    },
    {
        category: 'Creativity & Arts',
        icon: '🎨',
        goals: [
            "Write and finish a novel draft",
            "Learn to play the piano",
            "Paint a self-portrait in oils",
            "Start a podcast and release 10 episodes",
            "Learn photography and hold a small exhibition"
        ]
    },
    {
        category: 'Mindfulness & Spirit',
        icon: '🧘',
        goals: [
            "Meditate for 365 days consecutively",
            "Attend a 10-day silent retreat",
            "Keep a gratitude journal for a year",
            "Learn Tarot reading",
            "Practice yoga 3 times a week"
        ]
    }
];
