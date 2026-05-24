const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & { token?: string };

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
  login: (email: string, password: string) => request<{ token: string; user: { id: string; name: string; role: string; hotelIds: string[] } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }),
  hotelBySlug: (slug: string) => request<any>(`/api/public/hotels/by-slug/${slug}`),
  settings: (slug: string) => request<any>(`/api/public/${slug}/settings`),
  recommendations: (slug: string) => request<any[]>(`/api/public/${slug}/recommendations`),
  createGuest: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/guests`, { method: "POST", body: JSON.stringify(body) }),
  createStay: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/stays`, { method: "POST", body: JSON.stringify(body) }),
  createMessage: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/messages`, { method: "POST", body: JSON.stringify(body) }),
  createRequest: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/requests`, { method: "POST", body: JSON.stringify(body) }),
  createReview: (slug: string, body: unknown) => request<any>(`/api/public/${slug}/reviews`, { method: "POST", body: JSON.stringify(body) }),
  hotelMessages: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/messages`, { token }),
  hotelRequests: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/requests`, { token }),
  hotelGuests: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/guests`, { token }),
  hotelReviews: (hotelId: string, token: string) => request<any[]>(`/api/hotels/${hotelId}/reviews`, { token }),
  hotels: (token: string) => request<any[]>("/api/hotels", { token }),
  replyMessage: (messageId: string, content: string, token: string) => request<any>(`/api/messages/${messageId}/reply`, {
    method: "POST",
    token,
    body: JSON.stringify({ content })
  })
};
