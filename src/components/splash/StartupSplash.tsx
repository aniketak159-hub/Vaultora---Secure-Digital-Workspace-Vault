import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useVault } from '../../context/VaultContext';

// Module-level guard so in-session route changes, re-renders, or lock/unlock never re-trigger
let hasAnimatedThisSession = false;

interface StartupSplashProps {
  onAnimationComplete?: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({ onAnimationComplete }) => {
  const { isStorageReady } = useVault();

  // Check if animation has already run in this window session
  const [shouldRender, setShouldRender] = useState(() => {
    if (hasAnimatedThisSession) return false;
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('vaultora_startup_animated') === 'true') {
        hasAnimatedThisSession = true;
        return false;
      }
    } catch {
      // sessionStorage might be restricted; module guard is fallback
    }
    return true;
  });

  const [step, setStep] = useState<number>(0);
  // step 0: mounted, dark backdrop active
  // step 1: logo entrance (scale 75% -> 100%, fade in)
  // step 2: subtle glow & settling
  // step 3: brand wordmark reveal
  // step 4: subtitle tagline reveal
  // step 5: ready to exit (smooth crossfade out)

  const [isExiting, setIsExiting] = useState(false);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Listen for replay events (e.g. from Settings or dev preview)
  useEffect(() => {
    const handleReplay = () => {
      hasAnimatedThisSession = false;
      try {
        sessionStorage.removeItem('vaultora_startup_animated');
      } catch {}
      setShouldRender(true);
      setStep(0);
      setIsExiting(false);
      setShowSlowNotice(false);
    };

    window.addEventListener('vaultora:replay-splash', handleReplay);
    return () => window.removeEventListener('vaultora:replay-splash', handleReplay);
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    // Check for user's reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion) {
      // For reduced motion: show static presentation immediately without scaling/motion
      setStep(4);
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          completeSplash();
        }, 200);
      }, 500);
      timersRef.current.push(exitTimer);
      return;
    }

    // Sequence for standard motion:
    // 0ms - 50ms: Step 1 (Logo entrance begins: scale 75% -> 100%, opacity 0 -> 1)
    const t1 = setTimeout(() => setStep(1), 50);

    // 400ms: Step 2 (Subtle settling and glow)
    const t2 = setTimeout(() => setStep(2), 400);

    // 650ms: Step 3 (Brand wordmark reveal)
    const t3 = setTimeout(() => setStep(3), 650);

    // 850ms: Step 4 (Subtitle tagline reveal)
    const t4 = setTimeout(() => setStep(4), 850);

    // Track if storage is taking longer than expected (3.5s)
    const slowTimer = setTimeout(() => {
      setShowSlowNotice(true);
    }, 3500);

    timersRef.current.push(t1, t2, t3, t4, slowTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [shouldRender]);

  // When step >= 4 and isStorageReady is true (or after minimum 1100ms), begin exit transition
  useEffect(() => {
    if (!shouldRender || step < 4 || isExiting) return;

    const checkAndExit = () => {
      setIsExiting(true);
      const exitTimeout = setTimeout(() => {
        completeSplash();
      }, 350); // 350ms smooth crossfade duration
      timersRef.current.push(exitTimeout);
    };

    if (isStorageReady) {
      const exitDelay = setTimeout(checkAndExit, 250);
      timersRef.current.push(exitDelay);
    } else {
      // If storage is still initializing, wait until isStorageReady flips to true
      // (or fallback timeout after 5s to avoid any infinite hangs)
      const fallbackExit = setTimeout(checkAndExit, 5000);
      timersRef.current.push(fallbackExit);
    }
  }, [shouldRender, step, isStorageReady, isExiting]);

  const completeSplash = () => {
    hasAnimatedThisSession = true;
    try {
      sessionStorage.setItem('vaultora_startup_animated', 'true');
    } catch {}
    setShouldRender(false);
    onAnimationComplete?.();
  };

  if (!shouldRender) return null;

  return (
    <div 
      role="status"
      aria-label="Loading Vaultora"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none transition-opacity duration-300 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient lighting */}
      <div 
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 transition-opacity duration-700 pointer-events-none ${
          step >= 1 ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Main Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm">
        
        {/* Logo Tile with Ambient Glow */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Violet Glow Aura */}
          <div 
            className={`absolute w-32 h-32 rounded-full bg-indigo-500/25 blur-2xl transition-all duration-700 pointer-events-none ${
              step >= 2 ? 'opacity-100 scale-110 animate-vaultora-glow' : 'opacity-0 scale-75'
            }`} 
          />

          {/* Rounded Square Vaultora Tile */}
          <div 
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 ring-1 ring-white/20 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
              step >= 1 
                ? 'opacity-100 scale-100 translate-y-0 animate-vaultora-entrance' 
                : 'opacity-0 scale-75 translate-y-2'
            }`}
          >
            {/* Lock Icon with subtle settling glow */}
            <Lock 
              className={`w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.2] transition-transform duration-500 ${
                step >= 2 ? 'scale-100' : 'scale-90'
              }`} 
            />
          </div>
        </div>

        {/* Brand Wordmark Reveal */}
        <div className="space-y-1.5 overflow-hidden">
          <h1 
            className={`text-2xl sm:text-3xl font-bold tracking-tight text-white transition-all duration-500 ease-out ${
              step >= 3 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-2'
            }`}
          >
            Vaultora
          </h1>

          {/* Subtitle Tagline Reveal */}
          <p 
            className={`text-xs sm:text-sm text-slate-400 font-medium tracking-wide transition-all duration-500 ease-out ${
              step >= 4 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-1.5'
            }`}
          >
            Your secure digital vault.
          </p>
        </div>

        {/* Security Architecture Badge */}
        <div 
          className={`mt-6 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tracking-wider uppercase transition-opacity duration-500 ${
            step >= 4 ? 'opacity-80' : 'opacity-0'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Knowledge Encryption</span>
        </div>

        {/* Slow Storage Notice / Diagnostics Fallback */}
        {showSlowNotice && !isExiting && (
          <div className="mt-6 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2 max-w-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left">
              <span className="block font-medium text-white">Initializing storage...</span>
              <span className="text-[11px] text-slate-400">Verifying secure database keys</span>
            </div>
            <button
              onClick={completeSplash}
              className="ml-auto px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 rounded font-medium transition-colors cursor-pointer"
            >
              Skip
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
