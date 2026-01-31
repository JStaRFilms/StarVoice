'use client';

import { useState } from 'react';
import { Settings, Keyboard, Key, Sliders, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from './ModeToggle';
import type { AppSettings } from '@/types';

interface SettingsPanelProps {
    settings: AppSettings;
    onUpdateSettings: (settings: Partial<AppSettings>) => void;
    isOpen: boolean;
    onClose: () => void;
}

type TabId = 'general' | 'shortcuts' | 'api' | 'advanced';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ElementType;
}

const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
];

function GeneralTab({
    settings,
    onUpdate,
}: {
    settings: AppSettings;
    onUpdate: (settings: Partial<AppSettings>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Default Transcription Mode</label>
                <ModeToggle
                    mode={settings.defaultMode}
                    onChange={(mode) => onUpdate({ defaultMode: mode })}
                />
                <p className="text-xs text-foreground-muted mt-2">
                    Choose whether to use raw transcription or AI-refined output by default.
                </p>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium">Auto-Paste</label>
                    <p className="text-xs text-foreground-muted">
                        Automatically paste transcription at cursor location
                    </p>
                </div>
                <button
                    onClick={() => onUpdate({ autoPaste: !settings.autoPaste })}
                    className={cn(
                        'w-12 h-6 rounded-full transition-colors relative',
                        settings.autoPaste ? 'bg-accent' : 'bg-surface-elevated'
                    )}
                >
                    <span
                        className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-background transition-transform',
                            settings.autoPaste ? 'left-7' : 'left-1'
                        )}
                    />
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium">Show Preview Panel</label>
                    <p className="text-xs text-foreground-muted">
                        Display preview before pasting transcription
                    </p>
                </div>
                <button
                    onClick={() => onUpdate({ showPreview: !settings.showPreview })}
                    className={cn(
                        'w-12 h-6 rounded-full transition-colors relative',
                        settings.showPreview ? 'bg-accent' : 'bg-surface-elevated'
                    )}
                >
                    <span
                        className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-background transition-transform',
                            settings.showPreview ? 'left-7' : 'left-1'
                        )}
                    />
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Preview Timeout (seconds)</label>
                <input
                    type="number"
                    min={5}
                    max={120}
                    value={settings.previewTimeout}
                    onChange={(e) => onUpdate({ previewTimeout: parseInt(e.target.value) || 30 })}
                    className="w-full bg-surface rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-foreground-muted mt-1">
                    How long to show the preview panel before auto-dismissing.
                </p>
            </div>
        </div>
    );
}

function ShortcutsTab({
    settings,
    onUpdate,
}: {
    settings: AppSettings;
    onUpdate: (settings: Partial<AppSettings>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Global Shortcut</label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={settings.globalShortcut}
                        readOnly
                        className="flex-1 bg-surface rounded-lg px-4 py-2 text-foreground font-mono"
                    />
                    <button
                        onClick={() => onUpdate({ globalShortcut: 'Ctrl+Shift+R' })}
                        className="px-4 py-2 bg-surface-elevated rounded-lg text-sm hover:bg-surface transition-colors"
                    >
                        Reset
                    </button>
                </div>
                <p className="text-xs text-foreground-muted mt-2">
                    Press this shortcut anywhere to start/stop recording.
                    <br />
                    <span className="text-accent">Note:</span> In the web version, use Ctrl+Shift+R (may refresh page in some browsers).
                </p>
            </div>
        </div>
    );
}

function ApiTab({
    settings,
    onUpdate,
}: {
    settings: AppSettings;
    onUpdate: (settings: Partial<AppSettings>) => void;
}) {
    const [showKey, setShowKey] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Groq API Key</label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        name="groq-api-key-settings"
                        autoComplete="new-password"
                        placeholder="Enter your Groq API key"
                        value={settings.groqApiKey || ''}
                        onChange={(e) => onUpdate({ groqApiKey: e.target.value })}
                        className="w-full bg-surface rounded-lg px-4 py-2 pr-10 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                    >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <p className="text-xs text-foreground-muted mt-2">
                    Your API key is stored locally and never sent to our servers.
                    <br />
                    Get your key from{' '}
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

            <div>
                <label className="block text-sm font-medium mb-2">Transcription Model</label>
                <select
                    value={settings.groqModel}
                    onChange={(e) => onUpdate({ groqModel: e.target.value })}
                    className="w-full bg-surface rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    <option value="whisper-large-v3-turbo">whisper-large-v3-turbo (Fast)</option>
                    <option value="whisper-large-v3">whisper-large-v3 (Accurate)</option>
                </select>
                <p className="text-xs text-foreground-muted mt-2">
                    Turbo is faster but slightly less accurate. Use v3 for maximum accuracy.
                </p>
            </div>
        </div>
    );
}

function AdvancedTab({
    settings,
    onUpdate,
}: {
    settings: AppSettings;
    onUpdate: (settings: Partial<AppSettings>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Max Recording Duration (seconds)</label>
                <input
                    type="number"
                    min={30}
                    max={600}
                    value={settings.maxRecordingDuration}
                    onChange={(e) => onUpdate({ maxRecordingDuration: parseInt(e.target.value) || 300 })}
                    className="w-full bg-surface rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-foreground-muted mt-1">
                    Maximum recording time before auto-stopping.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Audio Retention (hours)</label>
                <input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.audioRetentionHours}
                    onChange={(e) => onUpdate({ audioRetentionHours: parseInt(e.target.value) || 24 })}
                    className="w-full bg-surface rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-foreground-muted mt-1">
                    How long to keep audio files for retry functionality.
                </p>
            </div>
        </div>
    );
}

export function SettingsPanel({
    settings,
    onUpdateSettings,
    isOpen,
    onClose,
}: SettingsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabId>('general');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Settings size={20} />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex" style={{ minHeight: '400px' }}>
                    {/* Sidebar */}
                    <div className="w-48 border-r border-[var(--glass-border)] p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        activeTab === tab.id
                                            ? 'bg-accent/10 text-accent'
                                            : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
                                    )}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'general' && (
                            <GeneralTab settings={settings} onUpdate={onUpdateSettings} />
                        )}
                        {activeTab === 'shortcuts' && (
                            <ShortcutsTab settings={settings} onUpdate={onUpdateSettings} />
                        )}
                        {activeTab === 'api' && <ApiTab settings={settings} onUpdate={onUpdateSettings} />}
                        {activeTab === 'advanced' && (
                            <AdvancedTab settings={settings} onUpdate={onUpdateSettings} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
