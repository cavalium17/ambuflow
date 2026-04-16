
import React, { useState } from 'react';
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
  Sparkles,
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
  const [payRateMode, setPayRateMode] = useState<'100_percent' | '90_percent'>('100_percent');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoGeo, setAutoGeo] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

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
      payRateMode,
      contractStartDate,
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
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-900 flex">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 transition-all duration-500 ${i <= step ? 'bg-indigo-500' : 'bg-transparent'}`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col p-6 relative">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-indigo-500/20 rounded-[32px] flex items-center justify-center">
                <Sparkles className="text-indigo-500" size={48} />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                  Bienvenue sur <span className="text-indigo-500">AmbuFlow</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-xs mx-auto">
                  L'assistant intelligent qui gère vos heures et vos indemnités automatiquement.
                </p>
              </div>
              <button 
                onClick={nextStep}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-indigo-500/20"
              >
                C'est parti
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col"
            >
              <div className="mt-8 mb-12">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Enchanté !</h2>
                <p className="text-slate-400">Commençons par faire connaissance.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Jean"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Dupont"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Entreprise (Optionnel)</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Ambulances 24/7"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-slate-900 text-white rounded-2xl"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm"
                >
                  Continuer
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
              className="flex-1 flex flex-col"
            >
              <div className="mt-8 mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Votre métier ?</h2>
                <p className="text-slate-400">Sélectionnez un ou plusieurs rôles.</p>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'dea', label: 'Ambulancier DEA', icon: Stethoscope, color: 'indigo' },
                  { id: 'auxiliary', label: 'Auxiliaire Ambulancier', icon: Users, color: 'emerald' },
                  { id: 'taxi', label: 'Chauffeur de Taxi', icon: Car, color: 'amber' }
                ].map((role) => {
                  const isActive = roles.includes(role.id as UserRole);
                  const colorClasses = {
                    indigo: isActive ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400',
                    emerald: isActive ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400',
                    amber: isActive ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }[role.color as 'indigo' | 'emerald' | 'amber'];

                  const iconColorClasses = {
                    indigo: isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500',
                    emerald: isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500',
                    amber: isActive ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'
                  }[role.color as 'indigo' | 'emerald' | 'amber'];

                  return (
                    <button
                      key={role.id}
                      onClick={() => toggleRole(role.id as UserRole)}
                      className={`w-full p-6 rounded-[24px] border-2 flex items-center gap-4 transition-all ${colorClasses}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconColorClasses}`}>
                        <role.icon size={24} />
                      </div>
                      <span className="font-bold text-lg">{role.label}</span>
                      {isActive && <Check className="ml-auto text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-slate-900 text-white rounded-2xl"><ChevronLeft /></button>
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
                  className="flex-1 py-5 bg-indigo-600 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-sm"
                >
                  Suivant
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
              className="flex-1 flex flex-col"
            >
              <div className="mt-8 mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Activité principale</h2>
                <p className="text-slate-400">Celle que vous pratiquez le plus souvent.</p>
              </div>
              <div className="space-y-4">
                {roles.map((roleId) => {
                  const roleInfo = {
                    dea: { label: 'Ambulancier DEA', icon: Stethoscope },
                    auxiliary: { label: 'Auxiliaire Ambulancier', icon: Users },
                    taxi: { label: 'Chauffeur de Taxi', icon: Car }
                  }[roleId];
                  return (
                    <button
                      key={roleId}
                      onClick={() => setPrimaryRole(roleId)}
                      className={`w-full p-6 rounded-[24px] border-2 flex items-center gap-4 transition-all ${
                        primaryRole === roleId 
                          ? 'bg-indigo-500/10 border-indigo-500 text-white' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        primaryRole === roleId ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <roleInfo.icon size={24} />
                      </div>
                      <span className="font-bold text-lg">{roleInfo.label}</span>
                      {primaryRole === roleId && <div className="ml-auto w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-8 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-slate-900 text-white rounded-2xl"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  disabled={!primaryRole}
                  className="flex-1 py-5 bg-indigo-600 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-sm"
                >
                  Confirmer
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
              className="flex-1 flex flex-col"
            >
              <div className="mt-8 mb-6">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Votre contrat</h2>
                <p className="text-slate-400">Configuration précise de votre temps de travail.</p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {/* Base Hebdomadaire */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end ml-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base hebdomadaire</label>
                    <span className="text-indigo-400 font-black text-xl">{weeklyContractHours}h</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[35, 39].map(h => (
                      <button
                        key={h}
                        onClick={() => setWeeklyContractHours(h)}
                        className={`py-4 rounded-xl font-bold text-xs transition-all ${
                          weeklyContractHours === h ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
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
                        className={`w-full py-4 rounded-xl font-bold text-xs text-center outline-none transition-all ${
                          weeklyContractHours !== 35 && weeklyContractHours !== 39 ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic ml-1">“Vos heures supplémentaires seront calculées automatiquement selon cette base”</p>
                </div>

                {/* Mode de Calcul */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mode de calcul des heures supp.</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'weekly', label: 'Hebdo' },
                      { id: 'biweekly', label: 'Quinzaine' },
                      { id: 'modulation', label: 'Modulation' },
                      { id: 'annualized', label: 'Annuel' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setOvertimeMode(mode.id as any)}
                        className={`py-4 rounded-xl font-bold text-xs transition-all ${
                          overtimeMode === mode.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {overtimeMode === 'weekly' && "Calcul classique à la semaine (au delà de votre base)."}
                      {overtimeMode === 'biweekly' && "Calcul lissé sur 2 semaines consécutives."}
                      {overtimeMode === 'modulation' && "Le mode de modulation permet de lisser vos heures sur plusieurs semaines."}
                      {overtimeMode === 'annualized' && "Calcul basé sur le total d'heures annuel (1607h)."}
                    </p>
                  </div>
                </div>

                {/* Durée de Modulation (Conditionnel) */}
                {overtimeMode === 'modulation' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Durée de la modulation</label>
                      <span className="text-indigo-400 font-black text-sm">{modulationWeeks} semaines</span>
                    </div>
                    <div className="px-2 py-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <input 
                        type="range"
                        min="4"
                        max="12"
                        step="1"
                        value={modulationWeeks}
                        onChange={(e) => setModulationWeeks(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[10px] font-bold text-slate-600">4 sem.</span>
                        <span className="text-[10px] font-bold text-slate-600">12 sem.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mode de Rémunération */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mode de rémunération</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '100_percent', label: '100%' },
                      { id: '90_percent', label: '90%' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setPayRateMode(mode.id as any)}
                        className={`py-4 rounded-xl font-bold text-xs transition-all ${
                          payRateMode === mode.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic ml-1">
                    {payRateMode === '90_percent' ? "“Le mode 90% signifie que seule une partie de votre temps de travail est rémunérée”" : "“100% de votre temps de travail effectif est rémunéré”"}
                  </p>
                </div>

                {/* Date d'entrée */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Date d'entrée dans l'entreprise</label>
                  <input 
                    type="date" 
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 flex gap-4 flex-shrink-0">
                <button onClick={() => setStep(roles.length > 1 ? 3 : 2)} className="p-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
                >
                  Suivant
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
              className="flex-1 flex flex-col"
            >
              <div className="mt-8 mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Super-pouvoirs</h2>
                <p className="text-slate-400">Optimisez votre expérience.</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-[24px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-white">Géolocalisation</p>
                      <p className="text-xs text-slate-500">Automatise vos lieux de service</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAutoGeo(!autoGeo)}
                    className={`w-14 h-8 rounded-full transition-all relative ${autoGeo ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${autoGeo ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-[24px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                      <Bell size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-white">Notifications</p>
                      <p className="text-xs text-slate-500">Rappels de fin de service</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`w-14 h-8 rounded-full transition-all relative ${pushEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${pushEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="mt-6 pt-4 flex gap-4 flex-shrink-0">
                <button onClick={prevStep} className="p-5 bg-slate-900 text-white rounded-2xl"><ChevronLeft /></button>
                <button 
                  onClick={nextStep} 
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm"
                >
                  Terminer
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
              className="flex-1 flex flex-col justify-center items-center text-center space-y-12"
            >
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center"
                >
                  <Play className="text-indigo-500 fill-indigo-500" size={48} />
                </motion.div>
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full">
                  <Check size={20} />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tight">C'est prêt !</h2>
                <p className="text-slate-400 text-lg max-w-xs mx-auto">
                  Votre profil est configuré. Vous pouvez maintenant démarrer votre première journée.
                </p>
              </div>
              <button 
                onClick={handleComplete}
                className="w-full py-6 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/40"
              >
                Accéder à mon Board
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
