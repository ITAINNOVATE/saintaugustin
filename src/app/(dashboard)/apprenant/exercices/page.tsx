import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExercisesList } from "@/components/exercises/ExercisesList";

export const metadata = { title: "Exercices d'entraînement" };

export default async function ExercicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Apprenant", last_name: "Démo", role: "apprenant" };

  const student = user
    ? (await supabase.from("students").select("id").eq("user_id", user.id).single() as { data: any }).data
    : null;

  // Get active subscription
  const { data: sub } = student ? await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("student_id", student.id)
    .eq("status", "active")
    .single() : { data: null };

  // Fetch chapters with their courses and questions count
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, courses(title), questions(id)")
    .eq("is_published", true);

  // Fetch exercise session history for this student
  const { data: history } = student ? await supabase
    .from("exercise_sessions")
    .select("*")
    .eq("student_id", student.id)
    .order("started_at", { ascending: false }) : { data: [] };

  return (
    <DashboardLayout userRole="apprenant" userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Exercices Pratiques">
      <ExercisesList
        studentId={student?.id || ""}
        chapters={chapters || []}
        history={history || []}
        hasActiveSubscription={!!sub}
      />
    </DashboardLayout>
  );
}
