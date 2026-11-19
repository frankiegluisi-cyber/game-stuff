/**
 * Mobile Touch Controls with First-Person Virtual Joysticks & Tactical Action Buttons.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Target, RefreshCw, Hammer, Hand, ArrowUp, Eye } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onAimDelta: (deltaYaw: number, deltaPitch: number) => void;
  onShoot: (active: boolean) => void;
  onReload: () => void;
  onInteract: () => void;
  onJump: () => void;
  onToggleADS: () => void;
  onOpenCrafting: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onAimDelta,
  onShoot,
  onReload,
  onInteract,
  onJump,
  onToggleADS,
  onOpenCrafting
}) => {
  const moveJoystickRef = useRef<HTMLDivElement>(null);
  const moveThumbRef = useRef<HTMLDivElement>(null);
  const lookPadRef = useRef<HTMLDivElement>(null);
  const [isADSActive, setIsADSActive] = useState(false);

  // Touch listener for movement joystick
  useEffect(() => {
    const joy = moveJoystickRef.current;
    const thumb = moveThumbRef.current;
    if (!joy || !thumb) return;

    let touchId: number | null = null;
    let centerX = 0;
    let centerY = 0;
    const radius = 45;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      const rect = joy.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      updateThumb(t.clientX, t.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          updateThumb(t.clientX, t.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          thumb.style.transform = `translate(0px, 0px)`;
          onMove(0, 0);
          break;
        }
      }
    };

    const updateThumb = (tx: number, ty: number) => {
      let dx = tx - centerX;
      let dy = ty - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }
      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      onMove(dx / radius, dy / radius);
    };

    joy.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      joy.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove]);

  // Touch listener for First-Person Look Swipe Area
  useEffect(() => {
    const pad = lookPadRef.current;
    if (!pad) return;

    let touchId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      lastX = t.clientX;
      lastY = t.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          const dx = t.clientX - lastX;
          const dy = t.clientY - lastY;
          lastX = t.clientX;
          lastY = t.clientY;
          onAimDelta(dx * 0.005, dy * 0.005);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          break;
        }
      }
    };

    pad.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      pad.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onAimDelta]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex justify-between p-4 sm:p-6 select-none md:hidden">
      {/* Left Joystick: Movement & Strafing */}
      <div className="self-end pointer-events-auto">
        <div
          ref={moveJoystickRef}
          className="w-28 h-28 rounded-full bg-slate-900/70 border-2 border-slate-700/80 flex items-center justify-center relative touch-none shadow-xl"
        >
          <div
            ref={moveThumbRef}
            className="w-12 h-12 rounded-full bg-red-600/90 border border-white/60 shadow-lg pointer-events-none"
          />
        </div>
      </div>

      {/* Right Screen: Look Swipe Area + FPS Action Buttons */}
      <div className="self-end flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {/* ADS Aim Down Sights Toggle */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              setIsADSActive(!isADSActive);
              onToggleADS();
            }}
            className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition ${
              isADSActive
                ? 'bg-amber-500 border-white text-slate-950 font-black'
                : 'bg-slate-800/90 border-slate-600 text-white'
            }`}
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* Jump Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onJump();
            }}
            className="w-11 h-11 rounded-full bg-slate-800/90 border border-slate-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Interact Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
            className="w-11 h-11 rounded-full bg-amber-600/90 border border-amber-300 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onReload();
            }}
            className="w-11 h-11 rounded-full bg-slate-800/90 border border-slate-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Crafting Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onOpenCrafting();
            }}
            className="w-11 h-11 rounded-full bg-cyan-600/90 border border-cyan-300 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <Hammer className="w-5 h-5" />
          </button>
        </div>

        {/* Right Touch Look Area & Fire Button */}
        <div className="flex items-center gap-2">
          {/* Swipe Look Surface */}
          <div
            ref={lookPadRef}
            className="w-28 h-28 rounded-2xl bg-slate-900/40 border border-slate-700/60 flex items-center justify-center touch-none text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center p-2"
          >
            DRAG TO LOOK
          </div>

          {/* Big Red Shoot Trigger Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onShoot(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onShoot(false);
            }}
            className="w-20 h-20 rounded-full bg-red-600 active:bg-red-500 border-2 border-white/60 shadow-[0_0_20px_rgba(220,38,38,0.7)] flex items-center justify-center text-white font-black text-xs active:scale-95 transition"
          >
            <Target className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
