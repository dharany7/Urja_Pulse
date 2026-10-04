import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Overview from './pages/Overview.jsx';
import Machine from './pages/Machine.jsx';
import WhatsApp from './pages/WhatsApp.jsx';
import Savings from './pages/Savings.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/machine/:id" element={<Machine />} />
        <Route path="/whatsapp" element={<WhatsApp />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
}
