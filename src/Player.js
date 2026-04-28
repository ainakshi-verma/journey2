import * as THREE from 'three';
import { Companion } from './Companion.js';
import { EmotionTracker } from './EmotionTracker.js';

export class Player {
  constructor(scene, camera, input, environment, energySystem, emotionSystem) {
    this.scene = scene;
    this.camera = camera;
    this.input = input;
    this.environment = environment;
    this.energySystem = energySystem;
    this.emotionSystem = emotionSystem;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.onGround = false;
    this.isGliding = false;

    // Movement parameters
    this.speed = 12.0;
    this.jumpForce = 12.0;
    this.gravity = -40.0;
    this.terminalVelocity = -20.0; // Rigidly clamped terminal falling speed
    this.friction = 8.0; // Floaty feel

    this.playerHeight = 1.6;

    this.spawnPoint = new THREE.Vector3(0, 10, 0);

    this.createHumanoidMesh();
    
    this.raycaster = new THREE.Raycaster();

    // Companion disabled per user request
    // this.companion = new Companion(scene, this);
    this.tracker = new EmotionTracker(this.emotionSystem, this);
  }

  createHumanoidMesh() {
    this.mesh = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0c3aa, // Nude/neutral soft skin tone
      roughness: 0.8,
      metalness: 0.1
    });

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    this.head.position.y = 1.3;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), skinMat);
    this.torso.position.y = 0.65;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Arms
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), skinMat);
    this.armL.position.set(-0.4, 0.6, 0);
    this.armL.castShadow = true;
    this.mesh.add(this.armL);

    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), skinMat);
    this.armR.position.set(0.4, 0.6, 0);
    this.armR.castShadow = true;
    this.mesh.add(this.armR);

    // Legs
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), skinMat);
    this.legL.position.set(-0.15, -0.1, 0);
    this.legL.castShadow = true;
    this.mesh.add(this.legL);

    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), skinMat);
    this.legR.position.set(0.15, -0.1, 0);
    this.legR.castShadow = true;
    this.mesh.add(this.legR);

    // Eyes (simple neutral)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), eyeMat);
    eyeL.position.set(-0.12, 0.05, 0.26);
    this.head.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), eyeMat);
    eyeR.position.set(0.12, 0.05, 0.26);
    this.head.add(eyeR);

    // Player aura glow tied to emotions
    this.aura = new THREE.PointLight(0xffffff, 1.0, 10);
    this.aura.position.set(0, 1.0, 0);
    this.mesh.add(this.aura);

    this.mesh.position.copy(this.spawnPoint);
    this.scene.add(this.mesh);
  }

  update(delta) {
    // Disabled EmotionTracker dynamically hijacking the theme based on user request.
    // if (this.tracker) this.tracker.update(delta);
      
    this.applyInput(delta);
    this.applyPhysics(delta);
    this.updateRotation(delta);
    this.updateAnimations(delta);
    this.checkBounds();

    // if (this.companion && this.emotionSystem) {
    //     this.companion.update(delta, this.emotionSystem.getProfile(), this.emotionSystem.currentState);
    // }
  }

  applyInput(delta) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    this.direction.set(0, 0, 0);

    if (this.input.keys.forward) this.direction.add(forward);
    if (this.input.keys.backward) this.direction.sub(forward);
    if (this.input.keys.right) this.direction.add(right);
    if (this.input.keys.left) this.direction.sub(right);

    const isMoving = this.direction.lengthSq() > 0;
    if (isMoving) {
      this.direction.normalize();
    }

    const profile = this.emotionSystem ? this.emotionSystem.getProfile() : null;
    const speedMult = profile ? profile.speedMultiplier : 1.0;
    const frictionMult = profile ? profile.frictionMultiplier : 1.0;
    const glideCostMult = profile ? profile.glideEfficiency : 1.0;

    // Update Aura Glow
    if (this.aura && profile) {
        this.aura.intensity = THREE.MathUtils.lerp(this.aura.intensity, profile.glowIntensity, 2 * delta);
        this.aura.color.lerp(profile.skyColor, 2 * delta); // match emotion tone
    }

    const targetVelocityX = this.direction.x * this.speed * speedMult;
    const targetVelocityZ = this.direction.z * this.speed * speedMult;

    // Separate acceleration and deceleration for floatier feeling
    const accelRate = (this.onGround ? (isMoving ? 8.0 : 4.0) : 3.0) * frictionMult;
    this.velocity.x += (targetVelocityX - this.velocity.x) * accelRate * delta;
    this.velocity.z += (targetVelocityZ - this.velocity.z) * accelRate * delta;

    // Jumping scales natively with Scarf progress!
    if (this.input.keys.space && this.onGround) {
      const dynamicJumpForce = Math.min(22.0, 12.0 + (this.energySystem ? this.energySystem.scarfLength * 0.5 : 0));
      this.velocity.y = dynamicJumpForce;
      this.onGround = false;
      this.input.keys.space = false;
    }

    // Gliding
    this.isGliding = false;
    if (this.input.keys.shift && !this.onGround && this.velocity.y <= 2.0) {
        if (this.energySystem && this.energySystem.consumeEnergy(15 * glideCostMult * delta)) {
            this.isGliding = true;
            // Smooth float clamping
            this.velocity.y = THREE.MathUtils.lerp(this.velocity.y, -2.0, 5.0 * delta); 
        }
    }
  }

  applyPhysics(delta) {
    if (!this.isGliding) {
        this.velocity.y += this.gravity * delta;
        // Clamp terminal velocity to prevent tunneling through floor
        if (this.velocity.y < this.terminalVelocity) {
            this.velocity.y = this.terminalVelocity;
        }
    }

    const moveVector = this.velocity.clone().multiplyScalar(delta);
    this.mesh.position.add(moveVector);

    this.checkCollisions(delta);
  }

  checkCollisions(delta) {
    this.onGround = false;

    const rayOrigin = this.mesh.position.clone();
    rayOrigin.y += 1.0; 
    
    this.raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    const intersects = this.raycaster.intersectObjects(this.environment.getTerrainMeshes());
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const groundY = hit.point.y;
      
      const halfHeight = this.playerHeight / 2;
      
      // Prevent falling infinitely if we are near ground
      // We look slightly ahead and below
      if (this.mesh.position.y - halfHeight <= groundY + 0.1) {
        this.mesh.position.y = groundY + halfHeight;
        if (this.velocity.y < 0) {
            this.velocity.y = 0; // Prevent accumulating gravity
        }
        this.onGround = true;
        this.spawnPoint.copy(this.mesh.position); // Update safe point
      }
    }
  }

  checkBounds() {
    // Critical safety: Infinite falling respawn
    if (this.mesh.position.y < -50) {
        this.mesh.position.copy(this.spawnPoint);
        this.velocity.set(0,0,0);
        this.onGround = true;
        if (this.tracker) this.tracker.notifyFall();
    }
  }

  updateRotation(delta) {
    const horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    
    if (horizontalVelocity.lengthSq() > 0.1) {
      const targetLook = this.mesh.position.clone().add(horizontalVelocity);
      
      const currentQuaternion = this.mesh.quaternion.clone();
      this.mesh.lookAt(targetLook);
      const targetQuaternion = this.mesh.quaternion.clone();
      
      const rotationLerpFactor = 1.0 - Math.pow(0.001, delta);
      this.mesh.quaternion.copy(currentQuaternion);
      this.mesh.quaternion.slerp(targetQuaternion, rotationLerpFactor);
    }
  }

  updateAnimations(delta) {
      const time = performance.now() * 0.01;
      const speed = Math.sqrt(this.velocity.x**2 + this.velocity.z**2);
      
      if (this.isGliding) {
          // Spread arms out for gliding
          this.armL.rotation.z = THREE.MathUtils.lerp(this.armL.rotation.z, 1.5, 10 * delta);
          this.armR.rotation.z = THREE.MathUtils.lerp(this.armR.rotation.z, -1.5, 10 * delta);
          this.legL.rotation.x = THREE.MathUtils.lerp(this.legL.rotation.x, -0.5, 10 * delta);
          this.legR.rotation.x = THREE.MathUtils.lerp(this.legR.rotation.x, 0.2, 10 * delta);
          this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, -0.4, 10 * delta); // look down/ahead
      } else if (this.onGround && speed > 1.0) {
          // Running animation -> simple sine wave swinging
          this.armL.rotation.z = 0;
          this.armR.rotation.z = 0;
          this.armL.rotation.x = Math.sin(time) * 0.8;
          this.armR.rotation.x = -Math.sin(time) * 0.8;
          this.legL.rotation.x = -Math.sin(time) * 0.8;
          this.legR.rotation.x = Math.sin(time) * 0.8;
          this.head.rotation.x = 0;
      } else if (this.onGround) {
          // Idle breathing and emotional state
          // Subtly rotate head based on energy level
          const hasEnergy = this.energySystem ? this.energySystem.hasEnergy() : true;
          this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, hasEnergy ? 0.0 : 0.3, 2 * delta); // Head down if tired
          
          this.armL.rotation.x = THREE.MathUtils.lerp(this.armL.rotation.x, 0, 5 * delta);
          this.armR.rotation.x = THREE.MathUtils.lerp(this.armR.rotation.x, 0, 5 * delta);
          this.legL.rotation.x = THREE.MathUtils.lerp(this.legL.rotation.x, 0, 5 * delta);
          this.legR.rotation.x = THREE.MathUtils.lerp(this.legR.rotation.x, 0, 5 * delta);
          this.armL.rotation.z = THREE.MathUtils.lerp(this.armL.rotation.z, 0.1, 5 * delta);
          this.armR.rotation.z = THREE.MathUtils.lerp(this.armR.rotation.z, -0.1, 5 * delta);

          // Body breathing heave
          this.torso.position.y = 0.65 + Math.sin(time * 0.2) * 0.02;
      } else {
          // Jumping / Falling
          this.armL.rotation.x = THREE.MathUtils.lerp(this.armL.rotation.x, 2.0, 5 * delta);
          this.armR.rotation.x = THREE.MathUtils.lerp(this.armR.rotation.x, 2.0, 5 * delta);
          this.legL.rotation.x = THREE.MathUtils.lerp(this.legL.rotation.x, -0.2, 5 * delta);
          this.legR.rotation.x = THREE.MathUtils.lerp(this.legR.rotation.x, 0.2, 5 * delta);
      }
  }
}
