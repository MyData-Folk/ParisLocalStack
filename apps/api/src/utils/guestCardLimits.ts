import {
  getGuestCardPlanLimits,
  type CommercialPackage,
  type GuestCardConfig,
  type GuestCardPlanLimits
} from "@paris-local/shared";

export type GuestCardLimitError = {
  code:
    | "too_many_hero"
    | "too_many_shortcut"
    | "kind_not_allowed"
    | "custom_image_not_allowed"
    | "external_link_not_allowed"
    | "duplicate_slot_index"
    | "invalid_slot_index";
  message: string;
  cardId?: string;
};

export type GuestCardLimitResult = {
  ok: boolean;
  errors: GuestCardLimitError[];
  limits: GuestCardPlanLimits;
};

export function enforceGuestCardPlanLimits(
  cards: GuestCardConfig[],
  plan: CommercialPackage
): GuestCardLimitResult {
  const limits = getGuestCardPlanLimits(plan);
  const errors: GuestCardLimitError[] = [];

  const heroCount = cards.filter((c) => c.slot === "hero").length;
  if (heroCount > limits.maxHeroCards) {
    errors.push({
      code: "too_many_hero",
      message: `Plan "${plan}" allows at most ${limits.maxHeroCards} hero cards (got ${heroCount}).`
    });
  }

  const shortcutCount = cards.filter((c) => c.slot === "shortcut").length;
  if (shortcutCount > limits.maxShortcutCards) {
    errors.push({
      code: "too_many_shortcut",
      message: `Plan "${plan}" allows at most ${limits.maxShortcutCards} shortcut cards (got ${shortcutCount}).`
    });
  }

  const seen = new Set<string>();
  for (const card of cards) {
    const key = `${card.slot}:${card.slotIndex}`;
    if (seen.has(key)) {
      errors.push({
        code: "duplicate_slot_index",
        message: `Duplicate slot index ${card.slotIndex} in slot "${card.slot}".`,
        cardId: card.id
      });
    }
    seen.add(key);
  }

  for (const card of cards) {
    if (!limits.allowedKinds.includes(card.kind)) {
      errors.push({
        code: "kind_not_allowed",
        message: `Plan "${plan}" does not allow card kind "${card.kind}".`,
        cardId: card.id
      });
    }

    if (card.imageUrl && !limits.allowCustomImages) {
      errors.push({
        code: "custom_image_not_allowed",
        message: `Plan "${plan}" does not allow custom images.`,
        cardId: card.id
      });
    }

    if (card.actionType === "external_url" && !limits.allowExternalLinks) {
      errors.push({
        code: "external_link_not_allowed",
        message: `Plan "${plan}" does not allow external links.`,
        cardId: card.id
      });
    }
  }

  return { ok: errors.length === 0, errors, limits };
}
