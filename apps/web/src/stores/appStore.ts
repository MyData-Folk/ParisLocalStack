import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hotel, User, AppNotification } from '../types';
import { mockHotels, mockUsers } from '../lib/mockData';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Current hotel context
  currentHotel: Hotel | null;
  hotels: Hotel[];

  // UI State
  sidebarOpen: boolean;
  activeView: string;

  // Notifications
  notifications: AppNotification[];
  unreadNotifications: number;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentHotel: (hotel: Hotel | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-demo-1',
    type: 'warning',
    title: 'Avis client à traiter',
    message: 'Un client a signalé un problème de climatisation en chambre 204.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'notif-demo-2',
    type: 'info',
    title: 'Nouveau scan QR code',
    message: 'Un client vient d’ouvrir l’application concierge depuis le hall.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

const getHotelForUser = (user: User): Hotel | null => {
  if (user.hotelId) return mockHotels.find(h => h.id === user.hotelId) || null;
  return mockHotels[0] || null;
};

const countUnread = (notifications: AppNotification[]) => notifications.filter(n => !n.isRead).length;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      currentHotel: null,
      hotels: mockHotels,
      sidebarOpen: true,
      activeView: 'dashboard',
      notifications: initialNotifications,
      unreadNotifications: countUnread(initialNotifications),

      login: async (email: string, _password: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
        if (!user) return false;

        set({
          currentUser: user,
          isAuthenticated: true,
          currentHotel: getHotelForUser(user),
          activeView: 'dashboard',
        });
        return true;
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          currentHotel: null,
          activeView: 'dashboard',
        });
      },

      setCurrentHotel: (hotel) => set({ currentHotel: hotel }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setActiveView: (view) => set({ activeView: view }),

      addNotification: (notification) => {
        const newNotification: AppNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        set(state => {
          const notifications = [newNotification, ...state.notifications];
          return {
            notifications,
            unreadNotifications: countUnread(notifications),
          };
        });
      },

      markNotificationRead: (id) => {
        set(state => {
          const notifications = state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications,
            unreadNotifications: countUnread(notifications),
          };
        });
      },

      clearNotifications: () => {
        set({ notifications: [], unreadNotifications: 0 });
      },
    }),
    {
      name: 'concierge-os-state',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        currentHotel: state.currentHotel,
        sidebarOpen: state.sidebarOpen,
        activeView: state.activeView,
        notifications: state.notifications,
        unreadNotifications: state.unreadNotifications,
      }),
    }
  )
);
