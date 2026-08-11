"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Car, Lock, Mail, AlertCircle, User, Phone, CheckCircle, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Email ou mot de passe incorrect.");
        return;
      }

      if (data.user) {
        const profileRes: any = await supabase
          .from("profiles")
          .select("role, is_active, first_name")
          .eq("id", data.user.id)
          .single();
        
        const profile = profileRes?.data || { role: "apprenant", is_active: true, first_name: "Apprenant" };

        if (profile && profile.is_active === false) {
          await supabase.auth.signOut();
          setError("Votre compte est désactivé. Contactez l'administration.");
          return;
        }

        toast({
          title: `Bienvenue, ${profile?.first_name || ""}!`,
          description: "Connexion réussie.",
        });

        const roleRoutes: Record<string, string> = {
          admin: "/admin",
          directeur: "/directeur",
          secretaire: "/secretaire",
          moniteur: "/moniteur",
          apprenant: "/apprenant/cours",
        };

        router.push(roleRoutes[profile?.role || "admin"] || "/admin");
      }
    } catch (err: any) {
      setError(err?.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!firstName || !lastName) {
      setError("Veuillez renseigner votre prénom et nom.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: "apprenant",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Erreur lors de l'inscription.");
        return;
      }

      // Insérer le profil dans la table profiles avec le rôle apprenant
      if (data.user) {
        // @ts-ignore
        await supabase.from("profiles").upsert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          role: "apprenant",
          is_active: true,
        } as any);
      }

      document.cookie = "demo_role=apprenant; path=/";
      setSuccess("🎉 Compte créé avec succès ! Bienvenue à l'Auto École Saint Augustin.");
      toast({
        title: "Compte créé !",
        description: "Bienvenue dans votre espace Apprenant.",
      });

      setTimeout(() => {
        router.push("/apprenant/cours");
      }, 800);
    } catch {
      setError("Une erreur inattendue est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 hero-gradient relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-[#F5A623]/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#00C9A7]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="w-24 h-24 bg-[#F5A623] rounded-3xl flex items-center justify-center shadow-gold mb-8">
            <Car className="h-12 w-12 text-[#0A1628]" />
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Auto École
            <br />
            <span className="text-[#F5A623]">Saint Augustin</span>
          </h1>

          <p className="text-white/70 text-lg max-w-md leading-relaxed mb-12">
            Plateforme digitale complète pour votre formation au Code de la Route et l&apos;obtention de votre permis de conduire.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "📚 Code de la route",
              "🎯 Examens blancs",
              "📊 Suivi de progression",
              "🏆 Permis délivré",
            ].map((f) => (
              <span
                key={f}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-6">
            <div className="w-16 h-16 bg-[#0A1628] rounded-2xl flex items-center justify-center">
              <Car className="h-8 w-8 text-[#F5A623]" />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1.5 bg-[#0A1628]/5 dark:bg-muted/80 border border-border/80 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "login"
                  ? "bg-[#0A1628] text-white shadow-md border border-[#0A1628]"
                  : "text-muted-foreground hover:bg-[#0A1628]/10 hover:text-foreground"
              }`}
            >
              <LogIn className="h-4 w-4" /> Se connecter
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "signup"
                  ? "bg-[#F5A623] text-[#0A1628] shadow-gold border border-[#F5A623]"
                  : "text-muted-foreground hover:bg-[#F5A623]/20 hover:text-foreground"
              }`}
            >
              <UserPlus className="h-4 w-4" /> Créer un compte
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {mode === "login" ? "Espace Personnel" : "Créer un compte Apprenant"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === "login"
                ? "Accédez à votre formation et vos exercices"
                : "Inscrivez-vous pour démarrer vos cours en ligne"}
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">{success}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {mode === "login" ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#F5A623] hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0A1628] hover:bg-[#1E4070] text-white h-11 text-base font-semibold rounded-xl shadow-sm"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      className="pl-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Kossou"
                    className="text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Adresse email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.kossou@gmail.com"
                    className="pl-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Mot de passe * (min. 6 car.)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] h-11 text-base font-bold rounded-xl shadow-gold mt-2"
                disabled={loading}
              >
                {loading ? "Création du compte..." : "Créer mon compte Apprenant"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
