"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface RecordingResult {
    blob: Blob;
    url: string;
    duration: number;
}

export interface UseAudioRecorderOptions {
    backingTrackUrl?: string;
    backingTrackVolume?: number;
    loopBackingTrack?: boolean;
}

export interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    audioLevel: number;
    startRecording: (options?: UseAudioRecorderOptions) => Promise<void>;
    stopRecording: () => Promise<RecordingResult | null>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const backingTrackRef = useRef<HTMLAudioElement | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (backingTrackRef.current) {
                backingTrackRef.current.pause();
                backingTrackRef.current = null;
            }
        };
    }, []);

    const analyzeAudio = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1

        if (isRecording && !isPaused) {
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        }
    }, [isRecording, isPaused]);

    const startRecording = useCallback(async (options?: UseAudioRecorderOptions) => {
        try {
            setError(null);
            chunksRef.current = [];

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;

            // Set up audio analysis for visualization
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4'
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Collect data every 100ms

            // Start backing track if provided
            if (options?.backingTrackUrl) {
                const audio = new Audio(options.backingTrackUrl);
                audio.volume = options.backingTrackVolume ?? 0.7;
                audio.loop = options.loopBackingTrack ?? true;
                backingTrackRef.current = audio;
                audio.play().catch(err => {
                    console.warn('Could not play backing track:', err);
                });
            }

            // Start timer
            startTimeRef.current = Date.now();
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            setIsRecording(true);
            setIsPaused(false);

            // Start audio analysis
            analyzeAudio();

        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    }, [analyzeAudio]);

    const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || !streamRef.current) {
                resolve(null);
                return;
            }

            // Stop backing track
            if (backingTrackRef.current) {
                backingTrackRef.current.pause();
                backingTrackRef.current.currentTime = 0;
                backingTrackRef.current = null;
            }

            mediaRecorderRef.current.onstop = async () => {
                // Stop timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // Stop audio analysis
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }

                // Create blob from chunks
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);

                // Get duration
                const audio = new Audio(url);
                audio.addEventListener('loadedmetadata', () => {
                    const duration = audio.duration;
                    setIsRecording(false);
                    setIsPaused(false);
                    setAudioLevel(0);

                    resolve({
                        blob,
                        url,
                        duration: isFinite(duration) ? duration : recordingTime,
                    });
                });

                audio.addEventListener('error', () => {
                    setIsRecording(false);
                    setIsPaused(false);
                    setAudioLevel(0);
                    resolve({
                        blob,
                        url,
                        duration: recordingTime,
                    });
                });
            };

            // Stop recording
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            // Stop all tracks
            streamRef.current.getTracks().forEach(track => track.stop());

            // Close audio context
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        });
    }, [recordingTime]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            // Resume timer
            const pausedTime = recordingTime;
            startTimeRef.current = Date.now() - (pausedTime * 1000);
            timerRef.current = setInterval(() => {
                setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            // Resume audio analysis
            analyzeAudio();
        }
    }, [recordingTime, analyzeAudio]);

    return {
        isRecording,
        isPaused,
        recordingTime,
        audioLevel,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        error,
    };
}
