export type PackageStatus =
  | 'order_placed' | 'packed' | 'in_transit'
  | 'arrived_at_hub' | 'out_for_delivery'
  | 'delivered' | 'exception';

export const PACKAGE_STATUSES = {
  ORDER_PLACED: 'order_placed',
  PACKED: 'packed',
  IN_TRANSIT: 'in_transit',
  ARRIVED_AT_HUB: 'arrived_at_hub',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception',
} as const;

/**
 * Ordered list of statuses representing the official Shipnix Express tracking
 * flow. The admin updates these manually from the dashboard.
 *
 * Flow:
 *  1. order_placed     – Order Placed / Processing
 *  2. packed           – Packed / Ready to Ship
 *  3. in_transit       – Shipped / In Transit
 *  4. arrived_at_hub   – Arrived at Facility / Hub
 *  5. out_for_delivery – Out for Delivery
 *  6. delivered        – Delivered (terminal)
 *  7. exception        – Exception / Delayed (off-ramp, recoverable)
 */
export const PACKAGE_STATUS_FLOW: PackageStatus[] = [
  'order_placed',
  'packed',
  'in_transit',
  'arrived_at_hub',
  'out_for_delivery',
  'delivered',
  'exception',
];

/**
 * Allowed transitions between statuses. Because the admin updates statuses
 * manually, every active stage can move to any other active stage (forward
 * progress, corrections, or off-ramp into `exception`). `exception` can be
 * resolved back into any active stage. `delivered` is terminal.
 */
const ACTIVE_STATUSES: PackageStatus[] = [
  'order_placed', 'packed', 'in_transit',
  'arrived_at_hub', 'out_for_delivery', 'exception',
];

export const PACKAGE_STATUS_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  order_placed:     ACTIVE_STATUSES.filter(s => s !== 'order_placed').concat('delivered'),
  packed:           ACTIVE_STATUSES.filter(s => s !== 'packed').concat('delivered'),
  in_transit:       ACTIVE_STATUSES.filter(s => s !== 'in_transit').concat('delivered'),
  arrived_at_hub:   ACTIVE_STATUSES.filter(s => s !== 'arrived_at_hub').concat('delivered'),
  out_for_delivery: ACTIVE_STATUSES.filter(s => s !== 'out_for_delivery').concat('delivered'),
  exception:        ACTIVE_STATUSES.filter(s => s !== 'exception').concat('delivered'),
  delivered:        [],
};

export const PACKAGE_TERMINAL_STATUSES: PackageStatus[] = ['delivered'];

export const QUOTE_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  EXPIRED: 'expired',
  CONVERTED_TO_INVOICE: 'converted_to_invoice',
} as const;

export const PAYMENT_METHODS = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  BITCOIN: 'bitcoin',
  ETHEREUM: 'ethereum',
  USDC: 'usdc',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const DELIVERY_TIME_SLOTS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  EXPRESS: 'express',
  WEEKEND: 'weekend',
} as const;

export interface Package {
  id: number;
  tracking_id: string;
  sender_name: string;
  sender_address: string;
  sender_phone?: string;
  sender_email?: string;
  recipient_name: string;
  recipient_address: string;
  recipient_phone?: string;
  recipient_email?: string;
  package_description?: string;
  weight?: string;
  dimensions?: string;
  shipping_cost?: string;
  payment_method?: string;
  payment_status?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  scheduled_delivery_date?: string;
  scheduled_time_slot?: string;
  delivery_price_adjustment?: string;
  qr_code?: string;
  current_status: string;
  current_location?: string;
  delivery_instructions?: string;
  signature_required?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: number;
  package_id: number;
  status: string;
  location?: string;
  description?: string;
  timestamp: string;
  created_at: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  sender_name: string;
  sender_email?: string;
  sender_phone?: string;
  sender_address: string;
  recipient_name: string;
  recipient_email?: string;
  recipient_phone?: string;
  recipient_address: string;
  package_description?: string;
  weight?: string;
  dimensions?: string;
  delivery_time_slot?: string;
  base_cost: string;
  delivery_fee?: string;
  total_cost: string;
  valid_until: string;
  status: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

export const CONTACT_MESSAGE_STATUSES: ContactMessageStatus[] = [
  'new',
  'read',
  'replied',
  'archived',
];

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  quote_id?: number;
  package_id?: number;
  customer_name: string;
  customer_email: string;
  customer_address?: string;
  total_amount: string;
  tax_amount?: string;
  payment_method: string;
  payment_status?: string;
  paid_at?: string;
  due_date: string;
  items: any[];
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
