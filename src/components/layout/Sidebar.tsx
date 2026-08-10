"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
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
  LogOut,
  Car,
  FileText,
  CreditCard,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  { href: "/admin/administration", label: "Administration", icon: Shield, roles: ["admin"] },
  { href: "/admin/apprenants", label: "Apprenants", icon: Users, roles: ["admin"] },
  { href: "/admin/cours", label: "Cours de codes", icon: BookOpen, roles: ["admin"] },
  { href: "/admin/conduite", label: "Évaluation Conduite", icon: Car, roles: ["admin"] },
  { href: "/admin/compositions", label: "Évaluation Code", icon: FileText, roles: ["admin"] },
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
    <aside className="flex flex-col h-screen bg-[#0A1628] text-white w-64 min-w-[260px] max-w-[260px] relative z-30 flex-shrink-0">
      {/* Logo & Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex-shrink-0 w-9 h-9 bg-[#F5A623] rounded-xl flex items-center justify-center shadow-gold">
          <Car className="h-5 w-5 text-[#0A1628]" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-white leading-tight">Auto École</p>
          <p className="text-xs text-[#F5A623] font-semibold">Saint Augustin</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" + userRole && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  "sidebar-item group",
                  isActive
                    ? "bg-[#F5A623] text-[#0A1628] font-semibold shadow-gold"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#0A1628]" : "")} />
                <span className="truncate">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User info & Logout */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-xs text-[#F5A623]">{roleLabels[userRole]}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
