import * as THREE from 'three';

export class CollectibleSystem {
    constructor(scene, environment, energySystem) {
        this.scene = scene;
        this.environment = environment;
        this.energySystem = energySystem;

        this.collectibles = [];
        this.baseGeo = new THREE.OctahedronGeometry(0.3, 0);
        this.baseMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaaaa, 
            wireframe: false 
        });

        // Generate an abundance of initial fragments for the player to collect
        this.spawnCollectibles(150);
    }

    spawnCollectibles(count) {
        const raycaster = new THREE.Raycaster();
        
        for(let i=0; i<count; i++) {
            // Random location in a generously wide world area
            const x = (Math.random() - 0.5) * 500;
            const z = (Math.random() - 0.5) * 500;

            const mesh = new THREE.Mesh(this.baseGeo, this.baseMat.clone());
            
            // Raycast to find ground
            raycaster.set(new THREE.Vector3(x, 200, z), new THREE.Vector3(0, -1, 0));
            const terrainMeshes = this.environment.getTerrainMeshes();
            const intersects = raycaster.intersectObjects(terrainMeshes);
            
            if (intersects.length > 0) {
                // Float slightly above terrain
                mesh.position.set(x, intersects[0].point.y + 1.5, z);
                
                // Store initial Y for hovering animation
                mesh.userData.baseY = mesh.position.y;
                mesh.userData.randomOffsets = Math.random() * 100; // offset for hover
                
                // Removed PointLight as 150 concurrent lights crashes WebGL performance entirely.
                // We rely on the MeshBasicMaterial's unlit emission to look like a glow.

                this.scene.add(mesh);
                this.collectibles.push(mesh);
            }
        }
    }

    update(delta, playerPos) {
        const time = performance.now() * 0.003;

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            
            // Hover animation
            item.position.y = item.userData.baseY + Math.sin(time + item.userData.randomOffsets) * 0.3;
            item.rotation.y += delta;
            item.rotation.x += delta * 0.5;

            // Collision check (simple distance)
            const dist = item.position.distanceTo(playerPos);
            if (dist < 2.0) { // Pickup radius
                this.collect(item, i);
            }
        }
    }

    collect(item, index) {
        // Visual feedback - simple scale burst effect
        // Realistically we delete it and increase energy
        this.energySystem.increaseCapacity();
        
        // Remove from scene
        this.scene.remove(item);
        this.collectibles.splice(index, 1);
        
        // Flash the screen or create particles here theoretically
    }
}
