import { useEffect, useState } from 'react';
import { TrendingUp, Flame, Music2, Play, Pause } from 'lucide-react';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/contexts/PlayerContext';
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
    <div className="skeleton h-14 w-14 shrink-0 rounded" />
    <div className="flex-1">
      <div className="skeleton mb-2 h-3 w-2/3 rounded" />
      <div className="skeleton h-2.5 w-1/3 rounded" />
    </div>
  </div>
);

const CATEGORIES = [
  { key: 'telugu', label: 'Telugu', query: 'trending telugu 2024' },
  { key: 'hindi', label: 'Hindi', query: 'trending hindi 2024' },
  { key: 'tamil', label: 'Tamil', query: 'trending tamil 2024' },
  { key: 'punjabi', label: 'Punjabi', query: 'trending punjabi 2024' },
];

const Trending = () => {
  const [activeTab, setActiveTab] = useState('telugu');
  const [tracks, setTracks] = useState<Record<string, Track[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, true])),
  );
  const { playTrack, togglePlayPause, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    if (tracks[activeTab]) return;
    const current = CATEGORIES.find((c) => c.key === activeTab);
    if (!current) return;

    setLoading((prev) => ({ ...prev, [activeTab]: true }));
    searchSongs(current.query, 20).then((songs) => {
      setTracks((prev) => ({ ...prev, [activeTab]: songs.map(toTrack) }));
      setLoading((prev) => ({ ...prev, [activeTab]: false }));
    });
  }, [activeTab, tracks]);

  const activeTracks = tracks[activeTab] ?? [];
  const isLoading = loading[activeTab];

  return (
    <div className="animate-fade-in px-6 py-6">
      <div className="mb-6">
        <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-foreground">
          <Flame className="h-7 w-7 text-orange-400" /> Trending
        </h1>
        <p className="text-sm text-muted-foreground">What's hot on JioSaavn right now</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              activeTab === cat.key
                ? 'border-primary/40 bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl space-y-1">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
          : activeTracks.map((track, index) => {
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
                  onClick={() => (active ? togglePlayPause() : playTrack(track, activeTracks))}
                >
                  <div className="w-6 shrink-0 text-right">
                    <span className={cn('text-sm group-hover:hidden', active ? 'text-primary' : 'text-muted-foreground')}>
                      {active && isPlaying ? (
                        <Pause className="ml-auto h-3.5 w-3.5 fill-current" />
                      ) : (
                        index + 1
                      )}
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

                  <div className="flex shrink-0 items-center gap-3">
                    {index < 3 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <TrendingUp className="h-3 w-3" /> Hot
                      </span>
                    )}
                    {track.duration ? (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default Trending;
