import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { fingerprint } = await request.json();
    if (!fingerprint) {
      return NextResponse.json({ error: "Fingerprint requis" }, { status: 400 });
    }

    // Verify if there is an active session with a different fingerprint
    const { data: activeSessions } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true) as { data: any[] | null };

    const otherSession = activeSessions?.find(s => s.device_fingerprint !== fingerprint);

    if (otherSession) {
      // Invalidate the older session
      await (supabase
        .from("user_sessions") as any)
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", otherSession.id);
    }

    // Insert or update current session fingerprint
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Inconnu";

    await (supabase
      .from("user_sessions") as any)
      .upsert({
        user_id: user.id,
        device_fingerprint: fingerprint,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
        last_activity_at: new Date().toISOString()
      }, { onConflict: "user_id,device_fingerprint" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
