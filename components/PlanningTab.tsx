import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Coffee, Utensils, Edit, X, Clock, 
  Calendar as CalendarIcon, CheckCircle2, Trash2, 
  MapPin, PlusCircle, AlertTriangle 
} from 'lucide-react';
import { Shift, Break, ServiceStatus, AppTab } from '../types';

interface PlanningTabProps {
  darkMode?: boolean;
  status?: ServiceStatus;
  setStatus?: (status: ServiceStatus) => void;
  appCurrentTime: Date;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  activeShiftId: string | null;
  setActiveShiftId: React.Dispatch<React.SetStateAction<string | null>>;
  availableVehicles: string[];
  hourlyRate: string;
  setActiveTab: (tab: AppTab) => void;
}

const PlanningTab: React.FC<PlanningTabProps> = ({
  darkMode,
  shifts,
  setShifts,
  hourlyRate,
}) => {
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [newBreak, setNewBreak] = useState<{ type: 'PAUSE' | 'REPAS', duration: number }>({ type: 'PAUSE', duration: 20 });

  // --- 1. LOGIQUE DE SUPPRESSION ACTIVÉE ---
  const handleDeleteShift = (id: string) => {
    if (window.confirm("Supprimer cette planification ?")) {
      setShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  // --- 2. LOGIQUE DE RÉMUNÉRATION PRÉCISE ---
  const calculateEarnings = (shift: Shift) => {
    const [h1, m1] = shift.start.split(':').map(Number);
    const [h2, m2] = shift.end.split(':').map(Number);
    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes < 0) totalMinutes += 1440;

    const breakMinutes = shift.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
    const workingHours = (totalMinutes - breakMinutes) / 60;
    return (workingHours * parseFloat(hourlyRate)).toFixed(2);
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    setEditingShift(null);
  };

  return (
    <div className={`flex-1 p-5 pb-32 ${darkMode ? 'bg-[#050505]' : 'bg-slate-50'} overflow-y-auto`}>
      <h1 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Planning</h1>

      <div className="space-y-4">
        {shifts.map(shift => (
          <div 
            key={shift.id}
            className={`relative p-5 rounded-[32px] border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-100'}`}
          >
            {/* BOUTON SUPPRIMER RÉPARÉ */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteShift(shift.id);
              }}
              className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors z-10"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                <Car size={20} />
              </div>
              <div>
                <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{shift.start} - {shift.end}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shift.vehicle}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex gap-2">
                {shift.breaks?.map((b, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg border border-white/5">
                    {b.type === 'PAUSE' ? <Coffee size={10} className="text-amber-500" /> : <Utensils size={10} className="text-orange-500" />}
                    <span className="text-[9px] font-bold text-white">{b.duration}m</span>
                  </div>
                ))}
              </div>
              <p className="text-lg font-black text-emerald-500">{calculateEarnings(shift)} €</p>
            </div>

            <button 
              onClick={() => setEditingShift(shift)}
              className="mt-4 w-full py-3 rounded-xl bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Edit size={14} /> Modifier les pauses
            </button>
          </div>
        ))}
      </div>

      {/* MODALE D'ÉDITION DES PAUSES */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className={`w-full max-w-lg rounded-[40px] p-8 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Réglage des Pauses</h2>
              <button onClick={() => setEditingShift(null)} className="p-2 text-zinc-500"><X /></button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <button 
                  onClick={() => setNewBreak({ ...newBreak, type: 'PAUSE', duration: 20 })}
                  className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 ${newBreak.type === 'PAUSE' ? 'border-amber-500 bg-amber-500/10' : 'border-white/5'}`}
                >
                  <Coffee className="text-amber-500" />
                  <span className="text-[10px] font-black text-white uppercase">Pause Café (Min 20m)</span>
                </button>
                <button 
                  onClick={() => setNewBreak({ ...newBreak, type: 'REPAS', duration: 30 })}
                  className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 ${newBreak.type === 'REPAS' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5'}`}
                >
                  <Utensils className="text-orange-500" />
                  <span className="text-[10px] font-black text-white uppercase">Repas (Min 30m)</span>
                </button>
              </div>

              {/* CURSEUR DE DURÉE PRÉCIS (STEP 1) */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Durée sélectionnée</span>
                  <span className="text-3xl font-black text-indigo-500">{newBreak.duration} min</span>
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
              </div>

              <button 
                onClick={() => {
                  const updated = { ...editingShift, breaks: [...(editingShift.breaks || []), newBreak] };
                  handleUpdateShift(updated);
                }}
                className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest"
              >
                Ajouter la pause
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PlanningTab;