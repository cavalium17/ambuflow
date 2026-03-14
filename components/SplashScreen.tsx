import React, { useState, useEffect } from 'react';
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
    "Localisation des boulangeries à proximité...",
    "Optimisation de votre planning..."
  ];

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 3500;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      let currentProgress = 0;

      if (elapsed < 1000) {
        currentProgress = (elapsed / 1000) * 65;
      } else if (elapsed < totalDuration) {
        const phase2Elapsed = elapsed - 1000;
        currentProgress = 65 + (phase2Elapsed / 2500) * 35;
      } else {
        currentProgress = 100;
      }

      setProgress(currentProgress);
      setMessageIndex(Math.min(Math.floor((currentProgress / 100) * loadingMessages.length), loadingMessages.length - 1));

      if (currentProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setIsReady(true);
          setTimeout(onComplete, 800);
        }, 200);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  return (
    // Suppression du dégradé bleu -> Utilisation du noir profond #0B0E14
    <div className="fixed inset-0 z-[100] bg-[#0B0E14] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Conteneur Logo Central */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mb-8"
        >
          {/* Appel direct à l'image dans le dossier public */}
          <img 
            src="/pwa-512x512.png" 
            alt="AmbuFlow Logo" 
            className="w-32 h-32 object-contain animate-pulse shadow-2xl rounded-3xl"
          />
        </motion.div>

        {/* Barre de progression harmonisée */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div 
            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Messages de chargement */}
        <div className="h-10 text-center px-6">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.p
                key="ready"
                initial={{ opacity: 0, scale: 0.8 }}
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
                className="space-y-1"
              >
                <p className="text-white font-bold text-[13px]">
                  AmbuFlow
                </p>
                <p className="text-white/40 text-[10px] font-medium italic">
                  {loadingMessages[messageIndex]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Powered By */}
      <div className="absolute bottom-12 flex items-center gap-2 opacity-20">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
          Powered by Gemini AI
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;