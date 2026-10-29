/**
 * Makes one editor store available to every component inside an editor. Several editors
 * can be on screen at once (e.g. a lesson's example and the sandbox), each with its own
 * store. The provider is set up in Editor.tsx.
 */
import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { EditorState, EditorStore } from './store';

export const EditorContext = createContext<EditorStore | null>(null);

/**
 * True in predict-first mode: parts must not reveal output values (visually or to screen
 * readers) until the student presses Check.
 */
export const BlindContext = createContext(false);

export function useEditorStore(): EditorStore {
  const store = useContext(EditorContext);
  if (!store) throw new Error('useEditor must be used inside an <Editor>');
  return store;
}

/** Read part of the editor state; the component re-renders only when that part changes. */
export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorStore(), selector);
}
