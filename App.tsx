
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Coffee, 
  LogOut, 
  MapPin, 
  ChevronRight, 
  User, 
  Settings, 
  ArrowLeft, 
  FileBadge, 
  Euro, 
  Play, 
  History, 
  Smartphone, 
  BellRing, 
  Building2, 
  Car, 
  Briefcase, 
  Stethoscope, 
  Users, 
  Timer as TimerIcon,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Save,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Utensils,
  X,
  Hourglass,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Layers,
  ChevronLeft,
  PieChart,
  Timer,
  CalendarRange,
  RefreshCw,
  ChevronDown,
  Star
} from 'lucide-react';
import { ServiceStatus, ActivityLog, AppTab, Shift, Break, UserStats, PushNotification as PushType } from './types';
import Navigation from './components/Navigation';
import PaieTab from './components/PaieTab';
import PlanningTab from './components/PlanningTab';
import Onboarding from './components/Onboarding';
import ProfileTab from './components/ProfileTab';
import PushNotification from './components/PushNotification';
import DailyRecap from './components/DailyRecap';
import { requestForToken, onMessageListener } from './src/firebaseConfig';
import NavigationChoiceModal from './src/components/NavigationChoiceModal';
import { getRestaurantSuggestion, findNearbyRestos, RestaurantSuggestion } from './services/restaurantService';
import { requestNotificationPermissions, requestLocationPermissions, setupNotificationChannels } from './services/notificationManager';

// Helper pour calculer les jours fériés français
const getFrenchPublicHolidays = (year: number) => {
  const holidays = [
    `${year}-01-01`, // Nouvel An
    `${year}-05-01`, // Fête du Travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête Nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
  ];

  // Calcul des jours mobiles (Pâques, Ascension, Pentecôte)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100,
        d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  const month = Math.floor(n / 31);
  const day = (n % 31) + 1;

  const easter = new Date(year, month - 1, day);
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  holidays.push(addDays(easter, 1)); // Lundi de Pâques
  holidays.push(addDays(easter, 39)); // Ascension
  holidays.push(addDays(easter, 50)); // Lundi de Pentecôte

  return holidays;
};

