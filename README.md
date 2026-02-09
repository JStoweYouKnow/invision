# Invision 🌌
**The AI-Powered Living Vision Board**

> Built for the **Gemini 3 Hackathon** — 9 distinct Gemini integrations including Thinking Mode & Streaming

Invision is a next-generation goal-setting platform that uses **Google Gemini 3 Flash** to transform abstract ambitions into concrete, living plans. Unlike static todo lists, Invision creates an immersive, multi-sensory environment—ranging from cosmic voids to neural networks—that evolves as you grow.

---

## 🌍 Why This Matters

An estimated **15-20% of the world's population is neurodivergent** (WHO). For people with ADHD, autism, or executive dysfunction, traditional productivity tools — text-heavy lists and abstract Gantt charts — create more anxiety than motivation. Meanwhile, 92% of people who set New Year's goals fail to achieve them (University of Scranton).

InVision attacks both problems at once: Gemini 3 generates the *plan*, and immersive visualization provides the *motivation*. A student with ADHD types "I want to become a software engineer." The Wormhole analyzes their profile and generates a 2-year plan — broken into 2-week sprints with daily habits. They see a cinematic image of their future self at a standing desk in a sunlit office. Each milestone appears as a planet in their personal cosmos. When they complete "Build First Portfolio Project," the planet terraforms from barren rock to ocean blue — instant, visceral proof of progress. Their AI journal asks: *"What did finishing that project teach you about how you learn?"* This isn't a checklist. It's a relationship with your future self.

---

## 🚀 Key Innovation: The "Wormhole"
Powered by `gemini-3-flash-preview`, the **Wormhole** feature acts as a deterministic life coach. It doesn't just ask "what do you want to do?"; it analyzes your profile and *invents* a tailored, ambitious life goal for you, complete with:
*   **Visionary Description**: A sensory-rich narrative of your future success.
*   **Strategic Timeline**: A backward-engineered plan from the goal date to *today*.
*   **Daily Habits**: Micro-actions to build momentum immediately.

---

## 🧠 Powered by Gemini 3 (3.0 Flash)
We leverage the cutting-edge multimodal capabilities of Gemini:
*   **Deep Reasoning**: Gemini 3 breaks down complex 5-year goals (e.g., "Colonize Mars") into actionable 2-week sprints.
*   **Visual Imagination**: We use `gemini-3-pro-image-preview` (with Imagen 3 fallback) to generate cinematic, 8k visualization art for every goal.
*   **Contextual Chat**: The "Guide" (AI assistant) retains full context of your unique timeline to offer relevant advice.
*   **Journey Synthesis (Thinking Mode)**: Gemini 3's thinking mode performs deep behavioral analysis across all your goals, journals, and milestones to surface hidden patterns and your single highest-leverage next action.
*   **Warp-Speed Streaming**: Real-time token streaming for all chat responses, ensuring a zero-lag, lifelike interaction with the Vision Guide.

---

## ✨ Features

### 1. Dynamic Thematic UI
The entire application morphs to match your mental model:
*   **🪐 Cosmos Theme**: Goals are solar systems; tasks are planets.
*   **🧠 Brain Theme**: Goals are neural clusters; tasks are synaptic connections.
*   **🌳 Tree Theme**: Goals are forests; tasks are growing seeds.

### 2. The Timeline that Breathes
We replaced the Gantt chart with a **Living Timeline**. As you complete milestones:
*   Planets terraform.
*   Neural nodes light up.
*   Flowers bloom.

### 3. Community of Visionaries
*   **Fork a Vision**: See a goal you like? "Fork" it to your own board and adapt the AI's plan to your life.
*   **Real-time Motivation**: See what others are manifesting right now in the Galaxy Feed.

---

## 🛠️ Technology Stack
*   **AI**: Google Gemini 3 Flash & Pro (via Google Generative AI SDK)
*   **Frontend**: React 18, TypeScript, Vite
*   **Styling**: TailwindCSS, Framer Motion (Complex Physics Animations)
*   **Backend**: Firebase Firestore (Real-time Database), Firebase Auth

---

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js 18+
*   Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/vaydr/invision.git
    cd invision
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```
---

## 🏗️ Architecture
InVision features a high-performance, vertically integrated architecture that leverages Gemini 3 as its multimodal core.

For a detailed technical breakdown, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

For third-party services and dependency disclosure, see **[THIRD_PARTY.md](./THIRD_PARTY.md)**.

---

## 🔮 Strategic Roadmap

### Phase 1: AR/VR Integration (Next 6 Months)
Walk through your "Forest of Goals" in mixed reality using WebXR. Physically "prune" your leaves or "terraform" your planets.

### Phase 2: Multi-Agent Simulations
Using competing Gemini agents to simulate potential future blockers (e.g., market crashes, health setbacks) to help users build "antifragile" plans.

### Phase 3: Monetization & B2B Scaling
*   **Premium Visualization Packs**: Direct-to-consumer digital theme sales.
*   **Corporate "Team Visioning"**: Using InVision for enterprise strategic planning, where the entire company contributes to a shared galactic goal.
*   **Executive Coaching API**: White-labeling our AI Guide for professional life coaches.
