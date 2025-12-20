
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    genre: string;
    duration: number[];
    uploadDate: string;
    plays: string;
  };
  onFiltersChange: (filters: any) => void;
}

const SearchFilters = ({ isOpen, onClose, filters, onFiltersChange }: SearchFiltersProps) => {
  if (!isOpen) return null;

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Genre</Label>
            <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All genres</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="r&b">R&B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <div className="mt-2 px-2">
              <Slider
                value={filters.duration}
                onValueChange={(value) => updateFilter('duration', value)}
                max={10}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>{filters.duration[0]}m</span>
                <span>{filters.duration[1]}m</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Upload Date</Label>
            <Select value={filters.uploadDate} onValueChange={(value) => updateFilter('uploadDate', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Popularity</Label>
            <Select value={filters.plays} onValueChange={(value) => updateFilter('plays', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="viral">Viral (1M+ plays)</SelectItem>
                <SelectItem value="popular">Popular (100K+ plays)</SelectItem>
                <SelectItem value="trending">Trending (10K+ plays)</SelectItem>
                <SelectItem value="new">New & Fresh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onFiltersChange({ genre: '', duration: [0, 10], uploadDate: '', plays: '' })} className="flex-1">
            Clear All
          </Button>
          <Button onClick={onClose} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
