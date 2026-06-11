import { Navigate, Route, Routes } from "react-router-dom";
import { AdminApp } from "./apps/admin/AdminApp";
import { GeneratorApp } from "./apps/generator/GeneratorApp";
import { GuestShell } from "./apps/guest/GuestShell";
import { HotelAdminApp } from "./apps/hotelAdmin/HotelAdminApp";
import { ReceptionApp } from "./apps/reception/ReceptionApp";
import { canonicalGuestUrl, resolveTenantFromHostname } from "./lib/tenant";

export default function App() {
  const tenant = resolveTenantFromHostname();
  const canonicalUrl = canonicalGuestUrl();

  if (canonicalUrl) {
    window.location.replace(canonicalUrl);
    return null;
  }

  if (tenant.kind === "reception") return <ReceptionApp basePath="" />;
  if (tenant.kind === "hotelAdmin") return <HotelAdminApp />;
  if (tenant.kind === "guest") return <GuestShell />;

  return (
    <Routes>
      <Route path="/" element={<AdminApp />} />
      <Route path="/h/:hotelSlug" element={<GuestShell />} />
      <Route path="/h/:hotelSlug/:section" element={<GuestShell />} />
      <Route path="/reception/*" element={<ReceptionApp basePath="/reception" />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/hotel-admin/*" element={<HotelAdminApp />} />
      <Route path="/generator/*" element={<GeneratorApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
