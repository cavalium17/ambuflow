import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Coffee, Euro, Timer, Palmtree, PieChart, CheckCircle2, MapPin, Zap } from 'lucide-react';
import { Shift, ServiceStatus } from '../types';

interface BoardTabProps {
  darkMode: boolean;
  userName: string;
  status: ServiceStatus;
  shifts: Shift[];
  hourlyRate: string;
}

const BoardTab: React.FC<BoardTabProps> = ({ darkMode, userName, status, shifts, hourlyRate }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toLocaleDateString('en-CA');
  const todayShift = useMemo(() => shifts.find(s => (s.day || s.date) === todayStr), [shifts, todayStr]);

  // Décompte
  const countdown = useMemo(() => {
    if (!todayShift || todayShift.type !== 'WORK' || status !== 'OFF') return null;
    const target = new Date(`${todayStr}T${todayShift.start}`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0 || diff > 12 * 3600000) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  }, [todayShift, now, status]);

  // Stats
  const stats = useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    let totalWorkMin = 0;
    let vTime = { ASSU: 0, AMBU: 0, VSL: 0 };

    shifts.forEach(s => {
      if (s.type === 'WORK') {
        const [h1, m1] = s.start.split(':').map(Number);
        const [h2, m2] = s.end.split(':').map(Number);
        let d = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (d < 0) d += 1440;
        totalWorkMin += d;
        if (s.vehicle.includes('ASSU')) vTime.ASSU += d;
        else if (s.vehicle.includes('AMBU')) vTime.AMBU += d;
        else vTime.VSL += d;
      }
    });

    return { pay: (totalWorkMin / 60) * rate, vTime, totalWorkMin };
  }, [shifts, hourlyRate]);

  return (
    <div className={`p-5 space-y-6 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} min-h-screen pb-32`}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AMBUFLOW</p>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Salut, {userName.split(' ')[0]} <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ display: 'inline-block' }}>👋</motion.span>
          </h1>
        </div>
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
          <Zap size={20} fill="currentColor" />
        </div>
      </div>

      {/* DÉCOMPTE */}
      <AnimatePresence>
        {countdown && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-600 p-4 rounded-3xl text-center shadow-lg shadow-indigo-500/20">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Prise de poste dans</p>
            <p className="text-2xl font-black text-white">{countdown}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRILLE STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white shadow-sm border-slate-200'}`}>
          <Euro className="text-emerald-500 mb-2" size={20} />
          <p className="text-[9px] font-black text-zinc-500 uppercase">Gains Est.</p>
          <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.pay.toFixed(2)}€</p>
        </div>
        <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white shadow-sm border-slate-200'}`}>
          <Timer className="text-indigo-500 mb-2" size={20} />
          <p className="text-[9px] font-black text-zinc-500 uppercase">Amplitude</p>
          <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.floor(stats.totalWorkMin / 60)}h{stats.totalWorkMin % 60}</p>
        </div>
      </div>

      {/* RÉPARTITION VÉHICULES */}
      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white shadow-sm border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-4 text-zinc-500">
          <PieChart size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Véhicules (%)</span>
        </div>
        <div className="space-y-3">
          {Object.entries(stats.vTime).map(([v, time]) => {
            const perc = stats.totalWorkMin > 0 ? (time / stats.totalWorkMin) * 100 : 0;
            return (
              <div key={v}>
                <div className="flex justify-between text-[10px] font-black mb-1 text-zinc-400"><span>{v}</span><span>{perc.toFixed(0)}%</span></div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} className="h-full bg-indigo-500" /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONGÉS */}
      <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 rounded-[32px] text-white flex justify-between items-center relative overflow-hidden shadow-lg shadow-orange-500/20">
        <div className="z-10">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Congés Payés Restants</p>
          <p className="text-4xl font-black">21.5 <span className="text-sm opacity-60">JOURS</span></p>
        </div>
        <Palmtree size={60} className="opacity-20 z-0 rotate-12" />
      </div>

      {/* BENTO DU JOUR & ENCOCHE */}
      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white shadow-sm border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aujourd'hui</span>
          {status !== 'OFF' && todayShift && <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]"><CheckCircle2 size={16} /> VALIDÉ</div>}
        </div>
        {todayShift ? (
          <div className={`p-4 rounded-2xl flex items-center gap-4 ${todayShift.type === 'LEAVE' ? 'bg-orange-500/10' : 'bg-indigo-500/10'}`}>
            <MapPin size={20} className={todayShift.type === 'LEAVE' ? 'text-orange-500' : 'text-indigo-500'} />
            <div>
              <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{todayShift.type === 'LEAVE' ? 'CONGÉS' : `${todayShift.start} - ${todayShift.end}`}</p>
              <p className="text-[10px] font-bold text-zinc-500">{todayShift.vehicle}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-[10px] font-black text-zinc-600 uppercase italic py-2">Aucune planification</p>
        )}
      </div>
    </div>
  );
};

export default BoardTab;