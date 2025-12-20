import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

interface ScrollableSectionProps {
  children: React.ReactNode;
  className?: string;
  showAllLink?: string;
  title?: string;
}

const ScrollableSection = ({ children, className, showAllLink, title }: ScrollableSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = direction === 'left' ? -800 : 800;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between mb-4">
        {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
        {showAllLink && (
          <Link 
            to={showAllLink}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Show all
          </Link>
        )}
      </div>

      <div className="relative group">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-4 pb-4 min-w-full">
            {children}
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};

export default ScrollableSection;
