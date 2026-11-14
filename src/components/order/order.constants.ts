import type { OrderStatus } from '@/types';

export const STATUSES: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered'];

export const CANCEL_REASONS = ['changed_mind', 'duplicate_order', 'wrong_item_ordered', 'price_issue', 'other'] as const;
export const RETURN_REASONS = ['damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'quality_issue', 'other'] as const;
export const EXCHANGE_REASONS = ['wrong_size', 'wrong_color', 'damaged', 'not_as_described', 'changed_mind', 'other'] as const;
