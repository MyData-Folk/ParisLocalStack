import React, { useState } from 'react';
import { Star, AlertTriangle, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { mockReviews } from '../lib/mockData';
import { formatRelativeTime, getRatingColor, getRatingStars } from '../utils/helpers';
import { cn } from '../utils/cn';

export const SatisfactionPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'problem'>('all');
  const reviews = mockReviews;

  const filtered = reviews.filter(r => {
    if (filter === 'positive') return r.overallRating >= 4;
    if (filter === 'negative') return r.overallRating <= 3;
    if (filter === 'problem') return r.hasProblem;
    return true;
  });

  const avgRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;
  const positiveCount = reviews.filter(r => r.overallRating >= 4).length;
  const negativeCount = reviews.filter(r => r.overallRating <= 3).length;

  const ratingCategories = [
    { label: 'Propreté', key: 'cleanlinessRating' },
    { label: 'Service', key: 'serviceRating' },
    { label: 'Localisation', key: 'locationRating' },
    { label: 'Rapport qualité/prix', key: 'valueRating' },
  ] as const;

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 text-sm">Note globale</span>
          </div>
          <div className="text-3xl font-bold text-white">{avgRating.toFixed(1)}</div>
          <div className="text-amber-400 text-sm mt-1">{getRatingStars(avgRating)}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-sm">Positifs</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{positiveCount}</div>
          <div className="text-slate-500 text-xs mt-1">Note ≥ 4/5</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown className="w-4 h-4 text-red-400" />
            <span className="text-slate-400 text-sm">Négatifs</span>
          </div>
          <div className="text-3xl font-bold text-red-400">{negativeCount}</div>
          <div className="text-slate-500 text-xs mt-1">Intervention requise</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-slate-400 text-sm">Problèmes signalés</span>
          </div>
          <div className="text-3xl font-bold text-red-400">{reviews.filter(r => r.hasProblem).length}</div>
          <div className="text-slate-500 text-xs mt-1">Alertes envoyées</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'positive', 'negative', 'problem'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                  filter === f
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                )}
              >
                {f === 'all' ? 'Tous' : f === 'positive' ? '😊 Positifs' : f === 'negative' ? '😞 Négatifs' : '⚠️ Problèmes'}
              </button>
            ))}
          </div>

          {filtered.map(review => (
            <div
              key={review.id}
              className={cn(
                'bg-slate-800/50 border rounded-2xl p-5',
                review.overallRating <= 3 ? 'border-red-500/20' : 'border-slate-700/50'
              )}
            >
              {review.hasProblem && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs">{review.problem}</p>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                    review.overallRating >= 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {review.guest?.firstName.charAt(0)}{review.guest?.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {review.guest?.firstName} {review.guest?.lastName}
                    </p>
                    <p className="text-slate-500 text-xs">
                      Ch. {review.stay?.roomNumber} · {formatRelativeTime(review.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('text-2xl font-bold', getRatingColor(review.overallRating))}>
                    {review.overallRating}/5
                  </div>
                  <div className="text-amber-400 text-sm">{getRatingStars(review.overallRating)}</div>
                </div>
              </div>

              {/* Sub Ratings */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ratingCategories.map(cat => {
                  const val = review[cat.key];
                  if (!val) return null;
                  return (
                    <div key={cat.key} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-1.5">
                      <span className="text-slate-400 text-xs">{cat.label}</span>
                      <span className={cn('text-xs font-semibold', getRatingColor(val))}>{val}/5</span>
                    </div>
                  );
                })}
              </div>

              {review.comment && (
                <div className="bg-slate-900/50 rounded-xl p-3 mb-3">
                  <p className="text-slate-300 text-sm leading-relaxed italic">"{review.comment}"</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {review.hasProblem && !review.alertSent && (
                  <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                    ⚠️ Alerte non envoyée
                  </span>
                )}
                {review.alertSent && (
                  <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    ✓ Alerte réception envoyée
                  </span>
                )}
                {review.overallRating >= 4 && (
                  <button className="flex items-center gap-1.5 text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    Rediriger vers Google
                  </button>
                )}
                <button className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors ml-auto">
                  <MessageSquare className="w-3 h-3" />
                  Contacter le client
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Rating Breakdown */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Répartition des notes
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reviews.filter(r => r.overallRating === rating).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm w-6 text-right">{rating}★</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                      <div
                        className={cn('h-2 rounded-full transition-all', getRatingColor(rating).replace('text-', 'bg-'))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-400 text-xs w-6">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Category Ratings */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold">Notes par catégorie</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratingCategories.map(cat => {
                const vals = reviews.map(r => r[cat.key]).filter(Boolean) as number[];
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                return (
                  <div key={cat.key}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-400 text-sm">{cat.label}</span>
                      <span className={cn('text-sm font-semibold', getRatingColor(avg))}>{avg.toFixed(1)}/5</span>
                    </div>
                    <div className="bg-slate-700/50 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
                        style={{ width: `${(avg / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Redirect Strategy */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold">Stratégie réputation</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-emerald-400 text-xs font-medium mb-1">Note ≥ 4/5 → Rediriger</p>
                <p className="text-slate-400 text-xs">Inviter à déposer un avis sur Google, Booking ou TripAdvisor.</p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-xs font-medium mb-1">Note ≤ 3/5 → Intervenir</p>
                <p className="text-slate-400 text-xs">Alerter la réception immédiatement pour résoudre le problème avant le départ.</p>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {[
                  { label: '⭐ Google', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                  { label: '📗 Booking.com', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                  { label: '🦉 TripAdvisor', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                ].map((platform, i) => (
                  <button key={i} className={cn('py-2 px-3 rounded-xl border text-xs font-medium transition-all hover:opacity-80', platform.color)}>
                    {platform.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
