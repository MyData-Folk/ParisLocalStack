import React from 'react';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  Star,
  Users,
  BarChart3,
  Hotel,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  QrCode,
  UserCog,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { getInitials } from '../../utils/helpers';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, section: 'Réception' },
  { id: 'inbox', label: 'Messages', icon: <MessageSquare className="w-4 h-4" />, badge: 3, section: 'Réception' },
  { id: 'requests', label: 'Demandes', icon: <ClipboardList className="w-4 h-4" />, badge: 4, section: 'Réception' },
  { id: 'satisfaction', label: 'Satisfaction', icon: <Star className="w-4 h-4" />, section: 'Réception' },
  { id: 'guests', label: 'Clients CRM', icon: <Users className="w-4 h-4" />, section: 'Réception' },
  { id: 'recommendations', label: 'Recommandations', icon: <MapPin className="w-4 h-4" />, section: 'Contenu' },
  { id: 'analytics', label: 'Analytiques', icon: <BarChart3 className="w-4 h-4" />, section: 'Contenu' },
  { id: 'hotels', label: 'Hôtels', icon: <Building2 className="w-4 h-4" />, section: 'SaaS Admin', adminOnly: true },
  { id: 'generator', label: 'Générateur', icon: <Sparkles className="w-4 h-4" />, section: 'SaaS Admin', adminOnly: true },
  { id: 'qrcode', label: 'QR Code', icon: <QrCode className="w-4 h-4" />, section: 'SaaS Admin', adminOnly: true },
  { id: 'team', label: 'Équipe', icon: <UserCog className="w-4 h-4" />, section: 'Configuration' },
  { id: 'hotel-settings', label: 'Paramètres hôtel', icon: <Hotel className="w-4 h-4" />, section: 'Configuration' },
  { id: 'settings', label: 'Compte', icon: <Settings className="w-4 h-4" />, section: 'Configuration' },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { currentUser, currentHotel, logout, sidebarOpen, setSidebarOpen } = useAppStore();
  const isAdmin = currentUser?.role === 'super_admin';

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const sections = [...new Set(filteredItems.map(i => i.section).filter(Boolean))];

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex-shrink-0',
      sidebarOpen ? 'w-64' : 'w-[72px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-slate-900" />
        </div>
        {sidebarOpen && (
          <div className="fade-in">
            <p className="text-white font-bold text-sm tracking-wide">ConciergeOS</p>
            <p className="text-slate-500 text-xs">Platform v1.0</p>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Hotel Selector */}
      {currentHotel && (
        <div className={cn(
          'mx-3 mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50',
          !sidebarOpen && 'flex justify-center p-2'
        )}>
          {sidebarOpen ? (
            <div className="fade-in">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0"
                  style={{ backgroundColor: currentHotel.primaryColor }}
                >
                  {currentHotel.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-white text-xs font-semibold truncate">{currentHotel.name}</p>
                  <p className="text-slate-500 text-xs">{currentHotel.city}</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-900"
              style={{ backgroundColor: currentHotel.primaryColor }}
            >
              {currentHotel.name.charAt(0)}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden py-3 px-3 space-y-1">
        {sections.map((section) => {
          const sectionItems = filteredItems.filter(i => i.section === section);
          return (
            <div key={section} className="mb-3">
              {sidebarOpen && (
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-1.5">
                  {section}
                </p>
              )}
              {sectionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    activeView === item.id
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                    !sidebarOpen && 'justify-center px-2'
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="flex-1 text-left truncate fade-in">{item.label}</span>
                  )}
                  {sidebarOpen && item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {!sidebarOpen && item.badge && item.badge > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer',
          !sidebarOpen && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-slate-900 text-xs font-bold flex-shrink-0">
            {currentUser ? getInitials(currentUser.firstName, currentUser.lastName) : 'AD'}
          </div>
          {sidebarOpen && currentUser && (
            <div className="flex-1 overflow-hidden fade-in">
              <p className="text-white text-xs font-semibold truncate">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-slate-500 text-xs capitalize truncate">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={logout}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
