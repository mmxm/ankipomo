// --- STATE & CONFIGURATION ---
const DEFAULT_CONFIG = {
  focusTime: 25,
  breakTime: 5,
  ankiUrl: 'http://127.0.0.1:8765',
  autoSequence: true,
  statsVisible: true
};

let config = { ...DEFAULT_CONFIG };
let timerInterval = null;
let timeLeft = 0;
let totalDuration = 0;
let isRunning = false;
let currentMode = 'focus'; // 'focus' or 'break'
let sessionCount = 1;

// Anki review tracking state
let focusStartTime = null; 
let cardStats = {
  totalReviews: 0,
  uniqueCards: new Set(),
  totalTimeMs: 0,
  easeCounts: { 1: 0, 2: 0, 3: 0, 4: 0 }
};

let ankiPollInterval = null;
let connectionCheckInterval = null;

// --- DOM ELEMENTS ---
const bodyElement = document.body;
const timerDisplay = document.getElementById('timer-display');
const timerPhase = document.getElementById('timer-phase');
const progressBar = document.getElementById('progress-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

// Controls
const btnFocus = document.getElementById('btn-focus');
const btnShortBreak = document.getElementById('btn-short-break');
const btnReset = document.getElementById('btn-reset');

// Settings Inputs
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const inputFocusTime = document.getElementById('input-focus-time');
const inputBreakTime = document.getElementById('input-break-time');
const inputAnkiUrl = document.getElementById('input-anki-url');
const inputAutoSequence = document.getElementById('input-auto-sequence');

// Anki Status
const ankiStatus = document.getElementById('anki-status');
const dot = ankiStatus.querySelector('.status-dot');
const statusText = ankiStatus.querySelector('.status-text');

// Stats Toggle
const btnToggleStats = document.getElementById('btn-toggle-stats');
const statsContentWrapper = document.getElementById('stats-content-wrapper');
const iconEyeOpen = document.getElementById('icon-eye-open');
const iconEyeClosed = document.getElementById('icon-eye-closed');

// Stats Values
const valTotalReviews = document.getElementById('stat-total-reviews');
const valUniqueCards = document.getElementById('stat-unique-cards');
const valAvgSpeed = document.getElementById('stat-avg-speed');
const textSessionCount = document.getElementById('session-count');

// Breakdown progress bars
const labelAgain = document.getElementById('count-again');
const labelHard = document.getElementById('count-hard');
const labelGood = document.getElementById('count-good');
const labelEasy = document.getElementById('count-easy');
const fillAgain = document.getElementById('fill-again');
const fillHard = document.getElementById('fill-hard');
const fillGood = document.getElementById('fill-good');
const fillEasy = document.getElementById('fill-easy');

// Hot Air Balloon Sky container
const balloonSky = document.getElementById('balloon-sky');
let lastReviewsCount = -1; // Track reviews to detect additions

// Circle Geometry constants
const circleRadius = 68;
const circumference = 2 * Math.PI * circleRadius; // ~427.26

// --- SOUND EFFECTS (Web Audio API) ---
function playChime(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // Smooth mellow sound
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (type === 'focusFinished') {
      // Ascending chime (Focus completed -> reward)
      playNote(523.25, now, 0.4);       // C5
      playNote(659.25, now + 0.15, 0.4);  // E5
      playNote(783.99, now + 0.3, 0.6);   // G5
    } else {
      // Descending chime (Break completed -> go back to focus)
      playNote(783.99, now, 0.4);       // G5
      playNote(659.25, now + 0.15, 0.4);  // E5
      playNote(523.25, now + 0.3, 0.6);   // C5
    }
  } catch (e) {
    console.warn("AudioContext not supported or blocked: ", e);
  }
}

// --- SYSTEM NOTIFICATIONS (macOS / Browser) ---
function showSystemNotification(title, body) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: '/logo.svg',
      silent: true // Custom chimes are already playing via Web Audio API
    });
  }
}

// --- LOCAL STORAGE & LOAD ---
function loadConfig() {
  const saved = localStorage.getItem('anki-pomo-config');
  if (saved) {
    try {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      config = { ...DEFAULT_CONFIG };
    }
  }
  applyConfigToInputs();
  applyStatsVisibility();
}

function saveConfig() {
  localStorage.setItem('anki-pomo-config', JSON.stringify(config));
}

