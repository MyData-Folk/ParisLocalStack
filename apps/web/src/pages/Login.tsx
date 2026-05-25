import React, { useState } from 'react';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAppStore();
  const [email, setEmail] = useState('admin@paris-local.test');
  const [password, setPassword] = useState('ChangeMe123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'Super Admin', email: 'admin@paris-local.test', role: 'SaaS Admin' },
    { label: 'Receptionniste', email: 'reception@vendome.test', role: 'Hotel Vendome' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Email ou mot de passe incorrect');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #c9a84c22 0%, transparent 50%), 
                              radial-gradient(circle at 80% 20%, #1d4ed822 0%, transparent 50%)`,
          }}
        />
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-gold flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">ConciergeOS</span>
              <span className="text-amber-400 text-xs block -mt-1 font-medium">Digital Concierge Platform</span>
            </div>
          </div>

          {/* Main Content */}
          <div>
            <h2 className="font-serif text-5xl font-bold text-white leading-tight mb-6">
              L'expérience hôtelière
              <span className="block text-transparent bg-clip-text gradient-gold">réinventée</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Générez, déployez et gérez des applications concierge digitales premium pour vos hôtels en quelques minutes.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: '🏨', text: 'Génération automatique d\'applications hôtel' },
                { icon: '📱', text: 'App client accessible via QR code' },
                { icon: '⭐', text: 'Gestion satisfaction client en temps réel' },
                { icon: '💬', text: 'Communication centralisée réception ↔ client' },
                { icon: '📊', text: 'Analytics et CRM intégrés' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-slate-300 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '150+', label: 'Hôtels actifs' },
              { value: '98%', label: 'Satisfaction' },
              { value: '4.8/5', label: 'Note moyenne' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl gradient-gold flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-white font-bold text-xl">ConciergeOS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
            <p className="text-slate-400">Accédez à votre plateforme de gestion hôtelière</p>
          </div>

          {/* Demo Accounts */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Comptes démo</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account, i) => (
                <button
                  key={i}
                  onClick={() => { setEmail(account.email); setPassword('ChangeMe123!'); }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 transition-all text-left group"
                >
                  <div>
                    <p className="text-white text-xs font-medium">{account.label}</p>
                    <p className="text-slate-500 text-xs">{account.email}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-slate-600 text-xs">
            Mot de passe démo : <span className="text-amber-400">demo123</span> (accepté pour tous les comptes)
          </p>
        </div>
      </div>
    </div>
  );
};

