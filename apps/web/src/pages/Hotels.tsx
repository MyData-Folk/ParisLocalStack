import React, { useState } from 'react';
import {
  Plus, Search, QrCode, Settings,
  Globe
} from 'lucide-react';
import { mockHotels } from '../lib/mockData';
import type { Hotel } from '../types';
import { getStatusLabel, getStatusColor } from '../utils/helpers';
import { cn } from '../utils/cn';

interface HotelsPageProps {
  onNavigate: (view: string) => void;
}

export const HotelsPage: React.FC<HotelsPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [hotels] = useState<Hotel[]>(mockHotels);

  const filtered = hotels.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  const planColor = (plan: string) => {
    const colors: Record<string, string> = {
      starter: 'text-slate-400 bg-slate-700/50 border-slate-600/50',
      pro: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      enterprise: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };
    return colors[plan] || colors.starter;
  };

  return (
    <div className="p-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-xl">Gestion des hôtels</h2>
          <p className="text-slate-400 text-sm mt-0.5">{hotels.length} hôtels · {hotels.filter(h => h.status === 'active').length} actifs</p>
        </div>
        <button
          onClick={() => onNavigate('generator')}
          className="flex items-center gap-2 px-4 py-2 gradient-gold text-slate-900 font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nouveau hôtel
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un hôtel..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 max-w-sm"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: hotels.length, color: 'text-white' },
          { label: 'Actifs', value: hotels.filter(h => h.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Brouillons', value: hotels.filter(h => h.status === 'draft').length, color: 'text-amber-400' },
          { label: 'Enterprise', value: hotels.filter(h => h.plan === 'enterprise').length, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 text-center">
            <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
            <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Hotel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(hotel => (
          <div
            key={hotel.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden card-hover"
          >
            {/* Hotel Header */}
            <div
              className="h-24 relative flex items-end p-4"
              style={{
                background: `linear-gradient(135deg, ${hotel.primaryColor}33, ${hotel.secondaryColor}88)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 80% 20%, ${hotel.primaryColor}44, transparent 60%)`,
                }}
              />
              <div className="relative z-10 flex items-end justify-between w-full">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-900 font-bold text-lg shadow-lg"
                    style={{ backgroundColor: hotel.primaryColor }}
                  >
                    {hotel.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{hotel.name}</h3>
                    <p className="text-white/60 text-xs">{hotel.city}, {hotel.country}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {'★'.repeat(hotel.stars).split('').map((_, i) => (
                    <span key={i} style={{ color: hotel.primaryColor }} className="text-sm">★</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full border',
                  getStatusColor(hotel.status)
                )}>
                  {getStatusLabel(hotel.status)}
                </span>
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full border capitalize',
                  planColor(hotel.plan)
                )}>
                  {hotel.plan}
                </span>
                <span className="text-xs text-slate-500">
                  {hotel.languages.map(l => l.toUpperCase()).join(' · ')}
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{hotel.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/50 rounded-xl p-2.5">
                  <p className="text-slate-500 mb-0.5">Thème</p>
                  <p className="text-white capitalize">{hotel.theme}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-2.5">
                  <p className="text-slate-500 mb-0.5">Plan</p>
                  <p className="text-white capitalize">{hotel.plan}</p>
                </div>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Palette :</span>
                <div className="flex gap-1">
                  {[hotel.primaryColor, hotel.secondaryColor, hotel.accentColor].map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-700/30">
                <button
                  onClick={() => onNavigate('hotel-settings')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 rounded-xl text-xs transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurer
                </button>
                {hotel.status === 'active' && (
                  <button
                    onClick={() => onNavigate('qrcode')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-xl text-xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Code
                  </button>
                )}
                {hotel.status !== 'active' && (
                  <button
                    onClick={() => onNavigate('generator')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-xl text-xs transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Déployer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Hotel Card */}
        <button
          onClick={() => onNavigate('generator')}
          className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 group transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-amber-500/10 border border-slate-700 group-hover:border-amber-500/30 flex items-center justify-center transition-all">
            <Plus className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-slate-400 group-hover:text-white font-medium text-sm transition-colors">Ajouter un hôtel</p>
            <p className="text-slate-600 text-xs mt-1">Générer une nouvelle app</p>
          </div>
        </button>
      </div>
    </div>
  );
};
