// Google Identity Services injects `window.google` from a remote script. Only
// the surface this app touches is declared.
export interface GoogleIdentityConfig {
  client_id: string | null;
  callback: (response: { credential?: string }) => void;
  ux_mode?: 'popup' | 'redirect';
}

export interface GoogleButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  width?: number;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: GoogleIdentityConfig) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const GOOGLE_SCRIPT_ID = 'google-identity-services';

export interface GoogleAuthAvailability {
  enabled: boolean;
  clientId: string | null;
  reason: string | null;
}

const parseAllowedOrigins = (value?: string): string[] =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const getGoogleAuthAvailability = (): GoogleAuthAvailability => {
  const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true';
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const allowedOrigins = parseAllowedOrigins(import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS);
  const currentOrigin = window.location.origin;
  const isLocalHost = LOCAL_HOSTS.has(window.location.hostname);

  if (!googleEnabled) {
    return { enabled: false, clientId: null, reason: null };
  }

  if (!clientId) {
    return {
      enabled: false,
      clientId: null,
      reason: 'Google sign-in is not configured yet.',
    };
  }

  if (allowedOrigins.length > 0 && !allowedOrigins.includes(currentOrigin)) {
    return {
      enabled: false,
      clientId: null,
      reason: `Google sign-in is not enabled for ${currentOrigin}. Use an allowed origin or update VITE_GOOGLE_ALLOWED_ORIGINS.`,
    };
  }

  if (isLocalHost && allowedOrigins.length === 0) {
    return {
      enabled: false,
      clientId: null,
      reason: `Google sign-in is disabled on ${currentOrigin} until this origin is allowed in Google Cloud Console.`,
    };
  }

  return {
    enabled: true,
    clientId,
    reason: null,
  };
};

export const loadGoogleIdentityScript = async (): Promise<void> => {
  if (window.google?.accounts?.id) return;

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google sign-in script')), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in script'));
    document.head.appendChild(script);
  });
};
