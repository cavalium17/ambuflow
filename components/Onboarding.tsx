
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Stethoscope, 
  Users, 
  Car, 
  MapPin, 
  Bell, 
  Activity,
  Ambulance,
  Clock,
  Play,
  Calendar,
  Briefcase,
  User
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<UserRole | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contractType, setContractType] = useState('CDI');
  const [weeklyContractHours, setWeeklyContractHours] = useState(35);
  const [overtimeMode, setOvertimeMode] = useState<'weekly' | 'biweekly' | 'modulation' | 'annualized'>('weekly');
  const [modulationWeeks, setModulationWeeks] = useState(4);
  const [modulationStartDate, setModulationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRateMode, setPayRateMode] = useState<'100_percent' | '90_percent'>('100_percent');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplementaryTaskType, setSupplementaryTaskType] = useState<'none' | 'type_1' | 'type_2' | 'type_3'>('none');
  const [autoGeo, setAutoGeo] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    if (roles.length >= 2 && roles.includes('taxi')) {
      setSupplementaryTaskType('type_2');
    }
  }, [roles]);

  const steps = [
    'Value Prop',
    'Identité',
    'Métiers',
    'Priorité',
    'Contrat',
    'Permissions',
    'Activation'
  ];

  const nextStep = () => setStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const toggleRole = (role: UserRole) => {
    setRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleComplete = () => {
    onComplete({
      firstName,
      lastName,
      companyName,
      onboarded: true,
      roles,
      primaryRole: primaryRole as UserRole,
      contractType,
      weeklyContractHours,
      overtimeMode,
      modulationWeeks,
      modulationStartDate,
      payRateMode,
      contractStartDate,
      supplementaryTaskType,
      autoGeo,
      pushEnabled
    });
  };

  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="fixed inset-0 bg-[#FCFDFF] z-50 flex flex-col overflow-hidden font-sans">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      
      {/* Progress Bar - Premium & Subtle */}
      <div className="h-1 w-full bg-slate-100/50 flex">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 transition-all duration-700 ease-out ${i <= step ? 'bg-indigo-500' : 'bg-transparent'}`}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-8 relative">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col justify-center items-center text-center space-y-10"
            >
              <div className="relative">
                <div className="w-28 h-28 bg-white rounded-[32px] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] flex items-center justify-center relative z-10">
                  <div className="relative">
                    <Ambulance className="text-indigo-600" size={56} />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full border-4 border-white flex items-center justify-center">
                      <Clock className="text-white" size={14} />
                    </div>
                  </div>
                </div>
                <div className="absolute -inset-4 bg-indigo-100/40 blur-3xl rounded-full -z-10 animate-pulse" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
                  Bienvenue sur <span className="text-indigo-600">AmbuFlow</span>
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed max-w-xs mx-auto font-medium">
                  L'assistant intelligent qui gère vos heures et vos indemnités automatiquement.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-4">
                <button 
                  onClick={nextStep}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all"
                >
                  Démarrer la configuration
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Moins de 2 minutes pour commencer</p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="mt-8 mb-12 flex-shrink-0">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Étape 01</p>
                <h2 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">Enchanté !</h2>
                <p className="text-slate-500 font-medium">Commençons par faire connaissance.</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 space-y-8 custom-scrollbar">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comment vous appelez-vous ?</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="w-full bg-white border border-slate-100 text-[#0F172A] p-5 rounded-2xl focus:border-indigo-500 shadow-sm outline-none transition-all placeholder:text-slate-300 font-bold"
                    />
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom (Optionnel)"
                      className="w-full bg-white border border-slate-100 text-[#0F172A] p-5 rounded-2xl focus:border-indigo-500 shadow-sm outline-none transition-all placeholder:text-slate-300 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Où travaillez-vous ?</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nom de votre entreprise de transport"
                    className="w-full bg-white border border-slate-100 text-[#0F172A] p-5 rounded-2xl focus:border-indigo-500 shadow-sm outline-none transition-all placeholder:text-slate-300 font-bold"
                  />
                </div>
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-white text-slate-400 border border-slate-100 rounded-2xl shadow-sm hover:text-indigo-600 transition-colors"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  disabled={!firstName}
                  className="flex-1 py-5 bg-indigo-600 disabled:opacity-30 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30"
                >
                  C'est moi
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="mt-8 mb-12 flex-shrink-0">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Étape 02</p>
                <h2 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">Votre métier ?</h2>
                <p className="text-slate-500 font-medium">L'IA s'adaptera à votre convention collective.</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 space-y-4 custom-scrollbar">
                {[
                  { id: 'dea', label: 'Ambulancier DE', icon: Stethoscope, color: 'indigo' },
                  { id: 'auxiliary', label: 'Auxiliaire Ambulancier', icon: Users, color: 'emerald' },
                  { id: 'taxi', label: 'Conducteur Taxi', icon: Car, color: 'amber' }
                ].map((role) => {
                  const isActive = roles.includes(role.id as UserRole);
                  const colorClasses = {
                    indigo: isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-600',
                    emerald: isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white border-slate-100 text-slate-600',
                    amber: isActive ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20' : 'bg-white border-slate-100 text-slate-600'
                  }[role.color as 'indigo' | 'emerald' | 'amber'];

                  const iconColorClasses = {
                    indigo: isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600',
                    emerald: isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600',
                    amber: isActive ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                  }[role.color as 'indigo' | 'emerald' | 'amber'];

                  return (
                    <button
                      key={role.id}
                      onClick={() => toggleRole(role.id as UserRole)}
                      className={`w-full p-6 rounded-[28px] border-[1.5px] flex items-center gap-5 transition-all duration-300 ${colorClasses}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${iconColorClasses}`}>
                        <role.icon size={28} />
                      </div>
                      <div className="text-left">
                        <span className="font-black text-lg block">{role.label}</span>
                        {!isActive && <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Sélectionner</span>}
                        {isActive && <span className="text-[10px] opacity-90 font-bold uppercase tracking-wider">Métier sélectionné</span>}
                      </div>
                      {isActive && (
                        <div className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Check className="text-white" size={18} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-white text-slate-400 border border-slate-100 rounded-2xl shadow-sm hover:text-indigo-600 transition-colors"><ChevronLeft /></button>
                <button 
                  onClick={() => {
                    if (roles.length > 1) {
                      nextStep();
                    } else {
                      setPrimaryRole(roles[0]);
                      setStep(4);
                    }
                  }} 
                  disabled={roles.length === 0}
                  className="flex-1 py-5 bg-indigo-600 disabled:opacity-30 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="mt-8 mb-12 flex-shrink-0">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Plusieurs casquettes</p>
                <h2 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">L'essentiel</h2>
                <p className="text-slate-500 font-medium">L'activité que vous pratiquez le plus souvent.</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 space-y-4 custom-scrollbar">
                {roles.map((roleId) => {
                  const roleInfo = {
                    dea: { label: 'Ambulancier DE', icon: Stethoscope },
                    auxiliary: { label: 'Auxiliaire Ambulancier', icon: Users },
                    taxi: { label: 'Conducteur Taxi', icon: Car }
                  }[roleId];
                  const isActive = primaryRole === roleId;
                  return (
                    <button
                      key={roleId}
                      onClick={() => setPrimaryRole(roleId)}
                      className={`w-full p-6 rounded-[28px] border-[1.5px] flex items-center gap-5 transition-all duration-300 ${
                        isActive 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                          : 'bg-white border-slate-100 text-slate-600'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        <roleInfo.icon size={28} />
                      </div>
                      <div className="text-left">
                        <span className="font-black text-lg block">{roleInfo.label}</span>
                        <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider">{isActive ? 'Activité principale' : 'Choisir comme principal'}</span>
                      </div>
                      {isActive && <div className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Check size={18} className="text-white" /></div>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-white text-slate-400 border border-slate-100 rounded-2xl shadow-sm hover:text-indigo-600 transition-colors"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  disabled={!primaryRole}
                  className="flex-1 py-5 bg-indigo-600 disabled:opacity-30 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30"
                >
                  Confirmer mon choix
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="mt-8 mb-8 flex-shrink-0">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Étape 03</p>
                <h2 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">Votre contrat</h2>
                <p className="text-slate-500 font-medium">Calcul des heures supplémentaires et modulation.</p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 space-y-8 custom-scrollbar">
                {/* Base Hebdomadaire */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end ml-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temps de travail hebdo</label>
                    <span className="text-indigo-600 font-black text-2xl">{weeklyContractHours}h</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[35, 39].map(h => (
                      <button
                        key={h}
                        onClick={() => setWeeklyContractHours(h)}
                        className={`py-5 rounded-2xl font-black text-sm transition-all border-[1.5px] ${
                          weeklyContractHours === h ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20' : 'bg-white text-slate-600 border-slate-100'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Autre"
                        value={weeklyContractHours !== 35 && weeklyContractHours !== 39 ? weeklyContractHours : ''}
                        onChange={(e) => setWeeklyContractHours(Number(e.target.value))}
                        className={`w-full py-5 rounded-2xl font-black text-sm text-center outline-none transition-all border-[1.5px] placeholder:text-slate-300 ${
                          weeklyContractHours !== 35 && weeklyContractHours !== 39 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Mode de Calcul */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Régime de calcul</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'weekly', label: 'Hebdomadaire' },
                      { id: 'biweekly', label: 'Quinzaine' },
                      { id: 'modulation', label: 'Modulation' },
                      { id: 'annualized', label: 'Annuel' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setOvertimeMode(mode.id as any)}
                        className={`py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border-[1.5px] ${
                          overtimeMode === mode.id ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg' : 'bg-white text-slate-600 border-slate-100'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
                    <p className="text-[11px] text-indigo-900/60 leading-relaxed font-bold italic">
                      {overtimeMode === 'weekly' && "Calcul classique à la semaine (au delà de votre base)."}
                      {overtimeMode === 'biweekly' && "Calcul lissé sur 2 semaines consécutives."}
                      {overtimeMode === 'modulation' && "Le mode de modulation permet de lisser vos heures sur plusieurs semaines."}
                      {overtimeMode === 'annualized' && "Calcul basé sur le total d'heures annuel (1607h)."}
                    </p>
                  </div>

                  {overtimeMode === 'modulation' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 pt-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Durée de la modulation</label>
                          <span className="text-indigo-600 font-black text-sm">{modulationWeeks} semaines</span>
                        </div>
                        <div className="px-2 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <input 
                            type="range"
                            min="4"
                            max="12"
                            step="1"
                            value={modulationWeeks}
                            onChange={(e) => setModulationWeeks(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between mt-2 px-1">
                            <span className="text-[10px] font-bold text-slate-300">4 sem.</span>
                            <span className="text-[10px] font-bold text-slate-300">12 sem.</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date de début du cycle</label>
                        <input 
                          type="date" 
                          value={modulationStartDate}
                          onChange={(e) => setModulationStartDate(e.target.value)}
                          className="w-full bg-white border border-slate-100 text-[#0F172A] p-5 rounded-2xl focus:border-indigo-500 shadow-sm outline-none transition-all font-bold"
                        />
                        <p className="text-[10px] text-slate-400 italic ml-1 leading-relaxed">
                          C'est la date à laquelle votre premier cycle de {modulationWeeks} semaines a débuté.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Missions Complémentaires */}
                {(roles.includes('dea') || roles.includes('auxiliary')) && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Missions complémentaires</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'none', label: 'Aucune', bonus: '0%' },
                        { id: 'type_1', label: 'Type 1 (Conduite non sanitaire...)', bonus: '+2%' },
                        { id: 'type_2', label: 'Type 2 (Taxi, Funéraire...)', bonus: '+5%' },
                        { id: 'type_3', label: 'Type 3 (Régulation, Mécanique...)', bonus: '+10%' }
                      ].map(type => {
                        const isAutoSelected = type.id === 'type_2' && roles.length >= 2 && roles.includes('taxi');
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSupplementaryTaskType(type.id as any)}
                            className={`w-full p-4 rounded-xl flex items-center justify-between border-[1.5px] transition-all ${
                              supplementaryTaskType === type.id 
                                ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg' 
                                : isAutoSelected 
                                  ? 'bg-indigo-50 border-indigo-200 text-[#0F172A]' 
                                  : 'bg-white text-slate-600 border-slate-100'
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-bold text-xs">{type.label}</p>
                              {isAutoSelected && <p className="text-[9px] text-indigo-600 font-bold uppercase mt-1">Suggéré via vos métiers</p>}
                            </div>
                            <span className={`font-black text-xs ${supplementaryTaskType === type.id ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              {type.bonus}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date d'entrée */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Début du contrat chez cet employeur</label>
                  <input 
                    type="date" 
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-100 text-[#0F172A] p-5 rounded-2xl focus:border-indigo-500 shadow-sm outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="mt-auto pt-6 flex gap-4 flex-shrink-0">
                <button onClick={() => setStep(roles.length > 1 ? 3 : 2)} className="p-5 bg-white text-slate-400 border border-slate-100 rounded-2xl shadow-sm transition-colors"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="mt-8 mb-12">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Étape 04</p>
                <h2 className="text-4xl font-black text-[#0F172A] tracking-tight mb-2">Automatisations</h2>
                <p className="text-slate-500 font-medium">Gagnez du temps au quotidien.</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                <div className={`p-8 rounded-[32px] border-[1.5px] transition-all duration-500 flex items-center justify-between ${
                  autoGeo ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-colors ${
                      autoGeo ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <MapPin size={32} />
                    </div>
                    <div>
                      <p className="font-black text-xl text-[#0F172A]">Géolocalisation</p>
                      <p className="text-xs text-slate-400 font-medium">Détecte automatiquement vos lieux de prise de service</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAutoGeo(!autoGeo)}
                    className={`w-16 h-9 rounded-full transition-all relative outline-none ring-offset-4 focus:ring-2 focus:ring-indigo-500 ${autoGeo ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${autoGeo ? 'left-8 scale-90' : 'left-1 scale-90'}`} />
                  </button>
                </div>

                <div className={`p-8 rounded-[32px] border-[1.5px] transition-all duration-500 flex items-center justify-between ${
                  pushEnabled ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-colors ${
                      pushEnabled ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Bell size={32} />
                    </div>
                    <div>
                      <p className="font-black text-xl text-[#0F172A]">Notifications</p>
                      <p className="text-xs text-slate-400 font-medium">Alertes de fin de service et rappels personnalisés</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`w-16 h-9 rounded-full transition-all relative outline-none ring-offset-4 focus:ring-2 focus:ring-amber-500 ${pushEnabled ? 'bg-amber-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${pushEnabled ? 'left-8 scale-90' : 'left-1 scale-90'}`} />
                  </button>
                </div>
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-white text-slate-400 border border-slate-100 rounded-2xl shadow-sm transition-colors"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  className="flex-1 py-5 bg-[#0F172A] text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                >
                  Finaliser la configuration
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div 
              key="step6"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 min-h-0 flex flex-col justify-center items-center text-center space-y-12"
            >
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-36 h-36 bg-white rounded-[40px] shadow-[30px_30px_60px_#e4e4e4,-30px_-30px_60px_#ffffff] flex items-center justify-center relative z-10"
                >
                  <Play className="text-indigo-600 fill-indigo-600 ml-2" size={64} />
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -inset-10 bg-indigo-100/30 blur-[40px] rounded-full -z-10" 
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-5xl font-black text-[#0F172A] tracking-tighter">C'est prêt !</h2>
                <div className="space-y-2">
                  <p className="text-slate-500 text-xl font-medium max-w-xs mx-auto leading-relaxed">
                    Votre profil est configuré et sécurisé.
                  </p>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Bienvenue dans AmbuFlow</p>
                </div>
              </div>
              <div className="w-full max-w-sm">
                <button 
                  onClick={handleComplete}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-600/40 active:scale-[0.97] transition-all"
                >
                  Ouvrir mon tableau de bord
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
