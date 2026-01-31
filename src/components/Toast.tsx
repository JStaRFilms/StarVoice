'use client';

import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast } from '@/types';

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const colorMap = {
    success: 'text-success bg-success/10 border-success/20',
    error: 'text-error bg-error/10 border-error/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    info: 'text-accent bg-accent/10 border-accent/20',
};

export function ToastItem({ toast, onRemove }: ToastItemProps) {
    const Icon = iconMap[toast.type];

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
                'animate-slide-in-top glass',
                colorMap[toast.type]
            )}
        >
            <Icon size={18} className="shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 rounded hover:bg-black/10 transition-colors"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}
