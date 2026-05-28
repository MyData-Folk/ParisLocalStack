import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { api } from "../../../lib/api";
import { Field } from "../../admin/components/AdminField";
import { ErrorState, LoadingState } from "../../admin/components/AdminSharedUI";

type RecForm = {
  category: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  distance: string;
  imageUrl: string;
  tags: string;
  sortOrder: string;
  isFeatured: boolean;
  isActive: boolean;
};

const NEW_REC: RecForm = {
  category: "restaurants",
  name: "",
  description: "",
  address: "",
  phone: "",
  website: "",
  distance: "",
  imageUrl: "",
  tags: "",
  sortOrder: "0",
  isFeatured: false,
  isActive: true
};

const CATEGORIES = [
  "Restaurants","Bars","Cafés","Boulangeries","Musées","Monuments","Shopping","Transports",
  "Pharmacies","Supermarchés","Croisières","Tours en bus","Expériences locales","Spectacles",
  "Jazz clubs","Marchés locaux","Famille","Romantique","Business","Bien-être","Partenaire hôtel",
  "Coup de cœur","Bons plans quartier"
];

function toPayload(form: RecForm) {
  return {
    category: form.category,
    name: form.name,
    description: form.description,
    address: form.address,
    phone: form.phone,
    website: form.website,
    distance: form.distance,
    imageUrl: form.imageUrl,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    sortOrder: Number(form.sortOrder || 0),
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    source: "manual"
  };
}

function fromRecommendation(r: any): RecForm {
  return {
    category: r.category ?? "",
    name: r.name ?? "",
    description: r.description ?? "",
    address: r.address ?? "",
    phone: r.phone ?? "",
    website: r.website ?? "",
    distance: r.distance ?? "",
    imageUrl: r.imageUrl ?? "",
    tags: Array.isArray(r.tags) ? r.tags.join(", ") : "",
    sortOrder: String(r.sortOrder ?? 0),
    isFeatured: Boolean(r.isFeatured),
    isActive: r.isActive !== false
  };
}

