/**
 * World-matched, low-occlusion HUD for Outbreak: Dead Zone.
 * Adheres to 85% unobstructed viewport rule with zero backdrop-filter over WebGL.
 */

import React from 'react';
import {
  Shield,
  Zap,
  HeartPulse,
  Flame,
  Footprints,
  Crosshair,
  Skull,
  Award,
  CloudRain,
  Radio,
  Hammer,
  Volume2,
  VolumeX,
  Plus
} from 'lucide-react';
import { WeaponDef, PerkType, ActivePowerUp, WeatherType, PlayerStats } from '../types/game';
import { sound } from '../audio/soundEngine';

interface GameHUDProps {
  stats: PlayerStats;
  weapon: WeaponDef;
  isPap: boolean;
  round: number;
  zombiesRemaining: number;
  isIntermission: boolean;
  activePerks: PerkType[];
  activePowerUps: ActivePowerUp[];
  weather: WeatherType;
  interactPrompt: string | null;
  hitMarker: { isHeadshot: boolean; timestamp: number } | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCrafting: () => void;
  onOpenPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  weapon,
  isPap,
  round,
  zombiesRemaining,
  isIntermission,
  activePerks,
  activePowerUps,
  weather,
  interactPrompt,
  hitMarker,
  isMuted,
  onToggleMute,
  onOpenCrafting,
  onOpenPause
}) => {
  const isHitMarkerActive = hitMarker && Date.now() - hitMarker.timestamp < 150;
  const hpPct = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
  const isCriticalHealth = stats.health <= stats.maxHealth * 0.3;

  const weatherLabels: Record<WeatherType, { label: string; color: string; icon: string }> = {
    CLEAR_TWILIGHT: { label: 'TWILIGHT DUSK', color: '#94a3b8', icon: '🌙' },
    BLOOD_RAIN: { label: 'BLOOD STORM', color: '#ef4444', icon: '🌧️' },
    TOXIC_FOG: { label: 'TOXIC FOG', color: '#84cc16', icon: '☣️' },
    RADIOACTIVE_BLOON: { label: 'BLOOD MOON', color: '#d946ef', icon: '🩸' }
  };

  const perkIconMap: Record<PerkType, { label: string; color: string; icon: React.ReactNode }> = {
    JUGGERNOG: { label: 'Juggernog', color: '#ef4444', icon: <Shield className="w-5 h-5 text-red-400" /> },
    SPEED_COLA: { label: 'Speed Cola', color: '#22c55e', icon: <Zap className="w-5 h-5 text-emerald-400" /> },
    QUICK_REVIVE: { label: 'Quick Revive', color: '#38bdf8', icon: <HeartPulse className="w-5 h-5 text-sky-400" /> },
    DOUBLE_TAP: { label: 'Double Tap', color: '#f59e0b', icon: <Flame className="w-5 h-5 text-amber-400" /> },
    STAMIN_UP: { label: 'Stamin-Up', color: '#eab308', icon: <Footprints className="w-5 h-5 text-yellow-400" /> }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* Low Health Screen Vignette Pulse */}
      {isCriticalHealth && (
        <div className="absolute inset-0 pointer-events-none border-[14px] border-red-700/60 bg-red-950/20 animate-pulse" />
      )}

      {/* First-Person Tactical Center Crosshair & Hitmarker */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dynamic 4-Tick Crosshair */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Center Precision Aim Dot */}
          <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />

          {/* Top, Bottom, Left, Right Ticks */}
          <div className="absolute top-0 w-0.5 h-2.5 bg-white/70 rounded-full" />
          <div className="absolute bottom-0 w-0.5 h-2.5 bg-white/70 rounded-full" />
          <div className="absolute left-0 h-0.5 w-2.5 bg-white/70 rounded-full" />
          <div className="absolute right-0 h-0.5 w-2.5 bg-white/70 rounded-full" />

          {/* Center Hit Marker Flash */}
          {isHitMarkerActive && (
            <div
              className={`absolute font-black select-none pointer-events-none ${
                hitMarker?.isHeadshot
                  ? 'text-amber-400 text-3xl drop-shadow-[0_0_10px_rgba(251,191,36,1)] scale-125'
                  : 'text-red-400 text-2xl drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]'
              }`}
            >
              {hitMarker?.isHeadshot ? '✦' : '✕'}
            </div>
          )}
        </div>
      </div>

      {/* TOP LEFT: Round & Threat Status */}
      <div className="absolute top-5 left-5 flex items-start gap-4">
        {/* Round Badge */}
        <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-3 rounded-lg shadow-2xl flex flex-col items-center min-w-[90px]">
          <span className="text-[11px] tracking-widest text-slate-400 font-bold uppercase">ROUND</span>
          <span className="text-4xl font-extrabold tracking-tight text-red-500 tabular-nums drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {round}
          </span>
          {isIntermission ? (
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1 animate-pulse">
              INTERMISSION
            </span>
          ) : (
            <span className="text-[10px] text-slate-300 font-medium tracking-wide mt-1 tabular-nums">
              {zombiesRemaining} HOSTILES
            </span>
          )}
        </div>

        {/* Weather Indicator */}
        <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <span className="text-sm">{weatherLabels[weather].icon}</span>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">ATMOSPHERE</span>
            <span className="text-xs font-bold tracking-wide" style={{ color: weatherLabels[weather].color }}>
              {weatherLabels[weather].label}
            </span>
          </div>
        </div>
      </div>

      {/* TOP CENTER: Active Power-Ups */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {activePowerUps.map((p) => (
          <div
            key={p.type}
            className="bg-slate-900/95 border border-amber-500/80 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg animate-bounce"
          >
            <span className="text-xs font-black text-amber-400">{p.type.replace('_', ' ')}</span>
            <span className="text-xs font-mono font-bold text-white tabular-nums bg-amber-950 px-1.5 py-0.5 rounded">
              {p.timeLeft}s
            </span>
          </div>
        ))}
      </div>

      {/* TOP RIGHT: Scrap Points, Kills & Controls */}
      <div className="absolute top-5 right-5 flex items-center gap-3">
        {/* Points / Scrap */}
        <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-lg shadow-xl flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">SCRAP / POINTS</span>
          <span className="text-2xl font-black text-white tabular-nums tracking-wide">
            {stats.points.toLocaleString()}
          </span>
        </div>

        {/* Kills Cluster */}
        <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-lg shadow-xl flex items-center gap-3 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1">
            <Skull className="w-4 h-4 text-red-400" />
            <span className="tabular-nums">{stats.kills}</span>
          </div>
          <div className="flex items-center gap-1">
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums">{stats.headshots}</span>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
          <button
            onClick={onOpenPause}
            className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition shadow-lg cursor-pointer uppercase"
          >
            MENU
          </button>
        </div>
      </div>

      {/* CENTER: Interaction Prompt */}
      {interactPrompt && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-slate-950/95 border-2 border-amber-500/90 text-amber-200 px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-2xl flex items-center gap-2 animate-pulse">
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-xs font-black">F</span>
            <span>{interactPrompt}</span>
          </div>
        </div>
      )}

      {/* BOTTOM LEFT: Health & Perks Cluster */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2.5">
        {/* Active Perk Badges */}
        <div className="flex items-center gap-2">
          {activePerks.map((perkId) => {
            const p = perkIconMap[perkId];
            return (
              <div
                key={perkId}
                className="w-10 h-10 rounded-lg bg-slate-900/95 border border-slate-700/90 flex items-center justify-center shadow-lg transition transform hover:scale-110"
                title={p.label}
              >
                {p.icon}
              </div>
            );
          })}
        </div>

        {/* Health Bar */}
        <div className="bg-slate-900/90 border border-slate-700/80 p-3 rounded-lg shadow-xl w-64 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-red-400" /> VITALITY
            </span>
            <span className={`tabular-nums ${isCriticalHealth ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {Math.ceil(stats.health)} / {stats.maxHealth} HP
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isCriticalHealth
                  ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Collapsible Tactical Crafting Dock */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto">
        <button
          onClick={onOpenCrafting}
          className="bg-slate-900/95 hover:bg-slate-800 border-2 border-amber-500/80 hover:border-amber-400 text-amber-300 hover:text-white px-5 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase shadow-2xl flex items-center gap-2 transition cursor-pointer"
        >
          <Hammer className="w-4 h-4 text-amber-400" />
          <span>TACTICAL CRAFTING BENCH [E]</span>
        </button>
      </div>

      {/* BOTTOM RIGHT: Weapon & Ammo Card */}
      <div className="absolute bottom-5 right-5">
        <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-xl shadow-2xl min-w-[220px] flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {isPap && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-500/80 px-2 py-0.5 rounded">
                PACK-A-PUNCH
              </span>
            )}
            <span className="text-sm font-extrabold text-white tracking-wide">{weapon.name}</span>
          </div>

          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-black text-white tabular-nums tracking-tight">
              {weapon.magSize}
            </span>
            <span className="text-lg font-bold text-slate-400 tabular-nums">/ {weapon.reserveAmmo}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
            <span>[R] RELOAD</span>
            <span>·</span>
            <span>[1-5] SWITCH</span>
          </div>
        </div>
      </div>
    </div>
  );
};
