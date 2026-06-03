import type { GuestCardConfig } from "@paris-local/shared";

export type GuestCardActionMode = "internal" | "external" | "service" | "none";

export type GuestCardAction = {
  mode: GuestCardActionMode;
  href?: string;
  onClick?: () => void;
  label: string;
};

const EXTERNAL_ACTION_DEFAULT_LABEL = "Ouvrir";
const INTERNAL_ACTION_DEFAULT_LABEL = "Voir";
const SERVICE_ACTION_DEFAULT_LABEL = "Demander";

export function isValidExternalUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

export function getActionLabel(card: GuestCardConfig): string {
  if (card.actionLabel && card.actionLabel.trim().length > 0) {
    return card.actionLabel;
  }
  switch (card.actionType) {
    case "external_url":
      return EXTERNAL_ACTION_DEFAULT_LABEL;
    case "service_request":
      return SERVICE_ACTION_DEFAULT_LABEL;
    case "section":
    case "none":
    default:
      return INTERNAL_ACTION_DEFAULT_LABEL;
  }
}

export type ResolveGuestCardActionOptions = {
  allowExternalLinks?: boolean;
  onAction: (card: GuestCardConfig) => void;
};

export function resolveGuestCardAction(
  card: GuestCardConfig,
  options: ResolveGuestCardActionOptions
): GuestCardAction {
  const label = getActionLabel(card);

  if (card.actionType === "none") {
    return { mode: "none", label };
  }

  const target = card.actionTarget;
  if (!target) {
    return { mode: "none", label };
  }

  if (card.actionType === "external_url") {
    if (options.allowExternalLinks === false) {
      return { mode: "none", label };
    }
    if (!isValidExternalUrl(target)) {
      return { mode: "none", label };
    }
    return { mode: "external", href: target, label };
  }

  if (card.actionType === "section" || card.actionType === "service_request") {
    return {
      mode: card.actionType === "service_request" ? "service" : "internal",
      onClick: () => options.onAction(card),
      label
    };
  }

  return { mode: "none", label };
}
