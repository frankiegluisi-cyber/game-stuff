/**
 * Game state, weapon stats, perk definitions, crafting system, and player progression.
 */

import { WeaponDef, PerkDef, DailyChallenge, OperativeSkin } from '../types/game';

export const WEAPON_DEFINITIONS: Record<string, WeaponDef> = {
  m1911: {
    id: 'm1911',
    name: 'M1911 Colt',
    papName: 'Mustang & Sally (Dual Akimbo)',
    tier: 1,
    damage: 32,
    fireRate: 4.5,
    magSize: 8,
    reserveAmmo: 64,
    maxReserve: 120,
    reloadTime: 1.4,
    spread: 0.012,
    pellets: 1,
    bulletSpeed: 145,
    range: 55,
    cost: 0,
    isAutomatic: false,
    color: '#fbbf24',
    papColor: '#f43f5e',
    recoil: 0.03,
    recoilPattern: {
      verticalKick: 0.045,
      horizontalKick: 0.008,
      recoverySpeed: 14.0,
      climbPerShot: 0.01,
      maxClimb: 0.08
    },
    bulletDrop: 9.8,
    maxPenetration: 1,
    penetrationRetention: 0.7,
    type: 'PISTOL'
  },
  shotgun: {
    id: 'shotgun',
    name: 'Trench 12-Gauge',
    papName: 'The Sweeper XL',
    tier: 1,
    damage: 26,
    fireRate: 1.3,
    magSize: 6,
    reserveAmmo: 36,
    maxReserve: 60,
    reloadTime: 2.2,
    spread: 0.075,
    pellets: 8,
    bulletSpeed: 110,
    range: 35,
    cost: 500,
    isAutomatic: false,
    color: '#f97316',
    papColor: '#ec4899',
    recoil: 0.14,
    recoilPattern: {
      verticalKick: 0.16,
      horizontalKick: 0.035,
      recoverySpeed: 6.5,
      climbPerShot: 0.03,
      maxClimb: 0.2
    },
    bulletDrop: 14.2,
    maxPenetration: 2,
    penetrationRetention: 0.65,
    type: 'SHOTGUN'
  },
  rifle: {
    id: 'rifle',
    name: 'Commando AR-4',
    papName: 'Predator Eliminator',
    tier: 1,
    damage: 48,
    fireRate: 8.5,
    magSize: 30,
    reserveAmmo: 180,
    maxReserve: 300,
    reloadTime: 1.8,
    spread: 0.024,
    pellets: 1,
    bulletSpeed: 175,
    range: 85,
    cost: 1000,
    isAutomatic: true,
    color: '#38bdf8',
    papColor: '#a855f7',
    recoil: 0.045,
    recoilPattern: {
      verticalKick: 0.038,
      horizontalKick: 0.018,
      recoverySpeed: 8.5,
      climbPerShot: 0.016,
      maxClimb: 0.22
    },
    bulletDrop: 5.5, // flat high velocity intermediate cartridge
    maxPenetration: 3,
    penetrationRetention: 0.75,
    type: 'RIFLE'
  },
  raygun: {
    id: 'raygun',
    name: 'Ray Blaster Mk-II',
    papName: "Porter's X2 Super-Ray",
    tier: 2,
    damage: 180,
    fireRate: 3.2,
    magSize: 20,
    reserveAmmo: 100,
    maxReserve: 160,
    reloadTime: 2.4,
    spread: 0.004,
    pellets: 1,
    bulletSpeed: 95,
    range: 90,
    cost: 2500,
    isAutomatic: false,
    color: '#22c55e',
    papColor: '#06b6d4',
    recoil: 0.04,
    recoilPattern: {
      verticalKick: 0.03,
      horizontalKick: 0.005,
      recoverySpeed: 16.0,
      climbPerShot: 0.005,
      maxClimb: 0.06
    },
    bulletDrop: 0.0, // pure directed plasma beam has zero gravity drop
    maxPenetration: 5,
    penetrationRetention: 0.9,
    type: 'WONDER'
  },
  minigun: {
    id: 'minigun',
    name: 'Death Machine Vulcan',
    papName: 'Meat Shredder 9000',
    tier: 2,
    damage: 55,
    fireRate: 14.0,
    magSize: 100,
    reserveAmmo: 400,
    maxReserve: 600,
    reloadTime: 3.2,
    spread: 0.045,
    pellets: 1,
    bulletSpeed: 185,
    range: 75,
    cost: 3000,
    isAutomatic: true,
    color: '#eab308',
    papColor: '#ef4444',
    recoil: 0.065,
    recoilPattern: {
      verticalKick: 0.032,
      horizontalKick: 0.026,
      recoverySpeed: 7.2,
      climbPerShot: 0.012,
      maxClimb: 0.28
    },
    bulletDrop: 6.5,
    maxPenetration: 4,
    penetrationRetention: 0.8,
    type: 'HEAVY'
  }
};

