import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Palmtree, Briefcase, Car, Clock, Calendar as CalendarIcon, 
  Check, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, Trash2, MapPin
} from 'lucide-react';
import { Shift, AppTab } from '../types';

interface PlanningTabProps {
  darkMode: boolean;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  availableVehicles: string[];
  hourlyRate: string;
}

const PlanningTab: React.FC<PlanningTabProps> = ({
  darkMode, shifts, setShifts, availableVehicles, hourlyRate
}) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [step, setStep] = useState<'CHOICE' | 'WORK_DETAIL'>('CHOICE');

  // Formulaire local
  const [newShift, setNewShift] = useState({
    date: new Date().toISOString().split('T')[0],
    start: '08:00',
    end: '18:00',
    vehicle: availableVehicles[0] || 'ASSU 01'
  });

  // Navigation
  const changePeriod = (delta: number) => {
    const d = new Date(currentDate);
    view === 'week' ? d.setDate(d.getDate() + delta * 7) : d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  // Logique Semaine
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [currentDate]);

  const handleAdd = (type: 'WORK' | 'LEAVE') => {
    const entry: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      day: newShift.date,
      type: type,
      vehicle: type === 'WORK' ? newShift.vehicle : 'CONGÉS',
      start: type === 'WORK' ? newShift.start : '--:--',
      end: type === 'WORK' ? newShift.end : '--:--',
      breaks: [],
    };
    setShifts([...shifts, entry]);
    setShowAddModal(false);
    setStep('CHOICE');
  };

  return (
    <div className={`flex-1 p-5 pb-32 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} overflow-y-auto`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Agenda</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className={`flex p-1 rounded-2xl ${darkMode ? 'bg-zinc-900' : 'bg-white border border-slate-200'}`}>
          <button onClick={() => setView('week')} className={`p-2 rounded-xl ${view === 'week' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}><LayoutGrid size={18} /></button>
          <button onClick={() => setView('month')} className={`p-2 rounded-xl ${view === 'month' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}><CalendarDays size={18} /></button>
        </div>
      </div>

      {/* NAV & BOUTON + */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => changePeriod(-1)} className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><ChevronLeft size={20} /></button>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30">
          <Plus size={18} /> Planifier
        </button>
        <button onClick={() => changePeriod(1)} className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><ChevronRight size={20} /></button>
      </div>

      {/* VUE SEMAINE (BENTO) */}
      {view === 'week' && (
        <div className="space-y-4">
          {weekDays.map(date => {
            const dayShift = shifts.find(s => (s.day || s.date) === date);
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date} className={`p-6 rounded-[32px] border transition-all ${dayShift?.type === 'LEAVE' ? 'bg-orange-500/10 border-orange-500/20' : dayShift ? 'bg-indigo-500/10 border-indigo-500/20' : (darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-200')}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dayShift?.type === 'LEAVE' ? 'bg-orange-500/20 text-orange-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                      {dayShift?.type === 'LEAVE' ? <Palmtree size={24} /> : <Briefcase size={24} />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-500' : 'text-zinc-500'}`}>
                        {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
                      </p>
                      <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {dayShift ? (dayShift.type === 'LEAVE' ? 'Congés' : `${dayShift.start} - ${dayShift.end}`) : 'Repos'}
                      </h3>
                    </div>
                  </div>
                  {dayShift && <button onClick={() => setShifts(shifts.filter(s => s.id !== dayShift.id))} className="text-rose-500 p-2"><Trash2 size={18} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE POPUP HAUTE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-0">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
              className={`w-full max-w-lg rounded-t-[44px] p-8 ${darkMode ? 'bg-zinc-950 border-t border-white/10' : 'bg-white'} h-[85vh] flex flex-col`}
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 opacity-30" />
              <div className="flex justify-between items-center mb-10">
                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {step === 'CHOICE' ? 'Planifier' : 'Détails du travail'}
                </h2>
                <button onClick={() => {setShowAddModal(false); setStep('CHOICE');}} className="p-3 bg-zinc-900/50 rounded-full text-zinc-400"><X /></button>
              </div>

              {step === 'CHOICE' ? (
                <div className="grid gap-4">
                  <button onClick={() => setStep('WORK_DETAIL')} className="p-10 rounded-[32px] bg-indigo-600 text-white flex flex-col items-center gap-4 active:scale-95 transition-all">
                    <Briefcase size={40} strokeWidth={2.5} />
                    <span className="font-black uppercase tracking-widest text-sm">Travail</span>
                  </button>
                  <button onClick={() => handleAdd('LEAVE')} className="p-10 rounded-[32px] bg-orange-500 text-white flex flex-col items-center gap-4 active:scale-95 transition-all">
                    <Palmtree size={40} strokeWidth={2.5} />
                    <span className="font-black uppercase tracking-widest text-sm">Congés</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Date</label>
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex items-center gap-3">
                      <CalendarIcon className="text-indigo-500" size={20} />
                      <input type="date" value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} className="bg-transparent text-white font-bold flex-1 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Début</label>
                      <input type="time" value={newShift.start} onChange={e => setNewShift({...newShift, start: e.target.value})} className="w-full p-4 bg-zinc-900 rounded-2xl border border-white/5 text-white font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Fin</label>
                      <input type="time" value={newShift.end} onChange={e => setNewShift({...newShift, end: e.target.value})} className="w-full p-4 bg-zinc-900 rounded-2xl border border-white/5 text-white font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Véhicule</label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableVehicles.map(v => (
                        <button key={v} onClick={() => setNewShift({...newShift, vehicle: v})} className={`p-3 rounded-xl border text-[10px] font-black ${newShift.vehicle === v ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-900 text-zinc-500 border-white/5'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleAdd('WORK')} className="w-full py-6 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3">
                    <Check size={24} strokeWidth={4} /> Valider
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanningTab;