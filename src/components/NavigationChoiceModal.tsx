
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map as MapIcon, Navigation as NavIcon } from 'lucide-react';

interface NavigationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude?: number;
  longitude?: number;
  address?: string;
  name?: string;
  darkMode: boolean;
}

const NavigationChoiceModal: React.FC<NavigationChoiceModalProps> = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  address,
  name,
  darkMode
}) => {
  const handleGoogleMaps = () => {
    let url = '';
    if (latitude && longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`;
    }
    window.open(url, '_blank');
    onClose();
  };

  const handleWaze = () => {
    let url = '';
    if (latitude && longitude) {
      url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    } else {
      url = `https://waze.com/ul?q=${encodeURIComponent(name + " " + address)}&navigate=yes`;
    }
    window.open(url, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-xs overflow-hidden rounded-[32px] border ${
              darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            } shadow-2xl`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Choisir le GPS</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleMaps}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${
                    darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                    <MapIcon size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Google Maps</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation Standard</p>
                  </div>
                </button>

                <button
                  onClick={handleWaze}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${
                    darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                    <NavIcon size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Waze</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trafic en temps réel</p>
                  </div>
                </button>
                <button
                  onClick={onClose}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${
                    darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <p className="font-black text-xs uppercase tracking-[0.2em]">Plus tard</p>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NavigationChoiceModal;
