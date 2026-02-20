import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  dietary_tags: string[] | null;
  available: boolean;
  max_quantity: number | null;
}

interface OrderItem {
  id: string;
  menu_item_id: string | null;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

const ORDER_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  placed: { color: 'text-gold', label: 'PLACED' },
  preparing: { color: 'text-teal-light', label: 'PREPARING' },
  ready: { color: 'text-gold', label: 'READY' },
  picked_up: { color: 'text-text-muted', label: 'PICKED UP' },
};

export default function FoodOrder() {
  const { getToken } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  // Cart state
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const [tab, setTab] = useState<'menu' | 'orders'>('menu');

  const fetchData = async () => {
    try {
      const token = await getToken();
      const statusRes = await apiFetch<{ enabled: boolean }>('/api/v1/food/status', {}, token);
      setEnabled(statusRes.enabled);

      if (!statusRes.enabled) {
        setLoading(false);
        return;
      }

      const [menuData, ordersData] = await Promise.all([
        apiFetch<MenuItem[]>('/api/v1/food/menu', {}, token),
        apiFetch<Order[]>('/api/v1/food/orders/me', {}, token),
      ]);
      setMenu(menuData);
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] && next[itemId] > 1) {
        next[itemId]--;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handlePlaceOrder = async () => {
    if (cartCount === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const token = await getToken();
      const items = Object.entries(cart).map(([menu_item_id, quantity]) => ({
        menu_item_id,
        quantity,
      }));
      await apiFetch<Order>(
        '/api/v1/food/orders',
        { method: 'POST', body: JSON.stringify({ items, notes: notes || null }) },
        token,
      );
      setCart({});
      setNotes('');
      setTab('orders');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 text-center font-mono text-sm text-text-muted">// loading menu...</div>
    );
  }

  if (!enabled) {
    return (
      <div className="mx-auto mt-8 max-w-md border border-base-border bg-base-card p-8 text-center">
        <p className="font-mono text-lg text-gold">&#9824; KITCHEN CLOSED &#9824;</p>
        <p className="mt-2 font-mono text-sm text-text-muted">
          Food ordering opens during the event. Check back when meal service begins.
        </p>
      </div>
    );
  }

  // Group menu by category
  const grouped: Record<string, MenuItem[]> = {};
  for (const item of menu) {
    const cat = item.category ?? 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-base-border">
        <button
          onClick={() => setTab('menu')}
          className={`px-4 py-2 font-mono text-xs tracking-wider transition-colors ${
            tab === 'menu'
              ? 'border-b-2 border-gold text-gold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          MENU {cartCount > 0 && `(${cartCount})`}
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 font-mono text-xs tracking-wider transition-colors ${
            tab === 'orders'
              ? 'border-b-2 border-gold text-gold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          MY ORDERS ({orders.length})
        </button>
      </div>

      {tab === 'menu' && (
        <>
          {menu.length === 0 ? (
            <div className="border border-base-border bg-base-card p-8 text-center">
              <p className="font-mono text-sm text-text-muted">// kitchen is closed</p>
              <p className="mt-1 font-mono text-xs text-text-muted">
                food ordering opens during the event
              </p>
            </div>
          ) : (
            <>
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-2 font-mono text-xs tracking-widest text-gold">
                    {'>'} {category.toUpperCase()}
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border border-base-border bg-base-card px-5 py-3 transition-colors hover:bg-base-dark"
                      >
                        <div className="flex-1">
                          <p className="font-display text-sm font-bold text-text-primary">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 font-mono text-xs text-text-muted">
                              {item.description}
                            </p>
                          )}
                          {item.dietary_tags && item.dietary_tags.length > 0 && (
                            <div className="mt-1 flex gap-1.5">
                              {item.dietary_tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-sm bg-base-dark px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex items-center gap-2">
                          {cart[item.id] ? (
                            <>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="h-7 w-7 border border-base-border bg-base-dark font-mono text-sm text-text-muted hover:text-text-primary"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono text-sm text-gold">
                                {cart[item.id]}
                              </span>
                              <button
                                onClick={() => addToCart(item.id)}
                                className="h-7 w-7 border border-base-border bg-base-dark font-mono text-sm text-text-muted hover:text-text-primary"
                              >
                                +
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addToCart(item.id)}
                              className="border border-gold/50 bg-gold/10 px-3 py-1 font-mono text-xs text-gold transition-colors hover:bg-gold/20"
                            >
                              ADD
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Cart footer */}
              {cartCount > 0 && (
                <div className="border border-gold/30 bg-base-card shadow-[0_0_15px_rgba(232,180,79,0.15)]">
                  <div className="border-b border-base-border bg-base-dark px-5 py-2">
                    <span className="font-mono text-xs tracking-widest text-gold">
                      YOUR ORDER // {cartCount} ITEMS
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special requests or notes..."
                      rows={2}
                      className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
                    />
                    <button
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="w-full border-2 border-gold bg-gold/10 px-6 py-3 font-mono text-sm font-bold tracking-wider text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(232,180,79,0.3)] disabled:opacity-50"
                    >
                      {placing ? '// PLACING ORDER...' : '$ PLACE_ORDER'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'orders' && (
        <>
          {orders.length === 0 ? (
            <div className="border border-base-border bg-base-card p-8 text-center">
              <p className="font-mono text-sm text-text-muted">// no orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.placed;
                return (
                  <div key={order.id} className="border border-base-border bg-base-card">
                    <div className="flex items-center justify-between border-b border-base-border bg-base-dark px-5 py-2">
                      <span className="font-mono text-xs text-text-muted">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`font-mono text-xs font-bold tracking-wider ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="px-5 py-3">
                      <p className="font-mono text-xs text-text-muted">
                        {order.items.length} item{order.items.length !== 1 && 's'} &middot;{' '}
                        {new Date(order.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      {order.notes && (
                        <p className="mt-1 font-mono text-xs text-text-muted italic">
                          {order.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
