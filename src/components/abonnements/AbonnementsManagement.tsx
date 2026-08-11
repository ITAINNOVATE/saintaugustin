"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getDaysRemaining, getPlanLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  Search, Filter, CreditCard, CheckCircle, XCircle, Clock,
  RefreshCw, Plus, ChevronLeft, ChevronRight, AlertTriangle,
  Calendar, User, TrendingUp, Trash2
} from "lucide-react";
import type { Subscription, UserRole } from "@/types/database";

type SubWithStudent = Subscription & {
  students?: { id: string; first_name: string; last_name: string; matricule: string; email?: string; phone?: string } | null;
};

interface AbonnementsManagementProps {
  subscriptions: SubWithStudent[];
  prices: Record<string, number>;
  userRole: UserRole;
  adminId: string;
}

const ITEMS_PER_PAGE = 10;

export function AbonnementsManagement({ subscriptions: initialSubs, prices, userRole, adminId }: AbonnementsManagementProps) {
  const [subs, setSubs] = useState(initialSubs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubWithStudent | null>(null);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const [newForm, setNewForm] = useState({
    studentSearch: "", studentId: "", studentName: "", plan: "1_mois" as string,
    notes: "", paymentReference: ""
  });
  const [foundStudents, setFoundStudents] = useState<any[]>([]);

  const filtered = subs.filter(s => {
    const q = search.toLowerCase();
    const name = `${s.students?.first_name || ""} ${s.students?.last_name || ""}`.toLowerCase();
    const matchSearch = !q || name.includes(q) || (s.students?.matricule || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    active: subs.filter(s => s.status === "active").length,
    expired: subs.filter(s => s.status === "expired").length,
    pending: subs.filter(s => s.status === "pending").length,
    suspended: subs.filter(s => s.status === "suspended").length,
  };

  const searchStudents = async (q: string) => {
    if (q.length < 2) { setFoundStudents([]); return; }
    const { data } = await supabase.from("students").select("id, first_name, last_name, matricule").or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,matricule.ilike.%${q}%`).limit(5);
    setFoundStudents(data || []);
  };

  const getDurationDays = (plan: string) => plan === "1_mois" ? 30 : plan === "3_mois" ? 90 : 180;
  const getPrice = (plan: string) => {
    const key = plan === "1_mois" ? "subscription_1_month_price" : plan === "3_mois" ? "subscription_3_months_price" : "subscription_6_months_price";
    return prices[key] || 0;
  };

  const handleActivate = async (sub: SubWithStudent) => {
    startTransition(async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + getDurationDays(sub.plan));
      const { error } = await (supabase.from("subscriptions") as any).update({
        status: "active", start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0], activated_by: adminId, activated_at: new Date().toISOString(), payment_status: "completed"
      }).eq("id", sub.id);
      if (!error) {
        setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: "active", start_date: startDate.toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0] } : s));
        toast({ title: "Abonnement activé avec succès" });
      } else toast({ title: "Erreur", description: error.message, variant: "destructive" });
    });
  };

  const handleSuspend = async (sub: SubWithStudent) => {
    startTransition(async () => {
      const { error } = await (supabase.from("subscriptions") as any).update({ status: "suspended", suspended_by: adminId, suspended_at: new Date().toISOString() }).eq("id", sub.id);
      if (!error) {
        setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: "suspended" } : s));
        toast({ title: "Abonnement suspendu" });
      }
    });
  };

  const handleDeleteSub = async (sub: SubWithStudent) => {
    if (!confirm("Voulez-vous vraiment supprimer cet abonnement ?")) return;
    startTransition(async () => {
      const { error } = await (supabase.from("subscriptions") as any).delete().eq("id", sub.id);
      if (!error) {
        setSubs(prev => prev.filter(s => s.id !== sub.id));
        toast({ title: "Abonnement supprimé" });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleExtend = async (sub: SubWithStudent, days: number) => {
    startTransition(async () => {
      const currentEnd = sub.end_date ? new Date(sub.end_date) : new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + days);
      const { error } = await (supabase.from("subscriptions") as any).update({ end_date: newEnd.toISOString().split("T")[0], status: "active" }).eq("id", sub.id);
      if (!error) {
        setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, end_date: newEnd.toISOString().split("T")[0], status: "active" } : s));
        toast({ title: `Abonnement prolongé de ${days} jours` });
      }
    });
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.studentId) { toast({ title: "Sélectionnez un apprenant", variant: "destructive" }); return; }
    startTransition(async () => {
      const { data, error } = await (supabase.from("subscriptions") as any).insert([{
        student_id: newForm.studentId, plan: newForm.plan as any,
        status: "pending", payment_status: "pending",
        amount: getPrice(newForm.plan), notes: newForm.notes,
        payment_reference: newForm.paymentReference || null
      }]).select("*, students(id, first_name, last_name, matricule)").single();
      if (!error && data) {
        setSubs(prev => [data as any, ...prev]);
        toast({ title: "Abonnement créé", description: "En attente d'activation" });
        setShowNewDialog(false);
        setNewForm({ studentSearch: "", studentId: "", studentName: "", plan: "1_mois", notes: "", paymentReference: "" });
        setFoundStudents([]);
      } else toast({ title: "Erreur", description: error?.message, variant: "destructive" });
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Abonnements</h1>
          <p className="text-muted-foreground text-sm mt-1">{subs.length} abonnement(s) au total</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => setShowNewDialog(true)} className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-semibold gap-2">
            <Plus className="h-4 w-4" /> Nouvel abonnement
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Actifs", value: stats.active, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Expirés", value: stats.expired, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "En attente", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "Suspendus", value: stats.suspended, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className="cursor-pointer" onClick={() => setStatusFilter(label === "Actifs" ? "active" : label === "Expirés" ? "expired" : label === "En attente" ? "pending" : "suspended")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <CreditCard className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, matricule..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="expired">Expirés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apprenant</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Plan</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Période</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Montant</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground"><CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Aucun abonnement trouvé</p></td></tr>
              ) : paginated.map(sub => {
                const daysLeft = sub.end_date ? getDaysRemaining(sub.end_date) : null;
                return (
                  <tr key={sub.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0A1628] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {sub.students?.first_name?.[0]}{sub.students?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sub.students?.first_name} {sub.students?.last_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{sub.students?.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm font-semibold text-[#F5A623]">{getPlanLabel(sub.plan)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${getStatusColor(sub.status)}`}>{getStatusLabel(sub.status)}</span>
                        {sub.status === "active" && daysLeft !== null && daysLeft <= 7 && (
                          <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{daysLeft}j restants</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {sub.start_date && <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Début: {formatDate(sub.start_date)}</p>}
                        {sub.end_date && <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Fin: {formatDate(sub.end_date)}</p>}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <p className="text-sm font-semibold">{sub.amount ? `${sub.amount.toLocaleString()} FCFA` : "—"}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {sub.status === "pending" && userRole === "admin" && (
                          <Button size="icon-sm" variant="ghost" className="text-green-600 dark:text-green-400 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-950/80 border border-green-200/40" onClick={() => handleActivate(sub)} title="Activer"><CheckCircle className="h-4 w-4" /></Button>
                        )}
                        {sub.status === "active" && userRole === "admin" && (
                          <>
                            <Button size="icon-sm" variant="ghost" className="text-orange-600 dark:text-orange-400 hover:text-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/80 border border-orange-200/40" onClick={() => handleSuspend(sub)} title="Suspendre"><XCircle className="h-4 w-4" /></Button>
                            <Button size="icon-sm" variant="ghost" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/80 border border-blue-200/40" onClick={() => handleExtend(sub, 30)} title="+30 jours"><RefreshCw className="h-4 w-4" /></Button>
                          </>
                        )}
                        {(sub.status === "suspended" || sub.status === "expired") && userRole === "admin" && (
                          <Button size="icon-sm" variant="ghost" className="text-green-600 dark:text-green-400 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-950/80 border border-green-200/40" onClick={() => handleActivate(sub)} title="Réactiver"><CheckCircle className="h-4 w-4" /></Button>
                        )}
                        <Button size="icon-sm" variant="ghost" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/80 border border-purple-200/40" onClick={() => setSelectedSub(sub)} title="Détails"><TrendingUp className="h-4 w-4" /></Button>
                        {userRole === "admin" && (
                          <Button size="icon-sm" variant="ghost" className="text-red-600 dark:text-red-400 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-950/80 border border-red-200/40" onClick={() => handleDeleteSub(sub)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      {/* New Subscription Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Créer un abonnement</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSub} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rechercher un apprenant</Label>
              <Input placeholder="Nom ou matricule..." value={newForm.studentSearch}
                onChange={e => { setNewForm({ ...newForm, studentSearch: e.target.value, studentId: "", studentName: "" }); searchStudents(e.target.value); }} />
              {foundStudents.length > 0 && !newForm.studentId && (
                <div className="border rounded-lg overflow-hidden">
                  {foundStudents.map(s => (
                    <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                      onClick={() => { setNewForm({ ...newForm, studentId: s.id, studentName: `${s.first_name} ${s.last_name}`, studentSearch: `${s.first_name} ${s.last_name} (${s.matricule})` }); setFoundStudents([]); }}>
                      <User className="h-3 w-3 text-muted-foreground" />
                      {s.first_name} {s.last_name} — <span className="font-mono text-xs text-muted-foreground">{s.matricule}</span>
                    </button>
                  ))}
                </div>
              )}
              {newForm.studentId && <p className="text-xs text-green-600">✓ Apprenant sélectionné : {newForm.studentName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Plan d'abonnement</Label>
              <Select value={newForm.plan} onValueChange={v => setNewForm({ ...newForm, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_mois">1 Mois — {(prices["subscription_1_month_price"] || 5000).toLocaleString()} FCFA</SelectItem>
                  <SelectItem value="3_mois">3 Mois — {(prices["subscription_3_months_price"] || 12000).toLocaleString()} FCFA</SelectItem>
                  <SelectItem value="6_mois">6 Mois — {(prices["subscription_6_months_price"] || 20000).toLocaleString()} FCFA</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Montant : <strong>{getPrice(newForm.plan).toLocaleString()} FCFA</strong></p>
            </div>
            <div className="space-y-2">
              <Label>Référence de paiement (optionnel)</Label>
              <Input placeholder="N° reçu, référence FedaPay..." value={newForm.paymentReference} onChange={e => setNewForm({ ...newForm, paymentReference: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={newForm.notes} onChange={e => setNewForm({ ...newForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-semibold">
                {isPending ? "Création..." : "Créer l'abonnement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Détails de l'abonnement</DialogTitle></DialogHeader>
          {selectedSub && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#0A1628] text-white flex items-center justify-center font-bold text-lg">
                  {selectedSub.students?.first_name?.[0]}{selectedSub.students?.last_name?.[0]}
                </div>
                <div>
                  <p className="font-bold">{selectedSub.students?.first_name} {selectedSub.students?.last_name}</p>
                  <p className="text-sm font-mono text-muted-foreground">{selectedSub.students?.matricule}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Plan", value: getPlanLabel(selectedSub.plan) },
                  { label: "Statut", value: getStatusLabel(selectedSub.status) },
                  { label: "Montant", value: selectedSub.amount ? `${selectedSub.amount.toLocaleString()} FCFA` : "—" },
                  { label: "Début", value: selectedSub.start_date ? formatDate(selectedSub.start_date) : "—" },
                  { label: "Expiration", value: selectedSub.end_date ? formatDate(selectedSub.end_date) : "—" },
                  { label: "Jours restants", value: selectedSub.end_date ? `${Math.max(0, getDaysRemaining(selectedSub.end_date))}j` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {selectedSub.notes && (
                <div className="p-3 bg-muted/40 rounded-lg text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p>{selectedSub.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
