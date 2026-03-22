
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
  leaveType?: 'CP' | 'MAL' | 'CSS' | 'AT';
  leaveDays?: number;
  endDate?: string;
  note?: string;
  isConge?: boolean;
}

export type AppTab = 'home' | 'planning' | 'paie' | 'profile';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface UserStats {
  lastActiveDay?: string;
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
