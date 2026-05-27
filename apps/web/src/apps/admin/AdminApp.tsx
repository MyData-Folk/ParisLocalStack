import { Navigate, Route, Routes } from "react-router-dom";
import { QrCode, Settings, SlidersHorizontal, Sparkles } from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminHotelsPage } from "./pages/AdminHotelsPage";
import { AdminCreateHotelPage } from "./pages/AdminCreateHotelPage";
import { AdminHotelDetailPage } from "./pages/AdminHotelDetailPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminPlaceholder } from "./components/AdminSharedUI";

export function AdminApp() {
  return (
    <AuthGate title="Connexion admin" subtitle="Acces securise a l'administration plateforme" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="/hotels" element={<AdminHotelsPage />} />
        <Route path="/hotels/new" element={<AdminCreateHotelPage />} />
        <Route path="/hotels/:hotelId" element={<AdminHotelDetailPage />} />
        <Route path="/users" element={<AdminUsersPage />} />
        <Route path="/qr-codes" element={<AdminPlaceholder title="QR Codes" description="Centralisation des supports QR hotels. Les exports PDF restent disponibles dans chaque fiche hotel." icon={<QrCode className="h-5 w-5" />} />} />
        <Route path="/deployments" element={<AdminPlaceholder title="Deploiements" description="Suivi Coolify et releases multi-tenant. Les domaines restent geres dans Coolify." icon={<Sparkles className="h-5 w-5" />} />} />
        <Route path="/settings" element={<AdminPlaceholder title="Parametres" description="Preferences globales de plateforme et gouvernance operationnelle." icon={<Settings className="h-5 w-5" />} />} />
        <Route path="/integrations" element={<AdminPlaceholder title="Integrations" description="Connecteurs DNS, stockage, monitoring et outils externes de la plateforme." icon={<SlidersHorizontal className="h-5 w-5" />} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthGate>
  );
}
