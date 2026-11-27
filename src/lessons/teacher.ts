/**
 * Whether this browser is in teacher view (after the teacher code was entered once).
 * It stays on until "Leave teacher view". Like every code, it discourages students from
 * peeking at answers; it doesn't stop a determined one (codes.ts).
 */
import { create } from 'zustand';
import { readLocal, storageKey, writeLocal } from '../storage/storage';

const KEY = storageKey('teacher');

interface TeacherState {
  on: boolean;
  setOn(on: boolean): void;
}

export const useTeacher = create<TeacherState>()((set) => ({
  on: readLocal(KEY) === '1',
  setOn: (on) => {
    writeLocal(KEY, on ? '1' : '0');
    set({ on });
  },
}));
