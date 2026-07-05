import { render } from 'preact';
import { App } from './app/App';
import { WikiProvider } from './context/WikiContext';
import { DetailProvider } from './context/DetailContext';
import { DeepLinkHandler } from './hooks/DeepLinkHandler';
import './styles/global.css';

try {
  render(
    <WikiProvider>
      <DetailProvider>
        <DeepLinkHandler />
        <App />
      </DetailProvider>
    </WikiProvider>,
    document.getElementById('app')!,
  );
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  document.getElementById('app')!.innerHTML = `
    <div style="padding:2rem;font-family:monospace;color:#c9a24b">
      <h2>Opala Wiki</h2>
      <p>${msg}</p>
      <p>Execute: <code>npm run seed</code></p>
    </div>`;
}
