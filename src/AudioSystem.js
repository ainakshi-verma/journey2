import { EMOTIONS } from './EmotionSystem.js';

export class AudioSystem {
    constructor(emotionSystem) {
        this.emotionSystem = emotionSystem;
        this.initialized = false;
        this.baseFreq = 220; // A3
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Volume
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Wind/Noise Generator
        this.noiseFilter = this.ctx.createBiquadFilter();
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.value = 400;

        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0.2;
        this.noiseGain.connect(this.masterGain);

        this.createWindNoise();

        // Chords/Drone Generator
        this.drones = [];
        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0.3;
        
        // Distortion for frustration
        this.distortion = this.ctx.createWaveShaper();
        this.distortion.curve = this.makeDistortionCurve(10);
        this.distortion.oversample = '4x';
        
        this.droneFilter = this.ctx.createBiquadFilter();
        this.droneFilter.type = 'lowpass';
        this.droneFilter.frequency.value = 800;

        this.droneGain.connect(this.droneFilter);
        this.droneFilter.connect(this.distortion);
        this.distortion.connect(this.masterGain);

        // Setup 3 oscillators for a chord
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.connect(this.droneGain);
            osc.start();
            this.drones.push(osc);
        }
        
        this.updateChords(EMOTIONS.HAPPY);
        
        console.log("Audio System initialized!");
    }

    createWindNoise() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.noiseSrc = this.ctx.createBufferSource();
        this.noiseSrc.buffer = buffer;
        this.noiseSrc.loop = true;
        this.noiseSrc.connect(this.noiseFilter);
        this.noiseFilter.connect(this.noiseGain);
        this.noiseSrc.start();
    }

    makeDistortionCurve(amount) {
        let k = typeof amount === 'number' ? amount : 50,
            n_samples = 44100,
            curve = new Float32Array(n_samples),
            deg = Math.PI / 180,
            i = 0,
            x;
        for ( ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
    }

    updateChords(emotion) {
        if (!this.initialized) return;

        let freqs = [220, 277.18, 329.63]; // A major
        let cutoff = 800;
        let distAmount = 0;
        let windCutoff = 400;
        
        switch(emotion) {
            case EMOTIONS.HAPPY:
                freqs = [261.63, 329.63, 392.00]; // C major
                cutoff = 1000;
                distAmount = 0;
                windCutoff = 300;
                break;
            case EMOTIONS.EXCITEMENT:
                freqs = [261.63, 392.00, 523.25]; // C5 power chord ish, uplifting
                cutoff = 2000;
                distAmount = 0;
                windCutoff = 800;
                break;
            case EMOTIONS.BOREDOM:
                freqs = [130.81, 130.81, 130.81]; // Low C Drone
                cutoff = 300;
                distAmount = 0;
                windCutoff = 200;
                break;
            case EMOTIONS.ANXIETY:
                freqs = [220, 261.63, 311.13]; // A dim
                cutoff = 600;
                distAmount = 2; // slight tension
                windCutoff = 600;
                break;
            case EMOTIONS.FRUSTRATION:
                freqs = [110, 116.54, 123.47]; // Dissonant cluster
                cutoff = 3000;
                distAmount = 50; // Heavy distortion
                windCutoff = 2000;
                break;
        }

        // Smooth transition params
        const time = this.ctx.currentTime + 1.5;
        
        this.drones[0].frequency.exponentialRampToValueAtTime(freqs[0], time);
        this.drones[1].frequency.exponentialRampToValueAtTime(freqs[1], time);
        this.drones[2].frequency.exponentialRampToValueAtTime(freqs[2], time);
        
        this.droneFilter.frequency.exponentialRampToValueAtTime(cutoff, time);
        this.noiseFilter.frequency.exponentialRampToValueAtTime(windCutoff, time);
        
        this.distortion.curve = this.makeDistortionCurve(distAmount);
        
        // Dynamic wind volume simulation
        this.noiseGain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.2, time);
    }

    update(delta) {
        if (!this.initialized) return;
        
        const currentEmotion = this.emotionSystem.currentState;
        if (this.lastEmotion !== currentEmotion) {
            this.updateChords(currentEmotion);
            this.lastEmotion = currentEmotion;
        }
    }
}
