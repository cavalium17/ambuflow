
export enum ServiceStatus {
  OFF = 'OFF',
  WORKING = 'WORKING',
  BREAK = 'BREAK'
}

export interface ActivityLog {
  id: string;
  action: string;
  time: string;
  timestamp: Date;
  location?: string;
  type: 'start' | 'end' | 'break' | 'resume';
}

export interface Break {
  id: string;
  start: string;
  end: string;
  duration: number;
  location: 'Entreprise' | 'Extérieur';
  isMeal?: boolean;
  startDateTime?: Date;
  endDateTime?: Date;
}

export interface Shift {
  id: string;
  day: string;
  start: string;
  end: string;
  crew: string;
  vehicle: string;
  breaks?: Break[];
  isLeave?: boolean;
  leaveType?: 'CP' | 'MAL' | 'CSS' | 'AT' | 'RTT' | 'RECUP';
  leaveDays?: number;
  endDate?: string;
  note?: string;
  isConge?: boolean;
  startDateTime?: Date;
  endDateTime?: Date;
}

export interface AmbulanceCompany {
  id: string;
  nom: string;
  adresse: string;
  telephone: string | null;
  latitude: number | null;
  longitude: number | null;
  label: string;
  value: string;
  suggestion: boolean;
  zipCode?: string;
  city?: string;
}

export type AppTab = 'home' | 'planning' | 'paie' | 'profile' | 'news' | 'assistant';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface UserStats {
  lastActiveDay?: string;
  modulationAnchorDate?: string;
  modulationCycleWeeks?: string | number;
  level?: number;
  xp?: number;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
  url?: string;
  action?: 'open_navigation';
  read?: boolean;
}

export interface ModulationStats {
  totalHours: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  daysRemaining: number;
  weekInCycle: number;
  totalWeeks: number;
}
