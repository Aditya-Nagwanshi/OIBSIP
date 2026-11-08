import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Check, Loader2, Minus, PackagePlus, Pencil, Plus, RefreshCw, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/api';
import { formatINR } from '../../lib/format';
import { useSocket } from '../../contexts/SocketContext';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/ui/Modal';

const categories = [
  { id: 'all', label: 'All ingredients' },
  { id: 'base', label: 'Bases' },
  { id: 'sauce', label: 'Sauces' },
  { id: 'cheese', label: 'Cheeses' },
  { id: 'vegetable', label: 'Toppings' },
];

const categoryLabel = { base: 'Base', sauce: 'Sauce', cheese: 'Cheese', vegetable: 'Topping' };

const defaultForm = {
  category: 'vegetable',
  name: '',
  description: '',
  price: 49,
  stock: 50,
  unit: 'portion',
  lowStockThreshold: 15,
  emoji: '🍕',
  color: '#ffc53d',
  isAvailable: true,
};

function InventoryModal({ item, onClose, onSaved }) {
  const isNew = item === 'new';
  const [form, setForm] = useState(isNew ? defaultForm : {
    category: item.category,
    name: item.name,
    description: item.description || '',
    price: item.price,
    stock: item.stock,
    unit: item.unit || 'unit',
    lowStockThreshold: item.lowStockThreshold,
    emoji: item.emoji || '🍕',
    color: item.color || '#ffc53d',
    isAvailable: item.isAvailable,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    if (isNew) {
      try {
        const data = await api('/admin/inventory', { method: 'POST', body: payload });
        toast('Ingredient added to the pantry.', { tone: 'success' });
        onSaved(data.item);
      } catch (caught) {
        setError(caught.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    const updates = {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      lowStockThreshold: payload.lowStockThreshold,
      unit: payload.unit,
      emoji: payload.emoji,
      isAvailable: payload.isAvailable,
    };
    try {
      const data = await api(`/admin/inventory/${item.id}`, { method: 'PATCH', body: updates });
      toast('Inventory updated.', { tone: 'success' });
      onSaved(data.item);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={isNew ? 'Add an ingredient' : `Edit ${item.name}`}
      subtitle={isNew ? 'New pantry stock for the kitchen.' : 'Changes are applied immediately to new orders.'}
    >
      <form className="admin-form" onSubmit={submit}>
        {isNew ? (
          <label className="field">
            <span>Category</span>
            <select value={form.category} onChange={update('category')}>
              <option value="base">Base</option>
              <option value="sauce">Sauce</option>
              <option value="cheese">Cheese</option>
              <option value="vegetable">Topping</option>
            </select>
          </label>
        ) : (
          <div className="admin-form__category"><span>{categoryLabel[form.category]}</span> Category locked after creation</div>
        )}
        <div className="form-grid">
          <label className="field field--full">
            <span>Name</span>
            <input value={form.name} onChange={update('name')} placeholder="Smoked Pepperoni" required minLength={2} />
          </label>
          <label className="field field--full">
            <span>Description</span>
            <input value={form.description} onChange={update('description')} placeholder="Crispy-edged, smoky pepperoni cups." maxLength={280} />
          </label>
          <label className="field">
            <span>Price (₹)</span>
            <input type="number" min="0" step="1" value={form.price} onChange={update('price')} required />
          </label>
          <label className="field">
            <span>Unit</span>
            <input value={form.unit} onChange={update('unit')} placeholder="portion" />
          </label>
          <label className="field">
            <span>Stock</span>
            <input type="number" min="0" step="1" value={form.stock} onChange={update('stock')} required />
          </label>
          <label className="field">
            <span>Low-stock threshold</span>
            <input type="number" min="0" step="1" value={form.lowStockThreshold} onChange={update('lowStockThreshold')} required />
          </label>
          <label className="field">
            <span>Emoji</span>
            <input value={form.emoji} onChange={update('emoji')} maxLength={8} />
          </label>
          <label className="field">
            <span>Accent color</span>
            <input type="color" value={form.color} onChange={update('color')} disabled={!isNew} />
          </label>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={form.isAvailable} onChange={update('isAvailable')} />
          <span>Available for orders</span>
        </label>
        {error ? <p className="form-error"><AlertTriangle size={14} /> {error}</p> : null}
        <div className="admin-form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? <Loader2 size={15} className="spin" /> : isNew ? <PackagePlus size={15} /> : <Check size={15} />}
            {saving ? 'Saving…' : isNew ? 'Add ingredient' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');
  const { socket } = useSocket();
  const { toast } = useToast();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api('/admin/inventory');
      setItems(data.items);
      setLowStockCount(data.lowStockCount);
      setError('');
    } catch (caught) {
      if (!silent) setError(caught.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdated = ({ item }) => {
      if (!item) return;
      setItems((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
      setLowStockCount((current) => {
        const wasLow = items.find((entry) => entry.id === item.id)?.isLowStock;
        if (wasLow === item.isLowStock) return current;
        return Math.max(0, current + (item.isLowStock ? 1 : -1));
      });
    };
    socket.on('inventory:updated', onUpdated);
    return () => socket.off('inventory:updated', onUpdated);
  }, [socket, items]);

  const patch = async (item, changes, message) => {
    setBusyId(item.id);
    try {
      const data = await api(`/admin/inventory/${item.id}`, { method: 'PATCH', body: changes });
      setItems((current) => current.map((entry) => (entry.id === item.id ? data.item : entry)));
      if (message) toast(message, { tone: 'success' });
    } catch (caught) {
      toast(caught.message, { tone: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (onlyLow && !item.isLowStock) return false;
      if (search.trim() && !item.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, category, onlyLow, search]);

  const groupedCounts = useMemo(() => items.reduce((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] || 0) + 1;
    return accumulator;
  }, {}), [items]);

  const handleSaved = (saved) => {
    setItems((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved];
    });
    setEditing(null);
    load(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <p className="eyebrow">Pantry control</p>
          <h1>Inventory <em>lab.</em></h1>
          <p>Set stock levels, prices and thresholds. Paid orders reserve stock automatically.</p>
        </div>
        <div className="admin-page__head-actions">
          <button className="btn btn--ghost" onClick={() => load()}><RefreshCw size={15} /> Refresh</button>
          <button className="btn" onClick={() => setEditing('new')}><Plus size={16} /> Add ingredient</button>
        </div>
      </div>

      <div className="inventory-summary">
        <div><Boxes size={17} /><span><strong>{items.length}</strong> total ingredients</span></div>
        <div className={lowStockCount ? 'is-warn' : ''}><AlertTriangle size={17} /><span><strong>{lowStockCount}</strong> low stock</span></div>
        <div><span><strong>{groupedCounts.base || 0}</strong> bases</span><span><strong>{groupedCounts.sauce || 0}</strong> sauces</span><span><strong>{groupedCounts.cheese || 0}</strong> cheeses</span><span><strong>{groupedCounts.vegetable || 0}</strong> toppings</span></div>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-filter-tabs">
            {categories.map((entry) => (
              <button key={entry.id} className={category === entry.id ? 'is-active' : ''} onClick={() => setCategory(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>
          <div className="admin-toolbar__right">
            <button className={`admin-toggle-filter ${onlyLow ? 'is-active' : ''}`} onClick={() => setOnlyLow((value) => !value)}>
              <AlertTriangle size={14} /> Low only
            </button>
            <label className="admin-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an ingredient" />
            </label>
          </div>
        </div>

        {error ? (
          <div className="admin-empty-note admin-empty-note--error"><AlertTriangle size={16} /> {error}</div>
        ) : loading ? (
          <div className="admin-table-skeleton">{[0, 1, 2, 3, 4].map((key) => <div key={key} />)}</div>
        ) : visible.length === 0 ? (
          <div className="admin-empty">
            <Boxes size={26} />
            <h3>No ingredients in this view.</h3>
            <p>Change the filters or add a new ingredient.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table inventory-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className={item.isLowStock ? 'is-low' : ''}>
                    <td>
                      <div className="inventory-name">
                        <span className="inventory-name__emoji" style={{ background: `${item.color}33` }}>{item.emoji}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.description || item.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-cat">{categoryLabel[item.category]}</span></td>
                    <td>
                      <div className="stock-control">
                        <button onClick={() => patch(item, { adjustBy: -5 }, `${item.name} stock reduced by 5.`)} disabled={busyId === item.id || item.stock < 5} aria-label="Reduce stock by 5"><Minus size={12} /></button>
                        <strong className={item.isLowStock ? 'is-low' : ''}>{busyId === item.id ? <Loader2 size={13} className="spin" /> : item.stock}</strong>
                        <button onClick={() => patch(item, { adjustBy: 5 }, `${item.name} stock increased by 5.`)} disabled={busyId === item.id} aria-label="Increase stock by 5"><Plus size={12} /></button>
                        <small>{item.unit}</small>
                      </div>
                    </td>
                    <td>{item.lowStockThreshold}</td>
                    <td>{formatINR(item.price)}</td>
                    <td>
                      <button className={`availability ${item.isAvailable ? 'is-on' : ''}`} onClick={() => patch(item, { isAvailable: !item.isAvailable }, `${item.name} is now ${item.isAvailable ? 'unavailable' : 'available'}.`)} disabled={busyId === item.id}>
                        {item.isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        <span>{item.isAvailable ? 'On' : 'Off'}</span>
                      </button>
                    </td>
                    <td>
                      <button className="admin-row-open" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}><Pencil size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? <InventoryModal item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} /> : null}
    </div>
  );
}
