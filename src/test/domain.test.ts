import {
  canonicalizeForIdempotency,
  createOrderId,
  createTransactionId,
  formatDisplayNo,
  type DisplayNo,
  type OrderId,
  type TransactionId,
} from '../domain';

describe('ID helpers', () => {
  it('creates transaction_id with date, storeId, kioskId, and zero-padded sequence', () => {
    expect(createTransactionId('20260504', 'S01', 'K02', 7)).toBe('20260504-S01-K02-0007');
  });

  it('creates order_id with date, storeId, and zero-padded sequence', () => {
    expect(createOrderId('20260504', 'S01', 23)).toBe('20260504-S01-0023');
  });

  it('formats display_no as zero-padded 4 digits', () => {
    expect(formatDisplayNo(1)).toBe('0001');
    expect(formatDisplayNo(42)).toBe('0042');
    expect(formatDisplayNo(9999)).toBe('9999');
  });
});

describe('type separation', () => {
  it('keeps id aliases separate in signatures', () => {
    const txnId: TransactionId = createTransactionId('20260504', 'S01', 'K02', 1);
    const orderId: OrderId = createOrderId('20260504', 'S01', 1);
    const displayNo: DisplayNo = formatDisplayNo(1);

    expect(txnId).toContain('K02');
    expect(orderId).not.toContain('K02');
    expect(displayNo).toHaveLength(4);
  });
});

describe('canonicalizeForIdempotency', () => {
  it('canonicalizes equivalent objects with different key orders to same string', () => {
    const left = { b: 1, a: 2 };
    const right = { a: 2, b: 1 };

    expect(canonicalizeForIdempotency(left)).toBe(canonicalizeForIdempotency(right));
    expect(canonicalizeForIdempotency(left)).toBe('{"a":2,"b":1}');
  });

  it('sorts nested object keys while preserving array order', () => {
    const payload = {
      z: 1,
      a: [
        { y: 2, x: 1 },
        { b: true, a: false },
      ],
      m: {
        d: [{ k: 2, j: 1 }],
        c: 'ok',
      },
    };

    expect(canonicalizeForIdempotency(payload)).toBe(
      '{"a":[{"x":1,"y":2},{"a":false,"b":true}],"m":{"c":"ok","d":[{"j":1,"k":2}]},"z":1}'
    );
  });
});
