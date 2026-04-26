import * as THREE from 'three';
import { EMOTIONS } from './EmotionSystem.js';

export class Companion {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        this.mesh = new THREE.Group();
        
        // The core glowing orb
        const geo = new THREE.SphereGeometry(0.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.core = new THREE.Mesh(geo, mat);
        this.mesh.add(this.core);
        
        this.light = new THREE.PointLight(0xffffff, 1.0, 10);
        this.mesh.add(this.light);
        
        this.scene.add(this.mesh);
        
        // Orbit parameters
        this.angle = 0;
        this.targetDistance = 2.0;
        this.targetHeight = 2.0;
        this.orbitSpeed = 1.0;
        
        // Behaviors
        this.currentEmotion = EMOTIONS.HAPPY;
    }

    update(delta, emotionProfile, emotionName) {
        this.currentEmotion = emotionName;
        
        // Adjust style based on emotion
        let tDist = 2.0;
        let tHeight = 2.0;
        let oSpeed = 2.0;
        let intensity = 1.0;
        let scale = 1.0;
        
        switch(emotionName) {
            case EMOTIONS.EXCITEMENT:
                intensity = 3.0; scale = 1.5; oSpeed = 4.0; tDist = 1.5;
                break;
            case EMOTIONS.FRUSTRATION:
                intensity = 0.3; scale = 0.5; oSpeed = 0.5; tDist = 3.5; tHeight = 0.5;
                break;
            case EMOTIONS.HAPPY:
                intensity = 1.5; scale = 1.2; oSpeed = 3.0; tDist = 2.5; tHeight = 2.5;
                // Playful bob
                tHeight += Math.sin(performance.now() * 0.005) * 1.0;
                break;
            case EMOTIONS.ANXIETY:
                intensity = 0.5; scale = 0.7; oSpeed = 1.0; tDist = 1.0; tHeight = 1.0;
                break;
            case EMOTIONS.BOREDOM:
                intensity = 0.0; scale = 0.1; oSpeed = 0.0; tHeight = 0.1; tDist = 1.0;
                break;
        }

        // Smooth transition parameters
        this.targetDistance = THREE.MathUtils.lerp(this.targetDistance, tDist, 2 * delta);
        this.targetHeight = THREE.MathUtils.lerp(this.targetHeight, tHeight, 2 * delta);
        this.orbitSpeed = THREE.MathUtils.lerp(this.orbitSpeed, oSpeed, 2 * delta);
        
        this.light.intensity = THREE.MathUtils.lerp(this.light.intensity, intensity, 2 * delta);
        this.light.color.lerp(emotionProfile.skyColor, 2 * delta);
        this.core.material.color.lerp(emotionProfile.skyColor, 2 * delta);
        
        const currentScale = this.core.scale.x;
        const s = THREE.MathUtils.lerp(currentScale, scale, 2 * delta);
        this.core.scale.set(s,s,s);

        // Update position
        this.angle += this.orbitSpeed * delta;
        
        // Calculate offset
        const xOffset = Math.cos(this.angle) * this.targetDistance;
        const zOffset = Math.sin(this.angle) * this.targetDistance;
        
        // Target world position
        const targetPos = this.player.mesh.position.clone();
        targetPos.x += xOffset;
        targetPos.z += zOffset;
        targetPos.y += this.targetHeight;
        
        // Smooth follow
        this.mesh.position.lerp(targetPos, 5 * delta);
    }
}
