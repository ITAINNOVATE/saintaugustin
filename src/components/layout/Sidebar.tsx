"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Car,
  UserCircle,
  FileText,
  CreditCard,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
}

const navItems: NavItem[] = [
  // Admin
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/secretaire", label: "Inscriptions", icon: Users, roles: ["admin"] },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard, roles: ["admin"] },
  { href: "/admin/cours", label: "Gestion des Cours", icon: BookOpen, roles: ["admin"] },
  { href: "/admin/compositions", label: "Gestion Compositions", icon: FileText, roles: ["admin"] },
  { href: "/moniteur", label: "Évaluations Conduite", icon: Car, roles: ["admin"] },
  { href: "/admin/permis", label: "Permis délivrés", icon: IdCard, roles: ["admin"] },
  { href: "/admin/statistiques", label: "Statistiques", icon: BarChart3, roles: ["admin"] },

  // Directeur
  { href: "/directeur", label: "Tableau de bord", icon: LayoutDashboard, roles: ["directeur"] },
  { href: "/secretaire", label: "Gestion Apprenants", icon: Users, roles: ["directeur"] },
  { href: "/admin/compositions", label: "Gestion Compositions", icon: FileText, roles: ["directeur"] },
  { href: "/moniteur", label: "Suivi Conduite", icon: Car, roles: ["directeur"] },
  { href: "/admin/permis", label: "Permis Délivrés", icon: IdCard, roles: ["directeur"] },

  // Secrétaire
  { href: "/secretaire", label: "Inscriptions & Apprenants", icon: Users, roles: ["secretaire"] },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard, roles: ["secretaire"] },
  { href: "/admin/permis", label: "Permis", icon: IdCard, roles: ["secretaire"] },

  // Moniteur
  { href: "/moniteur", label: "Évaluations Conduite", icon: Car, roles: ["moniteur"] },

  // Apprenant
  { href: "/apprenant/cours", label: "Mes Cours Code", icon: BookOpen, roles: ["apprenant"] },
  { href: "/apprenant/conduite", label: "Cours Conduite", icon: Car, roles: ["apprenant"] },
  { href: "/apprenant/compositions", label: "Compositions E-Exam", icon: FileText, roles: ["apprenant"] },
  { href: "/apprenant/exercices", label: "Exercices Pratiques", icon: ClipboardCheck, roles: ["apprenant"] },
  { href: "/apprenant/examens", label: "Examens Blancs", icon: GraduationCap, roles: ["apprenant"] },
];

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  notificationCount?: number;
  onNavigate?: () => void;
}

export function Sidebar({ userRole, userName, userEmail, notificationCount = 0, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const roleLabels: Record<UserRole, string> = {
    admin: "Administrateur",
    directeur: "Directeur",
    secretaire: "Secrétaire",
    moniteur: "Moniteur Conduite",
    apprenant: "Apprenant",
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#0A1628] text-white transition-all duration-300 relative z-30 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo & Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-9 h-9 bg-[#F5A623] rounded-xl flex items-center justify-center shadow-gold">
          <Car className="h-5 w-5 text-[#0A1628]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight">Auto École</p>
            <p className="text-xs text-[#F5A623] font-semibold">Saint Augustin</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-16 z-40 bg-[#F5A623] text-[#0A1628] rounded-full p-1 shadow-gold hover:bg-[#F9CC74] transition-colors"
        aria-label={collapsed ? "Développer" : "Réduire"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" + userRole && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  "sidebar-item group relative",
                  isActive
                    ? "bg-[#F5A623] text-[#0A1628] font-semibold shadow-gold"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#0A1628]" : "")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {item.badge && item.badge > 0 && !collapsed && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {item.badge}
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1E4070] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User info & Logout */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-[#F5A623]">{roleLabels[userRole]}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          title={collapsed ? "Se déconnecter" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
