import * as THREE from 'three';

export const EMOTIONS = {
    HAPPY: 'HAPPY',
    FRUSTRATION: 'FRUSTRATION',
    BOREDOM: 'BOREDOM',
    EXCITEMENT: 'EXCITEMENT',
    ANXIETY: 'ANXIETY'
};

const EMOTION_PROFILES = {
    [EMOTIONS.FRUSTRATION]: {
        skyColor: new THREE.Color("#ff5500"), // Hazy burnt orange
        fogColor: new THREE.Color("#cc3300"),
        domBgColor: '#331100', // Matches burnt orange theme
        domTextColor: '#ffddcc',
        fogDensity: 0.008,
        lightColor: new THREE.Color("#ff8844"),
        lightIntensity: 0.6,
        speedMultiplier: 0.8,
        frictionMultiplier: 0.6,
        glideEfficiency: 1.5,
        cameraDistance: 7.0,
        glowIntensity: 0.5,
        terrainColor: new THREE.Color("#883311") // Cracked rust
    },
    [EMOTIONS.BOREDOM]: {
        skyColor: new THREE.Color("#aaaaaa"), // Flat grey overcast
        fogColor: new THREE.Color("#888888"),
        domBgColor: '#222222', 
        domTextColor: '#bbbbbb',
        fogDensity: 0.005,
        lightColor: new THREE.Color("#cccccc"),
        lightIntensity: 0.3,
        speedMultiplier: 0.9,
        frictionMultiplier: 0.9,
        glideEfficiency: 1.0,
        cameraDistance: 8.0,
        glowIntensity: 0.2,
        terrainColor: new THREE.Color("#666666") // Featureless grey plain
    },
    [EMOTIONS.EXCITEMENT]: {
        skyColor: new THREE.Color("#ffaa00"), // Golden amber
        fogColor: new THREE.Color("#4b0082"), // Deep purple dusk
        domBgColor: '#2a0044', // Deep purple
        domTextColor: '#ffffff',
        fogDensity: 0.0015,
        lightColor: new THREE.Color("#ffdd88"),
        lightIntensity: 1.0,
        speedMultiplier: 1.3,
        frictionMultiplier: 1.2,
        glideEfficiency: 0.5,
        cameraDistance: 5.5,
        glowIntensity: 3.0,
        terrainColor: new THREE.Color("#ffcc00") // Glowing amber dunes
    },
    [EMOTIONS.ANXIETY]: {
        skyColor: new THREE.Color("#000a1a"), // Cold near-black blue
        fogColor: new THREE.Color("#00050d"),
        domBgColor: '#000000',
        domTextColor: '#8888aa',
        fogDensity: 0.008, 
        lightColor: new THREE.Color("#3366ff"),
        lightIntensity: 0.3,
        speedMultiplier: 1.0,
        frictionMultiplier: 0.8,
        glideEfficiency: 1.2,
        cameraDistance: 3.5,
        glowIntensity: 0.8,
        terrainColor: new THREE.Color("#111111") // Dark charcoal textures
    },
    [EMOTIONS.HAPPY]: {
        skyColor: new THREE.Color("#87CEEB"), // Clear pale blue
        fogColor: new THREE.Color("#aaddff"),
        domBgColor: '#002233', // Deep blue tint
        domTextColor: '#ffffff',
        fogDensity: 0.002,
        lightColor: new THREE.Color("#ffffff"),
        lightIntensity: 0.9,
        speedMultiplier: 1.0,
        frictionMultiplier: 1.0,
        glideEfficiency: 1.0,
        cameraDistance: 6.0,
        glowIntensity: 1.5,
        terrainColor: new THREE.Color("#b8c878") // Soft green-gold sand
    }
};

export class EmotionSystem {
    constructor() {
        this.currentState = EMOTIONS.HAPPY;
        this.targetState = EMOTIONS.HAPPY;
        
        // Deep copy the initial state for current tracking
        this.currentProfile = {
            skyColor: EMOTION_PROFILES[EMOTIONS.HAPPY].skyColor.clone(),
            fogColor: EMOTION_PROFILES[EMOTIONS.HAPPY].fogColor.clone(),
            fogDensity: EMOTION_PROFILES[EMOTIONS.HAPPY].fogDensity,
            lightColor: EMOTION_PROFILES[EMOTIONS.HAPPY].lightColor.clone(),
            lightIntensity: EMOTION_PROFILES[EMOTIONS.HAPPY].lightIntensity,
            speedMultiplier: EMOTION_PROFILES[EMOTIONS.HAPPY].speedMultiplier,
            frictionMultiplier: EMOTION_PROFILES[EMOTIONS.HAPPY].frictionMultiplier,
            glideEfficiency: EMOTION_PROFILES[EMOTIONS.HAPPY].glideEfficiency,
            cameraDistance: EMOTION_PROFILES[EMOTIONS.HAPPY].cameraDistance,
            glowIntensity: EMOTION_PROFILES[EMOTIONS.HAPPY].glowIntensity,
            terrainColor: EMOTION_PROFILES[EMOTIONS.HAPPY].terrainColor.clone()
        };
    }

    setEmotion(emotion) {
        if (EMOTION_PROFILES[emotion] && this.targetState !== emotion) {
            this.targetState = emotion;
            this.currentState = emotion;
        }
    }

    update(delta) {
        const target = EMOTION_PROFILES[this.targetState];
        const lerpFactor = 0.02; // Rigid smoothing instead of delta/transitionSpeed mathematically jumping

        // Lerp colors natively
        this.currentProfile.skyColor.lerp(target.skyColor, lerpFactor);
        this.currentProfile.fogColor.lerp(target.fogColor, lerpFactor);
        this.currentProfile.lightColor.lerp(target.lightColor, lerpFactor);
        if (target.terrainColor) {
            this.currentProfile.terrainColor.lerp(target.terrainColor, lerpFactor);
        }

        // Lerp scalars
        this.currentProfile.fogDensity = THREE.MathUtils.lerp(this.currentProfile.fogDensity, target.fogDensity, lerpFactor);
        this.currentProfile.lightIntensity = THREE.MathUtils.lerp(this.currentProfile.lightIntensity, target.lightIntensity, lerpFactor);
        this.currentProfile.speedMultiplier = THREE.MathUtils.lerp(this.currentProfile.speedMultiplier, target.speedMultiplier, lerpFactor);
        this.currentProfile.frictionMultiplier = THREE.MathUtils.lerp(this.currentProfile.frictionMultiplier, target.frictionMultiplier, lerpFactor);
        this.currentProfile.glideEfficiency = THREE.MathUtils.lerp(this.currentProfile.glideEfficiency, target.glideEfficiency, lerpFactor);
        this.currentProfile.cameraDistance = THREE.MathUtils.lerp(this.currentProfile.cameraDistance, target.cameraDistance, lerpFactor);
        this.currentProfile.glowIntensity = THREE.MathUtils.lerp(this.currentProfile.glowIntensity, target.glowIntensity, lerpFactor);

        this.bindToDOM();
    }

    bindToDOM() {
        const root = document.documentElement;
        root.style.setProperty('--glow-color', '#' + this.currentProfile.skyColor.getHexString());
        
        const target = EMOTION_PROFILES[this.targetState];
        root.style.setProperty('--bg-primary', target.domBgColor);
        root.style.setProperty('--text-primary', target.domTextColor);
    }

    getProfile() {
        return this.currentProfile;
    }
}
