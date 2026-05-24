import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Inbox, ListChecks, LogOut, Star, Users } from "lucide-react";
import { api } from "../../lib/api";
import { extractHotelSlug } from "../../lib/tenant";

type AuthState = {
  token: string;
  user: { id: string; name: string; role: string; hotelIds: string[] };
};

export function ReceptionApp() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const raw = localStorage.getItem("reception-auth");
    return raw ? JSON.parse(raw) as AuthState : null;
  });

  if (!auth) return <ReceptionLogin onLogin={setAuth} />;

  const hotelId = auth.user.hotelIds[0];
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 border-r border-white/10 bg-slate-900 p-4">
        <h1 className="text-lg font-semibold">Reception</h1>
        <p className="text-sm text-slate-400">{auth.user.name}</p>
        <nav className="mt-6 space-y-2 text-sm">
          <NavItem to="/reception/inbox" icon={<Inbox className="h-4 w-4" />} label="Messages" />
          <NavItem to="/reception/requests" icon={<ListChecks className="h-4 w-4" />} label="Demandes" />
          <NavItem to="/reception/guests" icon={<Users className="h-4 w-4" />} label="CRM clients" />
          <NavItem to="/reception/reviews" icon={<Star className="h-4 w-4" />} label="Avis" />
        </nav>
        <button onClick={() => { localStorage.removeItem("reception-auth"); setAuth(null); }} className="mt-8 inline-flex items-center gap-2 text-sm text-slate-300"><LogOut className="h-4 w-4" /> Deconnexion</button>
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <Routes>
          <Route index element={<Navigate to="inbox" replace />} />
          <Route path="inbox" element={<InboxView hotelId={hotelId} token={auth.token} />} />
          <Route path="requests" element={<RequestsView hotelId={hotelId} token={auth.token} />} />
          <Route path="guests" element={<DataView title="CRM clients" loader={() => api.hotelGuests(hotelId, auth.token)} />} />
          <Route path="reviews" element={<DataView title="Avis clients" loader={() => api.hotelReviews(hotelId, auth.token)} />} />
          <Route path="analytics" element={<DataView title="Analytics" loader={() => Promise.resolve([])} />} />
          <Route path="settings" element={<DataView title="Settings" loader={() => Promise.resolve([])} />} />
        </Routes>
      </main>
    </div>
  );
}

function ReceptionLogin({ onLogin }: { onLogin: (auth: AuthState) => void }) {
  const [email, setEmail] = useState("reception@vendome.test");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const slug = extractHotelSlug();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const auth = await api.login(email, password);
      localStorage.setItem("reception-auth", JSON.stringify(auth));
      onLogin(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-white/10 bg-slate-900 p-5">
        <p className="text-sm text-amber-300">{slug ? `admin.${slug}` : "Reception"}</p>
        <h1 className="text-xl font-semibold">Connexion reception</h1>
        <input className="mt-5 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="mt-3 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button className="mt-4 w-full rounded-md bg-amber-400 px-4 py-2 font-medium text-slate-950">Entrer</button>
      </form>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return <Link to={to} className={`flex items-center gap-2 rounded-md px-3 py-2 ${active ? "bg-white/10" : "text-slate-300 hover:bg-white/5"}`}>{icon}{label}</Link>;
}

function InboxView({ hotelId, token }: { hotelId: string; token: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    void api.hotelMessages(hotelId, token).then(setMessages);
  }, [hotelId, token]);

  const active = useMemo(() => messages.find((item) => item.id === activeId) ?? messages[0], [activeId, messages]);

  async function sendReply() {
    if (!active || !reply.trim()) return;
    const created = await api.replyMessage(active.id, reply, token);
    setMessages([created, ...messages]);
    setReply("");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Messages clients</h1>
      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-white/10 bg-slate-900">
          {messages.length === 0 && <p className="p-4 text-sm text-slate-400">Aucun message.</p>}
          {messages.map((message) => (
            <button key={message.id} onClick={() => setActiveId(message.id)} className="block w-full border-b border-white/10 p-4 text-left hover:bg-white/5">
              <p className="font-medium">{message.guest?.firstName} {message.guest?.lastName}</p>
              <p className="truncate text-sm text-slate-400">{message.content}</p>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
          {active ? (
            <>
              <p className="text-sm text-slate-400">Chambre {active.stay?.roomNumber ?? "-"}</p>
              <p className="mt-4">{active.content}</p>
              <textarea className="mt-5 min-h-28 w-full rounded-md border border-white/10 bg-slate-950 p-3" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reponse reception" />
              <button onClick={() => void sendReply()} className="mt-3 rounded-md bg-amber-400 px-4 py-2 font-medium text-slate-950">Repondre</button>
            </>
          ) : <p className="text-slate-400">Selectionnez un message.</p>}
        </div>
      </div>
    </div>
  );
}

function RequestsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setError("");

    Promise.all([api.hotelRequests(hotelId, token), api.hotelMessages(hotelId, token)])
      .then(([requests, messages]) => {
        if (!mounted) return;
        const normalized = [
          ...requests.map((item) => ({ ...item, source: "request" })),
          ...messages
            .filter((item) => item.senderType === "guest")
            .map((item) => ({
              ...item,
              source: "message",
              title: "Message client",
              description: item.content
            }))
        ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
        setItems(normalized);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erreur de chargement");
      });

    return () => { mounted = false; };
  }, [hotelId, token]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Demandes reception</h1>
      <div className="mt-5 rounded-lg border border-white/10 bg-slate-900">
        {error && <p className="p-4 text-sm text-red-300">{error}</p>}
        {!error && items.length === 0 && <p className="p-4 text-sm text-slate-400">Aucune demande.</p>}
        {items.map((item) => (
          <div key={`${item.source}:${item.id}`} className="border-b border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-white/10 px-2 py-1 text-xs uppercase text-amber-300">
                {item.source === "message" ? "message" : item.type}
              </span>
              <p className="font-medium">{item.title}</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              {item.guest?.firstName} {item.guest?.lastName} - Chambre {item.stay?.roomNumber ?? "-"} - {item.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataView({ title, loader }: { title: string; loader: () => Promise<any[]> }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { void loader().then(setItems); }, [loader]);
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-5 rounded-lg border border-white/10 bg-slate-900">
        {items.length === 0 && <p className="p-4 text-sm text-slate-400">Aucune donnee.</p>}
        {items.map((item) => (
          <div key={item.id} className="border-b border-white/10 p-4">
            <p className="font-medium">{item.title || item.name || `${item.firstName ?? ""} ${item.lastName ?? ""}` || `Note ${item.rating}/5`}</p>
            <p className="text-sm text-slate-400">{item.description || item.comment || item.email || item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
