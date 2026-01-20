"use client";

import { formatDuration } from "@/lib/audioUtils";

interface RecordingTimerProps {
    time: number; // Time in seconds
    isRecording: boolean;
    className?: string;
}

export function RecordingTimer({
    time,
    isRecording,
    className = "",
}: RecordingTimerProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Recording indicator dot */}
            {isRecording && (
                <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                </div>
            )}

            {/* Timer display */}
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
                {formatDuration(time)}
            </div>

            {/* Recording text */}
            {isRecording && (
                <span className="text-red-400 text-sm font-medium uppercase tracking-wider animate-pulse">
                    Recording
                </span>
            )}
        </div>
    );
}
