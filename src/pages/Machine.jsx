import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useData } from '../hooks/useData.js';
import { PageState, RiskBadge, fmtDate, fmtDateHour, fmtDateTime, buildTicks, chart, getMachineCategory } from '../components/ui.jsx';
import { ChartBox } from '../components/ChartBox.jsx';

/** Plain-language explanation for Why flagged */
function whyFlagged(latest) {
  if (!latest || latest.risk_level === 'LOW') return 'Readings are normal.';
  return latest.alert_message || 'Readings are normal.';
}

// Range chips. days = window length before the machine's latest reading.
// stepHours = tick spacing; 7 days -> one tick per day, otherwise hour ticks.
const RANGES = [
  { key: '24h', label: 'Last 24 h', hours: 24, stepHours: 4 },
  { key: '3d', label: 'Last 3 days', hours: 72, stepHours: 12 },
  { key: '7d', label: 'Last 7 days', hours: 168, stepHours: 24 },
];

function SeriesChart({ title, rows, dataKey, unit, domain, range, marginRight = 0, children }) {
  return (
    <section className="card chart-card">
      <h2 className="card-title">{title}</h2>
      <ChartBox height={240}>
        {(w, h) => (
          <LineChart width={w} height={h} data={rows} margin={{ top: 8, right: marginRight, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              dataKey="timeMs"
              ticks={buildTicks(rows, range.stepHours, w - marginRight - 20, range.stepHours === 24 ? 60 : 100)}
              interval={0}
              tickFormatter={range.stepHours === 24 ? fmtDate : fmtDateHour}
              stroke={chart.axis}
              fontSize={12}
            />
            <YAxis stroke={chart.axis} fontSize={12} domain={domain} />
            <Tooltip
              contentStyle={chart.tooltip}
              labelFormatter={fmtDateTime}
              formatter={(v) => [unit ? `${v} ${unit}` : v, title]}
            />
            {children}
            <Line type="monotone" dataKey={dataKey} stroke={chart.accent} strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ChartBox>
    </section>
  );
}

export default function Machine() {
  const { id } = useParams();
  const { data, loading, error } = useData();
  const [rangeKey, setRangeKey] = useState('24h');
  if (!data) return <PageState loading={loading} error={error} />;

  const allRows = data.byMachine[id];
  const range = RANGES.find((r) => r.key === rangeKey);
  const rows = allRows && allRows.filter(
    (r) => new Date(r.timestamp) >= new Date(allRows.at(-1).timestamp) - range.hours * 3600000,
  ).map((r) => ({ ...r, timeMs: new Date(r.timestamp).getTime() }));
  if (!allRows) {
    return (
      <div className="page-state">
        Machine “{id}” not found. <Link to="/overview">Back to overview</Link>
      </div>
    );
  }
  const latest = allRows.at(-1);
  const risk = latest.risk_level.toLowerCase();
  const category = getMachineCategory(id);
  const isEnergy = category === 'Energy monitoring';

  const mediumThreshold = 0.3;
  const highThreshold = isEnergy ? 0.5 : 0.7;

  return (
    <>
      <nav className="machine-tabs">
        {data.machineIds.map((mid) => (
          <Link key={mid} to={`/machine/${mid}`} className={mid === id ? 'active' : ''} id={`machine-tab-${mid}`}>
            {mid}
          </Link>
        ))}
      </nav>

      <header className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
          <h1>{id}</h1>
          <span className="machine-tag">{category}</span>
          <RiskBadge level={latest.risk_level} size="lg" />
        </div>
        <p className="muted">Latest reading {fmtDateTime(latest.timestamp)}</p>
      </header>

      <section className={`why-box risk-${risk}`} id="why-flagged">
        <h2>Why flagged</h2>
        <p>{whyFlagged(latest)}</p>
      </section>

      <p className="proxy-note" id="machine-proxy-note">
        Simulated/public data; values are estimates or proxies, not live sensor readings.
      </p>

      {isEnergy ? (
        <section className="tiles two-col">
          <div className="tile" id="tile-current">
            <span>Current (A, estimated)</span>
            <strong>{latest.current_amps} A</strong>
          </div>
          <div className="tile" id="tile-anomaly">
            <span>Anomaly score</span>
            <strong>{latest.anomaly_score}</strong>
          </div>
        </section>
      ) : (
        <section className="tiles">
          <div className="tile" id="tile-current">
            <span>Current (torque proxy)</span>
            <strong>{latest.current_amps}</strong>
          </div>
          <div className="tile" id="tile-vibration">
            <span>Vibration (tool-wear proxy)</span>
            <strong>{latest.vibration}</strong>
          </div>
          <div className="tile" id="tile-anomaly">
            <span>Anomaly score</span>
            <strong>{latest.anomaly_score}</strong>
          </div>
        </section>
      )}

      <div className="range-chips" role="group" aria-label="Chart range" id="range-chips">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            id={`range-${r.key}`}
            className={`wa-chip ${rangeKey === r.key ? 'active' : ''}`}
            onClick={() => setRangeKey(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isEnergy ? (
        <SeriesChart
          title="Current (A, estimated)"
          rows={rows}
          range={range}
          dataKey="current_amps"
          unit="A"
          domain={['auto', 'auto']}
        />
      ) : (
        <>
          <SeriesChart
            title="Current (torque proxy)"
            rows={rows}
            range={range}
            dataKey="current_amps"
            domain={['auto', 'auto']}
          />
          <SeriesChart
            title="Vibration (tool-wear proxy)"
            rows={rows}
            range={range}
            dataKey="vibration"
            domain={['auto', 'auto']}
          />
        </>
      )}

      <SeriesChart title="Anomaly score" rows={rows} range={range} dataKey="anomaly_score" domain={[0, 1]} marginRight={90}>
        <ReferenceLine
          y={highThreshold}
          stroke={chart.high}
          strokeDasharray="6 4"
          label={{
            value: `HIGH (${highThreshold})`,
            position: 'right',
            fill: chart.high,
            fontSize: 11,
          }}
        />
        <ReferenceLine
          y={mediumThreshold}
          stroke={chart.medium}
          strokeDasharray="6 4"
          label={{
            value: `MEDIUM (${mediumThreshold})`,
            position: 'right',
            fill: chart.medium,
            fontSize: 11,
          }}
        />
      </SeriesChart>
    </>
  );
}
