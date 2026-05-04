import { useReducer, useState, useEffect, useCallback } from 'react';
import { createTransactionId, createOrderId, formatDisplayNo } from './domain';
import type { TransactionId, OrderId, DisplayNo } from './domain';
import { screenReducer, INITIAL_SCREEN } from './machine';
import type { ScreenState } from './machine';
import {
  loadState, saveState, cartTotal,
  type PersistedState, type ActiveTransaction, type KitchenOrder,
} from './storage';
import { KioskScreen } from './KioskScreen';
import { MaintenancePanel } from './MaintenancePanel';
import { KitchenQueue } from './KitchenQueue';

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const STORE_ID = 'SA012';
const KIOSK_ID = 'K01';
const MIN_CHANGE_BUFFER = 500; // yen: minimum stock before accepting payment

export default function App() {
  const [screen, dispatch] = useReducer(screenReducer, INITIAL_SCREEN);
  const [persisted, setPersisted] = useState<PersistedState>(() => loadState());

  // Sync persisted state to localStorage whenever it changes
  useEffect(() => {
    saveState(persisted);
  }, [persisted]);

  // On mount: if there's an unfinished transaction, restore the kiosk screen
  useEffect(() => {
    const { activeTransaction } = persisted;
    if (activeTransaction && activeTransaction.status !== 'complete') {
      dispatch({ type: 'RESTORE_FROM_TRANSACTION', transaction: activeTransaction });
    }
  }, []); // intentionally run once on mount

  // ── Precheck & payment start ────────────────────────────────────────────────

  const handleConfirmOrder = useCallback(() => {
    const total = cartTotal(screen.cart);
    if (total === 0) return;

    if (persisted.changeStockYen < MIN_CHANGE_BUFFER) {
      dispatch({ type: 'PRECHECK_FAIL', reason: '釣銭が不足しています。店員をお呼びください。' });
      return;
    }

    const seq = persisted.orderSeq;
    const transactionId = createTransactionId(TODAY, STORE_ID, KIOSK_ID, seq) as TransactionId;
    const newTransaction: ActiveTransaction = {
      transactionId,
      cart: screen.cart,
      totalAmount: total,
      insertedAmount: 0,
      status: 'paying',
      createdAt: new Date().toISOString(),
    };

    setPersisted(p => ({ ...p, activeTransaction: newTransaction, orderSeq: seq + 1 }));
    dispatch({ type: 'PRECHECK_OK' });
  }, [screen.cart, persisted.changeStockYen, persisted.orderSeq]);

  // ── Cash insertion ──────────────────────────────────────────────────────────

  const handleInsertCash = useCallback((amount: number) => {
    if (!persisted.activeTransaction) return;

    const newInserted = persisted.activeTransaction.insertedAmount + amount;
    const { totalAmount } = persisted.activeTransaction;

    const updatedTx: ActiveTransaction = {
      ...persisted.activeTransaction,
      insertedAmount: newInserted,
    };

    if (newInserted >= totalAmount) {
      const changeNeeded = newInserted - totalAmount;

      if (changeNeeded > persisted.changeStockYen) {
        // Not enough change → pause, wait for maintenance
        const pausedTx: ActiveTransaction = { ...updatedTx, status: 'change_short' };
        setPersisted(p => ({ ...p, activeTransaction: pausedTx }));
        dispatch({ type: 'CHANGE_SHORT' });
        return;
      }

      // Payment complete
      completePayment(updatedTx, changeNeeded);
    } else {
      // Still need more money
      setPersisted(p => ({ ...p, activeTransaction: updatedTx }));
      dispatch({ type: 'INSERT_CASH', amount });
    }
  }, [persisted]);

  // ── Payment completion ──────────────────────────────────────────────────────

  const completePayment = useCallback((tx: ActiveTransaction, changeNeeded: number) => {
    const displaySeq = persisted.displaySeq;
    const displayNo = formatDisplayNo(displaySeq) as DisplayNo;
    const orderId = createOrderId(TODAY, STORE_ID, displaySeq) as OrderId;

    const completedTx: ActiveTransaction = {
      ...tx,
      status: 'complete',
      orderId,
      displayNo,
    };

    const kitchenOrder: KitchenOrder = {
      orderId,
      displayNo,
      cart: tx.cart,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    setPersisted(p => ({
      ...p,
      activeTransaction: null,
      kitchenQueue: [...p.kitchenQueue, kitchenOrder],
      changeStockYen: p.changeStockYen - changeNeeded,
      displaySeq: displaySeq + 1,
    }));

    dispatch({ type: 'PAYMENT_COMPLETE', displayNo });
    void completedTx; // used for orderId
  }, [persisted.displaySeq, persisted.changeStockYen]);

  // ── Cancel payment (return money) ───────────────────────────────────────────

  const handleCancelPayment = useCallback(() => {
    setPersisted(p => ({ ...p, activeTransaction: null }));
    dispatch({ type: 'CANCEL_PAYMENT' });
  }, []);

  // ── Maintenance: add change stock ───────────────────────────────────────────

  const handleAddChange = useCallback((amount: number) => {
    setPersisted(p => {
      const newStock = p.changeStockYen + amount;
      // If there's a paused transaction waiting for change, try to complete it now
      if (p.activeTransaction?.status === 'change_short') {
        const tx = p.activeTransaction;
        const changeNeeded = tx.insertedAmount - tx.totalAmount;
        if (changeNeeded <= newStock) {
          // Can now complete — will be handled by the effect below
          return { ...p, changeStockYen: newStock };
        }
      }
      return { ...p, changeStockYen: newStock };
    });
  }, []);

  // When change stock is refilled and there's a change_short transaction, try completing
  useEffect(() => {
    const tx = persisted.activeTransaction;
    if (!tx || tx.status !== 'change_short') return;
    const changeNeeded = tx.insertedAmount - tx.totalAmount;
    if (changeNeeded <= persisted.changeStockYen) {
      completePayment(tx, changeNeeded);
    }
  }, [persisted.changeStockYen]); // intentionally only watch changeStockYen

  // ── Kitchen queue actions ───────────────────────────────────────────────────

  const handleKitchenStatusChange = useCallback((orderId: string, status: KitchenOrder['status']) => {
    setPersisted(p => ({
      ...p,
      kitchenQueue: p.kitchenQueue.map(o =>
        o.orderId === orderId ? { ...o, status } : o
      ),
    }));
  }, []);

  const handleClearKitchenQueue = useCallback(() => {
    setPersisted(p => ({
      ...p,
      kitchenQueue: p.kitchenQueue.filter(o => o.status !== 'called'),
    }));
  }, []);

  // ── Debug reset ─────────────────────────────────────────────────────────────

  const handleDebugReset = useCallback(() => {
    setPersisted({ ...loadState(), changeStockYen: 3000, kitchenQueue: [], activeTransaction: null });
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>🍜 ラーメン券売機シミュレーター</span>
        <span style={styles.headerSub}>SA012 / KIOSK-01</span>
        <button onClick={handleDebugReset} style={styles.resetBtn}>リセット</button>
      </header>

      <div style={styles.panels}>
        <section style={styles.panel}>
          <h2 style={styles.panelHeading}>券売機</h2>
          <KioskScreen
            screen={screen}
            activeTransaction={persisted.activeTransaction}
            dispatch={dispatch}
            onConfirmOrder={handleConfirmOrder}
            onInsertCash={handleInsertCash}
            onCancelPayment={handleCancelPayment}
          />
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelHeading}>保守パネル</h2>
          <MaintenancePanel
            changeStockYen={persisted.changeStockYen}
            activeTransaction={persisted.activeTransaction}
            screen={screen}
            onAddChange={handleAddChange}
          />
        </section>

        <section style={{ ...styles.panel, ...styles.kitchenPanel }}>
          <h2 style={styles.panelHeading}>厨房キュー</h2>
          <KitchenQueue
            orders={persisted.kitchenQueue}
            onStatusChange={handleKitchenStatusChange}
            onClearCalled={handleClearKitchenQueue}
          />
        </section>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: '"Hiragino Sans", "Noto Sans JP", sans-serif',
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#eee',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#16213e',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '2px solid #e94560',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e94560',
    flex: 1,
  },
  headerSub: {
    fontSize: 12,
    color: '#888',
  },
  resetBtn: {
    background: '#333',
    color: '#ccc',
    border: '1px solid #555',
    borderRadius: 4,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 12,
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px 1fr',
    gap: 0,
    flex: 1,
    minHeight: 0,
  },
  panel: {
    borderRight: '1px solid #2d2d44',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  kitchenPanel: {
    borderRight: 'none',
  },
  panelHeading: {
    margin: 0,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    background: '#0f3460',
    color: '#a8d8ff',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #2d2d44',
  },
};

// Export for tests
export type { ScreenState };
