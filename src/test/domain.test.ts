import {
  asDisplayNo,
  asOrderId,
  asTransactionId,
  canonicalizeForIdempotency,
  type DisplayNo,
  type OrderId,
  type TransactionId,
} from '../domain';

describe('ID helpers', () => {
  it('accepts lowercase UUID v4 values for TransactionId and OrderId', () => {
    const tx = asTransactionId('123e4567-e89b-42d3-a456-426614174000');
    const order = asOrderId('123e4567-e89b-42d3-a456-426614174001');

    expect(tx).toBe('123e4567-e89b-42d3-a456-426614174000');
    expect(order).toBe('123e4567-e89b-42d3-a456-426614174001');
  });

  it('rejects invalid id formats', () => {
    expect(() => asTransactionId('not-a-uuid')).toThrow(/TransactionId/);
    expect(() => asOrderId('123E4567-E89B-42D3-A456-426614174000')).toThrow(
      /OrderId/
    );
    expect(() => asDisplayNo('12345')).toThrow(/DisplayNo/);
  });

  it('accepts display numbers with one to four digits', () => {
    expect(asDisplayNo('7')).toBe('7');
    expect(asDisplayNo('0042')).toBe('0042');
  });

  it('keeps branded types separated at compile-time', () => {
    const tx: TransactionId = asTransactionId('123e4567-e89b-42d3-a456-426614174000');
    const order: OrderId = asOrderId('123e4567-e89b-42d3-a456-426614174001');
    const display: DisplayNo = asDisplayNo('42');

    expect(typeof tx).toBe('string');
    expect(typeof order).toBe('string');
    expect(typeof display).toBe('string');
  });
});

describe('canonicalizeForIdempotency', () => {
  it('normalizes case and whitespace for stable comparisons', () => {
    const first = canonicalizeForIdempotency('  Tonkotsu   EXTRA  Egg ');
    const second = canonicalizeForIdempotency('tonkotsu extra egg');

    expect(first).toBe('tonkotsu extra egg');
    expect(second).toBe(first);
  });

  it('applies Unicode compatibility normalization', () => {
    const fullWidth = canonicalizeForIdempotency('ＡＢＣ　１２３');
    const plain = canonicalizeForIdempotency('abc 123');

    expect(fullWidth).toBe('abc 123');
    expect(plain).toBe(fullWidth);
  });
});
