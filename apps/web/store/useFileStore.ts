import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { QueueItem, Settings, FileStatus, CompressionLevel } from '@/types';
import { validateFile, getFileKind } from '@/lib/fileTypes';
import { compressImageClient } from '@/lib/compressImage';
import { compressRemoteDocument } from '@/lib/compressRemote';

interface FileState {
  queue: QueueItem[];
  settings: Settings;
  isProcessing: boolean;

  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearQueue: () => void;
  setSettings: (settings: Partial<Settings>) => void;
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  startProcessing: () => Promise<void>;
  processItem: (id: string) => Promise<void>;
  recompressAll: () => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  queue: [],
  settings: {
    level: 'balanced',
    keepFormat: true,
    maxWidth: null,
  },
  isProcessing: false,

  addFiles: (newFiles: File[]) => {
    const currentQueue = get().queue;
    const itemsToAdd: QueueItem[] = [];

    for (const file of newFiles) {
      // Avoid duplicate by name + size in current queue
      const exists = currentQueue.some(
        (item) => item.name === file.name && item.originalSize === file.size
      );
      if (exists) continue;

      const validation = validateFile(file);
      const kind = validation.kind || getFileKind(file) || 'image';

      const newItem: QueueItem = {
        id: nanoid(),
        file,
        kind,
        name: file.name,
        originalSize: file.size,
        compressedSize: null,
        savedPercent: null,
        status: validation.valid ? 'queued' : 'error',
        progress: 0,
        resultBlob: null,
        downloadUrl: null,
        error: validation.error || null,
      };

      itemsToAdd.push(newItem);
    }

    if (itemsToAdd.length === 0) return;

    set((state) => ({
      queue: [...state.queue, ...itemsToAdd],
    }));

    // Trigger processing
    setTimeout(() => {
      get().startProcessing();
    }, 50);
  },

  removeFile: (id: string) => {
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    }));
  },

  clearQueue: () => {
    // Revoke any created Object URLs
    const queue = get().queue;
    for (const item of queue) {
      if (item.downloadUrl && item.downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.downloadUrl);
      }
    }
    set({ queue: [], isProcessing: false });
  },

  setSettings: (partialSettings: Partial<Settings>) => {
    set((state) => ({
      settings: { ...state.settings, ...partialSettings },
    }));
  },

  updateItem: (id: string, updates: Partial<QueueItem>) => {
    set((state) => ({
      queue: state.queue.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  },

  processItem: async (id: string) => {
    const item = get().queue.find((i) => i.id === id);
    if (!item || item.status === 'compressing' || item.status === 'error') return;

    const { settings, updateItem } = get();

    updateItem(id, {
      status: 'compressing',
      progress: 5,
      error: null,
    });

    try {
      if (item.kind === 'image') {
        const result = await compressImageClient(item.file, settings, (p) => {
          updateItem(id, { progress: p });
        });

        const blobUrl = URL.createObjectURL(result.blob);

        updateItem(id, {
          status: result.skipped ? 'skipped' : 'done',
          progress: 100,
          compressedSize: result.compressedSize,
          savedPercent: result.savedPercent,
          resultBlob: result.blob,
          downloadUrl: blobUrl,
          name: result.outputName,
        });
      } else {
        // PDF or DOCX -> Server Worker via Proxy
        const result = await compressRemoteDocument(item.file, settings, (p) => {
          updateItem(id, { progress: p });
        });

        updateItem(id, {
          status: result.skipped ? 'skipped' : 'done',
          progress: 100,
          compressedSize: result.compressedSize,
          savedPercent: result.savedPercent,
          downloadUrl: result.downloadUrl,
          resultBlob: result.blob || null,
        });
      }
    } catch (error) {
      console.error(`Error processing file ${item.name}:`, error);
      updateItem(id, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Error inesperado al comprimir',
      });
    }
  },

  startProcessing: async () => {
    if (get().isProcessing) return;

    set({ isProcessing: true });

    try {
      const itemsToProcess = get().queue.filter((item) => item.status === 'queued');

      // Process up to 3 files concurrently so we don't choke the browser/network
      const CONCURRENCY = 3;
      const chunks: QueueItem[][] = [];
      for (let i = 0; i < itemsToProcess.length; i += CONCURRENCY) {
        chunks.push(itemsToProcess.slice(i, i + CONCURRENCY));
      }

      for (const chunk of chunks) {
        await Promise.allSettled(chunk.map((item) => get().processItem(item.id)));
      }
    } finally {
      set({ isProcessing: false });
    }
  },

  recompressAll: async () => {
    const queue = get().queue;
    for (const item of queue) {
      if (item.downloadUrl && item.downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.downloadUrl);
      }
    }

    set((state) => ({
      queue: state.queue.map((item) => ({
        ...item,
        status: 'queued' as FileStatus,
        progress: 0,
        compressedSize: null,
        savedPercent: null,
        resultBlob: null,
        downloadUrl: null,
        error: null,
      })),
    }));

    await get().startProcessing();
  },
}));
