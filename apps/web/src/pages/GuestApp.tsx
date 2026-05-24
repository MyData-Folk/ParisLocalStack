import React, { useState } from 'react';
import {
  Wifi, Clock, MapPin, Star, Send, Home,
  MessageSquare, Bell, CheckCircle, ChevronRight,
  Bed, AlertCircle
} from 'lucide-react';
import { mockHotels, mockRecommendations } from '../lib/mockData';
import { getCategoryIcon, getRatingStars } from '../utils/helpers';
import { cn } from '../utils/cn';

type GuestView = 'onboarding' | 'home' | 'info' | 'local' | 'services' | 'satisfaction' | 'chat';

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  room: string;
  language: string;
  marketingConsent: boolean;
  gdprConsent: boolean;
}

const hotel = mockHotels[0];

export const GuestApp: React.FC = () => {
  const [view, setView] = useState<GuestView>('onboarding');
  const [guestData, setGuestData] = useState<Partial<GuestData>>({
    language: 'fr',
    marketingConsent: false,
    gdprConsent: false,
  });
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { from: 'hotel', text: 'Bienvenue ! Comment puis-je vous aider ?' },
  ]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serviceRequested, setServiceRequested] = useState<string | null>(null);
  const [localCategory, setLocalCategory] = useState<string>('all');

  const primaryColor = hotel.primaryColor;

  const handleOnboardingSubmit = () => {
    if (guestData.gdprConsent && guestData.firstName && guestData.lastName && guestData.email && guestData.room) {
      setView('home');
    }
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    const newHistory = [
      ...chatHistory,
      { from: 'guest', text: chatMessage },
    ];
    setChatHistory(newHistory);
    setChatMessage('');
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { from: 'hotel', text: 'Merci pour votre message. Notre équipe s\'en occupe immédiatement.' },
      ]);
    }, 1000);
  };

  const requestService = (service: string) => {
    setServiceRequested(service);
    setTimeout(() => setServiceRequested(null), 3000);
  };

  const navItems = [
    { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Accueil' },
    { id: 'info', icon: <Bell className="w-5 h-5" />, label: 'Infos' },
    { id: 'local', icon: <MapPin className="w-5 h-5" />, label: 'Quartier' },
    { id: 'services', icon: <Bed className="w-5 h-5" />, label: 'Services' },
    { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Contact' },
  ];

  const localCategories = [
    { id: 'all', emoji: '🗺️', label: 'Tout' },
    { id: 'restaurant', emoji: '🍽️', label: 'Restos' },
    { id: 'cafe', emoji: '☕', label: 'Cafés' },
    { id: 'bakery', emoji: '🥐', label: 'Boulangs' },
    { id: 'museum', emoji: '🏛️', label: 'Musées' },
    { id: 'transport', emoji: '🚇', label: 'Transport' },
  ];

  const filteredRecs = localCategory === 'all'
    ? mockRecommendations
    : mockRecommendations.filter(r => r.category === localCategory);

  // Onboarding
  if (view === 'onboarding') {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: `linear-gradient(180deg, ${primaryColor}22 0%, #0f172a 30%)` }}
      >
        {/* Header */}
        <div className="p-6 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            {hotel.name.charAt(0)}
          </div>
          <h1 className="text-white font-serif font-bold text-2xl">{hotel.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{hotel.city} · {'★'.repeat(hotel.stars)}</p>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 pb-6 max-w-sm mx-auto w-full">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6 space-y-4">
            <div>
              <h2 className="text-white font-semibold text-lg text-center mb-1">Bienvenue ! 🌟</h2>
              <p className="text-slate-400 text-sm text-center">Quelques secondes pour personnaliser votre séjour</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Prénom *</label>
                <input
                  value={guestData.firstName || ''}
                  onChange={e => setGuestData(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nom *</label>
                <input
                  value={guestData.lastName || ''}
                  onChange={e => setGuestData(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Email *</label>
              <input
                type="email"
                value={guestData.email || ''}
                onChange={e => setGuestData(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1"
                placeholder="jean@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Téléphone</label>
                <input
                  value={guestData.phone || ''}
                  onChange={e => setGuestData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1"
                  placeholder="+33 6..."
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">N° chambre *</label>
                <input
                  value={guestData.room || ''}
                  onChange={e => setGuestData(p => ({ ...p, room: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1"
                  placeholder="204"
                />
              </div>
            </div>

            {/* RGPD */}
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guestData.gdprConsent || false}
                  onChange={e => setGuestData(p => ({ ...p, gdprConsent: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 flex-shrink-0"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-slate-400 text-xs">
                  J'accepte la <span className="text-blue-400 underline cursor-pointer">politique de confidentialité</span> et le traitement de mes données. *
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guestData.marketingConsent || false}
                  onChange={e => setGuestData(p => ({ ...p, marketingConsent: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 flex-shrink-0"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-slate-400 text-xs">
                  J'accepte de recevoir des offres et newsletters de l'hôtel.
                </span>
              </label>
            </div>

            <button
              onClick={handleOnboardingSubmit}
              disabled={!guestData.gdprConsent || !guestData.firstName || !guestData.lastName || !guestData.email || !guestData.room}
              className="w-full py-3 rounded-2xl font-semibold text-slate-900 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, #e8c97a)` }}
            >
              Accéder à mon espace ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-sm mx-auto relative">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-4"
        style={{ background: `linear-gradient(180deg, ${primaryColor}33, transparent)` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-serif font-bold text-lg">{hotel.name}</h1>
            <p className="text-slate-400 text-xs">{guestData.firstName} · Ch. {guestData.room}</p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            {hotel.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Service Requested Toast */}
      {serviceRequested && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 fade-in">
          <CheckCircle className="w-4 h-4" />
          {serviceRequested} demandé !
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden pb-20">

        {/* HOME */}
        {view === 'home' && (
          <div className="px-4 pb-4 space-y-4 fade-in">
            {/* Welcome */}
            <div
              className="rounded-2xl p-4"
              style={{ background: `linear-gradient(135deg, ${primaryColor}22, #1e293b)` }}
            >
              <p className="text-white font-medium text-sm">
                Bonjour {guestData.firstName} ! 👋
              </p>
              <p className="text-slate-400 text-xs mt-1">{hotel.settings?.welcomeMessage}</p>
            </div>

            {/* WiFi */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-white text-sm font-medium">WiFi Gratuit</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-900/50 rounded-xl px-3 py-2">
                  <span className="text-slate-400 text-xs">Réseau</span>
                  <span className="text-white text-sm font-mono">{hotel.settings?.wifiName}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 rounded-xl px-3 py-2">
                  <span className="text-slate-400 text-xs">Mot de passe</span>
                  <span className="font-mono text-sm" style={{ color: primaryColor }}>{hotel.settings?.wifiPassword}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Demander une serviette', emoji: '🛁', action: () => requestService('Serviettes') },
                { label: 'Commander au room service', emoji: '🍽️', action: () => setView('services') },
                { label: 'Réserver un taxi', emoji: '🚕', action: () => requestService('Taxi') },
                { label: 'Contacter la réception', emoji: '🛎️', action: () => setView('chat') },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="flex flex-col items-start p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl hover:border-slate-600 active:scale-95 transition-all"
                >
                  <span className="text-2xl mb-2">{action.emoji}</span>
                  <span className="text-white text-xs font-medium leading-tight">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Horaires */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
              <h3 className="text-white text-sm font-medium">Informations pratiques</h3>
              {[
                { icon: '🕒', label: 'Check-in', value: hotel.settings?.checkInTime },
                { icon: '🕛', label: 'Check-out', value: hotel.settings?.checkOutTime },
                { icon: '☕', label: 'Petit déjeuner', value: `${hotel.settings?.breakfastStart} — ${hotel.settings?.breakfastEnd}` },
                { icon: '📞', label: 'Réception', value: hotel.settings?.receptionPhone },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span className="text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Satisfaction quick CTA */}
            <button
              onClick={() => setView('satisfaction')}
              className="w-full flex items-center justify-between p-4 rounded-2xl border"
              style={{ borderColor: `${primaryColor}44`, background: `${primaryColor}11` }}
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5" style={{ color: primaryColor }} />
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Comment se passe votre séjour ?</p>
                  <p className="text-slate-400 text-xs">Partagez votre avis avec nous</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* INFO */}
        {view === 'info' && (
          <div className="px-4 pb-4 space-y-4 fade-in">
            <h2 className="text-white font-semibold text-lg px-1">Infos hôtel</h2>
            {[
              {
                title: 'WiFi',
                icon: '📶',
                content: `Réseau : ${hotel.settings?.wifiName}\nMot de passe : ${hotel.settings?.wifiPassword}`,
              },
              {
                title: 'Horaires',
                icon: '🕒',
                content: `Check-in : ${hotel.settings?.checkInTime}\nCheck-out : ${hotel.settings?.checkOutTime}\nPetit déjeuner : ${hotel.settings?.breakfastStart} — ${hotel.settings?.breakfastEnd}`,
              },
              {
                title: 'Room service',
                icon: '🍽️',
                content: `Disponible de ${hotel.settings?.roomServiceHours}`,
              },
              {
                title: 'Contacts',
                icon: '📞',
                content: `Réception : ${hotel.settings?.receptionPhone}\nUrgences : ${hotel.settings?.emergencyPhone}`,
              },
              {
                title: 'À propos',
                icon: '🏨',
                content: hotel.description,
              },
            ].map((section, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{section.icon}</span>
                  <h3 className="text-white font-medium text-sm">{section.title}</h3>
                </div>
                <p className="text-slate-400 text-sm whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* LOCAL */}
        {view === 'local' && (
          <div className="pb-4 fade-in">
            <div className="px-4 mb-4">
              <h2 className="text-white font-semibold text-lg mb-3">Guide local</h2>
              <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
                {localCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setLocalCategory(cat.id)}
                    className={cn(
                      'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      localCategory === cat.id
                        ? 'text-slate-900 border-transparent'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    )}
                    style={localCategory === cat.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 space-y-3">
              {filteredRecs.map(rec => (
                <div key={rec.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl flex-shrink-0">
                      {getCategoryIcon(rec.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium text-sm">{rec.name}</h4>
                        {rec.isHighlighted && (
                          <span className="text-xs" style={{ color: primaryColor }}>⭐</span>
                        )}
                      </div>
                      {rec.rating && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 text-xs">{getRatingStars(rec.rating)}</span>
                          <span className="text-slate-500 text-xs">{rec.priceRange}</span>
                        </div>
                      )}
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{rec.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rec.distance} ({rec.walkingTime})
                        </span>
                        {rec.openingHours && (
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rec.openingHours}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES */}
        {view === 'services' && (
          <div className="px-4 pb-4 space-y-4 fade-in">
            <h2 className="text-white font-semibold text-lg">Services hôtel</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '🚕', label: 'Taxi', desc: 'Réservation de taxi', action: 'Taxi' },
                { emoji: '🍽️', label: 'Room Service', desc: 'Commander à votre chambre', action: 'Room service' },
                { emoji: '🛁', label: 'Serviettes', desc: 'Serviettes supplémentaires', action: 'Serviettes' },
                { emoji: '🧹', label: 'Ménage', desc: 'Nettoyage chambre', action: 'Ménage' },
                { emoji: '🧳', label: 'Bagages', desc: 'Assistance bagages', action: 'Assistance bagages' },
                { emoji: '⏰', label: 'Réveil', desc: 'Service de réveil', action: 'Réveil' },
                { emoji: '🔧', label: 'Maintenance', desc: 'Problème technique', action: 'Maintenance' },
                { emoji: '💆', label: 'Spa', desc: 'Réserver un soin', action: 'Spa' },
              ].map((service, i) => (
                <button
                  key={i}
                  onClick={() => requestService(service.action)}
                  className="flex flex-col items-start p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl hover:border-slate-600 active:scale-95 transition-all"
                >
                  <span className="text-2xl mb-2">{service.emoji}</span>
                  <p className="text-white text-sm font-medium">{service.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-tight">{service.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHAT */}
        {view === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-160px)] fade-in">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="text-white font-semibold">Messagerie réception</h2>
              <p className="text-slate-500 text-xs">Réponse en quelques minutes</p>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-3">
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn('flex', msg.from === 'guest' ? 'justify-end' : 'justify-start')}>
                  {msg.from === 'hotel' && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      H
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                      msg.from === 'guest'
                        ? 'text-slate-900 rounded-tr-sm'
                        : 'bg-slate-800 text-white rounded-tl-sm'
                    )}
                    style={msg.from === 'guest' ? { backgroundColor: primaryColor } : {}}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Votre message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-900"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SATISFACTION */}
        {view === 'satisfaction' && (
          <div className="px-4 pb-4 fade-in">
            <h2 className="text-white font-semibold text-lg mb-4">Votre avis</h2>
            {!submitted ? (
              <div className="space-y-5">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 text-center">
                  <p className="text-slate-300 text-sm mb-4">Comment évaluez-vous votre séjour global ?</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className={cn(
                          'text-4xl transition-all',
                          rating >= n ? 'scale-110' : 'opacity-30'
                        )}
                        style={{ color: rating >= n ? primaryColor : undefined }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-slate-400 text-sm mt-2">
                      {rating === 5 ? '🤩 Excellent !' : rating === 4 ? '😊 Très bien' : rating === 3 ? '😐 Moyen' : rating === 2 ? '😕 Décevant' : '😞 Très décevant'}
                    </p>
                  )}
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                  <p className="text-slate-300 text-sm font-medium">Note détaillée</p>
                  {['Propreté', 'Service', 'Localisation', 'Rapport qualité/prix'].map(cat => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">{cat}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className="text-amber-400/40 text-lg cursor-pointer hover:text-amber-400 transition-colors">★</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                  <p className="text-slate-300 text-sm font-medium mb-2">Commentaire</p>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 resize-none focus:outline-none"
                  />
                </div>

                {rating <= 3 && rating > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-300 text-sm font-medium">Un problème ?</p>
                      <p className="text-slate-400 text-xs mt-1">Notre équipe sera alertée immédiatement pour résoudre le problème avant votre départ.</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => rating > 0 && setSubmitted(true)}
                  disabled={rating === 0}
                  className="w-full py-3 rounded-2xl font-semibold text-sm transition-all disabled:opacity-30"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, #e8c97a)`, color: '#0f172a' }}
                >
                  Envoyer mon avis
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Merci !</h3>
                <p className="text-slate-400 text-sm">Votre avis a été transmis à notre équipe.</p>
                {rating >= 4 && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <p className="text-blue-300 text-sm font-medium mb-2">
                      Nous sommes ravis de votre satisfaction ! 🌟
                    </p>
                    <p className="text-slate-400 text-xs mb-3">
                      Partagez votre expérience sur Google pour aider d'autres voyageurs.
                    </p>
                    <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium">
                      ⭐ Laisser un avis Google
                    </button>
                  </div>
                )}
                <button onClick={() => setView('home')} className="mt-4 text-slate-400 text-sm underline">
                  Retour à l'accueil
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id as GuestView)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  view === item.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-300'
                )}
                style={view === item.id ? { backgroundColor: primaryColor } : {}}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
    </div>
  );
};
