import {
  User,
  Driver,
  Customer,
  Vehicle,
  Zone,
  Tariff,
  Trip,
  DriverLedgerEntry,
  PaymentTransaction,
  NightShift,
  Conversation,
  ChatMessage,
  NotificationItem,
  AuditLog,
  AgencySettings,
  AgencyReportSummary,
  DriverPerformanceReport,
  PointOfInterest,
  PricingRule,
  SmsLog,
  WalletInfo,
  FleetDriver,
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('pardis_auth_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('pardis_auth_token', token);
}

export function removeStoredToken() {
  localStorage.removeItem('pardis_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          removeStoredToken();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
          throw new Error(data.error || 'لطفاً وارد حساب کاربری خود شوید.');
        }
        throw new Error(data.error || 'خطایی در برقراری ارتباط با سرور رخ داد.');
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      // Do not retry on explicit auth/permission errors or intentional user cancel
      const isAuthError =
        err?.message?.includes('وارد حساب کاربری') ||
        err?.message?.includes('منقضی') ||
        err?.message?.includes('دسترسی لازم');
      if (isAuthError || err?.name === 'AbortError') {
        throw err;
      }
      // If network failure (such as "Failed to fetch") and retries remain, wait briefly before retrying
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('خطا در برقراری ارتباط با سرور');
}

export const api = {
  // Auth
  login: (usernameOrMobile: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobile: usernameOrMobile, username: usernameOrMobile, password }),
    }),

  quickLogin: (target: string = 'dastgerdi') =>
    request<{ token: string; user: User }>('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ target }),
    }),

  registerDriver: (formData: any) =>
    request<{ success: boolean; message: string; driver_id: number }>('/auth/register-driver', {
      method: 'POST',
      body: JSON.stringify(formData),
    }),

  getMe: () => request<{ user: User; driver: Driver | null }>('/auth/me'),

  // Drivers
  getDrivers: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Driver[]>(`/drivers?${query}`);
  },

  getDriver: (id: number) =>
    request<{
      driver: Driver;
      vehicles: Vehicle[];
      recentTrips: Trip[];
      upcomingShifts: NightShift[];
    }>(`/drivers/${id}`),

  updateDriverStatus: (id: number, status: string) =>
    request<{ success: boolean; status: string }>(`/drivers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateDriverAvatar: (id: number, avatar: string) =>
    request<{ success: boolean; avatar: string; message: string }>(`/drivers/${id}/avatar`, {
      method: 'POST',
      body: JSON.stringify({ avatar }),
    }),

  getDriverLedger: (driverId: number) =>
    request<{ total_debt: number; entries: DriverLedgerEntry[] }>(`/driver-ledger/${driverId}`),

  // Vehicles
  getVehicles: (driver_id?: number) => {
    const q = driver_id ? `?driver_id=${driver_id}` : '';
    return request<Vehicle[]>(`/vehicles${q}`);
  },

  createVehicle: (data: Partial<Vehicle>) =>
    request<{ success: boolean; id: number }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Zones & Tariffs
  getZones: () => request<Zone[]>('/zones'),

  createZone: (dataOrName: { name: string; description?: string } | string, description?: string) => {
    const body = typeof dataOrName === 'string'
      ? { name: dataOrName, description }
      : dataOrName;
    return request<{ success: boolean; id: number }>('/zones', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getTariffs: () => request<Tariff[]>('/tariffs'),

  createTariff: (data: any) =>
    request<{ success: boolean; id: number }>('/tariffs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  calculateTariff: (data: {
    origin_zone_id?: number;
    destination_zone_id?: number;
    is_night?: boolean;
    is_holiday?: boolean;
    waiting_minutes?: number;
    stops_count?: number;
  }) =>
    request<{
      base_price: number;
      waiting_fee: number;
      stop_fee: number;
      total_price: number;
      commission_rate: number;
      commission: number;
      driver_share: number;
      is_tariff_matched: boolean;
    }>('/tariffs/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Customers & Subscribers (مشتریان پر سفر و کدهای اشتراک)
  getCustomers: (q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return request<Customer[]>(`/customers${query}`);
  },

  getCustomerByCode: (code: string) =>
    request<Customer>(`/customers/lookup/${encodeURIComponent(code)}`),

  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: number, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Trips
  getTrips: (params?: { status?: string; driver_id?: number; date?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Trip[]>(`/trips?${q}`);
  },

  createTrip: (data: any) =>
    request<{ success: boolean; trip_id: number; trip_number: string }>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTripStatus: (id: number, status: string, notes?: string) =>
    request<{ success: boolean; status: string }>(`/trips/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  assignTrip: (tripId: number, driverId: number) =>
    request<{ success: boolean }>(`/trips/${tripId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ driver_id: driverId }),
    }),

  // Night Shifts
  getNightShifts: () => request<NightShift[]>('/night-shifts'),

  createNightShift: (data: {
    date: string;
    driver_id: number;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; id: number }>('/night-shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNightShift: (id: number, data: { status?: string; driver_id?: number; notes?: string }) =>
    request<{ success: boolean }>(`/night-shifts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateNightShiftStatus: (id: number, status: string, notes?: string) =>
    request<{ success: boolean }>(`/night-shifts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Payments & Commission Gateway
  getPayments: () => request<PaymentTransaction[]>('/payments'),

  initiatePayment: (
    amountOrData: number | { amount: number; driver_id?: number; description?: string },
    driver_id?: number
  ) => {
    const payload = typeof amountOrData === 'number'
      ? { amount: amountOrData, driver_id }
      : amountOrData;
    return request<{
      payment_id: number;
      reference_number: string;
      transaction_id: string;
      amount: number;
      gateway_url: string;
    }>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyPayment: (data: { reference_number: string; transaction_id?: string; card_pan_mask?: string; card_mask?: string }) =>
    request<{
      success: boolean;
      message: string;
      receipt: any;
    }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        card_pan_mask: data.card_pan_mask || data.card_mask,
      }),
    }),

  // Realtime Chat
  getConversations: () => request<Conversation[]>('/chat/conversations'),

  getMessages: (conversationId: number) =>
    request<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: number, content: string, attachment_url?: string) =>
    request<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachment_url }),
    }),

  getTripConversation: (trip_id: number) =>
    request<Conversation>('/chat/trip-conversation', {
      method: 'POST',
      body: JSON.stringify({ trip_id }),
    }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),

  markNotificationRead: (id: number) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),

  // Reports
  getReportsSummary: (period?: string) =>
    request<AgencyReportSummary>(`/reports/summary${period ? `?period=${period}` : ''}`),

  getDriversReport: () => request<DriverPerformanceReport[]>('/reports/drivers'),

  getReportsCharts: () =>
    request<{
      weeklyData: Array<{ day: string; trips: number; revenue: number; commission: number }>;
      serviceDistribution: Array<{ name: string; value: number; color: string }>;
    }>('/reports/charts'),

  // Settings & Audit
  getSettings: () => request<AgencySettings>('/settings'),

  updateSettings: (settings: Partial<AgencySettings>) =>
    request<{ success: boolean }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),

  // POI & Pricing
  getPois: () => request<PointOfInterest[]>('/poi'),
  createPoi: (poi: Partial<PointOfInterest>) =>
    request<{ success: boolean; id: number }>('/poi', {
      method: 'POST',
      body: JSON.stringify(poi),
    }),
  deletePoi: (id: number) =>
    request<{ success: boolean }>(`/poi/${id}`, {
      method: 'DELETE',
    }),

  getPricingRules: () => request<PricingRule[]>('/pricing-rules'),
  createPricingRule: (rule: Partial<PricingRule>) =>
    request<{ success: boolean; id: number }>('/pricing-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    }),
  calculateSmartPrice: (params: {
    origin: string;
    destination: string;
    service_type?: string;
    is_night?: boolean;
    is_holiday?: boolean;
    agreed_price?: number;
  }) =>
    request<{
      price: number;
      base_price: number;
      commission: number;
      driver_share: number;
      rule_applied: string;
      distance_km: number;
      estimated_time_min: number;
    }>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Live Fleet & GPS
  getLiveFleet: () => request<FleetDriver[]>('/drivers/locations/live'),
  updateDriverLocation: (id: number, coords: { lat: number; lng: number; bearing?: number }) =>
    request<{ success: boolean; updated_at: string }>(`/drivers/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify(coords),
    }),

  // Driver Document Verification
  verifyDriver: (id: number, data: { status: 'ACTIVE' | 'REJECTED'; rejection_reason?: string }) =>
    request<{ success: boolean; status: string }>(`/drivers/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Driver Wallet & Zarinpal
  getDriverWallet: (driverId: number) => request<WalletInfo>(`/drivers/${driverId}/wallet`),
  topupDriverWallet: (
    driverId: number,
    data: { amount: number; gateway_name?: string; card_pan?: string }
  ) =>
    request<{
      success: boolean;
      reference_number: string;
      amount: number;
      new_balance: number;
      message: string;
    }>(`/drivers/${driverId}/wallet/topup`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // SMS & Kavenegar
  getSmsLogs: () => request<SmsLog[]>('/sms/logs'),
  sendSms: (data: { receptor: string; template_name?: string; token?: string; message: string }) =>
    request<{ success: boolean; message: string; status: string }>('/sms/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
