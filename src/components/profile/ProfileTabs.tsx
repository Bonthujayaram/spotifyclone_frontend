const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'liked', label: 'Liked Songs' },
  { key: 'recent', label: 'Recently Played' },
  { key: 'artists', label: 'Artists Followed' },
  { key: 'activity', label: 'Activity' },
  { key: 'settings', label: 'Settings' },
] as const;

export type ProfileTab = (typeof tabs)[number]['key'];

export default function ProfileTabs({ active, onChange }: { active: ProfileTab; onChange: (k: ProfileTab) => void }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-full text-sm border transition ${
            active === t.key
              ? 'bg-foreground text-background border-foreground/10 shadow-sm'
              : 'bg-card/80 text-muted-foreground border-border hover:bg-accent hover:text-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