function applyConfigToInputs() {
  inputFocusTime.value = config.focusTime;
  inputBreakTime.value = config.breakTime;
  inputAnkiUrl.value = config.ankiUrl;
  inputAutoSequence.checked = config.autoSequence;
}

function applyStatsVisibility() {
  if (config.statsVisible) {
    statsContentWrapper.classList.remove('collapsed');
    iconEyeOpen.style.display = 'block';
    iconEyeClosed.style.display = 'none';
  } else {
    statsContentWrapper.classList.add('collapsed');
    iconEyeOpen.style.display = 'none';
    iconEyeClosed.style.display = 'block';
  }
}

// --- TIMER LOGIC ---
function updateTimerUI() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  timerDisplay.textContent = displayStr;
  
  // Document title updates for easy tab monitoring
  document.title = `[${displayStr}] AnkiPomo`;
  
  // Progress Circle
  const progressPercent = (timeLeft / totalDuration) * 100;
  const offset = circumference - (progressPercent / 100) * circumference;
  progressBar.setAttribute('stroke-dasharray', circumference);
  progressBar.setAttribute('stroke-dashoffset', offset);
}

function setMode(mode) {
  currentMode = mode;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  stopAnkiPolling();

  // Reset icons
  iconPlay.style.display = 'block';
  iconPause.style.display = 'none';

  if (mode === 'focus') {
    bodyElement.classList.remove('theme-break');
    bodyElement.classList.add('theme-focus');
    btnFocus.classList.add('active');
    btnShortBreak.classList.remove('active');
    timerPhase.textContent = 'Focus';
    progressBar.style.stroke = 'var(--primary)';
    
    totalDuration = config.focusTime * 60;
    timeLeft = totalDuration;
    
    // Reset reviews for a brand new focus session
    resetFocusStats();
  } else {
    bodyElement.classList.remove('theme-focus');
    bodyElement.classList.add('theme-break');
    btnShortBreak.classList.add('active');
    btnFocus.classList.remove('active');
    timerPhase.textContent = 'Break';
    progressBar.style.stroke = 'var(--break)';
    
    totalDuration = config.breakTime * 60;
    timeLeft = totalDuration;
    // Note: In break mode, we do NOT clear statistics so the user can review their focus accomplishments!
  }
  updateTimerUI();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  iconPlay.style.display = 'none';
  iconPause.style.display = 'block';

  // Mark start time for reviews if focusing
  if (currentMode === 'focus' && !focusStartTime) {
    focusStartTime = Date.now();
    startAnkiPolling();
  }

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerUI();
    } else {
      // Phase completed!
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      
      if (currentMode === 'focus') {
        playChime('focusFinished');
        showSystemNotification("Focus Terminé ! ⚡", "C'est l'heure de faire une pause.");
        // Transition to Break
        sessionCount++;
        textSessionCount.textContent = `Session #${sessionCount}`;
        setMode('break');
      } else {
        playChime('breakFinished');
        showSystemNotification("Pause Terminée ! 🎯", "C'est l'heure de vous concentrer.");
        // Transition to Focus
        setMode('focus');
      }

      // Automatically chain next session if enabled
      if (config.autoSequence) {
        setTimeout(() => {
          startTimer();
        }, 1000); // 1s buffer
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  iconPlay.style.display = 'block';
  iconPause.style.display = 'none';
  stopAnkiPolling();
}

function resetFocusStats() {
  focusStartTime = null;
  cardStats = {
    totalReviews: 0,
    uniqueCards: new Set(),
    totalTimeMs: 0,
    easeCounts: { 1: 0, 2: 0, 3: 0, 4: 0 }
  };
  // Clear any remaining flying balloons
  if (balloonSky) {
    const flyingBalloons = balloonSky.querySelectorAll('.balloon-fly');
    flyingBalloons.forEach(b => b.remove());
  }
  lastReviewsCount = 0;
  updateStatsUI();
}

// --- ANKICONNECT CLIENT ---
async function invokeAnki(action, params = {}) {
  try {
    const response = await fetch(config.ankiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, version: 6, params })
    });
    if (!response.ok) throw new Error('API server down');
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (err) {
    throw err;
  }
}

async function checkAnkiConnection() {
  try {
    await invokeAnki('version');
    setAnkiStatusUI(true);
  } catch (e) {
    setAnkiStatusUI(false);
  }
}

