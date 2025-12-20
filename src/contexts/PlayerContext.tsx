import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { authApi } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';

const LAST_PLAYED_KEY = 'lastPlayedTrack';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  user?: {
    name: string;
  };
  artwork?: {
    '480x480'?: string;
    '150x150'?: string;
  };
  streamUrl?: string;
  play_count?: number;
  trending?: number;
  release_date?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  audioUrl: string | null;
  likedTracks: Set<string>;
  recentlyPlayed: Track[];
  playTrack: (track: Track, playlist?: Track[]) => Promise<void>;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setCurrentTrack: (track: Track) => void;
  togglePlayPause: () => Promise<void>;
  toggleLike: (track: Track) => Promise<void>;
  isLiked: (trackId: string) => boolean;
  getRecentlyPlayed: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Load liked songs and recently played on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [{ likedSongs }, recentlyPlayedRes] = await Promise.all([
          authApi.getLikedSongs(token),
          authApi.getRecentlyPlayed(token)
        ]);
        
        const likedIds = new Set(likedSongs.map(song => song.id));
        setLikedTracks(likedIds);
        
        if (recentlyPlayedRes.recentlyPlayed) {
          setRecentlyPlayed(recentlyPlayedRes.recentlyPlayed.map(item => item.track));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load last played track on mount
  useEffect(() => {
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    if (lastPlayed) {
      try {
        const track = JSON.parse(lastPlayed);
        setCurrentTrack(track);
        setPlaylist([track]);
      } catch (error) {
        console.error('Error loading last played track:', error);
        localStorage.removeItem(LAST_PLAYED_KEY);
      }
    }
  }, []);

  // Create audio element on mount
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.id = 'music-player';
    document.body.appendChild(audio);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.remove();
    };
  }, []);

  const loadAudioUrl = async (track: Track) => {
    try {
      if (track.streamUrl) {
        setAudioUrl(track.streamUrl);
        if (audioRef.current) {
          audioRef.current.src = track.streamUrl;
          // Preload the audio
          audioRef.current.load();
        }
        return true;
      }

      const response = await api.getStreamUrl(track.id);
      if (response.data) {
        const streamUrl = response.data;
        setAudioUrl(streamUrl);
        if (audioRef.current) {
          audioRef.current.src = streamUrl;
          // Preload the audio
          audioRef.current.load();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading audio URL:', error);
      return false;
    }
  };

  const addToRecentlyPlayed = async (track: Track) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await authApi.addToRecentlyPlayed(token, track);
      const response = await authApi.getRecentlyPlayed(token);
      if (response.recentlyPlayed) {
        setRecentlyPlayed(response.recentlyPlayed.map(item => item.track));
      }
    } catch (error) {
      console.error('Error updating recently played:', error);
    }
  };

  const playTrack = async (track: Track, newPlaylist?: Track[]) => {
    try {
      if (audioRef.current) {
        // Stop current playback
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const success = await loadAudioUrl(track);
      if (success && audioRef.current) {
        setCurrentTrack(track);
        // Save to localStorage
        localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(track));
        
        if (newPlaylist) {
          setPlaylist(newPlaylist);
        } else {
          setPlaylist([track]);
        }
        setIsPlaying(true);
        
        // Add to recently played
        await addToRecentlyPlayed(track);
        
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (error) {
          console.error('Playback error:', error);
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = async () => {
    if (audioRef.current && currentTrack) {
      try {
        if (!audioRef.current.src) {
          await loadAudioUrl(currentTrack);
        }
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error resuming playback:', error);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      await resumeTrack();
    }
  };

  const nextTrack = async () => {
    if (!currentTrack || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];
    
    await playTrack(nextTrack, playlist);
  };

  const previousTrack = async () => {
    if (!currentTrack || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const previousTrack = playlist[previousIndex];
    
    await playTrack(previousTrack, playlist);
  };

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      nextTrack();
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef.current, playlist]);

  const toggleLike = async (track: Track) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Error",
        description: "Please log in to like songs",
        variant: "destructive",
      });
      return;
    }

    try {
      const action = likedTracks.has(track.id) ? 'unlike' : 'like';
      const { likedSongs } = await authApi.likeSong(token, track, action);
      
      // Update local state
      const newLikedTracks = new Set(likedSongs.map(song => song.id));
      setLikedTracks(newLikedTracks);
      
      toast({
        title: action === 'like' ? "Added to Liked Songs" : "Removed from Liked Songs",
        description: `${track.title} has been ${action === 'like' ? 'added to' : 'removed from'} your liked songs`,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update liked songs",
        variant: "destructive",
      });
    }
  };

  const isLiked = (trackId: string) => {
    return likedTracks.has(trackId);
  };

  const getRecentlyPlayed = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await authApi.getRecentlyPlayed(token);
      if (response.recentlyPlayed) {
        setRecentlyPlayed(response.recentlyPlayed.map(item => item.track));
      }
    } catch (error) {
      console.error('Error fetching recently played:', error);
    }
  };

  const value = {
    currentTrack,
    playlist,
    isPlaying,
    audioUrl,
    likedTracks,
    recentlyPlayed,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    previousTrack,
    setCurrentTrack,
    togglePlayPause,
    toggleLike,
    isLiked,
    getRecentlyPlayed,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}; 