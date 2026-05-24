import React, { useState } from 'react';
import {
  Users, Search, Mail, Phone, Download,
  Globe, CheckCircle, XCircle, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { mockGuests, mockStays, mockReviews } from '../lib/mockData';
import type { Guest } from '../types';
import { formatFullDate, getLanguageFlag } from '../utils/helpers';
import { cn } from '../utils/cn';

export const GuestsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [filter, setFilter] = useState<'all' | 'marketing' | 'current'>('all');

  const filteredGuests = mockGuests.filter(g => {
    const matchSearch =
      g.firstName.toLowerCase().includes(search.toLowerCase()) ||
      g.lastName.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase());
    if (filter === 'marketing') return matchSearch && g.marketingConsent;
    if (filter === 'current') {
      const stay = mockStays.find(s => s.guestId === g.id && s.status === 'active');
      return matchSearch && !!stay;
    }
    return matchSearch;
  });

  const getGuestStay = (guestId: string) => mockStays.find(s => s.guestId === guestId);
  const getGuestReviews = (guestId: string) => mockReviews.filter(r => r.guestId === guestId);

  const marketingCount = mockGuests.filter(g => g.marketingConsent).length;
  const currentCount = mockStays.filter(s => s.status === 'active').length;

  return (
    <div className="p-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-xl">CRM Clients</h2>
          <p className="text-slate-400 text-sm mt-0.5">{mockGuests.length} clients · {marketingCount} consentements marketing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm hover:bg-emerald-500/20 transition-colors">
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{mockGuests.length}</div>
          <div className="text-slate-400 text-sm mt-1">Total clients</div>
        </div>
        <div className="bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{marketingCount}</div>
          <div className="text-slate-400 text-sm mt-1">Consentement marketing</div>
        </div>
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{currentCount}</div>
          <div className="text-slate-400 text-sm mt-1">Séjours en cours</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest List */}
        <div className="lg:col-span-2">
          {/* Search & Filter */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'current', 'marketing'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                    filter === f
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  )}
                >
                  {f === 'all' ? 'Tous' : f === 'current' ? '🏨 En séjour' : '📧 Marketing'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-0">
              {/* Header */}
              <div className="col-span-4 grid grid-cols-[1fr_1fr_80px_80px] px-4 py-3 border-b border-slate-700/50">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Client</span>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Contact</span>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Langue</span>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">RGPD</span>
              </div>

              {filteredGuests.map(guest => {
                const stay = getGuestStay(guest.id);
                const reviews = getGuestReviews(guest.id);
                const avgRating = reviews.length
                  ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
                  : null;

                return (
                  <div
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    className={cn(
                      'col-span-4 grid grid-cols-[1fr_1fr_80px_80px] px-4 py-3 border-b border-slate-700/30 last:border-0 cursor-pointer hover:bg-slate-800/30 transition-colors',
                      selectedGuest?.id === guest.id && 'bg-amber-500/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        stay ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                      )}>
                        {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{guest.firstName} {guest.lastName}</p>
                        <div className="flex items-center gap-2">
                          {stay && <span className="text-blue-400 text-xs">Ch. {stay.roomNumber}</span>}
                          {avgRating && (
                            <span className="text-amber-400 text-xs flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5" /> {avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-slate-300 text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {guest.email}
                      </span>
                      {guest.phone && (
                        <span className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {guest.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-base">{getLanguageFlag(guest.language)}</span>
                      <span className="text-slate-500 text-xs ml-1">{guest.language.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {guest.marketingConsent ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Guest Detail */}
        <div>
          {selectedGuest ? (
            <Card className="sticky top-20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {selectedGuest.firstName.charAt(0)}{selectedGuest.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selectedGuest.firstName} {selectedGuest.lastName}</h3>
                    <p className="text-slate-400 text-xs">{getLanguageFlag(selectedGuest.language)} {selectedGuest.nationality}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Contact</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{selectedGuest.email}</span>
                    </div>
                    {selectedGuest.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300">{selectedGuest.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{selectedGuest.language.toUpperCase()} · {selectedGuest.nationality}</span>
                    </div>
                  </div>
                </div>

                {/* RGPD */}
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">RGPD</p>
                  <div className="space-y-2">
                    <div className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-sm',
                      selectedGuest.gdprConsent
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-400'
                    )}>
                      {selectedGuest.gdprConsent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      Consentement RGPD
                    </div>
                    <div className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-sm',
                      selectedGuest.marketingConsent
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-400'
                    )}>
                      {selectedGuest.marketingConsent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      Marketing emails
                    </div>
                  </div>
                </div>

                {/* Current Stay */}
                {(() => {
                  const stay = getGuestStay(selectedGuest.id);
                  return stay ? (
                    <div className="space-y-2">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Séjour en cours</p>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Chambre</span>
                          <span className="text-white font-medium">{stay.roomNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Arrivée</span>
                          <span className="text-white">{formatFullDate(stay.checkInDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Départ</span>
                          <span className="text-white">{formatFullDate(stay.checkOutDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Source</span>
                          <span className="text-white capitalize">{stay.source}</span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Reviews */}
                {(() => {
                  const reviews = getGuestReviews(selectedGuest.id);
                  return reviews.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Avis laissé</p>
                      {reviews.map(r => (
                        <div key={r.id} className={cn(
                          'p-3 rounded-xl border',
                          r.overallRating >= 4
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                        )}>
                          <div className="flex justify-between mb-1">
                            <span className={r.overallRating >= 4 ? 'text-emerald-400' : 'text-red-400'}>
                              {r.overallRating}/5 ★
                            </span>
                            <span className="text-slate-500 text-xs">{formatFullDate(r.createdAt)}</span>
                          </div>
                          {r.comment && <p className="text-slate-300 text-xs">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  <button className="w-full py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Envoyer un email
                  </button>
                  <button className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-colors text-xs">
                    Supprimer les données (RGPD)
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Sélectionnez un client</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
