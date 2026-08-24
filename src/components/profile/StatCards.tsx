import { Activity, Headphones, Heart, Library, Users } from 'lucide-react';
import type { Track } from '@/contexts/PlayerContext';

interface StatProps {
  data: {
    playlists: unknown[]; // only .length is read here
    likedSongs: Track[];
    followers: number;
    following: number;
    listeningHours: number;
  };
}

export default function StatCards({ data }: StatProps) {
  const cards = [
    { label: 'Playlists', value: data.playlists.length, icon: Library },
    { label: 'Liked Songs', value: data.likedSongs.length, icon: Heart },
    { label: 'Followers', value: data.followers, icon: Users },
    { label: 'Following', value: data.following, icon: Activity },
    { label: 'Listening Hours', value: data.listeningHours, icon: Headphones },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="relative rounded-2xl bg-card/80 border border-border p-4 hover:-translate-y-1 transition"
        >
          <c.icon className="w-5 h-5 text-muted-foreground" />
          <div className="text-2xl font-semibold mt-2">{c.value}</div>
          <div className="text-sm text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
