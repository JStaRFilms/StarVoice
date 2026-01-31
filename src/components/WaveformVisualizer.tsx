'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
    isRecording: boolean;
    amplitude: number;
    className?: string;
}

export function WaveformVisualizer({
    isRecording,
    amplitude,
    className = '',
}: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize bars
        const barCount = 60;
        if (barsRef.current.length === 0) {
            barsRef.current = Array(barCount).fill(0.1);
        }

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Update bars based on amplitude
            barsRef.current = barsRef.current.map((bar, index) => {
                if (!isRecording) return 0.1;

                // Create wave effect
                const waveOffset = Math.sin(Date.now() / 200 + index * 0.3) * 0.3;
                const targetHeight = Math.max(0.1, amplitude * 0.8 + waveOffset * 0.4);

                // Smooth transition
                return bar + (targetHeight - bar) * 0.2;
            });

            // Draw bars
            const barWidth = (width - (barCount - 1) * 4) / barCount;
            const gap = 4;

            barsRef.current.forEach((barHeight, index) => {
                const x = index * (barWidth + gap);
                const barH = barHeight * height * 0.8;
                const y = (height - barH) / 2;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
                gradient.addColorStop(0, 'rgba(0, 212, 170, 0.8)');
                gradient.addColorStop(0.5, 'rgba(0, 212, 170, 1)');
                gradient.addColorStop(1, 'rgba(0, 212, 170, 0.8)');

                ctx.fillStyle = gradient;

                // Rounded bar
                const radius = barWidth / 2;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barH, radius);
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRecording, amplitude]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-32 ${className}`}
            style={{ imageRendering: 'crisp-edges' }}
        />
    );
}
