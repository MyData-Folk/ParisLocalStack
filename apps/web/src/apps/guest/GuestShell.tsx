import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Bell,
  CalendarDays,
  Car,
  CheckCircle,
  ChevronRight,
  Clock,
  Coffee,
  ConciergeBell,
  Home,
  Hotel,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  TicketCheck,
  Utensils,
  Waves,
  Wifi,
  Wrench,
  X
} from "lucide-react";
import { API_URL, api, type PublicSettingsResponse } from "../../lib/api";
import { resolveTenantFromHostname, routeHotelSlug } from "../../lib/tenant";
import { resolveGuestTheme, type GuestTheme } from "../../themes";
import type { GuestCardConfig } from "@paris-local/shared";
import { useGuestCards } from "./hooks/useGuestCards";
import { useEnabledServices, type GuestEnabledService } from "./hooks/useEnabledServices";
import { GuestHeroCard } from "./components/GuestHeroCard";
import { GuestShortcutCard } from "./components/GuestShortcutCard";

type Session = { guestId: string; stayId: string; roomNumber: string; firstName?: string; lastName?: string };
type GuestSection = "welcome" | "home" | "guide" | "services" | "messages" | "review";
type MessageItem = {
  id: string;
  guestId: string;
  stayId: string;
  senderType: "guest" | "reception";
  content: string;
  status?: string;
  priority?: string;
  createdAt: string;
};
type RequestItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  details?: Record<string, unknown>;
  createdAt: string;
};
type RequestDetails = Record<string, string | number | boolean | undefined>;
type GuestLoadState = { kind: "loading"; message: string } | { kind: "error" } | null;

const heroImage = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80";
const GuestThemeContext = React.createContext<GuestTheme>(resolveGuestTheme(undefined));

function useGuestTheme() {
  return React.useContext(GuestThemeContext);
}

export function GuestShell() {
  const { hotelSlug: pathSlug } = useParams();
  const location = useLocation();
  const hotelSlug = routeHotelSlug(pathSlug);
  const tenant = resolveTenantFromHostname();
  const basePath = tenant.kind === "guest" ? "" : `/h/${hotelSlug}`;
  const section = getSection(location.pathname, basePath, Boolean(pathSlug));

  const [hotel, setHotel] = useState<any>(null);
  const [settings, setSettings] = useState<PublicSettingsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [session, setSession] = useState<Session | null>(() => readGuestSession(hotelSlug));
  const [loadState, setLoadState] = useState<GuestLoadState>({ kind: "loading", message: "Chargement de votre concierge..." });
  const [toast, setToast] = useState("");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeService, setActiveService] = useState<ServiceTemplate | null>(null);
  const guestCardsData = useGuestCards(settings);
  const enabledServicesData = useEnabledServices(settings);
  const serviceTemplatesForGuest = resolveServiceTemplates(enabledServicesData.services, enabledServicesData.hasDynamicServices);
  const navigate = useNavigate();

  const handleGuestCardAction = (card: GuestCardConfig) => {
    const target = card.actionTarget;
    if (!target) return;
    if (card.actionType === "section") {
      const path = basePath ? `${basePath}/${target.replace(/^\/+/, "")}` : `/${target.replace(/^\/+/, "")}`;
      navigate(path);
      return;
    }
    if (card.actionType === "service_request") {
      const template = serviceTemplatesForGuest.find(
        (t) => t.id === target || t.type === target
      );
      if (template) setActiveService(template);
    }
  };

  useEffect(() => {
    let mounted = true;
    setSession(readGuestSession(hotelSlug));
    Promise.all([api.hotelBySlug(hotelSlug), api.settings(hotelSlug), api.recommendations(hotelSlug)])
      .then(([hotelData, settingsData, recs]) => {
        if (!mounted) return;
        setHotel(hotelData);
        setSettings(settingsData);
        setRecommendations(recs);
        setLoadState(null);
      })
      .catch(() => mounted && setLoadState({ kind: "error" }));

    return () => { mounted = false; };
  }, [hotelSlug]);

  useEffect(() => {
    if (!session) return;
    void loadGuestTimeline(hotelSlug, session, setMessages, setRequests);
  }, [hotelSlug, session?.guestId, session?.stayId]);

  useEffect(() => {
    if (!session || !hotel?.id) return undefined;

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      withCredentials: true,
      auth: {
        guestId: session.guestId,
        stayId: session.stayId,
        hotelId: hotel.id
      }
    });
    const joinGuestRoom = () => socket.emit("hotel:join", hotel.id);
    const onMessage = (message: MessageItem) => {
      if (message.guestId !== session.guestId || message.stayId !== session.stayId) return;
      setMessages((current) => upsertById(current, message).sort(sortByCreatedAtAsc));
      if (message.senderType === "reception") {
        if (section !== "messages") setUnreadMessagesCount((current) => current + 1);
        showToast(setToast, "Nouveau message de la réception.");
      }
    };
    const onMessageStatus = (message: MessageItem) => {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item));
    };
    const onRequest = (request: RequestItem & { guestId?: string; stayId?: string }) => {
      if (request.guestId !== session.guestId || request.stayId !== session.stayId) return;
      setRequests((current) => upsertById(current, request).sort(sortByCreatedAtDesc));
    };
    const onRequestStatus = (request: RequestItem & { guestId?: string; stayId?: string }) => {
      if (request.guestId !== session.guestId || request.stayId !== session.stayId) return;
      setRequests((current) => upsertById(current, request).sort(sortByCreatedAtDesc));
      showToast(setToast, `Statut mis a jour : ${requestStatusLabel(request.status)}`);
    };

    socket.on("connect", joinGuestRoom);
    if (socket.connected) joinGuestRoom();
    socket.on("reply:new", onMessage);
    socket.on("message:status", onMessageStatus);
    socket.on("request:new", onRequest);
    socket.on("request:status", onRequestStatus);

    return () => {
      socket.emit("hotel:leave", hotel.id);
      socket.off("connect", joinGuestRoom);
      socket.off("reply:new", onMessage);
      socket.off("message:status", onMessageStatus);
      socket.off("request:new", onRequest);
      socket.off("request:status", onRequestStatus);
      socket.disconnect();
    };
  }, [hotel?.id, hotelSlug, section, session?.guestId, session?.stayId]);

  const activeSection = !session && section !== "guide" ? "welcome" : session && section === "welcome" ? "home" : section;

  useEffect(() => {
    if (activeSection === "messages") setUnreadMessagesCount(0);
  }, [activeSection]);

  if (loadState) return loadState.kind === "loading" ? <GuestLoading status={loadState.message} /> : <GuestErrorState />;

  const theme = resolveGuestTheme(settings?.guestTheme);

  return (
    <GuestThemeContext.Provider value={theme}>
      <div className={`min-h-screen ${theme.classes.app}`}>
        {toast && (
          <div className={`fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${theme.classes.elevatedCard}`}>
            {toast}
          </div>
        )}

        <div className={`mx-auto min-h-screen max-w-md md:my-6 md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] ${theme.classes.shell}`}>
          <GuestHeader hotel={hotel} settings={settings} session={session} unreadMessagesCount={unreadMessagesCount} />

          <main className="pb-24">
            {activeSection === "welcome" && (
              <Onboarding hotel={hotel} hotelSlug={hotelSlug} onReady={(next) => {
                setSession(next);
                showToast(setToast, "Concierge active. Bienvenue.");
              }} />
            )}
            {activeSection === "home" && session && (
              <HomeSection
                hotel={hotel}
                settings={settings}
                session={session}
                requests={requests}
                onServiceRequest={setActiveService}
                guestCards={guestCardsData.heroCards}
                shortcutCards={guestCardsData.shortcutCards}
                services={serviceTemplatesForGuest}
                navigateServices={enabledServicesData.services.filter((s) => s.behavior === "navigate")}
                allowExternalLinks={guestCardsData.limits?.allowExternalLinks ?? false}
                onGuestCardAction={handleGuestCardAction}
              />
            )}
            {activeSection === "services" && session && (
              <ServicesSection
                hotelSlug={hotelSlug}
                session={session}
                requests={requests}
                services={serviceTemplatesForGuest}
                onServiceRequest={setActiveService}
              />
            )}
            {activeSection === "messages" && session && (
              <MessagesSection hotelSlug={hotelSlug} session={session} messages={messages} setMessages={setMessages} />
            )}
            {activeSection === "guide" && (
              <GuideSection recommendations={recommendations} />
            )}
            {activeSection === "review" && session && (
              <ReviewSection hotelSlug={hotelSlug} session={session} setToast={setToast} />
            )}
          </main>

          <GuestNav basePath={basePath} active={activeSection} hasSession={Boolean(session)} unreadMessagesCount={unreadMessagesCount} />
          {activeService && session ? (
            <ServiceRequestSheet
              service={activeService}
              session={session}
              hotelSlug={hotelSlug}
              onClose={() => setActiveService(null)}
              onCreated={(created) => {
                setRequests((current) => upsertById(current, created).sort(sortByCreatedAtDesc));
                showToast(setToast, `${activeService.title} transmis à la réception.`);
                setActiveService(null);
              }}
            />
          ) : null}
        </div>
      </div>
    </GuestThemeContext.Provider>
  );
}

