import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import './i18n';
import './index.css';
import { API_MODE, fetchCategories } from './api';
import { syncCategoriesFromApi } from './data/categories';
import { ConfigurationRequired } from './ConfigurationRequired';
import { router } from './routes';
import { initSiteSettings } from './store/siteSettings';

// The storefront must never silently serve the bundled sample catalogue as if it were the real
// store. If the backend URL isn't configured, stop here with a clear error instead of booting.
if (API_MODE) initSiteSettings();

const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>{API_MODE ? <RouterProvider router={router} future={{ v7_startTransition: true }} /> : <ConfigurationRequired />}</StrictMode>,
  );

// Category names appear in the header menu on first paint, so load the live (translated) names
// first — but never hold the page back more than a moment if the API is slow.
if (API_MODE) void Promise.race([syncCategoriesFromApi(() => fetchCategories()), new Promise((r) => setTimeout(r, 1500))]).finally(render);
else render();
