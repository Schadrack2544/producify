"use client";

/**
 * Audio Store - Simple state management for audio data between pages
 * Supports dynamic song parts (multiple verses, choruses, etc.)
 * 
 * Note: Due to browser limitations (Blobs cannot be serialized to localStorage),
 * audio data is stored in memory. For production persistence, consider:
 * - IndexedDB: Better for large binary data
 * - Service Worker + Cache API: For offline support
 * - Server-side session storage: For collaborative features
 * 
 * Current behavior: Data persists during the session but clears on page refresh.
 */

export type PartType = "verse" | "bridge" | "chorus" | "intro" | "outro";

export interface BackingTrack {
    blob: Blob | null;
    url: string | null;
    duration: number;
}

export interface SongPart {
    id: string;
    type: PartType;
    label: string;
    blob: Blob | null;
    url: string | null;
    duration: number;
    order: number;
    backingTrack: BackingTrack | null;
    beatGenerated?: boolean;
}

export interface StoredAudio {
    genre: string;
    tempo: number;
    parts: SongPart[];
    combinedAudio: {
        blob: Blob | null;
        url: string | null;
        duration: number;
    } | null;
    createdAt: string;
    analysisInProgress?: boolean;
    recordingPhaseComplete?: boolean;
}

// Module-level state for cross-component sharing
let audioStore: StoredAudio = {
    genre: "",
    tempo: 120,
    parts: [],
    combinedAudio: null,
    createdAt: new Date().toISOString(),
    analysisInProgress: false,
    recordingPhaseComplete: false,
};

// Listeners for state changes
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
    listeners.forEach(listener => listener());
}

export function subscribeToAudioStore(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getAudioStore(): StoredAudio {
    return audioStore;
}

export function setGenre(genre: string): void {
    audioStore = { ...audioStore, genre };
    notifyListeners();
}

export function addPart(type: PartType): SongPart {
    const existingOfType = audioStore.parts.filter(p => p.type === type).length;
    const label = existingOfType > 0
        ? `${type.charAt(0).toUpperCase() + type.slice(1)} ${existingOfType + 1}`
        : type.charAt(0).toUpperCase() + type.slice(1);

    const newPart: SongPart = {
        id: `${type}-${Date.now()}`,
        type,
        label,
        blob: null,
        url: null,
        duration: 0,
        order: audioStore.parts.length,
        backingTrack: null,
    };

    audioStore = {
        ...audioStore,
        parts: [...audioStore.parts, newPart],
    };
    notifyListeners();
    return newPart;
}

export function removePart(partId: string): void {
    const part = audioStore.parts.find(p => p.id === partId);
    if (part?.url) {
        URL.revokeObjectURL(part.url);
    }

    audioStore = {
        ...audioStore,
        parts: audioStore.parts.filter(p => p.id !== partId).map((p, i) => ({ ...p, order: i })),
    };
    notifyListeners();
}

export function updatePartRecording(
    partId: string,
    recording: { blob: Blob; url: string; duration: number }
): void {
    audioStore = {
        ...audioStore,
        parts: audioStore.parts.map(p =>
            p.id === partId
                ? { ...p, blob: recording.blob, url: recording.url, duration: recording.duration }
                : p
        ),
    };
    notifyListeners();
}

export function reorderParts(partId: string, newOrder: number): void {
    const parts = [...audioStore.parts];
    const currentIndex = parts.findIndex(p => p.id === partId);
    if (currentIndex === -1) return;

    const [part] = parts.splice(currentIndex, 1);
    parts.splice(newOrder, 0, part);

    audioStore = {
        ...audioStore,
        parts: parts.map((p, i) => ({ ...p, order: i })),
    };
    notifyListeners();
}

export function setCombinedAudio(audio: { blob: Blob; url: string; duration: number }): void {
    audioStore = {
        ...audioStore,
        combinedAudio: audio,
        createdAt: new Date().toISOString(),
    };
    notifyListeners();
}

export function setTempo(tempo: number): void {
    audioStore = { ...audioStore, tempo };
    notifyListeners();
}

export function updatePartBackingTrack(
    partId: string,
    backingTrack: { blob: Blob; url: string; duration: number }
): void {
    audioStore = {
        ...audioStore,
        parts: audioStore.parts.map(p =>
            p.id === partId
                ? { ...p, backingTrack }
                : p
        ),
    };
    notifyListeners();
}

export function clearAudioStore(): void {
    // Revoke old URLs to prevent memory leaks
    if (audioStore.combinedAudio?.url) {
        URL.revokeObjectURL(audioStore.combinedAudio.url);
    }
    audioStore.parts.forEach(part => {
        if (part.url) URL.revokeObjectURL(part.url);
        if (part.backingTrack?.url) URL.revokeObjectURL(part.backingTrack.url);
    });

    audioStore = {
        genre: "",
        tempo: 120,
        parts: [],
        combinedAudio: null,
        createdAt: new Date().toISOString(),
        analysisInProgress: false,
        recordingPhaseComplete: false,
    };
    notifyListeners();
}

export function setAnalysisInProgress(inProgress: boolean): void {
    audioStore = { ...audioStore, analysisInProgress: inProgress };
    notifyListeners();
}

export function setRecordingPhaseComplete(complete: boolean): void {
    audioStore = { ...audioStore, recordingPhaseComplete: complete };
    notifyListeners();
}

export function updatePartBeatGenerated(partId: string, generated: boolean): void {
    audioStore = {
        ...audioStore,
        parts: audioStore.parts.map(p =>
            p.id === partId
                ? { ...p, beatGenerated: generated }
                : p
        ),
    };
    notifyListeners();
}

export function hasAllRecordings(): boolean {
    return audioStore.parts.length > 0 && audioStore.parts.every(p => p.blob !== null);
}

export function getTotalRecordingDuration(): number {
    return audioStore.parts.reduce((acc, p) => acc + p.duration, 0);
}

export function getPartTypeColor(type: PartType): string {
    const colors: Record<PartType, string> = {
        verse: "bg-blue-500",
        bridge: "bg-yellow-500",
        chorus: "bg-pink-500",
        intro: "bg-green-500",
        outro: "bg-purple-500",
    };
    return colors[type];
}

export function getPartTypeBorderColor(type: PartType): string {
    const colors: Record<PartType, string> = {
        verse: "border-blue-500/30",
        bridge: "border-yellow-500/30",
        chorus: "border-pink-500/30",
        intro: "border-green-500/30",
        outro: "border-purple-500/30",
    };
    return colors[type];
}

export function getPartTypeBgColor(type: PartType): string {
    const colors: Record<PartType, string> = {
        verse: "bg-blue-500/10",
        bridge: "bg-yellow-500/10",
        chorus: "bg-pink-500/10",
        intro: "bg-green-500/10",
        outro: "bg-purple-500/10",
    };
    return colors[type];
}
