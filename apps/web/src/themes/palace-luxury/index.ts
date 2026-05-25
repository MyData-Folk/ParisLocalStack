import type { GuestTheme } from "../types";

export const palaceLuxuryTheme: GuestTheme = {
  id: "palace_luxury",
  name: "Palace Luxury",
  description: "Noir profond et champagne gold pour un rendu palace cinq etoiles.",
  mood: "Luxueux, contraste, exclusif",
  preview: "bg-[linear-gradient(135deg,#030712,#111827_45%,#d9b66f)]",
  classes: {
    app: "bg-[#050505] text-[#f8ead2] font-serif",
    shell: "bg-[#0b0b0c] shadow-2xl shadow-black/40 ring-1 ring-[#d9b66f]/20",
    header: "bg-black text-[#fff7e6]",
    headerOverlay: "bg-gradient-to-b from-black/25 via-black/45 to-black/95",
    card: "border border-[#d9b66f]/25 bg-[#111112] text-[#fff7e6] shadow-lg shadow-black/30",
    elevatedCard: "border border-[#d9b66f]/35 bg-[#111112] text-[#fff7e6] shadow-2xl shadow-black/40",
    subtleCard: "border border-[#d9b66f]/20 bg-[#171717] text-[#fff7e6]",
    title: "text-[#fff7e6] tracking-tight",
    text: "text-[#ead9bb]",
    muted: "text-[#bba987]",
    eyebrow: "text-[#d9b66f]",
    iconTile: "bg-[#d9b66f] text-black",
    iconSoft: "bg-[#d9b66f]/15 text-[#f6d992]",
    primaryButton: "bg-[#d9b66f] text-black shadow-lg shadow-black/30 hover:bg-[#f0d58f] focus:ring-[#d9b66f]/30",
    secondaryButton: "border border-[#d9b66f]/25 bg-[#d9b66f]/10 text-[#f8ead2] hover:bg-[#d9b66f]/15 focus:ring-[#d9b66f]/20",
    input: "border-[#d9b66f]/25 bg-black/35 text-[#fff7e6] placeholder:text-[#bba987] focus:border-[#d9b66f] focus:bg-black/50 focus:ring-[#d9b66f]/20",
    checkbox: "accent-[#d9b66f]",
    nav: "border-[#d9b66f]/25 bg-black/95 shadow-black/50",
    navActive: "bg-[#d9b66f] text-black",
    navIdle: "text-[#bba987] hover:bg-[#d9b66f]/10 hover:text-[#fff7e6]",
    chipActive: "border-[#d9b66f] bg-[#d9b66f] text-black",
    chipIdle: "border-[#d9b66f]/25 bg-[#111112] text-[#ead9bb]",
    messageGuest: "rounded-br-md bg-[#d9b66f] text-black",
    messageReception: "rounded-bl-md bg-[#1a1a1b] text-[#fff7e6]",
    statusNew: "bg-[#d9b66f]/15 text-[#f8ead2]",
    statusProgress: "bg-amber-500/15 text-amber-200",
    statusDone: "bg-emerald-500/15 text-emerald-200",
    statusUrgent: "bg-red-500/15 text-red-200"
  }
};
