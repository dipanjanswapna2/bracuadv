import { CoursePlan, BotSettings } from '../types/advising';
import JSZip from 'jszip';

export function generateManifestJson(): string {
  return JSON.stringify(
    {
      manifest_version: 3,
      name: 'BRACU Connect Auto Advising Robot',
      version: '2.4.0',
      description: 'Automated course selection, unlimited fallback priority solver, seat availability monitor and slot locking for BRAC University advising portal.',
      author: 'BRACU Student Community',
      permissions: ['storage', 'activeTab', 'scripting'],
      host_permissions: [
        'https://connect.bracu.ac.bd/*',
        'https://sso.bracu.ac.bd/*'
      ],
      action: {
        default_popup: 'popup.html',
        default_title: 'BRACU Auto Advising Bot',
      },
      content_scripts: [
        {
          matches: [
            'https://connect.bracu.ac.bd/*',
            'https://sso.bracu.ac.bd/*'
          ],
          js: ['content.js'],
          css: ['overlay.css'],
          run_at: 'document_idle',
        },
      ],
    },
    null,
    2
  );
}

export function generateContentScript(courses: CoursePlan[], settings: BotSettings): string {
  const serializedCourses = JSON.stringify(courses, null, 2);
  const serializedSettings = JSON.stringify(settings, null, 2);

  return `/**
 * BRACU Connect Auto Advising Robot - Content Script
 * Works seamlessly on:
 * - Pre-Registration Phase One: /student/advising/phase-one
 * - Pre-Registration Phase Two: /student/advising/phase-two
 * - Self Registration: /student/advising/self-registration
 */

(function () {
  'use strict';

  if (window.__BRACU_AUTO_ADVISING_LOADED__) {
    console.log('[BRACU Bot] Already active in this tab.');
    return;
  }
  window.__BRACU_AUTO_ADVISING_LOADED__ = true;

  // Initial config passed from generator or chrome.storage
  let CONFIG_COURSES = ${serializedCourses};
  let SETTINGS = ${serializedSettings};

  let botRunning = false;
  let pollTimer = null;
  let logHistory = [];

  function addLog(type, msg) {
    const time = new Date().toLocaleTimeString();
    const entry = { time, type, msg };
    logHistory.unshift(entry);
    if (logHistory.length > 50) logHistory.pop();
    console.log(\`[BRACU Bot \${time}] [\${type.toUpperCase()}] \${msg}\`);
    renderLogs();
  }

  // Play browser audio beep
  function playBeep(freq = 600, duration = 150) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {}
  }

  // 1. Create Floating HUD Widget inside BRACU Connect Portal
  function injectHUD() {
    if (document.getElementById('bracu-advising-bot-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'bracu-advising-bot-hud';
    hud.innerHTML = \`
      <div class="bb-card">
        <div class="bb-header">
          <div class="bb-title">
            <span class="bb-dot"></span>
            <strong>BRACU Auto Advising Bot</strong>
            <span class="bb-badge" id="bb-phase-badge">\${SETTINGS.targetPhase}</span>
          </div>
          <div class="bb-controls">
            <button id="bb-btn-min" title="Minimize/Maximize">_</button>
          </div>
        </div>

        <div class="bb-body" id="bb-main-body">
          <div class="bb-status-row">
            <span class="bb-label">Status:</span>
            <span id="bb-status-val" class="bb-status-idle">IDLE</span>
            <span id="bb-secured-count">0/\${CONFIG_COURSES.length} Locked</span>
          </div>

          <div class="bb-actions">
            <button id="bb-btn-toggle" class="bb-btn bb-btn-start">Start Auto Bot</button>
            <button id="bb-btn-refresh" class="bb-btn bb-btn-sec">Instant Scan</button>
          </div>

          <div class="bb-plans" id="bb-plans-container">
            <!-- Dynamic course items -->
          </div>

          <div class="bb-options">
            <label><input type="checkbox" id="bb-opt-confirm" \${SETTINGS.autoConfirmAdvising ? 'checked' : ''}> Auto Confirm Advising</label>
            <label><input type="checkbox" id="bb-opt-sound" \${SETTINGS.soundAlerts ? 'checked' : ''}> Sound Alert on Lock</label>
          </div>

          <div class="bb-terminal">
            <div class="bb-terminal-header">Live Action Log:</div>
            <div class="bb-terminal-logs" id="bb-terminal-logs"></div>
          </div>
        </div>
      </div>
    \`;

    document.body.appendChild(hud);

    // Event listeners
    document.getElementById('bb-btn-min').addEventListener('click', () => {
      const body = document.getElementById('bb-main-body');
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('bb-btn-toggle').addEventListener('click', () => {
      if (botRunning) {
        stopBot();
      } else {
        startBot();
      }
    });

    document.getElementById('bb-btn-refresh').addEventListener('click', () => {
      runCycle(true);
    });

    document.getElementById('bb-opt-confirm').addEventListener('change', (e) => {
      SETTINGS.autoConfirmAdvising = e.target.checked;
      addLog('info', 'Auto confirm set to: ' + e.target.checked);
    });

    document.getElementById('bb-opt-sound').addEventListener('change', (e) => {
      SETTINGS.soundAlerts = e.target.checked;
    });

    renderCourseCards();
    addLog('info', 'BRACU Bot HUD loaded successfully. Ready for advising.');
  }

  function renderCourseCards() {
    const container = document.getElementById('bb-plans-container');
    if (!container) return;
    container.innerHTML = CONFIG_COURSES.map((c, i) => \`
      <div class="bb-plan-item \${c.status}">
        <div class="bb-plan-top">
          <span class="bb-course-code">\${c.courseCode}</span>
          <span class="bb-plan-status">\${c.securedSection ? 'Sec ' + c.securedSection + ' (' + c.securedFaculty + ')' : c.status.toUpperCase()}</span>
        </div>
        <div class="bb-choices-strip">
          \${c.choices.map((ch, idx) => \`
            <span class="bb-choice-pill \${c.securedSection === ch.sectionNumber ? 'active' : ''}" title="Choice \${ch.priority}: Sec \${ch.sectionNumber} - \${ch.faculty}">
              #\${ch.priority}: \${ch.sectionNumber}(\${ch.faculty})
            </span>
          \`).join('')}
        </div>
      </div>
    \`).join('');
  }

  function renderLogs() {
    const el = document.getElementById('bb-terminal-logs');
    if (!el) return;
    el.innerHTML = logHistory.map(l => \`
      <div class="bb-log bb-log-\${l.type}">
        <span class="bb-log-time">[\${l.time}]</span> \${l.msg}
      </div>
    \`).join('');
  }

  function updateStatusUI(status, isRunning) {
    const el = document.getElementById('bb-status-val');
    const btn = document.getElementById('bb-btn-toggle');
    const securedEl = document.getElementById('bb-secured-count');
    if (el) {
      el.className = isRunning ? 'bb-status-running' : 'bb-status-idle';
      el.textContent = status;
    }
    if (btn) {
      btn.className = isRunning ? 'bb-btn bb-btn-stop' : 'bb-btn bb-btn-start';
      btn.textContent = isRunning ? 'Stop Bot' : 'Start Auto Bot';
    }
    if (securedEl) {
      const locked = CONFIG_COURSES.filter(c => c.status === 'locked').length;
      securedEl.textContent = \`\${locked}/\${CONFIG_COURSES.length} Locked\`;
    }
    renderCourseCards();
  }

  // 2. Parse Section Name format: e.g. "CSE230-[05](0)-AVB" or "CSE230-[06](-1)-FIC"
  function parseSectionCell(text) {
    if (!text) return null;
    const clean = text.trim();
    // Regular expression matching: COURSE-[SEC](SEATS)-FACULTY
    const match = clean.match(/^([A-Za-z0-9]+)-\[(\\d+)\]\\((-?\\d+)\\)-([A-Za-z0-9]+)/i);
    if (match) {
      return {
        courseCode: match[1].toUpperCase(),
        sectionNumber: match[2].padStart(2, '0'),
        seats: parseInt(match[3], 10),
        faculty: match[4].toUpperCase(),
        raw: clean,
      };
    }
    // Also support fallback format like "CSE111L-[16] -TBA"
    const matchSelected = clean.match(/^([A-Za-z0-9]+)-\[(\\d+)\]\\s*-?\\s*([A-Za-z0-9]+)?/i);
    if (matchSelected) {
      return {
        courseCode: matchSelected[1].toUpperCase(),
        sectionNumber: matchSelected[2].padStart(2, '0'),
        seats: 0,
        faculty: matchSelected[3] ? matchSelected[3].toUpperCase() : 'TBA',
        raw: clean,
      };
    }
    return null;
  }

  // 3. Scan already Selected Sections table to avoid duplicate attempts
  function getSelectedCourseCodes() {
    const selected = new Set();
    const rows = document.querySelectorAll('div[grid-id="10"] .ag-row, .selected-sections-table tr, app-easy-grid:nth-of-type(2) .ag-row');
    rows.forEach(row => {
      const cell = row.querySelector('[col-id="sectionName"], td');
      if (cell) {
        const parsed = parseSectionCell(cell.textContent);
        if (parsed) {
          selected.add(parsed.courseCode);
          // Mark our plan as locked if it matches
          const matchPlan = CONFIG_COURSES.find(c => c.courseCode === parsed.courseCode);
          if (matchPlan && matchPlan.status !== 'locked') {
            matchPlan.status = 'locked';
            matchPlan.securedSection = parsed.sectionNumber;
            matchPlan.securedFaculty = parsed.faculty;
            addLog('success', \`Confirmed already selected: \${parsed.courseCode} Section \${parsed.sectionNumber}\`);
          }
        }
      }
    });
    return selected;
  }

  // 4. Quick Filter input helper - types into the portal quick filter to pull rows
  function filterPortal(query) {
    const input = document.querySelector('input.quick-filter, input[placeholder*="Quick filter"], input[placeholder*="Search"]');
    if (input) {
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    }
  }

  // 5. Scan Available Courses AG-Grid rows and click green plus (+) button
  async function attemptCourseSelection(plan) {
    if (plan.status === 'locked') return true;

    addLog('info', \`Scanning for \${plan.courseCode}...\`);
    filterPortal(plan.courseCode.toLowerCase());

    // Give AG Grid 200ms to render filtered rows
    await new Promise(r => setTimeout(r, 220));

    // Get all rendered rows in available courses grid (grid-id 9)
    const rows = Array.from(document.querySelectorAll('div[grid-id="9"] .ag-row, .available-courses .ag-row'));
    if (rows.length === 0) {
      addLog('warning', \`No rows visible for \${plan.courseCode}. Retrying...\`);
      return false;
    }

    // Sort choices by priority 1 -> 6
    const sortedChoices = [...plan.choices].sort((a, b) => a.priority - b.priority);

    for (const choice of sortedChoices) {
      const targetSecPadded = choice.sectionNumber.padStart(2, '0');
      addLog('info', \`Evaluating Choice #\${choice.priority}: \${plan.courseCode} Sec \${targetSecPadded} (\${choice.faculty})\`);

      // Find matching row in grid
      let matchedRow = null;
      let availableSeats = 0;

      for (const row of rows) {
        const secCell = row.querySelector('[col-id="sectionName"]');
        if (!secCell) continue;

        const parsed = parseSectionCell(secCell.textContent);
        if (!parsed) continue;

        if (
          parsed.courseCode === plan.courseCode &&
          parsed.sectionNumber === targetSecPadded &&
          (!choice.faculty || choice.faculty === 'ANY' || parsed.faculty === choice.faculty.toUpperCase())
        ) {
          matchedRow = row;
          availableSeats = parsed.seats;
          break;
        }
      }

      if (!matchedRow) {
        addLog('warning', \`Choice #\${choice.priority} (Sec \${targetSecPadded}) not found in current view. Trying next choice...\`);
        continue;
      }

      // Check seat availability!
      if (availableSeats <= 0) {
        addLog('warning', \`Choice #\${choice.priority} Sec \${targetSecPadded} has \${availableSeats} seats (FULL). Falling back to next priority!\`);
        if (SETTINGS.soundAlerts) playBeep(350, 100);
        continue; // Fallback to next choice!
      }

      // Available seats > 0! Lock slot now!
      addLog('action', \`SEAT FOUND! Sec \${targetSecPadded} has \${availableSeats} seats open. Clicking Add (+) button!\`);
      
      // Find the Add (+) button in the row
      const actionCell = matchedRow.querySelector('[col-id="action"], [col-id="__action"], .ag-cell:last-child');
      let addButton = null;

      if (actionCell) {
        // Look for green plus button, mat-icon with add, or SVG
        addButton = actionCell.querySelector('button:has(mat-icon), button:has(i), button:last-child, button.btn-success, .ki-plus');
        if (!addButton) {
          addButton = actionCell.querySelector('button');
        }
      }

      if (addButton) {
        addButton.click();
        if (SETTINGS.soundAlerts) playBeep(880, 250);

        plan.status = 'locked';
        plan.securedSection = targetSecPadded;
        plan.securedFaculty = choice.faculty;
        addLog('success', \`LOCKED \${plan.courseCode} Section \${targetSecPadded} (\${choice.faculty})! [Priority #\${choice.priority}]\`);

        // Check if there is an associated lab section
        if (plan.hasLab && choice.labSectionNumber) {
          await handleLabSection(plan, choice);
        }

        updateStatusUI('RUNNING', true);
        return true;
      } else {
        addLog('error', \`Could not find clickable Add button for \${plan.courseCode} Sec \${targetSecPadded}\`);
      }
    }

    addLog('warning', \`All choices for \${plan.courseCode} currently full. Will retry next cycle.\`);
    return false;
  }

  // Handle auto-adding corresponding Lab Section
  async function handleLabSection(plan, choice) {
    const labCode = plan.labCode || (plan.courseCode + 'L');
    const labSec = (choice.labSectionNumber || choice.sectionNumber).padStart(2, '0');
    addLog('info', \`Auto-locking linked lab: \${labCode} Sec \${labSec}...\`);

    filterPortal(labCode.toLowerCase());
    await new Promise(r => setTimeout(r, 200));

    const rows = Array.from(document.querySelectorAll('div[grid-id="9"] .ag-row'));
    for (const row of rows) {
      const secCell = row.querySelector('[col-id="sectionName"]');
      if (!secCell) continue;
      const parsed = parseSectionCell(secCell.textContent);
      if (parsed && parsed.courseCode === labCode && parsed.sectionNumber === labSec) {
        const btn = row.querySelector('[col-id="action"] button, [col-id="__action"] button, button');
        if (btn) {
          btn.click();
          addLog('success', \`Secured linked lab \${labCode} Section \${labSec}!\`);
          return;
        }
      }
    }
  }

  // 6. Main cycle execution
  async function runCycle(forceSingle = false) {
    getSelectedCourseCodes();
    let allLocked = true;

    for (const plan of CONFIG_COURSES) {
      if (plan.status !== 'locked') {
        allLocked = false;
        await attemptCourseSelection(plan);
        await new Promise(r => setTimeout(r, SETTINGS.pollingIntervalMs || 400));
      }
    }

    if (allLocked) {
      addLog('success', 'ALL COURSES SUCCESSFULLY LOCKED!');
      updateStatusUI('ALL SECURED', false);
      if (SETTINGS.soundAlerts) {
        playBeep(523, 150);
        setTimeout(() => playBeep(659, 150), 180);
        setTimeout(() => playBeep(783, 250), 360);
      }

      if (SETTINGS.autoConfirmAdvising) {
        addLog('action', 'Triggering Confirm Advising button...');
        const confirmBtn = document.querySelector('button.btn-success, button:contains("Confirm Advising")');
        if (confirmBtn) {
          confirmBtn.click();
          addLog('success', 'Confirm Advising clicked automatically!');
        }
      }

      stopBot();
      return;
    }

    if (!forceSingle && botRunning) {
      pollTimer = setTimeout(runCycle, SETTINGS.pollingIntervalMs || 600);
    }
  }

  function startBot() {
    botRunning = true;
    updateStatusUI('SCANNING', true);
    addLog('info', \`Advising Bot started with \${SETTINGS.pollingIntervalMs}ms loop. Targeting \${SETTINGS.targetPhase}.\`);
    runCycle();
  }

  function stopBot() {
    botRunning = false;
    if (pollTimer) clearTimeout(pollTimer);
    updateStatusUI('STOPPED', false);
    addLog('info', 'Advising Bot paused by user.');
  }

  // Handle BRACU SSO Login Page & SLMS Splash Screen
  function initBotLifecycle() {
    // 1. If currently on SSO login page
    if (window.location.hostname.includes('sso.bracu.ac.bd')) {
      const userInput = document.getElementById('username') || document.querySelector('input[type="text"]');
      if (userInput) {
        userInput.focus();
        console.log('[BRACU Bot] On SSO Login page. Enter credentials to proceed to SLMS advising.');
      }
      return;
    }

    // 2. On connect.bracu.ac.bd: Wait for Metronic SLMS #splash-screen to dissolve
    let pollCount = 0;
    const checkSplashInterval = setInterval(() => {
      pollCount++;
      const splash = document.getElementById('splash-screen');
      const isSplashGone = !splash || splash.style.display === 'none' || splash.classList.contains('hidden');
      const hasAppContent = document.getElementById('kt_app_content') || document.querySelector('input.quick-filter') || document.querySelector('app-advising-panel');

      if (isSplashGone || hasAppContent || pollCount > 15) {
        clearInterval(checkSplashInterval);
        setTimeout(() => {
          injectHUD();
          if (SETTINGS.autoStartOnPageLoad) {
            startBot();
          }
        }, 500);
      }
    }, 300);
  }

  // Initialize on page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBotLifecycle);
  } else {
    initBotLifecycle();
  }

})();
`;
}

