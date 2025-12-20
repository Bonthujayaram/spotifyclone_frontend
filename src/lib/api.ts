const API_BASE_URL = 'http://localhost:5000/api/audius';

export const api = {
  // Search
  search: async (query: string, type: string = 'tracks', limit: number = 50, offset: number = 0) => {
    const url = new URL(`${API_BASE_URL}/search`);
    url.searchParams.append('query', encodeURIComponent(query));
    url.searchParams.append('type', type);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());
    const response = await fetch(url.toString());
    return response.json();
  },

  // Tracks
  getTrack: async (trackId: string) => {
    const response = await fetch(`${API_BASE_URL}/tracks/${trackId}`);
    return response.json();
  },

  getStreamUrl: async (trackId: string) => {
    const response = await fetch(`${API_BASE_URL}/tracks/${trackId}/stream`);
    return response.json();
  },

  // Users
  getUser: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return response.json();
  },

  getUserTracks: async (userId: string, limit: number = 10) => {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/tracks?limit=${limit}`
    );
    return response.json();
  },

  // Trending
  getTrending: async (time: string = 'week', limit: number = 10) => {
    const url = new URL(`${API_BASE_URL}/trending`);
    url.searchParams.append('limit', limit.toString());
    if (time) url.searchParams.append('time', time);
    const response = await fetch(url.toString());
    return response.json();
  },

  getTrendingArtists: async (limit: number = 10) => {
    const url = new URL(`${API_BASE_URL}/trending-artists`);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    return response.json();
  },

  getTrendingPlaylists: async (limit: number = 10) => {
    const url = new URL(`${API_BASE_URL}/trending-playlists`);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    return response.json();
  },

  // Popular
  getPopular: async (limit: number = 10) => {
    const url = new URL(`${API_BASE_URL}/popular`);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    return response.json();
  },

  getRecentTracks: async (limit: number = 10) => {
    const url = new URL(`${API_BASE_URL}/recent`);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    return response.json();
  },

  // Recent
  getRecent: async (limit: number = 10) => {
    const url = new URL(`${API_BASE_URL}/recent`);
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    return response.json();
  },

  // Playlists
  getPlaylist: async (playlistId: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`);
    return response.json();
  },
}; 