/**
 * Full-viewport Title Screen for Outbreak: Dead Zone.
 * Adheres to game craft constitution: bespoke SVG title lockup, 30-40% negative space,
 * primary deploy CTA, and flat control hint line.
 */

import React, { useState } from 'react';
import {
  Skull,
  Users,
  User,
  Shield,
  Crosshair,
  Award,
  Zap,
  Radio,
  Wifi,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';
import { GameMode, OperativeSkin } from '../types/game';
import { OPERATIVE_SKINS, INITIAL_CHALLENGES, SaveProfile, WEAPON_DEFINITIONS } from '../game/gameState';

interface TitleScreenProps {
  profile: SaveProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onDeploy: (mode: GameMode, roomCode: string, skinId: string, weaponId: string) => void;
  onUpdateProfile: (newProfile: SaveProfile) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  profile,
  isMuted,
  onToggleMute,
  onDeploy,
  onUpdateProfile
}) => {
  const [selectedTab, setSelectedTab] = useState<'DEPLOY' | 'LOADOUT' | 'BOUNTIES' | 'PROGRESSION'>('DEPLOY');
  const [gameMode, setGameMode] = useState<GameMode>('SOLO');
  const [roomCode, setRoomCode] = useState<string>('ALPHA');
  const [selectedSkinId, setSelectedSkinId] = useState<string>(profile.selectedSkinId || 'specops');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(profile.selectedWeaponId || 'm1911');

  const handleStart = () => {
    onDeploy(gameMode, roomCode, selectedSkinId, selectedWeaponId);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto font-sans">
      {/* Background Gradients & Blood Haze */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-slate-950/80 to-slate-950" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BAR: Audio & Operative Level Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300">RANK {profile.level}</span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">{profile.xp} XP</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
            <Skull className="w-4 h-4 text-red-400" />
            <span>RECORD: ROUND {profile.highestRound}</span>
          </div>
        </div>

        <button
          onClick={onToggleMute}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>
      </div>

      {/* CENTER: Bespoke Inline SVG Title Lockup over 30-40% Negative Space */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
        {/* Bespoke SVG Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-0.5 w-8 bg-red-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
              TACTICAL CO-OP WAVE SURVIVAL
            </span>
            <span className="h-0.5 w-8 bg-red-600" />
          </div>

          <svg
            className="w-full max-w-[560px] h-20 sm:h-24 filter drop-shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            viewBox="0 0 540 85"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="50%"
              y="58"
              textAnchor="middle"
              className="font-black text-5xl sm:text-6xl tracking-wider fill-white"
              style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.08em' }}
            >
              OUTBREAK
            </text>
            <text
              x="50%"
              y="82"
              textAnchor="middle"
              className="font-extrabold text-sm sm:text-base tracking-[0.55em] fill-red-500"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              DEAD ZONE
            </text>
          </svg>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl mt-6 shadow-2xl">
          {(['DEPLOY', 'LOADOUT', 'BOUNTIES', 'PROGRESSION'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase transition cursor-pointer ${
                selectedTab === tab
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: DEPLOY CONFIGURATION */}
        {selectedTab === 'DEPLOY' && (
          <div className="w-full max-w-lg mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setGameMode('SOLO')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  gameMode === 'SOLO'
                    ? 'bg-slate-900 border-red-500/80 text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-5 h-5 text-red-400" />
                <span className="text-xs font-black">SOLO + BOTS</span>
                <span className="text-[10px] text-slate-500">Ghost & Soap AI</span>
              </button>

              <button
                onClick={() => setGameMode('COOP_HOST')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  gameMode === 'COOP_HOST'
                    ? 'bg-slate-900 border-red-500/80 text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Wifi className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black">HOST CO-OP</span>
                <span className="text-[10px] text-slate-500">Local Wi-Fi Room</span>
              </button>

              <button
                onClick={() => setGameMode('COOP_JOIN')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  gameMode === 'COOP_JOIN'
                    ? 'bg-slate-900 border-red-500/80 text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-black">JOIN LOBBY</span>
                <span className="text-[10px] text-slate-500">Peer Sync</span>
              </button>
            </div>

            {gameMode !== 'SOLO' && (
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300">ROOM FREQUENCY CODE:</span>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-black text-amber-400 tracking-widest text-center uppercase w-28 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Primary Deploy CTA Button */}
            <button
              onClick={handleStart}
              className="mt-2 w-full py-4 bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-black text-lg tracking-widest uppercase rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center justify-center gap-3 transition cursor-pointer"
            >
              <span>DEPLOY MISSION</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* TAB 2: OPERATIVE LOADOUT */}
        {selectedTab === 'LOADOUT' && (
          <div className="w-full max-w-xl mt-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">SELECT COMBAT OPERATIVE</h3>
            <div className="grid grid-cols-2 gap-3">
              {OPERATIVE_SKINS.map((skin) => {
                const isSelected = selectedSkinId === skin.id;
                const isUnlocked = profile.level >= skin.requiredLevel;

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedSkinId(skin.id);
                        onUpdateProfile({ ...profile, selectedSkinId: skin.id });
                      }
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500 text-white shadow-lg'
                        : isUnlocked
                        ? 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black">{skin.name}</span>
                        {!isUnlocked && (
                          <span className="text-[10px] font-bold text-red-400">LVL {skin.requiredLevel}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{skin.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: skin.armorColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: skin.glowColor }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">STARTER FIREARM</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {['m1911', 'shotgun', 'rifle'].map((wId) => {
                const w = WEAPON_DEFINITIONS[wId];
                const isSel = selectedWeaponId === wId;
                return (
                  <button
                    key={wId}
                    onClick={() => {
                      setSelectedWeaponId(wId);
                      onUpdateProfile({ ...profile, selectedWeaponId: wId });
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      isSel
                        ? 'bg-slate-900 border-cyan-500 text-white shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{w.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">{w.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DAILY BOUNTIES */}
        {selectedTab === 'BOUNTIES' && (
          <div className="w-full max-w-lg mt-6 flex flex-col gap-3">
            {INITIAL_CHALLENGES.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-black text-white">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-amber-400">
                    <span>+{c.rewardPoints} PTS</span>
                    <span>+{c.rewardXp} XP</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs font-bold text-slate-400 tabular-nums">
                    {c.progress} / {c.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: LEVEL PROGRESSION */}
        {selectedTab === 'PROGRESSION' && (
          <div className="w-full max-w-lg mt-6 flex flex-col gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">RANK {profile.level} OPERATIVE</span>
                <span className="text-emerald-400 tabular-nums">{profile.xp} / {profile.level * 1000} XP</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (profile.xp / (profile.level * 1000)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">MILESTONE UNLOCKS</span>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-xs flex items-center justify-between">
                <span className="font-bold text-white">Rank 3: Bio-Cleanse Hazmat Operative</span>
                <span className="text-emerald-400 font-bold">{profile.level >= 3 ? 'UNLOCKED' : 'LOCKED'}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-xs flex items-center justify-between">
                <span className="font-bold text-white">Rank 5: Neon Cyber Commando Exoskeleton</span>
                <span className="text-emerald-400 font-bold">{profile.level >= 5 ? 'UNLOCKED' : 'LOCKED'}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-xs flex items-center justify-between">
                <span className="font-bold text-white">Rank 8: Hellhound Blood Hunter Armor</span>
                <span className="text-emerald-400 font-bold">{profile.level >= 8 ? 'UNLOCKED' : 'LOCKED'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM: Flat Single Control Hint Line */}
      <div className="relative z-10 flex items-center justify-center text-center">
        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
          WASD Move · Space Jump · Click Aim/Fire · Right Click ADS · R Reload · F Interact/Buy · E Crafting
        </p>
      </div>
    </div>
  );
};
