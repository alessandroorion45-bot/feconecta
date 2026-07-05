import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { Link2, Copy, Share2, QrCode, Search, UserPlus, Check, Download, Loader2, Hash } from "lucide-react";

interface CommunityInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communityName: string;
  userId: string;
  userName?: string;
}

interface FoundUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

/** Convidar membros: link, código, busca de usuários e QR Code */
const CommunityInviteModal = ({
  open, onOpenChange, communityId, communityName, userId, userName,
}: CommunityInviteModalProps) => {
  const { toast } = useToast();
  const inviteLink = `${window.location.origin}/church-community?join=${communityId}`;
  const communityCode = communityId.slice(0, 8).toUpperCase();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Gera o QR Code quando o modal abre
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const QRCode = await import("qrcode");
        const url = await QRCode.toDataURL(inviteLink, { width: 480, margin: 2 });
        setQrDataUrl(url);
      } catch {
        setQrDataUrl(null);
      }
    })();
  }, [open, inviteLink]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado! 📋` });
  };

  const shareNative = async () => {
    const text = `⛪ Venha fazer parte da comunidade "${communityName}" na plataforma Aliança!\n\n${inviteLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: communityName, text, url: inviteLink });
      } else {
        await copy(text, "Convite");
      }
    } catch { /* usuário cancelou */ }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `convite-${communityCode}.png`;
    a.click();
  };

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq("id", userId)
      .limit(8);

    // Remove quem já é membro
    const ids = (data || []).map(u => u.id);
    let memberSet = new Set<string>();
    if (ids.length) {
      const { data: members } = await supabase
        .from("church_community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .in("user_id", ids);
      memberSet = new Set((members || []).map(m => m.user_id));
    }
    setResults((data || []).filter(u => !memberSet.has(u.id)));
    setSearching(false);
  };

  const inviteUser = async (target: FoundUser) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: target.id,
      actor_id: userId,
      type: "community_invite",
      content: `${userName || "Um irmão"} convidou você para participar da comunidade "${communityName}" ⛪`,
      reference_id: communityId,
    });
    if (error) {
      toast({ title: "Erro ao convidar", description: error.message, variant: "destructive" });
    } else {
      setInvited(prev => new Set(prev).add(target.id));
      toast({ title: "Convite enviado! ✉️", description: `${target.full_name} foi convidado(a).` });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar Membros
          </DialogTitle>
          <DialogDescription>
            Convide irmãos para a comunidade "{communityName}".
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Search className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1.5">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
          </TabsList>

          {/* Link + código */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Link da comunidade</p>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="text-xs font-mono" />
                <Button size="icon" variant="outline" onClick={() => copy(inviteLink, "Link")} title="Copiar link">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={shareNative} className="w-full gap-2 mt-1">
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>

            <div className="space-y-1.5 border-t pt-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Código da comunidade
              </p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-center font-mono text-lg tracking-widest">
                  {communityCode}
                </div>
                <Button size="icon" variant="outline" onClick={() => copy(communityCode, "Código")} title="Copiar código">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Quem tiver o código encontra a comunidade digitando-o na busca da página Comunidades.
              </p>
            </div>
          </TabsContent>

          {/* Buscar usuários */}
          <TabsContent value="users" className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou usuário..."
                value={search}
                onChange={(e) => searchUsers(e.target.value)}
                className="pl-10"
              />
            </div>

            {searching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                    <UserAvatar src={u.avatar_url || undefined} fallback={u.full_name || "U"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.full_name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                    </div>
                    {invited.has(u.id) ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <Check className="h-4 w-4" /> Convidado
                      </span>
                    ) : (
                      <Button size="sm" className="gap-1" onClick={() => inviteUser(u)}>
                        <UserPlus className="h-3.5 w-3.5" />
                        Convidar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : search.trim().length >= 2 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário encontrado (ou já são membros).
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Digite pelo menos 2 letras para buscar.
              </p>
            )}
          </TabsContent>

          {/* QR Code */}
          <TabsContent value="qr" className="space-y-3 mt-4 text-center">
            {qrDataUrl ? (
              <>
                <div className="inline-block rounded-xl border bg-white p-3 shadow-sm">
                  <img src={qrDataUrl} alt="QR Code do convite" className="w-52 h-52" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Aponte a câmera do celular para entrar direto na comunidade.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={downloadQr}>
                    <Download className="h-4 w-4" />
                    Baixar QR Code
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => copy(inviteLink, "Link")}>
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityInviteModal;
