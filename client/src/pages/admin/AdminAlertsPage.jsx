import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, BellRing, CheckCircle2, Clock3, Mail, RefreshCw, Send, ServerCrash, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, timeAgo } from '../../lib/format';
import { useToast } from '../../contexts/ToastContext';

const statusMeta = {
  sent: { label: 'Sent', icon: CheckCircle2, tone: 'good' },
  outbox: { label: 'Outbox', icon: Mail, tone: 'info' },
  failed: { label: 'Failed', icon: XCircle, tone: 'bad' },
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [lowItems, setLowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [alertData, inventoryData] = await Promise.all([
        api('/admin/alerts'),
        api('/admin/inventory'),
      ]);
      setAlerts(alertData.alerts);
      setLowItems(inventoryData.items.filter((item) => item.isLowStock));
    } catch (caught) {
      setError(caught.message || 'Could not load stock alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runCheck = async () => {
    setRunning(true);
    setCheckResult(null);
    try {
      const data = await api('/admin/alerts/check', { method: 'POST', body: { force: true } });
      setCheckResult(data);
      toast(data.message, { tone: data.sent ? 'success' : 'info', title: 'Stock check complete' });
      load();
    } catch (caught) {
      toast(caught.message, { tone: 'error' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <p className="eyebrow">Pantry watch</p>
          <h1>Stock <em>alerts.</em></h1>
          <p>Automatic low-stock signals with a six-hour cooldown, plus every alert ever sent.</p>
        </div>
        <button className="btn" onClick={runCheck} disabled={running}>
          {running ? <RefreshCw size={15} className="spin" /> : <BellRing size={15} />}
          {running ? 'Checking pantry…' : 'Run stock check'}
        </button>
      </div>

      {checkResult ? (
        <div className="notice notice--success">
          <CheckCircle2 size={18} />
          <div>
            <strong>{checkResult.message}</strong>
            {checkResult.lowItems?.length ? (
              <p>Detected: {checkResult.lowItems.map((item) => item.name).join(', ')}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="admin-alerts-grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Currently low</h2>
              <p>Items at or below their threshold.</p>
            </div>
            <span className="admin-panel__badge"><AlertTriangle size={13} /> {lowItems.length}</span>
          </div>
          {error ? <p className="admin-empty-note admin-empty-note--error">{error}</p> : null}
          {!error && loading ? <p className="admin-empty-note">Reading stock levels…</p> : null}
          {!loading && !lowItems.length ? (
            <div className="admin-empty"><span className="admin-empty__emoji">🌿</span><h3>Pantry is healthy.</h3><p>No ingredient is below threshold right now.</p></div>
          ) : (
            <div className="low-list">
              {lowItems.map((item) => (
                <div className="low-list__row" key={item.id}>
                  <span className="low-list__emoji" style={{ background: `${item.color}33` }}>{item.emoji}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.category} · threshold {item.lowStockThreshold} {item.unit}</small>
                  </div>
                  <span className={`low-list__stock ${item.stock === 0 ? 'is-empty' : ''}`}>{item.stock} left</span>
                  <div className="low-list__meter"><div style={{ width: `${Math.min(100, (item.stock / Math.max(1, item.lowStockThreshold)) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          <div className="admin-panel__foot">
            <span><Clock3 size={13} /> The scheduler runs every five minutes in dev.</span>
            <a className="link-arrow" href="#history">Alert history <ArrowRight size={13} /></a>
          </div>
        </section>

        <section className="admin-panel admin-panel--info">
          <div className="admin-panel__head">
            <div>
              <h2>Delivery channel</h2>
              <p>Where low-stock emails are routed.</p>
            </div>
          </div>
          <div className="channel-card">
            <span className="channel-card__icon"><Mail size={22} /></span>
            <div>
              <strong>Admin email</strong>
              <p>Alerts go to the configured admin address. Without SMTP they are written to the server outbox and surfaced here.</p>
            </div>
          </div>
          <ul className="channel-list">
            <li><CheckCircle2 size={14} /> Immediate check after stock changes</li>
            <li><CheckCircle2 size={14} /> Scheduled cron sweep every 5 minutes</li>
            <li><Clock3 size={14} /> 6-hour cooldown per item</li>
            <li><ServerCrash size={14} /> Failed sends are logged with the error</li>
          </ul>
          <p className="channel-hint">Demo mode writes email files to <code>server/logs/outbox</code>.</p>
        </section>
      </div>

      <section className="admin-panel" id="history">
        <div className="admin-panel__head">
          <div>
            <h2>Alert history</h2>
            <p>Last 30 low-stock notifications.</p>
          </div>
          <button className="link-arrow" onClick={load}><RefreshCw size={14} /> Refresh</button>
        </div>
        {loading ? (
          <p className="admin-empty-note">Loading alerts…</p>
        ) : !alerts.length ? (
          <div className="admin-empty"><Send size={26} /><h3>No alerts sent yet.</h3><p>Run a stock check to trigger the first one.</p></div>
        ) : (
          <div className="alert-history">
            {alerts.map((alert) => {
              const meta = statusMeta[alert.status] || statusMeta.outbox;
              const Icon = meta.icon;
              return (
                <article className="alert-card" key={alert.id}>
                  <span className={`alert-card__status alert-card__status--${meta.tone}`}><Icon size={14} /> {meta.label}</span>
                  <div className="alert-card__body">
                    <h3>{alert.subject}</h3>
                    <p>
                      {alert.items.map((item) => `${item.name} (${item.stock} left)`).join(' · ')}
                    </p>
                    {alert.error ? <p className="alert-card__error">{alert.error}</p> : null}
                    <div className="alert-card__meta">
                      <span><Mail size={12} /> {alert.recipient}</span>
                      <span><Clock3 size={12} /> {timeAgo(alert.sentAt)} · {formatDate(alert.sentAt)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
