import { useEffect, useState } from 'react';

// public/data.json is a flat array of readings:
// { machine_id, timestamp, current_amps, vibration, anomaly_score,
//   risk_level: 'LOW' | 'MEDIUM' | 'HIGH', alert_message: string | null }

// Module-level cache: data.json is fetched exactly once per page load,
// no matter how many components or routes call useData().
let cache = null;
let pending = null;

// Group rows by machine (each sorted oldest -> newest) once, at load time.
function index(rows) {
  if (!Array.isArray(rows)) throw new Error('data.json must be an array of readings');
  const sorted = [...rows].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const byMachine = {};
  for (const row of sorted) (byMachine[row.machine_id] ??= []).push(row);
  const machineIds = Object.keys(byMachine).sort();
  return { rows: sorted, byMachine, machineIds };
}

function loadData() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load data.json (${res.status})`);
        return res.json();
      })
      .then((json) => {
        cache = index(json);
        return cache;
      })
      .catch((err) => {
        pending = null; // allow retry on next mount
        throw err;
      });
  }
  return pending;
}

/**
 * Returns { data, loading, error } where data is
 * { rows, byMachine: { [machine_id]: rows[] }, machineIds: string[] }.
 */
export function useData() {
  const [state, setState] = useState(() => ({
    data: cache,
    loading: !cache,
    error: null,
  }));

  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadData()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
