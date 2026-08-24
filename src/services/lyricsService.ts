export interface LyricsResult {
  text: string;
  source: 'lrclib' | 'lyricsovh';
  synced: boolean;
}

type TrackSource = 'jiosaavn' | 'audius' | 'creator' | undefined;

const LYRICS_API_BASE = `${import.meta.env.VITE_API_URL}/lyrics`;

const cache = new Map<string, LyricsResult | null>();

const decodeHtml = (value: string): string =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&amp;', '&');

const normalizeTitle = (title: string): string =>
  decodeHtml(title)
    .replace(/\(from[^)]*\)/gi, '')
    .replace(/\(feat\.[^)]*\)/gi, '')
    .replace(/\s*-\s*(telugu|hindi|tamil|punjabi|malayalam|kannada|bengali)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeArtist = (artist: string): string =>
  decodeHtml(artist)
    .split(',')[0]
    .split('&')[0]
    .trim();

const isPlaceholderArtist = (artist: string): boolean =>
  /^(unknown artist|you)$/i.test(normalizeArtist(artist));

const shouldLookupLyrics = (trackTitle: string, artistName: string, source?: TrackSource): boolean => {
  if (source === 'creator') return false;

  const title = normalizeTitle(trackTitle);
  if (!title) return false;

  if (isPlaceholderArtist(artistName)) return false;
  return true;
};

const keyFor = (title: string, artist: string): string =>
  `${normalizeTitle(title).toLowerCase()}::${normalizeArtist(artist).toLowerCase()}`;

const withTimeout = async (url: string, timeoutMs = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const fetchLyricsFromBackend = async (trackTitle: string, artistName: string): Promise<LyricsResult | null> => {
  const title = normalizeTitle(trackTitle);
  const artist = normalizeArtist(artistName || 'Unknown Artist');
  const url = `${LYRICS_API_BASE}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;

  try {
    const response = await withTimeout(url);
    if (!response.ok) return null;

    const payload = await response.json();
    const lyrics = payload?.lyrics;
    if (!lyrics || typeof lyrics !== 'object') return null;
    if (lyrics.source !== 'lrclib' && lyrics.source !== 'lyricsovh') return null;

    const text = String(lyrics.text || '').trim();
    if (text.length < 20) return null;

    return {
      text,
      source: lyrics.source,
      synced: Boolean(lyrics.synced),
    };
  } catch {
    return null;
  }
};

export async function getLyrics(
  trackTitle: string,
  artistName: string,
  source?: TrackSource,
): Promise<LyricsResult | null> {
  if (!shouldLookupLyrics(trackTitle, artistName, source)) {
    return null;
  }

  const cacheKey = keyFor(trackTitle, artistName);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  const result = await fetchLyricsFromBackend(trackTitle, artistName);
  cache.set(cacheKey, result ?? null);
  return result ?? null;
}
