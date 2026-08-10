import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

// L'admin a accès à TOUTES les pages
// Les autres rôles ont accès uniquement à leurs sections
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/"], // Admin = accès illimité à tout
  directeur: ["/directeur", "/secretaire", "/admin/permis", "/admin/statistiques", "/admin/compositions", "/admin/examens", "/moniteur"],
  secretaire: ["/secretaire", "/admin/abonnements", "/admin/permis"],
  moniteur: ["/moniteur"],
  apprenant: ["/apprenant"],
};

// Page d'accueil par rôle après connexion
const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  directeur: "/directeur",
  secretaire: "/secretaire",
  moniteur: "/moniteur",
  apprenant: "/apprenant/cours",
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = rawUrl && rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  const isPlaceholderUrl = supabaseUrl.includes("placeholder.supabase.co");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Not authenticated → redirect to login
  if (!user && !isPlaceholderUrl) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If placeholder URL (dev without Supabase), let everything through
  if (isPlaceholderUrl) {
    return supabaseResponse;
  }

  // Fetch user role from profile
  let role = "admin"; // Default to admin if no profile found yet (new account)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profile) {
      if ((profile as any).is_active === false) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=account_inactive", request.url));
      }
      role = (profile as any).role || "admin";
    }
  } catch {}

  const home = ROLE_HOME[role] || "/admin";

  // Redirect root "/" to role home
  if (pathname === "/") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // ADMIN has unrestricted access to everything — skip route check
  if (role === "admin") {
    return supabaseResponse;
  }

  // For other roles: check allowed paths
  const allowedPaths = ROLE_ROUTES[role] || [];
  const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

  if (!isAllowed) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
