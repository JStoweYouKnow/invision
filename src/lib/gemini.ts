import { GoogleGenerativeAI, type Part, type ChatSession } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Type for Gemini image generation response parts
interface ImageInlineData {
    inlineData: {
        mimeType: string;
        data: string;
    };
}

// Compress a base64 data URI to reduce file size using canvas
async function compressImage(dataUri: string, maxSizeBytes: number = 800000, quality: number = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');

            // Calculate scaled dimensions to reduce size
            let { width, height } = img;
            const maxDimension = 1280; // Max width/height

            if (width > maxDimension || height > maxDimension) {
                const ratio = Math.min(maxDimension / width, maxDimension / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Try different quality levels until we're under the size limit
            let currentQuality = quality;
            let result = canvas.toDataURL('image/jpeg', currentQuality);

            while (result.length > maxSizeBytes && currentQuality > 0.3) {
                currentQuality -= 0.1;
                result = canvas.toDataURL('image/jpeg', currentQuality);
                console.log(`[ImageGen] Compressing: quality=${currentQuality.toFixed(1)}, size=${result.length}`);
            }

            console.log(`[ImageGen] Final compressed size: ${result.length} bytes`);
            resolve(result);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUri;
    });
}


export interface GeneratedPlan {
    title: string;
    description: string;
    visionaryDescription?: string; // New: Sensory-rich description of the future
    timeline: {
        date: string;
        milestone: string;
        description: string;
        whyItMatters?: string; // New: Motivational rationale
        steps: {
            text: string;
            date: string;
            habit?: string; // New: Daily/Weekly habit suggestion
        }[];
        isCompleted?: boolean;
        resources?: {
            title: string;
            url: string;
            type?: 'article' | 'video' | 'tool';
        }[];
    }[];
    sources: {
        title: string;
        url: string;
    }[];
}

export interface GeneratedTheme {
    name: string;
    description: string;
    colors: {
        background: string;
        foreground: string;
        primary: string;
        secondary: string;
        accent: string;
        glow: string;
    };
    particles: {
        count: number;
        color: string;
        glowColor: string;
        sizes: [number, number, number];
    };
}

