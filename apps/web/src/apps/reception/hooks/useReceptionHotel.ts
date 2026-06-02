import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { neutralDemoHotelSlug, resolveTenantFromHostname } from "../../../lib/tenant";

export function useReceptionHotel(currentUser: any, token: string | null, logout: () => void | Promise<void>) {
  const tenant = resolveTenantFromHostname();
  const hotelSlug = tenant.kind === "reception" ? tenant.hotelSlug : null;
  const [hotel, setHotel] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !currentUser) return;
    setIsLoading(true);
    setError("");
    const loader = hotelSlug
      ? api.hotelBySlug(hotelSlug)
      : currentUser.role === "super_admin"
        ? api.hotelBySlug(neutralDemoHotelSlug)
      : currentUser.hotelIds[0]
        ? api.hotel(currentUser.hotelIds[0], token)
        : Promise.resolve(null);
    void loader
      .then((loadedHotel) => {
        if (!loadedHotel) {
          setHotel(null);
          setError("Aucun hotel associe a ce compte.");
          return;
        }
        const allowed = currentUser.role === "super_admin" || currentUser.hotelIds.includes(loadedHotel.id);
        if (!allowed) {
          setHotel(null);
          sessionStorage.setItem(
            "auth-notice",
            `La session precedente appartenait a un autre hotel. Elle a ete nettoyee pour ${loadedHotel.name}. Reconnectez-vous avec le compte reception de cet hotel.`
          );
          void logout();
          setError("");
          return;
        }
        setHotel(loadedHotel);
      })
      .catch(() => {
        setHotel(null);
        setError(hotelSlug ? `Hotel introuvable pour le sous-domaine admin-${hotelSlug}.` : "Impossible de charger le contexte hotel.");
      })
      .finally(() => setIsLoading(false));
  }, [token, currentUser?.id, currentUser?.role, currentUser?.hotelIds.join(","), hotelSlug]);

  return { hotelSlug, hotel, isLoading, error };
}
