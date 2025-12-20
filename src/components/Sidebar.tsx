import { Link, useLocation } from 'react-router-dom';
import { Search, User, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();
  const isMobile = useIsMobile();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Library', icon: '📚' },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <aside className={cn(
      "w-60 h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col",
      isMobile && "fixed z-50 transition-transform duration-300 ease-in-out",
      isMobile && !isOpen && "-translate-x-full",
      isMobile && isOpen && "translate-x-0"
    )}>
      {isMobile && (
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-center">
          <Link to="/" className="block">
            <img 
              src="/echovibe2.png" 
              alt="EchoVibe" 
              className="h-28 w-auto transform hover:scale-105 transition-transform duration-200" 
            />
          </Link>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const IconComponent = typeof item.icon === 'string' ? null : item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {typeof item.icon === 'string' ? (
                <span className="text-xl">{item.icon}</span>
              ) : IconComponent ? (
                <IconComponent className="w-5 h-5" />
              ) : null}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => {
            if (isMobile && onClose) {
              onClose();
            }
            logout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-music p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-white mb-2">Premium</p>
          <p className="text-xs text-white/80 mb-3">Unlimited music, no ads</p>
          <button className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white py-2 rounded-full text-sm font-medium transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
