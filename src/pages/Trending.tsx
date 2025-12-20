import { useState } from 'react';
import { TrendingUp, Play, Heart, Share2, Filter, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MusicCard from '@/components/MusicCard';
import { api } from '@/lib/api';
import { authApi } from '@/lib/authApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Track } from '@/contexts/PlayerContext';
import { useToast } from '@/hooks/use-toast';

const Trending = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const { data: tracksResponse, isLoading: isLoadingTracks, error: tracksError } = useQuery({
    queryKey: ['trending-tracks', selectedPeriod],
    queryFn: () => api.getTrending(selectedPeriod, 10),
    retry: 2,
  });

  const { data: artistsResponse, isLoading: isLoadingArtists, error: artistsError } = useQuery({
    queryKey: ['trending-artists'],
    queryFn: () => api.getTrendingArtists(10),
    retry: 2,
  });

  const { data: playlistsResponse, isLoading: isLoadingPlaylists, error: playlistsError } = useQuery({
    queryKey: ['trending-playlists'],
    queryFn: () => api.getTrendingPlaylists(10),
    retry: 2,
  });

  const trendingTracks = tracksResponse?.data || [];
  const trendingArtists = artistsResponse?.data || [];
  const trendingPlaylists = playlistsResponse?.data || [];

  const followMutation = useMutation({
    mutationFn: async (artist: any) => {
      if (!token) throw new Error('Not authenticated');
      return authApi.followUser(token, artist.id, {
        id: artist.id,
        name: artist.name,
        handle: artist.handle,
        profile_picture: artist.profile_picture,
        follower_count: artist.follower_count
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-artists'] });
      toast({
        title: "Success",
        description: "Successfully followed artist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow artist",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (artist: any) => {
      if (!token) throw new Error('Not authenticated');
      return authApi.unfollowUser(token, artist.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-artists'] });
      toast({
        title: "Success",
        description: "Successfully unfollowed artist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow artist",
        variant: "destructive",
      });
    },
  });

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
      <p>{message}</p>
      <p className="text-sm mt-2">Please try again later</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Trending</h1>
          <p className="text-gray-400">Discover what's hot right now</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2">
        {['week', 'month'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'ghost'}
            onClick={() => setSelectedPeriod(period as 'week' | 'month')}
            className="capitalize"
          >
            {`This ${period}`}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="tracks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-4 mt-6">
          {isLoadingTracks ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tracksError ? (
            <ErrorMessage message="Failed to load trending tracks" />
          ) : trendingTracks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No trending tracks found
            </div>
          ) : (
          <div className="grid gap-4">
              {trendingTracks.map((track: Track, index: number) => (
              <div key={track.id} className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full text-primary font-bold text-sm">
                    {index + 1}
                </div>
                  <img 
                    src={track.artwork?.['150x150'] || '/placeholder.svg'} 
                    alt={track.title} 
                    className="w-16 h-16 rounded-lg object-cover" 
                  />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{track.title}</h3>
                    <p className="text-gray-400 text-sm">{track.user?.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                      <span className="text-gray-400 text-xs">{track.play_count?.toLocaleString()} plays</span>
                      {track.trending && (
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                          +{track.trending}%
                    </span>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="w-10 h-10 bg-primary rounded-full hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          {isLoadingArtists ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : artistsError ? (
            <ErrorMessage message="Failed to load trending artists" />
          ) : trendingArtists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No trending artists found
            </div>
          ) : (
          <div className="grid gap-6">
              {trendingArtists.map((artist: any, index: number) => (
              <div key={artist.id} className="bg-white/5 rounded-lg p-6 flex items-center gap-6 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <img 
                    src={artist.profile_picture?.['150x150'] || '/placeholder.svg'} 
                    alt={artist.name} 
                    className="w-20 h-20 rounded-full object-cover" 
                  />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">{artist.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Followers</span>
                        <p className="text-white font-medium">{artist.follower_count?.toLocaleString()}</p>
                    </div>
                    <div>
                        <span className="text-gray-400">Tracks</span>
                        <p className="text-white font-medium">{artist.track_count?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                {token ? (
                  <Button 
                    className={artist.isFollowing ? "bg-white/10 hover:bg-white/20" : "bg-primary hover:bg-primary/90"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (artist.isFollowing) {
                        unfollowMutation.mutate(artist);
                      } else {
                        followMutation.mutate(artist);
                      }
                    }}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                  >
                    {artist.isFollowing ? "Following" : "Follow"}
                  </Button>
                ) : (
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      toast({
                        title: "Not logged in",
                        description: "Please log in to follow artists",
                        variant: "destructive",
                      });
                    }}
                  >
                    Follow
                  </Button>
                )}
              </div>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="playlists" className="mt-6">
          {isLoadingPlaylists ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : playlistsError ? (
            <ErrorMessage message="Failed to load trending playlists" />
          ) : trendingPlaylists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No trending playlists found
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingPlaylists.map((playlist: any) => (
              <MusicCard
                key={playlist.id}
                  title={playlist.playlist_name}
                  subtitle={`${playlist.track_count} tracks • ${playlist.user.name}`}
                  image={playlist.artwork?.['480x480'] || '/placeholder.svg'}
              />
            ))}
          </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trending;
