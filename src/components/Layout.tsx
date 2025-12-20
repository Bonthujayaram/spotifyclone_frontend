import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomPlayer from './BottomPlayer';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-[#121212]">
      {isMobile && (
        <div className="h-16 flex items-center px-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-[#121212] relative">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.2)]" />
          <div className="relative z-10 h-full">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomPlayer />
    </div>
  );
};

export default Layout;
