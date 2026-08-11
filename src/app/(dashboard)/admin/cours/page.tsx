
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCoursesManagement } from "@/components/courses/AdminCoursesManagement";

export const metadata = { title: "Gestion des Cours" };

export default async function AdminCoursesPage() {
  let user: any = null;
  let profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  let courses: any[] = [];

  try {
    const { createClient, createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    try { const r = await supabase.auth.getUser(); user = r.data?.user ?? null; } catch {}

    try {
      if (user) {
        const r: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (r?.data) profile = { ...profile, ...r.data };
      }
    } catch {}

    try {
      const adminSupabase = await createAdminClient();
      const r = await adminSupabase
        .from("courses")
        .select("*, chapters(id, title, order_index, is_published, lessons(id, title, lesson_type, is_published, order_index))")
        .order("order_index");
      courses = r.data || [];
    } catch {}
  } catch {}

  return (
    <DashboardLayout
      userRole={(profile.role as any) || "admin"}
      userName={`${profile.first_name} ${profile.last_name}`}
      pageTitle="Gestion des Cours"
    >
      <AdminCoursesManagement courses={courses} adminId={user?.id || "admin"} />
    </DashboardLayout>
  );
}
