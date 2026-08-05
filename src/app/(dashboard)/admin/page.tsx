import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboardContent } from "@/components/dashboard/AdminDashboardContent";

export const metadata = { title: "Tableau de bord Administrateur" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };

  const [studentsResult, subsResult, coursesResult, examsResult, permitsResult] = await Promise.all([
    supabase.from("students").select("id, status, created_at") as any,
    supabase.from("subscriptions").select("id, status, plan, created_at") as any,
    supabase.from("courses").select("id, is_published") as any,
    supabase.from("exam_sessions").select("id, is_passed, started_at") as any,
    supabase.from("learner_permits").select("id, created_at") as any,
  ]);

  const stats = {
    totalStudents: studentsResult.data?.length || 0,
    activeSubscriptions: subsResult.data?.filter((s: any) => s.status === "active").length || 0,
    expiredSubscriptions: subsResult.data?.filter((s: any) => s.status === "expired").length || 0,
    pendingStudents: studentsResult.data?.filter((s: any) => s.status === "pending").length || 0,
    totalCourses: coursesResult.data?.filter((c: any) => c.is_published).length || 0,
    totalExams: examsResult.data?.length || 0,
    passedExams: examsResult.data?.filter((e: any) => e.is_passed).length || 0,
    totalPermits: permitsResult.data?.length || 0,
  };

  const { data: recentStudents } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: notifications } = user ? await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5) : { data: [] };

  return (
    <DashboardLayout
      userRole="admin"
      userName={`${profile.first_name} ${profile.last_name}`}
      userEmail={user?.email || "admin@saintaugustin.bj"}
      pageTitle="Tableau de bord"
      notificationCount={notifications?.length || 0}
    >
      <AdminDashboardContent
        stats={stats}
        recentStudents={recentStudents || []}
        subscriptionsData={subsResult.data || []}
      />
    </DashboardLayout>
  );
}
