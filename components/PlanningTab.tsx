import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Coffee, Utensils, Edit, X, Trash2, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, Palmtree, Briefcase, LayoutGrid, CalendarDays
} from 'lucide-react';
import { Shift } from '../types';

interface PlanningTabProps {
  darkMode?: boolean;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  hourlyRate: string;
}

const PlanningTab: React.FC<PlanningTabProps> = ({
  darkMode,
  shifts,
  setShifts,
  hourlyRate,
}) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  // --- LOGIQUE DE NAVIGATION ---
  const next = () => {
    const d = new Date(currentDate);
    view === 'week' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const prev = () => {
    const d = new Date(currentDate);
    view === 'week' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  // --- LOGIQUE SEMAINE (Bento) ---
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Lundi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [currentDate]);

  // --- LOGIQUE MOIS ---
  const monthDays = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toISOString().split('T')[0]);
    }
    return days;
  }, [currentDate]);

  // --- AJOUT DE JOURNÉE ---
  const addDay = (type: 'WORK' | 'LEAVE', dateStr: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newEntry: any = {
      id: newId,
      day: dateStr,
      type: type,
      vehicle: type === 'WORK' ? 'ASSU 01' : 'CONGÉS',
      start: type === 'WORK' ? '08:00' : '--:--',
      end: type === 'WORK' ? '18:00' : '--:--',
      breaks: []
    };
    setShifts([...shifts, newEntry]);
    setShowAddModal(false);
  };

  return (
    <div className={`flex-1 p-5 pb-32 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} overflow-y-auto`}>
      
      {/* HEADER & TOGGLE VUE */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Agenda</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className={`flex p-1 rounded-2xl ${darkMode ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
          <button onClick={() => setView('week')} className={`p-2 rounded-xl ${view === 'week' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}><LayoutGrid size={18} /></button>
          <button onClick={() => setView('month')} className={`p-2 rounded-xl ${view === 'month' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}><CalendarDays size={18} /></button>
        </div>
      </div>

      {/* NAVIGATION TEMPORELLE */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prev} className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><ChevronLeft size={20} /></button>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">
          <Plus size={16} /> Planifier
        </button>
        <button onClick={next} className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><ChevronRight size={20} /></button>
      </div>

      {/* VUE SEMAINE (BENTO) */}
      {view === 'week' && (
        <div className="grid grid-cols-1 gap-4">
          {weekDays.map(date => {
            const dayShift = shifts.find(s => (s.day || s.date) === date);
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <motion.div 
                key={date}
                className={`p-5 rounded-[32px] border transition-all ${dayShift?.type === 'LEAVE' ? 'bg-orange-500/10 border-orange-500/20' : (dayShift ? 'bg-indigo-500/10 border-indigo-500/20' : (darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-200'))}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-500' : 'text-zinc-500'}`}>
                      {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
                    </p>
                    {dayShift ? (
                      <h3 className={`text-lg font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {dayShift.type === 'LEAVE' ? '☀️ Congés' : `${dayShift.start} - ${dayShift.end}`}
                      </h3>
                    ) : (
                      <p className="text-xs text-zinc-600 italic mt-1">Repos / Non planifié</p>
                    )}
                  </div>
                  {dayShift && (
                    <button onClick={() => setShifts(shifts.filter(s => s.id !== dayShift.id))} className="p-2 text-rose-500"><Trash2 size={16} /></button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* VUE MOIS (CALENDRIER) */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-zinc-600 py-2">{d}</div>
          ))}
          {monthDays.map(date => {
            const dayShift = shifts.find(s => (s.day || s.date) === date);
            const dayNum = new Date(date).getDate();
            
            return (
              <div 
                key={date}
                className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black border transition-all
                  ${dayShift?.type === 'LEAVE' ? 'bg-orange-500 border-orange-400 text-white' : 
                    dayShift ? 'bg-indigo-600 border-indigo-500 text-white' : 
                    (darkMode ? 'bg-zinc-900 border-white/5 text-zinc-600' : 'bg-white border-slate-100 text-slate-400')}
                `}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE D'AJOUT (Bouton +) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`w-full max-w-lg rounded-[40px] p-8 ${darkMode ? 'bg-zinc-950' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Planification</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-zinc-500"><X /></button>
              </div>
              <div className="space-y-4">
                <input 
                  type="date" 
                  value={currentDate.toISOString().split('T')[0]} 
                  onChange={(e) => setCurrentDate(new Date(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-zinc-900 border border-white/10 text-white font-black mb-4"
                />
                <button 
                  onClick={() => addDay('WORK', currentDate.toISOString().split('T')[0])}
                  className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <Briefcase size={20} /> Travail
                </button>
                <button 
                  onClick={() => addDay('LEAVE', currentDate.toISOString().split('T')[0])}
                  className="w-full py-5 rounded-3xl bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <Palmtree size={20} /> Congés
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanningTab;