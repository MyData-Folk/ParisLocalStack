export const guestThemeIds = ["parisian_boutique", "modern_minimal", "palace_luxury"] as const;

export type GuestThemeId = (typeof guestThemeIds)[number];

export type GuestTheme = {
  id: GuestThemeId;
  name: string;
  description: string;
  mood: string;
  preview: string;
  classes: {
    app: string;
    shell: string;
    header: string;
    headerOverlay: string;
    card: string;
    elevatedCard: string;
    subtleCard: string;
    title: string;
    text: string;
    muted: string;
    eyebrow: string;
    iconTile: string;
    iconSoft: string;
    primaryButton: string;
    secondaryButton: string;
    input: string;
    checkbox: string;
    nav: string;
    navActive: string;
    navIdle: string;
    chipActive: string;
    chipIdle: string;
    messageGuest: string;
    messageReception: string;
    statusNew: string;
    statusProgress: string;
    statusDone: string;
    statusUrgent: string;
  };
};
