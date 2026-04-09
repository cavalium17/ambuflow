import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Coffee, Utensils, Edit, X, Trash2, Calendar as CalendarIcon 
} from 'lucide-react';
import { Shift } from '../types';

interface PlanningTabProps {
  darkMode?: boolean;
  shifts: Shift[]; // Le tableau des missions
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

  // 1. SUPPRESSION (Bouton Poubelle)
  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  // 2. CALCUL RÉMUNÉRATION (Vérification des noms de variables)
  const calculateEarnings = (shift: Shift) => {
    const start = shift.start || shift.startTime;
    const end = shift.end || shift.endTime;
    if (!start || !end || end === '--:--') return "0.00";

    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMin < 0) totalMin += 1440;

    const breakMin = shift.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
    return (((totalMin - breakMin) / 60) * parseFloat(hourlyRate)).toFixed(2);
  };

  return (
    <div className={`flex-1 p-5 pb-32 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} overflow-y-auto`}>
      <h1 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mon Agenda</h1>

      <div className="space-y-4">
        {/* CORRECTION : On vérifie si shifts existe et n'est pas vide */}
        {shifts && shifts.length > 0 ? (
          shifts.map(shift => (
            <div key={shift.id} className={`relative p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-100'}`}>
              
              {/* Bouton Poubelle */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id); }}
                className="absolute top-6 right-6 p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                  <Car size={24} />
                </div>
                <div>
                  <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {shift.start || shift.startTime} - {shift.end || shift.endTime}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    {shift.day || shift.date} • {shift.vehicle}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button onClick={() => setEditingShift(shift)} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                  <Edit size={14} /> Gérer les pauses
                </button>
                <p className="text-xl font-black text-emerald-500">{calculateEarnings(shift)} €</p>
              </div>
            </div>
          ))
        ) : (
          /* CE BLOC S'AFFICHE SI SHIFTS EST VIDE */
          <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
            <CalendarIcon className="mx-auto text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Votre planning est vide</p>
          </div>
        )}
      </div>

      {/* MODALE PAUSE (Identique au précédent pour la complétion) */}
      <AnimatePresence>
        {editingShift && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`w-full max-w-lg rounded-[40px] p-8 ${darkMode ? 'bg-zinc-950' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Réglage des pauses</h2>
                <button onClick={() => setEditingShift(null)} className="p-2 text-zinc-500"><X /></button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <button onClick={() => setNewBreak({ type: 'PAUSE', duration: 20 })} className={`flex-1 p-4 rounded-2xl border ${newBreak.type === 'PAUSE' ? 'border-amber-500' : 'border-white/5'}`}>
                    <Coffee className="mx-auto text-amber-500 mb-2" />
                    <span className="text-[9px] font-black text-white uppercase block text-center">Pause (20m+)</span>
                  </button>
                  <button onClick={() => setNewBreak({ type: 'REPAS', duration: 30 })} className={`flex-1 p-4 rounded-2xl border ${newBreak.type === 'REPAS' ? 'border-orange-500' : 'border-white/5'}`}>
                    <Utensils className="mx-auto text-orange-500 mb-2" />
                    <span className="text-[9px] font-black text-white uppercase block text-center">Repas (30m+)</span>
                  </button>
                </div>

                <input 
                  type="range" min={newBreak.type === 'PAUSE' ? 20 : 30} max={90} step={1}
                  value={newBreak.duration}
                  onChange={(e) => setNewBreak({ ...newBreak, duration: parseInt(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none accent-indigo-500"
                />
                <p className="text-center font-black text-2xl text-indigo-500">{newBreak.duration} min</p>

                <button 
                  onClick={() => {
                    const updated = { ...editingShift, breaks: [...(editingShift.breaks || []), newBreak] };
                    setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
                    setEditingShift(null);
                  }}
                  className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest"
                >
                  Confirmer la pause
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