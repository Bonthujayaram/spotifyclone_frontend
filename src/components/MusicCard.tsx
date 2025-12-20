import { Play, Pause, Heart, Share2, MoreVertical } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';
import type { Track } from '@/contexts/PlayerContext';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

interface MusicCardProps {
  track?: Track;
  playlist?: Track[];
  className?: string;
  // Additional props for non-track use cases
  title?: string;
  subtitle?: string;
  image?: string;
  onRemove?: () => Promise<void>;
}

const MusicCard = ({ track, playlist, className, title: customTitle, subtitle: customSubtitle, image: customImage, onRemove }: MusicCardProps) => {
  const { playTrack, isPlaying, currentTrack, togglePlayPause, toggleLike, isLiked } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadPlaylists = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const { playlists } = await authApi.getPlaylists(token);
        setPlaylists(playlists);
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
    };

    loadPlaylists();
  }, []);

  const isCurrentTrack = track && currentTrack?.id === track.id;
  const displayTitle = track?.title || customTitle;
  const displaySubtitle = track?.user?.name || customSubtitle;
  const displayImage = track?.artwork?.['480x480'] || customImage || '/placeholder.svg';
  const isTrackLiked = track ? isLiked(track.id) : false;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) return;
    
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track, playlist);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) return;
    toggleLike(track);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) return;
    
    try {
      await navigator.share({
        title: track.title,
        text: `Check out ${track.title} by ${track.user.name}`,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await authApi.addToPlaylist(token, playlistId, track);
      toast({
        title: "Success",
        description: "Track added to playlist",
      });
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add track to playlist",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className={cn(
        "flex-shrink-0 relative bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200",
        "w-[200px]",
        className
      )}
    >
      <div className="p-3">
        <div className="aspect-square mb-3 rounded-md overflow-hidden relative group/card">
          <img 
            src={displayImage}
            alt={displayTitle}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              "group-hover/card:brightness-75"
            )}
          />
          <div className={cn(
            "absolute right-2 bottom-2 flex items-center gap-2",
            "opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200",
            isCurrentTrack && "opacity-100 translate-y-0"
          )}>
            {track && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-8 h-8 bg-black/50 hover:bg-black/70",
                    isTrackLiked ? "text-primary" : "text-white"
                  )}
                  onClick={handleLike}
                >
                  <Heart className={cn("w-4 h-4", isTrackLiked && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {playlists.length === 0 ? (
                      <DropdownMenuItem disabled>No playlists available</DropdownMenuItem>
                    ) : (
                      playlists.map((playlist) => (
                        <DropdownMenuItem
                          key={playlist._id}
                          onClick={() => handleAddToPlaylist(playlist._id)}
                        >
                          {playlist.name}
                        </DropdownMenuItem>
                      ))
                    )}
                    {onRemove && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemove();
                          }}
                        >
                          Remove from Playlist
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handlePlay}
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="space-y-1 min-h-[3rem]">
          <h3 
            className={cn(
              "font-medium line-clamp-1 transition-colors duration-200",
              isCurrentTrack && isPlaying ? "text-primary" : "text-white"
            )}
            title={displayTitle}
          >
            {displayTitle}
          </h3>
          {displaySubtitle && (
            <p 
              className="text-sm text-gray-400 line-clamp-1"
              title={displaySubtitle}
            >
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicCard;


