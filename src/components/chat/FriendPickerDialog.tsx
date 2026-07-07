import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/UserAvatar';
import { Loader2, Search, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SharedMessageType } from '@/components/chat/SharedContentCard';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface FriendPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageType: SharedMessageType;
  sharedContent: Record<string, any>;
  fallbackText?: string;
}

export const FriendPickerDialog = ({
  open,
  onOpenChange,
  messageType,
  sharedContent,
  fallbackText,
}: FriendPickerDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    (async () => {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .limit(200);

      const friendIds = (friendships || []).map(f =>
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', friendIds);

      setFriends(profiles || []);
      setLoading(false);
    })();
  }, [open, user]);

  const handleSend = async (friendId: string) => {
    if (!user || sendingId) return;
    setSendingId(friendId);

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: friendId,
      content: fallbackText || '',
      status: 'sent',
      message_type: messageType,
      shared_content: sharedContent,
    });

    setSendingId(null);

    if (error) {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Enviado! 💌', description: 'Compartilhado no chat.' });
    onOpenChange(false);
  };

  const filtered = friends.filter(f =>
    f.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar para um amigo</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar amigo..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum amigo encontrado.
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleSend(friend.id)}
                  disabled={sendingId === friend.id}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                >
                  <UserAvatar src={friend.avatar_url} fallback={friend.full_name} size="sm" />
                  <span className="flex-1 font-medium truncate">{friend.full_name}</span>
                  {sendingId === friend.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Send className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
