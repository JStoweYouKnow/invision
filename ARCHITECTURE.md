# InVision Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Landing  │  │Dashboard │  │Community │  │   Plan Details     │  │
│  │   Page    │  │ (2D/3D)  │  │   Feed   │  │  (Vision/Timeline) │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│       │              │              │                  │              │
│  ┌────┴──────────────┴──────────────┴──────────────────┴───────────┐ │
│  │              React 18 + TypeScript + Vite                       │ │
│  │     TailwindCSS · Framer Motion · Three.js (R3F)               │ │
│  └─────────────────────────┬───────────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   GEMINI 3 API  │ │  FIREBASE       │ │  LOCAL STORAGE  │
│   (AI Engine)   │ │  (Backend)      │ │  (Offline)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    GEMINI 3 SERVICES                     │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Plan Generator  │  │    Vision Image Generator    │  │
│  │  (Flash / Pro)   │  │  (Pro Image Preview/Imagen)  │  │
│  │                  │  │                              │  │
│  │ • Structured     │  │ • Profile photo compositing  │  │
│  │   JSON Output    │  │ • Auto-compression           │  │
│  │ • Schema valid.  │  │ • 3-tier fallback            │  │
│  │ • Wormhole mode  │  │   (Gemini→Imagen→Pollinate)  │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Grounded Search │  │   Progress Analyzer          │  │
│  │  (Google Search) │  │   (Multimodal)               │  │
│  │                  │  │                              │  │
│  │ • Verified URLs  │  │ • Photo upload analysis      │  │
│  │ • Real resources │  │ • Context-aware feedback     │  │
│  │ • Citation data  │  │ • Milestone-specific         │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Journal AI      │  │   Theme Generator            │  │
│  │  (Flash / Pro)   │  │   (Flash / Pro)              │  │
│  │                  │  │                              │  │
│  │ • Prompts        │  │ • Natural language → Theme   │  │
│  │ • Reflections    │  │ • Structured color output    │  │
│  │ • Mood-aware     │  │ • Particle config            │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Chat Refinement (Flash)                          │   │
│  │  • Conversational plan editing                    │   │
│  │  • Inline JSON extraction via delimiters          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Journey Synthesis (Flash — Thinking Mode)        │   │
│  │                                                    │   │
│  │  • Cross-goal behavioral pattern analysis         │   │
│  │  • Deep reasoning via thinkingBudget: 2048        │   │
│  │  • Hidden goal-to-goal connections                │   │
│  │  • Highest-leverage next action                   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                        │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Firestore DB │  │ Firebase Auth│  │ Backup Project │  │
│  │              │  │              │  │                │  │
│  │ • Goals      │  │ • Google     │  │ • Auto-failover│  │
│  │ • Journals   │  │   OAuth      │  │ • Quota mgmt   │  │
│  │ • Messages   │  │ • Guest mode │  │ • localStorage │  │
│  │ • Profiles   │  │              │  │   cache        │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  VISUALIZATION ENGINE                      │
│                                                            │
│  ┌──────────────────┐  ┌─────────────────────────────┐   │
│  │ Galaxy Physics    │  │ Three.js 3D Scene            │  │
│  │ (2D Canvas)       │  │ (WebGL)                      │  │
│  │                   │  │                              │   │
│  │ • Golden Spiral   │  │ • Theme-specific geometry    │   │
│  │ • 7-layer render  │  │   (Planets/Brain/Trees)      │   │
│  │ • Zoom/Pan/Select │  │ • Orbit controls             │   │
│  └──────────────────┘  └─────────────────────────────┘   │
│                                                            │
│  ┌──────────────────┐  ┌─────────────────────────────┐   │
│  │ Warp Animation    │  │ Theme System                 │  │
│  │ (WebGL Shaders)   │  │                              │   │
│  │                   │  │ • 3 built-in + custom        │   │
│  │ • Fragment shader │  │ • AI-generated themes        │   │
│  │ • Vertex shader   │  │ • Dynamic UI morphing        │   │
│  │ • Real-time VFX   │  │ • Particle system per theme  │   │
│  └──────────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Data Flow: Goal Creation

```
User Input (text/voice/image)
        │
        ▼
┌─────────────────┐     503 error?     ┌─────────────────┐
│ Gemini 3 Flash  │ ──────────────────▶ │ Gemini 3 Pro    │
│ (Plan Generation│                     │ (Backup Model)  │
│  + Structured   │                     │                 │
│    Outputs)     │                     │                 │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         ▼                                       ▼
   ┌──────────┐                           ┌──────────┐
   │ JSON Plan│◀──────────────────────────│ JSON Plan│
   └────┬─────┘                           └──────────┘
        │
        ├──────────────────────┐
        ▼                      ▼
┌───────────────┐    ┌─────────────────────┐
│ Vision Image  │    │ Grounded Resources  │
│ Generation    │    │ (Google Search)     │
│               │    │                     │
│ Gemini Pro    │    │ Verified URLs with  │
│ Image Preview │    │ citation metadata   │
│    ↓ fail     │    └──────────┬──────────┘
│ Imagen 3.0    │               │
└───────┬───────┘               │
        │                       │
        ▼                       ▼
┌──────────────────────────────────────┐
│           Save to Firestore          │
│  (with localStorage offline cache)   │
│  (auto-failover to backup project)   │
└──────────────────────────────────────┘
```
