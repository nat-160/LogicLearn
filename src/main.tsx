import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles/themes.css';
import './styles/app.css';
import { App } from './app/App';
import { IS_TEST_VERSION } from './app/site';
import { startApplyingPreferences } from './settings/display';

// Apply the student's theme, font and language before the first render (no flash).
startApplyingPreferences();

// Tell the test version apart in browser tabs and history too.
if (IS_TEST_VERSION) document.title = 'LogicLearn (test version)';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
