#!/bin/bash
# ==============================================================
# Sarhisob AI - 1-Click VPS Deployment Script
# Supports: Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11 / 12
# ==============================================================

set -e

echo "🚀 [1/5] Yangilanishlar va asosiy paketlar tekshirilmoqda..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw build-essential

# 1. Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    echo "📦 [2/5] Node.js 20 LTS o'rnatilmoqda..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "🟢 Node.js versiyasi: $(node -v)"
echo "🟢 NPM versiyasi: $(npm -v)"

# 2. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 o'rnatilmoqda..."
    sudo npm install -g pm2
fi

# 3. Project dependencies & build
echo "⚙️ [3/5] Kutubxonalar o'rnatilmoqda va loyiha yig'ilmoqda..."
npm install
npm run build

# 4. Start PM2 service
echo "🚀 [4/5] PM2 xizmati ishga tushirilmoqda..."
pm2 start ecosystem.config.cjs --env production || pm2 restart sarhisob-ai
pm2 save
pm2 startup | tail -n 1 | bash || true

# 5. Firewall configuration
echo "🛡️ [5/5] UFW xavfsizlik devori sozlanmoqda..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

echo "=========================================================="
echo "✅ Sarhisob AI serverda muvaffaqiyatli ishga tushdi!"
echo "📍 Mahalliy manzil: http://127.0.0.1:3000"
echo "🌐 Domen ulash uchun nginx.conf faylini /etc/nginx/sites-available ga nusxalang."
echo "=========================================================="
