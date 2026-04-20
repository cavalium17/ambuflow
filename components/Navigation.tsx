
import React from 'react';
import { Clock, Calendar, Wallet, User, LogOut } from 'lucide-react';
import { auth } from '../src/firebaseConfig';
import { signOut } from 'firebase/auth';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  darkMode?: boolean;
  isGuest?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, darkMode = false, isGuest = false }) => {
  const tabs = [
    { id: 'home', icon: Clock, label: 'Board' },
    { id: 'planning', icon: Calendar, label: 'Agenda' },
    { id: 'paie', icon: Wallet, label: 'Revenus', disabled: isGuest },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Local cleanups if needed
      localStorage.removeItem('ambuflow_is_guest');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 pointer-events-none">
      <nav className={`h-16 pointer-events-auto transition-all duration-500 rounded-[24px] px-2 flex items-center justify-between border backdrop-blur-xl shadow-2xl ${
        darkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-slate-900/90 border-slate-700'
      }`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id as AppTab)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 outline-none ${
                isDisabled
                ? 'opacity-20 cursor-not-allowed text-slate-500'
                : (isActive 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-300')
              }`}
            >
              <tab.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              
              <span className={`text-[9px] uppercase tracking-widest transition-all duration-300 ${
                isActive ? 'font-black opacity-100' : 'font-bold opacity-60'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Bouton de Déconnexion */}
        {!isGuest && (
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 outline-none text-rose-500 hover:text-rose-400 group"
          >
            <LogOut 
              size={20} 
              strokeWidth={2}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-60">
              Quitter
            </span>
          </button>
        )}
      </nav>
    </div>
  );
};

export default Navigation;
