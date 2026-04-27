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
        skyColor: new THREE.Color("#cc4400"), // Burnt orange haze
        fogColor: new THREE.Color("#aa2200"), // Dusty red glow horizon
        domBgColor: '#2a0800', 
        domTextColor: '#ffddcc',
        fogDensity: 0.008,
        lightColor: new THREE.Color("#ff8855"), // Harsh, sharp light
        lightIntensity: 1.5,
        ambientColor: new THREE.Color("#221100"),
        ambientIntensity: 0.2, // Dark brown-black, heavy shadows
        speedMultiplier: 0.8,
        frictionMultiplier: 0.6,
        glideEfficiency: 1.5,
        cameraDistance: 7.0,
        glowIntensity: 0.5,
        terrainColor: new THREE.Color("#882211") // Cracked rust / dry clay
    },
    [EMOTIONS.BOREDOM]: {
        skyColor: new THREE.Color("#b0b0b0"), // Flat pale grey
        fogColor: new THREE.Color("#a0a0a0"), // Faded white-grey blur horizon
        domBgColor: '#1a1a1a', 
        domTextColor: '#bbbbbb',
        fogDensity: 0.005,
        lightColor: new THREE.Color("#ffffff"), // Washed out
        lightIntensity: 0.1,
        ambientColor: new THREE.Color("#dddddd"),
        ambientIntensity: 0.9, // Barely visible shadows
        speedMultiplier: 0.9,
        frictionMultiplier: 0.9,
        glideEfficiency: 1.0,
        cameraDistance: 8.0,
        glowIntensity: 0.1,
        terrainColor: new THREE.Color("#b4b4b4") // Dusty grey-beige plain
    },
    [EMOTIONS.EXCITEMENT]: {
        skyColor: new THREE.Color("#ba97d4"), // Deep purple dusk
        fogColor: new THREE.Color("#ffcc44"), // Warm glowing gold horizon
        domBgColor: '#2a0044', 
        domTextColor: '#ffffff',
        fogDensity: 0.003,
        lightColor: new THREE.Color("#ffdd88"), // Radiant, cinematic glow
        lightIntensity: 1.2,
        ambientColor: new THREE.Color("#d8a471"),
        ambientIntensity: 0.6, 
        speedMultiplier: 1.3,
        frictionMultiplier: 1.2,
        glideEfficiency: 0.5,
        cameraDistance: 5.5,
        glowIntensity: 4.0, // Soft golden sparkles
        terrainColor: new THREE.Color("#ffaa00") // Shimmering amber sand
    },
    [EMOTIONS.ANXIETY]: {
        skyColor: new THREE.Color("#050a14"), // Cold deep blue (almost black)
        fogColor: new THREE.Color("#111a33"), // Faint distant light horizon
        domBgColor: '#000000',
        domTextColor: '#8888aa',
        fogDensity: 0.012, 
        lightColor: new THREE.Color("#a3bff6"), // Very low, selective
        lightIntensity: 0.4,
        ambientColor: new THREE.Color("#020408"),
        ambientIntensity: 0.1, // Deep and consuming shadows
        speedMultiplier: 1.0,
        frictionMultiplier: 0.8,
        glideEfficiency: 1.2,
        cameraDistance: 3.5,
        glowIntensity: 0.8,
        terrainColor: new THREE.Color("#92b6ea") // Dark charcoal / muted blue-grey
    },
    [EMOTIONS.HAPPY]: {
        skyColor: new THREE.Color("#87CEEB"), // Clear soft blue
        fogColor: new THREE.Color("#ffeedd"), // Warm light yellow glow horizon
        domBgColor: '#002233', 
        domTextColor: '#ffffff',
        fogDensity: 0.002,
        lightColor: new THREE.Color("#ffffcc"), // Gentle, diffused sunlight
        lightIntensity: 1.0,
        ambientColor: new THREE.Color("#aaccff"),
        ambientIntensity: 0.7, // Soft reflections
        speedMultiplier: 1.0,
        frictionMultiplier: 1.0,
        glideEfficiency: 1.0,
        cameraDistance: 6.0,
        glowIntensity: 1.5, // Subtle sparkles
        terrainColor: new THREE.Color("#d3f28a") // Soft green mixed with golden sand
    }
};

export class EmotionSystem {
    constructor() {
        this.currentState = EMOTIONS.HAPPY;
        this.targetState = EMOTIONS.HAPPY;
        
        this.currentProfile = {
            skyColor: EMOTION_PROFILES[EMOTIONS.HAPPY].skyColor.clone(),
            fogColor: EMOTION_PROFILES[EMOTIONS.HAPPY].fogColor.clone(),
            fogDensity: EMOTION_PROFILES[EMOTIONS.HAPPY].fogDensity,
            lightColor: EMOTION_PROFILES[EMOTIONS.HAPPY].lightColor.clone(),
            lightIntensity: EMOTION_PROFILES[EMOTIONS.HAPPY].lightIntensity,
            ambientColor: EMOTION_PROFILES[EMOTIONS.HAPPY].ambientColor.clone(),
            ambientIntensity: EMOTION_PROFILES[EMOTIONS.HAPPY].ambientIntensity,
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
        this.currentProfile.ambientColor.lerp(target.ambientColor, lerpFactor);
        if (target.terrainColor) {
            this.currentProfile.terrainColor.lerp(target.terrainColor, lerpFactor);
        }

        // Lerp scalars
        this.currentProfile.fogDensity = THREE.MathUtils.lerp(this.currentProfile.fogDensity, target.fogDensity, lerpFactor);
        this.currentProfile.lightIntensity = THREE.MathUtils.lerp(this.currentProfile.lightIntensity, target.lightIntensity, lerpFactor);
        this.currentProfile.ambientIntensity = THREE.MathUtils.lerp(this.currentProfile.ambientIntensity, target.ambientIntensity, lerpFactor);
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
