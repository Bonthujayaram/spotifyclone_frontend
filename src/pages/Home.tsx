import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Sparkles, Clock, Mic2 } from 'lucide-react';
import MusicCard from '@/components/MusicCard';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';
import type { Track } from '@/contexts/PlayerContext';
import { usePlayer } from '@/contexts/PlayerContext';

function toTrack(song: JioSaavnSong): Track {
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

const CardSkeleton = () => (
  <div className="w-[175px] min-w-[175px] rounded-xl p-4 bg-card/80 border border-border/60">
    <div className="skeleton aspect-square rounded mb-3" />
    <div className="skeleton h-3 w-3/4 rounded mb-2" />
    <div className="skeleton h-2.5 w-1/2 rounded" />
  </div>
);

const SkeletonRow = ({ count = 7 }: { count?: number }) => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

interface SectionProps {
  title: string;
  icon?: ReactNode;
  link?: string;
  children: ReactNode;
}

const Section = ({ title, icon, link, children }: SectionProps) => (
  <section className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-foreground font-bold text-xl flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {link && (
        <Link to={link} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">{children}</div>
  </section>
);

const RecentlyPlayedRow = () => {
  const { recentlyPlayed } = usePlayer();
  if (recentlyPlayed.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-foreground font-bold text-xl flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-[#1DB954]" /> Recently Played
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {recentlyPlayed.slice(0, 8).map((track) => {
          const img = track.image || track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
          const artist = track.artist || track.user?.name || '';
          return (
            <div
              key={track.id}
              className="flex items-center gap-3 bg-card/80 hover:bg-card rounded-lg border border-border/60 overflow-hidden cursor-pointer group transition-colors"
            >
              {img ? (
                <img src={img} alt={track.title} className="w-14 h-14 object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-muted flex items-center justify-center shrink-0 text-[10px] text-muted-foreground">
                  MUSIC
                </div>
              )}
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-foreground text-sm font-medium truncate">{track.title}</p>
                <p className="text-muted-foreground text-xs truncate">{artist}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const Home = () => {
  const [teluguTracks, setTeluguTracks] = useState<Track[]>([]);
  const [hindiTracks, setHindiTracks] = useState<Track[]>([]);
  const [arijitTracks, setArijitTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState({ telugu: true, hindi: true, arijit: true });

  useEffect(() => {
    searchSongs('telugu hits', 20).then((songs) => {
      setTeluguTracks(songs.map(toTrack));
      setLoading((p) => ({ ...p, telugu: false }));
    });

    searchSongs('hindi bollywood hits 2024', 20).then((songs) => {
      setHindiTracks(songs.map(toTrack));
      setLoading((p) => ({ ...p, hindi: false }));
    });

    searchSongs('arijit singh hits', 20).then((songs) => {
      setArijitTracks(songs.map(toTrack));
      setLoading((p) => ({ ...p, arijit: false }));
    });
  }, []);

  return (
    <div className="px-6 py-6 animate-fade-in">
      <div className="mb-8 rounded-2xl border border-border/60 bg-card/65 backdrop-blur-md px-6 py-5">
        <h1 className="text-4xl font-bold text-foreground mb-1 tracking-tight">Good {getGreeting()}</h1>
        <p className="text-muted-foreground text-base">Discover music tailored for you</p>
      </div>

      <RecentlyPlayedRow />

      <Section title="Trending Telugu Songs" icon={<Flame className="w-5 h-5 text-orange-400" />} link="/trending">
        {loading.telugu ? <SkeletonRow /> : teluguTracks.map((t) => <MusicCard key={t.id} track={t} playlist={teluguTracks} />)}
      </Section>

      <Section title="Hindi Bollywood Hits" icon={<Sparkles className="w-5 h-5 text-yellow-400" />}>
        {loading.hindi ? <SkeletonRow /> : hindiTracks.map((t) => <MusicCard key={t.id} track={t} playlist={hindiTracks} />)}
      </Section>

      <Section title="Arijit Singh Hits" icon={<Mic2 className="w-5 h-5 text-blue-400" />}>
        {loading.arijit ? <SkeletonRow /> : arijitTracks.map((t) => <MusicCard key={t.id} track={t} playlist={arijitTracks} />)}
      </Section>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default Home;
