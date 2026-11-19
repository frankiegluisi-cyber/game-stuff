/**
 * Call of Duty: World at War Style Outbreak Compound Map Builder.
 * Features weathered WWII concrete bunker, chalk weapon wall-buys, burning oil barrels,
 * hanging cage lamps, Czech hedgehogs, sandbags, and dead barren trees.
 */

import * as THREE from 'three';
import {
  createBarricadeModel,
  createPerkMachineModel,
  createMysteryBoxModel,
  createPackAPunchModel,
  createHazardBarrelModel,
  createBurnBarrelModel,
  createCzechHedgehogModel,
  createHangingCageBulbModel,
  createDeadTreeModel,
  createSandbagBunkerSection,
  createChalkOutlineTexture,
  createDefenseBarrierModel,
  materials
} from './proceduralModels';
import { BarricadeState, PerkType } from '../types/game';

export interface WallBuy {
  id: string;
  weaponId: string;
  name: string;
  cost: number;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
}

export interface PlacedBarrier {
  id: string;
  model: ReturnType<typeof createDefenseBarrierModel>;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
}

export interface MapElements {
  colliders: THREE.Box3[];
  barricades: { state: BarricadeState; model: ReturnType<typeof createBarricadeModel> }[];
  perkMachines: {
    perkId: PerkType;
    position: [number, number, number];
    group: THREE.Group;
    light: THREE.PointLight;
    marqueeMesh: THREE.Mesh;
  }[];
  mysteryBox: ReturnType<typeof createMysteryBoxModel> & { position: [number, number, number] };
  packAPunch: ReturnType<typeof createPackAPunchModel> & { position: [number, number, number] };
  hazardBarrels: { group: THREE.Group; position: THREE.Vector3; health: number; exploded: boolean }[];
  burnBarrels: ReturnType<typeof createBurnBarrelModel>[];
  hangingLights: ReturnType<typeof createHangingCageBulbModel>[];
  wallBuys: WallBuy[];
  defenseBarriers: PlacedBarrier[];
  trapSwitch: { mesh: THREE.Mesh; position: [number, number, number]; active: boolean; cooldown: number };
  electricFence: { group: THREE.Group; p1: THREE.Vector3; p2: THREE.Vector3; active: boolean };
  zombieSpawns: [number, number, number][];
}

