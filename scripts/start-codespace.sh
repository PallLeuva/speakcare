#!/usr/bin/env bash
# Restart the local development preview when a Codespace starts.
set -euo pipefail
cd "$(dirname "$0")/.."
if curl --silent --fail http://127.0.0.1:3000/ >/dev/null; then
  exit 0
fi
nohup npm run dev >/tmp/speakcare-server.log 2>&1 </dev/null &
echo "Starting SpeakCare on port 3000. See /tmp/speakcare-server.log for details."
