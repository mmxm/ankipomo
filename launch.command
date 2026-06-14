#!/bin/bash

# S'assurer que le script s'exécute dans son propre dossier
cd "$(dirname "$0")"

# 1. Démarrer le serveur local AnkiPomo en arrière-plan s'il n'est pas déjà lancé
if ! lsof -i :5173 -t >/dev/null; then
  echo "Démarrage du serveur local AnkiPomo..."
  npm run dev >/dev/null 2>&1 &
  # Attendre que le serveur démarre
  sleep 1.5
fi

# 2. Lance Anki Desktop et AnkiPomo en mode application
open -a "Anki"
open -n -a "Google Chrome" --args --app="http://localhost:5173"

# 3. Attendre que les fenêtres soient prêtes
sleep 1.5

# 4. Positionner les fenêtres avec AppleScript
osascript <<EOD
tell application "Finder"
    set screenResolution to bounds of window of desktop
    set screenWidth to item 3 of screenResolution
    set screenHeight to item 4 of screenResolution
end tell

# Calcul des dimensions (2/3 pour Anki, 1/3 pour le Timer)
set ankiWidth to (screenWidth * 2) / 3
set chromeWidth to screenWidth / 3
set targetHeight to screenHeight - 25

tell application "System Events"
    -- Positionner Anki à gauche (2/3 de l'écran)
    try
        tell process "Anki"
            set position of window 1 to {0, 25}
            set size of window 1 to {ankiWidth, targetHeight}
        end tell
    end try
    
    -- Positionner Chrome App à droite (1/3 de l'écran)
    try
        tell process "Google Chrome"
            set position of window 1 to {ankiWidth, 25}
            set size of window 1 to {chromeWidth, targetHeight}
        end tell
    end try
end tell
EOD
