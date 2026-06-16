import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import UserAvatar from "@/components/UserAvatar";
import { Search, Users, Loader2, Check } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface CustomViewersSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  currentUserId: string;
  onSave?: () => void;
}

export const CustomViewersSelector = ({
  open,
  onOpenChange,
  videoId,
  currentUserId,
  onSave
}: CustomViewersSelectorProps) => {
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadFriendsAndViewers();
    }
  }, [open, videoId]);

  const loadFriendsAndViewers = async () => {
    setLoading(true);
    try {
      // Load friends
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

      if (friendships) {
        const friendIds = friendships.map(f => 
          f.user_id_1 === currentUserId ? f.user_id_2 : f.user_id_1
        );

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", friendIds);

        setFriends(profiles || []);
      }

      // Load current allowed viewers
      const { data: viewers } = await supabase
        .from("video_allowed_viewers")
        .select("user_id")
        .eq("video_id", videoId);

      if (viewers) {
        setSelectedIds(new Set(viewers.map(v => v.user_id)));
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (friendId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === friends.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(friends.map(f => f.id)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all current viewers
      await supabase
        .from("video_allowed_viewers")
        .delete()
        .eq("video_id", videoId);

      // Insert new viewers
      if (selectedIds.size > 0) {
        const viewersToInsert = Array.from(selectedIds).map(userId => ({
          video_id: videoId,
          user_id: userId
        }));

        const { error } = await supabase
          .from("video_allowed_viewers")
          .insert(viewersToInsert);

        if (error) throw error;
      }

      toast({
        title: "Salvo!",
        description: `${selectedIds.size} pessoa(s) podem ver este vídeo.`
      });

      onOpenChange(false);
      onSave?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as permissões.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Selecionar Visualizadores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar amigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selecionado(s)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedIds.size === friends.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
          </div>

          {/* Friends List */}
          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {friends.length === 0 
                    ? "Você ainda não tem amigos para selecionar."
                    : "Nenhum amigo encontrado."}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleToggle(friend.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(friend.id)}
                      onCheckedChange={() => handleToggle(friend.id)}
                    />
                    <UserAvatar
                      src={friend.avatar_url}
                      fallback={friend.full_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {friend.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{friend.username}
                      </p>
                    </div>
                    {selectedIds.has(friend.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
