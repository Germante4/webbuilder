// Failai saugomi naršyklės IndexedDB. Kiekvienas naujas projektas kol kas
// naudoja vieną bendrą juodraštį, kaip ir projectDraftService.
export type DesignFiles = {
  logoFile: File | null;
  photoFiles: File[];
  textFiles: File[];
  brandFile: File | null;
};
export interface DesignDraftFiles {
  logoFile: File | null;
  photoFiles: File[];
  textFiles: File[];
  brandFile: File | null;
}

const DB_NAME = "webbuilder-draft-files";
const STORE = "drafts";
const KEY = "current-design";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadDesignFiles(): Promise<DesignFiles> {
  const db = await openDatabase();
  try {
    return await new Promise<DesignFiles>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result ?? {
        logoFile: null, photoFiles: [], textFiles: [], brandFile: null,
      });
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function saveDesignFiles(files: DesignFiles): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(files, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function clearDesignFiles(): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
