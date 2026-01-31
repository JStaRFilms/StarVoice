'use client';

import { useEffect, useCallback } from 'react';

interface UseGlobalShortcutOptions {
    onToggle: () => void;
    onCancel?: () => void;
    disabled?: boolean;
}

/**
 * Hook for handling global keyboard shortcuts
 * 
 * Note: In a real Tauri app, this would use the Tauri global-shortcut plugin.
 * For this web implementation, we use local keyboard shortcuts.
 */
export function useGlobalShortcut({
    onToggle,
    onCancel,
    disabled = false,
}: UseGlobalShortcutOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (disabled) return;

            // Ctrl+Shift+R or Cmd+Shift+R to toggle recording
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                onToggle();
            }

            // Escape to cancel
            if (event.key === 'Escape' && onCancel) {
                event.preventDefault();
                onCancel();
            }
        },
        [onToggle, onCancel, disabled]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Hook for handling the Escape key specifically
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onEscape();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onEscape, enabled]);
}
