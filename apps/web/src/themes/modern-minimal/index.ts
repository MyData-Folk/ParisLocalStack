import type { GuestTheme } from "../types";

export const modernMinimalTheme: GuestTheme = {
  id: "modern_minimal",
  name: "Modern Minimal",
  description: "Blanc, gris clair et espace pour une experience nordique tres lisible.",
  mood: "Calme, moderne, lumineux",
  preview: "bg-[linear-gradient(135deg,#ffffff,#e5e7eb_54%,#111827)]",
  classes: {
    app: "bg-slate-100 text-slate-950 font-sans",
    shell: "bg-white shadow-2xl shadow-slate-950/10",
    header: "bg-slate-950 text-white",
    headerOverlay: "bg-gradient-to-b from-slate-950/20 via-slate-950/25 to-slate-950/80",
    card: "border border-slate-200 bg-white text-slate-950 shadow-sm",
    elevatedCard: "border border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/10",
    subtleCard: "border border-slate-200 bg-slate-50 text-slate-950",
    title: "text-slate-950 tracking-tight",
    text: "text-slate-700",
    muted: "text-slate-500",
    eyebrow: "text-sky-700",
    iconTile: "bg-slate-950 text-white",
    iconSoft: "bg-sky-100 text-sky-800",
    primaryButton: "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 focus:ring-slate-300",
    secondaryButton: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-sky-100",
    input: "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-sky-100",
    checkbox: "accent-slate-950",
    nav: "border-slate-200 bg-white/95 shadow-slate-950/10",
    navActive: "bg-slate-950 text-white",
    navIdle: "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
    chipActive: "border-slate-950 bg-slate-950 text-white",
    chipIdle: "border-slate-200 bg-white text-slate-600",
    messageGuest: "rounded-br-md bg-slate-950 text-white",
    messageReception: "rounded-bl-md bg-slate-100 text-slate-950",
    statusNew: "bg-sky-100 text-sky-700",
    statusProgress: "bg-slate-200 text-slate-800",
    statusDone: "bg-emerald-100 text-emerald-700",
    statusUrgent: "bg-rose-100 text-rose-700"
  }
};
