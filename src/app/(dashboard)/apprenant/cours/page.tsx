import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CourseCatalog } from "@/components/courses/CourseCatalog";

export const metadata = { title: "Mes Cours" };

export default async function CoursPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  let userRole = "apprenant";
  let userName = "Apprenant";
  
  if (user) {
    try {
      const r: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (r?.data) {
        userRole = r.data.role || "apprenant";
        userName = `${r.data.first_name || ""} ${r.data.last_name || ""}`;
      }
    } catch {}
    
    if (user.email === "admin@saintaugustin.com") {
      userRole = "admin";
      if (userName === "Apprenant") userName = "Administrateur Saint Augustin";
    }
  }

  let studentId = "";
  try {
    if (user) {
      const res: any = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (res?.data) studentId = res.data.id;
    }
  } catch {}

  let courses: any[] = [];
  try {
    const res = await supabase.from("courses").select("*, chapters(id, title, order_index, is_published, lessons(id, title, lesson_type, duration, order_index, is_published))").eq("is_published", true).order("order_index");
    courses = res.data || [];
  } catch {}

  let progressMap: Record<string, any> = {};
  try {
    if (studentId) {
      const res = await supabase.from("lesson_progress").select("lesson_id, is_completed, progress_percent, last_position").eq("student_id", studentId);
      const entries = (res.data as any[] || []).map((p: any) => [p.lesson_id, p]);
      progressMap = Object.fromEntries(entries);
    }
  } catch {}

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Mes Cours de Code">
      <CourseCatalog courses={courses} progressMap={progressMap} studentId={studentId} />
    </DashboardLayout>
  );
}
