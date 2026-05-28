import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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
import { api } from "../../lib/api";
import { getSocket, joinHotelRoom } from "../../lib/socket";
import { resolveTenantFromHostname, routeHotelSlug } from "../../lib/tenant";
import { resolveGuestTheme, type GuestTheme } from "../../themes";

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
  const [settings, setSettings] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [session, setSession] = useState<Session | null>(() => readGuestSession(hotelSlug));
  const [status, setStatus] = useState("Chargement de votre concierge...");
  const [toast, setToast] = useState("");
  const [activeService, setActiveService] = useState<ServiceTemplate | null>(null);

  useEffect(() => {
    let mounted = true;
    setSession(readGuestSession(hotelSlug));
    Promise.all([api.hotelBySlug(hotelSlug), api.settings(hotelSlug), api.recommendations(hotelSlug)])
      .then(([hotelData, settingsData, recs]) => {
        if (!mounted) return;
        setHotel(hotelData);
        setSettings(settingsData);
        setRecommendations(recs);
        setStatus("");
      })
      .catch((error) => mounted && setStatus(error.message));

    return () => { mounted = false; };
  }, [hotelSlug]);

  useEffect(() => {
    if (!hotel?.id || !session) return undefined;
    return joinHotelRoom(hotel.id, {
      guestId: session.guestId,
      stayId: session.stayId,
      hotelId: hotel.id
    });
  }, [hotel?.id, session]);

  useEffect(() => {
    if (!session) return;
    void loadGuestTimeline(hotelSlug, session, setMessages, setRequests);
  }, [hotelSlug, session?.guestId, session?.stayId]);

  useEffect(() => {
    if (!session || !hotel?.id) return undefined;

    const socket = getSocket({
      guestId: session.guestId,
      stayId: session.stayId,
      hotelId: hotel.id
    });
    const onMessage = (message: MessageItem) => {
      if (message.guestId !== session.guestId || message.stayId !== session.stayId) return;
      setMessages((current) => upsertById(current, message).sort(sortByCreatedAtAsc));
      if (message.senderType === "reception") showToast(setToast, "La reception vient de vous repondre.");
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

    socket.on("reply:new", onMessage);
    socket.on("message:status", onMessageStatus);
    socket.on("request:new", onRequest);
    socket.on("request:status", onRequestStatus);

    return () => {
      socket.off("reply:new", onMessage);
      socket.off("message:status", onMessageStatus);
      socket.off("request:new", onRequest);
      socket.off("request:status", onRequestStatus);
    };
  }, [hotel?.id, hotelSlug, session?.guestId, session?.stayId]);

  if (status) return <GuestLoading status={status} />;

  const activeSection = !session && section !== "guide" ? "welcome" : session && section === "welcome" ? "home" : section;
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
          <GuestHeader hotel={hotel} settings={settings} session={session} />

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
              />
            )}
            {activeSection === "services" && session && (
              <ServicesSection
                hotelSlug={hotelSlug}
                session={session}
                requests={requests}
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

          <GuestNav basePath={basePath} active={activeSection} hasSession={Boolean(session)} />
          {activeService && session ? (
            <ServiceRequestSheet
              service={activeService}
              session={session}
              hotelSlug={hotelSlug}
              onClose={() => setActiveService(null)}
              onCreated={(created) => {
                setRequests((current) => upsertById(current, created).sort(sortByCreatedAtDesc));
                showToast(setToast, `${activeService.title} transmis a la reception.`);
                setActiveService(null);
              }}
            />
          ) : null}
        </div>
      </div>
    </GuestThemeContext.Provider>
  );
}

