type Brand<T, B extends string> = T & { readonly __brand: B };

export type TransactionId = Brand<string, 'TransactionId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type DisplayNo = Brand<string, 'DisplayNo'>;

export type MealUnitOption = {
  optionCode: string;
  quantity: number;
};

export type MealUnit = {
  mealUnitId: string;
  menuCode: string;
  quantity: number;
  options: MealUnitOption[];
};

export type TransactionDraft = {
  transactionId: TransactionId;
  storeId: string;
  kioskId: string;
  orders: MealUnit[];
};

export type OrderResult = {
  orderId: OrderId;
  transactionId: TransactionId;
  displayNo: DisplayNo;
  acceptedAt: string;
};

export type KitchenTicket = {
  orderId: OrderId;
  displayNo: DisplayNo;
  mealUnits: MealUnit[];
  issuedAt: string;
};

const padSeq = (seq: number): string => String(seq).padStart(4, '0');

export const createTransactionId = (
  date: string,
  storeId: string,
  kioskId: string,
  seq: number
 ): TransactionId => `${date}-${storeId}-${kioskId}-${padSeq(seq)}` as TransactionId;

export const createOrderId = (
  date: string,
  storeId: string,
  seq: number
 ): OrderId => `${date}-${storeId}-${padSeq(seq)}` as OrderId;

export const formatDisplayNo = (seq: number): DisplayNo => padSeq(seq) as DisplayNo;

type JsonPrimitive = string | number | boolean | null;
export type JsonLike = JsonPrimitive | JsonLike[] | { [key: string]: JsonLike };

const sortRecursively = (value: JsonLike): JsonLike => {
  if (Array.isArray(value)) {
    return value.map(sortRecursively);
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, JsonLike>>((acc, key) => {
        acc[key] = sortRecursively(value[key]);
        return acc;
      }, {});
  }

  return value;
};

export const canonicalizeForIdempotency = (payload: JsonLike): string =>
  JSON.stringify(sortRecursively(payload));
