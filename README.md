# Supply Chain Attacks — live demos

Companion demos for the DEV.BG Cyber Security talk
(`Supply Chain Attacks - 15.10 _ KG.pptx`).

Both demos are **defanged**: they read and print secrets to show they sit
in plain text, but they send nothing anywhere. Fake secrets only.

## Demo 1 — a postinstall that reads your secrets  (slide 18)
```bash
cd demo1-postinstall
./run.sh
```
`npm install` fires a `postinstall` hook that reads `~/.npmrc` and
`process.env` and prints the plaintext tokens it finds — then the same
install with `--ignore-scripts`, where the payload never runs.

> ⚠️ **Runs in a scrubbed environment (`env -i`) on purpose.** Only the fake
> demo secrets are visible — your real shell secrets (`SONAR_TOKEN`,
> `AWS_PROFILE`, etc.) are never inherited, so nothing real lands on screen.
> Don't bypass `run.sh` and run `node steal.js` directly in your normal shell
> during the talk, or your real env vars will show.

## Demo 2 — dependency confusion  (slide 19)
See `demo2-dependency-confusion/README.md`. Needs a local Verdaccio registry;
shows the public, higher-versioned look-alike winning over the internal package.

## Talking points
- No rootkit, no CVE — a `postinstall` hook is enough.
- Secrets live in plain text in `~/.npmrc`, `.env`, and CI environment vars.
- Defenses: `npm ci --ignore-scripts`, scoped packages + private registry,
  lockfiles with hashes, pinned versions.
