import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Home, Crown, CalendarDays, Megaphone, X } from "lucide-react";

const sb = supabase as any;

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  tab: string;
  icon: typeof Home;
}

interface CommunitySearchProps {
  communityId: string;
  onNavigate: (tab: string) => void;
}

const CommunitySearch = ({ communityId, onNavigate }: CommunitySearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const q = `%${query.trim()}%`;
      const [cells, leaders, events, posts] = await Promise.all([
        sb.from("community_cells").select("id, name, city").eq("community_id", communityId).eq("is_active", true).ilike("name", q).limit(5),
        sb.from("church_leaders").select("id, name, role").eq("community_id", communityId).eq("is_active", true).ilike("name", q).limit(5),
        sb.from("community_events").select("id, title, event_type").eq("community_id", communityId).eq("is_active", true).ilike("title", q).limit(5),
        supabase.from("community_posts").select("id, title, content").eq("community_id", communityId).ilike("title", q).limit(5),
      ]);

      const found: SearchResult[] = [
        ...(cells.data || []).map((c: any) => ({ id: c.id, label: c.name, sublabel: c.city || "Célula", tab: "cells", icon: Home })),
        ...(leaders.data || []).map((l: any) => ({ id: l.id, label: l.name, sublabel: l.role, tab: "leaders", icon: Crown })),
        ...(events.data || []).map((e: any) => ({ id: e.id, label: e.title, sublabel: "Evento", tab: "calendar", icon: CalendarDays })),
        ...(posts.data || []).map((p: any) => ({ id: p.id, label: p.title || "Publicação no mural", sublabel: "Mural", tab: "mural", icon: Megaphone })),
      ];
      setResults(found);
      setLoading(false);
      setOpen(true);
    }, 300);
  }, [query, communityId]);

  const pick = (r: SearchResult) => {
    onNavigate(r.tab);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar na comunidade..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        className="pl-10 pr-8"
      />
      {query && (
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setQuery(""); setOpen(false); }}>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nada encontrado.</p>
          ) : (
            results.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={`${r.tab}-${r.id}`}
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                >
                  <Icon className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{r.label}</p>
                    {r.sublabel && <p className="text-[11px] text-muted-foreground truncate">{r.sublabel}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CommunitySearch;
