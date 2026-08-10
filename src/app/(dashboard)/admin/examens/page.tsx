import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminExamensManagement } from "@/components/exams/AdminExamensManagement";

export const metadata = { title: "Gestion des Examens Blancs | Auto École Saint Augustin" };

export default async function AdminExamensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profileRes: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
  const profile = profileRes?.data || { first_name: "Administrateur", last_name: "", role: "admin" };

  if (!["admin", "directeur"].includes(profile.role)) redirect("/login");

  const sessionsRes: any = await supabase
    .from("exam_sessions")
    .select("*, students(id, first_name, last_name, matricule, email)")
    .order("started_at", { ascending: false });

  const sessions = sessionsRes?.data || [];

  const stats = {
    total: sessions.length,
    passed: sessions.filter((s: any) => s.is_passed).length,
    failed: sessions.filter((s: any) => !s.is_passed && s.score !== null).length,
    avgScore: sessions.length > 0
      ? Math.round(sessions.filter((s: any) => s.score !== null).reduce((a: number, s: any) => a + (s.score || 0), 0) / (sessions.filter((s: any) => s.score !== null).length || 1))
      : 0,
    thisWeek: sessions.filter((s: any) => {
      const d = new Date(s.started_at);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length,
  };

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={`${profile.first_name} ${profile.last_name}`}
      pageTitle="Examens Blancs"
    >
      <AdminExamensManagement sessions={sessions} stats={stats} />
    </DashboardLayout>
  );
}
