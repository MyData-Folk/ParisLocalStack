import React, { useState } from 'react';
import { BarChart3, QrCode, Users, Star, MessageSquare, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { mockAnalytics } from '../lib/mockData';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '../utils/cn';

const COLORS = ['#c9a84c', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const data = mockAnalytics;

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-xl">Analytiques & Performances</h2>
          <p className="text-slate-400 text-sm mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex gap-2">
          {(['7days', '30days', '90days'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm border transition-all',
                period === p
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              )}
            >
              {p === '7days' ? '7 jours' : p === '30days' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Scans QR Code', value: data.qrScans, icon: <QrCode className="w-5 h-5" />, color: 'text-amber-400 bg-amber-500/10', trend: '+12%' },
          { title: 'Clients actifs', value: data.activeGuests, icon: <Users className="w-5 h-5" />, color: 'text-blue-400 bg-blue-500/10', trend: '+3' },
          { title: 'Satisfaction moy.', value: `${data.avgSatisfaction}/5`, icon: <Star className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/10', trend: '+0.2' },
          { title: 'Messages échangés', value: data.totalMessages, icon: <MessageSquare className="w-5 h-5" />, color: 'text-purple-400 bg-purple-500/10', trend: '+18%' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-2.5 rounded-xl', kpi.color.split(' ')[1])}>
                <span className={kpi.color.split(' ')[0]}>{kpi.icon}</span>
              </div>
              <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded-lg font-medium">
                {kpi.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-slate-400 text-sm mt-0.5">{kpi.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satisfaction Trend */}
        <Card>
          <CardHeader>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Évolution de la satisfaction
            </h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.satisfactionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis domain={[3, 5]} stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#c9a84c"
                  strokeWidth={2.5}
                  dot={{ fill: '#c9a84c', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#e8c97a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message Volume */}
        <Card>
          <CardHeader>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Volume de messages
            </h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.messageVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Services les plus demandés
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.popularServices.map((service, i) => {
                const maxCount = Math.max(...data.popularServices.map(s => s.count));
                const pct = (service.count / maxCount) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm w-24 truncate">{service.category}</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-slate-300 text-sm font-medium w-8 text-right">{service.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Requests Breakdown */}
        <Card>
          <CardHeader>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Résolution des demandes
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Résolues', value: data.resolvedRequests },
                      { name: 'En attente', value: data.totalRequests - data.resolvedRequests },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#334155" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-3xl font-bold text-white">{Math.round((data.resolvedRequests / data.totalRequests) * 100)}%</p>
                  <p className="text-slate-400 text-sm">Taux de résolution</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Résolues
                    </span>
                    <span className="text-emerald-400 font-medium">{data.resolvedRequests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                      En attente
                    </span>
                    <span className="text-slate-300 font-medium">{data.totalRequests - data.resolvedRequests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Tps. moyen
                    </span>
                    <span className="text-white font-medium">{data.avgResponseTime} min</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Split */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Bilan des avis clients
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400">{data.positiveReviews}</div>
              <div className="text-slate-400 text-sm mt-1">Avis positifs (≥4/5)</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400">{data.avgSatisfaction.toFixed(1)}</div>
              <div className="text-slate-400 text-sm mt-1">Note moyenne / 5</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400">{data.negativeReviews}</div>
              <div className="text-slate-400 text-sm mt-1">Alertes détectées</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
