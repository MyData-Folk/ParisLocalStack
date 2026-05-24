import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageSquare, Send, Star, Wifi } from "lucide-react";
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

  const theme = useMemo(() => ({ "--hotel": hotel?.primaryColor ?? "#c9a84c" }) as React.CSSProperties, [hotel]);

  if (status) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">{status}</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={theme}>
      <header className="border-b border-white/10 bg-slate-900/80 px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-amber-300">Digital Hotel Concierge</p>
        <h1 className="text-2xl font-semibold">{hotel?.name}</h1>
        <p className="text-sm text-slate-300">{hotel?.description}</p>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3 text-sm">
        {["welcome", "guide", "services", "messages", "review"].map((item) => (
          <Link key={item} to={`/h/${hotelSlug}/${item}`} className="rounded-md border border-white/10 px-3 py-2 text-slate-200">{item}</Link>
        ))}
      </nav>

      <main className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {!session ? <Onboarding hotelSlug={hotelSlug} onReady={setSession} /> : <GuestActions hotelSlug={hotelSlug} session={session} />}
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
            <Wifi className="mb-2 h-5 w-5 text-amber-300" />
            <h2 className="font-semibold">Wi-Fi</h2>
            <p className="text-sm text-slate-300">{settings?.wifiName || "Demandez a la reception"}</p>
            <p className="text-sm text-slate-400">{settings?.wifiPassword || ""}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
            <h2 className="font-semibold">Adresses proches</h2>
            <div className="mt-3 space-y-3">
              {recommendations.map((item) => (
                <div key={item.id} className="border-t border-white/10 pt-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
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
    <form onSubmit={submit} className="rounded-lg border border-white/10 bg-slate-900 p-4">
      <h2 className="text-lg font-semibold">Bienvenue</h2>
      <p className="mb-4 text-sm text-slate-400">Identifiez votre sejour pour contacter la reception.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(["firstName", "lastName", "email", "phone", "roomNumber"] as const).map((field) => (
          <input key={field} required={field !== "phone"} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2" placeholder={field} value={String(form[field])} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
        ))}
      </div>
      <label className="mt-3 flex gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={form.marketingConsent} onChange={(event) => setForm({ ...form, marketingConsent: event.target.checked })} />
        J'accepte de recevoir les communications de l'hotel.
      </label>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button className="mt-4 rounded-md bg-amber-400 px-4 py-2 font-medium text-slate-950">Demarrer</button>
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
    <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
      <h2 className="text-lg font-semibold">Chambre {session.roomNumber}</h2>
      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-md border border-white/10 bg-slate-950 p-3">
        {conversation.length === 0 && <p className="text-sm text-slate-400">Aucun message pour le moment.</p>}
        {conversation.map((item) => (
          <div key={item.id} className={`flex ${item.senderType === "reception" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${item.senderType === "reception" ? "bg-white/10 text-slate-100" : "bg-amber-400 text-slate-950"}`}>
              <p className="text-xs opacity-70">{item.senderType === "reception" ? "Reception" : "Vous"}</p>
              <p>{item.content}</p>
            </div>
          </div>
        ))}
      </div>
      <textarea className="mt-4 min-h-28 w-full rounded-md border border-white/10 bg-slate-950 p-3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message, demande ou commentaire" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => void sendMessage("message")} className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-slate-950"><MessageSquare className="h-4 w-4" /> Message</button>
        <button onClick={() => void sendMessage("taxi")} className="rounded-md border border-white/10 px-3 py-2">Taxi</button>
        <button onClick={() => void sendMessage("restaurant")} className="rounded-md border border-white/10 px-3 py-2">Restaurant</button>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Star className="h-5 w-5 text-amber-300" />
        <input type="range" min={1} max={5} value={review} onChange={(event) => setReview(Number(event.target.value))} />
        <span>{review}/5</span>
        <button onClick={() => void sendReview()} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2"><Send className="h-4 w-4" /> Avis</button>
      </div>
      {status && <p className="mt-3 text-sm text-emerald-300">{status}</p>}
    </div>
  );
}
