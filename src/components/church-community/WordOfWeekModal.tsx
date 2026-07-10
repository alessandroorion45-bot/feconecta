import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Image as ImageIcon, FileText, Video, Music, Paperclip, X } from "lucide-react";
import { isValidYoutubeUrl } from "@/lib/youtube";

interface WordOfWeekModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  onSuccess: () => void;
}

interface Attachment {
  name: string;
  url: string;
}

const emptyForm = {
  title: "",
  verse_reference: "",
  verse_text: "",
  content: "",
  applications: "",
  reflection_questions: "",
  youtube_url: "",
};

const WordOfWeekModal = ({ open, onOpenChange, communityId, userId, onSuccess }: WordOfWeekModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const uploadTo = async (file: File, tag: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const filePath = `community-studies/${tag}-${communityId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("community-photos").upload(filePath, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("community-photos").getPublicUrl(filePath).data.publicUrl;
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    tag: string,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(tag);
    try {
      const url = await uploadTo(file, tag);
      setter(url);
    } catch (error: any) {
      toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField("attachment");
    try {
      const url = await uploadTo(file, "attachment");
      setAttachments(prev => [...prev, { name: file.name, url }]);
    } catch (error: any) {
      toast({ title: "Erro ao enviar anexo", description: error.message, variant: "destructive" });
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const resetAll = () => {
    setForm(emptyForm);
    setImageUrl(null);
    setPdfUrl(null);
    setVideoUrl(null);
    setAudioUrl(null);
    setAttachments([]);
  };

  const publish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tema e o resumo da ministração.",
        variant: "destructive",
      });
      return;
    }
    if (form.youtube_url.trim() && !isValidYoutubeUrl(form.youtube_url.trim())) {
      toast({ title: "Link do YouTube inválido", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Despina a Palavra anterior (fica no histórico do mural)
      await (supabase as any)
        .from("community_posts")
        .update({ is_pinned: false })
        .eq("community_id", communityId)
        .eq("type", "word_of_week")
        .eq("is_pinned", true);

      const { error } = await (supabase as any).from("community_posts").insert({
        community_id: communityId,
        user_id: userId,
        type: "word_of_week",
        title: form.title.trim(),
        content: form.content.trim(),
        verse_reference: form.verse_reference.trim() || null,
        verse_text: form.verse_text.trim() || null,
        applications: form.applications.trim() || null,
        reflection_questions: form.reflection_questions.trim() || null,
        is_pinned: true,
        image_url: imageUrl,
        pdf_url: pdfUrl,
        video_url: videoUrl,
        audio_url: audioUrl,
        youtube_url: form.youtube_url.trim() || null,
        attachments,
      });

      if (error) throw error;

      toast({ title: "✨ Estudo da Semana publicado!", description: "Ele está em destaque no mural da comunidade." });
      resetAll();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao publicar",
        description: error.message?.includes("does not exist") || error.message?.includes("policy")
          ? "Aplique a atualização do banco e confirme que você é líder."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Estudo / Palavra da Semana
          </DialogTitle>
          <DialogDescription>
            Compartilhe a mensagem e os materiais que vão guiar a comunidade nesta semana.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wow-title">Tema da mensagem *</Label>
            <Input id="wow-title" placeholder="Ex: A fidelidade de Deus no deserto"
              value={form.title} onChange={set("title")} maxLength={120} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wow-ref">Texto bíblico principal</Label>
              <Input id="wow-ref" placeholder="Ex: Êxodo 3:1-9"
                value={form.verse_reference} onChange={set("verse_reference")} maxLength={60} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-verse">Versículo em destaque</Label>
            <Textarea id="wow-verse" placeholder="Cole aqui o texto do versículo principal..."
              value={form.verse_text} onChange={set("verse_text")} rows={2} maxLength={500} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-content">Resumo da ministração *</Label>
            <Textarea id="wow-content" placeholder="O que Deus falou através desta mensagem..."
              value={form.content} onChange={set("content")} rows={4} maxLength={2000} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-app">Aplicações práticas</Label>
            <Textarea id="wow-app" placeholder="Como viver esta Palavra durante a semana..."
              value={form.applications} onChange={set("applications")} rows={3} maxLength={1000} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wow-q">Perguntas para reflexão</Label>
            <Textarea id="wow-q" placeholder={"1. O que este texto revela sobre Deus?\n2. Qual área da sua vida ele alcança?"}
              value={form.reflection_questions} onChange={set("reflection_questions")} rows={3} maxLength={1000} className="resize-none" />
          </div>

          <div className="border-t pt-3 space-y-3">
            <h4 className="font-medium flex items-center gap-2">📎 Materiais de apoio</h4>

            <div className="space-y-1.5">
              <Label htmlFor="wow-yt">Link do YouTube</Label>
              <Input id="wow-yt" placeholder="https://youtube.com/watch?v=..." value={form.youtube_url} onChange={set("youtube_url")} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "image", setImageUrl)} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => imageInputRef.current?.click()} disabled={uploadingField === "image"}>
                {uploadingField === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {imageUrl ? "Imagem enviada ✓" : "Imagem"}
              </Button>

              <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleUpload(e, "pdf", setPdfUrl)} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => pdfInputRef.current?.click()} disabled={uploadingField === "pdf"}>
                {uploadingField === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {pdfUrl ? "PDF enviado ✓" : "PDF"}
              </Button>

              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleUpload(e, "video", setVideoUrl)} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => videoInputRef.current?.click()} disabled={uploadingField === "video"}>
                {uploadingField === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {videoUrl ? "Vídeo enviado ✓" : "Vídeo"}
              </Button>

              <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleUpload(e, "audio", setAudioUrl)} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => audioInputRef.current?.click()} disabled={uploadingField === "audio"}>
                {uploadingField === "audio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
                {audioUrl ? "Áudio enviado ✓" : "Áudio"}
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>Anexos (PDF, slides, outros arquivos)</Label>
              <div className="space-y-1.5">
                {attachments.map((a, i) => (
                  <div key={a.url} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 text-xs">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{a.name}</span>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingField === "attachment"}>
                {uploadingField === "attachment" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                Adicionar anexo
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={publish} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordOfWeekModal;