function GuestHeader({ hotel, settings, session, unreadMessagesCount }: { hotel: any; settings: any; session: Session | null; unreadMessagesCount: number }) {
  const theme = useGuestTheme();
  return (
    <header className="relative isolate overflow-hidden">
      <div className="relative h-[280px]">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className={`absolute inset-0 ${theme.classes.headerOverlay}`} />
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              Concierge privé
            </div>
            <div className="flex items-center gap-2">
              {session ? (
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-all duration-200 hover:bg-white/25"
                  aria-label={unreadMessagesCount > 0 ? `${unreadMessagesCount} nouveau message réception` : "Aucun nouveau message réception"}
                  aria-live="polite"
                >
                  <Bell className="h-4 w-4 text-white" />
                  {unreadMessagesCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-white/50">
                      {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 text-base font-bold text-white backdrop-blur-md">
                {hotel?.logoUrl ? <img src={hotel.logoUrl} alt={hotel?.name ?? "Hotel"} className="h-full w-full object-cover" /> : hotel?.name?.charAt(0) ?? <Hotel className="h-4 w-4" />}
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-white font-serif">{hotel?.name}</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-white/75">{hotel?.description || "Votre assistant de séjour, disponible à tout moment."}</p>
          </div>
        </div>
      </div>
      <div className="relative -mt-5 mx-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/95 p-3 shadow-lg shadow-black/8 ring-1 ring-black/[0.04] backdrop-blur-xl">
          <MiniFact icon={<Wifi className="h-3.5 w-3.5" />} label="Wi-Fi" value={settings?.wifiName || "Invite"} />
          <MiniFact icon={<Clock className="h-3.5 w-3.5" />} label="Check-out" value={settings?.checkoutTime || "11:00"} />
          <MiniFact icon={<ConciergeBell className="h-3.5 w-3.5" />} label="Chambre" value={session?.roomNumber || "À activer"} />
        </div>
      </div>
    </header>
  );
}

function Onboarding({ hotel, hotelSlug, onReady }: { hotel: any; hotelSlug: string; onReady: (session: Session) => void }) {
  const theme = useGuestTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roomNumber: "",
    checkinDate: today,
    checkoutDate: "",
    marketingConsent: false,
    gdprConsent: false
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.gdprConsent) {
      setError("Merci d'accepter le traitement de vos donnees de sejour.");
      return;
    }

    // === Validations locales avant envoi ===
    // Email au format simple
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailPattern.test(form.email)) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    // Telephone : formats internationaux simples, longueur raisonnable
    const phonePattern = /^\+?[\d\s().-]{8,}$/;
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.phone && (!phonePattern.test(form.phone) || phoneDigits.length < 8)) {
      setError("Veuillez saisir un numéro de téléphone valide.");
      return;
    }
    // Date de depart strictement apres date d'arrivee
    if (form.checkinDate && form.checkoutDate && form.checkoutDate <= form.checkinDate) {
      setError("La date de départ doit être après la date d'arrivée.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const guest = await api.createGuest(hotelSlug, { ...form, language: navigator.language.slice(0, 2) || "fr" });
      const stay = await api.createStay(hotelSlug, {
        guestId: guest.id,
        roomNumber: form.roomNumber,
        checkinDate: form.checkinDate || undefined,
        checkoutDate: form.checkoutDate || undefined,
        status: "active"
      });
      const session = { guestId: guest.id, stayId: stay.id, roomNumber: form.roomNumber, firstName: form.firstName, lastName: form.lastName };
      localStorage.setItem(`guest-session:${hotelSlug}`, JSON.stringify(session));
      onReady(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 px-5 py-6">
      <div className={`rounded-3xl p-5 ${theme.classes.elevatedCard}`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.classes.iconTile}`}>
            <TicketCheck className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.eyebrow}`}>Bienvenue a {hotel?.name}</p>
            <h2 className={`mt-1 text-2xl font-semibold ${theme.classes.title}`}>Votre concierge de séjour</h2>
            <p className={`mt-2 text-sm leading-6 ${theme.classes.muted}`}>Complétez ces informations pour accéder à votre guide de séjour, contacter la réception et retrouver les services de l’hôtel en quelques secondes.</p>
            <p className={`mt-2 text-xs leading-5 ${theme.classes.muted}`}>Vos informations sont utilisées uniquement pour faciliter votre séjour et répondre à vos demandes.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className={`space-y-4 rounded-3xl p-5 ${theme.classes.card}`}>
        <div className="grid grid-cols-2 gap-3">
          <GuestInput label="Prenom" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} required />
          <GuestInput label="Nom" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} required />
        </div>
        <GuestInput label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
        <div className="grid grid-cols-2 gap-3">
          <GuestInput label="Telephone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <GuestInput label="Chambre" value={form.roomNumber} onChange={(value) => setForm({ ...form, roomNumber: value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <GuestInput label="Arrivee" type="date" value={form.checkinDate} onChange={(value) => setForm({ ...form, checkinDate: value })} required />
          <GuestInput label="Depart" type="date" value={form.checkoutDate} onChange={(value) => setForm({ ...form, checkoutDate: value })} required />
        </div>
        <label className={`flex gap-3 rounded-2xl p-3 text-sm ${theme.classes.subtleCard}`}>
          <input type="checkbox" className={`mt-1 h-4 w-4 rounded ${theme.classes.checkbox}`} checked={form.gdprConsent} onChange={(event) => setForm({ ...form, gdprConsent: event.target.checked })} />
          <span>J’accepte que l’hôtel utilise ces informations pour gérer mon séjour et répondre à mes demandes (séjour, services, messagerie).</span>
        </label>
        <label className={`flex gap-3 rounded-2xl p-3 text-sm ${theme.classes.subtleCard}`}>
          <input type="checkbox" className={`mt-1 h-4 w-4 rounded ${theme.classes.checkbox}`} checked={form.marketingConsent} onChange={(event) => setForm({ ...form, marketingConsent: event.target.checked })} />
          <span>J’accepte de recevoir les communications de l’hôtel (offres, événements). Vous pouvez vous désabonner à tout moment.</span>
        </label>
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${theme.classes.primaryButton}`}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Activer mon concierge
        </button>
      </form>
    </section>
  );
}

function HomeSection({ hotel, settings, session, requests, services, navigateServices = [], onServiceRequest, guestCards = [], shortcutCards = [], allowExternalLinks = false, onGuestCardAction = () => {} }: { hotel: any; settings: any; session: Session; requests: RequestItem[]; services: ServiceTemplate[]; navigateServices?: GuestEnabledService[]; onServiceRequest: (service: ServiceTemplate) => void; guestCards?: GuestCardConfig[]; shortcutCards?: GuestCardConfig[]; allowExternalLinks?: boolean; onGuestCardAction?: (card: GuestCardConfig) => void }) {
  const theme = useGuestTheme();
  const recentRequests = requests.slice(0, 3);
  const cardServices = services.filter((service) => service.visibleAsCard !== false);
  const hotelCardServices = cardServices.filter((service) => service.group === "hotel").slice(0, 4);
  const quickServices = hotelCardServices.length > 0 ? hotelCardServices : cardServices.slice(0, 4);
  const fullGuestName = [session.firstName, session.lastName].filter(Boolean).join(" ");
  const greetingName = fullGuestName || "";
  const showShortcutCards = shortcutCards.length > 0;
  const showHeroCards = guestCards.length > 0;
  const guideAlreadyLinked = [...guestCards, ...shortcutCards].some((card) => card.actionType === "section" && (card.actionTarget === "guide" || card.actionTarget === "recommendations"));
  return (
    <section className="space-y-7 px-5 py-7">
      {/* ZONE 1 — ACCUEIL PERSONNALISÉ */}
      <div className="text-center">
        <h2 className={`text-[1.85rem] font-bold tracking-tight ${theme.classes.title}`}>
          {greetingName ? `Bienvenue ${greetingName}` : "Bienvenue"}
        </h2>
        {session.roomNumber && (
          <p className={`mt-1 text-sm ${theme.classes.muted}`}>
            Chambre {session.roomNumber} · {hotel?.name}
          </p>
        )}
      </div>

      {/* ZONE 2 — INFORMATIONS ESSENTIELLES (compact 2x2) */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStayFact icon={<Wifi className="h-3.5 w-3.5" />} label="Wi-Fi" value={settings?.wifiName || "Invité"} />
        <MiniStayFact icon={<Clock className="h-3.5 w-3.5" />} label="Check-out" value={settings?.checkoutTime || "11:00"} />
        <MiniStayFact icon={<Coffee className="h-3.5 w-3.5" />} label="Petit-déj" value={settings?.breakfastHours || "07:00 – 10:30"} />
        <MiniStayFact icon={<Phone className="h-3.5 w-3.5" />} label="Réception" value={settings?.receptionPhone || "24h/24"} />
      </div>

      {/* ZONE 3 — COUP DE CŒUR (featured recommendation ou hero card) */}
      {showHeroCards ? (
        <div className="space-y-4">
          {guestCards.slice(0, 1).map((card) => (
            <GuestHeroCard key={card.id} card={card} theme={theme} onAction={onGuestCardAction} allowExternalLinks={allowExternalLinks} />
          ))}
        </div>
      ) : (
        <div className={`group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg`}>
          <img src={heroImage} alt="" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className={`text-[10px] font-bold uppercase tracking-widest text-white/60`}>Coup de cœur</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Découvrez le quartier</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-white/70">Nos adresses préférées à deux pas de votre hôtel.</p>
            <Link to="guide" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">
              Explorer <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* ZONE 4 — SERVICES RAPIDES */}
      {showShortcutCards ? (
        <div>
          <p className={`mb-3 text-[10px] font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>À votre service</p>
          <div className="grid grid-cols-2 gap-2.5">
            {shortcutCards.map((card) => (
              <GuestShortcutCard key={card.id} card={card} theme={theme} onAction={onGuestCardAction} allowExternalLinks={allowExternalLinks} />
            ))}
          </div>
          {!guideAlreadyLinked && navigateServices.map((navService) => (
            <Link key={navService.id} to={navService.navigateTarget || "guide"} className={`mt-2 flex items-center gap-3 rounded-xl p-3 transition-all duration-200 active:scale-[0.98] ${theme.classes.subtleCard}`}>
              <MapPin className={`h-4 w-4 shrink-0 ${theme.classes.eyebrow}`} />
              <span className="text-[12px] font-semibold">{navService.title}</span>
              <ChevronRight className={`ml-auto h-3.5 w-3.5 ${theme.classes.muted}`} />
            </Link>
          ))}
          {services.length > 4 && (
            <Link to="services" className={`mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold transition-all duration-200 ${theme.classes.muted} hover:opacity-80`}>
              Voir tous les services <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      ) : (
        <div>
          <p className={`mb-3 text-[10px] font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>À votre service</p>
          <div className="grid grid-cols-4 gap-2">
            {quickServices.slice(0, 4).map((service) => (
              <button key={service.id} onClick={() => onServiceRequest(service)} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all duration-200 active:scale-95 ${theme.classes.subtleCard}`}>
                <ServiceIconTile service={service} className={`h-9 w-9 rounded-lg ${theme.classes.iconSoft}`} />
                <span className="line-clamp-2 text-[10px] font-semibold leading-tight">{service.title}</span>
              </button>
            ))}
          </div>
          {!guideAlreadyLinked && navigateServices.map((navService) => (
            <Link key={navService.id} to={navService.navigateTarget || "guide"} className={`mt-2 flex items-center gap-3 rounded-xl p-3 transition-all duration-200 active:scale-[0.98] ${theme.classes.subtleCard}`}>
              <MapPin className={`h-4 w-4 shrink-0 ${theme.classes.eyebrow}`} />
              <span className="text-[12px] font-semibold">{navService.title}</span>
              <ChevronRight className={`ml-auto h-3.5 w-3.5 ${theme.classes.muted}`} />
            </Link>
          ))}
          {services.length > 4 && (
            <Link to="services" className={`mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold transition-all duration-200 ${theme.classes.muted} hover:opacity-80`}>
              Voir tous les services <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* ZONE 5 — RÉCEPTION (CTA conversationnel) */}
      <Link to="messages" className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] ${theme.classes.card}`}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.classes.iconSoft}`}>
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold tracking-tight">Un message pour la réception ?</p>
          <p className={`mt-0.5 text-[12px] ${theme.classes.muted}`}>Nous vous répondons en quelques minutes.</p>
        </div>
        <ChevronRight className={`h-4 w-4 shrink-0 ${theme.classes.muted}`} />
      </Link>

      {/* ZONE 6 — DEMANDES EN COURS (si existantes) */}
      {recentRequests.length > 0 && (
        <div>
          <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>En cours</p>
          <div className="space-y-2">
            {recentRequests.map((request) => <RequestRow key={request.id} request={request} />)}
          </div>
        </div>
      )}

      {/* ZONE 7 — HERO CARDS SUPPLÉMENTAIRES */}
      {showHeroCards && guestCards.length > 1 ? (
        <div className="space-y-3">
          {guestCards.slice(1).map((card) => (
            <GuestHeroCard key={card.id} card={card} theme={theme} onAction={onGuestCardAction} allowExternalLinks={allowExternalLinks} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MiniStayFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const theme = useGuestTheme();
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${theme.classes.subtleCard}`}>
      <span className={theme.classes.muted}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-[9px] font-semibold uppercase tracking-widest ${theme.classes.muted}`}>{label}</p>
        <p className="truncate text-[12px] font-bold">{value}</p>
      </div>
    </div>
  );
}

function ServicesSection({ session, requests, services, onServiceRequest }: { hotelSlug: string; session: Session; requests: RequestItem[]; services: ServiceTemplate[]; onServiceRequest: (service: ServiceTemplate) => void }) {
  const theme = useGuestTheme();
  const hotelServices = services.filter((service) => service.group === "hotel" && service.visibleInServicesPage !== false);
  const externalServices = services.filter((service) => service.group === "external" && service.visibleInServicesPage !== false);
  return (
    <section className="space-y-5 px-5 py-7">
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>Chambre {session.roomNumber}</p>
        <h2 className={`mt-1.5 text-[1.75rem] font-bold tracking-tight ${theme.classes.title}`}>À votre disposition</h2>
        <p className={`mt-2 text-sm leading-relaxed ${theme.classes.muted}`}>Choisissez une catégorie pour trouver rapidement le service adapté. La réception vous répond depuis son espace.</p>
      </div>
      {hotelServices.length > 0 ? <ServiceGroup title="À l'hôtel" services={hotelServices} onServiceRequest={onServiceRequest} /> : null}
      {externalServices.length > 0 ? <ServiceGroup title="À l'extérieur" services={externalServices} onServiceRequest={onServiceRequest} /> : null}
      <div className={`rounded-3xl p-4 ${theme.classes.card}`}>
        <h3 className="font-semibold tracking-tight">Suivi en temps réel</h3>
        <p className={`mt-1 text-xs leading-5 ${theme.classes.muted}`}>Vos demandes envoyées et leurs réponses de la réception.</p>
        <div className="mt-4 space-y-2">
          {requests.length === 0 && <p className={`rounded-2xl p-4 text-sm ${theme.classes.subtleCard}`}>Aucune demande en cours. Vos demandes apparaîtront ici dès leur envoi.</p>}
          {requests.map((request) => <RequestRow key={request.id} request={request} />)}
        </div>
      </div>
    </section>
  );
}

function ServiceGroup({ title, services, onServiceRequest }: { title: string; services: ServiceTemplate[]; onServiceRequest: (service: ServiceTemplate) => void }) {
  const theme = useGuestTheme();
  return (
    <div className="space-y-3">
      <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>{title}</h3>
      <div className="grid gap-3">
        {services.map((service) => (
          <button key={service.id} onClick={() => onServiceRequest(service)} className={`group flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-4 ${theme.classes.elevatedCard}`}>
            <ServiceIconTile service={service} className={`h-12 w-12 shrink-0 rounded-xl ${theme.classes.iconTile}`} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold tracking-tight">{service.title}</p>
              <p className={`mt-1 text-[13px] leading-relaxed ${theme.classes.muted}`}>{service.description}</p>
            </div>
            <ChevronRight className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${theme.classes.muted}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MessagesSection({ hotelSlug, session, messages, setMessages }: { hotelSlug: string; session: Session; messages: MessageItem[]; setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>> }) {
  const theme = useGuestTheme();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const created = await api.createMessage(hotelSlug, { ...session, content, priority: "medium" });
      setMessages((current) => upsertById(current, created).sort(sortByCreatedAtAsc));
      setContent("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-18rem)] flex-col px-5 py-7">
      <div className="mb-5">
        <p className={`text-xs font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>Réception</p>
        <h2 className={`mt-1.5 text-[1.75rem] font-bold tracking-tight ${theme.classes.title}`}>Échangez avec la réception</h2>
      </div>
      <div className={`flex-1 space-y-3 overflow-y-auto rounded-3xl p-4 ${theme.classes.card}`}>
        {messages.length === 0 && (
          <div className={`grid min-h-56 place-items-center rounded-2xl p-8 text-center ${theme.classes.subtleCard}`}>
            <div>
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${theme.classes.iconSoft}`}>
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold">La réception est à votre écoute</p>
              <p className={`mt-1.5 text-sm leading-relaxed ${theme.classes.muted}`}>Envoyez un message, la réponse apparaîtra ici instantanément.</p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.senderType === "guest" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-[1.35rem] px-4 py-3 shadow-sm ${message.senderType === "guest" ? theme.classes.messageGuest : theme.classes.messageReception}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs opacity-65">
                <span>{message.senderType === "guest" ? "Vous" : "Réception"}</span>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <p className="text-sm leading-6">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-3 flex items-end gap-2 rounded-3xl p-2 ${theme.classes.card}`}>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ecrire à la réception..." className={`min-h-12 flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 ${theme.classes.input}`} />
        <button onClick={() => void sendMessage()} disabled={sending || !content.trim()} aria-label="Envoyer à la réception" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 disabled:opacity-50 ${theme.classes.primaryButton}`}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </section>
  );
}

function GuideSection({ recommendations }: { recommendations: any[] }) {
  const theme = useGuestTheme();
  const orderedRecommendations = [...recommendations].sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured) || (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  const categories = ["all", ...Array.from(new Set(orderedRecommendations.map((item) => item.category).filter(Boolean)))];
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? orderedRecommendations : orderedRecommendations.filter((item) => item.category === category);

  return (
    <section className="space-y-5 px-5 py-7">
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${theme.classes.eyebrow}`}>Sélection locale</p>
        <h2 className={`mt-1.5 text-[1.75rem] font-bold tracking-tight ${theme.classes.title}`}>Notre sélection locale</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${category === item ? theme.classes.chipActive : theme.classes.chipIdle}`}>
            {item === "all" ? "Tout" : item}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className={`rounded-2xl p-8 text-center ${theme.classes.card}`}>
            <MapPin className={`mx-auto h-10 w-10 ${theme.classes.muted}`} />
            <p className="mt-3 font-bold font-serif text-lg">Le guide arrive bientôt</p>
            <p className={`mt-1 text-sm ${theme.classes.muted}`}>Nos recommandations pour votre quartier seront disponibles sous peu.</p>
          </div>
        )}
        {filtered.map((item, index) => {
          const isFeaturedFirst = index === 0 && item.isFeatured;
          return (
            <article key={item.id} className={`group overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${theme.classes.card}`}>
              <div className={`relative overflow-hidden ${isFeaturedFirst ? "h-52" : "h-36"}`}>
                <img src={item.imageUrl || guideImage(index)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4a3f37] shadow-sm">{item.category || "Adresse"}</div>
                {item.isFeatured && (
                  <div className="absolute right-3 top-3 rounded-full bg-[#b8973a] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Coup de cœur
                  </div>
                )}
                {item.distance && (
                  <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    {item.distance}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-serif text-[16px] font-bold tracking-tight">{item.name}</h3>
                <p className={`mt-1 text-[13px] leading-relaxed ${theme.classes.muted}`}>{item.description}</p>
                {(item.address || item.openingHours || (Array.isArray(item.tags) && item.tags.length > 0)) && (
                  <div className={`mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium ${theme.classes.muted}`}>
                    {item.address && <span className={`rounded-full px-2.5 py-0.5 ${theme.classes.subtleCard}`}>{item.address}</span>}
                    {item.openingHours && <span className={`rounded-full px-2.5 py-0.5 ${theme.classes.subtleCard}`}>{item.openingHours}</span>}
                    {Array.isArray(item.tags) ? item.tags.slice(0, 3).map((tag: string) => <span key={tag} className={`rounded-full px-2.5 py-0.5 ${theme.classes.subtleCard}`}>{tag}</span>) : null}
                  </div>
                )}
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {item.phone ? <a href={`tel:${item.phone}`} className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${theme.classes.secondaryButton}`}>Appeler</a> : null}
                  {item.website ? <a href={item.website} target="_blank" rel="noreferrer" className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${theme.classes.secondaryButton}`}>Site web</a> : null}
                  {(item.latitude && item.longitude) || item.address ? <a href={mapsUrl(item)} target="_blank" rel="noreferrer" className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${theme.classes.primaryButton}`}>Itinéraire</a> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReviewSection({ hotelSlug, session, setToast }: { hotelSlug: string; session: Session; setToast: (value: string) => void }) {
  const theme = useGuestTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [currentReview, setCurrentReview] = useState<any | null>(null);
  const [publishedReviews, setPublishedReviews] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [showPublished, setShowPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.guestReview(hotelSlug, session)
      .then((review) => {
        if (!mounted || !review) return;
        setCurrentReview(review);
        setRating(review.rating ?? 0);
        setComment(review.comment ?? "");
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [hotelSlug, session.guestId, session.stayId]);

  useEffect(() => {
    api.publishedReviews(hotelSlug)
      .then(setPublishedReviews)
      .catch(() => undefined);
  }, [hotelSlug, currentReview?.status]);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    try {
      const review = await api.createReview(hotelSlug, { ...session, rating, comment });
      setCurrentReview(review);
      setEditing(false);
      showToast(setToast, rating <= 3 ? "La réception est alertee. Votre avis sera valide avant publication." : "Merci. Votre avis est en attente de validation.");
    } finally {
      setLoading(false);
    }
  }

  if (currentReview && !editing) {
    return (
      <section className="space-y-5 px-5 py-6 text-center">
        <div className={`rounded-3xl p-8 ${theme.classes.elevatedCard}`}>
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
          <p className={`mt-4 text-xs font-semibold uppercase tracking-wide ${theme.classes.eyebrow}`}>{reviewStatusLabel(currentReview.status)}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Votre avis est enregistre</h2>
          <div className="mt-4 flex justify-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-6 w-6 ${value <= currentReview.rating ? "fill-current" : "opacity-25"}`} />)}
          </div>
          <p className={`mt-4 text-sm leading-6 ${theme.classes.muted}`}>{currentReview.comment || "Aucun commentaire ajoute."}</p>
          <p className={`mt-3 text-xs leading-5 ${theme.classes.muted}`}>Si vous modifiez votre avis, il repassera en validation réception avant publication.</p>
          <button onClick={() => setEditing(true)} className={`mt-5 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 ${theme.classes.primaryButton}`}>
            Modifier mon avis
          </button>
          <button onClick={() => setShowPublished((value) => !value)} className={`mt-3 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 ${theme.classes.secondaryButton}`}>
            {showPublished ? "Masquer les avis" : "Voir les avis"}
          </button>
        </div>
        {showPublished ? <PublishedReviewsPanel reviews={publishedReviews} /> : null}
      </section>
    );
  }

  return (
    <section className="space-y-5 px-5 py-6">
      <div>
        <p className={`text-sm font-medium ${theme.classes.muted}`}>Satisfaction</p>
        <h2 className={`mt-1 text-3xl font-semibold ${theme.classes.title}`}>{currentReview ? "Modifier votre avis" : "Comment se passe votre sejour ?"}</h2>
        <p className={`mt-2 text-sm leading-6 ${theme.classes.muted}`}>Un seul avis est associe a votre sejour. Il sera publie uniquement apres validation par la réception.</p>
      </div>
      <div className={`rounded-3xl p-5 text-center ${theme.classes.card}`}>
        <p className={`text-sm ${theme.classes.muted}`}>Votre note globale</p>
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} onClick={() => setRating(value)} aria-label={`Noter ${value} sur 5`} className={`rounded-2xl p-2 transition focus:outline-none focus:ring-4 focus:ring-amber-100 ${rating >= value ? "scale-105 text-amber-500" : "text-stone-300"}`}>
              <Star className="h-9 w-9 fill-current" />
            </button>
          ))}
        </div>
        {rating > 0 && rating <= 3 && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
            <div className="flex gap-3">
              <Bell className="h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm leading-6 text-red-800">Une alerte sera envoyee à la réception pour vous recontacter rapidement.</p>
            </div>
          </div>
        )}
      </div>
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Un detail a partager avec l'equipe ?" className={`min-h-32 w-full rounded-3xl p-4 text-sm shadow-sm outline-none focus:ring-4 ${theme.classes.input}`} />
      <button onClick={() => void submit()} disabled={!rating || loading} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-50 ${theme.classes.primaryButton}`}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {currentReview ? "Enregistrer la modification" : "Envoyer mon avis"}
      </button>
      <button type="button" onClick={() => setShowPublished((value) => !value)} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition focus:outline-none focus:ring-4 ${theme.classes.secondaryButton}`}>
        <Star className="h-4 w-4" />
        {showPublished ? "Masquer les avis" : "Voir les avis"}
      </button>
      {showPublished ? <PublishedReviewsPanel reviews={publishedReviews} /> : null}
    </section>
  );
}

