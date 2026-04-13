
import React, { useRef, useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Award, 
  Car, 
  Building2, 
  Clock, 
  Zap, 
  Euro,
  ChevronRight,
  Star,
  FileBadge,
  Moon,
  Sun,
  Target,
  FileText,
  CalendarDays,
  Bell,
  MapPin,
  Calendar,
  Users,
  ShieldAlert,
  RefreshCw,
  Camera,
  Loader2
} from 'lucide-react';
import { Shift, ActivityLog, UserStats } from '../types';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileTabProps {
  darkMode: boolean;
  userName: string;
  profileImage: string | null;
  setProfileImage: (val: string | null) => void;
  jobTitle: string;
  companyName: string;
  hourlyRate: string;
  effectiveHourlyRate?: string;
  seniorityInfo?: { years: number; months: number; bonus: number; text: string };
  setHourlyRate?: (val: string) => void;
  setContractStartDate?: (val: string) => void;
  shifts: Shift[];
  logs: ActivityLog[];
  followSystemTheme: boolean;
  setFollowSystemTheme: (val: boolean) => void;
  userStats: UserStats;
  onLogout: () => void;
  onResetData: () => void;
  hasDea?: boolean;
  hasAux?: boolean;
  hasTaxiCard?: boolean;
  primaryGraduationDate?: string;
  deaDate?: string;
  auxDate?: string;
  taxiDate?: string;
  taxiCardExpiryDate?: string;
  setTaxiCardExpiryDate?: (val: string) => void;
  taxiFpcDate?: string;
  setTaxiFpcDate?: (val: string) => void;
  afgsuDate?: string;
  setAfgsuDate?: (val: string) => void;
  medicalExpiryDate?: string;
  setMedicalExpiryDate?: (val: string) => void;
  trainingReminders?: Record<string, number>;
  setTrainingReminders?: (val: Record<string, number>) => void;
  contractStartDate?: string;
  hoursBase?: string;
  cpCalculationMode?: '25' | '30';
  setCpCalculationMode?: (val: string) => void;
  initialCpBalance: number;
  setInitialCpBalance: (val: number) => void;
  initialRttBalance: number;
  setInitialRttBalance: (val: number) => void;
  initialRecupBalance: number;
  setInitialRecupBalance: (val: number) => void;
  overtimeMode?: string;
  pushEnabled: boolean;
  setPushEnabled: (val: boolean) => void;
  autoGeo: boolean;
  setAutoGeo: (val: boolean) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = React.memo(({
  darkMode,
  userName,
  profileImage,
  setProfileImage,
  jobTitle,
  companyName,
  hourlyRate,
  effectiveHourlyRate,
  seniorityInfo,
  setHourlyRate,
  setContractStartDate,
  followSystemTheme,
  setFollowSystemTheme,
  userStats,
  onLogout,
  onResetData,
  hasDea = false,
  hasAux = false,
  hasTaxiCard = false,
  primaryGraduationDate = "",
  deaDate = "",
  auxDate = "",
  taxiDate = "",
  taxiCardExpiryDate = "",
  setTaxiCardExpiryDate,
  taxiFpcDate = "",
  setTaxiFpcDate,
  afgsuDate = "",
  setAfgsuDate,
  medicalExpiryDate = "",
  setMedicalExpiryDate,
  trainingReminders = { afgsu: 3, medical: 3, taxiFpc: 3, taxiCard: 3 },
  setTrainingReminders,
  contractStartDate = "",
  hoursBase = "35",
  cpCalculationMode = "25",
  setCpCalculationMode,
  initialCpBalance,
  setInitialCpBalance,
  initialRttBalance,
  setInitialRttBalance,
  initialRecupBalance,
  setInitialRecupBalance,
  overtimeMode = "weekly",
  pushEnabled,
  setPushEnabled,
  autoGeo,
  setAutoGeo
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create a unique filename based on user name and timestamp
      const filename = `profile_images/${userName.replace(/\s+/g, '_')}_${Date.now()}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setProfileImage(downloadURL);
      localStorage.setItem('ambuflow_profile_image', downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erreur lors de l'envoi de l'image. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  const bentoCardBase = `relative overflow-hidden transition-all duration-300 rounded-[32px] border ${
    darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'
  } backdrop-blur-xl`;

  const overtimeLabels: Record<string, string> = {
    weekly: 'Hebdomadaire',
    fortnightly: 'Quinzaine',
    modulation: 'Modulation',
    annualization: 'Annualisation'
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const seniorityText = seniorityInfo?.text || "N/A";
  const seniorityBonus = seniorityInfo?.bonus ? `+${(seniorityInfo.bonus * 100).toFixed(0)}%` : "+0%";

  const complianceItems = React.useMemo(() => {
    const now = new Date();
    const items = [];

    const getStatus = (expiryDate: Date | null, reminderMonths: number = 3) => {
      if (!expiryDate) return 'expired';
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      if (diffMs <= 0) return 'expired';
      if (diffMonths <= reminderMonths) return 'warning';
      return 'ok';
    };

    // AFGSU (4 ans)
    if (afgsuDate) {
      const expiry = new Date(afgsuDate);
      expiry.setFullYear(expiry.getFullYear() + 4);
      items.push({ label: 'AFGSU 2', status: getStatus(expiry, trainingReminders.afgsu), date: expiry });
    } else {
      items.push({ label: 'AFGSU 2', status: 'expired', date: null });
    }

    // Médical (5 ans à partir de la visite)
    if (medicalExpiryDate) {
      const expiry = new Date(medicalExpiryDate);
      expiry.setFullYear(expiry.getFullYear() + 5);
      items.push({ label: 'Aptitude Médicale', status: getStatus(expiry, trainingReminders.medical), date: expiry });
    } else {
      items.push({ label: 'Aptitude Médicale', status: 'expired', date: null });
    }

    // Taxi
    if (hasTaxiCard) {
      // FPC (5 ans)
      if (taxiFpcDate) {
        const expiry = new Date(taxiFpcDate);
        expiry.setFullYear(expiry.getFullYear() + 5);
        items.push({ label: 'FPC Taxi', status: getStatus(expiry, trainingReminders.taxiFpc), date: expiry });
      } else {
        items.push({ label: 'FPC Taxi', status: 'expired', date: null });
      }

      // Carte Pro (Date d'expiration directe)
      if (taxiCardExpiryDate) {
        const expiry = new Date(taxiCardExpiryDate);
        items.push({ label: 'Carte Pro Taxi', status: getStatus(expiry, trainingReminders.taxiCard), date: expiry });
      } else {
        items.push({ label: 'Carte Pro Taxi', status: 'expired', date: null });
      }
    }

    // Permis / DEA (Simple check if exists)
    items.push({ label: 'Diplôme d\'État', status: (hasDea || hasAux) ? 'ok' : 'expired', date: null });

    return items;
  }, [afgsuDate, medicalExpiryDate, hasDea, hasAux, hasTaxiCard, taxiFpcDate, taxiCardExpiryDate]);

  return (
    <div className="p-5 space-y-6 animate-fadeIn pb-32">
      
      {/* IDENTITY HERO */}
      <div className={`${bentoCardBase} p-8 flex flex-col items-center text-center`}>
        <div className="relative mb-6 group cursor-pointer" onClick={handleAvatarClick}>
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
          <div className="relative w-32 h-32 rounded-[40px] p-1 bg-gradient-to-tr from-indigo-500 to-emerald-500 transition-transform group-hover:scale-105">
            <div className={`w-full h-full rounded-[38px] overflow-hidden flex items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
              {isUploading ? (
                <Loader2 className="animate-spin text-indigo-500" size={32} />
              ) : profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={48} />
                </div>
              )}
            </div>
            <div className="absolute -right-2 -bottom-2 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white dark:border-slate-950 group-hover:bg-indigo-500 transition-colors">
              <Camera size={18} />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-1">{userName || "Ambulancier"}</h2>
        <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
          <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{jobTitle}</div>
        </div>
        <div className="flex items-center gap-2 text-slate-400"><Building2 size={16} /><span className="text-sm font-bold">{companyName || "Société d'AmbuFlow"}</span></div>
        <div className="mt-4 px-4 py-2 rounded-2xl bg-slate-500/5 border border-white/5 flex items-center gap-2">
          <CalendarDays size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ancienneté : {seniorityText}</span>
          <span className="text-[10px] font-black text-emerald-500 ml-1">({seniorityBonus})</span>
        </div>
      </div>

      {/* CHECKLIST CONFORMITÉ */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><ShieldCheck size={16} /> Checklist Conformité</h3>
        <div className="space-y-3">
          {complianceItems.map((item, idx) => {
            const isOk = item.status === 'ok';
            const isWarning = item.status === 'warning';
            const isExpired = item.status === 'expired';
            
            return (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isOk ? 'bg-emerald-500/5 border-emerald-500/10' : 
                isWarning ? 'bg-amber-500/5 border-amber-500/10' : 
                'bg-rose-500/5 border-rose-500/10'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    isOk ? 'bg-emerald-500 text-white' : 
                    isWarning ? 'bg-amber-500 text-white' : 
                    'bg-rose-500 text-white'
                  }`}>
                    {isOk ? <Award size={16} /> : <ShieldAlert size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${
                      isOk ? (darkMode ? 'text-white' : 'text-slate-900') : 
                      isWarning ? 'text-amber-500' : 
                      'text-rose-500'
                    }`}>{item.label}</span>
                    {item.date && (
                      <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">
                        {isExpired ? 'Expiré le ' : 'Expire le '} {formatDate(item.date.toISOString())}
                      </span>
                    )}
                  </div>
                </div>
                {isOk ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Star size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[10px] ${
                    isWarning ? 'bg-amber-500' : 'bg-rose-500'
                  }`}>!</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DÉTAILS DU CONTRAT */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><FileText size={16} /> Détails du Contrat</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-500/5 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Euro size={16} className="text-indigo-500" /><span className="text-sm font-bold">Taux Horaire</span></div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <input 
                    type="number" 
                    step="0.01"
                    className="bg-transparent text-sm font-black text-indigo-500 outline-none text-right w-20"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate?.(e.target.value)}
                  />
                  <span className="text-[10px] font-bold text-slate-500">€/h</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Base (Niveau 3)</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Majoration Ancienneté ({seniorityBonus})</span>
              <span className="text-xs font-black text-emerald-500">{effectiveHourlyRate} €/h</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-white/5">
            <div className="flex items-center gap-3"><Clock size={16} className="text-indigo-500" /><span className="text-sm font-bold">Base Horaire</span></div>
            <span className="text-xs font-black text-indigo-500">{hoursBase}h / semaine</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-white/5">
            <div className="flex items-center gap-3"><Zap size={16} className="text-emerald-500" /><span className="text-sm font-bold">Gestion des heures</span></div>
            <span className="text-xs font-black text-emerald-500">{overtimeLabels[overtimeMode] || overtimeMode}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-white/5">
            <div className="flex items-center gap-3"><CalendarDays size={16} className="text-amber-500" /><span className="text-sm font-bold">Entrée Entreprise</span></div>
            <input 
              type="date" 
              className="bg-transparent text-xs font-black text-amber-500 outline-none text-right"
              value={contractStartDate}
              onChange={(e) => setContractStartDate?.(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-500/5 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Calendar size={16} className="text-emerald-500" /><span className="text-sm font-bold">Base Congés (CP)</span></div>
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5">
                <button 
                  onClick={() => setCpCalculationMode?.('25')}
                  className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${cpCalculationMode === '25' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                >25j</button>
                <button 
                  onClick={() => setCpCalculationMode?.('30')}
                  className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${cpCalculationMode === '30' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                >30j</button>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
              {cpCalculationMode === '25' ? '2.08j / mois (Ouvrés)' : '2.5j / mois (Ouvrables)'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-500/5 border border-white/5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solde CP Initial</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  className="bg-transparent text-sm font-black text-emerald-500 outline-none w-full"
                  value={initialCpBalance}
                  onChange={(e) => setInitialCpBalance(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] font-bold text-slate-500">j</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-500/5 border border-white/5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solde RTT Initial</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  className="bg-transparent text-sm font-black text-indigo-500 outline-none w-full"
                  value={initialRttBalance}
                  onChange={(e) => setInitialRttBalance(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] font-bold text-slate-500">j</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-500/5 border border-white/5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solde Récup Initial</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  className="bg-transparent text-sm font-black text-amber-500 outline-none w-full"
                  value={initialRecupBalance}
                  onChange={(e) => setInitialRecupBalance(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] font-bold text-slate-500">j</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUALIFICATIONS ACTIVES */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><FileBadge size={16} /> Qualifications & Diplômes</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-500/5 border border-white/5 flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><FileBadge size={18} className="text-indigo-500" /><span className="text-sm font-bold">{jobTitle} (Principal)</span></div>
                <span className="text-[9px] font-black text-indigo-500 uppercase">Actif</span>
             </div>
             <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                <Calendar size={12} />
                <span>Obtenu le {formatDate(primaryGraduationDate)}</span>
             </div>
          </div>

          {hasDea && jobTitle !== 'Ambulancier DE' && jobTitle !== 'Auxiliaire ambulancier' && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-emerald-500" /><span className="text-sm font-bold">Diplôme d'État (DEA)</span></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase">Certifié</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500/60 text-[10px] font-bold">
                <Calendar size={12} />
                <span>Obtenu le {formatDate(deaDate)}</span>
              </div>
            </div>
          )}

          {hasTaxiCard && jobTitle !== 'Chauffeur taxi' && (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Car size={18} className="text-blue-500" /><span className="text-sm font-bold">Carte Pro Taxi</span></div>
                <span className="text-[9px] font-black text-blue-500 uppercase">Valide</span>
              </div>
              <div className="flex items-center gap-2 text-blue-500/60 text-[10px] font-bold">
                <Calendar size={12} />
                <span>Obtenu le {formatDate(taxiDate)}</span>
              </div>
            </div>
          )}

          {hasAux && jobTitle !== 'Auxiliaire ambulancier' && jobTitle !== 'Ambulancier DE' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Users size={18} className="text-amber-500" /><span className="text-sm font-bold">Certificat Auxiliaire</span></div>
                <span className="text-[9px] font-black text-amber-500 uppercase">Actif</span>
              </div>
              <div className="flex items-center gap-2 text-amber-500/60 text-[10px] font-bold">
                <Calendar size={12} />
                <span>Obtenu le {formatDate(auxDate)}</span>
              </div>
            </div>
          )}

          {/* AFGSU 2 */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
            afgsuDate ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-rose-500/5 border-rose-500/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className={afgsuDate ? 'text-indigo-500' : 'text-rose-500'} />
                <span className="text-sm font-bold">AFGSU 2</span>
              </div>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black text-indigo-500 outline-none text-right"
                value={afgsuDate}
                onChange={(e) => setAfgsuDate?.(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className="text-slate-500 uppercase tracking-widest">Dernier recyclage (4 ans)</span>
              {afgsuDate && (
                <span className="text-indigo-400">Expire le {formatDate(new Date(new Date(afgsuDate).setFullYear(new Date(afgsuDate).getFullYear() + 4)).toISOString())}</span>
              )}
            </div>
          </div>

          {/* MEDICAL */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
            medicalExpiryDate ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-rose-500/5 border-rose-500/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={18} className={medicalExpiryDate ? 'text-indigo-500' : 'text-rose-500'} />
                <span className="text-sm font-bold uppercase tracking-tight">Aptitude Préfectorale</span>
              </div>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black text-indigo-500 outline-none text-right"
                value={medicalExpiryDate}
                onChange={(e) => setMedicalExpiryDate?.(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className="text-slate-500 uppercase tracking-widest">Date de visite (5 ans)</span>
              {medicalExpiryDate && (
                <span className="text-indigo-400">Expire le {formatDate(new Date(new Date(medicalExpiryDate).setFullYear(new Date(medicalExpiryDate).getFullYear() + 5)).toISOString())}</span>
              )}
            </div>
          </div>

          {/* TAXI CARTE PRO & FPC */}
          {hasTaxiCard && (
            <>
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                taxiCardExpiryDate ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-rose-500/5 border-rose-500/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car size={18} className={taxiCardExpiryDate ? 'text-indigo-500' : 'text-rose-500'} />
                    <span className="text-sm font-bold">Carte Pro Taxi</span>
                  </div>
                  <input 
                    type="date" 
                    className="bg-transparent text-[10px] font-black text-indigo-500 outline-none text-right"
                    value={taxiCardExpiryDate}
                    onChange={(e) => setTaxiCardExpiryDate?.(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-slate-500 uppercase tracking-widest">Date d'expiration</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                taxiFpcDate ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-rose-500/5 border-rose-500/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className={taxiFpcDate ? 'text-indigo-500' : 'text-rose-500'} />
                    <span className="text-sm font-bold">FPC Taxi</span>
                  </div>
                  <input 
                    type="date" 
                    className="bg-transparent text-[10px] font-black text-indigo-500 outline-none text-right"
                    value={taxiFpcDate}
                    onChange={(e) => setTaxiFpcDate?.(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-slate-500 uppercase tracking-widest">Dernier stage (5 ans)</span>
                  {taxiFpcDate && (
                    <span className="text-indigo-400">Expire le {formatDate(new Date(new Date(taxiFpcDate).setFullYear(new Date(taxiFpcDate).getFullYear() + 5)).toISOString())}</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RAPPELS DE FORMATION */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Bell size={16} /> Rappels de Formation
        </h3>
        <div className="space-y-4">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-4">
            Définir le délai d'alerte avant expiration (en mois)
          </p>
          
          {[
            { id: 'afgsu', label: 'AFGSU 2', icon: ShieldCheck, color: 'text-indigo-500' },
            { id: 'medical', label: 'Aptitude Médicale', icon: Clock, color: 'text-rose-500' },
            ...(hasTaxiCard ? [
              { id: 'taxiFpc', label: 'FPC Taxi', icon: RefreshCw, color: 'text-emerald-500' },
              { id: 'taxiCard', label: 'Carte Pro Taxi', icon: Car, color: 'text-blue-500' }
            ] : [])
          ].map((reminder) => (
            <div key={reminder.id} className="p-4 rounded-2xl bg-slate-500/5 border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <reminder.icon size={18} className={reminder.color} />
                  <span className="text-sm font-bold">{reminder.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="12"
                    className="bg-transparent text-sm font-black text-indigo-500 outline-none text-right w-12"
                    value={trainingReminders[reminder.id] || 3}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setTrainingReminders?.({ ...trainingReminders, [reminder.id]: val });
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">mois</span>
                </div>
              </div>
              <input 
                type="range" 
                min="1" 
                max="12" 
                step="1"
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                value={trainingReminders[reminder.id] || 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTrainingReminders?.({ ...trainingReminders, [reminder.id]: val });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* RÉGLAGES APP */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Settings size={16} /> Réglages Application</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">{darkMode ? <Moon size={18} /> : <Sun size={18} />}</div><span className="text-sm font-bold">Thème automatique</span></div>
            <button onClick={() => setFollowSystemTheme(!followSystemTheme)} className={`w-12 h-6 rounded-full relative transition-all ${followSystemTheme ? 'bg-indigo-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${followSystemTheme ? 'left-7' : 'left-1'}`} /></button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Bell size={18} /></div><span className="text-sm font-bold">Notifications Push</span></div>
            <button onClick={() => setPushEnabled(!pushEnabled)} className={`w-12 h-6 rounded-full relative transition-all ${pushEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pushEnabled ? 'left-7' : 'left-1'}`} /></button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-violet-500/10 text-violet-500"><MapPin size={18} /></div><span className="text-sm font-bold">Géolocalisation Auto</span></div>
            <button onClick={() => setAutoGeo(!autoGeo)} className={`w-12 h-6 rounded-full relative transition-all ${autoGeo ? 'bg-indigo-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoGeo ? 'left-7' : 'left-1'}`} /></button>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="space-y-4">
        <button onClick={onLogout} className={`${bentoCardBase} w-full p-6 flex items-center justify-between group active:scale-[0.98]`}><div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500"><LogOut size={20} /></div><span className="font-black uppercase tracking-widest text-xs">Fermer la session</span></div><ChevronRight size={20} className="text-slate-500" /></button>
      </div>
    </div>
  );
});

export default ProfileTab;
