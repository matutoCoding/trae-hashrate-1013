import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Actors from '@/pages/Actors';
import Formation from '@/pages/Formation';
import LoadCheck from '@/pages/LoadCheck';
import Stability from '@/pages/Stability';
import Library from '@/pages/Library';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/actors" replace />} />
          <Route path="actors" element={<Actors />} />
          <Route path="formation" element={<Formation />} />
          <Route path="load-check" element={<LoadCheck />} />
          <Route path="stability" element={<Stability />} />
          <Route path="library" element={<Library />} />
          <Route path="*" element={<Navigate to="/actors" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