function PublishedReviewsPanel({ reviews }: { reviews: any[] }) {
  const theme = useGuestTheme();
  return (
    <div className={`rounded-3xl p-5 ${theme.classes.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.eyebrow}`}>Voir les avis</p>
          <h3 className={`mt-1 text-xl font-semibold ${theme.classes.title}`}>Experiences partagees par les clients</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.classes.subtleCard}`}>{reviews.length}</span>
      </div>
      {reviews.length === 0 ? (
        <p className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${theme.classes.subtleCard}`}>Aucun avis public pour le moment. Les avis sont affiches uniquement apres validation par la réception.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className={`rounded-2xl p-4 ${theme.classes.subtleCard}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= review.rating ? "fill-current" : "opacity-25"}`} />)}
                </div>
                <span className={`text-xs ${theme.classes.muted}`}>{review.guest?.firstName || "Client"}</span>
              </div>
              <p className={`mt-3 text-sm leading-6 ${theme.classes.text}`}>{review.comment || "Tres bon sejour."}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

type ServiceTemplate = {
  id: string;
  type: "taxi" | "restaurant" | "room_service" | "towels" | "reception" | "maintenance";
  title: string;
  description: string;
  priority: "medium" | "high" | "urgent";
  icon: React.ReactNode;
  group: "hotel" | "external";
  imageUrl?: string;
  actionLabel?: string;
  visibleAsCard?: boolean;
  visibleInServicesPage?: boolean;
  requestTitle?: string;
  detailsPreset?: RequestDetails;
};

