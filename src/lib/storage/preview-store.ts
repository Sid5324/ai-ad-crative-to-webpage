import type { PreviewRecord } from '@/lib/schemas/preview';

const store = new Map<string, PreviewRecord>();

export async function savePreview(preview: PreviewRecord) {
  store.set(preview.id, preview);
  return preview.id;
}

export async function getPreview(id: string) {
  return store.get(id) || null;
}