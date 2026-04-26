import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    
    // Warm desert sky setup (pale orange/blue mix)
    this.scene.background = new THREE.Color(0xfac090); // Warm sandy sky
    this.scene.fog = new THREE.FogExp2(0xfac090, 0.003); // Lighter fog for distance
    
    this.terrainMeshes = [];

    this.createLights();
    this.createTerrain();
    this.createObjective();
  }

  createLights() {
    // Ambient light - soft warm hue
    this.ambientLight = new THREE.AmbientLight(0xffeeda, 0.5);
    this.scene.add(this.ambientLight);

    // Sun light (Directional)
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    // Put sun slightly angled to make long dune shadows
    this.dirLight.position.set(150, 100, -50);
    this.dirLight.castShadow = true;
    
    // Configure shadow map for the sun
    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    const d = 300;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.far = 1000;
    this.dirLight.shadow.bias = -0.001;

    this.scene.add(this.dirLight);
  }

  linkEmotionSystem(emotionSystem) {
      this.emotionSystem = emotionSystem;
  }

  update(delta) {
      if (!this.emotionSystem) return;
      const profile = this.emotionSystem.getProfile();
      
      this.scene.background.copy(profile.skyColor);
      this.scene.fog.color.copy(profile.fogColor);
      this.scene.fog.density = profile.fogDensity;
      
      this.dirLight.color.copy(profile.lightColor);
      this.dirLight.intensity = profile.lightIntensity;

      if (profile.terrainColor && this.terrainMeshes.length > 0) {
          // Assuming main terrain is the first mesh
          this.terrainMeshes[0].material.color.copy(profile.terrainColor);
      }
  }

  createTerrain() {
    // Create a vast plane for the desert
    const size = 1000; // MUCH larger
    const geometry = new THREE.PlaneGeometry(size, size, 256, 256);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal

    // Displace vertices to create sweeping dunes using layered fractal sine waves
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        let y = 0;
        
        // Base sweeping dunes
        const scale1 = 0.01;
        y += Math.sin(vertex.x * scale1) * Math.cos(vertex.z * scale1) * 20;
        
        // Mid-sized dunes
        const scale2 = 0.03;
        y += Math.sin(vertex.x * scale2 + 2) * Math.cos(vertex.z * scale2) * 5;
        
        // Fine ridges
        const scale3 = 0.08;
        y += Math.sin(vertex.x * scale3 + vertex.z * scale3) * 1.5;

        // Keep a flat area in the center for spawning
        const distFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
        const flattenRadius = 20;
        let blend = Math.max(0, Math.min(1, (distFromCenter - flattenRadius) / 30.0));
        
        positionAttribute.setY(i, y * blend);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ 
        color: 0xedc9af, // Sand color
        roughness: 0.9,
        metalness: 0.0,
        flatShading: false
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.terrainMeshes.push(terrain);
  }

  createObjective() {
      // Create a massive glowing mountain in the distance
      const geo = new THREE.ConeGeometry(50, 200, 16);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mountain = new THREE.Mesh(geo, mat);
      
      mountain.position.set(0, 80, -400); // Far away
      
      // Make it glow a bit by placing a huge point light nearby
      const glow = new THREE.PointLight(0xffddaa, 5, 200);
      mountain.add(glow);

      this.scene.add(mountain);
      // We don't necessarily add the background mountain to terrain collision to save computation,
      // But we can if we want the player to climb it. Let's add it.
      this.terrainMeshes.push(mountain);
  }

  getTerrainMeshes() {
      return this.terrainMeshes;
  }
}
