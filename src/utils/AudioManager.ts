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
    const lowGain = ctx.createGain();
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
    const midGain = ctx.createGain();
    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(baseFreq * 2, now + 0.05);
    midGain.gain.setValueAtTime(0.3 * this.volume, now + 0.05);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    midOsc.connect(midGain).connect(ctx.destination);
    midOsc.start(now + 0.05);
    midOsc.stop(now + 0.8);

    // Layer 3: Magical "sparkle" (high frequency magic)
    const highOsc = ctx.createOscillator();
    const highGain = ctx.createGain();
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
      const chordGain = ctx.createGain();
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
    const noiseGain = ctx.createGain();
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
    const gain = ctx.createGain();
    
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
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Bomb collection sound - satisfying pickup
  playBombCollect() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Pleasant collection sound with rising pitch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Magnetic bomb sound - ominous humming
  playBombMagnetic() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Low frequency magnetic hum with modulation
    const osc = ctx.createOscillator();
    const modOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const modGain = ctx.createGain();
    
    osc.type = 'sawtooth';
    modOsc.type = 'sine';
    
    osc.frequency.setValueAtTime(80, now);
    modOsc.frequency.setValueAtTime(4, now); // 4Hz modulation
    modGain.gain.setValueAtTime(20, now); // Modulation depth
    
    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    
    modOsc.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(gain).connect(ctx.destination);
    
    modOsc.start(now);
    osc.start(now);
    modOsc.stop(now + 2);
    osc.stop(now + 2);
  }

  // Bomb explosion sound - dramatic boom
  playBombExplosion() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Layer 1: Deep bass thump
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(60, now);
    bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    bassGain.gain.setValueAtTime(0.4 * this.volume, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    bassOsc.connect(bassGain).connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.8);

    // Layer 2: Explosive burst (white noise)
    const bufferSize = ctx.sampleRate * 0.3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // Fade out
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    noiseGain.gain.setValueAtTime(0.2 * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + 0.3);

    // Layer 3: Satisfying explosion ding
    const dingOsc = ctx.createOscillator();
    const dingGain = ctx.createGain();
    dingOsc.type = 'triangle';
    dingOsc.frequency.setValueAtTime(800, now + 0.1);
    dingOsc.frequency.exponentialRampToValueAtTime(400, now + 0.6);
    dingGain.gain.setValueAtTime(0.15 * this.volume, now + 0.1);
    dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    dingOsc.connect(dingGain).connect(ctx.destination);
    dingOsc.start(now + 0.1);
    dingOsc.stop(now + 0.6);
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
      const gain = ctx.createGain();
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

  // Extra life sound - celebratory and rewarding
  playExtraLife() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Celebratory ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + (index * 0.08);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });

    // Add sparkle effect
    setTimeout(() => {
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      const sparkleTime = ctx.currentTime;
      
      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(2093, sparkleTime); // C7
      sparkleOsc.frequency.exponentialRampToValueAtTime(4186, sparkleTime + 0.2); // C8
      sparkleGain.gain.setValueAtTime(0.1 * this.volume, sparkleTime);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.3);
      
      sparkleOsc.connect(sparkleGain).connect(ctx.destination);
      sparkleOsc.start(sparkleTime);
      sparkleOsc.stop(sparkleTime + 0.3);
    }, 200);
  }

  // Life lost sound - dramatic but not game over
  playLifeLost() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Dramatic descending sound but with hope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, now); // E4
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.5); // A3
    osc.frequency.exponentialRampToValueAtTime(165, now + 1.0); // E3
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.2);

    // Add a subtle recovery tone
    setTimeout(() => {
      const recoveryOsc = ctx.createOscillator();
      const recoveryGain = ctx.createGain();
      const recoveryTime = ctx.currentTime;
      
      recoveryOsc.type = 'sine';
      recoveryOsc.frequency.setValueAtTime(220, recoveryTime);
      recoveryGain.gain.setValueAtTime(0.08 * this.volume, recoveryTime);
      recoveryGain.gain.exponentialRampToValueAtTime(0.001, recoveryTime + 0.3);
      
      recoveryOsc.connect(recoveryGain).connect(ctx.destination);
      recoveryOsc.start(recoveryTime);
      recoveryOsc.stop(recoveryTime + 0.3);
    }, 800);
  }

  // Game over sound
  playGameOver() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Descending dramatic sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
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
    const gain = ctx.createGain();
    
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