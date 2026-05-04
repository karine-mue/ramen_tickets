export type Brand<T, B extends string> = T & { readonly __brand: B };

export type TransactionId = Brand<string, 'TransactionId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type DisplayNo = Brand<string, 'DisplayNo'>;

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DISPLAY_NO_REGEX = /^\d{1,4}$/;

export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TicketLineItem {
  readonly name: string;
  readonly quantity: number;
  readonly notes?: string;
}

export interface Ticket {
  readonly transactionId: TransactionId;
  readonly orderId: OrderId;
  readonly displayNo: DisplayNo;
  readonly status: TicketStatus;
  readonly items: readonly TicketLineItem[];
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
}

function assertLowerUuidV4(value: string, label: string): void {
  if (!UUID_V4_REGEX.test(value)) {
    throw new Error(`${label} must be a lowercase UUID v4`);
  }
}

export function asTransactionId(value: string): TransactionId {
  assertLowerUuidV4(value, 'TransactionId');
  return value as TransactionId;
}

export function asOrderId(value: string): OrderId {
  assertLowerUuidV4(value, 'OrderId');
  return value as OrderId;
}

export function asDisplayNo(value: string): DisplayNo {
  if (!DISPLAY_NO_REGEX.test(value)) {
    throw new Error('DisplayNo must be 1 to 4 digits');
  }
  return value as DisplayNo;
}

export function canonicalizeForIdempotency(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
