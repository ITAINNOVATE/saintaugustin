import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCompositionsManagement } from "@/components/compositions/AdminCompositionsManagement";

export const metadata = {
  title: "Gestion des Compositions | Auto École Saint Augustin",
  description: "Espace Administrateur — Création et gestion des sujets de composition.",
};

export default async function AdminCompositionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "admin";
  let userName = "Administrateur";

  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .single()) as { data: any };

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
      userRole = profile.role || "admin";
    }
  }

  // Fetch composition subjects with questions
  const { data: subjects } = await supabase
    .from("composition_subjects")
    .select("*, questions(*)")
    .order("created_at", { ascending: false });

  // Default initial demo subjects if database is empty
  const defaultSubjects = [
    {
      id: "subj-1",
      title: "Sujet Officiel N°1 — Signalisation & Priorités",
      permit_category: "B" as const,
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: "Moyen" as const,
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
      questions: [
        {
          id: "q1",
          subject_id: "subj-1",
          question_number: 1,
          question_text: "Que signifie ce panneau de signalisation ?",
          question_type: "single" as const,
          options: [
            { id: "A", label: "A", text: "Signal de danger" },
            { id: "B", label: "B", text: "Panneau d'interdiction" },
          ],
          correct_answers: ["B"],
          audio_start_time: 0,
          audio_end_time: 15,
        },
      ],
    },
  ];

  const displaySubjects = subjects && subjects.length > 0 ? subjects : defaultSubjects;

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Gestion des Compositions">
      <AdminCompositionsManagement
        initialSubjects={(displaySubjects as any) || []}
        adminId={user?.id || "demo-admin-id"}
      />
    </DashboardLayout>
  );
}
