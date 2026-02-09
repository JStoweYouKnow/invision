# Gemini Integration

InVision is powered end-to-end by **Google Gemini 3**, which serves as the application's AI core across seven distinct capabilities:

**1. Plan Generation (Gemini 3 Flash/Pro)** — Users describe a life goal in text, voice, or image. Gemini generates a complete multi-milestone plan using **Structured Outputs** with strict JSON schema validation, guaranteeing type-safe, deterministic results every time. The "Wormhole" mode inverts this — Gemini *invents* a tailored goal for the user.

**2. Vision Image Generation (Gemini 3 Pro Image Preview)** — Each plan includes a cinematic AI-generated visualization. When a user provides a profile photo, Gemini composites their likeness into the aspirational scene, creating a deeply personal vision board image.

**3. Grounded Resource Discovery (Gemini 3 + Google Search)** — Plan resources are verified through **Grounding with Google Search**, ensuring every recommended URL is real and relevant — not hallucinated.

**4. Multimodal Progress Analysis (Gemini 3 Flash)** — Users upload photos of their progress. Gemini analyzes the image in context of their specific goal and milestone, providing personalized feedback and encouragement.

**5. AI Journaling (Gemini 3 Flash/Pro)** — Generates context-aware reflection prompts based on the user's goal, current milestone, and previous entries. Responds to journal entries with specific, mood-aware encouragement.

**6. Theme Generation (Gemini 3 Flash/Pro)** — Users describe a desired aesthetic in natural language. Gemini generates a complete UI theme (colors, particles, glow effects) using structured output.

**7. Conversational Plan Refinement (Gemini 3 Flash)** — A chat interface lets users iteratively modify their plans through natural conversation, with Gemini outputting updated structured plan JSON inline.

## Technical Rationale: Why Gemini 3?
The decision to center InVision around the **Google Gemini 3** ecosystem was driven by three technical pillars:
1.  **Massive Multimodal Context**: The ability to process text, voice, and high-resolution imagery within a single unified context window (~2M tokens) allows InVision to maintain a perfect "mental model" of the user's entire life journey without losing fidelity.
2.  **Structured Output Latency**: Gemini 2.0 Flash provides near-instantaneous structured JSON generation, which is critical for the "Warp Animation" experience. We achieve 100% schema compliance for complex plan objects.
3.  **Native Agentic Reasoning**: The 8th integration point (Function Calling) transforms InVision from a passive display tool into an active agent that can update user data, search the live web, and iterate on visual designs autonomously.

---

## Technical Deep Dive: Function Calling
The **Vision Guide** isn't just a chatbot; it's a native Gemini Agent. We've implemented a circular reasoning loop where the agent can:
-   `updatePlanPlan`: Autonomously modify the user's strategic milestones based on conversation.
-   `googleSearch`: Use grounding to verify external resources and citations.
-   `regenerateVisionImage`: Trigger a new image generation flow if the user wants to adjust their aesthetic.

This implementation uses **Gemini 3's native Tool Calling capability**, providing a significantly more reliable and efficient interaction than traditional prompt-engineered "text-davinci" style loops.

---

InVision is more than an app; it represents the next evolution of AI-driven personal manifestation.
