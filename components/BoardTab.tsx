import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Play, Coffee, Zap, TrendingUp, Calendar,
  ChevronRight, Sparkles, MapPin, AlertCircle, LogOut, Utensils
} from 'lucide-react';
import { Shift, ServiceStatus, UserStats } from '../types';

interface BoardTabProps {
  darkMode: boolean;
  userName: string;
  status: ServiceStatus;
  setStatus: (status: ServiceStatus) => void;
  activeShift: Shift | null;
  onStartService: () => void;
  onEndService: () => void;
  onToggleBreak: () => void;
  shifts: Shift[];
  userStats: UserStats;
  onOpenAssistant: () => void;
}

const BoardTab: React.FC<BoardTabProps> = ({
  darkMode,
  userName,
  status,
  activeShift,
  onStartService,
  onEndService,
  onToggleBreak,
  shifts,
  userStats,
  onOpenAssistant,
}) => {
  const [now, setNow] = useState(new Date());

  // Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  
  const todayShifts = useMemo(() => 
    shifts.filter(s => s.day === today),
    [shifts, today]
  );

  // Décompte Prochaine Mission
  const nextShiftCountdown = useMemo(() => {
    const upcoming = shifts.find(s => {
      const shiftDate = new Date(`${s.day}T${s.start}`);
      return shiftDate > now;
    });
    if (!upcoming) return null;
    const diff = new Date(`${upcoming.day}T${upcoming.start}`).getTime() - now.getTime();
    if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `T- ${h}h ${m}m ${s}s`;
  }, [shifts, now]);

  const weeklyHours = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const totalMin = shifts.filter(s => new Date(s.day) >= startOfWeek && s.end !== '--:--')
      .reduce((acc, s) => {
        const [h1, m1] = s.start.split(':').map(Number);
        const [h2, m2] = s.end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 1440;
        const breakDur = s.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
        return acc + (diff - breakDur);
      }, 0);
    return (totalMin / 60).toFixed(1);
  }, [shifts, now]);

  return (
    <div className={`p-5 space-y-6 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} min-h-screen overflow-y-auto`}>
      
      {/* Header avec Main Animée Forcée */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AMBUFLOW</p>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Salut, {userName.split(' ')[0]}
            </h1>
            <motion.span 
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: '70% 70%', display: 'inline-block' }}
              className="text-2xl"
            >
              👋
            </motion.span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-100'}`}>
          <Zap className="text-amber-400" fill="currentColor" size={20} />
        </div>
      </div>

      {/* Box Principale avec Horloge et Décompte */}
      <div className="relative pt-2">
        <AnimatePresence>
          {nextShiftCountdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 px-4 py-1.5 rounded-full border border-indigo-400/30"
            >
              <p className="text-[9px] font-black text-white uppercase tracking-wider">
                Prochaine prise : {nextShiftCountdown}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`relative overflow-hidden rounded-[32px] border p-8 ${status !== ServiceStatus.OFF ? 'bg-zinc-900 border-indigo-500 shadow-2xl shadow-indigo-500/20' : (darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-100 shadow-xl')}`}>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Mission en cours
              </p>
              <h2 className={`text-6xl font-black tracking-tighter tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
            </div>

            <div className="flex gap-3 w-full">
              {status === ServiceStatus.OFF ? (
                <button onClick={onStartService} className="flex-1 py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm">
                  Prendre le service
                </button>
              ) : (
                <>
                  <button onClick={onToggleBreak} className="p-5 rounded-2xl bg-white/5 text-amber-500 border border-white/10 active:scale-90 transition-transform">
                    <Coffee size={24} />
                  </button>
                  <button onClick={onEndService} className="flex-1 py-5 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                    <LogOut size={20} /> Fin
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats et Planning Today (Inchangé pour la complétion) */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 text-indigo-500 mb-3">
            <TrendingUp size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Semaine</span>
          </div>
          <p className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>{weeklyHours}h</p>
        </div>
        <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 text-emerald-500 mb-3">
            <Zap size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Niveau {userStats.level}</span>
          </div>
          <p className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>{userStats.xp % 1000} XP</p>
        </div>
      </div>
    </div>
  );
};

export default BoardTab;