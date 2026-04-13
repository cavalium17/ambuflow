import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  Clock, 
  Play, 
  Coffee, 
  Zap, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Sparkles,
  MapPin,
  AlertCircle,
  LogOut,
  Utensils,
  Timer,
  Hourglass,
  Euro,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Shift, ServiceStatus, ActivityLog, UserStats, ModulationStats, Break } from '../types';
import { useModulation } from '../hooks/useModulation';

import { LiveClock } from './LiveClock';
import { WorkDuration } from './WorkDuration';
import { Countdown } from './Countdown';

interface BoardTabProps {
  darkMode: boolean;
  userName: string;
  status: ServiceStatus;
  activeShift: Shift | null;
  onStartService: () => void;
  onEndService: () => void;
  onOpenPauseModal: () => void;
  onOpenSummaryModal: () => void;
  onToggleBreak: () => void;
  shifts: Shift[];
  userStats: UserStats;
  onOpenAssistant: () => void;
  modulationInfo?: ModulationStats | null; 
  minuteTrigger: number;
  activeShiftId: string | null;
  addNotification: (title: string, message: string, type?: any) => void;
  calculateEffectiveMinutes: (shift: Shift) => number;
  hourlyRate: string;
  hoursBase: string;
  overtimeMode: string;
  modulationStartDate: string;
  modulationWeeks: string;
  leaveBalances?: { cp: number; usedCp: number; rtt: number; usedRtt: number; recup: number; usedRecup: number };
}

