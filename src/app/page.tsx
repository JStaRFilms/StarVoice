'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mic, Keyboard, Settings as SettingsIcon } from 'lucide-react';
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAppStore } from '@/stores/useAppStore';
import { RecordingOverlay } from '@/components/RecordingOverlay';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ModeToggle } from '@/components/ModeToggle';
import { SystemTray } from '@/components/SystemTray';
import { HistoryPanel } from '@/components/HistoryPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ToastContainer } from '@/components/Toast';
import { processAudio } from '@/services/transcription';
import { copyToClipboard } from '@/lib/utils';
import type { TranscriptionMode } from '@/types';

export default function Home() {
  // App store state
  const {
    currentRecording,
    recordings,
    isProcessing,
    currentTranscript,
    showPreview,
    settings,
    toasts,
    addRecording,
    updateRecordingStatus,
    setTranscript,
    setShowPreview,
    addToast,
    removeToast,
    deleteRecording,
    retryRecording,
    updateSettings,
  } = useAppStore();

  // Local state
  const [mode, setMode] = useState<TranscriptionMode>(settings.defaultMode);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Deduplicate recordings on mount (fix for unique key warning)
  useEffect(() => {
    const uniqueIds = new Set();
    const uniqueRecordings: typeof recordings = [];
    let hasDuplicates = false;

    recordings.forEach((r) => {
      if (!uniqueIds.has(r.id)) {
        uniqueIds.add(r.id);
        uniqueRecordings.push(r);
      } else {
        hasDuplicates = true;
      }
    });

    if (hasDuplicates) {
      // We can't directly set the whole array via the store actions exposed currently,
      // but we can delete the duplicates. Using a setTimeout to avoid render cycle issues.
      setTimeout(() => {
        // Since the store doesn't have a "setRecordings" method, we rely on the users
        // actions or we could add a bulk update method.
        // For now, let's just log it or maybe we can't easily fix it without a store update.
        // Wait, I can loop delete? No that's inefficient.
        // Let's add a migration method to the store? Or just ignore for now as the prev task fixed NEW ones.
        // Actually, I can use a hack or just assume the user will clear history.
        // Let's TRY to clean it up via deleteRecording for duplicates.
        const seen = new Set<string>();
        recordings.forEach(r => {
          if (seen.has(r.id)) {
            deleteRecording(r.id);
          } else {
            seen.add(r.id);
          }
        });
      }, 0);
    }
  }, [recordings, deleteRecording]);

  // Handle hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update mode when settings change
  useEffect(() => {
    setMode(settings.defaultMode);
  }, [settings.defaultMode]);



  // Get API key from settings
  const apiKey = settings.groqApiKey || '';

  // Audio recorder hook
  const {
    isRecording,
    duration,
    amplitude,
    formattedDuration,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    cancelRecording: cancelAudioRecording,
  } = useAudioRecorder({
    onStart: () => {
      addToast({
        message: 'Recording started',
        type: 'info',
        duration: 2000,
      });
    },
    onStop: async (blob) => {
      // Store the recording
      addRecording({
        ...currentRecording!,
        audioPath: URL.createObjectURL(blob),
        durationSeconds: Math.floor(duration / 1000),
        mode,
      });

      // Process transcription
      await handleTranscription(blob);
    },
    onError: (error) => {
      addToast({
        message: error,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Handle transcription
  const handleTranscription = async (audioBlob: Blob) => {
    if (!apiKey) {
      addToast({
        message: 'Please set your Groq API key in settings',
        type: 'error',
        duration: 5000,
      });
      updateRecordingStatus(currentRecording?.id || '', 'failed', 'No API key configured');
      return;
    }

    try {
      const result = await processAudio(audioBlob, mode, {
        apiKey,
        model: settings.groqModel,
      });

      const finalTranscript = mode === 'modified' && result.refined
        ? result.refined
        : result.raw;

      setTranscript(finalTranscript);

      // Copy to clipboard if auto-paste is enabled
      if (settings.autoPaste) {
        await copyToClipboard(finalTranscript);
        addToast({
          message: 'Transcription copied to clipboard!',
          type: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      updateRecordingStatus(currentRecording?.id || '', 'failed', errorMessage);
      addToast({
        message: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }
  };

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      // Start new recording
      useAppStore.getState().startRecording();
      await startAudioRecording();
    }
  }, [isRecording, startAudioRecording, stopAudioRecording]);

  // Cancel recording
  const handleCancelRecording = useCallback(() => {
    cancelAudioRecording();
    useAppStore.getState().cancelRecording();
    addToast({
      message: 'Recording cancelled',
      type: 'info',
      duration: 2000,
    });
  }, [cancelAudioRecording, addToast]);

  // Global shortcut
  useGlobalShortcut({
    onToggle: toggleRecording,
    onCancel: handleCancelRecording,
  });

  // Handle paste from preview
  const handlePaste = useCallback(async () => {
    if (currentTranscript) {
      await copyToClipboard(currentTranscript);
      setShowPreview(false);
      addToast({
        message: 'Transcription copied to clipboard!',
        type: 'success',
        duration: 3000,
      });
    }
  }, [currentTranscript, setShowPreview, addToast]);

  // Handle copy from preview
  const handleCopy = useCallback(() => {
    addToast({
      message: 'Copied to clipboard',
      type: 'success',
      duration: 2000,
    });
  }, [addToast]);

  // Get current status for system tray
  const getStatus = () => {
    if (isRecording) return 'recording';
    if (isProcessing) return 'processing';
    return 'idle';
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-accent-muted bg-clip-text text-transparent">
          WhisperAlt
        </h1>
        <p className="text-foreground-muted">
          Fast, smart voice transcription with AI refinement
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Recording button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`
              relative w-32 h-32 rounded-full flex items-center justify-center
              transition-all duration-300 shadow-2xl
              ${isRecording
                ? 'bg-error hover:bg-error/90 shadow-error/30'
                : 'bg-accent hover:bg-accent-muted shadow-accent/30'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRecording ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-background rounded-sm" />
                <span className="text-xs font-medium text-background">Stop</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Mic size={40} className="text-background" />
                <span className="text-xs font-medium text-background">Record</span>
              </div>
            )}

            {/* Pulse animation when recording */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-error animate-ping opacity-30" />
            )}
          </button>

          {/* Mode toggle */}
          <ModeToggle
            mode={mode}
            onChange={setMode}
            disabled={isRecording || isProcessing}
          />

          {/* Instructions */}
          <div className="text-center text-foreground-muted space-y-1">
            <p className="flex items-center justify-center gap-2">
              <Keyboard size={16} />
              Press <kbd className="px-2 py-1 bg-surface rounded text-foreground">Ctrl+Shift+R</kbd> to toggle recording
            </p>
            <p className="text-sm">
              {isRecording
                ? 'Recording in progress... Press again to stop'
                : isProcessing
                  ? 'Processing transcription...'
                  : 'Click the button or use the shortcut to start'}
            </p>
          </div>
        </div>

        {/* API Key input (if not set) */}
        {!apiKey && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-foreground-muted mb-4">
              Please enter your Groq API key to start transcribing
            </p>
            <div className="flex items-center justify-center gap-2">
              <input
                type="password"
                name="groq-api-key-main"
                autoComplete="new-password"
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => updateSettings({ groqApiKey: e.target.value })}
                className="bg-surface rounded-lg px-4 py-2 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent w-64"
              />
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
              >
                <SettingsIcon size={16} />
                Settings
              </button>
            </div>
            <p className="text-xs text-foreground-muted mt-2">
              Get your API key from{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Groq Console
              </a>
            </p>
          </div>
        )}

        {/* Recent recordings preview */}
        {recordings.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Recordings</h2>
            <div className="space-y-3">
              {recordings.slice(0, 3).map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-3 bg-surface rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {recording.rawText || recording.refinedText || 'No transcript'}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {new Date(recording.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`
                      text-xs px-2 py-1 rounded ml-2
                      ${recording.mode === 'modified'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-surface-elevated text-foreground-muted'
                      }
                    `}
                  >
                    {recording.mode}
                  </span>
                </div>
              ))}
            </div>
            {recordings.length > 3 && (
              <button
                onClick={() => setShowHistory(true)}
                className="w-full mt-4 text-sm text-accent hover:underline"
              >
                View all {recordings.length} recordings
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recording overlay */}
      <RecordingOverlay
        isRecording={isRecording}
        duration={duration}
        amplitude={amplitude}
        formattedDuration={formattedDuration}
        onCancel={handleCancelRecording}
      />

      {/* Preview panel */}
      <PreviewPanel
        transcript={currentTranscript || ''}
        mode={mode}
        isVisible={showPreview && !!currentTranscript}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onDismiss={() => setShowPreview(false)}
        autoDismissMs={settings.previewTimeout * 1000}
      />

      {/* System tray */}
      <SystemTray
        status={getStatus()}
        onStartRecording={toggleRecording}
        onShowHistory={() => setShowHistory(true)}
        onShowSettings={() => setShowSettings(true)}
        onQuit={() => window.close()}
      />

      {/* History panel */}
      <HistoryPanel
        recordings={recordings}
        onCopy={(text) => {
          copyToClipboard(text);
          addToast({
            message: 'Copied to clipboard',
            type: 'success',
            duration: 2000,
          });
        }}
        onDelete={deleteRecording}
        onRetry={(id) => {
          retryRecording(id);
          // In a real app, this would re-transcribe the audio
          addToast({
            message: 'Retry initiated',
            type: 'info',
            duration: 2000,
          });
        }}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Settings panel */}
      <SettingsPanel
        settings={settings}
        onUpdateSettings={updateSettings}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Toast container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  );
}
