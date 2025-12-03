
export const decodeBase64Audio = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = window.atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini 2.5 TTS returns raw PCM 16-bit 24kHz Mono audio.
  // Standard decodeAudioData fails because there are no headers (WAV/MP3).
  // We must manually convert PCM data to an AudioBuffer.
  const sampleRate = 24000;
  const numChannels = 1;
  const pcm16 = new Int16Array(bytes.buffer);
  
  const buffer = audioContext.createBuffer(numChannels, pcm16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < pcm16.length; i++) {
    // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
    channelData[i] = pcm16[i] / 32768.0;
  }
  
  return buffer;
};

export const audioBufferToBlob = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const length = buffer.length * numChannels * 2; // 16-bit = 2 bytes per sample
  const view = new DataView(new ArrayBuffer(44 + length));
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  const blockAlign = numChannels * 2;
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, length, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Clip sample
      const s = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit integer
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const stitchAudioBuffers = (buffers: AudioBuffer[], audioContext: AudioContext): AudioBuffer => {
  if (buffers.length === 0) return audioContext.createBuffer(1, 1, 24000);

  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const numberOfChannels = buffers[0].numberOfChannels;
  const sampleRate = buffers[0].sampleRate;

  const result = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

  let offset = 0;
  for (const buff of buffers) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const resultData = result.getChannelData(channel);
      const buffData = buff.getChannelData(channel);
      resultData.set(buffData, offset);
    }
    offset += buff.length;
  }

  return result;
};

/**
 * Processes an audio buffer to apply Pitch (detune) and Speed (playbackRate) changes.
 * Uses OfflineAudioContext to render the effect "faster" than real-time.
 */
export const processAudioBuffer = async (
    originalBuffer: AudioBuffer, 
    pitchSemitones: number, 
    speedRate: number,
    volume: number = 1.0
): Promise<AudioBuffer> => {
    // If no changes, return original
    if (pitchSemitones === 0 && speedRate === 1 && volume === 1.0) return originalBuffer;

    const sampleRate = originalBuffer.sampleRate;
    // Estimate new duration (approximate)
    // If we speed up (1.5x), duration is shorter (original / 1.5)
    // If we slow down (0.5x), duration is longer
    const newLength = Math.ceil(originalBuffer.length / speedRate);

    const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        newLength,
        sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    // Apply Speed (affects pitch if not corrected, but here we assume tape-style or independent if Detune used)
    source.playbackRate.value = speedRate;
    
    // Apply Pitch (Detune in cents). 
    // Note: Detune in Web Audio applies a resampling effect which changes speed too. 
    // To pitch shift without speed change requires FFT/Phase Vocoder which is heavy.
    // For this lightweight implementation, we accept the "Tape Effect" where they interact,
    // OR we simply apply them as requested. Detune + PlaybackRate are standard.
    // Detune of 100 cents = 1 semitone.
    source.detune.value = pitchSemitones * 100;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    source.start(0);

    return await offlineCtx.startRendering();
};
