import { useEffect, useState } from 'react';
import MusicCard from '@/components/MusicCard';
import ScrollableSection from '@/components/ScrollableSection';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Track } from '@/contexts/PlayerContext';

const Home = () => {
  const { toast } = useToast();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState({
    trending: true,
    popular: true,
    recent: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trending tracks
        const trendingResponse = await api.getTrending('week', 20);
        if (trendingResponse?.data) {
          setTrendingTracks(trendingResponse.data);
          setLoading(prev => ({ ...prev, trending: false }));
        }

        // Fetch popular tracks
        const popularResponse = await api.getPopular(20);
        if (popularResponse?.data) {
          setPopularTracks(popularResponse.data);
          setLoading(prev => ({ ...prev, popular: false }));
        }

        // Fetch recent tracks
        const recentResponse = await api.getRecent(20);
        if (recentResponse?.data) {
          setRecentTracks(recentResponse.data);
          setLoading(prev => ({ ...prev, recent: false }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load some content. Please try again later.",
          variant: "destructive",
        });
        setLoading({
          trending: false,
          popular: false,
          recent: false
        });
      }
    };

    fetchData();
  }, [toast]);

  const renderSkeletons = () => (
    Array(6).fill(0).map((_, i) => (
      <div key={i} className="w-[200px] min-w-[200px] animate-pulse">
        <div className="aspect-square bg-white/5 rounded-lg mb-4" />
        <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    ))
  );

  return (
    <div className="p-4 md:p-6 space-y-8 md:space-y-12 animate-fade-in max-w-[1800px] mx-auto">
      <div className="flex flex-col items-center mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Welcome to EchoVibe</h1>
        <p className="text-gray-400">Your personal music sanctuary</p>
      </div>

      {/* Trending Section */}
      <section>
        <ScrollableSection
          title="Trending Now"
          showAllLink="/trending"
        >
          {loading.trending ? renderSkeletons() : (
            trendingTracks && trendingTracks.length > 0 ? (
              trendingTracks.map((track) => (
                <MusicCard
                  key={track.id}
                  track={track}
                  playlist={trendingTracks}
                />
              ))
            ) : (
              <div className="text-gray-400">No tracks found</div>
            )
          )}
        </ScrollableSection>
      </section>

      {/* Popular Section */}
      <section>
        <ScrollableSection
          title="Popular Tracks"
          showAllLink="/popular"
        >
          {loading.popular ? renderSkeletons() : (
            popularTracks && popularTracks.length > 0 ? (
              popularTracks.map((track) => (
                <MusicCard
                  key={track.id}
                  track={track}
                  playlist={popularTracks}
                />
              ))
            ) : (
              <div className="text-gray-400">No tracks found</div>
            )
          )}
        </ScrollableSection>
      </section>

      {/* Recently Added Section */}
      <section>
        <ScrollableSection
          title="Recently Added"
          showAllLink="/recent"
        >
          {loading.recent ? renderSkeletons() : (
            recentTracks && recentTracks.length > 0 ? (
              recentTracks.map((track) => (
                <MusicCard
                  key={track.id}
                  track={track}
                  playlist={recentTracks}
                />
              ))
            ) : (
              <div className="text-gray-400">No tracks found</div>
            )
          )}
        </ScrollableSection>
      </section>
    </div>
  );
};

export default Home;
