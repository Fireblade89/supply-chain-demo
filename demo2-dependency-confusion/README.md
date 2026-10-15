# Demo 2 — Dependency confusion (local Verdaccio)

Goal: show that when a package name exists in **two** registries, a
misconfigured resolver happily installs the **public, higher-versioned**
one — and runs its `postinstall`.

Everything stays on your laptop. `pwn.js` only prints; it exfiltrates nothing.

## Files
- `internal-pkg/`  → the real `acme-utils@1.0.0` (should come from the private registry)
- `attacker-pkg/`  → the public look-alike `acme-utils@99.0.0` with a `postinstall`
- `victim-app/`    → a build that depends on `acme-utils@^1.0.0`

## One-time setup
```bash
npm i -g verdaccio            # local registry
verdaccio                     # leave running; serves http://localhost:4873
npm adduser --registry http://localhost:4873   # any user/pass/email
```

## The attack, step by step
```bash
# 1) Publish the REAL internal package to the PRIVATE registry (Verdaccio)
cd internal-pkg
npm publish --registry http://localhost:4873
cd ..

# 2) Publish the ATTACKER look-alike — same name, version 99.0.0.
#    In a real attack this goes to the PUBLIC npmjs.org. For the demo we
#    simulate "public" by publishing it to Verdaccio too (higher version wins).
cd attacker-pkg
npm publish --registry http://localhost:4873
cd ..

# 3) Victim build with NO scope/version lock — just "give me acme-utils"
cd victim-app
npm install acme-utils --registry http://localhost:4873
#   -> resolves to acme-utils@99.0.0  (the higher version)
#   -> its postinstall runs pwn.js INSIDE your build
```

Expected tail:
```
> acme-utils@99.0.0 postinstall
> node pwn.js
  [+] running inside the build
  [+] reading CI secrets … (would exfiltrate)
```

## The fix (what the slide says)
- **Scope** your internal packages (`@acme/utils`) and lock the scope to the
  private registry: `@acme:registry=https://npm.internal.acme.corp`
- Use a **lockfile with hashes** and `npm ci`
- Pin exact versions; don't let `^1.0.0` reach for `99.0.0`
- A proxy registry (Artifactory / Nexus) that does **not** fall through to
  public for internal names
