import { Play, Pause, Heart, Share2, MoreVertical, TrendingUp } from 'lucide-react';
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

interface HorizontalMusicCardProps {
  track: Track;
  playlist?: Track[];
  index?: number;
  showTrending?: boolean;
  onRemove?: () => Promise<void>;
}

const HorizontalMusicCard = ({ track, playlist, index, showTrending = false, onRemove }: HorizontalMusicCardProps) => {
  const { playTrack, isPlaying, currentTrack, togglePlayPause, toggleLike, isLiked } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { toast } = useToast();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackLiked = isLiked(track.id);

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

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track, playlist);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(track);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
      {typeof index === 'number' && (
        <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full text-primary font-bold text-sm">
          {index + 1}
        </div>
      )}
      <img 
        src={track.artwork?.['150x150'] || '/placeholder.svg'} 
        alt={track.title} 
        className="w-16 h-16 rounded-lg object-cover" 
      />
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-medium truncate",
          isCurrentTrack && isPlaying ? "text-primary" : "text-white"
        )}>
          {track.title}
        </h3>
        <p className="text-gray-400 text-sm">{track.user?.name}</p>
        {showTrending && (
          <div className="flex items-center gap-4 mt-1">
            <span className="text-gray-400 text-xs">{track.play_count?.toLocaleString()} plays</span>
            {track.trending && (
              <span className="text-green-500 text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{track.trending}%
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "text-gray-400 hover:text-red-500",
            isTrackLiked && "text-red-500"
          )}
          onClick={handleLike}
        >
          <Heart className={cn("w-4 h-4", isTrackLiked && "fill-current")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:text-white"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
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
          size="icon" 
          className="w-10 h-10 bg-primary rounded-full hover:scale-110 transition-transform"
          onClick={handlePlay}
        >
          {isCurrentTrack && isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default HorizontalMusicCard; 