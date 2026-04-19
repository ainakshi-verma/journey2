import * as THREE from 'three';
import { Environment } from './Environment.js';
import { Player } from './Player.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js';
import { InputController } from './InputController.js';
import { EnergySystem } from './EnergySystem.js';
import { CollectibleSystem } from './CollectibleSystem.js';
import { EmotionSystem } from './EmotionSystem.js';
import { HurdleSystem } from './HurdleSystem.js';

export class App {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.container = document.getElementById('app');
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Infrastructure
    this.input = new InputController();
    this.environment = new Environment(this.scene);
    
    // Systems
    this.emotionSystem = new EmotionSystem();
    this.energySystem = new EnergySystem(this.scene, null); 
    
    this.player = new Player(this.scene, this.camera, this.input, this.environment, this.energySystem, this.emotionSystem);
    this.energySystem.player = this.player;
    
    this.thirdPersonCamera = new ThirdPersonCamera(this.camera, this.player, this.input, this.environment, this.emotionSystem);
    this.collectibleSystem = new CollectibleSystem(this.scene, this.environment, this.energySystem);
    this.hurdleSystem = new HurdleSystem(this.scene, this.environment);

    // Pass dynamic light/fog logic back to environment securely
    this.environment.linkEmotionSystem(this.emotionSystem);

    // Resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    
    // UI Overlay / Pointer Lock
    this.instructions = document.getElementById('instructions');
    
    // We now control start centrally through main.js 'Begin Journey' 
    // but keep instructions functional for pausing/unpausing in-game
    this.instructions.addEventListener('click', () => this.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.renderer.domElement) {
        this.instructions.classList.add('hidden');
        this.input.isLocked = true;
      } else {
        this.instructions.classList.remove('hidden');
        this.input.isLocked = false;
      }
    });

    // Fallback explicit ESC interaction guaranteeing pausing regardless of pointerlock state glitches
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (document.pointerLockElement) {
                document.exitPointerLock(); // Escapes the lock (which triggers pointerlockchange implicitly)
            } else {
                // If it was already unlocked but overlay is glitching, force it open
                this.instructions.classList.remove('hidden');
                this.input.isLocked = false;
            }
        }
    });

    // Loop
    this.clock = new THREE.Clock();
    this.animLoop = this.render.bind(this);
    this.renderer.setAnimationLoop(this.animLoop);
  }

  requestPointerLock() {
      this.renderer.domElement.requestPointerLock();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.1); 
    
    // Ambient UI updates (always run)
    this.emotionSystem.update(delta);
    this.environment.update(delta);

    if (this.input.isLocked) {
      this.player.update(delta);
      this.thirdPersonCamera.update(delta);
      this.energySystem.update(delta, this.player.onGround);
      this.collectibleSystem.update(delta, this.player.mesh.position, this.emotionSystem);
      this.hurdleSystem.update(delta, this.player, this.emotionSystem);
    } else {
        // Slow rotation to showcase the background altering colors dramatically
        this.camera.position.x = Math.sin(performance.now() * 0.0001) * 15;
        this.camera.position.z = Math.cos(performance.now() * 0.0001) * 15;
        this.camera.position.y = 10;
        this.camera.lookAt(0, 5, 0);
    }
    
    this.updateDebugPanel();

    this.renderer.render(this.scene, this.camera);
  }

  updateDebugPanel() {
      const dbgPos = document.getElementById('dbg-pos');
      if (dbgPos) {
          const p = this.player.mesh.position;
          dbgPos.innerText = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
          document.getElementById('dbg-vel').innerText = this.player.velocity.y.toFixed(2);
          document.getElementById('dbg-ground').innerText = this.player.onGround;
          document.getElementById('dbg-emotion').innerText = this.emotionSystem.currentState;
          document.getElementById('dbg-scarf').innerText = this.energySystem ? this.energySystem.scarfLength : 0;
          document.getElementById('dbg-jump').innerText = (12.0 + (this.energySystem ? this.energySystem.scarfLength * 0.5 : 0)).toFixed(1);
      }
  }
}
