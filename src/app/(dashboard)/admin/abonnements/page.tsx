import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AbonnementsManagement } from "@/components/abonnements/AbonnementsManagement";

export const metadata = { title: "Gestion des Abonnements" };

export default async function AbonnementsPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let subscriptions: any[] = [];
  const prices: Record<string, number> = {};
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = await createAdminClient();
    const res = await adminSupabase.from("subscriptions").select("*, students(id, first_name, last_name, matricule, email, phone)").order("created_at", { ascending: false });
    subscriptions = res.data || [];
    const settingsRes = await adminSupabase.from("settings").select("*").in("key", ["subscription_1_month_price", "subscription_3_months_price", "subscription_6_months_price"]);
    (settingsRes.data as any[])?.forEach((s: any) => { prices[s.key] = Number(s.value); });
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Abonnements">
      <AbonnementsManagement subscriptions={subscriptions} prices={prices} userRole={profile.role as any} adminId={user?.id || "admin"} />
    </DashboardLayout>
  );
}
