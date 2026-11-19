/**
 * Core 3D Game Simulation Engine for Outbreak: Dead Zone.
 * Implements 60fps physics, wave progression, tactical combat, barricade repair,
 * power-ups, perk machines, mystery box, pack-a-punch, and dynamic weather.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  WeaponDef,
  PerkType,
  PowerUpType,
  ActivePowerUp,
  WeatherType,
  ZombieType,
  PlayerStats,
  BulletProjectile
} from '../types/game';
import { WEAPON_DEFINITIONS, PERK_DEFINITIONS, CRAFTING_RECIPES } from './gameState';
import {
  createZombieModel,
  createOperativeModel,
  createWeaponModel,
  createPowerUpModel,
  createSentryTurretModel,
  createDefenseBarrierModel
} from './proceduralModels';
import { ParticleSystem } from './physicsAndParticles';
import { buildMap, MapElements } from './mapBuilder';
import { sound } from '../audio/soundEngine';
import { NetworkManager } from './networking';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onWeaponUpdate: (weapon: WeaponDef, isPap: boolean) => void;
  onRoundUpdate: (round: number, zombiesRemaining: number, isIntermission: boolean) => void;
  onPerksUpdate: (perks: PerkType[]) => void;
  onPowerUpsUpdate: (powerups: ActivePowerUp[]) => void;
  onWeatherUpdate: (weather: WeatherType) => void;
  onInteractPrompt: (prompt: string | null) => void;
  onHitMarker: (isHeadshot: boolean) => void;
  onGameOver: (stats: PlayerStats, roundSurvived: number) => void;
}

interface ActiveZombie {
  id: string;
  type: ZombieType;
  model: ReturnType<typeof createZombieModel>;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  isDead: boolean;
  targetPos: THREE.Vector3;
  atBarricadeId: string | null;
  // Realistic locomotion and animation kinematics
  walkCycle: number;
  staggerPhase: number;
  limpFactor: number;
  heading: number;
  flinchTimer: number;
  isLunging: boolean;
  hasStruckTarget: boolean;
  lastStrikeTime: number;
}

interface ActiveSentry {
  id: string;
  model: ReturnType<typeof createSentryTurretModel>;
  position: THREE.Vector3;
  ammo: number;
  maxAmmo: number;
  health: number;
  lastShotTime: number;
}

export class ZombieGameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;

  // Game World
  private mapElements!: MapElements;
  private particleSystem!: ParticleSystem;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Player & Operative
  private playerGroup!: THREE.Group;
  private playerOperative!: ReturnType<typeof createOperativeModel>;
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVel = new THREE.Vector3();
  private playerAngle: number = 0;
  private isGrounded: boolean = true;
  private isDowned: boolean = false;
  private reviveProgress: number = 0;
  private lastDamageTime: number = 0;

  // First-Person Camera, Viewmodel & Mouse Look
  private yaw: number = 0;
  private pitch: number = 0;
  private isPointerLocked: boolean = false;
  private viewmodelHolder!: THREE.Group;
  private viewmodelWeapon: THREE.Group | null = null;
  private tacticalFlashlight!: THREE.SpotLight;
  private verticalVel: number = 0;
  private walkBobTimer: number = 0;
  private viewmodelRecoilZ: number = 0;
  private viewmodelRecoilPitch: number = 0;
  private viewmodelSwayX: number = 0;
  private viewmodelSwayY: number = 0;

  // Player Weapon & Combat
  private currentWeapon: WeaponDef = { ...WEAPON_DEFINITIONS.m1911 };
  private isPapWeapon: boolean = false;
  private isReloading: boolean = false;
  private reloadTimer: number = 0;
  private lastShootTime: number = 0;
  private activePerks: Set<PerkType> = new Set();
  private activePowerUps: Map<PowerUpType, number> = new Map();

  // Wave / Round Manager
  private round: number = 1;
  private zombiesRemainingInWave: number = 6;
  private totalZombiesSpawned: number = 0;
  private totalZombiesForRound: number = 6;
  private isIntermission: boolean = false;
  private intermissionTimer: number = 0;
  private nextSpawnTimer: number = 0;

  // Entities
  private zombies: ActiveZombie[] = [];
  private sentries: ActiveSentry[] = [];
  private projectiles: BulletProjectile[] = [];
  private projectileMeshes: THREE.Mesh[] = [];
  private powerUpPickups: { type: PowerUpType; group: THREE.Group; position: THREE.Vector3; life: number }[] = [];
  private dyingZombies: {
    group: THREE.Group;
    collapseTimer: number;
    collapseDuration: number;
    fallAxis: 'x' | 'z';
    fallDir: number;
  }[] = [];
  private muzzleFlashLight!: THREE.PointLight;

  // Weather
  private weather: WeatherType = 'CLEAR_TWILIGHT';
  private weatherTimer: number = 0;

  // Player Stats
  private stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    points: 500, // starting points
    kills: 0,
    headshots: 0,
    revives: 0,
    downs: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 1000
  };

  // Tactical Bot Teammates
  private botTeammates: {
    id: string;
    name: string;
    model: ReturnType<typeof createOperativeModel>;
    position: THREE.Vector3;
    health: number;
    lastShot: number;
    isDowned: boolean;
  }[] = [];

  // Input State & Recoil Simulation
  private keys: Record<string, boolean> = {};
  private mousePos = new THREE.Vector2();
  private isMouseDown: boolean = false;
  private isAimingDownSights: boolean = false;
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private cameraShake: number = 0;

  // Realistic Recoil Physics State
  private recoilAngleClimb: number = 0;
  private recoilHorizOffset: number = 0;
  private continuousSprayCount: number = 0;

  // Mystery Box State
  private isBoxRolling: boolean = false;
  private boxRollTimer: number = 0;
  private boxRewardWeapon: string | null = null;

  // Network
  private network: NetworkManager;
  private skinId: string = 'specops';

  constructor(container: HTMLElement, skinId: string, weaponId: string, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.skinId = skinId;
    this.callbacks = callbacks;
    this.network = new NetworkManager('local_player_' + Math.random().toString(36).substring(2, 7));

    if (WEAPON_DEFINITIONS[weaponId]) {
      this.currentWeapon = { ...WEAPON_DEFINITIONS[weaponId] };
    }

    this.initWebGL();
    this.setupInputs();
    this.initScene();
    this.initBots();

    this.callbacks.onStatsUpdate(this.stats);
    this.callbacks.onWeaponUpdate(this.currentWeapon, this.isPapWeapon);
    this.callbacks.onRoundUpdate(this.round, this.zombiesRemainingInWave, this.isIntermission);

    sound.playRoundStart();
    this.startLoop();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      68,
      this.container.clientWidth / this.container.clientHeight,
      0.05,
      220
    );
    this.camera.position.set(0, 1.65, 0);

    // First-Person Viewmodel Rig (attached directly to camera so weapon remains in view)
    this.viewmodelHolder = new THREE.Group();
    this.viewmodelHolder.position.set(0.24, -0.22, -0.44);
    this.camera.add(this.viewmodelHolder);

    // Tactical Flashlight attached to camera
    this.tacticalFlashlight = new THREE.SpotLight(0xfff7ed, 3.5, 30, Math.PI / 4.5, 0.45, 1.2);
    this.tacticalFlashlight.position.set(0.15, -0.15, 0);
    this.camera.add(this.tacticalFlashlight);
    this.camera.add(this.tacticalFlashlight.target);
    this.tacticalFlashlight.target.position.set(0, 0, -5);

    // Modern Tactical Muzzle Flash PointLight
    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 14, 1.8);
    this.muzzleFlashLight.position.set(0.2, -0.15, -0.6);
    this.camera.add(this.muzzleFlashLight);

    this.scene.add(this.camera);

    // Studio Environment reflection map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  private initScene() {
    // 1. Atmosphere Lighting
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.024);

    this.hemiLight = new THREE.HemisphereLight(0x64748b, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfef08a, 1.6);
    this.dirLight.position.set(20, 35, 20);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.camera.left = -25;
    this.dirLight.shadow.camera.right = 25;
    this.dirLight.shadow.camera.top = 25;
    this.dirLight.shadow.camera.bottom = -25;
    this.scene.add(this.dirLight);

    // 2. Map & Props
    this.mapElements = buildMap(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);

    // 3. Player Operative Model (3rd person representation for bots / shadows)
    this.playerOperative = createOperativeModel(this.skinId);
    this.playerGroup = this.playerOperative.group;
    this.playerPos.set(0, 0, 0);
    this.playerGroup.position.copy(this.playerPos);
    // Hide upper head & torso from local FPS camera to prevent self-clipping
    this.playerOperative.head.visible = false;
    this.scene.add(this.playerGroup);

    // Attach current weapon to FPS viewmodel
    this.attachWeaponToPlayer();
  }

  private initBots() {
    // 2 AI tactical operative teammates ("Ghost" and "Soap")
    const botConfigs = [
      { id: 'bot_ghost', name: 'Ghost [AI]', skin: 'specops', offset: new THREE.Vector3(-3, 0, -2) },
      { id: 'bot_soap', name: 'Soap [AI]', skin: 'hazmat', offset: new THREE.Vector3(3, 0, -2) }
    ];

    botConfigs.forEach((b) => {
      const op = createOperativeModel(b.skin);
      op.group.position.copy(this.playerPos.clone().add(b.offset));
      const wModel = createWeaponModel('rifle', false);
      op.gunHolder.add(wModel);
      this.scene.add(op.group);

      this.botTeammates.push({
        id: b.id,
        name: b.name,
        model: op,
        position: op.group.position,
        health: 150,
        lastShot: 0,
        isDowned: false
      });
    });
  }

  private attachWeaponToPlayer() {
    this.playerOperative.gunHolder.clear();
    const thirdPersonWeapon = createWeaponModel(this.currentWeapon.id, this.isPapWeapon);
    this.playerOperative.gunHolder.add(thirdPersonWeapon);

    // Build FPS viewmodel attached directly to camera
    this.viewmodelHolder.clear();
    const fpWeapon = createWeaponModel(this.currentWeapon.id, this.isPapWeapon);
    // Scale and angle weapon so it sits authentically in FPS perspective
    fpWeapon.scale.set(0.85, 0.85, 0.85);
    fpWeapon.rotation.y = Math.PI + 0.08;
    fpWeapon.position.set(0, 0, 0);
    this.viewmodelHolder.add(fpWeapon);
    this.viewmodelWeapon = fpWeapon;
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);

    // Pointer lock for first-person mouse look
    this.container.addEventListener('click', this.handleContainerClick);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.handleResize);
  }

  private handleContainerClick = () => {
    if (document.pointerLockElement !== this.container) {
      try {
        this.container.requestPointerLock();
      } catch (e) {
        console.warn('Pointer lock request failed', e);
      }
    }
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.container;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    if (e.code === 'Space') {
      this.keys['space'] = true;
      if (this.isGrounded && !this.isDowned) {
        this.verticalVel = 5.8; // First-person jump velocity
        this.isGrounded = false;
      }
    }

    if (e.key === 'r' || e.key === 'R') {
      this.reloadWeapon();
    } else if (e.key === 'f' || e.key === 'F') {
      this.interactNearest();
    } else if (e.key === '1') {
      this.switchWeapon('m1911');
    } else if (e.key === '2') {
      this.switchWeapon('shotgun');
    } else if (e.key === '3') {
      this.switchWeapon('rifle');
    } else if (e.key === '4') {
      this.switchWeapon('raygun');
    } else if (e.key === '5') {
      this.switchWeapon('minigun');
    } else if (e.key === 'm' || e.key === 'M') {
      sound.toggleMute();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    if (e.code === 'Space') {
      this.keys['space'] = false;
    }
  };

  private handleBlur = () => {
    this.keys = {};
    this.isMouseDown = false;
    this.isAimingDownSights = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    // In First-Person: pointer lock controls yaw & pitch
    if (this.isPointerLocked) {
      const sens = 0.0022;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      // Clamp pitch to prevent over-rotation / neck snap
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));

      // Viewmodel inertia sway
      this.viewmodelSwayX = THREE.MathUtils.clamp(this.viewmodelSwayX - e.movementX * 0.0002, -0.04, 0.04);
      this.viewmodelSwayY = THREE.MathUtils.clamp(this.viewmodelSwayY - e.movementY * 0.0002, -0.04, 0.04);
    } else {
      const rect = this.container.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
      if (!this.currentWeapon.isAutomatic) {
        this.shootBullet();
      }
    } else if (e.button === 2) {
      this.isAimingDownSights = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    } else if (e.button === 2) {
      this.isAimingDownSights = false;
    }
  };

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // Mobile virtual joystick input bridge for First-Person
  public setVirtualMove(dx: number, dy: number) {
    this.keys['w'] = dy < -0.2;
    this.keys['s'] = dy > 0.2;
    this.keys['a'] = dx < -0.2;
    this.keys['d'] = dx > 0.2;
  }

  public setVirtualAimDelta(deltaYaw: number, deltaPitch: number) {
    this.yaw -= deltaYaw;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - deltaPitch));
  }

  public setVirtualAim(angle: number) {
    this.yaw = angle;
  }

  public triggerVirtualJump() {
    if (this.isGrounded && !this.isDowned) {
      this.verticalVel = 5.8;
      this.isGrounded = false;
    }
  }

  public triggerVirtualADS(active?: boolean) {
    this.isAimingDownSights = active !== undefined ? active : !this.isAimingDownSights;
  }

  public triggerVirtualShoot(active: boolean) {
    this.isMouseDown = active;
    if (active && !this.currentWeapon.isAutomatic) {
      this.shootBullet();
    }
  }

  public triggerVirtualReload() {
    this.reloadWeapon();
  }

  public triggerVirtualInteract() {
    this.interactNearest();
  }

  /**
   * Main 60fps Game Simulation Tick
   */
  private startLoop() {
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamped delta time

      this.updateSimulation(dt);
      this.renderScene();

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private updateSimulation(dt: number) {
    if (this.isDowned) {
      // Downed crawl state
      if (this.activePerks.has('QUICK_REVIVE')) {
        this.reviveProgress += dt * 0.25;
        if (this.reviveProgress >= 1) {
          this.revivePlayer();
        }
      }
      return;
    }

    // 1. Aiming calculation with recoil recovery in First-Person
    const pattern = this.currentWeapon.recoilPattern;
    const recRecovery = pattern.recoverySpeed * dt;
    this.recoilAngleClimb = Math.max(0, this.recoilAngleClimb - recRecovery * 0.05);
    this.recoilHorizOffset = THREE.MathUtils.damp(this.recoilHorizOffset, 0, pattern.recoverySpeed, dt);

    if (!this.isMouseDown) {
      this.continuousSprayCount = Math.max(0, this.continuousSprayCount - dt * 6);
    }

    // Player body faces camera yaw
    this.playerAngle = this.yaw;
    this.playerGroup.rotation.y = this.yaw;

    // 2. First-Person Movement Physics (WASD relative to camera look direction)
    let speed = 7.5;
    if (this.activePerks.has('STAMIN_UP')) speed *= 1.3;
    if (this.isAimingDownSights) speed *= 0.65;
    if (this.keys['shift']) speed *= 1.35; // Sprint

    // Forward and strafe vectors on horizontal ground plane
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['w'] || this.keys['arrowup']) moveDir.add(forward);
    if (this.keys['s'] || this.keys['arrowdown']) moveDir.sub(forward);
    if (this.keys['d'] || this.keys['arrowright']) moveDir.add(right);
    if (this.keys['a'] || this.keys['arrowleft']) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();
      const nextX = this.playerPos.x + moveDir.x * speed * dt;
      const nextZ = this.playerPos.z + moveDir.z * speed * dt;

      // Map boundary and collider checks
      if (nextX >= -24 && nextX <= 24 && !this.checkCollision(nextX, this.playerPos.z)) {
        this.playerPos.x = nextX;
      }
      if (nextZ >= -23 && nextZ <= 25 && !this.checkCollision(this.playerPos.x, nextZ)) {
        this.playerPos.z = nextZ;
      }

      if (this.isGrounded) {
        this.walkBobTimer += dt * (this.keys['shift'] ? 14 : 10);
      }
    } else {
      this.walkBobTimer = THREE.MathUtils.damp(this.walkBobTimer, 0, 8, dt);
    }

    // Vertical Jump & Gravity Integration
    if (!this.isGrounded) {
      this.verticalVel -= 18.0 * dt;
      this.playerPos.y += this.verticalVel * dt;
      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.verticalVel = 0;
        this.isGrounded = true;
      }
    }

    this.playerGroup.position.copy(this.playerPos);

    // 3. First-Person Viewmodel Animation & Positioning
    this.updateFirstPersonViewmodel(dt, isMoving);

    // 4. World at War Dynamic Fire & Light Flickering
    this.updateWaWLighting(dt);

    // 5. Weapon Automatic Firing
    if (this.isMouseDown && this.currentWeapon.isAutomatic) {
      this.shootBullet();
    }

    // 6. Reload Timer (Speed Cola cuts reload time by over 50%)
    if (this.isReloading) {
      let speedMult = 1.0;
      if (this.activePerks.has('SPEED_COLA')) speedMult = 2.2;
      this.reloadTimer += dt * speedMult;
      if (this.reloadTimer >= this.currentWeapon.reloadTime) {
        this.finishReload();
      }
    }

    // 6b. Natural Health Regeneration (Authentic Call of Duty Zombies System)
    if (!this.isDowned && this.stats.health < this.stats.maxHealth) {
      const now = performance.now() / 1000;
      // Delay before regeneration starts: 4.5s normally, 2.5s with Quick Revive or Juggernog
      const regenDelay = (this.activePerks.has('QUICK_REVIVE') || this.activePerks.has('JUGGERNOG')) ? 2.5 : 4.5;
      if (now - this.lastDamageTime >= regenDelay) {
        const regenRate = this.activePerks.has('JUGGERNOG') ? 65 : 35; // HP/sec
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + regenRate * dt);
        sound.updateLowHealthHeartbeat(this.stats.health < 35);
        this.callbacks.onStatsUpdate(this.stats);
      }
    }

    // 7. Update Projectiles with Ballistics & Penetration
    this.updateProjectiles(dt);

    // 8. Update Zombies, Dying Ragdolls & Wave Logic
    this.updateZombies(dt);
    this.updateDyingZombies(dt);
    this.updateWaveManager(dt);

    // 9. Update Sentries & Traps
    this.updateSentries(dt);
    this.updateElectricTrap(dt);

    // 10. Update Tactical AI Bots
    this.updateBots(dt);

    // 11. Update Power-ups & Weather
    this.updatePowerUps(dt);
    this.updateWeatherCycle(dt);

    // 12. Update Particles & Camera
    this.particleSystem.update(dt, this.weather);
    this.updateCamera(dt);
    this.checkInteractionNearPlayer();
  }

  private updateFirstPersonViewmodel(dt: number, isMoving: boolean) {
    if (!this.viewmodelHolder) return;

    // Interpolate FOV for ADS zoom (Speed Cola gives fast hands snappier readying)
    const targetFov = this.isAimingDownSights ? 50 : 68;
    const adsSpeed = this.activePerks.has('SPEED_COLA') ? 20 : 12;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, adsSpeed, dt);
    this.camera.updateProjectionMatrix();

    // Target Viewmodel Positions (Hip-fire vs Centered Aim Down Sights)
    const hipPos = new THREE.Vector3(0.22, -0.21, -0.42);
    const adsPos = new THREE.Vector3(0.0, -0.155, -0.32);
    const targetPos = this.isAimingDownSights ? adsPos : hipPos;

    // Walking weapon bob
    const bobX = isMoving && this.isGrounded && !this.isAimingDownSights ? Math.cos(this.walkBobTimer * 0.5) * 0.008 : 0;
    const bobY = isMoving && this.isGrounded && !this.isAimingDownSights ? Math.sin(this.walkBobTimer) * 0.006 : 0;

    // Viewmodel reload dip (Speed Cola snappy reload)
    const reloadDip = this.isReloading ? (this.activePerks.has('SPEED_COLA') ? -0.08 : -0.12) : 0;

    // Smooth position interpolation
    const posDamp = this.activePerks.has('SPEED_COLA') ? 20 : 14;
    this.viewmodelHolder.position.x = THREE.MathUtils.damp(
      this.viewmodelHolder.position.x,
      targetPos.x + bobX + this.viewmodelSwayX,
      posDamp,
      dt
    );
    this.viewmodelHolder.position.y = THREE.MathUtils.damp(
      this.viewmodelHolder.position.y,
      targetPos.y + bobY + reloadDip + this.viewmodelSwayY,
      posDamp,
      dt
    );
    this.viewmodelHolder.position.z = THREE.MathUtils.damp(
      this.viewmodelHolder.position.z,
      targetPos.z + this.viewmodelRecoilZ,
      16,
      dt
    );

    // Viewmodel Recoil Recovery
    this.viewmodelRecoilZ = THREE.MathUtils.damp(this.viewmodelRecoilZ, 0, 18, dt);
    this.viewmodelRecoilPitch = THREE.MathUtils.damp(this.viewmodelRecoilPitch, 0, 18, dt);

    // Viewmodel Sway Decay
    this.viewmodelSwayX = THREE.MathUtils.damp(this.viewmodelSwayX, 0, 8, dt);
    this.viewmodelSwayY = THREE.MathUtils.damp(this.viewmodelSwayY, 0, 8, dt);

    // Viewmodel rotation pitch on fire & sway
    this.viewmodelHolder.rotation.x = this.viewmodelRecoilPitch + (this.isReloading ? 0.35 : 0);
    this.viewmodelHolder.rotation.y = this.viewmodelSwayX * 2;

    // Tactical Muzzle Flash PointLight Decay
    if (this.muzzleFlashLight) {
      this.muzzleFlashLight.intensity = THREE.MathUtils.damp(this.muzzleFlashLight.intensity, 0, 35, dt);
    }
  }

  private updateWaWLighting(dt: number) {
    // Dynamic flickering of WWII burn barrels and hanging cage lamps
    const now = performance.now() * 0.008;
    this.mapElements.burnBarrels.forEach((bb, idx) => {
      bb.light.intensity = 2.8 + Math.sin(now + idx * 1.7) * 0.6 + (Math.random() - 0.5) * 0.3;
      bb.flameCore.scale.set(
        1 + Math.sin(now * 2 + idx) * 0.1,
        1 + Math.cos(now * 3 + idx) * 0.15,
        1 + Math.sin(now * 2 + idx) * 0.1
      );
    });

    this.mapElements.hangingLights.forEach((lamp, idx) => {
      lamp.light.intensity = 2.2 + (Math.random() > 0.98 ? -0.8 : 0) + Math.sin(now * 0.5 + idx) * 0.2;
    });

    // Dynamic neon pulse & subtle tube flicker for Perk-a-Cola Vending Machines
    this.mapElements.perkMachines.forEach((pm, idx) => {
      if (pm.light) {
        const flicker = Math.random() > 0.985 ? -0.4 : 0;
        pm.light.intensity = 2.6 + Math.sin(now * 2.5 + idx * 1.8) * 0.25 + flicker;
      }
    });
  }

  private checkCollision(x: number, z: number): boolean {
    const pBox = new THREE.Box3(
      new THREE.Vector3(x - 0.4, 0, z - 0.4),
      new THREE.Vector3(x + 0.4, 2, z + 0.4)
    );
    for (const c of this.mapElements.colliders) {
      if (c.intersectsBox(pBox)) return true;
    }
    return false;
  }

  private shootBullet() {
    if (this.isReloading || this.isDowned) return;

    if (this.currentWeapon.magSize <= 0) {
      this.reloadWeapon();
      return;
    }

    const now = performance.now() / 1000;
    let rate = this.currentWeapon.fireRate;
    if (this.activePerks.has('DOUBLE_TAP')) rate *= 1.35;

    if (now - this.lastShootTime < 1 / rate) return;
    this.lastShootTime = now;

    this.currentWeapon.magSize--;
    this.callbacks.onWeaponUpdate(this.currentWeapon, this.isPapWeapon);

    // Apply distinct realistic weapon recoil patterns
    const pattern = this.currentWeapon.recoilPattern;
    this.continuousSprayCount++;

    // Muzzle climb & horizontal kick with compensation limit
    const sprayFactor = Math.min(1.8, 1 + this.continuousSprayCount * 0.08);
    const horizKick = (Math.random() - 0.5) * pattern.horizontalKick * sprayFactor;
    this.recoilHorizOffset += horizKick;
    this.recoilAngleClimb = Math.min(pattern.maxClimb, this.recoilAngleClimb + pattern.climbPerShot * sprayFactor);

    // Sound & camera recoil feedback
    sound.playGunshot(this.currentWeapon.type, this.isPapWeapon);
    const kickMagnitude = (pattern.verticalKick + this.currentWeapon.recoil) * (this.isAimingDownSights ? 0.6 : 1.0);
    this.cameraShake = THREE.MathUtils.clamp(this.cameraShake + kickMagnitude * 1.6, 0, 0.55);

    // First-Person Viewmodel recoil impulse & modern dynamic muzzle flash
    this.viewmodelRecoilZ = 0.055;
    this.viewmodelRecoilPitch = 0.075;
    if (this.muzzleFlashLight) {
      this.muzzleFlashLight.intensity = this.isPapWeapon ? 8.5 : 6.0;
      this.muzzleFlashLight.color.set(this.isPapWeapon ? 0xcc66ff : 0xffaa33);
    }

    // Get First-Person Camera Look Direction
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    // Projectile Origin (just in front of First-Person camera)
    const origin = this.camera.position.clone().add(camDir.clone().multiplyScalar(0.4));
    origin.y -= 0.06; // slight down-offset to align with viewmodel muzzle

    const pellets = this.currentWeapon.pellets;
    const maxPen = (this.currentWeapon.maxPenetration || 1) * (this.isPapWeapon ? 2 : 1);
    const penRet = this.isPapWeapon ? 0.88 : (this.currentWeapon.penetrationRetention || 0.7);

    for (let i = 0; i < pellets; i++) {
      // Dynamic spread influenced by continuous spray count and weapon base spread
      const effectiveSpread = this.currentWeapon.spread * (this.isAimingDownSights ? 0.35 : 1.0) * (1 + this.continuousSprayCount * 0.05);
      const spreadX = (Math.random() - 0.5) * effectiveSpread;
      const spreadY = (Math.random() - 0.5) * effectiveSpread;

      // Perturb look direction by spread
      const bulletDir = camDir.clone();
      bulletDir.x += spreadX;
      bulletDir.y += spreadY;
      bulletDir.normalize();

      const initialVerticalVel = bulletDir.y * this.currentWeapon.bulletSpeed;

      const proj: BulletProjectile = {
        id: Math.random().toString(36),
        origin: [origin.x, origin.y, origin.z],
        currentPos: [origin.x, origin.y, origin.z],
        velocity: [
          bulletDir.x * this.currentWeapon.bulletSpeed,
          initialVerticalVel,
          bulletDir.z * this.currentWeapon.bulletSpeed
        ],
        damage:
          this.currentWeapon.damage *
          (this.isPapWeapon ? 2.2 : 1.0) *
          (this.activePerks.has('DOUBLE_TAP') ? 1.25 : 1.0),
        isPap: this.isPapWeapon,
        color: this.isPapWeapon ? this.currentWeapon.papColor || '#a855f7' : this.currentWeapon.color,
        rangeRemaining: this.currentWeapon.range,
        ownerId: 'player',
        penetrationsLeft: maxPen,
        penetratedIds: [],
        bulletDrop: this.currentWeapon.bulletDrop || 0,
        penetrationRetention: penRet
      };
      this.projectiles.push(proj);

      // Create visible glowing tracer mesh with ballistic orientation
      const traceMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.55),
        new THREE.MeshBasicMaterial({ color: proj.color })
      );
      traceMesh.position.copy(origin);
      traceMesh.lookAt(origin.clone().add(bulletDir));
      this.scene.add(traceMesh);
      this.projectileMeshes.push(traceMesh);
    }

    if (this.currentWeapon.magSize === 0) {
      this.reloadWeapon();
    }
  }

  private reloadWeapon() {
    if (this.isReloading || this.currentWeapon.reserveAmmo <= 0) return;
    const maxMag = WEAPON_DEFINITIONS[this.currentWeapon.id]?.magSize || 8;
    const targetMag = this.isPapWeapon ? maxMag * 2 : maxMag;
    if (this.currentWeapon.magSize >= targetMag) return;

    this.isReloading = true;
    this.reloadTimer = 0;
    this.continuousSprayCount = 0;
    sound.playReload();
  }

  private finishReload() {
    const maxMag = WEAPON_DEFINITIONS[this.currentWeapon.id]?.magSize || 8;
    const targetMag = this.isPapWeapon ? maxMag * 2 : maxMag;
    const needed = targetMag - this.currentWeapon.magSize;
    const loaded = Math.min(needed, this.currentWeapon.reserveAmmo);

    this.currentWeapon.magSize += loaded;
    this.currentWeapon.reserveAmmo -= loaded;
    this.isReloading = false;
    this.callbacks.onWeaponUpdate(this.currentWeapon, this.isPapWeapon);
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const mesh = this.projectileMeshes[i];

      // 1. Ballistic Trajectory Integration: Apply gravity drop over distance
      if (p.bulletDrop > 0) {
        p.velocity[1] -= p.bulletDrop * dt;
      }

      const dx = p.velocity[0] * dt;
      const dy = p.velocity[1] * dt;
      const dz = p.velocity[2] * dt;

      p.currentPos[0] += dx;
      p.currentPos[1] += dy;
      p.currentPos[2] += dz;

      const stepDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      p.rangeRemaining -= stepDist;

      // Update 3D tracer position & pitch angle reflecting drop arc
      mesh.position.set(p.currentPos[0], p.currentPos[1], p.currentPos[2]);
      const horizSpeed = Math.sqrt(p.velocity[0] * p.velocity[0] + p.velocity[2] * p.velocity[2]);
      mesh.rotation.x = -Math.atan2(p.velocity[1], horizSpeed);

      // 2. Collision checks with Penetration
      // Check ground impact
      if (p.currentPos[1] <= 0.05) {
        this.particleSystem.spawnSparks(new THREE.Vector3(...p.currentPos));
        this.removeProjectile(i);
        continue;
      }

      // Check materials & walls
      const hitWall = this.checkBulletMaterialHit(p);
      if (hitWall && p.penetrationsLeft <= 0) {
        this.removeProjectile(i);
        continue;
      }

      // Check zombie penetration hits
      const hitZombie = this.checkBulletZombieHit(p);
      if (hitZombie && p.penetrationsLeft <= 0) {
        this.removeProjectile(i);
        continue;
      }

      // Check explosive barrels
      const hitBarrel = this.checkBulletBarrelHit(p);
      if (hitBarrel && p.penetrationsLeft <= 0) {
        this.removeProjectile(i);
        continue;
      }

      if (p.rangeRemaining <= 0) {
        this.removeProjectile(i);
      }
    }
  }

  private removeProjectile(index: number) {
    const mesh = this.projectileMeshes[index];
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.projectiles.splice(index, 1);
    this.projectileMeshes.splice(index, 1);
  }

  /**
   * Material density penetration: bullets can pierce wooden barricade planks,
   * thin structures, or ricochet with sparks off heavy reinforced concrete.
   */
  private checkBulletMaterialHit(p: BulletProjectile): boolean {
    const pPos = new THREE.Vector3(...p.currentPos);

    // 1. Wooden Barricades (Low density - can be penetrated)
    for (const b of this.mapElements.barricades) {
      if (b.state.planks <= 0) continue;
      const bPos = new THREE.Vector3(...b.state.position);
      if (pPos.distanceTo(bPos) < 1.4 && Math.abs(pPos.y - 1.0) < 1.0) {
        if (!p.penetratedIds.includes(b.state.id)) {
          p.penetratedIds.push(b.state.id);
          p.penetrationsLeft--;
          p.damage *= p.penetrationRetention;
          this.particleSystem.spawnSparks(pPos);
          return true;
        }
      }
    }

    // 2. Reinforced Concrete Bunker Walls (High density)
    const pBox = new THREE.Box3(
      new THREE.Vector3(pPos.x - 0.15, pPos.y - 0.15, pPos.z - 0.15),
      new THREE.Vector3(pPos.x + 0.15, pPos.y + 0.15, pPos.z + 0.15)
    );

    for (let wIdx = 0; wIdx < this.mapElements.colliders.length; wIdx++) {
      const c = this.mapElements.colliders[wIdx];
      if (c.intersectsBox(pBox)) {
        const wallId = `wall_${wIdx}`;
        if (!p.penetratedIds.includes(wallId)) {
          // If Pack-a-Punched high caliber, can penetrate 1 wall layer; else stop bullet
          if (p.isPap && p.penetrationsLeft >= 2) {
            p.penetratedIds.push(wallId);
            p.penetrationsLeft -= 2; // high density cost
            p.damage *= 0.55;
            this.particleSystem.spawnSparks(pPos);
            return false; // let it pass through
          } else {
            p.penetrationsLeft = 0;
            this.particleSystem.spawnSparks(pPos);
            return true; // blocked
          }
        }
      }
    }

    return false;
  }

  private checkBulletZombieHit(p: BulletProjectile): boolean {
    const pPos = new THREE.Vector3(...p.currentPos);

    for (const z of this.zombies) {
      if (z.isDead) continue;
      if (p.penetratedIds.includes(z.id)) continue; // already hit this enemy

      const dist = pPos.distanceTo(z.position);
      const hitRadius = z.type === 'BRUTE_BOSS' ? 1.6 : 0.85;

      if (dist < hitRadius) {
        // Record penetration on this specific enemy
        p.penetratedIds.push(z.id);
        p.penetrationsLeft--;

        // Headshot detection: bullet in top hemisphere of target
        const isHeadshot = pPos.y > (z.type === 'BRUTE_BOSS' ? 2.1 : 1.45);
        let dmg = p.damage;
        if (isHeadshot) dmg *= 2.5;
        if (this.activePowerUps.has('INSTA_KILL')) dmg = 99999;

        z.health -= dmg;
        sound.playHitMarker(isHeadshot);
        this.callbacks.onHitMarker(isHeadshot);

        // Blood burst, physics impulse & visceral flinch reaction
        this.particleSystem.spawnBlood(pPos, isHeadshot);
        const impulse = new THREE.Vector3(p.velocity[0], 0, p.velocity[2]).normalize().multiplyScalar(isHeadshot ? 4.5 : 2.5);
        z.velocity.add(impulse);
        z.flinchTimer = 0.24;

        // Score points
        let pts = 10;
        if (this.activePowerUps.has('DOUBLE_POINTS')) pts *= 2;
        this.stats.points += pts;
        this.stats.xp += 15;

        if (z.health <= 0) {
          this.killZombie(z, isHeadshot);
        }

        // Damage retention for subsequent targets if bullet penetrates
        if (p.penetrationsLeft > 0) {
          p.damage *= p.penetrationRetention;
        }

        this.callbacks.onStatsUpdate(this.stats);
        return true;
      }
    }
    return false;
  }

  private checkBulletBarrelHit(p: BulletProjectile): boolean {
    const pPos = new THREE.Vector3(...p.currentPos);
    for (const b of this.mapElements.hazardBarrels) {
      if (b.exploded) continue;
      if (pPos.distanceTo(b.position) < 0.9) {
        b.health -= p.damage;
        this.particleSystem.spawnSparks(pPos);
        if (b.health <= 0) {
          this.detonateHazardBarrel(b);
        }
        return true;
      }
    }
    return false;
  }

  private detonateHazardBarrel(b: (typeof this.mapElements.hazardBarrels)[0]) {
    b.exploded = true;
    this.scene.remove(b.group);
    sound.playPowerUp('NUKE');
    this.particleSystem.spawnExplosion(b.position, 6);
    this.cameraShake = 0.5;

    // Damage all zombies within 7m radius
    for (const z of this.zombies) {
      if (z.isDead) continue;
      const dist = z.position.distanceTo(b.position);
      if (dist < 7.5) {
        const falloff = 1 - dist / 7.5;
        z.health -= 380 * falloff;
        if (z.health <= 0) {
          this.killZombie(z, false);
        }
      }
    }
  }

  private killZombie(z: ActiveZombie, isHeadshot: boolean) {
    z.isDead = true;
    this.stats.kills++;
    if (isHeadshot) this.stats.headshots++;

    let killPts = isHeadshot ? 100 : 60;
    if (this.activePowerUps.has('DOUBLE_POINTS')) killPts *= 2;
    this.stats.points += killPts;
    this.stats.xp += isHeadshot ? 120 : 80;

    // Power-up Drop Chance (~6%)
    if (Math.random() < 0.08) {
      const types: PowerUpType[] = ['NUKE', 'INSTA_KILL', 'MAX_AMMO', 'DOUBLE_POINTS', 'CARPENTER', 'FIRE_SALE'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.spawnPowerUpPickup(chosen, z.position.clone());
    }

    // Realistic death crumble & stumble ragdoll
    const fallDir = Math.random() > 0.45 ? 1 : -1;
    this.dyingZombies.push({
      group: z.model.group,
      collapseTimer: 0,
      collapseDuration: 1.1,
      fallAxis: 'x',
      fallDir
    });
    this.particleSystem.spawnBlood(z.position.clone(), isHeadshot);

    this.zombiesRemainingInWave--;
    this.callbacks.onRoundUpdate(this.round, this.zombiesRemainingInWave, this.isIntermission);
  }

  private updateDyingZombies(dt: number) {
    for (let i = this.dyingZombies.length - 1; i >= 0; i--) {
      const dz = this.dyingZombies[i];
      dz.collapseTimer += dt;
      const progress = dz.collapseTimer / dz.collapseDuration;

      // Realistic ragdoll pitch / fall to ground
      dz.group.rotation.x = THREE.MathUtils.lerp(dz.group.rotation.x, (Math.PI / 2) * dz.fallDir, dt * 6.5);
      dz.group.position.y = Math.max(0.12, dz.group.position.y - dt * 1.4);

      if (progress >= 1.0) {
        this.scene.remove(dz.group);
        this.dyingZombies.splice(i, 1);
      }
    }
  }

  private spawnPowerUpPickup(type: PowerUpType, pos: THREE.Vector3) {
    const group = createPowerUpModel(type);
    group.position.copy(pos);
    this.scene.add(group);
    this.powerUpPickups.push({
      type,
      group,
      position: pos,
      life: 25 // 25 seconds before despawn
    });
  }

  private updatePowerUps(dt: number) {
    // 1. Pickups on ground
    for (let i = this.powerUpPickups.length - 1; i >= 0; i--) {
      const p = this.powerUpPickups[i];
      p.life -= dt;
      p.group.rotation.y += 2.5 * dt;
      p.group.position.y = 0.2 + Math.sin(Date.now() * 0.005) * 0.15;

      // Player collects pickup
      if (p.position.distanceTo(this.playerPos) < 1.6) {
        this.activatePowerUp(p.type);
        this.scene.remove(p.group);
        this.powerUpPickups.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.group);
        this.powerUpPickups.splice(i, 1);
      }
    }

    // 2. Active Power-up countdowns
    const activeList: ActivePowerUp[] = [];
    this.activePowerUps.forEach((timeLeft, type) => {
      const remaining = timeLeft - dt;
      if (remaining <= 0) {
        this.activePowerUps.delete(type);
      } else {
        this.activePowerUps.set(type, remaining);
        activeList.push({ type, timeLeft: Math.ceil(remaining) });
      }
    });
    this.callbacks.onPowerUpsUpdate(activeList);
  }

  private activatePowerUp(type: PowerUpType) {
    sound.playPowerUp(type);

    if (type === 'NUKE') {
      // Obliterate all current zombies on map
      for (const z of this.zombies) {
        if (!z.isDead) {
          z.health = 0;
          this.killZombie(z, false);
        }
      }
      this.stats.points += 400;
      this.cameraShake = 0.6;
    } else if (type === 'MAX_AMMO') {
      // Refill player ammo reserve
      this.currentWeapon.reserveAmmo = this.currentWeapon.maxReserve;
      this.callbacks.onWeaponUpdate(this.currentWeapon, this.isPapWeapon);
    } else if (type === 'CARPENTER') {
      // Rebuild all barricade window planks
      this.mapElements.barricades.forEach((b) => {
        b.state.planks = 4;
        b.model.plankMeshes.forEach((m) => (m.visible = true));
      });
      this.stats.points += 200;
    } else {
      // Timed power-ups (30 seconds)
      this.activePowerUps.set(type, 30);
    }

    this.callbacks.onStatsUpdate(this.stats);
  }

  private updateZombies(dt: number) {
    const now = performance.now() / 1000;

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.isDead) {
        this.zombies.splice(i, 1);
        continue;
      }

      // 1. Check if zombie is blocked by and attacking a placed defense barrier
      let atBarrier = false;
      for (let bIdx = this.mapElements.defenseBarriers.length - 1; bIdx >= 0; bIdx--) {
        const bar = this.mapElements.defenseBarriers[bIdx];
        if (bar.health > 0 && z.position.distanceTo(bar.position) < 1.75) {
          atBarrier = true;
          z.attackCooldown += dt;

          // Realistic clawing and pounding against the defense barricade
          z.model.leftArm.rotation.x = -1.35 + Math.sin(Date.now() * 0.012) * 0.4;
          z.model.rightArm.rotation.x = -1.35 - Math.sin(Date.now() * 0.012) * 0.4;

          if (z.attackCooldown >= 1.05) {
            z.attackCooldown = 0;
            bar.health -= z.damage * 0.75;
            sound.playRepairPlank();
            this.particleSystem.spawnSparks(bar.position);

            if (bar.model.healthBar) {
              bar.model.healthBar.scale.x = Math.max(0.01, bar.health / bar.maxHealth);
              bar.model.healthBar.visible = true;
            }

            if (bar.health <= 0) {
              this.scene.remove(bar.model.group);
              this.particleSystem.spawnExplosion(bar.position, 2.4);
              this.mapElements.defenseBarriers.splice(bIdx, 1);
            }
          }
          break;
        }
      }
      if (atBarrier) continue;

      // 2. Check if zombie is at a window barricade
      const nearestBarricade = this.getNearestBarricade(z.position);
      if (
        nearestBarricade &&
        nearestBarricade.state.planks > 0 &&
        z.position.distanceTo(new THREE.Vector3(...nearestBarricade.state.position)) < 2.0
      ) {
        // Tear down plank with realistic clawing motion
        z.attackCooldown += dt;
        z.model.leftArm.rotation.x = -1.2 + Math.sin(Date.now() * 0.01) * 0.35;
        z.model.rightArm.rotation.x = -1.2 - Math.sin(Date.now() * 0.01) * 0.35;

        if (z.attackCooldown >= 1.4) {
          z.attackCooldown = 0;
          nearestBarricade.state.planks--;
          const plankIndex = nearestBarricade.state.planks;
          if (nearestBarricade.model.plankMeshes[plankIndex]) {
            nearestBarricade.model.plankMeshes[plankIndex].visible = false;
          }
          sound.playRepairPlank();
        }
        continue;
      }

      // 3. Move toward closest live human/bot
      let targetPos = this.playerPos;
      let closestDist = z.position.distanceTo(this.playerPos);
      let targetBot: (typeof this.botTeammates)[0] | null = null;

      this.botTeammates.forEach((bot) => {
        if (!bot.isDowned) {
          const d = z.position.distanceTo(bot.position);
          if (d < closestDist) {
            closestDist = d;
            targetPos = bot.position;
            targetBot = bot;
          }
        }
      });

      const dir = new THREE.Vector3().subVectors(targetPos, z.position);
      dir.y = 0;
      const dist = dir.length();

      // Determine if zombie enters an aggressive forward lunge
      z.isLunging = dist < 3.2 && dist > 1.25;
      const effectiveSpeed = z.isLunging ? z.speed * 1.35 : z.speed;

      if (dist > 0.1) {
        dir.normalize();

        // Realistic Turn Inertia (Smooth angular damping instead of snapping)
        const targetAngle = Math.atan2(dir.x, dir.z);
        let angleDiff = targetAngle - z.heading;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        z.heading += angleDiff * Math.min(1.0, 5.2 * dt);
        z.model.group.rotation.y = z.heading;

        // Realistic Gait Kinematics & Flinching
        if (z.flinchTimer > 0) {
          z.flinchTimer -= dt;
          // Torso recoils back on impact
          if (z.model.torso) z.model.torso.rotation.x = -0.32;
          z.model.head.rotation.x = -0.22;
        } else {
          z.walkCycle += dt * (effectiveSpeed * 2.8);
          const limp = Math.sin(z.walkCycle + z.staggerPhase) * z.limpFactor;

          // Torso roll & pitch with limp
          if (z.model.torso) {
            z.model.torso.rotation.z = limp * 0.12;
            z.model.torso.rotation.x =
              (z.type === 'CRAWLER' ? 1.25 : z.type === 'SPRINTER' ? 0.42 : 0.22) +
              Math.sin(z.walkCycle * 2) * 0.05;
          }

          // Head erratic twitching
          z.model.head.rotation.y = Math.sin(z.walkCycle * 0.7) * 0.18;
          z.model.head.rotation.x = (z.isLunging ? 0.35 : 0.1) + Math.cos(z.walkCycle * 1.3) * 0.08;

          // Asymmetric clawing arm locomotion
          if (z.isLunging) {
            z.model.leftArm.rotation.x = -1.4 + Math.sin(z.walkCycle * 2.5) * 0.4;
            z.model.rightArm.rotation.x = -1.4 - Math.sin(z.walkCycle * 2.5) * 0.4;
          } else if (z.type === 'SPRINTER') {
            z.model.leftArm.rotation.x = Math.sin(z.walkCycle * 2) * 0.85 - 0.7;
            z.model.rightArm.rotation.x = -Math.sin(z.walkCycle * 2) * 0.85 - 0.7;
          } else if (z.type === 'CRAWLER') {
            z.model.leftArm.rotation.x = Math.sin(z.walkCycle) * 0.6 - 1.2;
            z.model.rightArm.rotation.x = -Math.sin(z.walkCycle) * 0.6 - 1.2;
          } else {
            z.model.leftArm.rotation.x = -0.85 + Math.sin(z.walkCycle) * 0.35;
            z.model.leftArm.rotation.z = 0.22 + Math.cos(z.walkCycle) * 0.12;
            z.model.rightArm.rotation.x = -0.7 - Math.cos(z.walkCycle + 0.4) * 0.3;
            z.model.rightArm.rotation.z = -0.2 - Math.sin(z.walkCycle) * 0.12;
          }
        }

        // Variable step momentum
        const stepMod = z.isLunging ? 1.0 : 0.75 + Math.max(0, Math.sin(z.walkCycle) * 0.45);
        z.position.x += (dir.x * effectiveSpeed * stepMod + z.velocity.x) * dt;
        z.position.z += (dir.z * effectiveSpeed * stepMod + z.velocity.z) * dt;
        z.velocity.multiplyScalar(0.82);
      }

      z.model.group.position.copy(z.position);

      // 4. Attack player if in melee reach
      if (z.position.distanceTo(this.playerPos) < 1.35) {
        z.attackCooldown += dt;
        if (z.attackCooldown >= 1.15) {
          z.attackCooldown = 0;
          this.damagePlayer(z.damage, z);
          sound.playZombieGrowl(z.type);
        }
      }

      // 5. Attack bot if in melee reach
      if (targetBot && z.position.distanceTo((targetBot as any).position) < 1.35) {
        z.attackCooldown += dt;
        if (z.attackCooldown >= 1.2) {
          z.attackCooldown = 0;
          z.hasStruckTarget = true;
          z.lastStrikeTime = now;
          (targetBot as any).health -= z.damage;
          this.particleSystem.spawnBlood((targetBot as any).position);
          if ((targetBot as any).health <= 0) {
            (targetBot as any).health = 0;
            (targetBot as any).isDowned = true;
          }
          sound.playZombieGrowl(z.type);
        }
      }
    }
  }

  private damagePlayer(amount: number, z?: ActiveZombie) {
    const now = performance.now() / 1000;
    this.lastDamageTime = now;

    if (z) {
      z.hasStruckTarget = true;
      z.lastStrikeTime = now;
    }
    this.stats.health -= amount;
    this.cameraShake = 0.35;
    sound.updateLowHealthHeartbeat(this.stats.health < 35);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.stats.downs++;
      this.isDowned = true;
      this.reviveProgress = 0;

      if (this.activePerks.has('QUICK_REVIVE')) {
        // Authentic Solo Quick Revive Self-Revive Mechanism
        this.activePerks.delete('QUICK_REVIVE');
        this.callbacks.onPerksUpdate(Array.from(this.activePerks));
        sound.playPerkJingle('QUICK_REVIVE');
        setTimeout(() => {
          if (this.isDowned) {
            this.revivePlayer();
          }
        }, 3200);
      } else if (this.botTeammates.every((b) => b.isDowned)) {
        // True Game Over
        this.callbacks.onGameOver(this.stats, this.round);
      }
    }

    this.callbacks.onStatsUpdate(this.stats);
  }

  private revivePlayer() {
    this.isDowned = false;
    this.stats.health = this.activePerks.has('JUGGERNOG') ? 250 : 100;
    this.reviveProgress = 0;
    sound.updateLowHealthHeartbeat(false);
    this.callbacks.onStatsUpdate(this.stats);
  }

  private updateWaveManager(dt: number) {
    if (this.isIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.isIntermission = false;
        this.round++;
        this.startNextRound();
      }
      return;
    }

    // Check if wave cleared
    if (this.zombiesRemainingInWave <= 0 && this.totalZombiesSpawned >= this.totalZombiesForRound) {
      this.isIntermission = true;
      this.intermissionTimer = 6.0; // 6 seconds intermission
      this.callbacks.onRoundUpdate(this.round, 0, true);
      return;
    }

    // Spawn zombies gradually up to wave total
    this.nextSpawnTimer -= dt;
    if (this.nextSpawnTimer <= 0 && this.totalZombiesSpawned < this.totalZombiesForRound) {
      this.nextSpawnTimer = Math.max(0.8, 3.5 - this.round * 0.2);
      this.spawnZombie();
    }
  }

  private startNextRound() {
    this.totalZombiesForRound = 6 + this.round * 5;
    this.zombiesRemainingInWave = this.totalZombiesForRound;
    this.totalZombiesSpawned = 0;
    sound.playRoundStart();
    this.callbacks.onRoundUpdate(this.round, this.zombiesRemainingInWave, false);

    // Weather change on specific rounds
    if (this.round === 4) {
      this.setWeather('BLOOD_RAIN');
    } else if (this.round === 7) {
      this.setWeather('TOXIC_FOG');
    } else if (this.round >= 10 && this.round % 5 === 0) {
      this.setWeather('RADIOACTIVE_BLOON');
    }
  }

  private spawnZombie() {
    const spawns = this.mapElements.zombieSpawns;
    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)];

    let type: ZombieType = 'WALKER';
    if (this.round >= 2 && Math.random() < 0.35) type = 'SPRINTER';
    if (this.round >= 3 && Math.random() < 0.2) type = 'CRAWLER';
    if (this.round >= 5 && Math.random() < 0.25) type = 'HELLHOUND';
    if (this.round >= 6 && this.totalZombiesSpawned === 0) type = 'BRUTE_BOSS';

    const zModel = createZombieModel(type);
    zModel.group.position.set(...spawnPos);
    this.scene.add(zModel.group);

    let hp = 100 + this.round * 45;
    let speed = 2.4 + Math.random() * 0.6;
    let dmg = 25;

    if (type === 'SPRINTER') {
      speed = 4.8;
      hp *= 0.85;
    } else if (type === 'HELLHOUND') {
      speed = 5.5;
      hp = 90;
      dmg = 30;
    } else if (type === 'BRUTE_BOSS') {
      speed = 2.0;
      hp = 800 + this.round * 200;
      dmg = 60;
    }

    this.zombies.push({
      id: Math.random().toString(36),
      type,
      model: zModel,
      position: new THREE.Vector3(...spawnPos),
      velocity: new THREE.Vector3(),
      health: hp,
      maxHealth: hp,
      speed,
      damage: dmg,
      attackCooldown: 0,
      isDead: false,
      targetPos: this.playerPos.clone(),
      atBarricadeId: null,
      walkCycle: Math.random() * Math.PI * 2,
      staggerPhase: Math.random() * Math.PI,
      limpFactor: 0.65 + Math.random() * 0.7,
      heading: Math.random() * Math.PI * 2,
      flinchTimer: 0,
      isLunging: false,
      hasStruckTarget: false,
      lastStrikeTime: 0
    });

    this.totalZombiesSpawned++;
  }

  private updateBots(dt: number) {
    const now = performance.now() / 1000;

    this.botTeammates.forEach((bot) => {
      if (bot.isDowned) {
        // Can be revived by player
        if (this.playerPos.distanceTo(bot.position) < 2.0 && this.keys['f']) {
          bot.isDowned = false;
          bot.health = 150;
          this.stats.revives++;
          this.callbacks.onStatsUpdate(this.stats);
        }
        return;
      }

      // If player is downed, bot rushes to revive player!
      if (this.isDowned) {
        const toPlayer = new THREE.Vector3().subVectors(this.playerPos, bot.position);
        toPlayer.y = 0;
        if (toPlayer.length() > 1.2) {
          toPlayer.normalize();
          bot.position.add(toPlayer.multiplyScalar(5.5 * dt));
        } else {
          this.revivePlayer();
        }
        bot.model.group.position.copy(bot.position);
        return;
      }

      // Follow player at distance
      const toPlayer = new THREE.Vector3().subVectors(this.playerPos, bot.position);
      toPlayer.y = 0;
      const d = toPlayer.length();

      if (d > 5.5) {
        toPlayer.normalize();
        bot.position.add(toPlayer.multiplyScalar(4.8 * dt));
      }

      // STRICT FIRE DISCIPLINE: Stop AI teammates from shooting zombies unless they strike the bot or player!
      let threatZ: ActiveZombie | null = null;
      let minD = 999;

      for (const z of this.zombies) {
        if (z.isDead) continue;
        const distToPlayer = z.position.distanceTo(this.playerPos);
        const distToBot = z.position.distanceTo(bot.position);

        // ONLY engage zombies that have struck the bot or player, or are in immediate striking reach (<= 1.8m)
        const isThreat =
          (z.hasStruckTarget && now - z.lastStrikeTime < 6.0) ||
          distToPlayer <= 1.8 ||
          distToBot <= 1.8;

        if (isThreat && distToBot < minD) {
          minD = distToBot;
          threatZ = z;
        }
      }

      if (threatZ) {
        const toZ = new THREE.Vector3().subVectors(threatZ.position, bot.position).normalize();
        bot.model.group.rotation.y = Math.atan2(toZ.x, toZ.z);

        if (now - bot.lastShot > 0.42) {
          bot.lastShot = now;
          sound.playGunshot('RIFLE', false);
          threatZ.health -= 38;
          threatZ.flinchTimer = 0.22;
          this.particleSystem.spawnBlood(threatZ.position);

          if (threatZ.health <= 0) {
            this.killZombie(threatZ, false);
          }
        }
      } else {
        // Hold Fire: Maintain defensive perimeter coverage
        // If a nearby barricade is damaged within 3.5m, help repair planks
        const nearB = this.getNearestBarricade(bot.position);
        if (nearB && nearB.state.planks < 4 && bot.position.distanceTo(new THREE.Vector3(...nearB.state.position)) < 3.2) {
          if (now - bot.lastShot > 1.2) {
            bot.lastShot = now;
            nearB.state.planks++;
            const pIdx = nearB.state.planks - 1;
            if (nearB.model.plankMeshes[pIdx]) {
              nearB.model.plankMeshes[pIdx].visible = true;
            }
            sound.playRepairPlank();
          }
          const bPos = new THREE.Vector3(...nearB.state.position);
          bot.model.group.lookAt(bPos.x, bot.position.y, bPos.z);
        } else {
          bot.model.group.rotation.y = THREE.MathUtils.damp(
            bot.model.group.rotation.y,
            Math.atan2(toPlayer.x, toPlayer.z),
            6,
            dt
          );
        }
      }

      bot.model.group.position.copy(bot.position);
    });
  }

  private updateSentries(dt: number) {
    for (let i = this.sentries.length - 1; i >= 0; i--) {
      const s = this.sentries[i];
      if (s.ammo <= 0 || s.health <= 0) {
        this.scene.remove(s.model.group);
        this.sentries.splice(i, 1);
        continue;
      }

      // Find nearest zombie in 20m range
      let targetZ: ActiveZombie | null = null;
      let minD = 20.0;
      for (const z of this.zombies) {
        if (z.isDead) continue;
        const d = z.position.distanceTo(s.position);
        if (d < minD) {
          minD = d;
          targetZ = z;
        }
      }

      if (targetZ) {
        const dir = new THREE.Vector3().subVectors(targetZ.position, s.position).normalize();
        s.model.turretHead.rotation.y = Math.atan2(dir.x, dir.z);
        s.model.barrels.rotation.z += 15 * dt;

        const now = performance.now() / 1000;
        if (now - s.lastShotTime > 0.12) {
          s.lastShotTime = now;
          s.ammo--;
          sound.playGunshot('RIFLE', false);
          targetZ.health -= 28;
          this.particleSystem.spawnBlood(targetZ.position);

          if (targetZ.health <= 0) {
            this.killZombie(targetZ, false);
          }
        }
      }
    }
  }

  private updateElectricTrap(dt: number) {
    const trap = this.mapElements.electricFence;
    const sw = this.mapElements.trapSwitch;

    if (sw.cooldown > 0) {
      sw.cooldown -= dt;
      if (sw.cooldown <= 0) {
        trap.active = false;
        trap.group.children[0].visible = false;
      }
    }

    if (trap.active) {
      sound.playElectricTrap();
      // Zap all zombies passing through doorway corridor (Z: 6.5 to 7.5, X: -2.5 to 2.5)
      for (const z of this.zombies) {
        if (z.isDead) continue;
        if (Math.abs(z.position.z - 7.0) < 1.2 && Math.abs(z.position.x) < 2.8) {
          z.health = 0;
          this.particleSystem.spawnSparks(z.position);
          this.killZombie(z, false);
        }
      }
    }
  }

  public activateElectricTrap() {
    if (this.stats.points < 1000) return;
    const trap = this.mapElements.electricFence;
    const sw = this.mapElements.trapSwitch;
    if (sw.cooldown > 0) return;

    this.stats.points -= 1000;
    trap.active = true;
    trap.group.children[0].visible = true;
    sw.cooldown = 15.0; // 15 seconds active
    this.callbacks.onStatsUpdate(this.stats);
  }

  public craftItem(recipeId: string): boolean {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe || this.stats.points < recipe.scrapCost) return false;

    this.stats.points -= recipe.scrapCost;

    if (recipe.type === 'DEFENSE_BARRIER' || recipe.id === 'defense_barrier') {
      // Deploy a fortified sandbag & steel barrier in front of the player to fortify buildings
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const placePos = this.playerPos.clone().add(forward.multiplyScalar(2.0));
      const bModel = createDefenseBarrierModel();
      bModel.group.position.copy(placePos);
      bModel.group.rotation.y = this.yaw;
      this.scene.add(bModel.group);

      const bBox = new THREE.Box3().setFromCenterAndSize(placePos, new THREE.Vector3(2.4, 1.4, 0.6));
      this.mapElements.colliders.push(bBox);

      this.mapElements.defenseBarriers.push({
        id: `barrier_player_${Date.now()}`,
        model: bModel,
        position: placePos,
        health: 500,
        maxHealth: 500
      });

      sound.playRepairPlank();
      this.particleSystem.spawnSparks(placePos);
    } else if (recipe.type === 'SENTRY') {
      const sModel = createSentryTurretModel();
      const sPos = this.playerPos.clone().add(new THREE.Vector3(Math.sin(this.playerAngle) * 2, 0, Math.cos(this.playerAngle) * 2));
      sModel.group.position.copy(sPos);
      this.scene.add(sModel.group);

      this.sentries.push({
        id: Math.random().toString(36),
        model: sModel,
        position: sPos,
        ammo: 250,
        maxAmmo: 250,
        health: 200,
        lastShotTime: 0
      });
    } else if (recipe.type === 'BARRICADE') {
      // Repair all planks at nearest barricade
      const near = this.getNearestBarricade(this.playerPos);
      if (near) {
        near.state.planks = 4;
        near.model.plankMeshes.forEach((m) => (m.visible = true));
      }
    } else if (recipe.type === 'MEDKIT') {
      this.stats.health = this.stats.maxHealth;
    } else if (recipe.type === 'MOLOTOV') {
      // Throw fiery explosion ahead
      const pos = this.playerPos.clone().add(new THREE.Vector3(Math.sin(this.playerAngle) * 8, 0, Math.cos(this.playerAngle) * 8));
      this.particleSystem.spawnExplosion(pos, 8);
      for (const z of this.zombies) {
        if (!z.isDead && z.position.distanceTo(pos) < 8) {
          z.health -= 350;
          if (z.health <= 0) this.killZombie(z, false);
        }
      }
    }

    this.callbacks.onStatsUpdate(this.stats);
    return true;
  }

  private getNearestBarricade(pos: THREE.Vector3) {
    let nearest = null;
    let minD = 4.0;
    for (const b of this.mapElements.barricades) {
      const d = pos.distanceTo(new THREE.Vector3(...b.state.position));
      if (d < minD) {
        minD = d;
        nearest = b;
      }
    }
    return nearest;
  }

  private checkInteractionNearPlayer() {
    // 1. Check Barricade repair
    const nearBarricade = this.getNearestBarricade(this.playerPos);
    if (nearBarricade && nearBarricade.state.planks < 4) {
      this.callbacks.onInteractPrompt(`Press [F] to Repair Plank (+10 PTS)`);
      return;
    }

    // 1b. Check Placed Defense Barrier Reinforcement
    for (const b of this.mapElements.defenseBarriers) {
      if (this.playerPos.distanceTo(b.position) < 2.2 && b.health < b.maxHealth) {
        this.callbacks.onInteractPrompt(`Press [F] to Reinforce Barrier (${Math.round(b.health)}/${b.maxHealth} HP) [+10 PTS]`);
        return;
      }
    }

    // 2. Check Perk Machines
    for (const p of this.mapElements.perkMachines) {
      if (this.playerPos.distanceTo(new THREE.Vector3(...p.position)) < 2.5) {
        const def = PERK_DEFINITIONS[p.perkId];
        if (this.activePerks.has(p.perkId)) {
          this.callbacks.onInteractPrompt(`✅ ${def.name} Active [Owned]`);
        } else if (this.stats.points >= def.cost) {
          this.callbacks.onInteractPrompt(`Press [F] to Drink ${def.name} [Cost: ${def.cost} PTS] — ${def.description}`);
        } else {
          this.callbacks.onInteractPrompt(`${def.name} [Cost: ${def.cost} PTS] — Need ${def.cost - this.stats.points} More PTS`);
        }
        return;
      }
    }

    // 3. Check Mystery Box
    if (this.playerPos.distanceTo(new THREE.Vector3(...this.mapElements.mysteryBox.position)) < 2.5) {
      const cost = this.activePowerUps.has('FIRE_SALE') ? 10 : 950;
      if (this.isBoxRolling) {
        this.callbacks.onInteractPrompt(`Mystery Box Shuffling...`);
      } else {
        this.callbacks.onInteractPrompt(`Press [F] for Mystery Box [Cost: ${cost}]`);
      }
      return;
    }

    // 4. Check Pack-a-Punch
    if (this.playerPos.distanceTo(new THREE.Vector3(...this.mapElements.packAPunch.position)) < 2.5) {
      if (this.isPapWeapon) {
        this.callbacks.onInteractPrompt(`Weapon Already Pack-a-Punched!`);
      } else {
        this.callbacks.onInteractPrompt(`Press [F] to Pack-a-Punch Weapon [Cost: 5000]`);
      }
      return;
    }

    // 5. Check Electric Trap Switch
    if (this.playerPos.distanceTo(new THREE.Vector3(...this.mapElements.trapSwitch.position)) < 2.2) {
      if (this.mapElements.trapSwitch.cooldown > 0) {
        this.callbacks.onInteractPrompt(`Electric Trap Recharging...`);
      } else {
        this.callbacks.onInteractPrompt(`Press [F] to Activate Electric Trap [Cost: 1000]`);
      }
      return;
    }

    // 6. Check WWII Chalk Weapon Wall Buys (World at War Feature)
    for (const wb of this.mapElements.wallBuys) {
      if (this.playerPos.distanceTo(wb.position) < 2.6) {
        const isHolding = this.currentWeapon.id === wb.weaponId;
        if (isHolding) {
          this.callbacks.onInteractPrompt(`Press [F] to Buy Ammo for ${wb.name} [Cost: ${Math.floor(wb.cost / 2)}]`);
        } else {
          this.callbacks.onInteractPrompt(`Press [F] to Buy ${wb.name} [Cost: ${wb.cost}]`);
        }
        return;
      }
    }

    this.callbacks.onInteractPrompt(null);
  }

  private interactNearest() {
    // 1. Barricade
    const nearBarricade = this.getNearestBarricade(this.playerPos);
    if (nearBarricade && nearBarricade.state.planks < 4) {
      const pIndex = nearBarricade.state.planks;
      nearBarricade.state.planks++;
      if (nearBarricade.model.plankMeshes[pIndex]) {
        nearBarricade.model.plankMeshes[pIndex].visible = true;
      }
      this.stats.points += 10;
      sound.playRepairPlank();
      this.callbacks.onStatsUpdate(this.stats);
      return;
    }

    // 1b. Reinforce Placed Defense Barriers
    for (const b of this.mapElements.defenseBarriers) {
      if (this.playerPos.distanceTo(b.position) < 2.2 && b.health < b.maxHealth) {
        b.health = Math.min(b.maxHealth, b.health + 100);
        if (b.model.healthBar) {
          b.model.healthBar.scale.x = Math.max(0.01, b.health / b.maxHealth);
        }
        this.stats.points += 10;
        sound.playRepairPlank();
        this.particleSystem.spawnSparks(b.position);
        this.callbacks.onStatsUpdate(this.stats);
        return;
      }
    }

    // 2. Perk Machines
    for (const p of this.mapElements.perkMachines) {
      if (this.playerPos.distanceTo(new THREE.Vector3(...p.position)) < 2.5) {
        const def = PERK_DEFINITIONS[p.perkId];
        if (!this.activePerks.has(p.perkId) && this.stats.points >= def.cost) {
          this.stats.points -= def.cost;
          this.activePerks.add(p.perkId);
          sound.playPerkDrink();
          sound.playPerkJingle(p.perkId);
          this.particleSystem.spawnSparks(new THREE.Vector3(...p.position));

          // First-person viewmodel bottle drinking physical recoil impulse
          this.viewmodelRecoilPitch = 0.24;
          this.viewmodelRecoilZ = 0.12;
          this.cameraShake = 0.15;

          if (p.perkId === 'JUGGERNOG') {
            this.stats.maxHealth = 250;
            this.stats.health = 250;
          }

          this.callbacks.onPerksUpdate(Array.from(this.activePerks));
          this.callbacks.onStatsUpdate(this.stats);
        }
        return;
      }
    }

    // 3. Mystery Box
    if (this.playerPos.distanceTo(new THREE.Vector3(...this.mapElements.mysteryBox.position)) < 2.5) {
      const cost = this.activePowerUps.has('FIRE_SALE') ? 10 : 950;
      if (!this.isBoxRolling && this.stats.points >= cost) {
        this.stats.points -= cost;
        this.startMysteryBoxRoll();
        this.callbacks.onStatsUpdate(this.stats);
      }
      return;
    }

    // 4. Pack-a-Punch
    if (this.playerPos.distanceTo(new THREE.Vector3(...this.mapElements.packAPunch.position)) < 2.5) {
      if (!this.isPapWeapon && this.stats.points >= 5000) {
        this.stats.points -= 5000;
        this.isPapWeapon = true;
        this.currentWeapon.name = this.currentWeapon.papName || this.currentWeapon.name + ' Mk-II';
        this.currentWeapon.damage *= 2.2;
        this.currentWeapon.magSize *= 2;
        this.currentWeapon.reserveAmmo = this.currentWeapon.maxReserve * 2;
        sound.playPerkJingle();
        this.attachWeaponToPlayer();
        this.callbacks.onWeaponUpdate(this.currentWeapon, true);
        this.callbacks.onStatsUpdate(this.stats);
      }
      return;
    }

    // 5. Electric Trap Switch
    if (this.playerPos.distanceTo(new THREE.Vector3(...this.mapElements.trapSwitch.position)) < 2.2) {
      this.activateElectricTrap();
      return;
    }

    // 6. WWII Chalk Weapon Wall Buys
    for (const wb of this.mapElements.wallBuys) {
      if (this.playerPos.distanceTo(wb.position) < 2.6) {
        const isHolding = this.currentWeapon.id === wb.weaponId;
        const ammoCost = Math.floor(wb.cost / 2);
        if (isHolding && this.stats.points >= ammoCost) {
          this.stats.points -= ammoCost;
          this.currentWeapon.reserveAmmo = this.currentWeapon.maxReserve;
          sound.playReload();
          this.callbacks.onWeaponUpdate(this.currentWeapon, this.isPapWeapon);
          this.callbacks.onStatsUpdate(this.stats);
        } else if (!isHolding && this.stats.points >= wb.cost) {
          this.stats.points -= wb.cost;
          this.switchWeapon(wb.weaponId);
          sound.playReload();
          this.callbacks.onStatsUpdate(this.stats);
        }
        return;
      }
    }
  }

  private startMysteryBoxRoll() {
    this.isBoxRolling = true;
    sound.playMysteryBox();
    this.mapElements.mysteryBox.lid.rotation.x = -Math.PI / 2.2;

    setTimeout(() => {
      const weaponKeys = Object.keys(WEAPON_DEFINITIONS);
      const chosen = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      this.switchWeapon(chosen);
      this.mapElements.mysteryBox.lid.rotation.x = 0;
      this.isBoxRolling = false;
    }, 2800);
  }

  public switchWeapon(weaponId: string) {
    if (WEAPON_DEFINITIONS[weaponId]) {
      this.currentWeapon = { ...WEAPON_DEFINITIONS[weaponId] };
      this.isPapWeapon = false;
      this.isReloading = false;
      this.attachWeaponToPlayer();
      this.callbacks.onWeaponUpdate(this.currentWeapon, false);
    }
  }

  public setWeather(w: WeatherType) {
    this.weather = w;
    this.particleSystem.initWeather(w);

    if (w === 'CLEAR_TWILIGHT') {
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.024);
      this.hemiLight.color.setHex(0x64748b);
      this.dirLight.color.setHex(0xfef08a);
    } else if (w === 'BLOOD_RAIN') {
      this.scene.fog = new THREE.FogExp2(0x450a0a, 0.038);
      this.hemiLight.color.setHex(0x881337);
      this.dirLight.color.setHex(0xf43f5e);
    } else if (w === 'TOXIC_FOG') {
      this.scene.fog = new THREE.FogExp2(0x14532d, 0.05);
      this.hemiLight.color.setHex(0x4ade80);
      this.dirLight.color.setHex(0xa3e635);
    } else if (w === 'RADIOACTIVE_BLOON') {
      this.scene.fog = new THREE.FogExp2(0x581c87, 0.04);
      this.hemiLight.color.setHex(0xa855f7);
      this.dirLight.color.setHex(0xd946ef);
    }

    this.callbacks.onWeatherUpdate(w);
  }

  private updateWeatherCycle(dt: number) {
    this.weatherTimer += dt;
    if (this.weatherTimer > 90) {
      // Cycle weather every 90 seconds
      this.weatherTimer = 0;
      const weathers: WeatherType[] = ['CLEAR_TWILIGHT', 'BLOOD_RAIN', 'TOXIC_FOG', 'RADIOACTIVE_BLOON'];
      const next = weathers[(weathers.indexOf(this.weather) + 1) % weathers.length];
      this.setWeather(next);
    }
  }

  private updateCamera(dt: number) {
    // Authentic First-Person Camera Placement at Eye Height
    const headBob = this.isGrounded && this.walkBobTimer > 0 ? Math.sin(this.walkBobTimer) * 0.03 : 0;
    this.camera.position.set(this.playerPos.x, this.playerPos.y + 1.65 + headBob, this.playerPos.z);

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch + this.recoilAngleClimb;

    // Apply Camera Shake Decay
    if (this.cameraShake > 0.001) {
      this.camera.rotation.z = (Math.random() - 0.5) * this.cameraShake * 0.08;
      this.cameraShake *= Math.exp(-6 * dt);
    } else {
      this.camera.rotation.z = 0;
    }
  }

  private renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.container.removeEventListener('mousemove', this.handleMouseMove);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize);

    this.particleSystem.dispose();
    this.renderer.dispose();
    this.network.disconnect();
  }
}
