import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authApi } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';

const LAST_PLAYED_KEY = 'lastPlayedTrack';
const FAVORITES_KEY = 'echovibe_favorites';
const INLINE_MEDIA_MAX_LENGTH = 2048;

const compactInlineField = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith('data:') && value.length > INLINE_MEDIA_MAX_LENGTH) {
    return undefined;
  }
  return value;
};

const compactImageMap = <T extends Record<string, string> | undefined>(images: T): T | undefined => {
  if (!images) return undefined;

  const compactEntries = Object.entries(images)
    .map(([key, value]) => [key, compactInlineField(value)] as const)
    .filter(([, value]) => Boolean(value));

  if (compactEntries.length === 0) return undefined;
  return Object.fromEntries(compactEntries) as T;
};

// ── Track type — supports both Audius and JioSaavn shapes ──────────────────
export interface Track {
  id: string;
  title: string;
  // JioSaavn
  artist?: string;
  image?: string;
  audioUrl?: string;
  url?: string;
  // Audius
  user?: {
    id?: string;
    name: string;
    handle?: string;
    profile_picture?: Record<string, string>;
  };
  artwork?: {
    '480x480'?: string;
    '150x150'?: string;
    '1000x1000'?: string;
  };
  streamUrl?: string;
  play_count?: number;
  trending?: number;
  release_date?: string;
  duration?: number;
  // source tracking
  source?: 'jiosaavn' | 'audius' | 'creator';
}

const toCompactTrack = (track: Track): Track => ({
  ...track,
  image: compactInlineField(track.image),
  audioUrl: compactInlineField(track.audioUrl),
  url: compactInlineField(track.url),
  streamUrl: compactInlineField(track.streamUrl),
  artwork: compactImageMap(track.artwork),
  user: track.user
    ? {
        ...track.user,
        profile_picture: compactImageMap(track.user.profile_picture),
      }
    : undefined,
});

// ── Context type ───────────────────────────────────────────────────────────
interface PlayerContextType {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  audioUrl: string | null;
  volume: number;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: boolean;
  autoplayEnabled: boolean;
  likedTracks: Set<string>;
  favorites: Set<string>;
  recentlyPlayed: Track[];
  queue: Track[];

