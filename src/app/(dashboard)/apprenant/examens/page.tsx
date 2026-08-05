import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExamensBlancs } from "@/components/examens/ExamensBlancs";

export const metadata = { title: "Examens Blancs" };

export default async function ExamensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Apprenant", last_name: "Démo", role: "apprenant" };

  const student = user
    ? (await supabase.from("students").select("id").eq("user_id", user.id).single() as { data: any }).data
    : null;

  // Check active subscription
  const { data: sub } = student ? await supabase.from("subscriptions").select("id, status").eq("student_id", student.id).eq("status", "active").single() : { data: null };

  // Get questions pool
  const { data: questions } = await supabase.from("questions").select("*, answers(*)").eq("exam_pool", true);

  // Get exam history
  const { data: history } = student ? await supabase.from("exam_sessions").select("*").eq("student_id", student.id).order("started_at", { ascending: false }).limit(20) : { data: [] };

  // Get exam settings
  const { data: settings } = await supabase.from("settings").select("*").in("key", ["exam_questions_count", "exam_duration", "exam_pass_score"]);
  const examConfig = {
    questionsCount: parseInt((settings as any[])?.find(s => s.key === "exam_questions_count")?.value || "40"),
    duration: parseInt((settings as any[])?.find(s => s.key === "exam_duration")?.value || "2400"),
    passScore: parseInt((settings as any[])?.find(s => s.key === "exam_pass_score")?.value || "70"),
  };

  return (
    <DashboardLayout userRole="apprenant" userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Examens Blancs">
      <ExamensBlancs
        studentId={student?.id || ""}
        questions={questions || []}
        history={history || []}
        examConfig={examConfig}
        hasActiveSubscription={!!sub}
      />
    </DashboardLayout>
  );
}
