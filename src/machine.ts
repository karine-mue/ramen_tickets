import { SET_ITEMS, findRamen, findSide } from './menu';
import type { CartItem, CartRamenItem, CartSideItem, CartSetItem, ActiveTransaction } from './storage';

// ── Screen phase ──────────────────────────────────────────────────────────────

export type Phase =
  | 'idle'
  | 'category_select'
  | 'ramen_select'
  | 'topping_select'
  | 'side_select'
  | 'set_ramen_select'
  | 'cart_review'
  | 'precheck_fail'
  | 'paying'
  | 'change_short'
  | 'processing'
  | 'complete'
  | 'staff_needed';

// ── Draft meal unit (being configured, not yet in cart) ───────────────────────

export type DraftMealUnit = {
  id: string;
  ramenCode: string;
  name: string;
  basePrice: number;
  toppings: { code: string; name: string; price: number }[];
  setCode?: string;
  setName?: string;
  setDiscount?: number;
  includedSideNames?: string[];
};

// ── Screen state (volatile, React only) ──────────────────────────────────────

export type ScreenState = {
  phase: Phase;
  cart: CartItem[];
  draft: DraftMealUnit | null;
  pendingSetCode: string | null;
  insertedAmount: number;
  completedDisplayNo: string | null;
  errorMessage: string | null;
};

// ── Actions ───────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'TOUCH_START' }
  | { type: 'GO_CATEGORY_SELECT' }
  | { type: 'GO_RAMEN_SELECT' }
  | { type: 'GO_SIDE_SELECT' }
  | { type: 'SELECT_RAMEN'; code: string }
  | { type: 'SELECT_SET'; code: string }
  | { type: 'SELECT_RAMEN_FOR_SET'; ramenCode: string }
  | { type: 'TOGGLE_TOPPING'; code: string; name: string; price: number }
  | { type: 'CONFIRM_MEAL_UNIT' }
  | { type: 'ADD_SIDE'; sideCode: string; name: string; price: number; isAlcohol?: boolean }
  | { type: 'REMOVE_CART_ITEM'; id: string }
  | { type: 'GO_CART_REVIEW' }
  | { type: 'PRECHECK_OK' }
  | { type: 'PRECHECK_FAIL'; reason: string }
  | { type: 'INSERT_CASH'; amount: number }
  | { type: 'PAYMENT_COMPLETE'; displayNo: string }
  | { type: 'CHANGE_SHORT' }
  | { type: 'CHANGE_REFILLED' }
  | { type: 'CANCEL_PAYMENT' }
  | { type: 'RESET' }
  | { type: 'RESTORE_FROM_TRANSACTION'; transaction: ActiveTransaction };

// ── Initial state ─────────────────────────────────────────────────────────────

