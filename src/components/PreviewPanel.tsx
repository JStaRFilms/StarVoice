'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Edit2 } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import type { TranscriptionMode } from '@/types';

interface PreviewPanelProps {
    transcript: string;
    mode: TranscriptionMode;
    isVisible: boolean;
    onPaste: () => void;
    onCopy: () => void;
    onDismiss: () => void;
    onEdit?: (text: string) => void;
    autoDismissMs?: number;
}

export function PreviewPanel({
    transcript,
    mode,
    isVisible,
    onPaste,
    onCopy,
    onDismiss,
    onEdit,
    autoDismissMs = 30000,
}: PreviewPanelProps) {
    const [editedText, setEditedText] = useState(transcript);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(autoDismissMs);

    // Reset edited text when transcript changes
    useEffect(() => {
        setEditedText(transcript);
    }, [transcript]);

    // Auto-dismiss timer
    useEffect(() => {
        if (!isVisible) {
            setTimeLeft(autoDismissMs);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1000) {
                    onDismiss();
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isVisible, autoDismissMs, onDismiss]);

    const handleCopy = useCallback(async () => {
        const success = await copyToClipboard(editedText);
        if (success) {
            setCopied(true);
            onCopy();
            setTimeout(() => setCopied(false), 2000);
        }
    }, [editedText, onCopy]);

    const handlePaste = useCallback(() => {
        onEdit?.(editedText);
        onPaste();
    }, [editedText, onEdit, onPaste]);

    const toggleEdit = useCallback(() => {
        if (isEditing) {
            // Save changes
            onEdit?.(editedText);
        }
        setIsEditing(!isEditing);
    }, [isEditing, editedText, onEdit]);

    if (!isVisible) return null;

    const progressPercent = (timeLeft / autoDismissMs) * 100;

    return (
        <div
            className={cn(
                "fixed top-4 left-1/2 -translate-x-1/2 z-50",
                "w-full max-w-2xl px-4"
            )}
        >
            <div className={cn(
                "glass rounded-2xl shadow-2xl overflow-hidden",
                "animate-slide-in-top"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded",
                            mode === 'raw'
                                ? "bg-surface-elevated text-foreground-muted"
                                : "bg-accent/20 text-accent"
                        )}>
                            {mode} Mode
                        </span>
                        <span className="text-xs text-foreground-muted">
                            Preview before paste
                        </span>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {isEditing ? (
                        <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className={cn(
                                "w-full h-32 bg-surface rounded-lg p-3 text-sm resize-none",
                                "text-foreground placeholder:text-foreground-muted",
                                "focus:outline-none focus:ring-2 focus:ring-accent",
                                "border border-transparent focus:border-accent"
                            )}
                            autoFocus
                        />
                    ) : (
                        <div
                            onClick={() => setIsEditing(true)}
                            className={cn(
                                "w-full h-32 bg-surface rounded-lg p-3 text-sm overflow-y-auto",
                                "text-foreground cursor-text",
                                "hover:bg-surface-elevated transition-colors"
                            )}
                        >
                            {editedText || <span className="text-foreground-muted italic">No transcript available</span>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--glass-border)]">
                    {/* Auto-dismiss progress */}
                    <div className="flex items-center gap-2 flex-1 mr-4">
                        <div className="h-1 flex-1 bg-surface-elevated rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent transition-all duration-1000 ease-linear"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-xs text-foreground-muted">
                            {Math.ceil(timeLeft / 1000)}s
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                copied
                                    ? "bg-success/20 text-success"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
                            )}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={toggleEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                        >
                            <Edit2 size={14} />
                            {isEditing ? 'Done' : 'Edit'}
                        </button>
                        <button
                            onClick={handlePaste}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-accent text-background hover:bg-accent-muted transition-colors"
                        >
                            <Check size={14} />
                            Paste
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