const serviceTemplates: ServiceTemplate[] = [
  { id: "service-etage", type: "towels", title: "Linge de chambre", description: "Serviettes, oreillers ou couvertures supplémentaires.", priority: "medium", icon: <Waves className="h-5 w-5" />, group: "hotel", requestTitle: "Demande linge de chambre", detailsPreset: { itemType: "linge", quantity: 1 } },
  { id: "room-service", type: "room_service", title: "Room service", description: "Commande ou demande en chambre.", priority: "medium", icon: <ShoppingBag className="h-5 w-5" />, group: "hotel" },
  { id: "petit-dejeuner", type: "room_service", title: "Petit-déjeuner", description: "Demander un petit-déjeuner ou une adaptation.", priority: "medium", icon: <Coffee className="h-5 w-5" />, group: "hotel", requestTitle: "Demande petit-déjeuner", detailsPreset: { category: "Petit-déjeuner" } },
  { id: "maintenance", type: "maintenance", title: "Maintenance", description: "Signaler un probleme dans la chambre.", priority: "medium", icon: <Wrench className="h-5 w-5" />, group: "hotel" },
  { id: "bagagerie", type: "reception", title: "Bagagerie", description: "Demander une prise en charge des bagages.", priority: "medium", icon: <Hotel className="h-5 w-5" />, group: "hotel", requestTitle: "Demande bagagerie", detailsPreset: { subject: "Bagagerie" } },
  { id: "spa-piscine", type: "reception", title: "Spa / piscine", description: "Verifier les disponibilites ou reserver un creneau.", priority: "medium", icon: <Sparkles className="h-5 w-5" />, group: "hotel", requestTitle: "Demande spa / piscine", detailsPreset: { subject: "Spa / piscine" } },
  { id: "parking", type: "reception", title: "Parking", description: "Demander une place, un acces ou une information.", priority: "medium", icon: <Car className="h-5 w-5" />, group: "hotel", requestTitle: "Demande parking", detailsPreset: { subject: "Parking" } },
  { id: "restaurant-hotel", type: "room_service", title: "Restauration de l'hotel", description: "Question sur le restaurant, le bar ou un service repas.", priority: "medium", icon: <Utensils className="h-5 w-5" />, group: "hotel", requestTitle: "Demande restauration de l'hotel", detailsPreset: { category: "Restauration de l'hotel" } },
  { id: "taxi", type: "taxi", title: "Taxi", description: "La réception reserve votre trajet.", priority: "medium", icon: <Car className="h-5 w-5" />, group: "external" },
  { id: "restaurant-exterieur", type: "restaurant", title: "Restaurant exterieur", description: "Une table ou une recommandation en ville.", priority: "medium", icon: <Utensils className="h-5 w-5" />, group: "external" },
  { id: "musee", type: "reception", title: "Musee", description: "Conseil ou reservation d'une visite culturelle.", priority: "medium", icon: <TicketCheck className="h-5 w-5" />, group: "external", requestTitle: "Demande musee", detailsPreset: { subject: "Musee" } },
  { id: "excursion", type: "reception", title: "Excursion", description: "Organiser une sortie ou une experience locale.", priority: "medium", icon: <MapPin className="h-5 w-5" />, group: "external", requestTitle: "Demande excursion", detailsPreset: { subject: "Excursion" } },
  { id: "transfert-aeroport", type: "taxi", title: "Transfert aeroport", description: "Preparer un trajet vers ou depuis l'aeroport.", priority: "medium", icon: <Car className="h-5 w-5" />, group: "external", requestTitle: "Demande transfert aeroport", detailsPreset: { destinationType: "airport", airport: "CDG" } },
  { id: "visite-guidee", type: "reception", title: "Visite guidee", description: "Demander une visite accompagnee ou un guide.", priority: "medium", icon: <TicketCheck className="h-5 w-5" />, group: "external", requestTitle: "Demande visite guidee", detailsPreset: { subject: "Visite guidee" } }
];