export function generateOverlayCSS(): string {
  return `
/* BRACU Auto Advising Bot Floating Overlay HUD */
#bracu-advising-bot-hud {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  max-width: 380px;
  width: 90vw;
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid #1e293b;
  overflow: hidden;
  font-size: 13px;
}

.bb-card {
  display: flex;
  flex-direction: column;
}

.bb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.bb-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.bb-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  box-shadow: 0 0 8px #10b981;
}

.bb-badge {
  font-size: 10px;
  text-transform: uppercase;
  background: #2563eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.bb-controls button {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
}
.bb-controls button:hover {
  color: #fff;
}

.bb-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bb-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.bb-status-idle {
  color: #94a3b8;
  font-weight: bold;
}
.bb-status-running {
  color: #10b981;
  font-weight: bold;
  animation: bb-pulse 1.5s infinite;
}

@keyframes bb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.bb-actions {
  display: flex;
  gap: 8px;
}

.bb-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 12px;
  transition: all 0.2s;
}

.bb-btn-start {
  background: #10b981;
  color: #022c22;
}
.bb-btn-start:hover {
  background: #059669;
  color: #fff;
}

.bb-btn-stop {
  background: #ef4444;
  color: #fff;
}
.bb-btn-stop:hover {
  background: #dc2626;
}

.bb-btn-sec {
  background: #334155;
  color: #f8fafc;
}
.bb-btn-sec:hover {
  background: #475569;
}

.bb-plans {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bb-plan-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 8px;
}
.bb-plan-item.locked {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.bb-plan-top {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 4px;
}

.bb-course-code {
  color: #38bdf8;
}

.bb-choices-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.bb-choice-pill {
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  background: #334155;
  color: #cbd5e1;
}
.bb-choice-pill.active {
  background: #10b981;
  color: #022c22;
  font-weight: bold;
}

.bb-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
}
.bb-options label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.bb-terminal {
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 6px;
}
.bb-terminal-header {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 4px;
  font-family: monospace;
}
.bb-terminal-logs {
  height: 80px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bb-log-info { color: #94a3b8; }
.bb-log-success { color: #34d399; font-weight: bold; }
.bb-log-warning { color: #fbbf24; }
.bb-log-error { color: #f87171; }
.bb-log-action { color: #38bdf8; }
`;
}

