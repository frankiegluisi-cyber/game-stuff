/**
 * High-fidelity composite procedural 3D models for Outbreak: Dead Zone.
 * Call of Duty: World at War inspired gritty WWII aesthetic with PBR materials,
 * weathered concrete, burning barrels, Czech hedgehogs, and chalk wall buys.
 */

import * as THREE from 'three';
import { ZombieType, PerkType } from '../types/game';

// Procedural texture generators for enhanced Call of Duty: World at War realism
function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#452c20';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#2b1810';
  ctx.lineWidth = 3;
  for (let i = 0; i < 35; i++) {
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + (Math.random() - 0.5) * 16, 180, y + (Math.random() - 0.5) * 16, 256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWeatheredConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Grimy WWII concrete base
  ctx.fillStyle = '#3a3f47';
  ctx.fillRect(0, 0, 512, 512);

  // Noise patches and water seepage stains
  ctx.fillStyle = '#262a30';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 24 + 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks and mortar lines
  ctx.strokeStyle = '#1a1c20';
  ctx.lineWidth = 2;
  for (let i = 0; i < 15; i++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (Math.random() - 0.5) * 40;
      cy += Math.random() * 35;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Bullet impact scorch marks
  ctx.fillStyle = '#111215';
  for (let i = 0; i < 12; i++) {
    const bx = Math.random() * 512;
    const by = Math.random() * 512;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRustedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, 256, 256);

  // Rust patches
  ctx.fillStyle = '#78350f';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 18 + 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createChalkOutlineTexture(title: string, cost: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 256, 128);

  // Rough chalk border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(10, 10, 236, 108);
  ctx.setLineDash([]);

  // Chalk Weapon Silhouette
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 55);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`[F] BUY [${cost}]`, 128, 88);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const woodTexture = createWoodTexture();
export const concreteTexture = createWeatheredConcreteTexture();
export const rustedMetalTexture = createRustedMetalTexture();

// Reusable PBR materials
export const materials = {
  skinZombie: new THREE.MeshStandardMaterial({ color: 0x47554b, roughness: 0.85, metalness: 0.1 }),
  skinBrute: new THREE.MeshStandardMaterial({ color: 0x2e3b32, roughness: 0.9, metalness: 0.2 }),
  houndFur: new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.95, metalness: 0.05 }),
  houndGlow: new THREE.MeshStandardMaterial({ color: 0xff3b00, emissive: 0xff4500, emissiveIntensity: 2.5 }),
  eyeGlowRed: new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff1133, emissiveIntensity: 3.5 }),
  eyeGlowYellow: new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 2.8 }),
  operativeBody: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.35, map: rustedMetalTexture }),
  operativeArmor: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.75 }),
  visorGlow: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.5 }),
  weaponMetal: new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.3, metalness: 0.85, map: rustedMetalTexture }),
  weaponWood: new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.8, map: woodTexture }),
  weaponPapGlow: new THREE.MeshStandardMaterial({ color: 0x7e22ce, emissive: 0xa855f7, emissiveIntensity: 2.2 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0x6d4423, roughness: 0.9, map: woodTexture }),
  sentryMetal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.85 }),
  hazardRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.5 }),
  hazardYellow: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45, metalness: 0.4 }),
  mysteryWood: new THREE.MeshStandardMaterial({ color: 0x381909, roughness: 0.85, map: woodTexture }),
  mysteryGold: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.95 }),
  wawConcrete: new THREE.MeshStandardMaterial({ color: 0x525866, roughness: 0.92, metalness: 0.15, map: concreteTexture }),
  wawRustedIron: new THREE.MeshStandardMaterial({ color: 0x2b303a, roughness: 0.65, metalness: 0.8, map: rustedMetalTexture }),
  fireEmber: new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff5500, emissiveIntensity: 4.0 })
};

/**
 * Composite Zombie Procedural Model
 */
