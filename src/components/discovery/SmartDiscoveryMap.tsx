import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Globe2, MapPin, Pause, Play, Sparkles } from 'lucide-react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { searchSongs, type JioSaavnSong } from '@/services/musicService';
import { usePlayer, type Track } from '@/contexts/PlayerContext';
import Spinner from '@/components/Spinner';

type LatLng = [number, number];

type Region = {
  id: string;
  label: string;
  subtitle: string;
  center: LatLng;
  color: string;
  defaultHotspotId: string;
};

type Hotspot = {
  id: string;
  regionId: string;
  city: string;
  country: string;
  label: string;
  position: LatLng;
  queries: string[];
};

const MAX_TRACKS = 24;
const QUERY_LIMIT = 18;
const QUERY_YEAR = new Date().getFullYear();
const QUERY_PREV_YEAR = QUERY_YEAR - 1;
const MIN_RECENT_YEAR = QUERY_PREV_YEAR;

const REGIONS: Region[] = [
  {
    id: 'india',
    label: 'India',
    subtitle: 'State-level language trends',
    center: [22.6, 79.2],
    color: '#22c55e',
    defaultHotspotId: 'in-hyderabad',
  },
  {
    id: 'korea',
    label: 'Korea',
    subtitle: 'K-Pop and K-HipHop',
    center: [36.4, 127.8],
    color: '#6366f1',
    defaultHotspotId: 'kr-seoul',
  },
  {
    id: 'usa',
    label: 'USA',
    subtitle: 'Hip-Hop, Trap and Pop',
    center: [39.8, -98.6],
    color: '#f97316',
    defaultHotspotId: 'us-new-york',
  },
  {
    id: 'latin',
    label: 'Latin',
    subtitle: 'Latin pop and regional charts',
    center: [-14.2, -59.1],
    color: '#06b6d4',
    defaultHotspotId: 'br-sao-paulo',
  },
  {
    id: 'africa',
    label: 'Africa',
    subtitle: 'Afrobeats and Amapiano',
    center: [5.7, 20.2],
    color: '#eab308',
    defaultHotspotId: 'ng-lagos',
  },
  {
    id: 'europe',
    label: 'Europe',
    subtitle: 'UK pop, French hits, EDM',
    center: [50.8, 11.8],
    color: '#0ea5e9',
    defaultHotspotId: 'uk-london',
  },
  {
    id: 'japan',
    label: 'Japan',
    subtitle: 'J-Pop and anime songs',
    center: [36.2, 138.4],
    color: '#a855f7',
    defaultHotspotId: 'jp-tokyo',
  },
];

