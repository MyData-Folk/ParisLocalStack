import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Sparkles, BarChart3 } from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";
import { api } from "../../lib/api";
import { useAppStore } from "../../stores/appStore";
import { HotelAdminShell } from "./HotelAdminShell";
import { HotelAdminDashboard } from "./HotelAdminDashboard";
import { HotelAdminRecommendationsPage } from "./pages/HotelAdminRecommendationsPage";
import { HotelAdminQRPage } from "./pages/HotelAdminQRPage";
import { HotelAdminProfilePage } from "./pages/HotelAdminProfilePage";
import { HotelAdminSettingsPage } from "./pages/HotelAdminSettingsPage";

export function HotelAdminApp() {
  const { token, currentUser } = useAppStore();
  const [activeHotel, setActiveHotel] = useState<any>(null);
  const [activeHotelId, setActiveHotelId] = useState<string>("");
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [errorHotel, setErrorHotel] = useState("");

  const isSuperAdmin = currentUser?.role === "super_admin";

  useEffect(() => {
    if (!token || !currentUser) return;

    if (isSuperAdmin) {
      setLoadingHotel(true);
      api.hotels(token)
        .then((allHotels) => {
          setAvailableHotels(allHotels);
          if (allHotels.length === 0) {
            setActiveHotel(null);
            setActiveHotelId("");
            setErrorHotel("Aucun hotel n'est disponible.");
            return;
          }
          const defaultId = currentUser.hotelIds[0] && allHotels.some((h) => h.id === currentUser.hotelIds[0])
            ? currentUser.hotelIds[0]
            : allHotels[0].id;
          setActiveHotelId(defaultId);
          return loadHotel(defaultId, token);
        })
        .catch(() => {
          setAvailableHotels([]);
          setActiveHotel(null);
          setActiveHotelId("");
          setErrorHotel("Impossible de charger la liste des hotels.");
        })
        .finally(() => setLoadingHotel(false));
    } else {
      const hotelId = currentUser.hotelIds[0];
      if (!hotelId) {
        setErrorHotel("Aucun hotel n'est associe a ce compte.");
        setLoadingHotel(false);
        return;
      }
      setActiveHotelId(hotelId);
      loadHotel(hotelId, token).finally(() => setLoadingHotel(false));
    }
  }, [token, currentUser, isSuperAdmin]);

  async function loadHotel(hotelId: string, tok: string) {
    if (!hotelId) { setActiveHotel(null); return; }
    setErrorHotel("");
    try {
      const hotel = await api.hotel(hotelId, tok);
      setActiveHotel(hotel);
    } catch {
      setErrorHotel("Impossible de charger l'hotel.");
      setActiveHotel(null);
    }
  }

  useEffect(() => {
    if (!token || !activeHotelId) return;
    loadHotel(activeHotelId, token);
  }, [activeHotelId, token]);

  return (
    <AuthGate title="Admin Hotel" subtitle="Espace de gestion de votre etablissement" allowedRoles={["super_admin", "hotel_admin"]}>
      {loadingHotel ? (
        <div className="grid min-h-screen place-items-center bg-[#09090b]">
          <div className="rounded-2xl border border-white/10 bg-[#111115] p-8 text-center">
            <p className="text-sm text-slate-400">Chargement de l'hotel...</p>
          </div>
        </div>
      ) : errorHotel ? (
        <div className="grid min-h-screen place-items-center bg-[#09090b]">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
            <p className="text-sm text-red-200">{errorHotel}</p>
          </div>
        </div>
      ) : (
        <HotelAdminShell
          activeHotel={activeHotel}
          activeHotelId={activeHotelId}
          availableHotels={availableHotels}
          isSuperAdminView={isSuperAdmin}
          onHotelChange={setActiveHotelId}
        >
          <Routes>
            <Route path="/" element={<HotelAdminDashboard hotel={activeHotel} hotelId={activeHotelId} />} />
            <Route path="/profile" element={<HotelAdminProfilePage hotel={activeHotel} hotelId={activeHotelId} token={token!} onHotelUpdated={setActiveHotel} />} />
            <Route path="/recommendations" element={<HotelAdminRecommendationsPage hotelId={activeHotelId} token={token!} />} />
            <Route path="/settings" element={<HotelAdminSettingsPage hotelId={activeHotelId} token={token!} />} />
            <Route path="/modules" element={<SectionPlaceholder icon={<Sparkles className="h-5 w-5" />} title="Modules & offre" />} />
            <Route path="/analytics" element={<SectionPlaceholder icon={<BarChart3 className="h-5 w-5" />} title="Analytics" />} />
            <Route path="/qr" element={<HotelAdminQRPage hotelId={activeHotelId} token={token!} />} />
            <Route path="*" element={<Navigate to="/hotel-admin" replace />} />
          </Routes>
        </HotelAdminShell>
      )}
    </AuthGate>
  );
}

function SectionPlaceholder({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-12 text-center shadow-lg shadow-black/20">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{icon}</span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Section en preparation.</p>
      </div>
    </div>
  );
}