function GuestHeader({ hotel, settings, session }: { hotel: any; settings: any; session: Session | null }) {
  const theme = useGuestTheme();
  return (
    <header className={`relative isolate overflow-hidden rounded-b-[2rem] ${theme.classes.header}`}>
      <img src={heroImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className={`absolute inset-0 -z-10 ${theme.classes.headerOverlay}`} />
      <div className="px-5 pb-6 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-current backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Concierge prive
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{hotel?.name}</h1>
            <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-85">{hotel?.description || "Votre assistant de sejour, disponible a tout moment."}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 text-lg font-semibold shadow-lg backdrop-blur">
            {hotel?.logoUrl ? <img src={hotel.logoUrl} alt={hotel?.name ?? "Hotel"} className="h-full w-full object-cover" /> : hotel?.name?.charAt(0) ?? <Hotel className="h-5 w-5" />}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <MiniFact icon={<Wifi className="h-4 w-4" />} label="Wi-Fi" value={settings?.wifiName || "Invite"} />
          <MiniFact icon={<Clock className="h-4 w-4" />} label="Check-out" value={settings?.checkoutTime || "11:00"} />
          <MiniFact icon={<ConciergeBell className="h-4 w-4" />} label="Chambre" value={session?.roomNumber || "A activer"} />
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
            <h2 className={`mt-1 text-2xl font-semibold ${theme.classes.title}`}>Activez votre concierge</h2>
            <p className={`mt-2 text-sm leading-6 ${theme.classes.muted}`}>Quelques secondes suffisent pour personnaliser votre sejour et joindre la reception sans attente.</p>
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
          J'accepte le traitement de mes donnees pour le suivi de mon sejour.
        </label>
        <label className={`flex gap-3 rounded-2xl p-3 text-sm ${theme.classes.subtleCard}`}>
          <input type="checkbox" className={`mt-1 h-4 w-4 rounded ${theme.classes.checkbox}`} checked={form.marketingConsent} onChange={(event) => setForm({ ...form, marketingConsent: event.target.checked })} />
          J'accepte de recevoir les communications de l'hotel.
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

function HomeSection({ hotel, settings, session, requests, onServiceRequest }: { hotel: any; settings: any; session: Session; requests: RequestItem[]; onServiceRequest: (service: ServiceTemplate) => void }) {
  const theme = useGuestTheme();
  const recentRequests = requests.slice(0, 3);
  return (
    <section className="space-y-5 px-5 py-6">
      <div>
        <p className={`text-sm font-medium ${theme.classes.muted}`}>Bonjour {session.firstName || "et bienvenue"}</p>
        <h2 className={`mt-1 text-3xl font-semibold ${theme.classes.title}`}>Votre sejour, simplement.</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StayCard icon={<Wifi className="h-5 w-5" />} label="Wi-Fi" title={settings?.wifiName || "Reseau invite"} detail={settings?.wifiPassword || "Mot de passe a la reception"} />
        <StayCard icon={<Coffee className="h-5 w-5" />} label="Petit-dejeuner" title={settings?.breakfastHours || "07:00 - 10:30"} detail="Salon principal" />
        <StayCard icon={<Clock className="h-5 w-5" />} label="Check-out" title={settings?.checkoutTime || "11:00"} detail={`Check-in ${settings?.checkinTime || "15:00"}`} />
        <StayCard icon={<Phone className="h-5 w-5" />} label="Reception" title={settings?.receptionPhone || "24/7"} detail="Assistance sejour" />
      </div>

      <div className={`rounded-3xl p-4 ${theme.classes.card}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.eyebrow}`}>Actions rapides</p>
            <h3 className={`text-lg font-semibold ${theme.classes.title}`}>Besoin de quelque chose ?</h3>
          </div>
          <ConciergeBell className="h-5 w-5 text-stone-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {serviceTemplates.slice(0, 4).map((service) => (
            <button key={service.type} onClick={() => onServiceRequest(service)} className={`group rounded-2xl p-4 text-left transition focus:outline-none focus:ring-4 ${theme.classes.secondaryButton}`}>
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${theme.classes.iconSoft}`}>
                {service.icon}
              </div>
              <p className="font-semibold">{service.title}</p>
              <p className={`mt-1 text-xs leading-5 ${theme.classes.muted}`}>{service.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl p-4 ${theme.classes.card}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Suivi reception</p>
            <h3 className="text-lg font-semibold tracking-tight">Vos demandes</h3>
          </div>
          <Link to="services" className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.classes.secondaryButton}`}>Voir tout</Link>
        </div>
        <div className="mt-4 space-y-2">
          {recentRequests.length === 0 && <p className={`rounded-2xl p-4 text-sm ${theme.classes.subtleCard}`}>Aucune demande en cours. La reception reste disponible a tout moment.</p>}
          {recentRequests.map((request) => <RequestRow key={request.id} request={request} />)}
        </div>
      </div>

      <div className={`overflow-hidden rounded-3xl shadow-lg ${theme.classes.header}`}>
        <img src={heroImage} alt="" className="h-32 w-full object-cover opacity-80" />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Guide local</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Paris autour de {hotel?.name}</h3>
          <p className="mt-2 text-sm leading-6 opacity-75">Restaurants, cafes, pharmacies et lieux utiles selectionnes pour votre sejour.</p>
          <Link to="guide" className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold ${theme.classes.primaryButton}`}>
            Explorer le quartier <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ session, requests, onServiceRequest }: { hotelSlug: string; session: Session; requests: RequestItem[]; onServiceRequest: (service: ServiceTemplate) => void }) {
  const theme = useGuestTheme();
  return (
    <section className="space-y-5 px-5 py-6">
      <div>
        <p className={`text-sm font-medium ${theme.classes.muted}`}>Chambre {session.roomNumber}</p>
        <h2 className={`mt-1 text-3xl font-semibold ${theme.classes.title}`}>Services de l'hotel</h2>
      </div>
      <div className="grid gap-3">
        {serviceTemplates.map((service) => (
          <button key={service.type} onClick={() => onServiceRequest(service)} className={`flex items-center gap-4 rounded-3xl p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${theme.classes.elevatedCard}`}>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.classes.iconTile}`}>
              {service.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold tracking-tight">{service.title}</p>
              <p className={`mt-1 text-sm leading-5 ${theme.classes.muted}`}>{service.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-300" />
          </button>
        ))}
      </div>
      <div className={`rounded-3xl p-4 ${theme.classes.card}`}>
        <h3 className="font-semibold tracking-tight">Suivi en temps reel</h3>
        <div className="mt-4 space-y-2">
          {requests.length === 0 && <p className={`rounded-2xl p-4 text-sm ${theme.classes.subtleCard}`}>Vos demandes apparaitront ici des leur envoi.</p>}
          {requests.map((request) => <RequestRow key={request.id} request={request} />)}
        </div>
      </div>
    </section>
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
    <section className="flex min-h-[calc(100vh-18rem)] flex-col px-5 py-6">
      <div className="mb-4">
        <p className={`text-sm font-medium ${theme.classes.muted}`}>Reception</p>
        <h2 className={`mt-1 text-3xl font-semibold ${theme.classes.title}`}>Votre messagerie</h2>
      </div>
      <div className={`flex-1 space-y-3 overflow-y-auto rounded-3xl p-4 ${theme.classes.card}`}>
        {messages.length === 0 && (
          <div className={`grid min-h-56 place-items-center rounded-3xl p-6 text-center ${theme.classes.subtleCard}`}>
            <div>
              <MessageCircle className={`mx-auto h-10 w-10 ${theme.classes.muted}`} />
              <p className="mt-3 font-semibold">La reception est a votre ecoute</p>
              <p className={`mt-1 text-sm ${theme.classes.muted}`}>Envoyez un message, la reponse apparaitra ici instantanement.</p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.senderType === "guest" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-[1.35rem] px-4 py-3 shadow-sm ${message.senderType === "guest" ? theme.classes.messageGuest : theme.classes.messageReception}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs opacity-65">
                <span>{message.senderType === "guest" ? "Vous" : "Reception"}</span>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <p className="text-sm leading-6">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-3 flex items-end gap-2 rounded-3xl p-2 ${theme.classes.card}`}>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ecrire a la reception..." className={`min-h-12 flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 ${theme.classes.input}`} />
        <button onClick={() => void sendMessage()} disabled={sending || !content.trim()} aria-label="Envoyer le message" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition focus:outline-none focus:ring-4 disabled:opacity-50 ${theme.classes.primaryButton}`}>
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
    <section className="space-y-5 px-5 py-6">
      <div>
        <p className={`text-sm font-medium ${theme.classes.muted}`}>Selection locale</p>
        <h2 className={`mt-1 text-3xl font-semibold ${theme.classes.title}`}>Guide du quartier</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${category === item ? theme.classes.chipActive : theme.classes.chipIdle}`}>
            {item === "all" ? "Tout" : item}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <p className={`rounded-3xl p-5 text-sm ${theme.classes.card}`}>Le guide local sera bientot disponible.</p>}
        {filtered.map((item, index) => (
          <article key={item.id} className={`overflow-hidden rounded-3xl ${theme.classes.card}`}>
            <div className="relative h-36">
              <img src={item.imageUrl || guideImage(index)} alt="" className="h-full w-full object-cover" />
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-stone-800 backdrop-blur">{item.category || "Adresse"}</div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">{item.name}</h3>
                  <p className={`mt-1 text-sm leading-6 ${theme.classes.muted}`}>{item.description}</p>
                </div>
                {item.isFeatured && <Star className="h-5 w-5 fill-amber-300 text-amber-400" />}
              </div>
              <div className={`mt-3 flex flex-wrap gap-2 text-xs font-medium ${theme.classes.muted}`}>
                {item.distance && <span className={`rounded-full px-3 py-1 ${theme.classes.subtleCard}`}>{item.distance}</span>}
                {item.address && <span className={`rounded-full px-3 py-1 ${theme.classes.subtleCard}`}>{item.address}</span>}
                {item.openingHours && <span className={`rounded-full px-3 py-1 ${theme.classes.subtleCard}`}>{item.openingHours}</span>}
                {Array.isArray(item.tags) ? item.tags.slice(0, 3).map((tag: string) => <span key={tag} className={`rounded-full px-3 py-1 ${theme.classes.subtleCard}`}>{tag}</span>) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.phone ? <a href={`tel:${item.phone}`} className={`rounded-2xl px-4 py-2 text-xs font-semibold ${theme.classes.secondaryButton}`}>Appeler</a> : null}
                {item.website ? <a href={item.website} target="_blank" rel="noreferrer" className={`rounded-2xl px-4 py-2 text-xs font-semibold ${theme.classes.secondaryButton}`}>Site web</a> : null}
                {(item.latitude && item.longitude) || item.address ? <a href={mapsUrl(item)} target="_blank" rel="noreferrer" className={`rounded-2xl px-4 py-2 text-xs font-semibold ${theme.classes.primaryButton}`}>Itineraire</a> : null}
              </div>
            </div>
          </article>
        ))}
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
      showToast(setToast, rating <= 3 ? "La reception est alertee. Votre avis sera valide avant publication." : "Merci. Votre avis est en attente de validation.");
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
          <p className={`mt-3 text-xs leading-5 ${theme.classes.muted}`}>Si vous modifiez votre avis, il repassera en validation reception avant publication.</p>
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
        <p className={`mt-2 text-sm leading-6 ${theme.classes.muted}`}>Un seul avis est associe a votre sejour. Il sera publie uniquement apres validation par la reception.</p>
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
              <p className="text-sm leading-6 text-red-800">Une alerte sera envoyee a la reception pour vous recontacter rapidement.</p>
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
        <p className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${theme.classes.subtleCard}`}>Aucun avis public pour le moment. Les avis sont affiches uniquement apres validation par la reception.</p>
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

type ServiceTemplate = { type: string; title: string; description: string; priority: "medium" | "high" | "urgent"; icon: React.ReactNode };

const serviceTemplates: ServiceTemplate[] = [
  { type: "taxi", title: "Taxi", description: "La reception reserve votre trajet.", priority: "medium", icon: <Car className="h-5 w-5" /> },
  { type: "restaurant", title: "Restaurant", description: "Une table ou une recommandation.", priority: "medium", icon: <Utensils className="h-5 w-5" /> },
  { type: "room_service", title: "Room service", description: "Commande ou demande en chambre.", priority: "medium", icon: <ShoppingBag className="h-5 w-5" /> },
  { type: "towels", title: "Serviettes", description: "Serviettes ou linge supplementaire.", priority: "medium", icon: <Waves className="h-5 w-5" /> },
  { type: "reception", title: "Assistance reception", description: "Question urgente ou besoin particulier.", priority: "urgent", icon: <ConciergeBell className="h-5 w-5" /> },
  { type: "maintenance", title: "Maintenance", description: "Signaler un probleme dans la chambre.", priority: "medium", icon: <Wrench className="h-5 w-5" /> }
];

function ServiceRequestSheet({ service, session, hotelSlug, onClose, onCreated }: { service: ServiceTemplate; session: Session; hotelSlug: string; onClose: () => void; onCreated: (request: RequestItem) => void }) {
  const theme = useGuestTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<RequestDetails>(() => defaultRequestDetails(service.type, today));
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
            <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.muted}`}>Demande structuree</p>
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
          Envoyer a la reception
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
        ["Petit-dejeuner", "Petit-dejeuner"],
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
      <GuestSelect label="Type" value={String(form.itemType ?? "serviettes")} onChange={(value) => update("itemType", value)} options={[["serviettes", "Serviettes"], ["oreillers", "Oreillers"], ["couvertures", "Couvertures"], ["autre", "Autre"]]} />
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

function defaultRequestDetails(type: string, today: string): RequestDetails {
  if (type === "taxi") return { requestedDate: today, requestedTime: "12:00", pickup: "hotel", destinationType: "address", passengers: 1, luggage: 0 };
  if (type === "restaurant") return { requestedDate: today, requestedTime: "20:00", people: 2, budget: "medium" };
  if (type === "room_service") return { asap: true, category: "Autre", quantity: 1 };
  if (type === "towels") return { itemType: "serviettes", quantity: 2, urgent: false };
  if (type === "maintenance") return { category: "Plomberie", description: "", urgent: false, availability: "" };
  return { subject: "", urgent: false, notes: "" };
}

function normalizeRequestPayload(service: ServiceTemplate, form: RequestDetails) {
  const details = { ...form };
  let priority = form.urgent ? "urgent" : service.priority;
  if (service.type === "restaurant") {
    if (form.occasion === "Anniversaire" || form.occasion === "Saint-Valentin") {
      if (priority !== "urgent") priority = "high";
    }
    return {
      title: "Demande reservation restaurant",
      priority,
      details,
      description: `Table pour ${form.people || 2} le ${form.requestedDate || "-"} a ${form.requestedTime || "-"}${form.cuisine ? `, cuisine ${form.cuisine}` : ""}${form.area ? `, quartier ${form.area}` : ""}.${form.notes ? ` ${form.notes}` : ""}`
    };
  }
  if (service.type === "taxi") {
    const destination = taxiDestinationLabel(form);
    return {
      title: "Demande taxi",
      priority,
      details,
      description: `Taxi le ${form.requestedDate || "-"} a ${form.requestedTime || "-"} vers ${destination}. ${form.passengers || 1} passager(s), ${form.luggage || 0} bagage(s).${form.notes ? ` ${form.notes}` : ""}`
    };
  }
  if (service.type === "room_service") {
    const category = form.category || form.requestType || "Demande en chambre";
    return { title: "Demande room service", priority, details, description: `${form.asap ? "Des que possible" : `A ${form.requestedTime || "-"}`} - ${category}${form.quantity ? ` x${form.quantity}` : ""}.${form.notes ? ` ${form.notes}` : ""}` };
  }
  if (service.type === "towels") {
    return { title: "Demande linge", priority, details, description: `${form.quantity || 1} ${form.itemType || "article(s)"} demande(s).${form.notes ? ` ${form.notes}` : ""}` };
  }
  if (service.type === "maintenance") {
    return {
      title: `Maintenance - ${form.category || "Probleme technique"}`,
      priority,
      details,
      description: `${form.category || "Probleme"} : ${form.description || "Pas de description."}`
    };
  }
  return { title: "Assistance reception", priority, details, description: `${form.subject || "Assistance"} - ${form.notes || ""}` };
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

function GuestNav({ basePath, active, hasSession }: { basePath: string; active: GuestSection; hasSession: boolean }) {
  const theme = useGuestTheme();
  const items = [
    { id: "home", label: "Sejour", icon: <Home className="h-4 w-4" /> },
    { id: "services", label: "Services", icon: <ConciergeBell className="h-4 w-4" /> },
    { id: "messages", label: "Messages", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "guide", label: "Guide", icon: <MapPin className="h-4 w-4" /> },
    { id: "review", label: "Avis", icon: <Star className="h-4 w-4" /> }
  ] as const;

  return (
    <nav className={`fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t px-3 pb-3 pt-2 shadow-2xl backdrop-blur md:bottom-6 md:rounded-b-[2rem] ${theme.classes.nav}`}>
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <Link key={item.id} to={`${basePath}/${hasSession ? item.id : item.id === "guide" ? "guide" : "welcome"}`} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition focus:outline-none focus:ring-4 ${active === item.id ? theme.classes.navActive : theme.classes.navIdle}`}>
            {item.icon}
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
    <div className="rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur">
      <div className="text-amber-100">{icon}</div>
      <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-white">{value}</p>
    </div>
  );
}