function setAnkiStatusUI(isConnected) {
  if (isConnected) {
    dot.className = 'status-dot status-online';
    statusText.textContent = 'Anki Connecté';
  } else {
    dot.className = 'status-dot status-offline';
    statusText.textContent = 'Anki Déconnecté';
  }
}

// Poll reviewed cards during Focus
async function pollAnkiReviews() {
  if (!focusStartTime || currentMode !== 'focus') return;
  
  try {
    // 1. Find cards reviewed in the last 24h (rated:1)
    const cardIds = await invokeAnki('findCards', { query: 'rated:1' });
    if (!cardIds || cardIds.length === 0) {
      updateStatsUI();
      return;
    }

    // 2. Retrieve review logs for these cards
    const reviewsMap = await invokeAnki('getReviewsOfCards', { cards: cardIds });
    
    // 3. Process logs filter by startTime
    let totalReviews = 0;
    const uniqueCards = new Set();
    let totalTimeMs = 0;
    const easeCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const cardId in reviewsMap) {
      const logs = reviewsMap[cardId];
      logs.forEach(log => {
        // In Anki, log.id is the review millisecond epoch timestamp
        if (log.id >= focusStartTime) {
          totalReviews++;
          uniqueCards.add(parseInt(cardId));
          totalTimeMs += log.time; // review time in ms
          if (easeCounts[log.ease] !== undefined) {
            easeCounts[log.ease]++;
          }
        }
      });
    }

    // Update state
    cardStats = {
      totalReviews,
      uniqueCards,
      totalTimeMs,
      easeCounts
    };

    updateStatsUI();
  } catch (err) {
    console.error('Erreur lors de la récupération des révisions :', err);
    checkAnkiConnection();
  }
}

function startAnkiPolling() {
  stopAnkiPolling();
  // Poll every 5 seconds
  pollAnkiReviews(); // immediate run
  ankiPollInterval = setInterval(pollAnkiReviews, 5000);
}

function stopAnkiPolling() {
  if (ankiPollInterval) {
    clearInterval(ankiPollInterval);
    ankiPollInterval = null;
  }
}

// --- UPDATE STATS AND MANA VIAL ---
function updateStatsUI() {
  // Stats summary cards
  valTotalReviews.textContent = cardStats.totalReviews;
  valUniqueCards.textContent = cardStats.uniqueCards.size;
  
  const avgSpeedSec = cardStats.totalReviews > 0 
    ? (cardStats.totalTimeMs / cardStats.totalReviews / 1000).toFixed(1) 
    : 0;
  valAvgSpeed.textContent = `${avgSpeedSec}s`;

  // Bars breakdown
  const computePercent = (count) => {
    if (cardStats.totalReviews === 0) return 0;
    return Math.round((count / cardStats.totalReviews) * 100);
  };

  const pAgain = computePercent(cardStats.easeCounts[1]);
  const pHard = computePercent(cardStats.easeCounts[2]);
  const pGood = computePercent(cardStats.easeCounts[3]);
  const pEasy = computePercent(cardStats.easeCounts[4]);

  labelAgain.textContent = `${cardStats.easeCounts[1]} (${pAgain}%)`;
  labelHard.textContent = `${cardStats.easeCounts[2]} (${pHard}%)`;
  labelGood.textContent = `${cardStats.easeCounts[3]} (${pGood}%)`;
  labelEasy.textContent = `${cardStats.easeCounts[4]} (${pEasy}%)`;

  fillAgain.style.width = `${pAgain}%`;
  fillHard.style.width = `${pHard}%`;
  fillGood.style.width = `${pGood}%`;
  fillEasy.style.width = `${pEasy}%`;

  // Trigger hot air balloon launch if the reviews count increased
  updateBalloons(cardStats.totalReviews);
}

// Manages hot air balloon triggers
function updateBalloons(count) {
  if (lastReviewsCount === -1) {
    // Initial check: don't launch balloons on load
    lastReviewsCount = count;
    return;
  }
  
  if (count > lastReviewsCount) {
    const newBalloons = count - lastReviewsCount;
    // Launch balloons one by one with a small stagger delay if multiple cards were completed
    for (let i = 0; i < newBalloons; i++) {
      setTimeout(launchBalloon, i * 800);
    }
  }
  
  lastReviewsCount = count;
}

