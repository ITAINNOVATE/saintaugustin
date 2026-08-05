import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id");
    const status = searchParams.get("status");

    if (!transactionId) {
      return NextResponse.redirect(new URL("/apprenant?error=payment_missing_id", request.url));
    }

    // Call FedaPay API to check actual status
    const fedapaySecret = process.env.FEDAPAY_SECRET_KEY || "sk_sandbox_dummy";
    const response = await fetch(`https://api.fedapay.com/v1/transactions/${transactionId}`, {
      headers: { "Authorization": `Bearer ${fedapaySecret}` }
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/apprenant?error=payment_verification_failed", request.url));
    }

    const { transaction } = await response.json();
    const subscriptionId = transaction?.custom_metadata?.subscription_id;

    if (!subscriptionId) {
      return NextResponse.redirect(new URL("/apprenant?error=subscription_not_found", request.url));
    }

    if (transaction.status === "approved" || status === "approved") {
      // 1. Fetch current subscription plan details
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single() as { data: any };

      if (sub && sub.status !== "active") {
        const plan = sub.plan;
        const days = plan === "1_mois" ? 30 : plan === "3_mois" ? 90 : 180;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        // 2. Update subscription status
        await (supabase
          .from("subscriptions") as any)
          .update({
            status: "active",
            payment_status: "completed",
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            activated_at: new Date().toISOString()
          })
          .eq("id", subscriptionId);
      }

      return NextResponse.redirect(new URL("/apprenant?success=payment_completed", request.url));
    }

    return NextResponse.redirect(new URL("/apprenant?error=payment_cancelled", request.url));
  } catch (err) {
    return NextResponse.redirect(new URL(`/apprenant?error=internal_error`, request.url));
  }
}
