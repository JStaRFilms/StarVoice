'use client';

import { Mic, History, Settings, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecordingStatus } from '@/types';

interface SystemTrayProps {
    status: RecordingStatus;
    onStartRecording: () => void;
    onShowHistory: () => void;
    onShowSettings: () => void;
    onQuit: () => void;
}

const statusConfig = {
    idle: {
        color: 'bg-foreground-muted',
        label: 'Ready',
    },
    recording: {
        color: 'bg-accent animate-pulse',
        label: 'Recording...',
    },
    processing: {
        color: 'bg-warning animate-pulse',
        label: 'Processing...',
    },
    completed: {
        color: 'bg-success',
        label: 'Completed',
    },
    failed: {
        color: 'bg-error',
        label: 'Failed',
    },
};

export function SystemTray({
    status,
    onStartRecording,
    onShowHistory,
    onShowSettings,
    onQuit,
}: SystemTrayProps) {
    const config = statusConfig[status];

    return (
        <div className="fixed bottom-4 left-4 z-30">
            <div className="glass rounded-2xl p-2 flex items-center gap-2 shadow-lg">
                {/* Status indicator */}
                <div
                    className={cn(
                        'w-3 h-3 rounded-full',
                        config.color
                    )}
                    title={config.label}
                />

                {/* Menu items */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onStartRecording}
                        disabled={status === 'recording' || status === 'processing'}
                        className={cn(
                            'p-2 rounded-xl transition-colors',
                            status === 'recording' || status === 'processing'
                                ? 'text-foreground-muted cursor-not-allowed'
                                : 'text-foreground hover:bg-surface-elevated'
                        )}
                        title="Start Recording (Ctrl+Shift+R)"
                    >
                        <Mic size={18} />
                    </button>

                    <button
                        onClick={onShowHistory}
                        className="p-2 rounded-xl text-foreground hover:bg-surface-elevated transition-colors"
                        title="History"
                    >
                        <History size={18} />
                    </button>

                    <button
                        onClick={onShowSettings}
                        className="p-2 rounded-xl text-foreground hover:bg-surface-elevated transition-colors"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>

                    <div className="w-px h-6 bg-[var(--glass-border)] mx-1" />

                    <button
                        onClick={onQuit}
                        className="p-2 rounded-xl text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                        title="Quit"
                    >
                        <Power size={18} />
                    </button>
                </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 glass rounded-lg text-xs text-foreground-muted opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {config.label}
            </div>
        </div>
    );
}
