import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles/themes.css';
import './styles/app.css';
import { App } from './app/App';
import { startApplyingPreferences } from './settings/display';

// Apply the student's theme, font and language before the first render (no flash).
startApplyingPreferences();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
