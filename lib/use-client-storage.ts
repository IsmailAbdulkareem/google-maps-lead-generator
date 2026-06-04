import { useCallback, useRef, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** True after client hydration (false during SSR). */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Read a client-only value (e.g. localStorage) without useEffect.
 * `read` must be stable (wrap with useCallback). Snapshots are cached by JSON key.
 */
export function useClientSnapshot<T>(read: () => T, serverSnapshot: T): T {
  const cacheRef = useRef<{ key: string; value: T } | null>(null);

  const getSnapshot = useCallback((): T => {
    const value = read();
    let key: string;
    try {
      key = JSON.stringify(value);
    } catch {
      key = String(value);
    }
    if (cacheRef.current?.key === key) {
      return cacheRef.current.value;
    }
    cacheRef.current = { key, value };
    return value;
  }, [read]);

  const getServerSnapshot = useCallback(() => serverSnapshot, [serverSnapshot]);

  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);
}
