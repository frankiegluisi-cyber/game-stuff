/**
 * Tactical Crafting Bench Dock Modal for Outbreak: Dead Zone.
 */

import React from 'react';
import { CRAFTING_RECIPES, CraftingRecipe } from '../game/gameState';
import { Hammer, Crosshair, PlusCircle, Flame, X, ShieldAlert } from 'lucide-react';

interface CraftingModalProps {
  points: number;
  isOpen: boolean;
  onClose: () => void;
  onCraft: (recipeId: string) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  points,
  isOpen,
  onClose,
  onCraft
}) => {
  if (!isOpen) return null;

  const iconMap: Record<string, React.ReactNode> = {
    Crosshair: <Crosshair className="w-6 h-6 text-cyan-400" />,
    Hammer: <Hammer className="w-6 h-6 text-amber-400" />,
    PlusCircle: <PlusCircle className="w-6 h-6 text-emerald-400" />,
    Flame: <Flame className="w-6 h-6 text-rose-400" />
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative text-white flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Hammer className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide uppercase text-white">FIELD CRAFTING BENCH</h2>
              <p className="text-xs text-slate-400">Convert scavenged scrap into tactical combat assets</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">AVAILABLE:</span>
              <span className="text-sm font-black text-emerald-400 tabular-nums">{points.toLocaleString()} PTS</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {CRAFTING_RECIPES.map((recipe: CraftingRecipe) => {
            const canAfford = points >= recipe.scrapCost;

            return (
              <div
                key={recipe.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                    {iconMap[recipe.icon] || <ShieldAlert className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{recipe.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{recipe.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <span className="text-xs font-black text-amber-400 tabular-nums">
                    {recipe.scrapCost} SCRAP
                  </span>
                  <button
                    disabled={!canAfford}
                    onClick={() => onCraft(recipe.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    BUILD
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="text-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          Pro-Tip: Automated Sentries defend bunker chokepoints while you scavenge for scrap.
        </div>
      </div>
    </div>
  );
};