export function createZombieModel(type: ZombieType): {
  group: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  head: THREE.Object3D;
  torso: THREE.Object3D;
} {
  const group = new THREE.Group();
  group.name = `zombie_${type}`;

  const isBrute = type === 'BRUTE_BOSS';
  const isHound = type === 'HELLHOUND';
  const isCrawler = type === 'CRAWLER';

  if (isHound) {
    // Modern Demonic Hellhound (Sleek predatory musculature, glowing spinal crest)
    const houndBodyGeo = new THREE.CapsuleGeometry(0.24, 0.68, 10, 16);
    houndBodyGeo.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(houndBodyGeo, materials.houndFur);
    bodyMesh.position.set(0, 0.55, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Glowing exposed ribcage / demonic core
    const ribGeo = new THREE.TorusGeometry(0.24, 0.035, 8, 16, Math.PI);
    const ribMesh = new THREE.Mesh(ribGeo, materials.houndGlow);
    ribMesh.position.set(0, 0.62, 0.05);
    ribMesh.rotation.x = -Math.PI / 2;
    group.add(ribMesh);

    // Fiery Dorsal Spines along spine
    for (let s = -2; s <= 2; s++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 6), materials.houndGlow);
      spine.position.set(0, 0.8, s * 0.14);
      spine.rotation.x = -0.3;
      group.add(spine);
    }

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.72, 0.52);

    // Sculpted predatory skull
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), materials.houndFur);
    headGroup.add(cranium);

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 10), materials.houndFur);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.04, 0.22);
    headGroup.add(snout);

    // Glowing predatory eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.houndGlow);
    leftEye.position.set(0.1, 0.06, 0.16);
    const rightEye = leftEye.clone();
    rightEye.position.set(-0.1, 0.06, 0.16);
    headGroup.add(leftEye, rightEye);

    // Glowing snarling lower mandible
    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.22, 8, 1, false, 0, Math.PI), materials.houndGlow);
    jaw.rotation.x = Math.PI / 2;
    jaw.position.set(0, -0.1, 0.18);
    headGroup.add(jaw);

    // Pointed demonic ears
    const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), materials.houndFur);
    leftEar.position.set(0.12, 0.16, -0.05);
    leftEar.rotation.z = -0.4;
    const rightEar = leftEar.clone();
    rightEar.position.set(-0.12, 0.16, -0.05);
    rightEar.rotation.z = 0.4;
    headGroup.add(leftEar, rightEar);

    group.add(headGroup);

    // Four jointed muscular legs
    const legGeo = new THREE.CapsuleGeometry(0.065, 0.38, 8, 10);
    const flLeg = new THREE.Mesh(legGeo, materials.houndFur);
    flLeg.position.set(0.2, 0.28, 0.32);
    const frLeg = flLeg.clone();
    frLeg.position.set(-0.2, 0.28, 0.32);
    const blLeg = flLeg.clone();
    blLeg.position.set(0.2, 0.28, -0.32);
    const brLeg = flLeg.clone();
    brLeg.position.set(-0.2, 0.28, -0.32);
    group.add(flLeg, frLeg, blLeg, brLeg);

    return { group, leftArm: flLeg, rightArm: frLeg, head: headGroup, torso: bodyMesh };
  }

  const scale = isBrute ? 1.65 : 1.0;
  const skinMat = isBrute ? materials.skinBrute : materials.skinZombie;
  const eyeMat = isBrute ? materials.eyeGlowRed : materials.eyeGlowYellow;

  // 1. Anatomical Curved Decayed Torso
  const torsoMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.23 * scale, 0.42 * scale, 10, 16),
    skinMat
  );
  torsoMesh.position.y = isCrawler ? 0.35 : 1.18 * scale;
  torsoMesh.castShadow = true;
  group.add(torsoMesh);

  // Tattered Tactical Vest / Uniform overlay
  const clothMat = new THREE.MeshStandardMaterial({
    color: isBrute ? 0x181f29 : 0x272e2b,
    roughness: 0.9,
    metalness: 0.15
  });
  const vestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scale, 0.23 * scale, 0.42 * scale, 12),
    clothMat
  );
  vestMesh.position.y = torsoMesh.position.y;
  group.add(vestMesh);

  // Exposed rotting ribcage arcs
  if (!isBrute) {
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.014, 6, 12, Math.PI * 0.7),
        new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.8 })
      );
      rib.position.set(0, torsoMesh.position.y - 0.05 + r * 0.09, 0.08);
      rib.rotation.y = Math.PI / 2;
      group.add(rib);
    }
  }

  // Brute Boss: Bulging glowing mutant cyst cluster + heavy blast armor
  if (isBrute) {
    const cystMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff4500,
      emissiveIntensity: 3.0
    });
    const mainCyst = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 12, 12), cystMat);
    mainCyst.position.set(0.32 * scale, torsoMesh.position.y + 0.22 * scale, 0.05);
    const subCyst = new THREE.Mesh(new THREE.SphereGeometry(0.1 * scale, 8, 8), cystMat);
    subCyst.position.set(0.24 * scale, torsoMesh.position.y + 0.32 * scale, 0.12);
    group.add(mainCyst, subCyst);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34 * scale, 0.32 * scale, 0.28 * scale, 12, 1, false, 0, Math.PI),
      materials.operativeArmor
    );
    plate.position.set(0, torsoMesh.position.y + 0.08 * scale, 0.12 * scale);
    group.add(plate);
  }

  // 2. Sculpted Anatomical Decayed Cranium & Glowing Eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, torsoMesh.position.y + 0.44 * scale, 0);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.19 * scale, 14, 14),
    skinMat
  );
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Decayed Rotting Mandible with exposed fangs
  const jawMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11 * scale, 0.12 * scale, 0.08 * scale, 10, 1, false, 0, Math.PI),
    skinMat
  );
  jawMesh.rotation.x = Math.PI / 6;
  jawMesh.position.set(0, -0.14 * scale, 0.1 * scale);
  headGroup.add(jawMesh);

  // Piercing Glowing Eye Sockets (Call of Duty / Fortnite signature glow)
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.042 * scale, 8, 8), eyeMat);
  leftEye.position.set(0.08 * scale, 0.03 * scale, 0.16 * scale);
  const rightEye = leftEye.clone();
  rightEye.position.set(-0.08 * scale, 0.03 * scale, 0.16 * scale);
  headGroup.add(leftEye, rightEye);

  // Tattered Military Combat Helmet on select walkers
  if (!isCrawler && !isBrute && Math.random() > 0.45) {
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 * scale, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
      materials.wawRustedIron
    );
    helm.position.set(0, 0.04 * scale, 0);
    headGroup.add(helm);
  } else if (isBrute) {
    // Armored Welder's Face Shield
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.28 * scale, 0.3 * scale, 0.1 * scale),
      materials.operativeArmor
    );
    mask.position.set(0, 0, 0.16 * scale);
    headGroup.add(mask);
  }

  group.add(headGroup);

  // 3. Multi-Segment Organic Arms with Clawed Talons
  const armGeoUpper = new THREE.CapsuleGeometry(0.065 * scale, 0.22 * scale, 8, 10);
  const armGeoLower = new THREE.CapsuleGeometry(0.055 * scale, 0.22 * scale, 8, 10);

  const leftArm = new THREE.Group();
  leftArm.position.set(0.32 * scale, torsoMesh.position.y + 0.18 * scale, 0);
  const leftUpper = new THREE.Mesh(armGeoUpper, skinMat);
  leftUpper.position.set(0, -0.12 * scale, 0.08 * scale);
  leftUpper.rotation.x = -Math.PI / 4;
  const leftLower = new THREE.Mesh(armGeoLower, skinMat);
  leftLower.position.set(0, -0.28 * scale, 0.22 * scale);
  leftLower.rotation.x = -Math.PI / 3;
  leftArm.add(leftUpper, leftLower);

  // Clawed Talon Fingers
  for (let f = -1; f <= 1; f++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.016 * scale, 0.08 * scale, 6), materials.weaponMetal);
    claw.position.set(f * 0.028 * scale, -0.42 * scale, 0.32 * scale);
    claw.rotation.x = -Math.PI / 3;
    leftArm.add(claw);
  }
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.32 * scale, torsoMesh.position.y + 0.18 * scale, 0);
  const rightUpper = new THREE.Mesh(armGeoUpper, skinMat);
  rightUpper.position.set(0, -0.12 * scale, 0.08 * scale);
  rightUpper.rotation.x = -Math.PI / 3.5;
  const rightLower = new THREE.Mesh(armGeoLower, skinMat);
  rightLower.position.set(0, -0.28 * scale, 0.24 * scale);
  rightLower.rotation.x = -Math.PI / 2.5;
  rightArm.add(rightUpper, rightLower);

  for (let f = -1; f <= 1; f++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.016 * scale, 0.08 * scale, 6), materials.weaponMetal);
    claw.position.set(f * 0.028 * scale, -0.42 * scale, 0.34 * scale);
    claw.rotation.x = -Math.PI / 2.5;
    rightArm.add(claw);
  }

  if (isBrute) {
    // Heavy Spiked Concrete Rebar Sledge
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04 * scale, 0.05 * scale, 1.2 * scale, 8),
      materials.wawRustedIron
    );
    shaft.position.set(0, -0.4 * scale, 0.45 * scale);
    shaft.rotation.x = -Math.PI / 3;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.35 * scale, 0.35 * scale, 0.5 * scale),
      materials.wawConcrete
    );
    block.position.set(0, -0.85 * scale, 0.7 * scale);
    rightArm.add(shaft, block);
  }
  group.add(rightArm);

  // 4. Smooth Multi-Segment Legs with Combat Boots
  if (!isCrawler) {
    const thighGeo = new THREE.CapsuleGeometry(0.08 * scale, 0.26 * scale, 8, 10);
    const calfGeo = new THREE.CapsuleGeometry(0.07 * scale, 0.26 * scale, 8, 10);
    const bootGeo = new THREE.BoxGeometry(0.14 * scale, 0.1 * scale, 0.26 * scale);

    const makeLeg = (xOff: number) => {
      const leg = new THREE.Group();
      leg.position.set(xOff, 0.8 * scale, 0);

      const thigh = new THREE.Mesh(thighGeo, clothMat);
      thigh.position.y = -0.14 * scale;

      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075 * scale, 8, 8), clothMat);
      knee.position.y = -0.32 * scale;

      const calf = new THREE.Mesh(calfGeo, clothMat);
      calf.position.y = -0.48 * scale;

      const boot = new THREE.Mesh(bootGeo, materials.operativeArmor);
      boot.position.set(0, -0.68 * scale, 0.04 * scale);
      boot.castShadow = true;

      leg.add(thigh, knee, calf, boot);
      return leg;
    };

    group.add(makeLeg(0.14 * scale));
    group.add(makeLeg(-0.14 * scale));
  } else {
    // Crawler: Exposed spinal cord trailing behind
    for (let sp = 0; sp < 4; sp++) {
      const vert = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 })
      );
      vert.position.set(0, 0.18, -0.25 - sp * 0.16);
      group.add(vert);
    }
  }

  return { group, leftArm, rightArm, head: headGroup, torso: torsoMesh };
}