export const PERK_DEFINITIONS: Record<string, PerkDef> = {
  JUGGERNOG: {
    id: 'JUGGERNOG',
    name: 'Juggernog',
    description: 'Boosts max health from 100 to 250 HP and accelerates injury recovery.',
    cost: 2500,
    color: '#dc2626',
    accent: '#ef4444',
    icon: 'Shield'
  },
  SPEED_COLA: {
    id: 'SPEED_COLA',
    name: 'Speed Cola',
    description: 'Cuts reload times by 50% and speeds up weapon readying.',
    cost: 3000,
    color: '#16a34a',
    accent: '#22c55e',
    icon: 'Zap'
  },
  QUICK_REVIVE: {
    id: 'QUICK_REVIVE',
    name: 'Quick Revive',
    description: 'Immediate health regeneration start + faster revive of downed teammates.',
    cost: 1500,
    color: '#2563eb',
    accent: '#38bdf8',
    icon: 'HeartPulse'
  },
  DOUBLE_TAP: {
    id: 'DOUBLE_TAP',
    name: 'Double Tap II',
    description: 'Increases weapon fire rate by 35% with 20% bonus bullet impact punch.',
    cost: 2000,
    color: '#d97706',
    accent: '#f59e0b',
    icon: 'Flame'
  },
  STAMIN_UP: {
    id: 'STAMIN_UP',
    name: 'Stamin-Up',
    description: 'Increases movement & sprint velocity by 30% for high evasiveness.',
    cost: 2000,
    color: '#ca8a04',
    accent: '#eab308',
    icon: 'Footprints'
  }
};

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  scrapCost: number;
  icon: string;
  type: 'BARRICADE' | 'SENTRY' | 'MEDKIT' | 'MOLOTOV' | 'DEFENSE_BARRIER';
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'defense_barrier',
    name: 'Deployable Fortified Barrier',
    description: 'Heavy reinforced steel and sandbag barricade that blocks zombies in doorways and corridors.',
    scrapCost: 350,
    icon: 'Shield',
    type: 'DEFENSE_BARRIER'
  },
  {
    id: 'sentry',
    name: 'Automated Sentry Gun',
    description: 'Heavy rotating 360-degree turret that locks onto and shreds approaching zombies.',
    scrapCost: 1200,
    icon: 'Crosshair',
    type: 'SENTRY'
  },
  {
    id: 'barricade_kit',
    name: 'Steel-Reinforced Planks',
    description: 'Instantly restocks all barricade planks at the nearest window fortification node.',
    scrapCost: 300,
    icon: 'Hammer',
    type: 'BARRICADE'
  },
  {
    id: 'medkit',
    name: 'Tactical Trauma Kit',
    description: 'Instantly replenishes 100% health and grants 5 seconds of damage immunity.',
    scrapCost: 650,
    icon: 'PlusCircle',
    type: 'MEDKIT'
  },
  {
    id: 'molotov',
    name: 'Phosphorus Grenade',
    description: 'Launches a lingering pool of hellfire that incinerates entire clusters of walkers.',
    scrapCost: 500,
    icon: 'Flame',
    type: 'MOLOTOV'
  }
];

export const INITIAL_CHALLENGES: DailyChallenge[] = [
  {
    id: 'c1',
    title: 'Precision Executioner',
    description: 'Eliminate 25 zombies with accurate headshots.',
    target: 25,
    progress: 0,
    completed: false,
    rewardPoints: 800,
    rewardXp: 500
  },
  {
    id: 'c2',
    title: 'Combat Engineer',
    description: 'Repair 12 wooden window barricade planks.',
    target: 12,
    progress: 0,
    completed: false,
    rewardPoints: 600,
    rewardXp: 400
  },
  {
    id: 'c3',
    title: 'Outbreak Survivor',
    description: 'Survive past Round 6 in a single deployment.',
    target: 6,
    progress: 0,
    completed: false,
    rewardPoints: 1200,
    rewardXp: 800
  }
];

export const OPERATIVE_SKINS: OperativeSkin[] = [
  {
    id: 'specops',
    name: 'Ghost Operative',
    description: 'Standard issue tactical night-camo with thermal vision HUD visor.',
    armorColor: '#334155',
    helmetColor: '#1e293b',
    glowColor: '#38bdf8',
    requiredLevel: 1,
    unlocked: true
  },
  {
    id: 'hazmat',
    name: 'Bio-Cleanse Unit',
    description: 'Reinforced toxic protection suit with sealed filtration mask.',
    armorColor: '#eab308',
    helmetColor: '#ca8a04',
    glowColor: '#facc15',
    requiredLevel: 3,
    unlocked: false
  },
  {
    id: 'cyber',
    name: 'Neon Cyber Commando',
    description: 'Experimental carbon-fiber exoskeleton with plasma core conduits.',
    armorColor: '#0f172a',
    helmetColor: '#090d16',
    glowColor: '#a855f7',
    requiredLevel: 5,
    unlocked: false
  },
  {
    id: 'bloodhunter',
    name: 'Hellhound Stalker',
    description: 'Veteran survivor clad in armored crimson combat plates.',
    armorColor: '#881337',
    helmetColor: '#4c0519',
    glowColor: '#f43f5e',
    requiredLevel: 8,
    unlocked: false
  }
];

export interface SaveProfile {
  level: number;
  xp: number;
  totalKills: number;
  highestRound: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  selectedWeaponId: string;
}

const PROFILE_KEY = 'OUTBREAK_DEAD_ZONE_PROFILE_V1';

export function loadProfile(): SaveProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        level: data.level || 1,
        xp: data.xp || 0,
        totalKills: data.totalKills || 0,
        highestRound: data.highestRound || 1,
        unlockedSkins: data.unlockedSkins || ['specops'],
        selectedSkinId: data.selectedSkinId || 'specops',
        selectedWeaponId: data.selectedWeaponId || 'm1911'
      };
    }
  } catch (e) {
    console.error(e);
  }
  return {
    level: 1,
    xp: 0,
    totalKills: 0,
    highestRound: 1,
    unlockedSkins: ['specops'],
    selectedSkinId: 'specops',
    selectedWeaponId: 'm1911'
  };
}

export function saveProfile(profile: SaveProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}
