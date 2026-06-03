import {
  ConciergeBell,
  type LucideIcon,
  MapPin,
  Sparkles,
  Star,
  TicketCheck,
  Wrench
} from "lucide-react";
import type { GuestCardConfig, GuestCardKind } from "@paris-local/shared";

const iconByName: Record<string, LucideIcon> = {
  ConciergeBell,
  MapPin,
  Sparkles,
  Star,
  TicketCheck,
  Wrench
};

const fallbackIconByKind: Record<GuestCardKind, LucideIcon> = {
  info: TicketCheck,
  service: ConciergeBell,
  guide: MapPin,
  promo: Sparkles,
  custom: Star
};

export function resolveGuestCardIcon(card: GuestCardConfig): LucideIcon {
  if (card.icon && iconByName[card.icon]) {
    return iconByName[card.icon];
  }
  return fallbackIconByKind[card.kind] ?? Star;
}

export function guestCardHasAction(card: GuestCardConfig): boolean {
  return card.actionType !== "none" && Boolean(card.actionTarget);
}
