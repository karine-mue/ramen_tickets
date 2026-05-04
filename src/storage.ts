import type { TransactionId, OrderId, DisplayNo } from './domain';

// ── Cart item types ──────────────────────────────────────────────────────────

export type CartRamenItem = {
  id: string;
  kind: 'ramen';
  ramenCode: string;
  name: string;
  basePrice: number;
  toppings: { code: string; name: string; price: number }[];
  totalPrice: number;
};

export type CartSideItem = {
  id: string;
  kind: 'side';
  sideCode: string;
  name: string;
  price: number;
  isAlcohol?: boolean;
};

export type CartSetItem = {
  id: string;
  kind: 'set';
  setCode: string;
  name: string;
  ramenCode: string;
  ramenName: string;
  toppings: { code: string; name: string; price: number }[];
  includedSideNames: string[];
  totalPrice: number;
};

export type CartItem = CartRamenItem | CartSideItem | CartSetItem;

export const cartItemPrice = (item: CartItem): number => {
  switch (item.kind) {
    case 'ramen': return item.totalPrice;
    case 'side':  return item.price;
    case 'set':   return item.totalPrice;
  }
};

export const cartTotal = (cart: CartItem[]): number =>
  cart.reduce((sum, item) => sum + cartItemPrice(item), 0);

// ── Persisted transaction ────────────────────────────────────────────────────

export type TransactionStatus = 'paying' | 'change_short' | 'complete';

export type ActiveTransaction = {
  transactionId: TransactionId;
  cart: CartItem[];
  totalAmount: number;
  insertedAmount: number;
  status: TransactionStatus;
  orderId?: OrderId;
  displayNo?: DisplayNo;
  createdAt: string;
};

// ── Kitchen queue ─────────────────────────────────────────────────────────────

export type KitchenStatus = 'waiting' | 'cooking' | 'done' | 'called';

export type KitchenOrder = {
  orderId: OrderId;
  displayNo: DisplayNo;
  cart: CartItem[];
  status: KitchenStatus;
  createdAt: string;
};

// ── Persisted state (localStorage) ───────────────────────────────────────────

export type PersistedState = {
  activeTransaction: ActiveTransaction | null;
  kitchenQueue: KitchenOrder[];
  changeStockYen: number;
  orderSeq: number;
  displaySeq: number;
};

const STORAGE_KEY = 'ramen_machine_v1';

export const DEFAULT_PERSISTED: PersistedState = {
  activeTransaction: null,
  kitchenQueue: [],
  changeStockYen: 3000,
  orderSeq: 1,
  displaySeq: 1,
};

export const loadState = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSISTED };
    return { ...DEFAULT_PERSISTED, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PERSISTED };
  }
};

export const saveState = (state: PersistedState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
