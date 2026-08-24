import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authApi } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';
import MusicCard from '@/components/MusicCard';
import type { Track } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

const Playlist = () => {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadPlaylist = async () => {
      const token = localStorage.getItem('token');
      if (!token || !id) {
        setLoading(false);
        return;
      }

      try {
        const { playlist } = await authApi.getPlaylist(token, id);
        setPlaylist(playlist);
        setEditName(playlist.name);
        setEditDescription(playlist.description);
      } catch (error) {
        console.error('Error loading playlist:', error);
        toast({
          title: "Error",
          description: "Failed to load playlist",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlaylist();
  }, [id, toast]);

  const handleUpdatePlaylist = async () => {
    if (!editName.trim() || !id) {
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
      const { playlist: updatedPlaylist } = await authApi.updatePlaylist(token, id, {
        name: editName,
        description: editDescription,
      });
      setPlaylist(updatedPlaylist);
      setIsEditOpen(false);
      toast({
        title: "Success",
        description: "Playlist updated successfully",
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaylist = async () => {
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await authApi.deletePlaylist(token, id);
      window.location.href = '/library';
      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-white/5 rounded-lg mb-6" />
          <div className="h-8 w-48 bg-white/5 rounded mb-4" />
          <div className="h-4 w-96 bg-white/5 rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg aspect-square" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-white/60 mt-2">{playlist.description}</p>
          )}
          <p className="text-sm text-white/40 mt-1">
            {playlist.tracks.length} tracks • Created{' '}
            {new Date(playlist.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <Input
                    placeholder="Enter playlist name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                  <Textarea
                    placeholder="Enter playlist description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="destructive" onClick={handleDeletePlaylist}>
                    Delete Playlist
                  </Button>
                  <Button onClick={handleUpdatePlaylist}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {playlist.tracks.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            <p>No tracks in this playlist</p>
            <p className="text-sm mt-2">Add tracks to get started</p>
          </div>
        ) : (
          playlist.tracks.map((track) => (
            <MusicCard
              key={track.id}
              track={track}
              playlist={playlist.tracks}
              onRemove={async () => {
                const token = localStorage.getItem('token');
                if (!token) return;

                try {
                  const { playlist: updatedPlaylist } = await authApi.removeFromPlaylist(
                    token,
                    playlist._id,
                    track.id
                  );
                  setPlaylist(updatedPlaylist);
                  toast({
                    title: "Success",
                    description: "Track removed from playlist",
                  });
                } catch (error) {
                  console.error('Error removing track from playlist:', error);
                  toast({
                    title: "Error",
                    description: "Failed to remove track from playlist",
                    variant: "destructive",
                  });
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Playlist; 