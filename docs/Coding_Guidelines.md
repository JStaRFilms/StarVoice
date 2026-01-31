# Coding Guidelines - StarVoice

> **This document is the LAW.** Follow it without exception.

---

## 🛑 The Verification Protocol (MANDATORY)

### After EVERY TypeScript/TSX File Edit

```bash
npx tsc --noEmit
```

**If this command fails:**
1. **STOP.** Do not touch another file.
2. Read the error message carefully.
3. Fix the type error.
4. Re-run the command.
5. Only proceed when it passes.

### Before Any Handoff or "Done" Claim

```bash
python scripts/vibe-verify.py
```

All checks must pass. No exceptions.

---

## The Blueprint & Build Protocol

### Phase 1: Blueprint (Before Writing Code)

Before implementing any non-trivial feature:

1. **Context Analysis**
   - Check `docs/features/` for existing implementations
   - Check if existing components/hooks can be reused
   - Identify potential impact on other features

2. **Create the Plan**
   - Create `docs/features/FeatureName.md` with:
     - High-Level Goal
     - Component Breakdown (label Server/Client)
     - Logic & Data Breakdown
     - Step-by-Step Implementation Plan

3. **Get Approval**
   - Present the plan to the user
   - Wait for explicit approval before coding

### Phase 2: Build (Implementation)

1. **Announce**: "Implementing FR-XXX: [Title]"
2. **Reference**: Open the corresponding issue in `docs/issues/`
3. **Implement**: One file at a time
4. **Verify**: `npx tsc --noEmit` after each file
5. **Mark Complete**: Check off acceptance criteria as you complete them
6. **Update Issue**: Edit the issue file to reflect progress

### Phase 3: Finalization

1. Run `python scripts/vibe-verify.py`
2. Update all acceptance criteria checkboxes
3. Generate handoff summary

---

## Tech Stack: Tauri v2 + React + TypeScript + Rust

### Architecture Overview

```
StarVoice
├── src/                    # React Frontend (TypeScript)
│   ├── components/         # UI Components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state management
│   ├── services/           # API services (Groq, etc.)
│   └── types/              # TypeScript types
├── src-tauri/              # Rust Backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands/       # Tauri commands
│   │   ├── audio/          # Audio recording logic
│   │   ├── shortcuts/      # Global shortcut handling
│   │   └── db/             # Database operations
│   └── Cargo.toml
├── docs/
└── scripts/
```

### Frontend (React + TypeScript)

**State Management**: Zustand for global state
**Styling**: Tailwind CSS v4 with custom glassmorphism theme
**Animations**: Framer Motion for 60fps smooth animations
**Icons**: Lucide React

### Backend (Rust)

**Audio**: `cpal` + `hound` for recording and WAV encoding
**Shortcuts**: `tauri-plugin-global-shortcut`
**System Tray**: `tauri-plugin-shell`
**Database**: `sqlx` with PostgreSQL
**Clipboard**: `tauri-plugin-clipboard-manager`

---

## Full-Stack Type Safety

### The Golden Rule

> If you change the backend, the frontend MUST type-check.  
> If type-check fails, THE CHANGE BROKE SOMETHING.  
> Fix it before moving on.

### Tauri Commands Pattern

```rust
// src-tauri/src/commands/audio.rs
#[tauri::command]
pub async fn start_recording(state: State<'_, AppState>) -> Result<String, String> {
    // Implementation
}
```

```typescript
// src/services/audio.ts
import { invoke } from '@tauri-apps/api/core';

export async function startRecording(): Promise<string> {
  return invoke('start_recording');
}
```

### Type Sharing

Define types in TypeScript and mirror them in Rust:

```typescript
// src/types/recording.ts
export interface Recording {
  id: string;
  audioPath: string;
  transcript: string | null;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  retryCount: number;
}
```

```rust
// src-tauri/src/types.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Recording {
    pub id: String,
    pub audio_path: String,
    pub transcript: Option<String>,
    pub status: RecordingStatus,
    pub created_at: String,
    pub retry_count: i32,
}
```

---

## Component Rules

### The 200-Line Rule

A component file exceeding **200 lines** is a code smell.

**When you hit the limit:**
1. Extract logic into a custom hook
2. Extract sub-components into separate files
3. Move business logic to a service file

### Props & Types

```tsx
// ✅ GOOD: Interface for props
interface WaveformVisualizerProps {
  isRecording: boolean;
  amplitude: number;
  className?: string;
}

export function WaveformVisualizer({ 
  isRecording, 
  amplitude, 
  className 
}: WaveformVisualizerProps) {
  // ...
}

// ❌ BAD: No types
function WaveformVisualizer(props) {
  const isRecording = props.isRecording; // No type safety
}
```

### Custom Hooks

Extract stateful logic into hooks:

```tsx
// hooks/useRecording.ts
export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const startRecording = async () => {
    // ...
  };
  
  return { isRecording, duration, startRecording };
}
```

---

## Styling (Tailwind CSS v4)

### Theme Configuration

```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* Dark theme as default (developer utility) */
  --color-background: #0a0a0f;
  --color-surface: #12121a;
  --color-surface-elevated: #1a1a25;
  --color-foreground: #f0f0f5;
  --color-foreground-muted: #8a8a9a;
  
  /* Cyan/Teal accent */
  --color-accent: #00d4aa;
  --color-accent-muted: #00a884;
  --color-accent-glow: rgba(0, 212, 170, 0.3);
  
  /* Status colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Glassmorphism */
  --glass-bg: rgba(18, 18, 26, 0.85);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
}

@layer base {
  * { @apply border-[var(--glass-border)]; }
  body { 
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
}
```

