import { errorMessage } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs, { ProfileTab } from '@/components/profile/ProfileTabs';
import StatCards from '@/components/profile/StatCards';
import LikedSongsTable from '@/components/profile/LikedSongsTable';
import ActivityFeed from '@/components/profile/ActivityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/hooks/use-toast';
import { authApi, type UserSettings } from '@/lib/authApi';
import type { Track } from '@/contexts/PlayerContext';

type Playlist = { _id: string; name: string; coverImage?: string; tracks: Track[] };

type ProfileData = {
  playlists: Playlist[];
  likedSongs: Track[];
  recentlyPlayed: { track: Track; playedAt: string }[];
  followers: number;
  following: number;
  favoriteGenre: string;
  listeningHours: number;
  listeningStreak: number;
};

const shimmer = 'bg-gradient-to-r from-foreground/5 via-foreground/10 to-foreground/5 animate-[shimmer_1.4s_infinite]';

const readDarkTheme = () => {
  if (typeof document === 'undefined') return true;
  const html = document.documentElement;
  if (html.classList.contains('dark')) return true;
  if (html.classList.contains('light')) return false;

  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const settingsCardClass = 'flex items-center justify-between rounded-xl border border-border bg-card/80 p-4';
const settingsActionClass = 'rounded-full border border-border bg-accent px-3 py-1 text-sm transition hover:bg-accent/80';
const tabPanelClass = 'h-full overflow-y-auto pr-1';

const DEFAULT_SETTINGS: UserSettings = {
  audioQuality: 'auto',
  autoplay: true,
  accountPrivacy: 'friends',
  notifications: 'push_email',
  connectedAccounts: {
    google: false,
  },
};

const AUDIO_QUALITY_ORDER: UserSettings['audioQuality'][] = ['auto', 'low', 'medium', 'high'];
const AUDIO_QUALITY_LABEL: Record<UserSettings['audioQuality'], string> = {
  auto: 'Automatic',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const PRIVACY_ORDER: UserSettings['accountPrivacy'][] = ['public', 'friends', 'private'];
const PRIVACY_LABEL: Record<UserSettings['accountPrivacy'], string> = {
  public: 'Public',
  friends: 'Friends-only',
  private: 'Private',
};

const NOTIFICATION_ORDER: UserSettings['notifications'][] = ['push_email', 'push', 'email', 'none'];
const NOTIFICATION_LABEL: Record<UserSettings['notifications'], string> = {
  all: 'All notifications',
  push_email: 'Push + Email',
  push: 'Push only',
  email: 'Email only',
  none: 'Off',
};

const normalizeSettings = (settings?: Partial<UserSettings>): UserSettings => ({
  ...DEFAULT_SETTINGS,
  ...(settings || {}),
  connectedAccounts: {
    ...DEFAULT_SETTINGS.connectedAccounts,
    ...(settings?.connectedAccounts || {}),
  },
});

const Profile = () => {
  const { user, logout } = useAuth();
  const { setAutoplayEnabled } = usePlayer();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isDarkTheme, setIsDarkTheme] = useState(readDarkTheme);
  const [settings, setSettings] = useState<UserSettings>(() => normalizeSettings(user?.settings));
  const [settingsBusy, setSettingsBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSettings(normalizeSettings(user?.settings));
  }, [user?.settings]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const [{ likedSongs }, { playlists }, recentlyPlayedRes] = await Promise.all([
          authApi.getLikedSongs(token),
          authApi.getPlaylists(token),
          authApi.getRecentlyPlayed(token),
        ]);

        try {
          const { settings: serverSettings } = await authApi.getSettings(token);
          const normalized = normalizeSettings(serverSettings);
          setSettings(normalized);
          setAutoplayEnabled(normalized.autoplay);
          localStorage.setItem('audio_quality', normalized.audioQuality);
        } catch (settingsError) {
          console.warn('Settings fetch failed, using local values:', settingsError);
          const fallback = normalizeSettings(user?.settings);
          setSettings(fallback);
          setAutoplayEnabled(fallback.autoplay);
          localStorage.setItem('audio_quality', fallback.audioQuality);
        }

        setData({
          playlists,
          likedSongs,
          recentlyPlayed: recentlyPlayedRes.recentlyPlayed ?? [],
          followers: 0,
          following: user.following?.length ?? 0,
          favoriteGenre: 'Electronic',
          listeningHours: 126,
          listeningStreak: 5,
        });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setAutoplayEnabled, toast, user]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const syncTheme = () => setIsDarkTheme(html.classList.contains('dark'));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = !isDarkTheme;
    setIsDarkTheme(next);
    const html = document.documentElement;
    html.classList.toggle('dark', next);
    html.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    toast({ title: 'Theme updated', description: `Switched to ${next ? 'Dark' : 'Light'} mode` });
  };

  const updateSettings = async (key: string, patch: Partial<UserSettings>, successMessage: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Error', description: 'Please login again', variant: 'destructive' });
      return;
    }

    setSettingsBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await authApi.updateSettings(token, patch);
      const next = normalizeSettings(response.settings);
      setSettings(next);
      setAutoplayEnabled(next.autoplay);
      localStorage.setItem('audio_quality', next.audioQuality);

      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      toast({ title: 'Updated', description: successMessage });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: errorMessage(error, 'Could not update setting'),
        variant: 'destructive',
      });
    } finally {
      setSettingsBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAudioQuality = () => {
    const currentIndex = AUDIO_QUALITY_ORDER.indexOf(settings.audioQuality);
    const next = AUDIO_QUALITY_ORDER[(currentIndex + 1) % AUDIO_QUALITY_ORDER.length];
    updateSettings('audioQuality', { audioQuality: next }, `Audio quality set to ${AUDIO_QUALITY_LABEL[next]}`);
  };

  const handleAutoplay = () => {
    const next = !settings.autoplay;
    updateSettings('autoplay', { autoplay: next }, `Autoplay turned ${next ? 'on' : 'off'}`);
  };

  const handleAccountPrivacy = () => {
    const currentIndex = PRIVACY_ORDER.indexOf(settings.accountPrivacy);
    const next = PRIVACY_ORDER[(currentIndex + 1) % PRIVACY_ORDER.length];
    updateSettings('accountPrivacy', { accountPrivacy: next }, `Account privacy set to ${PRIVACY_LABEL[next]}`);
  };

  const handleNotifications = () => {
    const currentIndex = NOTIFICATION_ORDER.indexOf(settings.notifications);
    const next = NOTIFICATION_ORDER[(currentIndex + 1) % NOTIFICATION_ORDER.length];
    updateSettings('notifications', { notifications: next }, `Notifications set to ${NOTIFICATION_LABEL[next]}`);
  };

  const handleConnectedAccounts = () => {
    if (user?.isGoogleUser && settings.connectedAccounts.google) {
      toast({
        title: 'Unavailable',
        description: 'This account uses Google sign-in as primary login.',
      });
      return;
    }

    const next = !settings.connectedAccounts.google;
    updateSettings(
      'connectedAccounts',
      { connectedAccounts: { google: next } },
      next ? 'Google account connected' : 'Google account disconnected',
    );
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Error', description: 'Please login again', variant: 'destructive' });
      return;
    }

    const currentPassword = user?.isGoogleUser ? '' : window.prompt('Enter current password');
    if (!user?.isGoogleUser && !currentPassword) return;

    const newPassword = window.prompt('Enter new password (minimum 6 characters)');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Invalid password', description: 'Use at least 6 characters', variant: 'destructive' });
      return;
    }

    const confirmPassword = window.prompt('Re-enter new password');
    if (!confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setSettingsBusy((prev) => ({ ...prev, changePassword: true }));
    try {
      await authApi.changePassword(token, currentPassword || '', newPassword);
      toast({ title: 'Success', description: 'Password updated successfully' });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: errorMessage(error, 'Could not update password'),
        variant: 'destructive',
      });
    } finally {
      setSettingsBusy((prev) => ({ ...prev, changePassword: false }));
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Error', description: 'Please login again', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm('Delete account permanently? This cannot be undone.');
    if (!confirmed) return;

    const password = user?.isGoogleUser ? undefined : window.prompt('Enter your password to confirm delete');
    if (!user?.isGoogleUser && !password) return;

    setSettingsBusy((prev) => ({ ...prev, deleteAccount: true }));
    try {
      await authApi.deleteAccount(token, password || undefined);
      toast({ title: 'Account deleted', description: 'Your account has been removed' });
      logout();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: errorMessage(error, 'Could not delete account'),
        variant: 'destructive',
      });
    } finally {
      setSettingsBusy((prev) => ({ ...prev, deleteAccount: false }));
    }
  };

  const headerMetrics = useMemo(
    () => ({
      playlists: data?.playlists.length ?? 0,
      liked: data?.likedSongs.length ?? 0,
      followers: data?.followers ?? 0,
      following: data?.following ?? 0,
      streak: data?.listeningStreak ?? 0,
    }),
    [data],
  );

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden text-foreground">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pb-4">
        <div className="shrink-0">
          <ProfileHeader
            user={{ id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, plan: 'Premium' }}
            metrics={headerMetrics}
            loading={loading}
            onLogout={logout}
            onEdit={() => setActiveTab('settings')}
          />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 grid gap-4 md:grid-cols-3"
              >
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-32 rounded-2xl border border-border ${shimmer}`} />
                ))}
              </motion.div>
            ) : (
              data && <StatCards data={data} />
            )}
          </AnimatePresence>

          <ProfileTabs active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-6 min-h-0 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && data && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="h-full"
              >
                <ActivityFeed title="Listening History" items={data.recentlyPlayed} compact scrollable />
              </motion.div>
            )}

            {activeTab === 'playlists' && data && (
              <motion.div key="playlists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={tabPanelClass}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.playlists.map((p) => (
                    <div
                      key={p._id}
                      className="group relative rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-xl transition hover:-translate-y-1"
                    >
                      <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-accent/45">
                        {p.coverImage ? (
                          <img src={p.coverImage} loading="lazy" alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">MUSIC</div>
                        )}
                      </div>
                      <div className="truncate font-semibold text-foreground">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.tracks.length} tracks</div>
                    </div>
                  ))}

                  {!data.playlists.length && (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">No playlists yet.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'liked' && (
              <motion.div key="liked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={tabPanelClass}>
                <LikedSongsTable tracks={data?.likedSongs ?? []} />
              </motion.div>
            )}

            {activeTab === 'recent' && (
              <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <ActivityFeed title="Recently Played" items={data?.recentlyPlayed ?? []} scrollable />
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <ActivityFeed title="Friends Activity" items={(data?.recentlyPlayed ?? []).slice(0, 8)} showAvatars showActions scrollable />
              </motion.div>
            )}

            {activeTab === 'artists' && (
              <motion.div key="artists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={tabPanelClass}>
                <div className="rounded-2xl border border-border bg-card/80 p-6 text-muted-foreground">
                  Artists followed will appear here once you follow some artists.
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`${tabPanelClass} grid gap-4 md:grid-cols-2`}
              >
                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Theme</div>
                    <div className="text-sm text-muted-foreground">Dark / Light</div>
                  </div>
                  <button onClick={toggleTheme} className={`${settingsActionClass} min-w-[96px]`}>
                    {isDarkTheme ? 'Dark' : 'Light'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Audio quality</div>
                    <div className="text-sm text-muted-foreground">{AUDIO_QUALITY_LABEL[settings.audioQuality]}</div>
                  </div>
                  <button
                    onClick={handleAudioQuality}
                    disabled={settingsBusy.audioQuality}
                    className={`${settingsActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {settingsBusy.audioQuality ? 'Saving...' : 'Change'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Notifications</div>
                    <div className="text-sm text-muted-foreground">{NOTIFICATION_LABEL[settings.notifications]}</div>
                  </div>
                  <button
                    onClick={handleNotifications}
                    disabled={settingsBusy.notifications}
                    className={`${settingsActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {settingsBusy.notifications ? 'Saving...' : 'Edit'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Autoplay</div>
                    <div className="text-sm text-muted-foreground">{settings.autoplay ? 'On' : 'Off'}</div>
                  </div>
                  <button
                    onClick={handleAutoplay}
                    disabled={settingsBusy.autoplay}
                    className={`${settingsActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {settingsBusy.autoplay ? 'Saving...' : 'Toggle'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Account privacy</div>
                    <div className="text-sm text-muted-foreground">{PRIVACY_LABEL[settings.accountPrivacy]}</div>
                  </div>
                  <button
                    onClick={handleAccountPrivacy}
                    disabled={settingsBusy.accountPrivacy}
                    className={`${settingsActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {settingsBusy.accountPrivacy ? 'Saving...' : 'Edit'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Connected accounts</div>
                    <div className="text-sm text-muted-foreground">
                      {settings.connectedAccounts.google ? 'Google connected' : 'No account connected'}
                    </div>
                  </div>
                  <button
                    onClick={handleConnectedAccounts}
                    disabled={settingsBusy.connectedAccounts || (user?.isGoogleUser && settings.connectedAccounts.google)}
                    className={`${settingsActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {settingsBusy.connectedAccounts
                      ? 'Saving...'
                      : user?.isGoogleUser && settings.connectedAccounts.google
                        ? 'Primary'
                        : settings.connectedAccounts.google
                          ? 'Disconnect'
                          : 'Connect'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-foreground">Change password</div>
                    <div className="text-sm text-muted-foreground">Update account password</div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={settingsBusy.changePassword}
                    className={`${settingsActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {settingsBusy.changePassword ? 'Updating...' : 'Update'}
                  </button>
                </div>

                <div className={settingsCardClass}>
                  <div>
                    <div className="font-semibold text-red-500">Delete account</div>
                    <div className="text-sm text-muted-foreground">Permanently remove account</div>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={settingsBusy.deleteAccount}
                    className="rounded-full bg-red-500/90 px-3 py-1 text-sm text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {settingsBusy.deleteAccount ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
