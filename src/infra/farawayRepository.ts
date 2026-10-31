import { Preferences } from '@capacitor/preferences';
import type { FarawaySnapshot } from '../domain/models';
import { createInitialSnapshot, normalizeSnapshot } from '../domain/snapshot';

export interface FarawayRepository {
  load(): Promise<FarawaySnapshot>;
  save(snapshot: FarawaySnapshot): Promise<void>;
}

export const SNAPSHOT_KEY = 'faraway.snapshot.v1';

export class PreferencesFarawayRepository implements FarawayRepository {
  async load(): Promise<FarawaySnapshot> {
    try {
      const { value } = await Preferences.get({ key: SNAPSHOT_KEY });
      if (!value) return createInitialSnapshot();
      return normalizeSnapshot(JSON.parse(value));
    } catch {
      return createInitialSnapshot();
    }
  }

  async save(snapshot: FarawaySnapshot): Promise<void> {
    try {
      await Preferences.set({ key: SNAPSHOT_KEY, value: JSON.stringify(snapshot) });
    } catch {
      // Persistence failures should never interrupt a focus session.
    }
  }
}

export const farawayRepository: FarawayRepository = new PreferencesFarawayRepository();
