
import React from 'react';
import { Clock, Calendar, Wallet, User } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  darkMode?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, darkMode = false }) => {
  const tabs = [
    { id: 'home', icon: Clock, label: 'Board' },
    { id: 'planning', icon: Calendar, label: 'Agenda' },
    { id: 'paie', icon: Wallet, label: 'Revenus' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 pointer-events-none">
      <nav className={`h-16 pointer-events-auto transition-all duration-500 rounded-[24px] px-2 flex items-center justify-between border backdrop-blur-xl shadow-2xl ${
        darkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-slate-900/90 border-slate-700'
      }`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppTab)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 outline-none ${
                isActive 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-300'
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
      </nav>
    </div>
  );
};

export default Navigation;
