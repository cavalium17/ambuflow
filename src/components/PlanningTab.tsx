
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Stethoscope, 
  Briefcase, 
  Coffee, 
  Utensils, 
  Edit, 
  Trash2,
  X,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Check,
  RefreshCw,
  MapPin,
  Building2,
  PlusCircle,
  ArrowLeft,
  Calendar,
  Plane,
  AlertTriangle
} from 'lucide-react';
import { Shift, ServiceStatus, AppTab, Break } from '../types';

interface PlanningTabProps {
  darkMode?: boolean;
  status?: ServiceStatus;
  setStatus?: (status: ServiceStatus) => void;
  onAutoStartService?: (shiftId: string, startTime: string, shiftDay: string) => void;
  onEndServiceSilently?: () => void;
  minuteTrigger: number;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  activeShiftId: string | null;
  setActiveShiftId: React.Dispatch<React.SetStateAction<string | null>>;
  availableVehicles: string[];
  hourlyRate: string;
  setActiveTab: (tab: AppTab) => void;
  overtimeMode?: string;
  cpCalculationMode: '25' | '30';
  modulationWeeks?: string;
  modulationStartDate?: string;
  leaveBalances: { cp: number; rtt: number; recup: number };
  initialCpBalance: number;
  setInitialCpBalance: (val: number) => void;
  initialRttBalance: number;
  setInitialRttBalance: (val: number) => void;
  initialRecupBalance: number;
  setInitialRecupBalance: (val: number) => void;
}

type ViewType = 'week' | 'month';

