# Daily Expense Manager

Production-ready, full-stack business financial management web application designed for recording, monitoring, analyzing, and auditing daily business expenses over an exact **3-month accounting period**.

The application is fully synchronized with Google Sheets (**ID: `1bONPkd7IlHlzZSH-oVSqa4UVnBp16C7rBNPkhEGUAQk`**, **GID: `936307973`**), integrates directly with the Telegram Bot (**`@Kukukaka8_bot`**), operates seamlessly as a Telegram Mini App, and enforces strict Google OAuth access control with Role-Based Access Control (RBAC).

---

## 1. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud project (e.g., `oddiy-narsa`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - App Name: `Daily Expense Manager`
   - User support email: `indigokids007@gmail.com`
4. Under **Scopes**, add:
   - `https://www.googleapis.com/auth/spreadsheets` (Google Sheets API v4)
   - `openid`, `email`, `profile`
5. Under **Test Users**, ensure these two authorized accounts are added:
   - `4g.sudoer@gmail.com` (Administrator)
   - `indigokids007@gmail.com` (Standard User)
6. Under **Credentials**, create an **OAuth 2.0 Client ID** (Web application).
   - Authorized JavaScript origins: Add your hosting domain (e.g. Cloud Run URL).
   - Copy Client ID and Client Secret into `.env`.

---

## 2. Google Sheets API Setup

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**.
2. Search for **Google Sheets API** and click **Enable**.
3. Target Spreadsheet Details:
   - **Spreadsheet ID:** `1bONPkd7IlHlzZSH-oVSqa4UVnBp16C7rBNPkhEGUAQk`
   - **Target Tab GID:** `936307973`
4. The application automatically initializes and maintains the 6 required tabs without touching existing rows:
   - `Expenses`: Detailed log of transactions (`expense_id`, `date`, `time`, `month`, `category`, `description`, `amount`, `currency`, `payment_method`, `responsible_person`, `comment`, `created_by`, `status`)
   - `Categories`: Available categories (`category_id`, `category_name`, `active`, `created_at`)
   - `Monthly Summary`: Month-by-month accounting totals (`month`, `total_expense`, `transaction_count`, `average_transaction`, `daily_average`)
   - `History`: Permanent audit log (`history_id`, `expense_id`, `action`, `old_value`, `new_value`, `user_email`, `timestamp`, `reason`)
   - `Users`: Whitelist permissions (`email`, `role`, `active`)
   - `Settings`: 3-month window configuration (`setting`, `value`)

---

## 3. Required Google Scopes

- `https://www.googleapis.com/auth/spreadsheets`: Full read and write access to create sheets, append expense rows, and update summaries.
- `email`: Authenticate and verify user whitelist (`4g.sudoer@gmail.com` vs `indigokids007@gmail.com`).
- `profile`: Display user avatar and full name.

---

## 4. Telegram Bot Setup (@Kukukaka8_bot)

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Create or configure `@Kukukaka8_bot`.
3. Copy your API token into the environment variable:
   ```env
   TELEGRAM_BOT_TOKEN="8539361446:AAHLiilwTM_wjLLu-prVx-BYz6LU5wDk4e8"
   TELEGRAM_BOT_USERNAME="Kukukaka8_bot"
   ```
4. Set the webhook by posting to `/api/telegram/set-webhook` or letting the application configure it automatically.
5. In Telegram, sending `/start` to `@Kukukaka8_bot` offers quick interactive buttons:
   - `➕ Add Expense`: Step-by-step interactive wizard (Amount -> Category -> Description -> Payment -> Confirmation).
   - `📊 Dashboard`: Today, Current Month, and 3-Month total expenses.
   - `📅 Monthly Monitoring`: Breakdown for Month 1, 2, and 3.
   - `📜 History`: Latest expense records.
   - `🚀 Open Mini App`: Launches the full Daily Expense Manager inside Telegram.

---

