# Gemini Integration

InVision is powered end-to-end by **Google Gemini 3**, which serves as the application's AI core across seven distinct capabilities:

**1. Plan Generation (Gemini 3 Flash/Pro)** — Users describe a life goal in text, voice, or image. Gemini generates a complete multi-milestone plan using **Structured Outputs** with strict JSON schema validation, guaranteeing type-safe, deterministic results every time. The "Wormhole" mode inverts this — Gemini *invents* a tailored goal for the user.

**2. Vision Image Generation (Gemini 3 Pro Image Preview)** — Each plan includes a cinematic AI-generated visualization. When a user provides a profile photo, Gemini composites their likeness into the aspirational scene, creating a deeply personal vision board image.

**3. Grounded Resource Discovery (Gemini 3 + Google Search)** — Plan resources are verified through **Grounding with Google Search**, ensuring every recommended URL is real and relevant — not hallucinated.

**4. Multimodal Progress Analysis (Gemini 3 Flash)** — Users upload photos of their progress. Gemini analyzes the image in context of their specific goal and milestone, providing personalized feedback and encouragement.

**5. AI Journaling (Gemini 3 Flash/Pro)** — Generates context-aware reflection prompts based on the user's goal, current milestone, and previous entries. Responds to journal entries with specific, mood-aware encouragement.

**6. Theme Generation (Gemini 3 Flash/Pro)** — Users describe a desired aesthetic in natural language. Gemini generates a complete UI theme (colors, particles, glow effects) using structured output.

**7. Conversational Plan Refinement (Gemini 3 Flash)** — A chat interface lets users iteratively modify their plans through natural conversation, with Gemini outputting updated structured plan JSON inline.

**8. Function Calling / Agentic Workflows (Gemini 3 Flash)** — The Vision Guide chat uses native Gemini Function Calling to autonomously execute actions: updating plan structure, searching the web for verified resources via Google Search grounding, and triggering vision image regeneration — all within a natural conversation flow.

Gemini 3 is not a feature bolted onto InVision — it **is** InVision. Every core user interaction flows through the Gemini API.