export function HotelAdminRecommendationsPage({ hotelId, token }: { hotelId: string; token: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [form, setForm] = useState<RecForm>({ ...NEW_REC });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState("");

  useEffect(() => {
    if (!hotelId) { setError("Aucun hotel selectionne."); setLoading(false); return; }
    setLoading(true); setError("");
    api.hotelRecommendations(hotelId, token).then(setRecommendations).catch(() => setError("Impossible de charger les recommandations.")).finally(() => setLoading(false));
  }, [hotelId, token]);

  function update<K extends keyof RecForm>(field: K, value: RecForm[K]) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!hotelId) return;
    setSaving(true); setMessage("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        const updated = await api.updateRecommendation(editingId, payload, token);
        setRecommendations((c) => c.map((r) => r.id === updated.id ? updated : r));
        setMessage("Recommandation modifiee.");
      } else {
        const created = await api.createRecommendation(hotelId, payload, token);
        setRecommendations((c) => [created, ...c]);
        setMessage("Recommandation ajoutee.");
      }
      setForm({ ...NEW_REC }); setEditingId(null);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Erreur enregistrement."); }
    finally { setSaving(false); }
  }

  function edit(r: any) { setEditingId(r.id); setForm(fromRecommendation(r)); }

  async function toggle(r: any, changes: Record<string, unknown>) {
    try {
      const updated = await api.updateRecommendation(r.id, changes, token);
      setRecommendations((c) => c.map((i) => i.id === updated.id ? updated : i));
      setMessage("Recommandation mise a jour.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Erreur mise a jour."); }
  }

  async function handleDelete(r: any) {
    setDeleteTarget(r);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteRecommendation(deleteTarget.id, token);
      setRecommendations((c) => c.filter((r) => r.id !== deleteTarget.id));
      setMessage("Recommandation supprimee.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Erreur suppression."); }
    setDeleteTarget(null);
  }

  function cancel() { setForm({ ...NEW_REC }); setEditingId(null); }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setImgError("");
    if (!file.type.startsWith("image/")) { setImgError("Seules les images sont acceptees."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { setImgError("L'image ne doit pas depasser 10 Mo."); e.target.value = ""; return; }
    setImgUploading(true);
    try {
      const uploaded = await api.uploadHotelFile(hotelId, file, token);
      update("imageUrl", uploaded.url ?? "");
    } catch { setImgError("L'upload a echoue. Reessayez ou collez une URL manuellement."); }
    finally { setImgUploading(false); e.target.value = ""; }
  }

  if (loading) return <LoadingState label="Chargement des recommandations..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Guide local</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Recommandations locales</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Ajoutez vos adresses preferees, partenaires et experiences locales visibles dans l'application client.</p>
        </div>
      </section>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">{editingId ? "Modifier" : "Ajouter"} une recommandation</h2>
            <p className="mt-1 text-sm text-slate-400">{recommendations.length} adresse(s) enregistree(s).</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Nom" value={form.name} onChange={(v) => update("name", v)} placeholder="Cafe de la Paix" required />
          <Field label="Categorie" value={form.category} onChange={(v) => update("category", v)} placeholder="restaurant..." required list="rec-categories-v2" />
          <Field label="Description" value={form.description} onChange={(v) => update("description", v)} placeholder="Adresse selectionnee par l'hotel" />
          <Field label="Adresse" value={form.address} onChange={(v) => update("address", v)} placeholder="5 place..." />
          <Field label="Telephone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+33..." />
          <Field label="Site web" value={form.website} onChange={(v) => update("website", v)} placeholder="https://..." />
          <Field label="Distance" value={form.distance} onChange={(v) => update("distance", v)} placeholder="8 min a pied" />

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Image</p>
            {form.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <img src={form.imageUrl} alt="Apercu" className="h-40 w-full object-cover" />
                <button type="button" title="Retirer l'image" onClick={() => update("imageUrl", "")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-slate-950/80 text-slate-200 backdrop-blur transition hover:bg-red-500/20 hover:text-red-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={imgUploading} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-50">
                {imgUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {imgUploading ? "Upload en cours..." : "Choisir une image"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void handleImageUpload(e)} />
              <span className="text-xs text-slate-500">Max 10 Mo</span>
            </div>
            {imgError ? <p className="rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{imgError}</p> : null}
          </div>

          <div className="md:col-span-2">
            <Field label="Ou coller une URL d'image externe" value={form.imageUrl} onChange={(v) => update("imageUrl", v)} placeholder="https://..." type="url" />
          </div>

          <Field label="Tags" value={form.tags} onChange={(v) => update("tags", v)} placeholder="romantique, terrasse, famille" />
          <Field label="Ordre d'affichage" type="number" value={form.sortOrder} onChange={(v) => update("sortOrder", v)} />
          <div className="grid gap-2 md:self-end">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
              Mettre en avant
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
              Visible dans l'app client
            </label>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Mettre a jour" : "Ajouter"}
            </button>
            {editingId ? <button type="button" onClick={cancel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">Annuler</button> : null}
          </div>
        </form>

        {message ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      </div>

      <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
        {recommendations.length === 0 ? <p className="p-5 text-sm text-slate-500">Aucune recommandation.</p> : null}
        {recommendations.map((r) => (
          <div key={r.id} className="grid gap-4 p-4 transition hover:bg-white/[0.03] lg:grid-cols-[1fr_120px_120px_240px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{r.name}</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">{r.category}</span>
                {r.isFeatured ? <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs text-amber-100"><Star className="inline h-3 w-3 mr-0.5" />Avant</span> : null}
                {r.isActive === false ? <span className="rounded-full border border-red-300/25 bg-red-500/10 px-2 py-1 text-xs text-red-100">Masquee</span> : null}
              </div>
              <p className="mt-1 truncate text-sm text-slate-400">{r.description || r.address || "Description a completer"}</p>
            </div>
            <span className="text-sm text-slate-400">{r.distance || "-"}</span>
            <span className="text-sm text-slate-400">Ordre {r.sortOrder ?? 0}</span>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <button type="button" onClick={() => edit(r)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5">Editer</button>
              <button type="button" onClick={() => toggle(r, { isFeatured: !r.isFeatured })} className="rounded-lg border border-amber-300/25 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10">Avant</button>
              <button type="button" onClick={() => toggle(r, { isActive: !r.isActive })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5">{r.isActive === false ? "Activer" : "Masquer"}</button>
              <button type="button" onClick={() => handleDelete(r)} className="rounded-lg border border-red-300/25 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/10" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end bg-stone-950/55 p-4 backdrop-blur-sm md:items-center md:justify-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111115] p-6 shadow-2xl">
            <p className="text-lg font-semibold text-white">Supprimer la recommandation ?</p>
            <p className="mt-2 text-sm text-slate-400">"{deleteTarget.name}" sera definitivement supprime.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">Annuler</button>
              <button type="button" onClick={() => void confirmDelete()} className="flex-1 rounded-xl bg-red-500/20 border border-red-300/25 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/30">Supprimer</button>
            </div>
          </div>
        </div>
      ) : null}

      <datalist id="rec-categories-v2">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
    </div>
  );
}