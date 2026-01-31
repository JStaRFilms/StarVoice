'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioState } from '@/types';

const MAX_RECORDING_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface UseAudioRecorderOptions {
    onError?: (error: string) => void;
    onStart?: () => void;
    onStop?: (blob: Blob) => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
    const [state, setState] = useState<AudioState>({
        isRecording: false,
        duration: 0,
        amplitude: 0,
        error: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const stopAnalyser = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const updateAmplitude = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average amplitude
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedAmplitude = average / 255; // Normalize to 0-1

        setState(prev => ({ ...prev, amplitude: normalizedAmplitude }));
        animationFrameRef.current = requestAnimationFrame(updateAmplitude);
    }, []);

    const stopRecordingInternal = useCallback(() => {
        // Clear timers
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (maxDurationTimeoutRef.current) {
            clearTimeout(maxDurationTimeoutRef.current);
            maxDurationTimeoutRef.current = null;
        }

        // Stop analyser
        stopAnalyser();

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isRecording: false,
            amplitude: 0,
        }));
    }, [stopAnalyser]);

    const startRecording = useCallback(async () => {
        try {
            // Reset state
            audioChunksRef.current = [];
            setState({
                isRecording: true,
                duration: 0,
                amplitude: 0,
                error: null,
            });

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });
            streamRef.current = stream;

            // Set up audio context for visualization
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Set up MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                options.onStop?.(audioBlob);
            };

            // Start recording
            mediaRecorder.start(100); // Collect data every 100ms
            startTimeRef.current = Date.now();
            options.onStart?.();

            // Start amplitude visualization
            updateAmplitude();

            // Start duration timer
            timerIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                setState(prev => ({ ...prev, duration: elapsed }));
            }, 100);

            // Set max duration timeout
            maxDurationTimeoutRef.current = setTimeout(() => {
                stopRecordingInternal();
            }, MAX_RECORDING_DURATION);
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to access microphone';

            setState(prev => ({
                ...prev,
                isRecording: false,
                error: errorMessage,
            }));

            options.onError?.(errorMessage);
        }
    }, [options, updateAmplitude, stopRecordingInternal]);

    const stopRecording = useCallback(() => {
        stopRecordingInternal();
    }, [stopRecordingInternal]);

    const cancelRecording = useCallback(() => {
        // Clear timers
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (maxDurationTimeoutRef.current) {
            clearTimeout(maxDurationTimeoutRef.current);
            maxDurationTimeoutRef.current = null;
        }

        // Stop analyser
        stopAnalyser();

        // Stop media recorder without saving
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.onstop = null; // Prevent onStop callback
        }

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Clear chunks
        audioChunksRef.current = [];

        setState(prev => ({
            ...prev,
            isRecording: false,
            duration: 0,
            amplitude: 0,
        }));
    }, [stopAnalyser]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecordingInternal();
            cancelRecording();
        };
    }, [stopRecordingInternal, cancelRecording]);

    // Format duration as mm:ss
    const formatDuration = useCallback((ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    return {
        ...state,
        formattedDuration: formatDuration(state.duration),
        startRecording,
        stopRecording,
        cancelRecording,
    };
}
