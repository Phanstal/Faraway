import { StrictMode } from 'react';
import { Capacitor } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles.css';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
