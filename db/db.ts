
import Dexie, { type Table } from 'dexie';
import type { GameState } from '../types';

export interface GameSave {
  id?: number;
  state: GameState;
}

class RedMicDexie extends Dexie {
  saves!: Table<GameSave, number>; 

  constructor() {
    super('red-mic-game');
    // Fix: RedMicDexie inherits version from Dexie. Cast 'this' to Dexie to ensure the compiler recognizes the version() method correctly.
    (this as Dexie).version(1).stores({
      saves: '++id', // Primary key auto-incrementing
    });
  }
}

export const db = new RedMicDexie();
