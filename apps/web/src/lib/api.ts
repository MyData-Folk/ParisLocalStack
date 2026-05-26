export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & { token?: string };
export type ApiUser = { id: string; email: string; name: string; role: string; hotelIds: string[] };
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
  logout: (token: string) => request<{ ok: boolean }>("/api/auth/logout", { method: "POST", token }),
  hotelBySlug: (slug: string) => request<any>(`/api/public/hotels/by-slug/${slug}`),
  settings: (slug: string) => request<any>(`/api/public/${slug}/settings`),
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
  })
};