const HOTSPOTS: Hotspot[] = [
  // India state/language trends
  {
    id: 'in-hyderabad',
    regionId: 'india',
    city: 'Hyderabad',
    country: 'India',
    label: 'Telugu',
    position: [17.385, 78.4867],
    queries: ['latest telugu songs hyderabad', 'telugu hits', 'tollywood chartbusters'],
  },
  {
    id: 'in-mumbai',
    regionId: 'india',
    city: 'Mumbai',
    country: 'India',
    label: 'Hindi',
    position: [19.076, 72.8777],
    queries: ['latest hindi songs mumbai', 'hindi hits', 'bollywood chartbusters'],
  },
  {
    id: 'in-chennai',
    regionId: 'india',
    city: 'Chennai',
    country: 'India',
    label: 'Tamil',
    position: [13.0827, 80.2707],
    queries: ['latest tamil songs chennai', 'tamil hits', 'kollywood hits'],
  },
  {
    id: 'in-chandigarh',
    regionId: 'india',
    city: 'Chandigarh',
    country: 'India',
    label: 'Punjabi',
    position: [30.7333, 76.7794],
    queries: ['latest punjabi songs chandigarh', 'punjabi hits', 'punjabi top songs'],
  },
  {
    id: 'in-bengaluru',
    regionId: 'india',
    city: 'Bengaluru',
    country: 'India',
    label: 'Kannada',
    position: [12.9716, 77.5946],
    queries: ['kannada hits', 'trending kannada songs', 'kannada chartbusters'],
  },
  {
    id: 'in-kochi',
    regionId: 'india',
    city: 'Kochi',
    country: 'India',
    label: 'Malayalam',
    position: [9.9312, 76.2673],
    queries: ['malayalam hits', 'trending malayalam songs', 'malayalam chartbusters'],
  },
  {
    id: 'in-kolkata',
    regionId: 'india',
    city: 'Kolkata',
    country: 'India',
    label: 'Bengali',
    position: [22.5726, 88.3639],
    queries: ['bengali hits', 'trending bengali songs', 'bengali chartbusters'],
  },

  // Korea
  {
    id: 'kr-seoul',
    regionId: 'korea',
    city: 'Seoul',
    country: 'Korea',
    label: 'K-Pop',
    position: [37.5665, 126.978],
    queries: ['k-pop hits', 'kpop', 'korean pop trending'],
  },
  {
    id: 'kr-busan',
    regionId: 'korea',
    city: 'Busan',
    country: 'Korea',
    label: 'K-HipHop',
    position: [35.1796, 129.0756],
    queries: ['korean hip hop', 'k-hiphop hits', 'k-pop rap songs'],
  },

  // USA
  {
    id: 'us-new-york',
    regionId: 'usa',
    city: 'New York',
    country: 'USA',
    label: 'Hip-Hop',
    position: [40.7128, -74.006],
    queries: ['hip hop trending usa', 'hip hop hits', 'us rap hits'],
  },
  {
    id: 'us-atlanta',
    regionId: 'usa',
    city: 'Atlanta',
    country: 'USA',
    label: 'Trap',
    position: [33.749, -84.388],
    queries: ['trap hits', 'atlanta rap hits', 'trap chartbusters'],
  },
  {
    id: 'us-los-angeles',
    regionId: 'usa',
    city: 'Los Angeles',
    country: 'USA',
    label: 'Pop',
    position: [34.0522, -118.2437],
    queries: ['us pop hits', 'billboard top songs', 'pop trending songs'],
  },

  // Europe
  {
    id: 'uk-london',
    regionId: 'europe',
    city: 'London',
    country: 'United Kingdom',
    label: 'UK Pop',
    position: [51.5072, -0.1276],
    queries: ['uk top hits', 'uk pop hits', 'british chart songs'],
  },
  {
    id: 'fr-paris',
    regionId: 'europe',
    city: 'Paris',
    country: 'France',
    label: 'French Pop',
    position: [48.8566, 2.3522],
    queries: ['french pop hits', 'france top songs', 'french trending songs'],
  },
  {
    id: 'de-berlin',
    regionId: 'europe',
    city: 'Berlin',
    country: 'Germany',
    label: 'EDM',
    position: [52.52, 13.405],
    queries: ['edm hits', 'electronic dance hits', 'dance music trending'],
  },

  // Africa
  {
    id: 'ng-lagos',
    regionId: 'africa',
    city: 'Lagos',
    country: 'Nigeria',
    label: 'Afrobeats',
    position: [6.5244, 3.3792],
    queries: ['afrobeats trending', 'nigerian hits', 'afrobeats hits'],
  },
  {
    id: 'za-johannesburg',
    regionId: 'africa',
    city: 'Johannesburg',
    country: 'South Africa',
    label: 'Amapiano',
    position: [-26.2041, 28.0473],
    queries: ['amapiano hits', 'south african hits', 'african dance songs'],
  },

  // Latin
  {
    id: 'br-sao-paulo',
    regionId: 'latin',
    city: 'Sao Paulo',
    country: 'Brazil',
    label: 'Brazil Funk',
    position: [-23.5505, -46.6333],
    queries: ['brazil funk hits', 'brazil top songs', 'brazil trending songs'],
  },
  {
    id: 'mx-mexico-city',
    regionId: 'latin',
    city: 'Mexico City',
    country: 'Mexico',
    label: 'Latin Pop',
    position: [19.4326, -99.1332],
    queries: ['latin pop hits', 'reggaeton hits', 'latin trending songs'],
  },

  // Japan
  {
    id: 'jp-tokyo',
    regionId: 'japan',
    city: 'Tokyo',
    country: 'Japan',
    label: 'J-Pop',
    position: [35.6762, 139.6503],
    queries: ['j-pop trending', 'j-pop hits', 'japan top songs'],
  },
  {
    id: 'jp-osaka',
    regionId: 'japan',
    city: 'Osaka',
    country: 'Japan',
    label: 'Anime',
    position: [34.6937, 135.5023],
    queries: ['anime songs hits', 'anime opening songs', 'japanese anime music'],
  },
];

