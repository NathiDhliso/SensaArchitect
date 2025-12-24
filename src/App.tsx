import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SettingsPanel } from './components/settings';

const Home = lazy(() => import('./pages/Home'));
const Generate = lazy(() => import('./pages/Generate'));
const Results = lazy(() => import('./pages/Results'));
const Settings = lazy(() => import('./pages/Settings'));
const Learn = lazy(() => import('./pages/Learn'));
const SavedResults = lazy(() => import('./pages/SavedResults'));
const Palace = lazy(() => import('./pages/Palace'));
const Sprint = lazy(() => import('./pages/Sprint'));
const SprintResults = lazy(() => import('./pages/SprintResults'));

function LoadingFallback() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p>Loading...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate/:subject" element={<Generate />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/saved" element={<SavedResults />} />
          <Route path="/palace" element={<Palace />} />
          <Route path="/sprint" element={<Sprint />} />
          <Route path="/sprint-results" element={<SprintResults />} />
        </Routes>
        <SettingsPanel />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

