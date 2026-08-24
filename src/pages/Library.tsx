import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';
import HorizontalMusicCard from '@/components/HorizontalMusicCard';
import type { Track } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePlayer } from '@/contexts/PlayerContext';
import { cn, errorMessage } from '@/lib/utils';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

const Library = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'recent'>('liked');
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const { recentlyPlayed } = usePlayer();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        toast({
          title: 'Authentication Error',
          description: 'Please log in to view your library',
          variant: 'destructive',
        });
        return;
      }

      try {
        const [{ likedSongs }, { playlists }] = await Promise.all([
          authApi.getLikedSongs(token),
          authApi.getPlaylists(token),
        ]);
        setLikedSongs(likedSongs);
        setPlaylists(playlists);
      } catch (error) {
        const message = errorMessage(error);
        if (message.includes('401') || message.toLowerCase().includes('auth')) {
          toast({
            title: 'Authentication Error',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load library data',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a playlist name',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { playlist } = await authApi.createPlaylist(token, newPlaylistName, newPlaylistDescription);
      setPlaylists((prev) => [...prev, playlist]);
      setIsCreatePlaylistOpen(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      toast({
        title: 'Success',
        description: 'Playlist created successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      });
    }
  };

  const tabClass = (tab: 'playlists' | 'liked' | 'recent') =>
    cn(
      'rounded-full border px-4 py-2 text-sm transition-colors',
      activeTab === tab
        ? 'border-primary/40 bg-primary text-primary-foreground'
        : 'border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground',
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Your Library</h1>
        <div className="flex gap-2">
          <button className={tabClass('playlists')} onClick={() => setActiveTab('playlists')}>
            Playlists
          </button>
          <button className={tabClass('liked')} onClick={() => setActiveTab('liked')}>
            Liked Songs
          </button>
          <button className={tabClass('recent')} onClick={() => setActiveTab('recent')}>
            Recently Played
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-card/60" />
          ))}
        </div>
      ) : (
        <div>
          {activeTab === 'liked' && (
            <div className="space-y-4">
              {likedSongs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No liked songs yet</p>
                  <p className="mt-2 text-sm">Start liking songs to see them here</p>
                </div>
              ) : (
                likedSongs.map((track, index) => (
                  <HorizontalMusicCard key={track.id} track={track} playlist={likedSongs} index={index} />
                ))
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div>
              <div className="mb-4 flex justify-end">
                <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                  <DialogTrigger asChild>
                    <Button>Create Playlist</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Playlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                        <Input
                          placeholder="Enter playlist name"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Description (optional)</label>
                        <Textarea
                          placeholder="Enter playlist description"
                          value={newPlaylistDescription}
                          onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleCreatePlaylist}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {playlists.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    <p>No playlists yet</p>
                    <p className="mt-2 text-sm">Create a playlist to see it here</p>
                  </div>
                ) : (
                  playlists.map((playlist) => (
                    <div
                      key={playlist._id}
                      className="cursor-pointer rounded-lg border border-border bg-card/70 p-4 transition-colors hover:bg-accent"
                      onClick={() => navigate(`/playlist/${playlist._id}`)}
                    >
                      <div className="mb-4 aspect-square rounded-lg bg-muted/60 flex items-center justify-center">
                        {playlist.coverImage ? (
                          <img
                            src={playlist.coverImage}
                            alt={playlist.name || 'Playlist'}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-muted-foreground">MUSIC</div>
                        )}
                      </div>
                      <h3 className="truncate font-semibold text-foreground">{playlist.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{playlist.tracks.length} tracks</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="space-y-4">
              {recentlyPlayed.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No recently played tracks</p>
                  <p className="mt-2 text-sm">Start playing some music!</p>
                </div>
              ) : (
                recentlyPlayed.map((track, index) => (
                  <HorizontalMusicCard key={track.id} track={track} playlist={recentlyPlayed} index={index} />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
