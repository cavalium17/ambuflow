import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Coffee, Utensils, Edit, X, Clock, 
  Calendar as CalendarIcon, Trash2, MapPin, PlusCircle 
} from 'lucide-react';
import { Shift, ServiceStatus, AppTab } from '../types';

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
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [newBreak, setNewBreak] = useState<{ type: 'PAUSE' | 'REPAS', duration: number }>({ type: 'PAUSE', duration: 20 });

  // 1. SUPPRESSION D'UNE JOURNÉE
  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  // 2. CALCUL RÉMUNÉRATION (Amplitude - Pauses)
  const calculateEarnings = (shift: Shift) => {
    // On gère les deux noms de variables possibles pour la compatibilité
    const startTime = shift.start || shift.startTime;
    const endTime = shift.end || shift.endTime;

    if (!startTime || !endTime || endTime === '--:--') return "0.00";

    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    
    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes < 0) totalMinutes += 1440; // Gestion minuit

    const breakMinutes = shift.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
    const workingHours = (totalMinutes - breakMinutes) / 60;
    
    return (workingHours * parseFloat(hourlyRate)).toFixed(2);
  };

  return (
    <div className={`flex-1 p-5 pb-32 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} overflow-y-auto`}>
      <header className="mb-8">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AMBUFLOW</p>
        <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mon Planning</h1>
      </header>

      <div className="space-y-4">
        {shifts.length > 0 ? (
          shifts.map(shift => (
            <div 
              key={shift.id}
              className={`relative p-6 rounded-[32px] border transition-all ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              {/* BOUTON POUBELLE RE-FIXÉ */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteShift(shift.id);
                }}
                className="absolute top-6 right-6 p-2 text-rose-500 hover:bg-rose-500/10 rounded-full z-20"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                  <Car size={24} />
                </div>
                <div>
                  <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {shift.start || shift.startTime} — {shift.end || shift.endTime}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {shift.day || shift.date} • {shift.vehicle}
                  </p>
                </div>
              </div>

              {/* AFFICHAGE DES PAUSES EXISTANTES */}
              <div className="flex flex-wrap gap-2 mb-6">
                {shift.breaks && shift.breaks.length > 0 ? (
                  shift.breaks.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-xl border border-white/5">
                      {b.type === 'PAUSE' ? <Coffee size={12} className="text-amber-500" /> : <Utensils size={12} className="text-orange-500" />}
                      <span className="text-[10px] font-black text-white">{b.duration} min</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] font-bold text-zinc-600 uppercase italic">Aucune pause enregistrée</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button 
                  onClick={() => setEditingShift(shift)}
                  className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest"
                >
                  <Edit size={14} /> Gérer les pauses
                </button>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Rémunération</p>
                  <p className="text-xl font-black text-emerald-500">{calculateEarnings(shift)} €</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center">
            <CalendarIcon className="mx-auto text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Votre planning est vide</p>
          </div>
        )}
      </div>

      {/* MODALE DE GESTION DES PAUSES */}
      <AnimatePresence>
        {editingShift && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full max-w-lg rounded-[40px] p-8 ${darkMode ? 'bg-zinc-950 border border-white/10' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ajouter une pause</h2>
                <button onClick={() => setEditingShift(null)} className="p-2 text-zinc-500"><X /></button>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setNewBreak({ type: 'PAUSE', duration: 20 })}
                    className={`flex-1 p-5 rounded-3xl border transition-all flex flex-col items-center gap-3 ${newBreak.type === 'PAUSE' ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}
                  >
                    <Coffee className={newBreak.type === 'PAUSE' ? 'text-amber-500' : 'text-zinc-600'} size={28} />
                    <span className={`text-[10px] font-black uppercase ${newBreak.type === 'PAUSE' ? 'text-white' : 'text-zinc-500'}`}>Pause Café</span>
                  </button>
                  <button 
                    onClick={() => setNewBreak({ type: 'REPAS', duration: 30 })}
                    className={`flex-1 p-5 rounded-3xl border transition-all flex flex-col items-center gap-3 ${newBreak.type === 'REPAS' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5'}`}
                  >
                    <Utensils className={newBreak.type === 'REPAS' ? 'text-orange-500' : 'text-zinc-600'} size={28} />
                    <span className={`text-[10px] font-black uppercase ${newBreak.type === 'REPAS' ? 'text-white' : 'text-zinc-500'}`}>Repas</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Durée de la pause</span>
                    <span className="text-4xl font-black text-indigo-500">{newBreak.duration}<span className="text-sm ml-1 text-zinc-500">min</span></span>
                  </div>
                  <input 
                    type="range"
                    min={newBreak.type === 'PAUSE' ? 20 : 30}
                    max={90}
                    step={1}
                    value={newBreak.duration}
                    onChange={(e) => setNewBreak({ ...newBreak, duration: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-tighter">
                    <span>Min: {newBreak.type === 'PAUSE' ? '20m' : '30m'}</span>
                    <span>Max: 90m</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const updated = { 
                      ...editingShift, 
                      breaks: [...(editingShift.breaks || []), newBreak] 
                    };
                    setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
                    setEditingShift(null);
                  }}
                  className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                >
                  Enregistrer la pause
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