function resolveServiceTemplates(dynamicServices: GuestEnabledService[], hasDynamicServices: boolean): ServiceTemplate[] {
  if (!hasDynamicServices || dynamicServices.length === 0) return serviceTemplates;

  const mapped = dynamicServices
    .filter((service) => (service.visibleAsCard || service.visibleInServicesPage) && service.behavior === "request")
    .map(dynamicServiceToTemplate)
    .filter((service): service is ServiceTemplate => Boolean(service));

  return mapped.length > 0 ? mapped : serviceTemplates;
}

function dynamicServiceToTemplate(service: GuestEnabledService): ServiceTemplate | null {
  const type = mapDynamicRequestType(service);
  if (!type) return null;
  const legacy = findLegacyServiceTemplate(service.serviceCode, type);
  const title = service.title || legacy?.title || service.serviceCode;
  const description = service.description || legacy?.description || "Votre demande sera transmise a la reception.";

  return {
    id: service.serviceCode,
    type,
    title,
    description,
    priority: legacy?.priority ?? "medium",
    icon: legacy?.icon ?? iconForDynamicService(service, type),
    group: groupForDynamicService(service, legacy),
    imageUrl: service.imageUrl,
    actionLabel: service.actionLabel,
    visibleAsCard: service.visibleAsCard,
    visibleInServicesPage: service.visibleInServicesPage,
    requestTitle: service.requestTitle || legacy?.requestTitle || `Demande ${title}`,
    detailsPreset: dynamicDetailsPreset(service, type, legacy)
  };
}

