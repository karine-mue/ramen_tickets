import type { ActiveTransaction } from './storage';
import type { ScreenState } from './machine';

type Props = {
  changeStockYen: number;
  activeTransaction: ActiveTransaction | null;
  screen: ScreenState;
  onAddChange: (amount: number) => void;
};

const REFILL_AMOUNTS = [500, 1000, 5000, 10000];

export function MaintenancePanel({ changeStockYen, activeTransaction, screen, onAddChange }: Props) {
  const hasChangeShort = activeTransaction?.status === 'change_short' || screen.phase === 'change_short';
  const changeNeeded = activeTransaction
    ? Math.max(0, activeTransaction.insertedAmount - activeTransaction.totalAmount)
    : 0;
  const stillShort = hasChangeShort && changeNeeded > changeStockYen;

  return (
    <div style={s.panel}>
      {/* Change stock */}
      <div style={s.section}>
        <div style={s.label}>釣銭在庫</div>
        <div style={{ ...s.stockValue, color: changeStockYen < 500 ? '#ff6b6b' : changeStockYen < 1000 ? '#ffa500' : '#90ee90' }}>
          ¥{changeStockYen.toLocaleString()}
        </div>
        {changeStockYen < 500 && <div style={s.warning}>⚠ 不足 — 入金受付停止中</div>}
      </div>

      {/* Refill buttons */}
      <div style={s.section}>
        <div style={s.label}>釣銭補充</div>
        <div style={s.refillGrid}>
          {REFILL_AMOUNTS.map(amt => (
            <button key={amt} style={s.refillBtn} onClick={() => onAddChange(amt)}>
              +¥{amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Active transaction status */}
      <div style={s.section}>
        <div style={s.label}>取引状態</div>
        {activeTransaction ? (
          <div style={{ ...s.txBox, borderColor: hasChangeShort ? '#ffa500' : '#4a90d9' }}>
            <div style={s.txRow}>
              <span style={s.txKey}>取引ID</span>
              <span style={s.txVal}>{activeTransaction.transactionId.slice(-8)}</span>
            </div>
            <div style={s.txRow}>
              <span style={s.txKey}>合計</span>
              <span style={s.txVal}>¥{activeTransaction.totalAmount.toLocaleString()}</span>
            </div>
            <div style={s.txRow}>
              <span style={s.txKey}>投入済</span>
              <span style={s.txVal}>¥{activeTransaction.insertedAmount.toLocaleString()}</span>
            </div>
            <div style={s.txRow}>
              <span style={s.txKey}>状態</span>
              <span style={{
                ...s.txVal,
                color: activeTransaction.status === 'change_short' ? '#ffa500' : '#90ee90',
                fontWeight: 600,
              }}>
                {statusLabel(activeTransaction.status)}
              </span>
            </div>
            {hasChangeShort && (
              <div style={s.txAlert}>
                必要おつり: ¥{changeNeeded.toLocaleString()}<br />
                {stillShort
                  ? <span style={{ color: '#ff6b6b' }}>補充不足 — あと¥{(changeNeeded - changeStockYen).toLocaleString()}必要</span>
                  : <span style={{ color: '#90ee90' }}>補充完了 — 自動処理されます</span>
                }
              </div>
            )}
          </div>
        ) : (
          <div style={s.noTx}>取引なし</div>
        )}
      </div>

      {/* Info */}
      <div style={s.infoBox}>
        <div style={s.infoTitle}>🔒 取引保護について</div>
        <div style={s.infoText}>
          釣銭補充などの保守操作を行っても、入金済みの取引データは永続化されており消失しません。
          補充後、自動的に決済処理が再開されます。
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: ActiveTransaction['status']): string {
  switch (status) {
    case 'paying':       return '入金受付中';
    case 'change_short': return '釣銭補充待ち';
    case 'complete':     return '完了';
  }
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    flex: 1, display: 'flex', flexDirection: 'column', padding: 14, gap: 14,
    overflowY: 'auto', background: '#0d0d1f',
  },
  section: {
    background: '#16213e', borderRadius: 8, padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  label: { fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
  stockValue: { fontSize: 28, fontWeight: 700 },
  warning: { fontSize: 12, color: '#ff6b6b', fontWeight: 600 },
  refillGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  refillBtn: {
    background: '#0f3460', border: '1px solid #4a90d9', borderRadius: 6,
    color: '#a8d8ff', fontWeight: 600, fontSize: 13, padding: '10px 0',
    cursor: 'pointer',
  },
  txBox: {
    border: '1px solid', borderRadius: 8, padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 6, background: '#1a1a2e',
  },
  txRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  txKey: { color: '#888' },
  txVal: { color: '#ccc', fontFamily: 'monospace' },
  txAlert: {
    background: '#2a1f00', border: '1px solid #ffa500', borderRadius: 6,
    padding: '8px 10px', fontSize: 12, color: '#ffa500', lineHeight: 1.6,
  },
  noTx: { fontSize: 13, color: '#555', textAlign: 'center', padding: '8px 0' },
  infoBox: {
    background: '#0a1628', border: '1px solid #2d2d44', borderRadius: 8,
    padding: '12px 14px', marginTop: 'auto',
  },
  infoTitle: { fontSize: 12, fontWeight: 600, color: '#4a90d9', marginBottom: 6 },
  infoText: { fontSize: 11, color: '#666', lineHeight: 1.6 },
};
