import type { KitchenOrder, CartItem } from './storage';

type Props = {
  orders: KitchenOrder[];
  onStatusChange: (orderId: string, status: KitchenOrder['status']) => void;
  onClearCalled: () => void;
};

export function KitchenQueue({ orders, onStatusChange, onClearCalled }: Props) {
  const active = orders.filter(o => o.status !== 'called');
  const called = orders.filter(o => o.status === 'called');

  return (
    <div style={s.panel}>
      {orders.length === 0 && (
        <div style={s.empty}>注文待ち...</div>
      )}

      {active.map(order => (
        <OrderCard key={order.orderId} order={order} onStatusChange={onStatusChange} />
      ))}

      {called.length > 0 && (
        <div style={s.calledSection}>
          <div style={s.calledHeader}>
            呼出済 ({called.length}件)
            <button style={s.clearBtn} onClick={onClearCalled}>クリア</button>
          </div>
          {called.map(o => (
            <div key={o.orderId} style={s.calledRow}>
              <span style={s.calledNo}>{o.displayNo}</span>
              <span style={s.calledLabel}>提供済み</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onStatusChange }: {
  order: KitchenOrder;
  onStatusChange: (orderId: string, status: KitchenOrder['status']) => void;
}) {
  const statusColor = {
    waiting: '#888',
    cooking: '#ffa500',
    done:    '#90ee90',
    called:  '#4a90d9',
  }[order.status];

  const nextAction: { label: string; next: KitchenOrder['status'] } | null =
    order.status === 'waiting' ? { label: '調理開始', next: 'cooking' } :
    order.status === 'cooking' ? { label: '完成', next: 'done' } :
    order.status === 'done'    ? { label: '番号呼出', next: 'called' } :
    null;

  const ramenItems = order.cart.filter(i => i.kind === 'ramen' || i.kind === 'set');
  const sideItems = order.cart.filter(i => i.kind === 'side');

  return (
    <div style={{ ...s.card, borderColor: statusColor }}>
      <div style={s.cardHeader}>
        <div style={s.displayNo}>{order.displayNo}</div>
        <div style={{ ...s.status, color: statusColor }}>{statusLabel(order.status)}</div>
      </div>

      <div style={s.mealList}>
        {ramenItems.map((item, i) => (
          <MealRow key={item.id} item={item} index={i + 1} />
        ))}
        {sideItems.length > 0 && (
          <div style={s.sidesSection}>
            <div style={s.sidesLabel}>サイド</div>
            {sideItems.map(item => (
              <div key={item.id} style={s.sideRow}>{item.name}</div>
            ))}
          </div>
        )}
      </div>

      {nextAction && (
        <button
          style={{ ...s.actionBtn, background: statusColor === '#888' ? '#333' : statusColor + '33', borderColor: statusColor, color: statusColor }}
          onClick={() => onStatusChange(order.orderId, nextAction.next)}
        >
          {nextAction.label} →
        </button>
      )}

      <div style={s.createdAt}>{new Date(order.createdAt).toLocaleTimeString('ja-JP')}</div>
    </div>
  );
}

function MealRow({ item, index }: { item: CartItem; index: number }) {
  if (item.kind === 'side') return null;

  const toppings = item.toppings;
  const name = item.kind === 'set' ? `${item.ramenName}（${item.name}）` : item.name;

  return (
    <div style={s.mealRow}>
      <div style={s.mealName}>[{index}] {name}</div>
      {toppings.length > 0 && (
        <div style={s.toppingList}>
          {toppings.map(t => <div key={t.code} style={s.toppingItem}>・{t.name}</div>)}
        </div>
      )}
      {item.kind === 'set' && item.includedSideNames.length > 0 && (
        <div style={s.toppingList}>
          {item.includedSideNames.map(n => <div key={n} style={{ ...s.toppingItem, color: '#90ee90' }}>・{n}（セット）</div>)}
        </div>
      )}
    </div>
  );
}

function statusLabel(status: KitchenOrder['status']): string {
  switch (status) {
    case 'waiting': return '待機中';
    case 'cooking': return '調理中';
    case 'done':    return '完成';
    case 'called':  return '呼出済';
  }
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 12,
    overflowY: 'auto', background: '#0d1117',
  },
  empty: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#444', fontSize: 14,
  },
  card: {
    background: '#161b22', border: '1px solid', borderRadius: 8,
    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  displayNo: { fontSize: 28, fontWeight: 700, color: '#e94560', fontFamily: 'monospace' },
  status: { fontSize: 13, fontWeight: 600 },
  mealList: { display: 'flex', flexDirection: 'column', gap: 8 },
  mealRow: { display: 'flex', flexDirection: 'column', gap: 2 },
  mealName: { fontSize: 14, fontWeight: 600, color: '#eee' },
  toppingList: { paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 1 },
  toppingItem: { fontSize: 12, color: '#aaa' },
  sidesSection: { borderTop: '1px solid #2d2d44', paddingTop: 6, marginTop: 2 },
  sidesLabel: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 600 },
  sideRow: { fontSize: 13, color: '#ccc', paddingLeft: 8 },
  actionBtn: {
    border: '1px solid', borderRadius: 6, padding: '8px 0',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  createdAt: { fontSize: 11, color: '#555', textAlign: 'right' },
  calledSection: {
    background: '#0d0d1f', border: '1px solid #2d2d44', borderRadius: 8, padding: '10px 12px',
  },
  calledHeader: {
    fontSize: 12, color: '#666', fontWeight: 600, display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  clearBtn: {
    background: 'none', border: '1px solid #444', borderRadius: 4,
    color: '#666', fontSize: 11, padding: '2px 8px', cursor: 'pointer',
  },
  calledRow: { display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 4 },
  calledNo: { fontFamily: 'monospace', fontWeight: 700, color: '#4a90d9', fontSize: 18 },
  calledLabel: { fontSize: 12, color: '#555' },
};
