import * as THREE from 'three';

export class EnergySystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    
    this.maxEnergy = 100.0;
    this.currentEnergy = 100.0;
    
    this.scarfLength = 2; // initial segments

    this.rechargeRate = 20.0; // Energy per second while grounded
    
    // Create Scarf visual
    this.scarfSegments = [];
    this.scarfMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3366, 
        side: THREE.DoubleSide 
    });
    
    this.buildScarf();
  }

  buildScarf() {
    // Clear old scarf
    this.scarfSegments.forEach(s => this.scene.remove(s));
    this.scarfSegments = [];

    // Base geometry for a segment
    const segmentGeo = new THREE.PlaneGeometry(0.3, 0.4);
    
    for(let i = 0; i < this.scarfLength; i++) {
        const mesh = new THREE.Mesh(segmentGeo, this.scarfMaterial);
        // Start far away
        mesh.position.set(0, -100, 0); 
        this.scene.add(mesh);
        this.scarfSegments.push(mesh);
    }
  }

  increaseCapacity() {
      this.maxEnergy += 20;
      this.currentEnergy = this.maxEnergy; // fully restore
      this.scarfLength += 1;
      this.buildScarf();
  }

  consumeEnergy(amount) {
      if (this.currentEnergy >= amount) {
          this.currentEnergy -= amount;
          return true;
      }
      return false;
  }

  hasEnergy() {
      return this.currentEnergy > 0;
  }

  update(delta, isGrounded) {
      // Recharge
      if (isGrounded && this.currentEnergy < this.maxEnergy) {
          this.currentEnergy += this.rechargeRate * delta;
          if (this.currentEnergy > this.maxEnergy) {
              this.currentEnergy = this.maxEnergy;
          }
      }

      this.updateScarfPhysics(delta);
  }

  updateScarfPhysics(delta) {
      // If player mesh isn't ready
      if (!this.player || !this.player.mesh) return;

      // The neck position
      const neckOffset = new THREE.Vector3(0, 0.8, -0.2); // relative to player center
      neckOffset.applyQuaternion(this.player.mesh.quaternion);
      
      let targetPos = this.player.mesh.position.clone().add(neckOffset);

      const profile = this.player.emotionSystem ? this.player.emotionSystem.getProfile() : null;
      if (profile) {
          // Base color is pinkish, blend subtly with emotional tone
          const emotionTone = profile.skyColor.clone().lerp(new THREE.Color(0xff3366), 0.5);
          this.scarfMaterial.color.lerp(emotionTone, 2 * delta);
      }

      for (let i = 0; i < this.scarfSegments.length; i++) {
          const segment = this.scarfSegments[i];
          
          // Lerp current segment towards target
          // The further down the chain, the looser it is
          const followSpeed = 15 - (i * 1.5);
          const safeSpeed = Math.max(2, followSpeed);
          
          // Give it some floaty waving motion using time
          const time = performance.now() * 0.005;
          const waveX = Math.sin(time + i) * 0.1;
          const waveY = Math.cos(time * 0.8 + i) * 0.1;
          
          let idealPos = targetPos.clone().add(new THREE.Vector3(waveX, waveY, 0));
          
          segment.position.lerp(idealPos, safeSpeed * delta);
          
          // Make it look at the previous target
          if (i === 0) {
              segment.lookAt(this.player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)));
          } else {
              segment.lookAt(targetPos);
          }

          // Next segment targets this segment but slightly behind/down
          const backward = new THREE.Vector3(0, -0.1, 0.2); // slight gravity pull
          backward.applyQuaternion(this.player.mesh.quaternion);
          
          targetPos = segment.position.clone().add(backward);
      }
  }
}
