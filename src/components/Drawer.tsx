
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  darkMode: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, darkMode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[250]"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed bottom-0 left-0 right-0 z-[300] max-w-xl mx-auto rounded-t-[40px] border-t p-8 pb-12 ${
            darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
          } shadow-[0_-20px_50px_rgba(0,0,0,0.3)]`}
        >
          <div className="w-12 h-1.5 bg-slate-500/20 rounded-full mx-auto mb-8" />
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