/**
 * Composite Operative Character Model (Modern Tactical Spec-Ops / Fortnite Style)
 * Features curved anatomical torso, ballistic Ops-Core helmet, panoramic HUD combat visor,
 * MOLLE chest rig, tactical pouches, elbow/knee pads, and lugged assault boots.
 */
export function createOperativeModel(skinId: string = 'specops'): {
  group: THREE.Group;
  gunHolder: THREE.Object3D;
  head: THREE.Object3D;
} {
  const group = new THREE.Group();
  group.name = 'operative';

  let suitColor = 0x1e293b;
  let armorColor = 0x0f172a;
  let visorColor = 0x06b6d4; // Cyan HUD Visor

  if (skinId === 'hazmat') {
    suitColor = 0x854d0e;
    armorColor = 0x451a03;
    visorColor = 0xfacc15; // Golden Amber HUD Visor
  } else if (skinId === 'cyber') {
    suitColor = 0x18181b;
    armorColor = 0x09090b;
    visorColor = 0xa855f7; // Neon Violet HUD Visor
  } else if (skinId === 'bloodhunter') {
    suitColor = 0x4c0519;
    armorColor = 0x1c1917;
    visorColor = 0xf43f5e; // Crimson Thermal HUD Visor
  }

  const suitMat = new THREE.MeshStandardMaterial({
    color: suitColor,
    roughness: 0.75,
    metalness: 0.2
  });

  const plateMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    roughness: 0.45,
    metalness: 0.75
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: visorColor,
    emissive: visorColor,
    emissiveIntensity: 3.2,
    roughness: 0.1,
    metalness: 0.9
  });

  // 1. Anatomical Curved Torso with Tactical Plate Carrier Vest
  const torsoMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.21, 0.38, 10, 16),
    suitMat
  );
  torsoMesh.position.y = 1.18;
  torsoMesh.castShadow = true;
  group.add(torsoMesh);

  // Ballistic Chest Rig / Armor Carrier
  const chestPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.22, 0.42, 14),
    plateMat
  );
  chestPlate.position.set(0, 1.18, 0);
  chestPlate.castShadow = true;
  group.add(chestPlate);

  // Three Front MOLLE Ammo Magazine Pouches
  for (let m = -1; m <= 1; m++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.06), plateMat);
    pouch.position.set(m * 0.09, 1.12, 0.23);
    group.add(pouch);
  }

  // Tactical Shoulder Radio with Flexible Antenna
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.05), plateMat);
  radio.position.set(-0.16, 1.34, 0.12);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.26, 6), materials.weaponMetal);
  antenna.position.set(-0.16, 1.48, 0.12);
  group.add(radio, antenna);

  // Tactical Shoulder Pauldrons
  const pauldronGeo = new THREE.SphereGeometry(0.085, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const leftPauldron = new THREE.Mesh(pauldronGeo, plateMat);
  leftPauldron.position.set(0.25, 1.35, 0);
  leftPauldron.rotation.z = -0.4;
  const rightPauldron = leftPauldron.clone();
  rightPauldron.position.set(-0.25, 1.35, 0);
  rightPauldron.rotation.z = 0.4;
  group.add(leftPauldron, rightPauldron);

  // 2. Sculpted Ballistic FAST Ops-Core Combat Helmet & Panoramic Visor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.64, 0);

  // Inner Balaclava Head
  const innerHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), suitMat);
  headGroup.add(innerHead);

  // Outer Ballistic Helmet Shell
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.68),
    plateMat
  );
  helmet.position.set(0, 0.03, -0.01);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Front NVG Shroud Mount
  const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), materials.weaponMetal);
  nvgMount.position.set(0, 0.11, 0.19);
  headGroup.add(nvgMount);

  // Curved Polarized HUD Visor (Glowing Lens)
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175, 0.175, 0.085, 14, 1, false, Math.PI * 0.28, Math.PI * 0.44),
    visorMat
  );
  visor.position.set(0, 0.02, 0.03);
  headGroup.add(visor);

  // Tactical Comms Headset (Earcups + Boom Mic)
  const earcupGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.035, 10);
  const leftEarcup = new THREE.Mesh(earcupGeo, plateMat);
  leftEarcup.rotation.z = Math.PI / 2;
  leftEarcup.position.set(0.18, 0.01, 0);
  const rightEarcup = leftEarcup.clone();
  rightEarcup.position.set(-0.18, 0.01, 0);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.16, 6), materials.weaponMetal);
  mic.rotation.x = Math.PI / 3;
  mic.position.set(0.14, -0.06, 0.1);
  headGroup.add(leftEarcup, rightEarcup, mic);

  group.add(headGroup);

  // 3. Multi-Segment Tactical Arms (Bicep Capsule, Elbow Pad, Glove)
  const armGeoUpper = new THREE.CapsuleGeometry(0.065, 0.2, 8, 10);
  const armGeoLower = new THREE.CapsuleGeometry(0.055, 0.2, 8, 10);
  const elbowGeo = new THREE.SphereGeometry(0.065, 8, 8);

  const leftArm = new THREE.Group();
  leftArm.position.set(0.28, 1.34, 0);
  const lUpper = new THREE.Mesh(armGeoUpper, suitMat);
  lUpper.position.y = -0.12;
  const lElbow = new THREE.Mesh(elbowGeo, plateMat);
  lElbow.position.y = -0.24;
  const lLower = new THREE.Mesh(armGeoLower, suitMat);
  lLower.position.set(0, -0.34, 0.1);
  lLower.rotation.x = -Math.PI / 4;
  leftArm.add(lUpper, lElbow, lLower);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.28, 1.34, 0);
  const rUpper = new THREE.Mesh(armGeoUpper, suitMat);
  rUpper.position.y = -0.12;
  const rElbow = new THREE.Mesh(elbowGeo, plateMat);
  rElbow.position.y = -0.24;
  const rLower = new THREE.Mesh(armGeoLower, suitMat);
  rLower.position.set(0, -0.34, 0.1);
  rLower.rotation.x = -Math.PI / 4;
  rightArm.add(rUpper, rElbow, rLower);
  group.add(rightArm);

  // 4. Multi-Segment Tactical Legs (Thigh Capsule, Knee Pad, Lugged Assault Boot)
  const thighGeo = new THREE.CapsuleGeometry(0.082, 0.28, 8, 10);
  const calfGeo = new THREE.CapsuleGeometry(0.072, 0.28, 8, 10);
  const kneeGeo = new THREE.SphereGeometry(0.075, 8, 8);
  const bootGeo = new THREE.BoxGeometry(0.13, 0.1, 0.26);

  const makeOperativeLeg = (xOff: number) => {
    const leg = new THREE.Group();
    leg.position.set(xOff, 0.8, 0);

    const thigh = new THREE.Mesh(thighGeo, suitMat);
    thigh.position.y = -0.14;

    // Hard-shell tactical knee pad
    const knee = new THREE.Mesh(kneeGeo, plateMat);
    knee.position.set(0, -0.32, 0.03);

    const calf = new THREE.Mesh(calfGeo, suitMat);
    calf.position.y = -0.48;

    // Lugged combat assault boot with rubber sole
    const boot = new THREE.Mesh(bootGeo, plateMat);
    boot.position.set(0, -0.68, 0.04);
    boot.castShadow = true;

    leg.add(thigh, knee, calf, boot);
    return leg;
  };

  group.add(makeOperativeLeg(0.14));
  group.add(makeOperativeLeg(-0.14));

  const gunHolder = new THREE.Group();
  gunHolder.position.set(0.18, 1.15, 0.45);
  group.add(gunHolder);

  return { group, gunHolder, head: headGroup };
}

