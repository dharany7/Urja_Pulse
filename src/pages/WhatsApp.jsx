import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData.js';
import { PageState, RiskBadge, LogoIcon, fmtDateTime } from '../components/ui.jsx';

export default function WhatsApp() {
  const { data, loading, error } = useData();
  const [filter, setFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(8);

  const allAlerts = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.filter((r) => r.alert_message != null);
  }, [data]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'All') return allAlerts;
    return allAlerts.filter((r) => r.risk_level === filter);
  }, [allAlerts, filter]);

  if (!data) return <PageState loading={loading} error={error} />;

  const visibleAlerts = filteredAlerts.slice(-visibleCount);
  const hasEarlier = filteredAlerts.length > visibleCount;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setVisibleCount(8);
  };

  return (
    <>
      <header className="page-head">
        <h1>WhatsApp Alerts</h1>
        <p className="mockup-note" id="whatsapp-mockup-note">
          Mockup - not connected to real WhatsApp. Replies are not functional in this mockup.
        </p>
        <p className="muted">Messages generated from readings that carry an alert.</p>
      </header>

      <section className="phone">
        <div className="wa-head" id="wa-chat-header">
          <svg className="wa-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="wa-avatar"><LogoIcon size={18} /></span>
          <div className="wa-title">
            <strong>Urja Pulse Alerts</strong>
            <small>automated alerts</small>
          </div>
          <svg className="wa-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="5" r="1.8" fill="currentColor" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
            <circle cx="12" cy="19" r="1.8" fill="currentColor" />
          </svg>
        </div>

        <div className="wa-filters" role="group" aria-label="Filter alerts">
          {['All', 'HIGH', 'MEDIUM'].map((f) => (
            <button
              key={f}
              type="button"
              className={`wa-chip ${filter === f ? 'active' : ''}`}
              id={`wa-filter-${f.toLowerCase()}`}
              onClick={() => handleFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="chat">
          {hasEarlier && (
            <div className="wa-show-more-wrap">
              <button
                type="button"
                className="wa-show-more"
                id="wa-show-earlier"
                onClick={() => setVisibleCount((c) => c + 8)}
              >
                Show earlier alerts
              </button>
            </div>
          )}
          {visibleAlerts.length === 0 && <p className="muted center">No alerts found.</p>}
          {visibleAlerts.map((r) => (
            <div
              key={`${r.machine_id}-${r.timestamp}`}
              className={`bubble risk-${r.risk_level.toLowerCase()}`}
              id={`wa-msg-${r.machine_id}-${r.timestamp}`}
            >
              <p>{r.alert_message}</p>
              <div className="bubble-meta">
                <Link to={`/machine/${r.machine_id}`}>{r.machine_id}</Link>
                <RiskBadge level={r.risk_level} />
                <span>{fmtDateTime(r.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