// Launches a single hot air balloon with randomized height, size, and speed sways
function launchBalloon() {
  if (!balloonSky) return;

  const balloon = document.createElement('div');
  balloon.className = 'balloon-fly';

  // Random size: 20px to 75px (matches codepen's 15px to 80px range)
  const size = Math.floor(Math.random() * 56) + 20;
  // Random top vertical position: 10% to 65%
  const top = Math.floor(Math.random() * 56) + 10;
  
  // Set z-index based on size for depth perception (hills are z-index 3)
  const zIndex = size < 35 ? 2 : 4;
  
  // Random vertical sway and rotation offsets for custom paths
  const swayY1 = Math.floor(Math.random() * 12) - 15; // -15px to -3px
  const swayY2 = Math.floor(Math.random() * 12) + 3;   // 3px to 15px
  const swayR1 = Math.floor(Math.random() * 6) - 7;   // -7deg to -1deg
  const swayR2 = Math.floor(Math.random() * 6) + 1;   // 1deg to 7deg

  // Base duration: smaller balloons move slower (10s - 13s), larger ones move faster (6s - 8s)
  const baseDuration = 13 - ((size - 20) / 55) * 6; // ranges from 13s down to 7s
  const duration = (baseDuration + (Math.random() * 2 - 1)).toFixed(1); // add small random variance (-1s to +1s)

  balloon.style.setProperty('--b-size', `${size}px`);
  balloon.style.setProperty('--b-top', `${top}%`);
  balloon.style.setProperty('--b-zindex', zIndex);
  balloon.style.setProperty('--sway-y1', `${swayY1}px`);
  balloon.style.setProperty('--sway-y2', `${swayY2}px`);
  balloon.style.setProperty('--sway-r1', `${swayR1}deg`);
  balloon.style.setProperty('--sway-r2', `${swayR2}deg`);
  balloon.style.animationDuration = `${duration}s`;

  // SVG Image element
  const img = document.createElement('img');
  img.src = '/airballoon.svg';
  img.className = 'balloon-img';
  img.alt = 'Montgolfière';
  
  balloon.appendChild(img);
  balloonSky.appendChild(balloon);

  // Remove elements when the flight animation ends to keep the DOM clean
  balloon.addEventListener('animationend', () => {
    balloon.remove();
  });
}

// --- EVENT HANDLERS ---
function initApp() {
  loadConfig();
  
  // Set default mode (focus)
  setMode('focus');

  // Play/Pause button
  playPauseBtn.addEventListener('click', () => {
    // Request notification permission on first interaction
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  // Action buttons
  btnFocus.addEventListener('click', () => {
    setMode('focus');
  });

  btnShortBreak.addEventListener('click', () => {
    setMode('break');
  });

  btnReset.addEventListener('click', () => {
    setMode(currentMode);
  });

  // Settings Panel Toggle
  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('collapsed');
    const arrow = settingsToggle.querySelector('.toggle-arrow');
    arrow.textContent = settingsPanel.classList.contains('collapsed') ? '▼' : '▲';
  });

  // Save config on input changes
  const inputs = [inputFocusTime, inputBreakTime, inputAnkiUrl, inputAutoSequence];
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      config.focusTime = parseInt(inputFocusTime.value) || DEFAULT_CONFIG.focusTime;
      config.breakTime = parseInt(inputBreakTime.value) || DEFAULT_CONFIG.breakTime;
      config.ankiUrl = inputAnkiUrl.value || DEFAULT_CONFIG.ankiUrl;
      config.autoSequence = inputAutoSequence.checked;
      
      saveConfig();

      // Reset timer length to match config changes if not running
      if (!isRunning) {
        setMode(currentMode);
      }
    });
  });

  // Stats visibility toggle click
  btnToggleStats.addEventListener('click', () => {
    config.statsVisible = !config.statsVisible;
    saveConfig();
    applyStatsVisibility();
  });

  // Clicking connection status triggers manual connection check
  ankiStatus.addEventListener('click', () => {
    checkAnkiConnection();
  });

  // Easter Egg click listener on the sky capsule
  if (balloonSky) {
    balloonSky.addEventListener('click', () => {
      launchBalloon();
    });
  }

  // Background loops
  checkAnkiConnection();
  connectionCheckInterval = setInterval(checkAnkiConnection, 10000);
}

// Register Service Worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Launch
window.addEventListener('DOMContentLoaded', initApp);
