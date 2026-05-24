import React from 'react';
import {
  MessageSquare, ClipboardList, Star, Users, AlertTriangle,
  QrCode, Clock, ArrowRight, Zap,
  Wifi, Coffee, Phone
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { mockDashboardStats, mockConversations, mockServiceRequests, mockReviews } from '../lib/mockData';
import { formatRelativeTime, getCategoryIcon, getStatusLabel, getStatusColor, getRatingColor } from '../utils/helpers';
import { cn } from '../utils/cn';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const stats = mockDashboardStats;
  const urgentRequests = mockServiceRequests.filter(r => r.status === 'urgent' || r.priority === 'urgent');
  const negativeReviews = mockReviews.filter(r => r.overallRating <= 3);
  const recentConversations = mockConversations.slice(0, 3);

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Alert Banner */}
      {(urgentRequests.length > 0 || negativeReviews.length > 0) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-300 font-semibold text-sm">
              {urgentRequests.length} demande(s) urgente(s) · {negativeReviews.length} avis négatif(s) détecté(s)
            </p>
            <p className="text-red-400/70 text-xs mt-0.5">Intervention rapide recommandée</p>
          </div>
          <button
            onClick={() => onNavigate('requests')}
            className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1"
          >
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clients actifs"
          value={stats.activeGuests}
          subtitle="Séjours en cours"
          icon={<Users className="w-5 h-5" />}
          color="blue"
          trend="up"
          trendValue="+3 today"
        />
        <StatCard
          title="Nouveaux messages"
          value={stats.newMessages}
          subtitle="Non lus"
          icon={<MessageSquare className="w-5 h-5" />}
          color="amber"
          trend="stable"
          trendValue="stable"
        />
        <StatCard
          title="Demandes en attente"
          value={stats.pendingRequests}
          subtitle={`${stats.urgentAlerts} urgente(s)`}
          icon={<ClipboardList className="w-5 h-5" />}
          color="red"
          trend="down"
          trendValue="-2 vs hier"
        />
        <StatCard
          title="Satisfaction moyenne"
          value={`${stats.avgSatisfaction}/5`}
          subtitle="Ce mois"
          icon={<Star className="w-5 h-5" />}
          color="emerald"
          trend="up"
          trendValue="+0.2"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  Conversations récentes
                </h3>
                <button
                  onClick={() => onNavigate('inbox')}
                  className="text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1"
                >
                  Tout voir <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700/50">
                {recentConversations.map((conv) => (
                  <div
                    key={conv.stayId}
                    onClick={() => onNavigate('inbox')}
                    className="flex items-start gap-3 p-4 hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <div className="relative">
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-slate-900 flex-shrink-0',
                        conv.isUrgent ? 'bg-red-400' : 'gradient-gold'
                      )}>
                        {conv.guestName.split(' ').map(n => n[0]).join('')}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white text-sm font-medium">{conv.guestName}</span>
                        <span className="text-slate-500 text-xs">{formatRelativeTime(conv.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Ch. {conv.roomNumber}</span>
                        {conv.isUrgent && (
                          <Badge variant="error" size="sm">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Actions rapides
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: <MessageSquare className="w-4 h-4" />, label: 'Envoyer un message', view: 'inbox', color: 'text-blue-400' },
                { icon: <ClipboardList className="w-4 h-4" />, label: 'Traiter les demandes', view: 'requests', color: 'text-amber-400' },
                { icon: <Star className="w-4 h-4" />, label: 'Voir les avis', view: 'satisfaction', color: 'text-yellow-400' },
                { icon: <Users className="w-4 h-4" />, label: 'Accès CRM clients', view: 'guests', color: 'text-emerald-400' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(action.view)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/30 hover:border-slate-700 transition-all group"
                >
                  <span className={action.color}>{action.icon}</span>
                  <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 ml-auto transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  Demandes
                </h3>
                <button onClick={() => onNavigate('requests')} className="text-amber-400 text-xs hover:text-amber-300">
                  Voir tout
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700/50">
                {mockServiceRequests.slice(0, 3).map((req) => (
                  <div key={req.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xl flex-shrink-0">{getCategoryIcon(req.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{req.title}</p>
                      <p className="text-slate-500 text-xs">Ch. {req.stay?.roomNumber} · {req.guest?.firstName}</p>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border',
                      getStatusColor(req.status)
                    )}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hotel Info Quick Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">WiFi :</span>
              <span className="text-white font-mono">LeMarais_Guests</span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400 font-mono">Paris2024!</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Petit déj :</span>
              <span className="text-white">07:00 — 10:30</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Check-out :</span>
              <span className="text-white">12:00</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Réception :</span>
              <span className="text-white">+33 1 42 72 60 00</span>
            </div>
            <div className="flex items-center gap-2 text-sm ml-auto">
              <QrCode className="w-4 h-4 text-amber-400" />
              <button onClick={() => onNavigate('qrcode')} className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                Voir le QR Code →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Satisfaction Alerts */}
      {negativeReviews.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Alertes satisfaction — Clients insatisfaits
              </h3>
              <button onClick={() => onNavigate('satisfaction')} className="text-amber-400 text-xs hover:text-amber-300">
                Gérer
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50">
              {negativeReviews.map(review => (
                <div key={review.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">
                      {review.guest?.firstName.charAt(0)}{review.guest?.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {review.guest?.firstName} {review.guest?.lastName} — Ch. {review.stay?.roomNumber}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">{review.comment?.slice(0, 80)}...</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xl font-bold', getRatingColor(review.overallRating))}>
                      {review.overallRating}/5
                    </span>
                    <button className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition-colors">
                      Contacter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