export const INITIAL_SCREEN: ScreenState = {
  phase: 'idle',
  cart: [],
  draft: null,
  pendingSetCode: null,
  insertedAmount: 0,
  completedDisplayNo: null,
  errorMessage: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let _seq = 0;
const nextId = () => `item_${++_seq}_${Date.now()}`;

// ── Reducer ───────────────────────────────────────────────────────────────────

export function screenReducer(state: ScreenState, action: Action): ScreenState {
  switch (action.type) {

    case 'TOUCH_START':
      return { ...INITIAL_SCREEN, phase: 'category_select' };

    case 'GO_CATEGORY_SELECT':
      return { ...state, phase: 'category_select', draft: null, pendingSetCode: null };

    case 'GO_RAMEN_SELECT':
      return { ...state, phase: 'ramen_select' };

    case 'GO_SIDE_SELECT':
      return { ...state, phase: 'side_select' };

    case 'SELECT_RAMEN': {
      const ramen = findRamen(action.code);
      if (!ramen) return state;
      return {
        ...state,
        phase: 'topping_select',
        draft: {
          id: nextId(),
          ramenCode: ramen.code,
          name: ramen.name,
          basePrice: ramen.price,
          toppings: [],
        },
      };
    }

    case 'SELECT_SET': {
      const set = SET_ITEMS.find(s => s.code === action.code);
      if (!set) return state;
      return { ...state, phase: 'set_ramen_select', pendingSetCode: set.code };
    }

    case 'SELECT_RAMEN_FOR_SET': {
      const ramen = findRamen(action.ramenCode);
      const set = SET_ITEMS.find(s => s.code === state.pendingSetCode);
      if (!ramen || !set) return state;
      const includedSideNames = set.includedSideCodes.map(c => findSide(c)?.name ?? c);
      return {
        ...state,
        phase: 'topping_select',
        draft: {
          id: nextId(),
          ramenCode: ramen.code,
          name: ramen.name,
          basePrice: ramen.price,
          toppings: [],
          setCode: set.code,
          setName: set.name,
          setDiscount: set.sideDiscount,
          includedSideNames,
        },
      };
    }

    case 'TOGGLE_TOPPING': {
      if (!state.draft) return state;
      const exists = state.draft.toppings.some(t => t.code === action.code);
      const toppings = exists
        ? state.draft.toppings.filter(t => t.code !== action.code)
        : [...state.draft.toppings, { code: action.code, name: action.name, price: action.price }];
      return { ...state, draft: { ...state.draft, toppings } };
    }

    case 'CONFIRM_MEAL_UNIT': {
      const d = state.draft;
      if (!d) return state;
      const toppingTotal = d.toppings.reduce((s, t) => s + t.price, 0);

      let newItem: CartItem;
      if (d.setCode && d.setDiscount !== undefined) {
        const set = SET_ITEMS.find(s => s.code === d.setCode)!;
        const sidesTotal = set.includedSideCodes.reduce((s, c) => {
          const side = findSide(c);
          return s + (side ? side.price - d.setDiscount! / set.includedSideCodes.length : 0);
        }, 0);
        const setItem: CartSetItem = {
          id: d.id,
          kind: 'set',
          setCode: d.setCode,
          name: d.setName ?? '餃子セット',
          ramenCode: d.ramenCode,
          ramenName: d.name,
          toppings: d.toppings,
          includedSideNames: d.includedSideNames ?? [],
          totalPrice: d.basePrice + Math.round(sidesTotal) + toppingTotal,
        };
        newItem = setItem;
      } else {
        const ramenItem: CartRamenItem = {
          id: d.id,
          kind: 'ramen',
          ramenCode: d.ramenCode,
          name: d.name,
          basePrice: d.basePrice,
          toppings: d.toppings,
          totalPrice: d.basePrice + toppingTotal,
        };
        newItem = ramenItem;
      }

      return {
        ...state,
        phase: 'category_select',
        cart: [...state.cart, newItem],
        draft: null,
        pendingSetCode: null,
      };
    }

    case 'ADD_SIDE': {
      const sideItem: CartSideItem = {
        id: nextId(),
        kind: 'side',
        sideCode: action.sideCode,
        name: action.name,
        price: action.price,
        isAlcohol: action.isAlcohol,
      };
      return { ...state, cart: [...state.cart, sideItem], phase: 'category_select' };
    }

    case 'REMOVE_CART_ITEM':
      return { ...state, cart: state.cart.filter(item => item.id !== action.id) };

    case 'GO_CART_REVIEW':
      return { ...state, phase: 'cart_review' };

    case 'PRECHECK_OK':
      return { ...state, phase: 'paying', insertedAmount: 0, errorMessage: null };

    case 'PRECHECK_FAIL':
      return { ...state, phase: 'precheck_fail', errorMessage: action.reason };

    case 'INSERT_CASH':
      return { ...state, insertedAmount: state.insertedAmount + action.amount };

    case 'PAYMENT_COMPLETE':
      return {
        ...INITIAL_SCREEN,
        phase: 'complete',
        completedDisplayNo: action.displayNo,
      };

    case 'CHANGE_SHORT':
      return { ...state, phase: 'change_short' };

    case 'CHANGE_REFILLED':
      return { ...state, phase: 'paying' };

    case 'CANCEL_PAYMENT':
      return { ...INITIAL_SCREEN, phase: 'idle' };

    case 'RESET':
      return { ...INITIAL_SCREEN };

    case 'RESTORE_FROM_TRANSACTION': {
      const t = action.transaction;
      return {
        ...INITIAL_SCREEN,
        phase: t.status === 'change_short' ? 'change_short' : 'paying',
        cart: t.cart,
        insertedAmount: t.insertedAmount,
      };
    }

    default:
      return state;
  }
}

// ── Re-export menu constants for use in components ────────────────────────────
export { RAMEN_ITEMS, TOPPING_ITEMS, SIDE_ITEMS, SET_ITEMS } from './menu';