export function generatePopupHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BRACU Auto Advising Bot</title>
  <style>
    body {
      width: 320px;
      margin: 0;
      padding: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
    }
    h2 {
      margin: 0 0 10px 0;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      background: #2563eb;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
    }
    p {
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.4;
      margin: 0 0 12px 0;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 8px 0;
      text-align: center;
      background: #10b981;
      color: #022c22;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      margin-bottom: 8px;
    }
    .btn-sec {
      background: #334155;
      color: #f8fafc;
    }
    .footer {
      font-size: 11px;
      color: #64748b;
      text-align: center;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h2>🤖 BRACU Auto Advising <span class="badge">v2.4</span></h2>
  <p>Robot is armed and ready for BRAC University advising portal (connect.bracu.ac.bd).</p>
  <a href="https://connect.bracu.ac.bd/student/advising/self-registration" target="_blank" class="btn">Open Advising Portal</a>
  <button id="btn-sync" class="btn btn-sec">Sync Routine Config</button>
  <div class="footer">Pre-Registration Phase 1 & 2 • Self Registration</div>
  <script src="popup.js"></script>
</body>
</html>`;
}

export function generatePopupJs(): string {
  return `document.getElementById('btn-sync').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'SYNC_STATUS' });
    }
  });
});`;
}

export function generateBackgroundJs(): string {
  return `chrome.runtime.onInstalled.addListener(() => {
  console.log('BRACU Connect Auto Advising Robot installed.');
});`;
}

// Generate Userscript (Tampermonkey / Violentmonkey)
export function generateTampermonkeyUserscript(courses: CoursePlan[], settings: BotSettings): string {
  const contentScript = generateContentScript(courses, settings);
  const overlayCss = generateOverlayCSS();

  return `// ==UserScript==
