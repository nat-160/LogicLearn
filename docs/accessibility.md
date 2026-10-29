# Accessibility

LogicLearn aims for **WCAG 2.1 AA**. This page is for students, teachers and anyone
changing the code. The design reasoning is in `PROJECT_PLAN.md` §3.9.

## For students and teachers

Open **⚙ Accessibility** in the top-right corner of every page. Every setting is saved on
this device, and until you change one, LogicLearn follows the device's own settings
(such as "increase contrast" or a dark system theme).

| Setting                         | What it does                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **High contrast**               | Black-and-white colors, thicker lines and outlines, a stronger focus ring.                                            |
| **Dark mode**                   | Light text on a dark background. Works together with high contrast, so there are four themes.                         |
| **Dyslexia-friendly font**      | The OpenDyslexic font, with wider spacing between letters, words and lines, and bold instead of italics.              |
| **Read each lesson step aloud** | Reads each step when it opens. Every step also has a **Read this step aloud** button. Speed and voice can be changed. |
| **Use my device's settings**    | Forgets the choices above.                                                                                            |

**Built-in narration** uses the browser's own speech, so it needs no account or download.
The automatic voice is one that runs on the device. Voices marked "online" are generated
by an internet service (only the lesson text is sent, never student work).

### Using LogicLearn without a mouse or touch screen

- **Tab** moves through the page. **Skip to main content** is the first stop.
- To **add a part**, tab to it in the Parts list and press **Enter**.
- **Connections (keyboard)** (right-hand panel): choose an output and an input, then
  press **Connect**. Every wire is listed with a **Remove** button.
- **Circuit as text** lists every part with its current value and every wire. It also
  lists inputs that are not connected.
- Select a part with **Tab** to rename or delete it in the panel on the right. The arrow
  keys move it.
- In the truth table, **Enter** on a row sets the switches to that row.
- **Ctrl+Z / Ctrl+Shift+Z** undo and redo.

### Screen readers and other reading tools

Built to the conventions that NVDA, VoiceOver, ChromeVox, Chromebook Select-to-speak,
Read&Write for Google Chrome and Edge's Immersive Reader rely on. Automated checks run on
every change; hands-on testing with these tools is on the manual checklist below.

The conventions:

- All text is real text: lesson text can be selected and read by select-to-speak tools.
- Pages have one main heading, landmarks (header, navigation, main, lesson instructions,
  circuit tools) and labelled controls.
- When a lesson step changes, focus moves to its heading so it is announced.
- These are announced as they happen:
  - check results;
  - revealed hints;
  - parts added;
  - connections made;
  - lights changing;
  - circuits that never settle.
- In predict-first challenges, light values stay hidden from screen readers too, until
  Check.

## For developers

- **Colors come only from theme tokens** in `src/styles/themes.css`. Never write a color
  in `app.css` or a component. Each theme redefines the tokens.
- **Never use color as the only cue.**
  - Wires: thick = 1, thin = 0, dashed = unknown.
  - Wrong truth-table rows also say "✗ wrong".
  - The current row has a bar on its left.
- **Announce changes** with `announce()` from `src/a11y/announcer.ts`. Don't create new
  `aria-live` regions; ones that appear together with their message are often not read.
- **Every control needs a name** that includes its visible text (WCAG 2.5.3).
- **Every pointer action needs a keyboard path.** For wiring, that path is the
  Connections panel.
- **Tests:**
  - `e2e/accessibility.spec.ts` runs **axe-core** on the main pages in all four themes and
    fails on any serious or critical violation.
  - It also tests the keyboard-only build, the focus moves, narration (with a recording
    stand-in for the speech engine) and the saved preferences.

### Manual checklist (before each milestone)

- [ ] NVDA + Chrome on Windows, or ChromeVox on a Chromebook:
  - [ ] complete lesson steps 1–2 using only the keyboard;
  - [ ] confirm the check result and hints are announced.
- [ ] VoiceOver on iPad: open a lesson; flip a switch; hear the light change.
- [ ] Windows contrast theme (forced colors): wires and lights are still distinguishable.
- [ ] Browser zoom at 200%: nothing is cut off, and the lesson text still reads well.
- [ ] Dyslexia font on: the palette, toolbar and lesson panel don't overflow.
