
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
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
  Star,
  Loader2,
  Newspaper
} from 'lucide-react';
import { ServiceStatus, ActivityLog, AppTab, Shift, Break, UserStats, PushNotification as PushType } from './types';
import Navigation from './components/Navigation';
import PushNotification from './components/PushNotification';
import DailyRecap from './components/DailyRecap';
import { Drawer } from './components/Drawer';
import { LiveClock } from './components/LiveClock';
import { Countdown } from './components/Countdown';
import { requestForToken, onMessageListener, auth } from './firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { requestNotificationPermissions, requestLocationPermissions, setupNotificationChannels } from './services/notificationManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getFrenchPublicHolidays, isSundayOrHoliday, getLocalDateString } from './utils/dateUtils';
import { calculateEffectiveMinutes as calculateEffectiveMinutesUtil } from './utils/shiftUtils';

// Lazy load tab components
const BoardTab = lazy(() => import('./components/BoardTab'));
const PlanningTab = lazy(() => import('./components/PlanningTab'));
const PaieTab = lazy(() => import('./components/PaieTab'));
const NewsTab = lazy(() => import('./components/NewsTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const AssistantTab = lazy(() => import('./components/AssistantTab'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));

// Constants
const BREAK_MIN_DURATION = 20 * 60; // 20 minutes en secondes
const MEAL_MIN_DURATION = 30 * 60; // 30 minutes en secondes
const MAX_BREAK_DURATION = 90 * 60; // 1h30 en secondes

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [gainsCarouselIndex, setGainsCarouselIndex] = useState(0);
  const [showDailyRecap, setShowDailyRecap] = useState(false);
  const [lastFinishedShift, setLastFinishedShift] = useState<Shift | null>(null);
  const [hasNewReport, setHasNewReport] = useState(false);
  
  const [userStats, setUserStats] = useLocalStorage<UserStats>('ambuflow_user_stats', { lastActiveDay: undefined });
  const [notifications, setNotifications] = useState<PushType[]>([]);
  const [pushEnabled, setPushEnabled] = useLocalStorage<boolean>('ambuflow_push_enabled', true);
  const [currentGeoPosition, setCurrentGeoPosition] = useState<{ latitude: number; longitude: number; } | null>(null);
  
  const [shifts, setShifts] = useLocalStorage<Shift[]>('ambuflow_shifts', []);

  const [activeShiftId, setActiveShiftId] = useLocalStorage<string | null>('ambuflow_active_shift_id', null);

  const addNotification = useCallback((title: string, message: string, type: PushType['type'] = 'info', url?: string, action?: PushType['action']) => {
    if (!pushEnabled) return;
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

  const [prefersDarkMode, setPrefersDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [followSystemTheme, setFollowSystemTheme] = useLocalStorage<boolean>('ambuflow_follow_system_theme', true);
  const effectiveDarkMode = followSystemTheme ? prefersDarkMode : false;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveDarkMode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effectiveDarkMode ? '#020617' : '#F8FAFC');
  }, [effectiveDarkMode]);

  const [status, setStatus] = useLocalStorage<ServiceStatus>('ambuflow_status', ServiceStatus.OFF);
  const [logs, setLogs] = useLocalStorage<ActivityLog[]>('ambuflow_logs', []);
  const [sessionStartTime, setSessionStartTime] = useLocalStorage<Date | null>('ambuflow_session_start', null);
  const [scheduledShiftId, setScheduledShiftId] = useLocalStorage<string | null>('ambuflow_scheduled_shift_id', null);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakDuration, setBreakDuration] = useState(20);
  
  const [breakStartDateTime, setBreakStartDateTime] = useLocalStorage<Date | null>('ambuflow_break_start_datetime', null);
  const [breakEndTimeActual, setBreakEndTimeActual] = useLocalStorage<Date | null>('ambuflow_break_end', null);
  const [isMealBreak, setIsMealBreak] = useState(false);
  const [isGeoBlockedByPolicy, setIsGeoBlockedByPolicy] = useState(false);

  const [minuteTrigger, setMinuteTrigger] = useState(0);
  const [showOnboarding, setShowOnboarding] = useLocalStorage<boolean>('ambuflow_onboarded', true);
  const [nextAutoStart, setNextAutoStart] = useLocalStorage<Date | null>('ambuflow_next_autostart', null);

  const [userName, setUserName] = useLocalStorage<string>('ambuflow_user_name', "");
  const [profileImage, setProfileImage] = useLocalStorage<string | null>('ambuflow_profile_image', null);
  const [jobTitle, setJobTitle] = useLocalStorage<string>('ambuflow_job_title', "Ambulancier DE");
  const [hourlyRate, setHourlyRate] = useLocalStorage<string>('ambuflow_hourly_rate', "13.02");
  const [companyName, setCompanyName] = useLocalStorage<string>('ambuflow_company_name', "");
  const [autoGeo, setAutoGeo] = useLocalStorage<boolean>('ambuflow_autogeo', true);
  const [hasDea, setHasDea] = useLocalStorage<boolean>('ambuflow_has_dea', false);
  const [hasAux, setHasAux] = useLocalStorage<boolean>('ambuflow_has_aux', false);
  const [hasTaxiCard, setHasTaxiCard] = useLocalStorage<boolean>('ambuflow_has_taxi', false);
  
  const [primaryGraduationDate, setPrimaryGraduationDate] = useLocalStorage<string>('ambuflow_primary_grad_date', "");
  const [deaDate, setDeaDate] = useLocalStorage<string>('ambuflow_dea_date', "");
  const [auxDate, setAuxDate] = useLocalStorage<string>('ambuflow_aux_date', "");
  const [taxiDate, setTaxiDate] = useLocalStorage<string>('ambuflow_taxi_date', "");
  const [taxiCardExpiryDate, setTaxiCardExpiryDate] = useLocalStorage<string>('ambuflow_taxi_card_expiry', "");
  const [taxiFpcDate, setTaxiFpcDate] = useLocalStorage<string>('ambuflow_taxi_fpc_date', "");
  const [afgsuDate, setAfgsuDate] = useLocalStorage<string>('ambuflow_afgsu_date', "");
  const [medicalExpiryDate, setMedicalExpiryDate] = useLocalStorage<string>('ambuflow_medical_expiry', "");
  const [trainingReminders, setTrainingReminders] = useLocalStorage<Record<string, number>>('ambuflow_training_reminders', { afgsu: 3, medical: 3, taxiFpc: 3, taxiCard: 3 });

  const [hoursBase, setHoursBase] = useLocalStorage<string>('ambuflow_hours_base', "35");
  const [cpCalculationMode, setCpCalculationMode] = useLocalStorage<string>('ambuflow_cp_mode', "25");
  const [overtimeMode, setOvertimeMode] = useLocalStorage<string>('ambuflow_overtime_mode', "weekly");
  const [contractStartDate, setContractStartDate] = useLocalStorage<string>('ambuflow_contract_start', "");
  const [modulationStartDate, setModulationStartDate] = useLocalStorage<string>('ambuflow_modulation_start', "");
  const [modulationWeeks, setModulationWeeks] = useLocalStorage<string>('ambuflow_modulation_weeks', "4");
  const [initialCpBalance, setInitialCpBalance] = useLocalStorage<number>('ambuflow_initial_cp', 0);
  const [initialRttBalance, setInitialRttBalance] = useLocalStorage<number>('ambuflow_initial_rtt', 0);
  const [initialRecupBalance, setInitialRecupBalance] = useLocalStorage<number>('ambuflow_initial_recup', 0);

  // Permissions et Notifications
  useEffect(() => {
    // Demande de permissions Notifications
    if (pushEnabled && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            // requestForToken();
          }
        });
      } else if (Notification.permission === 'granted') {
        // requestForToken();
      }
    }
    // Demande de permissions Géo
    if (autoGeo && navigator.geolocation && !isGeoBlockedByPolicy) {
      navigator.geolocation.getCurrentPosition(
        () => {}, 
        (err) => {
          if (err.message.includes("permissions policy")) {
            setIsGeoBlockedByPolicy(true);
            setAutoGeo(false);
          } else {
            console.error("Initial géo request error:", err.message);
          }
        }
      );
    }
  }, [pushEnabled, autoGeo, isGeoBlockedByPolicy, setAutoGeo]);

  // Écouteur de messages FCM en premier plan
  useEffect(() => {
    if (!pushEnabled) return;

    /*
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
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
    */
  }, [pushEnabled, addNotification]);

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
  }, [status, activeShiftId, shifts, pushEnabled]);

  // Notification Rapport Mensuel (1er du mois à 00:01)
  useEffect(() => {
    const checkMonthlyReport = () => {
      const now = new Date();
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

    const checkTrainingExpirations = () => {
      const now = new Date();
      const check = (dateStr: string, label: string, reminderMonths: number, yearsToAdd: number = 0) => {
        if (!dateStr) return;
        const expiry = new Date(dateStr);
        if (yearsToAdd > 0) expiry.setFullYear(expiry.getFullYear() + yearsToAdd);
        
        const diffMs = expiry.getTime() - now.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
        
        const key = `training_notif_${label}_${expiry.toISOString().split('T')[0]}`;
        if (localStorage.getItem(key)) return;

        if (diffMs <= 0) {
          addNotification("FORMATION EXPIRÉE", `Votre ${label} a expiré le ${expiry.toLocaleDateString('fr-FR')}.`, "error");
          localStorage.setItem(key, 'true');
        } else if (diffMonths <= reminderMonths) {
          addNotification("EXPIRATION PROCHE", `Votre ${label} expire dans moins de ${Math.ceil(diffMonths)} mois (${expiry.toLocaleDateString('fr-FR')}).`, "warning");
          localStorage.setItem(key, 'true');
        }
      };

      check(afgsuDate, "AFGSU 2", trainingReminders.afgsu, 4);
      check(medicalExpiryDate, "Aptitude Médicale", trainingReminders.medical, 5);
      if (hasTaxiCard) {
        check(taxiFpcDate, "FPC Taxi", trainingReminders.taxiFpc, 5);
        check(taxiCardExpiryDate, "Carte Pro Taxi", trainingReminders.taxiCard);
      }
    };
    
    checkMonthlyReport();
    checkTrainingExpirations();
    const interval = setInterval(() => {
      checkMonthlyReport();
      checkTrainingExpirations();
    }, 3600000);
    return () => clearInterval(interval);
  }, [addNotification, cpCalculationMode, afgsuDate, medicalExpiryDate, taxiFpcDate, taxiCardExpiryDate, hasTaxiCard, trainingReminders]);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTrigger(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Automatisation du cumul des CP (chaque 1er du mois) - Déjà géré dans checkMonthlyReport

  useEffect(() => {
    // Initialisation des canaux et permissions
    setupNotificationChannels();
    if (pushEnabled) {
      requestNotificationPermissions();
    }
    if (autoGeo && !isGeoBlockedByPolicy) {
      requestLocationPermissions();
    }
  }, [pushEnabled, autoGeo, isGeoBlockedByPolicy]);

  useEffect(() => {
    if (!autoGeo || !navigator.geolocation || isGeoBlockedByPolicy) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentGeoPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        if (err.message.includes("permissions policy")) {
          setIsGeoBlockedByPolicy(true);
          setAutoGeo(false);
          addNotification("GÉOLOCALISATION BLOQUÉE", "La politique de sécurité du navigateur bloque l'accès à votre position.", "warning");
        } else {
          let message = "Erreur inconnue";
          switch(err.code) {
            case err.PERMISSION_DENIED:
              message = "Permission géolocalisation refusée";
              break;
            case err.POSITION_UNAVAILABLE:
              message = "Position non disponible";
              break;
            case err.TIMEOUT:
              message = "Délai d'attente dépassé";
              break;
          }
          console.error(`Erreur géo (${err.code}): ${message}`, err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [autoGeo, isGeoBlockedByPolicy, setAutoGeo, addNotification]);

  const addLog = useCallback((action: string, type: ActivityLog['type']) => {
    const now = new Date();
    let locationInfo: string | undefined = undefined;
    if (autoGeo && currentGeoPosition) {
      locationInfo = `Lat: ${currentGeoPosition.latitude.toFixed(5)}, Lng: ${currentGeoPosition.longitude.toFixed(5)}`;
    }
    const newLog: ActivityLog = { id: Math.random().toString(36).substr(2, 9), action, time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), timestamp: now, location: locationInfo, type };
    setLogs(prev => [newLog, ...prev]);
  }, [autoGeo, currentGeoPosition, setLogs]);

  const handleStartService = useCallback((idToUse?: string | null) => {
    const now = new Date();
    let actualStartTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const finalId = idToUse || activeShiftId;

    if (finalId) {
      const existingShift = shifts.find(s => s.id === finalId);
      if (existingShift && existingShift.start && existingShift.start !== '--:--') {
        actualStartTimeStr = existingShift.start;
      }
      setShifts(prev => prev.map(s => s.id === finalId ? { ...s, start: actualStartTimeStr, startDateTime: s.startDateTime || now } : s));
      setActiveShiftId(finalId);
    } else {
      const todayStr = getLocalDateString(now);
      const newShiftId = Math.random().toString(36).substr(2, 9);
      const newShift: Shift = { 
        id: newShiftId, 
        day: todayStr, 
        start: actualStartTimeStr, 
        end: '--:--', 
        crew: userName || 'À définir', 
        vehicle: 'ASSU', 
        breaks: [],
        startDateTime: now
      };
      setShifts(prev => [newShift, ...prev]);
      setActiveShiftId(newShiftId);
    }
    setStatus(ServiceStatus.WORKING);
    setSessionStartTime(now);
    addLog("Début de service", "start");
    setNextAutoStart(null);
    setScheduledShiftId(null);
    addNotification("SERVICE ACTIVÉ", "Prudence sur la route.", "success");
  }, [activeShiftId, addLog, addNotification, userName, shifts, setActiveShiftId, setShifts, setStatus, setSessionStartTime, setNextAutoStart, setScheduledShiftId]);

  const handleAutoStartService = useCallback((shiftId: string, startTime: string, shiftDay: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const [y, mon, d] = shiftDay.split('-').map(Number);
    const startDate = new Date(y, mon - 1, d, h, m, 0, 0);
    setScheduledShiftId(shiftId);
    setNextAutoStart(startDate);
    setActiveTab('home');
    addNotification("PLANIFICATION", `Prise de poste prévue le ${d}/${mon} à ${startTime}`, "info");
  }, [addNotification, setScheduledShiftId, setNextAutoStart]);

  const handleEndService = useCallback(() => {
    const now = new Date();
    const endTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    if (activeShiftId) {
      const shiftToFinish = shifts.find(s => s.id === activeShiftId);
      if (shiftToFinish) {
        const finishedShift = { ...shiftToFinish, end: endTimeStr, endDateTime: now };
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
  }, [activeShiftId, addLog, addNotification, shifts, setShifts, setStatus, setSessionStartTime, setActiveShiftId, setBreakEndTimeActual, setBreakStartDateTime]);

  const stopServiceSilently = useCallback(() => {
    setStatus(ServiceStatus.OFF);
    setSessionStartTime(null);
    setActiveShiftId(null);
    setBreakEndTimeActual(null);
    setBreakStartDateTime(null);
    addLog("Clôture de service (via Agenda)", "end");
    addNotification("MISSION CLÔTURÉE", "Le compteur journalier a été arrêté.", "info");
  }, [addLog, addNotification, setStatus, setSessionStartTime, setActiveShiftId, setBreakEndTimeActual, setBreakStartDateTime]);

  const handleResume = useCallback(() => {
    const now = new Date();
    let durationLog = "";
    if (activeShiftId && status === ServiceStatus.BREAK) {
      setShifts(prev => prev.map(s => {
        if (s.id === activeShiftId && s.breaks && s.breaks.length > 0) {
          const updatedBreaks = [...s.breaks];
          const lastIndex = updatedBreaks.length - 1;
          const lastBreak = { ...updatedBreaks[lastIndex] };
          
          // Calcul de la durée réelle consommée
          const startDate = lastBreak.startDateTime || breakStartDateTime || now;
          
          let actualDuration = Math.round((now.getTime() - startDate.getTime()) / 60000);
          if (actualDuration < 0) actualDuration = 0;
          
          lastBreak.duration = actualDuration;
          lastBreak.end = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          lastBreak.endDateTime = now;
          updatedBreaks[lastIndex] = lastBreak;
          
          durationLog = `${actualDuration} min`;
          return { ...s, breaks: updatedBreaks };
        }
        return s;
      }));
    }

    setStatus(ServiceStatus.WORKING);
    setBreakEndTimeActual(null);
    setBreakStartDateTime(null);
    addLog(`Reprise de mission (${durationLog})`, "resume");
  }, [activeShiftId, status, addLog, breakStartDateTime, setShifts, setStatus, setBreakEndTimeActual, setBreakStartDateTime]);

  const handleOpenPauseModal = useCallback(() => {
    const now = new Date();
    setBreakStartTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    setBreakDuration(20);
    setIsMealBreak(false);
    setShowPauseModal(true);
  }, []);

  const handleOpenSummaryModal = useCallback(() => {
    setShowSummaryModal(true);
  }, []);

  const handleConfirmSummary = useCallback(() => {
    handleEndService();
    setShowSummaryModal(false);
  }, [handleEndService]);

  const handleConfirmBreak = useCallback(async () => {
    const now = new Date();
    const [h, m] = breakStartTime.split(':').map(Number);
    const startDate = new Date(now);
    startDate.setHours(h, m, 0, 0);
    
    // Si l'heure de début est supérieure à l'heure actuelle, c'est probablement qu'on a commencé hier
    if (startDate.getTime() > now.getTime()) {
      startDate.setDate(startDate.getDate() - 1);
    }
    
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
        location: 'Entreprise',
        isMeal: isMealBreak,
        startDateTime: startDate,
        endDateTime: endDate
      };
      
      setShifts(prev => prev.map(s => {
        if (s.id === activeShiftId) {
          const breaks = s.breaks || [];
          return { ...s, breaks: [...breaks, newBreak] };
        }
        return s;
      }));
    }
    
    setStatus(ServiceStatus.BREAK);
    addLog(isMealBreak ? "Pause Repas" : "Pause Café", "break");
    addNotification(isMealBreak ? "REPAS EN COURS" : "PAUSE ACTIVE", `Fin prévue à ${endTimeStr}`, "info");
    
    setShowPauseModal(false);
    setActiveTab('home'); // Redirection vers le Board
  }, [breakStartTime, breakDuration, isMealBreak, activeShiftId, addLog, addNotification, setBreakStartDateTime, setBreakEndTimeActual, setShifts, setStatus]);

  const handleToggleBreak = useCallback(() => {
    if (status === ServiceStatus.BREAK) {
      handleResume();
    } else {
      handleOpenPauseModal();
    }
  }, [status, handleResume, handleOpenPauseModal]);

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
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const todayShift = shifts.find(s => s.day === todayStr);
    const isTodayFinished = todayShift && todayShift.end !== '--:--';

    if (status === ServiceStatus.OFF && nextAutoStart && now >= nextAutoStart) {
      if (isTodayFinished && getLocalDateString(nextAutoStart) === todayStr) {
        setNextAutoStart(null);
        setScheduledShiftId(null);
      } else {
        addNotification("PRISE DE SERVICE AUTOMATIQUE", "Votre service a été activé selon votre planning.", "success");
        handleStartService(scheduledShiftId);
      }
    } else if (status !== ServiceStatus.OFF && nextAutoStart && now >= nextAutoStart) {
      if (status === ServiceStatus.BREAK) {
        handleResume();
      }
      if (scheduledShiftId) {
        handleStartService(scheduledShiftId);
      }
      setNextAutoStart(null);
      setScheduledShiftId(null);
    }
  }, [minuteTrigger, nextAutoStart, status, handleStartService, scheduledShiftId, shifts, setNextAutoStart, setScheduledShiftId]);

  useEffect(() => {
    if (status === ServiceStatus.BREAK && breakEndTimeActual && new Date() >= breakEndTimeActual) {
      handleResume();
    }
  }, [minuteTrigger, status, breakEndTimeActual, handleResume]);

  // Logique AFGSU
  const afgsuStatus = useMemo(() => {
    if (!afgsuDate) return null;
    const lastDate = new Date(afgsuDate);
    const expiryDate = new Date(lastDate);
    expiryDate.setFullYear(lastDate.getFullYear() + 4);
    
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= trainingReminders.afgsu) return 'warning';
    return 'valid';
  }, [afgsuDate, minuteTrigger, trainingReminders.afgsu]);

  // Logique Aptitude Médicale
  const medicalStatus = useMemo(() => {
    if (!medicalExpiryDate) return null;
    const lastDate = new Date(medicalExpiryDate);
    const expiryDate = new Date(lastDate);
    expiryDate.setFullYear(lastDate.getFullYear() + 5);
    
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= trainingReminders.medical) return 'warning';
    return 'valid';
  }, [medicalExpiryDate, minuteTrigger, trainingReminders.medical]);

  // Logique Taxi Card
  const taxiCardStatus = useMemo(() => {
    if (!hasTaxiCard || !taxiCardExpiryDate) return null;
    const expiryDate = new Date(taxiCardExpiryDate);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= trainingReminders.taxiCard) return 'warning';
    return 'valid';
  }, [hasTaxiCard, taxiCardExpiryDate, minuteTrigger, trainingReminders.taxiCard]);

  // Logique Taxi FPC (5 ans)
  const taxiFpcStatus = useMemo(() => {
    if (!hasTaxiCard || !taxiFpcDate) return null;
    const lastDate = new Date(taxiFpcDate);
    const expiryDate = new Date(lastDate);
    expiryDate.setFullYear(lastDate.getFullYear() + 5);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMs <= 0) return 'expired';
    if (diffMonths <= trainingReminders.taxiFpc) return 'warning';
    return 'valid';
  }, [hasTaxiCard, taxiFpcDate, minuteTrigger, trainingReminders.taxiFpc]);

  const leaveBalances = useMemo(() => {
    let usedCp = 0;
    let usedRtt = 0;
    let usedRecup = 0;
    
    shifts.forEach(s => {
      if (s.isLeave || s.vehicle === 'CONGÉ') {
        if (s.leaveType === 'CP') usedCp += 1;
        if (s.leaveType === 'RTT') usedRtt += 1;
        if (s.leaveType === 'RECUP') usedRecup += 1;
      }
    });
    
    return {
      cp: Math.max(0, initialCpBalance - usedCp),
      usedCp,
      rtt: Math.max(0, initialRttBalance - usedRtt),
      usedRtt,
      recup: Math.max(0, initialRecupBalance - usedRecup),
      usedRecup
    };
  }, [shifts, initialCpBalance, initialRttBalance, initialRecupBalance]);

  const getDuration = () => {
    const activeShift = shifts.find(s => s.id === activeShiftId);
    if (!activeShift || !activeShift.start || activeShift.start === '--:--') return "00:00:00";
    
    // Utilisation de startDateTime si disponible, sinon reconstruction
    let startDate = activeShift.startDateTime;
    if (!startDate) {
      const [y, mon, d] = activeShift.day.split('-').map(Number);
      const [startH, startM] = activeShift.start.split(':').map(Number);
      startDate = new Date(y, mon - 1, d, startH, startM, 0, 0);
    }
    
    const isCurrentlyInBreak = status === ServiceStatus.BREAK && activeShift.breaks?.length;
    const lastBreak = isCurrentlyInBreak ? activeShift.breaks![activeShift.breaks!.length - 1] : null;
    
    const now = new Date();
    let effectiveNow = now;
    if (isCurrentlyInBreak && lastBreak) {
      effectiveNow = lastBreak.startDateTime || now;
    }
        
    let diffMs = effectiveNow.getTime() - startDate.getTime();
    if (diffMs < 0) return "00:00:00";
    
    if (activeShift.breaks) {
      activeShift.breaks.forEach(b => { 
        // On ne soustrait que les pauses terminées AVANT le moment effectif actuel
        // Si on est en pause, effectiveNow est le début de la pause actuelle, donc on ne la soustrait pas
        if (b.end !== '--:--' && b.id !== lastBreak?.id) {
          diffMs -= (b.duration * 60000); 
        }
      });
    }
    const h = Math.floor(Math.max(0, diffMs) / 3600000);
    const m = Math.floor((Math.max(0, diffMs) % 3600000) / 60000);
    const s = Math.floor((Math.max(0, diffMs) % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateEffectiveMinutes = useCallback((shift: Shift) => {
    return calculateEffectiveMinutesUtil(shift, activeShiftId, new Date());
  }, [activeShiftId]);

  const periodStats = useMemo(() => {
    let totalMin = 0;
    let targetMin = (parseInt(hoursBase) || 35) * 60;
    let title = "Semaine";
    let icon = CalendarRange;
    let subtitle = "Période active";
    let color = "indigo";
    let extraData: any = null;

    const now = new Date();
    if (overtimeMode === 'weekly') {
      const monday = new Date(now);
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
      const diffDays = Math.floor((now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
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
      const timeRemainingMs = end.getTime() - now.getTime();
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
      const start = new Date(now.getFullYear(), 0, 1);
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
  }, [shifts, overtimeMode, calculateEffectiveMinutes, minuteTrigger, contractStartDate, modulationStartDate, modulationWeeks, hoursBase]);

  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
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
          endH = now.getHours();
          endM = now.getMinutes();
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
  }, [shifts, minuteTrigger, activeShiftId, effectiveHourlyRate, calculateEffectiveMinutes]);

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
            const now = new Date();
            endH = now.getHours();
            endM = now.getMinutes();
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
    const now = new Date();
    const today = new Date(now);
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const currentDayGains = calculateGainsForPeriod(today, tomorrow);

    // Current Week (Monday to Sunday)
    const monday = new Date(now);
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
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthGains = calculateGainsForPeriod(firstDayMonth, firstDayNextMonth);

    // Previous Month
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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
  }, [shifts, minuteTrigger, activeShiftId, effectiveHourlyRate, calculateEffectiveMinutes]);

  const vehicleDistribution = useMemo(() => {
    let assuMin = 0;
    let ambuMin = 0;
    let vslMin = 0;
    
    const now = new Date();

    // Get shifts for the current period based on overtimeMode
    let periodShifts = shifts;
    if (overtimeMode === 'weekly') {
      const monday = new Date(now);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      periodShifts = shifts.filter(s => new Date(s.day) >= monday);
    } else if (overtimeMode === 'fortnightly') {
      const anchor = contractStartDate ? new Date(contractStartDate) : new Date(2024, 0, 1);
      const diffDays = Math.floor((now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
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
      const start = new Date(now.getFullYear(), 0, 1);
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
  }, [shifts, calculateEffectiveMinutes, overtimeMode, minuteTrigger, contractStartDate, modulationStartDate, modulationWeeks]);

  const getNextShiftCountdown = () => {
    if (!nextAutoStart) return null;
    return <Countdown targetDate={nextAutoStart} />;
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="text-indigo-500 animate-spin" /></div>}>
        <AuthScreen onAuthSuccess={() => {}} />
      </Suspense>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans pb-28 flex flex-col relative ${effectiveDarkMode ? 'bg-[#050505] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <Drawer 
        isOpen={showPauseModal} 
        onClose={() => setShowPauseModal(false)} 
        title={isMealBreak ? "Pause Repas" : "Pause Café"}
        darkMode={effectiveDarkMode}
      >
        <div className="space-y-8">
          <div className="flex p-1 bg-slate-500/10 rounded-2xl">
            <button 
              onClick={() => setIsMealBreak(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                !isMealBreak 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Coffee size={14} />
              Café
            </button>
            <button 
              onClick={() => setIsMealBreak(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isMealBreak 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Utensils size={14} />
              Repas
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heure de début</label>
            <input 
              type="time" 
              value={breakStartTime}
              onChange={(e) => setBreakStartTime(e.target.value)}
              className={`w-full p-4 rounded-2xl border text-lg font-black ${
                effectiveDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Durée de la pause</label>
              <span className="text-lg font-black text-indigo-500">{breakDuration} min</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="90" 
              step="5"
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-500/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>20 min</span>
              <span>90 min</span>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border flex items-center justify-between ${
            effectiveDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-xl text-white">
                {isMealBreak ? <Utensils size={20} /> : <Coffee size={20} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fin prévue à</p>
                <p className={`text-xl font-black ${effectiveDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {(() => {
                    const [h, m] = breakStartTime.split(':').map(Number);
                    if (isNaN(h) || isNaN(m)) return "--:--";
                    const d = new Date();
                    d.setHours(h, m + breakDuration);
                    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  })()}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleConfirmBreak}
            className="w-full py-6 rounded-[28px] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Valider la pause
          </button>
        </div>
      </Drawer>

      <Drawer 
        isOpen={showSummaryModal} 
        onClose={() => setShowSummaryModal(false)} 
        title="Résumé de la journée"
        darkMode={effectiveDarkMode}
      >
        <div className="space-y-8">
          {(() => {
            const activeShift = shifts.find(s => s.id === activeShiftId);
            if (!activeShift) return null;

            const now = new Date();
            const [h1, m1] = activeShift.start.split(':').map(Number);
            const startTime = new Date(activeShift.startDateTime || now);
            startTime.setHours(h1, m1, 0, 0);
            
            const endTime = now;
            const endTimeStr = endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            let amplitudeMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
            if (amplitudeMin < 0) amplitudeMin += 1440;
            
            const totalBreaksMin = activeShift.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
            const effectiveMin = Math.max(0, amplitudeMin - totalBreaksMin);
            
            const rate = parseFloat(effectiveHourlyRate) || 11.65;
            const workedEarnings = (effectiveMin / 60) * rate;
            
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${effectiveDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Début</p>
                    <p className="text-lg font-black">{activeShift.start}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${effectiveDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fin</p>
                    <p className="text-lg font-black">{endTimeStr}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails du service</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Amplitude totale</span>
                      <span className="text-sm font-black">{Math.floor(amplitudeMin / 60)}h {amplitudeMin % 60}m</span>
                    </div>
                    {activeShift.breaks?.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Pause ({b.start} - {b.end})</span>
                        <span className="font-bold text-amber-500">-{b.duration} min</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-500/10">
                      <span className="text-sm font-black">Temps effectif</span>
                      <span className="text-sm font-black text-indigo-500">{Math.floor(effectiveMin / 60)}h {effectiveMin % 60}m</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Rémunération Totale</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-5xl font-black tracking-tighter">{workedEarnings.toFixed(2)}</h4>
                    <span className="text-xl font-bold opacity-60">€</span>
                  </div>
                </div>

                <button 
                  onClick={handleConfirmSummary}
                  className="w-full py-6 rounded-[28px] bg-rose-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Clôturer la journée
                </button>
              </div>
            );
          })()}
        </div>
      </Drawer>

      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="fixed inset-0 z-[100]"
          >
            <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="text-indigo-500 animate-spin" /></div>}>
              <Onboarding darkMode={effectiveDarkMode} onComplete={(data: any) => { setShowOnboarding(false); setUserName(data.userName); if (data.profileImage) setProfileImage(data.profileImage); setJobTitle(data.jobTitle); setHourlyRate(data.hourlyRate); setCompanyName(data.companyName); setHasDea(data.hasDea); setHasAux(data.hasAux); setHasTaxiCard(data.hasTaxiCard); setPrimaryGraduationDate(data.primaryGraduationDate); setDeaDate(data.deaDate); setAuxDate(data.auxDate); setTaxiDate(data.taxiDate); setTaxiCardExpiryDate(data.taxiCardExpiryDate); setTaxiFpcDate(data.taxiFpcDate); setAfgsuDate(data.afgsuDate); setMedicalExpiryDate(data.medicalExpiryDate); setContractStartDate(data.contractStartDate); setHoursBase(data.hoursBase); setCpCalculationMode(data.cpCalculationMode); setInitialCpBalance(parseFloat(data.initialCpBalance || "0")); setOvertimeMode(data.overtimeMode); setModulationStartDate(data.modulationStartDate); setModulationWeeks(data.modulationWeeks); setPushEnabled(data.notifications); setAutoGeo(data.geo); }} />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
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
        @keyframes blink-red {
          0%, 100% { color: #f43f5e; opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-blink-red { animation: blink-red 1s infinite; }
      `}</style>
      <div className="fixed top-0 left-0 right-0 z-[200] pointer-events-none">
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto px-6 pt-6">
          {notifications.map(notify => (
            <PushNotification 
              key={notify.id} 
              notification={notify} 
              darkMode={effectiveDarkMode} 
              onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
              onAction={(action) => {
              }}
            />
          ))}
        </div>
      </div>
      
      {showDailyRecap && lastFinishedShift && (
        <DailyRecap 
          shift={lastFinishedShift}
          userStats={userStats}
          hourlyRate={effectiveHourlyRate}
          onClose={() => setShowDailyRecap(false)}
          darkMode={effectiveDarkMode}
        />
      )}

      {(() => {
        const unreadCount = notifications.filter(n => !n.read).length;
        return (
          <header className={`sticky top-0 z-40 backdrop-blur-md px-6 pt-12 pb-6 transition-all bg-transparent border-none`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {activeTab === 'news' ? (
                  <div 
                    onClick={() => setActiveTab('home')}
                    className={`p-3 rounded-2xl ${effectiveDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50'} backdrop-blur-md cursor-pointer`}
                  >
                    <ArrowLeft size={24} />
                  </div>
                ) : (
                  profileImage && (
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-lg" onClick={() => setActiveTab('profile')}>
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tighter">
                    {activeTab === 'news' ? "Actualités" : `Bonjour, ${userName.split(' ')[0] || "Ami"}`}{" "}
                    {activeTab !== 'news' && (
                      <motion.span
                        style={{ display: "inline-block", transformOrigin: "bottom center" }}
                        animate={{ rotate: [-10, 15, -10] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                          ease: "easeInOut"
                        }}
                      >
                        👋
                      </motion.span>
                    )}
                  </h1>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">{activeTab === 'news' ? "Transport Sanitaire" : (companyName || "AmbuFlow")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => setActiveTab('news')}
                  className={`p-3 rounded-2xl relative ${effectiveDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50'} backdrop-blur-md cursor-pointer transition-all`}
                >
                  <Newspaper size={24} className={activeTab === 'news' ? 'text-indigo-500' : ''} />
                </div>
                <div 
                  onClick={() => {
                    // Logic for notifications
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
            </div>
          </header>
        );
      })()}
      <main className="flex-1 max-w-xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="text-indigo-500 animate-spin" /></div>}>
            {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <BoardTab 
                darkMode={effectiveDarkMode}
                userName={userName}
                status={status}
                activeShift={shifts.find(s => s.id === activeShiftId) || null}
                onStartService={handleStartService}
                onEndService={handleEndService}
                onOpenPauseModal={handleOpenPauseModal}
                onOpenSummaryModal={handleOpenSummaryModal}
                onToggleBreak={handleToggleBreak}
                shifts={shifts}
                userStats={userStats}
                onOpenAssistant={() => setActiveTab('assistant')}
                minuteTrigger={minuteTrigger}
                activeShiftId={activeShiftId}
                addNotification={addNotification}
                calculateEffectiveMinutes={calculateEffectiveMinutes}
                hourlyRate={effectiveHourlyRate}
                hoursBase={hoursBase}
                overtimeMode={overtimeMode}
                modulationStartDate={modulationStartDate}
                modulationWeeks={modulationWeeks}
                leaveBalances={leaveBalances}
              />
            </motion.div>
          )}
          {activeTab === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PlanningTab darkMode={effectiveDarkMode} status={status} setStatus={setStatus} onAutoStartService={handleAutoStartService} onEndServiceSilently={stopServiceSilently} minuteTrigger={minuteTrigger} shifts={shifts} setShifts={setShifts} activeShiftId={activeShiftId} setActiveShiftId={setActiveShiftId} availableVehicles={['ASSU', 'AMBU', 'VSL']} hourlyRate={effectiveHourlyRate} setActiveTab={setActiveTab} overtimeMode={overtimeMode} cpCalculationMode={cpCalculationMode as '25' | '30'} modulationWeeks={modulationWeeks} modulationStartDate={modulationStartDate} leaveBalances={leaveBalances} initialCpBalance={initialCpBalance} setInitialCpBalance={setInitialCpBalance} initialRttBalance={initialRttBalance} setInitialRttBalance={setInitialRttBalance} initialRecupBalance={initialRecupBalance} setInitialRecupBalance={setInitialRecupBalance} />
            </motion.div>
          )}
          {activeTab === 'paie' && (
            <motion.div
              key="paie"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PaieTab logs={logs} darkMode={effectiveDarkMode} hasTaxiCard={hasTaxiCard} hourlyRate={effectiveHourlyRate} hoursBase={hoursBase} overtimeMode={overtimeMode} shifts={shifts} cpCalculationMode={cpCalculationMode as '25' | '30'} />
            </motion.div>
          )}
          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <NewsTab darkMode={effectiveDarkMode} currentGeoPosition={currentGeoPosition} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileTab 
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
                trainingReminders={trainingReminders}
                setTrainingReminders={setTrainingReminders}
                contractStartDate={contractStartDate}
                hoursBase={hoursBase}
                cpCalculationMode={cpCalculationMode as '25' | '30'}
                setCpCalculationMode={(val) => setCpCalculationMode(val as any)}
                initialCpBalance={initialCpBalance}
                setInitialCpBalance={setInitialCpBalance}
                initialRttBalance={initialRttBalance}
                setInitialRttBalance={setInitialRttBalance}
                initialRecupBalance={initialRecupBalance}
                setInitialRecupBalance={setInitialRecupBalance}
                overtimeMode={overtimeMode}
                pushEnabled={pushEnabled}
                setPushEnabled={setPushEnabled}
                autoGeo={autoGeo}
                setAutoGeo={setAutoGeo}
              />
            </motion.div>
          )}
          {activeTab === 'assistant' && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AssistantTab darkMode={effectiveDarkMode} shifts={shifts} userStats={userStats} />
              </motion.div>
            )}
          </Suspense>
        </AnimatePresence>
      </main>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} darkMode={effectiveDarkMode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default App;
