import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PanneauxViewer } from "@/components/courses/PanneauxViewer";

export const metadata = {
  title: "Lecture des Panneaux | Auto École Saint Augustin",
  description: "Cours interactif sur les panneaux de signalisation du Code de la Route.",
};

export default async function PanneauxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // In demo mode or when authenticated, load profile
  let userName = "Apprenant";
  let userRole = "apprenant";

  if (user) {
    const profileRes: any = await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .single();
    const profile = profileRes?.data;

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
      userRole = profile.role || "apprenant";
    }
  }

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Lecture des Panneaux">
      <PanneauxViewer />
    </DashboardLayout>
  );
}
