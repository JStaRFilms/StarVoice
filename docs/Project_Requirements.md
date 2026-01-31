# StarVoice - Project Requirements Document

## Project Overview

**Project Name:** StarVoice  
**Type:** Desktop Voice-to-Text Transcription Application  
**Primary Use Case:** Prompting LLMs with voice instead of typing long prompts  
**Core Value Proposition:** Fast, smart voice transcription with retry capability and AI refinement

---

## Tech Stack Recommendation

### Recommended: Tauri v2 + React + TypeScript + TailwindCSS

**Justification:**

| Requirement | Tauri Solution |
|-------------|----------------|
| Global Shortcut Keys | ✅ Native OS-level global shortcuts via Tauri API |
| System Tray Integration | ✅ Built-in system tray with custom menus |
| Audio Recording | ✅ Web Audio API in frontend + native access if needed |
| Cross-Platform | ✅ Windows, macOS, Linux support |
| PostgreSQL Connectivity | ✅ Rust backend with SQLx or Prisma Client Rust |
| Bundle Size | ✅ ~600KB vs ~150MB Electron |
| Performance | ✅ Native performance, minimal resource usage |
| Sleek UI/Animations | ✅ Full CSS/Tailwind + Framer Motion capabilities |

**Stack Components:**
- **Framework:** Tauri v2 (Rust backend + Web frontend)
- **Frontend:** React 18+ with TypeScript
- **Styling:** TailwindCSS + shadcn/ui components
- **Animations:** Framer Motion
- **Database:** PostgreSQL (local instance) via SQLx/Prisma
- **AI SDK:** Vercel AI SDK with Groq provider
- **State Management:** Zustand or React Query
- **Audio:** Web Audio API + MediaRecorder

**Why not Electron?**
- Larger bundle size (~150MB vs ~5MB)
- Higher memory footprint
- Slower startup time
- Tauri provides same capabilities with better performance