/**
 * 3D Procedural Weapon Model
 */
export function createWeaponModel(weaponId: string, isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  group.name = `weapon_${weaponId}`;

  const modernPolymer = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.45, metalness: 0.25 });
  const modernSteel = new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.28, metalness: 0.92 });
  const holoHousing = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.35, metalness: 0.85 });
  const holoLens = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.05 });
  const holoDot = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 5.0 });

  if (weaponId === 'raygun') {
    // Futuristic Experimental Plasma Blaster
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.55, 12), modernSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.28;

    const ringMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 3.5 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), ringMat);
    ring1.position.z = 0.38;
    const ring2 = ring1.clone();
    ring2.position.z = 0.22;

    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.14, 16), modernSteel);
    dish.rotation.x = -Math.PI / 2;
    dish.position.z = 0.55;

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.22, 0.09), modernPolymer);
    handle.position.set(0, -0.1, 0);

    // Glowing plasma core canister
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 8), ringMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.06, 0.1);

    group.add(barrel, ring1, ring2, dish, handle, core);
  } else if (weaponId === 'shotgun') {
    // Modern Combat 12-Gauge Tactical Shotgun
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.75, 12), modernSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.38;

    // Perforated heat shield
    const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 10), modernSteel);
    heatShield.rotation.x = Math.PI / 2;
    heatShield.position.set(0, 0.01, 0.35);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.15, 0.32), modernPolymer);
    stock.position.set(0, -0.05, -0.16);

    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), modernPolymer);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, -0.03, 0.32);

    // Side receiver shell caddy with 4 red shells
    const caddy = new THREE.Group();
    for (let s = 0; s < 4; s++) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.08, 6), materials.hazardRed);
      shell.position.set(0.045, -0.02 + s * 0.03, 0.08);
      caddy.add(shell);
    }

    group.add(barrel, heatShield, stock, pump, caddy);
  } else if (weaponId === 'minigun') {
    // Heavy Vulcan Gatling Cannon
    const cluster = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), modernSteel);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, 0.42);
      cluster.add(b);
    }
    const clampRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), modernSteel);
    clampRing.position.z = 0.7;
    cluster.add(clampRing);

    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 16), modernPolymer);
    drum.position.set(0, -0.14, 0.05);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.14), modernPolymer);
    handle.position.set(0, 0.12, -0.1);

    group.add(cluster, drum, handle);
  } else if (weaponId === 'rifle') {
    // Modern Tactical Assault Rifle with Holographic Reflex Sight & Picatinny Rails
    const upperReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.48), modernSteel);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 10), modernSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.44;

    // Tactical Flash Hider / Muzzle Brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.08, 8), modernSteel);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.z = 0.68;

    // Top Picatinny Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.015, 0.38), modernSteel);
    rail.position.set(0, 0.068, 0.02);

    // Holographic Reflex Sight with glowing red optic reticle dot
    const holoMount = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.06, 0.09), holoHousing);
    holoMount.position.set(0, 0.105, 0.02);

    const glassWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.036), holoLens);
    glassWindow.position.set(0, 0.115, 0.04);

    // Glowing red holographic reticle dot
    const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), holoDot);
    reticleDot.position.set(0, 0.115, 0.045);

    // Curved Polymer Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.24, 0.1), modernPolymer);
    mag.position.set(0, -0.14, 0.1);
    mag.rotation.x = 0.22;

    // Tactical Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.24), modernPolymer);
    stock.position.set(0, -0.02, -0.3);

    // Angled Foregrip
    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.06), modernPolymer);
    foregrip.position.set(0, -0.06, 0.32);
    foregrip.rotation.x = -0.3;

    group.add(upperReceiver, barrel, muzzle, rail, holoMount, glassWindow, reticleDot, mag, stock, foregrip);
  } else {
    // Modern Tactical 9mm Pistol
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.26), modernSteel);
    slide.position.set(0, 0, 0.02);

    // Tritium Night Sights (Front & Rear)
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.02), holoDot);
    frontSight.position.set(0, 0.045, 0.13);
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.018, 0.02), modernSteel);
    rearSight.position.set(0, 0.045, -0.09);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.08, 0.22), modernPolymer);
    frame.position.set(0, -0.04, 0.02);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.17, 0.09), modernPolymer);
    grip.position.set(0, -0.12, -0.05);
    grip.rotation.x = 0.22;

    group.add(slide, frontSight, rearSight, frame, grip);
  }

  return group;
}

