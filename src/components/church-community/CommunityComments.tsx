import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Mic, MicOff, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommunityReactions from "./CommunityReactions";

interface Comment {
  id: string;
  user_id: string;
  text_content: string | null;
  audio_url: string | null;
  is_anonymous: boolean;
  created_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface CommunityCommentsProps {
  communityId: string;
  votingId?: string;
  evaluationId?: string;
  userId: string;
}

const CommunityComments = ({ communityId, votingId, evaluationId, userId }: CommunityCommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    loadComments();

    // Realtime subscription
    const channel = supabase
      .channel(`comments-${votingId || evaluationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_comments',
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [votingId, evaluationId]);

  const loadComments = async () => {
    try {
      let query = supabase
        .from("community_comments")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true });

      if (votingId) query = query.eq("voting_id", votingId);
      if (evaluationId) query = query.eq("evaluation_id", evaluationId);

      const { data, error } = await query;
      if (error) throw error;

      // Load profiles for non-anonymous comments
      const enrichedComments = await Promise.all(
        (data || []).map(async (c) => {
          if (!c.is_anonymous) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, full_name, avatar_url")
              .eq("id", c.user_id)
              .single();
            return { ...c, profile };
          }
          return c;
        })
      );

      setComments(enrichedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Erro ao gravar",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSubmit = async () => {
    if (!textContent.trim() && !audioBlob) {
      toast({
        title: "Comentário vazio",
        description: "Escreva algo ou grave um áudio.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      let uploadedAudioUrl = null;

      if (audioBlob) {
        const fileName = `comments/${userId}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("audio")
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("audio")
          .getPublicUrl(fileName);
        uploadedAudioUrl = publicUrl;
      }

      const { error } = await supabase
        .from("community_comments")
        .insert({
          community_id: communityId,
          voting_id: votingId || null,
          evaluation_id: evaluationId || null,
          user_id: userId,
          text_content: textContent.trim() || null,
          audio_url: uploadedAudioUrl,
          is_anonymous: isAnonymous,
        });

      if (error) throw error;

      setTextContent("");
      setAudioUrl(null);
      setAudioBlob(null);
      setIsAnonymous(false);
      loadComments();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("community_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);

      if (error) throw error;
      loadComments();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 h-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2 border-t">
      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                {comment.is_anonymous ? (
                  <AvatarFallback>?</AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={comment.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.profile?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {comment.is_anonymous ? "Anônimo" : comment.profile?.full_name || "Usuário"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                  {comment.user_id === userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {comment.text_content && (
                  <p className="text-sm">{comment.text_content}</p>
                )}

                {comment.audio_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs mt-1"
                    onClick={() => {
                      if (playingAudio === comment.id) {
                        setPlayingAudio(null);
                      } else {
                        setPlayingAudio(comment.id);
                        const audio = new Audio(comment.audio_url!);
                        audio.play();
                        audio.onended = () => setPlayingAudio(null);
                      }
                    }}
                  >
                    {playingAudio === comment.id ? (
                      <Pause className="h-3 w-3 mr-1" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    Ouvir
                  </Button>
                )}

                <CommunityReactions
                  commentId={comment.id}
                  userId={userId}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva um comentário..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-[60px] text-sm"
            disabled={sending}
          />
        </div>

        {audioUrl && (
          <div className="flex items-center gap-2">
            <audio src={audioUrl} controls className="flex-1 h-8" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setAudioUrl(null);
                setAudioBlob(null);
              }}
            >
              <MicOff className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isRecording ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopRecording}
              >
                <MicOff className="h-4 w-4 mr-1 animate-pulse" />
                Parar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={startRecording}
                disabled={sending || !!audioUrl}
              >
                <Mic className="h-4 w-4 mr-1" />
                Gravar
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="anon"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={sending}
              />
              <Label htmlFor="anon" className="text-xs">Anônimo</Label>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={sending || (!textContent.trim() && !audioBlob)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityComments;
