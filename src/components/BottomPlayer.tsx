import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, Volume1, VolumeX,
  Heart, ListMusic, ScrollText, RefreshCw, Loader2
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLyrics, type LyricsResult } from '@/services/lyricsService';

// ── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/** Returns the best image URL from a Track, supporting both JioSaavn and Audius shapes */
function trackImage(track: ReturnType<typeof usePlayer>['currentTrack']): string {
  if (!track) return '';
  return track.image || track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
}

/** Returns the artist name from a Track */
function trackArtist(track: ReturnType<typeof usePlayer>['currentTrack']): string {
  if (!track) return '';
  return track.artist || track.user?.name || 'Unknown Artist';
}

function shouldFetchLyrics(track: ReturnType<typeof usePlayer>['currentTrack']): boolean {
  if (!track) return false;
  if (track.source === 'creator') return false;

  const artist = trackArtist(track).trim();
  if (!artist) return false;
  if (/^(unknown artist|you)$/i.test(artist)) return false;

  return Boolean(track.title.trim());
}

// ── Component ─────────────────────────────────────────────────────────────
const BottomPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    pauseTrack,
    resumeTrack,
    nextTrack,
    previousTrack,
    toggleLike,
    isLiked,
    toggleFavorite,
    isFavorite,
    volume,
    setVolume,
    currentTime,
    duration,
    seekTo,
    shuffle,
    toggleShuffle,
    repeat,
    toggleRepeat,
  } = usePlayer();

  const [prevVolume, setPrevVolume] = useState(80);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsSource, setLyricsSource] = useState<LyricsResult['source'] | ''>('');
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lyricsKeyRef = useRef<string>('');

  // Sync volume on mount
  useEffect(() => {
    if (volume > 0) setPrevVolume(volume);
  }, [volume]);

  // ── Seekbar click / drag ───────────────────────────────────────────────
  const getSeekTime = useCallback(
    (clientX: number) => {
      if (!seekBarRef.current || !duration) return 0;
      const rect = seekBarRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pct * duration;
    },
    [duration],
  );

  const handleSeekMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    seekTo(getSeekTime(e.clientX));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging.current) seekTo(getSeekTime(e.clientX));
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [getSeekTime, seekTo]);

  // ── Volume ────────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const loadLyrics = useCallback(
    async (force = false) => {
      if (!currentTrack) return;

      const key = `${currentTrack.id}:${currentTrack.title}:${trackArtist(currentTrack)}`;
      if (!force && lyricsKeyRef.current === key && (lyricsText || lyricsError)) return;

      lyricsKeyRef.current = key;
      if (!shouldFetchLyrics(currentTrack)) {
        setLyricsLoading(false);
        setLyricsText('');
        setLyricsSource('');
        setLyricsError(
          currentTrack.source === 'creator'
            ? 'Lyrics are not available for uploaded tracks yet.'
            : 'Lyrics are not available for this track yet.',
        );
        return;
      }

      setLyricsLoading(true);
      setLyricsError(null);

      try {
        const result = await getLyrics(currentTrack.title, trackArtist(currentTrack), currentTrack.source);
        if (!result) {
          setLyricsText('');
          setLyricsSource('');
          setLyricsError('Lyrics are not available for this track yet.');
          return;
        }

        setLyricsText(result.text);
        setLyricsSource(result.source);
        setLyricsError(null);
      } catch (error) {
        console.error('[BottomPlayer] Lyrics fetch failed:', error);
        setLyricsText('');
        setLyricsSource('');
        setLyricsError('Failed to load lyrics. Try again.');
      } finally {
        setLyricsLoading(false);
      }
    },
    [currentTrack, lyricsError, lyricsText],
  );

  useEffect(() => {
    if (!currentTrack) return;
    setLyricsText('');
    setLyricsSource('');
    setLyricsError(null);
    lyricsKeyRef.current = '';
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!lyricsOpen || !currentTrack) return;
    void loadLyrics(false);
  }, [lyricsOpen, currentTrack?.id, loadLyrics]);

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const liked = isLiked(currentTrack.id);
  const fav = isFavorite(currentTrack.id);

  return (
    <>
      <div className="h-[90px] bg-card/95 border-t border-border/70 backdrop-blur-xl px-4 flex items-center gap-4 shrink-0 z-50">

      {/* ── Left: track info ─────────────────────────────────── */}
      <div className="flex items-center gap-3 w-[30%] min-w-0">
        {trackImage(currentTrack) && (
          <img
            src={trackImage(currentTrack)}
            alt={currentTrack.title}
            className="w-14 h-14 rounded object-cover shadow-lg"
          />
        )}
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-muted-foreground text-xs truncate mt-0.5">
            {trackArtist(currentTrack)}
          </p>
        </div>
        {/* Like / Favorite */}
        <button
          onClick={() => toggleLike(currentTrack)}
          className={cn('ml-2 p-1.5 rounded transition-colors hover:text-foreground', liked ? 'text-[#1DB954]' : 'text-muted-foreground')}
          title={liked ? 'Unlike' : 'Like'}
        >
          <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
        </button>
        <button
          onClick={() => toggleFavorite(currentTrack)}
          className={cn('p-1.5 rounded transition-colors hover:text-foreground', fav ? 'text-yellow-400' : 'text-muted-foreground')}
          title={fav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>

      {/* ── Center: controls + seekbar ───────────────────────── */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-[45%]">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            className={cn('p-1.5 transition-colors', shuffle ? 'text-[#1DB954]' : 'text-muted-foreground hover:text-foreground')}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={previousTrack}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={isPlaying ? pauseTrack : resumeTrack}
            className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-primary-foreground fill-current" />
            ) : (
              <Play className="w-4 h-4 text-primary-foreground fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={cn('p-1.5 transition-colors', repeat ? 'text-[#1DB954]' : 'text-muted-foreground hover:text-foreground')}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Seekbar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-muted-foreground text-xs w-8 text-right">{formatTime(currentTime)}</span>
          <div
            ref={seekBarRef}
            className="seek-bar flex-1"
            onMouseDown={handleSeekMouseDown}
          >
            <div className="seek-bar-fill" style={{ width: `${progress}%` }} />
            <div className="seek-bar-thumb" style={{ left: `${progress}%` }} />
          </div>
          <span className="text-muted-foreground text-xs w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Right: volume ────────────────────────────────────── */}
      <div className="flex items-center gap-2 w-[20%] justify-end">
        <button
          onClick={() => setLyricsOpen(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
          title="Show lyrics"
        >
          <ScrollText className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
        >
          <VolumeIcon className="w-4 h-4" />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 rounded-full appearance-none cursor-pointer accent-[#1DB954]"
          style={{
            background: `linear-gradient(to right, #1DB954 ${volume}%, var(--surface-strong) ${volume}%)`,
          }}
          title="Volume"
        />
      </div>
      </div>

      <Sheet open={lyricsOpen} onOpenChange={setLyricsOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border/70 px-5 py-4">
            <SheetTitle className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              Lyrics
            </SheetTitle>
            <SheetDescription>
              {currentTrack.title} - {trackArtist(currentTrack)}
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
            <button
              onClick={() => void loadLyrics(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh lyrics
            </button>
            {lyricsSource ? (
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">source: {lyricsSource}</span>
            ) : null}
          </div>

          <ScrollArea className="h-[calc(100vh-170px)] px-5 py-4">
            {lyricsLoading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading lyrics...
              </div>
            ) : lyricsError ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {lyricsError}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground font-sans">
                {lyricsText}
              </pre>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BottomPlayer;
