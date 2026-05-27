import type { HotelPayload } from "../../lib/api";
import type { GuestThemeId } from "../../themes";

export type HotelRecord = HotelPayload & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  settings?: { guestTheme?: GuestThemeId } | null;
  users?: AdminHotelUser[];
};

export type AdminHotelUser = {
  id: string;
  hotelId: string;
  userId: string;
  role: string;
  createdAt?: string;
  hotel?: { id: string; name: string; slug: string };
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type RecommendationFormState = {
  category: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  distance: string;
  imageUrl: string;
  tags: string;
  openingHours: string;
  sortOrder: string;
  isFeatured: boolean;
  isActive: boolean;
};

export const emptyRecommendationForm: RecommendationFormState = {
  category: "restaurants",
  name: "",
  description: "",
  address: "",
  phone: "",
  website: "",
  distance: "",
  imageUrl: "",
  tags: "",
  openingHours: "",
  sortOrder: "0",
  isFeatured: false,
  isActive: true
};

export function normalizeRecommendationForm(form: RecommendationFormState) {
  return {
    category: form.category,
    name: form.name,
    description: form.description,
    address: form.address,
    phone: form.phone,
    website: form.website,
    distance: form.distance,
    imageUrl: form.imageUrl,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    openingHours: form.openingHours,
    sortOrder: Number(form.sortOrder || 0),
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    source: "manual"
  };
}
