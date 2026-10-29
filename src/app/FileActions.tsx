/**
 * Toolbar buttons for keeping and sharing work: new, save file, open file, share link.
 */
import { useRef, useState } from 'react';
import { emptyCircuit, unlockAll } from '../sim';
import type { EditorStore } from '../editor/store';
import { downloadCircuit, FILE_EXTENSION, readCircuitFile, shareUrl } from '../storage/storage';

export function FileActions({ store }: { store: EditorStore }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onOpen = async (file: File | undefined) => {
    if (!file) return;
    const result = await readCircuitFile(file);
    if (result.ok) store.getState().loadDoc(unlockAll(result.doc), { keepHistory: true });
    else store.getState().setNotice(`Couldn't open that file: ${result.errors[0]}`);
  };

  const onShare = async () => {
    const url = shareUrl(store.getState().doc);
    if (!url) {
      store.getState().setNotice('This circuit is too big for a link. Use "Save file" instead.');
      return;
    }
    setLink(url);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked: the link is shown so it can be copied by hand.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => store.getState().loadDoc(emptyCircuit('My circuit'), { keepHistory: true })}
        title="Start an empty circuit (you can undo this)"
      >
        ✚ New
      </button>
      <button
        type="button"
        onClick={() => downloadCircuit(store.getState().doc)}
        title="Download this circuit as a file"
      >
        ⬇ Save file
      </button>
      <button type="button" onClick={() => fileInput.current?.click()} title="Open a circuit file">
        ⬆ Open file
      </button>
      <input
        ref={fileInput}
        type="file"
        accept={`${FILE_EXTENSION},.json,application/json`}
        hidden
        onChange={(e) => {
          void onOpen(e.target.files?.[0]);
          e.target.value = '';
        }}
        data-testid="open-file-input"
      />
      <button
        type="button"
        onClick={() => void onShare()}
        title="Get a link to this circuit"
        data-testid="share-button"
      >
        🔗 Share
      </button>
      {link && (
        <div className="share-popover" role="dialog" aria-label="Share link">
          <p>
            {copied
              ? 'Link copied! Anyone with it can open a copy of this circuit.'
              : 'Copy this link:'}
          </p>
          <input
            readOnly
            autoFocus
            value={link}
            onFocus={(e) => e.target.select()}
            data-testid="share-link"
          />
          <button type="button" onClick={() => setLink(null)}>
            Close
          </button>
        </div>
      )}
    </>
  );
}
