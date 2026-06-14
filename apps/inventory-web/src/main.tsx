import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/ibm-plex-mono/500.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Inventory root element was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
