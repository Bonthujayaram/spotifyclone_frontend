import { useEffect, useState } from 'react';
import { Music2, Play, Pause } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/contexts/PlayerContext';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';
import { cn } from '@/lib/utils';

function toTrack(song: JioSaavnSong): Track {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    image: song.image,
    audioUrl: song.audioUrl,
    duration: song.duration,
    source: 'jiosaavn',
  };
}

const CardSkeleton = () => (
  <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card/60 p-4">
    <div className="skeleton h-8 w-8 shrink-0 rounded-full" />
    <div className="skeleton h-16 w-16 shrink-0 rounded-lg" />
    <div className="flex-1">
      <div className="skeleton mb-2 h-3 w-2/3 rounded" />
      <div className="skeleton h-2.5 w-1/3 rounded" />
    </div>
  </div>
);

const Popular = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, togglePlayPause, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    Promise.all([searchSongs('top hindi songs 2024', 10), searchSongs('top telugu songs 2024', 10)]).then(([hindi, telugu]) => {
      setTracks([...hindi, ...telugu].map(toTrack));
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in px-6 py-6">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Popular</h1>
        <p className="text-sm text-muted-foreground">Most played songs right now</p>
      </div>

      <div className="max-w-2xl space-y-1">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
          : tracks.map((track, index) => {
              const img = track.image || '';
              const artist = track.artist || '';
              const active = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={cn(
                    'group flex cursor-pointer items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-colors hover:bg-accent/65',
                    active && 'border-primary/30 bg-accent/50',
                  )}
                  onClick={() => (active ? togglePlayPause() : playTrack(track, tracks))}
                >
                  <div className="w-6 shrink-0 text-right">
                    <span className={cn('text-sm group-hover:hidden', active ? 'text-primary' : 'text-muted-foreground')}>
                      {active && isPlaying ? <Pause className="ml-auto h-3.5 w-3.5 fill-current" /> : index + 1}
                    </span>
                    <span className="hidden text-muted-foreground group-hover:block">
                      <Play className="ml-auto h-3.5 w-3.5 fill-current" />
                    </span>
                  </div>

                  {img ? (
                    <img src={img} alt={track.title} className="h-14 w-14 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-muted">
                      <Music2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{artist}</p>
                  </div>

                  {track.duration ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                    </span>
                  ) : null}
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default Popular;
