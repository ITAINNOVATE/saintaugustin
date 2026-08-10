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
    const profileRes: any = await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .single();
    const profile = profileRes?.data;

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

  // Generate all 46 official subjects from public/SUJETS FRANCAIS/
  const officialSubjects = Array.from({ length: 46 }, (_, i) => {
    const numStr = (i + 1).toString().padStart(2, "0");
    const categories: ("A" | "B" | "C" | "D")[] = ["B", "B", "A", "C", "D"];
    const difficulties: ("Facile" | "Moyen" | "Difficile")[] = ["Moyen", "Difficile", "Facile"];
    return {
      id: `sujet-${numStr}`,
      title: `Sujet Officiel N°${numStr} — Examen Théorique`,
      permit_category: categories[i % categories.length],
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: difficulties[i % difficulties.length],
      audio_url: `/SUJETS%20FRANCAIS/sujet_${numStr}.mp4`,
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
      questions: [],
    };
  });

  const displaySubjects = subjects && subjects.length > 0 ? subjects : officialSubjects;

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Gestion des Compositions">
      <AdminCompositionsManagement
        initialSubjects={(displaySubjects as any) || []}
        adminId={user?.id || "demo-admin-id"}
      />
    </DashboardLayout>
  );
}
