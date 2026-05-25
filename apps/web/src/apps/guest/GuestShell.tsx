import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Clock, MapPin, MessageSquare, Phone, Send, Sparkles, Star, Utensils, Wifi } from "lucide-react";
import { api } from "../../lib/api";
import { routeHotelSlug } from "../../lib/tenant";

type Session = { guestId: string; stayId: string; roomNumber: string };

export function GuestShell() {
  const { hotelSlug: pathSlug } = useParams();
  const hotelSlug = routeHotelSlug(pathSlug);
  const [hotel, setHotel] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(`guest-session:${hotelSlug}`);
    return raw ? JSON.parse(raw) as Session : null;
  });
  const [status, setStatus] = useState("Chargement...");

  useEffect(() => {
    Promise.all([api.hotelBySlug(hotelSlug), api.settings(hotelSlug), api.recommendations(hotelSlug)])
      .then(([hotelData, settingsData, recs]) => {
        setHotel(hotelData);
        setSettings(settingsData);
        setRecommendations(recs);
        setStatus("");
      })
      .catch((error) => setStatus(error.message));
  }, [hotelSlug]);

  const navigation = useMemo(() => [
    { id: "welcome", label: "Accueil" },
    { id: "guide", label: "Guide" },
    { id: "services", label: "Services" },
    { id: "messages", label: "Messages" },
    { id: "review", label: "Avis" }
  ], []);

  if (status) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-2xl bg-amber-300/20" />
          <p className="font-medium">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_32%),linear-gradient(180deg,#020617,#0f172a)] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/70 px-4 py-5 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Digital Hotel Concierge
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{hotel?.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{hotel?.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:flex">
            <InfoPill icon={<Clock className="h-4 w-4" />} label="Check-in" value={settings?.checkinTime || "15:00"} />
            <InfoPill icon={<Phone className="h-4 w-4" />} label="Reception" value={settings?.receptionPhone || "24/7"} />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto text-sm">
          {navigation.map((item) => (
            <Link key={item.id} to={`/h/${hotelSlug}/${item.id}`} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-medium text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300/10">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[minmax(0,1fr)_340px] md:p-8">
        <section className="space-y-6">
          {!session ? <Onboarding hotelSlug={hotelSlug} onReady={setSession} /> : <GuestActions hotelSlug={hotelSlug} session={session} />}
        </section>
        <aside className="space-y-4 md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight">Wi-Fi invite</h2>
                <p className="text-xs text-slate-500">Connexion hotel securisee</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm font-medium text-slate-200">{settings?.wifiName || "Demandez a la reception"}</p>
              <p className="mt-1 text-sm text-slate-400">{settings?.wifiPassword || "Mot de passe disponible a l'accueil"}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight">Adresses proches</h2>
                <p className="text-xs text-slate-500">Selection locale de l'hotel</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {recommendations.length === 0 && <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">Aucune recommandation disponible.</p>}
              {recommendations.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-emerald-300/20">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Onboarding({ hotelSlug, onReady }: { hotelSlug: string; onReady: (session: Session) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roomNumber: "", marketingConsent: false });
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const guest = await api.createGuest(hotelSlug, { ...form, language: navigator.language.slice(0, 2) || "fr" });
      const stay = await api.createStay(hotelSlug, { guestId: guest.id, roomNumber: form.roomNumber });
      const session = { guestId: guest.id, stayId: stay.id, roomNumber: form.roomNumber };
      localStorage.setItem(`guest-session:${hotelSlug}`, JSON.stringify(session));
      onReady(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-slate-900/85 p-5 shadow-lg shadow-black/20 md:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
          <CheckCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Bienvenue</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Identifiez votre sejour pour contacter la reception et recevoir les informations utiles.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(["firstName", "lastName", "email", "phone", "roomNumber"] as const).map((field) => (
          <input key={field} required={field !== "phone"} className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-300/60 focus:ring-4 focus:ring-amber-300/10" placeholder={field} value={String(form[field])} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
        ))}
      </div>
      <label className="mt-4 flex gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
        <input className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 accent-amber-300" type="checkbox" checked={form.marketingConsent} onChange={(event) => setForm({ ...form, marketingConsent: event.target.checked })} />
        J'accepte de recevoir les communications de l'hotel.
      </label>
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <button className="mt-5 rounded-xl bg-amber-300 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20">Demarrer</button>
    </form>
  );
}

function GuestActions({ hotelSlug, session }: { hotelSlug: string; session: Session }) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<any[]>([]);
  const [review, setReview] = useState(5);
  const [status, setStatus] = useState("");

  async function loadConversation() {
    const messages = await api.guestMessages(hotelSlug, session);
    setConversation(messages);
  }

  useEffect(() => {
    void loadConversation();
    const timer = window.setInterval(() => void loadConversation(), 5000);
    return () => window.clearInterval(timer);
  }, [hotelSlug, session.guestId, session.stayId]);

  async function sendMessage(kind: "message" | "taxi" | "restaurant") {
    setStatus("");
    if (kind === "message") {
      await api.createMessage(hotelSlug, { ...session, content: message, priority: "medium" });
      await loadConversation();
    }
    if (kind !== "message") await api.createRequest(hotelSlug, {
      ...session,
      type: kind,
      title: kind === "taxi" ? "Demande taxi" : "Reservation restaurant",
      description: message || "Demande envoyee depuis l'application client",
      priority: "medium"
    });
    setMessage("");
    setStatus("Envoye a la reception.");
  }

  async function sendReview() {
    await api.createReview(hotelSlug, { ...session, rating: review, comment: message });
    setStatus(review <= 3 ? "Merci, la reception est alertee." : "Merci pour votre avis.");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/85 p-5 shadow-lg shadow-black/20 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Conversation reception</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Chambre {session.roomNumber}</h2>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">Session active</span>
      </div>
      <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4">
        {conversation.length === 0 && <p className="text-sm text-slate-400">Aucun message pour le moment.</p>}
        {conversation.map((item) => (
          <div key={item.id} className={`flex ${item.senderType === "reception" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${item.senderType === "reception" ? "bg-white/10 text-slate-100" : "bg-amber-300 text-slate-950"}`}>
              <p className="text-xs opacity-70">{item.senderType === "reception" ? "Reception" : "Vous"}</p>
              <p className="mt-1 leading-6">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
      <textarea className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 outline-none transition placeholder:text-slate-600 focus:border-amber-300/60 focus:ring-4 focus:ring-amber-300/10" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message, demande ou commentaire" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => void sendMessage("message")} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20"><MessageSquare className="h-4 w-4" /> Message</button>
        <button onClick={() => void sendMessage("taxi")} className="rounded-xl border border-white/10 px-4 py-2.5 font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">Taxi</button>
        <button onClick={() => void sendMessage("restaurant")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10"><Utensils className="h-4 w-4" /> Restaurant</button>
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Star className="h-5 w-5 text-amber-300" />
          <input className="accent-amber-300" type="range" min={1} max={5} value={review} onChange={(event) => setReview(Number(event.target.value))} />
          <span className="text-sm font-medium">{review}/5</span>
          <button onClick={() => void sendReview()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10"><Send className="h-4 w-4" /> Envoyer un avis</button>
        </div>
      </div>
      {status && <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-200">{status}</p>}
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