/**
 * Placeable Heavy Fortified Defense Barrier (Build & Defend Main Building)
 * Smooth tubular welded steel H-frame, angled ballistic blast plate with hazard stripes,
 * pillowed horizontal capsule sandbags, and coiled razorwire loops.
 */
export function createDefenseBarrierModel(): {
  group: THREE.Group;
  healthBar: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'defense_barrier';

  // 1. Welded Heavy Steel Frame (Tubular Round Posts)
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.45, 12);
  const postL = new THREE.Mesh(postGeo, materials.wawRustedIron);
  postL.position.set(-1.1, 0.725, 0);
  postL.castShadow = true;

  const postR = postL.clone();
  postR.position.set(1.1, 0.725, 0);

  // Round Steel Cross-members
  const crossGeo = new THREE.CylinderGeometry(0.065, 0.065, 2.35, 12);
  const crossTop = new THREE.Mesh(crossGeo, materials.wawRustedIron);
  crossTop.rotation.z = Math.PI / 2;
  crossTop.position.set(0, 1.32, 0);

  const crossBot = new THREE.Mesh(crossGeo, materials.wawRustedIron);
  crossBot.rotation.z = Math.PI / 2;
  crossBot.position.set(0, 0.18, 0);

  // Welded Base Mount Footplates with Anchor Bolts
  const footpadGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.05, 10);
  const footL = new THREE.Mesh(footpadGeo, materials.wawRustedIron);
  footL.position.set(-1.1, 0.025, 0);
  const footR = new THREE.Mesh(footpadGeo, materials.wawRustedIron);
  footR.position.set(1.1, 0.025, 0);

  // 2. Reinforced Ballistic Armor Plate with Hazard Trims
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.75,
    roughness: 0.35
  });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.88, 0.08), plateMat);
  plate.position.set(0, 0.72, 0);
  plate.castShadow = true;

  // Diagonal Hazard Caution Stripes
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    emissive: 0xca8a04,
    emissiveIntensity: 0.3,
    roughness: 0.4
  });
  for (let s = -3; s <= 3; s++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.01), stripeMat);
    stripe.position.set(s * 0.32, 0.72, 0.045);
    stripe.rotation.z = 0.45;
    group.add(stripe);
  }

  // 3. Pillowed Horizontal Capsule Sandbags at base (Fortnite / COD stylized sandbags)
  const bagGeo = new THREE.CapsuleGeometry(0.12, 0.38, 8, 12);
  const bagMatA = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 });
  const bagMatB = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.92 });

  for (let row = 0; row < 2; row++) {
    const count = row === 0 ? 5 : 4;
    const xStart = row === 0 ? -0.92 : -0.69;
    const spacing = 0.46;
    for (let b = 0; b < count; b++) {
      const bag = new THREE.Mesh(bagGeo, (b + row) % 2 === 0 ? bagMatA : bagMatB);
      bag.rotation.z = Math.PI / 2;
      bag.rotation.y = (Math.random() - 0.5) * 0.15;
      bag.position.set(xStart + b * spacing, 0.11 + row * 0.19, 0.16);
      bag.castShadow = true;
      group.add(bag);
    }
  }

  // 4. Smooth Coiled Razor Wire Loops
  const wireGeo = new THREE.TorusGeometry(0.3, 0.018, 8, 24);
  const wire1 = new THREE.Mesh(wireGeo, materials.wawRustedIron);
  wire1.position.set(-0.55, 0.88, 0.12);
  const wire2 = new THREE.Mesh(wireGeo, materials.wawRustedIron);
  wire2.position.set(0.55, 0.88, 0.12);
  group.add(wire1, wire2);

  // 5. Sleek Overhead HUD Durability Bar
  const backingMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const backing = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.08, 0.02), backingMat);
  backing.position.set(0, 1.62, 0);

  const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const healthBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.03), hpBarMat);
  healthBar.position.set(0, 1.62, 0.01);

  group.add(postL, postR, crossTop, crossBot, footL, footR, plate, backing, healthBar);
  return { group, healthBar };
}

/**
 * Call of Duty: World at War Burning Fire Barrel (Oil Drum with crackling flames)
 */
export function createBurnBarrelModel(): { group: THREE.Group; light: THREE.PointLight; flameCore: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = 'waw_burn_barrel';

  // Rusted 55-gallon steel drum
  const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 14);
  const drumMesh = new THREE.Mesh(drumGeo, materials.wawRustedIron);
  drumMesh.position.set(0, 0.55, 0);
  drumMesh.castShadow = true;
  group.add(drumMesh);

  // Burning charcoal / scrap wood interior
  const woodLog = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.5), materials.weaponWood);
  woodLog.position.set(0, 0.9, 0);
  woodLog.rotation.set(0.4, 0.3, 0.2);
  group.add(woodLog);

  // Glowing orange-yellow flame core
  const flameGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
  const flameMesh = new THREE.Mesh(flameGeo, materials.fireEmber);
  flameMesh.position.set(0, 1.25, 0);
  group.add(flameMesh);

  // Dynamic flickering warm fire point light
  const fireLight = new THREE.PointLight(0xff6600, 3.2, 16, 1.4);
  fireLight.position.set(0, 1.35, 0);
  group.add(fireLight);

  return { group, light: fireLight, flameCore: flameMesh };
}

/**
 * WWII Czech Hedgehog Anti-Tank Obstacle wrapped in Razor Wire
 */
export function createCzechHedgehogModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'czech_hedgehog';

  const beamGeo = new THREE.BoxGeometry(0.14, 0.14, 2.2);
  const b1 = new THREE.Mesh(beamGeo, materials.wawRustedIron);
  b1.rotation.y = Math.PI / 4;
  b1.rotation.x = Math.PI / 4;
  b1.position.y = 0.7;

  const b2 = new THREE.Mesh(beamGeo, materials.wawRustedIron);
  b2.rotation.y = -Math.PI / 4;
  b2.rotation.z = Math.PI / 4;
  b2.position.y = 0.7;

  const b3 = new THREE.Mesh(beamGeo, materials.wawRustedIron);
  b3.rotation.x = Math.PI / 2;
  b3.position.y = 0.7;

  group.add(b1, b2, b3);

  // Razor wire coil wrapped around center
  const wireGeo = new THREE.TorusGeometry(0.45, 0.02, 6, 16);
  const wireMesh = new THREE.Mesh(wireGeo, materials.wawRustedIron);
  wireMesh.position.y = 0.7;
  group.add(wireMesh);

  return group;
}

/**
 * Hanging WWII Industrial Wire Cage Lamp with Flickering Bulb
 */
