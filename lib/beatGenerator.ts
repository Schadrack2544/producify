/**
 * Beat Generator - Creates genre-specific drum patterns and backing tracks
 * Uses Web Audio API to synthesize all sounds client-side
 */

import {
    playKick,
    playSnare,
    playHiHat,
    playBass,
    playClap,
    playShaker,
    NOTE_FREQUENCIES,
    DrumSoundOptions
} from './drumSounds';
import { PartType } from './useAudioStore';

export interface BeatPattern {
    kick: number[];      // Array of beat positions (0-15 for 16th notes in one bar)
    snare: number[];
    hihat: number[];
    openHihat: number[];
    clap: number[];
    shaker: number[];
    bassNotes: { position: number; note: string; duration: number }[];
}

export interface GenreConfig {
    name: string;
    defaultBpm: number;
    patterns: Record<PartType, BeatPattern>;
    swing?: number; // 0-1, amount of swing
}

// Genre-specific beat patterns
const GENRE_CONFIGS: Record<string, GenreConfig> = {
    pop: {
        name: 'Pop',
        defaultBpm: 120,
        swing: 0,
        patterns: {
            intro: {
                kick: [0, 8],
                snare: [],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'C3', duration: 0.5 }]
            },
            verse: {
                kick: [0, 8],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'C3', duration: 0.25 },
                    { position: 8, note: 'G3', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 6, 8],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'A3', duration: 0.25 },
                    { position: 8, note: 'F3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [4, 12],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'C3', duration: 0.125 },
                    { position: 4, note: 'E3', duration: 0.125 },
                    { position: 8, note: 'G3', duration: 0.125 },
                    { position: 12, note: 'E3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 8],
                snare: [4],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'C3', duration: 0.5 }]
            }
        }
    },
    'r&b': {
        name: 'R&B',
        defaultBpm: 85,
        swing: 0.3,
        patterns: {
            intro: {
                kick: [0, 6],
                snare: [],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [2, 6, 10, 14],
                bassNotes: [{ position: 0, note: 'E3', duration: 0.5 }]
            },
            verse: {
                kick: [0, 6, 10],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'E3', duration: 0.25 },
                    { position: 6, note: 'D3', duration: 0.125 },
                    { position: 10, note: 'A3', duration: 0.125 }
                ]
            },
            bridge: {
                kick: [0, 8],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [4, 12],
                clap: [4, 12],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'F3', duration: 0.25 },
                    { position: 8, note: 'G3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 6, 8, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [4, 12],
                shaker: [2, 10],
                bassNotes: [
                    { position: 0, note: 'E3', duration: 0.125 },
                    { position: 4, note: 'G3', duration: 0.125 },
                    { position: 8, note: 'A3', duration: 0.125 },
                    { position: 12, note: 'B3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 8],
                snare: [4],
                hihat: [0, 4, 8, 12],
                openHihat: [12],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'E3', duration: 0.5 }]
            }
        }
    },
    afrobeat: {
        name: 'Afrobeat',
        defaultBpm: 105,
        swing: 0.2,
        patterns: {
            intro: {
                kick: [0, 6, 10],
                snare: [],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                bassNotes: [{ position: 0, note: 'G3', duration: 0.375 }]
            },
            verse: {
                kick: [0, 3, 6, 10, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [2, 10],
                clap: [],
                shaker: [1, 3, 5, 7, 9, 11, 13, 15],
                bassNotes: [
                    { position: 0, note: 'G3', duration: 0.1875 },
                    { position: 3, note: 'A3', duration: 0.1875 },
                    { position: 6, note: 'G3', duration: 0.25 },
                    { position: 10, note: 'D3', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 6, 8, 12],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [4, 12],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                bassNotes: [
                    { position: 0, note: 'A3', duration: 0.25 },
                    { position: 6, note: 'B3', duration: 0.125 },
                    { position: 8, note: 'G3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 3, 6, 8, 10, 14],
                snare: [4, 12],
                hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                openHihat: [4, 12],
                clap: [4, 12],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                bassNotes: [
                    { position: 0, note: 'G3', duration: 0.125 },
                    { position: 3, note: 'A3', duration: 0.125 },
                    { position: 6, note: 'B3', duration: 0.125 },
                    { position: 8, note: 'A3', duration: 0.125 },
                    { position: 10, note: 'G3', duration: 0.125 },
                    { position: 14, note: 'D3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 6, 10],
                snare: [4],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [0, 4, 8, 12],
                bassNotes: [{ position: 0, note: 'G3', duration: 0.5 }]
            }
        }
    },
    'hip-hop': {
        name: 'Hip-Hop',
        defaultBpm: 90,
        swing: 0.15,
        patterns: {
            intro: {
                kick: [0, 10],
                snare: [],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'E2', duration: 0.5 }]
            },
            verse: {
                kick: [0, 3, 8, 11],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'E2', duration: 0.1875 },
                    { position: 3, note: 'E2', duration: 0.3125 },
                    { position: 8, note: 'G2', duration: 0.1875 },
                    { position: 11, note: 'A2', duration: 0.3125 }
                ]
            },
            bridge: {
                kick: [0, 6, 8, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [4, 12],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'A2', duration: 0.25 },
                    { position: 8, note: 'G2', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 3, 8, 11, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [4, 12],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'E2', duration: 0.1875 },
                    { position: 3, note: 'G2', duration: 0.125 },
                    { position: 8, note: 'A2', duration: 0.1875 },
                    { position: 11, note: 'G2', duration: 0.125 },
                    { position: 14, note: 'E2', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 8],
                snare: [4],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'E2', duration: 0.5 }]
            }
        }
    },
    rock: {
        name: 'Rock',
        defaultBpm: 130,
        swing: 0,
        patterns: {
            intro: {
                kick: [0, 8],
                snare: [],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'E3', duration: 0.5 }]
            },
            verse: {
                kick: [0, 8],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'E3', duration: 0.25 },
                    { position: 8, note: 'A3', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'D3', duration: 0.25 },
                    { position: 8, note: 'E3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'E3', duration: 0.125 },
                    { position: 4, note: 'G3', duration: 0.125 },
                    { position: 8, note: 'A3', duration: 0.125 },
                    { position: 12, note: 'B3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 4, 8],
                snare: [4, 12],
                hihat: [0, 4, 8, 12],
                openHihat: [12],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'E3', duration: 0.5 }]
            }
        }
    },
    jazz: {
        name: 'Jazz',
        defaultBpm: 120,
        swing: 0.5,
        patterns: {
            intro: {
                kick: [0, 10],
                snare: [],
                hihat: [0, 3, 6, 9, 12, 15],
                openHihat: [],
                clap: [],
                shaker: [2, 6, 10, 14],
                bassNotes: [{ position: 0, note: 'D3', duration: 0.375 }]
            },
            verse: {
                kick: [0, 10],
                snare: [6, 14],
                hihat: [0, 3, 6, 9, 12, 15],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'D3', duration: 0.25 },
                    { position: 6, note: 'F3', duration: 0.25 },
                    { position: 10, note: 'A3', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 8],
                snare: [4, 10, 14],
                hihat: [0, 3, 6, 9, 12, 15],
                openHihat: [6, 12],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'G3', duration: 0.25 },
                    { position: 8, note: 'B3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 6, 10],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [4, 10],
                clap: [],
                shaker: [1, 5, 9, 13],
                bassNotes: [
                    { position: 0, note: 'D3', duration: 0.1875 },
                    { position: 4, note: 'F3', duration: 0.125 },
                    { position: 6, note: 'G3', duration: 0.25 },
                    { position: 10, note: 'A3', duration: 0.1875 }
                ]
            },
            outro: {
                kick: [0, 10],
                snare: [6],
                hihat: [0, 6, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'D3', duration: 0.5 }]
            }
        }
    },
    electronic: {
        name: 'Electronic',
        defaultBpm: 128,
        swing: 0,
        patterns: {
            intro: {
                kick: [0, 4, 8, 12],
                snare: [],
                hihat: [2, 6, 10, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'A2', duration: 0.5 }]
            },
            verse: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'A2', duration: 0.25 },
                    { position: 8, note: 'G2', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                openHihat: [],
                clap: [4, 12],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'F2', duration: 0.25 },
                    { position: 4, note: 'G2', duration: 0.125 },
                    { position: 8, note: 'A2', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                openHihat: [2, 6, 10, 14],
                clap: [4, 12],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'A2', duration: 0.125 },
                    { position: 4, note: 'C3', duration: 0.125 },
                    { position: 8, note: 'E3', duration: 0.125 },
                    { position: 12, note: 'D3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 4, 8, 12],
                snare: [],
                hihat: [2, 6, 10, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'A2', duration: 0.5 }]
            }
        }
    },
    reggae: {
        name: 'Reggae',
        defaultBpm: 75,
        swing: 0.1,
        patterns: {
            intro: {
                kick: [0, 10],
                snare: [],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'A2', duration: 0.5 }]
            },
            verse: {
                kick: [6, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'A2', duration: 0.375 },
                    { position: 6, note: 'G2', duration: 0.125 },
                    { position: 8, note: 'A2', duration: 0.375 }
                ]
            },
            bridge: {
                kick: [0, 6, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [4, 12],
                clap: [],
                shaker: [2, 6, 10, 14],
                bassNotes: [
                    { position: 0, note: 'D3', duration: 0.375 },
                    { position: 8, note: 'E3', duration: 0.375 }
                ]
            },
            chorus: {
                kick: [0, 6, 10, 14],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [4, 12],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'A2', duration: 0.25 },
                    { position: 6, note: 'C3', duration: 0.125 },
                    { position: 10, note: 'D3', duration: 0.25 }
                ]
            },
            outro: {
                kick: [6, 14],
                snare: [4],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'A2', duration: 0.5 }]
            }
        }
    },
    country: {
        name: 'Country',
        defaultBpm: 110,
        swing: 0.1,
        patterns: {
            intro: {
                kick: [0, 8],
                snare: [],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'G3', duration: 0.5 }]
            },
            verse: {
                kick: [0, 8],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'G3', duration: 0.25 },
                    { position: 4, note: 'C3', duration: 0.125 },
                    { position: 8, note: 'D3', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [6, 14],
                clap: [],
                shaker: [],
                bassNotes: [
                    { position: 0, note: 'C3', duration: 0.25 },
                    { position: 8, note: 'G3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [0, 2, 4, 6, 8, 10, 12, 14],
                openHihat: [],
                clap: [],
                shaker: [2, 6, 10, 14],
                bassNotes: [
                    { position: 0, note: 'G3', duration: 0.125 },
                    { position: 4, note: 'C3', duration: 0.125 },
                    { position: 8, note: 'D3', duration: 0.125 },
                    { position: 12, note: 'G3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 8],
                snare: [4, 12],
                hihat: [0, 4, 8, 12],
                openHihat: [],
                clap: [],
                shaker: [],
                bassNotes: [{ position: 0, note: 'G3', duration: 0.5 }]
            }
        }
    },
    folk: {
        name: 'Folk',
        defaultBpm: 100,
        swing: 0.15,
        patterns: {
            intro: {
                kick: [0, 8],
                snare: [],
                hihat: [],
                openHihat: [],
                clap: [],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                bassNotes: [{ position: 0, note: 'D3', duration: 0.5 }]
            },
            verse: {
                kick: [0, 8],
                snare: [4, 12],
                hihat: [],
                openHihat: [],
                clap: [],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                bassNotes: [
                    { position: 0, note: 'D3', duration: 0.25 },
                    { position: 8, note: 'A3', duration: 0.25 }
                ]
            },
            bridge: {
                kick: [0, 6, 8],
                snare: [4, 12],
                hihat: [],
                openHihat: [],
                clap: [4, 12],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                bassNotes: [
                    { position: 0, note: 'G3', duration: 0.25 },
                    { position: 8, note: 'A3', duration: 0.25 }
                ]
            },
            chorus: {
                kick: [0, 4, 8, 12],
                snare: [4, 12],
                hihat: [],
                openHihat: [],
                clap: [],
                shaker: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                bassNotes: [
                    { position: 0, note: 'D3', duration: 0.125 },
                    { position: 4, note: 'G3', duration: 0.125 },
                    { position: 8, note: 'A3', duration: 0.125 },
                    { position: 12, note: 'G3', duration: 0.125 }
                ]
            },
            outro: {
                kick: [0, 8],
                snare: [],
                hihat: [],
                openHihat: [],
                clap: [],
                shaker: [0, 4, 8, 12],
                bassNotes: [{ position: 0, note: 'D3', duration: 0.5 }]
            }
        }
    }
};

/**
 * Get configuration for a genre
 */
export function getGenreConfig(genre: string): GenreConfig {
    const normalizedGenre = genre.toLowerCase();
    return GENRE_CONFIGS[normalizedGenre] || GENRE_CONFIGS.pop;
}

/**
 * Get available genres
 */
export function getAvailableGenres(): string[] {
    return Object.keys(GENRE_CONFIGS);
}

/**
 * Get default BPM for a genre
 */
export function getDefaultBpm(genre: string): number {
    return getGenreConfig(genre).defaultBpm;
}

/**
 * Play a beat pattern in real-time for preview
 */
export class BeatPlayer {
    private context: AudioContext | null = null;
    private isPlaying = false;
    private intervalId: NodeJS.Timeout | null = null;
    private currentBeat = 0;
    private onBeatCallback: ((beat: number) => void) | null = null;

    constructor() { }

    start(
        genre: string,
        partType: PartType,
        bpm: number,
        onBeat?: (beat: number) => void
    ): void {
        if (this.isPlaying) this.stop();

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.context = new AudioContextClass();
        this.isPlaying = true;
        this.currentBeat = 0;
        this.onBeatCallback = onBeat || null;

        const config = getGenreConfig(genre);
        const pattern = config.patterns[partType];
        const swing = config.swing || 0;

        // Calculate interval for 16th notes
        const sixteenthInterval = (60 / bpm) * 1000 / 4;

        this.intervalId = setInterval(() => {
            if (!this.context || !this.isPlaying) return;

            const beat = this.currentBeat % 16;
            const time = this.context.currentTime;

            // Apply swing to off-beats
            let actualTime = time;
            if (beat % 2 === 1 && swing > 0) {
                actualTime += (sixteenthInterval / 1000) * swing * 0.5;
            }

            const options: DrumSoundOptions = { context: this.context, time: actualTime };

            // Play drum sounds
            if (pattern.kick.includes(beat)) playKick(options);
            if (pattern.snare.includes(beat)) playSnare(options);
            if (pattern.hihat.includes(beat)) playHiHat(options, false);
            if (pattern.openHihat.includes(beat)) playHiHat(options, true);
            if (pattern.clap.includes(beat)) playClap(options);
            if (pattern.shaker.includes(beat)) playShaker(options);

            // Play bass notes
            const bassNote = pattern.bassNotes.find(n => n.position === beat);
            if (bassNote) {
                const freq = NOTE_FREQUENCIES[bassNote.note] || 130.81;
                const noteDuration = (60 / bpm) * bassNote.duration * 4;
                playBass(options, freq, noteDuration);
            }

            // Callback for visualization
            if (this.onBeatCallback) {
                this.onBeatCallback(beat);
            }

            this.currentBeat++;
        }, sixteenthInterval);
    }

    stop(): void {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.context) {
            this.context.close();
            this.context = null;
        }
        this.currentBeat = 0;
    }

    isActive(): boolean {
        return this.isPlaying;
    }
}

