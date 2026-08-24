import { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, Play, Pause, Music2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/contexts/PlayerContext';
import { useToast } from '@/hooks/use-toast';

type Category = {
  title: string;
  query: string;
  gradient: string;
  subtitle: string;
};

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const QUICK_SEARCHES = ['Telugu Hits', 'Hindi Bollywood', 'Tamil Songs', 'Lo-fi Chill', 'Arijit Singh', 'EDM'];

const CATEGORIES: Category[] = [
  { title: 'Telugu Hits', query: 'telugu hits', gradient: 'from-orange-500 to-amber-500', subtitle: 'Top regional picks' },
  { title: 'Hindi Bollywood', query: 'hindi bollywood hits', gradient: 'from-pink-500 to-rose-500', subtitle: 'Chartbusters and classics' },
  { title: 'Arijit Singh', query: 'arijit singh hits', gradient: 'from-purple-500 to-indigo-500', subtitle: 'Most-loved vocals' },
  { title: 'Tamil Songs', query: 'tamil songs', gradient: 'from-cyan-600 to-sky-500', subtitle: 'Fresh Tamil playlists' },
  { title: 'Lo-fi Chill', query: 'lofi chill', gradient: 'from-blue-600 to-cyan-500', subtitle: 'Calm and focus' },
  { title: 'English Pop', query: 'english pop hits', gradient: 'from-emerald-600 to-teal-500', subtitle: 'Global trending tracks' },
  { title: 'Punjabi Hits', query: 'punjabi hits', gradient: 'from-amber-500 to-yellow-500', subtitle: 'Party and vibe songs' },
  { title: 'EDM', query: 'edm top songs', gradient: 'from-rose-600 to-pink-500', subtitle: 'Festival energy' },
];

const decodeEntities = (value = '') => {
  if (typeof document === 'undefined') return value;
  const txt = document.createElement('textarea');
  txt.innerHTML = value;
  return txt.value;
};

function mapToTrack(song: JioSaavnSong): Track {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    image: song.image,
    audioUrl: song.audioUrl,
    url: song.audioUrl,
    duration: song.duration,
    source: 'jiosaavn',
  };
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { playTrack, togglePlayPause, currentTrack, isPlaying } = usePlayer();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const { toast } = useToast();

  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const shouldShowResults = trimmedQuery.length >= 2;
  const speechRecognitionConstructor = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const speechWindow = window as SpeechRecognitionWindow;
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  }, []);
  const hasVoiceSupport = Boolean(speechRecognitionConstructor);

  useEffect(() => {
    if (!speechRecognitionConstructor) return;

    const recognition = new speechRecognitionConstructor();
    recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += `${event.results[i]?.[0]?.transcript ?? ''} `;
      }

      const spokenText = transcript.trim();
      if (spokenText) {
        setQuery(spokenText);
        setSelectedCategory(null);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast({
          title: 'Microphone blocked',
          description: 'Allow microphone access to use voice search.',
          variant: 'destructive',
        });
        return;
      }
      if (event.error === 'no-speech') {
        toast({
          title: 'No speech detected',
          description: 'Try again and speak clearly.',
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [speechRecognitionConstructor, toast]);

  useEffect(() => {
    if (!shouldShowResults) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      const songs = await searchSongs(trimmedQuery, 24);
      if (!cancelled) {
        setResults(songs.map(mapToTrack));
        setIsLoading(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedQuery, shouldShowResults]);

  const applyQuery = (value: string) => {
    setQuery(value);
    setSelectedCategory(value.toLowerCase());
  };

  const toggleVoiceSearch = () => {
    if (!hasVoiceSupport || !recognitionRef.current) {
      toast({
        title: 'Voice search unavailable',
        description: 'Your browser does not support voice input here.',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      toast({
        title: 'Voice search failed',
        description: 'Please try again.',
      });
    }
  };

  return (
    <div className="px-6 py-6 animate-fade-in">
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md p-4 sm:p-6">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="search-field h-12 w-full rounded-full border border-border/70 pl-12 pr-14 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={toggleVoiceSearch}
            disabled={!hasVoiceSupport}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            title={isListening ? 'Stop voice input' : 'Search by voice'}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border transition-all duration-200 flex items-center justify-center',
              !hasVoiceSupport && 'cursor-not-allowed border-border/50 text-muted-foreground/50',
              hasVoiceSupport && !isListening && 'border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent',
              hasVoiceSupport && isListening && 'border-primary/50 bg-primary/15 text-primary shadow-[0_0_0_4px_rgba(29,185,84,0.18)]',
            )}
          >
            <Mic className={cn('h-4 w-4', isListening && 'animate-pulse')} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_SEARCHES.map((item) => (
            <button
              key={item}
              onClick={() => applyQuery(item)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                selectedCategory === item.toLowerCase()
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border/70 bg-background/55 text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {shouldShowResults ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Top results</h2>
            {!isLoading && <span className="text-sm text-muted-foreground">{results.length} tracks</span>}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[74px] rounded-xl border border-border/60 bg-card/70 skeleton" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-card/70 p-8 text-center">
              <p className="text-foreground font-medium">No tracks found</p>
              <p className="text-sm text-muted-foreground mt-1">Try another song, artist, or genre keyword.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const image = track.image || track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
                const artist = decodeEntities(track.artist || track.user?.name || 'Unknown Artist');
                return (
                  <button
                    key={track.id}
                    onClick={() => (isCurrent ? togglePlayPause() : playTrack(track, results))}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl border border-border/65 bg-card/75 px-3 py-2 text-left transition-colors hover:bg-card',
                      isCurrent && 'ring-1 ring-primary/40',
                    )}
                  >
                    {image ? (
                      <img src={image} alt={track.title} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <Music2 className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-semibold', isCurrent ? 'text-primary' : 'text-foreground')}>
                        {decodeEntities(track.title)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{artist}</p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                      {isCurrent && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 ml-0.5 fill-current" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-1">Browse categories</h2>
          <p className="text-muted-foreground mb-5">Pick a vibe and start listening instantly.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {CATEGORIES.map((item) => (
              <button
                key={item.title}
                onClick={() => applyQuery(item.query)}
                className={cn(
                  'group relative overflow-hidden rounded-xl p-4 h-[92px] text-left transition-transform duration-200 hover:-translate-y-0.5',
                  selectedCategory === item.query && 'ring-2 ring-primary/35',
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br', item.gradient)} />
                <div className="absolute inset-0 bg-black/12 transition-colors group-hover:bg-black/0" />
                <div className="relative z-10">
                  <h3 className="text-white text-xl font-semibold leading-tight">{item.title}</h3>
                  <p className="mt-1 text-[13px] text-white/85">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Search;
