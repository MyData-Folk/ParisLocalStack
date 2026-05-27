import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Activity, AlertTriangle, Archive, BedDouble, CheckCircle, Clock, Copy, Download, Edit3, ExternalLink, Eye, FileJson, Image as ImageIcon, Inbox, Languages, Link2, ListChecks, Mail, MessageSquare, Phone, QrCode, Radio, Search, Send, Star, Upload, Users, X } from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";
import { QrCodePdfButton } from "../../components/QrCodePdfButton";
import { API_URL, api } from "../../lib/api";
import { guestUrl } from "../../lib/hotelOnboarding";
import { getSocket, joinHotelRoom } from "../../lib/socket";
import { resolveTenantFromHostname } from "../../lib/tenant";
import { useAppStore } from "../../stores/appStore";
import { ReceptionShell } from "./components/ReceptionShell";
import { useReceptionHotel } from "./hooks/useReceptionHotel";

import { MessageItem, Conversation, FilterKey } from "./reception.types";

export function ReceptionApp({ basePath = "" }: { basePath?: string }) {
  const tenant = resolveTenantFromHostname();
  const tenantSlug = tenant.kind === "reception" ? tenant.hotelSlug : null;
  const defaultEmail = tenantSlug === "vendome"
    ? "reception@vendome.test"
    : tenantSlug
      ? `reception+${tenantSlug}@welcomeparis.hotelmanager.fr`
      : "reception@vendome.test";

  return (
    <AuthGate title="Connexion reception" subtitle="Acces securise au dashboard hotel" defaultEmail={defaultEmail} allowedRoles={["super_admin", "hotel_admin", "receptionist"]}>
      <ReceptionDashboard basePath={basePath} />
    </AuthGate>
  );
}

function ReceptionDashboard({ basePath }: { basePath: string }) {
  const { currentUser, token, logout } = useAppStore();
  const { hotelSlug, hotel: hotelContext, isLoading: contextLoading, error: contextError } = useReceptionHotel(currentUser, token, logout);

  if (!currentUser || !token) return null;

  const routePath = (path: string) => basePath ? path.replace(/^\//, "") : path;
  return (
    <ReceptionShell
      currentUser={currentUser}
      hotelContext={hotelContext}
      tenantSlug={hotelSlug}
      basePath={basePath}
      logout={logout}
    >
      {contextLoading ? <LoadingPanel /> : null}
      {!contextLoading && contextError ? <TenantContextError message={contextError} tenantSlug={hotelSlug} /> : null}
      {!contextLoading && hotelContext ? (
        <Routes>
          <Route index element={<Navigate to={`${basePath}/dashboard`} replace />} />
          <Route path={routePath("/dashboard")} element={<ReceptionHome hotelId={hotelContext.id} token={token} basePath={basePath} />} />
          <Route path={routePath("/inbox")} element={<InboxView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/requests")} element={<RequestsView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/guests")} element={<GuestsView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/history")} element={<HistoryView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/reviews")} element={<ReviewsView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/qr")} element={<ReceptionQrView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/media")} element={<MediaLibraryView hotelId={hotelContext.id} token={token} />} />
          <Route path={routePath("/analytics")} element={<DataView title="Analytics" loader={() => Promise.resolve([])} />} />
          <Route path={routePath("/settings")} element={<SettingsView hotelId={hotelContext.id} token={token} />} />
        </Routes>
      ) : null}
    </ReceptionShell>
  );
}

function TenantContextError({ message, tenantSlug }: { message: string; tenantSlug: string | null }) {
  return (
    <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 shadow-lg shadow-black/20">
      <AlertTriangle className="h-7 w-7 text-red-200" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Contexte hotel indisponible</h1>
      <p className="mt-2 text-sm leading-6 text-red-100/80">{message}</p>
      {tenantSlug ? <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs text-red-50">Slug detecte : {tenantSlug}</p> : null}
      <p className="mt-3 text-sm text-red-100/70">Verifiez le slug exact genere dans Super Admin. Exemple : `admin-folkestone-opera.welcomeparis.hotelmanager.fr` si le slug hotel est `folkestone-opera`.</p>
    </section>
  );
}

function ReceptionHome({ hotelId, token, basePath }: { hotelId: string; token: string; basePath: string }) {
  const [stays, setStays] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void Promise.all([
      api.hotelStays(hotelId, token, "active"),
      api.hotelMessages(hotelId, token),
      api.hotelRequests(hotelId, token),
      api.hotelReviews(hotelId, token)
    ])
      .then(([loadedStays, loadedMessages, loadedRequests, loadedReviews]) => {
        const activeStayIds = new Set(loadedStays.map((stay) => stay.id));
        setStays(loadedStays);
        setMessages(loadedMessages.filter((message) => message.stayId && activeStayIds.has(message.stayId)));
        setRequests(loadedRequests.filter((request) => request.stayId && activeStayIds.has(request.stayId)));
        setReviews(loadedReviews.filter((review) => review.stayId && activeStayIds.has(review.stayId)));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"));
  }, [hotelId, token]);

  const openMessages = messages.filter((item) => openStatuses.has(item.status)).length;
  const openRequests = requests.filter((item) => openStatuses.has(item.status)).length;
  const urgentRequests = requests.filter((item) => item.status === "urgent" || item.priority === "urgent").length;
  const negativeReviews = reviews.filter((item) => item.rating <= 3 || item.status === "negative_alert").length;
  const path = (target: string) => `${basePath}${target}`;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Reception" title="Dashboard operationnel" description="Vue live des sejours, demandes et alertes du jour" live />
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Link to={path("/guests")} className="focus:outline-none focus:ring-4 focus:ring-sky-400/15"><MetricCard icon={<BedDouble className="h-4 w-4" />} label="Clients presents" value={stays.length} tone="blue" /></Link>
        <Link to={path("/inbox")} className="focus:outline-none focus:ring-4 focus:ring-sky-400/15"><MetricCard icon={<Inbox className="h-4 w-4" />} label="Messages ouverts" value={openMessages} tone="amber" /></Link>
        <Link to={path("/requests")} className="focus:outline-none focus:ring-4 focus:ring-sky-400/15"><MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Demandes urgentes" value={urgentRequests + openRequests} tone={urgentRequests ? "red" : "blue"} /></Link>
        <Link to={path("/reviews")} className="focus:outline-none focus:ring-4 focus:ring-sky-400/15"><MetricCard icon={<Star className="h-4 w-4" />} label="Avis a suivre" value={negativeReviews} tone={negativeReviews ? "red" : "emerald"} /></Link>
      </div>
      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          <h2 className="text-lg font-semibold tracking-tight text-white">Priorites reception</h2>
          <div className="mt-4 space-y-3">
            <ActionRow to={path("/inbox")} icon={<Inbox className="h-4 w-4" />} title="Traiter la messagerie" meta={`${openMessages} message(s) ouvert(s)`} />
            <ActionRow to={path("/requests")} icon={<ListChecks className="h-4 w-4" />} title="Suivre les demandes" meta={`${openRequests} demande(s) en cours`} />
            <ActionRow to={path("/reviews")} icon={<Star className="h-4 w-4" />} title="Verifier les avis" meta={`${negativeReviews} alerte(s) satisfaction`} />
          </div>
        </div>
        <div className="rounded-2xl border border-sky-400/15 bg-sky-400/10 p-5 shadow-lg shadow-black/20">
          <Radio className="h-6 w-6 text-sky-300" />
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">Centre live</h2>
          <p className="mt-2 text-sm leading-6 text-sky-50/75">Le dashboard reception reste synchronise avec les messages, demandes, avis et statuts actifs.</p>
        </div>
      </section>
    </div>
  );
}