/**
 * Generate a backing track as an AudioBuffer
 */
export async function generateBackingTrack(
    genre: string,
    partType: PartType,
    bpm: number,
    bars: number = 4
): Promise<{ buffer: AudioBuffer; blob: Blob; url: string }> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const offlineContext = new OfflineAudioContext(
        2, // stereo
        (60 / bpm) * 4 * bars * 44100, // duration in samples
        44100 // sample rate
    );

    const config = getGenreConfig(genre);
    const pattern = config.patterns[partType];
    const swing = config.swing || 0;

    const sixteenthDuration = (60 / bpm) / 4;

    // Schedule all sounds
    for (let bar = 0; bar < bars; bar++) {
        for (let beat = 0; beat < 16; beat++) {
            const baseTime = bar * (60 / bpm) * 4 + beat * sixteenthDuration;

            // Apply swing to off-beats
            let time = baseTime;
            if (beat % 2 === 1 && swing > 0) {
                time += sixteenthDuration * swing * 0.5;
            }

            const options: DrumSoundOptions = { context: offlineContext as any, time };

            // Note: For offline context, we need to connect to destination differently
            // We'll create simpler buffer-based sounds for offline rendering

            if (pattern.kick.includes(beat)) {
                scheduleOfflineKick(offlineContext, time, 0.8);
            }
            if (pattern.snare.includes(beat)) {
                scheduleOfflineSnare(offlineContext, time, 0.6);
            }
            if (pattern.hihat.includes(beat)) {
                scheduleOfflineHiHat(offlineContext, time, 0.3, false);
            }
            if (pattern.openHihat.includes(beat)) {
                scheduleOfflineHiHat(offlineContext, time, 0.3, true);
            }
            if (pattern.clap.includes(beat)) {
                scheduleOfflineClap(offlineContext, time, 0.5);
            }
            if (pattern.shaker.includes(beat)) {
                scheduleOfflineShaker(offlineContext, time, 0.2);
            }

            const bassNote = pattern.bassNotes.find(n => n.position === beat);
            if (bassNote) {
                const freq = NOTE_FREQUENCIES[bassNote.note] || 130.81;
                const noteDuration = (60 / bpm) * bassNote.duration * 4;
                scheduleOfflineBass(offlineContext, time, freq, noteDuration, 0.5);
            }
        }
    }

    // Render the audio
    const buffer = await offlineContext.startRendering();

    // Convert to WAV blob
    const wavBlob = audioBufferToWav(buffer);
    const url = URL.createObjectURL(wavBlob);

    return { buffer, blob: wavBlob, url };
}

