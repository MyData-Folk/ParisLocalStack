import type { HotelPayload, SettingsPayload } from "./api";

export type HotelFormState = HotelPayload;
export type SettingsFormState = Required<Pick<SettingsPayload, "wifiName" | "wifiPassword" | "breakfastHours" | "checkinTime" | "checkoutTime" | "roomServiceHours" | "receptionPhone" | "whatsappNumber">> & {
  languages: string[];
  modules: Record<string, boolean>;
};

export const platformDomain = "welcomeparis.hotelmanager.fr";

export const emptyHotelForm: HotelFormState = {
  name: "",
  slug: "",
  description: "",
  address: "",
  city: "Paris",
  country: "France",
  phone: "",
  email: "",
  website: "",
  logoUrl: "",
  primaryColor: "#c9a84c",
  secondaryColor: "#0f172a",
  status: "active"
};

export const defaultSettingsForm: SettingsFormState = {
  wifiName: "",
  wifiPassword: "",
  breakfastHours: "07:00 - 10:30",
  checkinTime: "15:00",
  checkoutTime: "12:00",
  roomServiceHours: "18:00 - 22:30",
  receptionPhone: "",
  whatsappNumber: "",
  languages: ["fr", "en"],
  modules: {
    guide: true,
    services: true,
    messages: true,
    requests: true,
    reviews: true,
    recommendations: true
  }
};

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function guestUrl(slug: string) {
  return `https://${slug}.${platformDomain}`;
}

export function receptionUrl(slug: string) {
  return `https://admin-${slug}.${platformDomain}`;
}

export function normalizeHotelPayload(form: HotelFormState): HotelPayload {
  return {
    ...form,
    slug: slugify(form.slug || form.name),
    website: form.website?.trim() || "",
    logoUrl: form.logoUrl?.trim() || undefined
  };
}

export function normalizeSettingsPayload(form: SettingsFormState): SettingsPayload {
  return {
    ...form,
    wifiName: form.wifiName.trim() || undefined,
    wifiPassword: form.wifiPassword.trim() || undefined,
    receptionPhone: form.receptionPhone.trim() || undefined,
    whatsappNumber: form.whatsappNumber.trim() || undefined
  };
}
