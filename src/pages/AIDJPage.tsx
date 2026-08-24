import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock3,
  Bot,
  Flame,
  Gauge,
  Loader2,
  ListPlus,
  Mic2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer, type Track } from '@/contexts/PlayerContext';
import { useToast } from '@/hooks/use-toast';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';

type TasteProfile = {
  id: string;
  label: string;
  query: string;
  keywords: string[];
};

type PerformancePresetId = 'warmup' | 'club' | 'peak';

type PerformancePreset = {
  id: PerformancePresetId;
  label: string;
  summary: string;
  crossfader: number;
  deckALevel: number;
  deckBLevel: number;
  masterVolume: number;
  energy: number;
  autoMixWindow: number;
};

const TASTE_PROFILES: TasteProfile[] = [
  { id: 'telugu', label: 'Telugu Hits', query: 'latest telugu hits', keywords: ['telugu', 'tollywood', 'hyderabad'] },
  { id: 'hindi', label: 'Hindi Pop', query: 'latest hindi hits', keywords: ['hindi', 'bollywood'] },
  { id: 'tamil', label: 'Tamil Hits', query: 'latest tamil hits', keywords: ['tamil', 'kollywood', 'chennai'] },
  { id: 'punjabi', label: 'Punjabi Bangers', query: 'latest punjabi hits', keywords: ['punjabi'] },
  { id: 'k-pop', label: 'K-Pop', query: 'k-pop trending', keywords: ['k-pop', 'kpop', 'korean'] },
  { id: 'hip-hop', label: 'Hip-Hop', query: 'global hip hop trending', keywords: ['hip hop', 'rap', 'trap'] },
];

const DEFAULT_TASTE: TasteProfile = {
  id: 'global',
  label: 'Global Top Picks',
  query: 'global trending songs',
  keywords: [],
};

const MAX_RECOMMENDATIONS = 12;
const WAVE_BARS = [22, 55, 36, 78, 44, 60, 31, 82, 48, 64, 39, 74];
const SURPRISE_CRATES = [
  'festival edm anthems',
  'night drive synth hits',
  'afrobeat dance songs',
  'retro party classics',
  'indie groove picks',
  'chill lofi mix',
];

const PERFORMANCE_PRESETS: PerformancePreset[] = [
  {
    id: 'warmup',
    label: 'Warm Up',
    summary: 'Smooth ramp with softer transitions.',
    crossfader: 35,
    deckALevel: 66,
    deckBLevel: 60,
    masterVolume: 70,
    energy: 38,
    autoMixWindow: 20,
  },
  {
    id: 'club',
    label: 'Club Prime',
    summary: 'Balanced dancefloor setting.',
    crossfader: 52,
    deckALevel: 82,
    deckBLevel: 82,
    masterVolume: 84,
    energy: 70,
    autoMixWindow: 16,
  },
  {
    id: 'peak',
    label: 'Peak Hour',
    summary: 'Aggressive, high-energy drops.',
    crossfader: 70,
    deckALevel: 90,
    deckBLevel: 96,
    masterVolume: 92,
    energy: 92,
    autoMixWindow: 12,
  },
];

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getEnergyProfile = (energy: number) => {
  if (energy >= 75) return { label: 'High Voltage', query: 'high energy dance hits' };
  if (energy <= 35) return { label: 'Chill Flow', query: 'chill mellow songs' };
  return { label: 'Groove Mode', query: 'upbeat groove songs' };
};

const cleanText = (value = '') =>
  value
    .split('&quot;').join('"')
    .split('&#039;').join("'")
    .split('&amp;').join('&');

const extractArtist = (track: Track) => cleanText(track.artist || track.user?.name || 'Unknown Artist');
const trackToText = (track: Track) => `${cleanText(track.title)} ${extractArtist(track)}`.toLowerCase();

const toTrack = (song: JioSaavnSong): Track => ({
  id: song.id,
  title: cleanText(song.title),
  artist: cleanText(song.artist),
  image: song.image,
  audioUrl: song.audioUrl,
  duration: song.duration,
  source: 'jiosaavn',
});