// Helper functions for offline rendering
function scheduleOfflineKick(context: OfflineAudioContext, time: number, volume: number): void {
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.3);
}

function scheduleOfflineSnare(context: OfflineAudioContext, time: number, volume: number): void {
    // Noise component
    const bufferSize = context.sampleRate * 0.2;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const gain = context.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    noise.start(time);
    noise.stop(time + 0.2);

    // Tonal component
    const osc = context.createOscillator();
    const oscGain = context.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

    osc.connect(oscGain);
    oscGain.connect(context.destination);

    oscGain.gain.setValueAtTime(volume * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
}

function scheduleOfflineHiHat(context: OfflineAudioContext, time: number, volume: number, open: boolean): void {
    const duration = open ? 0.3 : 0.1;
    const bufferSize = context.sampleRate * duration;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = context.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.start(time);
    noise.stop(time + duration);
}

function scheduleOfflineClap(context: OfflineAudioContext, time: number, volume: number): void {
    for (let i = 0; i < 3; i++) {
        const bufferSize = context.sampleRate * 0.02;
        const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        for (let j = 0; j < bufferSize; j++) {
            noiseData[j] = Math.random() * 2 - 1;
        }

        const noise = context.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        const gain = context.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        const startTime = time + i * 0.015;
        gain.gain.setValueAtTime(volume * 0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        noise.start(startTime);
        noise.stop(startTime + 0.15);
    }
}

function scheduleOfflineShaker(context: OfflineAudioContext, time: number, volume: number): void {
    const bufferSize = context.sampleRate * 0.08;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = context.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.start(time);
    noise.stop(time + 0.08);
}

function scheduleOfflineBass(
    context: OfflineAudioContext,
    time: number,
    frequency: number,
    duration: number,
    volume: number
): void {
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, time);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.01);
    gain.gain.setValueAtTime(volume, time + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, time + duration);

    osc.start(time);
    osc.stop(time + duration);
}

/**
 * Convert AudioBuffer to WAV Blob (same as in audioUtils, but imported here for convenience)
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numOfChannels * bytesPerSample;

    const interleaved = interleaveChannels(buffer);
    const dataLength = interleaved.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    floatTo16BitPCM(view, 44, interleaved);

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function interleaveChannels(buffer: AudioBuffer): Float32Array {
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    const length = buffer.length * buffer.numberOfChannels;
    const interleaved = new Float32Array(length);

    let inputIndex = 0;
    let outputIndex = 0;

    while (inputIndex < buffer.length) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            interleaved[outputIndex++] = channels[channel][inputIndex];
        }
        inputIndex++;
    }

    return interleaved;
}

function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}
