import type { Dispatch } from 'react';
import { RAMEN_ITEMS, TOPPING_ITEMS, SIDE_ITEMS, SET_ITEMS } from './machine';
import type { Action, ScreenState } from './machine';
import { cartTotal, cartItemPrice } from './storage';
import type { CartItem, ActiveTransaction } from './storage';

type Props = {
  screen: ScreenState;
  activeTransaction: ActiveTransaction | null;
  dispatch: Dispatch<Action>;
  onConfirmOrder: () => void;
  onInsertCash: (amount: number) => void;
  onCancelPayment: () => void;
};

const CASH_DENOMINATIONS = [10, 50, 100, 500, 1000, 5000];

export function KioskScreen({ screen, activeTransaction, dispatch, onConfirmOrder, onInsertCash, onCancelPayment }: Props) {
  const { phase, cart, draft } = screen;

  return (
    <div style={s.screen}>
      {phase === 'idle' && <IdleView dispatch={dispatch} />}
      {phase === 'category_select' && <CategoryView cart={cart} dispatch={dispatch} />}
      {phase === 'ramen_select' && <RamenSelectView dispatch={dispatch} />}
      {phase === 'set_ramen_select' && <SetRamenSelectView screen={screen} dispatch={dispatch} />}
      {phase === 'topping_select' && draft && <ToppingSelectView screen={screen} dispatch={dispatch} />}
      {phase === 'side_select' && <SideSelectView dispatch={dispatch} />}
      {phase === 'cart_review' && <CartReviewView cart={cart} dispatch={dispatch} onConfirmOrder={onConfirmOrder} />}
      {phase === 'precheck_fail' && <PrecheckFailView screen={screen} dispatch={dispatch} />}
      {phase === 'paying' && (
        <PayingView
          screen={screen}
          activeTransaction={activeTransaction}
          onInsertCash={onInsertCash}
          onCancelPayment={onCancelPayment}
        />
      )}
      {phase === 'change_short' && (
        <ChangeShortView
          screen={screen}
          activeTransaction={activeTransaction}
        />
      )}
      {phase === 'processing' && <div style={s.center}>処理中...</div>}
      {phase === 'complete' && <CompleteView screen={screen} dispatch={dispatch} />}
    </div>
  );
}

// ── Idle ──────────────────────────────────────────────────────────────────────

function IdleView({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div style={s.idle} onClick={() => dispatch({ type: 'TOUCH_START' })}>
      <div style={s.idleTitle}>🍜</div>
      <div style={s.idleMsg}>画面をタッチしてご注文をお始めください</div>
      <div style={s.idleSub}>Touch to Start</div>
    </div>
  );
}

// ── Category Select ───────────────────────────────────────────────────────────

