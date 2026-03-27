import React, { useState, useRef, useMemo } from 'react';
import { 
  User, 
  Building2, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  FileBadge,
  Users,
  Car,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Layers,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { storage } from '../src/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface OnboardingProps {
  onComplete: (data: any) => void;
  darkMode?: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, darkMode = false }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    userName: '',
    profileImage: null as string | null,
    jobTitle: 'Ambulancier DE',
    primaryGraduationDate: '2014-06-30',
    hasTaxiCard: false,
    hasDea: true,
    hasAux: false,
    deaDate: new Date().toISOString().split('T')[0],
    auxDate: new Date().toISOString().split('T')[0],
    taxiDate: new Date().toISOString().split('T')[0],
    companyName: '',
    companyCity: '',
    companyPhone: '',
    contractStartDate: new Date().toISOString().split('T')[0],
    hourlyRate: '11.65',
    hoursBase: '35',
    cpCalculationMode: '25',
    initialCpBalance: '25',
    afgsuDate: '',
    medicalExpiryDate: '',
    taxiCardExpiryDate: '',
    taxiFpcDate: '',
    overtimeMode: 'weekly',
    modulationWeeks: '4',
    modulationStartDate: new Date().toISOString().split('T')[0],
    notifications: true,
    geo: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryDateRef = useRef<HTMLInputElement>(null);
  const deaDateRef = useRef<HTMLInputElement>(null);
  const auxDateRef = useRef<HTMLInputElement>(null);
  const taxiDateRef = useRef<HTMLInputElement>(null);
  const afgsuDateRef = useRef<HTMLInputElement>(null);
  const medicalExpiryDateRef = useRef<HTMLInputElement>(null);
  const taxiCardExpiryDateRef = useRef<HTMLInputElement>(null);
  const taxiFpcDateRef = useRef<HTMLInputElement>(null);
  const contractDateRef = useRef<HTMLInputElement>(null);
  const modulationDateRef = useRef<HTMLInputElement>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          ref.current.showPicker();
        } else {
          ref.current.click();
        }
      } catch (e) {
        ref.current.click();
      }
    }
  };

  const totalSteps = 6;

  const modulationEndDate = useMemo(() => {
    if (!formData.modulationStartDate || formData.overtimeMode !== 'modulation') return null;
    const start = new Date(formData.modulationStartDate);
    const weeks = parseInt(formData.modulationWeeks);
    const end = new Date(start);
    end.setDate(start.getDate() + (weeks * 7) - 1);
    return end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }, [formData.modulationStartDate, formData.modulationWeeks, formData.overtimeMode]);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const filename = `profile_images/onboarding_${Date.now()}`;
        const storageRef = ref(storage, filename);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        setFormData({ ...formData, profileImage: downloadURL });
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Erreur lors de l'envoi de l'image. Veuillez réessayer.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    else {
      localStorage.setItem('ambuflow_onboarded', 'true');
      onComplete(formData);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / totalSteps) * 100;

  const inputBaseClass = `w-full p-4 rounded-2xl border-2 transition-all outline-none text-lg font-semibold bg-slate-900/60 border-white/10 text-white focus:border-indigo-500 backdrop-blur-xl placeholder:text-slate-500 shadow-2xl`;
  
  // Classe ultra-compacte optimisée pour tenir sur une seule ligne fine
  const compactDateBoxClass = `relative w-full py-2 px-5 rounded-[20px] border-2 border-indigo-500/30 bg-indigo-900/20 flex items-center justify-between transition-all hover:border-indigo-500/50 shadow-2xl group min-h-[44px] cursor-pointer active:scale-[0.98]`;
  const smallLabelInlineClass = "text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] whitespace-nowrap opacity-80";

  const handleRoleSelection = (role: string) => {
    setFormData(prev => ({
      ...prev,
      jobTitle: role,
      hasDea: role === 'Ambulancier DE',
      hasAux: role === 'Auxiliaire ambulancier',
      hasTaxiCard: role === 'Chauffeur taxi'
    }));
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-50 scale-105">
          <source src="https://assets.mixkit.co/videos/preview/mixkit-ambulance-driving-down-the-street-at-night-40432-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 z-20 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col px-8 pt-20 pb-12 max-w-lg mx-auto w-full relative z-10 no-scrollbar overflow-y-auto">
        <div className="absolute top-8 right-8 z-30">
          <button 
            onClick={() => {
              localStorage.setItem('ambuflow_onboarded', 'true');
              onComplete(formData);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
          >
            Passer
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center animate-fadeIn py-8">
          <div key={step} className="animate-slideUp">
            {step === 1 && (
              <div className="space-y-8 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 animate-pulse" />
                  <img 
                    src="/pwa-512x512.png" 
                    className="relative w-64 mx-auto drop-shadow-2xl" 
                    alt="AmbuFlow Logo" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-slate-200 text-lg font-medium leading-relaxed drop-shadow-lg px-4">Pilotez votre activité, gérez vos pointages et suivez vos revenus avec l'intelligence de demain.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter text-white">Votre Identité</h2>
                  <p className="text-slate-300 text-lg font-medium">L'équipage a besoin d'un nom.</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div onClick={() => fileInputRef.current?.click()} className={`group relative w-36 h-36 rounded-[48px] border-4 border-dashed flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 overflow-hidden backdrop-blur-2xl bg-white/5 ${formData.profileImage ? 'border-indigo-500 border-solid' : 'border-white/20'}`}>
                    {isUploading ? (
                      <Loader2 className="animate-spin text-indigo-500" size={32} />
                    ) : formData.profileImage ? (
                      <img src={formData.profileImage} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <User className="text-white/40 group-hover:text-white/60 transition-colors" size={40} />
                        <span className="text-[10px] text-white/40 font-black uppercase">Photo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input 
                    type="text" 
                    placeholder="Prénom & Nom" 
                    className={inputBaseClass + " pl-12"} 
                    value={formData.userName} 
                    onChange={(e) => setFormData({...formData, userName: e.target.value})} 
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 pb-10">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter text-white">Mes Qualifications</h2>
                  <p className="text-slate-300 text-lg font-medium">Activez vos alertes de validité.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'hasDea', label: 'DEA (Diplôme d\'État)', icon: FileBadge },
                      { id: 'hasAux', label: 'Auxiliaire (Attestation)', icon: Users },
                      { id: 'hasTaxiCard', label: 'Chauffeur de Taxi', icon: Car }
                    ].map((role) => {
                      const isSelected = (formData as any)[role.id];
                      return (
                        <button 
                          key={role.id}
                          onClick={() => setFormData(prev => ({ ...prev, [role.id]: !isSelected }))} 
                          className={`flex items-center gap-4 p-5 rounded-[32px] border-2 transition-all backdrop-blur-xl ${isSelected ? 'border-emerald-500 bg-emerald-600/20 shadow-[0_0_20px_rgba(46,204,113,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                          <div className={`p-3 rounded-2xl transition-all ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'}`}>
                            <role.icon size={24} />
                          </div>
                          <span className={`font-black text-sm uppercase tracking-widest flex-1 text-left ${isSelected ? 'text-white' : 'text-slate-400'}`}>{role.label}</span>
                          {isSelected && <CheckCircle2 className="text-emerald-400" size={20} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-white/10">
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Justificatifs & Dates</label>
                  
                  <div className="space-y-3">
                    {/* TOUJOURS : Visite Médicale */}
                    <div className={`p-4 rounded-[28px] border-2 transition-all flex items-center justify-between ${formData.medicalExpiryDate ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${formData.medicalExpiryDate ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 text-white/30'}`}><Clock size={20} /></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase tracking-tight">Visite Médicale</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Validité 5 ans</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => openPicker(medicalExpiryDateRef)}>
                        <span className="font-black text-xs text-indigo-400 tabular-nums">{formData.medicalExpiryDate ? formatDisplayDate(formData.medicalExpiryDate) : "Saisir"}</span>
                        <ChevronDown size={14} className="text-indigo-400" />
                        <input ref={medicalExpiryDateRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none" value={formData.medicalExpiryDate} onChange={(e) => setFormData({...formData, medicalExpiryDate: e.target.value})} />
                      </div>
                    </div>

                    {/* SI DEA OU AUXILIAIRE : AFGSU 2 */}
                    {(formData.hasDea || formData.hasAux) && (
                      <div className={`p-4 rounded-[28px] border-2 transition-all flex items-center justify-between ${formData.afgsuDate ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${formData.afgsuDate ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 text-white/30'}`}><ShieldCheck size={20} /></div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase tracking-tight">AFGSU 2</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Validité 4 ans</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => openPicker(afgsuDateRef)}>
                          <span className="font-black text-xs text-indigo-400 tabular-nums">{formData.afgsuDate ? formatDisplayDate(formData.afgsuDate) : "Saisir"}</span>
                          <ChevronDown size={14} className="text-indigo-400" />
                          <input ref={afgsuDateRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none" value={formData.afgsuDate} onChange={(e) => setFormData({...formData, afgsuDate: e.target.value})} />
                        </div>
                      </div>
                    )}

                    {/* SI TAXI : Carte Pro & FPC */}
                    {formData.hasTaxiCard && (
                      <>
                        <div className={`p-4 rounded-[28px] border-2 transition-all flex items-center justify-between ${formData.taxiCardExpiryDate ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${formData.taxiCardExpiryDate ? 'bg-emerald-50 text-emerald-600' : 'bg-white/10 text-white/30'}`}><Car size={20} /></div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white uppercase tracking-tight">Carte Pro Taxi</span>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Expiration</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => openPicker(taxiCardExpiryDateRef)}>
                            <span className="font-black text-xs text-emerald-400 tabular-nums">{formData.taxiCardExpiryDate ? formatDisplayDate(formData.taxiCardExpiryDate) : "Saisir"}</span>
                            <ChevronDown size={14} className="text-emerald-400" />
                            <input ref={taxiCardExpiryDateRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none" value={formData.taxiCardExpiryDate} onChange={(e) => setFormData({...formData, taxiCardExpiryDate: e.target.value})} />
                          </div>
                        </div>

                        <div className={`p-4 rounded-[28px] border-2 transition-all flex items-center justify-between ${formData.taxiFpcDate ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${formData.taxiFpcDate ? 'bg-emerald-50 text-emerald-600' : 'bg-white/10 text-white/30'}`}><RefreshCw size={20} /></div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white uppercase tracking-tight">FPC Taxi</span>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Dernier stage (5 ans)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => openPicker(taxiFpcDateRef)}>
                            <span className="font-black text-xs text-emerald-400 tabular-nums">{formData.taxiFpcDate ? formatDisplayDate(formData.taxiFpcDate) : "Saisir"}</span>
                            <ChevronDown size={14} className="text-emerald-400" />
                            <input ref={taxiFpcDateRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none" value={formData.taxiFpcDate} onChange={(e) => setFormData({...formData, taxiFpcDate: e.target.value})} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div className="space-y-2"><h2 className="text-4xl font-black tracking-tighter text-white">Détails de Paie</h2><p className="text-slate-300 text-lg font-medium">Configurez votre environnement.</p></div>
                <div className="space-y-5">
                  <div className="relative group"><Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} /><input type="text" placeholder="Société d'ambulance" className={inputBaseClass + " pl-12"} value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Début Contrat</label>
                      <div className={compactDateBoxClass} onClick={() => openPicker(contractDateRef)}>
                         <span className="font-bold text-base text-white tabular-nums">{formatDisplayDate(formData.contractStartDate)}</span>
                         <input ref={contractDateRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none" value={formData.contractStartDate} onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})} />
                         <ChevronDown size={16} className="text-indigo-400" />
                      </div>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Taux Horaire (€)</label><input type="number" step="0.01" className={inputBaseClass + " text-sm py-2.5 px-4 h-[44px]"} value={formData.hourlyRate} onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})} /></div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-2"><h2 className="text-4xl font-black tracking-tighter text-white">Horaires</h2><p className="text-slate-300 text-lg font-medium">Paramétrez votre volume horaire.</p></div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Volume horaire contrat</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['35', '39'].map(h => (
                        <button key={h} onClick={() => setFormData({...formData, hoursBase: h})} className={`p-4 rounded-2xl border-2 transition-all font-black ${formData.hoursBase === h ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/30' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                          {h} h / semaine
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Base de calcul Congés (CP)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: '25', label: '25j (Ouvrés)', sub: '2.08j / mois' },
                        { id: '30', label: '30j (Ouvrables)', sub: '2.5j / mois' }
                      ].map(mode => (
                        <button key={mode.id} onClick={() => setFormData({...formData, cpCalculationMode: mode.id})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${formData.cpCalculationMode === mode.id ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-500/30' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                          <span className="font-black text-sm">{mode.label}</span>
                          <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">{mode.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Initialisation du Solde</label>
                    <div className="grid grid-cols-1">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Solde CP actuel</label>
                        <input type="number" step="0.5" className={inputBaseClass + " text-sm py-2.5 px-4 h-[44px]"} value={formData.initialCpBalance} onChange={(e) => setFormData({...formData, initialCpBalance: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2"><label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Gestion des heures supp.</label>
<div className="grid grid-cols-1 gap-3">{[{ id: 'weekly', label: 'Hebdomadaire', icon: Clock }, { id: 'fortnightly', label: 'Quinzaine (2 sem.)', icon: Layers }, { id: 'modulation', label: 'Modulation', icon: RefreshCw }, { id: 'annualization', label: 'Annualisation', icon: CalendarIcon }].map(mode => (<div key={mode.id} className="space-y-2"><button onClick={() => setFormData({...formData, overtimeMode: mode.id})} className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${formData.overtimeMode === mode.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/30' : 'bg-white/5 border-white/5 text-slate-400'}`}><mode.icon size={20} /><span className="font-bold flex-1 text-left">{mode.label}</span>{formData.overtimeMode === mode.id && <CheckCircle2 size={18} />}</button>{formData.overtimeMode === 'modulation' && mode.id === 'modulation' && (<div className="p-5 rounded-3xl border-2 border-indigo-500/30 bg-indigo-900/40 space-y-5 animate-fadeIn"><div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Début de modulation</label>
                    <div className={compactDateBoxClass} onClick={() => openPicker(modulationDateRef)}>
                       <span className="font-bold text-base text-white tabular-nums">{formatDisplayDate(formData.modulationStartDate)}</span>
                       <input ref={modulationDateRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none" value={formData.modulationStartDate} onChange={(e) => setFormData({...formData, modulationStartDate: e.target.value})} />
                       <ChevronDown size={18} className="text-indigo-400" />
                    </div>
                  </div><div className="space-y-2"><label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-1 mb-1 block">Nombre de semaines : {formData.modulationWeeks}</label><input type="range" min="4" max="12" step="1" className="w-full h-2 bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-400" value={formData.modulationWeeks} onChange={(e) => setFormData({...formData, modulationWeeks: e.target.value})} /></div><div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3"><div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><CalendarIcon size={18} /></div><div className="flex-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin de période estimée</p><p className="text-sm font-black text-emerald-400">{modulationEndDate}</p></div></div></div>)}</div>))}</div></div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-8 text-center py-4"><div className="relative inline-block"><div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-30 animate-pulse" /><div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-[32px] mx-auto flex items-center justify-center border border-white/30 shadow-2xl backdrop-blur-xl"><CheckCircle2 size={48} strokeWidth={2.5} /></div></div><div className="space-y-4"><h2 className="text-5xl font-black tracking-tighter text-white">Prêt à Rouler</h2><p className="text-slate-200 text-lg font-medium leading-relaxed">Tout est configuré. AmbuFlow est maintenant votre partenaire de route.</p></div><div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between text-white mt-8"><div className="flex items-center gap-3"><MapPin size={20} className="text-indigo-400" /><span className="font-bold">Activer la Géolocalisation</span></div><button onClick={() => setFormData(prev => ({...prev, geo: !prev.geo}))} className={`w-12 h-6 rounded-full relative transition-all ${formData.geo ? 'bg-indigo-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.geo ? 'right-1' : 'left-1'}`} /></button></div></div>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-auto pt-8">
          {step > 1 && (<button onClick={prevStep} className="flex-1 py-5 rounded-[28px] font-bold transition-all bg-white/10 text-white border border-white/10 backdrop-blur-md hover:bg-white/20 active:scale-95 flex items-center justify-center gap-2"><ChevronLeft size={20} /></button>)}
          <button 
            onClick={nextStep} 
            disabled={(step === 2 && !formData.userName) || (step === 3 && !formData.hasDea && !formData.hasAux && !formData.hasTaxiCard)} 
            className="flex-[3] py-5 rounded-[28px] font-black text-white flex items-center justify-center gap-2 transition-all shadow-2xl active:scale-95 disabled:opacity-50 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 border border-indigo-400/50"
          >
            <span className="text-lg uppercase tracking-widest">{step === totalSteps ? 'Terminer' : 'Suivant'}</span>
            <ChevronRight size={22} strokeWidth={3} />
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-fadeIn { animation: fadeIn 1.2s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        input:focus { box-shadow: 0 0 25px rgba(99, 102, 241, 0.3); transform: translateY(-1px); }
      `}</style>
    </div>
  );
};

export default Onboarding;