import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/authApi';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.profilePicture || ''
  });
  const [settings, setSettings] = useState({
    highQualityAudio: true,
    notifications: true,
    autoplay: false
  });

  const { toast } = useToast();

  // Update profile state when user data changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        avatar: user.profilePicture || ''
      });
    }
  }, [user]);

  // Calculate total following count
  const totalFollowing = (user?.following?.length || 0) + (user?.externalFollowing?.length || 0);

  const stats = [
    { label: 'Playlists', value: '1' },
    { label: 'Followers', value: '0' },
    { label: 'Following', value: totalFollowing.toString() },
    { label: 'Liked Songs', value: '4' }
  ];

  // Handle dark mode toggle
  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    
    const htmlElement = document.documentElement;
    
    if (checked) {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    toast({
      title: "Theme Updated",
      description: `Switched to ${checked ? 'dark' : 'light'} mode`,
    });
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const { user: updatedUser } = await authApi.updateProfile(token, {
        name: profile.name,
        profilePicture: profile.avatar,
      });

      // Update local user state
      if (user) {
        user.name = updatedUser.name;
        user.profilePicture = updatedUser.profilePicture;
      }

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  // Handle settings change
  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Settings Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  // Handle logout
  const handleLogout = () => {
    try {
      logout();
      toast({
        title: "Success",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const htmlElement = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, []);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-white">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-32 h-32 border-4 border-white/20">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="bg-white/20 text-white text-4xl">
                {profile.name ? profile.name[0].toUpperCase() : <User className="w-16 h-16" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{profile.name || 'EchoVibe User'}</h1>
              <p className="text-white/80 mb-4">{profile.email}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      variant="secondary"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="secondary" 
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Edit Profile
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/10 rounded-lg">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Settings</h2>
          <div className="space-y-6">
            {isEditing && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar">Profile Picture URL</Label>
                  <Input
                    id="avatar"
                    value={profile.avatar}
                    onChange={(e) => setProfile(prev => ({ ...prev, avatar: e.target.value }))}
                    className="bg-white/10 border-white/20"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-gray-400">Toggle dark/light theme</p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>High Quality Audio</Label>
                <p className="text-sm text-gray-400">Stream music in high quality</p>
              </div>
              <Switch
                checked={settings.highQualityAudio}
                onCheckedChange={(checked) => handleSettingChange('highQualityAudio', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications</Label>
                <p className="text-sm text-gray-400">Get notified about new releases</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Autoplay</Label>
                <p className="text-sm text-gray-400">Automatically play next track</p>
              </div>
              <Switch
                checked={settings.autoplay}
                onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
