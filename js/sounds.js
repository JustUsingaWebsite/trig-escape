// ------------------------------------------------------
// SOUND EFFECTS MANAGER
// ------------------------------------------------------

class SoundManager {
    constructor() {
      // Keep track of music state
      this.currentMusic = localStorage.getItem('currentMusic') || null;
      this.shouldResumeMusic = false;

      // Audio contexts
      this.audioContext = null;
      this.sounds = {};
      this.music = {};
      this.currentMusic = null;
      
      // Initialize on first user interaction
      this.initialized = false;
      
      // Volume levels
      this.sfxVolume = 0.4;
      this.musicVolume = 0.2;
    }
    
    // Initialize audio context (must be called on user interaction)
    async init() {
      if (this.initialized) return;

      try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // REQUIRED: Resume the audio context after creation
          await this.audioContext.resume(); 
          
          this.initialized = true;
          await this.loadSounds();
          console.log("Audio system initialized");
      } catch (e) {
          console.error("Audio init failed:", e);
      }
  }
    
    // Load all sound effects and music
    async loadSounds() {
      // Preload all sounds needed for both pages
      await Promise.all([
          this.loadSound('click', './sounds/click.wav'),
          this.loadSound('valueChange', './sounds/value.wav'),
          this.loadSound('lose', './sounds/loose.wav'),
          this.loadSound('win', './sounds/winner.wav'),
          this.loadMusic('menuMusic', './sounds/menumusic.wav'),
          this.loadMusic('gameMusic', './sounds/gamemusic.wav')
      ]);
      
      // Resume music if needed
      if (this.currentMusic) {
          this.playMusic(this.currentMusic, true);
      }
  }
    
    // Load a single sound effect
    async loadSound(name, url) {
      if (!this.initialized) return;
      
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.sounds[name] = audioBuffer;
        console.log(`Loaded sound: ${name}`);
      } catch (e) {
        console.error(`Error loading sound ${name}:`, e);
        // Create a fallback empty buffer (1 second of silence)
        this.sounds[name] = this.audioContext.createBuffer(2, this.audioContext.sampleRate, this.audioContext.sampleRate);
      }
    }
    
    // Load background music
    async loadMusic(name, url) {
      if (!this.initialized) return;
      
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.music[name] = {
          buffer: audioBuffer,
          source: null,
          gainNode: null
        };
        console.log(`Loaded music: ${name}`);
      } catch (e) {
        console.error(`Error loading music ${name}:`, e);
        // Create a fallback empty buffer (1 second of silence)
        this.music[name] = {
          buffer: this.audioContext.createBuffer(2, this.audioContext.sampleRate, this.audioContext.sampleRate),
          source: null,
          gainNode: null
        };
      }
    }
    
    // Play a sound effect once
    playSound(name) {
      // Update stored music state
      localStorage.setItem('currentMusic', name);

      if (!this.initialized || !this.sounds[name]) return;
      
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.sfxVolume;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Play the sound
        source.start(0);
      } catch (e) {
        console.error(`Error playing sound ${name}:`, e);
      }
    }
    
    // Play background music with looping
    playMusic(name, loop = true) {
      // Update stored music state
      localStorage.setItem('currentMusic', name);

      if (!this.initialized || !this.music[name]) return;
      
      // Stop current music if playing
      this.stopMusic();
      
      try {
        // Create new source
        const source = this.audioContext.createBufferSource();
        source.buffer = this.music[name].buffer;
        source.loop = loop;
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.musicVolume;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Store references
        this.music[name].source = source;
        this.music[name].gainNode = gainNode;
        this.currentMusic = name;
        
        // Play the music
        source.start(0);
      } catch (e) {
        console.error(`Error playing music ${name}:`, e);
      }
    }
    
    // Fade between music tracks
    crossfadeMusic(name, duration = 0.5) {
      // Update stored music state
      localStorage.setItem('currentMusic', name);

      if (!this.initialized || !this.music[name] || !this.currentMusic) {
        // If not initialized or no current music, just play directly
        this.playMusic(name);
        return;
      }
      
      try {
        // Create new source for the incoming music
        const newSource = this.audioContext.createBufferSource();
        newSource.buffer = this.music[name].buffer;
        newSource.loop = true;
        
        // Create gain nodes for fading
        const newGainNode = this.audioContext.createGain();
        newGainNode.gain.value = 0; // Start silent
        
        // Connect new source
        newSource.connect(newGainNode);
        newGainNode.connect(this.audioContext.destination);
        
        // Get current time
        const currentTime = this.audioContext.currentTime;
        
        // Fade out current music
        this.music[this.currentMusic].gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
        
        // Fade in new music
        newGainNode.gain.linearRampToValueAtTime(this.musicVolume, currentTime + duration);
        
        // Store references to new music
        this.music[name].source = newSource;
        this.music[name].gainNode = newGainNode;
        
        // Start new music
        newSource.start(0);
        
        // Schedule stopping of old music
        setTimeout(() => {
          if (this.music[this.currentMusic] && this.music[this.currentMusic].source) {
            this.music[this.currentMusic].source.stop();
          }
          this.currentMusic = name;
        }, duration * 1000);
      } catch (e) {
        console.error(`Error crossfading to music ${name}:`, e);
      }
    }
    
    // Stop currently playing music
    stopMusic() {
      if (!this.initialized || !this.currentMusic) return;
      
      try {
        if (this.music[this.currentMusic].source) {
          this.music[this.currentMusic].source.stop();
          this.music[this.currentMusic].source = null;
        }
      } catch (e) {
        console.error(`Error stopping music:`, e);
      }
    }
  }
  
  // Create singleton instance
  const soundManager = new SoundManager();
  
  // Export for use in other scripts
window.soundManager = window.soundManager || new SoundManager();