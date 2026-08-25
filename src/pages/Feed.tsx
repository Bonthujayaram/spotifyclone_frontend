import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share2, Play, Pause, MoreHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlayer, type Track } from '@/contexts/PlayerContext';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';
import { useToast } from '@/hooks/use-toast';
import Spinner from '@/components/Spinner';

const Feed = () => {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<number>>(new Set());
  const [resolvedTracks, setResolvedTracks] = useState<Record<number, Track>>({});
  const [pendingPostId, setPendingPostId] = useState<number | null>(null);
  const { playTrack, togglePlayPause, currentTrack, isPlaying } = usePlayer();
  const { toast } = useToast();

  const feedItems = [
    {
      id: 1,
      type: 'track_release',
      user: {
        name: 'The Weeknd',
        username: '@theweeknd',
        avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop&crop=center',
        verified: true,
      },
      content: 'Just dropped my latest track.',
      track: {
        title: 'Blinding Lights',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center',
      },
      timestamp: '2 hours ago',
      likes: 12500,
      comments: 234,
      reposts: 1200,
    },
    {
      id: 2,
      type: 'repost',
      user: {
        name: 'Olivia Rodrigo',
        username: '@oliviarodrigo',
        avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=50&h=50&fit=crop&crop=center',
        verified: true,
      },
      content: 'This track is incredible.',
      originalUser: { name: 'Dua Lipa', username: '@dualipa' },
      track: {
        title: 'Levitating',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center',
      },
      timestamp: '4 hours ago',
      likes: 8900,
      comments: 156,
      reposts: 890,
    },
    {
      id: 3,
      type: 'playlist',
      user: {
        name: 'Harry Styles',
        username: '@harrystyles',
        avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop&crop=center',
        verified: true,
      },
      content: 'New playlist for late night vibes.',
      playlist: {
        title: 'Midnight Thoughts',
        trackCount: 24,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center',
      },
      timestamp: '1 day ago',
      likes: 5600,
      comments: 78,
      reposts: 432,
    },
  ];

  const toTrack = (song: JioSaavnSong, fallbackImage?: string): Track => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    image: song.image || fallbackImage || '',
    audioUrl: song.audioUrl,
    url: song.audioUrl,
    duration: song.duration,
    source: 'jiosaavn',
  });

  const toggleLike = (postId: number) => {
    const next = new Set(likedPosts);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    setLikedPosts(next);
  };

  const toggleRepost = (postId: number) => {
    const next = new Set(repostedPosts);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    setRepostedPosts(next);
  };

  const resolveTrackForItem = async (item: (typeof feedItems)[number]): Promise<Track | null> => {
    const cached = resolvedTracks[item.id];
    if (cached) return cached;

    const title = item.track?.title || item.playlist?.title;
    if (!title) return null;

    const query = item.track ? title : `${title} songs`;
    const songs = await searchSongs(query, 8);
    if (!songs.length) return null;

    let best = songs[0];
    if (item.track?.title) {
      const target = item.track.title.toLowerCase();
      const exact = songs.find((s) => s.title.toLowerCase() === target);
      const partial = songs.find((s) => s.title.toLowerCase().includes(target) || target.includes(s.title.toLowerCase()));
      best = exact ?? partial ?? songs[0];
    }

    const mapped = toTrack(best, item.track?.image || item.playlist?.image);
    setResolvedTracks((prev) => ({ ...prev, [item.id]: mapped }));
    return mapped;
  };

  const handlePlayItem = async (item: (typeof feedItems)[number]) => {
    try {
      const cached = resolvedTracks[item.id];
      if (cached && currentTrack?.id === cached.id) {
        await togglePlayPause();
        return;
      }

      setPendingPostId(item.id);
      const resolved = cached ?? (await resolveTrackForItem(item));
      if (!resolved || (!resolved.audioUrl && !resolved.url)) {
        toast({
          title: 'Playback unavailable',
          description: 'Could not find a playable track for this feed item.',
          variant: 'destructive',
        });
        return;
      }

      await playTrack(resolved, [resolved]);
    } catch (error) {
      console.error('Feed play error:', error);
      toast({
        title: 'Playback failed',
        description: 'Something went wrong while starting this track.',
        variant: 'destructive',
      });
    } finally {
      setPendingPostId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="mb-8 text-4xl font-bold text-foreground">Your Feed</h1>

        {feedItems.map((item) => (
          <div key={item.id} className="space-y-4 rounded-xl border border-border bg-card/75 p-6 transition-colors hover:bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={item.user.avatar} alt={item.user.name} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{item.user.name}</span>
                  {item.user.verified && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.user.username} - {item.timestamp}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {item.type === 'repost' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat2 className="h-4 w-4" />
              <span>Reposted from {item.originalUser?.name}</span>
            </div>
          )}

          <p className="text-foreground">{item.content}</p>

          {(item.track || item.playlist) && (
            <div
              className="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-accent/35 p-4 transition-colors hover:bg-accent/55"
              onClick={() => handlePlayItem(item)}
            >
              <img
                src={item.track?.image || item.playlist?.image}
                alt={item.track?.title || item.playlist?.title}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{item.track?.title || item.playlist?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.track ? 'Single' : `Playlist - ${item.playlist?.trackCount} tracks`}
                </p>
              </div>
              <Button
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayItem(item);
                }}
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                {pendingPostId === item.id ? (
                  <Spinner size={20} />
                ) : resolvedTracks[item.id]?.id === currentTrack?.id && isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5 fill-current" />
                )}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => toggleLike(item.id)}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  likedPosts.has(item.id) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
                )}
              >
                <Heart className={cn('h-5 w-5', likedPosts.has(item.id) && 'fill-current')} />
                <span className="text-sm">{item.likes + (likedPosts.has(item.id) ? 1 : 0)}</span>
              </button>

              <button className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{item.comments}</span>
              </button>

              <button
                onClick={() => toggleRepost(item.id)}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  repostedPosts.has(item.id) ? 'text-green-500' : 'text-muted-foreground hover:text-green-500',
                )}
              >
                <Repeat2 className="h-5 w-5" />
                <span className="text-sm">{item.reposts + (repostedPosts.has(item.id) ? 1 : 0)}</span>
              </button>
            </div>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
