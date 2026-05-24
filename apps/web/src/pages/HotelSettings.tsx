import React, { useState } from 'react';
import { Save, Wifi, Phone, Clock, MessageSquare, Shield, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../stores/appStore';
import type { HotelSettings } from '../types';

export const HotelSettingsPage: React.FC = () => {
  const { currentHotel } = useAppStore();
  const [saved, setSaved] = useState(false);

  const defaultSettings: HotelSettings = currentHotel?.settings || {
    id: '',
    hotelId: currentHotel?.id || '',
    wifiName: 'Hotel_Guests',
    wifiPassword: 'Welcome2024',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    breakfastStart: '07:00',
    breakfastEnd: '10:30',
    breakfastIncluded: true,
    roomServiceAvailable: true,
    roomServiceHours: '07:00 - 23:00',
    receptionPhone: '+33 1 00 00 00 00',
    emergencyPhone: '+33 6 00 00 00 00',
    welcomeMessage: 'Bienvenue dans notre établissement !',
    goodbyeMessage: 'Merci pour votre séjour !',
    autoReplyEnabled: true,
    autoReplyMessage: 'Merci pour votre message. Notre équipe vous répond dans les plus brefs délais.',
    satisfactionAlertThreshold: 3,
    marketingOptinDefault: false,
  };

  const [settings, setSettings] = useState<HotelSettings>(defaultSettings);

  const update = (key: keyof HotelSettings, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!currentHotel) return (
    <div className="p-6 text-center text-slate-400">Aucun hôtel sélectionné</div>
  );

  return (
    <div className="p-6 space-y-6 fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-xl">Paramètres de l'hôtel</h2>
          <p className="text-slate-400 text-sm mt-0.5">{currentHotel.name}</p>
        </div>
        <Button
          variant={saved ? 'primary' : 'gold'}
          onClick={handleSave}
          icon={<Save className="w-4 h-4" />}
        >
          {saved ? '✓ Enregistré' : 'Sauvegarder'}
        </Button>
      </div>

      {/* WiFi */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            Connexion WiFi
          </h3>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Input
            label="Nom du réseau (SSID)"
            value={settings.wifiName}
            onChange={e => update('wifiName', e.target.value)}
          />
          <Input
            label="Mot de passe WiFi"
            value={settings.wifiPassword}
            onChange={e => update('wifiPassword', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Horaires */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Horaires
          </h3>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Input
            label="Check-in"
            type="time"
            value={settings.checkInTime}
            onChange={e => update('checkInTime', e.target.value)}
          />
          <Input
            label="Check-out"
            type="time"
            value={settings.checkOutTime}
            onChange={e => update('checkOutTime', e.target.value)}
          />
          <Input
            label="Début petit déjeuner"
            type="time"
            value={settings.breakfastStart}
            onChange={e => update('breakfastStart', e.target.value)}
          />
          <Input
            label="Fin petit déjeuner"
            type="time"
            value={settings.breakfastEnd}
            onChange={e => update('breakfastEnd', e.target.value)}
          />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Room service</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.roomServiceAvailable}
                  onChange={e => update('roomServiceAvailable', e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
                <span className="text-slate-300 text-sm">Room service disponible</span>
              </label>
              {settings.roomServiceAvailable && (
                <Input
                  value={settings.roomServiceHours}
                  onChange={e => update('roomServiceHours', e.target.value)}
                  placeholder="07:00 - 23:00"
                  className="flex-1"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            Contacts
          </h3>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Input
            label="Téléphone réception"
            value={settings.receptionPhone}
            onChange={e => update('receptionPhone', e.target.value)}
          />
          <Input
            label="Téléphone urgences"
            value={settings.emergencyPhone}
            onChange={e => update('emergencyPhone', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            Messages automatiques
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Message de bienvenue"
            value={settings.welcomeMessage}
            onChange={e => update('welcomeMessage', e.target.value)}
            rows={3}
          />
          <Textarea
            label="Message d'au revoir"
            value={settings.goodbyeMessage}
            onChange={e => update('goodbyeMessage', e.target.value)}
            rows={2}
          />
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoReplyEnabled}
                onChange={e => update('autoReplyEnabled', e.target.checked)}
                className="accent-amber-400 w-4 h-4"
              />
              <span className="text-slate-300 text-sm font-medium">Réponse automatique activée</span>
            </label>
            {settings.autoReplyEnabled && (
              <Textarea
                label="Message de réponse automatique"
                value={settings.autoReplyMessage}
                onChange={e => update('autoReplyMessage', e.target.value)}
                rows={2}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Satisfaction & RGPD */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-400" />
            Alertes satisfaction
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Seuil d'alerte (alerte si note ≤)"
            value={String(settings.satisfactionAlertThreshold)}
            onChange={e => update('satisfactionAlertThreshold', Number(e.target.value))}
            options={[1,2,3,4].map(n => ({ value: String(n), label: `${n}/5 — ${n <= 2 ? 'Très strict' : n <= 3 ? 'Standard' : 'Permissif'}` }))}
          />
          <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/20">
            <p className="text-slate-400 text-xs">
              ⚠️ Toute satisfaction inférieure ou égale à <strong className="text-red-400">{settings.satisfactionAlertThreshold}/5</strong> déclenchera une alerte immédiate à la réception.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* RGPD */}
      <Card>
        <CardHeader>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            RGPD & Consentements
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800/50 rounded-xl border border-slate-700/30 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={settings.marketingOptinDefault}
              onChange={e => update('marketingOptinDefault', e.target.checked)}
              className="accent-amber-400 w-4 h-4"
            />
            <div>
              <p className="text-slate-300 text-sm font-medium">Opt-in marketing par défaut</p>
              <p className="text-slate-500 text-xs">La case marketing sera cochée par défaut lors de l'onboarding</p>
            </div>
          </label>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition-colors">
              📄 Politique de confidentialité
            </button>
            <button className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-500/20 transition-colors">
              📥 Exporter données clients
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
