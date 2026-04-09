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
  darkMode, userName, status, setStatus, activeShift, 
  onStartService, onEndService, onToggleBreak, shifts, userStats, onOpenAssistant
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  
  // RE-FIX : On s'assure que todayShifts récupère bien les données pour l'Agenda
  const todayShifts = useMemo(() => 
    shifts.filter(s => s.day === today || s.date === today),
    [shifts, today]
  );

  const nextShiftCountdown = useMemo(() => {
    const upcoming = shifts.find(s => {
      const d = s.day || s.date;
      const shiftDate = new Date(`${d}T${s.start || s.startTime}`);
      return shiftDate > now;
    });
    if (!upcoming) return null;
    const d = upcoming.day || upcoming.date;
    const diff = new Date(`${d}T${upcoming.start || upcoming.startTime}`).getTime() - now.getTime();
    if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `T- ${h}h ${m}m ${s}s`;
  }, [shifts, now]);

  return (
    <div className={`p-5 space-y-6 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} min-h-screen overflow-y-auto`}>
      
      {/* HEADER : Main animée fixée */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AMBUFLOW</p>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Salut, {userName.split(' ')[0]}
            </h1>
            <motion.div
              animate={{ rotate: [0, 15, -10, 15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: 'bottom center', display: 'inline-block' }}
              className="text-2xl origin-bottom"
            >
              👋
            </motion.div>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-100'}`}>
          <Zap className="text-amber-400" fill="currentColor" size={20} />
        </div>
      </div>

      {/* BOX MISSION : Horloge + Décompte */}
      <div className="relative pt-2">
        <AnimatePresence>
          {nextShiftCountdown && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 px-4 py-1.5 rounded-full border border-indigo-400/30 shadow-lg">
              <p className="text-[9px] font-black text-white uppercase tracking-wider">Prise de poste : {nextShiftCountdown}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`rounded-[32px] border p-8 ${status !== ServiceStatus.OFF ? 'bg-zinc-900 border-indigo-500' : (darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-100')}`}>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Mission en cours
              </p>
              <h2 className={`text-6xl font-black tracking-tighter tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
            </div>
            <div className="flex gap-3 w-full">
              {status === ServiceStatus.OFF ? (
                <button onClick={onStartService} className="flex-1 py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase text-sm">Prendre le service</button>
              ) : (
                <>
                  <button onClick={onToggleBreak} className="p-5 rounded-2xl bg-white/5 text-amber-500 border border-white/10"><Coffee size={24} /></button>
                  <button onClick={onEndService} className="flex-1 py-5 rounded-2xl bg-rose-500 text-white font-black uppercase text-sm">Fin de service</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AGENDA : Aujourd'hui */}
      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Agenda du jour</span>
          </div>
        </div>

        {todayShifts.length > 0 ? (
          <div className="space-y-4">
            {todayShifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500"><MapPin size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-white">{shift.start || shift.startTime} - {shift.end || shift.endTime}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{shift.vehicle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[10px] font-black text-slate-500 uppercase py-4">Aucune mission planifiée</p>
        )}
      </div>
    </div>
  );
};

export default BoardTab;