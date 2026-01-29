# InVision Feature Implementation Plan

## Overview
Two features to add "wow factor" to the hackathon submission:
1. **Warp Animation** - Visual effect when wormhole button is pressed
2. **AI-Powered Journaling** - Journal entries with Gemini reflection prompts

---

## Feature 1: Warp Animation (Quick Win)

### Concept
When user clicks "Surprise Me" (wormhole button), trigger a full-screen warp/hyperspace animation that plays while Gemini generates the random vision.

### Files to Modify
1. `src/components/WarpAnimation.tsx` (NEW)
2. `src/pages/LandingPage.tsx` (modify handleWormhole)
3. `src/components/GoalInput.tsx` (optional - add loading state visual)

### Implementation Steps

#### Step 1: Create WarpAnimation Component
Create `/src/components/WarpAnimation.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarpAnimationProps {
    isActive: boolean;
    onComplete?: () => void;
}

export const WarpAnimation: React.FC<WarpAnimationProps> = ({ isActive, onComplete }) => {
    const [stars, setStars] = useState<Array<{
        id: number;
        x: number;
        y: number;
        size: number;
        delay: number;
    }>>([]);

    useEffect(() => {
        if (isActive) {
            // Generate 150 stars in random positions
            const newStars = Array.from({ length: 150 }, (_, i) => ({
                id: i,
                x: Math.random() * 100, // percentage
                y: Math.random() * 100,
                size: Math.random() * 3 + 1,
                delay: Math.random() * 0.5,
            }));
            setStars(newStars);
        }
    }, [isActive]);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    className="fixed inset-0 z-[200] overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ background: 'radial-gradient(ellipse at center, #1a0a3e 0%, #000000 100%)' }}
                >
                    {/* Warp tunnel effect */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle at center, transparent 0%, transparent 20%, rgba(139, 92, 246, 0.1) 40%, rgba(139, 92, 246, 0.3) 60%, transparent 80%)',
                        }}
                        animate={{
                            scale: [1, 3, 8],
                            opacity: [0.5, 0.8, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                        }}
                    />

                    {/* Streaking stars */}
                    {stars.map((star) => (
                        <motion.div
                            key={star.id}
                            className="absolute rounded-full bg-white"
                            style={{
                                left: `${star.x}%`,
                                top: `${star.y}%`,
                                width: star.size,
                                height: star.size,
                            }}
                            initial={{
                                scale: 0,
                                x: 0,
                                y: 0,
                            }}
                            animate={{
                                scale: [0, 1, 1, 0],
                                x: [0, (star.x - 50) * 20], // Streak outward from center
                                y: [0, (star.y - 50) * 20],
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                delay: star.delay,
                                repeat: Infinity,
                                ease: 'easeIn',
                            }}
                        />
                    ))}

                    {/* Central vortex */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                            className="w-32 h-32 rounded-full"
                            style={{
                                background: 'radial-gradient(circle, #a855f7 0%, #6366f1 50%, transparent 70%)',
                                boxShadow: '0 0 60px 30px rgba(139, 92, 246, 0.5)',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 360],
                            }}
                            transition={{
                                scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                            }}
                        />
                    </div>

                    {/* Loading text */}
                    <motion.div
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.p
                            className="text-white/80 text-lg font-medium"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            Traversing the cosmic unknown...
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
```

#### Step 2: Integrate into LandingPage
Modify `/src/pages/LandingPage.tsx`:

```tsx
// Add import
import { WarpAnimation } from '@/components/WarpAnimation';

// Add state
const [isWarping, setIsWarping] = useState(false);

// Modify handleWormhole
const handleWormhole = async () => {
    setIsWarping(true);  // Start animation
    setIsLoading(true);
    try {
        const plan = await geminiService.generatePlan("", "flexible", undefined, true);
        const imgUrl = await geminiService.generateVisionImage(plan.title, plan.visionaryDescription);

        setGeneratedPlan(plan);
        setVisionImage(imgUrl);

        if (user) {
            await firestoreService.saveGoal(/* ... */);
        }
    } catch (error) {
        showError(`Failed to enter wormhole: ${(error as Error).message}`);
    } finally {
        setIsLoading(false);
        setIsWarping(false);  // End animation
    }
};

// Add component before closing </div>
<WarpAnimation isActive={isWarping} />
```

---

## Feature 2: AI-Powered Journaling (Deep Feature)

