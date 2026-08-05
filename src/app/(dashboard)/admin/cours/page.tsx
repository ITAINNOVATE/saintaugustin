import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCoursesManagement } from "@/components/courses/AdminCoursesManagement";

export const metadata = { title: "Gestion des Cours" };

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };

  const { data: courses } = await supabase
    .from("courses")
    .select("*, chapters(id, title, order_index, is_published, lessons(id, title, lesson_type, is_published, order_index))")
    .order("order_index");

  return (
    <DashboardLayout userRole="admin" userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Cours">
      <AdminCoursesManagement courses={courses || []} adminId={user?.id || "demo-admin-id"} />
    </DashboardLayout>
  );
}
