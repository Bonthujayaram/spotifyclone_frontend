import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePlayer } from '@/contexts/PlayerContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Track } from '@/contexts/PlayerContext';
import HorizontalMusicCard from '@/components/HorizontalMusicCard';

const BATCH_SIZE = 100;
const MAX_RESULTS = 1000;

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const { playTrack, isPlaying, currentTrack, togglePlayPause } = usePlayer();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const categories = [
    { name: 'Pop', color: 'bg-pink-500', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' },
    { name: 'Hip-Hop', color: 'bg-orange-500', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&crop=center' },
    { name: 'Rock', color: 'bg-red-500', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center' },
    { name: 'Electronic', color: 'bg-purple-500', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center' },
    { name: 'R&B', color: 'bg-blue-500', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' },
    { name: 'Country', color: 'bg-yellow-500', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&crop=center' },
    { name: 'Jazz', color: 'bg-indigo-500', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center' },
    { name: 'Classical', color: 'bg-green-500', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center' },
  ];

  const loadMoreResults = useCallback(async () => {
    if (!searchQuery.trim() || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await api.search(searchQuery, 'tracks', BATCH_SIZE, offset);
      const newTracks = response.data || [];
      
      if (offset === 0) {
        setSearchResults(newTracks);
      } else {
        setSearchResults(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(track => track.id));
          const uniqueNewTracks = newTracks.filter(track => !existingIds.has(track.id));
          return [...prev, ...uniqueNewTracks];
        });
      }
      
      // Check if we've reached the maximum results or no more results available
      const totalResults = offset + newTracks.length;
      const hasMoreResults = newTracks.length === BATCH_SIZE && totalResults < MAX_RESULTS;
      setHasMore(hasMoreResults);
      
      if (hasMoreResults) {
        setOffset(prev => prev + BATCH_SIZE);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to fetch search results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, offset, toast, hasMore]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMoreResults();
      }
    }, options);

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMoreResults]);

  // Handle search query changes
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        setOffset(0);
        setHasMore(true);
        loadMoreResults();
      } else {
        setSearchResults([]);
        setHasMore(true);
        setOffset(0);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleCategoryClick = (category: string) => {
    setSearchQuery(category);
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold gradient-text">Search</h1>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
          />
        </div>
      </div>

      {!searchQuery ? (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className={`${category.color} rounded-lg p-4 h-32 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform group`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <h3 className="text-white font-bold text-lg mb-2">{category.name}</h3>
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute -right-4 -bottom-4 w-20 h-20 rotate-12 rounded-lg shadow-lg group-hover:rotate-6 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            {isLoading && offset === 0 ? "Searching..." : `Search results for "${searchQuery}"`}
            {searchResults.length > 0 && (
              <span className="text-lg font-normal text-gray-400 ml-2">
                ({searchResults.length} tracks{hasMore ? ' and counting...' : ''})
              </span>
            )}
          </h2>
          <div className="space-y-4">
            {searchResults.map((track, index) => (
              <HorizontalMusicCard
                key={track.id}
                track={track}
                playlist={searchResults}
                index={index}
              />
            ))}
            
            {/* Loading state */}
            {isLoading && (
              Array(3).fill(0).map((_, i) => (
                <div key={`skeleton-${i}`} className="bg-white/5 rounded-lg h-24 animate-pulse" />
              ))
            )}
            
            {/* Infinite scroll trigger */}
            {searchResults.length > 0 && hasMore && (
              <div ref={loadingRef} className="h-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
         
            {/* No results message */}
            {!isLoading && searchResults.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
