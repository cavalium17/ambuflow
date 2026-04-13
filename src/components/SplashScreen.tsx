import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const loadingMessages = [
    "Récupération de la feuille de route...",
    "Calcul des indemnités d'ancienneté (IDCC 16)...",
    "Analyse des temps de pause...",
    "Optimisation de votre planning..."
  ];

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 3000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      let currentProgress = 0;

      if (elapsed < 1000) {
        currentProgress = (elapsed / 1000) * 65;
      } else if (elapsed < totalDuration) {
        const phase2Elapsed = elapsed - 1000;
        currentProgress = 65 + (phase2Elapsed / (totalDuration - 1000)) * 35;
      } else {
        currentProgress = 100;
      }

      setProgress(currentProgress);
      
      const nextMessageIndex = Math.min(
        Math.floor((currentProgress / 100) * loadingMessages.length), 
        loadingMessages.length - 1
      );
      setMessageIndex(nextMessageIndex);

      if (currentProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsReady(true);
        // On attend un tout petit peu pour que l'utilisateur voit le "Prêt à rouler"
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  // Génération d'un timestamp pour forcer le rafraîchissement de l'image sur smartphone
  const cacheBuster = useMemo(() => new Date().getTime(), []);

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Effets de lumière en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/10 blur-[80px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-sm">
        
        {/* Barre de progression stylisée */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Messages de chargement dynamiques */}
        <div className="h-12 text-center px-8">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.p
                key="ready"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-emerald-400 font-black text-xs tracking-[0.2em] uppercase"
              >
                Prêt à rouler
              </motion.p>
            ) : (
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1"
              >
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  Initialisation
                </p>
                <p className="text-white text-[11px] font-medium italic opacity-80">
                  {loadingMessages[messageIndex]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer discret */}
      <div className="absolute bottom-12 flex items-center gap-2 opacity-20">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
          Version 2.0 • AmbuFlow Pro
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
