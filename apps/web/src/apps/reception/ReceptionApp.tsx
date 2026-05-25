import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Archive, BedDouble, CheckCircle, Clock, Download, Edit3, Eye, FileJson, Inbox, Languages, ListChecks, LogOut, Mail, MessageSquare, Phone, Radio, Search, Send, ShieldCheck, Star, Users, X } from "lucide-react";
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
          <NavItem to={`${basePath}/guests`} icon={<Users className="h-4 w-4" />} label="Clients presents" />
          <NavItem to={`${basePath}/history`} icon={<Archive className="h-4 w-4" />} label="Historique" />
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
          <Route path={routePath("/history")} element={<HistoryView hotelId={hotelId} token={token} />} />
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
  const [activeStayIds, setActiveStayIds] = useState<Set<string>>(new Set());
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
      if (message.stayId && activeStayIds.size > 0 && !activeStayIds.has(message.stayId)) return;
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
  }, [activeStayIds]);

  async function loadMessages() {
    setError("");
    try {
      const [allMessages, activeStays] = await Promise.all([api.hotelMessages(hotelId, token), api.hotelStays(hotelId, token, "active")]);
      const stayIds = new Set(activeStays.map((stay) => stay.id));
      setActiveStayIds(stayIds);
      setMessages(allMessages.filter((message) => !message.stayId || stayIds.has(message.stayId)));
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
        <MetricCard icon={<Inbox className="h-4 w-4" />} label="A traiter" value={pendingCount} tone="amber" active={filter === "new"} onClick={() => setFilter("new")} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Urgents" value={urgentCount} tone="red" active={filter === "urgent"} onClick={() => setFilter("urgent")} />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label="Repondus" value={answeredCount} tone="emerald" active={filter === "answered"} onClick={() => setFilter("answered")} />
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
  const [activeStayIds, setActiveStayIds] = useState<Set<string>>(new Set());
  const [requestFilter, setRequestFilter] = useState<"all" | "in_progress" | "urgent">("all");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadRequests();
  }, [hotelId, token]);

  useEffect(() => joinHotelRoom(hotelId), [hotelId]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (message: any) => {
      if (message.senderType !== "guest") return;
      if (message.stayId && activeStayIds.size > 0 && !activeStayIds.has(message.stayId)) return;
      const normalized = { ...message, source: "message", title: "Message client", description: message.content };
      setItems((current) => upsertOperationalItem(current, normalized).sort(sortOperationalDesc));
    };
    const onMessageStatus = (message: any) => {
      setItems((current) => current.map((item) => item.source === "message" && item.id === message.id ? { ...item, ...message } : item));
    };
    const onRequest = (request: any) => {
      if (request.stayId && activeStayIds.size > 0 && !activeStayIds.has(request.stayId)) return;
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
  }, [activeStayIds]);

  async function loadRequests() {
    setError("");
    try {
      const [requests, messages, activeStays] = await Promise.all([api.hotelRequests(hotelId, token), api.hotelMessages(hotelId, token), api.hotelStays(hotelId, token, "active")]);
      const stayIds = new Set(activeStays.map((stay) => stay.id));
      setActiveStayIds(stayIds);
      const normalized = [
        ...requests
          .filter((item) => !item.stayId || stayIds.has(item.stayId))
          .map((item) => ({ ...item, source: "request" })),
        ...messages
          .filter((item) => item.senderType === "guest" && (!item.stayId || stayIds.has(item.stayId)))
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

  const visibleItems = useMemo(() => {
    if (requestFilter === "in_progress") return items.filter((item) => item.status === "in_progress");
    if (requestFilter === "urgent") return items.filter((item) => normalizeStatus(item.status, item.priority, item.senderType) === "urgent");
    return items;
  }, [items, requestFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="File operationnelle"
        title="Demandes reception"
        description={`${items.length} element${items.length > 1 ? "s" : ""} operationnel${items.length > 1 ? "s" : ""}`}
        live
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<ListChecks className="h-4 w-4" />} label="Total" value={items.length} tone="blue" active={requestFilter === "all"} onClick={() => setRequestFilter("all")} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="En cours" value={items.filter((item) => item.status === "in_progress").length} tone="amber" active={requestFilter === "in_progress"} onClick={() => setRequestFilter("in_progress")} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Urgentes" value={items.filter((item) => normalizeStatus(item.status, item.priority, item.senderType) === "urgent").length} tone="red" active={requestFilter === "urgent"} onClick={() => setRequestFilter("urgent")} />
      </div>
      <div className="grid gap-3">
        {error && <p className="p-4 text-sm text-red-300">{error}</p>}
        {!error && visibleItems.length === 0 && <EmptyState icon={<ListChecks className="h-6 w-6" />} title="Aucune demande" description="Les demandes client apparaitront ici instantanement." />}
        {visibleItems.map((item) => (
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
  const [activeStayIds, setActiveStayIds] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<"active" | "alerts" | "resolved">("active");
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
      const [reviews, activeStays] = await Promise.all([api.hotelReviews(hotelId, token), api.hotelStays(hotelId, token, "active")]);
      setActiveStayIds(new Set(activeStays.map((stay) => stay.id)));
      setItems(reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  async function resolveReview(review: any) {
    const updated = await api.updateReviewStatus(review.id, "resolved", token);
    setItems((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
  }

  const activeReviews = items.filter((item) => item.stayId && activeStayIds.has(item.stayId));
  const historicReviews = items.filter((item) => !item.stayId || !activeStayIds.has(item.stayId));
  const alerts = activeReviews.filter((item) => item.status === "negative_alert" || item.rating <= 3).length;
  const resolvedReviews = items.filter((item) => item.status === "resolved");
  const visibleActiveReviews = reviewFilter === "alerts"
    ? activeReviews.filter((item) => item.status === "negative_alert" || item.rating <= 3)
    : reviewFilter === "resolved"
      ? resolvedReviews.filter((item) => item.stayId && activeStayIds.has(item.stayId))
      : activeReviews;
  const visibleHistoricReviews = reviewFilter === "resolved"
    ? resolvedReviews.filter((item) => !item.stayId || !activeStayIds.has(item.stayId))
    : historicReviews;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Satisfaction live"
        title="Avis clients"
        description={`${alerts} alerte${alerts > 1 ? "s" : ""} negative${alerts > 1 ? "s" : ""} a suivre`}
        live
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Star className="h-4 w-4" />} label="Avis actifs" value={activeReviews.length} tone="blue" active={reviewFilter === "active"} onClick={() => setReviewFilter("active")} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Alertes actives" value={alerts} tone="red" active={reviewFilter === "alerts"} onClick={() => setReviewFilter("alerts")} />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label="Resolus" value={resolvedReviews.length} tone="emerald" active={reviewFilter === "resolved"} onClick={() => setReviewFilter("resolved")} />
      </div>
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {items.length === 0 && <EmptyState icon={<Star className="h-6 w-6" />} title="Aucun avis client" description="Les avis et alertes satisfaction apparaitront ici." />}
      <ReviewSection title="Avis sejours en cours" reviews={visibleActiveReviews} onResolve={resolveReview} />
      <ReviewSection title="Avis historiques" reviews={visibleHistoricReviews} onResolve={resolveReview} muted />
    </div>
  );
}

function GuestsView({ hotelId, token }: { hotelId: string; token: string }) {
  return <StaysTableView hotelId={hotelId} token={token} mode="active" />;
}

function HistoryView({ hotelId, token }: { hotelId: string; token: string }) {
  return <StaysTableView hotelId={hotelId} token={token} mode="archived" />;
}

function StaysTableView({ hotelId, token, mode }: { hotelId: string; token: string; mode: "active" | "archived" }) {
  const [stays, setStays] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [metricFilter, setMetricFilter] = useState<"all" | "messages" | "requests" | "consent">("all");
  const [selectedStay, setSelectedStay] = useState<any | null>(null);
  const [editingStay, setEditingStay] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadReceptionData();
  }, [hotelId, token, mode]);

  async function loadReceptionData() {
    setError("");
    try {
      const [stayItems, messageItems, requestItems, reviewItems] = await Promise.all([
        api.hotelStays(hotelId, token, mode),
        api.hotelMessages(hotelId, token),
        api.hotelRequests(hotelId, token),
        api.hotelReviews(hotelId, token)
      ]);
      setStays(stayItems);
      setMessages(messageItems);
      setRequests(requestItems);
      setReviews(reviewItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }

  async function saveStay(payload: { roomNumber: string; checkinDate: string; checkoutDate: string; status: string }) {
    if (!editingStay) return;
    await api.updateStay(editingStay.id, payload, token);
    setEditingStay(null);
    await loadReceptionData();
  }

  async function checkout(stay: any) {
    await api.updateStay(stay.id, { status: "checked_out", checkoutDate: toDateInput(new Date().toISOString()) }, token);
    await loadReceptionData();
  }

  const rows = useMemo(() => stays.map((stay) => buildStayRow(stay, messages, requests, reviews)), [stays, messages, requests, reviews]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = !query
        || row.client.toLowerCase().includes(query)
        || row.email.toLowerCase().includes(query)
        || row.room.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesMetric = metricFilter === "messages"
        ? row.openMessages > 0
        : metricFilter === "requests"
          ? row.openRequests > 0
          : metricFilter === "consent"
            ? row.marketingConsent
            : true;
      return matchesQuery && matchesStatus && matchesMetric;
    });
  }, [rows, search, statusFilter, metricFilter]);

  const weakReviews = rows.filter((row) => row.rating > 0 && row.rating <= 3).length;
  const consentCount = rows.filter((row) => row.marketingConsent).length;
  const exportName = mode === "active" ? "clients-presents" : "historique-crm";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={mode === "active" ? "Exploitation active" : "Historique CRM"}
        title={mode === "active" ? "Clients presents" : "Clients partis"}
        description={mode === "active" ? `${rows.length} sejour${rows.length > 1 ? "s" : ""} actif${rows.length > 1 ? "s" : ""} aujourd'hui` : `${rows.length} sejour${rows.length > 1 ? "s" : ""} archive${rows.length > 1 ? "s" : ""}`}
        live={mode === "active"}
      />
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<BedDouble className="h-4 w-4" />} label={mode === "active" ? "Presents" : "Archives"} value={rows.length} tone="blue" active={metricFilter === "all"} onClick={() => setMetricFilter("all")} />
        <MetricCard icon={<Inbox className="h-4 w-4" />} label="Messages ouverts" value={rows.reduce((total, row) => total + row.openMessages, 0)} tone="amber" active={metricFilter === "messages"} onClick={() => setMetricFilter("messages")} />
        <MetricCard icon={<ListChecks className="h-4 w-4" />} label="Demandes ouvertes" value={rows.reduce((total, row) => total + row.openRequests, 0)} tone="red" active={metricFilter === "requests"} onClick={() => setMetricFilter("requests")} />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label={mode === "active" ? "Consentements" : "CRM opt-in"} value={consentCount} tone="emerald" active={metricFilter === "consent"} onClick={() => setMetricFilter("consent")} />
      </div>
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">{mode === "active" ? "Tableau des sejours actifs" : "Tableau historique client"}</h2>
            <p className="mt-1 text-sm text-slate-500">{mode === "active" ? "Les clients partis sont exclus des operations courantes." : "Historique conserve sans suppression de donnees."} Export du filtre courant : {filtered.length} ligne{filtered.length > 1 ? "s" : ""}.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <label className="relative block w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, email, chambre..." aria-label="Rechercher un sejour" className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10">
              <option value="all">Tous statuts</option>
              {Array.from(new Set(rows.map((row) => row.status))).map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="button" onClick={() => exportRowsAsExcel(filtered, exportName)} disabled={filtered.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 focus:outline-none focus:ring-4 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> Excel
            </button>
            <button type="button" onClick={() => exportRowsAsJson(filtered, exportName)} disabled={filtered.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300/25 bg-sky-300/10 px-3 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 focus:outline-none focus:ring-4 focus:ring-sky-300/10 disabled:cursor-not-allowed disabled:opacity-50">
              <FileJson className="h-4 w-4" /> JSON
            </button>
          </div>
        </div>
      </section>
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {!error && filtered.length === 0 && <EmptyState icon={mode === "active" ? <Users className="h-6 w-6" /> : <Archive className="h-6 w-6" />} title="Aucune ligne" description="Aucun sejour ne correspond aux filtres actuels." />}
      <ReceptionTable
        mode={mode}
        rows={filtered}
        weakReviews={weakReviews}
        onView={(stay) => setSelectedStay(stay)}
        onEdit={(stay) => setEditingStay(stay)}
        onCheckout={(stay) => void checkout(stay)}
      />
      {selectedStay && <StayDetailPanel row={buildStayRow(selectedStay, messages, requests, reviews)} stay={selectedStay} onClose={() => setSelectedStay(null)} />}
      {editingStay && <StayEditPanel stay={editingStay} onClose={() => setEditingStay(null)} onSave={(payload) => void saveStay(payload)} />}
    </div>
  );
}

function ReceptionTable({ mode, rows, weakReviews, onView, onEdit, onCheckout }: { mode: "active" | "archived"; rows: any[]; weakReviews: number; onView: (stay: any) => void; onEdit: (stay: any) => void; onCheckout: (stay: any) => void }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {(mode === "active"
                ? ["Chambre", "Client", "Email", "Telephone", "Arrivee", "Depart", "Langue", "CRM", "Statut", "Messages", "Demandes", "Avis", "Actions"]
                : ["Client", "Email", "Telephone", "Chambre", "Arrivee", "Depart", "Duree", "Marketing", "Note", "Messages", "Demandes", "Dernier contact", "Actions"]
              ).map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={row.stay.id} className="transition hover:bg-white/[0.03]">
                {mode === "active" ? (
                  <>
                    <td className="px-4 py-4 font-semibold text-amber-100">{row.room}</td>
                    <td className="px-4 py-4 text-white">{row.client}</td>
                    <td className="px-4 py-4 text-slate-300">{row.email || "-"}</td>
                    <td className="px-4 py-4 text-slate-300">{row.phone || "-"}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(row.checkinDate)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(row.checkoutDate)}</td>
                    <td className="px-4 py-4 text-slate-300">{row.language.toUpperCase()}</td>
                    <td className="px-4 py-4"><ConsentBadge ok={row.marketingConsent} /></td>
                    <td className="px-4 py-4"><StayStatusBadge status={row.status} /></td>
                    <td className="px-4 py-4 text-slate-200">{row.openMessages}</td>
                    <td className="px-4 py-4 text-slate-200">{row.openRequests}</td>
                    <td className="px-4 py-4">{row.rating ? <RatingBadge rating={row.rating} /> : <span className="text-slate-500">-</span>}</td>
                    <td className="px-4 py-4"><RowActions row={row} active onView={onView} onEdit={onEdit} onCheckout={onCheckout} /></td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4 text-white">{row.client}</td>
                    <td className="px-4 py-4 text-slate-300">{row.email || "-"}</td>
                    <td className="px-4 py-4 text-slate-300">{row.phone || "-"}</td>
                    <td className="px-4 py-4 font-semibold text-amber-100">{row.room}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(row.checkinDate)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(row.checkoutDate)}</td>
                    <td className="px-4 py-4 text-slate-300">{row.nights} nuit{row.nights > 1 ? "s" : ""}</td>
                    <td className="px-4 py-4"><ConsentBadge ok={row.marketingConsent} /></td>
                    <td className="px-4 py-4">{row.rating ? <RatingBadge rating={row.rating} /> : <span className="text-slate-500">-</span>}</td>
                    <td className="px-4 py-4 text-slate-200">{row.messageCount}</td>
                    <td className="px-4 py-4 text-slate-200">{row.requestCount}</td>
                    <td className="px-4 py-4 text-slate-300">{formatTime(row.lastContact)}</td>
                    <td className="px-4 py-4"><RowActions row={row} onView={onView} onEdit={onEdit} onCheckout={onCheckout} /></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mode === "archived" && weakReviews > 0 && <p className="border-t border-white/10 bg-red-500/10 px-4 py-3 text-sm text-red-200">{weakReviews} ancien{weakReviews > 1 ? "s" : ""} sejour{weakReviews > 1 ? "s" : ""} avec note faible.</p>}
    </div>
  );
}

function RowActions({ row, active = false, onView, onEdit, onCheckout }: { row: any; active?: boolean; onView: (stay: any) => void; onEdit: (stay: any) => void; onCheckout: (stay: any) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onView(row.stay)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/5"><Eye className="h-3.5 w-3.5" /> Voir</button>
      <button onClick={() => onEdit(row.stay)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/5"><Edit3 className="h-3.5 w-3.5" /> Editer</button>
      {active && <button onClick={() => onCheckout(row.stay)} className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/10"><Archive className="h-3.5 w-3.5" /> Check-out</button>}
      {active && <a href="/inbox" className="inline-flex items-center gap-1 rounded-lg border border-amber-300/30 px-2.5 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10"><Send className="h-3.5 w-3.5" /> Contacter</a>}
    </div>
  );
}

function StayDetailPanel({ row, stay, onClose }: { row: any; stay: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <aside className="ml-auto flex h-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Fiche sejour</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{row.client}</h2>
            <p className="mt-1 text-sm text-slate-500">Chambre {row.room} - {formatDate(row.checkinDate)} au {formatDate(row.checkoutDate)}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoPill icon={<Mail className="h-4 w-4" />} label="Email" value={row.email || "Non renseigne"} />
            <InfoPill icon={<Phone className="h-4 w-4" />} label="Telephone" value={row.phone || "Non renseigne"} />
            <InfoPill icon={<Languages className="h-4 w-4" />} label="Langue" value={row.language.toUpperCase()} />
            <InfoPill icon={<MessageSquare className="h-4 w-4" />} label="Dernier contact" value={formatTime(row.lastContact) || "-"} />
          </div>
          <HistoryList title="Messages" items={stay.messages ?? []} render={(item) => `${item.senderType === "reception" ? "Reception" : "Client"} - ${item.content}`} />
          <HistoryList title="Demandes" items={stay.requests ?? []} render={(item) => `${item.title} - ${item.status}`} />
          <HistoryList title="Avis" items={stay.reviews ?? []} render={(item) => `${item.rating}/5 - ${item.comment || "Aucun commentaire"}`} />
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Notes internes : a ajouter lors d'une prochaine iteration si un champ dedie est valide en base.</div>
        </div>
      </aside>
    </div>
  );
}

function StayEditPanel({ stay, onClose, onSave }: { stay: any; onClose: () => void; onSave: (payload: { roomNumber: string; checkinDate: string; checkoutDate: string; status: string }) => void }) {
  const [roomNumber, setRoomNumber] = useState(stay.roomNumber ?? "");
  const [checkinDate, setCheckinDate] = useState(toDateInput(stay.checkinDate));
  const [checkoutDate, setCheckoutDate] = useState(toDateInput(stay.checkoutDate));
  const [status, setStatus] = useState(stay.status ?? "active");
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={(event) => { event.preventDefault(); onSave({ roomNumber, checkinDate, checkoutDate, status }); }} className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Edition sejour</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{stay.guest?.firstName} {stay.guest?.lastName}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Chambre"><input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} className={fieldClassName} required /></Field>
          <Field label="Statut"><select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClassName}><option value="active">active</option><option value="checked_in">checked_in</option><option value="checked_out">checked_out</option><option value="archived">archived</option></select></Field>
          <Field label="Date arrivee"><input type="date" value={checkinDate} onChange={(event) => setCheckinDate(event.target.value)} className={fieldClassName} /></Field>
          <Field label="Date depart"><input type="date" value={checkoutDate} onChange={(event) => setCheckoutDate(event.target.value)} className={fieldClassName} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">Annuler</button>
          <button className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium text-slate-300"><span>{label}</span>{children}</label>;
}

function HistoryList({ title, items, render }: { title: string; items: any[]; render: (item: any) => string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-500">Aucun historique.</p>}
        {items.map((item) => <p key={item.id} className="rounded-xl bg-slate-950/60 p-3 text-sm text-slate-300">{render(item)}</p>)}
      </div>
    </section>
  );
}

function ReviewSection({ title, reviews, onResolve, muted = false }: { title: string; reviews: any[]; onResolve: (review: any) => Promise<void>; muted?: boolean }) {
  if (reviews.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">{reviews.length} avis</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id} className={`rounded-2xl border p-5 shadow-lg shadow-black/20 transition hover:border-white/15 ${review.rating <= 3 && !muted ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-slate-900/80"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "opacity-25"}`} />
                  ))}
                </div>
                <h3 className="mt-3 font-semibold">
                  {review.guest?.firstName} {review.guest?.lastName || "Client"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">Chambre {review.stay?.roomNumber ?? "-"} - {formatTime(review.createdAt)}</p>
              </div>
              <StatusBadge status={review.rating <= 3 && review.status !== "resolved" ? "urgent" : review.status === "resolved" ? "done" : "new"} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{review.comment || "Aucun commentaire."}</p>
            {review.rating <= 3 && review.status !== "resolved" && !muted && (
              <button onClick={() => void onResolve(review)} className="mt-4 rounded-xl border border-red-300/30 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-400/10">
                Marquer comme resolu
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
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

const openStatuses = new Set(["new", "in_progress", "urgent", "sent"]);
const fieldClassName = "w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10";

function buildStayRow(stay: any, messages: any[], requests: any[], reviews: any[]) {
  const stayMessages = messages.filter((item) => item.stayId === stay.id);
  const stayRequests = requests.filter((item) => item.stayId === stay.id);
  const stayReviews = reviews.filter((item) => item.stayId === stay.id);
  const lastContact = [...stayMessages, ...stayRequests, ...stayReviews]
    .map((item) => item.createdAt)
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  const latestReview = [...stayReviews].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
  const guest = stay.guest ?? {};
  return {
    stay: { ...stay, messages: stay.messages ?? stayMessages, requests: stay.requests ?? stayRequests, reviews: stay.reviews ?? stayReviews },
    room: stay.roomNumber ?? "-",
    client: `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() || guest.email || "Client",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    language: guest.language ?? "fr",
    marketingConsent: Boolean(guest.marketingConsent),
    status: stay.status ?? "active",
    checkinDate: stay.checkinDate,
    checkoutDate: stay.checkoutDate,
    nights: stayNights(stay.checkinDate, stay.checkoutDate),
    openMessages: stayMessages.filter((item) => openStatuses.has(item.status)).length,
    openRequests: stayRequests.filter((item) => openStatuses.has(item.status)).length,
    messageCount: stayMessages.length,
    requestCount: stayRequests.length,
    rating: latestReview?.rating ?? 0,
    lastContact
  };
}

function exportableStayRows(rows: any[]) {
  return rows.map((row) => ({
    chambre: row.room,
    client: row.client,
    email: row.email,
    telephone: row.phone,
    langue: row.language,
    consentement_crm: row.marketingConsent ? "oui" : "non",
    statut_sejour: row.status,
    date_arrivee: formatDate(row.checkinDate),
    date_depart: formatDate(row.checkoutDate),
    duree_nuits: row.nights,
    messages_ouverts: row.openMessages,
    demandes_ouvertes: row.openRequests,
    nombre_messages: row.messageCount,
    nombre_demandes: row.requestCount,
    note_sejour: row.rating || "",
    dernier_contact: formatTime(row.lastContact)
  }));
}

function exportRowsAsJson(rows: any[], name: string) {
  downloadFile(`${name}-${dateStamp()}.json`, "application/json;charset=utf-8", JSON.stringify(exportableStayRows(rows), null, 2));
}

function exportRowsAsExcel(rows: any[], name: string) {
  const data = exportableStayRows(rows);
  const headers = Object.keys(data[0] ?? {});
  const headerRow = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyRows = data.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(String(row[header as keyof typeof row] ?? ""))}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
  downloadFile(`${name}-${dateStamp()}.xls`, "application/vnd.ms-excel;charset=utf-8", html);
}

function downloadFile(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function ConsentBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ok ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
      {ok ? "Oui" : "Non"}
    </span>
  );
}

function StayStatusBadge({ status }: { status: string }) {
  const active = status === "active" || status === "checked_in";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${active ? "border-blue-300/25 bg-blue-300/10 text-blue-200" : "border-slate-300/20 bg-white/[0.04] text-slate-300"}`}>{status}</span>;
}

function RatingBadge({ rating }: { rating: number }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${rating <= 3 ? "border-red-300/30 bg-red-500/10 text-red-200" : "border-amber-300/25 bg-amber-300/10 text-amber-100"}`}>{rating}/5</span>;
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function toDateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function stayNights(checkin?: string, checkout?: string) {
  if (!checkin || !checkout) return 0;
  const start = new Date(toDateInput(checkin)).getTime();
  const end = new Date(toDateInput(checkout)).getTime();
  return Math.max(0, Math.round((end - start) / 86400000));
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

function MetricCard({ icon, label, value, tone, active = false, onClick }: { icon: React.ReactNode; label: string; value: number; tone: "amber" | "red" | "emerald" | "blue"; active?: boolean; onClick?: () => void }) {
  const classes = {
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    red: "border-red-300/20 bg-red-500/10 text-red-200",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
    blue: "border-sky-300/20 bg-sky-300/10 text-sky-200"
  }[tone];
  const content = (
    <>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${classes}`}>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`rounded-2xl border p-4 text-left shadow-lg shadow-black/20 transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${active ? "border-amber-300/35 bg-slate-900 ring-1 ring-inset ring-amber-300/20" : "border-white/10 bg-slate-900/75 hover:border-white/20 hover:bg-slate-900"}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
      {content}
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
