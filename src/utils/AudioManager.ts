
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.7;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context on first user interaction (required by browsers)
      const resumeAudio = () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
      };
      
      document.addEventListener('click', resumeAudio);
      document.addEventListener('keydown', resumeAudio);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Create the most satisfying area completion sound using procedural audio
  playAreaComplete(areaSize: number = 50) {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Scale effects based on area size for more satisfaction with bigger areas
    const sizeMultiplier = Math.min(areaSize / 50, 3); // Cap at 3x
    const baseFreq = 220 + (sizeMultiplier * 50); // Higher pitch for bigger areas
    
    // Layer 1: Deep satisfying "thunk" (low frequency impact)
    const lowOsc = ctx.createOscillator();
    const lowGain = ctx.createGainNode();
    lowOsc.type = 'sine';
    lowOsc.frequency.setValueAtTime(baseFreq * 0.5, now);
    lowOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + 0.3);
    lowGain.gain.setValueAtTime(0.4 * this.volume * sizeMultiplier, now);
    lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    lowOsc.connect(lowGain).connect(ctx.destination);
    lowOsc.start(now);
    lowOsc.stop(now + 0.4);

    // Layer 2: Satisfying "ding" (achievement recognition)
    const midOsc = ctx.createOscillator();
    const midGain = ctx.createGainNode();
    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(baseFreq * 2, now + 0.05);
    midGain.gain.setValueAtTime(0.3 * this.volume, now + 0.05);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    midOsc.connect(midGain).connect(ctx.destination);
    midOsc.start(now + 0.05);
    midOsc.stop(now + 0.8);

    // Layer 3: Magical "sparkle" (high frequency magic)
    const highOsc = ctx.createOscillator();
    const highGain = ctx.createGainNode();
    highOsc.type = 'square';
    highOsc.frequency.setValueAtTime(baseFreq * 4, now + 0.1);
    highOsc.frequency.exponentialRampToValueAtTime(baseFreq * 6, now + 0.6);
    highGain.gain.setValueAtTime(0.15 * this.volume, now + 0.1);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    highOsc.connect(highGain).connect(ctx.destination);
    highOsc.start(now + 0.1);
    highOsc.stop(now + 0.6);

    // Layer 4: Ascending chord progression (dopamine hit)
    const chordFreqs = [baseFreq * 1.5, baseFreq * 1.875, baseFreq * 2.25, baseFreq * 3]; // Major 7th chord
    chordFreqs.forEach((freq, index) => {
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGainNode();
      const startTime = now + 0.15 + (index * 0.08);
      
      chordOsc.type = 'sawtooth';
      chordOsc.frequency.setValueAtTime(freq, startTime);
      chordGain.gain.setValueAtTime(0.1 * this.volume, startTime);
      chordGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      chordOsc.connect(chordGain).connect(ctx.destination);
      chordOsc.start(startTime);
      chordOsc.stop(startTime + 0.5);
    });

    // Layer 5: White noise burst for texture
    const bufferSize = ctx.sampleRate * 0.3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGainNode();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseGain.gain.setValueAtTime(0.05 * this.volume, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noiseSource.start(now + 0.05);
    noiseSource.stop(now + 0.3);
  }

  // Simple trail movement sound
  playTrailTick() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGainNode();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Enemy bounce sound for tension
  playEnemyBounce() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGainNode();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Level transition fanfare
  playLevelTransition() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Triumphant ascending melody
    const melody = [440, 550, 660, 770, 880]; // A major scale ascending
    melody.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGainNode();
      const startTime = now + (index * 0.1);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Game over sound
  playGameOver() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Descending dramatic sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGainNode();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 1.5);
    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  // UI button click
  playButtonClick() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGainNode();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  getVolume(): number {
    return this.volume;
  }
}

// Global instance
export const audioManager = new AudioManager();