const PlanningTab: React.FC<PlanningTabProps> = React.memo(({ 
  darkMode = false, 
  status = ServiceStatus.OFF, 
  setStatus,
  onAutoStartService,
  onEndServiceSilently,
  minuteTrigger,
  shifts,
  setShifts,
  activeShiftId,
  setActiveShiftId,
  availableVehicles,
  overtimeMode,
  cpCalculationMode,
  modulationWeeks,
  modulationStartDate,
  leaveBalances,
  initialCpBalance,
  setInitialCpBalance,
  initialRttBalance,
  setInitialRttBalance,
  initialRecupBalance,
  setInitialRecupBalance
}) => {
  const [viewType, setViewType] = useState<ViewType>('week');
  const [pivotDate, setPivotDate] = useState(new Date());
  
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = useMemo(() => getLocalDateString(new Date()), [minuteTrigger]);
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFlowStep, setAddFlowStep] = useState<'choice' | 'shift' | 'leave'>('choice');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shiftToDeleteId, setShiftToDeleteId] = useState<string | null>(null);
  
  const inputClass = `w-full p-4 rounded-2xl border font-black outline-none transition-all placeholder:text-slate-400 ${
    darkMode 
      ? 'bg-[#0F1221] border-white/5 text-white focus:border-indigo-500' 
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white'
  }`;

  // État pour la nouvelle mission
  const [newShift, setNewShift] = useState<{
    day: string;
    start: string;
    end: string;
    vehicle: string;
    breaks: Break[];
  }>({
    day: todayStr,
    start: '08:00',
    end: '18:00',
    vehicle: availableVehicles[0] || 'ASSU',
    breaks: []
  });

  const [tempBreak, setTempBreak] = useState({
    isActive: false,
    start: '12:00',
    duration: 30,
    type: 'repas' as 'repas' | 'café',
    location: 'Entreprise' as 'Entreprise' | 'Extérieur'
  });

  // État pour l'absence
  const [newLeave, setNewLeave] = useState<{
    day: string;
    endDate: string;
    type: 'CP' | 'Maladie' | 'Sans solde' | 'AT' | 'RTT' | 'Récupération';
  }>({
    day: todayStr,
    endDate: todayStr,
    type: 'CP'
  });

  const calculateBusinessDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDateObj = new Date(end);
    if (endDateObj < startDate) return 0;
    
    let count = 0;
    const curDate = new Date(startDate);
    while (curDate <= endDateObj) {
      const dayOfWeek = curDate.getDay();
      if (cpCalculationMode === '30') {
        // Mode 30j ouvrables : on exclut uniquement les dimanches
        if (dayOfWeek !== 0) count++;
      } else {
        // Mode 25j ouvrés : on exclut samedis et dimanches
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const leaveDaysCount = useMemo(() => {
    return calculateBusinessDays(newLeave.day, newLeave.endDate);
  }, [newLeave.day, newLeave.endDate]);

  const currentBalance = useMemo(() => {
    if (newLeave.type === 'CP') return leaveBalances.cp;
    if (newLeave.type === 'RTT') return leaveBalances.rtt;
    if (newLeave.type === 'Récupération') return leaveBalances.recup;
    return Infinity;
  }, [newLeave.type, leaveBalances]);

  const isBalanceInsufficient = leaveDaysCount > currentBalance;
  const estimatedNewBalance = currentBalance - leaveDaysCount;

  const isShiftValid = useMemo(() => {
    if (!editingShift) return true;
    if (editingShift.end === '--:--') return true;
    
    return true;
  }, [editingShift]);

  const modulationPeriod = useMemo(() => {
    if (overtimeMode !== 'modulation' || !modulationStartDate || !modulationWeeks) return null;
    const start = new Date(modulationStartDate);
    const weeks = parseInt(modulationWeeks);
    if (isNaN(start.getTime()) || isNaN(weeks)) return null;
    const end = new Date(start);
    end.setDate(start.getDate() + (weeks * 7) - 1);
    return {
      start: start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      end: end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  }, [overtimeMode, modulationStartDate, modulationWeeks]);

  const navigate = (direction: number) => {
    const newDate = new Date(pivotDate);
    if (viewType === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else if (viewType === 'month') newDate.setMonth(newDate.getMonth() + direction);
    setPivotDate(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    setPivotDate(now);
    setSelectedDay(getLocalDateString(now));
  };

  const calculateEndTimeFromDuration = (startTime: string, durationMin: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + durationMin);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getVehicleConfig = useCallback((v: string) => {
    return v?.includes('ASSU') ? { bg: 'bg-[#FF4B5C]', text: 'text-[#FF4B5C]', icon: Stethoscope, label: 'ASSU' } :
           v?.includes('VSL') ? { bg: 'bg-indigo-500', text: 'text-indigo-500', icon: Briefcase, label: 'VSL' } :
           { bg: 'bg-emerald-500', text: 'text-emerald-500', icon: Car, label: 'AMBU' };
  }, []);

  const handleDeleteShift = useCallback((id: string) => {
    setShiftToDeleteId(id);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteShift = useCallback(() => {
    if (shiftToDeleteId) {
      setShifts(prev => prev.filter(s => s.id !== shiftToDeleteId));
      if (shiftToDeleteId === activeShiftId) onEndServiceSilently?.();
      setShowDeleteConfirm(false);
      setShiftToDeleteId(null);
    }
  }, [setShifts, activeShiftId, onEndServiceSilently, shiftToDeleteId]);

  const handleDeleteBreak = useCallback((shiftId: string, breakId: string) => {
    if (window.confirm("Supprimer cette pause ?")) {
      setShifts(prev => prev.map(s => {
        if (s.id === shiftId) {
          return {
            ...s,
            breaks: (s.breaks || []).filter(b => b.id !== breakId)
          };
        }
        return s;
      }));
    }
  }, [setShifts]);

  const handleUpdateShift = useCallback((updatedShift: Shift) => {
    if (updatedShift.id === activeShiftId && updatedShift.end !== '--:--') onEndServiceSilently?.();
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    setShowEditModal(false);
  }, [activeShiftId, onEndServiceSilently, setShifts]);

  const validateShift = () => {
    if (!newShift.day || !newShift.start) return;
    const isPast = newShift.day < todayStr;
    const shiftId = Math.random().toString(36).substr(2, 9);
    
    const shiftData: Shift = { 
      id: shiftId,
      day: newShift.day,
      start: newShift.start,
      end: isPast ? (newShift.end || '18:00') : '--:--', 
      crew: 'Équipage',
      vehicle: newShift.vehicle,
      breaks: newShift.breaks 
    };

    setShifts(prev => [shiftData, ...prev]);
    if (!isPast && onAutoStartService) onAutoStartService(shiftId, shiftData.start, shiftData.day);
    setShowAddModal(false);
    setAddFlowStep('choice');
    setNewShift({ day: todayStr, start: '08:00', end: '18:00', vehicle: availableVehicles[0] || 'ASSU', breaks: [] });
  };

  const validateLeave = () => {
    if (!newLeave.day || isBalanceInsufficient) return;
    
    const startDate = new Date(newLeave.day);
    const endDate = new Date(newLeave.endDate);
    const totalDays = leaveDaysCount;
    const today = new Date().toLocaleDateString('fr-FR');
    
    const newShifts: Shift[] = [];
    const curDate = new Date(startDate);
    
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      let isBusinessDay = false;
      if (cpCalculationMode === '30') {
        isBusinessDay = dayOfWeek !== 0;
      } else {
        isBusinessDay = dayOfWeek !== 0 && dayOfWeek !== 6;
      }

      if (isBusinessDay) {
        const shiftId = Math.random().toString(36).substr(2, 9);
        const dayStr = getLocalDateString(curDate);
        
        newShifts.push({
          id: shiftId,
          day: dayStr,
          start: '00:00',
          end: '00:00',
          crew: 'Personnel',
          vehicle: 'CONGÉ',
          isLeave: true,
          leaveType: newLeave.type === 'Maladie' ? 'MAL' : 
                     newLeave.type === 'Sans solde' ? 'CSS' : 
                     newLeave.type === 'Récupération' ? 'RECUP' : 
                     newLeave.type as any,
          leaveDays: 0,
          note: `Décompté du solde le ${today}`
        });
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    // On ajoute les shifts. Le useMemo dans App.tsx s'occupera de mettre à jour le solde
    // car il compte le nombre de shifts de type congé.
    setShifts(prev => [...newShifts, ...prev]);
    setShowAddModal(false);
    setAddFlowStep('choice');
    setNewLeave({ day: todayStr, endDate: todayStr, type: 'CP' });
  };

  const addTempBreakToNewShift = () => {
    const breakEndTime = calculateEndTimeFromDuration(tempBreak.start, tempBreak.duration);
    const breakData: Break = {
      id: Math.random().toString(36).substr(2, 9),
      start: tempBreak.start,
      end: breakEndTime,
      duration: tempBreak.duration,
      location: tempBreak.location,
      isMeal: tempBreak.type === 'repas'
    };
    setNewShift(prev => ({ ...prev, breaks: [...prev.breaks, breakData] }));
    setTempBreak({ ...tempBreak, isActive: false });
  };

  const removeBreakFromNewShift = (id: string) => {
    setNewShift(prev => ({ ...prev, breaks: prev.breaks.filter(b => b.id !== id) }));
  };

  const calculateTotalDuration = (shift: Shift) => {
    if (!shift.start || shift.end === '--:--') return '0H 0M';
    const [h1, m1] = shift.start.split(':').map(Number);
    const [h2, m2] = shift.end.split(':').map(Number);
    let durationMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (durationMin < 0) durationMin += 24 * 60;
    const h = Math.floor(Math.max(0, durationMin) / 60);
    const m = Math.max(0, durationMin) % 60;
    return `${h}H ${m}M`;
  };
  
  const bentoCardBase = (active: boolean = false) => `relative overflow-hidden transition-all duration-300 rounded-[32px] border ${darkMode ? (active ? 'bg-[#15192D] border-white/10 shadow-2xl' : 'bg-[#0F1221] border-white/5') : (active ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/50' : 'bg-slate-50 border-slate-200 shadow-sm')}`;

  const renderShiftItem = (shift: Shift) => {
    const config = getVehicleConfig(shift.vehicle);
    const isLeave = shift.isLeave || shift.vehicle === 'CONGÉ';
    const isCompleted = shift.end !== '--:--' || isLeave;
    const duration = isLeave ? '7H 0M' : calculateTotalDuration(shift);

    return (
      <div key={shift.id} className={`p-4 pr-5 rounded-[28px] ${darkMode ? 'bg-[#1A1F36] border border-white/5' : 'bg-white border border-slate-100'} flex flex-col gap-4 group animate-fadeIn ${isLeave ? 'border-orange-500/30' : ''}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-2xl ${isLeave ? 'bg-orange-500' : config.bg} flex items-center justify-center shadow-lg flex-shrink-0`}>
              {isLeave ? <Plane size={28} className="text-white" strokeWidth={2} /> : <config.icon size={28} className="text-white" strokeWidth={2} />}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isLeave ? (
                  <span className="text-xl font-black text-orange-500 tracking-tight leading-none uppercase truncate">{shift.leaveType || 'CONGÉ'}</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none">{shift.start}</span>
                    <span className="text-slate-400 dark:text-slate-600 font-bold text-[10px]">—</span>
                    <span className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none">{shift.end === '--:--' ? <span className="text-slate-400 animate-pulse">...</span> : shift.end}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`${isLeave ? 'text-orange-400' : 'text-[#FF4B5C]'} text-[10px] font-black uppercase tracking-[0.1em]`}>{isLeave ? 'ABSENCE' : config.label}</span>
                <span className="text-slate-300 dark:text-slate-800 text-[10px]">•</span>
                <div className={`flex items-center gap-1.5 ${isLeave ? 'text-orange-400' : 'text-emerald-500'} font-black text-[10px] uppercase tracking-[0.1em]`}>
                  <span>{duration}</span>
                  {isCompleted && !isLeave && <Check size={10} strokeWidth={4} />}
                </div>
              </div>
              {shift.note && (
                <p className="text-[9px] font-bold text-slate-500 mt-1 italic truncate">{shift.note}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            <button onClick={() => { setEditingShift({ ...shift }); setShowEditModal(true); }} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${darkMode ? 'border-white/10 text-slate-400 bg-white/5 hover:text-indigo-400 hover:border-indigo-500/30' : 'border-slate-100 text-slate-400 bg-slate-50 hover:text-indigo-600'}`}><Edit size={16} /></button>
            <button onClick={() => handleDeleteShift(shift.id)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${darkMode ? 'border-white/10 text-rose-500/50 bg-white/5 hover:text-rose-500 hover:border-rose-500/30' : 'border-slate-100 text-rose-400 bg-slate-50 hover:text-rose-600'}`}><Trash2 size={16} /></button>
          </div>
        </div>
        {isLeave && shift.note && (
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-100'} animate-fadeIn`}>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
              <Clock size={12} />
              <span>{shift.note}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getDayShifts = (dateStr: string) => shifts.filter(s => s.day === dateStr);
  
  const weekDays = useMemo(() => {
    const start = new Date(pivotDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [pivotDate]);

  const monthDays = useMemo(() => {
    const year = pivotDate.getFullYear();
    const month = pivotDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
    const days = [];
    for (let i = startPadding; i > 0; i--) days.push(new Date(year, month, 1 - i));
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) days.push(new Date(year, month + 1, i));
    return days;
  }, [pivotDate]);

  const isNewShiftPast = useMemo(() => newShift.day && newShift.day < todayStr, [newShift.day, todayStr]);

  return (
    <div className="p-4 space-y-6 animate-fadeIn pb-40">
      <div className={`p-1 rounded-2xl flex gap-1 ${darkMode ? 'bg-slate-950 border border-white/5' : 'bg-slate-200/50'}`}>
        {['week', 'month'].map((v) => (
          <button key={v} onClick={() => setViewType(v as ViewType)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
            {v === 'week' ? 'Semaine' : 'Mois'}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-500/5 rounded-2xl hover:bg-slate-500/10 transition-colors"><ChevronLeft size={20} /></button>
            <div className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight capitalize leading-none">{viewType === 'week' ? 'Mon Agenda' : pivotDate.toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}</h2>
              {getLocalDateString(pivotDate) !== todayStr && (
                <button onClick={goToToday} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 text-left">Aujourd'hui</button>
              )}
            </div>
            <button onClick={() => navigate(1)} className="p-3 bg-slate-500/5 rounded-2xl hover:bg-slate-500/10 transition-colors"><ChevronRight size={20} /></button>
          </div>
          <button onClick={() => { setNewShift({ ...newShift, day: selectedDay }); setAddFlowStep('choice'); setShowAddModal(true); }} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center active:scale-95 transition-all">
            <Plus size={24} strokeWidth={3} />
          </button>
      </div>

      {viewType === 'week' && (
        <div className="space-y-6 animate-slideUp">
          {weekDays.map((day, idx) => {
            const dStr = getLocalDateString(day);
            const isToday = dStr === todayStr;
            const ds = getDayShifts(dStr);
            return (
              <div key={idx} className={bentoCardBase(isToday) + " p-5"}>
                <div className="flex justify-between items-center mb-5">
                   <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>{day.toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-black tracking-tight capitalize">{day.getDate()} {day.toLocaleDateString('fr-FR', { month: 'long' })}</h4>
                      {isToday && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                    </div>
                   </div>
                   {isToday && <div className="bg-indigo-600 px-4 py-1.5 rounded-full shadow-lg border border-white/10"><span className="text-[9px] font-black text-white uppercase tracking-widest">AUJOURD'HUI</span></div>}
                </div>
                {ds.length > 0 ? (<div className="space-y-3">{ds.map(s => renderShiftItem(s))}</div>) : (<div className="py-8 border-2 border-dashed border-slate-500/5 dark:border-white/5 rounded-3xl text-center opacity-30"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Repos</p></div>)}
              </div>
            );
          })}
        </div>
      )}

      {viewType === 'month' && (
        <div className="space-y-6 animate-slideUp">
          <div className={`${bentoCardBase(false)} p-5 shadow-2xl`}>
            <div className="grid grid-cols-7 mb-4 border-b border-slate-500/5 pb-4">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (<div key={idx} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-y-2">
              {monthDays.map((day, idx) => {
                const dStr = getLocalDateString(day);
                const isToday = dStr === todayStr;
                const isSelected = dStr === selectedDay;
                const dayShifts = getDayShifts(dStr);
                const hasShifts = dayShifts.length > 0;
                const hasCP = dayShifts.some(s => s.isLeave && (s.leaveType === 'CP' || s.leaveType === 'Congés Payés' || s.leaveType === 'Congé' || s.vehicle === 'CONGÉ'));
                const hasWork = dayShifts.some(s => !s.isLeave && s.vehicle !== 'CONGÉ');

                return (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedDay(dStr)} 
                    className={`relative aspect-square flex items-center justify-center text-xs font-black transition-all rounded-xl ${
                      isSelected 
                        ? (hasCP ? 'bg-orange-600 text-white shadow-xl scale-110 z-10 ring-2 ring-white/30' : 'bg-indigo-600 text-white shadow-xl scale-110 z-10')
                        : hasCP
                          ? 'bg-orange-500 text-white shadow-md'
                          : isToday 
                            ? 'text-indigo-600 ring-2 ring-indigo-500/20' 
                            : hasWork 
                              ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                              : 'text-slate-400 hover:bg-slate-500/5'
                    }`}
                  >
                    {day.getDate()}
                    <div className="absolute bottom-1.5 flex gap-0.5">
                      {hasWork && !isSelected && !hasCP && (
                        <div className="w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}
                      {hasCP && !isSelected && (
                        <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 px-1">{selectedDay === todayStr ? "AUJOURD'HUI" : new Date(selectedDay).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h4>
            {getDayShifts(selectedDay).length > 0 ? (
              <div className="space-y-3 animate-slideUp">{getDayShifts(selectedDay).map(s => renderShiftItem(s))}</div>
            ) : (
              <div className="p-12 rounded-[32px] border-2 border-dashed border-slate-500/5 dark:border-white/5 flex flex-col items-center justify-center text-center opacity-30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune mission</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowAddModal(false)} />
          
          <AnimatePresence mode="wait">
            {addFlowStep === 'choice' && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className={`relative w-full max-w-sm rounded-[40px] p-8 shadow-2xl border ${darkMode ? 'bg-[#15192D] border-white/10 text-white' : 'bg-white text-slate-900'}`}
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">Que veux-tu ajouter ?</h3>
                  <button onClick={() => setShowAddModal(false)} className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-500/5' : 'bg-slate-100'}`}><X size={20} /></button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setAddFlowStep('shift')}
                    className={`flex items-center gap-6 p-6 rounded-[32px] border-2 transition-all group ${darkMode ? 'bg-white/5 border-white/5 hover:bg-indigo-600 hover:border-indigo-400' : 'bg-slate-50 border-slate-100 hover:bg-indigo-600 hover:border-indigo-400 hover:text-white'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-white/10 group-hover:bg-white/20' : 'bg-indigo-100 group-hover:bg-white/20'}`}>
                      <Car size={32} className={darkMode ? 'text-indigo-400 group-hover:text-white' : 'text-indigo-600 group-hover:text-white'} />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black leading-tight">Journée de travail</p>
                      <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${darkMode ? '' : 'group-hover:text-white/80'}`}>Ambulance, VSL, ASSU</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setAddFlowStep('leave')}
                    className={`flex items-center gap-6 p-6 rounded-[32px] border-2 transition-all group ${darkMode ? 'bg-white/5 border-white/5 hover:bg-orange-600 hover:border-orange-400' : 'bg-slate-50 border-slate-100 hover:bg-orange-600 hover:border-orange-400 hover:text-white'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-white/10 group-hover:bg-white/20' : 'bg-orange-100 group-hover:bg-white/20'}`}>
                      <Calendar size={32} className={darkMode ? 'text-orange-400 group-hover:text-white' : 'text-orange-600 group-hover:text-white'} />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black leading-tight">Absence / Congé</p>
                      <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${darkMode ? '' : 'group-hover:text-white/80'}`}>CP, Maladie...</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {addFlowStep === 'shift' && (
              <motion.div 
                key="shift"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`relative w-full max-w-sm rounded-[32px] p-8 shadow-2xl border ${darkMode ? 'bg-[#15192D] border-white/10 text-white' : 'bg-white text-slate-900'} max-h-[90vh] overflow-y-auto no-scrollbar`}
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAddFlowStep('choice')} className="p-2 bg-slate-500/5 rounded-xl hover:bg-slate-500/10 transition-colors"><ArrowLeft size={18} /></button>
                    <h3 className="text-xl font-black tracking-tight">{isNewShiftPast ? "Fin de journée" : "Nouvelle mission"}</h3>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-500/5' : 'bg-slate-100'}`}><X size={20} /></button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block px-1">Date</label>
                    <input type="date" className={inputClass} value={newShift.day} onChange={(e) => setNewShift({...newShift, day: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block px-1">Début</label>
                      <input type="time" className={inputClass} value={newShift.start} onChange={(e) => setNewShift({...newShift, start: e.target.value})} />
                    </div>
                    {isNewShiftPast && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block px-1">Fin (réelle)</label>
                        <input type="time" className={inputClass} value={newShift.end} onChange={(e) => setNewShift({...newShift, end: e.target.value})} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block px-1">Véhicule</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['ASSU', 'AMBU', 'VSL'].map((v) => {
                        const config = getVehicleConfig(v);
                        const isSelected = newShift.vehicle === v;
                        return (
                          <button 
                            key={v} 
                            onClick={() => setNewShift({ ...newShift, vehicle: v })} 
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1.5 ${
                              isSelected 
                                ? `${config.bg} border-white/20 text-white shadow-lg` 
                                : (darkMode ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100')
                            }`}
                          >
                            <config.icon size={20} />
                            <span className="text-[9px] font-black tracking-widest">{v}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={validateShift} className="w-full py-5 rounded-[24px] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4 border border-white/10">Enregistrer</button>
                </div>
              </motion.div>
            )}

            {addFlowStep === 'leave' && (
              <motion.div 
                key="leave"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`relative w-full max-w-sm rounded-[32px] p-8 shadow-2xl border ${darkMode ? 'bg-[#15192D] border-white/10 text-white' : 'bg-white text-slate-900'}`}
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAddFlowStep('choice')} className="p-2 bg-slate-500/5 rounded-xl hover:bg-slate-500/10 transition-colors"><ArrowLeft size={18} /></button>
                    <h3 className="text-xl font-black tracking-tight">Absence / Congé</h3>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-500/5' : 'bg-slate-100'}`}><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest block px-1">Du (Inclus)</label>
                        <input 
                          type="date" 
                          className={inputClass.replace('indigo', 'orange')} 
                          value={newLeave.day} 
                          onChange={(e) => setNewLeave({...newLeave, day: e.target.value, endDate: e.target.value > newLeave.endDate ? e.target.value : newLeave.endDate})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest block px-1">Au (Inclus)</label>
                        <input 
                          type="date" 
                          className={inputClass.replace('indigo', 'orange')} 
                          value={newLeave.endDate} 
                          onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest block px-1">Type d'absence</label>
                      <select 
                        className={inputClass.replace('indigo', 'orange')}
                        value={newLeave.type}
                        onChange={(e) => setNewLeave({...newLeave, type: e.target.value as any})}
                      >
                        <option value="CP">Congé Payé (CP)</option>
                        <option value="Maladie">Maladie</option>
                        <option value="Sans solde">Sans solde</option>
                        <option value="AT">Accident du Travail (AT)</option>
                        <option value="RTT">RTT</option>
                        <option value="Récupération">Récupération</option>
                      </select>
                    </div>

                  {/* Aperçu du décompte */}
                  <div className={`p-5 rounded-3xl border-2 transition-all ${isBalanceInsufficient ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    {['CP', 'RTT', 'Récupération'].includes(newLeave.type) && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Solde actuel</span>
                        <span className="text-sm font-black">{currentBalance} j</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Jours décomptés</span>
                      <span className="text-sm font-black">{leaveDaysCount} j</span>
                    </div>
                    {['CP', 'RTT', 'Récupération'].includes(newLeave.type) && (
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Nouveau solde</span>
                        <span className={`text-sm font-black ${isBalanceInsufficient ? 'text-red-500' : 'text-emerald-500'}`}>
                          {estimatedNewBalance} j
                        </span>
                      </div>
                    )}
                    {isBalanceInsufficient && (
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-3 animate-pulse text-center">Solde insuffisant</p>
                    )}
                  </div>

                  <button 
                    onClick={validateLeave} 
                    disabled={isBalanceInsufficient}
                    className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4 border border-white/10 ${isBalanceInsufficient ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-[#2ECC71] text-white'}`}
                  >
                    Valider
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showEditModal && editingShift && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => { setShowEditModal(false); }} />
          <div className={`relative w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-popIn border ${darkMode ? 'bg-[#15192D] border-white/10 text-white' : 'bg-white text-slate-900'} max-h-[90vh] overflow-y-auto no-scrollbar`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight capitalize">Édition</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{new Date(editingShift.day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); }} className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-500/10' : 'bg-slate-100'}`}><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-indigo-500 font-black uppercase text-[9px] tracking-widest px-1">Début</label>
                    <input type="time" className="w-full p-4 rounded-2xl bg-slate-500/5 dark:bg-[#0F1221] font-black border border-white/5 outline-none focus:border-indigo-500" value={editingShift.start} onChange={e => setEditingShift({...editingShift, start: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-indigo-500 font-black uppercase text-[9px] tracking-widest px-1">Fin</label>
                    <input type="time" className="w-full p-4 rounded-2xl bg-slate-500/5 dark:bg-[#0F1221] font-black border border-white/5 outline-none focus:border-indigo-500" value={editingShift.end} onChange={e => setEditingShift({...editingShift, end: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-500/10 dark:border-white/10">
                 <button 
                   onClick={() => handleUpdateShift(editingShift)} 
                   disabled={!isShiftValid}
                   className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all border border-white/10 ${!isShiftValid ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}
                 >
                   Mettre à jour
                 </button>
                 
                 <button 
                   onClick={() => {
                     handleDeleteShift(editingShift.id);
                     setShowEditModal(false);
                   }}
                   className={`w-full py-4 rounded-[24px] font-black uppercase tracking-widest transition-all border ${darkMode ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'}`}
                 >
                   Supprimer la mission
                 </button>

                 {!isShiftValid && (
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center animate-pulse">Les pauses doivent être dans l'amplitude</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowDeleteConfirm(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative w-full max-w-xs rounded-[32px] p-8 shadow-2xl border text-center ${darkMode ? 'bg-[#15192D] border-white/10 text-white' : 'bg-white text-slate-900'}`}
          >
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black tracking-tight mb-2">Supprimer ?</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Veux-tu vraiment supprimer cette journée planifiée ?</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Non
              </button>
              <button 
                onClick={confirmDeleteShift}
                className="py-4 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Oui
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});
export default PlanningTab;