export function createHangingCageBulbModel(): { group: THREE.Group; light: THREE.PointLight } {
  const group = new THREE.Group();
  group.name = 'hanging_cage_bulb';

  // Conduit cable from ceiling
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6), materials.wawRustedIron);
  cable.position.set(0, -0.6, 0);
  group.add(cable);

  // Iron cage fixture
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 8), materials.wawRustedIron);
  cage.position.set(0, -1.3, 0);
  group.add(cage);

  // Filament bulb emitting warm sepia light
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffddaa,
    emissive: 0xffaa44,
    emissiveIntensity: 3.0
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bulbMat);
  bulb.position.set(0, -1.3, 0);
  group.add(bulb);

  const bulbLight = new THREE.PointLight(0xffaa55, 2.4, 18, 1.2);
  bulbLight.position.set(0, -1.35, 0);
  group.add(bulbLight);

  return { group, light: bulbLight };
}

/**
 * Fortified Sandbag Revetment Wall Section
 * Smooth horizontal pillowed capsule sandbags arranged in staggered military running-bond layers.
 */
export function createSandbagBunkerSection(): THREE.Group {
  const group = new THREE.Group();
  const bagGeo = new THREE.CapsuleGeometry(0.14, 0.52, 8, 12);

  const palette = [
    new THREE.MeshStandardMaterial({ color: 0x5e5647, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x4d473b, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ color: 0x6b6352, roughness: 0.97 })
  ];

  for (let layer = 0; layer < 4; layer++) {
    const isOdd = layer % 2 === 1;
    const count = isOdd ? 4 : 5;
    const startX = isOdd ? -1.35 : -1.8;
    const spacing = 0.9;

    for (let i = 0; i < count; i++) {
      const mat = palette[(i + layer) % palette.length];
      const bag = new THREE.Mesh(bagGeo, mat);
      bag.rotation.z = Math.PI / 2;
      bag.rotation.y = (Math.random() - 0.5) * 0.12;
      bag.rotation.x = (Math.random() - 0.5) * 0.08;
      bag.position.set(
        startX + i * spacing + (Math.random() - 0.5) * 0.04,
        layer * 0.24 + 0.14,
        (Math.random() - 0.5) * 0.06
      );
      bag.castShadow = true;
      group.add(bag);
    }
  }
  return group;
}

/**
 * Organic Blasted Dead Pine Tree (Perimeter Atmosphere)
 * Realistic multi-stage curved trunk, flared buttress roots, and gnarled tapering branches.
 */
export function createDeadTreeModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'dead_tree';

  // 1. Flared Buttress Roots
  for (let r = 0; r < 4; r++) {
    const angle = (r * Math.PI * 2) / 4 + 0.3;
    const root = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.22, 1.4, 6),
      materials.mysteryWood
    );
    root.position.set(Math.cos(angle) * 0.45, 0.4, Math.sin(angle) * 0.45);
    root.rotation.z = Math.cos(angle) * 0.45;
    root.rotation.x = Math.sin(angle) * 0.45;
    root.castShadow = true;
    group.add(root);
  }

  // 2. Multi-Segment Organic Curved Trunk
  const lowerTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.36, 3.2, 10),
    materials.mysteryWood
  );
  lowerTrunk.position.y = 1.6;
  lowerTrunk.castShadow = true;
  group.add(lowerTrunk);

  const midTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 3.0, 9),
    materials.mysteryWood
  );
  midTrunk.position.set(0.12, 4.4, -0.08);
  midTrunk.rotation.z = -0.06;
  midTrunk.rotation.x = 0.04;
  midTrunk.castShadow = true;
  group.add(midTrunk);

  const topTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.18, 2.6, 8),
    materials.mysteryWood
  );
  topTrunk.position.set(0.24, 6.9, -0.15);
  topTrunk.rotation.z = -0.12;
  topTrunk.rotation.x = 0.08;
  topTrunk.castShadow = true;
  group.add(topTrunk);

  // 3. Gnarled Tapering Branches
  const branchConfigs = [
    { y: 4.8, rotZ: 0.85, rotY: 0.2, len: 2.8, rad: 0.08 },
    { y: 5.4, rotZ: -0.75, rotY: 1.6, len: 2.4, rad: 0.07 },
    { y: 6.0, rotZ: 0.9, rotY: 3.1, len: 2.2, rad: 0.06 },
    { y: 6.6, rotZ: -0.85, rotY: 4.5, len: 2.0, rad: 0.05 },
    { y: 7.2, rotZ: 0.65, rotY: 0.9, len: 1.8, rad: 0.04 },
    { y: 7.7, rotZ: -0.6, rotY: 2.5, len: 1.5, rad: 0.035 }
  ];

  branchConfigs.forEach((cfg) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.rad * 0.4, cfg.rad, cfg.len, 6),
      materials.mysteryWood
    );
    branch.position.set(
      Math.sin(cfg.rotY) * 0.3 + 0.15,
      cfg.y,
      Math.cos(cfg.rotY) * 0.3 - 0.1
    );
    branch.rotation.y = cfg.rotY;
    branch.rotation.z = cfg.rotZ;
    branch.castShadow = true;
    group.add(branch);
  });

  return group;
}

/**
 * High-Fidelity 3D Barricade Window Frame with 4 Fortified Timber Planks
 * Weathered beveled timber posts, iron structural corner straps with hex carriage bolts,
 * and 4 repairable planks reinforced with steel braces.
 */
export function createBarricadeModel(): {
  group: THREE.Group;
  plankMeshes: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.name = 'barricade_window';

  // 1. Weathered Beveled Timber Uprights
  const postGeo = new THREE.BoxGeometry(0.2, 2.2, 0.2);
  const leftPost = new THREE.Mesh(postGeo, materials.weaponWood);
  leftPost.position.set(-0.9, 1.1, 0);

  const rightPost = new THREE.Mesh(postGeo, materials.weaponWood);
  rightPost.position.set(0.9, 1.1, 0);

  // Horizontal Sill and Lintel Beams
  const beamGeo = new THREE.BoxGeometry(2.0, 0.18, 0.2);
  const topBeam = new THREE.Mesh(beamGeo, materials.weaponWood);
  topBeam.position.set(0, 2.1, 0);

  const botBeam = new THREE.Mesh(beamGeo, materials.weaponWood);
  botBeam.position.set(0, 0.1, 0);

  group.add(leftPost, rightPost, topBeam, botBeam);

  // Iron Corner Reinforcement Brackets with Bolt Heads
  const boltMat = materials.weaponMetal;
  const boltGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.025, 8);
  for (const x of [-0.88, 0.88]) {
    for (const y of [0.18, 2.02]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.22), materials.wawRustedIron);
      bracket.position.set(x, y, 0);
      group.add(bracket);

      for (let bx = -0.04; bx <= 0.04; bx += 0.08) {
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(x + bx, y, 0.115);
        group.add(bolt);
      }
    }
  }

  // 2. Four Fortified Repairable Planks
  const plankMeshes: THREE.Mesh[] = [];
  const plankHeights = [0.45, 0.85, 1.25, 1.65];

  plankHeights.forEach((h, i) => {
    const pGeo = new THREE.BoxGeometry(1.85, 0.22, 0.07);
    const pMesh = new THREE.Mesh(pGeo, materials.woodPlank);
    pMesh.position.set(0, h, 0.05);
    pMesh.rotation.z = (Math.random() - 0.5) * 0.06;
    pMesh.castShadow = true;
    pMesh.name = `plank_${i}`;

    // Steel reinforcement strap collar with rivets on each plank
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.23, 0.08), materials.wawRustedIron);
    strapL.position.set(-0.6, 0, 0.005);
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.23, 0.08), materials.wawRustedIron);
    strapR.position.set(0.6, 0, 0.005);

    const rivetA = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6), boltMat);
    rivetA.rotation.x = Math.PI / 2;
    rivetA.position.set(-0.6, 0, 0);

    const rivetB = rivetA.clone();
    rivetB.position.set(0.6, 0, 0);

    pMesh.add(strapL, strapR, rivetA, rivetB);

    group.add(pMesh);
    plankMeshes.push(pMesh);
  });

  return { group, plankMeshes };
}