function CategoryView({ cart, dispatch }: { cart: CartItem[]; dispatch: Dispatch<Action> }) {
  const total = cartTotal(cart);
  const hasRamen = cart.some(i => i.kind === 'ramen' || i.kind === 'set');

  return (
    <div style={s.view}>
      <div style={s.categoryGrid}>
        <BigBtn color="#e94560" onClick={() => dispatch({ type: 'GO_RAMEN_SELECT' })}>
          🍜 ラーメン
        </BigBtn>
        <BigBtn color="#0f9b8e" onClick={() => dispatch({ type: 'GO_SIDE_SELECT' })}>
          🥟 サイド
        </BigBtn>
        {SET_ITEMS.map(set => (
          <BigBtn key={set.code} color="#533483" onClick={() => dispatch({ type: 'SELECT_SET', code: set.code })}>
            ⭐ {set.name}
            <span style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{set.description}</span>
          </BigBtn>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={s.cartSummary}>
          <div style={s.cartItems}>
            {cart.map(item => (
              <div key={item.id} style={s.cartRow}>
                <span>{cartItemLabel(item)}</span>
                <span>¥{cartItemPrice(item).toLocaleString()}</span>
                <button style={s.removeBtn} onClick={() => dispatch({ type: 'REMOVE_CART_ITEM', id: item.id })}>✕</button>
              </div>
            ))}
          </div>
          <div style={s.cartTotal}>合計: ¥{total.toLocaleString()}</div>
          <button
            style={{ ...s.primaryBtn, opacity: hasRamen ? 1 : 0.5 }}
            disabled={!hasRamen}
            onClick={() => dispatch({ type: 'GO_CART_REVIEW' })}
          >
            注文を確認する →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Ramen Select ──────────────────────────────────────────────────────────────

function RamenSelectView({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div style={s.view}>
      <BackBar label="← カテゴリへ戻る" onClick={() => dispatch({ type: 'GO_CATEGORY_SELECT' })} />
      <div style={s.sectionTitle}>ラーメンを選んでください</div>
      <div style={s.itemGrid}>
        {RAMEN_ITEMS.map(r => (
          <ItemCard key={r.code} name={r.name} price={r.price} onClick={() => dispatch({ type: 'SELECT_RAMEN', code: r.code })} />
        ))}
      </div>
    </div>
  );
}

// ── Set Ramen Select ──────────────────────────────────────────────────────────

function SetRamenSelectView({ screen, dispatch }: { screen: ScreenState; dispatch: Dispatch<Action> }) {
  const set = SET_ITEMS.find(s => s.code === screen.pendingSetCode);
  return (
    <div style={s.view}>
      <BackBar label="← カテゴリへ戻る" onClick={() => dispatch({ type: 'GO_CATEGORY_SELECT' })} />
      <div style={s.sectionTitle}>{set?.name}: ラーメンを選んでください</div>
      <div style={s.itemGrid}>
        {RAMEN_ITEMS.map(r => (
          <ItemCard key={r.code} name={r.name} price={r.price} badge="セット価格適用" onClick={() => dispatch({ type: 'SELECT_RAMEN_FOR_SET', ramenCode: r.code })} />
        ))}
      </div>
    </div>
  );
}

// ── Topping Select ────────────────────────────────────────────────────────────

function ToppingSelectView({ screen, dispatch }: { screen: ScreenState; dispatch: Dispatch<Action> }) {
  const { draft } = screen;
  if (!draft) return null;
  const toppingTotal = draft.toppings.reduce((s, t) => s + t.price, 0);

  return (
    <div style={s.view}>
      <BackBar label="← ラーメン選択へ" onClick={() => dispatch({ type: 'GO_RAMEN_SELECT' })} />
      <div style={s.sectionTitle}>
        {draft.name} のトッピングを選んでください
        {draft.setName && <span style={s.badge}>{draft.setName}</span>}
      </div>

      <div style={s.toppingGrid}>
        {TOPPING_ITEMS.map(t => {
          const selected = draft.toppings.some(dt => dt.code === t.code);
          return (
            <button
              key={t.code}
              style={{ ...s.toppingBtn, ...(selected ? s.toppingSelected : {}) }}
              onClick={() => dispatch({ type: 'TOGGLE_TOPPING', code: t.code, name: t.name, price: t.price })}
            >
              {selected ? '✓ ' : ''}{t.name}<br />
              <span style={{ fontSize: 11 }}>+¥{t.price}</span>
            </button>
          );
        })}
      </div>

      <div style={s.draftSummary}>
        <div>ラーメン: ¥{draft.basePrice.toLocaleString()}</div>
        {draft.includedSideNames && draft.includedSideNames.length > 0 && (
          <div style={{ color: '#90ee90' }}>含む: {draft.includedSideNames.join('、')} (割引適用)</div>
        )}
        {toppingTotal > 0 && <div>トッピング: +¥{toppingTotal}</div>}
        <div style={s.draftTotal}>
          小計: ¥{(draft.basePrice + toppingTotal + (draft.setDiscount ? (SIDE_ITEMS.find(si => draft.includedSideNames?.[0] === si.name)?.price ?? 330) - draft.setDiscount : 0)).toLocaleString()}
        </div>
      </div>

      <button style={s.primaryBtn} onClick={() => dispatch({ type: 'CONFIRM_MEAL_UNIT' })}>
        カートに追加 →
      </button>
    </div>
  );
}

// ── Side Select ───────────────────────────────────────────────────────────────

function SideSelectView({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div style={s.view}>
      <BackBar label="← カテゴリへ戻る" onClick={() => dispatch({ type: 'GO_CATEGORY_SELECT' })} />
      <div style={s.sectionTitle}>サイドメニュー</div>
      <div style={s.itemGrid}>
        {SIDE_ITEMS.map(side => (
          <ItemCard
            key={side.code}
            name={side.name}
            price={side.price}
            badge={side.isAlcohol ? '🍺 アルコール' : undefined}
            onClick={() => dispatch({ type: 'ADD_SIDE', sideCode: side.code, name: side.name, price: side.price, isAlcohol: side.isAlcohol })}
          />
        ))}
      </div>
    </div>
  );
}

// ── Cart Review ───────────────────────────────────────────────────────────────

function CartReviewView({ cart, dispatch, onConfirmOrder }: { cart: CartItem[]; dispatch: Dispatch<Action>; onConfirmOrder: () => void }) {
  const total = cartTotal(cart);
  return (
    <div style={s.view}>
      <BackBar label="← 追加する" onClick={() => dispatch({ type: 'GO_CATEGORY_SELECT' })} />
      <div style={s.sectionTitle}>ご注文の確認</div>
      <div style={s.reviewList}>
        {cart.map(item => (
          <div key={item.id} style={s.reviewItem}>
            <div style={s.reviewName}>{cartItemLabel(item)}</div>
            {item.kind !== 'side' && item.toppings.length > 0 && (
              <div style={s.reviewSub}>+ {item.toppings.map(t => t.name).join('、')}</div>
            )}
            {item.kind === 'set' && (
              <div style={s.reviewSub}>含む: {item.includedSideNames.join('、')}</div>
            )}
            <div style={s.reviewPrice}>¥{cartItemPrice(item).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={s.totalBar}>合計: ¥{total.toLocaleString()}</div>
      <button style={s.primaryBtn} onClick={onConfirmOrder}>
        決済へ進む →
      </button>
    </div>
  );
}

// ── Precheck Fail ─────────────────────────────────────────────────────────────

function PrecheckFailView({ screen, dispatch }: { screen: ScreenState; dispatch: Dispatch<Action> }) {
  return (
    <div style={s.errorView}>
      <div style={s.errorIcon}>⚠️</div>
      <div style={s.errorTitle}>お取引できません</div>
      <div style={s.errorMsg}>{screen.errorMessage}</div>
      <button style={s.secondaryBtn} onClick={() => dispatch({ type: 'GO_CART_REVIEW' })}>
        戻る
      </button>
    </div>
  );
}

// ── Paying ────────────────────────────────────────────────────────────────────

function PayingView({ screen, activeTransaction, onInsertCash, onCancelPayment }: {
  screen: ScreenState;
  activeTransaction: ActiveTransaction | null;
  onInsertCash: (amount: number) => void;
  onCancelPayment: () => void;
}) {
  const total = activeTransaction?.totalAmount ?? cartTotal(screen.cart);
  const inserted = screen.insertedAmount;
  const remaining = Math.max(0, total - inserted);

  return (
    <div style={s.view}>
      <div style={s.payHeader}>
        <div style={s.payLabel}>お支払い金額</div>
        <div style={s.payTotal}>¥{total.toLocaleString()}</div>
      </div>
      <div style={s.payStatus}>
        <div>投入金額: <strong>¥{inserted.toLocaleString()}</strong></div>
        <div style={{ color: remaining > 0 ? '#ffa500' : '#90ee90' }}>
          {remaining > 0 ? `あと ¥${remaining.toLocaleString()} 投入してください` : '決済処理中...'}
        </div>
      </div>
      <div style={s.cashGrid}>
        {CASH_DENOMINATIONS.map(d => (
          <button key={d} style={s.cashBtn} onClick={() => onInsertCash(d)}>
            ¥{d.toLocaleString()}
          </button>
        ))}
      </div>
      <button style={s.cancelBtn} onClick={onCancelPayment}>
        キャンセル（返金）
      </button>
    </div>
  );
}

// ── Change Short ──────────────────────────────────────────────────────────────

function ChangeShortView({ screen, activeTransaction }: {
  screen: ScreenState;
  activeTransaction: ActiveTransaction | null;
}) {
  const total = activeTransaction?.totalAmount ?? cartTotal(screen.cart);
  const inserted = activeTransaction?.insertedAmount ?? screen.insertedAmount;
  const changeNeeded = inserted - total;

  return (
    <div style={s.errorView}>
      <div style={s.errorIcon}>💴</div>
      <div style={s.errorTitle}>釣銭補充をお待ちください</div>
      <div style={s.errorMsg}>
        おつり ¥{changeNeeded.toLocaleString()} の返却ができません。<br />
        店員が釣銭を補充します。
      </div>
      <div style={{ ...s.infoBox, marginTop: 16 }}>
        <div>投入金額: ¥{inserted.toLocaleString()}</div>
        <div>お支払い: ¥{total.toLocaleString()}</div>
        <div style={{ color: '#90ee90', fontWeight: 600 }}>
          取引は保持されています。補充後、自動で処理されます。
        </div>
      </div>
    </div>
  );
}

// ── Complete ──────────────────────────────────────────────────────────────────

function CompleteView({ screen, dispatch }: { screen: ScreenState; dispatch: Dispatch<Action> }) {
  return (
    <div style={s.completeView}>
      <div style={s.completeIcon}>✅</div>
      <div style={s.completeTitle}>ご注文ありがとうございました</div>
      <div style={s.displayNo}>お呼び出し番号</div>
      <div style={s.displayNoNum}>{screen.completedDisplayNo}</div>
      <div style={s.completeSub}>食券をお取りください</div>
      <button style={s.primaryBtn} onClick={() => dispatch({ type: 'RESET' })}>
        終了
      </button>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function BigBtn({ children, color, onClick }: { children: React.ReactNode; color: string; onClick: () => void }) {
  return (
    <button style={{ ...s.bigBtn, borderColor: color, color }} onClick={onClick}>
      {children}
    </button>
  );
}

function ItemCard({ name, price, badge, onClick }: { name: string; price: number; badge?: string; onClick: () => void }) {
  return (
    <button style={s.itemCard} onClick={onClick}>
      {badge && <span style={s.badge}>{badge}</span>}
      <div style={s.itemName}>{name}</div>
      <div style={s.itemPrice}>¥{price.toLocaleString()}</div>
    </button>
  );
}

function BackBar({ label, onClick }: { label: string; onClick: () => void }) {
  return <button style={s.backBar} onClick={onClick}>{label}</button>;
}

// ── Label helper ──────────────────────────────────────────────────────────────

function cartItemLabel(item: CartItem): string {
  switch (item.kind) {
    case 'ramen': return item.name;
    case 'side':  return item.name;
    case 'set':   return `${item.name}（${item.ramenName}）`;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  screen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#12122a',
  },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Idle
  idle: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', gap: 12, userSelect: 'none',
    animation: 'pulse 2s infinite',
  },
  idleTitle: { fontSize: 64 },
  idleMsg: { fontSize: 18, fontWeight: 600, color: '#eee', textAlign: 'center' },
  idleSub: { fontSize: 13, color: '#888' },

  // View container
  view: {
    flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflowY: 'auto',
  },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#a8d8ff', marginBottom: 4 },

  // Category
  categoryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  bigBtn: {
    padding: '24px 12px', border: '2px solid', borderRadius: 12, background: 'transparent',
    cursor: 'pointer', fontWeight: 700, fontSize: 16, textAlign: 'center', lineHeight: 1.4,
  },

  // Cart summary
  cartSummary: { marginTop: 'auto', borderTop: '1px solid #2d2d44', paddingTop: 12 },
  cartItems: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 },
  cartRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ccc' },
  cartTotal: { fontWeight: 700, fontSize: 16, color: '#e94560', marginBottom: 8 },
  removeBtn: {
    marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14,
  },

  // Item grid
  itemGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  itemCard: {
    background: '#1e1e3a', border: '1px solid #333', borderRadius: 8, padding: '14px 10px',
    cursor: 'pointer', textAlign: 'left', position: 'relative',
  },
  itemName: { fontWeight: 600, fontSize: 14, color: '#eee', marginTop: 4 },
  itemPrice: { fontSize: 13, color: '#a8d8ff', marginTop: 4 },
  badge: {
    display: 'inline-block', background: '#533483', color: '#ddd', fontSize: 10,
    padding: '2px 6px', borderRadius: 4, marginBottom: 4,
  },

  // Toppings
  toppingGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  toppingBtn: {
    background: '#1e1e3a', border: '1px solid #444', borderRadius: 8, padding: '10px 6px',
    cursor: 'pointer', color: '#ccc', fontSize: 13, textAlign: 'center', lineHeight: 1.4,
  },
  toppingSelected: {
    background: '#0f3460', border: '1px solid #4a90d9', color: '#fff',
  },
  draftSummary: {
    background: '#1e1e3a', borderRadius: 8, padding: 12, fontSize: 13, color: '#bbb',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  draftTotal: { fontWeight: 700, color: '#e94560', marginTop: 4 },

  // Cart review
  reviewList: { display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' },
  reviewItem: {
    background: '#1e1e3a', borderRadius: 8, padding: '10px 14px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  reviewName: { fontWeight: 600, fontSize: 14, color: '#eee' },
  reviewSub: { fontSize: 12, color: '#888' },
  reviewPrice: { fontSize: 14, color: '#a8d8ff', fontWeight: 600, alignSelf: 'flex-end' },
  totalBar: {
    background: '#0f3460', borderRadius: 8, padding: '12px 16px',
    fontSize: 18, fontWeight: 700, color: '#e94560', textAlign: 'right',
  },

  // Payment
  payHeader: {
    background: '#0f3460', borderRadius: 8, padding: '16px 20px', textAlign: 'center',
  },
  payLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  payTotal: { fontSize: 32, fontWeight: 700, color: '#e94560' },
  payStatus: {
    background: '#1e1e3a', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#ccc',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  cashGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  cashBtn: {
    background: '#16213e', border: '1px solid #4a90d9', borderRadius: 8, padding: '14px 0',
    color: '#a8d8ff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  cancelBtn: {
    background: 'none', border: '1px solid #555', borderRadius: 8, padding: '10px',
    color: '#888', cursor: 'pointer', fontSize: 13, marginTop: 4,
  },

  // Error / Change short
  errorView: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 24, gap: 16, textAlign: 'center',
  },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 20, fontWeight: 700, color: '#ffa500' },
  errorMsg: { fontSize: 14, color: '#bbb', lineHeight: 1.6 },
  infoBox: {
    background: '#1e1e3a', borderRadius: 8, padding: '12px 16px',
    fontSize: 13, color: '#ccc', width: '100%', display: 'flex', flexDirection: 'column', gap: 6,
  },

  // Complete
  completeView: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 24, gap: 12, textAlign: 'center',
  },
  completeIcon: { fontSize: 52 },
  completeTitle: { fontSize: 18, fontWeight: 600, color: '#eee' },
  displayNo: { fontSize: 13, color: '#888', marginTop: 8 },
  displayNoNum: {
    fontSize: 72, fontWeight: 700, color: '#e94560',
    border: '3px solid #e94560', borderRadius: 12, padding: '8px 32px',
  },
  completeSub: { fontSize: 13, color: '#aaa' },

  // Buttons
  primaryBtn: {
    background: '#e94560', border: 'none', borderRadius: 8, padding: '14px 0',
    color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%',
  },
  secondaryBtn: {
    background: '#333', border: '1px solid #555', borderRadius: 8, padding: '12px 24px',
    color: '#ccc', fontSize: 14, cursor: 'pointer',
  },
  backBar: {
    background: 'none', border: 'none', color: '#888', fontSize: 13,
    cursor: 'pointer', textAlign: 'left', padding: 0,
  },
};