const dedupeTracks = (tracks: Track[]) => {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const key = track.id || `${track.title}|${extractArtist(track)}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const inferTaste = (history: Track[]): TasteProfile => {
  if (!history.length) return DEFAULT_TASTE;

  let best = DEFAULT_TASTE;
  let bestScore = 0;

  for (const profile of TASTE_PROFILES) {
    const score = history.filter((track) => profile.keywords.some((keyword) => trackToText(track).includes(keyword))).length;
    if (score > bestScore) {
      bestScore = score;
      best = profile;
    }
  }

  return bestScore > 0 ? best : DEFAULT_TASTE;
};

const formatDuration = (duration?: number) => {
  if (!duration || Number.isNaN(duration)) return '--:--';
  return `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`;
};

const WaveformStrip = ({ active, tintClass }: { active: boolean; tintClass: string }) => (
  <div className="mt-2 flex h-10 items-end gap-0.5 rounded-md border border-border/60 bg-background/55 px-2 py-1">
    {WAVE_BARS.map((height, index) => (
      <span
        key={`${tintClass}-${index}`}
        className={cn('w-1.5 rounded-sm opacity-80', tintClass, active && 'animate-pulse')}
        style={{ height: `${height}%`, animationDelay: `${index * 60}ms` }}
      />
    ))}
  </div>
);

const AIDJPage = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [activeDeck, setActiveDeck] = useState<'A' | 'B' | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [radioMode, setRadioMode] = useState(() => localStorage.getItem('ai_dj_radio_mode') === 'on');
  const [crossfader, setCrossfader] = useState(50);
  const [deckALevel, setDeckALevel] = useState(74);
  const [deckBLevel, setDeckBLevel] = useState(72);
  const [masterVolume, setMasterVolume] = useState(80);
  const [energyLevel, setEnergyLevel] = useState(66);
  const [autoMixEnabled, setAutoMixEnabled] = useState(() => localStorage.getItem('ai_dj_auto_mix') !== 'off');
  const [autoMixWindowSec, setAutoMixWindowSec] = useState(16);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [selectedPresetId, setSelectedPresetId] = useState<PerformancePresetId>('club');
  const [plannedSet, setPlannedSet] = useState<Track[]>([]);
  const [setTargetMinutes, setSetTargetMinutes] = useState(30);
  const [crateLoading, setCrateLoading] = useState(false);
  const [lastSpokenLine, setLastSpokenLine] = useState('AI DJ is ready.');
  const lastAnnouncedTrackId = useRef<string | null>(null);
  const autoMixedTrackId = useRef<string | null>(null);
  const mountedRef = useRef(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    nextTrack,
    currentTime,
    duration,
    recentlyPlayed,
    volume,
    setVolume,
    addToQueue,
    queue,
  } = usePlayer();

  const tasteProfile = useMemo(() => inferTaste(recentlyPlayed), [recentlyPlayed]);
  const energyProfile = useMemo(() => getEnergyProfile(energyLevel), [energyLevel]);

  const topArtist = useMemo(() => {
    const counts = new Map<string, number>();
    recentlyPlayed.forEach((track) => {
      const artist = extractArtist(track);
      counts.set(artist, (counts.get(artist) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [recentlyPlayed]);

  const introLine = useMemo(() => {
    const name = user?.name?.split(' ')[0] || 'there';
    if (recentlyPlayed.length) {
      return `Hey ${name}, you were listening to ${tasteProfile.label} recently. I queued fresh picks for you.`;
    }
    return `Hey ${name}, welcome back. I prepared a fresh radio mix for your next session.`;
  }, [user?.name, recentlyPlayed.length, tasteProfile.label]);

  const remainingSeconds = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.floor(duration - currentTime));
  }, [duration, currentTime]);

  const trackProgress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return clampPercent((currentTime / duration) * 100);
  }, [duration, currentTime]);

  const selectedTrack = useMemo(
    () => recommendations.find((track) => track.id === selectedTrackId) ?? recommendations[0] ?? null,
    [recommendations, selectedTrackId],
  );

  const selectedIndex = useMemo(
    () => recommendations.findIndex((track) => track.id === selectedTrack?.id),
    [recommendations, selectedTrack?.id],
  );

  const leftDeckTrack = useMemo(() => selectedTrack ?? currentTrack ?? recommendations[0] ?? null, [selectedTrack, currentTrack, recommendations]);

  const rightDeckTrack = useMemo(() => {
    if (!recommendations.length) return null;
    if (selectedIndex < 0) return recommendations[Math.min(1, recommendations.length - 1)];
    return recommendations[(selectedIndex + 1) % recommendations.length];
  }, [recommendations, selectedIndex]);

  const resolvedActiveDeck = useMemo<'A' | 'B' | null>(() => {
    if (activeDeck) return activeDeck;
    if (!currentTrack) return null;
    if (currentTrack.id === leftDeckTrack?.id) return 'A';
    if (currentTrack.id === rightDeckTrack?.id) return 'B';
    return null;
  }, [activeDeck, currentTrack, leftDeckTrack?.id, rightDeckTrack?.id]);

  const mixerOutputVolume = useMemo(() => {
    if (!resolvedActiveDeck) return masterVolume;

    const deckLevel = resolvedActiveDeck === 'A' ? deckALevel : deckBLevel;
    const crossFactor = resolvedActiveDeck === 'A' ? (100 - crossfader) / 100 : crossfader / 100;
    const outputFactor = Math.max(0.08, (deckLevel / 100) * crossFactor);

    return Math.max(0, Math.min(100, Math.round(masterVolume * outputFactor)));
  }, [resolvedActiveDeck, crossfader, deckALevel, deckBLevel, masterVolume]);

  const crowdScore = useMemo(() => {
    const activeBoost = isPlaying ? 18 : 0;
    const deckBoost = resolvedActiveDeck === 'B' ? 6 : 2;
    const autoMixBoost = autoMixEnabled ? 10 : 0;
    return clampPercent((energyLevel * 0.48) + (mixerOutputVolume * 0.36) + activeBoost + deckBoost + autoMixBoost);
  }, [energyLevel, mixerOutputVolume, isPlaying, resolvedActiveDeck, autoMixEnabled]);

  const crowdState = useMemo(() => {
    if (crowdScore >= 85) return 'Explosive';
    if (crowdScore >= 65) return 'Packed';
    if (crowdScore >= 45) return 'Building';
    return 'Warmup';
  }, [crowdScore]);

  const plannedSetDurationSec = useMemo(
    () => plannedSet.reduce((total, track) => total + Math.max(120, track.duration ?? 210), 0),
    [plannedSet],
  );

  const songStory = useMemo(() => {
    if (!selectedTrack) return 'Pick a recommendation and I will generate a quick song story.';
    return `${selectedTrack.title} sits in your ${tasteProfile.label} lane and keeps the energy smooth with a ${formatDuration(
      selectedTrack.duration,
    )} runtime.`;
  }, [selectedTrack, tasteProfile.label]);

  const artistFact = useMemo(() => {
    if (!selectedTrack) return 'Artist facts appear after selecting a track.';
    const artist = extractArtist(selectedTrack);
    const repeatCount = recentlyPlayed.filter((track) => extractArtist(track).toLowerCase() === artist.toLowerCase()).length;
    if (repeatCount > 0) {
      return `You played ${artist} ${repeatCount} time${repeatCount === 1 ? '' : 's'} in your recent sessions.`;
    }
    return `${artist} is a fresh recommendation based on your current listening mood.`;
  }, [selectedTrack, recentlyPlayed]);

  const speakLine = useCallback(
    (text: string) => {
      setLastSpokenLine(text);
      if (!voiceEnabled) return false;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [voiceEnabled],
  );

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const queryPool = [
        energyProfile.query,
        tasteProfile.query,
        topArtist ? `${topArtist} top songs` : '',
        `${tasteProfile.label} latest songs`,
        'new release songs',
      ].filter(Boolean);

      let combined: Track[] = [];

      for (const query of queryPool) {
        const songs = await searchSongs(query, 10);
        const playable = songs.map(toTrack).filter((track) => Boolean(track.audioUrl));
        combined = dedupeTracks([...combined, ...playable]);
        if (combined.length >= MAX_RECOMMENDATIONS) break;
      }

      const list = combined.slice(0, MAX_RECOMMENDATIONS);
      setRecommendations(list);
      setSelectedTrackId(list[0]?.id ?? null);
      setActiveDeck('A');
      setCrossfader((prev) => (prev < 20 ? 20 : prev));
      setPlannedSet([]);

      if (!list.length) {
        setLastSpokenLine('No recommendations loaded. Use Refresh to pull a new set.');
      }
    } catch (error) {
      console.error('AI DJ recommendations failed:', error);
      toast({
        title: 'AI DJ unavailable',
        description: 'Could not load recommendations right now.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [energyProfile.query, tasteProfile.query, tasteProfile.label, topArtist, toast]);

  const runSearch = useCallback(async () => {
    const query = searchText.trim();
    if (!query) {
      setSearchApplied('');
      await loadRecommendations();
      return;
    }

    setLoading(true);
    try {
      const songs = await searchSongs(query, 24);
      const list = dedupeTracks(songs.map(toTrack).filter((track) => Boolean(track.audioUrl))).slice(0, MAX_RECOMMENDATIONS);

      setRecommendations(list);
      setSelectedTrackId(list[0]?.id ?? null);
      setActiveDeck('A');
      setSearchApplied(query);
      setPlannedSet([]);
      setLastSpokenLine(list.length ? `Loaded ${list.length} tracks for "${query}".` : `No tracks found for "${query}".`);
    } catch (error) {
      console.error('AI DJ search failed:', error);
      toast({
        title: 'Search failed',
        description: 'Could not search tracks right now.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchText, loadRecommendations, toast]);

  const handleTrackPlay = useCallback(
    async (track: Track | null, deck: 'A' | 'B' | 'queue' = 'queue') => {
      if (!track) return;

      setSelectedTrackId(track.id);

      if (deck === 'A') {
        setActiveDeck('A');
        setCrossfader((prev) => Math.min(prev, 30));
      } else if (deck === 'B') {
        setActiveDeck('B');
        setCrossfader((prev) => Math.max(prev, 70));
      } else {
        setActiveDeck(rightDeckTrack?.id === track.id ? 'B' : 'A');
      }

      if (currentTrack?.id === track.id) {
        await togglePlayPause();
      } else {
        await playTrack(track, recommendations);
      }
    },
    [currentTrack?.id, playTrack, recommendations, rightDeckTrack?.id, togglePlayPause],
  );

  const handleSmartTransition = useCallback(async () => {
    if (!rightDeckTrack) {
      toast({ title: 'No Deck B track', description: 'Load or select tracks before switching decks.' });
      return;
    }

    setLastSpokenLine(`Switching to Deck B: ${rightDeckTrack.title}.`);
    setCrossfader(100);
    await handleTrackPlay(rightDeckTrack, 'B');

    if (radioMode) {
      void speakLine(`Crossfade complete. Now on Deck B with ${rightDeckTrack.title}.`);
    }
  }, [handleTrackPlay, radioMode, rightDeckTrack, speakLine, toast]);

  const handleBeatSync = useCallback(() => {
    const balancedLevel = Math.round((deckALevel + deckBLevel) / 2);
    setDeckALevel(balancedLevel);
    setDeckBLevel(balancedLevel);
    setCrossfader(50);
    setLastSpokenLine(`Beat sync locked at ${balancedLevel}% on both decks.`);
  }, [deckALevel, deckBLevel]);

  const handleApplyPreset = useCallback((preset: PerformancePreset) => {
    setSelectedPresetId(preset.id);
    setCrossfader(preset.crossfader);
    setDeckALevel(preset.deckALevel);
    setDeckBLevel(preset.deckBLevel);
    setMasterVolume(preset.masterVolume);
    setEnergyLevel(preset.energy);
    setAutoMixWindowSec(preset.autoMixWindow);
    setAutoMixEnabled(true);
    setLastSpokenLine(`${preset.label} engaged. ${preset.summary}`);
  }, []);

  const handleBuildSet = useCallback(() => {
    if (!recommendations.length) {
      toast({ title: 'No tracks yet', description: 'Load recommendations before building a set.' });
      return;
    }

    const targetSec = Math.max(10, setTargetMinutes) * 60;
    const anchorId = selectedTrack?.id ?? recommendations[0]?.id;
    const anchorIndex = Math.max(0, recommendations.findIndex((track) => track.id === anchorId));
    const rotated = [...recommendations.slice(anchorIndex), ...recommendations.slice(0, anchorIndex)];

    const picked: Track[] = [];
    let total = 0;
    for (const track of rotated) {
      if (track.id === currentTrack?.id) continue;
      const seconds = Math.max(120, track.duration ?? 210);
      if (picked.length >= 4 && total + seconds > targetSec) break;
      picked.push(track);
      total += seconds;
      if (picked.length >= 12) break;
    }

    setPlannedSet(picked);
    setLastSpokenLine(`Built a ${Math.round(total / 60)} min ${energyProfile.label.toLowerCase()} set with ${picked.length} tracks.`);
  }, [recommendations, setTargetMinutes, selectedTrack?.id, currentTrack?.id, energyProfile.label, toast]);

  const handleQueuePlannedTrack = useCallback(() => {
    if (!plannedSet.length) {
      toast({ title: 'Set list is empty', description: 'Build a set first to queue tracks.' });
      return;
    }

    const [nextTrackItem, ...rest] = plannedSet;
    addToQueue(nextTrackItem);
    setPlannedSet(rest);
    setLastSpokenLine(`${nextTrackItem.title} moved from set plan to play-next queue.`);
  }, [plannedSet, addToQueue, toast]);

  const handleSurpriseCrate = useCallback(async () => {
    setCrateLoading(true);
    try {
      const pool = energyLevel > 70 ? SURPRISE_CRATES.slice(0, 4) : energyLevel < 40 ? SURPRISE_CRATES.slice(2) : SURPRISE_CRATES;
      const query = pool[Math.floor(Math.random() * pool.length)];
      const songs = await searchSongs(query, 20);
      const list = dedupeTracks(songs.map(toTrack).filter((track) => Boolean(track.audioUrl))).slice(0, MAX_RECOMMENDATIONS);
      setRecommendations(list);
      setSelectedTrackId(list[0]?.id ?? null);
      setSearchApplied(`crate: ${query}`);
      setPlannedSet([]);
      setActiveDeck('A');
      setLastSpokenLine(list.length ? `Surprise crate loaded: ${query}.` : `No songs found for crate "${query}".`);
    } catch (error) {
      console.error('Surprise crate failed:', error);
      toast({ title: 'Crate failed', description: 'Could not load surprise crate.', variant: 'destructive' });
    } finally {
      setCrateLoading(false);
    }
  }, [energyLevel, toast]);

  const handlePlayIntro = useCallback(() => {
    const ok = speakLine(introLine);
    if (!ok) {
      toast({
        title: 'Voice unavailable',
        description: 'Enable voice or use a browser with speech synthesis support.',
      });
    }
  }, [introLine, speakLine, toast]);

  const toggleVoice = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setVoiceEnabled((previous) => {
      const next = !previous;
      setLastSpokenLine(next ? 'Voice host enabled.' : 'Voice host muted.');
      return next;
    });
  }, []);

  const toggleRadioMode = useCallback(() => {
    setRadioMode((previous) => {
      const next = !previous;
      setLastSpokenLine(next ? 'Radio mode enabled.' : 'Radio mode disabled.');
      return next;
    });
  }, []);

  useEffect(() => {
    const initial = volume > 0 ? volume : 80;
    setMasterVolume(initial);
    setVolume(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_dj_radio_mode', radioMode ? 'on' : 'off');
  }, [radioMode]);

  useEffect(() => {
    localStorage.setItem('ai_dj_auto_mix', autoMixEnabled ? 'on' : 'off');
  }, [autoMixEnabled]);

  useEffect(() => {
    if (!mountedRef.current) return;
    void loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    if (!radioMode || !currentTrack) return;
    if (lastAnnouncedTrackId.current === currentTrack.id) return;

    lastAnnouncedTrackId.current = currentTrack.id;
    void speakLine(`Up next, ${cleanText(currentTrack.title)} by ${extractArtist(currentTrack)}. Enjoy the vibe.`);
  }, [radioMode, currentTrack, speakLine]);

  useEffect(() => {
    // Apply full mixer math to real player volume.
    setVolume(mixerOutputVolume);
  }, [mixerOutputVolume, setVolume]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => setSessionSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    if (!autoMixEnabled || !isPlaying || !currentTrack) return;
    if (!duration || duration <= 0) return;
    if (remainingSeconds > autoMixWindowSec) return;
    if (autoMixedTrackId.current === currentTrack.id) return;

    autoMixedTrackId.current = currentTrack.id;

    if (rightDeckTrack && rightDeckTrack.id !== currentTrack.id) {
      void handleSmartTransition();
      return;
    }

    void nextTrack();
    setLastSpokenLine('AutoMix moved to next track.');
  }, [
    autoMixEnabled,
    isPlaying,
    currentTrack,
    duration,
    remainingSeconds,
    autoMixWindowSec,
    rightDeckTrack,
    handleSmartTransition,
    nextTrack,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        void togglePlayPause();
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        void handleTrackPlay(leftDeckTrack, 'A');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        void handleTrackPlay(rightDeckTrack, 'B');
        return;
      }

      if (event.key === '[') {
        event.preventDefault();
        setCrossfader((prev) => Math.max(0, prev - 5));
        return;
      }

      if (event.key === ']') {
        event.preventDefault();
        setCrossfader((prev) => Math.min(100, prev + 5));
        return;
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setAutoMixEnabled((prev) => !prev);
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSmartTransition();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTrackPlay, leftDeckTrack, rightDeckTrack, togglePlayPause, handleSmartTransition]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4 animate-fade-in">
      <div className="flex items-center gap-2 shrink-0">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">AI DJ Host</h1>
          <p className="text-xs text-muted-foreground">Performance-grade radio host with smart automix, set planning and live crowd telemetry.</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              <Flame className="mr-1 inline h-3 w-3 text-orange-300" />{energyProfile.label}
            </span>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              <Zap className="mr-1 inline h-3 w-3 text-emerald-300" />{autoMixEnabled ? 'AutoMix Ready' : 'Manual Mix'}
            </span>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              <Clock3 className="mr-1 inline h-3 w-3" />Session {formatClock(sessionSeconds)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 items-start gap-3 lg:grid-cols-[1fr_280px_1fr]">
        <section className={cn('rounded-xl border border-border/70 bg-gradient-to-b from-slate-900 to-slate-950 p-3', resolvedActiveDeck === 'A' && 'border-cyan-400/60')}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Deck A</p>
            <span className="text-[11px] text-muted-foreground">Left Channel</span>
          </div>
          <div className="flex items-center gap-3">
            {leftDeckTrack?.image ? (
              <img src={leftDeckTrack.image} alt={leftDeckTrack.title} className="h-14 w-14 rounded-md object-cover ring-1 ring-cyan-400/35" />
            ) : (
              <div className="h-14 w-14 rounded-md bg-card/65 ring-1 ring-cyan-400/30" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{leftDeckTrack?.title || 'No track loaded'}</p>
              <p className="truncate text-xs text-muted-foreground">{leftDeckTrack ? extractArtist(leftDeckTrack) : 'Select a track'}</p>
            </div>
          </div>
          <WaveformStrip active={Boolean(isPlaying && currentTrack?.id === leftDeckTrack?.id)} tintClass="bg-cyan-400" />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayIntro}
              className="rounded-md border border-border/70 bg-background/35 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cue Intro
            </button>
            <button
              type="button"
              onClick={() => void handleTrackPlay(leftDeckTrack, 'A')}
              className="ml-auto rounded-full bg-primary p-2 text-primary-foreground transition-transform hover:scale-105"
            >
              {isPlaying && currentTrack?.id === leftDeckTrack?.id ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-gradient-to-b from-zinc-900 to-zinc-950 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Mixer</p>
            <Bot className="h-4 w-4 text-primary" />
          </div>

          <div className="mb-2 rounded-md border border-border/60 bg-background/40 p-2">
            <p className="line-clamp-2 text-xs text-muted-foreground">{lastSpokenLine || introLine}</p>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Queue: <span className="text-foreground">{queue.length}</span> | Progress:{' '}
              <span className="text-foreground">{trackProgress}%</span> | Left:{' '}
              <span className="text-foreground">{formatClock(remainingSeconds)}</span>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleRadioMode}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                radioMode ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border bg-background/35 text-muted-foreground hover:bg-accent',
              )}
            >
              <Radio className="mr-1 inline h-3.5 w-3.5" />{radioMode ? 'Radio On' : 'Radio Off'}
            </button>
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                voiceEnabled ? 'border-cyan-400/45 bg-cyan-500/10 text-cyan-300' : 'border-border bg-background/35 text-muted-foreground hover:bg-accent',
              )}
            >
              {voiceEnabled ? <Volume2 className="mr-1 inline h-3.5 w-3.5" /> : <VolumeX className="mr-1 inline h-3.5 w-3.5" />}
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </button>
            <button
              type="button"
              onClick={() => setAutoMixEnabled((prev) => !prev)}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                autoMixEnabled ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300' : 'border-border bg-background/35 text-muted-foreground hover:bg-accent',
              )}
            >
              <Zap className="mr-1 inline h-3.5 w-3.5" />{autoMixEnabled ? 'AutoMix On' : 'AutoMix Off'}
            </button>
            <button
              type="button"
              onClick={() => void handleSmartTransition()}
              className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <SkipForward className="mr-1 inline h-3.5 w-3.5" />Drop to B
            </button>
            <button
              type="button"
              onClick={handlePlayIntro}
              className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Mic2 className="mr-1 inline h-3.5 w-3.5" />Intro
            </button>
            <button
              type="button"
              onClick={() => void loadRecommendations()}
              className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />Refresh
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between gap-2 text-muted-foreground">
              Master <span className="text-foreground">{masterVolume}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={masterVolume}
                onChange={(event) => setMasterVolume(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-muted-foreground">
              Crossfader <span className="text-foreground">{crossfader}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={crossfader}
                onChange={(event) => setCrossfader(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </label>
            <div className="rounded-md border border-border/60 bg-background/35 px-2 py-1 text-[11px] text-muted-foreground">
              Energy: <span className="text-foreground">{energyProfile.label}</span> | Crowd: <span className="text-foreground">{crowdState}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background/60">
              <div className="h-full bg-gradient-to-r from-cyan-400 via-primary to-emerald-400 transition-all duration-300" style={{ width: `${crowdScore}%` }} />
            </div>
          </div>
        </section>

        <section className={cn('rounded-xl border border-border/70 bg-gradient-to-b from-zinc-900 to-emerald-950/40 p-3', resolvedActiveDeck === 'B' && 'border-emerald-400/60')}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Deck B</p>
            <span className="text-[11px] text-muted-foreground">Right Channel</span>
          </div>
          <div className="flex items-center gap-3">
            {rightDeckTrack?.image ? (
              <img src={rightDeckTrack.image} alt={rightDeckTrack.title} className="h-14 w-14 rounded-md object-cover ring-1 ring-emerald-400/35" />
            ) : (
              <div className="h-14 w-14 rounded-md bg-card/65 ring-1 ring-emerald-400/30" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{rightDeckTrack?.title || 'Queue is empty'}</p>
              <p className="truncate text-xs text-muted-foreground">{rightDeckTrack ? extractArtist(rightDeckTrack) : 'Load recommendations'}</p>
            </div>
          </div>
          <WaveformStrip active={Boolean(isPlaying && currentTrack?.id === rightDeckTrack?.id)} tintClass="bg-emerald-400" />
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md border border-border/60 bg-background/35 px-2 py-1 text-[11px] text-muted-foreground">Next Up</span>
            <button
              type="button"
              onClick={() => void handleTrackPlay(rightDeckTrack, 'B')}
              className="ml-auto rounded-full bg-primary p-2 text-primary-foreground transition-transform hover:scale-105"
            >
              {isPlaying && currentTrack?.id === rightDeckTrack?.id ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>
          </div>
        </section>
      </div>

      <div className="flex-1 min-h-0 grid gap-3 overflow-hidden lg:grid-cols-[1fr_300px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/55">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
            className="flex items-center gap-2 border-b border-border/60 px-3 py-2 shrink-0"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search songs or artists..."
                className="h-8 w-full rounded-md border border-border/70 bg-background/50 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>
            <button type="submit" className="rounded-md border border-border bg-background/45 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
              Search
            </button>
            {searchApplied ? (
              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  setSearchApplied('');
                  void loadRecommendations();
                }}
                className="rounded-md border border-border bg-background/45 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                title="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </form>

          <div className="grid grid-cols-[34px_minmax(0,1fr)_58px_84px] border-b border-border/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
            <span>#</span>
            <span>{searchApplied ? `Search: ${searchApplied}` : 'Recommendation Queue'}</span>
            <span className="text-right">Time</span>
            <span className="text-center">Actions</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading recommendations...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {searchApplied ? `No tracks for "${searchApplied}".` : 'No recommendations. Use Refresh.'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {recommendations.map((track, index) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={`${track.id}-${index}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => void handleTrackPlay(track, 'queue')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          void handleTrackPlay(track, 'queue');
                        }
                      }}
                      className={cn(
                        'grid w-full cursor-pointer grid-cols-[34px_minmax(0,1fr)_58px_84px] items-center gap-2 rounded-lg border border-border/60 bg-background/30 px-2 py-2 text-left transition-colors hover:bg-accent/55',
                        selectedTrack?.id === track.id && 'border-primary/45',
                      )}
                    >
                      <span className={cn('text-xs', isCurrent ? 'text-primary' : 'text-muted-foreground')}>{index + 1}</span>

                      <div className="flex min-w-0 items-center gap-3">
                        {track.image ? (
                          <img src={track.image} alt={track.title} className="h-9 w-9 rounded-md object-cover" loading="lazy" />
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-muted" />
                        )}
                        <div className="min-w-0">
                          <p className={cn('truncate text-sm font-medium', isCurrent ? 'text-primary' : 'text-foreground')}>{track.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{extractArtist(track)}</p>
                        </div>
                      </div>

                      <span className="text-right text-xs text-muted-foreground">{formatDuration(track.duration)}</span>

                      <span className="mx-auto flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToQueue(track);
                            setLastSpokenLine(`${track.title} added to play-next queue.`);
                          }}
                          className="rounded-full border border-border/60 bg-background/55 p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="Queue next"
                        >
                          <ListPlus className="h-3.5 w-3.5" />
                        </button>
                        <span className="rounded-full bg-primary p-1.5 text-primary-foreground">
                          {isCurrent && isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="min-h-0 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Performance Presets</h4>
            <div className="grid grid-cols-3 gap-2">
              {PERFORMANCE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                    selectedPresetId === preset.id
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-border bg-background/35 text-muted-foreground hover:bg-accent',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Active preset: <span className="text-foreground">{PERFORMANCE_PRESETS.find((preset) => preset.id === selectedPresetId)?.summary}</span>
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-2 text-sm font-semibold text-foreground">Set Builder</h4>
            <label className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              Target Length <span className="text-foreground">{setTargetMinutes} min</span>
              <input
                type="range"
                min={15}
                max={60}
                value={setTargetMinutes}
                onChange={(event) => setSetTargetMinutes(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleBuildSet}
                className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Gauge className="mr-1 inline h-3.5 w-3.5" />
                Build Set
              </button>
              <button
                type="button"
                onClick={handleQueuePlannedTrack}
                className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ListPlus className="mr-1 inline h-3.5 w-3.5" />
                Queue 1
              </button>
            </div>
            <div className="mt-2 rounded-md border border-border/60 bg-background/35 px-2 py-1 text-[11px] text-muted-foreground">
              Planned: <span className="text-foreground">{plannedSet.length} tracks</span> | Duration:{' '}
              <span className="text-foreground">{formatClock(plannedSetDurationSec)}</span>
            </div>
            <div className="mt-2 space-y-1">
              {plannedSet.slice(0, 4).map((track) => (
                <div key={`plan-${track.id}`} className="rounded-md border border-border/60 bg-background/30 px-2 py-1">
                  <p className="truncate text-xs font-medium text-foreground">{track.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{extractArtist(track)}</p>
                </div>
              ))}
              {plannedSet.length === 0 ? <p className="text-xs text-muted-foreground">Build a set to preview AI-planned sequencing.</p> : null}
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Live Room</h4>
            <p className="text-sm text-muted-foreground">
              <Flame className="mr-1 inline h-3.5 w-3.5 text-orange-300" />
              Crowd energy is <span className="text-foreground">{crowdState}</span> at {crowdScore}%.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Clock3 className="mr-1 inline h-3.5 w-3.5" />
              Session time: <span className="text-foreground">{formatClock(sessionSeconds)}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Zap className="mr-1 inline h-3.5 w-3.5" />
              AutoMix: <span className="text-foreground">{autoMixEnabled ? `armed (${autoMixWindowSec}s window)` : 'off'}</span>
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-2 text-sm font-semibold text-foreground">Pro Controls</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleBeatSync}
                className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <WandSparkles className="mr-1 inline h-3.5 w-3.5" />Beat Sync
              </button>
              <button
                type="button"
                onClick={() => void handleSurpriseCrate()}
                disabled={crateLoading}
                className="rounded-md border border-border bg-background/35 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
              >
                {crateLoading ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 inline h-3.5 w-3.5" />}
                Surprise
              </button>
            </div>
            <div className="mt-2 space-y-2 text-xs">
              <label className="flex items-center justify-between gap-2 text-muted-foreground">
                Energy <span className="text-foreground">{energyLevel}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={energyLevel}
                  onChange={(event) => setEnergyLevel(Number(event.target.value))}
                  className="w-full accent-orange-400"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-muted-foreground">
                AutoMix Window <span className="text-foreground">{autoMixWindowSec}s</span>
                <input
                  type="range"
                  min={8}
                  max={30}
                  value={autoMixWindowSec}
                  onChange={(event) => setAutoMixWindowSec(Number(event.target.value))}
                  className="w-full accent-emerald-300"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-muted-foreground">
                Deck A Level <span className="text-foreground">{deckALevel}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={deckALevel}
                  onChange={(event) => setDeckALevel(Number(event.target.value))}
                  className="w-full accent-cyan-400"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-muted-foreground">
                Deck B Level <span className="text-foreground">{deckBLevel}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={deckBLevel}
                  onChange={(event) => setDeckBLevel(Number(event.target.value))}
                  className="w-full accent-emerald-400"
                />
              </label>
              <div className="rounded-md border border-border/60 bg-background/35 px-2 py-1 text-[11px] text-muted-foreground">
                Active deck: <span className="text-foreground">{resolvedActiveDeck ?? 'None'}</span> | Output: <span className="text-foreground">{mixerOutputVolume}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Song Story</h4>
            <p className="text-sm text-muted-foreground">{songStory}</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Artist Facts</h4>
            <p className="text-sm text-muted-foreground">{artistFact}</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/55 p-3">
            <h4 className="mb-1 text-sm font-semibold text-foreground">Between Songs Voice</h4>
            <p className="text-sm text-muted-foreground">
              {radioMode
                ? 'AI DJ announces each newly started song and responds to deck switches.'
                : 'Turn on Radio Mode to get voice intros between tracks.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AIDJPage;
