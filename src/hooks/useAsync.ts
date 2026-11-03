import { useCallback, useEffect, useRef, useState } from 'react';

// Tiny data-fetching hook with a shared in-memory cache, so revisiting a page doesn't flash a skeleton.
// Swap for TanStack Query (or similar) when the real API arrives.

type Status = 'idle' | 'loading' | 'success' | 'error';

interface State<T> {
  key: string | null;
  status: Status;
  data?: T;
  error?: unknown;
}

const MAX_ENTRIES = 80;
const cache = new Map<string, unknown>();

function remember(key: string, value: unknown) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
}

/** Drop cached entries whose key starts with `prefix` (e.g. after an order changes stock). */
export function invalidateQueries(prefix: string) {
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
}

export function useAsync<T>(key: string | null, fetcher: () => Promise<T>, options: { keepPrevious?: boolean } = {}) {
  const { keepPrevious = false } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>(() =>
    key && cache.has(key) ? { key, status: 'success', data: cache.get(key) as T } : { key, status: key ? 'loading' : 'idle' },
  );

  useEffect(() => {
    if (!key) {
      setState({ key, status: 'idle' });
      return;
    }
    if (cache.has(key)) {
      setState({ key, status: 'success', data: cache.get(key) as T });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ key, status: 'loading', data: keepPrevious ? prev.data : undefined }));
    fetcherRef.current().then(
      (data) => {
        remember(key, data);
        if (!cancelled) setState({ key, status: 'success', data });
      },
      (error: unknown) => {
        if (!cancelled) setState((prev) => ({ key, status: 'error', error, data: keepPrevious ? prev.data : undefined }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, nonce, keepPrevious]);

  // While an effect for a new key hasn't run yet, derive a consistent view.
  let view: State<T> = state;
  if (state.key !== key) {
    view =
      key && cache.has(key)
        ? { key, status: 'success', data: cache.get(key) as T }
        : { key, status: key ? 'loading' : 'idle', data: keepPrevious ? state.data : undefined };
  }

  const reload = useCallback(() => {
    if (key) cache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return {
    data: view.data,
    error: view.error,
    status: view.status,
    isLoading: view.status === 'loading',
    isError: view.status === 'error',
    reload,
  };
}
