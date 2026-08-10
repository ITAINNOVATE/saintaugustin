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
import { UserPlus, Shield, Ban, CheckCircle, Search, Edit } from "lucide-react";
import type { Profile, UserRole } from "@/types/database";

interface AdminUsersManagementProps {
  profiles: Profile[];
  currentUserId: string;
}

const AVAILABLE_MODULES = [
  { id: "/secretaire", label: "Tableau de bord Secrétaire" },
  { id: "/admin/abonnements", label: "Gestion des Abonnements" },
  { id: "/admin/permis", label: "Gestion des Permis" },
  { id: "/admin/examens", label: "Gestion des Examens" },
  { id: "/admin/compositions", label: "Gestion des Compositions" },
  { id: "/moniteur", label: "Espace Moniteur" },
];

export function AdminUsersManagement({ profiles: initialProfiles, currentUserId }: AdminUsersManagementProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
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
    
    // Copy current accesses
    let currentAccesses = selectedProfile.module_accesses || [];
    
    if (currentAccesses.includes(moduleId)) {
      currentAccesses = currentAccesses.filter(a => a !== moduleId);
    } else {
      currentAccesses = [...currentAccesses, moduleId];
    }

    // Update optimistic UI
    setSelectedProfile({ ...selectedProfile, module_accesses: currentAccesses });
    setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? { ...p, module_accesses: currentAccesses } : p));

    // Update DB
    // @ts-ignore
    await supabase.from("profiles").update({ module_accesses: currentAccesses } as any).eq("id", selectedProfile.id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProfiles.map(profile => (
          <Card key={profile.id} className="border border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                    profile.role === 'admin' ? 'bg-red-500' :
                    profile.role === 'directeur' ? 'bg-purple-500' :
                    profile.role === 'secretaire' ? 'bg-blue-500' :
                    profile.role === 'moniteur' ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    {profile.first_name[0]}{profile.last_name[0]}
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-7 text-xs ${profile.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                  onClick={() => toggleAccountStatus(profile.id, profile.is_active)}
                  disabled={isPending || profile.id === currentUserId}
                >
                  {profile.is_active ? <><Ban className="h-3 w-3 mr-1"/> Suspendre</> : <><CheckCircle className="h-3 w-3 mr-1"/> Activer</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
            
            <div className="space-y-3">
              {AVAILABLE_MODULES.map(module => {
                const isEnabled = (selectedProfile?.module_accesses || []).includes(module.id);
                return (
                  <div key={module.id} className="flex items-center justify-between bg-background border p-3 rounded-xl">
                    <Label className="font-medium cursor-pointer" htmlFor={`switch-${module.id}`}>
                      {module.label}
                    </Label>
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

    </div>
  );
}
