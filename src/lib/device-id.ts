// src/lib/device-id.ts
// Utilitário para persistência redundante e segura do deviceId

import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "deviceId";

function getFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

function setToLocalStorage(id: string) {
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {}
}

function getFromCookie(): string | null {
  try {
    const match = document.cookie.match(
      new RegExp("(^| )" + DEVICE_ID_KEY + "=([^;]+)"),
    );
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function setToCookie(id: string) {
  try {
    document.cookie = `${DEVICE_ID_KEY}=${encodeURIComponent(id)}; path=/; max-age=31536000`;
  } catch {}
}

// IndexedDB (opcional, async)
function getFromIndexedDB(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("numblyDevice", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("device", { keyPath: "key" });
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("device", "readonly");
        const store = tx.objectStore("device");
        const getReq = store.get(DEVICE_ID_KEY);
        getReq.onsuccess = () => resolve(getReq.result?.value || null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function setToIndexedDB(id: string) {
  try {
    const request = indexedDB.open("numblyDevice", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("device", { keyPath: "key" });
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("device", "readwrite");
      const store = tx.objectStore("device");
      store.put({ key: DEVICE_ID_KEY, value: id });
    };
  } catch {}
}

function generateDeviceId(): string {
  // Gera um UUID v4 válido para o backend
  return uuidv4();
}

function isValidUUIDv4(id: string): boolean {
  // Regex oficial para UUID v4
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export async function getOrCreateDeviceId(): Promise<string> {
  let id =
    getFromLocalStorage() || getFromCookie() || (await getFromIndexedDB());
  if (!id || !isValidUUIDv4(id)) {
    id = generateDeviceId();
  }
  setToLocalStorage(id);
  setToCookie(id);
  setToIndexedDB(id);
  return id;
}

// Para uso imediato (sincrônico, mas pode não pegar IndexedDB)
export function getDeviceIdSync(): string {
  let id = getFromLocalStorage() || getFromCookie();
  if (!id || !isValidUUIDv4(id)) {
    id = generateDeviceId();
    setToLocalStorage(id);
    setToCookie(id);
    setToIndexedDB(id);
  }
  return id;
}
