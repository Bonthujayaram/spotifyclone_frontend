import { Heart, Play } from 'lucide-react';
import type { Track } from '@/contexts/PlayerContext';
import { usePlayer } from '@/contexts/PlayerContext';

interface Props {
  tracks: Track[];
}

const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return '-';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

export default function LikedSongsTable({ tracks }: Props) {
  const { playTrack, isLiked, toggleLike } = usePlayer();

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border bg-card/80">
      <div className="h-full min-h-0 max-h-full overflow-y-auto overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-border/80 bg-card/95 text-sm text-muted-foreground backdrop-blur">
            <tr>
              <th className="w-12 px-4 py-3">#</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Artist</th>
              <th className="w-24 px-4 py-3">Duration</th>
              <th className="w-24 px-4 py-3 text-center">Like</th>
              <th className="w-24 px-4 py-3 text-center">Play</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {tracks.map((t, idx) => (
              <tr key={t.id} className="border-t border-border/70 transition hover:bg-accent/45">
                <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                <td className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={t.image || t.artwork?.['150x150'] || '/placeholder.svg'}
                    alt={t.title}
                    className="h-12 w-12 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="font-medium text-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.artist || t.user?.name || 'Unknown Artist'}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.artist || t.user?.name || 'Unknown'}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDuration(t.duration)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleLike(t)}
                    className={isLiked(t.id) ? 'rounded-full p-2 text-red-500' : 'rounded-full p-2 text-muted-foreground hover:text-foreground'}
                  >
                    <Heart className={isLiked(t.id) ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => playTrack(t, tracks)} className="rounded-full bg-accent p-2 transition hover:bg-accent/80">
                    <Play className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
