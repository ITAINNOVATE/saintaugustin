"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Shield, Ban, CheckCircle, Search, Edit, Trash2 } from "lucide-react";
import type { Profile, UserRole } from "@/types/database";

interface AdminUsersManagementProps {
  profiles: Profile[];
  currentUserId: string;
}

const AVAILABLE_MODULES = [
  { id: "/secretaire", label: "Gestion des Inscriptions & Apprenants" },
  { id: "/admin/abonnements", label: "Gestion des Abonnements" },
  { id: "/admin/permis", label: "Gestion des Permis & Délivrances" },
  { id: "/admin/examens", label: "Gestion des Examens Blancs" },
  { id: "/admin/compositions", label: "Gestion des Compositions E-Exam" },
  { id: "/moniteur", label: "Espace Moniteur & Suivi Conduite" },
  { id: "/admin/cours", label: "Gestion des Cours" },
  { id: "/admin/statistiques", label: "Statistiques & Rapports" },
];

const getDefaultAccessesForRole = (role: UserRole): string[] => {
  if (role === "secretaire") return ["/secretaire", "/admin/abonnements", "/admin/permis"];
  if (role === "moniteur") return ["/moniteur"];
  if (role === "directeur") return ["/secretaire", "/admin/abonnements", "/admin/permis", "/admin/examens", "/admin/compositions", "/moniteur", "/admin/cours", "/admin/statistiques"];
  if (role === "admin") return ["/secretaire", "/admin/abonnements", "/admin/permis", "/admin/examens", "/admin/compositions", "/moniteur", "/admin/cours", "/admin/statistiques"];
  return [];
};

