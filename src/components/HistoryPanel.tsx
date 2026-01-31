'use client';

import { useState, useMemo } from 'react';
import { Search, Copy, Trash2, RefreshCw, Clock, Calendar } from 'lucide-react';
import { cn, formatDuration, copyToClipboard } from '@/lib/utils';
import type { Recording, TranscriptionMode } from '@/types';

interface HistoryPanelProps {
    recordings: Recording[];
    onCopy: (text: string) => void;
    onDelete: (id: string) => void;
    onRetry: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

function HistoryItem({
    recording,
    onCopy,
    onDelete,
    onRetry,
}: {
    recording: Recording;
    onCopy: (text: string) => void;
    onDelete: () => void;
    onRetry: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = recording.mode === 'modified' && recording.refinedText
            ? recording.refinedText
            : recording.rawText;

        if (text) {
            const success = await copyToClipboard(text);
            if (success) {
                setCopied(true);
                onCopy(text);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const displayText = recording.mode === 'modified' && recording.refinedText
        ? recording.refinedText
        : recording.rawText;

    const formattedDate = new Date(recording.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const statusColors = {
        idle: 'bg-foreground-muted',
        recording: 'bg-accent animate-pulse',
        processing: 'bg-warning animate-pulse',
        completed: 'bg-success',
        failed: 'bg-error',
    };

    return (
        <div className="glass rounded-xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', statusColors[recording.status])} />
                    <span className="text-xs text-foreground-muted">{formattedDate}</span>
                    {recording.durationSeconds && (
                        <span className="text-xs text-foreground-muted flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(recording.durationSeconds * 1000)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {recording.status === 'failed' && (
                        <button
                            onClick={onRetry}
                            className="p-1.5 rounded-lg text-foreground-muted hover:text-warning hover:bg-warning/10 transition-colors"
                            title="Retry transcription"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            copied
                                ? 'text-success bg-success/10'
                                : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
                        )}
                        title="Copy to clipboard"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Mode badge */}
            <div className="flex items-center gap-2">
                <span
                    className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        recording.mode === 'modified'
                            ? 'bg-accent/20 text-accent'
                            : 'bg-surface-elevated text-foreground-muted'
                    )}
                >
                    {recording.mode}
                </span>
                {recording.retryCount > 0 && (
                    <span className="text-xs text-foreground-muted">
                        {recording.retryCount} retr{recording.retryCount === 1 ? 'y' : 'ies'}
                    </span>
                )}
            </div>

            {/* Content */}
            <p className="text-sm text-foreground line-clamp-3">
                {displayText || (
                    <span className="text-foreground-muted italic">
                        {recording.status === 'processing'
                            ? 'Processing...'
                            : recording.status === 'failed'
                                ? recording.errorMessage || 'Transcription failed'
                                : 'No transcript available'}
                    </span>
                )}
            </p>
        </div>
    );
}

export function HistoryPanel({
    recordings,
    onCopy,
    onDelete,
    onRetry,
    isOpen,
    onClose,
}: HistoryPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [modeFilter, setModeFilter] = useState<TranscriptionMode | 'all'>('all');

    const filteredRecordings = useMemo(() => {
        return recordings.filter((recording) => {
            // Mode filter
            if (modeFilter !== 'all' && recording.mode !== modeFilter) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const text = (recording.rawText || recording.refinedText || '').toLowerCase();
                return text.includes(query);
            }

            return true;
        });
    }, [recordings, searchQuery, modeFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="absolute right-0 top-0 h-full w-full max-w-md glass border-l border-[var(--glass-border)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar size={20} />
                        History
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search transcriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    {/* Mode filter */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setModeFilter('all')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                modeFilter === 'all'
                                    ? 'bg-accent text-background'
                                    : 'bg-surface text-foreground-muted hover:text-foreground'
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setModeFilter('raw')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                modeFilter === 'raw'
                                    ? 'bg-accent text-background'
                                    : 'bg-surface text-foreground-muted hover:text-foreground'
                            )}
                        >
                            Raw
                        </button>
                        <button
                            onClick={() => setModeFilter('modified')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                modeFilter === 'modified'
                                    ? 'bg-accent text-background'
                                    : 'bg-surface text-foreground-muted hover:text-foreground'
                            )}
                        >
                            Modified
                        </button>
                    </div>
                </div>

                {/* Recordings list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {filteredRecordings.length === 0 ? (
                        <div className="text-center py-8 text-foreground-muted">
                            <p>No recordings found</p>
                            <p className="text-sm mt-1">
                                {searchQuery ? 'Try a different search term' : 'Start recording to see history'}
                            </p>
                        </div>
                    ) : (
                        filteredRecordings.map((recording) => (
                            <HistoryItem
                                key={recording.id}
                                recording={recording}
                                onCopy={onCopy}
                                onDelete={() => onDelete(recording.id)}
                                onRetry={() => onRetry(recording.id)}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--glass-border)] text-xs text-foreground-muted text-center">
                    Showing {filteredRecordings.length} of {recordings.length} recordings
                </div>
            </div>
        </div>
    );
}
