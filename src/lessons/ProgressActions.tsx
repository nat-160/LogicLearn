/**
 * "Your progress": save it to a file, or load it from one (progressFile.ts). Shown on the
 * lesson list, because progress lives only in this browser and can be erased.
 */
import { useRef, useState } from 'react';
import { announce } from '../a11y/announcer';
import { IS_TEST_VERSION } from '../app/site';
import { downloadJson, MAX_FILE_BYTES } from '../storage/storage';
import {
  buildProgressFile,
  describeImport,
  parseProgressFile,
  planImport,
  progressFileName,
} from './progressFile';
import { useProgress } from './progress';
import { hasWork, readAllWork, writeWork } from './stepWork';

const SITE = IS_TEST_VERSION ? 'dev' : 'live';

export function ProgressActions() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const tell = (text: string) => {
    setMessage(text);
    announce(text);
  };

  const onSave = () => {
    const { steps } = useProgress.getState();
    downloadJson(progressFileName(SITE), buildProgressFile(steps, readAllWork(), SITE));
    tell('Your progress was saved as a file. Keep it somewhere safe, like your school drive.');
  };

  const onLoad = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      tell("Couldn't load that file: it is too big to be a progress file.");
      return;
    }
    const parsed = parseProgressFile(await file.text());
    if (!parsed.ok) {
      tell(`Couldn't load that file: ${parsed.error}`);
      return;
    }
    const plan = planImport(useProgress.getState().steps, parsed, hasWork);
    for (const [key, saved] of Object.entries(plan.restore)) writeWork(key, saved);
    useProgress.getState().mergeIn(parsed.steps);
    tell(describeImport(plan.report));
  };

  return (
    <section className="panel progress-actions" aria-labelledby="progress-actions-title">
      <h2 id="progress-actions-title" className="panel-title">
        Your progress
      </h2>
      <p className="small">
        Your progress is kept only in this browser. Shared Chromebooks and Safari can erase it, so
        save it to a file now and then. Load the file to carry on here or on another computer.
      </p>
      <div className="button-row">
        <button type="button" onClick={onSave} data-testid="save-progress">
          <span aria-hidden>⬇</span> Save my progress to a file
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          data-testid="load-progress"
        >
          <span aria-hidden>⬆</span> Load progress from a file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            void onLoad(e.target.files?.[0]);
            e.target.value = '';
          }}
          data-testid="progress-file-input"
        />
      </div>
      {message && (
        <p className="small" data-testid="progress-message">
          {message}
        </p>
      )}
    </section>
  );
}
