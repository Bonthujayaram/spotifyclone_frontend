import { Play, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Track } from '@/contexts/PlayerContext';

const Popular = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ['popular'],
    queryFn: () => api.getPopular(20),
  });

  const tracks = response?.data || [];

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Popular</h1>
        <p className="text-gray-400">Most played tracks on StreamTunes</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No tracks found
        </div>
      ) : (
        <div className="grid gap-4">
          {tracks.map((track: Track, index: number) => (
            <div key={track.id} className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full text-primary font-bold text-sm">
                {index + 1}
              </div>
              <img 
                src={track.artwork?.['150x150'] || '/placeholder.svg'} 
                alt={track.title} 
                className="w-16 h-16 rounded-lg object-cover" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{track.title}</h3>
                <p className="text-gray-400 text-sm">{track.user?.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-gray-400 text-xs">{track.play_count?.toLocaleString()} plays</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button size="icon" className="w-10 h-10 bg-primary rounded-full hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Popular; 