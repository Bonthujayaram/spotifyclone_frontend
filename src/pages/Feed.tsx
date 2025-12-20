
import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share2, Play, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Feed = () => {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<number>>(new Set());

  const feedItems = [
    {
      id: 1,
      type: 'track_release',
      user: { name: 'The Weeknd', username: '@theweeknd', avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop&crop=center', verified: true },
      content: 'Just dropped my latest track! 🔥',
      track: { title: 'Blinding Lights', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' },
      timestamp: '2 hours ago',
      likes: 12500,
      comments: 234,
      reposts: 1200
    },
    {
      id: 2,
      type: 'repost',
      user: { name: 'Olivia Rodrigo', username: '@oliviarodrigo', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=50&h=50&fit=crop&crop=center', verified: true },
      content: 'This track is incredible! 💜',
      originalUser: { name: 'Dua Lipa', username: '@dualipa' },
      track: { title: 'Levitating', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center' },
      timestamp: '4 hours ago',
      likes: 8900,
      comments: 156,
      reposts: 890
    },
    {
      id: 3,
      type: 'playlist',
      user: { name: 'Harry Styles', username: '@harrystyles', avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop&crop=center', verified: true },
      content: 'New playlist for late night vibes ✨',
      playlist: { title: 'Midnight Thoughts', trackCount: 24, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center' },
      timestamp: '1 day ago',
      likes: 5600,
      comments: 78,
      reposts: 432
    }
  ];

  const toggleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const toggleRepost = (postId: number) => {
    const newRepostedPosts = new Set(repostedPosts);
    if (newRepostedPosts.has(postId)) {
      newRepostedPosts.delete(postId);
    } else {
      newRepostedPosts.add(postId);
    }
    setRepostedPosts(newRepostedPosts);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-4xl font-bold gradient-text mb-8">Your Feed</h1>

      {feedItems.map((item) => (
        <div key={item.id} className="bg-white/5 rounded-xl p-6 space-y-4 hover:bg-white/10 transition-colors">
          {/* User Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{item.user.name}</span>
                  {item.user.verified && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{item.user.username} • {item.timestamp}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Repost Indicator */}
          {item.type === 'repost' && (
            <div className="flex items-center gap-2 text-gray-400 text-sm ml-15">
              <Repeat2 className="w-4 h-4" />
              <span>Reposted from {item.originalUser?.name}</span>
            </div>
          )}

          {/* Content */}
          <p className="text-white">{item.content}</p>

          {/* Track/Playlist Card */}
          {(item.track || item.playlist) && (
            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer">
              <img
                src={item.track?.image || item.playlist?.image}
                alt={item.track?.title || item.playlist?.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white font-medium">{item.track?.title || item.playlist?.title}</h3>
                <p className="text-gray-400 text-sm">
                  {item.track ? 'Single' : `Playlist • ${item.playlist?.trackCount} tracks`}
                </p>
              </div>
              <Button size="icon" className="w-12 h-12 bg-primary rounded-full hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => toggleLike(item.id)}
                className={`flex items-center gap-2 transition-colors ${
                  likedPosts.has(item.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${likedPosts.has(item.id) ? 'fill-current' : ''}`} />
                <span className="text-sm">{item.likes + (likedPosts.has(item.id) ? 1 : 0)}</span>
              </button>

              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{item.comments}</span>
              </button>

              <button
                onClick={() => toggleRepost(item.id)}
                className={`flex items-center gap-2 transition-colors ${
                  repostedPosts.has(item.id) ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
                }`}
              >
                <Repeat2 className="w-5 h-5" />
                <span className="text-sm">{item.reposts + (repostedPosts.has(item.id) ? 1 : 0)}</span>
              </button>
            </div>

            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Feed;