const REGION_BY_ID = new Map(REGIONS.map((region) => [region.id, region]));
const HOTSPOT_BY_ID = new Map(HOTSPOTS.map((hotspot) => [hotspot.id, hotspot]));
const INDIA_PRIMARY_STATE_IDS = ['in-hyderabad', 'in-mumbai', 'in-chennai', 'in-chandigarh'];

const cleanText = (value?: string): string =>
  (value ?? '')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&amp;', '&');

const normalizeForDedupe = (value?: string): string =>
  cleanText(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\bversion\s*\d+\b/g, ' ')
    .replace(/\bver\s*\d+\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatDuration = (duration?: number): string => {
  if (!duration || Number.isNaN(duration)) return '--:--';
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const toTrack = (song: JioSaavnSong): Track => ({
  id: song.id,
  title: cleanText(song.title),
  artist: cleanText(song.artist),
  image: song.image,
  audioUrl: song.audioUrl,
  url: song.audioUrl,
  duration: song.duration,
  release_date: song.year ? `${song.year}-01-01` : undefined,
  play_count: song.playCount,
  source: 'jiosaavn',
});

const dedupeTracks = (tracks: Track[]): Track[] => {
  const seenByIdentity = new Set<string>();
  const seenById = new Set<string>();
  return tracks.filter((track) => {
    const normalizedTitle = normalizeForDedupe(track.title);
    const normalizedArtist = normalizeForDedupe(track.artist || track.user?.name || '');
    const identityKey = `${normalizedTitle}|${normalizedArtist}`;
    if (normalizedTitle && seenByIdentity.has(identityKey)) return false;
    if (normalizedTitle) seenByIdentity.add(identityKey);

    if (track.id) {
      if (seenById.has(track.id)) return false;
      seenById.add(track.id);
    }

    return true;
  });
};

const getTrackYear = (track: Track): number => {
  if (!track.release_date) return 0;
  const year = Number(String(track.release_date).slice(0, 4));
  return Number.isFinite(year) ? year : 0;
};

const sortByLatestLanguageRelevance = (tracks: Track[]): Track[] => {
  return [...tracks].sort((a, b) => {
    const yearA = getTrackYear(a);
    const yearB = getTrackYear(b);
    if (yearA !== yearB) return yearB - yearA;

    const playsA = a.play_count ?? 0;
    const playsB = b.play_count ?? 0;
    if (playsA !== playsB) return playsB - playsA;

    return a.title.localeCompare(b.title);
  });
};

const buildHotspotQueryCandidates = (hotspot: Hotspot): string[] => {
  const city = hotspot.city.trim();
  const country = hotspot.country.trim();
  const label = hotspot.label.trim();

  return Array.from(
    new Set(
      [
        `latest ${label} songs ${city}`,
        `${city} latest ${label} songs`,
        `${label} new release ${QUERY_YEAR}`,
        `${label} latest songs ${QUERY_YEAR}`,
        `${label} trending songs ${QUERY_YEAR}`,
        `${label} trending songs ${QUERY_PREV_YEAR}`,
        `${city} ${label} new songs`,
        `${country} ${label} latest songs`,
        `${label} chartbusters ${QUERY_YEAR}`,
        `latest ${label} songs ${city}`,
        `${city} ${label} trending songs`,
        `${city} latest ${label} hits`,
        ...hotspot.queries,
      ]
        .map((query) => query.trim())
        .filter(Boolean),
    ),
  );
};

const FlyToPosition = ({ position, zoom }: { position: LatLng; zoom: number }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, zoom, { duration: 0.8 });
  }, [map, position, zoom]);

  return null;
};

