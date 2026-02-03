import { GoogleGenerativeAI } from "@google/generative-ai";
// import 'dotenv/config';

// Mock env if needed or just rely on process.env
const apiKey = process.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY";

if (!apiKey || apiKey === "YOUR_API_KEY") {
    console.error("Please set VITE_GEMINI_API_KEY environment variable");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // The SDK might not expose listModels directly easily in all versions, 
        // but let's try a direct fetch if the SDK method is elusive or just try to generate with a few candidates.
        // Actually, let's use the REST API approach for list_models if SDK is ambiguous, but SDK is better if available.
        // We will try a simple generation with a few known candidates to see which one works.

        const candidates = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-pro",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-pro"
        ];

        console.log("Testing model availability...");

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Test");
                console.log(`✅ ${modelName} is AVAILABLE`);
            } catch (e) {
                console.log(`❌ ${modelName} is NOT available: ${(e as Error).message?.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
