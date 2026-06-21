export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & { token?: string };
export type ApiUser = { id: string; email: string; name: string; role: string; status?: string; hotelIds: string[] };
export type ApiAuth = { token: string; user: ApiUser };
export type HotelPayload = {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status?: "active" | "inactive" | "draft";
};

export type SettingsPayload = {
  wifiName?: string;
  wifiPassword?: string;
  breakfastHours?: string;
  checkinTime?: string;
  checkoutTime?: string;
  roomServiceHours?: string;
  receptionPhone?: string;
  whatsappNumber?: string;
  guestTheme?: "parisian_boutique" | "modern_minimal" | "palace_luxury";
  languages?: string[];
  modules?: Record<string, boolean>;
};

export type PublicSettingsResponse = {
  id: string;
  hotelId: string;
  wifiName: string | null;
  breakfastHours: string | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  roomServiceHours: string | null;
  receptionPhone: string | null;
  guestTheme: string;
  languages: string[];
  modules: Record<string, boolean>;
  commercialPackage: CommercialPackageValue;
  limits: GuestCardPlanLimits;
  guestCards: GuestCardConfig[];
  hotelServiceLimits: HotelServicePlanLimits;
  enabledServices: HotelServiceConfig[];
  _meta?: {
    totalEnabled: number;
    heroCount: number;
    shortcutCount: number;
    services?: {
      totalEnabled: number;
      visibleInGuestApp: number;
      visibleAsCard: number;
      visibleInServicesPage: number;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type CommercialPackageValue = "starter" | "boutique" | "premium" | "palace";

export type GuestCardPlanLimits = {
  plan: CommercialPackageValue;
  maxHeroCards: number;
  maxShortcutCards: number;
  allowedKinds: string[];
  allowCustomImages: boolean;
  allowExternalLinks: boolean;
  maxImageMb: number;
};

export type GuestCardConfig = {
  id: string;
  slot: "hero" | "shortcut";
  slotIndex: number;
  kind: "info" | "service" | "guide" | "promo" | "custom";
  title: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  actionLabel?: string;
  actionType: "section" | "service_request" | "external_url" | "none";
  actionTarget?: string;
  enabled: boolean;
  locked?: boolean;
};

export type HotelPlanResponse = {
  hotelId: string;
  name: string;
  slug: string;
  commercialPackage: CommercialPackageValue;
  limits: GuestCardPlanLimits;
};

export type HotelGuestCardsResponse = {
  hotelId: string;
  commercialPackage: CommercialPackageValue;
  limits: GuestCardPlanLimits;
  guestCards: GuestCardConfig[];
};

export type HotelServicePlanLimits = {
  plan: CommercialPackageValue;
  maxActiveServices: number;
  allowedCategories: string[];
  allowWellness: boolean;
  allowCustomImages: boolean;
  allowCustomServices: boolean;
  allowPartnerServices: boolean;
  allowPremiumBranding: boolean;
};

export type HotelServiceConfig = {
  serviceCode: string;
  enabled: boolean;
  order: number;
  customTitle?: string;
  customDescription?: string;
  imageUrl?: string;
  visibleInGuestApp: boolean;
  visibleAsCard: boolean;
  visibleInServicesPage: boolean;
  actionLabel?: string;
};

export type HotelServicesResponse = {
  hotelId: string;
  commercialPackage: CommercialPackageValue;
  limits: HotelServicePlanLimits;
  enabledServices: HotelServiceConfig[];
};

export type RecommendationPayload = {
  category: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  distance?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  tags?: string[];
  openingHours?: string;
  googlePlaceId?: string;
  sortOrder?: number;
  isActive?: boolean;
  source?: string;
  isFeatured?: boolean;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "API request failed");
  return payload.data as T;
}

export const api = {
  login: (email: string, password: string) => request<ApiAuth>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }),
  me: (token: string) => request<ApiUser>("/api/auth/me", { token }),
  changeMyPassword: (body: { currentPassword: string; newPassword: string }, token: string) => request<{ passwordChanged: boolean }>("/api/auth/me/password", {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  logout: (token: string) => request<{ ok: boolean }>("/api/auth/logout", { method: "POST", token }),
  hotelBySlug: (slug: string) => request<any>(`/api/public/hotels/by-slug/${slug}`),
  settings: (slug: string) => request<PublicSettingsResponse>(`/api/public/${slug}/settings`),
  recommendations: (slug: string) => request<any[]>(`/api/public/${slug}/recommendations`),
  createGuest: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/guests`, { method: "POST", body: JSON.stringify(body) }),
  createStay: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/stays`, { method: "POST", body: JSON.stringify(body) }),
  createMessage: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/messages`, { method: "POST", body: JSON.stringify(body) }),
  guestMessages: (slug: string, session: { guestId: string; stayId: string }) => request<any[]>(
    `/api/public/${slug}/messages?${new URLSearchParams(session).toString()}`
  ),
  createRequest: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/requests`, { method: "POST", body: JSON.stringify(body) }),
  guestRequests: (slug: string, session: { guestId: string; stayId: string }) => request<any[]>(
    `/api/public/${slug}/requests?${new URLSearchParams(session).toString()}`
  ),
  createReview: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/reviews`, { method: "POST", body: JSON.stringify(body) }),
  guestReview: (slug: string, session: { guestId: string; stayId: string }) => request<any>(
    `/api/public/${slug}/reviews/current?${new URLSearchParams(session).toString()}`
  ),
  publishedReviews: (slug: string) => request<any[]>(`/api/public/${slug}/reviews/published`),
  hotelMessages: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/messages`, { token }),
  sendHotelMessage: (hotelId: string, body: { guestId: string; stayId?: string; content: string; priority?: "low" | "medium" | "high" | "urgent" }, token: string) => request<any>(`/api/hotels/${hotelId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify(body)
  }),
  hotelRequests: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/requests`, { token }),
  hotelRecommendations: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/recommendations`, { token }),
  createRecommendation: (hotelId: string, body: RecommendationPayload, token: string) => request<any>(`/api/hotels/${hotelId}/recommendations`, {
    method: "POST",
    token,
    body: JSON.stringify(body)
  }),
  updateRecommendation: (recommendationId: string, body: Partial<RecommendationPayload>, token: string) => request<any>(`/api/recommendations/${recommendationId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  deleteRecommendation: (recommendationId: string, token: string) => request<{ ok: boolean }>(`/api/recommendations/${recommendationId}`, {
    method: "DELETE",
    token
  }),
  hotelGuests: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/guests`, { token }),
  hotelStays: (hotelId: string, token: string, status?: "active" | "archived") => request<any[]>(
    `/api/hotels/${hotelId}/stays${status ? `?status=${status}` : ""}`,
    { token }
  ),
  hotelReviews: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/reviews`, { token }),
  hotels: (token: string) => request<any[]>("/api/hotels", { token }),
  hotel: (hotelId: string, token: string) => request<any>(`/api/hotels/${hotelId}`, { token }),
  getHotelPlan: (hotelId: string, token: string) => request<HotelPlanResponse>(`/api/hotels/${hotelId}/plan`, { token }),
  updateHotelPlan: (hotelId: string, commercialPackage: CommercialPackageValue, token: string) => request<HotelPlanResponse>(`/api/hotels/${hotelId}/plan`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ commercialPackage })
  }),
  getHotelGuestCards: (hotelId: string, token: string) => request<HotelGuestCardsResponse>(`/api/hotels/${hotelId}/guest-cards`, { token }),
  updateHotelGuestCards: (hotelId: string, guestCards: GuestCardConfig[], token: string) => request<HotelGuestCardsResponse>(`/api/hotels/${hotelId}/guest-cards`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ guestCards })
  }),
  getHotelServices: (hotelId: string, token: string) => request<HotelServicesResponse>(`/api/hotels/${hotelId}/services`, { token }),
  updateHotelServices: (hotelId: string, enabledServices: HotelServiceConfig[], token: string) => request<HotelServicesResponse>(`/api/hotels/${hotelId}/services`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ enabledServices })
  }),
  createHotel: (body: HotelPayload, token: string) => request<any>("/api/hotels", {
    method: "POST",
    token,
    body: JSON.stringify(body)
  }),
  updateHotel: (hotelId: string, body: Partial<HotelPayload>, token: string) => request<any>(`/api/hotels/${hotelId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  createReceptionUser: (hotelId: string, body: { email?: string; password?: string; name?: string }, token: string) => request<any>(`/api/hotels/${hotelId}/reception-user`, {
    method: "POST",
    token,
    body: JSON.stringify(body)
  }),
  hotelUsers: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/users`, { token }),
  updateHotelUser: (hotelId: string, userId: string, body: { email?: string; password?: string; name?: string; role?: string; status?: string }, token: string) => request<any>(`/api/hotels/${hotelId}/users/${userId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  hotelFiles: (hotelId: string, token: string) => request<any[]>(`/api/storage/hotels/${hotelId}/files`, { token }),
  uploadHotelFile: (hotelId: string, file: File, token: string) => {
    const body = new FormData();
    body.append("file", file);
    return request<any>(`/api/storage/hotels/${hotelId}/upload`, { method: "POST", token, body });
  },
  addHotelFileUrl: (hotelId: string, body: { url: string; originalName?: string }, token: string) => request<any>(`/api/storage/hotels/${hotelId}/files/url`, {
    method: "POST",
    token,
    body: JSON.stringify(body)
  }),
  deleteFile: (fileId: string, token: string) => request<{ ok: boolean }>(`/api/storage/${fileId}`, { method: "DELETE", token }),
  hotelSettings: (hotelId: string, token: string) => request<any>(`/api/hotels/${hotelId}/settings`, { token }),
  updateHotelSettings: (hotelId: string, body: SettingsPayload, token: string) => request<any>(`/api/hotels/${hotelId}/settings`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  replyMessage: (messageId: string, content: string, token: string) => request<any>(`/api/messages/${messageId}/reply`, {
    method: "POST",
    token,
    body: JSON.stringify({ content })
  }),
  updateMessageStatus: (messageId: string, status: string, token: string) => request<any>(`/api/messages/${messageId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status })
  }),
  updateRequestStatus: (requestId: string, status: string, token: string) => request<any>(`/api/requests/${requestId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status })
  }),
  updateStay: (stayId: string, body: unknown, token: string) => request<any>(`/api/stays/${stayId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  updateGuestCrm: (guestId: string, body: unknown, token: string) => request<any>(`/api/guests/${guestId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body)
  }),
  updateReviewStatus: (reviewId: string, status: string, token: string) => request<any>(`/api/reviews/${reviewId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status })
  }),
  hotelAnalytics: (hotelId: string, token: string) => request<{
    events: number;
    guests: number;
    messages: number;
    requests: number;
    reviews: number;
    avgRating: number;
  }>(`/api/hotels/${hotelId}/analytics`, { token })
};
