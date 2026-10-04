export function PageState({ loading, error }) {
  if (loading) return <div className="page-state">Loading data…</div>;
  if (error) return <div className="page-state error">Could not load data: {error.message}</div>;
  return null;
}

export function RiskBadge({ level, size }) {
  return <span className={`badge badge-${level.toLowerCase()}${size === 'lg' ? ' badge-lg' : ''}`}>{level}</span>;
}

export function LogoIcon({ size = 20 }) {
  // Simple pulse/heartbeat line — reads clearly at small sizes on any background.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12h4l2.5-6 4 12 3-8 1.5 2H22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// X-axis tick: short date only ('03 Oct')
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

// Tooltip label: full date + time ('03 Oct, 14:30')
export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

// Hour tick: '07 Oct 18:00'
export const fmtDateHour = (iso) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${fmtDate(iso)} ${hh}:${mm}`;
};

export function buildTicks(rows, stepHours, plotWidth, pxPerTick = 90) {
  if (!rows || rows.length === 0) return [];
  const startMs = rows[0].timeMs;
  const endMs = rows[rows.length - 1].timeMs;

  let ticks = [];
  let t = new Date(startMs);
  if (stepHours === 24) {
    t.setHours(0, 0, 0, 0);
  } else {
    t.setHours(Math.floor(t.getHours() / stepHours) * stepHours, 0, 0, 0);
  }
  
  let currentMs = t.getTime();
  const stepMs = stepHours * 3600000;
  
  while (currentMs <= endMs) {
    if (currentMs >= startMs) {
      ticks.push(currentMs);
    }
    currentMs += stepMs;
  }
  
  const max = Math.max(2, Math.floor(plotWidth / pxPerTick));
  if (ticks.length > max) {
    const every = Math.ceil(ticks.length / max);
    ticks = ticks.filter((_, i) => i % every === 0);
  }
  return ticks;
}

export const getMachineCategory = (id) =>
  ['M1', 'M2', 'M3'].includes(id) ? 'Energy monitoring' : 'Predictive maintenance';

// Shared Recharts styling, kept in sync with the CSS variables in index.css.
export const chart = {
  grid: '#e5e8ef',
  axis: '#6b7280',
  accent: '#0875cc',
  medium: '#d97706',
  med: '#d97706',
  high: '#dc2626',
  tooltip: { background: '#fff', border: '1px solid #e5e8ef', borderRadius: 8, fontSize: 13 },
};
