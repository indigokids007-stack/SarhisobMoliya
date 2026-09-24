/**
 * Telegram Mini App (TMA) WebApp Bridge
 * Interacts with window.Telegram.WebApp for native Telegram Mini App integration.
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: string;
          hash?: string;
          start_param?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

/**
 * Returns true if the app is currently running inside an actual Telegram client
 */
export function isRunningInTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  const webApp = window.Telegram?.WebApp;
  return Boolean(
    webApp && (Boolean(webApp.initData) || (webApp.platform && webApp.platform !== 'unknown'))
  );
}

/**
 * Retrieves the current Telegram WebApp instance
 */
export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Retrieves Telegram user info if authenticated via Telegram Mini App
 */
export function getTelegramUser(): TelegramUser | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

/**
 * Initializes and expands the Telegram WebApp viewport
 */
export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      webApp.ready();
      webApp.expand();
    } catch (e) {
      console.warn('Telegram WebApp init warning:', e);
    }
  }
}

/**
 * Triggers native haptic feedback on Telegram mobile clients
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'): void {
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  if (!haptic) return;

  try {
    if (style === 'success' || style === 'error') {
      haptic.notificationOccurred(style);
    } else {
      haptic.impactOccurred(style);
    }
  } catch {}
}
