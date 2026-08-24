import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Heart, TrendingUp, Radio, Music, LogOut, PlusCircle, Bot, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import SmartDiscoveryMap from '@/components/discovery/SmartDiscoveryMap';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_MAIN = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/search', label: 'Search', Icon: Search },
  { href: '/library', label: 'Your Library', Icon: Library },
];

const NAV_PLAYLISTS = [
  { href: '/library', label: 'Liked Songs', Icon: Heart },
  { href: '/trending', label: 'Trending', Icon: TrendingUp },
  { href: '/feed', label: 'Feed', Icon: Radio },
  { href: '/creator-studio', label: 'Creator Studio', Icon: Mic2 },
];

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  if (isMobile && !isOpen) return null;

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-60 shrink-0 select-none border-r border-border/70',
        'bg-card/95 backdrop-blur-xl',
        isMobile && 'fixed inset-y-0 left-0 z-50 transition-transform duration-300',
        isMobile && !isOpen && '-translate-x-full',
      )}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Link to="/" className="flex items-center gap-2" onClick={isMobile ? onClose : undefined}>
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
            <Music className="w-4 h-4 text-black" />
          </div>
          <span className="text-foreground font-bold text-xl tracking-tight">EchoVibe</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-1">
        {NAV_MAIN.map(({ href, label, Icon }) => (
          <Link
            key={href}
            to={href}
            onClick={isMobile ? onClose : undefined}
            className={cn(
              'nav-link',
              isActive(href) && 'active text-foreground font-semibold bg-accent',
            )}
          >
            <Icon
              className={cn('w-5 h-5 shrink-0', isActive(href) ? 'text-foreground' : 'text-muted-foreground')}
              strokeWidth={isActive(href) ? 2.5 : 2}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-4 border-t border-border/70" />

      {/* Playlists / Library section */}
      <div className="px-3 flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Your Library</span>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {NAV_PLAYLISTS.map(({ href, label, Icon }) => (
            <Link
              key={label}
              to={href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                'nav-link',
                isActive(href) && label === 'Liked Songs' && 'active text-foreground font-semibold bg-accent',
              )}
            >
              {label === 'Liked Songs' ? (
                <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-purple-700 to-blue-400 flex items-center justify-center shrink-0">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5 shrink-0 text-muted-foreground" />
              )}
              {label}
            </Link>
          ))}
          <SmartDiscoveryMap triggerVariant="sidebar" />
          <Link
            to="/ai-dj"
            onClick={isMobile ? onClose : undefined}
            className={cn(
              'nav-link w-full justify-start text-left',
              'rounded-md border border-border/60 bg-accent/25 hover:bg-accent/55 hover:text-foreground',
              isActive('/ai-dj') && 'border-primary/40 bg-primary/10 text-primary',
            )}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <span>AI DJ Host</span>
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">NEW</span>
          </Link>
        </div>
      </div>

      {/* User section */}
      <div className="p-3 border-t border-border/70 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm text-foreground font-medium truncate flex-1">{user?.name ?? 'User'}</span>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
