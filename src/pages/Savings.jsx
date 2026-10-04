import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import roi from '../roi_model.json';
import { chart } from '../components/ui.jsx';
import { ChartBox } from '../components/ChartBox.jsx';

// Every figure on this page comes from src/roi_model.json.
const { label, assumptions, base_case: base, waste_sensitivity, tariff_sensitivity } = roi;
const deviceCost = assumptions.device_cost_inr;

// Cumulative savings per machine: monthly_saving_inr x month, for months 1-12.
const monthlyData = Array.from({ length: 12 }, (_, i) => ({
  month: `Mo ${i + 1}`,
  cumulativeSavings: base.monthly_saving_inr * (i + 1),
}));

const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const months = (n) => `${Number(n).toFixed(1)} months`;

// Readable labels for assumption keys; unknown keys fall back to the raw key.
const ASSUMPTION_LABELS = {
  machine_kw: { label: 'Machine load', fmt: (v) => `${v} kW` },
  hours_per_day: { label: 'Operating hours per day', fmt: (v) => `${v} h` },
  days_per_month: { label: 'Operating days per month', fmt: (v) => `${v} days` },
  tariff_inr_per_kwh: { label: 'Electricity tariff', fmt: (v) => `₹${v} / kWh` },
  avoidable_waste_target_pct: { label: 'Avoidable waste target', fmt: (v) => `${v}%` },
  device_cost_inr: { label: 'Device cost per machine', fmt: inr },
};

function SetupCostLabel({ viewBox, value }) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const lx = x + 6;
  const ly = y - 6;
  const pad = { h: 5, v: 3 };
  const tw = value.length * 6.5;
  return (
    <g>
      <rect x={lx} y={ly - 12 - pad.v} width={tw + pad.h * 2} height={16 + pad.v * 2} rx={4}
        fill="white" stroke={chart.high} strokeWidth={1} />
      <text x={lx + pad.h} y={ly + 2} fill={chart.high} fontSize={11} fontWeight={600} textAnchor="start">
        {value}
      </text>
    </g>
  );
}

function Tile({ label, value, id }) {
  return (
    <div className="tile" id={id}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SensitivityTable({ id, title, firstHeader, firstKey, firstFmt, rows, baseValue }) {
  return (
    <section className="card sens-card" id={id}>
      <h2 className="card-title">{title}</h2>
      <div className="sens-scroll">
        <table className="sens-table">
          <thead>
            <tr>
              <th>{firstHeader}</th>
              <th>Monthly</th>
              <th>Annual</th>
              <th>Payback</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isBase = r[firstKey] === baseValue;
              return (
                <tr key={r[firstKey]} className={isBase ? 'is-base' : ''}>
                  <td>{firstFmt(r[firstKey])}</td>
                  <td>{inr(r.monthly_saving_inr)}</td>
                  <td>{inr(r.annual_saving_inr)}</td>
                  <td>{months(r.payback_months)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Savings() {
  return (
    <>
      <header className="page-head">
        <h1>Savings</h1>
        <p className="muted">Per-machine energy savings model.</p>
      </header>

      <div className="savings-disclaimer" id="savings-disclaimer" role="note">
        {label}
      </div>

      <section className="tiles savings-tiles-grid" id="savings-tiles">
        <Tile id="tile-device-cost" label="Device cost" value={inr(deviceCost)} />
        <Tile id="tile-monthly-saving" label="Monthly saving" value={inr(base.monthly_saving_inr)} />
        <Tile id="tile-annual-saving" label="Annual saving" value={inr(base.annual_saving_inr)} />
        <Tile id="tile-payback" label="Payback" value={months(base.payback_months)} />
      </section>

      <p className="savings-scope" id="savings-scope">
        Energy savings only. Predictive-maintenance benefits are not included.
      </p>

      <section className="card chart-card" id="savings-chart">
        <h2 className="card-title">Cumulative savings per machine vs device cost (12 months)</h2>
        <ChartBox height={240}>
          {(w, h) => (
            <BarChart width={w} height={h} data={monthlyData} margin={{ top: 24, right: 12, bottom: 32, left: 8 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="month"
                stroke={chart.axis}
                fontSize={12}
                label={{ value: 'Months after install', position: 'insideBottom', offset: -18, fontSize: 12, fill: chart.axis }}
              />
              <YAxis stroke={chart.axis} fontSize={12} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Tooltip contentStyle={chart.tooltip} formatter={(v) => [inr(v), 'Cumulative savings']} />
              <ReferenceLine
                y={deviceCost}
                stroke={chart.high}
                strokeDasharray="6 4"
                label={<SetupCostLabel value={`Device cost ${inr(deviceCost)}`} />}
              />
              <Bar dataKey="cumulativeSavings" fill={chart.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ChartBox>
      </section>

      <div className="sens-grid">
        <SensitivityTable
          id="savings-waste-sensitivity"
          title="Waste sensitivity"
          firstHeader="Waste"
          firstKey="waste_pct"
          firstFmt={(v) => `${v}%`}
          rows={waste_sensitivity}
          baseValue={assumptions.avoidable_waste_target_pct}
        />
        <SensitivityTable
          id="savings-tariff-sensitivity"
          title="Tariff sensitivity"
          firstHeader="Tariff"
          firstKey="tariff"
          firstFmt={(v) => `₹${v} / kWh`}
          rows={tariff_sensitivity}
          baseValue={assumptions.tariff_inr_per_kwh}
        />
      </div>

      <section className="card" id="savings-assumptions">
        <h2 className="card-title">Assumptions</h2>
        <ul className="assumptions-list">
          {Object.entries(assumptions).map(([key, value]) => {
            const meta = ASSUMPTION_LABELS[key];
            return (
              <li key={key}>
                <span className="assumption-label">{meta?.label ?? key}</span>
                <span className="assumption-value">{meta ? meta.fmt(value) : String(value)}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
