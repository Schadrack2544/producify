"use client";

import { useEffect, useRef, useState } from "react";

interface WaveformVisualizerProps {
    audioLevel?: number; // 0-1 value for live recording
    audioUrl?: string; // For static waveform display
    isRecording?: boolean;
    isPlaying?: boolean;
    height?: number;
    barCount?: number;
    className?: string;
}

export function WaveformVisualizer({
    audioLevel = 0,
    audioUrl,
    isRecording = false,
    isPlaying = false,
    height = 80,
    barCount = 50,
    className = "",
}: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [staticBars, setStaticBars] = useState<number[]>([]);
    const animationRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>(Array(barCount).fill(0.1));

    // Generate static waveform from audio URL
    useEffect(() => {
        if (audioUrl && !isRecording) {
            generateStaticWaveform();
        }
    }, [audioUrl, isRecording]);

    const generateStaticWaveform = async () => {
        if (!audioUrl) return;

        try {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const channelData = audioBuffer.getChannelData(0);
            const samplesPerBar = Math.floor(channelData.length / barCount);
            const bars: number[] = [];

            for (let i = 0; i < barCount; i++) {
                let sum = 0;
                for (let j = 0; j < samplesPerBar; j++) {
                    sum += Math.abs(channelData[i * samplesPerBar + j]);
                }
                bars.push(Math.min(1, (sum / samplesPerBar) * 3 + 0.1));
            }

            setStaticBars(bars);
            audioContext.close();
        } catch (error) {
            // Fallback to random bars for visual appeal
            setStaticBars(
                Array(barCount)
                    .fill(0)
                    .map(() => Math.random() * 0.7 + 0.2)
            );
        }
    };

    // Animate bars during recording
    useEffect(() => {
        if (!isRecording) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const animate = () => {
            const newBars = barsRef.current.map((bar, index) => {
                // Create wave-like motion based on audio level
                const targetHeight = audioLevel * 0.8 + Math.sin(Date.now() / 100 + index / 3) * 0.1 + 0.15;
                // Smooth transition
                return bar + (targetHeight - bar) * 0.3;
            });
            barsRef.current = newBars;

            drawBars(newBars, true);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRecording, audioLevel]);

    // Draw static bars when not recording
    useEffect(() => {
        if (!isRecording && staticBars.length > 0) {
            drawBars(staticBars, isPlaying);
        }
    }, [staticBars, isRecording, isPlaying]);

    const drawBars = (bars: number[], animated: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.offsetWidth;
        const actualHeight = height;

        canvas.width = width * dpr;
        canvas.height = actualHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, actualHeight);

        const barWidth = (width / bars.length) * 0.7;
        const gap = (width / bars.length) * 0.3;

        bars.forEach((barHeight, index) => {
            const x = index * (barWidth + gap);
            const h = barHeight * (actualHeight * 0.8);
            const y = (actualHeight - h) / 2;

            // Gradient colors
            const gradient = ctx.createLinearGradient(0, y, 0, y + h);
            if (animated) {
                gradient.addColorStop(0, "#a855f7"); // purple-500
                gradient.addColorStop(0.5, "#ec4899"); // pink-500
                gradient.addColorStop(1, "#a855f7");
            } else {
                gradient.addColorStop(0, "#9333ea"); // purple-600
                gradient.addColorStop(1, "#6b21a8"); // purple-800
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, h, 2);
            ctx.fill();
        });
    };

    // Initial render for empty state
    useEffect(() => {
        if (!isRecording && staticBars.length === 0) {
            const emptyBars = Array(barCount)
                .fill(0)
                .map(() => 0.1);
            drawBars(emptyBars, false);
        }
    }, []);

    return (
        <div
            className={`bg-black/30 rounded-lg p-4 ${className}`}
            style={{ height: height + 32 }}
        >
            <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height }}
            />
        </div>
    );
}
