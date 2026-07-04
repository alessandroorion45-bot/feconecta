import { FEED_FILTERS } from "@/lib/feed/feedTypes";
import type { FeedFilterKey } from "@/lib/feed/feedTypes";
import { cn } from "@/lib/utils";

interface FeedFiltersProps {
  active: FeedFilterKey;
  onChange: (filter: FeedFilterKey) => void;
}

export const FeedFilters = ({ active, onChange }: FeedFiltersProps) => (
  <div
    className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    {FEED_FILTERS.map((f) => (
      <button
        key={f.key}
        onClick={() => onChange(f.key)}
        className={cn(
          "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
          active === f.key
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-card text-muted-foreground border-border hover:bg-muted"
        )}
      >
        <span>{f.emoji}</span>
        {f.label}
      </button>
    ))}
  </div>
);
