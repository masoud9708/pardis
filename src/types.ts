export type UserRole = 'ADMIN' | 'OPERATOR' | 'DRIVER';

export type DriverStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'OFFLINE'
  | 'ONLINE'
  | 'BUSY'
  | 'SUSPENDED'
  | 'REJECTED';

export type TripStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ShiftStatus =
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ABSENT';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type LedgerEntryType = 'COMMISSION_DEBT' | 'PAYMENT_CREDIT' | 'ADJUSTMENT';

export interface User {
  id: number;
  mobile: string;
  full_name: string;
  role: UserRole;
  avatar?: string;
  is_active: number;
  created_at: string;
  last_login?: string;
  driver_id?: number;
}

export interface Driver {
  id: number;
  user_id: number;
  full_name: string;
  mobile: string;
  national_code: string;
  birth_date?: string;
  address?: string;
  city?: string;
  emergency_contact?: string;
  status: DriverStatus;
  rating: number;
  completed_trips: number;
  total_debt: number;
  wallet_balance?: number;
  lat?: number;
  lng?: number;
  bearing?: number;
  last_location_time?: string;
  documents_verified?: number;
  rejection_reason?: string;
  current_shift_id?: number;
  car_name?: string;
  license_plate?: string;
  car_color?: string;
  vehicle_id?: number;
  created_at: string;
  updated_at: string;
  documents?: {
    license_preview?: string;
    car_card_preview?: string;
    insurance_preview?: string;
  };
}

export interface Vehicle {
  id: number;
  driver_id: number;
  driver_name?: string;
  car_name: string;
  model: string;
  color: string;
  license_plate: string;
  year: string;
  vehicle_type: 'STANDARD' | 'COMFORT' | 'VAN' | 'VIP';
  is_active: number;
  created_at: string;
}

export interface Zone {
  id: number;
  name: string;
  description?: string;
  is_active: number;
}

export interface Tariff {
  id: number;
  origin_zone_id: number;
  origin_zone_name?: string;
  destination_zone_id: number;
  destination_zone_name?: string;
  base_price: number;
  night_price: number;
  holiday_price: number;
  waiting_fee_per_min: number;
  stop_fee: number;
  extra_distance_fee_per_km: number;
  vehicle_type: string;
  commission_rate: number; // e.g. 0.15 = 15%
  fixed_commission: number;
  valid_from: string;
  valid_to: string;
  is_active: number;
}

export interface Customer {
  id: number;
  subscription_code: string;
  name: string;
  phone: string;
  address: string;
  default_destination?: string;
  total_trips: number;
  discount_percent: number;
  is_vip: number;
  notes?: string;
  created_at: string;
}

export interface Trip {
  id: number;
  trip_number: string;
  customer_id?: number;
  subscription_code?: string;
  customer_name: string;
  customer_phone: string;
  origin: string;
  destination: string;
  driver_id?: number;
  driver_name?: string;
  driver_phone?: string;
  vehicle_id?: number;
  car_details?: string;
  license_plate?: string;
  trip_date: string;
  trip_time: string;
  service_type: string;
  price: number;
  commission: number;
  driver_share: number;
  status: TripStatus;
  payment_method: 'CASH' | 'ONLINE' | 'ACCOUNT';
  notes?: string;
  is_night_shift: number;
  created_by_user_id: number;
  created_by_name?: string;
  created_at: string;
  completed_at?: string;
}

export interface TripStatusHistory {
  id: number;
  trip_id: number;
  status: TripStatus;
  changed_by_user_id: number;
  changed_by_name: string;
  notes?: string;
  timestamp: string;
}

export interface DriverLedgerEntry {
  id: number;
  driver_id: number;
  driver_name?: string;
  trip_id?: number;
  trip_number?: string;
  type: LedgerEntryType;
  amount: number;
  balance_after: number;
  description: string;
  reference_number?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: number;
  driver_id: number;
  driver_name?: string;
  amount: number;
  status: PaymentStatus;
  reference_number: string;
  gateway_name: string;
  transaction_id: string;
  card_pan_mask?: string;
  created_at: string;
  verified_at?: string;
  receipt_data?: string;
}

export interface NightShift {
  id: number;
  date: string;
  driver_id: number;
  driver_name?: string;
  driver_phone?: string;
  car_name?: string;
  license_plate?: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  type: 'DIRECT' | 'GROUP' | 'TRIP';
  title: string;
  trip_id?: number;
  trip_number?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  attachment_url?: string;
  is_read: number;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  role?: UserRole;
  type:
    | 'NEW_TRIP'
    | 'ASSIGNED_TRIP'
    | 'STATUS_CHANGE'
    | 'NEW_MESSAGE'
    | 'NEW_SHIFT'
    | 'SHIFT_REMINDER'
    | 'PAYMENT_SUCCESS'
    | 'DEBT_ALERT'
    | 'ANNOUNCEMENT';
  title: string;
  message: string;
  link?: string;
  is_read: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AgencySettings {
  agency_name: string;
  logo_url: string;
  phone: string;
  address: string;
  working_hours: string;
  default_commission_rate: number;
  night_shift_start: string;
  night_shift_end: string;
  night_tariff_multiplier: number;
  payment_gateway_name: string;
  payment_merchant_id: string;
  payment_callback_url: string;
  enable_auto_dispatch: boolean;
}

export interface AgencyReportSummary {
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  in_progress_trips: number;
  total_revenue: number;
  total_commission: number;
  total_driver_payouts: number;
  total_payments_collected: number;
  total_driver_debt: number;
  active_drivers_count: number;
  online_drivers_count: number;
  night_shift_trips_count: number;
}

export interface DriverPerformanceReport {
  driver_id: number;
  driver_name: string;
  mobile: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_income: number;
  total_commission: number;
  total_payments: number;
  remaining_debt: number;
  night_shifts_count: number;
  night_trips_count: number;
}

export interface PointOfInterest {
  id: number;
  name: string;
  category: string;
  address?: string;
  lat: number;
  lng: number;
  fixed_price: number;
  is_active: number;
}

export interface PricingRule {
  id: number;
  rule_type: 'POI' | 'FIXED_ROUTE' | 'ZONE' | 'KM';
  title: string;
  base_price: number;
  per_km_price: number;
  night_multiplier: number;
  holiday_multiplier: number;
  commission_rate: number;
  is_active: number;
}

export interface SmsLog {
  id: number;
  receptor: string;
  template_name: string;
  token?: string;
  message: string;
  status: string;
  cost: number;
  timestamp: string;
}

export interface WalletInfo {
  driver_id: number;
  full_name: string;
  balance: number;
  total_debt: number;
  min_balance: number;
  warning_balance: number;
  is_blocked: boolean;
  is_warning: boolean;
  recent_transactions: DriverLedgerEntry[];
}

export interface FleetDriver {
  id: number;
  user_id: number;
  full_name: string;
  mobile: string;
  status: DriverStatus;
  rating: number;
  completed_trips: number;
  wallet_balance: number;
  total_debt: number;
  lat: number;
  lng: number;
  bearing: number;
  last_location_time?: string;
  car_name?: string;
  license_plate?: string;
  car_color?: string;
  car_model?: string;
  vehicle_type?: string;
}

