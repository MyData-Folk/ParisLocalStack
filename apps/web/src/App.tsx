import { Navigate, Route, Routes } from "react-router-dom";
import { AdminApp } from "./apps/admin/AdminApp";
import { GeneratorApp } from "./apps/generator/GeneratorApp";
import { GuestShell } from "./apps/guest/GuestShell";
import { ReceptionApp } from "./apps/reception/ReceptionApp";
import { extractHotelSlug } from "./lib/tenant";

export default function App() {
  const slug = extractHotelSlug();
  const isReceptionSubdomain = window.location.hostname.startsWith("admin.");

  if (isReceptionSubdomain) return <ReceptionApp basePath="" />;
  if (slug && !window.location.hostname.includes("localhost")) return <GuestShell />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/h/vendome/welcome" replace />} />
      <Route path="/h/:hotelSlug" element={<GuestShell />} />
      <Route path="/h/:hotelSlug/:section" element={<GuestShell />} />
      <Route path="/reception/*" element={<ReceptionApp basePath="/reception" />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/generator/*" element={<GeneratorApp />} />
      <Route path="*" element={<Navigate to="/h/vendome/welcome" replace />} />
    </Routes>
  );
}
