import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: fr })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy à HH:mm", { locale: fr })
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function getDaysRemaining(endDate: string | Date): number {
  return differenceInDays(new Date(endDate), new Date())
}

export function getSubscriptionDuration(plan: string): number {
  switch (plan) {
    case "1_mois": return 30
    case "3_mois": return 90
    case "6_mois": return 180
    default: return 30
  }
}

export function getPlanLabel(plan: string): string {
  switch (plan) {
    case "1_mois": return "1 Mois"
    case "3_mois": return "3 Mois"
    case "6_mois": return "6 Mois"
    default: return plan
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Actif",
    expired: "Expiré",
    suspended: "Suspendu",
    pending: "En attente",
    validated: "Validé",
    archived: "Archivé",
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "text-green-600 bg-green-50 border-green-200",
    expired: "text-red-600 bg-red-50 border-red-200",
    suspended: "text-orange-600 bg-orange-50 border-orange-200",
    pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
    validated: "text-green-600 bg-green-50 border-green-200",
    archived: "text-gray-600 bg-gray-50 border-gray-200",
  }
  return colors[status] || "text-gray-600 bg-gray-50 border-gray-200"
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}min`
  if (m > 0) return `${m}min ${s > 0 ? s + "s" : ""}`
  return `${s}s`
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function generateMatricule(index: number): string {
  const year = new Date().getFullYear()
  return `SA-${year}-${String(index).padStart(4, "0")}`
}

export function getScoreColor(score: number, passScore = 70): string {
  if (score >= passScore) return "text-green-600"
  if (score >= passScore * 0.7) return "text-orange-500"
  return "text-red-600"
}

export function truncate(text: string, length = 50): string {
  return text.length > length ? text.substring(0, length) + "..." : text
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
