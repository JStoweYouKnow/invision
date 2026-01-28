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
      5. Include 1-2 "resources" where applicable (real URLs or very specific tool names).

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
        const fullPrompt = `Generate a cinematic, inspirational image representing: ${promptCore}. Style: futuristic, highly detailed, 8k quality, concept art, masterpiece, wide aspect ratio`;

        try {
            // Use Gemini's native image generation model
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
                        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                    }
                }
            }

            throw new Error("No image data in Gemini response");

        } catch {
            // Gemini image generation failed, try Imagen 3.0

            // Fallback 1: Try Imagen 3.0 API with 10s timeout
            try {
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

                const response = await fetchWithTimeout(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: fullPrompt }],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: "16:9",
                            sampleImageSize: "1024"
                        }
                    })
                }, 10000);

                if (response.ok) {
                    const data = await response.json();
                    if (data.predictions?.[0]?.bytesBase64Encoded) {
                        const mimeType = data.predictions[0].mimeType || 'image/png';
                        return `data:${mimeType};base64,${data.predictions[0].bytesBase64Encoded}`;
                    }
                }
            } catch {
                // Imagen 3.0 failed, continue to next fallback
            }

            // Fallback 2: Pollinations with 15s timeout
            const pollinationsApiKey = import.meta.env.VITE_POLLINATIONS_API_KEY;
            const imagePrompt = `cinematic shot of ${promptCore}, futuristic, inspirational, highly detailed, 8k`;
            const seed = Math.floor(Math.random() * 1000000);

            try {
                // Use Pollinations API with authentication and timeout
                const pollinationsResponse = await fetchWithTimeout(
                    'https://image.pollinations.ai/prompt/' + encodeURIComponent(imagePrompt),
                    {
                        method: 'GET',
                        headers: pollinationsApiKey ? {
                            'Authorization': `Bearer ${pollinationsApiKey}`
                        } : {}
                    },
                    15000
                );

                if (pollinationsResponse.ok) {
                    // Convert blob to base64 data URI for consistent handling
                    const blob = await pollinationsResponse.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch {
                // Pollinations API failed, use direct URL fallback
            }

            // Final fallback: direct URL (works without fetch)
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
    }
};
