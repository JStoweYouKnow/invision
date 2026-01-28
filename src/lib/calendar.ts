import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import type { GeneratedPlan } from "./gemini";

const CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const calendarService = {
    /**
     * Authenticates the user with Google and requests Calendar permissions.
     * Returns the OAuth access token.
     */
    async getAccessToken(): Promise<string> {
        try {
            // Force prompt to ensure we get a fresh token with the correct scopes, 
            // or check if the current user already has one (harder with just Firebase SDK).
            // For simplicity in this flow, we'll trigger a popup if we need the token to sync.
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (!token) {
                throw new Error("Failed to retrieve Google Access Token");
            }

            return token;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    },

    /**
     * Syncs the generated plan milestones to the user's primary Google Calendar.
     */
    async syncToCalendar(plan: GeneratedPlan, accessToken: string): Promise<number> {
        let createdCount = 0;

        for (const item of plan.timeline) {
            const event = {
                summary: `InVision: ${item.milestone}`,
                description: `${item.description}\n\nPart of goal: ${plan.title}`,
                start: {
                    date: item.date, // All-day event
                },
                end: {
                    date: item.date, // Google Calendar requires end date for all-day events (usually next day, but same day works for single day)
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 10 },
                    ],
                },
            };

            try {
                const response = await fetch(CALENDAR_API_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(event),
                });

                if (!response.ok) {
                    console.error(`Failed to create event for ${item.milestone}`, await response.text());
                    continue;
                }

                createdCount++;
            } catch (error) {
                console.error("Error creating calendar event:", error);
            }
        }

        return createdCount;
    }
};
