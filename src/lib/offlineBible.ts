/**
 * Armazenamento offline da Bíblia (IndexedDB).
 *
 * Por que não localStorage: a Bíblia inteira tem 31.106 versículos (~4 MB de
 * JSON). O localStorage costuma ter cota de 5 MB no celular e é SÍNCRONO —
 * gravar isso ou estoura a cota (QuotaExceededError) ou trava a interface.
 * IndexedDB é assíncrono e feito exatamente pra volumes assim.
 */

const DB_NAME = "alianca-biblia";
const DB_VERSION = 1;
const STORE = "biblia";
const KEY = "completa";

export interface BibliaGuardada<T> {
  data: T;
  timestamp: number;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Lê a Bíblia guardada. Nunca lança — devolve null se não houver/der erro. */
export async function lerBibliaOffline<T>(): Promise<BibliaGuardada<T> | null> {
  try {
    const db = await abrir();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as BibliaGuardada<T>) || null);
      req.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

/** Guarda a Bíblia pra leitura offline. Nunca lança — falha de disco não pode
 *  derrubar a leitura (era o bug: o setItem estourava a cota e o app dizia
 *  "erro ao carregar a Bíblia" mesmo com os versículos já em mãos). */
export async function salvarBibliaOffline<T>(data: T): Promise<boolean> {
  try {
    const db = await abrir();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ data, timestamp: Date.now() }, KEY);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { resolve(false); };
      tx.onabort = () => { resolve(false); };
    });
  } catch {
    return false;
  }
}

/** Apaga a cópia offline (usado por "liberar espaço"). */
export async function limparBibliaOffline(): Promise<void> {
  try {
    const db = await abrir();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => resolve();
    });
  } catch {
    /* nada a fazer */
  }
}
