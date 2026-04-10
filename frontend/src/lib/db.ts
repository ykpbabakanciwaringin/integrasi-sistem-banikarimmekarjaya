// LOKASI: src/lib/db.ts
import { openDB } from "idb";
import { StudentExamBundle } from "@/types/student-exam";

const DB_NAME = "cbt-emerald-secure-db";
const DB_VERSION = 2;
const ENCRYPTION_SECRET = "CYBER_EMERALD_KEY_2026";

export interface OfflineAnswer {
  questionId: string;
  answer: string;
  synced: number;
  updatedAt: number;
}

async function encryptData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(ENCRYPTION_SECRET),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData,
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(ENCRYPTION_SECRET),
    );
    const key = await crypto.subtle.importKey(
      "raw",
      hash,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return "";
  }
}

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("exam_bundles")) {
        db.createObjectStore("exam_bundles", { keyPath: "session_id" });
      }
      if (!db.objectStoreNames.contains("answers")) {
        const answerStore = db.createObjectStore("answers", {
          keyPath: "questionId",
        });
        answerStore.createIndex("by-sync", "synced");
      }
      if (!db.objectStoreNames.contains("pending_finish")) {
        db.createObjectStore("pending_finish", { keyPath: "session_id" });
      }
    },
  });
};

export const dbProvider = {
  saveExamBundle: async (bundle: StudentExamBundle) => {
    const db = await initDB();
    const encryptedData = await encryptData(JSON.stringify(bundle));
    await db.put("exam_bundles", {
      session_id: bundle.session_id,
      data: encryptedData,
    });
  },

  getExamBundle: async (
    sessionId: string,
  ): Promise<StudentExamBundle | null> => {
    const db = await initDB();
    const result = await db.get("exam_bundles", sessionId);
    if (!result) return null;
    const decrypted = await decryptData(result.data);
    return decrypted ? JSON.parse(decrypted) : null;
  },

  saveAnswerLocal: async (
    questionId: string,
    answer: string,
    isSynced: boolean = false,
  ) => {
    const db = await initDB();
    const encryptedAnswer = await encryptData(answer);
    await db.put("answers", {
      questionId,
      answer: encryptedAnswer,
      synced: isSynced ? 1 : 0,
      updatedAt: Date.now(),
    });
  },

  getUnsyncedAnswers: async (): Promise<OfflineAnswer[]> => {
    const db = await initDB();
    const unsyncedEncrypted = await db.getAllFromIndex("answers", "by-sync", 0);
    const results: OfflineAnswer[] = [];
    for (const item of unsyncedEncrypted) {
      const decryptedAnswer = await decryptData(item.answer);
      results.push({ ...item, answer: decryptedAnswer });
    }
    return results;
  },

  markAsSynced: async (questionIds: string[]) => {
    const db = await initDB();
    const tx = db.transaction("answers", "readwrite");
    for (const id of questionIds) {
      const val = await tx.store.get(id);
      if (val) {
        val.synced = 1;
        await tx.store.put(val);
      }
    }
    await tx.done;
  },

  setPendingFinish: async (sessionId: string) => {
    const db = await initDB();
    await db.put("pending_finish", {
      session_id: sessionId,
      timestamp: Date.now(),
    });
  },

  getPendingFinish: async () => {
    const db = await initDB();
    return db.getAll("pending_finish");
  },

  removePendingFinish: async (sessionId: string) => {
    const db = await initDB();
    await db.delete("pending_finish", sessionId);
  },

  clearCurrentExamData: async () => {
    const db = await initDB();
    await db.clear("answers");
    await db.clear("exam_bundles");
  },
};