function mapDynamicRequestType(service: GuestEnabledService): ServiceTemplate["type"] | null {
  if (service.requestType === "taxi") return "taxi";
  if (service.requestType === "restaurant") return "restaurant";
  if (service.requestType === "room_service") return "room_service";
  if (service.requestType === "towels") return "towels";
  if (service.requestType === "reception") return "reception";
  if (service.requestType === "maintenance") return "maintenance";
  return null;
}

function findLegacyServiceTemplate(serviceCode: string, type: ServiceTemplate["type"]) {
  const byServiceCode: Record<string, string> = {
    taxi: "taxi",
    airport_transfer: "transfert-aeroport",
    restaurant_booking: "restaurant-exterieur",
    room_service: "room-service",
    breakfast_info: "petit-dejeuner",
    maintenance: "maintenance",
    luggage_storage: "bagagerie",
    partner_restaurants: "restaurant-exterieur",
    museums_tickets: "musee",
    local_experiences: "excursion"
  };
  const byId = serviceTemplates.find((template) => template.id === byServiceCode[serviceCode]);
  if (byId) return byId;
  return serviceTemplates.find((template) => template.type === type);
}

function groupForDynamicService(service: GuestEnabledService, legacy?: ServiceTemplate): ServiceTemplate["group"] {
  if (legacy) return legacy.group;
  const category = service.catalogItem?.category;
  if (category === "transport" || category === "partner" || category === "local_guide") return "external";
  return "hotel";
}

function iconForDynamicService(service: GuestEnabledService, type: ServiceTemplate["type"]) {
  if (type === "taxi") return <Car className="h-5 w-5" />;
  if (type === "restaurant" || type === "room_service") return <Utensils className="h-5 w-5" />;
  if (type === "towels") return <Waves className="h-5 w-5" />;
  if (type === "maintenance") return <Wrench className="h-5 w-5" />;
  if (service.catalogItem?.category === "partner") return <TicketCheck className="h-5 w-5" />;
  return <ConciergeBell className="h-5 w-5" />;
}

function dynamicDetailsPreset(service: GuestEnabledService, type: ServiceTemplate["type"], legacy?: ServiceTemplate): RequestDetails {
  if (service.serviceCode === "reception_assistance") return { subject: "Assistance réception" };
  if (service.serviceCode === "luggage_storage") return { subject: "Consigne bagages" };
  if (service.serviceCode === "towels") return { itemType: "linge", quantity: 1 };
  const preset = { ...(legacy?.detailsPreset ?? {}) };
  if (type === "reception") return { subject: service.title, ...preset };
  if (type === "room_service" && service.serviceCode === "breakfast_info") return { category: "Petit-déjeuner", ...preset };
  return preset;
}

