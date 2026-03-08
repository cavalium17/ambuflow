
import React, { useMemo } from 'react';
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  Zap, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Sparkles,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Shift, ServiceStatus, ActivityLog, UserStats } from '../types';

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
  logs: ActivityLog[];
  userStats: UserStats;
  hourlyRate: string;
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
  logs,
  userStats,
  hourlyRate,
  onOpenAssistant
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todayShifts = useMemo(() => 
    shifts.filter(s => s.day === today),
    [shifts, today]
  );

  const weeklyHours = useMemo(() => {
    // Simple calculation for the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekShifts = shifts.filter(s => {
      const d = new Date(s.day);
      return d >= startOfWeek && s.end !== '--:--';
    });
    
    let totalMin = 0;
    weekShifts.forEach(s => {
      const [h1, m1] = s.start.split(':').map(Number);
      const [h2, m2] = s.end.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 1440;
      if (s.breaks) s.breaks.forEach(b => diff -= b.duration);
      totalMin += diff;
    });
    
    return (totalMin / 60).toFixed(1);
  }, [shifts]);

  const bentoClass = (active: boolean = false) => `
    relative overflow-hidden transition-all duration-500 rounded-[32px] border 
    ${darkMode 
      ? (active ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-500/20' : 'bg-slate-900 border-white/5 shadow-xl') 
      : (active ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-500/30' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50')
    }
  `;

  return (
    <div className="p-5 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Tableau de Bord</p>
          <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Salut, {userName.split(' ')[0]} 👋
          </h1>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
          <Zap className="text-amber-400" fill="currentColor" size={20} />
        </div>
      </div>

      {/* Main Status Card */}
      <div className={bentoClass(status !== ServiceStatus.OFF) + " p-8"}>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl ${
            status === ServiceStatus.WORKING ? 'bg-white text-indigo-600 animate-pulse' : 
            status === ServiceStatus.BREAK ? 'bg-amber-400 text-white' : 
            'bg-indigo-500 text-white'
          }`}>
            {status === ServiceStatus.WORKING ? <Clock size={40} strokeWidth={2.5} /> : 
             status === ServiceStatus.BREAK ? <Coffee size={40} strokeWidth={2.5} /> : 
             <Play size={40} strokeWidth={2.5} className="ml-1" />}
          </div>
          
          <div className="space-y-2">
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${status !== ServiceStatus.OFF ? 'text-white' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
              {status === ServiceStatus.WORKING ? 'En Service' : 
               status === ServiceStatus.BREAK ? 'En Pause' : 
               'Hors Service'}
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${status !== ServiceStatus.OFF ? 'text-indigo-100' : 'text-slate-400'}`}>
              {status === ServiceStatus.WORKING ? `Depuis ${activeShift?.start}` : 
               status === ServiceStatus.BREAK ? 'Reprise prévue bientôt' : 
               'Prêt pour votre prochaine mission ?'}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            {status === ServiceStatus.OFF ? (
              <button 
                onClick={onStartService}
                className="flex-1 py-5 rounded-2xl bg-white text-indigo-600 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm"
              >
                Prendre le service
              </button>
            ) : (
              <>
                <button 
                  onClick={onToggleBreak}
                  className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm ${
                    status === ServiceStatus.BREAK ? 'bg-white text-amber-500' : 'bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {status === ServiceStatus.BREAK ? 'Reprendre' : 'Pause'}
                </button>
                <button 
                  onClick={onEndService}
                  className="flex-1 py-5 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm border border-rose-400"
                >
                  Fin de service
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className={bentoClass() + " p-6"}>
          <div className="flex items-center gap-2 text-indigo-500 mb-3">
            <TrendingUp size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Heures Semaine</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>{weeklyHours}</span>
            <span className="text-xs font-bold text-slate-400">h</span>
          </div>
        </div>

        <div className={bentoClass() + " p-6"}>
          <div className="flex items-center gap-2 text-emerald-500 mb-3">
            <Zap size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Niveau {userStats.level}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>{userStats.xp % 1000}</span>
            <span className="text-xs font-bold text-slate-400">XP</span>
          </div>
        </div>
      </div>

      {/* Today's Planning Snippet */}
      <div className={bentoClass() + " p-6"}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">Aujourd'hui</span>
          </div>
          <button className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
            Voir tout <ChevronRight size={12} />
          </button>
        </div>

        {todayShifts.length > 0 ? (
          <div className="space-y-4">
            {todayShifts.map(shift => (
              <div key={shift.id} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shift.vehicle.includes('ASSU') ? 'bg-rose-500' : 'bg-indigo-500'} text-white`}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{shift.start} - {shift.end}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shift.vehicle}</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto text-slate-300 mb-2" size={24} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune mission prévue</p>
          </div>
        )}
      </div>

      {/* AI Assistant Card */}
      <button 
        onClick={onOpenAssistant}
        className="w-full bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden text-left group active:scale-[0.98] transition-all"
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Sparkles className="text-amber-300" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Assistant IA</span>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2">AmbuFlow Insights</h3>
            <p className="text-indigo-100 text-xs font-medium opacity-80 leading-relaxed max-w-[80%]">
              Analysez votre service pour optimiser votre récupération et vos gains.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white mt-4">
            Lancer l'analyse <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Sparkles size={200} />
        </div>
      </button>
    </div>
  );
};

export default BoardTab;
