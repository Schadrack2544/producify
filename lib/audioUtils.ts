/**
 * Audio Utilities for mozart
 * Handles audio processing, combining, and WAV encoding
 */

export interface AudioData {
    blob: Blob;
    buffer: AudioBuffer | null;
    duration: number;
    url: string;
}

/**
 * Creates an AudioContext (handles browser prefixes)
 */
export function getAudioContext(): AudioContext {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    return new AudioContextClass();
}

/**
 * Decodes an audio Blob into an AudioBuffer
 */
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
    const audioContext = getAudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();
    return audioBuffer;
}

/**
 * Concatenates multiple AudioBuffers into a single AudioBuffer
 */
export async function concatenateAudioBuffers(buffers: AudioBuffer[]): Promise<AudioBuffer> {
    if (buffers.length === 0) {
        throw new Error('No audio buffers to concatenate');
    }

    const audioContext = getAudioContext();

    // Calculate total length
    const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);

    // Use the sample rate and channel count of the first buffer
    const sampleRate = buffers[0].sampleRate;
    const numberOfChannels = Math.max(...buffers.map(b => b.numberOfChannels));

    // Create the combined buffer
    const combinedBuffer = audioContext.createBuffer(
        numberOfChannels,
        totalLength,
        sampleRate
    );

    // Copy each buffer into the combined buffer
    let offset = 0;
    for (const buffer of buffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = combinedBuffer.getChannelData(channel);
            // If buffer has fewer channels, use the first channel
            const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
            channelData.set(buffer.getChannelData(sourceChannel), offset);
        }
        offset += buffer.length;
    }

    audioContext.close();
    return combinedBuffer;
}

/**
 * Converts an AudioBuffer to a WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numOfChannels * bytesPerSample;

    // Interleave channels
    const interleaved = interleaveChannels(buffer);

    // Create the WAV file
    const dataLength = interleaved.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    floatTo16BitPCM(view, 44, interleaved);

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Interleaves audio channels from an AudioBuffer
 */
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

/**
 * Writes a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Converts Float32Array to 16-bit PCM
 */
function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

/**
 * Formats duration in seconds to mm:ss string
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Gets the duration of an audio Blob in seconds
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        });
        audio.addEventListener('error', reject);
        audio.src = URL.createObjectURL(blob);
    });
}

/**
 * Creates a download link and triggers download
 */
export function downloadAudio(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