function ServiceIconTile({ service, className }: { service: ServiceTemplate; className: string }) {
  if (service.imageUrl) {
    return (
      <div className={`flex overflow-hidden rounded-2xl shadow-sm ${className}`}>
        <img src={service.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center rounded-2xl shadow-sm ${className}`}>
      {service.icon}
    </div>
  );
}

function ServiceRequestSheet({ service, session, hotelSlug, onClose, onCreated }: { service: ServiceTemplate; session: Session; hotelSlug: string; onClose: () => void; onCreated: (request: RequestItem) => void }) {
  const theme = useGuestTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<RequestDetails>(() => defaultRequestDetails(service, today));
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string | number | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const normalized = normalizeRequestPayload(service, form);
      const created = await api.createRequest(hotelSlug, {
        ...session,
        type: service.type,
        title: normalized.title,
        description: normalized.description,
        details: normalized.details,
        priority: normalized.priority
      });
      onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-stone-950/55 p-3 backdrop-blur-sm md:items-center md:justify-center" role="dialog" aria-modal="true">
      <form onSubmit={submit} className={`max-h-[88vh] w-full overflow-y-auto rounded-[2rem] p-5 shadow-2xl md:max-w-md ${theme.classes.elevatedCard}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.muted}`}>Envoyer à la réception</p>
            <h2 className={`mt-1 text-2xl font-semibold tracking-tight ${theme.classes.title}`}>{service.title}</h2>
            <p className={`mt-2 text-sm leading-6 ${theme.classes.muted}`}>{service.description}</p>
          </div>
          <button type="button" onClick={onClose} className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${theme.classes.secondaryButton}`} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          {service.type === "taxi" ? <TaxiFields form={form} update={update} /> : null}
          {service.type === "restaurant" ? <RestaurantFields form={form} update={update} /> : null}
          {service.type === "room_service" ? <RoomServiceFields form={form} update={update} /> : null}
          {service.type === "towels" ? <LinenFields form={form} update={update} /> : null}
          {service.type === "reception" ? <ReceptionAssistanceFields form={form} update={update} /> : null}
          {service.type === "maintenance" ? <MaintenanceFields form={form} update={update} /> : null}
        </div>
        <button type="submit" disabled={saving} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-50 ${theme.classes.primaryButton}`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          Envoyer à la réception
        </button>
      </form>
    </div>
  );
}

function TaxiFields({ form, update }: { form: RequestDetails; update: (field: string, value: string | number | boolean) => void }) {
  const destinationType = String(form.destinationType ?? "address");
  return (
    <>
      <GuestInput label="Date souhaitee" type="date" value={String(form.requestedDate ?? "")} onChange={(value) => update("requestedDate", value)} required />
      <GuestInput label="Heure souhaitee" type="time" value={String(form.requestedTime ?? "")} onChange={(value) => update("requestedTime", value)} required />
      <GuestSelect label="Destination" value={destinationType} onChange={(value) => update("destinationType", value)} options={[["address", "Paris / adresse libre"], ["airport", "Aeroport"], ["station", "Gare"], ["other", "Autre"]]} />
      {destinationType === "airport" ? <GuestSelect label="Aeroport" value={String(form.airport ?? "CDG")} onChange={(value) => update("airport", value)} options={[["CDG", "Charles de Gaulle"], ["ORY", "Orly"], ["BVA", "Beauvais"], ["other", "Autre"]]} /> : null}
      {destinationType === "station" ? <GuestSelect label="Gare" value={String(form.station ?? "Gare du Nord")} onChange={(value) => update("station", value)} options={["Gare du Nord", "Gare de Lyon", "Gare Saint-Lazare", "Gare Montparnasse", "Gare de l'Est", "Autre"].map((item) => [item, item])} /> : null}
      <GuestInput label="Adresse ou destination libre" value={String(form.destinationLabel ?? "")} onChange={(value) => update("destinationLabel", value)} />
      <GuestInput label="Passagers" type="number" value={String(form.passengers ?? 1)} onChange={(value) => update("passengers", Number(value))} required />
      <GuestInput label="Bagages" type="number" value={String(form.luggage ?? 0)} onChange={(value) => update("luggage", Number(value))} />
      <GuestInput label="Telephone" value={String(form.phone ?? "")} onChange={(value) => update("phone", value)} />
      <GuestTextarea label="Commentaire" value={String(form.notes ?? "")} onChange={(value) => update("notes", value)} />
    </>
  );
}

function RestaurantFields({ form, update }: { form: RequestDetails; update: (field: string, value: string | number | boolean) => void }) {
  return (
    <>
      <GuestInput label="Date souhaitee" type="date" value={String(form.requestedDate ?? "")} onChange={(value) => update("requestedDate", value)} required />
      <GuestInput label="Heure souhaitee" type="time" value={String(form.requestedTime ?? "")} onChange={(value) => update("requestedTime", value)} required />
      <GuestInput label="Nombre de personnes" type="number" value={String(form.people ?? 2)} onChange={(value) => update("people", Number(value))} required />
      <GuestInput label="Type de cuisine" value={String(form.cuisine ?? "")} onChange={(value) => update("cuisine", value)} />
      <GuestSelect label="Budget" value={String(form.budget ?? "medium")} onChange={(value) => update("budget", value)} options={[["economy", "Economique"], ["medium", "Moyen"], ["premium", "Premium"], ["gastronomic", "Gastronomique"]]} />
      <GuestInput label="Quartier souhaite" value={String(form.area ?? "")} onChange={(value) => update("area", value)} />
      <GuestSelect label="Occasion speciale" value={String(form.occasion ?? "")} onChange={(value) => update("occasion", value)} options={[
        ["", "Rien de particulier"],
        ["Anniversaire", "Anniversaire"],
        ["Saint-Valentin", "Saint-Valentin"],
        ["Romantique", "Romantique"],
        ["Affaires", "Affaires"]
      ]} />
      <GuestInput label="Restaurant precis optionnel" value={String(form.restaurantName ?? "")} onChange={(value) => update("restaurantName", value)} />
      <GuestInput label="Contraintes alimentaires" value={String(form.dietaryRestrictions ?? "")} onChange={(value) => update("dietaryRestrictions", value)} />
      <GuestTextarea label="Commentaire" value={String(form.notes ?? "")} onChange={(value) => update("notes", value)} />
    </>
  );
}

function RoomServiceFields({ form, update }: { form: RequestDetails; update: (field: string, value: string | number | boolean) => void }) {
  return (
    <>
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={Boolean(form.asap)} onChange={(event) => update("asap", event.target.checked)} /> Des que possible</label>
      {!form.asap ? <GuestInput label="Heure souhaitee" type="time" value={String(form.requestedTime ?? "")} onChange={(value) => update("requestedTime", value)} /> : null}
      <GuestSelect label="Categorie" value={String(form.category ?? "")} onChange={(value) => update("category", value)} options={[
        ["Petit-déjeuner", "Petit-déjeuner"],
        ["Boissons", "Boissons"],
        ["Collations", "Collations"],
        ["Repas", "Repas"],
        ["Autre", "Autre"]
      ]} />
      <GuestInput label="Quantite" type="number" value={String(form.quantity ?? 1)} onChange={(value) => update("quantity", Number(value))} />
      <GuestTextarea label="Commentaire" value={String(form.notes ?? "")} onChange={(value) => update("notes", value)} />
    </>
  );
}

function LinenFields({ form, update }: { form: RequestDetails; update: (field: string, value: string | number | boolean) => void }) {
  return (
    <>
      {/* Pressing / blanchisserie client belongs in a future laundry_pressing service, not towels. */}
      <GuestSelect label="Besoin" value={String(form.itemType ?? "linge")} onChange={(value) => update("itemType", value)} options={[["linge", "Linge supplémentaire"], ["serviettes", "Serviettes"], ["oreillers", "Oreillers"], ["couvertures", "Couvertures"], ["autre", "Autre demande de linge"]]} />
      <GuestInput label="Quantite" type="number" value={String(form.quantity ?? 1)} onChange={(value) => update("quantity", Number(value))} required />
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={Boolean(form.urgent)} onChange={(event) => update("urgent", event.target.checked)} /> Urgent</label>
      <GuestTextarea label="Commentaire" value={String(form.notes ?? "")} onChange={(value) => update("notes", value)} />
    </>
  );
}

function ReceptionAssistanceFields({ form, update }: { form: RequestDetails; update: (field: string, value: string | number | boolean) => void }) {
  return (
    <>
      <GuestInput label="Sujet" value={String(form.subject ?? "")} onChange={(value) => update("subject", value)} required />
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={Boolean(form.urgent)} onChange={(event) => update("urgent", event.target.checked)} /> Urgent</label>
      <GuestTextarea label="Message" value={String(form.notes ?? "")} onChange={(value) => update("notes", value)} required />
    </>
  );
}

function MaintenanceFields({ form, update }: { form: RequestDetails; update: (field: string, value: string | number | boolean) => void }) {
  return (
    <>
      <GuestSelect label="Categorie" value={String(form.category ?? "Plomberie")} onChange={(value) => update("category", value)} options={[
        ["Plomberie", "Plomberie"],
        ["Electricite / Lumiere", "Electricite / Lumiere"],
        ["Climatisation / Chauffage", "Climatisation / Chauffage"],
        ["Serrure / Cle", "Serrure / Cle"],
        ["TV / Telephone", "TV / Telephone"],
        ["Mobilier / Equipement", "Mobilier / Equipement"],
        ["Autre", "Autre"]
      ]} />
      <GuestTextarea label="Description" value={String(form.description ?? "")} onChange={(value) => update("description", value)} required />
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={Boolean(form.urgent)} onChange={(event) => update("urgent", event.target.checked)} /> Intervention urgente</label>
      <GuestSelect label="Disponibilite" value={String(form.availability ?? "")} onChange={(value) => update("availability", value)} options={[
        ["", "Au plus tot"],
        ["Dans 1 heure", "Dans 1 heure"],
        ["Ce soir", "Ce soir"],
        ["Demain matin", "Demain matin"]
      ]} />
    </>
  );
}

function GuestSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  const theme = useGuestTheme();
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${theme.classes.muted}`}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme.classes.input}`}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function GuestTextarea({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const theme = useGuestTheme();
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${theme.classes.muted}`}>{label}{required ? " *" : ""}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} className={`min-h-24 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme.classes.input}`} />
    </label>
  );
}

function defaultRequestDetails(service: ServiceTemplate, today: string): RequestDetails {
  let defaults: RequestDetails;
  if (service.type === "taxi") defaults = { requestedDate: today, requestedTime: "12:00", pickup: "hotel", destinationType: "address", passengers: 1, luggage: 0 };
  else if (service.type === "restaurant") defaults = { requestedDate: today, requestedTime: "20:00", people: 2, budget: "medium" };
  else if (service.type === "room_service") defaults = { asap: true, category: "Autre", quantity: 1 };
  else if (service.type === "towels") defaults = { itemType: "linge", quantity: 1, urgent: false };
  else if (service.type === "maintenance") defaults = { category: "Plomberie", description: "", urgent: false, availability: "" };
  else defaults = { subject: service.title, urgent: false, notes: "" };
  return { ...defaults, ...(service.detailsPreset ?? {}) };
}