### Concept
Users can add journal entries to milestones as they progress. Gemini generates reflection prompts and provides encouragement based on entries.

### Data Model

#### New Firestore Collection: `journal_entries`
```typescript
interface JournalEntry {
    id: string;
    goalId: string;           // Reference to parent goal
    milestoneIndex: number;   // Which milestone this is for (-1 for general)
    userId: string;
    content: string;          // User's journal text
    mood?: 'great' | 'good' | 'neutral' | 'struggling' | 'frustrated';
    aiReflection?: string;    // Gemini's response/encouragement
    aiPrompt?: string;        // The prompt that was shown to user
    createdAt: Date;
    updatedAt: Date;
}
```

### Files to Create
1. `src/components/JournalEntry.tsx` - Entry display component
2. `src/components/JournalEditor.tsx` - Write/edit journal modal
3. `src/components/JournalTimeline.tsx` - Timeline of entries for a goal

### Files to Modify
1. `src/lib/firestore.ts` - Add journal CRUD operations
2. `src/lib/gemini.ts` - Add journal prompt generation
3. `src/pages/PlanDetailsPage.tsx` - Add journal section
4. `src/components/PlanViewer.tsx` - Add journal button on milestones

### Implementation Steps

#### Step 1: Add to firestore.ts

```typescript
// Add to firestore.ts

export interface JournalEntry {
    id?: string;
    goalId: string;
    milestoneIndex: number; // -1 for general entries
    stepIndex?: number;     // Optional: specific step
    userId: string;
    content: string;
    mood?: 'great' | 'good' | 'neutral' | 'struggling' | 'frustrated';
    aiReflection?: string;
    aiPrompt?: string;
    createdAt: Date;
    updatedAt: Date;
}

// In firestoreService object:
async saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'journal_entries'), {
        ...entry,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
},

async getJournalEntries(goalId: string): Promise<JournalEntry[]> {
    const q = query(
        collection(db, 'journal_entries'),
        where('goalId', '==', goalId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toDate(doc.data().createdAt),
        updatedAt: toDate(doc.data().updatedAt)
    })) as JournalEntry[];
},

async updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
    const docRef = doc(db, 'journal_entries', entryId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
},

async deleteJournalEntry(entryId: string): Promise<void> {
    await deleteDoc(doc(db, 'journal_entries', entryId));
}
```

#### Step 2: Add to gemini.ts

```typescript
// Add to gemini.ts

async generateJournalPrompt(
    goalTitle: string,
    milestoneName: string,
    previousEntries: string[] = []
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
    You are a supportive life coach helping someone reflect on their journey toward: "${goalTitle}"

    They are currently working on the milestone: "${milestoneName}"

    ${previousEntries.length > 0 ? `Their recent journal entries:\n${previousEntries.slice(0, 3).join('\n---\n')}` : ''}

    Generate ONE thoughtful, specific journal prompt question that:
    1. Encourages deep self-reflection
    2. Connects to their specific goal and milestone
    3. Is warm and encouraging in tone
    4. Helps them recognize progress or identify obstacles

    Return ONLY the question, no quotes or extra formatting.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
},

async generateJournalReflection(
    goalTitle: string,
    milestoneName: string,
    journalEntry: string,
    mood: string
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
    You are a warm, encouraging life coach. Someone pursuing "${goalTitle}"
    just wrote this journal entry about "${milestoneName}":

    "${journalEntry}"

    Their current mood: ${mood}

    Write a brief (2-3 sentences) supportive response that:
    1. Acknowledges their feelings and effort
    2. Offers one specific insight or encouragement
    3. ${mood === 'struggling' || mood === 'frustrated'
        ? 'Provides gentle reassurance and perspective'
        : 'Celebrates their progress and momentum'}

    Be genuine and specific to what they wrote. Avoid generic platitudes.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}
```

#### Step 3: Create JournalEditor Component