/**
 * 3D Call of Duty Style Perk-a-Cola Vending Machine
 * Features 1950s curved retro chassis, illuminated marquee, glass showcase with glowing soda bottles,
 * chrome coin mechanism, dispenser chute, and atmospheric point light.
 */
export function createPerkMachineModel(perkId: PerkType): {
  group: THREE.Group;
  light: THREE.PointLight;
  marqueeMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = `perk_${perkId}`;

  let machineColor = 0x991b1b; // Juggernog Crimson
  let lightColor = 0xef4444;
  let accentColor = 0xdc2626;

  if (perkId === 'SPEED_COLA') {
    machineColor = 0x166534; // Speed Cola Racing Green
    lightColor = 0x22c55e;
    accentColor = 0x15803d;
  } else if (perkId === 'QUICK_REVIVE') {
    machineColor = 0x1e40af; // Quick Revive Cobalt Blue
    lightColor = 0x38bdf8;
    accentColor = 0x2563eb;
  } else if (perkId === 'DOUBLE_TAP') {
    machineColor = 0x9a3412; // Double Tap Root Beer Amber
    lightColor = 0xf59e0b;
    accentColor = 0xd97706;
  } else if (perkId === 'STAMIN_UP') {
    machineColor = 0x854d0e; // Stamin-Up Ochre Gold
    lightColor = 0xeab308;
    accentColor = 0xca8a04;
  }

  const bodyMat = new THREE.MeshStandardMaterial({
    color: machineColor,
    roughness: 0.35,
    metalness: 0.65,
    map: rustedMetalTexture
  });

  const neonMat = new THREE.MeshStandardMaterial({
    color: lightColor,
    emissive: lightColor,
    emissiveIntensity: 3.2
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.32,
    roughness: 0.05,
    metalness: 0.1
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.95
  });

  // 1. Heavy Cast-Iron Base Plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 1.02), materials.wawRustedIron);
  plinth.position.set(0, 0.08, 0);
  plinth.castShadow = true;
  group.add(plinth);

  // 2. Main Curved Body Chassis
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.15, 0.96), bodyMat);
  bodyMesh.position.set(0, 1.16, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 3. Four Chrome Rounded Corner Bumpers
  const bumperGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.15, 10);
  const corners = [
    [-0.56, 1.16, 0.46],
    [0.56, 1.16, 0.46],
    [-0.56, 1.16, -0.46],
    [0.56, 1.16, -0.46]
  ];
  corners.forEach(([x, y, z]) => {
    const b = new THREE.Mesh(bumperGeo, chromeMat);
    b.position.set(x, y, z);
    group.add(b);
  });

  // 4. Rounded Header Hood with Neon Marquee Sign
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.46, 0.98), bodyMat);
  hood.position.set(0, 2.22, 0);
  group.add(hood);

  const marqueeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.32, 0.1), neonMat);
  marqueeMesh.position.set(0, 2.22, 0.5);
  group.add(marqueeMesh);

  // Marquee Emblem Badge (Front Center)
  if (perkId === 'JUGGERNOG') {
    // Red Cross Shield
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.02), chromeMat);
    crossV.position.set(0, 2.22, 0.56);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.02), chromeMat);
    crossH.position.set(0, 2.22, 0.56);
    group.add(crossV, crossH);
  } else if (perkId === 'SPEED_COLA') {
    // Lightning Bolt Chevron
    const bolt1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.02), chromeMat);
    bolt1.rotation.z = -0.4;
    bolt1.position.set(-0.03, 2.25, 0.56);
    const bolt2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.02), chromeMat);
    bolt2.rotation.z = 0.4;
    bolt2.position.set(0.03, 2.19, 0.56);
    group.add(bolt1, bolt2);
  } else {
    // Round Emblem Star
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), chromeMat);
    star.position.set(0, 2.22, 0.56);
    group.add(star);
  }

  // 5. Glowing Top Neon Arch / Fin
  const neonArch = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.022, 8, 20, Math.PI), neonMat);
  neonArch.position.set(0, 2.45, 0.35);
  group.add(neonArch);

  // 6. Illuminated Glass Showcase Window with Glowing Soda Bottles
  const cavityBack = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.08), chromeMat);
  cavityBack.position.set(0, 1.35, 0.38);
  group.add(cavityBack);

  const glassPane = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.7, 0.02), glassMat);
  glassPane.position.set(0, 1.35, 0.49);
  group.add(glassPane);

  // Wire Shelf for Bottles
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.025, 0.18), chromeMat);
  shelf.position.set(0, 1.05, 0.42);
  group.add(shelf);

  // 3 3D Perk-a-Cola Bottles with Glowing Liquid and Bottle Caps
  const bottleOffsets = [-0.24, 0, 0.24];
  bottleOffsets.forEach((bX) => {
    const bottleGroup = new THREE.Group();
    bottleGroup.position.set(bX, 1.06, 0.42);

    // Glowing soda liquid bottle body
    const bottleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 0.2, 10), neonMat);
    bottleBody.position.y = 0.1;

    // Translucent bottle neck
    const bottleNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.038, 0.09, 8), glassMat);
    bottleNeck.position.y = 0.24;

    // Crown Cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 8), chromeMat);
    cap.position.y = 0.29;

    // White Label Wrap
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.047, 0.047, 0.09, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    label.position.y = 0.1;

    bottleGroup.add(bottleBody, bottleNeck, cap, label);
    group.add(bottleGroup);
  });

  // 7. Chrome Dispenser Chute (Bottom Center)
  const chuteHousing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.14), materials.weaponMetal);
  chuteHousing.position.set(0, 0.42, 0.48);
  group.add(chuteHousing);

  const chuteFlap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 0.02), chromeMat);
  chuteFlap.position.set(0, 0.42, 0.55);
  chuteFlap.rotation.x = -0.15; // slightly swung in
  group.add(chuteFlap);

  // 8. Coin Slot Mechanism & Side Bottle Opener
  const coinBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.08), chromeMat);
  coinBox.position.set(0.45, 0.85, 0.49);
  group.add(coinBox);

  const coinLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  coinLight.position.set(0.45, 0.94, 0.54);
  group.add(coinLight);

  // Chrome Side Bottle Opener Bracket
  const opener = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.12), chromeMat);
  opener.position.set(0.6, 1.25, 0.15);
  const capBucket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.14), materials.wawRustedIron);
  capBucket.position.set(0.61, 1.06, 0.15);
  group.add(opener, capBucket);

  // 9. Atmospheric Point Light Illuminating Floor and Bunker Walls
  const light = new THREE.PointLight(lightColor, 2.6, 8.5, 1.8);
  light.position.set(0, 1.85, 0.65);
  group.add(light);

  return { group, light, marqueeMesh };
}

