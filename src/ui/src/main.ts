import { mount } from 'svelte';
import App from './App.svelte';
import './styles/app.css';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    try {
      const inv = (window as any).__TAURI_INTERNALS__?.invoke;
      if (inv) inv('log_from_js', { level: 'ERROR', msg: `Uncaught Error: ${e.message} at ${e.filename}:${e.lineno}` });
    } catch {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      const inv = (window as any).__TAURI_INTERNALS__?.invoke;
      if (inv) inv('log_from_js', { level: 'ERROR', msg: `Unhandled Rejection: ${String(e.reason)}` });
    } catch {}
  });
}

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
