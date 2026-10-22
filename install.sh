#!/bin/sh
# CamBridge Studio installer (direct download, notarized by Apple).
#   curl -fsSL https://mohsin.se/cambridge/install.sh | sh
# Downloads the latest release, installs it into /Applications (or
# ~/Applications if /Applications isn't writable) and opens it. Later
# updates arrive inside the app (Sparkle).
set -eu

URL="https://github.com/mohsinsapra/cambridge/releases/latest/download/CamBridge-Studio.zip"
APP_NAME="CamBridge Studio.app"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "CamBridge Studio is a Mac app; run this on macOS." >&2
  exit 1
fi

DEST="${CAMBRIDGE_INSTALL_DIR:-/Applications}"
[ -w "$DEST" ] || { DEST="$HOME/Applications"; mkdir -p "$DEST"; }

# A TestFlight / App Store copy is owned by root and can't be replaced here.
if [ -e "$DEST/$APP_NAME" ] && [ ! -w "$DEST/$APP_NAME" ]; then
  echo "A TestFlight or App Store copy of CamBridge Studio is already in $DEST." >&2
  echo "Move it to the Trash in Finder, then run this installer again." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Downloading CamBridge Studio..."
curl -fL --progress-bar "$URL" -o "$TMP/CamBridge-Studio.zip"
ditto -x -k "$TMP/CamBridge-Studio.zip" "$TMP"

if pgrep -xq "CamBridge Studio"; then
  echo "==> Quitting the running CamBridge Studio..."
  osascript -e 'quit app "CamBridge Studio"' >/dev/null 2>&1 || true
  sleep 2
fi

echo "==> Installing to $DEST..."
rm -rf "$DEST/$APP_NAME"
mv "$TMP/$APP_NAME" "$DEST/$APP_NAME"

echo "==> Opening CamBridge Studio"
open "$DEST/$APP_NAME"
echo "Done. Updates will appear inside the app (CamBridge Studio > Check for Updates...)."
