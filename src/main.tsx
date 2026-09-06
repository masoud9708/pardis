import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';

// Guard against third-party browser extension errors (such as MetaMask injecting in iframes)
if (typeof window !== 'undefined') {
  const isExtensionError = (err: unknown) => {
    if (!err) return false;
    const msg = String((err as any)?.message || (err as any)?.reason || err || '');
    const stack = String((err as any)?.stack || '');
    return (
      msg.includes('MetaMask') ||
      msg.includes('metamask') ||
      msg.includes('ethereum') ||
      msg.includes('evm') ||
      msg.includes('message port closed') ||
      msg.includes('Extension context invalidated') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://')
    );
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isExtensionError(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isExtensionError(event.error || event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

