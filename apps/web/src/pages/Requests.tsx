import React, { useState } from 'react';
import {
  ClipboardList, Filter, Clock,
  CheckCircle, User, X, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { mockServiceRequests } from '../lib/mockData';
import type { ServiceRequest, ServiceStatus } from '../types';
import { formatRelativeTime, getCategoryIcon, getStatusLabel, getStatusColor } from '../utils/helpers';
import { cn } from '../utils/cn';

const statusTabs: { key: ServiceStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Toutes', color: 'text-slate-300' },
  { key: 'urgent', label: 'Urgent', color: 'text-red-400' },
  { key: 'new', label: 'Nouveau', color: 'text-blue-400' },
  { key: 'in_progress', label: 'En cours', color: 'text-amber-400' },
  { key: 'done', label: 'Traité', color: 'text-emerald-400' },
  { key: 'closed', label: 'Fermé', color: 'text-slate-500' },
];

export const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ServiceStatus | 'all'>('all');
  const [requests, setRequests] = useState<ServiceRequest[]>(mockServiceRequests);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = activeTab === 'all'
    ? requests
    : requests.filter(r => r.status === activeTab);

  const updateStatus = (id: string, status: ServiceStatus) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    ));
    if (selectedRequest?.id === id) {
      setSelectedRequest(prev => prev ? { ...prev, status } : null);
    }
  };

  const statusCounts = statusTabs.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? requests.length
      : requests.filter(r => r.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-xl">Gestion des demandes</h2>
          <p className="text-slate-400 text-sm mt-0.5">{requests.length} demandes · {requests.filter(r => r.status === 'urgent').length} urgentes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition-colors">
          <Filter className="w-4 h-4" />
          Filtrer
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hidden pb-1">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border',
              activeTab === tab.key
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-white hover:bg-slate-800'
            )}
          >
            {tab.label}
            {statusCounts[tab.key] > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                activeTab === tab.key ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
              )}>
                {statusCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CheckCircle className="w-12 h-12 text-emerald-500/30 mb-3" />
              <p className="text-slate-400">Aucune demande dans cette catégorie</p>
            </div>
          ) : (
            filtered.map(request => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={cn(
                  'bg-slate-800/50 border rounded-2xl p-4 cursor-pointer hover:bg-slate-800 transition-all group',
                  selectedRequest?.id === request.id
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : request.status === 'urgent'
                    ? 'border-red-500/30 hover:border-red-500/50'
                    : 'border-slate-700/50 hover:border-slate-600'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                    request.status === 'urgent' ? 'bg-red-500/10' : 'bg-slate-700/50'
                  )}>
                    {getCategoryIcon(request.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="text-white font-medium text-sm">{request.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.guest?.firstName} {request.guest?.lastName}
                          </span>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-slate-500 text-xs">Ch. {request.stay?.roomNumber}</span>
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full border flex-shrink-0',
                        getStatusColor(request.status)
                      )}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{request.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-600 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(request.createdAt)}
                      </span>
                      {request.assignedTo && (
                        <span className="text-slate-500 text-xs">
                          → {request.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/30">
                  {request.status !== 'in_progress' && request.status !== 'done' && (
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(request.id, 'in_progress'); }}
                      className="flex-1 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition-colors"
                    >
                      En cours
                    </button>
                  )}
                  {request.status !== 'done' && (
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(request.id, 'done'); }}
                      className="flex-1 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 transition-colors"
                    >
                      ✓ Traité
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedRequest(request); }}
                    className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Détails
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedRequest ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Détail de la demande</h3>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCategoryIcon(selectedRequest.category)}</span>
                    <div>
                      <p className="text-white font-medium">{selectedRequest.title}</p>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        getStatusColor(selectedRequest.status)
                      )}>
                        {getStatusLabel(selectedRequest.status)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedRequest.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Client</span>
                      <span className="text-white">{selectedRequest.guest?.firstName} {selectedRequest.guest?.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Chambre</span>
                      <span className="text-white">{selectedRequest.stay?.roomNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Priorité</span>
                      <span className={cn(
                        'capitalize',
                        selectedRequest.priority === 'urgent' ? 'text-red-400' :
                        selectedRequest.priority === 'high' ? 'text-orange-400' :
                        selectedRequest.priority === 'medium' ? 'text-amber-400' :
                        'text-slate-400'
                      )}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Reçu</span>
                      <span className="text-white">{formatRelativeTime(selectedRequest.createdAt)}</span>
                    </div>
                    {selectedRequest.assignedTo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Assigné à</span>
                        <span className="text-white">{selectedRequest.assignedTo}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-2">Notes internes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ajouter une note..."
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400">Changer le statut</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['in_progress', 'done', 'urgent', 'closed'] as ServiceStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedRequest.id, status)}
                          className={cn(
                            'py-2 rounded-xl text-xs border transition-all',
                            selectedRequest.status === status
                              ? getStatusColor(status) + ' font-semibold'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          )}
                        >
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Sélectionnez une demande pour voir les détails</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardContent className="space-y-3">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Statistiques du jour</p>
              {[
                { label: 'Nouvelles demandes', value: requests.filter(r => r.status === 'new').length, color: 'text-blue-400' },
                { label: 'En cours', value: requests.filter(r => r.status === 'in_progress').length, color: 'text-amber-400' },
                { label: 'Traitées', value: requests.filter(r => r.status === 'done').length, color: 'text-emerald-400' },
                { label: 'Urgentes', value: requests.filter(r => r.status === 'urgent').length, color: 'text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">{stat.label}</span>
                  <span className={cn('font-bold text-sm', stat.color)}>{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
