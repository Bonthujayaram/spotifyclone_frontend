
import { useState } from 'react';
import { ArrowLeft, Play, Pause, Heart, Share2, MoreHorizontal, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MusicCard from '@/components/MusicCard';

const Artist = () => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const artist = {
    name: "The Weeknd",
    username: "@theweeknd",
    bio: "Official account of The Weeknd. Multi-platinum recording artist.",
    followers: "12.5M",
    following: "42",
    verified: true,
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=300&fit=crop&crop=center",
    avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=center"
  };

  const tracks = [
    { id: 1, title: "Blinding Lights", plays: "2.1B", duration: "3:20", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop&crop=center" },
    { id: 2, title: "The Hills", plays: "1.8B", duration: "4:02", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=60&h=60&fit=crop&crop=center" },
    { id: 3, title: "Can't Feel My Face", plays: "1.5B", duration: "3:35", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=60&h=60&fit=crop&crop=center" },
  ];

  const albums = [
    { id: 1, title: "After Hours", year: "2020", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center" },
    { id: 2, title: "Dawn FM", year: "2022", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&crop=center" },
  ];

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Cover Image & Header */}
      <div className="relative h-80 bg-gradient-to-b from-purple-900/50 to-black">
        <img
          src={artist.coverImage}
          alt={artist.name}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end gap-6">
            <img
              src={artist.avatar}
              alt={artist.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold text-white truncate">{artist.name}</h1>
                {artist.verified && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-gray-300 mb-2">{artist.username}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{artist.followers} followers</span>
                <span>{artist.following} following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 bg-primary rounded-full hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
          
          <Button
            onClick={() => setIsFollowing(!isFollowing)}
            variant={isFollowing ? "secondary" : "outline"}
            className="px-6"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isFollowing ? "Following" : "Follow"}
          </Button>
          
          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-gray-300 mt-4 max-w-2xl">{artist.bio}</p>
      </div>

      {/* Content Tabs */}
      <div className="p-6">
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="space-y-2 mt-6">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                <img src={track.image} alt={track.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm">{track.plays} plays • {track.duration}</p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="icon" className="w-10 h-10 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="albums" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <MusicCard
                  key={album.id}
                  title={album.title}
                  artist={album.year}
                  image={album.image}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{artist.followers}</div>
                <div className="text-gray-400 text-sm">Followers</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">156</div>
                <div className="text-gray-400 text-sm">Tracks</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-gray-400 text-sm">Albums</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">5.2B</div>
                <div className="text-gray-400 text-sm">Total Plays</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Artist;
