'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Recording,
    RecordingStatus,
    AppSettings,
    Toast
} from '@/types';
import { generateId } from '@/lib/utils';

interface AppState {
    // Recording state
    currentRecording: Recording | null;
    recordings: Recording[];
    isRecording: boolean;
    isProcessing: boolean;

    // Transcription state
    currentTranscript: string | null;
    previewTranscript: string | null;
    showPreview: boolean;

    // Settings
    settings: AppSettings;

    // UI state
    toasts: Toast[];
    activePanel: 'none' | 'history' | 'settings';

    // Actions
    startRecording: () => void;
    stopRecording: (audioBlob: Blob) => void;
    cancelRecording: () => void;
    setTranscript: (transcript: string) => void;
    setPreviewTranscript: (transcript: string | null) => void;
    setShowPreview: (show: boolean) => void;
    updateRecordingStatus: (id: string, status: RecordingStatus, error?: string) => void;
    addRecording: (recording: Recording) => void;
    deleteRecording: (id: string) => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    setActivePanel: (panel: 'none' | 'history' | 'settings') => void;
    retryRecording: (id: string) => void;
}

const defaultSettings: AppSettings = {
    globalShortcut: 'Ctrl+Shift+R',
    defaultMode: 'raw',
    autoPaste: true,
    showPreview: true,
    previewTimeout: 30,
    audioRetentionHours: 24,
    maxRecordingDuration: 300,
    groqModel: 'whisper-large-v3-turbo',
    groqApiKey: null,
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            currentRecording: null,
            recordings: [],
            isRecording: false,
            isProcessing: false,
            currentTranscript: null,
            previewTranscript: null,
            showPreview: false,
            settings: defaultSettings,
            toasts: [],
            activePanel: 'none',

            // Actions
            startRecording: () => {
                const newRecording: Recording = {
                    id: generateId(),
                    audioPath: null,
                    rawText: null,
                    refinedText: null,
                    mode: get().settings.defaultMode,
                    status: 'recording',
                    retryCount: 0,
                    durationSeconds: null,
                    errorMessage: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                set({
                    currentRecording: newRecording,
                    isRecording: true,
                    isProcessing: false,
                    currentTranscript: null,
                    previewTranscript: null,
                    showPreview: false,
                });
            },

            stopRecording: (audioBlob: Blob) => {
                const { currentRecording } = get();
                if (!currentRecording) return;

                // Create object URL for the audio blob
                const audioUrl = URL.createObjectURL(audioBlob);

                const updatedRecording: Recording = {
                    ...currentRecording,
                    audioPath: audioUrl,
                    status: 'processing',
                    updatedAt: new Date().toISOString(),
                };

                set({
                    currentRecording: updatedRecording,
                    isRecording: false,
                    isProcessing: true,
                });

                // Add to recordings list
                get().addRecording(updatedRecording);
            },

            cancelRecording: () => {
                set({
                    currentRecording: null,
                    isRecording: false,
                    isProcessing: false,
                });
            },

            setTranscript: (transcript: string) => {
                const { currentRecording, settings } = get();

                if (currentRecording) {
                    const isModified = currentRecording.mode === 'modified';

                    const updatedRecording: Recording = {
                        ...currentRecording,
                        rawText: isModified ? currentRecording.rawText : transcript,
                        refinedText: isModified ? transcript : null,
                        status: 'completed',
                        updatedAt: new Date().toISOString(),
                    };

                    set({
                        currentRecording: updatedRecording,
                        currentTranscript: transcript,
                        isProcessing: false,
                        showPreview: settings.showPreview,
                    });

                    // Update in recordings list
                    set((state) => ({
                        recordings: state.recordings.map((r) =>
                            r.id === updatedRecording.id ? updatedRecording : r
                        ),
                    }));
                }
            },

            setPreviewTranscript: (transcript: string | null) => {
                set({ previewTranscript: transcript });
            },

            setShowPreview: (show: boolean) => {
                set({ showPreview: show });
            },

            updateRecordingStatus: (id: string, status: RecordingStatus, error?: string) => {
                set((state) => ({
                    recordings: state.recordings.map((r) =>
                        r.id === id
                            ? { ...r, status, errorMessage: error || null, updatedAt: new Date().toISOString() }
                            : r
                    ),
                    currentRecording:
                        state.currentRecording?.id === id
                            ? { ...state.currentRecording, status, errorMessage: error || null }
                            : state.currentRecording,
                }));
            },

            addRecording: (recording: Recording) => {
                set((state) => {
                    if (state.recordings.some((r) => r.id === recording.id)) {
                        return state;
                    }
                    return {
                        recordings: [recording, ...state.recordings].slice(0, 50),
                    };
                });
            },

            deleteRecording: (id: string) => {
                set((state) => ({
                    recordings: state.recordings.filter((r) => r.id !== id),
                }));
            },

            updateSettings: (newSettings: Partial<AppSettings>) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                }));
            },

            addToast: (toast: Omit<Toast, 'id'>) => {
                const id = generateId();
                set((state) => ({
                    toasts: [...state.toasts, { ...toast, id }],
                }));

                // Auto-remove toast
                setTimeout(() => {
                    get().removeToast(id);
                }, toast.duration);
            },

            removeToast: (id: string) => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            },

            setActivePanel: (panel: 'none' | 'history' | 'settings') => {
                set({ activePanel: panel });
            },

            retryRecording: (id: string) => {
                const recording = get().recordings.find((r) => r.id === id);
                if (!recording || !recording.audioPath) return;

                // Update retry count and status
                set((state) => ({
                    recordings: state.recordings.map((r) =>
                        r.id === id
                            ? {
                                ...r,
                                retryCount: r.retryCount + 1,
                                status: 'processing',
                                errorMessage: null,
                                updatedAt: new Date().toISOString(),
                            }
                            : r
                    ),
                }));

                // Set as current recording for processing
                set({
                    currentRecording: {
                        ...recording,
                        retryCount: recording.retryCount + 1,
                        status: 'processing',
                    },
                    isProcessing: true,
                });
            },
        }),
        {
            name: 'whisper-alt-storage',
            partialize: (state) => ({
                settings: state.settings,
                recordings: state.recordings,
            }),
        }
    )
);
