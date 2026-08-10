import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminUsersManagement } from "@/components/administration/AdminUsersManagement";

export const metadata = {
  title: "Administration | Auto École Saint Augustin",
};

export default async function AdministrationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
    
  const profile = data as any;

  // Seul l'administrateur suprême a accès à cette page
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  // Fetch all profiles for the management table
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userName={`${profile.first_name} ${profile.last_name}`} 
      pageTitle="Administration Générale"
    >
      <AdminUsersManagement profiles={(allProfiles as any) || []} currentUserId={user.id} />
    </DashboardLayout>
  );
}
