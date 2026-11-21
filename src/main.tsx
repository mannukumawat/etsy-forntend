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

// Never hold the first paint behind an API request. Static category metadata renders immediately;
// live data replaces it in the background when available.
render();

if (API_MODE) {
  void syncCategoriesFromApi(() => fetchCategories());
  // No catalogue preload here: the homepage renders from the lightweight
  // item-groups endpoint, and every catalogue consumer (Shop, search,
  // related products) fetches on demand through the 15 s cached fetchCatalog
  // below, so preloading 200 products on every home visit only burns
  // bandwidth for visitors who never open the shop. Product detail is still
  // prefetched on hover/focus in ProductCard.
}
