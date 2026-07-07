import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { bibleApi, BibleChapter } from "@/services/bibleApi";
import { BookOpen, ZoomIn, ZoomOut, Heart, Share2, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FriendPickerDialog } from "@/components/chat/FriendPickerDialog";

/**
 * Modal de referência bíblica: abre qualquer referência (ex: "João 3:16-18",
 * "Salmos 91") com o texto da Bíblia já integrada ao projeto, sem sair da
 * página. Fonte ajustável, favoritar e compartilhar.
 */

interface ParsedRef {
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

/** Interpreta referências em português: "João 3:16", "1 Coríntios 13:4-7", "Salmos 91" */
export function parseReference(ref: string): ParsedRef | null {
  const match = ref.trim().match(/^([1-3]?\s?[A-Za-zÀ-ú]+(?:\s[A-Za-zÀ-ú]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?/);
  if (!match) return null;
  return {
    bookName: match[1].trim(),
    chapter: parseInt(match[2]),
    verseStart: match[3] ? parseInt(match[3]) : undefined,
    verseEnd: match[4] ? parseInt(match[4]) : (match[3] ? parseInt(match[3]) : undefined),
  };
}

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

interface BibleReferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: string;
}

export const BibleReferenceModal = ({ open, onOpenChange, reference }: BibleReferenceModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [bookAbbrev, setBookAbbrev] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showFullChapter, setShowFullChapter] = useState(false);
  const [friendPickerOpen, setFriendPickerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setChapter(null);

    const p = parseReference(reference);
    setParsed(p);
    if (!p) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const books = await bibleApi.getBooks();
      const target = normalize(p.bookName);
      const book = books.find(b =>
        b.names.some(n => normalize(n) === target) ||
        normalize(b.names[0]).startsWith(target) ||
        b.abrev === target
      );

      if (!book) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBookAbbrev(book.abrev);
      const data = await bibleApi.getChapter(book.abrev, p.chapter);
      setChapter(data);
      setShowFullChapter(!p.verseStart);
    } catch (error) {
      console.error("[BibleReferenceModal] Erro ao carregar:", error);
      setNotFound(true);
    }
    setLoading(false);
  }, [reference]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const inRange = (n: number) =>
    !parsed?.verseStart || (n >= parsed.verseStart && n <= (parsed.verseEnd || parsed.verseStart));

  const visibleVerses = chapter
    ? (showFullChapter ? chapter.vers : chapter.vers.filter(v => inRange(v.number)))
    : [];

  const favoriteVerse = async () => {
    if (!user || !chapter || !parsed) {
      toast({ title: "Faça login para favoritar", variant: "destructive" });
      return;
    }
    const verseNum = parsed.verseStart || 1;
    const verse = chapter.vers.find(v => v.number === verseNum);
    if (!verse) return;

    const { error } = await supabase.from("favorite_verses").insert({
      user_id: user.id,
      book_abbrev: bookAbbrev,
      book_name: chapter.name,
      chapter: parsed.chapter,
      verse_number: verseNum,
      verse_text: verse.verse,
    });

    if (error && error.code !== "23505") {
      toast({ title: "Erro ao favoritar", variant: "destructive" });
    } else {
      toast({ title: "⭐ Versículo favoritado!", description: `${chapter.name} ${parsed.chapter}:${verseNum}` });
    }
  };

  const share = async () => {
    if (!chapter || !parsed) return;
    const versesText = visibleVerses.map(v => `${v.number}. ${v.verse}`).join("\n");
    const text = `📖 ${chapter.name} ${parsed.chapter}${parsed.verseStart ? `:${parsed.verseStart}${parsed.verseEnd && parsed.verseEnd !== parsed.verseStart ? `-${parsed.verseEnd}` : ""}` : ""}\n\n${versesText}\n\n✨ Aliança`;
    try {
      if (navigator.share) {
        await navigator.share({ title: reference, text: text.slice(0, 800) });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "📋 Copiado!" });
      }
    } catch { /* cancelado */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 border-b border-primary/10">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              📖 {reference}
            </DialogTitle>
            <div className="flex items-center gap-1 mr-6">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFontSize(s => Math.max(12, s - 2))} aria-label="Diminuir fonte">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFontSize(s => Math.min(26, s + 2))} aria-label="Aumentar fonte">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notFound || !chapter ? (
            <p className="text-center text-muted-foreground py-8">
              Não foi possível localizar esta referência. Abra a Bíblia para navegar manualmente.
            </p>
          ) : (
            <div className="space-y-3" style={{ fontSize }}>
              {visibleVerses.map(v => (
                <p key={v.number} className={cn("leading-relaxed", inRange(v.number) && parsed?.verseStart && "bg-primary/10 rounded px-1 -mx-1")}>
                  <span className="text-primary font-bold mr-2 text-sm">{v.number}</span>
                  {v.verse}
                </p>
              ))}
            </div>
          )}
        </div>

        {chapter && (
          <div className="px-6 py-3 border-t bg-muted/30 flex items-center gap-2 flex-wrap">
            {parsed?.verseStart && (
              <Button variant="outline" size="sm" onClick={() => setShowFullChapter(f => !f)}>
                {showFullChapter ? "Só o versículo" : "Capítulo inteiro"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={favoriteVerse}>
              <Heart className="h-3.5 w-3.5" />
              Favoritar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={share}>
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </Button>
            {user && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFriendPickerOpen(true)}>
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar no chat
              </Button>
            )}
            <Badge variant="secondary" className="ml-auto text-xs">
              {chapter.name} {parsed?.chapter}
            </Badge>
          </div>
        )}
      </DialogContent>

      {chapter && parsed && (
        <FriendPickerDialog
          open={friendPickerOpen}
          onOpenChange={setFriendPickerOpen}
          messageType="verse"
          sharedContent={{
            reference,
            title: `${chapter.name} ${parsed.chapter}${parsed.verseStart ? `:${parsed.verseStart}` : ''}`,
            snippet: visibleVerses[0]?.verse?.slice(0, 100),
          }}
          fallbackText={`📖 Compartilhou ${reference}`}
        />
      )}
    </Dialog>
  );
};

export default BibleReferenceModal;