/**
 * 3D Mystery Box with Floating Glowing "? ?" Question Marks
 */
export function createMysteryBoxModel(): {
  group: THREE.Group;
  lid: THREE.Object3D;
  questionMark: THREE.Object3D;
} {
  const group = new THREE.Group();
  group.name = 'mystery_box';

  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 0.9), materials.mysteryWood);
  baseMesh.position.set(0, 0.325, 0);
  baseMesh.castShadow = true;
  group.add(baseMesh);

  const bracketMesh = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.1, 0.96), materials.mysteryGold);
  bracketMesh.position.set(0, 0.62, 0);
  group.add(bracketMesh);

  const lid = new THREE.Group();
  lid.position.set(0, 0.65, -0.45);
  const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 0.95), materials.mysteryWood);
  lidMesh.position.set(0, 0.09, 0.45);
  lid.add(lidMesh);
  group.add(lid);

  const qGroup = new THREE.Group();
  qGroup.position.set(0, 1.1, 0);

  const neonMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 3.5
  });

  const qCurve = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI * 1.5), neonMat);
  qCurve.position.set(0, 0.12, 0);
  const qStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), neonMat);
  qStem.position.set(0, -0.04, 0);
  const qDot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), neonMat);
  qDot.position.set(0, -0.18, 0);

  qGroup.add(qCurve, qStem, qDot);
  group.add(qGroup);

  return { group, lid, questionMark: qGroup };
}

/**
 * 3D Pack-a-Punch Machine with Glowing Coils and Gears
 */
export function createPackAPunchModel(): {
  group: THREE.Group;
  gears: THREE.Object3D[];
} {
  const group = new THREE.Group();
  group.name = 'pack_a_punch';

  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.4), materials.operativeArmor);
  baseMesh.position.set(0, 0.25, 0);
  group.add(baseMesh);

  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.0), materials.weaponMetal);
  bodyMesh.position.set(0, 1.4, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  const intakeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.3), materials.weaponPapGlow);
  intakeMesh.position.set(0, 1.3, 0.52);
  group.add(intakeMesh);

  const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.2, metalness: 0.9 });
  const coilL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12), coilMat);
  coilL.position.set(-0.8, 1.4, 0.3);
  const coilR = coilL.clone();
  coilR.position.set(0.8, 1.4, 0.3);
  group.add(coilL, coilR);

  const gears: THREE.Object3D[] = [];
  const gearMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12), materials.mysteryGold);
  gearMesh.rotation.x = Math.PI / 2;
  gearMesh.position.set(0, 2.05, 0.52);
  group.add(gearMesh);
  gears.push(gearMesh);

  return { group, gears };
}

/**
 * 3D Automated Sentry Turret
 */
export function createSentryTurretModel(): {
  group: THREE.Group;
  turretHead: THREE.Object3D;
  barrels: THREE.Object3D;
} {
  const group = new THREE.Group();
  group.name = 'sentry_turret';

  const legMat = materials.sentryMetal;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), legMat);
    leg.position.set(Math.cos(angle) * 0.35, 0.28, Math.sin(angle) * 0.35);
    leg.rotation.z = Math.cos(angle) * 0.4;
    leg.rotation.x = -Math.sin(angle) * 0.4;
    group.add(leg);
  }

  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.2, 12), legMat);
  baseMesh.position.set(0, 0.55, 0);
  group.add(baseMesh);

  const turretHead = new THREE.Group();
  turretHead.position.set(0, 0.72, 0);

  const headHousing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.45), legMat);
  headHousing.castShadow = true;
  turretHead.add(headHousing);

  const laserLens = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), materials.eyeGlowRed);
  laserLens.position.set(0.12, 0.08, 0.24);
  turretHead.add(laserLens);

  const barrels = new THREE.Group();
  barrels.position.set(0, 0, 0.24);

  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), materials.weaponMetal);
  b1.rotation.x = Math.PI / 2;
  b1.position.set(0.08, 0, 0.25);
  const b2 = b1.clone();
  b2.position.set(-0.08, 0, 0.25);
  barrels.add(b1, b2);

  turretHead.add(barrels);
  group.add(turretHead);

  return { group, turretHead, barrels };
}

/**
 * 3D Explosive Hazard Barrel
 */
export function createHazardBarrelModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hazard_barrel';

  const drumMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16), materials.hazardRed);
  drumMesh.position.set(0, 0.55, 0);
  drumMesh.castShadow = true;
  group.add(drumMesh);

  const stripeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.2, 16), materials.hazardYellow);
  stripeMesh.position.set(0, 0.55, 0);
  group.add(stripeMesh);

  const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 16), materials.weaponMetal);
  capMesh.position.set(0, 1.1, 0);
  group.add(capMesh);

  return group;
}

/**
 * 3D Power-Up Floating Pickup Icon
 */
export function createPowerUpModel(type: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `powerup_${type}`;

  const glowMat = new THREE.MeshStandardMaterial({
    color: type === 'NUKE' ? 0xef4444 : type === 'INSTA_KILL' ? 0xa855f7 : 0x22c55e,
    emissive: type === 'NUKE' ? 0xef4444 : type === 'INSTA_KILL' ? 0xa855f7 : 0x22c55e,
    emissiveIntensity: 3.0
  });

  if (type === 'NUKE') {
    const bombBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.5, 12), materials.weaponMetal);
    bombBody.position.set(0, 0.5, 0);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), materials.hazardRed);
    fin.position.set(0, 0.7, 0);
    group.add(bombBody, fin);
  } else {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), glowMat);
    core.position.set(0, 0.5, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 24), glowMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.5, 0);
    group.add(core, ring);
  }

  return group;
}
