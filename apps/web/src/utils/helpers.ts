import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Aujourd'hui ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Hier ${format(date, 'HH:mm')}`;
  return format(date, 'dd/MM HH:mm');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
}

export function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    in_progress: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    done: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    urgent: 'text-red-400 bg-red-400/10 border-red-400/20',
    closed: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    inactive: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    draft: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    generating: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };
  return colors[status] || 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Nouveau',
    in_progress: 'En cours',
    done: 'Traité',
    urgent: 'Urgent',
    closed: 'Fermé',
    active: 'Actif',
    inactive: 'Inactif',
    draft: 'Brouillon',
    generating: 'Génération...',
    'checked-out': 'Parti',
    upcoming: 'À venir',
  };
  return labels[status] || status;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-amber-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  };
  return colors[priority] || 'text-slate-400';
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-emerald-400';
  if (rating >= 3) return 'text-amber-400';
  return 'text-red-400';
}

export function getRatingStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    taxi: '🚕',
    restaurant: '🍽️',
    towels: '🛁',
    room_service: '🍾',
    reception: '🛎️',
    housekeeping: '🧹',
    maintenance: '🔧',
    luggage: '🧳',
    wake_up: '⏰',
    other: '💬',
    cafe: '☕',
    bakery: '🥐',
    pharmacy: '💊',
    supermarket: '🛒',
    transport: '🚇',
    attraction: '🗼',
    museum: '🏛️',
    shopping: '🛍️',
    nightlife: '🍸',
    wellness: '💆',
  };
  return icons[category] || '💬';
}

export function getLanguageFlag(lang: string): string {
  const flags: Record<string, string> = {
    fr: '🇫🇷',
    en: '🇬🇧',
    de: '🇩🇪',
    es: '🇪🇸',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ar: '🇸🇦',
  };
  return flags[lang] || '🌐';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateQrCodeUrl(slug: string): string {
  const url = `https://app.concierge-os.com/${slug}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=0f172a&bgcolor=c9a84c`;
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\+\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
}