// @name         BRACU Connect Auto Advising Bot (Unlimited Priority & Seat Monitor)
// @namespace    http://tampermonkey.net/
// @version      2.4.0
// @description  Automated course choosing, slot locking, and fallback priority solver for BRAC University Connect Portal
// @match        https://connect.bracu.ac.bd/*
// @match        https://sso.bracu.ac.bd/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';
  
  // Inject Bot HUD CSS styles
  const styleEl = document.createElement('style');
  styleEl.textContent = \`${overlayCss}\`;
  document.head.appendChild(styleEl);

  // Run Content Script
  ${contentScript}
})();
`;
}

// Generate Bookmarklet
export function generateBookmarklet(courses: CoursePlan[], settings: BotSettings): string {
  const contentScript = generateContentScript(courses, settings);
  const overlayCss = generateOverlayCSS();
  const raw = `(function(){
    var s=document.createElement('style');
    s.textContent=${JSON.stringify(overlayCss)};
    document.head.appendChild(s);
    ${contentScript}
  })();`;
  return `javascript:${encodeURIComponent(raw)}`;
}

// Generate complete downloadable ZIP
export async function createExtensionZip(courses: CoursePlan[], settings: BotSettings): Promise<Blob> {
  const zip = new JSZip();

  zip.file('manifest.json', generateManifestJson());
  zip.file('content.js', generateContentScript(courses, settings));
  zip.file('overlay.css', generateOverlayCSS());
  zip.file('popup.html', generatePopupHtml());
  zip.file('popup.js', generatePopupJs());
  zip.file('background.js', generateBackgroundJs());
  zip.file('README.txt', `BRACU Connect Auto Advising Chrome Extension
=============================================
How to Install in Chrome, Brave, Edge, or Opera:

1. Extract this ZIP file into a folder on your computer.
2. In Google Chrome or Brave, navigate to: chrome://extensions
   (In Microsoft Edge, navigate to: edge://extensions)
3. Turn ON "Developer mode" in the top-right corner.
4. Click the "Load unpacked" button in the top-left corner.
5. Select the extracted folder containing manifest.json.
6. Done! The BRACU Auto Advising Bot is now installed!
7. Navigate to https://connect.bracu.ac.bd/student/advising/self-registration
   The floating robot HUD will appear automatically at the bottom right!

Good luck with your advising!
`);

  return await zip.generateAsync({ type: 'blob' });
}
