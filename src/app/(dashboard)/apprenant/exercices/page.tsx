import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExercisesList } from "@/components/exercises/ExercisesList";

export const metadata = { title: "Exercices d'entraînement" };

export default async function ExercicesPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Apprenant", last_name: "Démo", role: "apprenant" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let studentId = "";
  try {
    if (user) {
      const res: any = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (res?.data) studentId = res.data.id;
    }
  } catch {}

  let sub: any = null;
  try {
    if (studentId) {
      const res: any = await supabase.from("subscriptions").select("id, status").eq("student_id", studentId).eq("status", "active").single();
      sub = res?.data || null;
    }
  } catch {}

  let chapters: any[] = [];
  try {
    const res = await supabase.from("chapters").select("*, courses(title), questions(id)").eq("is_published", true);
    chapters = res.data || [];
  } catch {}

  let history: any[] = [];
  try {
    if (studentId) {
      const res = await supabase.from("exercise_sessions").select("*").eq("student_id", studentId).order("started_at", { ascending: false });
      history = res.data || [];
    }
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Exercices Pratiques">
      <ExercisesList studentId={studentId} chapters={chapters} history={history} hasActiveSubscription={!!sub} />
    </DashboardLayout>
  );
}