function ReceptionQrView({ hotelId, token }: { hotelId: string; token: string }) {
  const [hotel, setHotel] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    void api.hotel(hotelId, token)
      .then(setHotel)
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger le QR code"));
  }, [hotelId, token]);

  const url = hotel?.slug ? guestUrl(hotel.slug) : "";

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="QR client" title="QR code hotel" description="Lien unique pour onboarding client, pre-check-in et impression reception" />
      {error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          <div className="rounded-2xl bg-white p-5">
            {url ? <QRCodeSVG value={url} size={280} marginSize={2} className="mx-auto h-auto w-full max-w-72" /> : <div className="grid aspect-square place-items-center text-sm text-zinc-500">Chargement du QR code</div>}
          </div>
          {url ? <div className="mt-4"><QrCodePdfButton url={url} hotelName={hotel?.name || hotel.slug} slug={hotel.slug} variant="emerald" /></div> : null}
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">URL canonique client</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{hotel?.name ?? "Hotel"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Le QR code ouvre l'app client de l'hotel. Sans session existante, le client arrive directement sur l'enregistrement : identite, coordonnees, chambre et dates de sejour.</p>
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#09090b] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Lien a partager</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-sky-100">{url || "Chargement..."}</code>
              <button type="button" disabled={!url} onClick={() => void navigator.clipboard?.writeText(url)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-sky-400/15 disabled:opacity-50" aria-label="Copier le lien client">
                <Copy className="h-4 w-4" />
              </button>
              <a href={url || undefined} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-sky-400/15 aria-disabled:pointer-events-none aria-disabled:opacity-50" aria-disabled={!url} aria-label="Ouvrir l'app client">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <InfoPill icon={<QrCode className="h-4 w-4" />} label="Usage" value="Print / Email" />
            <InfoPill icon={<Users className="h-4 w-4" />} label="Scan" value="Onboarding" />
            <InfoPill icon={<BedDouble className="h-4 w-4" />} label="Reception" value="Sejour editable" />
          </div>
        </div>
      </section>
    </div>
  );
}