  playTrack: (track: Track, playlist?: Track[]) => Promise<void>;
  pauseTrack: () => void;
  resumeTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setCurrentTrack: (track: Track) => void;
  togglePlayPause: () => Promise<void>;
  toggleLike: (track: Track) => Promise<void>;
  isLiked: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  setVolume: (v: number) => void;
  seekTo: (time: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setAutoplayEnabled: (enabled: boolean) => void;
  addToQueue: (track: Track) => void;
  getRecentlyPlayed: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [autoplayEnabled, setAutoplayEnabledState] = useState(true);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const { toast } = useToast();

  const persistLastPlayedTrack = useCallback((track: Track) => {
    try {
      localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(toCompactTrack(track)));
    } catch (error) {
      console.warn('Unable to persist last played track:', error);
      try {
        localStorage.removeItem(LAST_PLAYED_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    }
  }, []);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // ── Load favorites from localStorage ─────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  // ── Load liked songs + recently played from backend ───────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [{ likedSongs }, recentlyPlayedRes, settingsRes] = await Promise.all([
          authApi.getLikedSongs(token),
          authApi.getRecentlyPlayed(token),
          authApi.getSettings(token),
        ]);
        setLikedTracks(new Set(likedSongs.map((s) => s.id)));
        if (recentlyPlayedRes.recentlyPlayed) {
          setRecentlyPlayed(recentlyPlayedRes.recentlyPlayed.map((i) => i.track));
        }
        setAutoplayEnabledState(settingsRes.settings?.autoplay ?? true);
        localStorage.setItem('audio_quality', settingsRes.settings?.audioQuality || 'auto');
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // ── Restore last played track ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
      if (lastPlayed) {
        const track = JSON.parse(lastPlayed);
        setCurrentTrack(track);
        setPlaylist([track]);
      }
    } catch { localStorage.removeItem(LAST_PLAYED_KEY); }
  }, []);

  // ── Create global audio element ───────────────────────────────────────────
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.id = 'music-player';
    audio.volume = volume / 100;
    document.body.appendChild(audio);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Resolve stream URL — JioSaavn tracks already have audioUrl ──────────
  const loadAudioUrl = useCallback(async (track: Track): Promise<boolean> => {
    try {
      // JioSaavn track: always has audioUrl
      if (track.audioUrl) {
        setAudioUrl(track.audioUrl);
        if (audioRef.current) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.load();
        }
        return true;
      }
      // JioSaavn fallback: some results provide `url`
      if (track.url) {
        setAudioUrl(track.url);
        if (audioRef.current) {
          audioRef.current.src = track.url;
          audioRef.current.load();
        }
        return true;
      }
      // Audius track with pre-resolved stream URL
      if (track.streamUrl) {
        setAudioUrl(track.streamUrl);
        if (audioRef.current) {
          audioRef.current.src = track.streamUrl;
          audioRef.current.load();
        }
        return true;
      }
      // No automatic Audius lookup — only use provided `audioUrl` or `streamUrl`.
      // No playable URL available
      console.error('[PlayerContext] No audio URL found for track:', track.id, track.title);
      return false;
    } catch (error) {
      console.error('Error loading audio URL:', error);
      return false;
    }
  }, []);

  // ── Recently played (backend) ─────────────────────────────────────────────
  const addToRecentlyPlayed = useCallback(async (track: Track) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await authApi.addToRecentlyPlayed(token, toCompactTrack(track));
      const response = await authApi.getRecentlyPlayed(token);
      if (response.recentlyPlayed) {
        setRecentlyPlayed(response.recentlyPlayed.map((i) => i.track));
      }
    } catch (error) {
      console.error('Error updating recently played:', error);
    }
  }, []);

  const recordCreatorEvent = useCallback(async (
    track: Track,
    event: 'play' | 'skip' | 'complete',
    listenSeconds = 0,
  ) => {
    if (track.source !== 'creator') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await authApi.recordCreatorTrackEvent(token, track.id, {
        event,
        listenSeconds: Math.max(0, Math.round(listenSeconds)),
      });
    } catch (error) {
      console.error('Error recording creator event:', error);
    }
  }, []);

  const maybeRecordSkip = useCallback(() => {
    const playingTrack = currentTrackRef.current;
    if (!playingTrack || playingTrack.source !== 'creator' || !isPlayingRef.current) return;

    const listened = Math.max(0, currentTimeRef.current || 0);
    if (listened <= 0) return;

    const totalDuration = Math.max(0, durationRef.current || playingTrack.duration || 0);
    const completionThreshold = totalDuration > 0 ? totalDuration * 0.9 : 45;
    if (listened < completionThreshold) {
      void recordCreatorEvent(playingTrack, 'skip', listened);
    }
  }, [recordCreatorEvent]);

  // ── Play a track ────────────────────────────────────────────────────────
  const playTrack = useCallback(async (track: Track, newPlaylist?: Track[]) => {
    try {
      maybeRecordSkip();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const success = await loadAudioUrl(track);
      if (success && audioRef.current) {
        setCurrentTrack(track);
        persistLastPlayedTrack(track);
        setPlaylist(newPlaylist ?? [track]);
        setIsPlaying(true);
        addToRecentlyPlayed(track);
        if (track.source === 'creator') {
          void recordCreatorEvent(track, 'play');
        }
        try {
          await audioRef.current.play();
        } catch (e) {
          console.error('Playback error:', e);
          setIsPlaying(false);
        }
      } else {
        toast({ title: 'Playback Error', description: 'Could not load audio for this track.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
    }
  }, [maybeRecordSkip, loadAudioUrl, persistLastPlayedTrack, addToRecentlyPlayed, recordCreatorEvent, toast]);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeTrack = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    try {
      if (!audioRef.current.src) await loadAudioUrl(currentTrack);
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [currentTrack, loadAudioUrl]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) pauseTrack();
    else await resumeTrack();
  }, [isPlaying, pauseTrack, resumeTrack]);

  // ── Next / Previous with shuffle support ──────────────────────────────────
  const nextTrack = useCallback(async () => {
    if (!currentTrack || playlist.length === 0) return;
    // If there's a queue, pop from it first
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      await playTrack(next, playlist);
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    await playTrack(playlist[nextIndex], playlist);
  }, [currentTrack, playlist, queue, shuffle, playTrack]);

  const previousTrack = useCallback(async () => {
    if (!currentTrack || playlist.length === 0) return;
    // If more than 3 seconds in, restart track instead
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    await playTrack(playlist[prevIndex], playlist);
  }, [currentTrack, playlist, playTrack]);

  // ── Audio event: ended ────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = async () => {
      const endedTrack = currentTrackRef.current;
      if (endedTrack?.source === 'creator') {
        void recordCreatorEvent(
          endedTrack,
          'complete',
          Math.max(currentTimeRef.current || 0, endedTrack.duration || 0),
        );
      }
      if (repeat) {
        audio.currentTime = 0;
        await audio.play();
      } else if (autoplayEnabled) {
        await nextTrack();
      } else {
        setIsPlaying(false);
      }
    };
    const handleError = () => {
      console.error('Audio element error');
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [autoplayEnabled, nextTrack, recordCreatorEvent, repeat]);

  // ── Volume ────────────────────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  }, []);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // ── Shuffle / Repeat ──────────────────────────────────────────────────────
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);
  const setAutoplayEnabled = useCallback((enabled: boolean) => {
    setAutoplayEnabledState(Boolean(enabled));
  }, []);

  // ── Queue ─────────────────────────────────────────────────────────────────
  const addToQueue = useCallback((track: Track) => {
    setQueue((q) => [...q, track]);
    toast({ title: 'Added to Queue', description: track.title });
  }, [toast]);

  // ── Liked songs (backend) ─────────────────────────────────────────────────
  const toggleLike = useCallback(async (track: Track) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Error', description: 'Please log in to like songs', variant: 'destructive' });
      return;
    }
    try {
      const action = likedTracks.has(track.id) ? 'unlike' : 'like';
      const { likedSongs } = await authApi.likeSong(token, toCompactTrack(track), action);
      setLikedTracks(new Set(likedSongs.map((s) => s.id)));
      toast({
        title: action === 'like' ? 'Added to Liked Songs' : 'Removed from Liked Songs',
        description: `${track.title} ${action === 'like' ? 'liked' : 'unliked'}`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update liked songs', variant: 'destructive' });
    }
  }, [likedTracks, toast]);

  const isLiked = useCallback((trackId: string) => likedTracks.has(trackId), [likedTracks]);

  // ── Favorites (localStorage) ──────────────────────────────────────────────
  const toggleFavorite = useCallback((track: Track) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(track.id)) {
        next.delete(track.id);
        toast({ title: 'Removed from Favorites', description: track.title });
      } else {
        next.add(track.id);
        toast({ title: 'Added to Favorites', description: track.title });
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [toast]);

  const isFavorite = useCallback((trackId: string) => favorites.has(trackId), [favorites]);

  // ── Recently played (backend refresh) ────────────────────────────────────
  const getRecentlyPlayed = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authApi.getRecentlyPlayed(token);
      if (response.recentlyPlayed) {
        setRecentlyPlayed(response.recentlyPlayed.map((i) => i.track));
      }
    } catch { /* ignore */ }
  }, []);

  const value: PlayerContextType = {
    currentTrack,
    playlist,
    isPlaying,
    audioUrl,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat,
    autoplayEnabled,
    likedTracks,
    favorites,
    recentlyPlayed,
    queue,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    previousTrack,
    setCurrentTrack,
    togglePlayPause,
    toggleLike,
    isLiked,
    toggleFavorite,
    isFavorite,
    setVolume,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    setAutoplayEnabled,
    addToQueue,
    getRecentlyPlayed,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
};