const isSundayOrHoliday = (dateStr: string) => {
  const date = new Date(dateStr);
  if (date.getDay() === 0) return true; // Dimanche
  const year = date.getFullYear();
  const holidays = getFrenchPublicHolidays(year);
  return holidays.includes(dateStr);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [gainsCarouselIndex, setGainsCarouselIndex] = useState(0);
  const [showDailyRecap, setShowDailyRecap] = useState(false);
  const [lastFinishedShift, setLastFinishedShift] = useState<Shift | null>(null);
  
  const [hasNewReport, setHasNewReport] = useState(false);
  
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('ambuflow_user_stats');
    return saved ? JSON.parse(saved) : { lastActiveDay: undefined };
  });

  const [notifications, setNotifications] = useState<PushType[]>([]);
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('ambuflow_push_enabled') !== 'false');
  const [currentGeoPosition, setCurrentGeoPosition] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('ambuflow_shifts');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeShiftId, setActiveShiftId] = useState<string | null>(() => {
    return localStorage.getItem('ambuflow_active_shift_id');
  });

  const addNotification = useCallback((title: string, message: string, type: PushType['type'] = 'info', url?: string, action?: PushType['action']) => {
    console.log("addNotification: Ajout notification:", title);
    if (!pushEnabled) {
      console.log("addNotification: Push désactivé");
      return;
    }
    const newNotify: PushType = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      url,
      action
    };
    setNotifications(prev => [newNotify, ...prev]);
  }, [pushEnabled]);

  const sendMealNotification = useCallback(async () => {
    console.log("sendMealNotification: Déclenchement en arrière-plan...");
    
    setIsSearchingResto(true);

    // Timeout de 10 secondes pour la recherche globale
    const searchTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000));

    // Récupération de la position en temps réel
    const posPromise = new Promise<{latitude: number, longitude: number} | null>((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error("Erreur géolocalisation:", error);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        resolve(null);
      }
    });

    // On attend soit la position, soit le timeout de 10s
    let pos = await Promise.race([posPromise, searchTimeout]);

    if (!pos) {
      pos = currentGeoPosition;
    }

    if (!pos) {
      console.log("sendMealNotification: Position GPS manquante, tentative de récupération forcée...");
      pos = await requestLocationPermissions();
    }

    if (pos) {
      setCurrentGeoPosition(pos);
    } else {
      console.log("sendMealNotification: Échec de récupération de la position");
      setIsSearchingResto(false);
      return;
    }

    const activeShift = shifts.find(s => s.id === activeShiftId);
    const vehicle = activeShift?.vehicle || 'AMBU';

    console.log("sendMealNotification: Recherche restaurant pour", vehicle, "à", pos);
    
    // On race aussi la recherche de restaurant contre le timeout restant
    const suggestionPromise = getRestaurantSuggestion(
      vehicle,
      pos.latitude,
      pos.longitude
    );

    const suggestion = await Promise.race([suggestionPromise, searchTimeout]);

    setIsSearchingResto(false);

    if (suggestion) {
      console.log("sendMealNotification: Suggestion trouvée:", suggestion.name);
      setMealSuggestion(suggestion);
      console.log("Notification envoyée au gestionnaire système");
      addNotification(
        "🍴 Resto trouvé !",
        `${suggestion.name} est à ${suggestion.distanceMinutes} min. Ouvrir dans Waze/Maps ?`,
        "info",
        undefined,
        'open_navigation'
      );
    } else {
      console.log("sendMealNotification: Aucune suggestion trouvée ou timeout");
    }
  }, [pushEnabled, currentGeoPosition, shifts, activeShiftId, addNotification]);



  const [prefersDarkMode, setPrefersDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const [followSystemTheme, setFollowSystemTheme] = useState(() => {
    const saved = localStorage.getItem('ambuflow_follow_system_theme');
    return saved === null ? true : saved === 'true';
  });

  const effectiveDarkMode = followSystemTheme ? prefersDarkMode : false;

  useEffect(() => {
    if (effectiveDarkMode) {
      document.documentElement.classList.add('dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#020617'); // slate-950
    } else {
      document.documentElement.classList.remove('dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#F8FAFC'); // slate-50
    }
  }, [effectiveDarkMode]);

  const [status, setStatus] = useState<ServiceStatus>(() => {
    return (localStorage.getItem('ambuflow_status') as ServiceStatus) || ServiceStatus.OFF;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ambuflow_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('ambuflow_session_start');
    return saved ? new Date(saved) : null;
  });
  
  const [scheduledShiftId, setScheduledShiftId] = useState<string | null>(() => {
    return localStorage.getItem('ambuflow_scheduled_shift_id');
  });

  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakType, setBreakType] = useState<'meal' | 'coffee' | null>(null);
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakDuration, setBreakDuration] = useState(30);
  const [breakLocation, setBreakLocation] = useState<'Entreprise' | 'Extérieur'>('Entreprise');
  
  const [breakStartDateTime, setBreakStartDateTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('ambuflow_break_start_datetime');
    return saved ? new Date(saved) : null;
  });
  
  const [breakEndTimeActual, setBreakEndTimeActual] = useState<Date | null>(() => {
    const saved = localStorage.getItem('ambuflow_break_end');
    return saved ? new Date(saved) : null;
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('ambuflow_onboarded') !== 'true');
  const [nextAutoStart, setNextAutoStart] = useState<Date | null>(() => {
    const saved = localStorage.getItem('ambuflow_next_autostart');
    return saved ? new Date(saved) : null;
  });

  const [userName, setUserName] = useState(() => localStorage.getItem('ambuflow_user_name') || "");
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('ambuflow_profile_image') || null);
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('ambuflow_job_title') || "Ambulancier DE");
  const [hourlyRate, setHourlyRate] = useState(() => localStorage.getItem('ambuflow_hourly_rate') || "12.79");
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('ambuflow_company_name') || "");
  const [autoGeo, setAutoGeo] = useState(() => localStorage.getItem('ambuflow_autogeo') !== 'false');
  const [hasDea, setHasDea] = useState(() => localStorage.getItem('ambuflow_has_dea') === 'true');
  const [hasAux, setHasAux] = useState(() => localStorage.getItem('ambuflow_has_aux') === 'true');
  const [hasTaxiCard, setHasTaxiCard] = useState(() => localStorage.getItem('ambuflow_has_taxi') === 'true');
  
  const [primaryGraduationDate, setPrimaryGraduationDate] = useState(() => localStorage.getItem('ambuflow_primary_grad_date') || "");
  const [deaDate, setDeaDate] = useState(() => localStorage.getItem('ambuflow_dea_date') || "");
  const [auxDate, setAuxDate] = useState(() => localStorage.getItem('ambuflow_aux_date') || "");
  const [taxiDate, setTaxiDate] = useState(() => localStorage.getItem('ambuflow_taxi_date') || "");
  const [taxiCardExpiryDate, setTaxiCardExpiryDate] = useState(() => localStorage.getItem('ambuflow_taxi_card_expiry') || "");
  const [taxiFpcDate, setTaxiFpcDate] = useState(() => localStorage.getItem('ambuflow_taxi_fpc_date') || "");
  const [afgsuDate, setAfgsuDate] = useState(() => localStorage.getItem('ambuflow_afgsu_date') || "");
  const [medicalExpiryDate, setMedicalExpiryDate] = useState(() => localStorage.getItem('ambuflow_medical_expiry') || localStorage.getItem('date_aptitude_medicale')?.split('T')[0] || "");

  const [mealSuggestion, setMealSuggestion] = useState<RestaurantSuggestion | null>(null);
  const [isSearchingResto, setIsSearchingResto] = useState(false);
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);

  // Permissions et Notifications
  useEffect(() => {
    // Demande de permissions Notifications
    if (pushEnabled && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            requestForToken();
          }
        });
      } else if (Notification.permission === 'granted') {
        requestForToken();
      }
    }
    // Demande de permissions Géo
    if (autoGeo && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
  }, [pushEnabled, autoGeo]);

  // Écouteur de messages FCM en premier plan
  useEffect(() => {
    if (!pushEnabled) return;

    const unsubscribe = onMessageListener((payload: any) => {
      if (payload?.notification) {
        addNotification(
          payload.notification.title || "Notification",
          payload.notification.body || "",
          'info'
        );
      }
      
      // Déclenchement personnalisé via Data Payload
      if (payload?.data?.type === 'MEAL_TRIGGER') {
        console.log("FCM: Déclenchement à distance de la suggestion repas");
        sendMealNotification();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [pushEnabled, addNotification, sendMealNotification]);

  // Notification Restaurant Automatique
  useEffect(() => {
    if (!pushEnabled) return;

    const checkMealNotification = () => {
      const now = new Date();
      const hour = now.getHours();
      const isMealTime = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 20);
      
      if (isMealTime) {
        const todayStr = getLocalDateString(now);
        const mealKey = `meal_notif_${todayStr}_${hour < 15 ? 'lunch' : 'dinner'}`;
        
        if (!localStorage.getItem(mealKey)) {
          sendMealNotification();
          localStorage.setItem(mealKey, 'true');
        }
      }
    };

    // Déclenchement sur passage en pause repas
    if (status === ServiceStatus.BREAK) {
      const activeShift = shifts.find(s => s.id === activeShiftId);
      const lastBreak = activeShift?.breaks?.[activeShift.breaks.length - 1];
      if (lastBreak?.isMeal) {
        checkMealNotification();
      }
    }
    
    // Vérification périodique si en service
    const interval = setInterval(() => {
      if (status === ServiceStatus.WORKING) {
        const now = new Date();
        const hour = now.getHours();
        const mins = now.getMinutes();
        // Suggestion à 12h00 et 19h00 pile si en mission
        if ((hour === 12 && mins === 0) || (hour === 19 && mins === 0)) {
          checkMealNotification();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [status, activeShiftId, shifts, sendMealNotification, pushEnabled]);

  const [hoursBase, setHoursBase] = useState(() => localStorage.getItem('ambuflow_hours_base') || "35");
  const [cpCalculationMode, setCpCalculationMode] = useState(() => localStorage.getItem('ambuflow_cp_mode') || "25");
  const [overtimeMode, setOvertimeMode] = useState(() => localStorage.getItem('ambuflow_overtime_mode') || "weekly");

  // Notification Rapport Mensuel (1er du mois à 00:01)
  useEffect(() => {
    const checkMonthlyReport = () => {
      const now = new Date();
      // On vérifie si on est le 1er du mois
      if (now.getDate() === 1) {
        const monthKey = `monthly_report_notif_${now.getFullYear()}_${now.getMonth()}`;
        if (!localStorage.getItem(monthKey)) {
          const increment = cpCalculationMode === '30' ? 2.5 : 2.08;
          setInitialCpBalance(prev => prev + increment);
          addNotification(
            "SOLDE CP MIS À JOUR",
            `+${increment} jours ajoutés pour le nouveau mois.`,
            "success"
          );
          localStorage.setItem(monthKey, 'true');
        }
      }
    };
    
    // Vérification immédiate et toutes les heures
    checkMonthlyReport();
    const interval = setInterval(checkMonthlyReport, 3600000);
    return () => clearInterval(interval);
  }, [addNotification, cpCalculationMode]);

  const [contractStartDate, setContractStartDate] = useState(() => localStorage.getItem('ambuflow_contract_start') || "");

  const seniorityInfo = useMemo(() => {
    if (!contractStartDate) return { years: 0, months: 0, bonus: 0, text: "N/A" };
    const start = new Date(contractStartDate);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
      years--;
      months += 12;
    }
    
    let bonus = 0;
    if (years >= 15) bonus = 0.08;
    else if (years >= 10) bonus = 0.06;
    else if (years >= 5) bonus = 0.04;
    else if (years >= 2) bonus = 0.02;

    return { 
      years, 
      months, 
      bonus, 
      text: years > 0 ? `${years} an${years > 1 ? 's' : ''} ${months} mois` : `${months} mois`
    };
  }, [contractStartDate]);

  const effectiveHourlyRate = useMemo(() => {
    const base = parseFloat(hourlyRate) || 0;
    return (base * (1 + seniorityInfo.bonus)).toFixed(2);
  }, [hourlyRate, seniorityInfo.bonus]);
  const [modulationStartDate, setModulationStartDate] = useState(() => localStorage.getItem('ambuflow_modulation_start') || "");
  const [modulationWeeks, setModulationWeeks] = useState(() => localStorage.getItem('ambuflow_modulation_weeks') || "4");

  const [initialCpBalance, setInitialCpBalance] = useState(() => parseFloat(localStorage.getItem('ambuflow_initial_cp') || "0"));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatisation du cumul des CP (chaque 1er du mois) - Déjà géré dans checkMonthlyReport

  useEffect(() => {
    // Initialisation des canaux et permissions
    setupNotificationChannels();
    if (pushEnabled) {
      requestNotificationPermissions();
    }
    if (autoGeo) {
      requestLocationPermissions();
    }
  }, [pushEnabled, autoGeo]);

  useEffect(() => {
    if (!autoGeo || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentGeoPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => console.error("Erreur géo:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [autoGeo]);

  const addLog = useCallback((action: string, type: ActivityLog['type']) => {
    const now = currentTime;
    let locationInfo: string | undefined = undefined;
    if (autoGeo && currentGeoPosition) {
      locationInfo = `Lat: ${currentGeoPosition.latitude.toFixed(5)}, Lng: ${currentGeoPosition.longitude.toFixed(5)}`;
    }
    const newLog: ActivityLog = { id: Math.random().toString(36).substr(2, 9), action, time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), timestamp: now, location: locationInfo, type };
    setLogs(prev => [newLog, ...prev]);
  }, [currentTime, autoGeo, currentGeoPosition]);

  const handleStartService = useCallback((idToUse?: string | null) => {
    const now = currentTime;
    let actualStartTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const finalId = idToUse || activeShiftId;

    if (finalId) {
      const existingShift = shifts.find(s => s.id === finalId);
      if (existingShift && existingShift.start && existingShift.start !== '--:--') {
        actualStartTimeStr = existingShift.start;
      }
      setShifts(prev => prev.map(s => s.id === finalId ? { ...s, start: actualStartTimeStr } : s));
      setActiveShiftId(finalId);
    } else {
      const todayStr = getLocalDateString(now);
      const newShiftId = Math.random().toString(36).substr(2, 9);
      const newShift: Shift = { id: newShiftId, day: todayStr, start: actualStartTimeStr, end: '--:--', crew: userName || 'À définir', vehicle: 'ASSU', breaks: [] };
      setShifts(prev => [newShift, ...prev]);
      setActiveShiftId(newShiftId);
    }
    setStatus(ServiceStatus.WORKING);
    setSessionStartTime(now);
    addLog("Début de service", "start");
    setNextAutoStart(null);
    setScheduledShiftId(null);
    addNotification("SERVICE ACTIVÉ", "Prudence sur la route.", "success");
  }, [currentTime, activeShiftId, addLog, addNotification, userName, shifts]);

  const handleAutoStartService = useCallback((shiftId: string, startTime: string, shiftDay: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const [y, mon, d] = shiftDay.split('-').map(Number);
    const startDate = new Date(y, mon - 1, d, h, m, 0, 0);
    setScheduledShiftId(shiftId);
    setNextAutoStart(startDate);
    setActiveTab('home');
    addNotification("PLANIFICATION", `Prise de poste prévue le ${d}/${mon} à ${startTime}`, "info");
  }, [addNotification]);

  const handleEndService = useCallback(() => {
    const now = currentTime;
    const endTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    if (activeShiftId) {
      const shiftToFinish = shifts.find(s => s.id === activeShiftId);
      if (shiftToFinish) {
        const finishedShift = { ...shiftToFinish, end: endTimeStr };
        setLastFinishedShift(finishedShift);
        setShifts(prev => prev.map(s => s.id === activeShiftId ? finishedShift : s));
        setShowDailyRecap(true);
      }
    }
    
    setStatus(ServiceStatus.OFF);
    setSessionStartTime(null);
    addLog("Fin de service", "end");
    setActiveShiftId(null);
    setBreakEndTimeActual(null);
    setBreakStartDateTime(null);
    addNotification("FIN DE SERVICE", "Repos mérité !", "info");
  }, [currentTime, activeShiftId, addLog, addNotification, shifts]);

  const stopServiceSilently = useCallback(() => {
    setStatus(ServiceStatus.OFF);
    setSessionStartTime(null);
    setActiveShiftId(null);
    setBreakEndTimeActual(null);
    setBreakStartDateTime(null);
    addLog("Clôture de service (via Agenda)", "end");
    addNotification("MISSION CLÔTURÉE", "Le compteur journalier a été arrêté.", "info");
  }, [addLog, addNotification]);

  const handleResume = useCallback(() => {
    if (activeShiftId && status === ServiceStatus.BREAK) {
      setShifts(prev => prev.map(s => {
        if (s.id === activeShiftId && s.breaks && s.breaks.length > 0) {
          const updatedBreaks = [...s.breaks];
          const lastIndex = updatedBreaks.length - 1;
          const lastBreak = { ...updatedBreaks[lastIndex] };
          
          // Calcul de la durée réelle consommée
          const [startH, startM] = lastBreak.start.split(':').map(Number);
          const startDate = new Date(currentTime);
          startDate.setHours(startH, startM, 0, 0);
          
          let actualDuration = Math.round((currentTime.getTime() - startDate.getTime()) / 60000);
          if (actualDuration < 0) actualDuration = 0;
          
          lastBreak.duration = actualDuration;
          lastBreak.end = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          updatedBreaks[lastIndex] = lastBreak;
          
          return { ...s, breaks: updatedBreaks };
        }
        return s;
      }));
    }

    setStatus(ServiceStatus.WORKING);
    setBreakEndTimeActual(null);
    setBreakStartDateTime(null);
    setMealSuggestion(null);
    addLog("Reprise de mission", "resume");
  }, [activeShiftId, status, currentTime, addLog]);

  const handleOpenBreakModal = useCallback((type: 'meal' | 'coffee') => {
    setBreakType(type);
    setMealSuggestion(null);
    setBreakStartTime(currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    setBreakDuration(type === 'meal' ? 45 : 15);
    setBreakLocation('Entreprise');
    setShowBreakModal(true);
  }, [currentTime]);

  const handleModifyBreak = useCallback(() => {
    if (activeShiftId) {
      const activeShift = shifts.find(s => s.id === activeShiftId);
      const lastBreak = activeShift?.breaks?.[activeShift.breaks.length - 1];
      if (lastBreak) {
        setBreakType(lastBreak.isMeal ? 'meal' : 'coffee');
        setBreakStartTime(lastBreak.start);
        setBreakDuration(lastBreak.duration);
        setBreakLocation(lastBreak.location);
        setShowBreakModal(true);
      }
    }
  }, [activeShiftId, shifts]);

  const handleConfirmBreak = useCallback(async () => {
    const [h, m] = breakStartTime.split(':').map(Number);
    const startDate = new Date(currentTime);
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + breakDuration * 60000);
    setBreakStartDateTime(startDate);
    setBreakEndTimeActual(endDate);
    const endTimeStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (activeShiftId) {
      const newBreak: Break = {
        id: Math.random().toString(36).substr(2, 9),
        start: breakStartTime,
        end: endTimeStr,
        duration: breakDuration,
        location: breakType === 'meal' ? breakLocation : 'Entreprise',
        isMeal: breakType === 'meal'
      };
      
      setShifts(prev => prev.map(s => {
        if (s.id === activeShiftId) {
          const breaks = s.breaks || [];
          // Si on est déjà en pause, on modifie la dernière
          if (status === ServiceStatus.BREAK && breaks.length > 0) {
            const updatedBreaks = [...breaks];
            updatedBreaks[updatedBreaks.length - 1] = { 
              ...updatedBreaks[updatedBreaks.length - 1], 
              ...newBreak, 
              id: updatedBreaks[updatedBreaks.length - 1].id 
            };
            return { ...s, breaks: updatedBreaks };
          }
          return { ...s, breaks: [...breaks, newBreak] };
        }
        return s;
      }));
    }
    
    if (status !== ServiceStatus.BREAK) {
      console.log("Bouton cliqué: Passage en pause");
      setStatus(ServiceStatus.BREAK);
      addLog(breakType === 'meal' ? "Pause Déjeuner" : "Pause Café", "break");
      
      // Suggestion de restauration si c'est un repas à l'extérieur (EN ARRIÈRE-PLAN)
      if (breakType === 'meal' && breakLocation === 'Extérieur') {
        console.log("handleConfirmBreak: Lancement recherche resto en arrière-plan");
        sendMealNotification(); // Pas de await ici
      }
    } else {
      addLog(breakType === 'meal' ? "Modification Déjeuner" : "Modification Café", "break");
    }
    
    setShowBreakModal(false);
    setActiveTab('home'); // Redirection vers le Board
  }, [breakStartTime, breakDuration, breakLocation, breakType, currentTime, activeShiftId, addLog, status, sendMealNotification]);

  const handleLogout = useCallback(() => {
    setShowOnboarding(true);
    localStorage.removeItem('ambuflow_onboarded');
  }, []);

  const handleResetData = useCallback(() => {
    if (window.confirm("⚠️ ATTENTION : Cela effacera toutes vos données. Continuer ?")) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (scheduledShiftId) {
      const scheduledShift = shifts.find(s => s.id === scheduledShiftId);
      if (scheduledShift && scheduledShift.day && scheduledShift.start) {
        const [h, m] = scheduledShift.start.split(':').map(Number);
        const [y, mon, d] = scheduledShift.day.split('-').map(Number);
        const newNextAutoStart = new Date(y, mon - 1, d, h, m, 0, 0);
        if (nextAutoStart?.getTime() !== newNextAutoStart.getTime()) {
          setNextAutoStart(newNextAutoStart);
          addNotification("PLANIFICATION MISE À JOUR", `Prise de poste ajustée au ${d}/${mon.toString().padStart(2, '0')} à ${scheduledShift.start}`, "info");
        }
      } else {
        setNextAutoStart(null);
        setScheduledShiftId(null);
      }
    }
  }, [shifts, scheduledShiftId, nextAutoStart, addNotification]);

  useEffect(() => {
    const todayStr = getLocalDateString(currentTime);
    const todayShift = shifts.find(s => s.day === todayStr);
    const isTodayFinished = todayShift && todayShift.end !== '--:--';

    if (status === ServiceStatus.OFF && nextAutoStart && currentTime >= nextAutoStart) {
      if (isTodayFinished && getLocalDateString(nextAutoStart) === todayStr) {
        setNextAutoStart(null);
        setScheduledShiftId(null);
      } else {
        handleStartService(scheduledShiftId);
      }
    } else if (status !== ServiceStatus.OFF && nextAutoStart && currentTime >= nextAutoStart) {
      setNextAutoStart(null);
      setScheduledShiftId(null);
    }
  }, [currentTime, nextAutoStart, status, handleStartService, scheduledShiftId, shifts]);

  useEffect(() => {
    if (status === ServiceStatus.BREAK && breakEndTimeActual && currentTime >= breakEndTimeActual) {
      handleResume();
    }
  }, [currentTime, status, breakEndTimeActual, handleResume]);

  useEffect(() => {
    localStorage.setItem('ambuflow_status', status);
    localStorage.setItem('ambuflow_logs', JSON.stringify(logs));
    localStorage.setItem('ambuflow_shifts', JSON.stringify(shifts));
    localStorage.setItem('ambuflow_active_shift_id', activeShiftId || "");
    localStorage.setItem('ambuflow_scheduled_shift_id', scheduledShiftId || "");
    if (nextAutoStart) localStorage.setItem('ambuflow_next_autostart', nextAutoStart.toISOString());
    else localStorage.removeItem('ambuflow_next_autostart');
    
    if (breakStartDateTime) localStorage.setItem('ambuflow_break_start_datetime', breakStartDateTime.toISOString());
    else localStorage.removeItem('ambuflow_break_start_datetime');

    if (breakEndTimeActual) localStorage.setItem('ambuflow_break_end', breakEndTimeActual.toISOString());
    else localStorage.removeItem('ambuflow_break_end');

    localStorage.setItem('ambuflow_user_name', userName);
    localStorage.setItem('ambuflow_job_title', jobTitle);
    localStorage.setItem('ambuflow_hourly_rate', hourlyRate);
    localStorage.setItem('ambuflow_company_name', companyName);
    localStorage.setItem('ambuflow_user_stats', JSON.stringify(userStats));
    localStorage.setItem('ambuflow_has_dea', String(hasDea));
    localStorage.setItem('ambuflow_has_aux', String(hasAux));
    localStorage.setItem('ambuflow_has_taxi', String(hasTaxiCard));
    
    localStorage.setItem('ambuflow_primary_grad_date', primaryGraduationDate);
    localStorage.setItem('ambuflow_dea_date', deaDate);
    localStorage.setItem('ambuflow_aux_date', auxDate);
    localStorage.setItem('ambuflow_taxi_date', taxiDate);
    localStorage.setItem('ambuflow_taxi_card_expiry', taxiCardExpiryDate);
    localStorage.setItem('ambuflow_taxi_fpc_date', taxiFpcDate);
    localStorage.setItem('ambuflow_afgsu_date', afgsuDate);
    localStorage.setItem('ambuflow_medical_expiry', medicalExpiryDate);
    if (medicalExpiryDate) {
      try {
        const isoDate = new Date(medicalExpiryDate).toISOString();
        localStorage.setItem('date_aptitude_medicale', isoDate);
      } catch (e) {
        localStorage.setItem('date_aptitude_medicale', medicalExpiryDate);
      }
    } else {
      localStorage.removeItem('date_aptitude_medicale');
    }

    localStorage.setItem('ambuflow_contract_start', contractStartDate);
    localStorage.setItem('ambuflow_hours_base', hoursBase);
    localStorage.setItem('ambuflow_cp_mode', cpCalculationMode);
    localStorage.setItem('ambuflow_overtime_mode', overtimeMode);
    localStorage.setItem('ambuflow_modulation_start', modulationStartDate);
    localStorage.setItem('ambuflow_modulation_weeks', modulationWeeks);
    localStorage.setItem('ambuflow_initial_cp', initialCpBalance.toString());
    localStorage.setItem('ambuflow_push_enabled', String(pushEnabled));
    localStorage.setItem('ambuflow_autogeo', String(autoGeo));
    localStorage.setItem('ambuflow_follow_system_theme', String(followSystemTheme));
  }, [status, logs, activeShiftId, scheduledShiftId, shifts, nextAutoStart, breakStartDateTime, breakEndTimeActual, userName, jobTitle, hourlyRate, companyName, userStats, hasDea, hasAux, hasTaxiCard, primaryGraduationDate, deaDate, auxDate, taxiDate, taxiCardExpiryDate, taxiFpcDate, afgsuDate, medicalExpiryDate, contractStartDate, hoursBase, cpCalculationMode, overtimeMode, modulationStartDate, modulationWeeks, initialCpBalance, pushEnabled, autoGeo, followSystemTheme]);

  // Logique AFGSU
  const afgsuStatus = useMemo(() => {
    if (!afgsuDate) return null;
    const lastDate = new Date(afgsuDate);
    const expiryDate = new Date(lastDate);
    expiryDate.setFullYear(lastDate.getFullYear() + 4);
    
    const diffMs = expiryDate.getTime() - currentTime.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= 3) return 'warning';
    return 'valid';
  }, [afgsuDate, currentTime]);

  // Logique Aptitude Médicale
  const medicalStatus = useMemo(() => {
    if (!medicalExpiryDate) return null;
    const lastDate = new Date(medicalExpiryDate);
    const expiryDate = new Date(lastDate);
    expiryDate.setFullYear(lastDate.getFullYear() + 5);
    
    const diffMs = expiryDate.getTime() - currentTime.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= 3) return 'warning';
    return 'valid';
  }, [medicalExpiryDate, currentTime]);

  // Logique Taxi Card
  const taxiCardStatus = useMemo(() => {
    if (!hasTaxiCard || !taxiCardExpiryDate) return null;
    const expiryDate = new Date(taxiCardExpiryDate);
    const diffMs = expiryDate.getTime() - currentTime.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= 3) return 'warning';
    return 'valid';
  }, [hasTaxiCard, taxiCardExpiryDate, currentTime]);

  // Logique Taxi FPC (5 ans)
  const taxiFpcStatus = useMemo(() => {
    if (!hasTaxiCard || !taxiFpcDate) return null;
    const lastDate = new Date(taxiFpcDate);
    const expiryDate = new Date(lastDate);
    expiryDate.setFullYear(lastDate.getFullYear() + 5);
    const diffMs = expiryDate.getTime() - currentTime.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= 3) return 'warning';
    return 'valid';
  }, [hasTaxiCard, taxiFpcDate, currentTime]);

  const leaveBalances = useMemo(() => {
    let usedCp = 0;
    
    shifts.forEach(s => {
      if (s.isLeave || s.vehicle === 'CONGÉ') {
        if (s.leaveType === 'CP') usedCp += 1;
      }
    });
    
    return {
      cp: Math.max(0, initialCpBalance - usedCp),
      usedCp
    };
  }, [shifts, initialCpBalance]);

  const getDuration = () => {
    const activeShift = shifts.find(s => s.id === activeShiftId);
    if (!activeShift || !activeShift.start || activeShift.start === '--:--') return "00:00:00";
    const [y, mon, d] = activeShift.day.split('-').map(Number);
    const [startH, startM] = activeShift.start.split(':').map(Number);
    const startDate = new Date(y, mon - 1, d, startH, startM, 0, 0);
    let effectiveNow = (status === ServiceStatus.BREAK && activeShift.breaks?.length) 
        ? new Date(y, mon - 1, d, parseInt(activeShift.breaks[activeShift.breaks.length-1].start.split(':')[0]), parseInt(activeShift.breaks[activeShift.breaks.length-1].start.split(':')[1]))
        : currentTime;
    let diffMs = effectiveNow.getTime() - startDate.getTime();
    if (diffMs < 0) return "00:00:00";
    if (activeShift.breaks) activeShift.breaks.forEach(b => { 
      if (b.end !== '--:--' || (status === ServiceStatus.BREAK && b.id === activeShift.breaks?.[activeShift.breaks.length-1].id)) {
        diffMs -= (b.duration * 60000); 
      }
    });
    const h = Math.floor(Math.max(0, diffMs) / 3600000);
    const m = Math.floor((Math.max(0, diffMs) % 3600000) / 60000);
    const s = Math.floor((Math.max(0, diffMs) % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateEffectiveMinutes = useCallback((shift: Shift) => {
    if (shift.start === '--:--') return 0;
    const [h1, m1] = shift.start.split(':').map(Number);
    let endH, endM;
    if (shift.end !== '--:--') {
      [endH, endM] = shift.end.split(':').map(Number);
    } else if (shift.id === activeShiftId) {
      endH = currentTime.getHours();
      endM = currentTime.getMinutes();
    } else {
      return 0;
    }
    let amp = (endH * 60 + endM) - (h1 * 60 + m1);
    if (amp < 0) amp += 1440;
    let eff = amp;
    if (shift.breaks) shift.breaks.forEach(b => { eff -= b.duration; });
    return Math.max(0, eff);
  }, [activeShiftId, currentTime]);

  const periodStats = useMemo(() => {
    let totalMin = 0;
    let targetMin = (parseInt(hoursBase) || 35) * 60;
    let title = "Semaine";
    let icon = CalendarRange;
    let subtitle = "Période active";
    let color = "indigo";
    let extraData: any = null;

    if (overtimeMode === 'weekly') {
      const monday = new Date(currentTime);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      shifts.forEach(s => {
        const d = new Date(s.day);
        if (d >= monday) totalMin += calculateEffectiveMinutes(s);
      });
      title = "Heures Semaine";
      subtitle = "Objectif 35h/39h";
      icon = CalendarRange;
      targetMin = (parseInt(hoursBase) || 35) * 60;
    } else if (overtimeMode === 'fortnightly') {
      const anchor = contractStartDate ? new Date(contractStartDate) : new Date(2024, 0, 1);
      const diffDays = Math.floor((currentTime.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
      const startOfCycle = new Date(anchor);
      startOfCycle.setDate(anchor.getDate() + Math.floor(diffDays / 14) * 14);
      startOfCycle.setHours(0, 0, 0, 0);
      shifts.forEach(s => {
        const d = new Date(s.day);
        if (d >= startOfCycle) totalMin += calculateEffectiveMinutes(s);
      });
      title = "Heures Quatorzaine";
      subtitle = "Cycle de 14 jours";
      icon = Layers;
      color = "violet";
      targetMin = (parseInt(hoursBase) || 35) * 2 * 60;
    } else if (overtimeMode === 'modulation') {
      const start = modulationStartDate ? new Date(modulationStartDate) : new Date();
      const weeks = parseInt(modulationWeeks) || 4;
      const end = new Date(start);
      end.setDate(start.getDate() + (weeks * 7));
      shifts.forEach(s => {
        const d = new Date(s.day);
        if (d >= start && d <= end) totalMin += calculateEffectiveMinutes(s);
      });
      targetMin = (parseInt(hoursBase) || 35) * weeks * 60;
      const remainingMin = Math.max(0, targetMin - totalMin);
      const timeRemainingMs = end.getTime() - currentTime.getTime();
      const daysLeft = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      extraData = {
        targetHours: targetMin / 60,
        performedHours: Math.floor(totalMin / 60),
        performedMins: totalMin % 60,
        remainingHours: Math.floor(remainingMin / 60),
        remainingMins: remainingMin % 60,
        countdown: `${daysLeft}j ${hoursLeft}h`,
        progress: Math.min(100, (totalMin / targetMin) * 100)
      };
      title = "Modulation";
      subtitle = `${weeks} semaines`;
      icon = RefreshCw;
      color = "emerald";
    } else if (overtimeMode === 'annualization') {
      const start = new Date(currentTime.getFullYear(), 0, 1);
      shifts.forEach(s => {
        const d = new Date(s.day);
        if (d >= start) totalMin += calculateEffectiveMinutes(s);
      });
      title = "Compteur Annuel";
      subtitle = "Objectif 1607h";
      icon = Calendar;
      color = "amber";
      targetMin = 1607 * 60;
    }
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const progress = Math.min(100, (totalMin / targetMin) * 100);
    return { title, subtitle, icon, value: `${h}h ${m}m`, color, extraData, progress };
  }, [shifts, overtimeMode, calculateEffectiveMinutes, currentTime, contractStartDate, modulationStartDate, modulationWeeks, hoursBase]);

  const todayStats = useMemo(() => {
    const todayStr = getLocalDateString(currentTime);
    const todayShifts = shifts.filter(s => s.day === todayStr);
    let totalAmplitudeMin = 0;
    let totalEffectiveMin = 0;
    let totalGainsBrut = 0;

    // Nouvelles indemnités
    const IND_REPAS = 15.54;
    const IND_REPAS_UNIQUE = 9.59;
    const IND_SPECIALE = 4.34;
    const IND_DIMANCHE_FERIE = 23.90;

    todayShifts.forEach(s => {
      if (s.isLeave || s.vehicle === 'CONGÉ') return; // Pas de gains ni d'amplitude pour les congés
      
      if (s.start !== '--:--') {
        const [h1, m1] = s.start.split(':').map(Number);
        let endH, endM;
        if (s.end !== '--:--') {
          [endH, endM] = s.end.split(':').map(Number);
        } else if (s.id === activeShiftId) {
          endH = currentTime.getHours();
          endM = currentTime.getMinutes();
        } else {
          return;
        }

        const startMin = h1 * 60 + m1;
        const endMin = endH * 60 + endM;
        let amp = endMin - startMin;
        if (amp < 0) amp += 1440;
        totalAmplitudeMin += amp;
        
        const effective = calculateEffectiveMinutes(s);
        totalEffectiveMin += effective;

        // Calcul des indemnités
        let currentAllowances = 0;
        const hasExternalBreak = s.breaks?.some(b => b.location === 'Extérieur');

        // 1. Indemnité de repas (15.54€)
        if (startMin <= 660 && endMin >= 870 && hasExternalBreak) {
          currentAllowances += IND_REPAS;
        }

        // 2. Indemnité de repas unique (9.59€)
        const sStart = startMin;
        const sEnd = endMin < startMin ? endMin + 1440 : endMin;
        const overlapStart = Math.max(sStart, 1320);
        const overlapEnd = Math.min(sEnd, 1860);
        if (overlapEnd - overlapStart >= 240) {
          currentAllowances += IND_REPAS_UNIQUE;
        }

        // 3. Indemnité spéciale (4.34€)
        if (hasExternalBreak && (startMin < 300 || endMin > 1260)) {
          currentAllowances += IND_SPECIALE;
        }

        // 4. Indemnité Dimanche & Férié (23.90€ brut)
        if (isSundayOrHoliday(s.day)) {
          currentAllowances += IND_DIMANCHE_FERIE;
        }

        totalGainsBrut += currentAllowances;
      }
    });

    const hourly = parseFloat(effectiveHourlyRate) || 12.79;
    totalGainsBrut += (totalEffectiveMin / 60) * hourly;
    
    return {
      amplitude: `${Math.floor(totalAmplitudeMin / 60).toString().padStart(2, '0')}:${(totalAmplitudeMin % 60).toString().padStart(2, '0')}`,
      gains: totalGainsBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      effective: totalEffectiveMin
    };
  }, [shifts, currentTime, activeShiftId, effectiveHourlyRate, calculateEffectiveMinutes]);

  const gainsCarouselStats = useMemo(() => {
    const calculateGainsForPeriod = (start: Date, end: Date) => {
      let total = 0;
      const periodShifts = shifts.filter(s => {
        const d = new Date(s.day);
        return d >= start && d < end;
      });

      const IND_REPAS = 15.54;
      const IND_REPAS_UNIQUE = 9.59;
      const IND_SPECIALE = 4.34;
      const IND_DIMANCHE_FERIE = 23.90;

      periodShifts.forEach(s => {
        if (s.isLeave || s.vehicle === 'CONGÉ') return;
        if (s.start !== '--:--') {
          const [h1, m1] = s.start.split(':').map(Number);
          let endH, endM;
          if (s.end !== '--:--') {
            [endH, endM] = s.end.split(':').map(Number);
          } else if (s.id === activeShiftId) {
            endH = currentTime.getHours();
            endM = currentTime.getMinutes();
          } else {
            return;
          }

          const startMin = h1 * 60 + m1;
          const endMin = endH * 60 + endM;
          
          const effective = calculateEffectiveMinutes(s);
          const hourly = parseFloat(effectiveHourlyRate) || 12.79;
          total += (effective / 60) * hourly;

          // Indemnités
          const hasExternalBreak = s.breaks?.some(b => b.location === 'Extérieur');
          if (startMin <= 660 && (endMin >= 870 || endMin < startMin) && hasExternalBreak) total += IND_REPAS;
          
          const sStart = startMin;
          const sEnd = endMin < startMin ? endMin + 1440 : endMin;
          const overlapStart = Math.max(sStart, 1320);
          const overlapEnd = Math.min(sEnd, 1860);
          if (overlapEnd - overlapStart >= 240) total += IND_REPAS_UNIQUE;

          if (hasExternalBreak && (startMin < 300 || (endMin > 1260 && endMin <= 1440))) total += IND_SPECIALE;
          if (isSundayOrHoliday(s.day)) total += IND_DIMANCHE_FERIE;
        }
      });
      return total;
    };

    // Current Day
    const today = new Date(currentTime);
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const currentDayGains = calculateGainsForPeriod(today, tomorrow);

    // Current Week (Monday to Sunday)
    const monday = new Date(currentTime);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0,0,0,0);
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    const currentWeekGains = calculateGainsForPeriod(monday, nextMonday);

    // Previous Week
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevWeekGains = calculateGainsForPeriod(prevMonday, monday);

    // Current Month
    const firstDayMonth = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
    const firstDayNextMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 1);
    const currentMonthGains = calculateGainsForPeriod(firstDayMonth, firstDayNextMonth);

    // Previous Month
    const firstDayPrevMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() - 1, 1);
    const prevMonthGains = calculateGainsForPeriod(firstDayPrevMonth, firstDayMonth);

    const getTrend = (curr: number, prev: number) => {
      const c = Math.round(curr);
      const p = Math.round(prev);
      if (c > p) return 'up';
      if (c < p) return 'down';
      return 'equal';
    };

    return [
      { label: 'Gains Estimés', value: currentDayGains, trend: 'up' },
      { label: 'Gains Semaine', value: currentWeekGains, trend: getTrend(currentWeekGains, prevWeekGains) },
      { label: 'Gains Mois', value: currentMonthGains, trend: getTrend(currentMonthGains, prevMonthGains) }
    ];
  }, [shifts, currentTime, activeShiftId, effectiveHourlyRate, calculateEffectiveMinutes]);

  const vehicleDistribution = useMemo(() => {
    let assuMin = 0;
    let ambuMin = 0;
    let vslMin = 0;
    
    // Get shifts for the current period based on overtimeMode
    let periodShifts = shifts;
    if (overtimeMode === 'weekly') {
      const monday = new Date(currentTime);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      periodShifts = shifts.filter(s => new Date(s.day) >= monday);
    } else if (overtimeMode === 'fortnightly') {
      const anchor = contractStartDate ? new Date(contractStartDate) : new Date(2024, 0, 1);
      const diffDays = Math.floor((currentTime.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
      const startOfCycle = new Date(anchor);
      startOfCycle.setDate(anchor.getDate() + Math.floor(diffDays / 14) * 14);
      startOfCycle.setHours(0, 0, 0, 0);
      periodShifts = shifts.filter(s => new Date(s.day) >= startOfCycle);
    } else if (overtimeMode === 'modulation') {
      const start = modulationStartDate ? new Date(modulationStartDate) : new Date();
      const weeks = parseInt(modulationWeeks) || 4;
      const end = new Date(start);
      end.setDate(start.getDate() + (weeks * 7));
      periodShifts = shifts.filter(s => {
        const d = new Date(s.day);
        return d >= start && d <= end;
      });
    } else if (overtimeMode === 'annualization') {
      const start = new Date(currentTime.getFullYear(), 0, 1);
      periodShifts = shifts.filter(s => new Date(s.day) >= start);
    }

    periodShifts.forEach(s => {
      if (s.isLeave || s.vehicle === 'CONGÉ') return;
      const min = calculateEffectiveMinutes(s);
      if (s.vehicle.includes('ASSU')) assuMin += min;
      else if (s.vehicle.includes('VSL')) vslMin += min;
      else ambuMin += min;
    });
    
    const total = assuMin + ambuMin + vslMin;
    const pAssu = total > 0 ? (assuMin / total) * 100 : 0;
    const pAmbu = total > 0 ? (ambuMin / total) * 100 : 0;
    const pVsl = total > 0 ? (vslMin / total) * 100 : 0;
    const gradient = total > 0 
      ? `conic-gradient(#FF4B5C 0% ${pAssu}%, #10b981 ${pAssu}% ${pAssu + pAmbu}%, #6366f1 ${pAssu + pAmbu}% 100%)`
      : `conic-gradient(#e2e8f0 0% 100%)`;
    return { assu: pAssu.toFixed(0), ambu: pAmbu.toFixed(0), vsl: pVsl.toFixed(0), gradient, hasData: total > 0 };
  }, [shifts, calculateEffectiveMinutes, overtimeMode, currentTime, contractStartDate, modulationStartDate, modulationWeeks]);

  const getNextShiftCountdown = () => {
    if (!nextAutoStart) return null;
    const diff = nextAutoStart.getTime() - currentTime.getTime();
    if (diff <= 0) return "Arrivé";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days > 0 ? `J-${days} ` : ''}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const refreshMealSuggestion = useCallback(() => {
    if (activeShiftId) {
      const activeShift = shifts.find(s => s.id === activeShiftId);
      if (activeShift) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const suggestion = await getRestaurantSuggestion(
            activeShift.vehicle,
            pos.coords.latitude,
            pos.coords.longitude
          );
          if (suggestion) {
            setMealSuggestion(suggestion);
          }
        });
      }
    }
  }, [activeShiftId, shifts]);

  const renderHome = () => {
    const bentoCardBase = `relative overflow-hidden transition-all duration-500 rounded-[32px] border ${effectiveDarkMode ? 'bg-slate-900/60 border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'} backdrop-blur-xl`;
    const nextCountdown = getNextShiftCountdown();
    const todayStr = getLocalDateString(currentTime);
    const todayShift = shifts.find(s => s.day === todayStr);
    const isTodayFinished = todayShift && todayShift.end !== '--:--';
    const PeriodIcon = periodStats.icon;
    
    const isBreakActive = status === ServiceStatus.BREAK && (!breakStartDateTime || currentTime >= breakStartDateTime);
    
    let breakBackgroundImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'; 
    let breakLabel = "COUPURE";
    
    if (isBreakActive && activeShiftId) {
      const activeShift = shifts.find(s => s.id === activeShiftId);
      const lastBreak = activeShift?.breaks?.[activeShift.breaks.length - 1];
      
      if (lastBreak?.isMeal) {
        breakLabel = "COUPURE REPAS";
        if (lastBreak.location === 'Entreprise') {
          breakBackgroundImage = 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&q=80&w=800';
        } else {
          breakBackgroundImage = 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=800';
        }
      } else {
        breakLabel = "PAUSE CAFÉ";
        breakBackgroundImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800';
      }
    }

    return (
      <div className="p-5 space-y-5 animate-fadeIn pb-32">
        {afgsuStatus && afgsuStatus !== 'valid' && (
          <div className={`p-4 rounded-[24px] border flex items-center gap-4 animate-slideUp ${
            afgsuStatus === 'expired' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse-border' 
              : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
          }`}>
            <div className={`p-3 rounded-xl ${afgsuStatus === 'expired' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Alerte AFGSU 2</p>
              <p className="text-sm font-black">
                {afgsuStatus === 'expired' ? 'VOTRE AFGSU 2 EST EXPIRÉ !' : 'AFGSU 2 arrive à expiration bientôt'}
              </p>
            </div>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              afgsuStatus === 'expired' ? 'border-rose-500/50 hover:bg-rose-500 hover:text-white' : 'border-orange-500/50 hover:bg-orange-500 hover:text-white'
            }`}>Gérer</button>
          </div>
        )}

        {medicalStatus && medicalStatus !== 'valid' && (
          <div className={`p-4 rounded-[24px] border flex items-center gap-4 animate-slideUp ${
            medicalStatus === 'expired' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse-border' 
              : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
          }`}>
            <div className={`p-3 rounded-xl ${medicalStatus === 'expired' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>
              <ShieldAlert size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Aptitude Préfectorale</p>
              <p className="text-sm font-black">
                {medicalStatus === 'expired' ? '🔴 CONDUITE INTERDITE : Aptitude périmée' : 'Prendre RDV Médecin Agréé (Aptitude)'}
              </p>
            </div>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              medicalStatus === 'expired' ? 'border-rose-500/50 hover:bg-rose-500 hover:text-white' : 'border-orange-500/50 hover:bg-orange-500 hover:text-white'
            }`}>Gérer</button>
          </div>
        )}

        {taxiCardStatus && taxiCardStatus !== 'valid' && (
          <div className={`p-4 rounded-[24px] border flex items-center gap-4 animate-slideUp ${
            taxiCardStatus === 'expired' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse-border' 
              : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
          }`}>
            <div className={`p-3 rounded-xl ${taxiCardStatus === 'expired' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>
              <Car size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Carte Pro Taxi</p>
              <p className="text-sm font-black">
                {taxiCardStatus === 'expired' ? '🔴 CARTE TAXI PÉRIMÉE' : 'La Carte Taxi expire bientôt'}
              </p>
            </div>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              taxiCardStatus === 'expired' ? 'border-rose-500/50 hover:bg-rose-500 hover:text-white' : 'border-orange-500/50 hover:bg-orange-500 hover:text-white'
            }`}>Gérer</button>
          </div>
        )}

        {taxiFpcStatus && taxiFpcStatus !== 'valid' && (
          <div className={`p-4 rounded-[24px] border flex items-center gap-4 animate-slideUp ${
            taxiFpcStatus === 'expired' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse-border' 
              : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
          }`}>
            <div className={`p-3 rounded-xl ${taxiFpcStatus === 'expired' ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'}`}>
              <RefreshCw size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Formation Taxi (FPC)</p>
              <p className="text-sm font-black">
                {taxiFpcStatus === 'expired' ? '🔴 FPC TAXI EXPIRÉE' : 'Recyclage FPC Taxi nécessaire'}
              </p>
            </div>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              taxiFpcStatus === 'expired' ? 'border-rose-500/50 hover:bg-rose-500 hover:text-white' : 'border-orange-500/50 hover:bg-orange-500 hover:text-white'
            }`}>Gérer</button>
          </div>
        )}

        {nextAutoStart && scheduledShiftId && (
          <div className="flex justify-center animate-slideUp">
            <div className={`px-4 py-2.5 rounded-full border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all ${effectiveDarkMode ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Prise de poste :</span>
                <span className="text-xs font-black tabular-nums">{nextCountdown}</span>
              </div>
              <button onClick={() => { setNextAutoStart(null); setScheduledShiftId(null); }} className={`p-1 rounded-full transition-colors ${effectiveDarkMode ? 'hover:bg-white/10' : 'hover:bg-indigo-100'}`}><X size={12} /></button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div 
            className={`${bentoCardBase} col-span-2 p-8 flex flex-col justify-between min-h-[340px] ${status === ServiceStatus.WORKING ? 'bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-indigo-500/20' : (isBreakActive ? 'text-white' : (status === ServiceStatus.BREAK ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' : (isTodayFinished ? 'bg-gradient-to-br from-emerald-600 to-emerald-900 text-white shadow-emerald-500/20' : '')))}`}
            style={isBreakActive ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("${breakBackgroundImage}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">
                  {status === ServiceStatus.OFF 
                    ? (isTodayFinished ? 'Journée Terminée' : 'Disponibilité') 
                    : status === ServiceStatus.WORKING 
                      ? 'Mission Active' 
                      : breakLabel}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${status === ServiceStatus.WORKING ? 'bg-emerald-400 animate-pulse' : status === ServiceStatus.BREAK ? 'bg-white animate-pulse' : isTodayFinished ? 'bg-emerald-300' : 'bg-slate-500'}`} />
                  <h2 className="text-2xl font-black tracking-tight">{status === ServiceStatus.OFF ? (isTodayFinished ? 'Mission Validée' : 'En attente') : status === ServiceStatus.WORKING ? 'En Service' : 'Coupure en cours'}</h2>
                </div>
              </div>
            </div>
            <div className="py-6">
              <div className="animate-fadeIn">
                 <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2">
                   {status === ServiceStatus.BREAK 
                     ? (breakStartDateTime && currentTime < breakStartDateTime ? 'Début dans' : 'Temps restant') 
                     : (status === ServiceStatus.OFF ? (isTodayFinished ? 'Total Travaillé' : 'Heure actuelle') : 'Compteur journalier')}
                 </p>
                 <h1 className="text-7xl font-black tabular-nums tracking-tighter leading-none drop-shadow-2xl">
                   {status === ServiceStatus.BREAK ? (() => { 
                     if (breakStartDateTime && currentTime < breakStartDateTime) {
                       const diff = breakStartDateTime.getTime() - currentTime.getTime();
                       const m = Math.floor(diff / 60000);
                       const s = Math.floor((diff % 60000) / 1000);
                       return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                     }
                     if (!breakEndTimeActual) return "00:00"; 
                     const diff = breakEndTimeActual.getTime() - currentTime.getTime(); 
                     if (diff <= 0) return "00:00"; 
                     const m = Math.floor(diff / 60000); 
                     const s = Math.floor((diff % 60000) / 1000); 
                     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; 
                   })() : status === ServiceStatus.OFF ? (isTodayFinished ? (() => {
                     const [h1, m1] = todayShift!.start.split(':').map(Number);
                     const [h2, m2] = todayShift!.end.split(':').map(Number);
                     let dur = (h2 * 60 + m2) - (h1 * 60 + m1);
                     if (dur < 0) dur += 1440;
                     if (todayShift!.breaks) todayShift!.breaks.forEach(b => dur -= b.duration);
                     const h = Math.floor(dur / 60);
                     const m = dur % 60;
                     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                   })() : currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })) : getDuration()}
                 </h1>
              </div>
            </div>
            <div className="space-y-3">
              {status === ServiceStatus.OFF ? (
                isTodayFinished ? (
                  <div className="flex gap-3">
                    <button onClick={() => setActiveTab('planning')} className="flex-1 py-5 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"><History size={16} /> Voir Agenda</button>
                    <button onClick={() => handleStartService()} className="flex-[2] py-5 rounded-[24px] bg-white text-emerald-600 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"><Play size={18} fill="currentColor" /> Nouvelle Mission</button>
                  </div>
                ) : (
                  <button onClick={() => handleStartService()} className="w-full py-6 rounded-[28px] bg-indigo-600 text-white shadow-2xl font-black text-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-400/50"><Play size={24} fill="currentColor" /> DÉBUTER</button>
                )
              ) : status === ServiceStatus.WORKING ? (
                <>
                  <div className="grid grid-cols-2 gap-3 animate-slideUp">
                    <button onClick={() => handleOpenBreakModal('meal')} className="py-4 rounded-[24px] bg-white/10 border border-white/20 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"><Utensils size={16} /> Déjeuner</button>
                    <button onClick={() => handleOpenBreakModal('coffee')} className="py-4 rounded-[24px] bg-white/10 border border-white/20 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"><Coffee size={16} /> Café</button>
                  </div>
                  <button onClick={handleEndService} className="w-full py-5 rounded-[24px] bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-100 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut size={16} /> Finir</button>
                </>
              ) : (
                <div className="space-y-3">
                  {isSearchingResto && (
                    <div className="p-4 rounded-[24px] bg-white/5 border border-white/10 flex items-center gap-3 animate-pulse">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Recherche resto en cours...</p>
                    </div>
                  )}
                  {mealSuggestion && (
                    <div className="p-4 rounded-[24px] bg-indigo-600 border border-indigo-400 text-white animate-popIn shadow-lg shadow-indigo-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Utensils size={16} />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">🍴 Resto trouvé à {mealSuggestion.distanceMinutes} min !</p>
                            <h4 className="text-sm font-black tracking-tight">{mealSuggestion.name}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-white text-[8px] font-black">
                          <Star size={8} fill="currentColor" /> {mealSuggestion.rating}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[9px] font-bold opacity-80">Ouvrir dans Waze/Maps ?</p>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mealSuggestion.latitude},${mealSuggestion.longitude}`, '_blank')}
                            className="px-3 py-1.5 rounded-lg bg-white text-indigo-600 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                          >
                            Maps
                          </button>
                          <button 
                            onClick={() => window.open(`https://waze.com/ul?ll=${mealSuggestion.latitude},${mealSuggestion.longitude}&navigate=yes`, '_blank')}
                            className="px-3 py-1.5 rounded-lg bg-white text-indigo-600 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                          >
                            Waze
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 animate-slideUp">
                    <button onClick={handleModifyBreak} className="flex-1 py-5 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">MODIFIER</button>
                    <button onClick={handleResume} className="flex-[2] py-5 rounded-[24px] bg-white text-amber-600 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"><Zap size={18} fill="currentColor" /> Reprendre</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={`${bentoCardBase} col-span-2 min-h-[160px] flex flex-col group`}>
             <div className="flex-1 p-6 relative flex flex-col justify-between">
                {overtimeMode === 'modulation' && periodStats.extraData ? (
                  carouselIndex === 0 ? (
                    <div className="flex items-center justify-between animate-fadeIn">
                       <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-[24px] bg-indigo-500/10 text-indigo-500`}>
                             <Hourglass size={28} className="animate-pulse" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Fin de Modulation</p>
                             <p className="text-2xl font-black tracking-tight tabular-nums">{periodStats.extraData.countdown}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Temps restant</p>
                          </div>
                       </div>
                       <button onClick={() => setCarouselIndex(1)} className="p-3 bg-slate-500/5 rounded-2xl hover:bg-slate-500/10 transition-colors">
                          <ChevronRight size={20} className="text-slate-400" />
                       </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between animate-fadeIn">
                       <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-[24px] bg-emerald-500/10 text-emerald-500`}>
                             <PieChart size={28} />
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contrat: {periodStats.extraData.targetHours}h</span>
                             </div>
                             <div className="flex gap-4">
                                <div>
                                   <p className="text-xl font-black tracking-tight">{periodStats.extraData.performedHours}h {periodStats.extraData.performedMins}m</p>
                                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">EFFECTUÉ</p>
                                </div>
                                <div className="w-px h-6 bg-slate-500/10 self-center" />
                                <div>
                                   <p className="text-xl font-black tracking-tight text-slate-400">{periodStats.extraData.remainingHours}h {periodStats.extraData.remainingMins}m</p>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RESTE</p>
                                </div>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => setCarouselIndex(0)} className="p-3 bg-slate-500/5 rounded-2xl hover:bg-slate-500/10 transition-colors">
                          <ChevronLeft size={20} className="text-slate-400" />
                       </button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-between animate-fadeIn">
                     <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-[24px] bg-${periodStats.color}-500/10 text-${periodStats.color}-500`}>
                           <PeriodIcon size={28} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{periodStats.title}</p>
                           <p className="text-2xl font-black tracking-tight">{periodStats.value}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{periodStats.subtitle}</p>
                        </div>
                     </div>
                     <button onClick={() => setActiveTab('paie')} className="p-3 bg-slate-500/5 rounded-2xl hover:bg-slate-500/10 transition-colors">
                        <ChevronRight size={20} className="text-slate-400" />
                     </button>
                  </div>
                )}
                <div className="mt-6 space-y-2">
                   <div className="relative h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                         {[...Array(7)].map((_, i) => (
                            <div key={i} className="h-full w-px bg-black/10 dark:bg-white/10" />
                         ))}
                      </div>
                      <div className={`h-full bg-${periodStats.color}-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]`} style={{ width: `${periodStats.progress}%` }} />
                   </div>
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Début</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest text-${periodStats.color}-500`}>
                        {periodStats.progress.toFixed(0)}% de l'objectif
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Objectif</span>
                   </div>
                </div>
             </div>
             {overtimeMode === 'modulation' && (
                <div className="pb-4 flex justify-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === 0 ? 'bg-indigo-500 w-4' : 'bg-slate-500/30'}`} />
                   <div className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === 1 ? 'bg-emerald-500 w-4' : 'bg-slate-500/30'}`} />
                </div>
             )}
          </div>
          <div className={`${bentoCardBase} p-6 flex flex-col justify-between aspect-square overflow-hidden relative group`}>
             <AnimatePresence mode="wait">
               <motion.div 
                 key={gainsCarouselIndex}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="h-full flex flex-col justify-between"
                 drag="x"
                 dragConstraints={{ left: 0, right: 0 }}
                 onDragEnd={(_e, { offset }) => {
                   const swipe = offset.x;
                   if (swipe < -50) setGainsCarouselIndex((gainsCarouselIndex + 1) % 3);
                   else if (swipe > 50) setGainsCarouselIndex((gainsCarouselIndex + 2) % 3);
                 }}
               >
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${
                      gainsCarouselStats[gainsCarouselIndex].trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' :
                      gainsCarouselStats[gainsCarouselIndex].trend === 'down' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {gainsCarouselStats[gainsCarouselIndex].trend === 'up' ? <ArrowUp size={20} /> :
                       gainsCarouselStats[gainsCarouselIndex].trend === 'down' ? <ArrowDown size={20} /> :
                       <Minus size={20} />}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2].map(i => (
                        <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === gainsCarouselIndex ? 'bg-indigo-500 w-3' : 'bg-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                      {gainsCarouselStats[gainsCarouselIndex].label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tighter">
                        {gainsCarouselStats[gainsCarouselIndex].value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-bold text-slate-400">€</span>
                    </div>
                  </div>
               </motion.div>
             </AnimatePresence>
          </div>
          <div className={`${bentoCardBase} p-6 flex flex-col justify-between aspect-square`}><div className="flex justify-between"><div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><TimerIcon size={20} /></div><div className={`w-1.5 h-1.5 rounded-full bg-indigo-500 ${status === ServiceStatus.WORKING ? 'animate-pulse' : ''}`} /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Amplitude</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black tracking-tighter">{todayStats.amplitude}</span></div></div></div>
          
          <div className={`${bentoCardBase} col-span-2 p-6 animate-slideUp`}>
            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-slate-500/5 text-slate-400"><Car size={18} /></div><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Répartition Véhicules</h3></div></div>
            <div className="flex items-center gap-10">
              <div className="relative w-28 h-28 flex-shrink-0"><div className="w-full h-full rounded-full transition-all duration-1000 shadow-xl" style={{ background: vehicleDistribution.gradient }} /><div className={`absolute inset-3 rounded-full flex items-center justify-center ${effectiveDarkMode ? 'bg-slate-900 shadow-inner shadow-black/60' : 'bg-white shadow-inner shadow-slate-200'}`}><Car size={20} className="text-slate-300 opacity-40" /></div></div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#FF4B5C]" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ASSU</span></div><span className="text-xs font-black tabular-nums">{vehicleDistribution.assu}%</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AMBU</span></div><span className="text-xs font-black tabular-nums">{vehicleDistribution.ambu}%</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">VSL</span></div><span className="text-xs font-black tabular-nums">{vehicleDistribution.vsl}%</span></div>
              </div>
            </div>
          </div>

          {/* COMPTEURS DE SOLDES */}
          <div className={`${bentoCardBase} col-span-2 p-6`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Calendar size={18} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Solde Congés Payés</h3>
              </div>
              <button onClick={() => setActiveTab('profile')} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Ajuster</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Congés (CP)</span>
                <span className="text-sm font-black text-emerald-500">{leaveBalances.cp.toFixed(2)} j</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (leaveBalances.cp / (initialCpBalance || 25)) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

        </div>
        {showBreakModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fadeIn">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setShowBreakModal(false)} />
            <div className={`relative w-full max-w-sm rounded-[48px] p-8 shadow-2xl animate-popIn border ${effectiveDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-[22px] shadow-lg ${breakType === 'meal' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {breakType === 'meal' ? <Utensils size={28} /> : <Coffee size={28} />}
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">
                    {breakType === 'meal' ? 'Pause Repas' : 'Pause Café'}
                  </h3>
                </div>
                <button onClick={() => setShowBreakModal(false)} className={`p-4 rounded-2xl transition-all ${effectiveDarkMode ? 'bg-slate-500/10 hover:bg-slate-500/20' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block px-1">Début de pause</label>
                  <div className="relative group">
                    <input 
                      type="time" 
                      className={`w-full p-5 rounded-[22px] border-2 font-black text-xl outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${
                        effectiveDarkMode 
                          ? 'bg-slate-800 border-white/5 text-white' 
                          : 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white'
                      }`}
                      value={breakStartTime} 
                      onChange={(e) => setBreakStartTime(e.target.value)} 
                    />
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block">Durée</label>
                    <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.1em]">{breakDuration} MIN</span>
                  </div>
                  <div className="relative pt-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="120" 
                      step="1" 
                      className="w-full h-2.5 bg-indigo-500/10 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                      value={breakDuration} 
                      onChange={(e) => setBreakDuration(parseInt(e.target.value))} 
                    />
                    <div className="flex justify-between mt-2 text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-40">
                      <span>1m</span>
                      <span>60m</span>
                      <span>120m</span>
                    </div>
                  </div>
                </div>

                {breakType === 'meal' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block px-1">Lieu de la pause</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setBreakLocation('Entreprise')}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                          breakLocation === 'Entreprise' 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                            : (effectiveDarkMode ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200')
                        }`}
                      >
                        <Building2 size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Entreprise</span>
                      </button>
                      <button 
                        onClick={() => setBreakLocation('Extérieur')}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                          breakLocation === 'Extérieur' 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                            : (effectiveDarkMode ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200')
                        }`}
                      >
                        <MapPin size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Extérieur</span>
                      </button>
                    </div>
                  </div>
                )}

                {isSearchingResto && (
                  <div className="flex flex-col items-center gap-3 py-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Recherche d'un resto...</p>
                  </div>
                )}

                {mealSuggestion && breakLocation === 'Extérieur' && (
                  <div className="p-5 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 space-y-4 animate-popIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                        <Utensils size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">{mealSuggestion.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mealSuggestion.distanceMinutes} min • {mealSuggestion.address}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mealSuggestion.latitude},${mealSuggestion.longitude}`, '_blank')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Google Maps
                      </button>
                      <button 
                        onClick={() => window.open(`https://waze.com/ul?ll=${mealSuggestion.latitude},${mealSuggestion.longitude}&navigate=yes`, '_blank')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Waze
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleConfirmBreak} 
                  disabled={isSearchingResto}
                  className="w-full py-6 rounded-[28px] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-400/50 disabled:opacity-50"
                >
                  <CheckCircle size={24} strokeWidth={3} /> {mealSuggestion && breakLocation === 'Extérieur' ? 'TERMINER' : 'CONFIRMER'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans pb-28 flex flex-col relative ${effectiveDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <style>{`
        @keyframes pulse-border {
          0% { border-color: rgba(244, 63, 94, 0.3); box-shadow: 0 0 0px rgba(244, 63, 94, 0); }
          50% { border-color: rgba(244, 63, 94, 1); box-shadow: 0 0 30px rgba(244, 63, 94, 0.6); }
          100% { border-color: rgba(244, 63, 94, 0.3); box-shadow: 0 0 0px rgba(244, 63, 94, 0); }
        }
        .animate-pulse-border { animation: pulse-border 2s infinite; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popIn { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      <div className="fixed top-0 left-0 right-0 z-[200] pointer-events-none">
        {notifications.map(notify => (
          <PushNotification 
            key={notify.id} 
            notification={notify} 
            darkMode={effectiveDarkMode} 
            onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            onAction={(action) => {
              if (action === 'open_navigation') setIsNavigationModalOpen(true);
            }}
          />
        ))}
      </div>
      {showOnboarding && <Onboarding darkMode={effectiveDarkMode} onComplete={(data: any) => { setShowOnboarding(false); setUserName(data.userName); if (data.profileImage) setProfileImage(data.profileImage); setJobTitle(data.jobTitle); setHourlyRate(data.hourlyRate); setCompanyName(data.companyName); setHasDea(data.hasDea); setHasAux(data.hasAux); setHasTaxiCard(data.hasTaxiCard); setPrimaryGraduationDate(data.primaryGraduationDate); setDeaDate(data.deaDate); setAuxDate(data.auxDate); setTaxiDate(data.taxiDate); setTaxiCardExpiryDate(data.taxiCardExpiryDate); setTaxiFpcDate(data.taxiFpcDate); setAfgsuDate(data.afgsuDate); setMedicalExpiryDate(data.medicalExpiryDate); setContractStartDate(data.contractStartDate); setHoursBase(data.hoursBase); setCpCalculationMode(data.cpCalculationMode); setInitialCpBalance(parseFloat(data.initialCpBalance || "0")); setOvertimeMode(data.overtimeMode); setModulationStartDate(data.modulationStartDate); setModulationWeeks(data.modulationWeeks); setPushEnabled(data.notifications); setAutoGeo(data.geo); }} />}
      
      {showDailyRecap && lastFinishedShift && (
        <DailyRecap 
          shift={lastFinishedShift}
          userStats={userStats}
          hourlyRate={effectiveHourlyRate}
          onClose={() => setShowDailyRecap(false)}
          darkMode={effectiveDarkMode}
        />
      )}

      {mealSuggestion && (
        <NavigationChoiceModal 
          isOpen={isNavigationModalOpen}
          onClose={() => setIsNavigationModalOpen(false)}
          latitude={mealSuggestion.latitude}
          longitude={mealSuggestion.longitude}
          address={mealSuggestion.address}
          name={mealSuggestion.name}
          darkMode={effectiveDarkMode}
        />
      )}

      {(() => {
        const unreadCount = notifications.filter(n => !n.read).length;
        return (
          <header className={`sticky top-0 z-40 backdrop-blur-md px-6 pt-12 pb-6 transition-all bg-transparent border-none`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {profileImage && (
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-lg" onClick={() => setActiveTab('profile')}>
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Bonjour, {userName.split(' ')[0] || "Ami"} 👋</h1>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">{companyName || "AmbuFlow"}</p>
                </div>
              </div>
              <div 
                onClick={() => {
                  // Logic removed
                }}
                className={`p-3 rounded-2xl relative ${effectiveDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50'} backdrop-blur-md cursor-pointer`}
              >
                <Bell size={24} className={status !== ServiceStatus.OFF || nextAutoStart ? 'animate-bounce text-indigo-500' : ''} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                     <span className="text-[8px] font-black text-white">{unreadCount}</span>
                  </div>
                )}
              </div>
            </div>
          </header>
        );
      })()}
      <main className="flex-1 max-w-xl mx-auto w-full">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'planning' && <PlanningTab darkMode={effectiveDarkMode} status={status} setStatus={setStatus} onAutoStartService={handleAutoStartService} onEndServiceSilently={stopServiceSilently} appCurrentTime={currentTime} shifts={shifts} setShifts={setShifts} activeShiftId={activeShiftId} setActiveShiftId={setActiveShiftId} availableVehicles={['ASSU', 'AMBU', 'VSL']} hourlyRate={effectiveHourlyRate} setActiveTab={setActiveTab} overtimeMode={overtimeMode} cpCalculationMode={cpCalculationMode as '25' | '30'} modulationWeeks={modulationWeeks} modulationStartDate={modulationStartDate} leaveBalances={leaveBalances} initialCpBalance={initialCpBalance} setInitialCpBalance={setInitialCpBalance} />}
        {activeTab === 'paie' && <PaieTab logs={logs} darkMode={effectiveDarkMode} hasTaxiCard={hasTaxiCard} hourlyRate={effectiveHourlyRate} hoursBase={hoursBase} overtimeMode={overtimeMode} shifts={shifts} cpCalculationMode={cpCalculationMode as '25' | '30'} />}
        {activeTab === 'profile' && <ProfileTab 
          darkMode={effectiveDarkMode} 
          userName={userName} 
          profileImage={profileImage} 
          setProfileImage={setProfileImage}
          jobTitle={jobTitle} 
          companyName={companyName} 
          hourlyRate={hourlyRate}
          effectiveHourlyRate={effectiveHourlyRate}
          seniorityInfo={seniorityInfo}
          setHourlyRate={setHourlyRate}
          setContractStartDate={setContractStartDate}
          shifts={shifts} 
          logs={logs} 
          followSystemTheme={followSystemTheme} 
          setFollowSystemTheme={setFollowSystemTheme} 
          userStats={userStats} 
          onLogout={handleLogout} 
          onResetData={handleResetData}
          hasDea={hasDea}
          hasAux={hasAux}
          hasTaxiCard={hasTaxiCard}
          primaryGraduationDate={primaryGraduationDate}
          deaDate={deaDate}
          auxDate={auxDate}
          taxiDate={taxiDate}
          taxiCardExpiryDate={taxiCardExpiryDate}
          setTaxiCardExpiryDate={setTaxiCardExpiryDate}
          taxiFpcDate={taxiFpcDate}
          setTaxiFpcDate={setTaxiFpcDate}
          afgsuDate={afgsuDate}
          setAfgsuDate={setAfgsuDate}
          medicalExpiryDate={medicalExpiryDate}
          setMedicalExpiryDate={setMedicalExpiryDate}
          contractStartDate={contractStartDate}
          hoursBase={hoursBase}
          cpCalculationMode={cpCalculationMode as '25' | '30'}
          setCpCalculationMode={(val) => setCpCalculationMode(val as any)}
          initialCpBalance={initialCpBalance}
          setInitialCpBalance={setInitialCpBalance}
          overtimeMode={overtimeMode}
          pushEnabled={pushEnabled}
          setPushEnabled={setPushEnabled}
          autoGeo={autoGeo}
          setAutoGeo={setAutoGeo}
        />}
      </main>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} darkMode={effectiveDarkMode} />
    </div>
  );
};
export default App;
