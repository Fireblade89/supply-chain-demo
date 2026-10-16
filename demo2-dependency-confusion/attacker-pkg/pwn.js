// Runs automatically when the victim's build installs acme-utils@1.99.0.
// Defanged for the talk: it only prints. Real malware would exfiltrate here.
console.log("\n  [+] acme-utils@1.99.0 postinstall — running inside the build");
console.log("  [+] cwd:", process.cwd());
console.log("  [+] reading CI secrets from process.env … (would exfiltrate)");
console.log("  [!] dependency confusion: the PUBLIC, higher version won.\n");
