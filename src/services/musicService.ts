// JioSaavn API Service
// Official docs: https://saavn.sumit.co/docs
// Base URL: https://saavn.sumit.co

const BASE_URL = 'https://saavn.sumit.co';

export interface JioSaavnSong {
    id: string;
    title: string;
    artist: string;
    image: string;
    duration: number;
    audioUrl: string;
    album?: string;
    year?: string;
    language?: string;
    playCount?: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Extract best image URL from JioSaavn image array.
 * Shape (per docs): [{ quality: "50x50"|"150x150"|"500x500", url: string }]
 */
function extractImage(image: unknown): string {
    if (typeof image === 'string') return image;
    if (Array.isArray(image) && image.length > 0) {
        const arr = image as { quality: string; url: string }[];
        // Prefer 500x500, fall back to last item
        const best = arr.find((i) => i.quality === '500x500') ?? arr[arr.length - 1];
        return best?.url ?? '';
    }
    return '';
}

/**
 * Extract best quality download URL.
 * Shape (per docs): [{ quality: "12kbps"|"48kbps"|"96kbps"|"160kbps"|"320kbps", url: string }]
 */
function extractAudioUrl(downloadUrl: unknown): string {
    if (typeof downloadUrl === 'string') return downloadUrl;
    if (Array.isArray(downloadUrl) && downloadUrl.length > 0) {
        const arr = downloadUrl as { quality: string; url: string }[];
        const qualitySetting =
            typeof window !== 'undefined'
                ? localStorage.getItem('audio_quality') || 'auto'
                : 'auto';

        const preferredBySetting: Record<string, string[]> = {
            high: ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'],
            auto: ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'],
            medium: ['160kbps', '96kbps', '48kbps', '12kbps'],
            low: ['96kbps', '48kbps', '12kbps'],
        };

        const preferred = preferredBySetting[qualitySetting] || preferredBySetting.auto;
        for (const quality of preferred) {
            const found = arr.find((d) => d.quality === quality);
            if (found?.url) return found.url;
        }
        return arr[arr.length - 1]?.url ?? '';
    }
    return '';
}

/**
 * Extract primary artist names.
 * Shape (per docs): artists.primary = [{ id, name, role, type, image, url }]
 */
function extractArtist(artists: unknown): string {
    if (typeof artists === 'string') return artists;
    if (artists && typeof artists === 'object') {
        const obj = artists as Record<string, unknown>;
        // Full song detail response: { primary: [...], featured: [...], all: [...] }
        if (Array.isArray(obj.primary) && obj.primary.length > 0) {
            return (obj.primary as { name: string }[]).map((a) => a.name).join(', ');
        }
        // Search result song: primaryArtists is a string on old API; new API uses artists.primary
        if (typeof obj.primaryArtists === 'string') return obj.primaryArtists;
        if (typeof obj.name === 'string') return obj.name;
    }
    return 'Unknown Artist';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSong(song: any): JioSaavnSong {
    return {
        id: String(song.id ?? ''),
        title: String(song.name ?? song.title ?? 'Unknown Title'),
        artist: extractArtist(song.artists ?? song.primaryArtists ?? ''),
        image: extractImage(song.image),
        duration: Number(song.duration ?? 0),
        audioUrl: extractAudioUrl(song.downloadUrl),
        album: typeof song.album === 'object' ? (song.album?.name ?? '') : String(song.album ?? ''),
        year: String(song.year ?? ''),
        language: String(song.language ?? ''),
        playCount: Number(song.playCount ?? 0),
    };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search songs on JioSaavn
 * Endpoint: GET /api/search/songs?query=...&page=0&limit=20
 */
export async function searchSongs(query: string, limit = 20): Promise<JioSaavnSong[]> {
    try {
        const url = `${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=0&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`JioSaavn searchSongs error: ${res.status}`);
        const json = await res.json();

        // Response: { success: true, data: { total, start, results: [...] } }
        const results: unknown[] = json?.data?.results ?? [];
        if (!Array.isArray(results)) return [];
        return results.map(normalizeSong);
    } catch (error) {
        console.error('[musicService] searchSongs failed:', error);
        return [];
    }
}

/**
 * Global search — returns songs, albums, artists, playlists
 * Endpoint: GET /api/search?query=...
 */
export async function searchAll(query: string): Promise<{
    songs: JioSaavnSong[];
    albums: unknown[];
    artists: unknown[];
    playlists: unknown[];
}> {
    try {
        const url = `${BASE_URL}/api/search?query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`JioSaavn searchAll error: ${res.status}`);
        const json = await res.json();

        // Response: { success: true, data: { songs, albums, artists, playlists, topQuery } }
        const data = json?.data ?? {};
        const songs: JioSaavnSong[] = (data?.songs?.results ?? []).map(normalizeSong);
        const albums: unknown[] = data?.albums?.results ?? [];
        const artists: unknown[] = data?.artists?.results ?? [];
        const playlists: unknown[] = data?.playlists?.results ?? [];

        return { songs, albums, artists, playlists };
    } catch (error) {
        console.error('[musicService] searchAll failed:', error);
        return { songs: [], albums: [], artists: [], playlists: [] };
    }
}

/**
 * Get song details by ID
 * Endpoint: GET /api/songs/{id}
 * Response: { success: true, data: [SongDetail] }  (array with one item)
 */
export async function getSongDetails(id: string): Promise<JioSaavnSong | null> {
    try {
        const url = `${BASE_URL}/api/songs/${encodeURIComponent(id)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`JioSaavn getSongDetails error: ${res.status}`);
        const json = await res.json();

        // data is always an array per the spec
        const raw = Array.isArray(json?.data) ? json.data[0] : null;
        if (!raw?.id) return null;
        return normalizeSong(raw);
    } catch (error) {
        console.error('[musicService] getSongDetails failed:', error);
        return null;
    }
}

/**
 * Get song suggestions for infinite/autoplay queue
 * Endpoint: GET /api/songs/{id}/suggestions?limit=10
 */
export async function getSongSuggestions(id: string, limit = 10): Promise<JioSaavnSong[]> {
    try {
        const url = `${BASE_URL}/api/songs/${encodeURIComponent(id)}/suggestions?limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`JioSaavn getSongSuggestions error: ${res.status}`);
        const json = await res.json();

        const results: unknown[] = json?.data ?? [];
        if (!Array.isArray(results)) return [];
        return results.map(normalizeSong);
    } catch (error) {
        console.error('[musicService] getSongSuggestions failed:', error);
        return [];
    }
}
