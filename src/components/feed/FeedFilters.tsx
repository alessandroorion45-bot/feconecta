import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FEED_FILTERS } from "@/lib/feed/feedTypes";
import type { FeedFilterKey } from "@/lib/feed/feedTypes";
import { cn } from "@/lib/utils";

interface FeedFiltersProps {
  active: FeedFilterKey;
  onChange: (filter: FeedFilterKey) => void;
}

export const FeedFilters = ({ active, onChange }: FeedFiltersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-background to-transparent z-10" />
          <button
            type="button"
            onClick={() => scrollBy(-160)}
            aria-label="Rolar filtros para a esquerda"
            className="absolute left-0 top-0 bottom-2 z-20 flex items-center px-0.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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

      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background to-transparent z-10" />
          <button
            type="button"
            onClick={() => scrollBy(160)}
            aria-label="Rolar filtros para a direita"
            className="absolute right-0 top-0 bottom-2 z-20 flex items-center justify-end px-0.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};
