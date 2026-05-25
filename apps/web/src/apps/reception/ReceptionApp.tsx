import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, BedDouble, CalendarDays, CheckCircle, Clock, Inbox, Languages, ListChecks, LogOut, Mail, MessageSquare, Phone, Radio, Search, ShieldCheck, Star, Users } from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";
import { api } from "../../lib/api";
import { getSocket, joinHotelRoom } from "../../lib/socket";
import { useAppStore } from "../../stores/appStore";

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
  return (
    <AuthGate title="Connexion reception" subtitle="Acces securise au dashboard hotel" allowedRoles={["super_admin", "hotel_admin", "receptionist"]}>
      <ReceptionDashboard basePath={basePath} />
    </AuthGate>
  );
}

function ReceptionDashboard({ basePath }: { basePath: string }) {
  const { currentUser, token, logout } = useAppStore();
  if (!currentUser || !token) return null;

  const hotelId = currentUser.hotelIds[0];
  const routePath = (path: string) => basePath ? path.replace(/^\//, "") : path;
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_34%),linear-gradient(180deg,#020617,#0f172a_42%,#111827)] text-slate-100 lg:flex">
      <aside className="border-b border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:border-b-0 lg:border-r lg:border-white/10 lg:p-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Paris Local</p>
              <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">Reception</h1>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/55 p-3">
            <p className="truncate text-sm font-medium text-white">{currentUser.name}</p>
            <p className="mt-1 text-xs text-slate-500">Centre operationnel hotelier</p>
          </div>
        </div>
        <nav className="mt-4 grid grid-cols-2 gap-2 text-sm lg:block lg:space-y-2">
          <NavItem to={`${basePath}/inbox`} icon={<Inbox className="h-4 w-4" />} label="Messages" />
          <NavItem to={`${basePath}/requests`} icon={<ListChecks className="h-4 w-4" />} label="Demandes" />
          <NavItem to={`${basePath}/guests`} icon={<Users className="h-4 w-4" />} label="CRM clients" />
          <NavItem to={`${basePath}/reviews`} icon={<Star className="h-4 w-4" />} label="Avis" />
        </nav>
        <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4" />
            Synchronisation active
          </div>
          <p className="mt-2 leading-5 text-emerald-100/70">Messages, demandes et avis sont mis a jour en direct.</p>
        </div>
        <button onClick={() => void logout()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10 lg:mt-8">
          <LogOut className="h-4 w-4" /> Deconnexion
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6 xl:p-8">
        <Routes>
          <Route index element={<Navigate to={`${basePath}/inbox`} replace />} />
          <Route path={routePath("/inbox")} element={<InboxView hotelId={hotelId} token={token} />} />
          <Route path={routePath("/requests")} element={<RequestsView hotelId={hotelId} token={token} />} />
          <Route path={routePath("/guests")} element={<GuestsView hotelId={hotelId} token={token} />} />
          <Route path={routePath("/reviews")} element={<ReviewsView hotelId={hotelId} token={token} />} />
          <Route path={routePath("/analytics")} element={<DataView title="Analytics" loader={() => Promise.resolve([])} />} />
          <Route path={routePath("/settings")} element={<DataView title="Settings" loader={() => Promise.resolve([])} />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${active ? "border border-amber-300/25 bg-amber-300/12 text-amber-100 shadow-sm" : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"}`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${active ? "bg-amber-300 text-slate-950" : "bg-white/[0.04] text-slate-400 group-hover:text-white"}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function InboxView({ hotelId, token }: { hotelId: string; token: string }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [reply, setReply] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadMessages();
  }, [hotelId, token]);

  useEffect(() => joinHotelRoom(hotelId), [hotelId]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (message: MessageItem) => {
      setMessages((current) => upsertById(current, message).sort(sortMessagesDesc));
    };
    const onMessageStatus = (message: MessageItem) => {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item));
    };

    socket.on("message:new", onMessage);
    socket.on("message:status", onMessageStatus);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:status", onMessageStatus);
    };
  }, []);

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
    const byFilter = filter === "new"
      ? conversations.filter((item) => item.status === "new")
      : filter === "urgent"
        ? conversations.filter((item) => item.status === "urgent")
        : filter === "answered"
          ? conversations.filter((item) => item.status === "answered" || item.status === "done")
          : conversations;
    const query = search.trim().toLowerCase();
    if (!query) return byFilter;
    return byFilter.filter((item) =>
      item.guestName.toLowerCase().includes(query)
      || item.roomNumber.toLowerCase().includes(query)
      || item.lastMessage.content.toLowerCase().includes(query)
    );
  }, [conversations, filter, search]);
  const active = useMemo(() => filtered.find((item) => item.id === activeId) ?? filtered[0] ?? conversations[0], [activeId, conversations, filtered]);
  const pendingCount = conversations.filter((item) => item.status === "new" || item.status === "urgent").length;
  const urgentCount = conversations.filter((item) => item.status === "urgent").length;
  const answeredCount = conversations.filter((item) => item.status === "answered" || item.status === "done").length;

  async function sendReply() {
    if (!active || !reply.trim()) return;
    const created = await api.replyMessage(active.lastMessage.id, reply, token);
    setMessages((current) => upsertById(current, created).sort(sortMessagesDesc));
    setReply("");
  }

  async function markConversationDone() {
    if (!active) return;
    await Promise.all(active.messages.map((item) => api.updateMessageStatus(item.id, "done", token)));
    await loadMessages();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inbox operationnelle"
        title="Messages clients"
        description={`${pendingCount} conversation${pendingCount > 1 ? "s" : ""} a traiter en temps reel`}
        live
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Inbox className="h-4 w-4" />} label="A traiter" value={pendingCount} tone="amber" />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Urgents" value={urgentCount} tone="red" />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label="Repondus" value={answeredCount} tone="emerald" />
      </div>
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      <div className="grid gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/20">
          <div className="border-b border-white/10 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher client, chambre, message" className="w-full rounded-xl border border-white/10 bg-slate-950/75 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-amber-300/60 focus:ring-4 focus:ring-amber-300/10" />
            </div>
            <div className="mt-3 flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-1 text-sm">
              {([
                ["all", "Tous"],
                ["new", "Nouveaux"],
                ["urgent", "Urgents"],
                ["answered", "Repondus"]
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} className={`flex-1 rounded-lg px-3 py-2 font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${filter === key ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 && <EmptyState icon={<Inbox className="h-6 w-6" />} title="Aucun message" description="Les conversations clients apparaitront ici en direct." />}
          {filtered.map((conversation) => (
            <button key={conversation.id} onClick={() => setActiveId(conversation.id)} className={`block w-full border-b border-white/10 p-4 text-left transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-amber-300/10 ${active?.id === conversation.id ? "bg-amber-300/10 ring-1 ring-inset ring-amber-300/20" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-sm font-semibold text-amber-200">
                    {conversation.guestName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{conversation.guestName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><BedDouble className="h-3.5 w-3.5" /> Chambre {conversation.roomNumber}</p>
                  </div>
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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/20">
          {active ? (
            <>
              <div className="border-b border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-lg font-semibold text-slate-950">
                      {active.guestName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{active.guestName}</p>
                      <p className="text-sm text-slate-400">Chambre {active.roomNumber} - {active.messages.length} message{active.messages.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <StatusBadge status={active.status} />
                </div>
              </div>
              <div className="max-h-[56vh] space-y-3 overflow-y-auto bg-slate-950/25 p-5">
                {active.messages.map((item) => (
                  <div key={item.id} className={`flex ${item.senderType === "reception" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${item.senderType === "reception" ? "rounded-br-md bg-amber-300 text-slate-950" : "rounded-bl-md border border-white/10 bg-slate-800 text-slate-100"}`}>
                      <div className="mb-1 flex items-center justify-between gap-4 text-xs opacity-70">
                        <span>{item.senderType === "reception" ? "Reception" : "Client"}</span>
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                      <p>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 bg-slate-900/95 p-5">
                <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 outline-none transition placeholder:text-slate-600 focus:border-amber-300/60 focus:ring-4 focus:ring-amber-300/10" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reponse reception" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => void sendReply()} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20"><MessageSquare className="h-4 w-4" /> Repondre</button>
                  <button onClick={() => void markConversationDone()} className="rounded-xl border border-white/10 px-4 py-2.5 font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">Marquer comme traite</button>
                </div>
              </div>
            </>
          ) : <p className="p-5 text-slate-400">Selectionnez un message.</p>}
        </div>
      </div>
    </div>
  );
}

function RequestsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadRequests();
  }, [hotelId, token]);

  useEffect(() => joinHotelRoom(hotelId), [hotelId]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (message: any) => {
      if (message.senderType !== "guest") return;
      const normalized = { ...message, source: "message", title: "Message client", description: message.content };
      setItems((current) => upsertOperationalItem(current, normalized).sort(sortOperationalDesc));
    };
    const onMessageStatus = (message: any) => {
      setItems((current) => current.map((item) => item.source === "message" && item.id === message.id ? { ...item, ...message } : item));
    };
    const onRequest = (request: any) => {
      setItems((current) => upsertOperationalItem(current, { ...request, source: "request" }).sort(sortOperationalDesc));
    };
    const onRequestStatus = (request: any) => {
      setItems((current) => upsertOperationalItem(current, { ...request, source: "request" }).sort(sortOperationalDesc));
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
  }, []);

  async function loadRequests() {
    setError("");
    try {
      const [requests, messages] = await Promise.all([api.hotelRequests(hotelId, token), api.hotelMessages(hotelId, token)]);
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
      ].sort(sortOperationalDesc);
      setItems(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  async function updateStatus(item: any, status: string) {
    if (item.source === "request") await api.updateRequestStatus(item.id, status, token);
    if (item.source === "message") await api.updateMessageStatus(item.id, status, token);
    setItems((current) => current.map((entry) => entry.id === item.id && entry.source === item.source ? { ...entry, status } : entry));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="File operationnelle"
        title="Demandes reception"
        description={`${items.length} element${items.length > 1 ? "s" : ""} operationnel${items.length > 1 ? "s" : ""}`}
        live
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<ListChecks className="h-4 w-4" />} label="Total" value={items.length} tone="blue" />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="En cours" value={items.filter((item) => item.status === "in_progress").length} tone="amber" />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Urgentes" value={items.filter((item) => normalizeStatus(item.status, item.priority, item.senderType) === "urgent").length} tone="red" />
      </div>
      <div className="grid gap-3">
        {error && <p className="p-4 text-sm text-red-300">{error}</p>}
        {!error && items.length === 0 && <EmptyState icon={<ListChecks className="h-6 w-6" />} title="Aucune demande" description="Les demandes client apparaitront ici instantanement." />}
        {items.map((item) => (
          <div key={`${item.source}:${item.id}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/20 transition hover:border-white/15 hover:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
                    {item.source === "message" ? "message" : item.type}
                  </span>
                  <StatusBadge status={normalizeStatus(item.status, item.priority, item.senderType)} />
                </div>
                <p className="mt-3 text-lg font-semibold tracking-tight text-white">{item.title}</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{item.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {item.guest?.firstName} {item.guest?.lastName} - Chambre {item.stay?.roomNumber ?? "-"} - {formatTime(item.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button onClick={() => void updateStatus(item, "in_progress")} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">En cours</button>
                <button onClick={() => void updateStatus(item, "completed")} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">Traite</button>
                <button onClick={() => void updateStatus(item, "urgent")} className="rounded-xl border border-red-400/30 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-400/10">Urgent</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadReviews();
  }, [hotelId, token]);

  useEffect(() => joinHotelRoom(hotelId), [hotelId]);

  useEffect(() => {
    const socket = getSocket();
    const onReview = (review: any) => {
      setItems((current) => upsertById(current, review).sort(sortOperationalDesc));
    };
    const onReviewStatus = (review: any) => {
      setItems((current) => current.map((item) => item.id === review.id ? { ...item, ...review } : item));
    };

    socket.on("review:new", onReview);
    socket.on("review:status", onReviewStatus);
    return () => {
      socket.off("review:new", onReview);
      socket.off("review:status", onReviewStatus);
    };
  }, []);

  async function loadReviews() {
    setError("");
    try {
      setItems(await api.hotelReviews(hotelId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  async function resolveReview(review: any) {
    const updated = await api.updateReviewStatus(review.id, "resolved", token);
    setItems((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
  }

  const alerts = items.filter((item) => item.status === "negative_alert" || item.rating <= 3).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Satisfaction live"
        title="Avis clients"
        description={`${alerts} alerte${alerts > 1 ? "s" : ""} negative${alerts > 1 ? "s" : ""} a suivre`}
        live
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Star className="h-4 w-4" />} label="Avis" value={items.length} tone="blue" />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Alertes" value={alerts} tone="red" />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label="Resolus" value={items.filter((item) => item.status === "resolved").length} tone="emerald" />
      </div>
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length === 0 && <EmptyState icon={<Star className="h-6 w-6" />} title="Aucun avis client" description="Les avis et alertes satisfaction apparaitront ici." />}
        {items.map((review) => (
          <article key={review.id} className={`rounded-2xl border p-5 shadow-lg shadow-black/20 transition hover:border-white/15 ${review.rating <= 3 ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-slate-900/80"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "opacity-25"}`} />
                  ))}
                </div>
                <h2 className="mt-3 font-semibold">
                  {review.guest?.firstName} {review.guest?.lastName || "Client"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">Chambre {review.stay?.roomNumber ?? "-"} - {formatTime(review.createdAt)}</p>
              </div>
              <StatusBadge status={review.rating <= 3 && review.status !== "resolved" ? "urgent" : review.status === "resolved" ? "done" : "new"} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{review.comment || "Aucun commentaire."}</p>
            {review.rating <= 3 && review.status !== "resolved" && (
              <button onClick={() => void resolveReview(review)} className="mt-4 rounded-xl border border-red-300/30 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-400/10">
                Marquer comme resolu
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function GuestsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadGuests();
  }, [hotelId, token]);

  async function loadGuests() {
    setError("");
    try {
      setItems(await api.hotelGuests(hotelId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((guest) => {
      const fullName = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.toLowerCase();
      return fullName.includes(query)
        || String(guest.email ?? "").toLowerCase().includes(query)
        || String(guest.phone ?? "").toLowerCase().includes(query)
        || String(guest.language ?? "").toLowerCase().includes(query);
    });
  }, [items, search]);

  const consentCount = items.filter((guest) => Boolean(guest.marketingConsent)).length;
  const todayCount = items.filter((guest) => isToday(guest.createdAt)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CRM sejour"
        title="Clients hotel"
        description={`${items.length} profil${items.length > 1 ? "s" : ""} client centralise${items.length > 1 ? "s" : ""}`}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Users className="h-4 w-4" />} label="Clients" value={items.length} tone="blue" />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label="Consentements" value={consentCount} tone="emerald" />
        <MetricCard icon={<CalendarDays className="h-4 w-4" />} label="Aujourd'hui" value={todayCount} tone="amber" />
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">Base clients</h2>
            <p className="mt-1 text-sm text-slate-500">Recherche rapide par nom, email, telephone ou langue.</p>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un client..."
              aria-label="Rechercher un client"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10"
            />
          </label>
        </div>
      </section>

      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {!error && filtered.length === 0 && (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun client trouve" description="Les clients apparaitront ici apres l'onboarding de l'app sejour." />
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((guest) => {
          const fullName = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() || guest.email || "Client";
          return (
            <article key={guest.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20 transition hover:border-white/15 hover:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-sm font-semibold text-amber-100">
                  {initials(fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight text-white">{fullName}</h2>
                      <p className="mt-1 text-xs text-slate-500">Cree le {formatDate(guest.createdAt)}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${guest.marketingConsent ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
                      {guest.marketingConsent ? "RGPD accepte" : "Sans consentement"}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoPill icon={<Mail className="h-4 w-4" />} label="Email" value={guest.email || "Non renseigne"} />
                    <InfoPill icon={<Phone className="h-4 w-4" />} label="Telephone" value={guest.phone || "Non renseigne"} />
                    <InfoPill icon={<Languages className="h-4 w-4" />} label="Langue" value={String(guest.language || "Non renseignee").toUpperCase()} />
                    <InfoPill icon={<CalendarDays className="h-4 w-4" />} label="Arrivee CRM" value={formatDate(guest.createdAt)} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
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
  if (status === "done" || status === "completed" || status === "closed") return "done";
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
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";
}

function PageHeader({ eyebrow, title, description, live = false }: { eyebrow: string; title: string; description: string; live?: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-end justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            {live && <Radio className="h-4 w-4 text-emerald-300" />}
            {live ? `Live actif - ${description}` : description}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Activity className="h-4 w-4 text-emerald-300" />
            Front desk
          </div>
          <p className="mt-1 text-xs text-slate-500">Operationnel maintenant</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "amber" | "red" | "emerald" | "blue" }) {
  const classes = {
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    red: "border-red-300/20 bg-red-500/10 text-red-200",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
    blue: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${classes}`}>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-lg shadow-black/20">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
        {icon}
      </div>
      <p className="mt-4 font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/55 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function DataView({ title, loader }: { title: string; loader: () => Promise<any[]> }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void loader().then(setItems).catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"));
  }, [title]);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Module reception" title={title} description="Espace operationnel en preparation" />
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {!error && items.length === 0 && <EmptyState icon={<Activity className="h-6 w-6" />} title="Aucune donnee" description="Ce module sera enrichi dans les prochaines iterations produit." />}
    </div>
  );
}

function upsertById<T extends { id: string }>(items: T[], next: T) {
  return items.some((item) => item.id === next.id)
    ? items.map((item) => item.id === next.id ? { ...item, ...next } : item)
    : [next, ...items];
}

function upsertOperationalItem(items: any[], next: any) {
  return items.some((item) => item.id === next.id && item.source === next.source)
    ? items.map((item) => item.id === next.id && item.source === next.source ? { ...item, ...next } : item)
    : [next, ...items];
}

function sortMessagesDesc(left: MessageItem, right: MessageItem) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function sortOperationalDesc(left: any, right: any) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
