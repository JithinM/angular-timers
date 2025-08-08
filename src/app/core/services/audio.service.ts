import { Injectable, signal } from '@angular/core';

export interface AudioSettings {
  enabled: boolean;
  volume: number;
  timerCompleteSound: string;
  buttonClickSound: string;
  lapSound: string;
  tickSound: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private readonly _settings = signal<AudioSettings>({
    enabled: true,
    volume: 0.7,
    timerCompleteSound: 'bell',
    buttonClickSound: 'click',
    lapSound: 'beep',
    tickSound: 'tick'
  });

  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  readonly settings = this._settings.asReadonly();

  constructor() {
    if (this.isBrowser()) {
      this.initializeAudioContext();
      this.loadSounds();
    }
  }

  // Check if running in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
  }

  // Initialize Web Audio API context
  private initializeAudioContext(): void {
    if (!this.isBrowser()) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Load predefined sound effects
  private loadSounds(): void {
    // In a real application, these would be audio files
    // For demo purposes, we'll generate tones programmatically
    const soundDefinitions = [
      { name: 'bell', frequency: 800, duration: 1000 },
      { name: 'beep', frequency: 1000, duration: 200 },
      { name: 'click', frequency: 2000, duration: 50 },
      { name: 'tick', frequency: 1500, duration: 30 },
      { name: 'alarm', frequency: 440, duration: 2000 },
      { name: 'success', frequency: 523.25, duration: 500 }, // C5 note
      { name: 'warning', frequency: 349.23, duration: 300 }  // F4 note
    ];

    soundDefinitions.forEach(sound => {
      this.generateTone(sound.name, sound.frequency, sound.duration);
    });
  }

  // Generate synthetic tones for demo purposes
  private generateTone(name: string, frequency: number, duration: number): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * (duration / 1000);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      // Create a simple sine wave with fade out
      const fadeOut = Math.max(0, 1 - (time / (duration / 1000)));
      channelData[i] = Math.sin(2 * Math.PI * frequency * time) * fadeOut * 0.3;
    }

    this.audioBuffers.set(name, buffer);
  }

  // Play a sound by name
  playSound(soundName: string): void {
    if (!this._settings().enabled || !this.audioContext) return;

    const buffer = this.audioBuffers.get(soundName);
    if (!buffer) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this._settings().volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  // Specific sound methods for timer events
  playTimerComplete(): void {
    this.playSound(this._settings().timerCompleteSound);
  }

  playButtonClick(): void {
    this.playSound(this._settings().buttonClickSound);
  }

  playLapSound(): void {
    this.playSound(this._settings().lapSound);
  }

  playTickSound(): void {
    this.playSound(this._settings().tickSound);
  }

  playAlarm(): void {
    this.playSound('alarm');
  }

  playSuccess(): void {
    this.playSound('success');
  }

  playWarning(): void {
    this.playSound('warning');
  }

  // Play a sequence of beeps for countdown
  playCountdownBeeps(count: number): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playSound('beep');
      }, i * 300);
    }
  }

  // Update audio settings
  updateSettings(settings: Partial<AudioSettings>): void {
    this._settings.update(current => ({
      ...current,
      ...settings
    }));
  }

  // Enable/disable all sounds
  toggleAudio(): void {
    this._settings.update(settings => ({
      ...settings,
      enabled: !settings.enabled
    }));
  }

  // Set volume (0-1)
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this._settings.update(settings => ({
      ...settings,
      volume: clampedVolume
    }));
  }

  // Check if audio is supported
  isAudioSupported(): boolean {
    return !!this.audioContext;
  }

  // Resume audio context (required after user interaction in some browsers)
  resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Force audio context resume for background playback
  async forceResumeAudioContext(): Promise<boolean> {
    if (!this.audioContext) return false;
    
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return this.audioContext.state === 'running';
    } catch (error) {
      console.warn('Failed to resume audio context:', error);
      return false;
    }
  }

  // Enhanced play sound method that handles background context
  async playSoundWithResume(soundName: string): Promise<void> {
    if (!this._settings().enabled) return;

    // Try to resume audio context first
    await this.forceResumeAudioContext();
    
    // If audio context is still not running, try alternative methods
    if (!this.audioContext || this.audioContext.state !== 'running') {
      this.playFallbackSound(soundName);
      return;
    }

    this.playSound(soundName);
  }

  // Fallback sound method using HTML5 Audio for background tabs
  private playFallbackSound(soundName: string): void {
    if (!this.isBrowser()) return;

    try {
      // Create a simple beep using HTML5 Audio with data URL
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Get frequency based on sound name
      const frequencies: { [key: string]: number } = {
        'bell': 800,
        'beep': 1000,
        'click': 2000,
        'tick': 1500,
        'alarm': 440,
        'success': 523.25,
        'warning': 349.23
      };

      oscillator.frequency.value = frequencies[soundName] || 800;
      oscillator.type = 'sine';
      
      gainNode.gain.value = this._settings().volume * 0.3;
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Fallback sound failed:', error);
    }
  }

  // Enhanced timer complete method for background support
  async playTimerCompleteWithNotification(): Promise<void> {
    // Try to play sound
    await this.playSoundWithResume(this._settings().timerCompleteSound);
    
    // Also trigger browser notification sound if available
    if (this.isBrowser() && 'Notification' in window && Notification.permission === 'granted') {
      // Create a silent notification that triggers system sound
      new Notification('Timer Complete', {
        body: 'Your timer has finished!',
        icon: '/assets/icons/icon-192x192.png',
        silent: false, // This allows system notification sound
        tag: 'timer-complete-sound'
      });
    }
  }

  // Create a custom notification sound pattern
  playNotificationPattern(pattern: number[]): void {
    if (!this._settings().enabled) return;

    pattern.forEach((frequency, index) => {
      setTimeout(() => {
        this.generateAndPlayTone(frequency, 200);
      }, index * 250);
    });
  }

  private generateAndPlayTone(frequency: number, duration: number): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.value = this._settings().volume * 0.3;
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error generating tone:', error);
    }
  }

  // Predefined notification patterns
  readonly notificationPatterns = {
    success: [523, 659, 784], // C-E-G major chord
    warning: [349, 415, 494], // F-G#-B diminished
    error: [220, 220, 220],   // Repeated low A
    completion: [440, 554, 659, 880] // A-C#-E-A arpeggio
  };

  // Play pattern by name
  playPattern(patternName: keyof typeof this.notificationPatterns): void {
    const pattern = this.notificationPatterns[patternName];
    if (pattern) {
      this.playNotificationPattern(pattern);
    }
  }
}