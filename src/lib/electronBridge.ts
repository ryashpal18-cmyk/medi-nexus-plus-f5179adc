// Electron + Offline bridge.
// Safely calls window.ipcRenderer when running inside the Electron desktop shell
// (Balaji Ortho desktop app). In the browser it falls back to localStorage so
// the same offline-first APIs work everywhere.

declare global {
  interface Window {
    ipcRenderer?: {
      send: (channel: string, ...args: unknown[]) => void;
      invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (
        channel: string,
        listener: (event: unknown, ...args: unknown[]) => void,
      ) => void;
      removeListener?: (
        channel: string,
        listener: (event: unknown, ...args: unknown[]) => void,
      ) => void;
      removeAllListeners?: (channel: string) => void;
    };
  }
}

const LS_KEY = "balaji.localData";

type LocalStore = {
  patients: Array<{
    id?: string;
    name: string;
    mobile: string;
    age?: number | string | null;
    gender?: string | null;
    address?: string | null;
    updated_at: string;
  }>;
  bills: Array<Record<string, unknown>>;
  pendingSync: Array<{ type: string; payload: unknown; ts: string }>;
};

function readLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as LocalStore;
  } catch {
    /* ignore */
  }
  return { patients: [], bills: [], pendingSync: [] };
}

function writeLocal(store: LocalStore) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const isElectron = (): boolean =>
  typeof window !== "undefined" && !!window.ipcRenderer;

/**
 * Save data to the local C:\BalajiOrtho\data store via Electron, and mirror to
 * localStorage so browser previews can also auto-fill from "local data".
 */
export function saveLocalData(
  type: "patient" | "bill" | "xray",
  data: Record<string, unknown>,
) {
  const payload = { type, data, ts: new Date().toISOString() };

  // 1) Electron desktop: write to C:\BalajiOrtho\data\patients.json
  if (isElectron()) {
    try {
      window.ipcRenderer!.send("save-local-data", payload);
    } catch (e) {
      console.warn("[electron] save-local-data failed", e);
    }
  }

  // 2) Browser mirror so local lookups work identically
  const store = readLocal();
  if (type === "patient" && data.mobile) {
    const mobile = String(data.mobile).replace(/\D/g, "");
    const idx = store.patients.findIndex((p) => p.mobile === mobile);
    const entry = {
      id: data.id as string | undefined,
      name: String(data.name ?? ""),
      mobile,
      age: (data.age as number | string | null) ?? null,
      gender: (data.gender as string | null) ?? null,
      address: (data.address as string | null) ?? null,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) store.patients[idx] = entry;
    else store.patients.push(entry);
  } else if (type === "bill") {
    store.bills.push({ ...data, ts: payload.ts });
    if (store.bills.length > 500) store.bills = store.bills.slice(-500);
  }

  // 3) Offline queue — synced when network returns
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    store.pendingSync.push({ type, payload: data, ts: payload.ts });
  }

  writeLocal(store);
}

/** Look up a cached patient by 10-digit mobile (instant offline auto-fill). */
export function findLocalPatientByMobile(mobile: string) {
  const clean = (mobile || "").replace(/\D/g, "");
  if (!clean) return null;
  const store = readLocal();
  return (
    store.patients.find((p) => p.mobile === clean || p.mobile.endsWith(clean)) ??
    null
  );
}

/** Subscribe to printer captures coming from Electron. Returns unsubscribe fn. */
export function onPrinterCapture(
  handler: (imagePath: string) => void,
): () => void {
  if (!isElectron()) return () => {};
  const listener = (_event: unknown, imagePath: unknown) => {
    if (typeof imagePath === "string") handler(imagePath);
  };
  window.ipcRenderer!.on("printer-capture-received", listener);
  return () => {
    window.ipcRenderer!.removeListener?.("printer-capture-received", listener);
  };
}

/** Replay queued offline writes to Electron once back online. */
export function flushPendingSync() {
  if (!isElectron()) return;
  const store = readLocal();
  if (!store.pendingSync.length) return;
  for (const item of store.pendingSync) {
    try {
      window.ipcRenderer!.send("save-local-data", item);
    } catch {
      /* keep in queue */
    }
  }
  store.pendingSync = [];
  writeLocal(store);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", flushPendingSync);
}
