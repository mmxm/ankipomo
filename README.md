# ⚡ AnkiPomo — Minuteur Pomodoro & Révisions Anki

**AnkiPomo** est une application web Pomodoro minimaliste et moderne, conçue pour être placée côte à côte avec **Anki Desktop**. Elle se connecte à Anki via l'extension *AnkiConnect* pour suivre vos révisions en temps réel durant vos sessions de travail et vous récompenser visuellement sans afficher de chiffres de progression stricts.

---

## 🚀 Fonctionnalités principales

- ⏱️ **Minuteur Pomodoro Fluide** : Alternance entre sessions de **Focus** (indigo) et de **Pause** (violet) avec affichage du décompte dans le titre de l'onglet.
- 🔔 **Cloches Sonores Web Audio** : Des alertes musicales synthétisées directement par le navigateur à la fin de chaque phase (aucune ressource audio externe requise).
- 🎈 **Récompense Visuelle "Air Balloon Cruise"** : Une capsule météo verticale affichant un paysage épuré de collines, un croissant de lune et un soleil couchant. Chaque carte révisée déclenche le vol d'une montgolfière avec un effet de parallaxe 3D (vitesse et profondeur ajustées selon la taille).
- 🖱️ **Easter Egg Interactif** : Cliquez directement sur la capsule du ciel pour faire décoller des montgolfières manuellement et tester l'animation.
- 📊 **Statistiques Détaillées Rétractables** : Suivi des révisions totales, cartes uniques, vitesse moyenne et répartition des réponses (À revoir, Difficile, Bon, Facile). Le panneau peut être masqué en un clic.
- 📦 **PWA & Mode Hors Ligne** : Entièrement installable en tant qu'application native sur votre Mac ou PC. Cochez "Installer l'application" dans Chrome pour l'ajouter à votre Launchpad. Le Service Worker cache l'ensemble des fichiers pour un fonctionnement 100% hors ligne.
- 🖥️ **Script de Lancement et Tiling macOS (`launch.command`)** : Un raccourci double-cliquable qui démarre le serveur local s'il est éteint, ouvre Anki et le minuteur, puis les range côte à côte (Anki à gauche sur les 2/3, le minuteur à droite sur le 1/3).

---

## 🛠️ Installation et Configuration

### 1. Prérequis Anki Desktop
Pour lier vos révisions à AnkiPomo, vous devez installer et configurer **AnkiConnect** :

1. Dans Anki Desktop, allez dans **Outils** > **Greffons** > **Acquérir des greffons...** et saisissez le code : **`2055492159`**.
2. Sélectionnez le greffon `AnkiConnect`, cliquez sur **Configuration** et ajoutez `http://localhost:5173` dans le tableau `webCorsOriginList` :
   ```json
   {
       "webCorsOriginList": [
           "http://localhost",
           "http://localhost:5173"
       ]
   }
   ```
3. **Redémarrez Anki** pour appliquer la configuration.

---

### 2. Démarrage du projet local
Clonez le dépôt et installez les dépendances :

```bash
git clone https://github.com/mmxm/ankipomo.git
cd ankipomo
npm install
```

Lancez le serveur de développement local :
```bash
npm run dev
```
Ouvrez [http://localhost:5173](http://localhost:5173) dans Google Chrome.

---

### 3. Installation en tant que PWA (Application native)
Pour utiliser AnkiPomo comme une application autonome :
1. Sur Chrome, cliquez sur l'icône de **téléchargement/installation** tout à fait à droite de la barre d'adresse.
2. L'application s'ajoutera à votre dossier d'applications macOS et s'ouvrira dans sa propre fenêtre flottante épurée.

---

## 🖥️ Utilisation de l'automatisation macOS (`launch.command`)

Pour démarrer votre session de révisions instantanément en un clic sur Mac :
1. Double-cliquez sur le fichier [launch.command](./launch.command) dans le dossier du projet.
2. Le script va :
   - Démarrer le serveur local en arrière-plan (si éteint).
   - Lancer Anki Desktop.
   - Lancer le minuteur en mode application épuré.
   - Aligner Anki à gauche (2/3 de l'écran) et AnkiPomo à droite (1/3 de l'écran).

> *Note : Au premier lancement, macOS vous demandera l'autorisation d'accorder le contrôle de l'accessibilité au Terminal pour lui permettre de redimensionner les fenêtres (Réglages Système > Confidentialité et sécurité > Accessibilité).*
