"use client";

import { useEffect, useState } from "react";

interface BeatVisualizerProps {
    bpm: number;
    isActive: boolean;
    className?: string;
}

export function BeatVisualizer({ bpm, isActive, className = "" }: BeatVisualizerProps) {
    const [currentBeat, setCurrentBeat] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setCurrentBeat(0);
            return;
        }

        // Calculate interval for quarter notes
        const quarterNoteInterval = (60 / bpm) * 1000;

        const interval = setInterval(() => {
            setCurrentBeat((prev) => (prev + 1) % 4);
        }, quarterNoteInterval);

        return () => clearInterval(interval);
    }, [bpm, isActive]);

    const beats = [0, 1, 2, 3];

    return (
        <div className={`flex items-center justify-center gap-3 ${className}`}>
            {beats.map((beat) => (
                <div
                    key={beat}
                    className={`flex flex-col items-center gap-1 transition-all duration-100 ${beat === currentBeat && isActive ? "scale-110" : ""
                        }`}
                >
                    {/* Vertical bar */}
                    <div
                        className={`w-2 rounded-full transition-all duration-100 ${beat === currentBeat && isActive
                                ? "bg-gradient-to-t from-purple-500 to-pink-500 h-8"
                                : beat === 0
                                    ? "bg-gray-400 h-6"
                                    : "bg-gray-600 h-4"
                            }`}
                    />
                    {/* Beat number */}
                    <span
                        className={`text-xs transition-colors ${beat === currentBeat && isActive ? "text-purple-400 font-bold" : "text-gray-500"
                            }`}
                    >
                        {beat + 1}
                    </span>
                </div>
            ))}
        </div>
    );
}

interface PulsatingRecordIndicatorProps {
    bpm: number;
    isRecording: boolean;
    className?: string;
}

export function PulsatingRecordIndicator({
    bpm,
    isRecording,
    className = "",
}: PulsatingRecordIndicatorProps) {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        if (!isRecording) {
            setPulse(false);
            return;
        }

        const quarterNoteInterval = (60 / bpm) * 1000;

        const interval = setInterval(() => {
            setPulse((prev) => !prev);
        }, quarterNoteInterval / 2);

        return () => clearInterval(interval);
    }, [bpm, isRecording]);

    if (!isRecording) return null;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className={`w-3 h-3 rounded-full bg-red-500 transition-opacity duration-150 ${pulse ? "opacity-100" : "opacity-50"
                    }`}
            />
            <span className="text-red-400 text-sm font-medium">Recording</span>
        </div>
    );
}
