import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock, Inbox, ListChecks, LogOut, Star, Users } from "lucide-react";
import { api } from "../../lib/api";
import { extractHotelSlug } from "../../lib/tenant";

type AuthState = {
  token: string;
  user: { id: string; name: string; role: string; hotelIds: string[] };
};

type MessageItem = {
  id: string;
  guestId?: string;
  stayId?: string;
  senderType: "guest" | "reception";
  content: string;
  status?: string;
  priority?: string;
  createdAt: string;
  guest?: { firstName?: string; lastName?: string; email?: string };
  stay?: { roomNumber?: string };
};

type Conversation = {
  id: string;
  guestName: string;
  roomNumber: string;
  messages: MessageItem[];
  lastMessage: MessageItem;
  lastGuestMessage: MessageItem;
  status: "new" | "in_progress" | "answered" | "urgent" | "done";
};

type FilterKey = "all" | "new" | "urgent" | "answered";

export function ReceptionApp({ basePath = "" }: { basePath?: string }) {
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
          <NavItem to={`${basePath}/inbox`} icon={<Inbox className="h-4 w-4" />} label="Messages" />
          <NavItem to={`${basePath}/requests`} icon={<ListChecks className="h-4 w-4" />} label="Demandes" />
          <NavItem to={`${basePath}/guests`} icon={<Users className="h-4 w-4" />} label="CRM clients" />
          <NavItem to={`${basePath}/reviews`} icon={<Star className="h-4 w-4" />} label="Avis" />
        </nav>
        <button onClick={() => { localStorage.removeItem("reception-auth"); setAuth(null); }} className="mt-8 inline-flex items-center gap-2 text-sm text-slate-300"><LogOut className="h-4 w-4" /> Deconnexion</button>
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <Routes>
          <Route path={basePath || "/"} element={<Navigate to={`${basePath}/inbox`} replace />} />
          <Route path={`${basePath}/inbox`} element={<InboxView hotelId={hotelId} token={auth.token} />} />
          <Route path={`${basePath}/requests`} element={<RequestsView hotelId={hotelId} token={auth.token} />} />
          <Route path={`${basePath}/guests`} element={<DataView title="CRM clients" loader={() => api.hotelGuests(hotelId, auth.token)} />} />
          <Route path={`${basePath}/reviews`} element={<DataView title="Avis clients" loader={() => api.hotelReviews(hotelId, auth.token)} />} />
          <Route path={`${basePath}/analytics`} element={<DataView title="Analytics" loader={() => Promise.resolve([])} />} />
          <Route path={`${basePath}/settings`} element={<DataView title="Settings" loader={() => Promise.resolve([])} />} />
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
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [reply, setReply] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadMessages();
  }, [hotelId, token]);

  async function loadMessages() {
    setError("");
    try {
      setMessages(await api.hotelMessages(hotelId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  const conversations = useMemo(() => buildConversations(messages), [messages]);
  const filtered = useMemo(() => {
    if (filter === "new") return conversations.filter((item) => item.status === "new");
    if (filter === "urgent") return conversations.filter((item) => item.status === "urgent");
    if (filter === "answered") return conversations.filter((item) => item.status === "answered" || item.status === "done");
    return conversations;
  }, [conversations, filter]);
  const active = useMemo(() => filtered.find((item) => item.id === activeId) ?? filtered[0] ?? conversations[0], [activeId, conversations, filtered]);
  const pendingCount = conversations.filter((item) => item.status === "new" || item.status === "urgent").length;

  async function sendReply() {
    if (!active || !reply.trim()) return;
    const created = await api.replyMessage(active.lastMessage.id, reply, token);
    setMessages([created, ...messages]);
    setReply("");
  }

  async function markConversationDone() {
    if (!active) return;
    await Promise.all(active.messages.map((item) => api.updateMessageStatus(item.id, "done", token)));
    await loadMessages();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Messages clients</h1>
          <p className="mt-1 text-sm text-slate-400">{pendingCount} conversation{pendingCount > 1 ? "s" : ""} a traiter</p>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-slate-900 p-1 text-sm">
          {([
            ["all", "Tous"],
            ["new", "Nouveaux"],
            ["urgent", "Urgents"],
            ["answered", "Repondus"]
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-md px-3 py-2 ${filter === key ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <div className="mt-5 grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900">
          {filtered.length === 0 && <p className="p-4 text-sm text-slate-400">Aucun message.</p>}
          {filtered.map((conversation) => (
            <button key={conversation.id} onClick={() => setActiveId(conversation.id)} className={`block w-full border-b border-white/10 p-4 text-left hover:bg-white/5 ${active?.id === conversation.id ? "bg-white/10" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{conversation.guestName}</p>
                  <p className="text-xs text-slate-400">Chambre {conversation.roomNumber}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={conversation.status} />
                  <span className="text-xs text-slate-500">{formatTime(conversation.lastMessage.createdAt)}</span>
                </div>
              </div>
              <p className="mt-3 truncate text-sm text-slate-300">
                <span className="text-slate-500">{conversation.lastMessage.senderType === "reception" ? "Reception: " : "Client: "}</span>
                {conversation.lastMessage.content}
              </p>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900">
          {active ? (
            <>
              <div className="border-b border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{active.guestName}</p>
                    <p className="text-sm text-slate-400">Chambre {active.roomNumber} - {active.messages.length} message{active.messages.length > 1 ? "s" : ""}</p>
                  </div>
                  <StatusBadge status={active.status} />
                </div>
              </div>
              <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
                {active.messages.map((item) => (
                  <div key={item.id} className={`flex ${item.senderType === "reception" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm ${item.senderType === "reception" ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}>
                      <div className="mb-1 flex items-center justify-between gap-4 text-xs opacity-70">
                        <span>{item.senderType === "reception" ? "Reception" : "Client"}</span>
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                      <p>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 p-4">
                <textarea className="min-h-28 w-full rounded-md border border-white/10 bg-slate-950 p-3" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reponse reception" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => void sendReply()} className="rounded-md bg-amber-400 px-4 py-2 font-medium text-slate-950">Repondre</button>
                  <button onClick={() => void markConversationDone()} className="rounded-md border border-white/10 px-4 py-2 text-slate-200 hover:bg-white/5">Marquer comme traite</button>
                </div>
              </div>
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

  async function updateStatus(item: any, status: string) {
    if (item.source === "request") await api.updateRequestStatus(item.id, status, token);
    if (item.source === "message") await api.updateMessageStatus(item.id, status, token);
    setItems((current) => current.map((entry) => entry.id === item.id && entry.source === item.source ? { ...entry, status } : entry));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Demandes reception</h1>
          <p className="mt-1 text-sm text-slate-400">{items.length} element{items.length > 1 ? "s" : ""} operationnel{items.length > 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-slate-900">
        {error && <p className="p-4 text-sm text-red-300">{error}</p>}
        {!error && items.length === 0 && <p className="p-4 text-sm text-slate-400">Aucune demande.</p>}
        {items.map((item) => (
          <div key={`${item.source}:${item.id}`} className="border-b border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-white/10 px-2 py-1 text-xs uppercase text-amber-300">
                    {item.source === "message" ? "message" : item.type}
                  </span>
                  <StatusBadge status={normalizeStatus(item.status, item.priority, item.senderType)} />
                  <p className="font-medium">{item.title}</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.guest?.firstName} {item.guest?.lastName} - Chambre {item.stay?.roomNumber ?? "-"} - {formatTime(item.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void updateStatus(item, "in_progress")} className="rounded-md border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">En cours</button>
                <button onClick={() => void updateStatus(item, "done")} className="rounded-md border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">Traite</button>
                <button onClick={() => void updateStatus(item, "urgent")} className="rounded-md border border-red-400/30 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10">Urgent</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildConversations(messages: MessageItem[]): Conversation[] {
  const groups = new Map<string, MessageItem[]>();
  for (const message of messages) {
    const key = `${message.guestId ?? "guest"}:${message.stayId ?? "stay"}`;
    groups.set(key, [...(groups.get(key) ?? []), message]);
  }

  return Array.from(groups.entries()).map(([id, items]) => {
    const ordered = [...items].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    const lastMessage = ordered[ordered.length - 1];
    const guestMessages = ordered.filter((item) => item.senderType === "guest");
    const lastGuestMessage = guestMessages[guestMessages.length - 1] ?? lastMessage;
    const guestName = `${lastMessage.guest?.firstName ?? ""} ${lastMessage.guest?.lastName ?? ""}`.trim() || lastMessage.guest?.email || "Client";
    return {
      id,
      guestName,
      roomNumber: lastMessage.stay?.roomNumber ?? "-",
      messages: ordered,
      lastMessage,
      lastGuestMessage,
      status: normalizeStatus(lastMessage.status, lastMessage.priority, lastMessage.senderType)
    };
  }).sort((left, right) => new Date(right.lastMessage.createdAt).getTime() - new Date(left.lastMessage.createdAt).getTime());
}

function normalizeStatus(status?: string, priority?: string, senderType?: string): Conversation["status"] {
  if (status === "urgent" || priority === "urgent") return "urgent";
  if (status === "in_progress") return "in_progress";
  if (status === "done" || status === "closed") return "done";
  if (senderType === "reception") return "answered";
  return "new";
}

function StatusBadge({ status }: { status: Conversation["status"] }) {
  const config = {
    new: { label: "Nouveau", className: "border-blue-400/30 bg-blue-500/10 text-blue-200", icon: <Clock className="h-3 w-3" /> },
    in_progress: { label: "En cours", className: "border-amber-400/30 bg-amber-500/10 text-amber-200", icon: <Clock className="h-3 w-3" /> },
    answered: { label: "Repondu", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200", icon: <CheckCircle className="h-3 w-3" /> },
    urgent: { label: "Urgent", className: "border-red-400/30 bg-red-500/10 text-red-200", icon: <AlertTriangle className="h-3 w-3" /> },
    done: { label: "Traite", className: "border-slate-400/30 bg-slate-500/10 text-slate-200", icon: <CheckCircle className="h-3 w-3" /> }
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
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