Create `/src/components/JournalEditor.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Loader2 } from 'lucide-react';
import { geminiService } from '@/lib/gemini';
import { firestoreService, type JournalEntry } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface JournalEditorProps {
    isOpen: boolean;
    onClose: () => void;
    goalId: string;
    goalTitle: string;
    milestoneName: string;
    milestoneIndex: number;
    existingEntry?: JournalEntry;
    onSave: (entry: JournalEntry) => void;
}

const MOODS = [
    { value: 'great', emoji: '🌟', label: 'Great' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'struggling', emoji: '😔', label: 'Struggling' },
    { value: 'frustrated', emoji: '😤', label: 'Frustrated' },
] as const;

export const JournalEditor: React.FC<JournalEditorProps> = ({
    isOpen,
    onClose,
    goalId,
    goalTitle,
    milestoneName,
    milestoneIndex,
    existingEntry,
    onSave
}) => {
    const { user } = useAuth();
    const [content, setContent] = useState(existingEntry?.content || '');
    const [mood, setMood] = useState<JournalEntry['mood']>(existingEntry?.mood || 'neutral');
    const [aiPrompt, setAiPrompt] = useState(existingEntry?.aiPrompt || '');
    const [aiReflection, setAiReflection] = useState(existingEntry?.aiReflection || '');
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Generate AI prompt when modal opens
    useEffect(() => {
        if (isOpen && !existingEntry && !aiPrompt) {
            generatePrompt();
        }
    }, [isOpen]);

    const generatePrompt = async () => {
        setIsGeneratingPrompt(true);
        try {
            const prompt = await geminiService.generateJournalPrompt(
                goalTitle,
                milestoneName
            );
            setAiPrompt(prompt);
        } catch (error) {
            console.error('Failed to generate prompt:', error);
            setAiPrompt("What progress have you made today? How are you feeling about your journey?");
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleSave = async () => {
        if (!user || !content.trim()) return;

        setIsSaving(true);
        try {
            // Generate AI reflection
            const reflection = await geminiService.generateJournalReflection(
                goalTitle,
                milestoneName,
                content,
                mood || 'neutral'
            );
            setAiReflection(reflection);

            const entryData = {
                goalId,
                milestoneIndex,
                userId: user.uid,
                content: content.trim(),
                mood,
                aiPrompt,
                aiReflection: reflection
            };

            if (existingEntry?.id) {
                await firestoreService.updateJournalEntry(existingEntry.id, entryData);
                onSave({ ...existingEntry, ...entryData, updatedAt: new Date() });
            } else {
                const id = await firestoreService.saveJournalEntry(entryData);
                onSave({
                    id,
                    ...entryData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save entry:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[101]"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Journal Entry</h2>
                                        <p className="text-sm text-slate-500 mt-1">{milestoneName}</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* AI Prompt */}
                                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-brand-purple" />
                                        <span className="text-sm font-semibold text-brand-purple">Reflection Prompt</span>
                                    </div>
                                    {isGeneratingPrompt ? (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Generating prompt...</span>
                                        </div>
                                    ) : (
                                        <p className="text-slate-700 text-sm italic">{aiPrompt}</p>
                                    )}
                                </div>

                                {/* Mood Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        How are you feeling?
                                    </label>
                                    <div className="flex gap-2">
                                        {MOODS.map((m) => (
                                            <button
                                                key={m.value}
                                                onClick={() => setMood(m.value)}
                                                className={`flex-1 py-3 rounded-xl text-center transition-all ${
                                                    mood === m.value
                                                        ? 'bg-brand-purple text-white shadow-lg'
                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                <span className="text-xl">{m.emoji}</span>
                                                <span className="block text-xs mt-1 font-medium">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Journal Text */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Your thoughts
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write freely about your progress, challenges, or insights..."
                                        className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 resize-none"
                                    />
                                </div>

                                {/* AI Reflection (shown after save or for existing entries) */}
                                {aiReflection && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-brand-purple" />
                                            <span className="text-sm font-semibold text-brand-purple">AI Reflection</span>
                                        </div>
                                        <p className="text-slate-700 text-sm">{aiReflection}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !content.trim()}
                                    className="flex-1 py-3 rounded-full font-bold text-white bg-brand-purple hover:bg-brand-purple/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Save Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
```

#### Step 4: Create JournalTimeline Component

Create `/src/components/JournalTimeline.tsx`:

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Calendar } from 'lucide-react';
import type { JournalEntry } from '@/lib/firestore';

interface JournalTimelineProps {
    entries: JournalEntry[];
    onEntryClick?: (entry: JournalEntry) => void;
}

const moodEmojis: Record<string, string> = {
    great: '🌟',
    good: '😊',
    neutral: '😐',
    struggling: '😔',
    frustrated: '😤'
};

export const JournalTimeline: React.FC<JournalTimelineProps> = ({
    entries,
    onEntryClick
}) => {
    if (entries.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No journal entries yet</p>
                <p className="text-sm text-slate-400 mt-1">Start reflecting on your journey</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((entry, index) => (
                <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onEntryClick?.(entry)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-purple/30 hover:shadow-lg transition-all cursor-pointer group"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{moodEmojis[entry.mood || 'neutral']}</span>
                            <div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    {entry.createdAt.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-slate-700 text-sm line-clamp-3 mb-3">
                        {entry.content}
                    </p>

                    {/* AI Reflection */}
                    {entry.aiReflection && (
                        <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-xl">
                            <Sparkles className="w-4 h-4 text-brand-purple mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 line-clamp-2">
                                {entry.aiReflection}
                            </p>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
```

#### Step 5: Add Journal Button to PlanViewer Milestones

Modify `/src/components/PlanViewer.tsx`:

Find the milestone card section and add a journal button:

```tsx
// Add import
import { BookOpen } from 'lucide-react';
import { JournalEditor } from './JournalEditor';

// Add state
const [journalModalOpen, setJournalModalOpen] = useState(false);
const [selectedMilestone, setSelectedMilestone] = useState<{
    index: number;
    name: string;
} | null>(null);

// In milestone card, add button:
<button
    onClick={() => {
        setSelectedMilestone({ index: i, name: milestone.milestone });
        setJournalModalOpen(true);
    }}
    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
    title="Add journal entry"
>
    <BookOpen className="w-4 h-4 text-slate-400" />
</button>

// Add modal at end of component:
{selectedMilestone && (
    <JournalEditor
        isOpen={journalModalOpen}
        onClose={() => {
            setJournalModalOpen(false);
            setSelectedMilestone(null);
        }}
        goalId={goalId} // You'll need to pass this as prop
        goalTitle={plan.title}
        milestoneName={selectedMilestone.name}
        milestoneIndex={selectedMilestone.index}
        onSave={(entry) => {
            // Update local state or refetch
            console.log('Saved:', entry);
        }}
    />
)}
```

---

## Integration Checklist

### Warp Animation
- [x] Create `src/components/WarpAnimation.tsx`
- [x] Import and add state in `LandingPage.tsx`
- [x] Wrap handleWormhole with animation states
- [x] Test animation timing with actual API calls
- [x] Fine-tune star count, speed, colors

### Journaling Feature
- [x] Add `JournalEntry` interface to `firestore.ts`
- [x] Add CRUD functions to `firestoreService`
- [x] Add `generateJournalPrompt` to `gemini.ts`
- [x] Add `generateJournalReflection` to `gemini.ts`
- [x] Create `JournalEditor.tsx` component
- [x] Create `JournalTimeline.tsx` component
- [x] Add journal button to `PlanViewer.tsx` milestones
- [x] Add journal section to `PlanDetailsPage.tsx`
- [x] Test full flow: create, view, edit entries
- [x] Add Firestore indexes if needed (None needed for basic queries yet)

---

## Firestore Security Rules (Add to firestore.rules)

```javascript
match /journal_entries/{entryId} {
    allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
}
```

---

## Gemini Integration Points Summary

After implementation, your app will have **6 Gemini integration points**:

1. **Plan Generation** - `generatePlan()` - Creates actionable life plans
2. **Vision Image** - `generateVisionImage()` - Creates inspirational imagery
3. **Chat Coaching** - `startChat()` - Interactive goal coaching
4. **Theme Generation** - `createThemeFromPrompt()` - AI-designed visual themes
5. **Journal Prompts** - `generateJournalPrompt()` - Personalized reflection questions
6. **Journal Reflections** - `generateJournalReflection()` - Supportive AI responses

---

## Priority Order for Implementation

1. **Warp Animation** (30-60 min) - High visual impact, low complexity
2. **Firestore + Gemini functions** (30 min) - Foundation for journaling
3. **JournalEditor** (45 min) - Core journaling modal
4. **JournalTimeline** (20 min) - Display component
5. **PlanViewer integration** (20 min) - Connect UI
6. **Testing & Polish** (30 min) - End-to-end testing

Total estimated effort: ~3-4 hours

---

## Quick Start Commands

```bash
# After implementing, test with:
npm run lint
npm run build
npm run dev

# Deploy:
npm run build && firebase deploy
```
