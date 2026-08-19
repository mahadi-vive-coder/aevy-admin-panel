import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ShieldAlert, Sparkles, Database, CheckCircle2, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccessRedirect: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessRedirect }) => {
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState('aevy.brand@gmail.com');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Please provide both administrative email and password.');
      return;
    }

    const result = await signIn(email, password);
    if (result.success) {
      onSuccessRedirect();
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  const handleQuickFill = (adminEmail: string) => {
    setEmail(adminEmail);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#D4AF37]/30">
      {/* Subtle luxury ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#2A2A35]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#121216] border border-[#24242C] rounded-2xl p-8 sm:p-10 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#18181F] border border-[#D4AF37]/30 mb-4 shadow-inner">
            <span className="font-serif-brand text-2xl font-bold tracking-widest text-[#D4AF37]">A</span>
          </div>
          
          <h1 className="font-serif-brand text-3xl font-bold tracking-widest text-[#FAF9F5] uppercase">
            AEVY
          </h1>
          
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-[#D4AF37]/40"></span>
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              ADMIN ACCESS
            </span>
            <span className="h-px w-6 bg-[#D4AF37]/40"></span>
          </div>
          
          <p className="text-xs text-[#8E8E98] mt-2">
            Private management portal for AEVY Fragrance operations
          </p>
        </div>

        {/* Error Notification */}
        {(formError || error) && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span>{formError || error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A0A0AB] mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666672]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aevyfragrance.com"
                className="w-full pl-10 pr-4 py-3 bg-[#0E0E12] border border-[#262630] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-[#FAF9F5] placeholder-[#555560] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A0A0AB]">
                Password
              </label>
              <span className="text-[11px] text-[#70707D]">Admin Role Protected</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666672]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#0E0E12] border border-[#262630] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-[#FAF9F5] placeholder-[#555560] outline-none transition-colors"
              />
            </div>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            id="admin-sign-in-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#E6CA65] hover:brightness-110 active:scale-[0.99] text-[#0B0B0C] font-semibold text-sm rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#0B0B0C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>SIGN IN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Supabase Security Notice */}
        <div className="mt-8 pt-6 border-t border-[#202028] text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-[#7A7A88]">
            <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Secured via Supabase PostgreSQL & RLS Authorization</span>
          </div>
          
          <div className="mt-4 p-3 bg-[#17171F] border border-[#252530] rounded-xl text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Supabase Admin Account
              </span>
              <button
                type="button"
                onClick={() => handleQuickFill('aevy.brand@gmail.com')}
                className="text-[11px] text-[#A0A0AB] hover:text-[#FAF9F5] underline cursor-pointer"
              >
                Fill Email
              </button>
            </div>
            <p className="text-[11px] text-[#8E8E98] leading-relaxed">
              Admin: <code className="text-[#E0E0E6] bg-[#0E0E12] px-1.5 py-0.5 rounded">aevy.brand@gmail.com</code> (role: <span className="text-emerald-400">admin</span>)
            </p>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-[#5E5E6C]">
        <p>© {new Date().getFullYear()} AEVY Haute Parfumerie. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-[#484854]">admin.aevyfragrance.com</p>
      </footer>
    </div>
  );
};
