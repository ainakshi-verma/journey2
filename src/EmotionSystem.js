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
        skyColor: new THREE.Color("#cc5500"), 
        fogColor: new THREE.Color("#aa4400"),
        domBgColor: '#200800',
        domTextColor: '#ffddcc',
        fogDensity: 0.008,
        lightColor: new THREE.Color("#ff8844"),
        lightIntensity: 0.6,
        speedMultiplier: 0.8,
        frictionMultiplier: 0.6,
        glideEfficiency: 1.5,
        cameraDistance: 7.0,
        glowIntensity: 0.5
    },
    [EMOTIONS.BOREDOM]: {
        skyColor: new THREE.Color("#888888"),
        fogColor: new THREE.Color("#777777"),
        domBgColor: '#1a1a1a',
        domTextColor: '#777777',
        fogDensity: 0.005,
        lightColor: new THREE.Color("#aaaaaa"),
        lightIntensity: 0.3,
        speedMultiplier: 0.9,
        frictionMultiplier: 0.9,
        glideEfficiency: 1.0,
        cameraDistance: 8.0,
        glowIntensity: 0.2
    },
    [EMOTIONS.EXCITEMENT]: {
        skyColor: new THREE.Color("#ffcc66"),
        fogColor: new THREE.Color("#9933ff"),
        domBgColor: '#1c0024',
        domTextColor: '#ffffff',
        fogDensity: 0.001,
        lightColor: new THREE.Color("#ffdd88"),
        lightIntensity: 1.0,
        speedMultiplier: 1.3,
        frictionMultiplier: 1.2,
        glideEfficiency: 0.5,
        cameraDistance: 5.5,
        glowIntensity: 3.0
    },
    [EMOTIONS.ANXIETY]: {
        skyColor: new THREE.Color("#0a0f2c"),
        fogColor: new THREE.Color("#050814"),
        domBgColor: '#000000',
        domTextColor: '#8888aa',
        fogDensity: 0.006, 
        lightColor: new THREE.Color("#3366ff"),
        lightIntensity: 0.4,
        speedMultiplier: 1.0,
        frictionMultiplier: 0.8,
        glideEfficiency: 1.2,
        cameraDistance: 3.5,
        glowIntensity: 0.8
    },
    [EMOTIONS.HAPPY]: {
        skyColor: new THREE.Color("#aeefff"), 
        fogColor: new THREE.Color("#c2f0c2"),
        domBgColor: '#0a1a24',
        domTextColor: '#ffffff',
        fogDensity: 0.002,
        lightColor: new THREE.Color("#ffffff"),
        lightIntensity: 0.9,
        speedMultiplier: 1.0,
        frictionMultiplier: 1.0,
        glideEfficiency: 1.0,
        cameraDistance: 6.0,
        glowIntensity: 1.5
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
