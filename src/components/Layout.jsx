import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData.js';
import { LogoIcon } from './ui.jsx';

const links = [
  { to: '/overview', label: 'Overview' },
  { to: '/whatsapp', label: 'WhatsApp' },
  { to: '/savings', label: 'Savings' },
];

export default function Layout() {
  const { data } = useData();
  const { pathname } = useLocation();
  const firstMachine = data?.machineIds?.[0];

  return (
    <div className="app-shell">
      <div className="proto-banner" role="status" id="prototype-banner">
        <span className="pulse-dot" /> Prototype - public/simulated data
      </div>

      <header className="topnav">
        <NavLink to="/overview" className="brand" id="nav-brand">
          <span className="brand-mark"><LogoIcon /></span>
          <span className="brand-text">
            <strong>Urja Pulse</strong>
            <small>Team Voltaic</small>
          </span>
        </NavLink>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} id={`nav-${l.label.toLowerCase()}`}>
              {l.label}
            </NavLink>
          ))}
          {firstMachine && (
            <NavLink
              to={`/machine/${firstMachine}`}
              id="nav-machines"
              className={() => (pathname.startsWith('/machine') ? 'active' : '')}
            >
              Machines
            </NavLink>
          )}
        </nav>
      </header>

      <main className="page">
        <Outlet />
        <footer className="page-footer" id="app-footer">
          Urja Pulse prototype · public/simulated data
        </footer>
      </main>
    </div>
  );
}
