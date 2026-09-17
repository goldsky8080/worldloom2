import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyTheme } from './ui/theme/applyTheme';
import { GameErrorBoundary } from './ui/components/GameErrorBoundary';
import { App } from './app/router/App';
import { registerModules } from './modules/register';
import './ui/theme/game.css';
import './ui/theme/responsive.css';
applyTheme();
registerModules();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameErrorBoundary>
      <App />
    </GameErrorBoundary>
  </StrictMode>,
);
