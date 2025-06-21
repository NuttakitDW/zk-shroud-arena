/**
 * Sound Effects Manager for ZK Shroud Arena
 * Handles all game audio and sound effects
 */

export type SoundType = 
  | 'coin_collect'
  | 'damage_taken'
  | 'elimination'
  | 'zone_warning'
  | 'zone_shrink'
  | 'health_low'
  | 'grace_period_warning'
  | 'game_start'
  | 'game_over'
  | 'level_up'
  | 'achievement';

interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  fadeIn?: number;
  fadeOut?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  coin_collect: {
    frequency: 800,
    duration: 0.15,
    volume: 0.15,
    type: 'sine',
    fadeOut: 0.05
  },
  damage_taken: {
    frequency: 200,
    duration: 0.2,
    volume: 0.2,
    type: 'sawtooth'
  },
  elimination: {
    frequency: 100,
    duration: 0.5,
    volume: 0.3,
    type: 'square',
    fadeOut: 0.3
  },
  zone_warning: {
    frequency: 440,
    duration: 0.3,
    volume: 0.25,
    type: 'triangle'
  },
  zone_shrink: {
    frequency: 300,
    duration: 1.0,
    volume: 0.2,
    type: 'sine',
    fadeIn: 0.2,
    fadeOut: 0.5
  },
  health_low: {
    frequency: 350,
    duration: 0.4,
    volume: 0.2,
    type: 'sine'
  },
  grace_period_warning: {
    frequency: 600,
    duration: 0.2,
    volume: 0.2,
    type: 'square'
  },
  game_start: {
    frequency: 523.25,
    duration: 0.5,
    volume: 0.3,
    type: 'sine',
    fadeIn: 0.1
  },
  game_over: {
    frequency: 130.81,
    duration: 1.0,
    volume: 0.3,
    type: 'square',
    fadeOut: 0.7
  },
  level_up: {
    frequency: 659.25,
    duration: 0.3,
    volume: 0.2,
    type: 'sine'
  },
  achievement: {
    frequency: 880,
    duration: 0.4,
    volume: 0.25,
    type: 'sine',
    fadeOut: 0.2
  }
};

export class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 1.0;
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Initialize on first user interaction to comply with browser policies
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        this.initialize();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
      };
      window.addEventListener('click', initAudio);
      window.addEventListener('keydown', initAudio);
    }
  }

  /**
   * Initialize the audio context
   */
  private initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
      console.log('🔊 Sound effects initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Play a sound effect
   */
  public play(soundType: SoundType): void {
    if (!this.enabled || !this.initialized || !this.audioContext) {
      this.initialize();
      if (!this.audioContext) return;
    }

    const config = SOUND_CONFIGS[soundType];
    if (!config) {
      console.warn(`Unknown sound type: ${soundType}`);
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = config.type;
      oscillator.frequency.value = config.frequency;
      
      const volume = config.volume * this.masterVolume;
      const currentTime = this.audioContext.currentTime;
      
      // Apply fade in
      if (config.fadeIn) {
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + config.fadeIn);
      } else {
        gainNode.gain.setValueAtTime(volume, currentTime);
      }
      
      // Apply fade out
      if (config.fadeOut) {
        const fadeOutTime = currentTime + config.duration - config.fadeOut;
        gainNode.gain.setValueAtTime(volume, fadeOutTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + config.duration);
      }
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + config.duration);
    } catch (error) {
      console.error(`Error playing sound ${soundType}:`, error);
    }
  }

  /**
   * Play a sequence of sounds
   */
  public playSequence(sounds: { type: SoundType; delay: number }[]): void {
    sounds.forEach(({ type, delay }) => {
      setTimeout(() => this.play(type), delay);
    });
  }

  /**
   * Play a custom tone
   */
  public playTone(frequency: number, duration: number, volume: number = 0.2): void {
    if (!this.enabled || !this.initialized || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume * this.masterVolume;
      
      const currentTime = this.audioContext.currentTime;
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
    } catch (error) {
      console.error('Error playing tone:', error);
    }
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable sound effects
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if sound is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Play damage sound with intensity based on damage amount
   */
  public playDamageSound(damageAmount: number, maxHealth: number): void {
    const damagePercent = damageAmount / maxHealth;
    
    if (damagePercent > 0.3) {
      // Critical damage
      this.playSequence([
        { type: 'damage_taken', delay: 0 },
        { type: 'health_low', delay: 100 }
      ]);
    } else {
      // Normal damage
      this.play('damage_taken');
    }
  }

  /**
   * Play zone warning sequence
   */
  public playZoneWarningSequence(secondsRemaining: number): void {
    if (secondsRemaining <= 5) {
      // Critical warning
      this.playSequence([
        { type: 'zone_warning', delay: 0 },
        { type: 'zone_warning', delay: 200 },
        { type: 'zone_warning', delay: 400 }
      ]);
    } else if (secondsRemaining <= 30) {
      // Standard warning
      this.play('zone_warning');
    }
  }

  /**
   * Play coin collection with pitch based on amount
   */
  public playCoinCollect(amount: number): void {
    if (amount >= 50) {
      // Big reward
      this.playSequence([
        { type: 'coin_collect', delay: 0 },
        { type: 'level_up', delay: 100 }
      ]);
    } else {
      // Normal coin collect
      this.play('coin_collect');
    }
  }
}

// Singleton instance
export const soundEffects = new SoundEffectsManager();