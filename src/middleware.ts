import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/admin", "/directeur", "/secretaire", "/moniteur"],
  directeur: ["/directeur", "/secretaire", "/admin/permis", "/admin/statistiques", "/admin/compositions", "/moniteur"],
  secretaire: ["/secretaire", "/admin/abonnements", "/admin/permis"],
  moniteur: ["/moniteur"],
  apprenant: ["/apprenant"],
};

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

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const demoRole = request.cookies.get("demo_role")?.value;
  const isPlaceholderUrl = supabaseUrl.includes("placeholder.supabase.co");

  // Redirect root to login or dashboard
  if (pathname === "/") {
    if (!user && !demoRole && !isPlaceholderUrl) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = demoRole || "admin";
    return NextResponse.redirect(new URL(ROLE_HOME[role] || "/admin", request.url));
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Allow dashboard routes in demo mode or when authenticated
  if (!user && !demoRole && !isPlaceholderUrl) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let role = demoRole || "admin";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=account_inactive", request.url));
    }
    role = profile.role as string;
  }

  const allowedPaths = ROLE_ROUTES[role] || [];
  const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

  if (!isAllowed && pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] || "/apprenant/cours", request.url));
  }

  if (!isAllowed && pathname.startsWith("/directeur") && !["admin", "directeur"].includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] || "/apprenant", request.url));
  }

  if (!isAllowed && pathname.startsWith("/secretaire") && !["admin", "secretaire"].includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] || "/apprenant", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
