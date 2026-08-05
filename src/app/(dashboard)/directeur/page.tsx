import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatistiquesDashboard } from "@/components/statistiques/StatistiquesDashboard";

export const metadata = { title: "Tableau de bord Directeur" };

export default async function DirecteurPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Directeur", last_name: "Saint Augustin", role: "directeur" };

  const [students, subs, courses, exams, permits, exercises] = await Promise.all([
    supabase.from("students").select("id, status, created_at"),
    supabase.from("subscriptions").select("id, status, plan, created_at, amount"),
    supabase.from("courses").select("id, is_published"),
    supabase.from("exam_sessions").select("id, is_passed, score, started_at"),
    supabase.from("learner_permits").select("id, created_at"),
    supabase.from("exercise_sessions").select("id, score, started_at"),
  ]);

  return (
    <DashboardLayout userRole="directeur" userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Vue d'ensemble">
      <StatistiquesDashboard studentsData={students.data || []} subscriptionsData={subs.data || []} coursesData={courses.data || []} examsData={exams.data || []} permitsData={permits.data || []} exercisesData={exercises.data || []} />
    </DashboardLayout>
  );
}
