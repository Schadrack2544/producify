"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "@/lib/audioUtils";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface AudioPlayerProps {
    audioUrl: string | null;
    title?: string;
    showWaveform?: boolean;
    className?: string;
}

export function AudioPlayer({
    audioUrl,
    title,
    showWaveform = true,
    className = "",
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!audioUrl) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.addEventListener("loadedmetadata", () => {
            setDuration(audio.duration);
            setIsLoaded(true);
        });

        audio.addEventListener("timeupdate", () => {
            setCurrentTime(audio.currentTime);
        });

        audio.addEventListener("ended", () => {
            setIsPlaying(false);
            setCurrentTime(0);
        });

        audio.addEventListener("error", () => {
            console.error("Error loading audio");
        });

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value: number[]) => {
        if (!audioRef.current) return;
        const newTime = value[0];
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (value: number[]) => {
        if (!audioRef.current) return;
        const newVolume = value[0];
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        if (isMuted) {
            audioRef.current.volume = volume || 1;
            setIsMuted(false);
        } else {
            audioRef.current.volume = 0;
            setIsMuted(true);
        }
    };

    if (!audioUrl) {
        return (
            <div className={`bg-white/5 rounded-lg p-6 ${className}`}>
                <p className="text-gray-400 text-center">No audio available</p>
            </div>
        );
    }

    return (
        <div className={`bg-white/5 rounded-lg p-6 ${className}`}>
            {title && (
                <h3 className="text-white font-semibold mb-4">{title}</h3>
            )}

            {/* Waveform */}
            {showWaveform && (
                <WaveformVisualizer
                    audioUrl={audioUrl}
                    isPlaying={isPlaying}
                    height={60}
                    barCount={40}
                    className="mb-4"
                />
            )}

            {/* Progress bar */}
            <div className="mb-4">
                <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                    disabled={!isLoaded}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                {/* Play button */}
                <Button
                    onClick={togglePlay}
                    size="lg"
                    disabled={!isLoaded}
                    className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12 p-0"
                >
                    {isPlaying ? (
                        <Pause className="h-5 w-5" />
                    ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                    )}
                </Button>

                {/* Volume control */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                        ) : (
                            <Volume2 className="h-4 w-4" />
                        )}
                    </Button>
                    <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-20"
                    />
                </div>
            </div>
        </div>
    );
}
