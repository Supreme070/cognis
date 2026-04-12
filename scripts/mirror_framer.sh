#!/usr/bin/env bash
set -euo pipefail

# Mirror all framerusercontent.com assets referenced by the HTML + the known CMS chunks.
# Run from /Users/supreme/Desktop/cognis

HTML="${1:-aeline_framer_website.html}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD framer-runtime/images framer-runtime/assets framer-cms-raw cognis-cms

log() { printf '[mirror] %s\n' "$*"; }

# 1. Mirror .mjs runtime bundles referenced by the HTML
log "Mirroring .mjs runtime bundles..."
grep -oE 'https://framerusercontent\.com/sites/[A-Za-z0-9]+/[^"<> ]+\.mjs' "$HTML" \
  | sort -u | while read -r url; do
    rel="${url#https://framerusercontent.com/}"
    out="framer-runtime/$rel"
    mkdir -p "$(dirname "$out")"
    if [ ! -f "$out" ]; then
      curl -sSL --fail "$url" -o "$out" && log "  $(basename "$out")" || log "  MISSING: $url"
    fi
  done

# 2. Mirror images
log "Mirroring /images/ assets..."
grep -oE 'https://framerusercontent\.com/images/[^"<> ?)]+' "$HTML" \
  | sort -u | while read -r url; do
    fname=$(basename "$url")
    out="framer-runtime/images/$fname"
    if [ ! -f "$out" ]; then
      curl -sSL --fail "$url" -o "$out" && log "  $fname" || log "  MISSING: $url"
    fi
  done

# 3. Mirror /assets/ if any
grep -oE 'https://framerusercontent\.com/assets/[^"<> ?)]+' "$HTML" \
  | sort -u | while read -r url; do
    fname=$(basename "$url")
    out="framer-runtime/assets/$fname"
    if [ ! -f "$out" ]; then
      curl -sSL --fail "$url" -o "$out" && log "  assets/$fname" || log "  MISSING: $url"
    fi
  done

# 4. Mirror CMS chunks (discovered via Playwright network log)
log "Mirroring .framercms CMS chunks..."
CMS_URLS=(
  "https://framerusercontent.com/cms/aCOqmmDfcWdpxunl2Vbu/aiAEaNN0SilhH3zeYPaR/QSCEvOCzd-chunk-default-0.framercms"
  "https://framerusercontent.com/cms/aCOqmmDfcWdpxunl2Vbu/aiAEaNN0SilhH3zeYPaR/QSCEvOCzd-indexes-default-0.framercms"
  "https://framerusercontent.com/cms/n51KlW6VfYdV3MbDynGO/0aLo0YM7b81F5yP7PCuI/rAjl8lYSc-chunk-default-0.framercms"
  "https://framerusercontent.com/cms/n51KlW6VfYdV3MbDynGO/0aLo0YM7b81F5yP7PCuI/rAjl8lYSc-indexes-default-0.framercms"
  "https://framerusercontent.com/cms/eHijiUDPXyPTs7k94lBe/oZyRzOjDPA0Dgx8eR5oe/csw22u1fM-chunk-default-0.framercms"
  "https://framerusercontent.com/cms/eHijiUDPXyPTs7k94lBe/oZyRzOjDPA0Dgx8eR5oe/csw22u1fM-indexes-default-0.framercms"
)
for url in "${CMS_URLS[@]}"; do
  fname=$(basename "$url")
  out="framer-cms-raw/$fname"
  if [ ! -f "$out" ]; then
    curl -sSL --fail "$url" -o "$out" && log "  $fname" || log "  MISSING: $url"
  fi
done

log "Done. Runtime bundles: $(find framer-runtime/sites -type f | wc -l | tr -d ' '); images: $(find framer-runtime/images -type f | wc -l | tr -d ' '); CMS chunks: $(find framer-cms-raw -type f | wc -l | tr -d ' ')"
