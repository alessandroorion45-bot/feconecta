import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useAdminActions } from "@/hooks/useAdminActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, History, Search, X, User as UserIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserSearchResult {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_audience: string;
  target_user_email?: string | null;
  total_sent: number;
  sent_at: string | null;
  created_at: string;
}

export default function AdminNotifications() {
  const { isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendMassNotification, sendUserNotification, getNotificationHistory } = useAdminActions();

  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [targetAudience, setTargetAudience] = useState("all");

  // Modo "pessoa específica"
  const [notifyMode, setNotifyMode] = useState<"mass" | "user">("mass");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  useEffect(() => {
    if (notifyMode !== "user" || selectedUser || userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${userQuery}%,email.ilike.%${userQuery}%`)
        .limit(8);
      setUserResults(data || []);
      setSearchingUsers(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [userQuery, notifyMode, selectedUser]);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!isAdmin) {
      navigate("/");
      return;
    }

    loadHistory();
  }, [isAdmin, authLoading, adminLoading, navigate]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getNotificationHistory();
      setHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Erro",
        description: "Preencha título e mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (notifyMode === "user" && !selectedUser) {
      toast({
        title: "Erro",
        description: "Busque e selecione a pessoa que vai receber a notificação.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const success =
        notifyMode === "user" && selectedUser
          ? await sendUserNotification(selectedUser.id, title, message, notificationType)
          : await sendMassNotification(title, message, notificationType, targetAudience);

      if (success) {
        toast({
          title: "Sucesso!",
          description:
            notifyMode === "user"
              ? `Notificação enviada para ${selectedUser?.full_name || selectedUser?.email}!`
              : "Notificação enviada com sucesso!",
        });

        // Limpar form
        setTitle("");
        setMessage("");
        setNotificationType("info");
        setTargetAudience("all");
        setSelectedUser(null);
        setUserQuery("");

        // Recarregar histórico
        loadHistory();
      } else {
        throw new Error("Falha ao enviar notificação");
      }
    } catch (error: any) {
      console.error("Erro ao enviar notificação:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a notificação.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Central de Notificações"
          description="Enviar notificações em massa ou pra uma pessoa específica"
        />

        <Tabs defaultValue="send">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Enviar Notificação */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Nova Notificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Nova atualização disponível!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    placeholder="Escreva a mensagem da notificação..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Informação</SelectItem>
                      <SelectItem value="success">✅ Sucesso</SelectItem>
                      <SelectItem value="warning">⚠️ Aviso</SelectItem>
                      <SelectItem value="announcement">📢 Anúncio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Público-Alvo</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={notifyMode === "mass" ? "default" : "outline"}
                      onClick={() => {
                        setNotifyMode("mass");
                        setSelectedUser(null);
                        setUserQuery("");
                      }}
                    >
                      🌍 Grupo de usuários
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={notifyMode === "user" ? "default" : "outline"}
                      onClick={() => setNotifyMode("user")}
                    >
                      <UserIcon className="h-4 w-4 mr-1" />
                      Pessoa específica
                    </Button>
                  </div>

                  {notifyMode === "mass" ? (
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🌍 Todos os Usuários</SelectItem>
                        <SelectItem value="active">⚡ Usuários Ativos</SelectItem>
                        <SelectItem value="new">🆕 Novos Usuários</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : selectedUser ? (
                    <div className="flex items-center justify-between gap-2 p-2 border rounded-lg bg-accent/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {selectedUser.full_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setSelectedUser(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        className="pl-9"
                      />
                      {userQuery.trim().length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full border rounded-lg bg-popover shadow-md max-h-56 overflow-y-auto">
                          {searchingUsers ? (
                            <p className="p-3 text-sm text-muted-foreground">Buscando...</p>
                          ) : userResults.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                          ) : (
                            userResults.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                className="w-full text-left p-2 hover:bg-accent transition-colors flex items-center gap-2"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setUserQuery("");
                                }}
                              >
                                <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{u.full_name || "Sem nome"}</p>
                                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !message.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {sending ? "Enviando..." : "Enviar Notificação"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando histórico...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Público</TableHead>
                        <TableHead>Enviado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {item.message}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.notification_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.target_audience === "user"
                              ? `👤 ${item.target_user_email || "usuário"}`
                              : item.target_audience}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.sent_at
                              ? new Date(item.sent_at).toLocaleString("pt-BR")
                              : "Não enviado"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {!loading && history.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma notificação enviada ainda.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
