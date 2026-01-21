/**
 * Drum Sounds - Synthesize drum sounds using Web Audio API
 * All sounds are generated programmatically (no external files needed)
 */

export interface DrumSoundOptions {
    context: AudioContext;
    time: number;
    volume?: number;
}

/**
 * Generates a kick drum sound using sine wave with pitch envelope
 */
export function playKick({ context, time, volume = 0.8 }: DrumSoundOptions): void {
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    // Start with higher frequency and quickly drop
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);

    // Quick attack, medium decay
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.3);
}

/**
 * Generates a snare sound using noise burst with resonant filter
 */
export function playSnare({ context, time, volume = 0.6 }: DrumSoundOptions): void {
    // Noise component
    const bufferSize = context.sampleRate * 0.2;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    // Band-pass filter for snare character
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const noiseGain = context.createGain();
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(context.destination);

    noiseGain.gain.setValueAtTime(volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.start(time);
    noise.stop(time + 0.2);

    // Tonal component (body of snare)
    const osc = context.createOscillator();
    const oscGain = context.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

    osc.connect(oscGain);
    oscGain.connect(context.destination);

    oscGain.gain.setValueAtTime(volume * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
}

/**
 * Generates a hi-hat sound using filtered noise
 */
export function playHiHat({ context, time, volume = 0.3 }: DrumSoundOptions, open = false): void {
    const bufferSize = context.sampleRate * (open ? 0.3 : 0.1);
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    // High-pass filter for hi-hat brightness
    const highPass = context.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 7000;

    const gain = context.createGain();
    noise.connect(highPass);
    highPass.connect(gain);
    gain.connect(context.destination);

    const duration = open ? 0.3 : 0.1;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    noise.start(time);
    noise.stop(time + duration);
}

/**
 * Generates a bass note using oscillator
 */
export function playBass(
    { context, time, volume = 0.5 }: DrumSoundOptions,
    frequency: number,
    duration: number
): void {
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, time);

    // Low-pass filter for smoother bass
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
 * Generates a clap sound
 */
export function playClap({ context, time, volume = 0.5 }: DrumSoundOptions): void {
    // Multiple noise bursts for clap texture
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
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        noise.start(startTime);
        noise.stop(startTime + 0.15);
    }
}

/**
 * Generates a percussion/shaker sound
 */
export function playShaker({ context, time, volume = 0.2 }: DrumSoundOptions): void {
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
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    noise.start(time);
    noise.stop(time + 0.08);
}

// Musical note frequencies (A2 to A4)
export const NOTE_FREQUENCIES: Record<string, number> = {
    'A2': 110.00,
    'B2': 123.47,
    'C3': 130.81,
    'D3': 146.83,
    'E3': 164.81,
    'F3': 174.61,
    'G3': 196.00,
    'A3': 220.00,
    'B3': 246.94,
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
};
