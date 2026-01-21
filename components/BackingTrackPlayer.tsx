"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, Volume2 } from "lucide-react";
import { BeatPlayer, generateBackingTrack, getDefaultBpm } from "@/lib/beatGenerator";
import { PartType } from "@/lib/useAudioStore";

interface BackingTrackPlayerProps {
    genre: string;
    partType: PartType;
    bpm: number;
    onBpmChange: (bpm: number) => void;
    onTrackGenerated?: (track: { blob: Blob; url: string; duration: number }) => void;
    className?: string;
}

export function BackingTrackPlayer({
    genre,
    partType,
    bpm,
    onBpmChange,
    onTrackGenerated,
    className = "",
}: BackingTrackPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [hasGenerated, setHasGenerated] = useState(false);

    const beatPlayerRef = useRef<BeatPlayer | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const generatedUrlRef = useRef<string | null>(null);

    // Create beat player on mount
    useEffect(() => {
        beatPlayerRef.current = new BeatPlayer();
        return () => {
            beatPlayerRef.current?.stop();
            if (generatedUrlRef.current) {
                URL.revokeObjectURL(generatedUrlRef.current);
            }
        };
    }, []);

    // Stop playing when genre or partType changes
    useEffect(() => {
        if (isPlaying && beatPlayerRef.current) {
            beatPlayerRef.current.stop();
            setIsPlaying(false);
            setCurrentBeat(0);
        }
        setHasGenerated(false);
    }, [genre, partType]);

    const togglePlay = useCallback(() => {
        if (!beatPlayerRef.current) return;

        if (isPlaying) {
            beatPlayerRef.current.stop();
            setIsPlaying(false);
            setCurrentBeat(0);
        } else {
            beatPlayerRef.current.start(genre, partType, bpm, (beat) => {
                setCurrentBeat(beat);
            });
            setIsPlaying(true);
        }
    }, [isPlaying, genre, partType, bpm]);

    const generateTrack = useCallback(async () => {
        setIsGenerating(true);
        try {
            // Stop current playback
            if (beatPlayerRef.current?.isActive()) {
                beatPlayerRef.current.stop();
                setIsPlaying(false);
            }

            // Revoke old URL
            if (generatedUrlRef.current) {
                URL.revokeObjectURL(generatedUrlRef.current);
            }

            // Generate 4 bars of backing track
            const result = await generateBackingTrack(genre, partType, bpm, 4);
            generatedUrlRef.current = result.url;
            setHasGenerated(true);

            if (onTrackGenerated) {
                onTrackGenerated({
                    blob: result.blob,
                    url: result.url,
                    duration: result.buffer.duration,
                });
            }
        } catch (error) {
            console.error("Error generating backing track:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [genre, partType, bpm, onTrackGenerated]);

    const handleBpmChange = (value: number[]) => {
        const newBpm = value[0];
        onBpmChange(newBpm);

        // If playing, restart with new BPM
        if (isPlaying && beatPlayerRef.current) {
            beatPlayerRef.current.stop();
            beatPlayerRef.current.start(genre, partType, newBpm, (beat) => {
                setCurrentBeat(beat);
            });
        }
    };

    // Beat visualization dots
    const beatDots = Array.from({ length: 16 }, (_, i) => i);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* BPM Control */}
            <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm w-12">BPM:</span>
                <Slider
                    value={[bpm]}
                    onValueChange={handleBpmChange}
                    min={60}
                    max={180}
                    step={1}
                    className="flex-1"
                />
                <Badge variant="outline" className="border-purple-500 text-purple-300 min-w-[60px] justify-center">
                    {bpm}
                </Badge>
            </div>

            {/* Beat Visualization */}
            <div className="flex items-center gap-1 justify-center py-2">
                {beatDots.map((i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-100 ${i === currentBeat && isPlaying
                                ? "bg-purple-500 scale-125"
                                : i % 4 === 0
                                    ? "bg-gray-500"
                                    : "bg-gray-700"
                            }`}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 justify-center">
                <Button
                    onClick={togglePlay}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                    {isPlaying ? (
                        <>
                            <Pause className="h-4 w-4 mr-2" />
                            Stop Preview
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4 mr-2" />
                            Preview Beat
                        </>
                    )}
                </Button>

                <Button
                    onClick={generateTrack}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {hasGenerated ? "Regenerate" : "Generate Track"}
                        </>
                    )}
                </Button>
            </div>

            {hasGenerated && (
                <div className="text-center">
                    <Badge className="bg-green-600 text-white">
                        ✓ Backing track ready for recording
                    </Badge>
                </div>
            )}
        </div>
    );
}
