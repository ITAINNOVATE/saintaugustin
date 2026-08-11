"use client";

import { useState, useEffect } from "react";
import { Bell, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./Sidebar";
import type { UserRole } from "@/types/database";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  avatarUrl?: string;
  pageTitle?: string;
  notificationCount?: number;
  moduleAccesses?: string[];
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
  avatarUrl,
  pageTitle,
  notificationCount = 0,
  moduleAccesses,
}: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userAccesses, setUserAccesses] = useState<string[] | undefined>(moduleAccesses);

  useEffect(() => {
    setMounted(true);
    const fetchUserAccesses = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await (supabase.from("profiles") as any).select("module_accesses").eq("id", user.id).single();
          if (profile?.module_accesses) {
            setUserAccesses(profile.module_accesses);
          }
        }
      } catch {}
    };
    fetchUserAccesses();
  }, [moduleAccesses]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          notificationCount={notificationCount}
          moduleAccesses={userAccesses}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
              notificationCount={notificationCount}
              moduleAccesses={userAccesses}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20 px-4 lg:px-6 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {pageTitle && (
              <h1 className="text-lg font-semibold text-foreground hidden sm:block">{pageTitle}</h1>
            )}
            {userRole === "apprenant" && userName && userName !== "Apprenant" && (
              <div className="hidden md:flex items-center gap-1.5 ml-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full">
                <span className="text-sm">👋</span>
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {getGreeting()}, <span className="font-bold">{userName.split(" ")[0]}</span> !
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Changer le thème"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
