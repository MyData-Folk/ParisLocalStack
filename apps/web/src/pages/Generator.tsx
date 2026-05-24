import React, { useState } from 'react';
import {
  Sparkles, Building2, Palette, Globe, Settings,
  CheckCircle, ArrowRight, ArrowLeft, Zap, Download,
  Eye, QrCode
} from 'lucide-react';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { slugify, generateQrCodeUrl } from '../utils/helpers';
import { cn } from '../utils/cn';

interface HotelConfig {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  stars: number;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: string;
  languages: string[];
  defaultLanguage: string;
  plan: string;
  wifiName: string;
  wifiPassword: string;
  checkInTime: string;
  checkOutTime: string;
  breakfastStart: string;
  breakfastEnd: string;
  welcomeMessage: string;
}

const defaultConfig: HotelConfig = {
  name: '',
  address: '',
  city: '',
  country: 'France',
  phone: '',
  email: '',
  stars: 4,
  description: '',
  primaryColor: '#c9a84c',
  secondaryColor: '#0f172a',
  accentColor: '#e8c97a',
  theme: 'boutique',
  languages: ['fr', 'en'],
  defaultLanguage: 'fr',
  plan: 'pro',
  wifiName: '',
  wifiPassword: '',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  breakfastStart: '07:00',
  breakfastEnd: '10:30',
  welcomeMessage: 'Bienvenue dans notre établissement !',
};

const steps = [
  { id: 1, label: 'Informations', icon: <Building2 className="w-4 h-4" /> },
  { id: 2, label: 'Branding', icon: <Palette className="w-4 h-4" /> },
  { id: 3, label: 'Langues & Plan', icon: <Globe className="w-4 h-4" /> },
  { id: 4, label: 'Configuration', icon: <Settings className="w-4 h-4" /> },
  { id: 5, label: 'Génération', icon: <Sparkles className="w-4 h-4" /> },
];

const themes = [
  { id: 'boutique', label: 'Boutique Parisien', description: 'Style élégant avec touches d\'or' },
  { id: 'modern', label: 'Modern Luxe', description: 'Design épuré et contemporain' },
  { id: 'classic', label: 'Grand Classique', description: 'Tradition et prestige hôtelier' },
  { id: 'elegant', label: 'Elegant Resort', description: 'Ambiance resort haut de gamme' },
];

const colorPresets = [
  { primary: '#c9a84c', secondary: '#0f172a', accent: '#e8c97a', label: 'Gold Noir' },
  { primary: '#0ea5e9', secondary: '#0f172a', accent: '#38bdf8', label: 'Ocean Blue' },
  { primary: '#7c3aed', secondary: '#1e1b4b', accent: '#a78bfa', label: 'Royal Purple' },
  { primary: '#10b981', secondary: '#0f172a', accent: '#34d399', label: 'Emerald' },
  { primary: '#ef4444', secondary: '#0f172a', accent: '#f87171', label: 'Crimson' },
  { primary: '#f59e0b', secondary: '#1c1917', accent: '#fcd34d', label: 'Amber Warm' },
];

