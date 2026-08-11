import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCompositionsManagement } from "@/components/compositions/AdminCompositionsManagement";

export const metadata = { title: "Gestion des Compositions | Auto École Saint Augustin" };

const OFFICIAL_SUBJECTS = Array.from({ length: 46 }, (_, i) => {
  const numStr = (i + 1).toString().padStart(2, "0");
  const categories: ("A" | "B" | "C" | "D")[] = ["B", "B", "A", "C", "D"];
  const difficulties: ("Facile" | "Moyen" | "Difficile")[] = ["Moyen", "Difficile", "Facile"];
  return {
    id: `sujet-${numStr}`,
    title: `Sujet Officiel N°${numStr} — Examen Théorique`,
    permit_category: categories[i % categories.length],
    duration_minutes: 20, total_questions: 20, pass_score: 16,
    difficulty: difficulties[i % difficulties.length],
    audio_url: `https://zhctrwqvdmcvkuldqmso.supabase.co/storage/v1/object/public/sujets-videos/sujet_${numStr}.mp4`,
    can_go_back: true, show_explanations: true, is_published: true,
    created_at: new Date().toISOString(),
  };
});

export default async function AdminCompositionsPage() {
  let user: any = null;
  let profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  let subjects: any[] = [];

  try {
    const { createAdminClient, createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    try { const r = await supabase.auth.getUser(); user = r.data?.user ?? null; } catch {}

    try {
      if (user) {
        const r: any = await adminClient.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
        if (r?.data) profile = { ...profile, ...r.data };
      }
      if (user?.email === "admin@saintaugustin.com") {
        profile.role = "admin";
        if (profile.first_name === "Utilisateur" || !profile.first_name) {
          profile.first_name = "Administrateur";
          profile.last_name = "Saint Augustin";
        }
      }
    } catch {}

    try {
      const r = await adminClient.from("composition_subjects").select("*").order("created_at", { ascending: false });
      subjects = r.data || [];
    } catch {}
  } catch {}

  const displaySubjects = subjects.length > 0 ? subjects : OFFICIAL_SUBJECTS;

  return (
    <DashboardLayout userRole={(profile.role as any) || "admin"} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Compositions">
      <AdminCompositionsManagement initialSubjects={displaySubjects} adminId={user?.id || "admin"} />
    </DashboardLayout>
  );
}
