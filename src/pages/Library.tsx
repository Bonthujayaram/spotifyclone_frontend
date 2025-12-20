import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';
import MusicCard from '@/components/MusicCard';
import HorizontalMusicCard from '@/components/HorizontalMusicCard';
import type { Track } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePlayer } from '@/contexts/PlayerContext';

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
  const [activeTab, setActiveTab] = useState('liked');
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
          title: "Authentication Error",
          description: "Please log in to view your library",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log('Fetching library data with token:', token); // Debug log
        const [{ likedSongs }, { playlists }] = await Promise.all([
          authApi.getLikedSongs(token),
          authApi.getPlaylists(token)
        ]);
        console.log('Fetched data:', { likedSongs, playlists }); // Debug log
        setLikedSongs(likedSongs);
        setPlaylists(playlists);
      } catch (error) {
        console.error('Error loading library data:', error);
        // Check if it's an authentication error
        if (error.message?.includes('401') || error.message?.includes('auth')) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          // Clear invalid token
          localStorage.removeItem('token');
          // Redirect to login
          window.location.href = '/login';
        } else {
          toast({
            title: "Error",
            description: "Failed to load library data",
            variant: "destructive",
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
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { playlist } = await authApi.createPlaylist(token, newPlaylistName, newPlaylistDescription);
      setPlaylists([...playlists, playlist]);
      setIsCreatePlaylistOpen(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      toast({
        title: "Success",
        description: "Playlist created successfully",
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Your Library</h1>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              activeTab === 'playlists'
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            onClick={() => setActiveTab('playlists')}
          >
            Playlists
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              activeTab === 'liked'
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            onClick={() => setActiveTab('liked')}
          >
            Liked Songs
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              activeTab === 'recent'
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            onClick={() => setActiveTab('recent')}
          >
            Recently Played
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {activeTab === 'liked' && (
            <div className="space-y-4">
              {likedSongs.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p>No liked songs yet</p>
                  <p className="text-sm mt-2">Start liking songs to see them here</p>
                </div>
              ) : (
                likedSongs.map((track, index) => (
                  <HorizontalMusicCard
                    key={track.id}
                    track={track}
                    playlist={likedSongs}
                    index={index}
                  />
                ))
              )}
            </div>
          )}
          {activeTab === 'playlists' && (
            <div>
              <div className="flex justify-end mb-4">
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
                        <label className="text-sm font-medium mb-1 block">Name</label>
                        <Input
                          placeholder="Enter playlist name"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description (optional)</label>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {playlists.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-12">
                    <p>No playlists yet</p>
                    <p className="text-sm mt-2">Create a playlist to see it here</p>
                  </div>
                ) : (
                  playlists.map((playlist) => (
                    <div
                      key={playlist._id}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/playlist/${playlist._id}`)}
                    >
                      <div className="aspect-square bg-white/10 rounded-lg mb-4 flex items-center justify-center">
                        {playlist?.coverImage ? (
                          <img
                            src={playlist.coverImage}
                            alt={playlist.name || 'Playlist'}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-4xl text-white/60">🎵</div>
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                      <p className="text-sm text-white/60 mt-1">{playlist.tracks.length} tracks</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === 'recent' && (
            <div className="space-y-4">
              {recentlyPlayed.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p>No recently played tracks</p>
                  <p className="text-sm mt-2">Start playing some music!</p>
                </div>
              ) : (
                recentlyPlayed.map((track, index) => (
                  <HorizontalMusicCard
                    key={track.id}
                    track={track}
                    playlist={recentlyPlayed}
                    index={index}
                  />
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
