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

if (API_MODE) {
  initSiteSettings();
}

const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>{API_MODE ? <RouterProvider router={router} future={{ v7_startTransition: true }} /> : <ConfigurationRequired />}</StrictMode>,
  );

if (API_MODE) {
  void Promise.race([syncCategoriesFromApi(() => fetchCategories()), new Promise((r) => setTimeout(r, 1500))]).finally(render);
} else {
  render();
}
