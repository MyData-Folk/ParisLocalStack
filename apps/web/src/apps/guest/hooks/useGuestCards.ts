import type { GuestCardConfig, GuestCardPlanLimits } from "@paris-local/shared";
import type { PublicSettingsResponse } from "../../../lib/api";

export type UseGuestCardsResult = {
  heroCards: GuestCardConfig[];
  shortcutCards: GuestCardConfig[];
  limits: GuestCardPlanLimits | null;
  hasCards: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickLimits(value: unknown): GuestCardPlanLimits | null {
  if (!isObject(value)) return null;
  if (typeof value.maxHeroCards !== "number" || typeof value.maxShortcutCards !== "number") return null;
  return value as unknown as GuestCardPlanLimits;
}

function pickGuestCards(value: unknown): GuestCardConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter((card): card is GuestCardConfig => {
    if (!isObject(card)) return false;
    if (card.enabled !== true) return false;
    if (card.slot !== "hero" && card.slot !== "shortcut") return false;
    if (typeof card.id !== "string" || typeof card.title !== "string") return false;
    return true;
  });
}

export function useGuestCards(settings: PublicSettingsResponse | null | undefined): UseGuestCardsResult {
  if (!isObject(settings)) {
    return { heroCards: [], shortcutCards: [], limits: null, hasCards: false };
  }

  const limits = pickLimits(settings.limits);
  const allCards = pickGuestCards(settings.guestCards);

  if (allCards.length === 0 || !limits) {
    return { heroCards: [], shortcutCards: [], limits, hasCards: false };
  }

  const sorted = [...allCards].sort((a, b) => a.slotIndex - b.slotIndex);
  const hero = sorted.filter((c) => c.slot === "hero").slice(0, limits.maxHeroCards);
  const shortcut = sorted.filter((c) => c.slot === "shortcut").slice(0, limits.maxShortcutCards);

  return {
    heroCards: hero,
    shortcutCards: shortcut,
    limits,
    hasCards: hero.length + shortcut.length > 0
  };
}
