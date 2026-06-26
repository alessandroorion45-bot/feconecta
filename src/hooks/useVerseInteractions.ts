import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VerseCounts {
  comments: number;
  highlights: number;
  shares: number;
  favorites: number;
}

interface VerseInteractions {
  [verseNumber: number]: VerseCounts;
}

export const useVerseInteractions = (bookAbbrev: string, chapter: number) => {
  const [interactions, setInteractions] = useState<VerseInteractions>({});
  const [loading, setLoading] = useState(false);

  const loadInteractions = useCallback(async () => {
    if (!bookAbbrev || !chapter) return;
    
    setLoading(true);
    try {
      // Fetch counts in parallel - handle each independently to avoid one failure breaking all
      const [commentsRes, highlightsRes, sharesRes, favoritesRes] = await Promise.allSettled([
        supabase
          .from("verse_comments")
          .select("verse_number")
          .eq("book_abbrev", bookAbbrev)
          .eq("chapter", chapter),
        supabase
          .from("bible_verse_highlights")
          .select("verse_number")
          .eq("book_abbrev", bookAbbrev)
          .eq("chapter", chapter),
        supabase
          .from("verse_shares")
          .select("verse_number")
          .eq("book_abbrev", bookAbbrev)
          .eq("chapter", chapter),
        supabase
          .from("favorite_verses")
          .select("verse_number")
          .eq("book_abbrev", bookAbbrev)
          .eq("chapter", chapter)
      ]);

      const counts: VerseInteractions = {};

      const getDataSafe = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled' && result.value?.data) {
          return result.value.data;
        }
        return [];
      };

      getDataSafe(commentsRes).forEach((c: any) => {
        if (!counts[c.verse_number]) {
          counts[c.verse_number] = { comments: 0, highlights: 0, shares: 0, favorites: 0 };
        }
        counts[c.verse_number].comments++;
      });

      getDataSafe(highlightsRes).forEach((h: any) => {
        if (!counts[h.verse_number]) {
          counts[h.verse_number] = { comments: 0, highlights: 0, shares: 0, favorites: 0 };
        }
        counts[h.verse_number].highlights++;
      });

      getDataSafe(sharesRes).forEach((s: any) => {
        if (!counts[s.verse_number]) {
          counts[s.verse_number] = { comments: 0, highlights: 0, shares: 0, favorites: 0 };
        }
        counts[s.verse_number].shares++;
      });

      getDataSafe(favoritesRes).forEach((f: any) => {
        if (!counts[f.verse_number]) {
          counts[f.verse_number] = { comments: 0, highlights: 0, shares: 0, favorites: 0 };
        }
        counts[f.verse_number].favorites++;
      });

      setInteractions(counts);
    } catch (error) {
      console.error("Error loading verse interactions:", error);
    } finally {
      setLoading(false);
    }
  }, [bookAbbrev, chapter]);

  useEffect(() => {
    loadInteractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookAbbrev, chapter]); // ✅ Removido loadInteractions para evitar loop infinito

  // Subscribe to realtime updates
  useEffect(() => {
    if (!bookAbbrev || !chapter) return;

    const channel = supabase
      .channel(`verse-interactions-${bookAbbrev}-${chapter}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verse_comments', filter: `book_abbrev=eq.${bookAbbrev}` },
        () => loadInteractions()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bible_verse_highlights', filter: `book_abbrev=eq.${bookAbbrev}` },
        () => loadInteractions()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorite_verses', filter: `book_abbrev=eq.${bookAbbrev}` },
        () => loadInteractions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookAbbrev, chapter, loadInteractions]);

  const getVerseCounts = (verseNumber: number): VerseCounts => {
    return interactions[verseNumber] || { comments: 0, highlights: 0, shares: 0, favorites: 0 };
  };

  return { interactions, loading, getVerseCounts, refreshInteractions: loadInteractions };
};
