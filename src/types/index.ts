/**
 * Core types for WhisperAlt application
 */

// Recording states
export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'failed';

// Transcription modes
export type TranscriptionMode = 'raw' | 'modified';

// Recording data structure
export interface Recording {
    id: string;
    audioPath: string | null;
    rawText: string | null;
    refinedText: string | null;
    mode: TranscriptionMode;
    status: RecordingStatus;
    retryCount: number;
    durationSeconds: number | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

// Settings structure
export interface AppSettings {
    globalShortcut: string;
    defaultMode: TranscriptionMode;
    autoPaste: boolean;
    showPreview: boolean;
    previewTimeout: number;
    audioRetentionHours: number;
    maxRecordingDuration: number;
    groqModel: string;
    groqApiKey: string | null;
}

// Audio recording state
export interface AudioState {
    isRecording: boolean;
    duration: number;
    amplitude: number;
    error: string | null;
}

// Transcription state
export interface TranscriptionState {
    isProcessing: boolean;
    transcript: string | null;
    error: string | null;
}

// Preview panel state
export interface PreviewState {
    isVisible: boolean;
    transcript: string;
    mode: TranscriptionMode;
    autoDismissTimer: number | null;
}

// Toast notification
export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
}
