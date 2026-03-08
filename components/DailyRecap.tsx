
import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Utensils, 
  Euro, 
  TrendingUp, 
  Trophy, 
  ChevronRight,
  Sparkles,
  Zap,
  Coffee,
  Edit,
  Trash2
} from 'lucide-react';
import { Shift, UserStats } from '../types';

// Helper pour calculer les jours fériés français
const getFrenchPublicHolidays = (year: number) => {
  const holidays = [
    `${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-14`,
    `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`,
  ];
  const a = year % 19, b = Math.floor(year / 100), c = year % 100,
        d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  const month = Math.floor(n / 31);
  const day = (n % 31) + 1;
  const easter = new Date(year, month - 1, day);
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  holidays.push(addDays(easter, 1)); // Lundi de Pâques
  holidays.push(addDays(easter, 39)); // Ascension
  holidays.push(addDays(easter, 50)); // Lundi de Pentecôte
  return holidays;
};

const isSundayOrHoliday = (dateStr: string) => {
  const date = new Date(dateStr);
  if (date.getDay() === 0) return true;
  const year = date.getFullYear();
  const holidays = getFrenchPublicHolidays(year);
  return holidays.includes(dateStr);
};

interface DailyRecapProps {
  shift: Shift;
  userStats: UserStats;
  hourlyRate: string;
  onClose: () => void;
  darkMode: boolean;
}

const DailyRecap: React.FC<DailyRecapProps> = ({ shift, userStats, hourlyRate, onClose, darkMode }) => {
  const calculateStats = () => {
    if (!shift.start || shift.end === '--:--') return null;

    const [h1, m1] = shift.start.split(':').map(Number);
    const [h2, m2] = shift.end.split(':').map(Number);
    
    const startMin = h1 * 60 + m1;
    const endMin = h2 * 60 + m2;
    let ampMin = endMin - startMin;
    if (ampMin < 0) ampMin += 1440;

    let breakMin = 0;
    const hasExternalBreak = shift.breaks?.some(b => b.location === 'Extérieur');
    shift.breaks?.forEach(b => {
      breakMin += b.duration;
    });

    const effMin = Math.max(0, ampMin - breakMin);
    const hourly = parseFloat(hourlyRate) || 11.65;
    
    // Nouvelles indemnités
    let totalAllowances = 0;
    
    // 1. Repas (15.54€)
    if (startMin <= 660 && endMin >= 870 && hasExternalBreak) {
      totalAllowances += 15.54;
    }

    // 2. Repas Unique (9.59€)
    const sStart = startMin;
    const sEnd = endMin < startMin ? endMin + 1440 : endMin;
    const nightOverlap = Math.min(sEnd, 1860) - Math.max(sStart, 1320);
    if (nightOverlap >= 240) {
      totalAllowances += 9.59;
    }

    // 3. Spéciale (4.34€)
    if (hasExternalBreak && (startMin < 300 || endMin > 1260)) {
      totalAllowances += 4.34;
    }

    // 4. Dimanche & Férié (23.90€ brut)
    if (isSundayOrHoliday(shift.day)) {
      totalAllowances += 23.90;
    }

    const gainsTotal = (effMin / 60) * hourly + totalAllowances;

    return {
      amplitude: `${Math.floor(ampMin / 60)}h ${ampMin % 60}m`,
      effective: `${Math.floor(effMin / 60)}h ${effMin % 60}m`,
      allowanceAmount: totalAllowances.toFixed(2),
      gains: gainsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  };

  const stats = calculateStats();
  if (!stats) return null;

  return (
    <div className="fixed inset-0 z-[500] overflow-y-auto no-scrollbar">
      <div className={`fixed inset-0 transition-colors duration-700 ${darkMode ? 'bg-slate-950/95' : 'bg-slate-50/95'} backdrop-blur-3xl`} />
      
      <div className="relative min-h-full flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-md flex flex-col space-y-8 animate-slideUp py-12">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-30 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl border border-white/20 animate-bounce-slow">
                <CheckCircle2 size={48} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mission Terminée</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Indemnités conventionnelles incluses</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'} space-y-2`}>
              <div className="flex items-center gap-2 text-indigo-500">
                <Clock size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Amplitude</span>
              </div>
              <p className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.amplitude}</p>
            </div>

            <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'} space-y-2`}>
              <div className="flex items-center gap-2 text-emerald-500">
                <TrendingUp size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Gains Journée</span>
              </div>
              <p className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.gains}€</p>
            </div>

            <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'} space-y-2 col-span-2`}>
              <div className="flex items-center gap-2 text-amber-500">
                <Euro size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Total Ind.</span>
              </div>
              <p className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.allowanceAmount}€</p>
            </div>
          </div>

          <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'} space-y-4`}>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Détail de l'activité</span>
            </div>
            <div className="space-y-3">
              {/* Mission principale */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                    <Zap size={16} />
                  </div>
                  <div>
                    <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mission Service</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shift.start} - {shift.end}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 pr-1">
                  <button className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit size={14} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Pauses */}
              {shift.breaks?.map(b => (
                <div key={b.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${b.isMeal ? 'bg-emerald-500' : 'bg-amber-500'} flex items-center justify-center text-white`}>
                      {b.isMeal ? <Utensils size={16} /> : <Coffee size={16} />}
                    </div>
                    <div>
                      <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{b.isMeal ? 'Coupure Repas' : 'Pause Café'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.start} - {b.end}</p>
                        {b.isMeal && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">({b.location})</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pr-1">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit size={14} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 pb-12">
            <button 
              onClick={onClose} 
              className="w-full py-6 rounded-[28px] bg-indigo-600 text-white font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-400/50"
            >
              VALIDER LE SERVICE <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes expandWidth { from { width: 0; } }
        .animate-expandWidth { animation: expandWidth 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-slow { animation: bounce 3s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default DailyRecap;
