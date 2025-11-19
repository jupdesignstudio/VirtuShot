import React from 'react';
import { X } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0f172a]";
  
  const variants = {
    primary: "bg-virtu-500 hover:bg-virtu-400 text-white shadow-lg shadow-virtu-500/30",
    secondary: "bg-virtu-800 hover:bg-virtu-700 text-gray-200 border border-white/5",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-virtu-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`bg-virtu-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-virtu-500 focus:ring-1 focus:ring-virtu-500 outline-none transition-all ${className}`}
    {...props}
  />
);

export const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-virtu-500 to-virtu-accent rounded-lg shadow-lg shadow-virtu-500/20">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="22" y2="12"/>
      </svg>
    </div>
    <span className="font-bold text-xl tracking-tight text-white">Virtu<span className="text-virtu-accent">Shot</span></span>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-virtu-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-virtu-800/50">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};