## 5. Telegram Mini App Setup

1. In [@BotFather](https://t.me/BotFather), type `/newapp` or `/myapps` and select `@Kukukaka8_bot`.
2. Configure **Menu Button** -> **Configure Menu Button**:
   - **URL:** `https://your-cloud-run-domain.app`
   - **Title:** `Sarhisob Mini App` or `Daily Expense`
3. When users click the menu button in Telegram, the application opens inside the Telegram WebApp interface with native haptics, theme awareness, and direct synchronization with the same Google Sheets database.

---

## 6. Environment Variables

Create a `.env` file from `.env.example`:

```env
# Google Cloud OAuth & Service Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Google Sheets Database
GOOGLE_SHEETS_ID=1bONPkd7IlHlzZSH-oVSqa4UVnBp16C7rBNPkhEGUAQk
GOOGLE_SHEET_GID=936307973

# Telegram Bot Integration (@Kukukaka8_bot)
TELEGRAM_BOT_TOKEN=8539361446:AAHLiilwTM_wjLLu-prVx-BYz6LU5wDk4e8
TELEGRAM_BOT_USERNAME=Kukukaka8_bot
TELEGRAM_WEBAPP_URL=

# Access Control & Roles
ADMIN_EMAIL=4g.sudoer@gmail.com
AUTHORIZED_EMAILS=4g.sudoer@gmail.com,indigokids007@gmail.com

# Server Session & Runtime
SESSION_SECRET=your_random_secret_string
APP_URL=
```

---

## 7. Deployment & Local Execution

### Local Development
```bash
# Install packages
npm install

# Start Express & Vite server on Port 3000
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

---

## 8. How to Configure the 3-Month Period

1. Log in with the **ADMIN** account (`4g.sudoer@gmail.com`).
2. Navigate to **⚙️ Settings** in the sidebar.
3. Under **3-Month Accounting Period Definition**:
   - Set **Period Start Date** (e.g., `2026-10-01`).
   - Set **Period End Date** (e.g., `2026-12-31`).
   - Define custom labels and dates for:
     - **Month 1:** Name, Start Date, End Date
     - **Month 2:** Name, Start Date, End Date
     - **Month 3:** Name, Start Date, End Date
4. Click **Save Period Settings**.
5. The application will recalculate monthly expense allocations and synchronize the `Settings` tab in Google Sheets.
6. When the end date passes, the system locks new expense entries with an *"Accounting period ended"* banner while keeping all historical data and audit records fully accessible.

---

## 9. How to Add and Change Categories

1. Log in with the **ADMIN** account (`4g.sudoer@gmail.com`).
2. Navigate to **🏷️ Categories** in the sidebar.
3. To add a category:
   - Type category name (e.g. `Legal & Advisory`).
   - Pick a color code.
   - Click **Add Category**.
4. To edit or rename an existing category:
   - Click the pencil icon next to the category.
   - Update the title and press the checkmark.
5. To toggle visibility:
   - Click the **Active / Inactive** toggle badge. Inactive categories are excluded from the expense entry dropdown.
6. Changes are written to the `Categories` tab in Google Sheets and recorded in the `History/Audit Log`.

---

## 10. How to Change Authorized Users

1. The authorization whitelist is enforced both in frontend (`src/types.ts`, `src/lib/firebase.ts`) and backend (`server.ts`).
2. Current authorized accounts:
   - `4g.sudoer@gmail.com` -> **ADMIN** (Add, Edit, Delete, Restore, Categories, Settings, Export, Audit)
   - `indigokids007@gmail.com` -> **USER** (Add, View, Dashboard, Search, History)
3. Any other Google account will see:
   `"Access denied. This application is restricted to authorized users."`
4. To modify or add accounts:
   - In `.env`, update `ADMIN_EMAIL` and `AUTHORIZED_EMAILS`.
   - Update `AUTHORIZED_EMAILS` in `src/types.ts`.
