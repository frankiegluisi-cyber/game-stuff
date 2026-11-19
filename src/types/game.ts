/**
 * Game types and data structures for Outbreak: Dead Zone
 */

export type GameMode = 'SOLO' | 'COOP_HOST' | 'COOP_JOIN';

export type WeatherType = 'CLEAR_TWILIGHT' | 'BLOOD_RAIN' | 'TOXIC_FOG' | 'RADIOACTIVE_BLOON';

export type ZombieType = 'WALKER' | 'SPRINTER' | 'CRAWLER' | 'HELLHOUND' | 'BRUTE_BOSS';

export interface RecoilPattern {
  verticalKick: number;
  horizontalKick: number;
  recoverySpeed: number;
  climbPerShot: number;
  maxClimb: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  papName?: string;
  tier: number; // 1 to 3
  damage: number;
  fireRate: number; // rounds per sec
  magSize: number;
  reserveAmmo: number;
  maxReserve: number;
  reloadTime: number; // seconds
  spread: number;
  pellets: number;
  bulletSpeed: number;
  range: number;
  cost: number;
  isAutomatic: boolean;
  color: string;
  papColor?: string;
  recoil: number;
  recoilPattern: RecoilPattern;
  bulletDrop: number; // gravity multiplier (0 for laser, 9.8 for standard bullet)
  maxPenetration: number; // number of entities or barriers bullet can pierce
  penetrationRetention: number; // damage percentage kept after each pierce (e.g. 0.75)
  type: 'PISTOL' | 'SHOTGUN' | 'RIFLE' | 'WONDER' | 'HEAVY';
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  points: number; // also used as scrap
  kills: number;
  headshots: number;
  revives: number;
  downs: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export type PerkType = 'JUGGERNOG' | 'SPEED_COLA' | 'QUICK_REVIVE' | 'DOUBLE_TAP' | 'STAMIN_UP';

export interface PerkDef {
  id: PerkType;
  name: string;
  description: string;
  cost: number;
  color: string;
  accent: string;
  icon: string;
}

export type PowerUpType = 'NUKE' | 'INSTA_KILL' | 'MAX_AMMO' | 'DOUBLE_POINTS' | 'CARPENTER' | 'FIRE_SALE';

export interface ActivePowerUp {
  type: PowerUpType;
  timeLeft: number;
}

export interface BarricadeState {
  id: string;
  position: [number, number, number];
  rotation: number;
  planks: number; // 0 to 4
  maxPlanks: number;
  repairCost: number;
}

export interface SentryTurret {
  id: string;
  position: [number, number, number];
  rotation: number;
  ammo: number;
  maxAmmo: number;
  health: number;
  range: number;
  targetId: string | null;
  lastShotTime: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardPoints: number;
  rewardXp: number;
}

export interface OperativeSkin {
  id: string;
  name: string;
  description: string;
  armorColor: string;
  helmetColor: string;
  glowColor: string;
  requiredLevel: number;
  unlocked: boolean;
}

export interface PlayerNetworkState {
  id: string;
  name: string;
  isBot: boolean;
  position: [number, number, number];
  rotation: number;
  health: number;
  maxHealth: number;
  currentWeaponId: string;
  isShooting: boolean;
  isDowned: boolean;
  skinId: string;
  ping?: number;
}

export interface BulletProjectile {
  id: string;
  origin: [number, number, number];
  currentPos: [number, number, number];
  velocity: [number, number, number];
  damage: number;
  isPap: boolean;
  color: string;
  rangeRemaining: number;
  ownerId: string;
  penetrationsLeft: number;
  penetratedIds: string[];
  bulletDrop: number;
  penetrationRetention: number;
}

export interface HitEffect {
  x: number;
  y: number;
  z: number;
  isHeadshot: boolean;
  damage: number;
}
