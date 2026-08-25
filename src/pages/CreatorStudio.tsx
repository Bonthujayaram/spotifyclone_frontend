import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Clock3, Music2, Play, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, type CreatorDashboardResponse, type CreatorTrack } from '@/lib/authApi';
import { useToast } from '@/hooks/use-toast';
import { usePlayer, type Track } from '@/contexts/PlayerContext';
import Spinner from '@/components/Spinner';

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value || 0);

const toPlayerTrack = (track: CreatorTrack): Track => ({
  id: track.id,
  title: track.title,
  artist: 'You',
  image: track.coverImage || '',
  audioUrl: track.audioUrl,
  duration: track.duration || 0,
  source: 'creator',
});

const CreatorStudio = () => {
  const { toast } = useToast();
  const { playTrack } = usePlayer();
  const [dashboard, setDashboard] = useState<CreatorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);

  const loadDashboard = useCallback(async (showLoader = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    setRefreshing(true);

    try {
      const data = await authApi.getCreatorDashboard(token);
      setDashboard(data);
    } catch (error) {
      toast({
        title: 'Failed to load studio',
        description: error instanceof Error ? error.message : 'Unable to load creator dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDashboard(true);
  }, [loadDashboard]);

  const maxWeeklyPlays = useMemo(() => {
    if (!dashboard?.weeklySeries?.length) return 1;
    return Math.max(...dashboard.weeklySeries.map((day) => day.plays), 1);
  }, [dashboard]);

  const handlePlay = (track: CreatorTrack) => {
    const playerTrack = toPlayerTrack(track);
    const playlist = (dashboard?.tracks || []).map(toPlayerTrack);
    void playTrack(playerTrack, playlist.length > 0 ? playlist : [playerTrack]);
  };

  const handleDelete = async (trackId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const confirmed = window.confirm('Delete this track from Creator Studio?');
    if (!confirmed) return;

    setDeletingTrackId(trackId);
    try {
      await authApi.deleteCreatorTrack(token, trackId);
      toast({ title: 'Track deleted', description: 'The track was removed from your studio.' });
      await loadDashboard(false);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unable to delete track.',
        variant: 'destructive',
      });
    } finally {
      setDeletingTrackId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Studio</h1>
          <p className="text-muted-foreground">Manage uploads and monitor audience performance in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadDashboard(false)} disabled={refreshing}>
            {refreshing ? <Spinner size={16} className="mr-2" label={null} /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button asChild>
            <Link to="/upload">
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload New Track
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total Tracks</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(dashboard?.summary?.totalTracks || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Music2 className="h-3.5 w-3.5" />
              Published catalog size
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total Plays</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(dashboard?.summary?.totalPlays || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Play className="h-3.5 w-3.5" />
              Audience playback starts
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">{dashboard?.summary?.completionRate || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Full-track listens
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Listen Hours</CardDescription>
            <CardTitle className="text-3xl">{dashboard?.summary?.totalListenHours || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              Total listener time
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-2 bg-card/70 border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Last 7 Days</CardTitle>
            <CardDescription>Daily play volume trend</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            ) : (
              <div className="grid grid-cols-7 gap-2 h-44 items-end">
                {(dashboard?.weeklySeries || []).map((day) => {
                  const height = `${Math.max(8, Math.round((day.plays / maxWeeklyPlays) * 100))}%`;
                  return (
                    <div key={day.date} className="h-full flex flex-col justify-end gap-2">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-primary/90 to-primary/40 border border-primary/40"
                        style={{ height }}
                        title={`${day.plays} plays`}
                      />
                      <span className="text-[11px] text-muted-foreground text-center">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Tracks</CardTitle>
              <CardDescription>Your uploaded catalog</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && (!dashboard?.tracks || dashboard.tracks.length === 0) ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">No uploads yet. Start by publishing your first track.</p>
                <Button asChild size="sm">
                  <Link to="/upload">Upload Track</Link>
                </Button>
              </div>
            ) : (
              (dashboard?.tracks || []).map((track) => {
                const completionRate = track.stats?.plays
                  ? Math.round((track.stats.completePlays / track.stats.plays) * 100)
                  : 0;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 bg-background/35"
                  >
                    <img
                      src={track.coverImage || '/echovibe1.png'}
                      alt={track.title}
                      className="h-12 w-12 rounded-md object-cover border border-border/70"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.genre || 'Unknown genre'} • {formatDuration(track.duration || 0)} • {completionRate}% completion
                      </p>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-muted-foreground min-w-[92px]">
                      <p>{formatNumber(track.stats?.plays || 0)} plays</p>
                      <p>{formatDuration(track.stats?.totalListenSeconds || 0)} listened</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" onClick={() => handlePlay(track)} title="Play">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Delete"
                        disabled={deletingTrackId === track.id}
                        onClick={() => void handleDelete(track.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorStudio;
