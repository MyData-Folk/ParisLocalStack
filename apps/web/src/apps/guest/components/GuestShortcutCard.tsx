import type { GuestCardConfig } from "@paris-local/shared";
import type { GuestTheme } from "../../../themes";
import { guestCardHasAction, resolveGuestCardIcon } from "../utils/guestCardIcons";

type GuestShortcutCardProps = {
  card: GuestCardConfig;
  theme: GuestTheme;
  onAction: (card: GuestCardConfig) => void;
};

export function GuestShortcutCard({ card, theme, onAction }: GuestShortcutCardProps) {
  const Icon = resolveGuestCardIcon(card);
  const clickable = guestCardHasAction(card);
  const ariaLabel = clickable ? `${card.title} — ${card.actionLabel ?? "Ouvrir"}` : card.title;

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

  const containerClass = `group block w-full rounded-2xl p-4 text-left transition focus:outline-none focus:ring-4 ${clickable ? `${theme.classes.secondaryButton} cursor-pointer` : `${theme.classes.card}`}`.trim();

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => onAction(card)}
        aria-label={ariaLabel}
        className={containerClass}
      >
        {inner}
      </button>
    );
  }

  return <div className={containerClass}>{inner}</div>;
}
