import { ChevronRight } from "lucide-react";
import type { GuestCardConfig } from "@paris-local/shared";
import type { GuestTheme } from "../../../themes";
import { GuestCardImage } from "./GuestCardImage";
import { guestCardHasAction, resolveGuestCardIcon } from "../utils/guestCardIcons";

type GuestHeroCardProps = {
  card: GuestCardConfig;
  theme: GuestTheme;
  onAction: (card: GuestCardConfig) => void;
};

export function GuestHeroCard({ card, theme, onAction }: GuestHeroCardProps) {
  const Icon = resolveGuestCardIcon(card);
  const clickable = guestCardHasAction(card);
  const ariaLabel = clickable ? `${card.title} — ${card.actionLabel ?? "Ouvrir"}` : card.title;

  const content = (
    <>
      <div className="relative">
        <GuestCardImage
          src={card.imageUrl}
          alt={card.title}
          fallbackIcon={Icon}
          iconTileClassName={theme.classes.iconTile}
          rounded="top"
        />
        <div className="pointer-events-none absolute inset-0 rounded-t-3xl bg-gradient-to-b from-transparent to-black/30" />
      </div>
      <div className="p-5">
        <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.eyebrow}`}>
          {kindLabel(card.kind)}
        </p>
        <h3 className={`mt-1 text-xl font-semibold tracking-tight ${theme.classes.title}`}>{card.title}</h3>
        {card.description ? (
          <p className={`mt-2 line-clamp-2 text-sm leading-6 ${theme.classes.muted}`}>{card.description}</p>
        ) : null}
        {clickable ? (
          <span className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold ${theme.classes.primaryButton}`}>
            {card.actionLabel ?? "Voir"}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </>
  );

  const containerClass = `block overflow-hidden rounded-3xl shadow-lg ${theme.classes.elevatedCard} ${clickable ? "transition focus:outline-none focus:ring-4 focus:ring-[#b8973a]/30" : ""}`.trim();

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => onAction(card)}
        aria-label={ariaLabel}
        className={`${containerClass} w-full text-left`}
      >
        {content}
      </button>
    );
  }

  return <div className={containerClass}>{content}</div>;
}

function kindLabel(kind: GuestCardConfig["kind"]): string {
  switch (kind) {
    case "info":
      return "Information";
    case "service":
      return "Service";
    case "guide":
      return "Guide local";
    case "promo":
      return "Offre";
    case "custom":
      return "À la une";
    default:
      return "";
  }
}
