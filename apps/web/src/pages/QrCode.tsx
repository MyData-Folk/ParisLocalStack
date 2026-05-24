import React, { useState } from 'react';
import { QrCode, Download, Copy, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../stores/appStore';

export const QrCodePage: React.FC = () => {
  const { currentHotel } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState(300);

  if (!currentHotel) return null;

  const appUrl = `https://app.concierge-os.com/${currentHotel.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(appUrl)}&color=0f172a&bgcolor=ffffff&margin=10`;

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const printingFormats = [
    { name: 'A6 (10×15cm)', desc: 'Parfait pour la table de nuit', recommended: true },
    { name: 'A5 (14×21cm)', desc: 'Présentoir de réception' },
    { name: 'A4 (21×29cm)', desc: 'Affichage mural' },
    { name: 'Sticker 8cm', desc: 'Vitrophanie, valise' },
  ];

  const placements = [
    { emoji: '🛏️', label: 'Table de nuit', desc: 'Accessibilité maximale' },
    { emoji: '🔑', label: 'Porte de chambre', desc: 'Premier contact à l\'arrivée' },
    { emoji: '🏨', label: 'Réception', desc: 'Check-in numérique' },
    { emoji: '🍽️', label: 'Restaurant', desc: 'Menu & room service' },
    { emoji: '🛗', label: 'Ascenseur', desc: 'Visibilité permanente' },
    { emoji: '📦', label: 'Bagage', desc: 'Sticker valise' },
  ];

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h2 className="text-white font-semibold text-xl">QR Code & Déploiement</h2>
        <p className="text-slate-400 text-sm mt-0.5">Gérez l'accès à votre application concierge</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                QR Code — {currentHotel.name}
              </h3>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-2xl p-4 w-fit">
                <img
                  src={qrUrl}
                  alt={`QR Code ${currentHotel.name}`}
                  className="w-48 h-48"
                />
              </div>

              {/* Size Control */}
              <div className="w-full">
                <label className="text-xs text-slate-400 block mb-2">Taille : {size}×{size}px</label>
                <input
                  type="range"
                  min={200}
                  max={600}
                  step={50}
                  value={size}
                  onChange={e => setSize(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* URL */}
              <div className="w-full bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                <p className="text-slate-500 text-xs mb-1">URL de l'application</p>
                <p className="text-amber-400 text-sm font-mono break-all">{appUrl}</p>
              </div>

              {/* Actions */}
              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  onClick={copyUrl}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
                <a
                  href={qrUrl}
                  download={`qrcode-${currentHotel.slug}.png`}
                  className="flex items-center justify-center gap-1.5 py-2.5 gradient-gold text-slate-900 font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </a>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-500/20 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Tester l'application
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '342', label: 'Scans ce mois', icon: '📊', color: 'text-amber-400' },
              { value: '12', label: 'Scans aujourd\'hui', icon: '📱', color: 'text-blue-400' },
              { value: '89%', label: 'Taux d\'onboarding', icon: '✅', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Printing Formats */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold">Formats d'impression recommandés</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {printingFormats.map((format, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${format.recommended ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}
                >
                  {format.recommended && (
                    <span className="text-xs text-amber-400 font-semibold block mb-1">⭐ Recommandé</span>
                  )}
                  <p className="text-white text-sm font-medium">{format.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{format.desc}</p>
                  <button className="mt-2 text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                    <Download className="w-3 h-3" /> Modèle PDF
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Placement Guide */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                Guide de placement
              </h3>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {placements.map((p, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-center hover:border-amber-500/30 transition-colors">
                  <span className="text-2xl mb-2">{p.emoji}</span>
                  <p className="text-white text-xs font-medium">{p.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* App Preview */}
          <Card>
            <CardHeader>
              <h3 className="text-white font-semibold">Aperçu application client</h3>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${currentHotel.primaryColor}22, #1e293b)` }}
              >
                <div>
                  <p className="text-white font-semibold">{currentHotel.name}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{currentHotel.city} · {currentHotel.stars}★</p>
                  <p className="text-xs mt-2" style={{ color: currentHotel.primaryColor }}>
                    📱 Accessible via QR Code
                  </p>
                </div>
                <div className="bg-white rounded-xl p-2">
                  <img src={qrUrl} alt="QR" className="w-16 h-16" />
                </div>
              </div>
              <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <p className="text-slate-400 text-xs">
                  💡 <strong className="text-white">Conseil :</strong> Imprimez le QR Code en format A6 et placez-le sur la table de nuit de chaque chambre pour un taux de scan optimal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
