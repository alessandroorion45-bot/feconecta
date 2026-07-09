import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import { AdminNotificationBell } from "./AdminNotificationBell";
import {
  LayoutDashboard,
  Users,
  Flag,
  BarChart3,
  ArrowLeft,
  Crown,
  Palette,
  Image,
  Video,
  FileText,
  Bell,
  Bot,
  HeartPulse,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Usuários" },
  { path: "/admin/themes", icon: Palette, label: "Temas VIP" },
  { path: "/admin/photos", icon: Image, label: "Fotos" },
  { path: "/admin/videos", icon: Video, label: "Vídeos" },
  { path: "/admin/reports", icon: Flag, label: "Denúncias" },
  { path: "/admin/notifications", icon: Bell, label: "Notificações" },
  { path: "/admin/logs", icon: FileText, label: "Logs" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/automation", icon: Bot, label: "Automações" },
  { path: "/admin/system", icon: HeartPulse, label: "Saúde do Sistema" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--theme-background)' }}>
      {/* Sidebar */}
      <aside className="theme-sidebar fixed left-0 top-0 h-full w-64 border-r shadow-lg z-40 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Crown className="h-8 w-8 text-purple-600 shrink-0" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>

          {/* Global Search */}
          <div className="mb-4">
            <GlobalSearch />
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-gradient-to-r from-purple-600 to-pink-600"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4 shrink-0" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t">
              <Link to="/">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Voltar ao App
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </aside>

      {/* Notification bell (fixo, visível em todas as páginas admin) */}
      <div className="fixed top-6 right-8 z-50">
        <AdminNotificationBell />
      </div>

      {/* Main Content — largura travada em 100% - sidebar pra nunca estourar
          a viewport e forçar scroll horizontal da página inteira (o que
          "escondia" conteúdo atrás da sidebar fixa). Qualquer coisa larga
          demais (tabela, card) rola só dentro de si mesma agora. */}
      <main className="ml-64 w-[calc(100%-16rem)] min-w-0 max-w-[calc(100vw-16rem)] overflow-x-hidden p-8">
        {children}
      </main>
    </div>
  );
}
