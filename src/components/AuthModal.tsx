import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../lib/firebase';
import { X, LogOut, CheckCircle, ShieldCheck, Mail, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { ADMIN_EMAIL } from '../types';

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

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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

  // Quick switch for local demo/testing
  const handleQuickDemoLogin = (email: string, displayName: string) => {
    const mockUser = {
      uid: `demo-${Date.now()}`,
      email,
      displayName,
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    onAuthChange(mockUser, 'demo-token');
    onClose();
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
                {currentUser ? 'Foydalanuvchi Profili' : 'Google orqali Kirish'}
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
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin email banner notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1">
            <span className="font-bold text-amber-300 block">
              Admin panelga kirish uchun email:
            </span>
            <span className="font-mono text-white block bg-slate-950 px-2 py-1 rounded border border-slate-800 select-all">
              {ADMIN_EMAIL}
            </span>
          </div>

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
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-slate-100 truncate">
                      {currentUser.displayName || 'Foydalanuvchi'}
                    </h4>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        SuperAdmin
                      </span>
                    )}
                  </div>
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

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div>
                <h4 className="text-base font-semibold text-slate-100">
                  Sarhisob AI Moliya va Tovarlar Tizimi
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Har kim o'z Google hisobi orqali kirib o'z tovarlari va kirim-chiqimlarini kiritishi mumkin.
                </p>
              </div>

              <div className="pt-1">
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

              {/* Fast switch for Admin and User testing */}
              <div className="pt-3 border-t border-slate-800 text-left space-y-2">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  Tezkor profil tanlash (Sinov uchun):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(ADMIN_EMAIL, 'IndigoKids (Bosh Admin)')}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-left"
                  >
                    <strong className="block">Bosh Admin</strong>
                    <span className="text-[10px] text-slate-400 block truncate">{ADMIN_EMAIL}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('dilshod.kassir@gmail.com', 'Dilshod Karimov')}
                    className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-left"
                  >
                    <strong className="block">Xodim (User)</strong>
                    <span className="text-[10px] text-slate-400 block truncate">dilshod.kassir@gmail.com</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
