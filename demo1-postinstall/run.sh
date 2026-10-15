#!/usr/bin/env bash
# Live demo: `npm install` runs attacker code that reads plaintext secrets.
#
# SAFETY: this runs in a SCRUBBED environment (env -i), so ONLY the fake
# demo secrets below are visible. Your real shell secrets (SONAR_TOKEN,
# AWS creds, etc.) are never inherited and never shown on screen.
set -euo pipefail
cd "$(dirname "$0")"
HERE="$PWD"

run_scrubbed () {
  # start from an empty env; pass only what npm/node need + fake secrets
  env -i \
    PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
    HOME="$HERE/sandbox-home" \
    NPM_TOKEN="npm_ci_publish_token_fake_0000" \
    AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/FAKE/EXAMPLEKEY" \
    DB_PASSWORD="sup3r-s3cret-db-pass" \
    STRIPE_API_KEY="sk_live_FAKE_do_not_use" \
    "$@"
}

echo ">>> npm install   (watch the postinstall hook fire)"
run_scrubbed npm install --no-package-lock --silent || true

echo
echo ">>> The defense: the SAME install, scripts disabled"
echo ">>> npm install --ignore-scripts"
run_scrubbed npm install --ignore-scripts --no-package-lock --silent || true
echo ">>> (nothing printed above — the payload never ran)"
rm -rf "$HERE/node_modules"