const BoardTab: React.FC<BoardTabProps> = React.memo(({
  darkMode,
  userName,
  status,
  activeShift,
  onStartService,
  onEndService,
  onOpenPauseModal,
  onOpenSummaryModal,
  onToggleBreak,
  shifts,
  userStats,
  onOpenAssistant,
  minuteTrigger,
  activeShiftId,
  addNotification,
  calculateEffectiveMinutes,
  hourlyRate,
  hoursBase,
  overtimeMode,
  modulationStartDate,
  modulationWeeks,
  leaveBalances
}) => {
  const effectiveCycleWeeks = useMemo(() => {
    if (overtimeMode === 'weekly') return "1";
    if (overtimeMode === 'fortnightly') return "2";
    if (overtimeMode === 'annualization') return "52";
    return modulationWeeks;
  }, [overtimeMode, modulationWeeks]);

  const modulation = useModulation(
    shifts, 
    modulationStartDate || userStats.modulationAnchorDate || new Date().toISOString().split('T')[0], 
    effectiveCycleWeeks, 
    activeShiftId, 
    new Date()
  );

  const today = new Date().toISOString().split('T')[0];
  
  const todayShifts = useMemo(() => 
    shifts.filter(s => s.day === today),
    [shifts, today]
  );

  const weeklyHours = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekShifts = shifts.filter(s => {
      const d = new Date(s.day);
      return d >= startOfWeek && (s.end !== '--:--' || s.id === activeShiftId);
    });
    
    const totalMin = weekShifts.reduce((acc, s) => {
      return acc + calculateEffectiveMinutes(s);
    }, 0);
    
    return (totalMin / 60).toFixed(1);
  }, [shifts, activeShiftId, calculateEffectiveMinutes]);

  const [earningsPeriod, setEarningsPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [hoursPeriod, setHoursPeriod] = useState<'day' | 'week'>('week');

  const statsHours = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Day TTE
    const dayShifts = shifts.filter(s => s.day === todayStr && (s.end !== '--:--' || s.id === activeShiftId));
    const dayMin = dayShifts.reduce((acc, s) => acc + calculateEffectiveMinutes(s), 0);
    
    // Week TTE
    const dayOfWeek = (now.getDay() + 6) % 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekShifts = shifts.filter(s => {
      const d = new Date(s.day);
      return d >= startOfWeek && (s.end !== '--:--' || s.id === activeShiftId);
    });
    const weekMin = weekShifts.reduce((acc, s) => acc + calculateEffectiveMinutes(s), 0);

    return {
      day: (dayMin / 60).toFixed(1),
      week: (weekMin / 60).toFixed(1)
    };
  }, [shifts, activeShiftId, calculateEffectiveMinutes, minuteTrigger]);

  const earnings = useMemo(() => {
    const now = new Date();
    // Base brut rate is 13.02€ as requested
    const brutRate = 13.02;
    // Indicated hourly rate from settings (defaulting to 13.02 if not set)
    const indicatedRate = parseFloat(hourlyRate) || 13.02;
    
    // Calculate net coefficient based on indicated rate vs base brut
    // If indicatedRate is 13.02, we apply standard 0.78 charges
    // If user indicated a different rate, we use that as the base for net calculation
    const netCoeff = 0.78;
    const effectiveNetRate = indicatedRate * netCoeff;

    // Day
    const todayStr = now.toISOString().split('T')[0];
    const dayShifts = shifts.filter(s => s.day === todayStr && (s.end !== '--:--' || s.id === activeShiftId));
    const dayMin = dayShifts.reduce((acc, s) => acc + calculateEffectiveMinutes(s), 0);
    const dayNet = (dayMin / 60) * effectiveNetRate;

    // Week
    const dayOfWeek = (now.getDay() + 6) % 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekShifts = shifts.filter(s => {
      const d = new Date(s.day);
      return d >= startOfWeek && (s.end !== '--:--' || s.id === activeShiftId);
    });
    const weekMin = weekShifts.reduce((acc, s) => acc + calculateEffectiveMinutes(s), 0);
    const weekNet = (weekMin / 60) * effectiveNetRate;

    // Month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.day);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && (s.end !== '--:--' || s.id === activeShiftId);
    });
    const monthMin = monthShifts.reduce((acc, s) => acc + calculateEffectiveMinutes(s), 0);
    const monthNet = (monthMin / 60) * effectiveNetRate;

    return {
      day: dayNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      week: weekNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      month: monthNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  }, [shifts, activeShiftId, calculateEffectiveMinutes, hourlyRate, minuteTrigger]);

  const vehicleDistribution = useMemo(() => {
    const stats = {
      ASSU: 0,
      AMBU: 0,
      VSL: 0
    };

    shifts.forEach(s => {
      if (s.isLeave || s.isConge) return;
      const mins = calculateEffectiveMinutes(s);
      if (s.vehicle.includes('ASSU')) stats.ASSU += mins;
      else if (s.vehicle.includes('AMBU')) stats.AMBU += mins;
      else if (s.vehicle.includes('VSL')) stats.VSL += mins;
    });

    const total = stats.ASSU + stats.AMBU + stats.VSL;
    if (total === 0) return [];

    return [
      { name: 'ASSU', value: stats.ASSU, color: '#f43f5e', percentage: ((stats.ASSU / total) * 100).toFixed(0) },
      { name: 'AMBU', value: stats.AMBU, color: '#6366f1', percentage: ((stats.AMBU / total) * 100).toFixed(0) },
      { name: 'VSL', value: stats.VSL, color: '#10b981', percentage: ((stats.VSL / total) * 100).toFixed(0) }
    ].filter(v => v.value > 0);
  }, [shifts, calculateEffectiveMinutes]);

  const formatDuration = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
  };

  const nextShiftCountdown = useMemo(() => {
    const now = new Date().getTime();
    
    // Find the next upcoming shift (today or future)
    const upcomingShifts = shifts
      .filter(s => {
        if (s.isLeave || s.isConge || s.end !== '--:--') return false;
        
        if (!s.day || !s.start || s.start === '--:--') return false;
        const [y, m, d] = s.day.split('-').map(Number);
        const [h, min] = s.start.split(':').map(Number);
        const startTime = new Date(y, m - 1, d, h, min, 0, 0).getTime();
        
        return startTime > now;
      })
      .sort((a, b) => {
        const [yA, mA, dA] = a.day.split('-').map(Number);
        const [hA, minA] = a.start.split(':').map(Number);
        const timeA = new Date(yA, mA - 1, dA, hA, minA, 0, 0).getTime();

        const [yB, mB, dB] = b.day.split('-').map(Number);
        const [hB, minB] = b.start.split(':').map(Number);
        const timeB = new Date(yB, mB - 1, dB, hB, minB, 0, 0).getTime();

        return timeA - timeB;
      });

    const next = upcomingShifts[0];
    if (!next) return null;

    const nextStartTime = new Date(`${next.day}T${next.start}`);
    const diff = nextStartTime.getTime() - now;

    // Show only if starts within 24 hours
    if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;

    return {
      targetDate: nextStartTime,
      isImminent: diff < 60 * 60 * 1000 // Less than 1 hour
    };
  }, [shifts, minuteTrigger]);

  const workDuration = useMemo(() => {
    if (status === ServiceStatus.OFF || !activeShift) return null;
    
    const now = new Date().getTime();
    let start: number;
    
    if (activeShift.startDateTime) {
      start = new Date(activeShift.startDateTime).getTime();
    } else {
      start = new Date(`${activeShift.day}T${activeShift.start}`).getTime();
    }
    
    const diff = now - start;
    if (diff < 0) return "00:00:00";
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [status, activeShift, minuteTrigger]);

  const bentoClass = (active: boolean = false) => `
    relative overflow-hidden transition-all duration-500 rounded-[32px] border 
    ${darkMode 
      ? (active ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-500/20' : 'bg-slate-900 border-white/5 shadow-xl') 
      : (active ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-500/30' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50')
    }
  `;

  const handleVibrate = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  return (
    <div className="p-5 space-y-6 animate-fadeIn">
      {/* Main Status Card - Redesigned for Ultra-Premium Mobile Look */}
      {/* Main Status Card - Tactical Dispatch Box Interface */}
      <div className="relative">
        <motion.div 
          initial={false}
          animate={status === ServiceStatus.WORKING ? {
            scale: [1, 1.005, 1],
          } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`
            relative overflow-hidden transition-all duration-700 rounded-[40px] border
            ${status === ServiceStatus.WORKING 
              ? 'bg-[#0A1128] border-white/10 shadow-2xl' 
              : (darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50')
            }
            backdrop-blur-2xl
          `}
        >
          {/* Tactical Background for WORKING state */}
          {status === ServiceStatus.WORKING && (
            <>
              {/* Blurred Ambulance Background */}
              <div className="absolute inset-0 z-0 opacity-40">
                <img 
                  src="https://picsum.photos/seed/ambulance-interior/800/600?blur=10" 
                  alt="Ambulance Interior" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Tactical Glass Finish Overlay */}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-blue-900/40 to-black/60 backdrop-blur-[2px]" />
              
              {/* Ambient Light Reflections */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-red-500/10 via-transparent to-blue-500/10 opacity-50" />
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 blur-[100px] animate-pulse" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-600/20 blur-[100px] animate-pulse" />
              </div>
            </>
          )}
        
          <div className={`flex flex-col items-center text-center relative z-40 py-12`}>
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${status === ServiceStatus.WORKING ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-400'}`} />
                <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${
                  status === ServiceStatus.WORKING ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 
                  'text-slate-500'
                }`}>
                  {status === ServiceStatus.WORKING ? '• MISSION EN COURS' : 'Prêt pour le service'}
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {status === ServiceStatus.OFF && nextShiftCountdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 mb-2"
                  >
                    <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 shadow-lg shadow-indigo-500/5">
                      <Hourglass size={12} className="text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-400">
                        Prise de poste dans : <span className="text-indigo-500 tabular-nums font-black"><Countdown targetDate={nextShiftCountdown.targetDate} /></span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className={`text-6xl font-black tracking-widest tabular-nums leading-none ${
                status !== ServiceStatus.OFF ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : (darkMode ? 'text-white' : 'text-slate-900')
              }`}>
                {status === ServiceStatus.WORKING ? (
                  <WorkDuration startDateTime={activeShift?.startDateTime || `${activeShift?.day}T${activeShift?.start}`} />
                ) : (
                  <LiveClock format="full" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-8 w-full pt-12 px-8">
              {status === ServiceStatus.OFF ? (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { handleVibrate(); onStartService(); }}
                  className="w-full py-6 rounded-[28px] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all text-sm flex items-center justify-center gap-3"
                >
                  <Play size={18} fill="currentColor" /> Prendre le service
                </motion.button>
              ) : (
                <>
                  {/* Tactical Pause Button (Orange) */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { handleVibrate(); onOpenPauseModal(); }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-md group-active:scale-125 transition-transform" />
                    <div className="relative w-20 h-20 rounded-full border-4 border-orange-500/40 bg-black/40 flex items-center justify-center text-orange-500 shadow-lg backdrop-blur-md transition-all">
                      <Coffee size={32} strokeWidth={2.5} />
                    </div>
                  </motion.button>

                  {/* Tactical Meal Button (Gold) */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { handleVibrate(); onOpenPauseModal(); }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md group-active:scale-125 transition-transform" />
                    <div className="relative w-24 h-24 rounded-full border-4 border-amber-500/40 bg-black/40 flex items-center justify-center text-amber-500 shadow-xl backdrop-blur-md transition-all">
                      <Utensils size={40} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                  
                  {/* Tactical Stop Button (Red) */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { handleVibrate(); onOpenSummaryModal(); }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md group-active:scale-125 transition-transform" />
                    <div className="relative w-20 h-20 rounded-full border-4 border-red-500/40 bg-black/40 flex items-center justify-center text-red-500 shadow-lg backdrop-blur-md transition-all">
                      <LogOut size={32} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modulation Progress Box */}
      {modulation && (
        <div className={bentoClass() + " p-5"}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {overtimeMode === 'weekly' ? 'Hebdomadaire' : 
                   overtimeMode === 'fortnightly' ? 'Quinzaine' : 
                   overtimeMode === 'modulation' ? 'Modulation' : 'Annualisation'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Objectif : {(parseFloat(hoursBase) * modulation.totalWeeks).toFixed(1)}h
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-black text-indigo-500 tabular-nums">
                  {modulation.totalHours}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase">h</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                {Math.round((modulation.totalHours / (parseFloat(hoursBase) * modulation.totalWeeks)) * 100)}% de l'objectif
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (modulation.totalHours / (parseFloat(hoursBase) * modulation.totalWeeks)) * 100)}%` }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              />
              <div className="absolute inset-0 flex justify-between px-4 pointer-events-none">
                {[...Array(modulation.totalWeeks)].map((_, i) => (
                  <div key={i} className="w-px h-full bg-white/10" />
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-slate-100'} flex items-center gap-1.5`}>
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    Semaine {modulation.weekInCycle} / {modulation.totalWeeks}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Hourglass size={12} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  {100 - modulation.progress}% du temps restant
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => {
            setHoursPeriod(prev => prev === 'week' ? 'day' : 'week');
            handleVibrate();
          }}
          className={bentoClass() + " p-6 cursor-pointer group active:scale-95 transition-all"}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-500">
              <TrendingUp size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {hoursPeriod === 'week' ? 'Heures Semaine' : 'Heures Jour'} (TTE)
              </span>
            </div>
            <div className="flex gap-1">
              {['day', 'week'].map((p) => (
                <div 
                  key={p} 
                  className={`w-1 h-1 rounded-full transition-all ${hoursPeriod === p ? 'bg-indigo-500 w-3' : 'bg-slate-300'}`} 
                />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <AnimatePresence mode="wait">
              <motion.span 
                key={hoursPeriod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}
              >
                {statsHours[hoursPeriod]}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs font-bold text-slate-400">h</span>
          </div>
        </div>

        <div 
          onClick={() => {
            const periods: ('day' | 'week' | 'month')[] = ['day', 'week', 'month'];
            const nextIdx = (periods.indexOf(earningsPeriod) + 1) % periods.length;
            setEarningsPeriod(periods[nextIdx]);
            handleVibrate();
          }}
          className={bentoClass() + " p-6 cursor-pointer group active:scale-95 transition-all"}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <Euro size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {earningsPeriod === 'day' ? 'Gains Jour' : earningsPeriod === 'week' ? 'Gains Semaine' : 'Gains Mois'} (Net)
              </span>
            </div>
            <div className="flex gap-1">
              {['day', 'week', 'month'].map((p) => (
                <div 
                  key={p} 
                  className={`w-1 h-1 rounded-full transition-all ${earningsPeriod === p ? 'bg-emerald-500 w-3' : 'bg-slate-300'}`} 
                />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <AnimatePresence mode="wait">
              <motion.span 
                key={earningsPeriod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}
              >
                {earnings[earningsPeriod]}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs font-bold text-slate-400">€</span>
          </div>
        </div>
      </div>

      {/* Vehicle Distribution Chart */}
      <div className={bentoClass() + " p-6"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Répartition Véhicules</span>
          </div>
        </div>

        {vehicleDistribution.length > 0 ? (
          <div className="flex items-center gap-4 h-48">
            <div className="w-1/2 h-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} debounce={50}>
                <PieChart>
                  <Pie
                    data={vehicleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {vehicleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-2xl border shadow-xl backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-100'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: data.color }}>{data.name}</p>
                            <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatDuration(data.value)}</p>
                            <p className="text-[9px] font-bold text-slate-400">{data.percentage}% du temps</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-1/2 space-y-3">
              {vehicleDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.percentage}%</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{formatDuration(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto text-slate-300 mb-2" size={24} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune donnée de conduite</p>
          </div>
        )}
      </div>

      {/* Paid Leave Timeline Card */}
      <div className={`rounded-[32px] p-8 shadow-2xl relative overflow-hidden transition-all duration-500 ${
        darkMode ? 'bg-slate-900 border border-white/5' : 'bg-white border border-slate-100'
      }`}>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Congés Payés</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solde annuel</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-500 tabular-nums">
                {leaveBalances?.cp.toFixed(1) || "0.0"}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Jours</span>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="space-y-3">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
              <span>Pris: {leaveBalances?.usedCp || 0}j</span>
              <span>Restant: {leaveBalances?.cp.toFixed(1) || 0}j</span>
            </div>
            
            <div className="relative h-3 w-full bg-slate-500/10 rounded-full overflow-hidden">
              {/* Progress Bar */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, ((leaveBalances?.usedCp || 0) / ((leaveBalances?.cp || 0) + (leaveBalances?.usedCp || 0)) * 100))}%` 
                }}
                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
              />
              
              {/* Markers for "Timeline" feel */}
              <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-px h-full bg-white/10" />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <div className="flex -space-x-2">
                {[...Array(Math.min(5, Math.ceil(leaveBalances?.cp || 0)))].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-6 rounded-full border-2 ${darkMode ? 'border-slate-900 bg-indigo-500/20' : 'border-white bg-indigo-50'} flex items-center justify-center`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                ))}
                {(leaveBalances?.cp || 0) > 5 && (
                  <div className={`w-6 h-6 rounded-full border-2 ${darkMode ? 'border-slate-900 bg-slate-800' : 'border-white bg-slate-100'} flex items-center justify-center text-[8px] font-black text-slate-400`}>
                    +{(Math.ceil(leaveBalances?.cp || 0) - 5)}
                  </div>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-400 italic">
                {leaveBalances && leaveBalances.cp > 0 
                  ? `Il vous reste environ ${Math.floor(leaveBalances.cp / 5)} semaines de repos.`
                  : "Votre solde est épuisé ou non configuré."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BoardTab;