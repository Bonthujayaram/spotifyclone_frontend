import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, Search, ChevronLeft, ChevronRight, Bell, User, Sun, Moon, Download, WifiOff } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomPlayer from './BottomPlayer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));
  const [installPrompt, setInstallPrompt] = useState<DeferredInstallPromptEvent | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved ? saved === 'dark' : system;
  });

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', isDarkTheme);
    html.classList.toggle('light', !isDarkTheme);
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as DeferredInstallPromptEvent);
    };
    const onAppInstalled = () => setInstallPrompt(null);

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const toggleTheme = () => setIsDarkTheme((v) => !v);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" onClick={() => setIsSidebarOpen(false)} />
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <header className="h-16 flex items-center justify-between px-5 gap-4 shrink-0 bg-background/70 border-b border-border/60 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-2">
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {!isMobile && (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
                    title="Back"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(1)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
                    title="Forward"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => navigate('/search')}
              className="app-search-pill flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors flex-1 max-w-xs text-muted-foreground hover:text-foreground border border-border/70"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Search songs, artists...</span>
            </button>

            <div className="flex items-center gap-2">
              {isOffline && (
                <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-[11px] font-medium text-orange-300">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </span>
              )}

              {installPrompt && (
                <button
                  onClick={() => void handleInstall()}
                  title="Install app"
                  className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                aria-pressed={!isDarkTheme}
                title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                className="theme-switch"
              >
                <Moon
                  className={cn(
                    'theme-switch-icon left-2',
                    isDarkTheme ? 'opacity-100 text-foreground/80' : 'opacity-35 text-muted-foreground'
                  )}
                />
                <Sun
                  className={cn(
                    'theme-switch-icon right-2',
                    !isDarkTheme ? 'opacity-100 text-foreground/80' : 'opacity-35 text-muted-foreground'
                  )}
                />
                <span className={cn('theme-switch-thumb', isDarkTheme ? 'translate-x-0' : 'translate-x-6')}>
                  {isDarkTheme ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </span>
              </button>

              <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors">
                <Bell className="w-4 h-4" />
              </button>

              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-background/80 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                {user?.name?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <BottomPlayer />
    </div>
  );
};

export default Layout;