const EnsureMapSize = ({ open }: { open: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (!open) return;
    const resize = () => map.invalidateSize();
    const timeout = window.setTimeout(resize, 220);
    window.addEventListener('resize', resize);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('resize', resize);
    };
  }, [map, open]);

  return null;
};

interface SmartDiscoveryMapProps {
  className?: string;
  triggerVariant?: 'card' | 'sidebar';
}

const SmartDiscoveryMap = ({ className, triggerVariant = 'card' }: SmartDiscoveryMapProps) => {
  const [open, setOpen] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);
  const [tracksByHotspot, setTracksByHotspot] = useState<Record<string, Track[]>>({});
  const [resolvedQueryByHotspot, setResolvedQueryByHotspot] = useState<Record<string, string>>({});
  const [loadingHotspotId, setLoadingHotspotId] = useState<string | null>(null);
  const { playTrack, togglePlayPause, currentTrack, isPlaying } = usePlayer();

  const selectedHotspot = useMemo(
    () => (selectedHotspotId ? HOTSPOT_BY_ID.get(selectedHotspotId) ?? null : null),
    [selectedHotspotId],
  );
  const focusedRegion = useMemo(
    () => (focusedRegionId ? REGION_BY_ID.get(focusedRegionId) ?? null : null),
    [focusedRegionId],
  );
  const selectedRegion = useMemo(
    () => (selectedHotspot ? REGION_BY_ID.get(selectedHotspot.regionId) ?? null : focusedRegion),
    [selectedHotspot, focusedRegion],
  );
  const regionHotspots = useMemo(
    () => (selectedRegion ? HOTSPOTS.filter((hotspot) => hotspot.regionId === selectedRegion.id) : []),
    [selectedRegion],
  );
  const indiaPrimaryHotspots = useMemo(
    () =>
      INDIA_PRIMARY_STATE_IDS.map((id) => HOTSPOT_BY_ID.get(id)).filter((hotspot): hotspot is Hotspot => Boolean(hotspot)),
    [],
  );
  const activeTracks = selectedHotspot ? tracksByHotspot[selectedHotspot.id] ?? [] : [];
  const isLoading = selectedHotspot ? loadingHotspotId === selectedHotspot.id : false;
  const mapFocus = useMemo(() => {
    if (selectedHotspot) return { center: selectedHotspot.position, zoom: 5 };
    if (selectedRegion) return { center: selectedRegion.center, zoom: 4 };
    return { center: [18, 18] as LatLng, zoom: 2 };
  }, [selectedHotspot, selectedRegion]);

  const loadHotspotTracks = useCallback(
    async (hotspot: Hotspot) => {
      if (tracksByHotspot[hotspot.id]) return;

      setLoadingHotspotId(hotspot.id);
      try {
        const queryCandidates = buildHotspotQueryCandidates(hotspot);

        let mergedTracks: Track[] = [];
        let resolvedQuery = '';

        for (const query of queryCandidates) {
          const songs = await searchSongs(query, QUERY_LIMIT);
          const playable = songs
            .map(toTrack)
            .filter((track) => Boolean(track.audioUrl || track.url));

          if (playable.length > 0 && !resolvedQuery) {
            resolvedQuery = query;
          }

          mergedTracks = dedupeTracks([...mergedTracks, ...playable]);
          if (mergedTracks.length >= MAX_TRACKS) break;
        }

        const recentTracks = sortByLatestLanguageRelevance(
          mergedTracks.filter((track) => {
            const year = getTrackYear(track);
            return year >= MIN_RECENT_YEAR;
          }),
        );

        const fallbackTracks = sortByLatestLanguageRelevance(mergedTracks);
        const finalTracks =
          recentTracks.length >= 8
            ? dedupeTracks([...recentTracks, ...fallbackTracks]).slice(0, MAX_TRACKS)
            : fallbackTracks.slice(0, MAX_TRACKS);

        setTracksByHotspot((prev) => ({
          ...prev,
          [hotspot.id]: finalTracks,
        }));
        setResolvedQueryByHotspot((prev) => ({
          ...prev,
          [hotspot.id]: resolvedQuery || hotspot.queries[0] || hotspot.label,
        }));
      } finally {
        setLoadingHotspotId((current) => (current === hotspot.id ? null : current));
      }
    },
    [tracksByHotspot],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedHotspotId(null);
    setFocusedRegionId(null);
    setTracksByHotspot({});
    setResolvedQueryByHotspot({});
  }, [open]);

  useEffect(() => {
    if (!open || !selectedHotspot) return;
    void loadHotspotTracks(selectedHotspot);
  }, [open, selectedHotspot, loadHotspotTracks]);

  const tileUrl = document.documentElement.classList.contains('dark')
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const trigger =
    triggerVariant === 'sidebar' ? (
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'nav-link w-full justify-start text-left',
            'rounded-md border border-border/60 bg-accent/25 hover:bg-accent/55 hover:text-foreground',
            className,
          )}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-primary">
            <Globe2 className="h-3.5 w-3.5" />
          </div>
          <span>Smart Discovery Map</span>
          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">NEW</span>
        </button>
      </DialogTrigger>
    ) : (
      <div className={cn('rounded-2xl border border-border bg-card/75 p-5', className)}>
        <div className="mb-2 flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Smart Discovery Map</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Discover music trends by city, state and country from one interactive map.</p>
        <DialogTrigger asChild>
          <Button className="rounded-full px-5">
            <MapPin className="mr-2 h-4 w-4" /> Open Map
          </Button>
        </DialogTrigger>
      </div>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}

      <DialogContent className="flex h-[94vh] max-h-[94vh] w-[96vw] max-w-[1400px] flex-col overflow-hidden border-border bg-card p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart Discovery Map
          </DialogTitle>
          <DialogDescription>
            Map opens first. Select a region and click a city marker to load trending songs.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-x-auto">
          <div className="grid h-full min-w-[960px] grid-cols-[1.6fr_1fr]">
          <div className="relative h-full min-h-0 border-r border-border">
            {open && (
              <>
                <MapContainer
                  center={[18, 18]}
                  zoom={2}
                  minZoom={2}
                  maxZoom={8}
                  zoomControl={false}
                  className="h-full w-full"
                >
                  <EnsureMapSize open={open} />
                  <TileLayer
                    url={tileUrl}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'
                  />
                  <ZoomControl position="bottomright" />
                  <FlyToPosition position={mapFocus.center} zoom={mapFocus.zoom} />

                  {HOTSPOTS.map((hotspot) => {
                    const region = REGION_BY_ID.get(hotspot.regionId) ?? REGIONS[0];
                    const active = hotspot.id === selectedHotspotId;

                    return (
                      <CircleMarker
                        key={hotspot.id}
                        center={hotspot.position}
                        radius={active ? 10 : 7}
                        pathOptions={{
                          color: region.color,
                          weight: active ? 2.5 : 1.5,
                          fillColor: region.color,
                          fillOpacity: active ? 0.65 : 0.4,
                        }}
                        eventHandlers={{
                          click: () => {
                            setFocusedRegionId(hotspot.regionId);
                            setSelectedHotspotId(hotspot.id);
                          },
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -6]} opacity={0.96}>
                          <span className="text-[10px] font-medium">
                            {hotspot.city} - {hotspot.label}
                          </span>
                        </Tooltip>
                        <Popup>
                          <div className="space-y-1">
                            <div className="text-xs font-semibold">
                              {hotspot.city}, {hotspot.country}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{hotspot.label} trends</div>
                            <button
                              type="button"
                              onClick={() => {
                                setFocusedRegionId(hotspot.regionId);
                                setSelectedHotspotId(hotspot.id);
                              }}
                              className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
                            >
                              View Trends
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                <div className="pointer-events-none absolute left-3 top-3 right-3 z-[700]">
                  <div className="pointer-events-auto inline-flex max-w-full flex-nowrap gap-2 overflow-x-auto rounded-xl border border-border/60 bg-card/90 p-2 shadow-lg backdrop-blur">
                    {REGIONS.map((region) => (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => {
                          setFocusedRegionId(region.id);
                          setSelectedHotspotId(null);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          selectedRegion?.id === region.id
                            ? 'border-primary/40 bg-primary text-primary-foreground'
                            : 'border-border bg-background/75 text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {region.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex h-full min-h-0 flex-col p-4">
            <div className="mb-4 rounded-xl border border-border/70 bg-accent/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {selectedHotspot ? (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">
                        {selectedHotspot.city}, {selectedHotspot.country}
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedRegion?.subtitle}</p>
                    </>
                  ) : selectedRegion ? (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">{selectedRegion.label} map view</h3>
                      <p className="text-sm text-muted-foreground">Select a city marker to load trending tracks.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-foreground">World Discovery Map</h3>
                      <p className="text-sm text-muted-foreground">Select a region, then click a city marker to load songs.</p>
                    </>
                  )}
                </div>
                {selectedHotspot ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                    {selectedHotspot.label}
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-muted-foreground">No city selected</span>
                )}
              </div>
              {selectedHotspot ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Query match: {resolvedQueryByHotspot[selectedHotspot.id] ?? selectedHotspot.queries[0]}
                </p>
              ) : null}
            </div>

            {selectedRegion?.id === 'india' && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">India state trends</p>
                <div className="flex flex-wrap gap-2">
                  {indiaPrimaryHotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      type="button"
                      onClick={() => {
                        setFocusedRegionId(hotspot.regionId);
                        setSelectedHotspotId(hotspot.id);
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        selectedHotspot?.id === hotspot.id
                          ? 'border-primary/40 bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {hotspot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedRegion ? (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Local hotspots</p>
                <div className="flex flex-wrap gap-2">
                  {regionHotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      type="button"
                      onClick={() => {
                        setFocusedRegionId(hotspot.regionId);
                        setSelectedHotspotId(hotspot.id);
                      }}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs transition-colors',
                        selectedHotspot?.id === hotspot.id
                          ? 'border-primary/40 bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {hotspot.city}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!selectedHotspot ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
                Select a city marker on the map to load songs for that location.
              </div>
            ) : isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Spinner size={16} className="mr-2" /> Loading regional trends...
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-card/40">
                <div className="grid grid-cols-[30px_minmax(0,1fr)_54px_44px] items-center border-b border-border/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>#</span>
                  <span>Song</span>
                  <span className="text-right">Time</span>
                  <span className="text-center">Play</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2 pr-1">
                  <div className="space-y-2">
                    {activeTracks.map((track, index) => {
                      const active = currentTrack?.id === track.id;

                      return (
                        <button
                          key={`${selectedHotspot.id}-${track.id}-${index}`}
                          type="button"
                          onClick={() => (active ? void togglePlayPause() : void playTrack(track, activeTracks))}
                          className={cn(
                            'group grid w-full grid-cols-[30px_minmax(0,1fr)_54px_44px] items-center gap-2 rounded-lg border border-border/55 bg-background/35 px-2 py-2 text-left transition-all hover:border-primary/35 hover:bg-accent/55',
                            active && 'border-primary/45 bg-accent/55',
                          )}
                        >
                          <span className={cn('text-xs', active ? 'text-primary' : 'text-muted-foreground')}>{index + 1}</span>

                          <div className="flex min-w-0 items-center gap-3">
                            {track.image ? (
                              <img src={track.image} alt={track.title} className="h-11 w-11 rounded-md object-cover" loading="lazy" />
                            ) : (
                              <div className="h-11 w-11 rounded-md bg-muted" />
                            )}

                            <div className="min-w-0">
                              <p className={cn('truncate text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>{track.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{track.artist || 'Unknown Artist'}</p>
                            </div>
                          </div>

                          <span className="text-right text-xs text-muted-foreground">{formatDuration(track.duration)}</span>

                          <span className="mx-auto rounded-full bg-primary p-2 text-primary-foreground transition-transform group-hover:scale-105">
                            {active && isPlaying ? (
                              <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                            )}
                          </span>
                        </button>
                      );
                    })}

                    {!activeTracks.length && (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No tracks found for this hotspot yet. Try another city or region chip.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartDiscoveryMap;
