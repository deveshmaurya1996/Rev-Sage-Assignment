import { readStoredAuth, type StoredAuth } from "./api";

let cached: StoredAuth | null | undefined = undefined;
const listeners = new Set<() => void>();

function stableRead(): StoredAuth | null {
  const next = readStoredAuth();
  if (cached !== undefined) {
    if (cached === null && next === null) {
      return cached;
    }
    if (
      cached !== null &&
      next !== null &&
      cached.accessToken === next.accessToken &&
      cached.user.id === next.user.id &&
      cached.user.email === next.user.email &&
      cached.user.displayName === next.user.displayName
    ) {
      return cached;
    }
  }
  cached = next;
  return next;
}

export function subscribeAuth(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = () => {
    cached = undefined;
    onStoreChange();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getAuthSnapshot(): StoredAuth | null {
  return stableRead();
}

export function getServerAuthSnapshot(): null {
  return null;
}

export function notifyAuthChanged() {
  cached = undefined;
  listeners.forEach((l) => l());
}
