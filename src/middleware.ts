import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

// Pages accessibles par chaque rôle
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/admin", "/secretaire", "/moniteur", "/directeur"],
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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPlaceholderUrl = supabaseUrl.includes("placeholder.supabase.co");

  // Redirect root
  if (pathname === "/") {
    if (!user && !isPlaceholderUrl) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Will be handled after role resolution below
  }

  // Allow public routes without auth check
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch user role from profile in Supabase
  let role = "admin";
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

  const home = ROLE_HOME[role] || "/login";

  // Redirect root to role home
  if (pathname === "/") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Check if the user is allowed to access this path
  const allowedPaths = ROLE_ROUTES[role] || [];
  const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

  if (!isAllowed) {
    // Redirect to their own home instead of showing a 403
    return NextResponse.redirect(new URL(home, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
