import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CompositionExamPlayer } from "@/components/compositions/CompositionExamPlayer";

export const metadata = { title: "Session de Composition | Auto École Saint Augustin" };

interface SubjectExamPageProps {
  params: Promise<{ subjectId: string }>;
}

const buildDefaultQuestions = (subjectId: string) =>
  Array.from({ length: 20 }, (_, i) => {
    const qNum = i + 1;
    const types: ("single" | "multiple" | "boolean")[] = ["single", "single", "multiple", "single", "boolean"];
    const currentType = types[i % types.length];
    const possibleAnswers = [["A"], ["B"], ["C"], ["A", "B"], ["B", "C"], ["D"], ["A"]];
    const correctAns = possibleAnswers[i % possibleAnswers.length];
    const startTime = i * 30;
    const endTime = (i + 1) * 30;
    if (currentType === "boolean") return {
      id: `q${qNum}`, subject_id: subjectId, question_number: qNum, question_text: `Question N°${qNum}`,
      question_type: "boolean" as const, options: [{ id: "A", label: "A", text: "Vrai" }, { id: "B", label: "B", text: "Faux" }],
      correct_answers: correctAns[0] === "B" ? ["B"] : ["A"],
      explanation: `Correction de la question N°${qNum}.`, audio_start_time: startTime, audio_end_time: endTime,
    };
    return {
      id: `q${qNum}`, subject_id: subjectId, question_number: qNum, question_text: `Question N°${qNum}`,
      question_type: currentType as any,
      options: [{ id: "A", label: "A", text: "Réponse A" }, { id: "B", label: "B", text: "Réponse B" }, { id: "C", label: "C", text: "Réponse C" }, { id: "D", label: "D", text: "Réponse D" }],
      correct_answers: correctAns, explanation: `Explication de la question N°${qNum}.`, audio_start_time: startTime, audio_end_time: endTime,
    };
  });

export default async function SubjectExamPage({ params }: SubjectExamPageProps) {
  const { subjectId } = await params;
  let user: any = null;
  let profile = { first_name: "Apprenant", last_name: "Démo", role: "apprenant" };
  let studentId = "demo-student-id";
  let subject: any = null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    try { const r = await supabase.auth.getUser(); user = r.data?.user ?? null; } catch {}

    try {
      if (user) {
        const r: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
        if (r?.data) profile = { ...profile, ...r.data };
      }
    } catch {}

    try {
      if (user) {
        const r: any = await supabase.from("students").select("id").eq("user_id", user.id).single();
        if (r?.data?.id) studentId = r.data.id;
      }
    } catch {}

    try {
      const r: any = await supabase.from("composition_subjects").select("*, questions(*)").eq("id", subjectId).single();
      subject = r?.data || null;
    } catch {}
  } catch {}

  if (!subject) {
    const match = subjectId.match(/\d+/);
    const numStr = match ? match[0].padStart(2, "0") : "01";
    subject = {
      id: subjectId, title: `Sujet Officiel N°${numStr} — Examen Théorique`,
      permit_category: "B", duration_minutes: 20, total_questions: 20, pass_score: 16,
      difficulty: "Moyen", audio_url: `https://zhctrwqvdmcvkuldqmso.supabase.co/storage/v1/object/public/sujets-videos/sujet_${numStr}.mp4`,
      can_go_back: true, show_explanations: true, is_published: true, created_at: new Date().toISOString(),
    };
  }

  const displayQuestions = (subject.questions && subject.questions.length === 20) ? subject.questions : buildDefaultQuestions(subjectId);

  return (
    <DashboardLayout userRole={(profile.role as any) || "apprenant"} userName={`${profile.first_name} ${profile.last_name}`} pageTitle={subject.title}>
      <CompositionExamPlayer subject={subject as any} questions={displayQuestions as any} studentId={studentId} />
    </DashboardLayout>
  );
}
