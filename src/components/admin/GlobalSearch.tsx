import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, User, Image, Flag, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfileDialog } from "./UserProfileDialog";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SearchResult {
  id: string;
  type: "user" | "photo" | "report" | "post";
  title: string;
  subtitle: string;
  data: any;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [profileDialogUserId, setProfileDialogUserId] = useState<string | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    // Atalho: Ctrl+K ou Cmd+K
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Busca direta por ID (UUID exato — usuário, post ou denúncia)
      if (UUID_REGEX.test(searchQuery.trim())) {
        const id = searchQuery.trim();
        const { data: userById } = await supabase
          .from("users")
          .select("id, full_name, email")
          .eq("id", id)
          .maybeSingle();

        if (userById) {
          allResults.push({
            id: userById.id,
            type: "user",
            title: userById.full_name || "Sem nome",
            subtitle: `${userById.email || ""} — encontrado por ID`,
            data: userById,
          });
        }
      }

      // Buscar usuários
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (users) {
        users.forEach((user) => {
          allResults.push({
            id: user.id,
            type: "user",
            title: user.full_name || "Sem nome",
            subtitle: user.email || "",
            data: user,
          });
        });
      }

      // Buscar posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, profiles!inner(full_name)")
        .ilike("content", `%${searchQuery}%`)
        .not("content", "is", null)
        .limit(5);

      if (posts) {
        posts.forEach((post: any) => {
          allResults.push({
            id: post.id,
            type: "post",
            title: post.content?.substring(0, 50) + "..." || "Post",
            subtitle: `Por ${post.profiles?.full_name || "Desconhecido"}`,
            data: post,
          });
        });
      }

      // Buscar denúncias
      const { data: reports } = await supabase
        .from("user_reports")
        .select("id, reason, description, status")
        .or(`reason.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (reports) {
        reports.forEach((report) => {
          allResults.push({
            id: report.id,
            type: "report",
            title: report.reason || "Denúncia",
            subtitle: (report.description?.substring(0, 50) || "") + "...",
            data: report,
          });
        });
      }

      setResults(allResults);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setOpen(false);
    setQuery("");

    // Navegar baseado no tipo
    if (result.type === "user") {
      setProfileDialogUserId(result.id);
      setShowProfileDialog(true);
    } else if (result.type === "photo") {
      navigate(`/admin/photos`);
    } else if (result.type === "report") {
      navigate(`/admin/reports`);
    } else if (result.type === "post") {
      navigate(`/admin/photos`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return User;
      case "photo":
      case "post":
        return Image;
      case "report":
        return Flag;
      default:
        return FileText;
    }
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      user: { label: "Usuário", color: "bg-blue-500" },
      photo: { label: "Foto", color: "bg-purple-500" },
      post: { label: "Post", color: "bg-green-500" },
      report: { label: "Denúncia", color: "bg-red-500" },
    };

    const typeData = types[type] || { label: type, color: "bg-gray-500" };

    return (
      <Badge className={`${typeData.color} text-white text-xs`}>
        {typeData.label}
      </Badge>
    );
  };

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-lg hover:border-primary"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Busca Global</DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários, posts, denúncias..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="px-4 pb-4 max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2 mt-4">
                {results.map((result) => {
                  const Icon = getTypeIcon(result.type);

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className="w-full p-3 text-left rounded-lg hover:bg-accent transition-colors border"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeBadge(result.type)}
                            <p className="font-medium truncate">{result.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileDialog
        userId={profileDialogUserId}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </>
  );
}
