/**
 * Outbreak: Dead Zone - Co-Op Zombie Survival Main Application.
 * Full-viewport Game Shell orchestrating 3D simulation, HUD, Title Screen, Crafting, and Audio.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { CraftingModal } from './components/CraftingModal';
import { MobileControls } from './components/MobileControls';
import { GameOverModal } from './components/GameOverModal';
import { ZombieGameEngine } from './game/ZombieGameEngine';
import {
  GameMode,
  PlayerStats,
  WeaponDef,
  PerkType,
  ActivePowerUp,
  WeatherType
} from './types/game';
import { WEAPON_DEFINITIONS, loadProfile, saveProfile, SaveProfile } from './game/gameState';
import { sound } from './audio/soundEngine';

type AppScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('TITLE');
  const [profile, setProfile] = useState<SaveProfile>(loadProfile());
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // In-Game UI state
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    points: 500,
    kills: 0,
    headshots: 0,
    revives: 0,
    downs: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 1000
  });

  const [currentWeapon, setCurrentWeapon] = useState<WeaponDef>(WEAPON_DEFINITIONS.m1911);
  const [isPap, setIsPap] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [zombiesRemaining, setZombiesRemaining] = useState<number>(6);
  const [isIntermission, setIsIntermission] = useState<boolean>(false);
  const [activePerks, setActivePerks] = useState<PerkType[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [weather, setWeather] = useState<WeatherType>('CLEAR_TWILIGHT');
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [hitMarker, setHitMarker] = useState<{ isHeadshot: boolean; timestamp: number } | null>(null);
  const [isCraftingOpen, setIsCraftingOpen] = useState<boolean>(false);

  // References
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ZombieGameEngine | null>(null);

  // Audio mute toggle
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Start game session
  const handleDeploy = (mode: GameMode, roomCode: string, skinId: string, weaponId: string) => {
    setScreen('PLAYING');

    setTimeout(() => {
      if (!canvasMountRef.current) return;

      if (engineRef.current) {
        engineRef.current.dispose();
      }

      const engine = new ZombieGameEngine(
        canvasMountRef.current,
        skinId,
        weaponId,
        {
          onStatsUpdate: (newStats) => setStats({ ...newStats }),
          onWeaponUpdate: (weapon, pap) => {
            setCurrentWeapon({ ...weapon });
            setIsPap(pap);
          },
          onRoundUpdate: (r, remaining, inter) => {
            setRound(r);
            setZombiesRemaining(remaining);
            setIsIntermission(inter);
          },
          onPerksUpdate: (perks) => setActivePerks([...perks]),
          onPowerUpsUpdate: (pu) => setActivePowerUps([...pu]),
          onWeatherUpdate: (w) => setWeather(w),
          onInteractPrompt: (p) => setInteractPrompt(p),
          onHitMarker: (isHeadshot) => {
            setHitMarker({ isHeadshot, timestamp: Date.now() });
          },
          onGameOver: (finalStats, roundSurvived) => {
            setScreen('GAMEOVER');
            // Update profile stats
            const newTotalKills = profile.totalKills + finalStats.kills;
            const newHighestRound = Math.max(profile.highestRound, roundSurvived);
            const gainedXp = finalStats.xp;
            let currentXp = profile.xp + gainedXp;
            let currentLevel = profile.level;

            while (currentXp >= currentLevel * 1000) {
              currentXp -= currentLevel * 1000;
              currentLevel++;
            }

            const updated: SaveProfile = {
              ...profile,
              level: currentLevel,
              xp: currentXp,
              totalKills: newTotalKills,
              highestRound: newHighestRound
            };

            setProfile(updated);
            saveProfile(updated);
          }
        }
      );

      engineRef.current = engine;
    }, 50);
  };

  // Keyboard shortcut for crafting menu [E]
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING') return;
      if (e.key === 'e' || e.key === 'E') {
        setIsCraftingOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCraftingOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen]);

  // Cleanup engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  const handleCraftItem = (recipeId: string) => {
    if (engineRef.current) {
      engineRef.current.craftItem(recipeId);
    }
  };

  const handlePlayAgain = () => {
    setScreen('TITLE');
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Isolated Three.js Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Title Screen */}
      {screen === 'TITLE' && (
        <TitleScreen
          profile={profile}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onDeploy={handleDeploy}
          onUpdateProfile={(p) => {
            setProfile(p);
            saveProfile(p);
          }}
        />
      )}

      {/* Active Game HUD */}
      {screen === 'PLAYING' && (
        <>
          <GameHUD
            stats={stats}
            weapon={currentWeapon}
            isPap={isPap}
            round={round}
            zombiesRemaining={zombiesRemaining}
            isIntermission={isIntermission}
            activePerks={activePerks}
            activePowerUps={activePowerUps}
            weather={weather}
            interactPrompt={interactPrompt}
            hitMarker={hitMarker}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenCrafting={() => setIsCraftingOpen(true)}
            onOpenPause={() => setScreen('TITLE')}
          />

          {/* Mobile On-Screen Touch Controls */}
          <MobileControls
            onMove={(dx, dy) => engineRef.current?.setVirtualMove(dx, dy)}
            onAimDelta={(dyaw, dpitch) => engineRef.current?.setVirtualAimDelta(dyaw, dpitch)}
            onShoot={(active) => engineRef.current?.triggerVirtualShoot(active)}
            onReload={() => engineRef.current?.triggerVirtualReload()}
            onInteract={() => engineRef.current?.triggerVirtualInteract()}
            onJump={() => engineRef.current?.triggerVirtualJump()}
            onToggleADS={() => engineRef.current?.triggerVirtualADS()}
            onOpenCrafting={() => setIsCraftingOpen(true)}
          />

          {/* Tactical Crafting Bench Modal */}
          <CraftingModal
            points={stats.points}
            isOpen={isCraftingOpen}
            onClose={() => setIsCraftingOpen(false)}
            onCraft={handleCraftItem}
          />
        </>
      )}

      {/* Game Over Casualty Report Modal */}
      {screen === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          roundSurvived={round}
          isOpen={true}
          onPlayAgain={() => handleDeploy('SOLO', 'ALPHA', profile.selectedSkinId, profile.selectedWeaponId)}
          onReturnTitle={handlePlayAgain}
        />
      )}
    </div>
  );
}
