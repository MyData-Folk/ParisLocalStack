import React, { useState } from 'react';
import { MapPin, Plus, Star, Phone, Globe, Clock, Edit, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { mockRecommendations } from '../lib/mockData';
import type { Recommendation, RecommendationCategory } from '../types';
import { getCategoryIcon } from '../utils/helpers';
import { cn } from '../utils/cn';

const categories: { value: RecommendationCategory; label: string }[] = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'bakery', label: '🥐 Boulangerie' },
  { value: 'pharmacy', label: '💊 Pharmacie' },
  { value: 'supermarket', label: '🛒 Supermarché' },
  { value: 'transport', label: '🚇 Transport' },
  { value: 'attraction', label: '🗼 Attraction' },
  { value: 'museum', label: '🏛️ Musée' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'nightlife', label: '🍸 Nightlife' },
  { value: 'wellness', label: '💆 Bien-être' },
];


export const RecommendationsPage: React.FC = () => {
  const [recs, setRecs] = useState<Recommendation[]>(mockRecommendations);
  const [activeCategory, setActiveCategory] = useState<RecommendationCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRec, setEditingRec] = useState<Partial<Recommendation> | null>(null);

  const filtered = activeCategory === 'all' ? recs : recs.filter(r => r.category === activeCategory);

  const openCreate = () => {
    setEditingRec({
      category: 'restaurant',
      name: '',
      description: '',
      address: '',
      isHighlighted: false,
      sortOrder: recs.length + 1,
    });
    setShowModal(true);
  };

  const openEdit = (rec: Recommendation) => {
    setEditingRec({ ...rec });
    setShowModal(true);
  };

  const saveRec = () => {
    if (!editingRec?.name) return;
    if (editingRec.id) {
      setRecs(prev => prev.map(r => r.id === editingRec.id ? { ...r, ...editingRec } as Recommendation : r));
    } else {
      const newRec: Recommendation = {
        ...editingRec,
        id: `rec-${Date.now()}`,
        hotelId: 'hotel-001',
      } as Recommendation;
      setRecs(prev => [...prev, newRec]);
    }
    setShowModal(false);
    setEditingRec(null);
  };

  const deleteRec = (id: string) => {
    setRecs(prev => prev.filter(r => r.id !== id));
  };

  const toggleHighlight = (id: string) => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, isHighlighted: !r.isHighlighted } : r));
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-xl">Recommandations locales</h2>
          <p className="text-slate-400 text-sm mt-0.5">{recs.length} lieux · Guide local de l'hôtel</p>
        </div>
        <Button variant="gold" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Ajouter un lieu
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap',
            activeCategory === 'all'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
              : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
          )}
        >
          🗺️ Tous ({recs.length})
        </button>
        {categories.map(cat => {
          const count = recs.filter(r => r.category === cat.value).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap',
                activeCategory === cat.value
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
              )}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(rec => (
          <div
            key={rec.id}
            className={cn(
              'bg-slate-800/50 border rounded-2xl p-4 transition-all',
              rec.isHighlighted ? 'border-amber-500/30' : 'border-slate-700/50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl flex-shrink-0">
                {getCategoryIcon(rec.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium text-sm">{rec.name}</h4>
                      {rec.isHighlighted && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                          ⭐ À la une
                        </span>
                      )}
                    </div>
                    {rec.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400 text-xs font-medium">{rec.rating}</span>
                        {rec.priceRange && (
                          <span className="text-slate-500 text-xs">· {rec.priceRange}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleHighlight(rec.id)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors text-xs',
                        rec.isHighlighted
                          ? 'text-amber-400 hover:bg-amber-500/10'
                          : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                      )}
                      title="Mettre en avant"
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => openEdit(rec)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRec(rec.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-2">{rec.description}</p>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {rec.address}
                    {rec.distance && <span>· {rec.distance} ({rec.walkingTime})</span>}
                  </div>
                  {rec.openingHours && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {rec.openingHours}
                    </div>
                  )}
                  {rec.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="w-3 h-3" />
                      {rec.phone}
                    </div>
                  )}
                  {rec.website && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-400">
                      <Globe className="w-3 h-3" />
                      <a href={rec.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                        {rec.website}
                      </a>
                    </div>
                  )}
                </div>

                {rec.tags && rec.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {rec.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Empty */}
        <button
          onClick={openCreate}
          className="border-2 border-dashed border-slate-700 hover:border-amber-500/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 transition-all group"
        >
          <Plus className="w-6 h-6 text-slate-600 group-hover:text-amber-400 transition-colors" />
          <span className="text-slate-500 group-hover:text-white text-sm transition-colors">Ajouter un lieu</span>
        </button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingRec(null); }}
        title={editingRec?.id ? 'Modifier le lieu' : 'Ajouter un lieu'}
        size="lg"
      >
        {editingRec && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={editingRec.category || 'restaurant'}
                onChange={e => setEditingRec(p => ({ ...p, category: e.target.value as RecommendationCategory }))}
                options={categories.map(c => ({ value: c.value, label: c.label }))}
              />
              <Input
                label="Nom du lieu *"
                value={editingRec.name || ''}
                onChange={e => setEditingRec(p => ({ ...p, name: e.target.value }))}
                placeholder="Chez Janou"
              />
            </div>
            <Textarea
              label="Description"
              value={editingRec.description || ''}
              onChange={e => setEditingRec(p => ({ ...p, description: e.target.value }))}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Adresse"
                value={editingRec.address || ''}
                onChange={e => setEditingRec(p => ({ ...p, address: e.target.value }))}
              />
              <Input
                label="Distance"
                value={editingRec.distance || ''}
                onChange={e => setEditingRec(p => ({ ...p, distance: e.target.value }))}
                placeholder="200m"
              />
              <Input
                label="Temps à pied"
                value={editingRec.walkingTime || ''}
                onChange={e => setEditingRec(p => ({ ...p, walkingTime: e.target.value }))}
                placeholder="3 min"
              />
              <Input
                label="Téléphone"
                value={editingRec.phone || ''}
                onChange={e => setEditingRec(p => ({ ...p, phone: e.target.value }))}
              />
              <Input
                label="Horaires"
                value={editingRec.openingHours || ''}
                onChange={e => setEditingRec(p => ({ ...p, openingHours: e.target.value }))}
                placeholder="Lun-Sam 12h-23h"
              />
              <Select
                label="Gamme de prix"
                value={editingRec.priceRange || ''}
                onChange={e => setEditingRec(p => ({ ...p, priceRange: e.target.value }))}
                options={[
                  { value: '', label: 'Non défini' },
                  { value: '€', label: '€ — Bon marché' },
                  { value: '€€', label: '€€ — Modéré' },
                  { value: '€€€', label: '€€€ — Cher' },
                  { value: '€€€€', label: '€€€€ — Très cher' },
                ]}
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <input
                type="checkbox"
                id="highlighted"
                checked={editingRec.isHighlighted || false}
                onChange={e => setEditingRec(p => ({ ...p, isHighlighted: e.target.checked }))}
                className="accent-amber-400 w-4 h-4"
              />
              <label htmlFor="highlighted" className="text-amber-400 text-sm font-medium cursor-pointer">
                ⭐ Mettre en avant (affiché en priorité dans l'app)
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => { setShowModal(false); setEditingRec(null); }} className="flex-1">
                Annuler
              </Button>
              <Button variant="gold" onClick={saveRec} className="flex-1">
                {editingRec.id ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
