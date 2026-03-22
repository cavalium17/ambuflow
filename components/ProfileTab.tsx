
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
  Trash2, 
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
import { storage } from '../src/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileTabProps {
  darkMode: boolean;
  userName: string;
  firstName?: string;
  lastName?: string;
  setUserName: (val: string) => void;
  profileImage: string | null;
  setProfileImage: (val: string | null) => void;
  jobTitle: string;
  setJobTitle: (val: string) => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  companyCity?: string;
  setCompanyCity?: (val: string) => void;
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
  contractStartDate?: string;
  workRegime?: string;
  setWorkRegime?: (val: string) => void;
  modulationWeeks?: string;
  setModulationWeeks?: (val: string) => void;
  hoursBase?: string;
  setHoursBase?: (val: string) => void;
  cpCalculationMode?: '25' | '30';
  setCpCalculationMode?: (val: string) => void;
  initialCpBalance: number;
  setInitialCpBalance: (val: number) => void;
  pushEnabled: boolean;
  setPushEnabled: (val: boolean) => void;
  autoGeo: boolean;
  setAutoGeo: (val: boolean) => void;
  afgsuDate?: string;
  medicalExpiryDate?: string;
  taxiFpcDate?: string;
  taxiCardExpiryDate?: string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  darkMode,
  userName,
  firstName = "",
  lastName = "",
  setUserName,
  profileImage,
  setProfileImage,
  jobTitle,
  setJobTitle,
  companyName,
  setCompanyName,
  companyCity = "",
  setCompanyCity,
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
  contractStartDate = "",
  workRegime = "weekly",
  setWorkRegime,
  modulationWeeks = "4",
  setModulationWeeks,
  hoursBase = "35",
  setHoursBase,
  cpCalculationMode = "25",
  setCpCalculationMode,
  initialCpBalance,
  setInitialCpBalance,
  pushEnabled,
  setPushEnabled,
  autoGeo,
  setAutoGeo,
  afgsuDate = "",
  medicalExpiryDate = "",
  taxiFpcDate = "",
  taxiCardExpiryDate = ""
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
    } finally {
      setIsUploading(false);
    }
  };

  const bentoCardBase = `relative overflow-hidden transition-all duration-300 rounded-[32px] border ${
    darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'
  } backdrop-blur-xl`;

  const workRegimeLabels: Record<string, string> = {
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

    const getStatus = (expiryDate: Date | null) => {
      if (!expiryDate) return 'expired';
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      if (diffMs <= 0) return 'expired';
      if (diffMonths <= 3) return 'warning';
      return 'ok';
    };

    // AFGSU (4 ans)
    if (afgsuDate) {
      const expiry = new Date(afgsuDate);
      expiry.setFullYear(expiry.getFullYear() + 4);
      items.push({ label: 'AFGSU 2', status: getStatus(expiry), date: expiry });
    } else {
      items.push({ label: 'AFGSU 2', status: 'expired', date: null });
    }

    // Médical (5 ans à partir de la visite)
    if (medicalExpiryDate) {
      const expiry = new Date(medicalExpiryDate);
      expiry.setFullYear(expiry.getFullYear() + 5);
      items.push({ label: 'Aptitude Médicale', status: getStatus(expiry), date: expiry });
    } else {
      items.push({ label: 'Aptitude Médicale', status: 'expired', date: null });
    }

    // Taxi
    if (hasTaxiCard) {
      // FPC (5 ans)
      if (taxiFpcDate) {
        const expiry = new Date(taxiFpcDate);
        expiry.setFullYear(expiry.getFullYear() + 5);
        items.push({ label: 'FPC Taxi', status: getStatus(expiry), date: expiry });
      } else {
        items.push({ label: 'FPC Taxi', status: 'expired', date: null });
      }

      // Carte Pro (Date d'expiration directe)
      if (taxiCardExpiryDate) {
        const expiry = new Date(taxiCardExpiryDate);
        items.push({ label: 'Carte Pro Taxi', status: getStatus(expiry), date: expiry });
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

        <div className="w-full space-y-4">
          <div className="space-y-1">
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Utilisateur"}
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{jobTitle}</p>
          </div>

          {/* Badges Diplômes */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {hasDea && (
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/5">DEA</span>
            )}
            {hasAux && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">AUX</span>
            )}
            {hasTaxiCard && (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">TAXI</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION CONTRAT */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><FileText size={16} /> Section Contrat</h3>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              En poste chez <span className="text-indigo-500 font-black uppercase tracking-tight">{companyName || '...'}</span>
            </p>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              depuis le <span className="text-amber-500 font-black">{formatDate(contractStartDate)}</span>
            </p>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-white/5">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Régime</span>
              </div>
              <span className="text-sm font-black text-white">
                {workRegimeLabels[workRegime] || workRegime}
                {workRegime === 'modulation' && ` ${modulationWeeks} semaines`}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-white/5">
              <div className="flex items-center gap-3">
                <Euro size={16} className="text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Taux horaire</span>
              </div>
              <span className="text-sm font-black text-emerald-500">{hourlyRate}€/h</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Majoration Ancienneté ({seniorityBonus})</span>
              <span className="text-sm font-black text-indigo-400">{effectiveHourlyRate} €/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION PARAMÈTRES */}
      <div className={`${bentoCardBase} p-8`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Settings size={16} /> Section Paramètres</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                {darkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <span className="text-sm font-bold">Thème automatique</span>
            </div>
            <button 
              onClick={() => setFollowSystemTheme(!followSystemTheme)} 
              className={`w-12 h-6 rounded-full relative transition-all ${followSystemTheme ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${followSystemTheme ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Bell size={18} />
              </div>
              <span className="text-sm font-bold">Notifications Push</span>
            </div>
            <button 
              onClick={() => setPushEnabled(!pushEnabled)} 
              className={`w-12 h-6 rounded-full relative transition-all ${pushEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pushEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                <MapPin size={18} />
              </div>
              <span className="text-sm font-bold">Géolocalisation Auto</span>
            </div>
            <button 
              onClick={() => setAutoGeo(!autoGeo)} 
              className={`w-12 h-6 rounded-full relative transition-all ${autoGeo ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoGeo ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={onResetData} 
              className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-3 group active:scale-[0.98] transition-all"
            >
              <Trash2 size={18} className="text-rose-500" />
              <span className="font-black uppercase tracking-widest text-[10px] text-rose-500">Effacer toutes les données</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="space-y-4">
        <button onClick={onLogout} className={`${bentoCardBase} w-full p-6 flex items-center justify-between group active:scale-[0.98]`}><div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-slate-500/10 text-slate-500"><LogOut size={20} /></div><span className="font-black uppercase tracking-widest text-xs">Fermer la session</span></div><ChevronRight size={20} className="text-slate-500" /></button>
      </div>
    </div>
  );
};

export default ProfileTab;
