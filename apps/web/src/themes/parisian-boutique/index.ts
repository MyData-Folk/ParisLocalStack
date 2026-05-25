import type { GuestTheme } from "../types";

export const parisianBoutiqueTheme: GuestTheme = {
  id: "parisian_boutique",
  name: "Parisian Boutique",
  description: "Beige, noir et dore pour une experience boutique hotel parisien.",
  mood: "Chaleureux, elegant, intime",
  preview: "bg-[linear-gradient(135deg,#f8f1e5,#c9a84c_48%,#17120d)]",
  classes: {
    app: "bg-[#f6efe4] text-stone-950 font-serif",
    shell: "bg-[#fbf7ef] shadow-2xl shadow-stone-950/10",
    header: "bg-stone-950 text-white",
    headerOverlay: "bg-gradient-to-b from-stone-950/45 via-stone-950/45 to-stone-950/90",
    card: "border border-[#eadfcd] bg-white text-stone-950 shadow-sm",
    elevatedCard: "border border-[#e7d7bd] bg-white text-stone-950 shadow-lg shadow-stone-950/10",
    subtleCard: "border border-[#eadfcd] bg-[#f7f0e5] text-stone-950",
    title: "text-stone-950 tracking-tight",
    text: "text-stone-700",
    muted: "text-stone-500",
    eyebrow: "text-amber-700",
    iconTile: "bg-stone-950 text-amber-100",
    iconSoft: "bg-amber-100 text-amber-800",
    primaryButton: "bg-stone-950 text-white shadow-lg shadow-stone-950/15 hover:bg-stone-800 focus:ring-stone-300",
    secondaryButton: "border border-stone-200 bg-white text-stone-800 hover:bg-amber-50 focus:ring-amber-200",
    input: "border-stone-200 bg-stone-50 text-stone-950 placeholder:text-stone-400 focus:border-amber-300 focus:bg-white focus:ring-amber-100",
    checkbox: "accent-stone-950",
    nav: "border-stone-200 bg-white/95 shadow-stone-950/10",
    navActive: "bg-stone-950 text-white",
    navIdle: "text-stone-500 hover:bg-stone-100 hover:text-stone-950",
    chipActive: "border-stone-950 bg-stone-950 text-white",
    chipIdle: "border-stone-200 bg-white text-stone-600",
    messageGuest: "rounded-br-md bg-stone-950 text-white",
    messageReception: "rounded-bl-md bg-stone-100 text-stone-950",
    statusNew: "bg-blue-100 text-blue-700",
    statusProgress: "bg-amber-100 text-amber-800",
    statusDone: "bg-emerald-100 text-emerald-700",
    statusUrgent: "bg-red-100 text-red-700"
  }
};
