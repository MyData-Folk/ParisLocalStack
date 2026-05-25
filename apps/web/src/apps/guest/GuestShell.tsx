import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Bell,
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
  Wifi
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
  createdAt: string;
};

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
    if (!hotel?.id) return undefined;
    return joinHotelRoom(hotel.id);
  }, [hotel?.id]);

  useEffect(() => {
    if (!session) return;
    void loadGuestTimeline(hotelSlug, session, setMessages, setRequests);
  }, [hotelSlug, session?.guestId, session?.stayId]);

  useEffect(() => {
    if (!session || !hotel?.id) return undefined;

    const socket = getSocket();
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

    socket.on("message:new", onMessage);
    socket.on("message:status", onMessageStatus);
    socket.on("request:new", onRequest);
    socket.on("request:status", onRequestStatus);

    return () => {
      socket.off("message:new", onMessage);
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
                onServiceRequest={(service) => createServiceRequest(hotelSlug, session, service, setRequests, setToast)}
              />
            )}
            {activeSection === "services" && session && (
              <ServicesSection
                hotelSlug={hotelSlug}
                session={session}
                requests={requests}
                onServiceRequest={(service) => createServiceRequest(hotelSlug, session, service, setRequests, setToast)}
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
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roomNumber: "", marketingConsent: false, gdprConsent: false });
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
      const stay = await api.createStay(hotelSlug, { guestId: guest.id, roomNumber: form.roomNumber });
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
  const categories = ["all", ...Array.from(new Set(recommendations.map((item) => item.category).filter(Boolean)))];
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? recommendations : recommendations.filter((item) => item.category === category);

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
              <img src={guideImage(index)} alt="" className="h-full w-full object-cover" />
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
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    try {
      await api.createReview(hotelSlug, { ...session, rating, comment });
      setSubmitted(true);
      showToast(setToast, rating <= 3 ? "La reception est alertee." : "Merci pour votre avis.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section className="grid min-h-[26rem] place-items-center px-5 py-6 text-center">
        <div className={`rounded-3xl p-8 ${theme.classes.elevatedCard}`}>
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Merci</h2>
          <p className={`mt-2 text-sm leading-6 ${theme.classes.muted}`}>Votre retour a ete transmis a l'equipe. Nous restons disponibles pendant tout votre sejour.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 px-5 py-6">
      <div>
        <p className={`text-sm font-medium ${theme.classes.muted}`}>Satisfaction</p>
        <h2 className={`mt-1 text-3xl font-semibold ${theme.classes.title}`}>Comment se passe votre sejour ?</h2>
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
        Envoyer mon avis
      </button>
    </section>
  );
}

type ServiceTemplate = { type: string; title: string; description: string; priority: "medium" | "urgent"; icon: React.ReactNode };

const serviceTemplates: ServiceTemplate[] = [
  { type: "taxi", title: "Taxi", description: "La reception reserve votre trajet.", priority: "medium", icon: <Car className="h-5 w-5" /> },
  { type: "restaurant", title: "Restaurant", description: "Une table ou une recommandation.", priority: "medium", icon: <Utensils className="h-5 w-5" /> },
  { type: "room_service", title: "Room service", description: "Commande ou demande en chambre.", priority: "medium", icon: <ShoppingBag className="h-5 w-5" /> },
  { type: "towels", title: "Serviettes", description: "Serviettes ou linge supplementaire.", priority: "medium", icon: <Waves className="h-5 w-5" /> },
  { type: "reception", title: "Assistance reception", description: "Question urgente ou besoin particulier.", priority: "urgent", icon: <ConciergeBell className="h-5 w-5" /> }
];

async function createServiceRequest(hotelSlug: string, session: Session, service: ServiceTemplate, setRequests: React.Dispatch<React.SetStateAction<RequestItem[]>>, setToast: (value: string) => void) {
  const created = await api.createRequest(hotelSlug, {
    ...session,
    type: service.type,
    title: service.title,
    description: service.description,
    priority: service.priority
  });
  setRequests((current) => upsertById(current, created).sort(sortByCreatedAtDesc));
  showToast(setToast, `${service.title} transmis a la reception.`);
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
