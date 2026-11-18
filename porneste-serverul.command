#!/bin/bash
# Dublu-click pe Mac: pornește serverul de pe laptop (vezi server.js).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Nu găsesc Node.js. Instalează-l de pe https://nodejs.org și încearcă din nou."
  read -r -p "Apasă Enter ca să închizi…"
  exit 1
fi
( sleep 1; open "http://localhost:${PORT:-8000}/" ) &
node server.js
