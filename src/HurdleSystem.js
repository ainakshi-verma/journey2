import * as THREE from 'three';

export class HurdleSystem {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;

        this.updrafts = [];
        this.ruinsMeshes = [];

        this.generateHurdles();
    }

    generateHurdles() {
        // ONE Slope structural guide
        this.createRuinZone(new THREE.Vector3(50, 0, -80));
        
        // ONE very gentle wind zone
        this.createUpdraft(new THREE.Vector3(50, 0, -60), 20, 100);
    }

    createRuinZone(center) {
        // Find ground height at center
        const raycaster = new THREE.Raycaster(new THREE.Vector3(center.x, 200, center.z), new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(this.environment.getTerrainMeshes());
        const groundY = intersects.length > 0 ? intersects[0].point.y : 0;

        const mat = new THREE.MeshStandardMaterial({ color: 0xaa9580, roughness: 1.0 });

        // Create one simple slope
        const geo = new THREE.CylinderGeometry(8, 12, 10, 16);
        geo.translate(0, 5, 0); // origin at base
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(center.x, groundY - 2, center.z);
        
        // Slant it slightly to act as a natural ramp
        mesh.rotation.x = 0.2;
        mesh.rotation.z = -0.1;

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.ruinsMeshes.push(mesh);
        this.environment.terrainMeshes.push(mesh); // Add to terrain collision
    }

    createUpdraft(pos, radius, height) {
        // Find ground
        const raycaster = new THREE.Raycaster(new THREE.Vector3(pos.x, 200, pos.z), new THREE.Vector3(0,-1,0));
        const inter = raycaster.intersectObjects(this.environment.getTerrainMeshes());
        const gy = inter.length > 0 ? inter[0].point.y : 0;

        // Visual Particles for Wind Direction
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(50 * 3);
        for(let i=0; i<50; i++){
            pPos[i*3] = pos.x + (Math.random()-0.5) * radius * 1.5;
            pPos[i*3+1] = gy + Math.random() * height;
            pPos[i*3+2] = pos.z + (Math.random()-0.5) * radius * 1.5;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.6 });
        const particles = new THREE.Points(pGeo, pMat);
        this.scene.add(particles);

        this.updrafts.push({ position: new THREE.Vector3(pos.x, gy, pos.z), radius, height, particles });
    }

    update(delta, player, emotionSystem) {
        const pPos = player.mesh.position;

        // Apply external forces to player natively
        // 1. Updraft
        for (let u of this.updrafts) {
            // Animate particles up smoothly
            const posAttr = u.particles.geometry.attributes.position;
            for(let i=0; i<posAttr.count; i++) {
                let y = posAttr.getY(i);
                y += 5 * delta;
                if (y > u.position.y + u.height) y = u.position.y;
                posAttr.setY(i, y);
            }
            posAttr.needsUpdate = true;

            const dist = new THREE.Vector2(u.position.x - pPos.x, u.position.z - pPos.z).length();
            if (dist < u.radius && pPos.y >= u.position.y && pPos.y <= u.position.y + u.height) {
                if (player.isGliding) {
                    player.velocity.y += 10 * delta; // Very Lifted smoothly
                } else {
                    player.velocity.y += 2 * delta; // Gentle boost
                }
                // REMOVED: No random emotion updates
            }
        }
    }
}
