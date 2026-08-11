import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zhctrwqvdmcvkuldqmso.supabase.co";
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";
const getSupabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA";

export async function POST(req: Request) {
  try {
    // 1. Service Client for admin operations bypassing RLS
    const supabaseAdmin = createSupabaseClient(
      getSupabaseUrl(),
      getSupabaseServiceKey(),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Verify logged-in session user
    const cookieStore = await cookies();
    const supabaseUserClient = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabaseUserClient.auth.getUser();

    // Check if requester is authorized (admin or email admin@saintaugustin.com)
    let isAuthorized = false;
    if (user) {
      if (user.email === "admin@saintaugustin.com") {
        isAuthorized = true;
      } else {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile && (profile.role === "admin" || profile.role === "directeur")) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès refusé. Seul un administrateur peut créer des comptes." }, { status: 403 });
    }

    // 3. Extract payload
    const body = await req.json();
    const { email, password, first_name, last_name, role } = body;

    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    // 4. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    let defaultAccesses: string[] = [];
    if (role === "secretaire") defaultAccesses = ["/secretaire", "/admin/abonnements", "/admin/permis"];
    if (role === "moniteur") defaultAccesses = ["/moniteur"];
    if (role === "directeur") defaultAccesses = ["/directeur", "/secretaire", "/admin/permis", "/admin/statistiques", "/admin/compositions", "/admin/examens", "/moniteur"];
    if (role === "admin") defaultAccesses = ["/admin", "/admin/administration", "/admin/apprenants", "/admin/cours", "/admin/conduite", "/admin/compositions", "/admin/permis", "/admin/statistiques"];

    // 5. Insert/Upsert profile (without 'email' column since profiles has no 'email' field)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        first_name,
        last_name,
        role,
        is_active: true,
        module_accesses: defaultAccesses
      });

    if (profileError) {
      return NextResponse.json({ error: "Erreur lors de la création du profil: " + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur lors de la création du compte." }, { status: 500 });
  }
}