export const GeneratorPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<HotelConfig>(defaultConfig);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [progress, setProgress] = useState(0);

  const slug = slugify(config.name);
  const qrUrl = slug ? generateQrCodeUrl(slug) : '';

  const update = (key: keyof HotelConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    const steps = [
      'Création de la configuration hôtel...',
      'Génération de l\'application client...',
      'Configuration du dashboard réception...',
      'Injection des variables d\'environnement...',
      'Génération du QR Code...',
      'Préparation du déploiement...',
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(Math.round(((i + 1) / steps.length) * 100));
    }
    setGenerating(false);
    setGenerated(true);
  };

  const toggleLanguage = (lang: string) => {
    setConfig(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  return (
    <div className="p-6 fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-gold mb-4">
            <Sparkles className="w-7 h-7 text-slate-900" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">Générateur d'application hôtel</h2>
          <p className="text-slate-400">Créez et déployez votre application concierge en quelques minutes</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto scrollbar-hidden pb-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => !generating && setStep(s.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap',
                  step === s.id
                    ? 'gradient-gold text-slate-900 border-transparent'
                    : step > s.id
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                )}
              >
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.icon}
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          {/* Step 1: Info */}
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <h3 className="text-white font-semibold text-lg mb-4">Informations de l'établissement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom de l'hôtel *"
                  value={config.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Hôtel Le Marais"
                />
                <Select
                  label="Nombre d'étoiles"
                  value={String(config.stars)}
                  onChange={e => update('stars', Number(e.target.value))}
                  options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n} ★` }))}
                />
                <Input
                  label="Adresse"
                  value={config.address}
                  onChange={e => update('address', e.target.value)}
                  placeholder="12 Rue de Bretagne"
                />
                <Input
                  label="Ville"
                  value={config.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="Paris"
                />
                <Input
                  label="Téléphone"
                  value={config.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+33 1 42 72 60 00"
                />
                <Input
                  label="Email"
                  type="email"
                  value={config.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="contact@hotel.fr"
                />
              </div>
              <Textarea
                label="Description"
                value={config.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Décrivez votre établissement..."
                rows={3}
              />
              {slug && (
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <p className="text-slate-500 text-xs mb-1">URL générée</p>
                  <p className="text-amber-400 text-sm font-mono">app.concierge-os.com/<span className="text-white">{slug}</span></p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-6 fade-in">
              <h3 className="text-white font-semibold text-lg">Branding & Design</h3>

              {/* Theme */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Thème visuel</label>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => update('theme', theme.id)}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-all',
                        config.theme === theme.id
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      )}
                    >
                      <p className={cn('font-medium text-sm', config.theme === theme.id ? 'text-amber-400' : 'text-white')}>
                        {theme.label}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{theme.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Palette de couleurs</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {colorPresets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        update('primaryColor', preset.primary);
                        update('secondaryColor', preset.secondary);
                        update('accentColor', preset.accent);
                      }}
                      className={cn(
                        'p-3 rounded-xl border transition-all',
                        config.primaryColor === preset.primary
                          ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                          : 'border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className="flex gap-1.5 mb-2">
                        {[preset.primary, preset.secondary, preset.accent].map((c, j) => (
                          <div key={j} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <p className="text-slate-300 text-xs">{preset.label}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Couleur principale', key: 'primaryColor' },
                    { label: 'Couleur secondaire', key: 'secondaryColor' },
                    { label: 'Couleur accent', key: 'accentColor' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-slate-500 block mb-1.5">{field.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config[field.key as keyof HotelConfig] as string}
                          onChange={e => update(field.key as keyof HotelConfig, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-slate-400 text-xs font-mono">
                          {config[field.key as keyof HotelConfig] as string}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50">
                <p className="text-slate-500 text-xs mb-3">Aperçu de la palette</p>
                <div
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor}33, ${config.secondaryColor})` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.name.charAt(0) || 'H'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{config.name || 'Nom de votre hôtel'}</p>
                    <p style={{ color: config.accentColor }} className="text-xs">★★★★</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Languages & Plan */}
          {step === 3 && (
            <div className="space-y-6 fade-in">
              <h3 className="text-white font-semibold text-lg">Langues & Plan</h3>

              {/* Languages */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Langues supportées</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'fr', flag: '🇫🇷', label: 'Français' },
                    { code: 'en', flag: '🇬🇧', label: 'English' },
                    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
                    { code: 'es', flag: '🇪🇸', label: 'Español' },
                    { code: 'it', flag: '🇮🇹', label: 'Italiano' },
                    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
                    { code: 'zh', flag: '🇨🇳', label: '中文' },
                    { code: 'ar', flag: '🇸🇦', label: 'العربية' },
                    { code: 'pt', flag: '🇵🇹', label: 'Português' },
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border transition-all',
                        config.languages.includes(lang.code)
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-xs font-medium">{lang.label}</span>
                      {config.languages.includes(lang.code) && (
                        <CheckCircle className="w-3.5 h-3.5 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Plan tarifaire</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'starter', label: 'Starter', price: '29€/mois',
                      features: ['App client basique', 'Dashboard réception', 'QR Code', 'Messagerie'],
                      color: 'text-slate-300 border-slate-600',
                    },
                    {
                      id: 'pro', label: 'Pro', price: '79€/mois',
                      features: ['Tout Starter', 'Multi-langues', 'Analytics', 'CRM guests', 'Satisfaction'],
                      color: 'text-amber-400 border-amber-500/40',
                      popular: true,
                    },
                    {
                      id: 'enterprise', label: 'Enterprise', price: '149€/mois',
                      features: ['Tout Pro', 'API intégrations', 'PMS Connect', 'IA concierge', 'Support dédié'],
                      color: 'text-purple-400 border-purple-500/40',
                    },
                  ].map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => update('plan', plan.id)}
                      className={cn(
                        'relative p-4 rounded-xl border text-left transition-all',
                        config.plan === plan.id
                          ? `bg-slate-800 ${plan.color} ring-1 ring-offset-0`
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full">
                          Populaire
                        </span>
                      )}
                      <p className={cn('font-bold text-sm mb-0.5', config.plan === plan.id ? plan.color.split(' ')[0] : 'text-white')}>
                        {plan.label}
                      </p>
                      <p className="text-amber-400 text-sm font-semibold mb-3">{plan.price}</p>
                      <ul className="space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Configuration */}
          {step === 4 && (
            <div className="space-y-4 fade-in">
              <h3 className="text-white font-semibold text-lg">Configuration de base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nom WiFi" value={config.wifiName} onChange={e => update('wifiName', e.target.value)} placeholder="Hotel_Guests" />
                <Input label="Mot de passe WiFi" value={config.wifiPassword} onChange={e => update('wifiPassword', e.target.value)} placeholder="••••••••" />
                <Input label="Heure check-in" type="time" value={config.checkInTime} onChange={e => update('checkInTime', e.target.value)} />
                <Input label="Heure check-out" type="time" value={config.checkOutTime} onChange={e => update('checkOutTime', e.target.value)} />
                <Input label="Début petit déjeuner" type="time" value={config.breakfastStart} onChange={e => update('breakfastStart', e.target.value)} />
                <Input label="Fin petit déjeuner" type="time" value={config.breakfastEnd} onChange={e => update('breakfastEnd', e.target.value)} />
              </div>
              <Textarea
                label="Message de bienvenue"
                value={config.welcomeMessage}
                onChange={e => update('welcomeMessage', e.target.value)}
                rows={3}
                placeholder="Bienvenue dans notre établissement..."
              />
            </div>
          )}

          {/* Step 5: Generate */}
          {step === 5 && (
            <div className="space-y-6 fade-in">
              <h3 className="text-white font-semibold text-lg">Générer l'application</h3>

              {!generated ? (
                <>
                  {/* Summary */}
                  <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Récapitulatif</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hôtel</span>
                        <span className="text-white font-medium">{config.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ville</span>
                        <span className="text-white">{config.city || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Thème</span>
                        <span className="text-white capitalize">{config.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan</span>
                        <span className="text-amber-400 capitalize">{config.plan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Langues</span>
                        <span className="text-white">{config.languages.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Étoiles</span>
                        <span className="text-white">{config.stars} ★</span>
                      </div>
                    </div>
                  </div>

                  {/* What will be generated */}
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm font-medium">Ce qui sera généré :</p>
                    {[
                      { icon: '📱', label: 'Application client (PWA mobile-first)' },
                      { icon: '🖥️', label: 'Dashboard réception' },
                      { icon: '⚙️', label: 'Configuration hôtel complète' },
                      { icon: '🔐', label: 'Variables d\'environnement Supabase' },
                      { icon: '📊', label: 'Base de données sécurisée (RLS)' },
                      { icon: '📲', label: 'QR Code unique de l\'établissement' },
                      { icon: '🚀', label: 'Build prêt pour Vercel/Coolify' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <span>{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {generating && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Génération en cours...</span>
                        <span className="text-amber-400">{progress}%</span>
                      </div>
                      <div className="bg-slate-700 rounded-full h-2">
                        <div
                          className="gradient-gold h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    variant="gold"
                    size="lg"
                    loading={generating}
                    onClick={handleGenerate}
                    disabled={!config.name}
                    className="w-full"
                    icon={<Sparkles className="w-5 h-5" />}
                  >
                    {generating ? 'Génération en cours...' : '✨ Générer l\'application'}
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">Application générée avec succès !</h4>
                    <p className="text-slate-400">Votre application concierge est prête à être déployée.</p>
                  </div>

                  {/* QR Code */}
                  {qrUrl && (
                    <div className="bg-white rounded-2xl p-4 w-fit mx-auto">
                      <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
                    </div>
                  )}

                  <div className="bg-slate-900/50 rounded-xl border border-emerald-500/20 p-4">
                    <p className="text-emerald-400 text-sm font-medium mb-1">URL de l'application</p>
                    <p className="text-white font-mono">app.concierge-os.com/{slug}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-500/20 transition-colors">
                      <Eye className="w-4 h-4" />
                      Aperçu app client
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Télécharger build
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm hover:bg-emerald-500/20 transition-colors">
                      <Zap className="w-4 h-4" />
                      Déployer Vercel
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-sm hover:bg-purple-500/20 transition-colors">
                      <QrCode className="w-4 h-4" />
                      Télécharger QR
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={generating}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Précédent
            </Button>
          ) : <div />}
          {step < 5 && (
            <Button variant="gold" onClick={() => setStep(s => s + 1)}>
              Suivant <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
