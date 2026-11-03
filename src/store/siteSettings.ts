import { create } from "zustand";
import { fetchPublicSettings } from "@/api";
import type { PublicSettingsResponse } from "@/api/types";

// Live store identity, currencies, and shipping — fetched once from `/api/settings` on app boot.
// Every consumer reads from this store or from the module-level synced data in data/ files.

type SiteSettingsState = Pick<PublicSettingsResponse, "store" | "currencies" | "shipping"> & { loaded: boolean };

const fallback: SiteSettingsState = {
  store: {
    name: "",
    tagline: { en: "" },
    logo: null,
    contact: { email: "", phone: "", address: "", hours: { en: "" } },
    social: { instagram: "", pinterest: "", facebook: "", youtube: "" },
  },
  currencies: [],
  shipping: { zones: [], unsupportedMessage: { en: "" } },
  loaded: false,
};

export const useSiteSettings = create<SiteSettingsState>(() => fallback);

let started = false;

/** Called once from the app shell before first render. */
export function initSiteSettings() {
  if (started) return;
  started = true;
  fetchPublicSettings()
    .then(async (data) => {
      useSiteSettings.setState({ store: data.store, currencies: data.currencies, shipping: data.shipping, loaded: true });
      // Sync module-level caches so non-React code (services, utils) picks up live data.
      const { syncCurrenciesFromSettings } = await import("@/data/currencies");
      const { syncShippingFromSettings } = await import("@/data/countries");
      syncCurrenciesFromSettings(data.currencies);
      syncShippingFromSettings(data.shipping);
    })
    .catch(() => {
      useSiteSettings.setState({ loaded: true });
    });
}