async function fileToGenerativePart(file: File): Promise<Part> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.includes(',') ? base64String.split(',')[1] : '';

            if (!base64Data) {
                reject(new Error('Invalid file data'));
                return;
            }

            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export const geminiService = {
    async generatePlan(goal: string, timeline: string = "flexible", image?: File, isWormhole: boolean = false): Promise<GeneratedPlan> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const systemPrompt = isWormhole
            ? `
              You are a cosmic visionary and life coach.
              The user has invoked the "Wormhole" - they want you to generate a unique, exciting, and specific life goal for them.
              It should be ambitious but achievable (e.g., "Become a certified master scuba diver", "Write and publish a sci-fi novel", "Learn to fly a glider").
              
              FIRST, invent this specific goal.
              THEN, create a comprehensive plan for it.
              `
            : `
              You are an expert life coach and tactical project planner.
              Analyze the following goal and create a comprehensive, highly actionable and inspiring plan.
              `;

        const prompt = `
      ${systemPrompt}
      
      User's Requested Timeline: ${timeline === "flexible" ? "Indefinite / However long it takes (be realistic but ambitious)" : timeline}

      For each milestone in the timeline:
      1. Provide a "description" that is a substantial, inspiring paragraph (3-5 sentences) explaining the significance and focus of this period.
      2. Provide a "whyItMatters" sentence explaining the deep internal motivation or shift that happens here.
      3. Provide a "steps" array containing exactly 3-4 specific, concrete, and actionable tasks.
         Each step MUST be an object with:
         - "text": The actionable task description.
         - "date": A specific target date (YYYY-MM-DD) for this individual step.
         - "habit": (Optional) A small daily or weekly habit that supports this step (e.g., "Write 200 words daily").
      4. CRITICAL: 
         - The VERY FIRST step of the entire plan MUST have a date within 2-3 days of the current date (${new Date().toISOString().split('T')[0]}) to establish immediate momentum.
         - All subsequent step dates must be chronologically ordered and must be BEFORE or ON the milestone date.
      5. Include 1-2 "resources" where applicable. IMPORTANT rules for URLs:
         - Use ONLY high-confidence, stable URLs (e.g., main domain pages like 'coursera.org', 'udemy.com', 'wikipedia.org').
         - DO NOT provide deep links to specific articles or course pages unless you are 100% certain they exist and are permanent.
         - If uncertain, provide a Google Search URL query instead (e.g., 'https://www.google.com/search?q=topic').

      Return ONLY a JSON object with this structure:
      {
        "title": "A catchy, uplifting title for the journey",
        "description": "A deep, inspiring multi-sentence overview of the transformation",
        "visionaryDescription": "A vivid, sensory-rich description of what it feels like to have achieved this goal (sight, sound, feeling). Write this in the present tense as if it has already happened.",
        "timeline": [
          { 
              "date": "YYYY-MM-DD", 
              "milestone": "Short punchy title", 
              "description": "Comprehensive paragraph detailing this phase...",
              "whyItMatters": "This phase builds the foundation for...",
              "steps": [
                  { "text": "Actionable step 1", "date": "YYYY-MM-DD", "habit": "Daily practice..." },
                  { "text": "Actionable step 2", "date": "YYYY-MM-DD" }
              ],
              "resources": [ 
                  { "title": "Specific Course/Tool", "url": "https://...", "type": "article" } 
              ]
          }
        ],
        "sources": [
            { "title": "General Authority Topic", "url": "https://example.com" }
        ]
      }
      
      Important: Ensure the total duration of the plan respects the User's Requested Timeline (${timeline}).
      The timeline should start from the current date (${new Date().toISOString().split('T')[0]}).
      ${isWormhole ? 'Invent a goal yourself.' : `Goal Input: "${goal}"`}
    `;

        const parts: (string | Part)[] = [prompt];
        if (image) {
            parts.push(await fileToGenerativePart(image));
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonString);
        } catch {
            throw new Error("AI response was not valid JSON");
        }
    },

    async generateVisionImage(goal: string, description?: string): Promise<string> {
        // Construct a rich prompt for image generation
        const promptCore = description ? description.slice(0, 200) : goal;
        const fullPrompt = `Generate a cinematic, inspirational image representing: ${promptCore}. Style: photorealistic, cinematic, natural lighting, highly detailed, wide aspect ratio`;

        console.log('[ImageGen] Starting image generation...');
        console.log('[ImageGen] Prompt:', fullPrompt.slice(0, 100) + '...');

        try {
            // Use Gemini's native image generation model
            console.log('[ImageGen] Step 1: Trying gemini-3-pro-image-preview...');
            const imageModel = genAI.getGenerativeModel({
                model: "gemini-3-pro-image-preview",
                generationConfig: {
                    responseModalities: ["image", "text"],
                } as Record<string, unknown> // Type assertion needed for experimental features
            });

            const result = await imageModel.generateContent(fullPrompt);
            const response = await result.response;

            // Check for inline image data in the response
            const parts = response.candidates?.[0]?.content?.parts;
            if (parts) {
                for (const part of parts) {
                    const imagePart = part as ImageInlineData;
                    if (imagePart.inlineData) {
                        let dataUri = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                        console.log('[ImageGen] ✅ gemini-3-pro-image-preview SUCCESS. Data URI length:', dataUri.length);

                        // Compress if too large for Firestore
                        if (dataUri.length > 900000) {
                            console.log('[ImageGen] ⚠️ Image too large, compressing...');
                            try {
                                dataUri = await compressImage(dataUri, 800000, 0.75);
                                console.log('[ImageGen] ✅ Compression successful. New size:', dataUri.length);
                            } catch (compressError) {
                                console.error('[ImageGen] ❌ Compression failed:', compressError);
                                throw new Error("Image compression failed");
                            }
                        }
                        return dataUri;
                    }
                }
            }

            console.warn('[ImageGen] ❌ gemini-3-pro-image-preview returned no image data');
            throw new Error("No image data in Gemini response");

        } catch (geminiError) {
            // Gemini image generation failed or too large, try Imagen 3
            console.error('[ImageGen] ❌ gemini-3-pro-image-preview FAILED:', geminiError);

            // Fallback 1: Try Imagen 3 via generateImages endpoint
            try {
                console.log('[ImageGen] Step 2: Trying imagen-3.0-generate-002 via generateImages...');
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

                const response = await fetchWithTimeout(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        config: {
                            numberOfImages: 1,
                            aspectRatio: "16:9",
                            outputOptions: {
                                mimeType: "image/jpeg"
                            }
                        }
                    })
                }, 15000);

                console.log('[ImageGen] imagen-3.0-generate-002 response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    // Check for generatedImages array in response
                    const imageData = data.generatedImages?.[0]?.image?.imageBytes ||
                        data.predictions?.[0]?.bytesBase64Encoded;
                    if (imageData) {
                        const mimeType = data.generatedImages?.[0]?.image?.mimeType || 'image/jpeg';
                        const dataUri = `data:${mimeType};base64,${imageData}`;
                        console.log('[ImageGen] ✅ imagen-3.0-generate-002 SUCCESS. Data URI length:', dataUri.length);
                        if (dataUri.length < 900000) {
                            return dataUri;
                        }
                        console.warn('[ImageGen] ⚠️ Imagen image too large, falling back...');
                    } else {
                        console.warn('[ImageGen] ❌ imagen-3.0-generate-002 response structure:', JSON.stringify(data).slice(0, 300));
                    }
                } else {
                    const errorText = await response.text();
                    console.error('[ImageGen] ❌ imagen-3.0-generate-002 HTTP error:', response.status, errorText.slice(0, 300));
                }
            } catch (e) {
                console.error('[ImageGen] ❌ imagen-3.0-generate-002 EXCEPTION:', e);
            }

            // Fallback 2: Pollinations direct URL (skip fetch to avoid CORS)
            console.log('[ImageGen] Step 3: Using Pollinations direct URL...');
            const safePromptCore = promptCore.slice(0, 400);
            const imagePrompt = `cinematic shot of ${safePromptCore}, photorealistic, natural lighting, inspirational, highly detailed`;
            const seed = Math.floor(Math.random() * 1000000);
            const encodedPrompt = encodeURIComponent(imagePrompt);
            return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;
        }
    },

    async startChat(_goal: string, _plan: GeneratedPlan): Promise<ChatSession> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Initialize chat with context
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{
                        text: `I have a goal: ${_goal}. You created a plan for me: ${JSON.stringify(_plan)}. 
                    
                    IMPORTANT INSTRUCTION: 
                    If I ask you to modify the plan (e.g., change dates, add steps, rename title, change description), 
                    you MUST output the COMPLETE updated plan JSON object wrapped in strict delimiters.
                    
                    Format:
                    Here is the updated plan... (your natural language response)
                    ::PLAN_JSON_START::
                    { ... complete valid JSON of the GeneratedPlan object ... }
                    ::PLAN_JSON_END::
                    
                    Do NOT use markdown code blocks for the JSON inside the delimiters. Just raw JSON.`
                    }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will help you refine your plan. if you request changes, I will provide the complete updated JSON plan wrapped in ::PLAN_JSON_START:: and ::PLAN_JSON_END:: along with my helpful response." }],
                },
            ],
        });

        return chat;
    },

    async createThemeFromPrompt(prompt: string): Promise<GeneratedTheme> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const systemPrompt = `
        You are a master UI/UX designer and color theorist.
        Your task is to create a beautiful, cohesive color theme for a vision board application based on the user's description.
        The theme should be visually stunning, with good contrast and harmony.

        Return ONLY a JSON object with this EXACT structure (no markdown, no other text):
        {
            "name": "Creative Theme Name",
            "description": "Brief description of the vibe",
            "colors": {
                "background": "#hex_code (dark/deep color for bg)",
                "foreground": "#hex_code (light color for text)",
                "primary": "#hex_code (main brand color)",
                "secondary": "#hex_code (supporting color)",
                "accent": "#hex_code (pop color for highlights)",
                "glow": "rgba(r, g, b, 0.5) (matching glow color)"
            },
            "particles": {
                "count": number (20-100),
                "color": "#hex_code (particle color)",
                "glowColor": "rgba(r, g, b, 0.6) (particle glow)",
                "sizes": [small, medium, large] (integers, e.g. [2, 4, 6])
            }
        }
        `;

        const result = await model.generateContent([
            systemPrompt,
            `User Prompt: "${prompt}"`
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonString);
        } catch {
            throw new Error("AI theme generation failed");
        }
    },

    // --- Journal AI Functions ---

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

