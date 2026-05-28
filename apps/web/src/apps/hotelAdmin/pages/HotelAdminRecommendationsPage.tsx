import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { RecommendationManager } from "../../admin/pages/AdminHotelDetailPage";
import {
  type RecommendationFormState,
  emptyRecommendationForm,
  normalizeRecommendationForm
} from "../../admin/admin.types";
import { ErrorState, LoadingState } from "../../admin/components/AdminSharedUI";

export function HotelAdminRecommendationsPage({ hotelId, token }: { hotelId: string; token: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [form, setForm] = useState<RecommendationFormState>(emptyRecommendationForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) {
      setError("Aucun hotel selectionne.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api.hotelRecommendations(hotelId, token)
      .then(setRecommendations)
      .catch(() => setError("Impossible de charger les recommandations."))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hotelId) return;
    const payload = normalizeRecommendationForm(form);

    if (editingId) {
      api.updateRecommendation(editingId, payload, token)
        .then((updated) => {
          setRecommendations((current) => current.map((r) => r.id === updated.id ? updated : r));
          setForm(emptyRecommendationForm);
          setEditingId(null);
          setMessage("Recommandation modifiee.");
        })
        .catch((err) => setMessage(err instanceof Error ? err.message : "Erreur modification."));
    } else {
      api.createRecommendation(hotelId, payload, token)
        .then((created) => {
          setRecommendations((current) => [created, ...current]);
          setForm(emptyRecommendationForm);
          setMessage("Recommandation ajoutee.");
        })
        .catch((err) => setMessage(err instanceof Error ? err.message : "Erreur creation."));
    }
  }

  function handleEdit(recommendation: any) {
    setEditingId(recommendation.id);
    setForm({
      category: recommendation.category ?? "",
      name: recommendation.name ?? "",
      description: recommendation.description ?? "",
      address: recommendation.address ?? "",
      phone: recommendation.phone ?? "",
      website: recommendation.website ?? "",
      distance: recommendation.distance ?? "",
      imageUrl: recommendation.imageUrl ?? "",
      tags: Array.isArray(recommendation.tags) ? recommendation.tags.join(", ") : "",
      openingHours: recommendation.openingHours ?? "",
      sortOrder: String(recommendation.sortOrder ?? 0),
      isFeatured: Boolean(recommendation.isFeatured),
      isActive: recommendation.isActive !== false
    });
  }

  function handleToggle(recommendation: any, changes: Record<string, unknown>) {
    api.updateRecommendation(recommendation.id, changes, token)
      .then((updated) => {
        setRecommendations((current) => current.map((r) => r.id === updated.id ? updated : r));
        setMessage("Recommandation mise a jour.");
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Erreur mise a jour."));
  }

  function handleCancel() {
    setForm(emptyRecommendationForm);
    setEditingId(null);
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

      <RecommendationManager
        hotelId={hotelId}
        token={token}
        recommendations={recommendations}
        form={form}
        editingId={editingId}
        message={message}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onCancel={handleCancel}
      />
    </div>
  );
}