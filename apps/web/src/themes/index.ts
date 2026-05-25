import { modernMinimalTheme } from "./modern-minimal";
import { palaceLuxuryTheme } from "./palace-luxury";
import { parisianBoutiqueTheme } from "./parisian-boutique";
import { guestThemeIds, type GuestTheme, type GuestThemeId } from "./types";

export { guestThemeIds, type GuestTheme, type GuestThemeId };

export const guestThemes: Record<GuestThemeId, GuestTheme> = {
  parisian_boutique: parisianBoutiqueTheme,
  modern_minimal: modernMinimalTheme,
  palace_luxury: palaceLuxuryTheme
};

export const defaultGuestThemeId: GuestThemeId = "parisian_boutique";

export function isGuestThemeId(value: unknown): value is GuestThemeId {
  return typeof value === "string" && guestThemeIds.includes(value as GuestThemeId);
}

export function resolveGuestTheme(value: unknown): GuestTheme {
  return guestThemes[isGuestThemeId(value) ? value : defaultGuestThemeId];
}

export function guestThemeLabel(value: unknown) {
  return resolveGuestTheme(value).name;
}
