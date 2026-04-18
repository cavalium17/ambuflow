import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  LogIn
} from 'lucide-react';
import { auth, db } from '../src/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Initialiser le profil dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          onboarded: false,
          createdAt: new Date().toISOString()
        });

        // Simulation d'envoi de mail de confirmation
        setSuccess("Compte créé ! Un email de confirmation a été simulé.");
        // On laisse un peu de temps pour voir le message avant la transition (gérée par App.tsx via onAuthStateChanged)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Une erreur est survenue.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "email inexistant. Inscrivez vous !";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "Cet email est déjà utilisé.";
      } else if (err.code === 'auth/weak-password') {
        message = "Le mot de passe doit contenir au moins 6 caractères.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Format d'email invalide.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md space-y-12">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-[40px] opacity-20 scale-150" />
            <img 
              src="https://ambuflow-delta.vercel.app/pwa-512x512.png" 
              alt="AmbuFlow" 
              className="relative w-32 h-32 drop-shadow-2xl"
            />
          </div>
          <div className="text-center">
            <h1 className="text-white text-4xl font-black tracking-tighter uppercase">
              Ambu<span className="text-indigo-500">Flow</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-widest uppercase mt-1">
              Pro Edition
            </p>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl"
        >
          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold tracking-tight">
              {isLogin ? 'Bon retour !' : 'Créer un compte'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isLogin ? 'Connectez-vous pour accéder à votre cockpit.' : 'Rejoignez l\'équipage AmbuFlow dès aujourd\'hui.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  placeholder="ADRESSE EMAIL" 
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-[24px] py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold tracking-widest" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="MOT DE PASSE" 
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-[24px] py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold tracking-widest" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                >
                  <ShieldCheck size={18} className="flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-[28px] shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isLogin ? 'Se Connecter' : 'S\'inscrire'}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-white font-bold transition-colors uppercase tracking-widest text-[10px] flex items-center gap-2"
            >
              {isLogin ? (
                <>
                  <UserPlus size={14} />
                  Pas encore de compte ? Créer un compte
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Déjà membre ? Se connecter
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
        AmbuFlow Security Protocol v2.4
      </div>
    </div>
  );
};

export default AuthScreen;
