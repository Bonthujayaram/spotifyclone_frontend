import { Camera, CheckCircle2, Crown, Edit, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

type UserLite = {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isVerified?: boolean;
  plan?: 'Free' | 'Premium';
};

interface Metrics {
  playlists: number;
  liked: number;
  followers: number;
  following: number;
  streak: number;
}

interface Props {
  user: UserLite;
  metrics: Metrics;
  loading?: boolean;
  onEdit: () => void;
  onLogout: () => void;
}

const ProfileHeader = ({ user, metrics, loading, onEdit, onLogout }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-card/85 px-6 py-5 backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#1db954]/20 via-blue-500/10 to-transparent" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/80 shadow-lg">
          <img
            src={
              user.profilePicture ||
              `https://ui-avatars.com/api/?background=0D1117&color=fff&name=${encodeURIComponent(user.name || 'User')}`
            }
            alt={user.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <button
            aria-label="Change avatar"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100"
          >
            <Camera className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{user.name || 'EchoVibe User'}</h1>
            {user.isVerified && <CheckCircle2 className="h-4 w-4 text-sky-400" aria-label="Verified" />}
            {user.plan === 'Premium' && <Crown className="h-4 w-4 text-amber-400" aria-label="Premium" />}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{metrics.followers} Followers</span>
            <span>{metrics.following} Following</span>
            <span>{metrics.playlists} Playlists</span>
            <span>{metrics.liked} Liked</span>
            <span>{metrics.streak}-day streak</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-2 transition hover:bg-accent/80"
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-2 text-sm text-white transition hover:bg-red-500"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
