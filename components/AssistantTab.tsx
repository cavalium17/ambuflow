
import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { getDailyInsights } from '../services/geminiService';
import { ActivityLog } from '../types';

interface AssistantTabProps {
  logs: ActivityLog[];
  userName: string;
}

const AssistantTab: React.FC<AssistantTabProps> = ({ logs, userName }) => {
  const [insights, setInsights] = useState<{ summary: string; stats: string; advice: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    const data = await getDailyInsights(logs, userName);
    setInsights(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-5 space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="text-amber-300" />
            AmbuFlow AI
          </h2>
          <p className="text-indigo-100 text-sm opacity-90">
            Votre assistant personnel analyse votre journée de service pour optimiser votre récupération.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <BrainCircuit size={180} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse text-sm">Analyse de vos logs en cours...</p>
        </div>
      ) : insights ? (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={14} /> Résumé du Service
            </h3>
            <p className="text-slate-800 font-semibold leading-relaxed">{insights.summary}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
               <span className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold">
                 {insights.stats}
               </span>
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 animate-fadeIn" style={{ animationDelay: '100ms' }}>
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck size={14} /> Conseil Bien-être
            </h3>
            <p className="text-amber-900 text-sm font-medium leading-relaxed italic">
              "{insights.advice}"
            </p>
          </div>

          <button 
            onClick={fetchInsights}
            className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 active:bg-slate-50"
          >
            <RefreshCw size={16} /> Rafraîchir l'analyse
          </button>
        </div>
      ) : (
        <div className="text-center py-12 px-8 bg-white rounded-3xl border border-dashed border-slate-300">
          <BrainCircuit className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 text-sm font-medium">Commencez votre service pour activer l'analyse intelligente.</p>
        </div>
      )}
    </div>
  );
};

export default AssistantTab;