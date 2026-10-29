# Branches, the live site and the test version

There are two copies of LogicLearn online:

| Site             | Address                                   | Built from | Saves under       |
| ---------------- | ----------------------------------------- | ---------- | ----------------- |
| **Live site**    | https://nat-160.github.io/LogicLearn/     | `main`     | `logiclearn:`     |
| **Test version** | https://nat-160.github.io/LogicLearn/dev/ | `dev`      | `logiclearn-dev:` |

The test version shows a **Test version** banner on every page, with a link to the live
site.

## How a change gets to students

1. Work happens on a feature branch, such as a Claude Code session's `claude/…` branch.
2. Open a pull request **into `dev`**. CI tests it. When it is merged, the test version
   updates within about 5 minutes.
3. Try it on the test version: you, beta testers, the milestone demo.
4. To release, open a pull request **from `dev` into `main`**. When it is merged, the live
   site updates.

An urgent fix can go straight into `main`. Afterwards, merge `main` back into `dev` so the
test version has it too.

## Why the test version saves under other names

Both copies run on the same web address (`nat-160.github.io`), and a browser keeps saved
data per address. Without separate names, testing a lesson on the test version would
change a student's progress, saved work and settings on the live site.

So the test version is built with `.env.dev-branch` (`npm run build:dev`). Its storage
names start with `logiclearn-dev:` instead of `logiclearn:`, and it shows the banner.

## How publishing works

GitHub Pages holds one site per repository. So every push to `main` or `dev` builds
**both** branches and publishes them together: `main` at the top, `dev` in the `dev/`
folder (`.github/workflows/ci.yml`, job "Deploy").

- Only one deploy runs at a time.
- If the `dev` branch doesn't exist, only the live site is published.

### One-time repository settings

- **Settings → Pages → Source:** GitHub Actions.
- **Settings → Environments → github-pages → Deployment branches and tags:** allow both
  `main` and `dev`. By default only `main` is allowed, and a deploy from `dev` then fails
  with "Branch "dev" is not allowed to deploy to github-pages due to environment
  protection rules".

## Trying the test version locally

```bash
npm run build:dev
npx vite preview
```
