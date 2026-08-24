import { Play } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';

interface FeedItem {
  track: Track;
  playedAt: string;
}

interface Props {
  title: string;
  items: FeedItem[];
  compact?: boolean;
  showAvatars?: boolean;
  showActions?: boolean;
  scrollable?: boolean;
}

export default function ActivityFeed({
  title,
  items,
  compact = false,
  showAvatars = false,
  showActions = false,
  scrollable = false,
}: Props) {
  const { playTrack } = usePlayer();

  return (
    <div className="h-full rounded-2xl border border-border bg-card/80 p-4 flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </div>

      <div className={cn(compact ? 'space-y-2' : 'space-y-3', scrollable && 'min-h-0 overflow-y-auto pr-1')}>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-accent/35 px-3 py-2 transition hover:bg-accent/65"
          >
            {showAvatars && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs text-foreground">
                FR
              </div>
            )}

            <img
              src={item.track.image || item.track.artwork?.['150x150'] || '/placeholder.svg'}
              alt={item.track.title}
              className="h-12 w-12 rounded-lg object-cover"
              loading="lazy"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{item.track.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {item.track.artist || item.track.user?.name || 'Unknown'} - {new Date(item.playedAt).toLocaleDateString()}
              </div>
            </div>

            {showActions && <button className="text-sm text-muted-foreground hover:text-foreground">Follow</button>}

            <button onClick={() => playTrack(item.track)} className="rounded-full bg-accent p-2 transition hover:bg-accent/80">
              <Play className="h-4 w-4" />
            </button>
          </div>
        ))}

        {!items.length && <div className="px-2 py-4 text-sm text-muted-foreground">No activity yet.</div>}
      </div>
    </div>
  );
}
