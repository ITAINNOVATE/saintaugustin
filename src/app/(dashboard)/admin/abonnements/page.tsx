import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AbonnementsManagement } from "@/components/abonnements/AbonnementsManagement";

export const metadata = { title: "Gestion des Abonnements" };

export default async function AbonnementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, students(id, first_name, last_name, matricule, email, phone)")
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase.from("settings").select("*").in("key", [
    "subscription_1_month_price", "subscription_3_months_price", "subscription_6_months_price"
  ]);

  const prices: Record<string, number> = {};
  (settings as any[])?.forEach(s => { prices[s.key!] = Number(s.value); });

  return (
    <DashboardLayout userRole={profile.role} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Abonnements">
      <AbonnementsManagement subscriptions={subscriptions || []} prices={prices} userRole={profile.role} adminId={user?.id || "demo-admin-id"} />
    </DashboardLayout>
  );
}
