import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import {
  LayoutDashboard,
  Users,
  Flag,
  BarChart3,
  Settings,
  ArrowLeft,
  Crown,
  Palette,
  Image,
  FileText,
  Bell,
  Bot,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Usuários" },
  { path: "/admin/themes", icon: Palette, label: "Temas VIP" },
  { path: "/admin/photos", icon: Image, label: "Fotos" },
  { path: "/admin/reports", icon: Flag, label: "Denúncias" },
  { path: "/admin/notifications", icon: Bell, label: "Notificações" },
  { path: "/admin/logs", icon: FileText, label: "Logs" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/automation", icon: Bot, label: "Automações" },
  { path: "/admin/settings", icon: Settings, label: "Configurações" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r shadow-lg z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Crown className="h-8 w-8 text-purple-600" />
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
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t">
              <Link to="/">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao App
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