export function buildMap(scene: THREE.Scene): MapElements {
  const colliders: THREE.Box3[] = [];

  // 1. Terrain & Gritty Mud/Concrete Ground
  const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1f232b,
    roughness: 0.95,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Weathered Courtyard Concrete Slab
  const courtyardGeo = new THREE.BoxGeometry(42, 0.12, 42);
  const courtyard = new THREE.Mesh(courtyardGeo, materials.wawConcrete);
  courtyard.position.set(0, 0.06, 0);
  courtyard.receiveShadow = true;
  scene.add(courtyard);

  // Helper to add a gritty concrete wall with collision
  function addConcreteWall(x: number, y: number, z: number, w: number, h: number, d: number) {
    const wallGeo = new THREE.BoxGeometry(w, h, d);
    const wall = new THREE.Mesh(wallGeo, materials.wawConcrete);
    wall.position.set(x, y + h / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    const box = new THREE.Box3().setFromObject(wall);
    colliders.push(box);
    return wall;
  }

  // 2. Fortified Modern Command Bunker Building
  // North Outer Perimeter Wall with Twin Window Breaches
  addConcreteWall(-8, 0, -11, 4.5, 4.2, 0.7);
  addConcreteWall(0, 0, -11, 4.5, 4.2, 0.7);
  addConcreteWall(8, 0, -11, 4.5, 4.2, 0.7);

  // West Wall with Dual Observation Windows
  addConcreteWall(-11, 0, -6, 0.7, 4.2, 4.5);
  addConcreteWall(-11, 0, 1.5, 0.7, 4.2, 4.5);
  addConcreteWall(-11, 0, 7.5, 0.7, 4.2, 3.5);

  // East Wall with Armory Breach Window
  addConcreteWall(11, 0, -6, 0.7, 4.2, 4.5);
  addConcreteWall(11, 0, 2.5, 0.7, 4.2, 6.5);

  // South Wall with Courtyard Blast Doorway
  addConcreteWall(-6.5, 0, 8.5, 6.2, 4.2, 0.7);
  addConcreteWall(6.5, 0, 8.5, 6.2, 4.2, 0.7);

  // Internal Tactical Partition Wall (Separates Main Command from Pack-a-Punch Generator Chamber)
  addConcreteWall(-5.5, 0, -4.5, 5.2, 4.2, 0.5);
  addConcreteWall(5.5, 0, -4.5, 5.2, 4.2, 0.5);

  // Heavy Bunker Roof with Rusted Rebar Trims
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(23.5, 0.6, 21),
    materials.wawConcrete
  );
  roof.position.set(0, 4.35, -1.0);
  roof.castShadow = true;
  scene.add(roof);

  // Steel Overhead I-Beam Rafters
  for (let rz = -8; rz <= 6; rz += 4.5) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(22, 0.22, 0.18), materials.wawRustedIron);
    truss.position.set(0, 4.0, rz);
    scene.add(truss);
  }

  // 3. Smooth Architectural Support Columns (Fortnite / Modern Warfare aesthetic)
  const colGeo = new THREE.CylinderGeometry(0.46, 0.48, 4.2, 18);
  const colPlinthGeo = new THREE.CylinderGeometry(0.58, 0.62, 0.35, 18);

  const addSmoothColumn = (x: number, z: number) => {
    const colMesh = new THREE.Mesh(colGeo, materials.wawConcrete);
    colMesh.position.set(x, 2.1, z);
    colMesh.castShadow = true;
    colMesh.receiveShadow = true;

    const basePlinth = new THREE.Mesh(colPlinthGeo, materials.wawConcrete);
    basePlinth.position.set(x, 0.175, z);

    const capPlinth = new THREE.Mesh(colPlinthGeo, materials.wawConcrete);
    capPlinth.position.set(x, 4.025, z);

    scene.add(colMesh, basePlinth, capPlinth);
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, 2.1, z), new THREE.Vector3(1.1, 4.2, 1.1)));
  };

  addSmoothColumn(-4.5, 1.5);
  addSmoothColumn(4.5, 1.5);

  // Rounded Corner Reinforcement Pilasters (eliminates sharp 90-degree blocky bunker corners)
  const pilasterGeo = new THREE.CylinderGeometry(0.42, 0.45, 4.2, 14);
  const cornerPositions: [number, number][] = [
    [-10.8, -10.8],
    [10.8, -10.8],
    [-10.8, 8.3],
    [10.8, 8.3],
    [-3.5, 8.5],
    [3.5, 8.5]
  ];
  cornerPositions.forEach(([px, pz]) => {
    const pilaster = new THREE.Mesh(pilasterGeo, materials.wawConcrete);
    pilaster.position.set(px, 2.1, pz);
    pilaster.castShadow = true;
    pilaster.receiveShadow = true;
    scene.add(pilaster);
  });

  // Overhead Industrial Air Duct System
  const ductMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.35
  });
  const ductMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 18, 16), ductMat);
  ductMesh.rotation.z = Math.PI / 2;
  ductMesh.position.set(0, 3.8, 1.5);
  scene.add(ductMesh);

  // Duct vent grilles
  for (const dx of [-6, 0, 6]) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.15, 14), materials.wawRustedIron);
    vent.rotation.z = Math.PI / 2;
    vent.position.set(dx, 3.8, 1.5);
    scene.add(vent);
  }

  // 4. Modern Curved Holographic Command Table (Central War Room)
  const holotableGroup = new THREE.Group();
  holotableGroup.position.set(0, 0, 1.5);

  // Cylindrical Chamfered Pedestal Base
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.52, 0.85, 24),
    materials.operativeArmor
  );
  pedestal.position.y = 0.425;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  holotableGroup.add(pedestal);

  // Glowing Cyan LED Perimeter Accent Ring
  const ringGeo = new THREE.TorusGeometry(1.36, 0.025, 8, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 3.5
  });
  const neonRing = new THREE.Mesh(ringGeo, ringMat);
  neonRing.rotation.x = Math.PI / 2;
  neonRing.position.y = 0.84;
  holotableGroup.add(neonRing);

  // 3D Holographic Wireframe Map Dome
  const domeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  const holoDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    domeMat
  );
  holoDome.position.y = 0.86;
  holotableGroup.add(holoDome);

  // Tactical Floating Waypoint Pins
  const pinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  for (let p = 0; p < 3; p++) {
    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), pinMat);
    pin.rotation.x = Math.PI;
    const ang = p * 2.1;
    pin.position.set(Math.cos(ang) * 0.45, 1.15, Math.sin(ang) * 0.45);
    holotableGroup.add(pin);
  }

  scene.add(holotableGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 0.45, 1.5), new THREE.Vector3(2.8, 0.9, 2.8)));

  // Tactical Server Terminal Consoles with curved monitor bezels and status LEDs
  const serverMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.8 });
  const serverL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 1.8), serverMat);
  serverL.position.set(-10.2, 1.2, -4);
  serverL.castShadow = true;

  // Green status indicator LEDs on server face
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  for (let r = 0; r < 4; r++) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), ledMat);
    led.position.set(0.41, 0.5 - r * 0.3, 0.2);
    serverL.add(led);
  }
  scene.add(serverL);
  colliders.push(new THREE.Box3().setFromObject(serverL));

  // 3. Six Barricadable Windows (Expanded Tactical Defense Points)
  const barricades: MapElements['barricades'] = [];
  const barricadeConfigs: { id: string; pos: [number, number, number]; rot: number }[] = [
    { id: 'b_north_a', pos: [-4.2, 0, -11], rot: 0 },
    { id: 'b_north_b', pos: [4.2, 0, -11], rot: 0 },
    { id: 'b_west_obs', pos: [-11, 0, -2], rot: Math.PI / 2 },
    { id: 'b_west_storage', pos: [-11, 0, 5], rot: Math.PI / 2 },
    { id: 'b_east_armory', pos: [11, 0, -1.8], rot: -Math.PI / 2 },
    { id: 'b_south_gate', pos: [0, 0, 16], rot: 0 }
  ];

  barricadeConfigs.forEach((cfg) => {
    const barModel = createBarricadeModel();
    barModel.group.position.set(...cfg.pos);
    barModel.group.rotation.y = cfg.rot;
    scene.add(barModel.group);

    barricades.push({
      state: {
        id: cfg.id,
        position: cfg.pos,
        rotation: cfg.rot,
        planks: 4,
        maxPlanks: 4,
        repairCost: 50
      },
      model: barModel
    });
  });

  // 4. Placeable & Pre-Fortified Defense Barriers to Defend Main Building
  const defenseBarriers: PlacedBarrier[] = [];
  const barrierConfigs: [number, number, number, number][] = [
    [-2.8, 0, 8.5, 0], // South Courtyard Entry Left
    [2.8, 0, 8.5, 0], // South Courtyard Entry Right
    [0, 0, -4.5, 0] // Generator Chamber Doorway
  ];

  barrierConfigs.forEach((bCfg, idx) => {
    const bModel = createDefenseBarrierModel();
    const bPos = new THREE.Vector3(bCfg[0], bCfg[1], bCfg[2]);
    bModel.group.position.copy(bPos);
    bModel.group.rotation.y = bCfg[3];
    scene.add(bModel.group);

    const bBox = new THREE.Box3().setFromCenterAndSize(bPos, new THREE.Vector3(2.4, 1.4, 0.6));
    colliders.push(bBox);

    defenseBarriers.push({
      id: `barrier_${idx}`,
      model: bModel,
      position: bPos,
      health: 400,
      maxHealth: 400
    });
  });

  // 4. Burning Oil Drums (WaW Burn Barrels with dynamic fire light & embers)
  const burnBarrels: ReturnType<typeof createBurnBarrelModel>[] = [];
  const burnPositions: [number, number, number][] = [
    [-8, 0, -8],
    [8, 0, -8],
    [-7, 0, 10],
    [7, 0, 10],
    [0, 0, 19]
  ];

  burnPositions.forEach((pos) => {
    const bb = createBurnBarrelModel();
    bb.group.position.set(...pos);
    scene.add(bb.group);
    burnBarrels.push(bb);
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...pos), new THREE.Vector3(0.9, 1.2, 0.9)));
  });

  // 5. Hanging Wire Cage Lamps with Flickering Bulbs
  const hangingLights: ReturnType<typeof createHangingCageBulbModel>[] = [];
  const lampPositions: [number, number, number][] = [
    [0, 4.2, -4],
    [-5, 4.2, 2],
    [5, 4.2, 2]
  ];

  lampPositions.forEach((pos) => {
    const lamp = createHangingCageBulbModel();
    lamp.group.position.set(...pos);
    scene.add(lamp.group);
    hangingLights.push(lamp);
  });

  // 6. WWII Chalk Weapon Wall Buys (Iconic WaW Feature)
  const wallBuys: WallBuy[] = [];
  function addWallBuy(id: string, weaponId: string, name: string, cost: number, pos: [number, number, number], rotY: number) {
    const tex = createChalkOutlineTexture(name, cost);
    const planeGeo = new THREE.PlaneGeometry(1.8, 0.9);
    const planeMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.position.set(...pos);
    mesh.rotation.y = rotY;
    scene.add(mesh);

    wallBuys.push({
      id,
      weaponId,
      name,
      cost,
      position: new THREE.Vector3(...pos),
      mesh
    });
  }

  // Trench Shotgun Wall Buy on East Bunker Wall
  addWallBuy('wb_shotgun', 'shotgun', 'TRENCH 12-GAUGE', 500, [9.62, 1.6, -3.5], -Math.PI / 2);
  // Commando AR-4 Wall Buy on West Bunker Wall
  addWallBuy('wb_rifle', 'rifle', 'COMMANDO AR-4', 1000, [-9.62, 1.6, -3.5], Math.PI / 2);

  // 7. Czech Hedgehogs (Anti-Tank Crossed I-Beams & Razor Wire)
  const hedgehogPositions: [number, number, number][] = [
    [-11, 0, 13],
    [11, 0, 13],
    [-5, 0, 17],
    [5, 0, 17]
  ];

  hedgehogPositions.forEach((pos) => {
    const h = createCzechHedgehogModel();
    h.position.set(...pos);
    scene.add(h);
    colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...pos), new THREE.Vector3(1.6, 1.4, 1.6)));
  });

  // 8. Sandbag Bunker Positions
  const sb1 = createSandbagBunkerSection();
  sb1.position.set(-3.5, 0, 11);
  sb1.rotation.y = 0.25;
  scene.add(sb1);
  colliders.push(new THREE.Box3().setFromObject(sb1));

  const sb2 = createSandbagBunkerSection();
  sb2.position.set(3.5, 0, 11);
  sb2.rotation.y = -0.25;
  scene.add(sb2);
  colliders.push(new THREE.Box3().setFromObject(sb2));

  // 9. Outer Defensive Perimeter Walls
  addConcreteWall(0, 0, 24, 38, 3.2, 0.5);
  addConcreteWall(-19, 0, 8, 0.5, 3.2, 32);
  addConcreteWall(19, 0, 8, 0.5, 3.2, 32);

  // Watchtower in South-West Courtyard Corner
  const towerGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const x = (i % 2 === 0 ? -1 : 1) * 1.5;
    const z = (i < 2 ? -1 : 1) * 1.5;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 7.5, 8), materials.wawRustedIron);
    leg.position.set(x, 3.75, z);
    towerGroup.add(leg);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.6), materials.wawRustedIron);
  deck.position.set(0, 7.5, 0);
  towerGroup.add(deck);

  const searchlight = new THREE.SpotLight(0xfef08a, 4.0, 38, Math.PI / 4, 0.45, 1);
  searchlight.position.set(0, 7.8, 0);
  searchlight.target.position.set(0, 0, 12);
  towerGroup.add(searchlight);
  towerGroup.add(searchlight.target);

  towerGroup.position.set(-15, 0, 18);
  scene.add(towerGroup);
  colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-15, 3.75, 18), new THREE.Vector3(3.2, 7.5, 3.2)));

  // 10. Barren Blasted Dead Trees in the Foggy Distance
  const treePositions: [number, number, number][] = [
    [-24, 0, -18],
    [24, 0, -18],
    [-26, 0, 5],
    [26, 0, 5],
    [-24, 0, 26],
    [24, 0, 26],
    [0, 0, -26],
    [0, 0, 32]
  ];

  treePositions.forEach((pos) => {
    const tree = createDeadTreeModel();
    tree.position.set(...pos);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
  });

  // 11. Five Perk-a-Cola Vending Machines
  const perkMachines: MapElements['perkMachines'] = [];
  const perkLocations: { perkId: PerkType; pos: [number, number, number]; rot: number }[] = [
    { perkId: 'JUGGERNOG', pos: [-8.8, 0, -8.8], rot: Math.PI / 4 },
    { perkId: 'SPEED_COLA', pos: [8.8, 0, -8.8], rot: -Math.PI / 4 },
    { perkId: 'QUICK_REVIVE', pos: [-8.8, 0, 5], rot: Math.PI / 2 },
    { perkId: 'DOUBLE_TAP', pos: [15, 0, 14], rot: -Math.PI / 3 },
    { perkId: 'STAMIN_UP', pos: [-14, 0, 10], rot: Math.PI / 3 }
  ];

  perkLocations.forEach((p) => {
    const { group: machineGroup, light, marqueeMesh } = createPerkMachineModel(p.perkId);
    machineGroup.position.set(...p.pos);
    machineGroup.rotation.y = p.rot;
    scene.add(machineGroup);
    colliders.push(new THREE.Box3().setFromObject(machineGroup));

    perkMachines.push({
      perkId: p.perkId,
      position: p.pos,
      group: machineGroup,
      light,
      marqueeMesh
    });
  });

  // 12. Mystery Box in Courtyard
  const mysteryBoxModel = createMysteryBoxModel();
  const boxPos: [number, number, number] = [6, 0, 14];
  mysteryBoxModel.group.position.set(...boxPos);
  mysteryBoxModel.group.rotation.y = -0.3;
  scene.add(mysteryBoxModel.group);
  colliders.push(new THREE.Box3().setFromObject(mysteryBoxModel.group));

  const mysteryBox = {
    ...mysteryBoxModel,
    position: boxPos
  };

  // 13. Pack-a-Punch Machine in Northern Bunker Chamber
  const papModel = createPackAPunchModel();
  const papPos: [number, number, number] = [0, 0, -7.5];
  papModel.group.position.set(...papPos);
  scene.add(papModel.group);
  colliders.push(new THREE.Box3().setFromObject(papModel.group));

  const packAPunch = {
    ...papModel,
    position: papPos
  };

  // 14. Explosive Hazard Barrels
  const hazardBarrels: MapElements['hazardBarrels'] = [];
  const barrelPositions = [
    new THREE.Vector3(-4, 0, 8),
    new THREE.Vector3(4, 0, 8),
    new THREE.Vector3(-12, 0, 14),
    new THREE.Vector3(12, 0, 14),
    new THREE.Vector3(0, 0, 20)
  ];

  barrelPositions.forEach((pos) => {
    const b = createHazardBarrelModel();
    b.position.copy(pos);
    scene.add(b);
    hazardBarrels.push({
      group: b,
      position: pos.clone(),
      health: 40,
      exploded: false
    });
  });

  // 15. High-Voltage Electric Trap Corridor
  const switchMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 1.5 })
  );
  switchMesh.position.set(2.5, 1.4, 7.3);
  scene.add(switchMesh);

  const fenceGroup = new THREE.Group();
  const arcMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 4.0,
    transparent: true,
    opacity: 0.8
  });
  const arcBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 8), arcMat);
  arcBeam.rotation.z = Math.PI / 2;
  arcBeam.position.set(0, 1.5, 7);
  arcBeam.visible = false;
  fenceGroup.add(arcBeam);
  scene.add(fenceGroup);

  const electricFence = {
    group: fenceGroup,
    p1: new THREE.Vector3(-2.5, 0, 7),
    p2: new THREE.Vector3(2.5, 0, 7),
    active: false
  };

  const trapSwitch = {
    mesh: switchMesh,
    position: [2.5, 1.4, 7.3] as [number, number, number],
    active: false,
    cooldown: 0
  };

  // 16. Zombie Outbreak Breach & Spawn Points
  const zombieSpawns: [number, number, number][] = [
    [0, 0, -16],
    [-15, 0, -12],
    [15, 0, -12],
    [-22, 0, 0],
    [22, 0, 0],
    [-18, 0, 22],
    [18, 0, 22],
    [0, 0, 28]
  ];

  return {
    colliders,
    barricades,
    perkMachines,
    mysteryBox,
    packAPunch,
    hazardBarrels,
    burnBarrels,
    hangingLights,
    wallBuys,
    defenseBarriers,
    trapSwitch,
    electricFence,
    zombieSpawns
  };
}
