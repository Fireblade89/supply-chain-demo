# Demo 2 — Dependency confusion (local Verdaccio)

A package name exists in **two** registries; a loose version range (`^1.0.0`)
happily reaches for the **public, higher-versioned** look-alike and runs its
`postinstall`. Everything stays on your laptop — `pwn.js` only prints.

- `internal-pkg/`  → real `acme-utils@1.0.0` (should come from the private registry)
- `attacker-pkg/`  → public look-alike `acme-utils@1.99.0` with a `postinstall`
- `victim-app/`    → a build that depends on `acme-utils@^1.0.0`
  (caret = `>=1.0.0 <2.0.0`, so `1.99.0` satisfies it — that's the trap)

> Run every block below from this folder:
> ```bash
> cd ~/github/kaloyangeorgiev.space/Presentations/supply-chain-demo/demo2-dependency-confusion
> ```

## 0) One-time setup
```bash
npm i -g verdaccio
npm adduser --registry http://localhost:4873   # any user / pass / email
```

`acme-utils` is a **real public npm package**, so Verdaccio proxies the name to
npmjs.org and you can't publish the internal `1.0.0`. Fix: tell Verdaccio these
names are local-only (no `proxy:`). This one command inserts the rule before the
`'**'` block — run it once, then restart Verdaccio:
```bash
python3 - <<'PY'
import pathlib
cfg = pathlib.Path.home() / ".config/verdaccio/config.yaml"
t = cfg.read_text()
block = """  'acme-utils':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
  'victim-app':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
"""
if "'acme-utils'" not in t:
    t = t.replace("  '**':", block + "  '**':", 1)
    cfg.write_text(t)
    print("config.yaml patched")
else:
    print("already patched")
PY
```

Start Verdaccio (leave it running; serves http://localhost:4873):
```bash
verdaccio &
```

## 1) Publish the REAL internal package → private registry
```bash
( cd internal-pkg && npm publish --registry http://localhost:4873 )
```

## 2) Publish the ATTACKER look-alike (same name, version 1.99.0)
```bash
( cd attacker-pkg && npm publish --registry http://localhost:4873 )
```

## 3) The victim build — "just give me acme-utils"
`package.json` asks for `^1.0.0`; npm picks the highest match → `1.99.0` (the
attacker). Use `npm install` (no package name, so the spec isn't rewritten) and
`--foreground-scripts` so the payload's output is shown:
```bash
( cd victim-app && rm -rf node_modules package-lock.json && \
  npm install --registry http://localhost:4873 --foreground-scripts )
```
Expected tail:
```
> acme-utils@1.99.0 postinstall
> node pwn.js

  [+] acme-utils@1.99.0 postinstall — running inside the build
  [+] reading CI secrets from process.env … (would exfiltrate)
  [!] dependency confusion: the PUBLIC, higher version won.
```
→ the caret range reached past the internal `1.0.0` and pulled the attacker's
`1.99.0`.

> npm 11 prints a yellow `allow-scripts` warning after the run — it's advisory;
> `--foreground-scripts` already executed the `postinstall`. (That gate is a real
> mitigation: without the flag, npm 11 defers the script. Don't use
> `--dangerously-allow-all-scripts`.)

## Reset between runs
Verdaccio caches packuments in memory, so `npm unpublish` isn't enough — wipe + restart:
```bash
pkill -f verdaccio
rm -rf ~/.local/share/verdaccio/storage/acme-utils \
       ~/.local/share/verdaccio/storage/victim-app \
       victim-app/node_modules victim-app/package-lock.json
verdaccio &
```

## The fix (the slide)
- **Scope** internal packages (`@acme/utils`) and pin the scope to the private
  registry: `@acme:registry=https://npm.internal.acme.corp`
- **Lockfile with hashes** + `npm ci`; pin exact versions — a caret `^1.0.0`
  happily jumps to `1.99.0`
- A proxy registry that does **not** fall through to public for internal names
- Keep npm 11's **`allow-scripts` gate on** — don't blanket-approve install scripts
