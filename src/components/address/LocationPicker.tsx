import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Map, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AddressFormValues } from '@/utils/validation';

/** Nominatim reverse-geocode response shape (subset). */
interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  locality?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
}

interface NominatimResult {
  address?: NominatimAddress;
  display_name?: string;
}

/** Reverse-geocode a lat/lon via Nominatim (OpenStreetMap). */
async function reverseGeocode(lat: number, lon: number): Promise<NominatimResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode failed');
  return res.json() as Promise<NominatimResult>;
}

/** Map Nominatim address fields → our form values. */
function nominatimToForm(a: NominatimAddress): Partial<AddressFormValues> {
  const house = a.house_number ? `${a.house_number} ` : '';
  const road = a.road ?? a.neighbourhood ?? '';
  const line1 = (house + road).trim();
  const line2 = (a.suburb ?? a.locality ?? '').trim();
  const city = (a.city ?? a.town ?? a.village ?? a.county ?? '').trim();
  const region = (a.state ?? '').trim();
  const postalCode = (a.postcode ?? '').trim();
  const country = (a.country_code ?? '').toUpperCase();
  return { line1, line2, city, region, postalCode, country };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L?: any;
  }
}

/** Dynamically load Leaflet from CDN (once). */
function loadLeaflet(): Promise<typeof window.L> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

interface MapModalProps {
  initialLat: number;
  initialLon: number;
  onConfirm: (lat: number, lon: number) => void;
  onClose: () => void;
}

function MapModal({ initialLat, initialLon, onConfirm, onClose }: MapModalProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [pos, setPos] = useState({ lat: initialLat, lon: initialLon });
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    let map: unknown;
    loadLeaflet().then((L) => {
      if (!mapRef.current || !L) return;
      setLeafletReady(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = (L as any).map(mapRef.current, { zoomControl: true }).setView([initialLat, initialLon], 16);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).addTo(m as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const icon = (L as any).divIcon({
        html: `<div style="width:28px;height:36px;background:#c0392b;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        className: '',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markerRef.current = (L as any).marker([initialLat, initialLon], { draggable: true, icon }).addTo(m as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markerRef.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setPos({ lat, lon: lng });
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m as any).on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current?.setLatLng([lat, lng]);
        setPos({ lat, lon: lng });
      });
      map = m;
    });
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any)?.remove();
    };
  // only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal aria-label={t('address.pickOnMap')}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{t('address.pickOnMap')}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-sand-100" aria-label={t('common.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-5 pt-3 text-sm text-ink-muted">{t('address.mapHint')}</p>
        <div ref={mapRef} className="mx-4 mt-3 flex-1 rounded-xl" style={{ minHeight: 340, height: 400 }} />
        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-sand-200 px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost rounded-lg px-4 py-2 text-sm">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pos.lat, pos.lon)}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            {t('address.confirmLocation')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LocationPickerProps {
  onFill: (values: Partial<AddressFormValues>) => void;
}

/** "Use my location" + "Pick on map" buttons for the address form. */
export function LocationPicker({ onFill }: LocationPickerProps) {
  const { t } = useTranslation();
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lon: 78.9629 }); // India center default

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsState('error');
      return;
    }
    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (result.address) {
            onFill(nominatimToForm(result.address));
          }
          setGpsState('idle');
        } catch {
          setGpsState('error');
        }
      },
      () => setGpsState('error'),
      { timeout: 10000 },
    );
  };

  const openMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setShowMap(true);
        },
        () => setShowMap(true),
        { timeout: 5000 },
      );
    } else {
      setShowMap(true);
    }
  };

  const handleMapConfirm = async (lat: number, lon: number) => {
    setShowMap(false);
    try {
      const result = await reverseGeocode(lat, lon);
      if (result.address) {
        onFill(nominatimToForm(result.address));
      }
    } catch {
      /* silently ignore — user can fill manually */
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3">
        <button
          type="button"
          onClick={detectLocation}
          disabled={gpsState === 'loading'}
          className="flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-sand-100 disabled:opacity-60"
        >
          <LocateFixed className={`h-4 w-4 shrink-0 ${gpsState === 'loading' ? 'animate-pulse text-brand-600' : 'text-brand-600'}`} aria-hidden />
          {gpsState === 'loading' ? t('address.detecting') : t('address.useMyLocation')}
        </button>
        <button
          type="button"
          onClick={openMap}
          className="flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-sand-100"
        >
          <Map className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
          {t('address.pickOnMap')}
        </button>
        {gpsState === 'error' && <p className="w-full text-xs text-red-600">{t('address.locationError')}</p>}
      </div>

      {showMap && <MapModal initialLat={mapCenter.lat} initialLon={mapCenter.lon} onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />}
    </>
  );
}