function normalizeRequestPayload(service: ServiceTemplate, form: RequestDetails) {
  const details = { ...form };
  let priority = form.urgent ? "urgent" : service.priority;
  if (service.type === "restaurant") {
    if (form.occasion === "Anniversaire" || form.occasion === "Saint-Valentin") {
      if (priority !== "urgent") priority = "high";
    }
    return {
      title: service.requestTitle ?? "Demande reservation restaurant",
      priority,
      details,
      description: `Table pour ${form.people || 2} le ${form.requestedDate || "-"} a ${form.requestedTime || "-"}${form.cuisine ? `, cuisine ${form.cuisine}` : ""}${form.area ? `, quartier ${form.area}` : ""}.${form.notes ? ` ${form.notes}` : ""}`
    };
  }
  if (service.type === "taxi") {
    const destination = taxiDestinationLabel(form);
    return {
      title: service.requestTitle ?? "Demande taxi",
      priority,
      details,
      description: `Taxi le ${form.requestedDate || "-"} a ${form.requestedTime || "-"} vers ${destination}. ${form.passengers || 1} passager(s), ${form.luggage || 0} bagage(s).${form.notes ? ` ${form.notes}` : ""}`
    };
  }
  if (service.type === "room_service") {
    const category = form.category || form.requestType || "Demande en chambre";
    return { title: service.requestTitle ?? "Demande room service", priority, details, description: `${form.asap ? "Des que possible" : `A ${form.requestedTime || "-"}`} - ${category}${form.quantity ? ` x${form.quantity}` : ""}.${form.notes ? ` ${form.notes}` : ""}` };
  }
  if (service.type === "towels") {
    return { title: service.requestTitle ?? "Demande service d’étage", priority, details, description: `${form.quantity || 1} ${form.itemType || "article(s)"} demande(s).${form.notes ? ` ${form.notes}` : ""}` };
  }
  if (service.type === "maintenance") {
    return {
      title: `Maintenance - ${form.category || "Probleme technique"}`,
      priority,
      details,
      description: `${form.category || "Probleme"} : ${form.description || "Pas de description."}`
    };
  }
  return { title: service.requestTitle ?? "Assistance réception", priority, details, description: `${form.subject || service.title || "Assistance"} - ${form.notes || ""}` };
}

function taxiDestinationLabel(form: RequestDetails) {
  if (form.destinationType === "airport") return airportLabel(String(form.airport ?? "CDG"));
  if (form.destinationType === "station") return String(form.station ?? "Gare");
  return String(form.destinationLabel || "destination libre");
}

function airportLabel(value: string) {
  if (value === "CDG") return "Aeroport Charles de Gaulle";
  if (value === "ORY") return "Aeroport Orly";
  if (value === "BVA") return "Aeroport Beauvais";
  return "Aeroport";
}

async function loadGuestTimeline(hotelSlug: string, session: Session, setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>, setRequests: React.Dispatch<React.SetStateAction<RequestItem[]>>) {
  const [loadedMessages, loadedRequests] = await Promise.all([
    api.guestMessages(hotelSlug, session),
    api.guestRequests(hotelSlug, session).catch(() => [])
  ]);
  setMessages(loadedMessages.sort(sortByCreatedAtAsc));
  setRequests(loadedRequests.sort(sortByCreatedAtDesc));
}

function GuestNav({ basePath, active, hasSession, unreadMessagesCount }: { basePath: string; active: GuestSection; hasSession: boolean; unreadMessagesCount: number }) {
  const theme = useGuestTheme();
  const items = [
    { id: "home", label: "Séjour", icon: <Home className="h-4 w-4" /> },
    { id: "services", label: "Services", icon: <ConciergeBell className="h-4 w-4" /> },
    { id: "messages", label: "Messages", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "guide", label: "Guide", icon: <MapPin className="h-4 w-4" /> },
    { id: "review", label: "Avis", icon: <Star className="h-4 w-4" /> }
  ] as const;

  return (
    <nav className={`fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-3 pt-1.5 backdrop-blur-xl md:bottom-4 md:px-6 ${theme.classes.nav}`}>
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <Link key={item.id} to={`${basePath}/${hasSession ? item.id : item.id === "guide" ? "guide" : "welcome"}`} className={`relative flex flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition-all duration-150 ${active === item.id ? `${theme.classes.navActive} rounded-xl` : theme.classes.navIdle}`}>
            <span className="relative">
              {item.icon}
              {item.id === "messages" && unreadMessagesCount > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-1.5 ring-white">
                  {unreadMessagesCount > 9 ? "+" : unreadMessagesCount}
                </span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function GuestInput({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const theme = useGuestTheme();
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${theme.classes.muted}`}>{label}{required ? " *" : ""}</span>
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${theme.classes.input}`} />
    </label>
  );
}

function MiniFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-[#8c7e73]">{icon}<span className="text-[9px] font-semibold uppercase tracking-widest">{label}</span></div>
      <p className="mt-1 truncate text-[12px] font-bold text-[#1a1613]">{value}</p>
    </div>
  );
}


function RequestRow({ request }: { request: RequestItem }) {
  const theme = useGuestTheme();
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl p-3.5 ${theme.classes.subtleCard}`}>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold tracking-tight">{request.title}</p>
        <p className={`mt-0.5 truncate text-[11px] ${theme.classes.muted}`}>{request.description}</p>
      </div>
      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${requestStatusClass(request.status, theme)}`}>
        {requestStatusLabel(request.status)}
      </span>
    </div>
  );
}

function GuestLoading({ status }: { status: string }) {
  const theme = resolveGuestTheme(undefined);
  return (
    <main className={`grid min-h-screen place-items-center p-6 ${theme.classes.app}`} aria-labelledby="guest-loading-title">
      <section className={`w-full max-w-sm rounded-3xl p-6 text-center ${theme.classes.elevatedCard}`} aria-live="polite">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <h1 id="guest-loading-title" className="mt-4 font-medium">{status}</h1>
      </section>
    </main>
  );
}

function GuestErrorState() {
  const theme = resolveGuestTheme(undefined);
  return (
    <main className={`grid min-h-screen place-items-center p-6 ${theme.classes.app}`} aria-labelledby="guest-error-title">
      <section className={`w-full max-w-sm rounded-3xl p-6 text-center ${theme.classes.elevatedCard}`} role="region" aria-labelledby="guest-error-title">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${theme.classes.iconTile}`}>
          <ConciergeBell className="h-6 w-6" />
        </div>
        <h1 id="guest-error-title" className={`mt-5 text-2xl font-semibold ${theme.classes.title}`}>
          Le concierge digital est momentanément indisponible
        </h1>
        <p className={`mt-3 text-sm leading-6 ${theme.classes.muted}`}>
          Veuillez réessayer dans quelques instants ou contacter la réception de l'hôtel.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition focus:outline-none focus:ring-4 ${theme.classes.primaryButton}`}
        >
          Réessayer
        </button>
      </section>
    </main>
  );
}

function getSection(pathname: string, basePath: string, hasPathSlug: boolean): GuestSection {
  const cleanBase = basePath || "";
  const relative = cleanBase && pathname.startsWith(cleanBase) ? pathname.slice(cleanBase.length) : pathname;
  const segment = relative.split("/").filter(Boolean)[hasPathSlug && !cleanBase ? 2 : 0];
  if (segment === "guide" || segment === "services" || segment === "messages" || segment === "review" || segment === "welcome") return segment;
  return "home";
}

function readGuestSession(hotelSlug: string): Session | null {
  try {
    const raw = localStorage.getItem(`guest-session:${hotelSlug}`);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

function showToast(setToast: (value: string) => void, value: string) {
  setToast(value);
  window.setTimeout(() => setToast(""), 3200);
}

function upsertById<T extends { id: string }>(items: T[], next: T) {
  return items.some((item) => item.id === next.id)
    ? items.map((item) => item.id === next.id ? { ...item, ...next } : item)
    : [...items, next];
}

function sortByCreatedAtAsc(left: { createdAt: string }, right: { createdAt: string }) {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

function sortByCreatedAtDesc(left: { createdAt: string }, right: { createdAt: string }) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function requestStatusLabel(status?: string) {
  if (status === "in_progress") return "En cours";
  if (status === "urgent") return "Urgent";
  if (status === "completed" || status === "done" || status === "closed") return "Traite";
  return "Nouveau";
}

function reviewStatusLabel(status?: string) {
  if (status === "approved") return "Valide et publie";
  if (status === "rejected") return "Non publie";
  if (status === "negative_alert") return "Alerte réception en validation";
  if (status === "resolved") return "Traite par la réception";
  return "En attente de validation";
}

function requestStatusClass(status: string | undefined, theme: GuestTheme) {
  if (status === "urgent") return theme.classes.statusUrgent;
  if (status === "in_progress") return theme.classes.statusProgress;
  if (status === "completed" || status === "done" || status === "closed") return theme.classes.statusDone;
  return theme.classes.statusNew;
}

function guideImage(index: number) {
  const images = [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
  ];
  return images[index % images.length];
}

function mapsUrl(item: any) {
  if (item.latitude && item.longitude) return `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.name)}`;
}
