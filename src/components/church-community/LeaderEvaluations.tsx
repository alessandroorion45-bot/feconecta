import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarPro } from "@/components/AvatarPro";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Star, StarOff, Mic, MicOff, User, Loader2, Play, Pause } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommunityReactions from "./CommunityReactions";

interface Leader {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
}

interface Evaluation {
  id: string;
  leader_id: string;
  user_id: string;
  is_anonymous: boolean;
  rating: number;
  text_content: string | null;
  audio_url: string | null;
  created_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface LeaderEvaluationsProps {
  communityId: string;
  userId: string;
}

const LeaderEvaluations = ({ communityId, userId }: LeaderEvaluationsProps) => {
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, Evaluation[]>>(new Map());
  const [averageRatings, setAverageRatings] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  
  // Evaluation form state
  const [rating, setRating] = useState(0);
  const [textContent, setTextContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    loadLeaders();
  }, [communityId]);

  const loadLeaders = async () => {
    try {
      const { data: leadersData, error: leadersError } = await supabase
        .from("church_leaders")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true);

      if (leadersError) throw leadersError;
      setLeaders(leadersData || []);

      // Load evaluations for each leader
      for (const leader of leadersData || []) {
        const { data: evals, error: evalsError } = await supabase
          .from("leader_evaluations")
          .select("*")
          .eq("leader_id", leader.id)
          .order("created_at", { ascending: false });

        if (!evalsError && evals) {
          // Load profiles for non-anonymous evaluations
          const enrichedEvals = await Promise.all(
            evals.map(async (e) => {
              if (!e.is_anonymous) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("username, full_name, avatar_url")
                  .eq("id", e.user_id)
                  .single();
                return { ...e, profile };
              }
              return e;
            })
          );

          setEvaluations(prev => new Map(prev).set(leader.id, enrichedEvals));

          // Calculate average rating
          if (evals.length > 0) {
            const avg = evals.reduce((sum, e) => sum + (e.rating || 0), 0) / evals.length;
            setAverageRatings(prev => new Map(prev).set(leader.id, avg));
          }
        }
      }
    } catch (error) {
      console.error("Error loading leaders:", error);
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

  const handleSubmitEvaluation = async () => {
    if (!selectedLeader || rating === 0) {
      toast({
        title: "Avaliação incompleta",
        description: "Por favor, dê uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    setEvaluating(true);
    try {
      let uploadedAudioUrl = null;

      // Upload audio if exists
      if (audioBlob) {
        const fileName = `${userId}/${Date.now()}.webm`;
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
        .from("leader_evaluations")
        .insert({
          leader_id: selectedLeader.id,
          community_id: communityId,
          user_id: userId,
          is_anonymous: isAnonymous,
          rating,
          text_content: textContent.trim() || null,
          audio_url: uploadedAudioUrl,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado por contribuir com sua opinião.",
      });

      // Reset form
      setShowEvaluateModal(false);
      setSelectedLeader(null);
      setRating(0);
      setTextContent("");
      setIsAnonymous(false);
      setAudioUrl(null);
      setAudioBlob(null);
      loadLeaders();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEvaluating(false);
    }
  };

  const renderStars = (count: number, interactive = false, onClick?: (n: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onClick?.(n)}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}
          >
            <Star
              className={`h-5 w-5 ${n <= count ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex-row items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div>
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded mt-2" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhum líder cadastrado</h3>
          <p className="text-muted-foreground">
            Os administradores podem adicionar líderes para serem avaliados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leaders.map(leader => {
          const leaderEvals = evaluations.get(leader.id) || [];
          const avgRating = averageRatings.get(leader.id) || 0;

          return (
            <Card key={leader.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <AvatarPro src={leader.photo_url} name={leader.name} size="lg" clickable={false} />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{leader.name}</CardTitle>
                    <CardDescription>{leader.role}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(Math.round(avgRating))}
                      <span className="text-sm text-muted-foreground">
                        ({leaderEvals.length} avaliações)
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {leader.bio && (
                  <p className="text-sm text-muted-foreground">{leader.bio}</p>
                )}

                <Button
                  onClick={() => {
                    setSelectedLeader(leader);
                    setShowEvaluateModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Avaliar
                </Button>

                {/* Recent evaluations */}
                {leaderEvals.slice(0, 3).map(evaluation => (
                  <div key={evaluation.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {evaluation.is_anonymous ? (
                          <>
                            <AvatarPro name="?" size="xs" clickable={false} />
                            <span className="text-sm text-muted-foreground">Anônimo</span>
                          </>
                        ) : (
                          <>
                            <AvatarPro
                              src={evaluation.profile?.avatar_url}
                              name={evaluation.profile?.full_name}
                              userId={evaluation.user_id}
                              size="xs"
                            />
                            <span className="text-sm">{evaluation.profile?.full_name}</span>
                          </>
                        )}
                      </div>
                      {renderStars(evaluation.rating || 0)}
                    </div>

                    {evaluation.text_content && (
                      <p className="text-sm">{evaluation.text_content}</p>
                    )}

                    {evaluation.audio_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          if (playingAudio === evaluation.id) {
                            setPlayingAudio(null);
                          } else {
                            setPlayingAudio(evaluation.id);
                            const audio = new Audio(evaluation.audio_url!);
                            audio.play();
                            audio.onended = () => setPlayingAudio(null);
                          }
                        }}
                      >
                        {playingAudio === evaluation.id ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        Ouvir áudio
                      </Button>
                    )}

                    <CommunityReactions
                      evaluationId={evaluation.id}
                      userId={userId}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Evaluate Modal */}
      <Dialog open={showEvaluateModal} onOpenChange={setShowEvaluateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar {selectedLeader?.name}</DialogTitle>
            <DialogDescription>
              Compartilhe sua opinião sobre a gestão deste líder. Sua avaliação ajuda a fortalecer a comunidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Nota</Label>
              <div className="flex justify-center">
                {renderStars(rating, true, setRating)}
              </div>
            </div>

            {/* Text content */}
            <div className="space-y-2">
              <Label>Comentário (opcional)</Label>
              <Textarea
                placeholder="Escreva sua avaliação..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={3}
              />
            </div>

            {/* Audio recording */}
            <div className="space-y-2">
              <Label>Áudio (opcional)</Label>
              <div className="flex items-center gap-2">
                {audioUrl ? (
                  <>
                    <audio src={audioUrl} controls className="flex-1 h-10" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAudioUrl(null);
                        setAudioBlob(null);
                      }}
                    >
                      <MicOff className="h-4 w-4" />
                    </Button>
                  </>
                ) : isRecording ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopRecording}
                    className="w-full"
                  >
                    <MicOff className="h-4 w-4 mr-2 animate-pulse" />
                    Parar Gravação
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startRecording}
                    className="w-full"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Gravar Áudio
                  </Button>
                )}
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="anonymous">Avaliação anônima</Label>
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEvaluateModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitEvaluation}
                disabled={evaluating || rating === 0}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Avaliação"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeaderEvaluations;
