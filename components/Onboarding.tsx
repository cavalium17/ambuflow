
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Camera, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Building2, 
  Calendar, 
  Euro, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Car, 
  Users,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { auth, db, storage } from '../src/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

const steps = [
  { id: 1, title: 'Identité' },
  { id: 2, title: 'Qualification' },
  { id: 3, title: 'Contexte Pro' },
  { id: 4, title: 'Régime de Temps' },
  { id: 5, title: 'Récapitulatif' }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profileImage: '',
    qualifications: [] as string[],
    deaDate: '',
    auxDate: '',
    taxiDate: '',
    companyName: '',
    contractStartDate: '',
    modulationStartDate: '',
    hourlyRate: '12.79',
    workRegime: 'weekly',
    modulationWeeks: '4',
    monthlyHours: '151.67',
    leaveCalculation: '25'
  });

  const handleNext = async () => {
    setValidationError(null);
    
    // Validation logic for each step
    if (currentStep === 1) {
      if (!formData.firstName.trim() && !formData.lastName.trim()) {
        setValidationError("Veuillez remplir au moins votre nom ou votre prénom.");
        return;
      }
    }
    // All other steps are now non-blocking as requested

    if (currentStep === 4) {
      if (formData.workRegime === 'modulation' && !formData.modulationStartDate) {
        setValidationError("Veuillez sélectionner une date de début de cycle pour la modulation.");
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // On the last step, handleNext calls handleFinalSubmit
      await handleFinalSubmit();
    }
  };
  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, profileImage: url }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleQualification = (qual: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.includes(qual)
        ? prev.qualifications.filter(q => q !== qual)
        : [...prev.qualifications, qual]
    }));
  };

  const handleFinalSubmit = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        userName: `${formData.firstName} ${formData.lastName}`.trim(),
        profileImage: formData.profileImage,
        qualifications: formData.qualifications,
        deaDate: formData.deaDate,
        auxDate: formData.auxDate,
        taxiDate: formData.taxiDate,
        companyName: formData.companyName,
        contractStartDate: formData.contractStartDate,
        modulationStartDate: formData.modulationStartDate,
        hourlyRate: formData.hourlyRate,
        workRegime: formData.workRegime,
        modulationWeeks: formData.modulationWeeks,
        monthlyHours: formData.monthlyHours,
        leaveCalculation: formData.leaveCalculation,
        hasDea: formData.qualifications.includes('dea'),
        hasAux: formData.qualifications.includes('aux'),
        hasTaxiCard: formData.qualifications.includes('taxi'),
        onboarded: true,
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, profileData, { merge: true });
      onComplete(profileData);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center gap-6">
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                <div className="relative w-32 h-32 rounded-[40px] p-1 bg-gradient-to-tr from-indigo-500 to-emerald-500">
                  <div className="w-full h-full rounded-[38px] overflow-hidden bg-slate-900 flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="animate-spin text-indigo-500" size={32} />
                    ) : formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-slate-700" />
                    )}
                  </div>
                  <div className="absolute -right-2 -bottom-2 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl border-4 border-slate-950">
                    <Camera size={18} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <AnimatePresence mode="wait">
                {formData.firstName && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-indigo-400 font-black uppercase tracking-widest text-xs text-center"
                  >
                    Enchanté {formData.firstName}, configurons votre outil de bord.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Prénom</label>
                <input 
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Ex: Jean"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nom</label>
                <input 
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Ex: Dupont"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-8">
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-indigo-400 font-black uppercase tracking-widest text-[10px]"
              >
                Bonjour {formData.firstName} !
              </motion.p>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Vos Qualifications</h3>
              <p className="text-slate-500 text-xs font-medium">Sélectionnez tous vos diplômes actifs.</p>
            </div>

            <div className="space-y-4">
              {[
                { id: 'dea', label: "Diplôme d'État d'Ambulancier (DEA)", icon: ShieldCheck, color: 'emerald', dateKey: 'deaDate' },
                { id: 'aux', label: "Certificat d'Auxiliaire Ambulancier", icon: Users, color: 'amber', dateKey: 'auxDate' },
                { id: 'taxi', label: "Carte Professionnelle Taxi", icon: Car, color: 'blue', dateKey: 'taxiDate' }
              ].map(qual => (
                <div key={qual.id} className="space-y-2">
                  <button
                    onClick={() => toggleQualification(qual.id)}
                    className={`w-full flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
                      formData.qualifications.includes(qual.id)
                        ? `bg-${qual.color}-500/10 border-${qual.color}-500 text-white shadow-lg shadow-${qual.color}-500/20`
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${
                      formData.qualifications.includes(qual.id) ? `bg-${qual.color}-500 text-white` : 'bg-slate-800 text-slate-600'
                    }`}>
                      <qual.icon size={24} />
                    </div>
                    <span className="flex-1 text-left font-black uppercase tracking-tight text-sm leading-tight">
                      {qual.label}
                    </span>
                    {formData.qualifications.includes(qual.id) && (
                      <div className={`w-6 h-6 rounded-full bg-${qual.color}-500 flex items-center justify-center text-white`}>
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                  
                  {formData.qualifications.includes(qual.id) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-4 pb-2"
                    >
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Date d'obtention</label>
                      <input 
                        type="date"
                        value={(formData as any)[qual.dateKey]}
                        onChange={e => setFormData(prev => ({ ...prev, [qual.dateKey]: e.target.value }))}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-4">
              <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                Presque fini, {formData.firstName} !
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Building2 size={14} /> Société
                </label>
                <input 
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Calendar size={14} /> Date d'entrée
                </label>
                <input 
                  type="date"
                  value={formData.contractStartDate}
                  onChange={e => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Euro size={14} /> Taux horaire brut
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={e => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2 mb-4">
              <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                Dernière ligne droite, {formData.firstName} !
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'weekly', label: 'Hebdo', icon: Clock },
                { id: 'fortnightly', label: 'Quinzaine', icon: Calendar },
                { id: 'modulation', label: 'Modulation', icon: Zap },
                { id: 'annualization', label: 'Annuel', icon: CheckCircle2 }
              ].map(regime => (
                <button
                  key={regime.id}
                  onClick={() => setFormData(prev => ({ ...prev, workRegime: regime.id }))}
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3 ${
                    formData.workRegime === regime.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <regime.icon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{regime.label}</span>
                </button>
              ))}
            </div>

            {formData.workRegime === 'modulation' && (
              <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block text-center">
                    Cycle de modulation (semaines)
                  </label>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar px-2">
                    {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((weeks) => {
                      const isSelected = formData.modulationWeeks === weeks.toString();
                      return (
                        <motion.button
                          key={weeks}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setFormData(prev => ({ ...prev, modulationWeeks: weeks.toString() }))}
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all border-2 ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          {weeks}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                      Calcul de votre cycle sur {formData.modulationWeeks} semaines
                    </p>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 inline-block w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seuil heures sup.</span>
                        <span className="text-white font-bold text-sm">
                          {parseInt(formData.modulationWeeks) * 35}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block text-center">
                      Date de début du cycle de modulation
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50 group-focus-within:text-indigo-500 transition-colors">
                        <Calendar size={20} />
                      </div>
                      <input 
                        type="date"
                        required
                        value={formData.modulationStartDate}
                        onChange={e => setFormData(prev => ({ ...prev, modulationStartDate: e.target.value }))}
                        className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium text-center italic">
                      Cette date permet de calculer vos cycles de {formData.modulationWeeks} semaines automatiquement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Volume mensuel (h)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={formData.monthlyHours}
                  onChange={e => setFormData(prev => ({ ...prev, monthlyHours: e.target.value }))}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Calcul des congés</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, leaveCalculation: '25' }))}
                    className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                      formData.leaveCalculation === '25' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    25 Jours Ouvrés
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, leaveCalculation: '30' }))}
                    className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                      formData.leaveCalculation === '30' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    30 Jours Ouvrables
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-4">
              <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                C'est parfait, {formData.firstName} !
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-[32px] border border-slate-800 p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-700 m-auto h-full" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-black uppercase tracking-tight">{formData.firstName} {formData.lastName}</h4>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    {formData.qualifications.map(q => q.toUpperCase()).join(' • ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Société</span>
                  <p className="text-white font-bold text-sm">{formData.companyName || 'Non spécifié'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Taux Horaire</span>
                  <p className="text-white font-bold text-sm">{formData.hourlyRate} €/h</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Régime</span>
                  <p className="text-white font-bold text-sm capitalize">{formData.workRegime}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base Mensuelle</span>
                  <p className="text-white font-bold text-sm">{formData.monthlyHours}h</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Congés Payés</span>
                  <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">{formData.leaveCalculation} Jours</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-y-auto no-scrollbar p-6 pb-24 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <img 
          src="https://ambuflow-delta.vercel.app/pwa-512x512.png" 
          alt="Logo" 
          className="w-10 h-10 rounded-xl"
        />
        <div className="flex gap-1">
          {steps.map(step => (
            <div 
              key={step.id}
              className={`h-1 rounded-full transition-all duration-500 ${
                currentStep >= step.id ? 'w-8 bg-indigo-500' : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-md mx-auto w-full">
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 flex flex-col gap-4 max-w-md mx-auto w-full">
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-[10px] font-black uppercase tracking-widest text-center"
            >
              {validationError}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1 || isSaving}
            className={`p-4 rounded-2xl border-2 border-slate-800 text-slate-500 transition-all ${
              currentStep === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-900'
            } disabled:opacity-50`}
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : currentStep === 5 ? (
              <>Valider <Check size={20} /></>
            ) : (
              <>Suivant <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
