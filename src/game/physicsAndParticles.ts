/**
 * Particle systems & bullet physics for Outbreak: Dead Zone.
 * Manages blood splatters, muzzle flashes, explosions, shell casings, and weather particles.
 */

import * as THREE from 'three';
import { BulletProjectile, WeatherType } from '../types/game';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  decayRate: number;
  scaleDecay: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private rainPoints: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private bloodMaterials: THREE.MeshBasicMaterial[] = [];
  private sparkMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.bloodMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x880808 }),
      new THREE.MeshBasicMaterial({ color: 0xaa0a0a }),
      new THREE.MeshBasicMaterial({ color: 0x550000 })
    ];

    this.sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  }

  /**
   * Spawn blood burst upon bullet impact on zombies
   */
  public spawnBlood(pos: THREE.Vector3, isHeadshot: boolean = false) {
    const count = isHeadshot ? 22 : 10;
    const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);

    for (let i = 0; i < count; i++) {
      const mat = this.bloodMaterials[Math.floor(Math.random() * this.bloodMaterials.length)];
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * (isHeadshot ? 7 : 4),
        Math.random() * (isHeadshot ? 6 : 3) + 1,
        (Math.random() - 0.5) * (isHeadshot ? 7 : 4)
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 1.0,
        maxLife: 1.0,
        decayRate: 1.8 + Math.random() * 0.8,
        scaleDecay: true
      });
    }
  }

  /**
   * Spawn spark burst upon bullet impact with metal / concrete
   */
  public spawnSparks(pos: THREE.Vector3) {
    const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geo, this.sparkMaterial);
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.4,
        maxLife: 0.4,
        decayRate: 2.5,
        scaleDecay: true
      });
    }
  }

  /**
   * Massive fiery explosion for hazard barrels, grenades, and Nuke
   */
  public spawnExplosion(pos: THREE.Vector3, radius: number = 5) {
    const count = 45;
    const colors = [0xff4500, 0xffa500, 0xff0000, 0x333333];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 0.15 + Math.random() * 0.25;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.copy(pos);

      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.3,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = (Math.random() * 8 + 4) * (radius / 4);
      const vel = dir.multiplyScalar(speed);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 1.2,
        maxLife: 1.2,
        decayRate: 1.1,
        scaleDecay: true
      });
    }
  }

  /**
   * Dynamic weather system: Rain, toxic spores, blood moon motes
   */
  public initWeather(weather: WeatherType) {
    if (this.rainPoints) {
      this.scene.remove(this.rainPoints);
      this.rainGeometry?.dispose();
      this.rainPoints = null;
    }

    if (weather === 'CLEAR_TWILIGHT') return;

    const count = weather === 'BLOOD_RAIN' ? 3500 : 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    let color = 0x60a5fa; // Rain
    let size = 0.12;

    if (weather === 'BLOOD_RAIN') {
      color = 0x991b1b;
      size = 0.16;
    } else if (weather === 'TOXIC_FOG') {
      color = 0x84cc16;
      size = 0.28;
    } else if (weather === 'RADIOACTIVE_BLOON') {
      color = 0xf43f5e;
      size = 0.22;
    }

    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.rainPositions = positions;
    this.rainGeometry = geometry;
    this.rainPoints = new THREE.Points(geometry, material);
    this.scene.add(this.rainPoints);
  }

  /**
   * Update particle positions and lifespans
   */
  public update(dt: number, weather: WeatherType) {
    // 1. Update transient particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decayRate * dt;

      // Physics integration
      p.velocity.y -= 9.8 * dt; // Gravity
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Ground bounce
      if (p.mesh.position.y <= 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.6;
        p.velocity.z *= 0.6;
      }

      if (p.scaleDecay) {
        const factor = Math.max(0.01, p.life / p.maxLife);
        p.mesh.scale.set(factor, factor, factor);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Weather particles
    if (this.rainPoints && this.rainPositions && this.rainGeometry) {
      const count = this.rainPositions.length / 3;
      const isRain = weather === 'BLOOD_RAIN';

      for (let i = 0; i < count; i++) {
        if (isRain) {
          this.rainPositions[i * 3 + 1] -= 35 * dt; // Fast falling rain
          this.rainPositions[i * 3] += 4 * dt; // Wind slant
        } else {
          // Floating toxic spore or ember
          this.rainPositions[i * 3 + 1] += Math.sin(Date.now() * 0.002 + i) * 0.8 * dt - 0.8 * dt;
          this.rainPositions[i * 3] += Math.cos(Date.now() * 0.001 + i) * 0.5 * dt;
        }

        // Loop bounds
        if (this.rainPositions[i * 3 + 1] < 0) {
          this.rainPositions[i * 3 + 1] = 25;
        } else if (this.rainPositions[i * 3 + 1] > 26) {
          this.rainPositions[i * 3 + 1] = 0;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.particles = [];
    if (this.rainPoints) {
      this.scene.remove(this.rainPoints);
      this.rainGeometry?.dispose();
    }
  }
}