export function AdminUsersManagement({ profiles: initialProfiles, currentUserId }: AdminUsersManagementProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", role: "secretaire"
  });

  const filteredProfiles = profiles.filter(p => {
    const q = search.toLowerCase();
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return !q || name.includes(q) || (p.email || "").toLowerCase().includes(q) || p.role.includes(q);
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Compte créé avec succès !" });
        setShowAddDialog(false);
        setForm({ first_name: "", last_name: "", email: "", password: "", role: "secretaire" });
        // Refresh page to get new profiles, or we could just append local state
        window.location.reload();
      }
    });
  };

  const toggleAccountStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      toast({ title: "Action impossible", description: "Vous ne pouvez pas désactiver votre propre compte.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      // @ts-ignore
      const { error } = await supabase.from("profiles").update({ is_active: !currentStatus } as any).eq("id", userId);
      if (!error) {
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: !currentStatus } : p));
        toast({ title: !currentStatus ? "Compte réactivé" : "Compte suspendu" });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleToggleModuleAccess = async (moduleId: string) => {
    if (!selectedProfile) return;
    
    // Copy current accesses (or default accesses if empty)
    const baseAccesses = selectedProfile.module_accesses && selectedProfile.module_accesses.length > 0
      ? selectedProfile.module_accesses
      : getDefaultAccessesForRole(selectedProfile.role);

    let newAccesses: string[] = [];
    if (baseAccesses.includes(moduleId)) {
      newAccesses = baseAccesses.filter(a => a !== moduleId);
    } else {
      newAccesses = [...baseAccesses, moduleId];
    }

    // Update optimistic UI
    const updatedProfile = { ...selectedProfile, module_accesses: newAccesses };
    setSelectedProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? updatedProfile : p));

    // Update DB
    const { error } = await (supabase.from("profiles") as any)
      .update({ module_accesses: newAccesses })
      .eq("id", selectedProfile.id);

    if (error) {
      toast({ title: "Erreur lors de la mise à jour", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Accès mis à jour !", description: `Les accès de ${selectedProfile.first_name} ont été modifiés.` });
    }
  };

  const handleDeleteProfile = async () => {
    if (!deleteProfile) return;
    if (deleteProfile.id === currentUserId) {
      toast({ title: "Action impossible", description: "Vous ne pouvez pas supprimer votre propre compte.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      try {
        const { error } = await (supabase.from("profiles") as any).delete().eq("id", deleteProfile.id);
        if (error) throw error;
        await (supabase.from("students") as any).delete().eq("user_id", deleteProfile.id);
        setProfiles(prev => prev.filter(p => p.id !== deleteProfile.id));
        toast({ title: "Compte supprimé avec succès" });
        setDeleteProfile(null);
      } catch (err: any) {
        toast({ title: "Erreur lors de la suppression", description: err.message, variant: "destructive" });
      }
    });
  };

  const staffProfiles = filteredProfiles.filter(p => p.role !== "apprenant");
  const studentProfiles = filteredProfiles.filter(p => p.role === "apprenant");

  const renderProfileCard = (profile: Profile) => (
    <Card key={profile.id} className="border border-border/50 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
              profile.role === 'admin' ? 'bg-red-500' :
              profile.role === 'directeur' ? 'bg-purple-500' :
              profile.role === 'secretaire' ? 'bg-blue-500' :
              profile.role === 'moniteur' ? 'bg-green-500' : 'bg-amber-600'
            }`}>
              {(profile.first_name?.[0] || "U")}{(profile.last_name?.[0] || "U")}
            </div>
            <div>
              <h3 className="font-bold">{profile.first_name} {profile.last_name}</h3>
              <p className="text-xs text-muted-foreground">{profile.email || "Aucun email"}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] uppercase">{profile.role}</Badge>
                {profile.is_active ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Actif</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">Suspendu</Badge>
                )}
              </div>
            </div>
          </div>
          
          {profile.role !== "apprenant" && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 gap-1"
              onClick={() => { setSelectedProfile(profile); setShowAccessDialog(true); }}
            >
              <Edit className="h-3.5 w-3.5" /> Accès
            </Button>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <p className="text-xs text-muted-foreground">Créé le {new Date(profile.created_at).toLocaleDateString("fr-FR")}</p>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-xs ${profile.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
              onClick={() => toggleAccountStatus(profile.id, profile.is_active)}
              disabled={isPending || profile.id === currentUserId}
            >
              {profile.is_active ? <><Ban className="h-3 w-3 mr-1"/> Suspendre</> : <><CheckCircle className="h-3 w-3 mr-1"/> Activer</>}
            </Button>
            {profile.id !== currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                onClick={() => setDeleteProfile(profile)}
                title="Supprimer le compte"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#F5A623]" /> Administration
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des comptes et des droits d'accès</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#0A1628] hover:bg-[#1E4070] gap-2 font-bold">
          <UserPlus className="h-4 w-4" /> Créer un compte
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, email ou rôle..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* GROUPE 1 : PERSONNEL DE L'AUTO-ÉCOLE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h2 className="text-lg font-bold text-foreground">Personnel & Administration</h2>
          <Badge className="bg-[#0A1628] text-white font-bold">{staffProfiles.length}</Badge>
        </div>

        {staffProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">Aucun membre du personnel trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {staffProfiles.map(renderProfileCard)}
          </div>
        )}
      </div>

      {/* GROUPE 2 : APPRENANTS */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h2 className="text-lg font-bold text-foreground">Apprenants Inscrits</h2>
          <Badge className="bg-amber-500 text-white font-bold">{studentProfiles.length}</Badge>
        </div>

        {studentProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">Aucun apprenant trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {studentProfiles.map(renderProfileCard)}
          </div>
        )}
      </div>

      {/* CREATE USER DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau compte</DialogTitle>
            <CardDescription>
              Ce compte permettra à un membre du personnel de se connecter à la plateforme.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe provisoire</Label>
              <Input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={val => setForm({...form, role: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="secretaire">Secrétaire</SelectItem>
                  <SelectItem value="moniteur">Moniteur</SelectItem>
                  <SelectItem value="directeur">Directeur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="bg-[#0A1628] hover:bg-[#1E4070]">Créer le compte</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE ACCESS DIALOG */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer les accès</DialogTitle>
            <CardDescription>
              {selectedProfile?.first_name} {selectedProfile?.last_name} ({selectedProfile?.role})
            </CardDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border">
              Par défaut, ce rôle a des accès standards. Vous pouvez activer ci-dessous des modules supplémentaires pour cet utilisateur spécifiquement, ou lui retirer l'accès en décochant.
            </p>
            
            <div className="space-y-2.5">
              {AVAILABLE_MODULES.map(module => {
                const effectiveAccesses = selectedProfile?.module_accesses && selectedProfile.module_accesses.length > 0
                  ? selectedProfile.module_accesses
                  : getDefaultAccessesForRole(selectedProfile?.role || "secretaire");
                
                const isEnabled = effectiveAccesses.includes(module.id);
                return (
                  <div
                    key={module.id}
                    onClick={() => handleToggleModuleAccess(module.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isEnabled
                        ? "bg-[#0A1628]/5 border-[#F5A623] dark:bg-amber-950/20 shadow-sm"
                        : "bg-background border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? "bg-[#F5A623]" : "bg-gray-300 dark:bg-gray-700"}`} />
                      <Label className="font-semibold text-sm cursor-pointer text-foreground">
                        {module.label}
                      </Label>
                    </div>
                    <Switch
                      id={`switch-${module.id}`}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleModuleAccess(module.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowAccessDialog(false)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Supprimer le compte ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer définitivement le compte de{" "}
              <strong className="text-foreground">{deleteProfile?.first_name} {deleteProfile?.last_name}</strong> ({deleteProfile?.role}) ?
              Cette action supprimera également ses données associées.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteProfile(null)}>Annuler</Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProfile}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 font-bold"
              >
                {isPending ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
