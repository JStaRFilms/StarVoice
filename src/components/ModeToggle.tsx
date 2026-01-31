'use client';

import { cn } from '@/lib/utils';
import type { TranscriptionMode } from '@/types';

interface ModeToggleProps {
    mode: TranscriptionMode;
    onChange: (mode: TranscriptionMode) => void;
    disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled = false }: ModeToggleProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 bg-surface rounded-lg p-1",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <button
                onClick={() => !disabled && onChange('raw')}
                disabled={disabled}
                className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    mode === 'raw'
                        ? "bg-accent text-background shadow-lg shadow-accent/20"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
                )}
            >
                Raw
            </button>
            <button
                onClick={() => !disabled && onChange('modified')}
                disabled={disabled}
                className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    mode === 'modified'
                        ? "bg-accent text-background shadow-lg shadow-accent/20"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
                )}
            >
                Modified
            </button>
        </div>
    );
}
