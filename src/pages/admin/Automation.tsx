import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bot, Shield, Ban, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BannedWord {
  id: string;
  word: string;
  severity: string;
  auto_action: string;
  is_active: boolean;
}

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  action_type: string;
  is_active: boolean;
  priority: number;
}

interface AutoLog {
  id: string;
  rule_name: string;
  target_type: string;
  action_taken: string;
  trigger_reason: string;
  executed_at: string;
}

export default function AdminAutomation() {
  const { isAdmin, hasPermission, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [logs, setLogs] = useState<AutoLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [newWord, setNewWord] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadData = async () => {
    try {
      // Palavras proibidas
      const { data: wordsData } = await supabase
        .from("banned_words")
        .select("*")
        .order("severity", { ascending: false });

      if (wordsData) setBannedWords(wordsData);

      // Regras
      const { data: rulesData } = await supabase
        .from("moderation_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (rulesData) setRules(rulesData);

      // Logs (últimos 50)
      const { data: logsData } = await supabase
        .from("auto_moderation_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(50);

      if (logsData) setLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite uma palavra.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { error } = await supabase.from("banned_words").insert({
        word: newWord.toLowerCase(),
        severity: newSeverity,
        auto_action: "flag",
        created_by: currentUser.user?.id,
      });

      if (error) throw error;

      toast({
        title: "Palavra Adicionada",
        description: `"${newWord}" foi adicionada à lista de palavras proibidas.`,
      });

      setNewWord("");
      loadData();
    } catch (error: any) {
      console.error("Erro ao adicionar palavra:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar palavra.",
        variant: "destructive",
      });
    }
  };

  const handleToggleWord = async (wordId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("banned_words")
        .update({ is_active: !isActive })
        .eq("id", wordId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error("Erro ao atualizar palavra:", error);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("moderation_rules")
        .update({ is_active: !isActive })
        .eq("id", ruleId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error("Erro ao atualizar regra:", error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };

    return (
      <Badge className={`${colors[severity] || "bg-gray-500"} text-white text-xs`}>
        {severity}
      </Badge>
    );
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <Bot className="h-8 w-8 text-purple-600" />
            Automações de Moderação
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurar regras automáticas e filtros de conteúdo
          </p>
        </div>

        <Tabs defaultValue="words" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="words">
              <Ban className="h-4 w-4 mr-2" />
              Palavras Proibidas
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Shield className="h-4 w-4 mr-2" />
              Regras Automáticas
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* TAB: Palavras Proibidas */}
          <TabsContent value="words" className="space-y-6">
            {/* Add Word */}
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Palavra Proibida</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Input
                  placeholder="Digite a palavra..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="flex-1"
                />

                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>

                <Button onClick={handleAddWord}>Adicionar</Button>
              </CardContent>
            </Card>

            {/* Words List */}
            <Card>
              <CardHeader>
                <CardTitle>Palavras Proibidas ({bannedWords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Palavra</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedWords.map((word) => (
                      <TableRow key={word.id}>
                        <TableCell className="font-mono font-bold">{word.word}</TableCell>
                        <TableCell>{getSeverityBadge(word.severity)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {word.auto_action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {word.is_active ? (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={word.is_active}
                            onCheckedChange={() => handleToggleWord(word.id, word.is_active)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Regras */}
          <TabsContent value="rules" className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {rule.is_active ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        )}
                        {rule.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.description}
                      </p>
                    </div>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Trigger:</span>{" "}
                      <Badge variant="outline" className="ml-2">
                        {rule.trigger_type}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ação:</span>{" "}
                      <Badge variant="outline" className="ml-2">
                        {rule.action_type}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prioridade:</span>{" "}
                      <span className="font-bold ml-2">{rule.priority}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TAB: Logs */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ações Automáticas Executadas ({logs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <Bot className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">{log.rule_name}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Alvo: {log.target_type}</span>
                          <span>Ação: {log.action_taken}</span>
                          <span>Motivo: {log.trigger_reason}</span>
                          <span>
                            {new Date(log.executed_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma ação automática executada ainda.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
