import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareHeart, Send, Check, X, Clock, Trash2, Pin, PinOff, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { friendTestimonialSchema, validateField } from "@/lib/validation";

interface Testimonial {
  id: string;
  content: string;
  status: string;
  created_at: string;
  author_id: string;
  is_pinned: boolean;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const seenKey = (profileId: string) => `testimonials-seen-${profileId}`;

/** IDs de depoimentos já vistos nesse perfil (localStorage) — usado só pra
 * decidir quais ganham a animação de "chegada" na primeira exibição.
 * `hasVisitedBefore` distingue "primeira visita nesse navegador" (nunca
 * mostra glow, senão os depoimentos existentes "chegariam" todos juntos)
 * de "já visitou com 0 depoimentos, agora tem 1" (esse deve brilhar). */
function loadSeenIds(profileId: string): { ids: Set<string>; hasVisitedBefore: boolean } {
  try {
    const raw = localStorage.getItem(seenKey(profileId));
    return { ids: new Set(raw ? JSON.parse(raw) : []), hasVisitedBefore: raw !== null };
  } catch {
    return { ids: new Set(), hasVisitedBefore: false };
  }
}

function saveSeenIds(profileId: string, ids: string[]) {
  try {
    localStorage.setItem(seenKey(profileId), JSON.stringify(ids));
  } catch {
    // localStorage indisponível — sem problema, é só cosmético
  }
}

interface FriendTestimonialsProps {
  profileId: string;
  profileName: string;
  isOwnProfile: boolean;
  isFriend: boolean;
  currentUserId: string;
}

const MAX_CHARS = 300;

export const FriendTestimonials = ({
  profileId,
  profileName,
  isOwnProfile,
  isFriend,
  currentUserId,
}: FriendTestimonialsProps) => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profileId) {
      loadTestimonials();
    }
  }, [profileId, isOwnProfile]);

  const loadTestimonials = async () => {
    // Load approved testimonials (visible to everyone) — fixados primeiro
    const { data: approvedData } = await supabase
      .from("friend_testimonials")
      .select(`
        id,
        content,
        status,
        created_at,
        author_id,
        is_pinned,
        profiles:author_id (username, full_name, avatar_url)
      `)
      .eq("recipient_id", profileId)
      .eq("status", "approved")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (approvedData) {
      const list = approvedData as unknown as Testimonial[];
      setTestimonials(list);

      // Marca como "novo" (glow de chegada) qualquer depoimento aprovado
      // que ainda não tinha sido visto nesse navegador — só cosmético,
      // não depende de nenhum campo novo no banco além do que já lemos.
      const { ids: seen, hasVisitedBefore } = loadSeenIds(profileId);
      const arrived = list.filter((t) => !seen.has(t.id)).map((t) => t.id);
      if (arrived.length > 0 && hasVisitedBefore) {
        setNewlyArrivedIds(new Set(arrived));
        setTimeout(() => setNewlyArrivedIds(new Set()), 3000);
      }
      saveSeenIds(profileId, list.map((t) => t.id));
    }

    // If own profile, load pending testimonials
    if (isOwnProfile) {
      const { data: pendingData } = await supabase
        .from("friend_testimonials")
        .select(`
          id,
          content,
          status,
          created_at,
          author_id,
          is_pinned,
          profiles:author_id (username, full_name, avatar_url)
        `)
        .eq("recipient_id", profileId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingData) {
        setPendingTestimonials(pendingData as any);
      }
    }
  };

  const handleTogglePin = async (testimonial: Testimonial) => {
    const { error } = await supabase
      .from("friend_testimonials")
      .update({ is_pinned: !testimonial.is_pinned })
      .eq("id", testimonial.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível fixar o depoimento.", variant: "destructive" });
      return;
    }
    loadTestimonials();
  };

  const handleSubmitTestimonial = async () => {
    // Validate using centralized schema
    const validation = validateField(friendTestimonialSchema, newTestimonial);
    
    if (!validation.valid) {
      toast({
        title: "Erro de validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Use sanitized content from validation
    const { error } = await supabase.from("friend_testimonials").insert({
      author_id: currentUserId,
      recipient_id: profileId,
      content: validation.data,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error submitting testimonial:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o depoimento. Verifique se vocês são amigos.",
        variant: "destructive",
      });
    } else {
      setNewTestimonial("");
      setShowWriteForm(false);
      toast({
        title: "Depoimento enviado! ✨",
        description: `${profileName} precisará aprovar antes de aparecer publicamente.`,
      });
    }
  };

  const handleUpdateStatus = async (testimonialId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("friend_testimonials")
      .update({ status })
      .eq("id", testimonialId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o depoimento",
        variant: "destructive",
      });
    } else {
      toast({
        title: status === "approved" ? "Depoimento aprovado! 🎉" : "Depoimento rejeitado",
        description: status === "approved" 
          ? "O depoimento agora está visível no seu perfil" 
          : "O autor será notificado",
      });
      loadTestimonials();
    }
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    const { error } = await supabase
      .from("friend_testimonials")
      .delete()
      .eq("id", testimonialId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o depoimento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Depoimento excluído",
        description: "O depoimento foi removido do seu perfil",
      });
      loadTestimonials();
    }
  };

  const charsRemaining = MAX_CHARS - newTestimonial.length;

  return (
    <div className="space-y-4">
      {/* Pending testimonials for profile owner */}
      {isOwnProfile && pendingTestimonials.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Depoimentos Pendentes ({pendingTestimonials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="flex flex-col gap-3 p-4 bg-background rounded-lg border">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    src={testimonial.profiles.avatar_url}
                    fallback={testimonial.profiles.full_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{testimonial.profiles.full_name}</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                    Pendente
                  </Badge>
                </div>
                <p className="text-sm">{testimonial.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(testimonial.created_at).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleUpdateStatus(testimonial.id, "approved")}
                  >
                    <Check className="h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleUpdateStatus(testimonial.id, "rejected")}
                  >
                    <X className="h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Write testimonial section for friends */}
      {!isOwnProfile && isFriend && (
        <Card>
          <CardContent className="pt-4">
            {!showWriteForm ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowWriteForm(true)}
              >
                <MessageSquareHeart className="h-4 w-4" />
                Escrever algo sobre {profileName.split(" ")[0]}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Escreva algo positivo sobre {profileName.split(" ")[0]}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowWriteForm(false);
                      setNewTestimonial("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder={`Conte como ${profileName.split(" ")[0]} é especial, como te ajudou ou algo que admira...`}
                  value={newTestimonial}
                  onChange={(e) => setNewTestimonial(e.target.value)}
                  maxLength={MAX_CHARS}
                  rows={4}
                  aria-label={`Escreva algo positivo sobre ${profileName}`}
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${charsRemaining < 50 ? "text-yellow-500" : "text-muted-foreground"}`}>
                    {charsRemaining} caracteres restantes
                  </span>
                  <Button
                    onClick={handleSubmitTestimonial}
                    disabled={!newTestimonial.trim() || isSubmitting}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Enviar para aprovação
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approved testimonials */}
      {(testimonials.length > 0 || isOwnProfile) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
              Depoimentos de Amigos
              {testimonials.length > 0 && (
                <Badge variant="secondary">{testimonials.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testimonials.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                {isOwnProfile 
                  ? "Você ainda não tem depoimentos aprovados. Quando amigos escreverem sobre você, aparecerão aqui após sua aprovação."
                  : `${profileName.split(" ")[0]} ainda não tem depoimentos de amigos.`}
              </p>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {testimonials.map((testimonial) => {
                    const isNew = newlyArrivedIds.has(testimonial.id);
                    return (
                      <motion.div
                        key={testimonial.id}
                        layout
                        initial={isNew ? { opacity: 0, y: -12 } : false}
                        animate={{
                          opacity: 1,
                          y: 0,
                          boxShadow: isNew
                            ? [
                                "0 0 0 rgba(212,147,13,0)",
                                "0 0 22px rgba(212,147,13,0.35)",
                                "0 0 0 rgba(212,147,13,0)",
                              ]
                            : "0 0 0 rgba(212,147,13,0)",
                        }}
                        transition={{ duration: isNew ? 1.4 : 0.3, ease: "easeOut" }}
                        className={`group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          testimonial.is_pinned
                            ? "bg-amber-500/[0.04] border-amber-500/25"
                            : "bg-muted/30 border-border/60"
                        }`}
                      >
                        {isNew && (
                          <div className="-mt-1 -mx-1 mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Sparkles className="h-3.5 w-3.5" />
                            Novo depoimento recebido
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <UserAvatar
                            src={testimonial.profiles.avatar_url}
                            fallback={testimonial.profiles.full_name}
                            size="sm"
                            className="ring-2 ring-background shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{testimonial.profiles.full_name}</p>
                            {testimonial.is_pinned && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                <Pin className="h-3 w-3" /> Fixado
                              </span>
                            )}
                          </div>
                          {isOwnProfile && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                                onClick={() => handleTogglePin(testimonial)}
                                aria-label={testimonial.is_pinned ? "Desafixar depoimento" : "Fixar depoimento"}
                                title={testimonial.is_pinned ? "Desafixar" : "Fixar no topo"}
                              >
                                {testimonial.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTestimonial(testimonial.id)}
                                aria-label="Excluir depoimento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{testimonial.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(testimonial.created_at).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Export as default for lazy loading
export default FriendTestimonials;
