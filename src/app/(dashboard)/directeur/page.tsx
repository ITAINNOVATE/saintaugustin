import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatistiquesDashboard } from "@/components/statistiques/StatistiquesDashboard";

export const metadata = { title: "Tableau de bord Directeur" };

export default async function DirecteurPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Directeur", last_name: "Saint Augustin", role: "directeur" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let studentsData: any[] = [];
  let subscriptionsData: any[] = [];
  let coursesData: any[] = [];
  let examsData: any[] = [];
  let permitsData: any[] = [];
  let exercisesData: any[] = [];

  try { studentsData = (await supabase.from("students").select("id, status, created_at")).data || []; } catch {}
  try { subscriptionsData = (await supabase.from("subscriptions").select("id, status, plan, created_at, amount")).data || []; } catch {}
  try { coursesData = (await supabase.from("courses").select("id, is_published")).data || []; } catch {}
  try { examsData = (await supabase.from("exam_sessions").select("id, is_passed, score, started_at")).data || []; } catch {}
  try { permitsData = (await supabase.from("learner_permits").select("id, created_at")).data || []; } catch {}
  try { exercisesData = (await supabase.from("exercise_sessions").select("id, score, started_at")).data || []; } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Vue d'ensemble">
      <StatistiquesDashboard
        studentsData={studentsData}
        subscriptionsData={subscriptionsData}
        coursesData={coursesData}
        examsData={examsData}
        permitsData={permitsData}
        exercisesData={exercisesData}
      />
    </DashboardLayout>
  );
}
