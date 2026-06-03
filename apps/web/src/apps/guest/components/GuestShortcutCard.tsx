import type { GuestCardConfig } from "@paris-local/shared";
import type { GuestTheme } from "../../../themes";
import { resolveGuestCardIcon } from "../utils/guestCardIcons";
import { resolveGuestCardAction } from "../utils/guestCardActions";

type GuestShortcutCardProps = {
  card: GuestCardConfig;
  theme: GuestTheme;
  onAction: (card: GuestCardConfig) => void;
  allowExternalLinks?: boolean;
};

export function GuestShortcutCard({ card, theme, onAction, allowExternalLinks = false }: GuestShortcutCardProps) {
  const Icon = resolveGuestCardIcon(card);
  const action = resolveGuestCardAction(card, { onAction, allowExternalLinks });
  const interactive = action.mode !== "none";
  const ariaLabel = interactive ? `${card.title} — ${action.label}` : card.title;

  const inner = (
    <>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${theme.classes.iconSoft}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="truncate font-semibold">{card.title}</p>
      {card.description ? (
        <p className={`mt-1 line-clamp-2 text-xs leading-5 ${theme.classes.muted}`}>{card.description}</p>
      ) : null}
    </>
  );

  const containerClass = `group block w-full rounded-2xl p-4 text-left transition focus:outline-none focus:ring-4 ${interactive ? `${theme.classes.secondaryButton} cursor-pointer` : `${theme.classes.card}`}`.trim();

  if (action.mode === "external" && action.href) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={`${containerClass} no-underline`}
      >
        {inner}
      </a>
    );
  }

  if (action.mode === "internal" || action.mode === "service") {
    return (
      <button
        type="button"
        onClick={action.onClick}
        aria-label={ariaLabel}
        className={containerClass}
      >
        {inner}
      </button>
    );
  }

  return <div className={containerClass}>{inner}</div>;
}
