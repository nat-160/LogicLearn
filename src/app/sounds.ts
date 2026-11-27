/**
 * Sound effects, made in the browser (Web Audio) – there are no sound files, and nothing
 * is downloaded. They only play when the student turns on "Sound effects" in the
 * Accessibility settings: a room full of chiming Chromebooks is nobody's idea of fun.
 */

/** A short rising chime (C, E, G), about half a second, quiet. */
export function playChime(): void {
  const AudioContextClass =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AudioContextClass) return;
  try {
    const audio = new AudioContextClass();
    const start = audio.currentTime + 0.02;
    [523.25, 659.25, 783.99].forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      const t = start + i * 0.12;
      // A soft attack and fade, so the notes don't click.
      volume.gain.setValueAtTime(0, t);
      volume.gain.linearRampToValueAtTime(0.15, t + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      tone.connect(volume).connect(audio.destination);
      tone.start(t);
      tone.stop(t + 0.4);
    });
    // Free the audio device once the chime is over.
    window.setTimeout(() => void audio.close().catch(() => {}), 1000);
  } catch {
    // No sound is fine: the celebration is also on screen and announced.
  }
}
