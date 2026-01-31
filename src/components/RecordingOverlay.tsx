'use client';

import { useEffect, useState } from 'react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { X, Clock } from 'lucide-react';

interface RecordingOverlayProps {
    isRecording: boolean;
    duration: number;
    amplitude: number;
    formattedDuration: string;
    onCancel: () => void;
}

export function RecordingOverlay({
    isRecording,
    duration,
    amplitude,
    formattedDuration,
    onCancel,
}: RecordingOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isRecording) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isRecording]);

    if (!isVisible) return null;

    // Calculate progress for 5-minute limit
    const MAX_DURATION = 5 * 60 * 1000; // 5 minutes
    const progress = Math.min((duration / MAX_DURATION) * 100, 100);

    return (
        <div
            className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/80 backdrop-blur-sm
        transition-opacity duration-300
        ${isRecording ? 'opacity-100' : 'opacity-0'}
      `}
        >
            {/* Close button */}
            <button
                onClick={onCancel}
                className="
          absolute top-6 right-6
          p-2 rounded-full
          text-foreground-muted hover:text-foreground
          hover:bg-surface-elevated
          transition-colors
        "
                aria-label="Cancel recording"
            >
                <X size={24} />
            </button>

            {/* Main content */}
            <div className="flex flex-col items-center gap-8 max-w-lg w-full px-8">
                {/* Recording indicator */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="
              w-4 h-4 rounded-full bg-accent
              animate-recording-pulse
            " />
                        <div className="
              absolute inset-0 w-4 h-4 rounded-full bg-accent
              animate-ping opacity-75
            " />
                    </div>
                    <span className="text-lg font-medium text-foreground">
                        Recording...
                    </span>
                </div>

                {/* Waveform */}
                <div className="w-full">
                    <WaveformVisualizer
                        isRecording={isRecording}
                        amplitude={amplitude}
                        className="h-40"
                    />
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 text-foreground-muted">
                    <Clock size={18} />
                    <span className="text-2xl font-mono font-medium">
                        {formattedDuration}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs">
                    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent transition-all duration-1000 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-foreground-muted text-center mt-2">
                        Max 5 minutes • Press Escape to cancel
                    </p>
                </div>

                {/* Instructions */}
                <div className="text-sm text-foreground-muted text-center">
                    <p>Press <kbd className="px-2 py-1 bg-surface rounded text-foreground">Ctrl+Shift+R</kbd> to stop</p>
                </div>
            </div>
        </div>
    );
}
