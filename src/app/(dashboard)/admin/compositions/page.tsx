import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCompositionsManagement } from "@/components/compositions/AdminCompositionsManagement";

export const metadata = { title: "Gestion des Compositions | Auto École Saint Augustin" };

export default async function AdminCompositionsPage() {
  let user: any = null;
  let profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  let subjects: any[] = [];

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
      const r = await supabase.from("exam_subjects").select("*").order("created_at", { ascending: false });
      subjects = r.data || [];
    } catch {}
  } catch {}

  return (
    <DashboardLayout userRole={(profile.role as any) || "admin"} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Compositions">
      <AdminCompositionsManagement initialSubjects={subjects} adminId={user?.id || "admin"} />
    </DashboardLayout>
  );
}
