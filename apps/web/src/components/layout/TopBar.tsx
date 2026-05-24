import React, { useState } from 'react';
import { Bell, Search, Wifi, Users, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { formatRelativeTime } from '../../utils/helpers';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const { notifications, unreadNotifications, markNotificationRead, clearNotifications } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Title */}
      <div>
        <h1 className="text-white font-semibold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-4 mr-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connecté</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>18 clients actifs</span>
          </div>
        </div>

        {/* Search */}
        <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <span className="text-white font-medium text-sm">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Tout effacer
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`px-4 py-3 border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                        !notif.isRead ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white text-xs font-medium">{notif.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{notif.message}</p>
                          <p className="text-slate-600 text-xs mt-1">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
