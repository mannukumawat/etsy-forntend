import { create } from "zustand";
import { API_MODE, fetchPublicSettings } from "@/api";
import { STORE } from "@/config/store";
import type { PublicSettingsResponse } from "@/api/types";

// Live store identity/contact/social/shipping, fetched once from the backend. NOT persisted — this is
// a per-session cache, re-fetched fresh on every app load so an admin edit always shows up on refresh.
// In mock mode (API_MODE false) this never fetches; every consumer keeps reading the static STORE
// config exactly as before.

type SiteSettingsState = Pick<PublicSettingsResponse, "store" | "currencies" | "shipping"> & { loaded: boolean };

const fallback: SiteSettingsState = {
  store: {
    name: STORE.name,
    tagline: STORE.tagline,
    logo: null,
    contact: STORE.contact,
    social: STORE.social,
  },
  currencies: [],
  shipping: { zones: [], unsupportedMessage: { en: "" } },
  loaded: !API_MODE,
};

export const useSiteSettings = create<SiteSettingsState>(() => fallback);

let started = false;
/** Called once from the app shell. Safe to call more than once — only the first call fetches. */
export function initSiteSettings() {
  if (!API_MODE || started) return;
  started = true;
  fetchPublicSettings()
    .then((data) => {
      useSiteSettings.setState({ store: data.store, currencies: data.currencies, shipping: data.shipping, loaded: true });
    })
    .catch(() => {
      // Keep the static fallback rather than leaving the UI stuck on a loading state.
      useSiteSettings.setState({ loaded: true });
    });
}
