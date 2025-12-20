import type { Track } from '@/contexts/PlayerContext';
import type { User } from '@/contexts/AuthContext';

const AUTH_API_URL = 'http://localhost:5000/api';

interface LoginData {
  email: string;
  password: string;
}

interface SignupData extends LoginData {
  name?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface UpdateProfileData {
  name?: string;
  profilePicture?: string;
}

interface LikedSongsResponse {
  likedSongs: Track[];
}

interface RecentlyPlayedResponse {
  recentlyPlayed: { track: Track; playedAt: string }[];
}

interface Playlist {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

interface PlaylistsResponse {
  playlists: Playlist[];
}

interface PlaylistResponse {
  playlist: Playlist;
}

interface FollowResponse {
  message: string;
  followersCount: number;
  followingCount: number;
}

interface FollowStatusResponse {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

interface ExternalArtist {
  id: string;
  name: string;
  handle: string;
  profile_picture: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  follower_count?: number;
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to login');
    }

    return response.json();
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to signup');
    }

    return response.json();
  },

  getCurrentUser: async (token: string) => {
    const response = await fetch(`${AUTH_API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user data');
    }

    return response.json();
  },

  updateProfile: async (token: string, data: UpdateProfileData): Promise<{ user: User }> => {
    const response = await fetch(`${AUTH_API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  },

  likeSong: async (token: string, track: Track, action: 'like' | 'unlike'): Promise<LikedSongsResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/like-song`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ track, action }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update liked songs');
    }

    return response.json();
  },

  getLikedSongs: async (token: string): Promise<LikedSongsResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/liked-songs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get liked songs');
    }

    return response.json();
  },

  // Recently Played endpoints
  addToRecentlyPlayed: async (token: string, track: Track): Promise<RecentlyPlayedResponse> => {
    const response = await fetch(`${AUTH_API_URL}/recently-played`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ track }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to recently played');
    }

    return response.json();
  },

  getRecentlyPlayed: async (token: string): Promise<RecentlyPlayedResponse> => {
    const response = await fetch(`${AUTH_API_URL}/recently-played`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get recently played tracks');
    }

    return response.json();
  },

  // Playlist endpoints
  createPlaylist: async (token: string, name: string, description?: string): Promise<PlaylistResponse> => {
    const response = await fetch(`${AUTH_API_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create playlist');
    }

    return response.json();
  },

  getPlaylists: async (token: string): Promise<PlaylistsResponse> => {
    const response = await fetch(`${AUTH_API_URL}/playlists`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get playlists');
    }

    return response.json();
  },

  getPlaylist: async (token: string, playlistId: string): Promise<PlaylistResponse> => {
    const response = await fetch(`${AUTH_API_URL}/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get playlist');
    }

    return response.json();
  },

  addToPlaylist: async (token: string, playlistId: string, track: Track): Promise<PlaylistResponse> => {
    const response = await fetch(`${AUTH_API_URL}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ track }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add track to playlist');
    }

    return response.json();
  },

  removeFromPlaylist: async (token: string, playlistId: string, trackId: string): Promise<PlaylistResponse> => {
    const response = await fetch(`${AUTH_API_URL}/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove track from playlist');
    }

    return response.json();
  },

  deletePlaylist: async (token: string, playlistId: string): Promise<void> => {
    const response = await fetch(`${AUTH_API_URL}/playlists/${playlistId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete playlist');
    }
  },

  // Follow endpoints
  followUser: async (token: string, userId: string, artistData?: ExternalArtist): Promise<FollowResponse> => {
    const isAudiusArtist = userId.length < 24; // MongoDB IDs are 24 chars
    const endpoint = `${AUTH_API_URL}/follow/${userId}${isAudiusArtist ? '?platform=audius' : ''}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(isAudiusArtist ? {
        platform: 'audius',
        artistData
      } : {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to follow user');
    }

    return response.json();
  },

  unfollowUser: async (token: string, userId: string): Promise<FollowResponse> => {
    const isAudiusArtist = userId.length < 24; // MongoDB IDs are 24 chars
    const endpoint = `${AUTH_API_URL}/follow/${userId}${isAudiusArtist ? '?platform=audius' : ''}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unfollow user');
    }

    return response.json();
  },

  getFollowStatus: async (token: string, userId: string): Promise<FollowStatusResponse> => {
    const isAudiusArtist = userId.length < 24; // MongoDB IDs are 24 chars
    const endpoint = `${AUTH_API_URL}/follow/${userId}/status${isAudiusArtist ? '?platform=audius' : ''}`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get follow status');
    }

    return response.json();
  },
}; 