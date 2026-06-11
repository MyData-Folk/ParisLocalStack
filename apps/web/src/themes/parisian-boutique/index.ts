import type { GuestTheme } from "../types";

export const parisianBoutiqueTheme: GuestTheme = {
  id: "parisian_boutique",
  name: "Parisian Boutique",
  description: "Blanc chaud, accents dores et typographie editoriale pour un concierge parisien premium.",
  mood: "Editorial, lumineux, premium",
  preview: "bg-[linear-gradient(135deg,#fdfaf6,#c9a84c_48%,#1a1613)]",
  classes: {
    app: "bg-[#fdfaf6] text-[#1a1613] font-sans",
    shell: "bg-[#fdfaf6] shadow-2xl shadow-black/5",
    header: "bg-transparent text-white",
    headerOverlay: "bg-gradient-to-b from-black/10 via-black/30 to-black/70",
    card: "bg-white text-[#1a1613] shadow-sm shadow-black/5 ring-1 ring-black/[0.04]",
    elevatedCard: "bg-white text-[#1a1613] shadow-md shadow-black/8 ring-1 ring-black/[0.04]",
    subtleCard: "bg-[#f5f1ec] text-[#1a1613]",
    title: "text-[#1a1613] tracking-tight font-serif",
    text: "text-[#4a3f37]",
    muted: "text-[#8c7e73]",
    eyebrow: "text-[#b8973a]",
    iconTile: "bg-[#1a1613] text-white",
    iconSoft: "bg-[#b8973a]/10 text-[#b8973a]",
    primaryButton: "bg-[#1a1613] text-white shadow-lg shadow-black/10 hover:bg-[#2d2520] focus:ring-[#b8973a]/30",
    secondaryButton: "bg-[#f5f1ec] text-[#1a1613] hover:bg-[#ede7e0] focus:ring-[#b8973a]/20",
    input: "border-[#e5ddd5] bg-white text-[#1a1613] placeholder:text-[#8c7e73] focus:border-[#b8973a] focus:ring-[#b8973a]/20",
    checkbox: "accent-[#b8973a]",
    nav: "bg-white/90 border-[#e8e2db] shadow-black/5",
    navActive: "bg-[#1a1613] text-white",
    navIdle: "text-[#8c7e73] hover:text-[#1a1613] hover:bg-[#f5f1ec]",
    chipActive: "bg-[#1a1613] text-white border-transparent",
    chipIdle: "bg-white text-[#4a3f37] ring-1 ring-black/[0.06]",
    messageGuest: "rounded-br-sm bg-[#1a1613] text-white",
    messageReception: "rounded-bl-sm bg-[#f5f1ec] text-[#1a1613]",
    statusNew: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    statusProgress: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    statusDone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    statusUrgent: "bg-red-50 text-red-700 ring-1 ring-red-200"
  }
};
