import { Play, Heart, X } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';

interface MusicCardProps {
  track: Track;
  playlist?: Track[];
  className?: string;
  /** Shown as a remove button on hover. Used by playlist pages. */
  onRemove?: () => void;
}

function getImage(track: Track): string {
  return track.image || track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
}

function getArtist(track: Track): string {
  return track.artist || track.user?.name || 'Unknown Artist';
}

const MusicCard = ({ track, playlist, className, onRemove }: MusicCardProps) => {
  const { playTrack, currentTrack, isPlaying, toggleFavorite, isFavorite } = usePlayer();

  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const imgSrc = getImage(track);
  const artist = getArtist(track);
  const fav = isFavorite(track.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTrack(track, playlist);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      className={cn('music-card p-4 w-[175px] min-w-[175px] group', className)}
      onClick={() => playTrack(track, playlist)}
    >
      <div className="relative aspect-square rounded overflow-hidden mb-3 shadow-lg">
        {imgSrc ? (
          <img src={imgSrc} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-lg text-muted-foreground">No Art</span>
          </div>
        )}

        <button
          className={cn('play-overlay', isCurrentlyPlaying && 'opacity-100 translate-y-0 bg-[#1DB954]')}
          onClick={handlePlay}
        >
          <Play className="w-5 h-5 text-black fill-current ml-0.5" />
        </button>

        {isCurrentlyPlaying && (
          <div className="absolute top-2 left-2 flex gap-0.5 items-end h-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 bg-[#1DB954] rounded-sm animate-pulse"
                style={{
                  height: `${10 + i * 4}px`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className={cn('text-sm font-medium truncate leading-tight', isCurrentlyPlaying ? 'text-[#1DB954]' : 'text-foreground')}>
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{artist}</p>
      </div>

      <button
        onClick={handleFavorite}
        className={cn(
          'absolute top-3 right-3 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
          fav ? 'text-yellow-400' : 'text-muted-foreground hover:text-foreground',
        )}
        title={fav ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        <Heart className={cn('w-4 h-4', fav && 'fill-current')} />
      </button>

      {onRemove && (
        <button
          onClick={handleRemove}
          className="absolute top-3 right-10 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          title="Remove from playlist"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MusicCard;
