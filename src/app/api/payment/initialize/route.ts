import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { amount, plan, studentId } = await request.json();
    if (!amount || !plan || !studentId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // FedaPay Sandbox / Production configuration keys
    const fedapaySecret = process.env.FEDAPAY_SECRET_KEY || "sk_sandbox_dummy";
    const callbackUrl = `${request.nextUrl.origin}/api/payment/callback`;

    // 1. Register transaction in DB as pending
    const { data: sub, error: dbError } = await (supabase
      .from("subscriptions") as any)
      .insert([{
        student_id: studentId,
        plan,
        amount,
        status: "pending",
        payment_status: "pending",
        payment_method: "fedapay"
      }])
      .select()
      .single();

    if (dbError || !sub) {
      return NextResponse.json({ error: dbError?.message || "Erreur DB" }, { status: 500 });
    }

    // 2. Call FedaPay API to create transaction
    const response = await fetch("https://api.fedapay.com/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${fedapaySecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: { iso: "XOF" },
        description: `Abonnement Auto-école Saint Augustin - Plan ${plan}`,
        callback_url: callbackUrl,
        custom_metadata: {
          subscription_id: sub.id,
          student_id: studentId
        }
      })
    });

    const fedaData = await response.json();
    if (!response.ok || !fedaData.transaction) {
      return NextResponse.json({ error: fedaData.message || "Erreur FedaPay" }, { status: 500 });
    }

    // 3. Update subscription with FedaPay transaction ID
    await (supabase
      .from("subscriptions") as any)
      .update({ fedapay_transaction_id: fedaData.transaction.id.toString() })
      .eq("id", sub.id);

    // Return checkout url
    const checkoutResponse = await fetch(`https://api.fedapay.com/v1/transactions/${fedaData.transaction.id}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${fedapaySecret}`,
        "Content-Type": "application/json"
      }
    });
    
    const tokenData = await checkoutResponse.json();

    return NextResponse.json({ 
      checkout_url: tokenData.url || `https://checkout.fedapay.com/${tokenData.token || ''}`,
      transaction_id: fedaData.transaction.id
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
