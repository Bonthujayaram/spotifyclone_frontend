import type { Track } from '@/contexts/PlayerContext';
import type { User } from '@/contexts/AuthContext';

const AUTH_API_URL = import.meta.env.VITE_API_URL;

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

export interface UserSettings {
  audioQuality: 'auto' | 'low' | 'medium' | 'high';
  autoplay: boolean;
  accountPrivacy: 'public' | 'friends' | 'private';
  notifications: 'all' | 'push_email' | 'push' | 'email' | 'none';
  connectedAccounts: {
    google: boolean;
  };
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

interface SettingsResponse {
  settings: UserSettings;
  user?: User;
  message?: string;
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

export interface CreatorTrackStats {
  plays: number;
  completePlays: number;
  skips: number;
  likes: number;
  totalListenSeconds: number;
  lastPlayedAt: string | null;
}

export interface CreatorTrackDailyStat {
  date: string;
  plays: number;
  completePlays: number;
  listenSeconds: number;
}

export interface CreatorTrack {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  isPublic: boolean;
  coverImage: string;
  audioUrl: string;
  mimeType: string;
  sizeBytes: number;
  duration: number;
  uploadedAt: string;
  stats: CreatorTrackStats;
  dailyStats: CreatorTrackDailyStat[];
}

export interface PublicCreatorTrackOwner {
  id: string;
  name: string;
  profilePicture: string;
}

export interface PublicCreatorTrack extends CreatorTrack {
  owner: PublicCreatorTrackOwner;
}

export interface CreatorDashboardSummary {
  totalTracks: number;
  totalPlays: number;
  totalCompletePlays: number;
  completionRate: number;
  totalListenSeconds: number;
  totalListenHours: number;
}

export interface CreatorDashboardDay {
  date: string;
  label: string;
  plays: number;
  completePlays: number;
  listenSeconds: number;
}

export interface CreatorDashboardResponse {
  summary: CreatorDashboardSummary;
  weeklySeries: CreatorDashboardDay[];
  tracks: CreatorTrack[];
}

export interface CreateCreatorTrackPayload {
  title: string;
  description?: string;
  genre?: string;
  tags?: string[] | string;
  isPublic?: boolean;
  coverImage?: string;
  audioDataUrl: string;
  mimeType?: string;
  sizeBytes?: number;
  duration?: number;
}

interface CreateCreatorTrackResponse {
  message: string;
  track: CreatorTrack;
}

interface PublicCreatorTracksResponse {
  tracks: PublicCreatorTrack[];
  pagination: {
    offset: number;
    limit: number;
    count: number;
  };
}

type CreatorTrackEvent = 'play' | 'skip' | 'complete' | 'like';

interface CreatorTrackEventPayload {
  event: CreatorTrackEvent;
  listenSeconds?: number;
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

  getSettings: async (token: string): Promise<SettingsResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get settings');
    }

    return response.json();
  },

  updateSettings: async (token: string, settings: Partial<UserSettings>): Promise<SettingsResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update settings');
    }

    return response.json();
  },

  changePassword: async (token: string, currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${AUTH_API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }

    return response.json();
  },

  deleteAccount: async (token: string, password?: string): Promise<{ message: string }> => {
    const response = await fetch(`${AUTH_API_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete account');
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

  updatePlaylist: async (
    token: string,
    playlistId: string,
    updates: { name?: string; description?: string },
  ): Promise<PlaylistResponse> => {
    const response = await fetch(`${AUTH_API_URL}/playlists/${playlistId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update playlist');
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
    const endpoint = `${AUTH_API_URL}/follow/${userId}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(artistData ? { artistData } : {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to follow user');
    }

    return response.json();
  },

  unfollowUser: async (token: string, userId: string): Promise<FollowResponse> => {
    const endpoint = `${AUTH_API_URL}/follow/${userId}`;

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
    const endpoint = `${AUTH_API_URL}/follow/${userId}/status`;

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

  // Creator endpoints
  createCreatorTrack: async (token: string, payload: CreateCreatorTrackPayload): Promise<CreateCreatorTrackResponse> => {
    const response = await fetch(`${AUTH_API_URL}/creator/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to upload track' }));
      throw new Error(error.message || 'Failed to upload track');
    }

    return response.json();
  },

  getCreatorDashboard: async (token: string): Promise<CreatorDashboardResponse> => {
    const response = await fetch(`${AUTH_API_URL}/creator/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to load creator dashboard' }));
      throw new Error(error.message || 'Failed to load creator dashboard');
    }

    return response.json();
  },

  getPublicCreatorTracks: async (params?: {
    limit?: number;
    offset?: number;
    search?: string;
    genre?: string;
  }): Promise<PublicCreatorTracksResponse> => {
    const searchParams = new URLSearchParams();
    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit));
    }
    if (typeof params?.offset === 'number') {
      searchParams.set('offset', String(params.offset));
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    if (params?.genre) {
      searchParams.set('genre', params.genre);
    }

    const query = searchParams.toString();
    const response = await fetch(`${AUTH_API_URL}/creator/public-tracks${query ? `?${query}` : ''}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to load public tracks' }));
      throw new Error(error.message || 'Failed to load public tracks');
    }

    return response.json();
  },

  deleteCreatorTrack: async (token: string, trackId: string): Promise<{ message: string }> => {
    const response = await fetch(`${AUTH_API_URL}/creator/tracks/${trackId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete track' }));
      throw new Error(error.message || 'Failed to delete track');
    }

    return response.json();
  },

  recordCreatorTrackEvent: async (
    token: string,
    trackId: string,
    payload: CreatorTrackEventPayload,
  ): Promise<{ message: string; stats: CreatorTrackStats }> => {
    const response = await fetch(`${AUTH_API_URL}/creator/tracks/${trackId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to record track event' }));
      throw new Error(error.message || 'Failed to record track event');
    }

    return response.json();
  },
  
  // Google sign-in
  googleSignIn: async (idToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${AUTH_API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Google sign-in failed' }));
      throw new Error(error.message || 'Google sign-in failed');
    }

    return response.json();
  },
}; 
