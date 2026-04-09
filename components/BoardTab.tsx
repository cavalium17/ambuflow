import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Play, Coffee, Zap, TrendingUp, Calendar, ChevronRight, 
  MapPin, CheckCircle2, Car, Euro, Timer, Palmtree, PieChart
} from 'lucide-react';
import { Shift, ServiceStatus, UserStats } from '../types';

interface BoardTabProps {
  darkMode: boolean;
  userName: string;
  status: ServiceStatus;
  shifts: Shift[];
  userStats: UserStats;
  hourlyRate: string;
}

const BoardTab: React.FC<BoardTabProps> = ({
  darkMode, userName, status, shifts, userStats, hourlyRate
}) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toLocaleDateString('en-CA');

  // --- LOGIQUE DE CALCUL DES STATS ---
  const stats = useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    
    // 1. Amplitude & Gains
    const calculateData = (shiftList: Shift[]) => {
      let totalAmp = 0; // en minutes
      let totalWork = 0; // en minutes
      shiftList.forEach(s => {
        if (!s.start || !s.end || s.end === '--:--') return;
        const [h1, m1] = s.start.split(':').map(Number);
        const [h2, m2] = s.end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 1440;
        totalAmp += diff;
        const breakDur = s.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
        totalWork += (diff - breakDur);
      });
      return { amp: totalAmp, work: totalWork, pay: (totalWork / 60) * rate };
    };

    const todayShift = shifts.find(s => (s.day || s.date) === todayStr && s.type !== 'LEAVE');
    const todayData = todayShift ? calculateData([todayShift]) : { amp: 0, work: 0, pay: 0 };
    
    // Stats Semaine (7 derniers jours)
    const weekData = calculateData(shifts.filter(s => s.type !== 'LEAVE'));

    // 2. Répartition Véhicules (%)
    const vehicleTime: Record<string, number> = { ASSU: 0, AMBU: 0, VSL: 0 };
    shifts.forEach(s => {
      if (s.type === 'WORK' && s.vehicle) {
        const v = s.vehicle.toUpperCase();
        const [h1, m1] = s.start.split(':').map(Number);
        const [h2, m2] = s.end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 1440;
        if (v.includes('ASSU')) vehicleTime.ASSU += diff;
        else if (v.includes('AMBU')) vehicleTime.AMBU += diff;
        else if (v.includes('VSL')) vehicleTime.VSL += diff;
      }
    });

    return { todayData, weekData, vehicleTime };
  }, [shifts, todayStr, hourlyRate]);

  return (
    <div className={`p-5 space-y-6 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} min-h-screen pb-32`}>
      
      {/* HEADER : Main animée */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Salut, {userName.split(' ')[0]} <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ display: 'inline-block' }}>👋</motion.span>
          </h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tableau de bord</p>
        </div>
      </div>

      {/* GRID STATS : Gains & Amplitude */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <Euro className="text-emerald-500 mb-2" size={20} />
          <p className="text-[9px] font-black text-zinc-500 uppercase">Gains (Sem.)</p>
          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.weekData.pay.toFixed(2)}€</p>
        </div>
        <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <Timer className="text-indigo-500 mb-2" size={20} />
          <p className="text-[9px] font-black text-zinc-500 uppercase">Amplitude (J)</p>
          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.floor(stats.todayData.amp / 60)}h{stats.todayData.amp % 60}m</p>
        </div>
      </div>

      {/* SECTION VÉHICULES (Répartition %) */}
      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={16} className="text-indigo-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Répartition Véhicules</span>
        </div>
        <div className="space-y-4">
          {['ASSU', 'AMBU', 'VSL'].map(v => {
            const time = stats.vehicleTime[v];
            const total = Object.values(stats.vehicleTime).reduce((a, b) => a + b, 0) || 1;
            const percent = (time / total) * 100;
            return (
              <div key={v}>
                <div className="flex justify-between text-[10px] font-black mb-1">
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{v}</span>
                  <span className="text-zinc-500">{Math.floor(time/60)}h / {percent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-indigo-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONGÉS PAYÉS RESTANTS */}
      <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 rounded-[32px] text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Palmtree size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Solde Congés</span>
          </div>
          <p className="text-4xl font-black">21.5 <span className="text-sm font-bold opacity-70 uppercase">Jours</span></p>
        </div>
        <Palmtree size={100} className="absolute -right-5 -bottom-5 opacity-20 rotate-12" />
      </div>

      {/* PLANIFICATION DU JOUR & ENCOCHE */}
      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
         <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Planning du jour</span>
            {status !== 'OFF' && <CheckCircle2 className="text-emerald-500" size={18} />}
         </div>
         {/* ... (Reste de la planification identique au code précédent) */}
      </div>

    </div>
  );
};

export default BoardTab;