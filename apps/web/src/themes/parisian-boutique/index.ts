import type { GuestTheme } from "../types";

export const parisianBoutiqueTheme: GuestTheme = {
  id: "parisian_boutique",
  name: "Parisian Boutique",
  description: "Beige, noir et dore pour une experience boutique hotel parisien.",
  mood: "Chaleureux, elegant, intime",
  preview: "bg-[linear-gradient(135deg,#f7f2ea,#b8973a_48%,#241b16)]",
  classes: {
    app: "bg-[#f7f2ea] text-[#241b16] font-serif",
    shell: "bg-[#f7f2ea] shadow-2xl shadow-[#241b16]/10",
    header: "bg-transparent text-[#241b16]",
    headerOverlay: "bg-gradient-to-b from-[#241b16]/10 via-[#241b16]/5 to-[#241b16]/40",
    card: "border border-[#d7c7b7] bg-[#efe5d8] text-[#241b16] shadow-sm",
    elevatedCard: "border border-[#d7c7b7] bg-white text-[#241b16] shadow-lg shadow-[#241b16]/10",
    subtleCard: "border border-[#d7c7b7] bg-[#efe5d8] text-[#241b16]",
    title: "text-[#241b16] tracking-tight",
    text: "text-[#5f5149]",
    muted: "text-[#5f5149]/80",
    eyebrow: "text-[#b8973a]",
    iconTile: "bg-[#b8973a] text-white",
    iconSoft: "bg-[#b8973a]/15 text-[#b8973a]",
    primaryButton: "bg-[#241b16] text-white shadow-lg shadow-[#241b16]/15 hover:bg-[#5f5149] focus:ring-[#b8973a]/30",
    secondaryButton: "border border-[#d7c7b7] bg-white text-[#241b16] hover:bg-[#efe5d8] focus:ring-[#b8973a]/30",
    input: "border-[#d7c7b7] bg-white text-[#241b16] placeholder:text-[#5f5149]/60 focus:border-[#b8973a] focus:bg-white focus:ring-[#b8973a]/20",
    checkbox: "accent-[#b8973a]",
    nav: "border-[#d7c7b7] bg-white/95 shadow-[#241b16]/10",
    navActive: "bg-[#241b16] text-white",
    navIdle: "text-[#5f5149] hover:bg-[#efe5d8] hover:text-[#241b16]",
    chipActive: "border-[#241b16] bg-[#241b16] text-white",
    chipIdle: "border-[#d7c7b7] bg-white text-[#5f5149]",
    messageGuest: "rounded-br-md bg-[#241b16] text-white",
    messageReception: "rounded-bl-md bg-[#efe5d8] text-[#241b16]",
    statusNew: "bg-blue-100 text-blue-700",
    statusProgress: "bg-amber-100 text-amber-800",
    statusDone: "bg-emerald-100 text-emerald-700",
    statusUrgent: "bg-red-100 text-red-700"
  }
};
