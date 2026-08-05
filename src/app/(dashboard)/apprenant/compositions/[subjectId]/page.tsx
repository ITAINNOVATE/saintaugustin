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
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
    }

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

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
    subject = {
      id: subjectId,
      title: "Sujet Officiel N°1 — Signalisation & Priorités",
      permit_category: "B",
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: "Moyen",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
    };
  }

  // Demo Questions with single, multiple, boolean & images
  const defaultQuestions = [
    {
      id: "q1",
      subject_id: subjectId,
      question_number: 1,
      question_text: "Que signifie ce panneau de signalisation à fond blanc bordé de rouge ?",
      question_type: "single" as const,
      options: [
        { id: "A", label: "A", text: "Panneau de danger imposant l'arrêt" },
        { id: "B", label: "B", text: "Panneau d'interdiction de s'engager" },
        { id: "C", label: "C", text: "Panneau d'obligation d'allumer ses feux" },
        { id: "D", label: "D", text: "Simple signal d'information routière" },
      ],
      correct_answers: ["B"],
      explanation: "Les panneaux circulaires bordés de rouge indiquent toujours une interdiction stricte.",
      image_url: "/images/panneaux/image1.png",
      audio_start_time: 0,
      audio_end_time: 15,
    },
    {
      id: "q2",
      subject_id: subjectId,
      question_number: 2,
      question_text: "Quelles précautions devez-vous prendre avant d'effectuer un dépassement ? (Deux choix)",
      question_type: "multiple" as const,
      options: [
        { id: "A", label: "A", text: "Contrôler le rétroviseur central et latéral gauche" },
        { id: "B", label: "B", text: "Vérifier l'angle mort en jétant un coup d'œil par-dessus l'épaule" },
        { id: "C", label: "C", text: "Accélérer immédiatement sans avertir les autres" },
        { id: "D", label: "D", text: "Klaxonner de manière prolongée en agglomération" },
      ],
      correct_answers: ["A", "B"],
      explanation: "Avant tout dépassement, il faut contrôler ses rétroviseurs et vérifier l'angle mort gauche.",
      audio_start_time: 15,
      audio_end_time: 30,
    },
    {
      id: "q3",
      subject_id: subjectId,
      question_number: 3,
      question_text: "À cette intersection sans signalisation, la règle de la priorité à droite s'applique-t-elle ?",
      question_type: "boolean" as const,
      options: [
        { id: "A", label: "A", text: "Vrai" },
        { id: "B", label: "B", text: "Faux" },
      ],
      correct_answers: ["A"],
      explanation: "En l'absence de tout panneau ou feu tricolore, la priorité à droite est la règle générale.",
      audio_start_time: 30,
      audio_end_time: 45,
    },
    {
      id: "q4",
      subject_id: subjectId,
      question_number: 4,
      question_text: "En cas de forte pluie, quelle est la vitesse maximale autorisée sur autoroute ?",
      question_type: "single" as const,
      options: [
        { id: "A", label: "A", text: "130 km/h" },
        { id: "B", label: "B", text: "110 km/h" },
        { id: "C", label: "C", text: "90 km/h" },
        { id: "D", label: "D", text: "50 km/h" },
      ],
      correct_answers: ["B"],
      explanation: "Par temps de pluie, la vitesse maximale sur autoroute s'abaisse de 130 à 110 km/h.",
      audio_start_time: 45,
      audio_end_time: 60,
    },
  ];

  const displayQuestions = subject.questions && subject.questions.length > 0 ? subject.questions : defaultQuestions;

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
