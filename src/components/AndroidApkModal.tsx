import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  X, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'bubblewrap' | 'pwabuilder'>('direct');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("Ilovani Android telefoningizda o'rnatish uchun brauzer (Chrome) menyusidan 'Bosh ekranga qo'shish' yoki 'Ilovani o'rnatish' tugmasini bosing.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const bubblewrapCode = `# 1. Bubblewrap CLI o'rnatish
npm install -g @bubblewrap/cli

# 2. Sarhisob AI manifesti orqali Android APK loyihasini yaratish
bubblewrap init --manifest="${window.location.origin}/manifest.json"

# 3. Tayyor imzolangan Android APK faylni yig'ish (build)
bubblewrap build

# Natija: app-release-signed.apk Android qurilmaga o'rnatishga tayyor!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Android APK va O'rnatish Markazi
              </h3>
              <p className="text-xs text-slate-400">
                Sarhisob AI ni Android telefonlarga to'liq mustaqil APK yoki PWA qilib o'rnatish
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('direct')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'direct'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1-Click O'rnatish (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('bubblewrap')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'bubblewrap'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Haqiqiy APK Yig'ish (CLI)</span>
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'pwabuilder'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PWABuilder / Play Store</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'direct' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-100">
                    Android Qurilmaga Tezkor O'rnatish
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Hech qanday Play Market yoki murakkab sozlamalarsiz, ilova to'liq ekranli mobil ilova sifatida telefoningizga o'rnatiladi.
                  </p>
                </div>
                <button
                  onClick={handleInstallApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-950 flex items-center space-x-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Ilovani O'rnatish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Ofline & Tezkor Ishlash</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Service Worker keshlash tizimi tufayli internet sust paytlarda ham tezkor ochiladi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>To'liq Ekran (Standalone)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Brauzer URL qatori ko'rinmaydi, xuddi Kotlin/Java da yozilgan mahalliy ilovadek ochiladi.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="text-slate-200 font-semibold">Qo'lda o'rnatish yo'riqnomasi:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Android telefoningizda Google Chrome yoki Samsung Internet brauzerini oching.</li>
                  <li>Ushbu havola bo'yicha ilovaga kiring.</li>
                  <li>Brauzerning o'ng yuqori qismidagi <strong>uch nuqta (⋮)</strong> menyusini bosing.</li>
                  <li><strong>"Bosh ekranga qo'shish"</strong> yoki <strong>"Ilovani o'rnatish"</strong> tugmasini bosing.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'bubblewrap' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Google Bubblewrap (TWA) orqali .APK hosil qilish
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Google rasmiy vositasi yordamida o'z kompyuteringizda to'liq Android Studio va APK tayyorlash:
                </p>
              </div>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre>{bubblewrapCode}</pre>
                <button
                  onClick={() => copyToClipboard(bubblewrapCode, 'bubblewrap')}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center space-x-1 transition-colors"
                >
                  {copiedSnippet === 'bubblewrap' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nusxalandi</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Nusxalash</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-200">Android Paket identifikatori:</div>
                <div className="font-mono text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  uz.sarhisob.moliya
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  PWABuilder (Microsoft) orqali 1 daqiqada APK olish
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hech qanday kod yozmasdan, brauzer orqali tayyor yuklanuvchi APK va Google Play Store to'plami (.aab) olish:
                </p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Quyidagi havolani nusxalang:</span>
                  </div>
                  <div className="font-mono text-emerald-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 truncate">
                    {window.location.origin}
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span><strong>PWABuilder.com</strong> saytiga o'tib, havolani qo'ying va <strong>"Build APK"</strong> tugmasini bosing.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://www.pwabuilder.com/app/${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                  >
                    <span>PWABuilder da APK yaratish</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