Return ONLY the question, no quotes or extra formatting. Keep it under 30 words.
        `;

        try {
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch {
            // Fallback prompt if AI fails
            return "What progress have you made today? How are you feeling about your journey?";
        }
    },

    async generateJournalReflection(
        goalTitle: string,
        milestoneName: string,
        journalEntry: string,
        mood: string
    ): Promise<string> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const moodGuidance = mood === 'struggling' || mood === 'frustrated'
            ? 'Provide gentle reassurance and perspective. Acknowledge the difficulty while highlighting their resilience.'
            : 'Celebrate their progress and momentum. Reinforce positive patterns you notice.';

        const prompt = `
You are a warm, encouraging life coach. Someone pursuing "${goalTitle}" just wrote this journal entry about "${milestoneName}":

"${journalEntry}"

Their current mood: ${mood}

Write a brief (2-3 sentences) supportive response that:
1. Acknowledges their feelings and effort genuinely
2. Offers one specific insight or encouragement based on what they wrote
3. ${moodGuidance}

Be genuine and specific to what they wrote. Avoid generic platitudes like "keep going" or "you've got this".
Reference specific things they mentioned. Keep it under 60 words.
        `;

        try {
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch {
            // Fallback reflection if AI fails
            return "Thank you for sharing your thoughts. Taking time to reflect on your journey shows real commitment to your growth. Keep moving forward at your own pace.";
        }
    }
};