**Why not Native (Swift/C#)?**
- Cross-platform complexity
- Slower development velocity
- Harder to maintain consistent UI across platforms

---

## The Mission & Vibe

**Target Persona:** Developers, power users, and AI enthusiasts who frequently interact with LLMs

**Vibe Definition:**
- **Professional Developer Utility** - Clean, functional, gets out of your way
- **Speed-First** - Launch fast, transcribe fast, minimal friction
- **Invisible When Not Needed** - Lives in system tray, activates on shortcut
- **Reliable** - Never lose a recording, always have retry options
- **Smart** - AI refinement when you want it, raw when you don't

**Inspiration Apps:**
- Raycast (speed + minimalism)
- Cleanshot X (elegant capture UI)
- Warp terminal (modern developer tool aesthetic)

---

## Platform Requirements

**Primary Platform:** Windows (initial development target)
**Secondary Platforms:** macOS, Linux (future releases)

**Rationale:**
- Windows has the most complex global shortcut handling
- If it works on Windows, macOS/Linux are easier
- User mentioned Windows environment

---

## Feature Specification

### MUS (Minimum Usable State) - v1.0

**Core Recording & Transcription:**
1. Global shortcut activation (configurable, default: `Ctrl+Shift+R`)
2. Audio recording with visual feedback (waveform animation)
3. Transcription via Groq whisper-large-v3-turbo
4. Auto-paste at cursor location
5. System tray presence with status indicator

**Retry Mode:**
6. Local audio storage during transcription attempt
7. Retry button if transcription fails (network error)
8. Visual indicator of retry availability

**Raw vs Modified Mode:**
9. Toggle between Raw and Modified modes
10. Raw: Direct transcript paste
11. Modified: Kimi-K2 refinement via Vercel AI SDK

**Output Buffer:**
12. Transcription result stored in clipboard/buffer
13. Manual paste option (don't auto-paste if user prefers)
14. Visual preview before paste

**History:**
15. Store all transcriptions in local PostgreSQL
16. Simple history view (last 50 transcriptions)
17. Copy from history

**Settings:**
18. Configure global shortcut
19. Select default mode (Raw/Modified)
20. Configure Groq API key
21. Configure Kimi API key (for Modified mode)

### Future Features - Post v1.0

**Enhanced Recording:**
- Continuous recording mode (pause/resume)
- Recording time limit settings
- Audio quality settings
- Noise cancellation toggle

**Advanced Transcription:**
- Speaker diarization (who spoke when)
- Language auto-detection
- Custom vocabulary/dictionary
- Filler word removal (um, uh, like)

**Integration Features:**
- Obsidian/Notion plugin
- Slack/Discord bot integration
- Webhook support for custom integrations
- Export to multiple formats (TXT, SRT, VTT)

**UI/UX Enhancements:**
- Floating transcription widget
- Mini mode (compact overlay)
- Custom themes
- Onboarding tutorial

**AI Enhancements:**
- Multiple refinement models (GPT-4, Claude, etc.)
- Custom refinement prompts
- Template system (meeting notes, code comments, etc.)
- Auto-formatting (markdown, bullet points)

---

## UI/UX Design Direction

**Visual Style:**
- **Dark mode first** (developer-friendly)
- **Minimalist** - Clean lines, ample whitespace
- **Glassmorphism** - Subtle transparency effects
- **Accent color:** Cyan/Teal (#06b6d4) for recording state

**Key UI Components:**

1. **Recording Overlay**
   - Full-screen dimmed overlay when recording
   - Central animated waveform
   - Recording timer
   - Cancel button (Escape key)

2. **Transcription Preview**
   - Slide-in panel from top/bottom
   - Shows transcribed text before paste
   - Edit capability before confirming
   - Raw/Modified toggle visible

3. **System Tray Menu**
   - Status: Ready / Recording / Processing
   - Quick settings access
   - History shortcut
   - Quit option

4. **Settings Window**
   - Tabbed interface
   - API key management
   - Shortcut configuration
   - Database settings

**Animation Priorities:**
- Recording start: Smooth fade-in with scale
- Waveform: Continuous flowing animation
- Transcription complete: Slide-in notification
- Mode toggle: Smooth switch animation

---

## Database Schema (PostgreSQL)

```sql
-- Transcriptions table
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_path TEXT, -- local file path for retry capability
    raw_text TEXT NOT NULL,
    refined_text TEXT,
    mode VARCHAR(10) DEFAULT 'raw', -- 'raw' or 'modified'
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- flexible field for future use
);

-- Settings table
CREATE TABLE settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings
INSERT INTO settings (key, value) VALUES
    ('global_shortcut', 'Ctrl+Shift+R'),
    ('default_mode', 'raw'),
    ('auto_paste', 'true'),
    ('show_preview', 'true');
```

---

## API Configuration

**Groq Configuration:**
- Model: whisper-large-v3-turbo (fast) or whisper-large-v3 (accurate)
- Endpoint: Groq API via Vercel AI SDK
- Timeout: 30 seconds
- Retry: 3 attempts with exponential backoff

**Kimi Configuration (Modified Mode):**
- Model: moonshotai/kimi-k2-instruct-0905
- Purpose: Grammar correction, formatting, clarity improvement
- System prompt: "Refine the following transcript for clarity and grammar. Maintain the original meaning."

---

## Constraints & Considerations

**Technical Constraints:**
1. **Audio Permissions:** Must handle microphone permission gracefully
2. **Global Shortcuts:** May conflict with other apps; needs configuration
3. **Network Dependency:** Transcription requires internet; retry mode critical
4. **PostgreSQL:** Requires local Postgres instance running

**Security Considerations:**
- API keys stored in OS keychain (not plain text)
- Audio files encrypted at rest (optional)
- No cloud storage of transcriptions (local only)

**Performance Targets:**
- App launch: < 2 seconds
- Recording start: < 500ms
- Transcription: < 5 seconds for 30-second audio
- UI response: 60fps animations

---

## Development Phases

### Phase 1: Foundation (Week 1)
- Tauri project setup
- PostgreSQL schema
- Basic recording functionality
- System tray integration

### Phase 2: Core Features (Week 2)
- Groq transcription integration
- Global shortcuts
- Basic UI (recording overlay)
- Retry mode

### Phase 3: Refinement (Week 3)
- Raw/Modified mode toggle
- Kimi integration
- Output buffer/preview
- History view

### Phase 4: Polish (Week 4)
- Settings UI
- Animations
- Error handling
- Testing & bug fixes

---

## Open Questions for User

1. **Shortcut preference:** Any specific global shortcut you prefer? (Default: Ctrl+Shift+R)
2. **Audio storage:** How long should we keep audio files for retry? (Default: 24 hours)
3. **Modified mode default:** Should Modified mode be the default, or Raw?
4. **History retention:** Any limit on history entries? (Default: unlimited)
5. **Auto-paste:** Should it always auto-paste, or show preview first?
6. **Window behavior:** Should the app have a main window, or only tray + overlays?

---

## Success Criteria

**v1.0 Success:**
- [ ] Press shortcut → record → transcribe → paste works in < 10 seconds
- [ ] Retry works after network failure
- [ ] Modified mode produces noticeably better output
- [ ] History persists across app restarts
- [ ] No audio lost due to errors
- [ ] Smooth 60fps animations throughout

**Quality Metrics:**
- Transcription accuracy > 95% for clear speech
- App memory usage < 200MB
- Bundle size < 10MB
- Zero audio loss incidents

---

*Document Version: 1.0*  
*Last Updated: 2026-01-31*  
*Status: Ready for PRD Generation*
