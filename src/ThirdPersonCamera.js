import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera, player, input, environment, emotionSystem) {
    this.camera = camera;
    this.player = player;
    this.input = input;
    this.environment = environment;
    this.emotionSystem = emotionSystem;

    this.currentPosition = new THREE.Vector3();
    this.currentLookat = new THREE.Vector3();

    // Camera parameters
    this.idealOffset = new THREE.Vector3(-0.5, 2.5, -6);
    this.idealLookat = new THREE.Vector3(0, 1.5, 2);
    
    // Spherical coordinates for mouse orbit
    this.targetSpherical = new THREE.Spherical(7, Math.PI / 2.5, Math.PI);
    this.currentSpherical = new THREE.Spherical(7, Math.PI / 2.5, Math.PI);
    
    // Sensitivity
    this.mouseSensitivity = 0.003;

    // Cache variables for calculations
    this.tempVec = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
  }

  update(delta) {
    // Process input to rotate camera orbit
    const { x: movementX, y: movementY } = this.input.consumeMouseMovement();

    // Rotate target orbit
    this.targetSpherical.theta -= movementX * this.mouseSensitivity;
    this.targetSpherical.phi -= movementY * this.mouseSensitivity;
    
    // Clamp vertical rotation (-30 to +60 degrees from horizontal)
    // 0 is looking straight down, PI is looking straight up. PI/2 is horizontal.
    const minPhi = Math.PI / 6; // +60 deg pitch (looking down)
    const maxPhi = Math.PI * 2 / 3; // -30 deg pitch (looking slightly up)
    this.targetSpherical.phi = Math.max(minPhi, Math.min(maxPhi, this.targetSpherical.phi));

    // Smoothly damp current spherical towards target spherical for cinematic mouse movement
    const sphericalLerpFactor = 0.1;
    
    // Emotion-driven camera radius
    if (this.emotionSystem) {
        const profile = this.emotionSystem.getProfile();
        this.targetSpherical.radius = THREE.MathUtils.lerp(this.targetSpherical.radius, profile.cameraDistance, 0.1);
    }
    this.currentSpherical.radius = THREE.MathUtils.lerp(this.currentSpherical.radius, this.targetSpherical.radius, sphericalLerpFactor);

    this.currentSpherical.phi = THREE.MathUtils.lerp(this.currentSpherical.phi, this.targetSpherical.phi, sphericalLerpFactor);
    this.currentSpherical.theta = THREE.MathUtils.lerp(this.currentSpherical.theta, this.targetSpherical.theta, sphericalLerpFactor);

    // Calculate ideal camera position based on relative smoothed spherical coordinates
    const playerPos = this.player.mesh.position.clone();
    // Maintain a fixed offset distance (radius is fixed in Spherical, altered only by collision locally)
    const targetOffset = new THREE.Vector3().setFromSpherical(this.currentSpherical);

    let idealPosition = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0)).add(targetOffset);

    // Collision check: dynamically adjusts distance if obstacle detected to prevent clipping
    this.handleCollision(playerPos, idealPosition);

    const idealLookat = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));

    // Smooth position following (damping player movement)
    const followLerpFactor = 0.1;
    
    // If it's the first frame or distance is huge, snap to prevent flying
    if (this.currentPosition.distanceTo(idealPosition) > 20) {
        this.currentPosition.copy(idealPosition);
        this.currentLookat.copy(idealLookat);
    } else {
        this.currentPosition.lerp(idealPosition, followLerpFactor);
        this.currentLookat.lerp(idealLookat, followLerpFactor);
    }

    // Apply exact transforms
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookat);
  }

  handleCollision(playerPos, idealPosition) {
     const startPos = new THREE.Vector3().copy(playerPos).add(new THREE.Vector3(0, 1.5, 0));
     const dir = new THREE.Vector3().subVectors(idealPosition, startPos);
     const dist = dir.length();
     dir.normalize();

     this.raycaster.set(startPos, dir);
     // Raycast against terrain
     const intersects = this.raycaster.intersectObjects(this.environment.getTerrainMeshes());
     
     if (intersects.length > 0 && intersects[0].distance < dist) {
         // Push camera inward
         const safeDistance = intersects[0].distance - 0.2; // 0.2 buffer
         idealPosition.copy(startPos).add(dir.multiplyScalar(safeDistance));
     }
  }

  // Gets the forward direction of the camera (Y locked to 0) to align player movement
  getForwardVector() {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.camera.quaternion);
      forward.y = 0;
      forward.normalize();
      return forward;
  }
}
