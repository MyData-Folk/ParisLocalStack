import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hotel, AppNotification } from '../types';
import { mockHotels } from '../lib/mockData';
import { api, type ApiUser } from '../lib/api';

// TODO: clean up orphaned apps/web/src/pages screens that still depend on mockData in a separate ticket.
type AuthUser = ApiUser & {
  firstName: string;
  lastName: string;
  hotelId?: string;
};

interface AppState {
  // Auth
  token: string | null;
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;

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
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
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

const toAuthUser = (user: ApiUser): AuthUser => {
  const [firstName = user.name, ...rest] = user.name.trim().split(/\s+/);
  return {
    ...user,
    firstName,
    lastName: rest.join(' '),
    hotelId: user.hotelIds[0],
  };
};

const getHotelForUser = (user: AuthUser): Hotel | null => {
  // TODO: replace mockHotels with API-backed hotel context when orphaned mock pages are cleaned up.
  if (user.hotelId) return mockHotels.find(h => h.id === user.hotelId) || mockHotels[0] || null;
  return mockHotels[0] || null;
};

const countUnread = (notifications: AppNotification[]) => notifications.filter(n => !n.isRead).length;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      currentUser: null,
      isAuthenticated: false,
      isAuthLoading: false,
      authError: null,
      currentHotel: null,
      hotels: mockHotels,
      sidebarOpen: true,
      activeView: 'dashboard',
      notifications: initialNotifications,
      unreadNotifications: countUnread(initialNotifications),

      login: async (email: string, password: string) => {
        set({ isAuthLoading: true, authError: null });
        try {
          const auth = await api.login(email.trim().toLowerCase(), password);
          const user = toAuthUser(auth.user);
          set({
            token: auth.token,
            currentUser: user,
            isAuthenticated: true,
            isAuthLoading: false,
            authError: null,
            currentHotel: getHotelForUser(user),
            activeView: 'dashboard',
          });
          return true;
        } catch (error) {
          set({
            token: null,
            currentUser: null,
            isAuthenticated: false,
            isAuthLoading: false,
            authError: error instanceof Error ? error.message : 'Connexion impossible',
            currentHotel: null,
          });
          return false;
        }
      },

      logout: async () => {
        const token = get().token;
        if (token) await api.logout(token).catch(() => undefined);
        set({
          token: null,
          currentUser: null,
          isAuthenticated: false,
          isAuthLoading: false,
          authError: null,
          currentHotel: null,
          activeView: 'dashboard',
        });
      },

      restoreSession: async () => {
        const token = get().token;
        if (!token) return false;
        set({ isAuthLoading: true, authError: null });
        try {
          const apiUser = await api.me(token);
          const user = toAuthUser(apiUser);
          set({
            currentUser: user,
            isAuthenticated: true,
            isAuthLoading: false,
            authError: null,
            currentHotel: getHotelForUser(user),
          });
          return true;
        } catch {
          set({
            token: null,
            currentUser: null,
            isAuthenticated: false,
            isAuthLoading: false,
            authError: 'Session expiree',
            currentHotel: null,
          });
          return false;
        }
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
        token: state.token,
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
