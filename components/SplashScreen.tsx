
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Truck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const loadingMessages = [
    "Récupération de la feuille de route...",
    "Vérification du matériel de bord...",
    "Calcul des indemnités d'ancienneté (IDCC 16)...",
    "Synchronisation des tarifs AMBU/ASSU/VSL...",
    "Localisation des boulangeries à proximité...",
    "Optimisation de votre planning..."
  ];

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 3500; // 3.5 seconds total

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      let currentProgress = 0;

      if (elapsed < 1000) {
        // Phase 1: 0 to 65% in 1s (linear for simplicity, or ease-out)
        currentProgress = (elapsed / 1000) * 65;
      } else if (elapsed < totalDuration) {
        // Phase 2: 65 to 100% in the remaining 2.5s
        const phase2Elapsed = elapsed - 1000;
        const phase2Duration = totalDuration - 1000;
        currentProgress = 65 + (phase2Elapsed / phase2Duration) * 35;
      } else {
        currentProgress = 100;
      }

      setProgress(currentProgress);

      if (elapsed < totalDuration) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);

    // Message cycling: every 1000ms
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 1000);

    return () => {
      clearInterval(messageTimer);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setIsReady(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-[500] bg-[#0B0E14] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes neon-pulse {
          0% { opacity: 0.7; filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.3)); transform: scale(1); }
          50% { opacity: 1; filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.6)); transform: scale(1.02); }
          100% { opacity: 0.7; filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.3)); transform: scale(1); }
        }
        .animate-neon-pulse {
          animation: neon-pulse 2s infinite ease-in-out;
        }
        @keyframes progress-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(139, 92, 246, 0.5)); }
          50% { filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.8)); }
        }
        .animate-progress-glow {
          animation: progress-glow 1s infinite ease-in-out;
        }
      `}</style>
      
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent_70%)]" />

      {/* Logo Section */}
      <div className="relative mb-12">
        {/* Hexagon with Pulse Animation */}
        <div className="relative w-48 h-48 flex items-center justify-center animate-neon-pulse">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-violet-500 fill-none stroke-current stroke-[1.5]">
            <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" />
          </svg>
          
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <Truck size={48} className="text-white" strokeWidth={1.5} />
              <div className="absolute -bottom-1 -right-1 bg-[#0B0E14] rounded-full p-0.5">
                <Clock size={20} className="text-violet-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Name */}
      <div className="text-center mb-24">
        <h1 className="text-violet-500 font-bold text-2xl tracking-[0.5em] uppercase">
          AMBUFLOW
        </h1>
        <div className="w-12 h-0.5 bg-violet-900/30 mx-auto mt-3 rounded-full" />
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-[300px] space-y-6">
        <div className="flex justify-between items-end px-1">
          <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest opacity-60">Système</span>
          <span className="text-[10px] font-black text-violet-500 tabular-nums">{Math.round(progress)}%</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-violet-600 ${progress >= 100 ? 'animate-progress-glow' : ''}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "tween", ease: "linear", duration: 0 }}
          />
        </div>

        {/* Dynamic Messages */}
        <div className="h-14 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.p
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-white font-black text-sm tracking-tight uppercase"
              >
                Prêt !
              </motion.p>
            ) : (
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-1.5"
              >
                <p className="text-white font-bold text-[13px] tracking-tight">
                  Initialisation de vos données...
                </p>
                <p className="text-white/40 text-[10px] font-medium italic">
                  {loadingMessages[messageIndex]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 opacity-30">
          <div className="w-3 h-3 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
            Powered by <span className="text-white">AMBUTECH</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
