import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminExamensManagement } from "@/components/exams/AdminExamensManagement";

export const metadata = { title: "Examens Blancs | Auto École Saint Augustin" };

export default async function AdminExamensPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Administrateur", last_name: "", role: "admin" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let sessions: any[] = [];
  try {
    const res: any = await supabase.from("exam_sessions").select("*, students(id, first_name, last_name, matricule, email)").order("started_at", { ascending: false });
    sessions = res?.data || [];
  } catch {}

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
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length,
  };

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Examens Blancs">
      <AdminExamensManagement sessions={sessions} stats={stats} />
    </DashboardLayout>
  );
}
