import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import PlannerPage from './pages/PlannerPage';
import RosterPage from './pages/RosterPage';
import HistoryPage from './pages/HistoryPage';
import ShareView from './pages/ShareView';

function AppShell() {
  const location = useLocation();
  const isShareView = location.pathname.startsWith('/share');

  return (
    <div className="h-full flex flex-col max-w-md mx-auto relative">
      <div className={`flex-1 overflow-hidden ${isShareView ? '' : 'pb-16'}`}>
        <Routes>
          <Route path="/" element={<PlannerPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/share/:data" element={<ShareView />} />
        </Routes>
      </div>
      {!isShareView && <Navigation />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
