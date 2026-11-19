/**
 * Game Over Casualty Report & Debrief Modal for Outbreak: Dead Zone.
 */

import React from 'react';
import { Skull, Crosshair, Award, RotateCcw, Home } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface GameOverModalProps {
  stats: PlayerStats;
  roundSurvived: number;
  isOpen: boolean;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  roundSurvived,
  isOpen,
  onPlayAgain,
  onReturnTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none font-sans">
      <div className="bg-slate-950 border-2 border-red-900/80 w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative text-white flex flex-col gap-6">
        {/* Casualty Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600/90 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] mb-3">
            <Skull className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-3xl font-black tracking-wider text-red-500 uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            OPERATIVE KIA
          </h2>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">
            ALL SQUAD MEMBERS WERE ELIMINATED
          </p>
        </div>

        {/* Big Round Stat */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">WAVES SURVIVED</span>
          <span className="text-5xl font-black text-amber-400 tabular-nums my-1">
            {roundSurvived}
          </span>
          <span className="text-[11px] text-slate-500 font-bold uppercase">OUTBREAK CONTAINMENT FAILED</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
            <Skull className="w-4 h-4 text-red-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">ZOMBIES KILLED</span>
            <span className="text-xl font-black text-white tabular-nums">{stats.kills}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
            <Crosshair className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">HEADSHOTS</span>
            <span className="text-xl font-black text-white tabular-nums">{stats.headshots}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
            <Award className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">XP EARNED</span>
            <span className="text-xl font-black text-emerald-400 tabular-nums">+{stats.xp}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onReturnTitle}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>TITLE MENU</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="flex-2 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.5)] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REDEPLOY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
