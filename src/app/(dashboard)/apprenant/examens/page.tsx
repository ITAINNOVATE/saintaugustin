import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExamensBlancs } from "@/components/examens/ExamensBlancs";

export const metadata = { title: "Examens Blancs" };

export default async function ExamensPage() {
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

  let questions: any[] = [];
  try {
    const res = await supabase.from("questions").select("*, answers(*)").eq("exam_pool", true);
    questions = res.data || [];
  } catch {}

  let history: any[] = [];
  try {
    if (studentId) {
      const res = await supabase.from("exam_sessions").select("*").eq("student_id", studentId).order("started_at", { ascending: false }).limit(20);
      history = res.data || [];
    }
  } catch {}

  let examConfig = { questionsCount: 40, duration: 2400, passScore: 70 };
  try {
    const res = await supabase.from("settings").select("*").in("key", ["exam_questions_count", "exam_duration", "exam_pass_score"]);
    const settings = res.data as any[] || [];
    examConfig = {
      questionsCount: parseInt(settings.find(s => s.key === "exam_questions_count")?.value || "40"),
      duration: parseInt(settings.find(s => s.key === "exam_duration")?.value || "2400"),
      passScore: parseInt(settings.find(s => s.key === "exam_pass_score")?.value || "70"),
    };
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Examens Blancs">
      <ExamensBlancs
        studentId={studentId}
        questions={questions}
        history={history}
        examConfig={examConfig}
        hasActiveSubscription={!!sub}
      />
    </DashboardLayout>
  );
}
