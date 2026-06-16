import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  book_name: string;
  book_abbrev: string;
  chapter: number;
  verse_number: number;
  note_text: string;
  created_at: string;
}

interface BibleNotesProps {
  currentBook?: string;
  currentChapter?: number;
}

const BibleNotes = ({ currentBook, currentChapter }: BibleNotesProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('bible_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotes(data);
  };

  const addNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para adicionar anotações.",
        variant: "destructive",
      });
      return;
    }

    if (!newNote.trim()) {
      toast({
        title: "Atenção",
        description: "Digite uma anotação antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('bible_notes').insert({
      user_id: user.id,
      book_name: currentBook || 'Bíblia',
      book_abbrev: currentBook || 'GN',
      chapter: currentChapter || 1,
      verse_number: 1,
      note_text: newNote,
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Anotação salva!",
        description: "Sua anotação foi adicionada com sucesso.",
      });
      setNewNote("");
      setIsDialogOpen(false);
      loadNotes();
    }
  };

  const updateNote = async () => {
    if (!editingNote) return;

    const { error } = await supabase
      .from('bible_notes')
      .update({ note_text: editingNote.note_text })
      .eq('id', editingNote.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Atualizado!",
        description: "Anotação atualizada com sucesso.",
      });
      setEditingNote(null);
      loadNotes();
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('bible_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removida",
        description: "Anotação removida com sucesso.",
      });
      loadNotes();
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Minhas Anotações
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Anotação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Digite sua anotação..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={6}
                />
                <Button onClick={addNote} className="w-full">
                  Salvar Anotação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma anotação ainda. Comece a registrar suas reflexões!
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {editingNote?.id === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNote.note_text}
                        onChange={(e) => setEditingNote({ ...editingNote, note_text: e.target.value })}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={updateNote}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary mb-1">
                            {note.book_name} {note.chapter}:{note.verse_number}
                          </p>
                          <p className="text-sm">{note.note_text}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingNote(note)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default BibleNotes;