function StayCard({ icon, label, title, detail }: { icon: React.ReactNode; label: string; title: string; detail: string }) {
  const theme = useGuestTheme();
  return (
    <div className={`rounded-3xl p-4 ${theme.classes.card}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${theme.classes.iconSoft}`}>{icon}</div>
      <p className={`text-xs font-semibold uppercase tracking-wide ${theme.classes.muted}`}>{label}</p>
      <p className="mt-1 truncate font-semibold">{title}</p>
      <p className={`mt-1 truncate text-xs ${theme.classes.muted}`}>{detail}</p>
    </div>
  );
}

function RequestRow({ request }: { request: RequestItem }) {
  const theme = useGuestTheme();
  return (
    <div className={`flex items-start justify-between gap-3 rounded-2xl p-3 ${theme.classes.subtleCard}`}>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{request.title}</p>
        <p className={`mt-1 truncate text-xs ${theme.classes.muted}`}>{request.description}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${requestStatusClass(request.status, theme)}`}>
        {requestStatusLabel(request.status)}
      </span>
    </div>
  );
}

function GuestLoading({ status }: { status: string }) {
  const theme = resolveGuestTheme(undefined);
  return (
    <div className={`grid min-h-screen place-items-center p-6 ${theme.classes.app}`}>
      <div className={`w-full max-w-sm rounded-3xl p-6 text-center ${theme.classes.elevatedCard}`}>
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-4 font-medium">{status}</p>
      </div>
    </div>
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
  if (status === "negative_alert") return "Alerte reception en validation";
  if (status === "resolved") return "Traite par la reception";
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
