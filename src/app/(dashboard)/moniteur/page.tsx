import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoniteurEvaluations } from "@/components/conduite/MoniteurEvaluations";

export const metadata = {
  title: "Évaluations de Conduite | Auto École Saint Augustin",
  description: "Espace Moniteur — Notation pratique des apprenants en conduite.",
};

export default async function MoniteurPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "moniteur";
  let userName = "Moniteur Conduite";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
      userRole = profile.role;
    }
  }

  // Fetch list of students
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch existing driving evaluations
  const { data: evaluations } = await supabase
    .from("driving_evaluations")
    .select("*, students(id, first_name, last_name, matricule)")
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Évaluations de Conduite">
      <MoniteurEvaluations
        students={students || []}
        initialEvaluations={(evaluations as any) || []}
        instructorId={user?.id || "demo-instructor-id"}
      />
    </DashboardLayout>
  );
}
