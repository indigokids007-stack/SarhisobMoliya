import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../lib/firebase';
import { X, LogOut, CheckCircle, ShieldCheck, Mail, UserCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange: (user: User | null, token?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        onAuthChange(res.user, res.accessToken);
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(err?.message || 'Google orqali tizimga kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onAuthChange(null, '');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Chiqishda xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {currentUser ? 'Foydalanuvchi Profili' : 'Tizimga Kirish'}
              </h3>
              <p className="text-xs text-slate-400">Sarhisob AI xavfsiz autentifikatsiyasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-14 h-14 rounded-full ring-2 ring-emerald-500/40 object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-100 truncate">
                    {currentUser.displayName || 'Foydalanuvchi'}
                  </h4>
                  <p className="text-xs text-slate-400 truncate flex items-center space-x-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{currentUser.email}</span>
                  </p>
                  <div className="inline-flex items-center space-x-1 mt-2 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    <span>Google & Google Sheets ulangan</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">UID:</span>
                  <span className="font-mono text-slate-400">{currentUser.uid.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hisob holati:</span>
                  <span className="text-emerald-400 font-medium">Faol / Himoyalangan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Google Sheets ruxsati:</span>
                  <span className="text-slate-300">To'liq sinxronizatsiya</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <UserCheck className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-100">
                  Sarhisob AI ga xush kelibsiz
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Google hisobingiz orqali kiring va barcha xarajatlarni to'g'ridan-to'g'ri shaxsiy Google Jadvalingiz (Sheets) bilan sinxronlang.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center space-x-3 px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{loading ? 'Kirilmoqda...' : 'Google orqali kirish'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                🔒 Shaxsiy ma'lumotlaringiz to'liq himoyalangan va faqat sizning ruxsatingiz bilan ishlatiladi.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
