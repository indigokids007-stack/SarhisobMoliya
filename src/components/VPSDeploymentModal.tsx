import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Layers, 
  FileCode, 
  ExternalLink 
} from 'lucide-react';

interface VPSDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VPSDeploymentModal: React.FC<VPSDeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'docker' | 'nginx' | 'pm2'>('quick');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickCommands = `# 1. VPS serveringizga SSH orqali kiring
ssh root@your-vps-ip

# 2. Sarhisob AI loyihasini yuklab oling yoki fayllarni nusxalang
git clone <sizning-repo-link> /var/www/sarhisob
cd /var/www/sarhisob

# 3. deploy.sh skriptiga ijro ruxsati berib, ishga tushiring:
chmod +x deploy.sh
./deploy.sh

# 4. Serverda 3000-portda avtomatik ishga tushadi!`;

  const dockerCommands = `# 1. Loyiha papkasiga kiring
cd /var/www/sarhisob

# 2. .env fayliga API kalitlarni yozing:
nano .env
# GEMINI_API_KEY=sizning_kalitingiz
# TELEGRAM_BOT_TOKEN=sizning_bot_tokeningiz

# 3. Docker Compose orqali fonga ishga tushiring:
docker compose up -d --build

# 4. Holatni tekshirish:
docker compose ps
docker compose logs -f`;

  const nginxConfig = `server {
    listen 80;
    server_name moliya.sizning-domeningiz.uz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name moliya.sizning-domeningiz.uz;

    ssl_certificate /etc/letsencrypt/live/moliya.sizning-domeningiz.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/moliya.sizning-domeningiz.uz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

  const certbotCommands = `# SSL sertifikatini bepul olish (Let's Encrypt):
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d moliya.sizning-domeningiz.uz`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                VPS Serverga Joylash Markazi (Deployment Hub)
              </h3>
              <p className="text-xs text-slate-400">
                Ubuntu / Debian / CentOS VPS da Sarhisob AI ni ishlab chiqarishga (production) chiqarish
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

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'quick'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1-Click Deploy (Bash)</span>
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'docker'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Docker & Compose</span>
          </button>
          <button
            onClick={() => setActiveTab('nginx')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'nginx'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Nginx & SSL Sertifikat</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-slate-300 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p leading-relaxed>
                  Loyihada tayyor <strong>deploy.sh</strong> avtomatik skripti mavjud. U Node.js 20, NPM, PM2, UFW xavfsizlik devori va barcha kerakli kutubxonalarni o'zi o'rnatib, ilovani ishlab chiqarish rejimida ishga tushiradi.
                </p>
              </div>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre>{quickCommands}</pre>
                <button
                  onClick={() => copy(quickCommands, 'quick')}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center space-x-1 transition-colors"
                >
                  {copiedId === 'quick' ? (
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
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Docker o'rnatilgan har qanday VPS da quyidagi buyruqlar orqali bir necha soniyada konteynerda ishga tushiring:
              </p>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-blue-400 overflow-x-auto">
                <pre>{dockerCommands}</pre>
                <button
                  onClick={() => copy(dockerCommands, 'docker')}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center space-x-1 transition-colors"
                >
                  {copiedId === 'docker' ? (
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
            </div>
          )}

          {activeTab === 'nginx' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                O'z shaxsiy domeningizni (masalan: <code>moliya.siz.uz</code>) ulash uchun Nginx konfiguratsiyasi:
              </p>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 overflow-x-auto">
                <pre>{nginxConfig}</pre>
                <button
                  onClick={() => copy(nginxConfig, 'nginx')}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center space-x-1 transition-colors"
                >
                  {copiedId === 'nginx' ? (
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

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{certbotCommands}</pre>
                <button
                  onClick={() => copy(certbotCommands, 'certbot')}
                  className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]"
                >
                  {copiedId === 'certbot' ? 'Nusxalandi' : 'Nusxalash'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
