
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { auth } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    const playVideo = async () => {
      if (videoRef.current && isMounted) {
        try {
          await videoRef.current.play();
        } catch (error) {
          // Only log if still mounted to avoid "media removed from document" noise
          if (isMounted) {
            console.error("Video autoplay failed:", error);
          }
        }
      }
    };
    playVideo();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Une erreur est survenue.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "Email ou mot de passe incorrect.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "Cet email est déjà utilisé.";
      } else if (err.code === 'auth/weak-password') {
        message = "Le mot de passe est trop faible.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Format d'email invalide.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Veuillez saisir votre email pour réinitialiser le mot de passe.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError("Erreur lors de l'envoi de l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Background Video (Ambulance Luma - Forced Local with Safety Fallback) */}
      <video 
        ref={videoRef}
        autoPlay 
        loop 
        muted 
        playsInline 
        {...{ "webkit-playsinline": "true" }}
        className="fixed inset-0 w-full h-full object-cover z-0" 
      >
        <source src="/login-bg.mp4" type="video/mp4" />
        {/* Safety Fallback: High-quality dark ambulance video if local file is missing */}
        <source src="https://assets.mixkit.co/videos/preview/mixkit-ambulance-driving-at-night-with-flashing-lights-34182-large.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay (Cockpit Ambiance) */}
      <div className="fixed inset-0 bg-slate-950/80 z-[1]" />

      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md animate-slideIn">
          {/* Form Card (Cockpit Glassmorphism) */}
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8">
            <div className="text-center">
              <h1 className="text-white font-black tracking-[0.4em] text-3xl mb-10 uppercase animate-textSlideUp">
                AmbuFlow
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                  <input 
                    type="email" 
                    placeholder="ADRESSE EMAIL" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold tracking-widest" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                  <input 
                    type="password" 
                    placeholder="MOT DE PASSE" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xs font-bold tracking-widest" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 animate-shake">
                  <AlertCircle size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                </div>
              )}

              {resetSent && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200">
                  <ShieldCheck size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Lien envoyé avec succès</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{isLogin ? 'Se Connecter' : 'S\'inscrire'}</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col items-center gap-4 pt-4">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-white/50 font-bold hover:text-white transition-colors uppercase tracking-widest text-[10px]"
              >
                {isLogin ? "Créer un compte" : "Se connecter"}
              </button>
              
              {isLogin && (
                <button 
                  onClick={handleResetPassword}
                  className="text-white/30 font-bold hover:text-white/50 transition-colors uppercase tracking-widest text-[10px]"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes textSlideUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-slideIn { animation: slideIn 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-textSlideUp { animation: textSlideUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards; opacity: 0; }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default Login;
