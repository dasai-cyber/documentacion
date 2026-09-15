import fs from 'fs';
import path from 'path';
import os from 'os';
import { TempFileRecord } from '../types.js';
import { logger } from './logger.js';

const TTL_MINUTES = parseInt(process.env.TEMP_TTL_MINUTES || '30', 10);
const TTL_MS = TTL_MINUTES * 60 * 1000;

export const WORK_DIR = process.env.TEMP_DIR || (process.platform === 'win32' 
  ? path.join(os.tmpdir(), 'comprimelo_work')
  : '/tmp/work');

// Ensure work directory exists
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

class TempStore {
  private records = new Map<string, TempFileRecord>();

  constructor() {
    // Schedule periodic cleanup every 10 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000);
  }

  public save(record: Omit<TempFileRecord, 'createdAt' | 'expiresAt'>): TempFileRecord {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MS);

    const fullRecord: TempFileRecord = {
      ...record,
      createdAt: now,
      expiresAt,
    };

    this.records.set(record.id, fullRecord);
    logger.info(`Saved temp file ${record.id} (${record.originalName}), expires at ${expiresAt.toISOString()}`);
    return fullRecord;
  }

  public get(id: string): TempFileRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    if (new Date() > record.expiresAt) {
      this.delete(id);
      return null;
    }

    return record;
  }

  public delete(id: string): void {
    const record = this.records.get(id);
    if (record) {
      if (fs.existsSync(record.filePath)) {
        try {
          fs.unlinkSync(record.filePath);
          logger.info(`Deleted temp file on disk: ${record.filePath}`);
        } catch (err) {
          logger.error(`Failed to delete temp file ${record.filePath}:`, err);
        }
      }
      this.records.delete(id);
    }
  }

  public cleanupExpired(): void {
    const now = new Date();
    logger.info(`Running scheduled cleanup for expired temp files...`);

    for (const [id, record] of this.records.entries()) {
      if (now > record.expiresAt) {
        this.delete(id);
      }
    }

    // Also scan the work directory for orphan files older than TTL
    try {
      const files = fs.readdirSync(WORK_DIR);
      for (const file of files) {
        const fullPath = path.join(WORK_DIR, file);
        const stats = fs.statSync(fullPath);
        if (now.getTime() - stats.mtimeMs > TTL_MS) {
          try {
            if (stats.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
            logger.info(`Removed orphan file from disk: ${file}`);
          } catch (e) {
            logger.error(`Error deleting orphan ${file}:`, e);
          }
        }
      }
    } catch (e) {
      logger.error('Error scanning work dir for cleanup:', e);
    }
  }
}

export const tempStore = new TempStore();
