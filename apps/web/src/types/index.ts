// =============================================
// HOTEL TYPES
// =============================================

// @legacy - utilisé uniquement par apps/web/src/pages/ orphelines
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'elegant' | 'modern' | 'classic' | 'boutique';
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  stars: number;
  description: string;
  languages: string[];
  defaultLanguage: string;
  status: 'active' | 'inactive' | 'generating' | 'draft';
  plan: 'starter' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  settings?: HotelSettings;
  qrCodeUrl?: string;
  guestAppUrl?: string;
}

export interface HotelSettings {
  id: string;
  hotelId: string;
  wifiName: string;
  wifiPassword: string;
  checkInTime: string;
  checkOutTime: string;
  breakfastStart: string;
  breakfastEnd: string;
  breakfastIncluded: boolean;
  breakfastPrice?: number;
  roomServiceAvailable: boolean;
  roomServiceHours: string;
  guestTheme?: 'parisian_boutique' | 'modern_minimal' | 'palace_luxury';
  receptionPhone: string;
  emergencyPhone: string;
  welcomeMessage: string;
  goodbyeMessage: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  satisfactionAlertThreshold: number;
  marketingOptinDefault: boolean;
}

// =============================================
// GUEST TYPES
// =============================================

export interface Guest {
  id: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  language: string;
  marketingConsent: boolean;
  gdprConsent: boolean;
  createdAt: string;
  stays?: Stay[];
}

export interface Stay {
  id: string;
  hotelId: string;
  guestId: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'active' | 'checked-out' | 'upcoming';
  source: 'direct' | 'booking' | 'expedia' | 'airbnb' | 'other';
  specialRequests?: string;
  createdAt: string;
  guest?: Guest;
}

// =============================================
// MESSAGING TYPES
// =============================================

export type MessageSender = 'guest' | 'reception' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  hotelId: string;
  stayId: string;
  guestId: string;
  sender: MessageSender;
  content: string;
  status: MessageStatus;
  isRead: boolean;
  createdAt: string;
  guest?: Guest;
  stay?: Stay;
}

export interface Conversation {
  stayId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isUrgent: boolean;
  messages: Message[];
  guest?: Guest;
  stay?: Stay;
}

// =============================================
// SERVICE REQUEST TYPES
// =============================================

export type ServiceCategory =
  | 'taxi'
  | 'restaurant'
  | 'towels'
  | 'room_service'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'luggage'
  | 'wake_up'
  | 'other';

export type ServiceStatus = 'new' | 'in_progress' | 'done' | 'urgent' | 'closed';
export type ServicePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ServiceRequest {
  id: string;
  hotelId: string;
  stayId: string;
  guestId: string;
  category: ServiceCategory;
  title: string;
  description: string;
  status: ServiceStatus;
  priority: ServicePriority;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  guest?: Guest;
  stay?: Stay;
}

// =============================================
// REVIEW / SATISFACTION TYPES
// =============================================

export interface Review {
  id: string;
  hotelId: string;
  stayId: string;
  guestId: string;
  overallRating: number;
  cleanlinessRating?: number;
  serviceRating?: number;
  locationRating?: number;
  valueRating?: number;
  comment?: string;
  problem?: string;
  hasProblem: boolean;
  isPublic: boolean;
  alertSent: boolean;
  sentToGoogle?: boolean;
  sentToBooking?: boolean;
  createdAt: string;
  guest?: Guest;
  stay?: Stay;
}

// =============================================
// RECOMMENDATION TYPES
// =============================================

export type RecommendationCategory =
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'pharmacy'
  | 'supermarket'
  | 'transport'
  | 'attraction'
  | 'museum'
  | 'shopping'
  | 'nightlife'
  | 'wellness';

export interface Recommendation {
  id: string;
  hotelId: string;
  category: RecommendationCategory;
  name: string;
  description: string;
  address: string;
  distance?: string;
  walkingTime?: string;
  rating?: number;
  priceRange?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  tags?: string[];
  imageUrl?: string;
  isHighlighted: boolean;
  sortOrder: number;
}

// =============================================
// ANALYTICS TYPES
// =============================================

export interface Analytics {
  hotelId: string;
  period: string;
  qrScans: number;
  activeGuests: number;
  avgSatisfaction: number;
  totalMessages: number;
  totalRequests: number;
  resolvedRequests: number;
  avgResponseTime: number;
  positiveReviews: number;
  negativeReviews: number;
  popularServices: { category: string; count: number }[];
  satisfactionTrend: { date: string; rating: number }[];
  messageVolume: { date: string; count: number }[];
}

// =============================================
// USER TYPES
// =============================================

export type UserRole = 'super_admin' | 'hotel_admin' | 'manager' | 'receptionist';

export interface User {
  id: string;
  hotelId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// =============================================
// APP CONTEXT TYPES
// =============================================

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface DashboardStats {
  activeGuests: number;
  newMessages: number;
  pendingRequests: number;
  urgentAlerts: number;
  avgSatisfaction: number;
  qrScansToday: number;
  requestsResolved: number;
  satisfactionTrend: 'up' | 'down' | 'stable';
}
