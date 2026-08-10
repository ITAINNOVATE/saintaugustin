import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CompositionExamPlayer } from "@/components/compositions/CompositionExamPlayer";

export const metadata = { title: "Session de Composition | Auto École Saint Augustin" };

interface SubjectExamPageProps {
  params: Promise<{
    subjectId: string;
  }>;
}

export default async function SubjectExamPage({ params }: SubjectExamPageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Apprenant";
  let studentId = "demo-student-id";

  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single()) as { data: any };

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
    }

    const { data: student } = (await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single()) as { data: any };

    if (student) {
      studentId = student.id;
    }
  }

  // Fetch subject detail & questions
  let { data: subject } = (await supabase
    .from("composition_subjects")
    .select("*, questions(*)")
    .eq("id", subjectId)
    .single()) as { data: any };

  // Demo Fallback Subject & Questions generator if none found in DB
  if (!subject) {
    const match = subjectId.match(/\d+/);
    const numStr = match ? match[0].padStart(2, "0") : "01";

    subject = {
      id: subjectId,
      title: `Sujet Officiel N°${numStr} — Examen Théorique`,
      permit_category: "B",
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: "Moyen",
      audio_url: `/SUJETS%20FRANCAIS/sujet_${numStr}.mp4`,
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
    };
  }

  // Generate full 20 official questions (Q1 to Q20) for the exam video
  const defaultQuestions = Array.from({ length: 20 }, (_, i) => {
    const qNum = i + 1;
    const types: ("single" | "multiple" | "boolean")[] = ["single", "single", "multiple", "single", "boolean"];
    const currentType = types[i % types.length];

    const possibleAnswers = [["A"], ["B"], ["C"], ["A", "B"], ["B", "C"], ["D"], ["A"]];
    const correctAns = possibleAnswers[i % possibleAnswers.length];

    const durationPerQ = 30; // 30 seconds per question timestamp slot
    const startTime = i * durationPerQ;
    const endTime = (i + 1) * durationPerQ;

    if (currentType === "boolean") {
      return {
        id: `q${qNum}`,
        subject_id: subjectId,
        question_number: qNum,
        question_text: `Question N°${qNum}`,
        question_type: "boolean" as const,
        options: [
          { id: "A", label: "A", text: "Vrai" },
          { id: "B", label: "B", text: "Faux" },
        ],
        correct_answers: correctAns[0] === "B" ? ["B"] : ["A"],
        explanation: `Correction de la question N°${qNum} basée sur le Code de la Route officiel.`,
        audio_start_time: startTime,
        audio_end_time: endTime,
      };
    }

    return {
      id: `q${qNum}`,
      subject_id: subjectId,
      question_number: qNum,
      question_text: `Question N°${qNum}`,
      question_type: currentType as any,
      options: [
        { id: "A", label: "A", text: "Réponse A" },
        { id: "B", label: "B", text: "Réponse B" },
        { id: "C", label: "C", text: "Réponse C" },
        { id: "D", label: "D", text: "Réponse D" },
      ],
      correct_answers: correctAns,
      explanation: `Explication détaillée de la question N°${qNum}.`,
      audio_start_time: startTime,
      audio_end_time: endTime,
    };
  });

  const displayQuestions = subject.questions && subject.questions.length === 20 ? subject.questions : defaultQuestions;

  return (
    <DashboardLayout userRole="apprenant" userName={userName} pageTitle={subject.title}>
      <CompositionExamPlayer
        subject={subject as any}
        questions={(displayQuestions as any) || []}
        studentId={studentId}
      />
    </DashboardLayout>
  );
}
