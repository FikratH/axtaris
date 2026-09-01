import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// SecureStore advises values stay under 2048 bytes (iOS keychain may refuse
// larger ones in future SDKs). Supabase sessions routinely exceed that, so
// oversized values are transparently split into chunks under derived keys,
// with a small manifest sentinel stored at the original key.
const CHUNK_SIZE = 1900;
const CHUNK_SENTINEL = '__chunked__:';

function chunkKey(key: string, index: number): string {
  return `${key}.__chunk_${index}`;
}

async function readChunked(key: string, manifest: string): Promise<string | null> {
  const count = Number.parseInt(manifest.slice(CHUNK_SENTINEL.length), 10);
  if (!Number.isFinite(count) || count <= 0) return null;

  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore!.getItemAsync(chunkKey(key, i));
    if (part === null) return null; // torn write — treat as missing
    parts.push(part);
  }
  return parts.join('');
}

async function removeChunks(key: string, fromIndex: number): Promise<void> {
  // Delete until a gap so stale chunks from a previously larger value never
  // get stitched onto a future manifest.
  for (let i = fromIndex; ; i += 1) {
    const k = chunkKey(key, i);
    const existing = await SecureStore!.getItemAsync(k);
    if (existing === null) break;
    await SecureStore!.deleteItemAsync(k);
  }
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== 'web' && SecureStore) {
        const value = await SecureStore.getItemAsync(key);
        if (value?.startsWith(CHUNK_SENTINEL)) {
          return await readChunked(key, value);
        }
        return value;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web' && SecureStore) {
        if (value.length <= CHUNK_SIZE) {
          await SecureStore.setItemAsync(key, value);
          await removeChunks(key, 0);
          return;
        }

        const count = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < count; i += 1) {
          await SecureStore.setItemAsync(
            chunkKey(key, i),
            value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
          );
        }
        await removeChunks(key, count);
        // Manifest written last so a torn write reads as missing, not corrupt.
        await SecureStore.setItemAsync(key, `${CHUNK_SENTINEL}${count}`);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {}
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web' && SecureStore) {
        await SecureStore.deleteItemAsync(key);
        await removeChunks(key, 0);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch {}
  },
};