### Glassmorphism Components

```tsx
// ✅ GOOD: Glass card
<div className="
  bg-[var(--glass-bg)]
  backdrop-blur-[var(--glass-blur)]
  border border-[var(--glass-border)]
  rounded-2xl
  shadow-lg shadow-black/20
">
  {/* Content */}
</div>
```

### Animation Standards

```tsx
// ✅ GOOD: Framer Motion with consistent timing
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ 
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] // ease-out
  }}
/>

// Recording pulse animation
<motion.div
  animate={{ 
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1]
  }}
  transition={{ 
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

---

## Rust Backend Standards

### Error Handling

```rust
// ✅ GOOD: Use Result with descriptive errors
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AudioError {
    #[error("Failed to initialize audio device: {0}")]
    DeviceInit(String),
    #[error("Recording already in progress")]
    AlreadyRecording,
    #[error("No recording in progress")]
    NotRecording,
}

#[tauri::command]
pub async fn start_recording() -> Result<String, AudioError> {
    // Implementation
}
```

### State Management

```rust
// ✅ GOOD: AppState with Arc<Mutex<>>
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub recording: Arc<Mutex<Option<RecordingSession>>>,
    pub db_pool: sqlx::PgPool,
}

impl AppState {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let db_pool = sqlx::postgres::PgPool::connect(database_url).await?;
        Ok(Self {
            recording: Arc::new(Mutex::new(None)),
            db_pool,
        })
    }
}
```

### Async Commands

```rust
// ✅ GOOD: Async command with proper error handling
#[tauri::command]
pub async fn transcribe_audio(
    audio_path: String,
    state: State<'_, AppState>
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .post("https://api.groq.com/openai/v1/audio/transcriptions")
        .bearer_auth(&std::env::var("GROQ_API_KEY").map_err(|e| e.to_string())?)
        .multipart(/* ... */)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(response.text().await.map_err(|e| e.to_string())?)
}
```

---

## Database Standards (PostgreSQL + sqlx)

### Migration Files

```sql
-- migrations/001_create_recordings.sql
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_path TEXT NOT NULL,
    transcript TEXT,
    refined_transcript TEXT,
    mode VARCHAR(20) NOT NULL DEFAULT 'raw',
    status VARCHAR(20) NOT NULL DEFAULT 'recording',
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);
CREATE INDEX idx_recordings_status ON recordings(status);
```

### Query Patterns

```rust
// ✅ GOOD: Use sqlx macros for compile-time checking
use sqlx::query_as;

#[derive(sqlx::FromRow)]
pub struct Recording {
    pub id: uuid::Uuid,
    pub audio_path: String,
    pub transcript: Option<String>,
    pub status: String,
}

pub async fn get_recent_recordings(
    pool: &sqlx::PgPool,
    limit: i64
) -> Result<Vec<Recording>, sqlx::Error> {
    query_as::<_, Recording>(
        r#"
        SELECT id, audio_path, transcript, status
        FROM recordings
        ORDER BY created_at DESC
        LIMIT $1
        "#
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}
```

---

## API Integration (Groq)

### Transcription Service

```typescript
// src/services/groq.ts
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  formData.append('model', 'whisper-large-v3-turbo');
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.text;
}

export async function refineTranscript(transcript: string): Promise<string> {
  const { text } = await generateText({
    model: groq('moonshotai/kimi-k2-instruct-0905'),
    prompt: `Refine and improve the following transcript for clarity and grammar. Maintain the original meaning:

${transcript}`,
  });
  
  return text;
}
```

---

## Recovery Protocol

If you break something:

```bash
# See what changed
git status
git diff

# Revert a specific file
git checkout -- path/to/file

# Save changes and revert
git stash

# Restore saved changes
git stash pop
```

---

## Quick Reference

| Command | When to Run |
|---------|-------------|
| `npx tsc --noEmit` | After every TS/TSX edit |
| `python scripts/vibe-verify.py` | Before handoff |
| `python scripts/vibe-verify.py --quick` | Quick check (no build) |
| `cargo check` | After Rust code changes |
| `cargo clippy` | Rust linting |
| `npm run tauri dev` | Start dev server |
| `npm run tauri build` | Production build |

---

## StarVoice Specific Guidelines

### Audio Recording

- Always save audio to temp directory first
- Implement proper cleanup of temp files
- Support retry mechanism for failed uploads
- Maximum recording duration: 5 minutes

### Transcription Modes

- **Raw Mode**: Direct transcription output
- **Modified Mode**: Pass through Kimi-K2 for refinement
- Mode toggle must be accessible during recording

### Global Shortcuts

- Default: `Ctrl+Shift+R` (Windows/Linux), `Cmd+Shift+R` (macOS)
- Must work even when app is not focused
- Visual feedback when shortcut is pressed

### Clipboard Integration

- Always copy transcript to clipboard
- Show toast notification on success
- Allow manual paste from history

### History Management

- Store all recordings in PostgreSQL
- Show last 50 recordings in UI
- Allow search/filter by date
- Support re-transcription from history
