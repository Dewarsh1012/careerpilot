import { LemmaClient } from 'lemma-sdk';

function readPodId(): string {
  const fromEnv = import.meta.env.VITE_LEMMA_POD_ID || import.meta.env.LEMMA_POD_ID;
  if (fromEnv) {
    return String(fromEnv);
  }
  if (typeof window !== 'undefined' && window.__LEMMA_CONFIG__?.podId) {
    return String(window.__LEMMA_CONFIG__.podId);
  }
  return '';
}

export const lemmaPodId = readPodId();

export const lemmaClient = new LemmaClient({
  podId: lemmaPodId || undefined,
});

export function podClient(): LemmaClient {
  const podId = readPodId();
  return podId ? lemmaClient.withPod(podId) : lemmaClient;
}

export function lemmaBackendEnabled(): boolean {
  return Boolean(readPodId());
}
