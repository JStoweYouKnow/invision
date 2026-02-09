# Third-Party Services & Dependencies

This document discloses all third-party services, APIs, and open-source libraries used by InVision, as required by hackathon submission guidelines.

---

## AI & Cloud Services

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| **Google Gemini 3 API** (`gemini-3-flash-preview`, `gemini-3-pro-preview`) | Plan generation, journaling, chat, theme generation, journey synthesis, progress analysis | User goal text, journal entries, milestone data, profile context |
| **Google Gemini 3 Image Generation** (`gemini-3-pro-image-preview`) | Cinematic vision board imagery | Text prompts describing user goals; optionally, user profile photo for personalization |
| **Google Imagen 3.0** | Fallback image generation when Gemini image generation is unavailable | Text prompts only |
| **Google Search (via Gemini Grounding)** | Verifying and discovering real-world resources for user goals | Goal and milestone context |
| **Firebase Authentication** | User sign-in (Google OAuth) | Google account credentials (handled by Firebase SDK) |
| **Firebase Firestore** | Real-time database for goals, journals, conversations | All user-created content (goals, plans, journal entries, chat messages) |
| **Firebase Hosting** | Static site deployment | None (serves built assets only) |

## Open-Source Dependencies

### Runtime Dependencies

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| `react` | 19.2.0 | MIT | UI framework |
| `react-dom` | 19.2.0 | MIT | React DOM renderer |
| `react-router-dom` | 7.12.0 | MIT | Client-side routing |
| `@google/generative-ai` | 0.24.1 | Apache-2.0 | Gemini SDK (structured output, function calling, chat) |
| `@google/genai` | 1.40.0 | Apache-2.0 | Gemini SDK (grounding, thinking mode) |
| `firebase` | 11.4.0 | Apache-2.0 | Firebase Auth, Firestore, Hosting |
| `three` | 0.182.0 | MIT | 3D rendering engine |
| `@react-three/fiber` | 9.5.0 | MIT | React renderer for Three.js |
| `@react-three/drei` | 10.7.7 | MIT | Three.js utilities and helpers |
| `framer-motion` | 12.26.2 | MIT | Physics-based animations |
| `tailwind-merge` | 3.4.0 | MIT | TailwindCSS class merging |
| `clsx` | 2.1.1 | MIT | Conditional CSS class composition |
| `date-fns` | 4.1.0 | MIT | Date formatting and manipulation |
| `lucide-react` | 0.562.0 | ISC | Icon library |
| `react-big-calendar` | 1.19.4 | MIT | Calendar component |
| `html2canvas` | 1.4.1 | MIT | HTML-to-image rendering for exports |
| `jspdf` | 4.1.0 | MIT | PDF generation for plan exports |

### Development Dependencies

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| `vite` | 7.2.4 | MIT | Build tool and dev server |
| `typescript` | 5.9.3 | Apache-2.0 | Type-safe JavaScript |
| `vitest` | 4.0.18 | MIT | Test framework |
| `tailwindcss` | 4.1.18 | MIT | Utility-first CSS |
| `eslint` | 9.39.1 | MIT | Code linting |
| `@testing-library/react` | 16.3.2 | MIT | React component testing |
| `jsdom` | 27.4.0 | MIT | DOM simulation for tests |

## Data Handling

- **All AI requests** are sent to Google's Gemini API endpoints. Google's [Generative AI Terms of Service](https://ai.google.dev/terms) and [Privacy Policy](https://policies.google.com/privacy) apply.
- **User authentication** is handled entirely by Firebase Auth via Google OAuth. InVision does not store passwords.
- **User data** (goals, journals, conversations) is stored in Firebase Firestore with per-user ownership rules. Users can delete their data at any time.
- **No user data is shared** with other third parties beyond Google's AI and Firebase services.
- **Vision images** are generated server-side by Google's API and stored as base64 in Firestore. No images are sent to third-party image hosting.

## Code Originality

All application code (React components, hooks, services, styling, animations, and the Galaxy Physics Engine) is original work created for this hackathon. Third-party libraries listed above are used as dependencies, not as the basis for the application logic.
