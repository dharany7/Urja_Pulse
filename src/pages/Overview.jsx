import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useData } from '../hooks/useData.js';
import { PageState, RiskBadge, fmtDate, fmtDateTime, buildTicks, chart, getMachineCategory } from '../components/ui.jsx';
import { ChartBox } from '../components/ChartBox.jsx';

export default function Overview() {
  const { data, loading, error } = useData();
  if (!data) return <PageState loading={loading} error={error} />;

  const { byMachine, machineIds } = data;
  const count = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const id of machineIds) {
    const rl = byMachine[id].at(-1).risk_level;
    count[rl] = (count[rl] ?? 0) + 1;
  }
  const summary = `${count.HIGH} need attention (HIGH), ${count.MEDIUM} on watch (MEDIUM), ${count.LOW} healthy (LOW)`;

  return (
    <>
      <header className="page-head">
        <h1>Overview</h1>
        <p className="muted">Latest reading per machine.</p>
      </header>

      <p className="summary" id="overview-summary">{summary}</p>

      <section className="machine-grid">
        {machineIds.map((id) => {
          const allReadings = byMachine[id];
          const latestRaw = allReadings.at(-1);
          const latestTime = new Date(latestRaw.timestamp).getTime();
          const readings = allReadings
            .filter((r) => new Date(r.timestamp).getTime() >= latestTime - 72 * 3600000)
            .map((r) => ({ ...r, timeMs: new Date(r.timestamp).getTime() }));
          const latest = readings.at(-1);
          const category = getMachineCategory(id);
          const isEnergy = category === 'Energy monitoring';
          const riskClass = latest.risk_level.toLowerCase();
          const currentLabel = isEnergy ? 'Current (A, estimated)' : 'Current (torque proxy)';
          const currentValue = isEnergy ? `${latest.current_amps} A` : latest.current_amps;

          return (
            <Link
              key={id}
              to={`/machine/${id}`}
              className={`card machine-card risk-${riskClass}`}
              id={`machine-card-${id}`}
            >
              <div className="row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                  <h2 className="machine-id">{id}</h2>
                  <span className="machine-tag">{category}</span>
                </div>
                <RiskBadge level={latest.risk_level} />
              </div>

              <dl className={`stats ${isEnergy ? 'two-col' : ''}`}>
                <div>
                  <dt>{currentLabel}</dt>
                  <dd>{currentValue}</dd>
                </div>
                {!isEnergy && (
                  <div>
                    <dt>Vibration (tool-wear proxy)</dt>
                    <dd>{latest.vibration}</dd>
                  </div>
                )}
                <div>
                  <dt>Anomaly score</dt>
                  <dd>{latest.anomaly_score}</dd>
                </div>
              </dl>

              <ChartBox height={160}>
                {(w, h) => (
                  <LineChart
                    width={w}
                    height={h}
                    data={readings}
                    margin={{ top: 6, right: 0, bottom: 0, left: -24 }}
                  >
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      dataKey="timeMs"
                      ticks={buildTicks(readings, 24, w - 40, 60)}
                      interval={0}
                      tickFormatter={fmtDate}
                      stroke={chart.axis}
                      fontSize={11}
                    />
                    <YAxis stroke={chart.axis} fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={chart.tooltip}
                      labelFormatter={fmtDateTime}
                      formatter={(v) => [v, currentLabel]}
                    />
                    <Line
                      type="monotone"
                      dataKey="current_amps"
                      stroke={chart.accent}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ChartBox>

              <small className="muted">Updated {fmtDateTime(latest.timestamp)}</small>
            </Link>
          );
        })}
      </section>
    </>
  );
}
