"use client";
import { useState } from "react";
import Link from "next/link";
import { Car, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#0A1628] rounded-2xl flex items-center justify-center"><Car className="h-8 w-8 text-[#F5A623]" /></div>
        </div>
        {sent ? (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Email envoyé</h2>
            <p className="text-muted-foreground mb-6">Vérifiez votre boîte mail pour réinitialiser votre mot de passe.</p>
            <Link href="/login"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour à la connexion</Button></Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Mot de passe oublié</h2>
              <p className="text-muted-foreground">Entrez votre email pour recevoir un lien de réinitialisation.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-[#0A1628] hover:bg-[#1E4070]" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le lien"}
              </Button>
              <Link href="/login"><Button variant="ghost" className="w-full gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button></Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