function MediaLibraryView({ hotelId, token }: { hotelId: string; token: string }) {
  const [hotel, setHotel] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMedia() {
    setLoading(true);
    setMessage("");
    try {
      const [loadedHotel, loadedFiles] = await Promise.all([api.hotel(hotelId, token), api.hotelFiles(hotelId, token)]);
      setHotel(loadedHotel);
      setFiles(loadedFiles);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Impossible de charger la mediatheque");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, [hotelId, token]);

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage("");
    try {
      const uploaded = await api.uploadHotelFile(hotelId, file, token);
      setFiles((current) => [uploaded, ...current]);
      setMessage("Image importee dans la mediatheque.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload impossible");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function addUrl(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const created = await api.addHotelFileUrl(hotelId, { url: url.trim(), originalName: name.trim() || undefined }, token);
      setFiles((current) => [created, ...current]);
      setUrl("");
      setName("");
      setMessage("URL image ajoutee a la mediatheque.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ajout URL impossible");
    } finally {
      setSaving(false);
    }
  }

  async function setAsLogo(file: any) {
    setSaving(true);
    setMessage("");
    try {
      const logoUrl = mediaUrl(file.url);
      const updated = await api.updateHotel(hotelId, { logoUrl }, token);
      setHotel(updated);
      setMessage("Logo hotel mis a jour. Il sera utilise cote app client.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Mise a jour logo impossible");
    } finally {
      setSaving(false);
    }
  }

  async function removeFile(file: any) {
    setSaving(true);
    setMessage("");
    try {
      await api.deleteFile(file.id, token);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setMessage("Image retiree de la mediatheque.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Mediatheque hotel" title="Images et logo" description="Stockage prive des visuels utilises pour personnaliser l'app client" />
      {message ? <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">{message}</p> : null}
      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold tracking-tight text-white">Upload fichier</h2>
                <p className="mt-1 text-xs text-slate-500">PNG, JPG, WebP jusqu'a 10 Mo.</p>
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center transition hover:border-sky-300/40 hover:bg-sky-300/10">
              <ImageIcon className="h-8 w-8 text-slate-400" />
              <span className="mt-3 text-sm font-medium text-white">{saving ? "Traitement..." : "Choisir une image"}</span>
              <span className="mt-1 text-xs text-slate-500">Elle sera disponible pour le logo ou les contenus hotel.</span>
              <input type="file" accept="image/*" className="sr-only" disabled={saving} onChange={(event) => void uploadFile(event)} />
            </label>
          </div>

          <form onSubmit={addUrl} className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Link2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold tracking-tight text-white">Ajouter par URL</h2>
                <p className="mt-1 text-xs text-slate-500">Reference distante, pratique pour logos deja heberges.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <FieldDark label="URL image" value={url} onChange={setUrl} placeholder="https://..." required />
              <FieldDark label="Nom interne" value={name} onChange={setName} placeholder="Logo facade, hero lobby..." />
              <button disabled={saving || !url.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:opacity-60">
                <Link2 className="h-4 w-4" />
                Ajouter l'URL
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">Bibliotheque</h2>
              <p className="mt-1 text-sm text-slate-500">{files.length} fichier(s). Logo actuel : {hotel?.logoUrl ? "configure" : "non configure"}.</p>
            </div>
            <button type="button" onClick={() => void loadMedia()} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]">Actualiser</button>
          </div>
          {loading ? <LoadingPanel /> : null}
          {!loading && files.length === 0 ? <EmptyState icon={<ImageIcon className="h-6 w-6" />} title="Aucune image" description="Ajoutez un logo ou des visuels pour personnaliser l'experience client." /> : null}
          {!loading && files.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {files.map((file) => {
                const previewUrl = mediaUrl(file.url);
                const isLogo = hotel?.logoUrl === previewUrl || hotel?.logoUrl === file.url;
                return (
                  <article key={file.id} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09090b] shadow-lg shadow-black/20">
                    <div className="aspect-[4/3] bg-slate-950">
                      <img src={previewUrl} alt={file.originalName} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="truncate text-sm font-semibold text-white">{file.originalName}</p>
                        <p className="mt-1 truncate text-[11px] text-slate-500">{file.storageProvider} - {file.mimeType}</p>
                      </div>
                      {isLogo ? <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">Logo actif</span> : null}
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void setAsLogo(file)} disabled={saving} className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/15 disabled:opacity-60">Utiliser logo</button>
                        <button type="button" onClick={() => void navigator.clipboard?.writeText(previewUrl)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.07]">Copier</button>
                        <button type="button" onClick={() => void removeFile(file)} disabled={saving} className="rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/15 disabled:opacity-60">Supprimer</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ActionRow({ to, icon, title, meta }: { to: string; icon: React.ReactNode; title: string; meta: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-sky-400/15">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{title}</span>
          <span className="block truncate text-xs text-zinc-500">{meta}</span>
        </span>
      </span>
      <Eye className="h-4 w-4 text-zinc-500" />
    </Link>
  );
}

function InboxView({ hotelId, token }: { hotelId: string; token: string }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeStayIds, setActiveStayIds] = useState<Set<string>>(new Set());
  const [profileTarget, setProfileTarget] = useState<{ guestId?: string; stayId?: string } | null>(null);
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
      if (!message.stayId || !activeStayIds.has(message.stayId)) return;
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
      setMessages(allMessages.filter((message) => message.stayId && stayIds.has(message.stayId)));
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
              <textarea
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 outline-none transition placeholder:text-slate-600 focus:border-sky-300/60 focus:ring-4 focus:ring-sky-300/10"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void sendReply();
                }}
                placeholder="Reponse reception"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => void sendReply()} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-300/20"><MessageSquare className="h-4 w-4" /> Repondre</button>
                  <button onClick={() => setProfileTarget({ guestId: active.lastMessage.guestId, stayId: active.lastMessage.stayId })} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10"><Eye className="h-4 w-4" /> Voir fiche</button>
                  <button onClick={() => void markConversationDone()} className="rounded-xl border border-white/10 px-4 py-2.5 font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">Marquer comme traite</button>
                </div>
              </div>
            </>
          ) : <p className="p-5 text-slate-400">Selectionnez un message.</p>}
        </div>
      </div>
      {profileTarget ? <GuestProfilePanel hotelId={hotelId} token={token} target={profileTarget} onClose={() => setProfileTarget(null)} /> : null}
    </div>
  );
}

function RequestsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [activeStayIds, setActiveStayIds] = useState<Set<string>>(new Set());
  const [requestFilter, setRequestFilter] = useState<"all" | "in_progress" | "urgent">("all");
  const [profileTarget, setProfileTarget] = useState<{ guestId?: string; stayId?: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadRequests();
  }, [hotelId, token]);

  useEffect(() => joinHotelRoom(hotelId), [hotelId]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (message: any) => {
      if (message.senderType !== "guest") return;
      if (!message.stayId || !activeStayIds.has(message.stayId)) return;
      const normalized = { ...message, source: "message", title: "Message client", description: message.content };
      setItems((current) => upsertOperationalItem(current, normalized).sort(sortOperationalDesc));
    };
    const onMessageStatus = (message: any) => {
      setItems((current) => current.map((item) => item.source === "message" && item.id === message.id ? { ...item, ...message } : item));
    };
    const onRequest = (request: any) => {
      if (!request.stayId || !activeStayIds.has(request.stayId)) return;
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
          .filter((item) => item.stayId && stayIds.has(item.stayId))
          .map((item) => ({ ...item, source: "request" })),
        ...messages
          .filter((item) => item.senderType === "guest" && item.stayId && stayIds.has(item.stayId))
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
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111115] shadow-lg shadow-black/20">
        {error && <p className="p-4 text-sm text-red-300">{error}</p>}
        {!error && visibleItems.length === 0 && <EmptyState icon={<ListChecks className="h-6 w-6" />} title="Aucune demande" description="Les demandes client apparaitront ici instantanement." />}
        {visibleItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="bg-[#09090b] text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  {["Type / Demande", "Client", "Chambre", "Souhaite", "Destination / Details", "Statut", "Priorite", "Actions"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {visibleItems.map((item) => (
                  <tr key={`${item.source}:${item.id}`} className="transition hover:bg-white/[0.04]">
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                          {item.source === "message" ? "message" : item.type}
                        </span>
                        <p className="mt-2 font-semibold text-white">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{item.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-200">{item.guest?.firstName} {item.guest?.lastName || "Client"}</td>
                    <td className="px-4 py-4 font-semibold text-sky-100">{item.stay?.roomNumber ?? "-"}</td>
                    <td className="px-4 py-4 text-zinc-300">{requestDesiredTime(item)}</td>
                    <td className="px-4 py-4 text-zinc-300">{requestPrimaryDetail(item)}</td>
                    <td className="px-4 py-4"><StatusBadge status={normalizeStatus(item.status, item.priority, item.senderType)} /></td>
                    <td className="px-4 py-4 text-zinc-300">{item.priority ?? "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setProfileTarget({ guestId: item.guestId, stayId: item.stayId })} className="rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10">Fiche</button>
                        <button onClick={() => void updateStatus(item, "in_progress")} className="rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10">En cours</button>
                        <button onClick={() => void updateStatus(item, "completed")} className="rounded-lg border border-emerald-300/25 px-2.5 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/10 focus:outline-none focus:ring-4 focus:ring-emerald-400/10">Traite</button>
                        <button onClick={() => void updateStatus(item, "urgent")} className="rounded-lg border border-red-400/30 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-400/10">Urgent</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      {profileTarget ? <GuestProfilePanel hotelId={hotelId} token={token} target={profileTarget} onClose={() => setProfileTarget(null)} /> : null}
    </div>
  );
}

function ReviewsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [activeStayIds, setActiveStayIds] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<"active" | "pending" | "alerts" | "resolved">("active");
  const [profileTarget, setProfileTarget] = useState<{ guestId?: string; stayId?: string } | null>(null);
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

  async function updateReviewModeration(review: any, status: string) {
    const updated = await api.updateReviewStatus(review.id, status, token);
    setItems((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
  }

  const activeReviews = items.filter((item) => item.stayId && activeStayIds.has(item.stayId));
  const historicReviews = items.filter((item) => !item.stayId || !activeStayIds.has(item.stayId));
  const alerts = activeReviews.filter((item) => item.status === "negative_alert" || item.rating <= 3).length;
  const pendingReviews = activeReviews.filter((item) => item.status === "pending_review" || item.status === "negative_alert").length;
  const resolvedReviews = items.filter((item) => item.status === "resolved");
  const visibleActiveReviews = reviewFilter === "alerts"
    ? activeReviews.filter((item) => item.status === "negative_alert" || item.rating <= 3)
    : reviewFilter === "pending"
      ? activeReviews.filter((item) => item.status === "pending_review" || item.status === "negative_alert")
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
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<Star className="h-4 w-4" />} label="Avis actifs" value={activeReviews.length} tone="blue" active={reviewFilter === "active"} onClick={() => setReviewFilter("active")} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="A valider" value={pendingReviews} tone="amber" active={reviewFilter === "pending"} onClick={() => setReviewFilter("pending")} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Alertes actives" value={alerts} tone="red" active={reviewFilter === "alerts"} onClick={() => setReviewFilter("alerts")} />
        <MetricCard icon={<CheckCircle className="h-4 w-4" />} label="Resolus" value={resolvedReviews.length} tone="emerald" active={reviewFilter === "resolved"} onClick={() => setReviewFilter("resolved")} />
      </div>
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {items.length === 0 && <EmptyState icon={<Star className="h-6 w-6" />} title="Aucun avis client" description="Les avis et alertes satisfaction apparaitront ici." />}
      <ReviewSection title="Avis sejours en cours" reviews={visibleActiveReviews} onResolve={resolveReview} onModerate={updateReviewModeration} onViewProfile={(review) => setProfileTarget({ guestId: review.guestId, stayId: review.stayId })} />
      <ReviewSection title="Avis historiques" reviews={visibleHistoricReviews} onResolve={resolveReview} onModerate={updateReviewModeration} onViewProfile={(review) => setProfileTarget({ guestId: review.guestId, stayId: review.stayId })} muted />
      {profileTarget ? <GuestProfilePanel hotelId={hotelId} token={token} target={profileTarget} onClose={() => setProfileTarget(null)} /> : null}
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
      {selectedStay && <GuestProfilePanel hotelId={hotelId} token={token} target={{ guestId: selectedStay.guestId, stayId: selectedStay.id }} onClose={() => setSelectedStay(null)} onStayUpdated={() => void loadReceptionData()} />}
      {editingStay && <StayEditPanel stay={editingStay} onClose={() => setEditingStay(null)} onSave={(payload) => void saveStay(payload)} />}
    </div>
  );
}

function ReceptionTable({ mode, rows, weakReviews, onView, onEdit, onCheckout }: { mode: "active" | "archived"; rows: any[]; weakReviews: number; onView: (stay: any) => void; onEdit: (stay: any) => void; onCheckout: (stay: any) => void }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="min-w-[1520px] w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {(mode === "active"
                ? ["Chambre", "Client", "Relation", "Tags", "Email", "Telephone", "Arrivee", "Depart", "Langue", "CRM", "Statut", "Messages", "Demandes", "Avis", "Actions"]
                : ["Client", "Relation", "Tags", "Email", "Telephone", "Chambre", "Arrivee", "Depart", "Duree", "Marketing", "Note", "Messages", "Demandes", "Dernier contact", "Actions"]
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
                    <td className="px-4 py-4"><RelationshipBadge status={row.relationshipStatus} /></td>
                    <td className="px-4 py-4"><TagList tags={row.crmTags} /></td>
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
                    <td className="px-4 py-4"><RelationshipBadge status={row.relationshipStatus} /></td>
                    <td className="px-4 py-4"><TagList tags={row.crmTags} /></td>
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

function GuestProfilePanel({ hotelId, token, target, onClose, onStayUpdated }: { hotelId: string; token: string; target: { guestId?: string; stayId?: string }; onClose: () => void; onStayUpdated?: () => void }) {
  const [stays, setStays] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [editingStay, setEditingStay] = useState<any | null>(null);
  const [editingCrm, setEditingCrm] = useState(false);
  const [crmDraft, setCrmDraft] = useState({ relationshipStatus: "normal", crmTags: "", preferences: "{\n}", internalNotes: "" });
  const [crmError, setCrmError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProfile();
  }, [hotelId, token, target.guestId, target.stayId]);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const [activeStays, archivedStays, allMessages, allRequests, allReviews] = await Promise.all([
        api.hotelStays(hotelId, token, "active"),
        api.hotelStays(hotelId, token, "archived"),
        api.hotelMessages(hotelId, token),
        api.hotelRequests(hotelId, token),
        api.hotelReviews(hotelId, token)
      ]);
      const scopedStays = [...activeStays, ...archivedStays].filter((stay) => {
        if (target.stayId) return stay.id === target.stayId;
        if (target.guestId) return stay.guestId === target.guestId;
        return false;
      });
      const stayIds = new Set(scopedStays.map((stay) => stay.id));
      const guestIds = new Set(scopedStays.map((stay) => stay.guestId).filter(Boolean));
      if (target.guestId) guestIds.add(target.guestId);
      setStays(scopedStays);
      setMessages(allMessages.filter((item) => (item.stayId && stayIds.has(item.stayId)) || (item.guestId && guestIds.has(item.guestId))));
      setRequests(allRequests.filter((item) => (item.stayId && stayIds.has(item.stayId)) || (item.guestId && guestIds.has(item.guestId))));
      setReviews(allReviews.filter((item) => (item.stayId && stayIds.has(item.stayId)) || (item.guestId && guestIds.has(item.guestId))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la fiche");
    } finally {
      setLoading(false);
    }
  }

  const primaryStay = useMemo(() => stays.find((stay) => stay.id === target.stayId) ?? stays[0], [stays, target.stayId]);
  const row = useMemo(() => primaryStay ? buildStayRow(primaryStay, messages, requests, reviews) : null, [primaryStay, messages, requests, reviews]);
  const timeline = useMemo(() => primaryStay ? buildGuestTimeline(primaryStay, messages, requests, reviews) : [], [primaryStay, messages, requests, reviews]);
  const openMessages = messages.filter((item) => openStatuses.has(item.status)).length;
  const openRequests = requests.filter((item) => openStatuses.has(item.status)).length;
  const urgentRequests = requests.filter((item) => item.priority === "urgent" || item.status === "urgent").length;
  const lastReview = [...reviews].sort(sortOperationalDesc)[0];
  const isActiveStay = primaryStay ? primaryStay.status === "active" || primaryStay.status === "checked_in" : false;

  useEffect(() => {
    if (!row) return;
    setCrmDraft({
      relationshipStatus: row.relationshipStatus,
      crmTags: row.crmTags.join(", "),
      preferences: JSON.stringify(row.preferences, null, 2),
      internalNotes: row.internalNotes
    });
    setCrmError("");
  }, [row?.guestId, row?.relationshipStatus, row?.internalNotes, row?.crmTags.join(","), JSON.stringify(row?.preferences ?? {})]);

  async function sendProfileReply() {
    const source = [...messages].filter((item) => item.senderType === "guest").sort(sortOperationalDesc)[0] ?? messages[0];
    if (!source || !reply.trim()) return;
    await api.replyMessage(source.id, reply, token);
    setReply("");
    await loadProfile();
  }

  async function updateRequest(item: any, status: string) {
    await api.updateRequestStatus(item.id, status, token);
    await loadProfile();
  }

  async function resolveReview(item: any) {
    await api.updateReviewStatus(item.id, "resolved", token);
    await loadProfile();
  }

  async function checkoutStay() {
    if (!primaryStay) return;
    await api.updateStay(primaryStay.id, { status: "checked_out", checkoutDate: toDateInput(new Date().toISOString()) }, token);
    await loadProfile();
    onStayUpdated?.();
  }

  async function saveStay(payload: { roomNumber: string; checkinDate: string; checkoutDate: string; status: string }) {
    if (!editingStay) return;
    await api.updateStay(editingStay.id, payload, token);
    setEditingStay(null);
    await loadProfile();
    onStayUpdated?.();
  }

  async function saveGuestCrm() {
    if (!row?.guestId) return;
    setCrmError("");
    let preferences: Record<string, string | number | boolean> = {};
    try {
      const parsed = crmDraft.preferences.trim() ? JSON.parse(crmDraft.preferences) : {};
      if (!isPlainPreferenceObject(parsed)) throw new Error("Les preferences doivent etre un objet JSON simple.");
      preferences = parsed;
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "JSON preferences invalide");
      return;
    }
    await api.updateGuestCrm(row.guestId, {
      relationshipStatus: crmDraft.relationshipStatus,
      crmTags: parseTags(crmDraft.crmTags),
      preferences,
      internalNotes: crmDraft.internalNotes
    }, token);
    setEditingCrm(false);
    await loadProfile();
    onStayUpdated?.();
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <aside className="ml-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Fiche client / sejour</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{row?.client ?? "Client"}</h2>
            <p className="mt-1 text-sm text-slate-500">{row ? `Chambre ${row.room} - ${formatDate(row.checkinDate)} au ${formatDate(row.checkoutDate)}` : "Chargement de la fiche complete."}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5">
          {loading && <LoadingPanel />}
          {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
          {!loading && !error && row && primaryStay ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard icon={<Inbox className="h-4 w-4" />} label="Messages ouverts" value={openMessages} tone="amber" />
                  <MetricCard icon={<ListChecks className="h-4 w-4" />} label="Demandes ouvertes" value={openRequests} tone="blue" />
                  <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Urgentes" value={urgentRequests} tone="red" />
                  <MetricCard icon={<Star className="h-4 w-4" />} label="Derniere note" value={lastReview?.rating ?? 0} tone={lastReview?.rating <= 3 ? "red" : "emerald"} />
                </div>
                <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">Identite et sejour</h3>
                      <p className="mt-1 text-sm text-slate-500">Profil client, statut du sejour et actions reception.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setEditingStay(primaryStay)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5">Modifier sejour</button>
                      {isActiveStay && <button onClick={() => void checkoutStay()} className="rounded-xl border border-red-400/30 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/10">Check-out</button>}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoPill icon={<Mail className="h-4 w-4" />} label="Email" value={row.email || "Non renseigne"} />
                    <InfoPill icon={<Phone className="h-4 w-4" />} label="Telephone" value={row.phone || "Non renseigne"} />
                    <InfoPill icon={<Languages className="h-4 w-4" />} label="Langue" value={row.language.toUpperCase()} />
                    <InfoPill icon={<BedDouble className="h-4 w-4" />} label="Chambre" value={row.room} />
                    <InfoPill icon={<Clock className="h-4 w-4" />} label="Duree" value={`${row.nights} nuit${row.nights > 1 ? "s" : ""}`} />
                    <InfoPill icon={<CheckCircle className="h-4 w-4" />} label="Consentement CRM" value={row.marketingConsent ? "Oui" : "Non"} />
                  </div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">CRM reception</h3>
                      <p className="mt-1 text-sm text-slate-500">Informations internes non visibles par le client.</p>
                    </div>
                    <button onClick={() => setEditingCrm((value) => !value)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5">
                      {editingCrm ? "Fermer" : "Editer CRM"}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Relation</p>
                      <div className="mt-2"><RelationshipBadge status={row.relationshipStatus} /></div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Tags CRM</p>
                      <div className="mt-2"><TagList tags={row.crmTags} /></div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 md:col-span-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Preferences</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{formatPreferences(row.preferences)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 md:col-span-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Notes internes</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{row.internalNotes || "Aucune note interne."}</p>
                    </div>
                  </div>
                  {editingCrm ? (
                    <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Statut relation">
                          <select value={crmDraft.relationshipStatus} onChange={(event) => setCrmDraft((draft) => ({ ...draft, relationshipStatus: event.target.value }))} className={fieldClassName}>
                            <option value="normal">normal</option>
                            <option value="priority">prioritaire</option>
                            <option value="watch">a surveiller</option>
                          </select>
                        </Field>
                        <Field label="Tags CRM">
                          <input value={crmDraft.crmTags} onChange={(event) => setCrmDraft((draft) => ({ ...draft, crmTags: event.target.value }))} placeholder="VIP, allergie, preference calme" className={fieldClassName} />
                        </Field>
                        <Field label="Preferences JSON">
                          <textarea value={crmDraft.preferences} onChange={(event) => setCrmDraft((draft) => ({ ...draft, preferences: event.target.value }))} className={`${fieldClassName} min-h-28 font-mono`} />
                        </Field>
                        <Field label="Notes internes">
                          <textarea value={crmDraft.internalNotes} onChange={(event) => setCrmDraft((draft) => ({ ...draft, internalNotes: event.target.value }))} placeholder="Notes visibles uniquement par la reception." className={`${fieldClassName} min-h-28`} />
                        </Field>
                      </div>
                      {crmError && <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{crmError}</p>}
                      <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setEditingCrm(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">Annuler</button>
                        <button onClick={() => void saveGuestCrm()} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">Enregistrer CRM</button>
                      </div>
                    </div>
                  ) : null}
                </section>
                <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <h3 className="font-semibold text-white">Timeline sejour</h3>
                  <div className="mt-4 space-y-3">
                    {timeline.map((item) => <TimelineItem key={item.id} item={item} />)}
                  </div>
                </section>
              </div>
              <div className="space-y-5">
                <ConversationPanel messages={messages} reply={reply} onReplyChange={setReply} onSendReply={sendProfileReply} />
                <RequestPanel requests={requests} onUpdate={updateRequest} />
                <ReviewPanel reviews={reviews} onResolve={resolveReview} />
              </div>
            </div>
          ) : null}
        </div>
      </aside>
      {editingStay && <StayEditPanel stay={editingStay} onClose={() => setEditingStay(null)} onSave={(payload) => void saveStay(payload)} />}
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

function LoadingPanel() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
      Chargement de la fiche client...
    </div>
  );
}

function TimelineItem({ item }: { item: { title: string; description: string; status?: string; actor: string; createdAt: string } }) {
  return (
    <div className="relative pl-7">
      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-amber-300/40 bg-amber-300" />
      <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400">{item.actor}</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">{formatTime(item.createdAt)}{item.status ? ` - ${item.status}` : ""}</p>
      </div>
    </div>
  );
}

function ConversationPanel({ messages, reply, onReplyChange, onSendReply }: { messages: any[]; reply: string; onReplyChange: (value: string) => void; onSendReply: () => Promise<void> }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="font-semibold text-white">Messages</h3>
      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {[...messages].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()).map((message) => (
          <div key={message.id} className={`rounded-2xl px-3 py-2 text-sm ${message.senderType === "reception" ? "ml-8 bg-amber-300 text-slate-950" : "mr-8 border border-white/10 bg-slate-950 text-slate-100"}`}>
            <p className="text-xs opacity-70">{message.senderType === "reception" ? "Reception" : "Client"} - {formatTime(message.createdAt)}</p>
            <p className="mt-1">{message.content}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-slate-500">Aucun message.</p>}
      </div>
      <textarea value={reply} onChange={(event) => onReplyChange(event.target.value)} placeholder="Repondre au client" className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-sm outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10" />
      <button onClick={() => void onSendReply()} disabled={!reply.trim() || messages.length === 0} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50">
        <MessageSquare className="h-4 w-4" /> Repondre
      </button>
    </section>
  );
}

function RequestPanel({ requests, onUpdate }: { requests: any[]; onUpdate: (request: any, status: string) => Promise<void> }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="font-semibold text-white">Demandes</h3>
      <div className="mt-3 space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{request.title}</p>
                <p className="mt-1 text-sm text-slate-400">{request.description}</p>
              </div>
              <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">{request.status}</span>
            </div>
            <RequestDetailsView request={request} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => void onUpdate(request, "in_progress")} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/5">En cours</button>
              <button onClick={() => void onUpdate(request, "completed")} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/5">Traite</button>
              <button onClick={() => void onUpdate(request, "urgent")} className="rounded-lg border border-red-400/30 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10">Urgent</button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-slate-500">Aucune demande.</p>}
      </div>
    </section>
  );
}

function ReviewPanel({ reviews, onResolve }: { reviews: any[]; onResolve: (review: any) => Promise<void> }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="font-semibold text-white">Avis</h3>
      <div className="mt-3 space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className={`rounded-xl border p-3 ${review.rating <= 3 ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-slate-950/55"}`}>
            <p className="font-medium text-white">{review.rating}/5</p>
            <p className="mt-1 text-sm text-slate-300">{review.comment || "Aucun commentaire."}</p>
            <p className="mt-2 text-xs text-slate-500">{review.status} - {formatTime(review.createdAt)}</p>
            {review.rating <= 3 && review.status !== "resolved" && <button onClick={() => void onResolve(review)} className="mt-3 rounded-lg border border-red-400/30 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10">Marquer resolu</button>}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-slate-500">Aucun avis.</p>}
      </div>
    </section>
  );
}

function RequestDetailsView({ request }: { request: any }) {
  const details = requestDetailsEntries(request);
  if (details.length === 0) return null;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-sm text-slate-200">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ReviewSection({ title, reviews, onResolve, onModerate, onViewProfile, muted = false }: { title: string; reviews: any[]; onResolve: (review: any) => Promise<void>; onModerate: (review: any, status: string) => Promise<void>; onViewProfile?: (review: any) => void; muted?: boolean }) {
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
              <StatusBadge status={reviewStatusToBadge(review)} />
            </div>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">{reviewStatusLabel(review.status)}</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">{review.comment || "Aucun commentaire."}</p>
            {onViewProfile && (
              <button onClick={() => onViewProfile(review)} className="mt-4 mr-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">
                Voir fiche
              </button>
            )}
            {(review.status === "pending_review" || review.status === "negative_alert" || review.status === "rejected") && (
              <button onClick={() => void onModerate(review, "approved")} className="mt-4 mr-2 rounded-xl border border-emerald-300/30 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/10 focus:outline-none focus:ring-4 focus:ring-emerald-400/10">
                Valider publication
              </button>
            )}
            {(review.status === "pending_review" || review.status === "negative_alert" || review.status === "approved") && (
              <button onClick={() => void onModerate(review, "rejected")} className="mt-4 mr-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-white/10">
                Ne pas publier
              </button>
            )}
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

function buildGuestTimeline(stay: any, messages: any[], requests: any[], reviews: any[]) {
  return [
    {
      id: `stay:${stay.id}`,
      type: "stay_created",
      title: "Sejour cree",
      description: `Chambre ${stay.roomNumber ?? "-"} - statut ${stay.status ?? "active"}`,
      status: stay.status,
      actor: "systeme",
      createdAt: stay.createdAt
    },
    ...messages.map((message) => ({
      id: `message:${message.id}`,
      type: message.senderType === "reception" ? "message_reception" : "message_client",
      title: message.senderType === "reception" ? "Reponse reception" : "Message client",
      description: message.content,
      status: message.status,
      actor: message.senderType === "reception" ? "reception" : "client",
      createdAt: message.createdAt
    })),
    ...requests.map((request) => ({
      id: `request:${request.id}`,
      type: "request_created",
      title: request.title || request.type || "Demande client",
      description: request.description,
      status: request.status,
      actor: "client",
      createdAt: request.createdAt
    })),
    ...reviews.map((review) => ({
      id: `review:${review.id}`,
      type: review.status === "resolved" ? "review_resolved" : "review_created",
      title: `Avis client ${review.rating}/5`,
      description: review.comment || "Aucun commentaire.",
      status: review.status,
      actor: "client",
      createdAt: review.createdAt
    }))
  ].filter((item) => item.createdAt).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function normalizeStatus(status?: string, priority?: string, senderType?: string): Conversation["status"] {
  if (status === "urgent" || priority === "urgent") return "urgent";
  if (status === "in_progress") return "in_progress";
  if (status === "done" || status === "completed" || status === "closed") return "done";
  if (senderType === "reception") return "answered";
  return "new";
}

function reviewStatusToBadge(review: any): Conversation["status"] {
  if (review.status === "approved") return "answered";
  if (review.status === "resolved") return "done";
  if (review.status === "negative_alert" || review.rating <= 3) return "urgent";
  if (review.status === "pending_review") return "in_progress";
  return "new";
}

function reviewStatusLabel(status?: string) {
  if (status === "approved") return "Valide et publie";
  if (status === "rejected") return "Non publie";
  if (status === "negative_alert") return "Alerte negative - validation requise";
  if (status === "resolved") return "Traite";
  return "En attente de validation";
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

function RelationshipBadge({ status }: { status?: string }) {
  const config = {
    normal: { label: "Normal", className: "border-slate-400/30 bg-slate-500/10 text-slate-200" },
    priority: { label: "Prioritaire", className: "border-amber-400/30 bg-amber-500/10 text-amber-100" },
    watch: { label: "A surveiller", className: "border-red-400/30 bg-red-500/10 text-red-200" }
  }[status ?? "normal"] ?? { label: status ?? "Normal", className: "border-slate-400/30 bg-slate-500/10 text-slate-200" };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>{config.label}</span>;
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-xs text-slate-500">Aucun</span>;
  return (
    <div className="flex max-w-64 flex-wrap gap-1.5">
      {tags.slice(0, 4).map((tag) => (
        <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-300">{tag}</span>
      ))}
      {tags.length > 4 ? <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-500">+{tags.length - 4}</span> : null}
    </div>
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
  const crmTags = Array.isArray(guest.crmTags) ? guest.crmTags.filter((tag: unknown): tag is string => typeof tag === "string") : [];
  const preferences = isPlainPreferenceObject(guest.preferences) ? guest.preferences : {};
  return {
    stay: { ...stay, messages: stay.messages ?? stayMessages, requests: stay.requests ?? stayRequests, reviews: stay.reviews ?? stayReviews },
    guestId: stay.guestId ?? guest.id,
    room: stay.roomNumber ?? "-",
    client: `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() || guest.email || "Client",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    language: guest.language ?? "fr",
    marketingConsent: Boolean(guest.marketingConsent),
    relationshipStatus: guest.relationshipStatus ?? "normal",
    crmTags,
    preferences,
    internalNotes: guest.internalNotes ?? "",
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

function parseTags(value: string) {
  return Array.from(new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
}

function isPlainPreferenceObject(value: unknown): value is Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((item) => ["string", "number", "boolean"].includes(typeof item));
}

function formatPreferences(preferences: Record<string, string | number | boolean>) {
  const entries = Object.entries(preferences);
  if (entries.length === 0) return "Aucune preference renseignee.";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" - ");
}

function requestDesiredTime(request: any) {
  const details = request.details ?? {};
  if (details.asap) return "Des que possible";
  const date = details.requestedDate ? formatDate(String(details.requestedDate)) : "";
  const time = details.requestedTime ? String(details.requestedTime) : "";
  return [date, time].filter(Boolean).join(" ") || formatTime(request.createdAt);
}

function requestPrimaryDetail(request: any) {
  const details = request.details ?? {};
  if (request.type === "taxi") return taxiRequestDestination(details);
  if (request.type === "restaurant") return `${details.people ?? "-"} pers.${details.cuisine ? ` - ${details.cuisine}` : ""}${details.area ? ` - ${details.area}` : ""}`;
  if (request.type === "room_service") return `${details.requestType ?? "Room service"}${details.quantity ? ` x${details.quantity}` : ""}`;
  if (request.type === "towels") return `${details.quantity ?? 1} ${details.itemType ?? "linge"}`;
  return details.subject ?? request.description ?? "-";
}

function requestDetailsEntries(request: any): Array<[string, string]> {
  const details = request.details ?? {};
  if (!details || typeof details !== "object") return [];
  if (request.type === "taxi") {
    const entries: Array<[string, string]> = [
      ["Date / heure", requestDesiredTime(request)],
      ["Depart", details.pickup === "hotel" ? "Hotel" : String(details.pickup ?? "-")],
      ["Destination", taxiRequestDestination(details)],
      ["Passagers", String(details.passengers ?? "-")],
      ["Bagages", String(details.luggage ?? "0")],
      ["Telephone", String(details.phone ?? "-")],
      ["Note", String(details.notes ?? "-")]
    ];
    return entries.filter(([, value]) => value && value !== "-");
  }
  if (request.type === "restaurant") {
    const entries: Array<[string, string]> = [
      ["Date / heure", requestDesiredTime(request)],
      ["Personnes", String(details.people ?? "-")],
      ["Cuisine", String(details.cuisine ?? "-")],
      ["Budget", String(details.budget ?? "-")],
      ["Quartier", String(details.area ?? "-")],
      ["Restaurant", String(details.restaurantName ?? "-")],
      ["Contraintes", String(details.dietaryRestrictions ?? "-")],
      ["Note", String(details.notes ?? "-")]
    ];
    return entries.filter(([, value]) => value && value !== "-");
  }
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => [humanizeDetailKey(key), String(value)]);
}

function taxiRequestDestination(details: any) {
  if (details.destinationType === "airport") return airportName(details.airport);
  if (details.destinationType === "station") return String(details.station ?? "Gare");
  return String(details.destinationLabel ?? "Destination libre");
}

function airportName(value?: string) {
  if (value === "CDG") return "Aeroport Charles de Gaulle";
  if (value === "ORY") return "Aeroport Orly";
  if (value === "BVA") return "Aeroport Beauvais";
  return value ? String(value) : "Aeroport";
}

function humanizeDetailKey(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function exportableStayRows(rows: any[]) {
  return rows.map((row) => ({
    chambre: row.room,
    client: row.client,
    relation_client: row.relationshipStatus,
    tags_crm: row.crmTags.join(", "),
    preferences: formatPreferences(row.preferences),
    notes_internes: row.internalNotes,
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

function FieldDark({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus:ring-4 focus:ring-sky-300/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function mediaUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function SettingsView({ hotelId, token }: { hotelId: string; token: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [breakfastHours, setBreakfastHours] = useState("");
  const [checkinTime, setCheckinTime] = useState("");
  const [checkoutTime, setCheckoutTime] = useState("");
  const [roomServiceHours, setRoomServiceHours] = useState("");
  const [receptionPhone, setReceptionPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.hotelSettings(hotelId, token)
      .then((settings) => {
        if (settings) {
          setWifiName(settings.wifiName ?? "");
          setWifiPassword(settings.wifiPassword ?? "");
          setBreakfastHours(settings.breakfastHours ?? "");
          setCheckinTime(settings.checkinTime ?? "");
          setCheckoutTime(settings.checkoutTime ?? "");
          setRoomServiceHours(settings.roomServiceHours ?? "");
          setReceptionPhone(settings.receptionPhone ?? "");
          setWhatsappNumber(settings.whatsappNumber ?? "");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Impossible de charger les parametres");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hotelId, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await api.updateHotelSettings(
        hotelId,
        {
          wifiName,
          wifiPassword,
          breakfastHours,
          checkinTime,
          checkoutTime,
          roomServiceHours,
          receptionPhone,
          whatsappNumber,
        },
        token
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer les parametres");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingPanel />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Configuration" title="Parametres hotelier" description="Personnalisez les services de l'hotel, informations d'acces et contacts direct" />
      {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {success && <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">Parametres enregistres avec succes.</p>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <FieldDark label="Nom du reseau Wi-Fi" value={wifiName} onChange={setWifiName} placeholder="ex: Hotel-Guest" />
          <FieldDark label="Mot de passe Wi-Fi" value={wifiPassword} onChange={setWifiPassword} placeholder="ex: Paris2026!" />
          <FieldDark label="Horaires petit-dejeuner" value={breakfastHours} onChange={setBreakfastHours} placeholder="ex: 07:00 - 10:30" />
          <FieldDark label="Heure d'arrivee (Check-in)" value={checkinTime} onChange={setCheckinTime} placeholder="ex: 15:00" />
          <FieldDark label="Heure de depart (Check-out)" value={checkoutTime} onChange={setCheckoutTime} placeholder="ex: 12:00" />
          <FieldDark label="Horaires du service d'etage" value={roomServiceHours} onChange={setRoomServiceHours} placeholder="ex: 07:00 - 23:00" />
          <FieldDark label="Telephone de la reception" value={receptionPhone} onChange={setReceptionPhone} placeholder="ex: +33 1 00 00 00 00" />
          <FieldDark label="Numero WhatsApp" value={whatsappNumber} onChange={setWhatsappNumber} placeholder="ex: +33 6 00 00 00 00" />
        </div>

        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 focus:outline-none focus:ring-4 focus:ring-sky-300/20 disabled:opacity-60">
          {saving ? "Enregistrement..." : "Enregistrer les parametres"}
        </button>
      </form>
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
