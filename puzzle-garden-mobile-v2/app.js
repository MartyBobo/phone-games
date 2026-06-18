(() => {
  "use strict";

  const app = document.querySelector("#app");
  const homeButton = document.querySelector("#homeButton");
  const pageTitle = document.querySelector("#pageTitle");
  const pageSubtitle = document.querySelector("#pageSubtitle");
  const textSizeButton = document.querySelector("#textSizeButton");
  const soundButton = document.querySelector("#soundButton");
  const toast = document.querySelector("#toast");
  const celebrationLayer = document.querySelector("#celebration");
  const installButton = document.querySelector("#installButton");
  const installDialog = document.querySelector("#installDialog");
  const installDialogInstructions = document.querySelector("#installDialogInstructions");

  let currentCleanup = () => {};
  let toastTimer = 0;
  let audioContext = null;
  let deferredInstallPrompt = null;
  let viewportFrame = 0;

  const GAME_META = {
    sudoku: {
      title: "Number Grid",
      subtitle: "Sudoku-style logic",
      icon: "9",
      art: "assets/icons/number-grid.svg",
      description: "Fill every row, column, and 3×3 box without repeating a number."
    },
    tiles: {
      title: "Tile Pairs",
      subtitle: "Mahjong-solitaire-style matching",
      icon: "❀",
      art: "assets/icons/tile-pairs.svg",
      description: "Match two open tiles at a time and clear the layered board."
    },
    falling: {
      title: "Falling Shapes",
      subtitle: "A fresh falling-block puzzle",
      icon: "▦",
      art: "assets/icons/falling-shapes.svg",
      description: "Rotate and place falling shapes to complete and clear rows."
    },
    crates: {
      title: "Crate Trail",
      subtitle: "Tip towers to build a path",
      icon: "▥",
      art: "assets/icons/crate-trail.svg",
      description: "Tip stacks across the board so the explorer can reach the red lantern."
    }
  };

  const settings = {
    largeText: loadJSON("pg-setting-large-text", false),
    sound: loadJSON("pg-setting-sound", true)
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The games still work when browser storage is unavailable.
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIosDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function updateViewportMetrics() {
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(() => {
      const viewport = window.visualViewport;
      const height = Math.round(viewport?.height || window.innerHeight);
      const width = Math.round(viewport?.width || window.innerWidth);
      document.documentElement.style.setProperty("--app-height", `${height}px`);
      document.documentElement.style.setProperty("--app-width", `${width}px`);
    });
  }

  function updateInstallUi() {
    const installed = isStandalone();
    document.body.classList.toggle("standalone-mode", installed);
    if (installButton) installButton.hidden = installed || (!deferredInstallPrompt && !isIosDevice());
    const homeInstallButton = app.querySelector("#homeInstallButton");
    if (homeInstallButton) {
      homeInstallButton.hidden = installed;
      homeInstallButton.textContent = deferredInstallPrompt ? "Install app" : isIosDevice() ? "Add to Home Screen" : "Installation help";
    }
  }

  function showInstallInstructions() {
    if (!installDialog || !installDialogInstructions) return;
    if (isIosDevice()) {
      installDialogInstructions.innerHTML = `
        <p>Open Puzzle Garden in Safari, then:</p>
        <ol>
          <li>Tap the <strong>Share</strong> button.</li>
          <li>Choose <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>.</li>
        </ol>
        <p>The Home Screen icon opens the game in its own app-like window.</p>
      `;
    } else {
      installDialogInstructions.innerHTML = `
        <p>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
        <p>After installation, Puzzle Garden opens from an icon and continues to work after its files have been cached.</p>
      `;
    }
    if (typeof installDialog.showModal === "function") installDialog.showModal();
    else announce("Use your browser menu to add Puzzle Garden to the Home Screen.");
  }

  async function requestInstall() {
    if (isStandalone()) {
      announce("Puzzle Garden is already installed.");
      return;
    }
    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      promptEvent.prompt();
      try {
        const result = await promptEvent.userChoice;
        announce(result.outcome === "accepted" ? "Puzzle Garden was added to your device." : "Installation was cancelled.");
      } catch {
        // Some browsers do not expose a result.
      }
      updateInstallUi();
      return;
    }
    showInstallInstructions();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUi();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallUi();
    announce("Puzzle Garden is installed.");
  });

  installButton?.addEventListener("click", requestInstall);
  window.visualViewport?.addEventListener("resize", updateViewportMetrics);
  window.visualViewport?.addEventListener("scroll", updateViewportMetrics);
  window.addEventListener("resize", updateViewportMetrics, { passive: true });
  window.addEventListener("orientationchange", updateViewportMetrics, { passive: true });
  updateViewportMetrics();

  const pressableSelector = "button, .game-card, .sudoku-cell, .mahjong-tile, .crate-cell, .falling-control, .direction-button, .number-button";
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target.closest?.(pressableSelector);
    if (target && !target.disabled) target.classList.add("is-pressed");
  }, { passive: true });
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      document.querySelectorAll(".is-pressed").forEach((item) => item.classList.remove("is-pressed"));
    }, { passive: true });
  });

  document.addEventListener("contextmenu", (event) => {
    if (event.target.closest?.(".sudoku-grid, .tile-board, #fallingCanvas, .crate-board, .direction-pad, .number-pad")) {
      event.preventDefault();
    }
  });

  function keyOf(row, col) {
    return `${row},${col}`;
  }

  function parseKey(key) {
    return key.split(",").map(Number);
  }

  function announce(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function vibrate(pattern = 18) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  function playTone(frequency = 540, duration = 0.08, volume = 0.035) {
    if (!settings.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {
      // Sound is optional.
    }
  }

  function celebrate(message = "Puzzle complete!") {
    announce(message);
    playTone(660, 0.11, 0.05);
    window.setTimeout(() => playTone(880, 0.16, 0.045), 100);
    vibrate([20, 35, 35]);

    celebrationLayer.textContent = "";
    const colors = ["#315f5a", "#f0be66", "#b7433b", "#7c9b72", "#7e6aa2"];
    for (let i = 0; i < 38; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 240}px`);
      piece.style.animationDelay = `${Math.random() * 260}ms`;
      celebrationLayer.append(piece);
    }
    window.setTimeout(() => {
      celebrationLayer.textContent = "";
    }, 1800);
  }

  function setHeader(gameId = null) {
    if (!gameId) {
      pageTitle.textContent = "Puzzle Garden";
      pageSubtitle.textContent = "Four calm games, one simple website";
      homeButton.hidden = true;
      return;
    }

    const meta = GAME_META[gameId];
    pageTitle.textContent = meta.title;
    pageSubtitle.textContent = meta.subtitle;
    homeButton.hidden = false;
  }

  function applySettings() {
    document.body.classList.toggle("large-text", settings.largeText);
    textSizeButton.setAttribute("aria-pressed", String(settings.largeText));
    textSizeButton.setAttribute("aria-label", settings.largeText ? "Use regular text size" : "Use larger text");
    textSizeButton.title = settings.largeText ? "Regular text" : "Larger text";

    soundButton.setAttribute("aria-pressed", String(settings.sound));
    soundButton.setAttribute("aria-label", settings.sound ? "Turn sound off" : "Turn sound on");
    soundButton.title = settings.sound ? "Sound on" : "Sound off";
    soundButton.textContent = settings.sound ? "♪" : "×♪";
  }

  textSizeButton.addEventListener("click", () => {
    settings.largeText = !settings.largeText;
    saveJSON("pg-setting-large-text", settings.largeText);
    applySettings();
    playTone(520);
  });

  soundButton.addEventListener("click", () => {
    settings.sound = !settings.sound;
    saveJSON("pg-setting-sound", settings.sound);
    applySettings();
    if (settings.sound) playTone(620);
  });

  homeButton.addEventListener("click", () => {
    window.location.hash = "";
  });

  function route() {
    currentCleanup();
    currentCleanup = () => {};
    clearTimeout(toastTimer);
    toast.classList.remove("show");
    window.scrollTo({ top: 0, behavior: "auto" });

    const routeName = window.location.hash.replace(/^#\/?/, "");
    if (routeName && GAME_META[routeName]) {
      setHeader(routeName);
      if (routeName === "sudoku") currentCleanup = renderSudoku();
      if (routeName === "tiles") currentCleanup = renderTilePairs();
      if (routeName === "falling") currentCleanup = renderFallingShapes();
      if (routeName === "crates") currentCleanup = renderCrateTrail();
    } else {
      setHeader();
      renderHome();
    }

    app.focus({ preventScroll: true });
    updateViewportMetrics();
    updateInstallUi();
  }

  function renderHome() {
    app.innerHTML = `
      <section class="home-hero" aria-labelledby="homeHeading">
        <div>
          <h2 id="homeHeading">A little garden for big puzzles.</h2>
          <p>Choose a game, relax, and pick up exactly where you stopped. Everything is saved on this device.</p>
        </div>
        <div class="hero-art hero-image" aria-hidden="true">
          <img src="assets/hero-garden.svg" alt="" width="640" height="420">
        </div>
      </section>

      <aside class="home-note install-cta">
        <span class="home-note-icon" aria-hidden="true">▣</span>
        <div>
          <strong>Works like an app</strong>
          <span>Play with your finger, add the website to the Home Screen, and reopen it from its own icon.</span>
          <span class="phone-tip">Touch controls · Safe-area support · Offline-ready</span>
        </div>
        <button id="homeInstallButton" class="primary-button" type="button">Install app</button>
      </aside>

      <section class="game-grid" aria-label="Puzzle games">
        ${Object.entries(GAME_META).map(([id, meta]) => `
          <button class="game-card" type="button" data-game="${id}">
            <span class="game-card-icon" aria-hidden="true"><img src="${meta.art}" alt="" width="64" height="64"></span>
            <span>
              <h3>${meta.title}</h3>
              <p>${meta.description}</p>
            </span>
            <span class="game-card-arrow" aria-hidden="true">›</span>
          </button>
        `).join("")}
      </section>
    `;

    app.querySelectorAll("[data-game]").forEach((button) => {
      button.addEventListener("click", () => {
        playTone(480);
        window.location.hash = button.dataset.game;
      });
    });

    app.querySelector("#homeInstallButton")?.addEventListener("click", requestInstall);
    updateInstallUi();
  }

  /* ------------------------------------------------------------------ */
  /* Number Grid                                                        */
  /* ------------------------------------------------------------------ */

  const SUDOKU_BASES = [
    {
      difficulty: "Easy",
      puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
      solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    },
    {
      difficulty: "Medium",
      puzzle: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
      solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259"
    },
    {
      difficulty: "Hard",
      puzzle: "005300000800000020070010500400005300010070006003200080060500009004000030000009700",
      solution: "145327698839654127672918543496185372218473956753296481367542819984761235521839764"
    }
  ];

  const SUDOKU_TRANSFORMS = [
    {
      rows: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      cols: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      transpose: false,
      shift: 0
    },
    {
      rows: [3, 4, 5, 6, 7, 8, 0, 1, 2],
      cols: [6, 7, 8, 0, 1, 2, 3, 4, 5],
      transpose: false,
      shift: 3
    },
    {
      rows: [1, 2, 0, 4, 5, 3, 7, 8, 6],
      cols: [2, 0, 1, 5, 3, 4, 8, 6, 7],
      transpose: true,
      shift: 6
    }
  ];

  function transformSudoku(text, transform) {
    const grid = Array.from({ length: 9 }, (_, row) => text.slice(row * 9, row * 9 + 9).split(""));
    const output = [];

    for (let outputRow = 0; outputRow < 9; outputRow += 1) {
      for (let outputCol = 0; outputCol < 9; outputCol += 1) {
        const sourceRow = transform.transpose ? transform.rows[outputCol] : transform.rows[outputRow];
        const sourceCol = transform.transpose ? transform.cols[outputRow] : transform.cols[outputCol];
        const value = grid[sourceRow][sourceCol];
        if (value === "0") {
          output.push("0");
        } else {
          output.push(String(((Number(value) - 1 + transform.shift) % 9) + 1));
        }
      }
    }

    return output.join("");
  }

  const SUDOKU_PUZZLES = SUDOKU_BASES.flatMap((base, baseIndex) =>
    SUDOKU_TRANSFORMS.map((transform, transformIndex) => ({
      id: `${base.difficulty.toLowerCase()}-${transformIndex + 1}`,
      label: `${base.difficulty} ${transformIndex + 1}`,
      difficulty: base.difficulty,
      puzzle: transformSudoku(base.puzzle, transform),
      solution: transformSudoku(base.solution, transform),
      baseIndex
    }))
  );

  function sudokuPeerIndexes(index) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const peers = new Set();
    for (let i = 0; i < 9; i += 1) {
      peers.add(row * 9 + i);
      peers.add(i * 9 + col);
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r += 1) {
      for (let c = boxCol; c < boxCol + 3; c += 1) {
        peers.add(r * 9 + c);
      }
    }
    peers.delete(index);
    return peers;
  }

  function renderSudoku() {
    let currentPuzzleId = loadJSON("pg-sudoku-current", SUDOKU_PUZZLES[0].id);
    if (!SUDOKU_PUZZLES.some((item) => item.id === currentPuzzleId)) {
      currentPuzzleId = SUDOKU_PUZZLES[0].id;
    }

    let puzzle = SUDOKU_PUZZLES.find((item) => item.id === currentPuzzleId);
    let values = [];
    let notes = [];
    let selected = -1;
    let notesMode = false;
    let showMistakes = loadJSON("pg-sudoku-show-mistakes", true);
    let history = [];
    let completed = false;

    app.innerHTML = `
      <section class="game-layout" aria-labelledby="sudokuHeading">
        <div class="panel game-intro">
          <div>
            <h2 id="sudokuHeading">Number Grid</h2>
            <p>Place 1–9 so each row, column, and 3×3 box contains every number once.</p>
          </div>
          <div class="status-pill"><span>Difficulty</span><strong id="sudokuDifficulty"></strong></div>
        </div>

        <div class="panel toolbar" aria-label="Number Grid controls">
          <div class="toolbar-group">
            <label class="sr-only" for="sudokuPuzzleSelect">Choose a puzzle</label>
            <select id="sudokuPuzzleSelect" class="control">
              ${SUDOKU_PUZZLES.map((item) => `<option value="${item.id}">${item.label}</option>`).join("")}
            </select>
            <button id="sudokuRandom" class="secondary-button" type="button">New puzzle</button>
          </div>
          <div class="toolbar-group">
            <button id="sudokuUndo" class="secondary-button" type="button">Undo</button>
            <button id="sudokuHint" class="secondary-button" type="button">Hint</button>
            <button id="sudokuReset" class="danger-button" type="button">Reset</button>
          </div>
        </div>

        <div class="panel sudoku-shell">
          <div id="sudokuGrid" class="sudoku-grid" role="grid" aria-label="9 by 9 Number Grid"></div>
          <div id="numberPad" class="number-pad" aria-label="Number pad"></div>
          <div class="compact-toolbar">
            <button id="notesToggle" class="secondary-button toggle-button" type="button" aria-pressed="false">Pencil notes</button>
            <button id="mistakesToggle" class="secondary-button toggle-button" type="button" aria-pressed="true">Show mistakes</button>
          </div>
          <p class="help-text">Tap a square, then choose a number. A keyboard also works.</p>
        </div>
      </section>
    `;

    const gridElement = app.querySelector("#sudokuGrid");
    const numberPad = app.querySelector("#numberPad");
    const puzzleSelect = app.querySelector("#sudokuPuzzleSelect");
    const difficultyElement = app.querySelector("#sudokuDifficulty");
    const notesToggle = app.querySelector("#notesToggle");
    const mistakesToggle = app.querySelector("#mistakesToggle");
    const undoButton = app.querySelector("#sudokuUndo");

    puzzleSelect.value = currentPuzzleId;

    function saveState() {
      saveJSON(`pg-sudoku-${puzzle.id}`, {
        values,
        notes: notes.map((set) => [...set]),
        completed
      });
      saveJSON("pg-sudoku-current", puzzle.id);
    }

    function loadState(nextPuzzleId) {
      puzzle = SUDOKU_PUZZLES.find((item) => item.id === nextPuzzleId) || SUDOKU_PUZZLES[0];
      currentPuzzleId = puzzle.id;
      const saved = loadJSON(`pg-sudoku-${puzzle.id}`, null);
      const givens = puzzle.puzzle.split("");

      if (saved && Array.isArray(saved.values) && saved.values.length === 81) {
        values = saved.values.map((value, index) => givens[index] !== "0" ? givens[index] : String(value || "0"));
        notes = Array.from({ length: 81 }, (_, index) => new Set(Array.isArray(saved.notes?.[index]) ? saved.notes[index] : []));
        completed = Boolean(saved.completed);
      } else {
        values = givens;
        notes = Array.from({ length: 81 }, () => new Set());
        completed = false;
      }

      selected = values.findIndex((value, index) => value === "0" && givens[index] === "0");
      history = [];
      puzzleSelect.value = puzzle.id;
      difficultyElement.textContent = puzzle.difficulty;
      renderBoard();
      saveState();
    }

    function isGiven(index) {
      return puzzle.puzzle[index] !== "0";
    }

    function pushHistory(index) {
      history.push({
        index,
        value: values[index],
        notes: [...notes[index]]
      });
      if (history.length > 200) history.shift();
    }

    function removePeerNotes(index, digit) {
      sudokuPeerIndexes(index).forEach((peerIndex) => notes[peerIndex].delete(digit));
    }

    function checkComplete() {
      if (values.join("") === puzzle.solution) {
        if (!completed) celebrate("Number Grid complete!");
        completed = true;
      } else {
        completed = false;
      }
    }

    function setValue(digit) {
      if (selected < 0 || isGiven(selected)) {
        announce("Choose an empty square first.");
        return;
      }

      pushHistory(selected);
      if (notesMode && digit !== "0") {
        values[selected] = "0";
        if (notes[selected].has(digit)) notes[selected].delete(digit);
        else notes[selected].add(digit);
        playTone(440);
      } else {
        values[selected] = digit;
        notes[selected].clear();
        if (digit !== "0") removePeerNotes(selected, digit);
        playTone(digit === "0" ? 330 : 520);
      }

      checkComplete();
      saveState();
      renderBoard();
    }

    function undo() {
      const previous = history.pop();
      if (!previous) {
        announce("Nothing to undo yet.");
        return;
      }
      values[previous.index] = previous.value;
      notes[previous.index] = new Set(previous.notes);
      selected = previous.index;
      completed = false;
      saveState();
      renderBoard();
      playTone(360);
    }

    function renderBoard() {
      const selectedRow = selected >= 0 ? Math.floor(selected / 9) : -1;
      const selectedCol = selected >= 0 ? selected % 9 : -1;
      const selectedValue = selected >= 0 ? values[selected] : "0";
      gridElement.textContent = "";

      values.forEach((value, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "sudoku-cell";
        cell.dataset.index = String(index);
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}${value === "0" ? ", empty" : `, ${value}`}`);

        if (col === 2 || col === 5) cell.classList.add("box-right");
        if (row === 2 || row === 5) cell.classList.add("box-bottom");
        if (isGiven(index)) cell.classList.add("given");
        if (row === selectedRow || col === selectedCol || (Math.floor(row / 3) === Math.floor(selectedRow / 3) && Math.floor(col / 3) === Math.floor(selectedCol / 3))) {
          cell.classList.add("related");
        }
        if (selectedValue !== "0" && value === selectedValue) cell.classList.add("same-number");
        if (index === selected) cell.classList.add("selected");
        if (showMistakes && !isGiven(index) && value !== "0" && value !== puzzle.solution[index]) cell.classList.add("wrong");

        if (value !== "0") {
          cell.textContent = value;
        } else if (notes[index].size) {
          const noteGrid = document.createElement("span");
          noteGrid.className = "sudoku-notes";
          for (let digit = 1; digit <= 9; digit += 1) {
            const note = document.createElement("span");
            note.className = "sudoku-note";
            note.textContent = notes[index].has(String(digit)) ? String(digit) : "";
            noteGrid.append(note);
          }
          cell.append(noteGrid);
        }

        cell.addEventListener("click", () => {
          selected = index;
          playTone(390, 0.045, 0.02);
          renderBoard();
        });

        gridElement.append(cell);
      });

      notesToggle.setAttribute("aria-pressed", String(notesMode));
      notesToggle.textContent = notesMode ? "Pencil notes: on" : "Pencil notes";
      mistakesToggle.setAttribute("aria-pressed", String(showMistakes));
      undoButton.disabled = history.length === 0;
    }

    function buildNumberPad() {
      numberPad.textContent = "";
      for (let digit = 1; digit <= 9; digit += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "number-button";
        button.textContent = String(digit);
        button.setAttribute("aria-label", `Enter ${digit}`);
        button.addEventListener("click", () => setValue(String(digit)));
        numberPad.append(button);
      }

      const erase = document.createElement("button");
      erase.type = "button";
      erase.className = "number-button wide";
      erase.textContent = "Erase";
      erase.addEventListener("click", () => setValue("0"));
      numberPad.append(erase);

      const nextEmpty = document.createElement("button");
      nextEmpty.type = "button";
      nextEmpty.className = "number-button wide";
      nextEmpty.textContent = "Next empty";
      nextEmpty.addEventListener("click", () => {
        const start = selected < 0 ? 0 : selected + 1;
        for (let offset = 0; offset < 81; offset += 1) {
          const index = (start + offset) % 81;
          if (!isGiven(index) && values[index] === "0") {
            selected = index;
            renderBoard();
            return;
          }
        }
        announce("There are no empty squares.");
      });
      numberPad.append(nextEmpty);
    }

    puzzleSelect.addEventListener("change", () => {
      loadState(puzzleSelect.value);
      playTone(500);
    });

    app.querySelector("#sudokuRandom").addEventListener("click", () => {
      const sameDifficulty = SUDOKU_PUZZLES.filter((item) => item.difficulty === puzzle.difficulty && item.id !== puzzle.id);
      loadState((choice(sameDifficulty.length ? sameDifficulty : SUDOKU_PUZZLES)).id);
      playTone(560);
    });

    app.querySelector("#sudokuReset").addEventListener("click", () => {
      values = puzzle.puzzle.split("");
      notes = Array.from({ length: 81 }, () => new Set());
      selected = values.findIndex((value) => value === "0");
      history = [];
      completed = false;
      saveState();
      renderBoard();
      announce("Puzzle reset.");
      playTone(320);
    });

    app.querySelector("#sudokuHint").addEventListener("click", () => {
      let target = selected;
      if (target < 0 || isGiven(target) || values[target] === puzzle.solution[target]) {
        target = values.findIndex((value, index) => !isGiven(index) && value !== puzzle.solution[index]);
      }
      if (target < 0) {
        announce("The puzzle is already complete.");
        return;
      }
      selected = target;
      pushHistory(target);
      values[target] = puzzle.solution[target];
      notes[target].clear();
      removePeerNotes(target, values[target]);
      checkComplete();
      saveState();
      renderBoard();
      announce(`Hint placed ${values[target]}.`);
      playTone(620);
    });

    undoButton.addEventListener("click", undo);

    notesToggle.addEventListener("click", () => {
      notesMode = !notesMode;
      renderBoard();
      announce(notesMode ? "Pencil notes are on." : "Pencil notes are off.");
      playTone(notesMode ? 560 : 390);
    });

    mistakesToggle.addEventListener("click", () => {
      showMistakes = !showMistakes;
      saveJSON("pg-sudoku-show-mistakes", showMistakes);
      renderBoard();
      playTone(470);
    });

    function onKeyDown(event) {
      if (event.target instanceof HTMLSelectElement) return;
      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        setValue(event.key);
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        setValue("0");
        return;
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        notesToggle.click();
        return;
      }
      if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        undo();
        return;
      }

      const directions = {
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0]
      };
      if (directions[event.key]) {
        event.preventDefault();
        const [dr, dc] = directions[event.key];
        const row = selected >= 0 ? Math.floor(selected / 9) : 0;
        const col = selected >= 0 ? selected % 9 : 0;
        selected = clamp(row + dr, 0, 8) * 9 + clamp(col + dc, 0, 8);
        renderBoard();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    buildNumberPad();
    loadState(currentPuzzleId);
    mistakesToggle.setAttribute("aria-pressed", String(showMistakes));

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Tile Pairs                                                         */
  /* ------------------------------------------------------------------ */

  const TILE_FACES = [
    "☀️", "🌙", "⭐", "☁️", "🌸", "🌼", "🌿", "🍀",
    "🍎", "🍐", "🍊", "🍋", "🍇", "🍒", "🐦", "🐟",
    "🦋", "🐢", "🎵", "🔔", "♥", "◆", "🧩", "🍵",
    "🪷", "⌂", "🚲", "🎈"
  ];

  function createTilePositions() {
    const positions = [];
    let id = 0;

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        positions.push({ id: id++, row, col, layer: 0 });
      }
    }
    for (let row = 1; row < 5; row += 1) {
      for (let col = 1; col < 5; col += 1) {
        positions.push({ id: id++, row, col, layer: 1 });
      }
    }
    for (let row = 2; row < 4; row += 1) {
      for (let col = 2; col < 4; col += 1) {
        positions.push({ id: id++, row, col, layer: 2 });
      }
    }

    return positions;
  }

  const TILE_POSITIONS = createTilePositions();

  function tileIsFree(tile, activeSet) {
    const blockedAbove = TILE_POSITIONS.some((other) =>
      activeSet.has(other.id) &&
      other.layer > tile.layer &&
      other.row === tile.row &&
      other.col === tile.col
    );
    if (blockedAbove) return false;

    const blockedLeft = TILE_POSITIONS.some((other) =>
      activeSet.has(other.id) &&
      other.layer === tile.layer &&
      other.row === tile.row &&
      other.col === tile.col - 1
    );
    const blockedRight = TILE_POSITIONS.some((other) =>
      activeSet.has(other.id) &&
      other.layer === tile.layer &&
      other.row === tile.row &&
      other.col === tile.col + 1
    );

    return !blockedLeft || !blockedRight;
  }

  function buildSolvableTileAssignment(activeIds, pairFaces) {
    if (activeIds.size !== pairFaces.length * 2) return null;

    for (let attempt = 0; attempt < 160; attempt += 1) {
      const simulated = new Set(activeIds);
      const removalPairs = [];
      let failed = false;

      while (simulated.size > 0) {
        const free = TILE_POSITIONS.filter((tile) => simulated.has(tile.id) && tileIsFree(tile, simulated));
        if (free.length < 2) {
          failed = true;
          break;
        }
        const first = choice(free);
        const remaining = free.filter((tile) => tile.id !== first.id);
        const second = choice(remaining);
        simulated.delete(first.id);
        simulated.delete(second.id);
        removalPairs.push([first.id, second.id]);
      }

      if (failed) continue;
      const shuffledFaces = shuffle(pairFaces);
      const assignment = new Map();
      removalPairs.forEach(([first, second], index) => {
        assignment.set(first, shuffledFaces[index]);
        assignment.set(second, shuffledFaces[index]);
      });
      return assignment;
    }

    return null;
  }

  function renderTilePairs() {
    let active = new Set();
    let assignments = new Map();
    let selected = null;
    let hintIds = new Set();
    let moves = 0;
    let matchedPairs = 0;
    let hintTimer = 0;

    app.innerHTML = `
      <section class="game-layout" aria-labelledby="tileHeading">
        <div class="panel game-intro">
          <div>
            <h2 id="tileHeading">Tile Pairs</h2>
            <p>Choose two matching tiles that are uncovered and have an open left or right side.</p>
          </div>
          <div class="status-pill"><span>Goal</span><strong>Clear all tiles</strong></div>
        </div>

        <div class="panel toolbar" aria-label="Tile Pairs controls">
          <div class="toolbar-group">
            <button id="tileNew" class="primary-button" type="button">New board</button>
            <button id="tileHint" class="secondary-button" type="button">Hint</button>
            <button id="tileShuffle" class="secondary-button" type="button">Reshuffle</button>
          </div>
          <div class="status-row">
            <span class="status-pill">Pairs left <strong id="tileRemaining">28</strong></span>
            <span class="status-pill">Moves <strong id="tileMoves">0</strong></span>
            <span class="status-pill">Open matches <strong id="tileFreePairs">0</strong></span>
          </div>
        </div>

        <div class="panel tile-game-shell">
          <div class="tile-board-wrap">
            <div id="tileBoard" class="tile-board" role="group" aria-label="Layered tile board"></div>
          </div>
          <p class="help-text">A blocked tile looks darker. Reshuffle keeps your progress if no useful pair is visible.</p>
        </div>
      </section>
    `;

    const boardElement = app.querySelector("#tileBoard");
    const remainingElement = app.querySelector("#tileRemaining");
    const movesElement = app.querySelector("#tileMoves");
    const freePairsElement = app.querySelector("#tileFreePairs");

    function saveState() {
      saveJSON("pg-tiles-save", {
        active: [...active],
        assignments: Object.fromEntries(assignments),
        moves,
        matchedPairs
      });
    }

    function countFreeMatchingPairs() {
      const freeByFace = new Map();
      TILE_POSITIONS.forEach((tile) => {
        if (!active.has(tile.id) || !tileIsFree(tile, active)) return;
        const face = assignments.get(tile.id);
        if (!freeByFace.has(face)) freeByFace.set(face, []);
        freeByFace.get(face).push(tile.id);
      });
      return [...freeByFace.values()].reduce((total, ids) => total + Math.floor(ids.length / 2), 0);
    }

    function makeNewBoard() {
      active = new Set(TILE_POSITIONS.map((tile) => tile.id));
      assignments = buildSolvableTileAssignment(active, TILE_FACES) || new Map();
      selected = null;
      hintIds.clear();
      moves = 0;
      matchedPairs = 0;
      saveState();
      renderBoard();
      announce("A new tile board is ready.");
    }

    function restoreBoard() {
      const saved = loadJSON("pg-tiles-save", null);
      if (
        saved &&
        Array.isArray(saved.active) &&
        saved.assignments &&
        typeof saved.assignments === "object" &&
        Object.keys(saved.assignments).length === TILE_POSITIONS.length
      ) {
        active = new Set(saved.active.filter((id) => Number.isInteger(id) && id >= 0 && id < TILE_POSITIONS.length));
        assignments = new Map(Object.entries(saved.assignments).map(([id, face]) => [Number(id), face]));
        moves = Number(saved.moves) || 0;
        matchedPairs = Number(saved.matchedPairs) || 0;
        selected = null;
        renderBoard();
      } else {
        makeNewBoard();
      }
    }

    function renderBoard() {
      boardElement.textContent = "";
      const openMatches = countFreeMatchingPairs();

      TILE_POSITIONS
        .filter((tile) => active.has(tile.id))
        .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col)
        .forEach((tile) => {
          const isFree = tileIsFree(tile, active);
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.id = String(tile.id);
          button.className = `mahjong-tile ${isFree ? "free" : "blocked"}`;
          if (selected === tile.id) button.classList.add("selected");
          if (hintIds.has(tile.id)) button.classList.add("hint");
          button.style.left = `${2.2 + tile.col * 15.7 + tile.layer * 0.9}%`;
          button.style.top = `${4 + tile.row * 14.7 - tile.layer * 1.1}%`;
          button.style.zIndex = String(tile.layer * 100 + tile.row * 8 + tile.col);
          button.textContent = assignments.get(tile.id) || "?";
          button.setAttribute("aria-label", `${assignments.get(tile.id)} tile, ${isFree ? "open" : "blocked"}`);
          button.setAttribute("aria-disabled", String(!isFree));
          button.addEventListener("click", () => selectTile(tile.id));
          boardElement.append(button);
        });

      remainingElement.textContent = String(active.size / 2);
      movesElement.textContent = String(moves);
      freePairsElement.textContent = String(openMatches);

      if (active.size > 0 && openMatches === 0) {
        announce("No open match remains. Tap Reshuffle.");
      }
    }

    function selectTile(id) {
      const tile = TILE_POSITIONS[id];
      if (!active.has(id)) return;
      if (!tileIsFree(tile, active)) {
        announce("That tile is covered or blocked on both sides.");
        playTone(250, 0.08);
        vibrate(16);
        return;
      }

      if (selected === null) {
        selected = id;
        playTone(430, 0.055);
        renderBoard();
        return;
      }

      if (selected === id) {
        selected = null;
        renderBoard();
        return;
      }

      moves += 1;
      if (assignments.get(selected) === assignments.get(id)) {
        active.delete(selected);
        active.delete(id);
        matchedPairs += 1;
        selected = null;
        playTone(620, 0.09, 0.04);
        vibrate(20);
        saveState();
        renderBoard();
        if (active.size === 0) {
          celebrate(`Tile board cleared in ${moves} moves!`);
        }
      } else {
        selected = id;
        playTone(290, 0.08);
        saveState();
        renderBoard();
        announce("Those tiles do not match.");
      }
    }

    function showHint() {
      const byFace = new Map();
      TILE_POSITIONS.forEach((tile) => {
        if (!active.has(tile.id) || !tileIsFree(tile, active)) return;
        const face = assignments.get(tile.id);
        if (!byFace.has(face)) byFace.set(face, []);
        byFace.get(face).push(tile.id);
      });

      const match = [...byFace.values()].find((ids) => ids.length >= 2);
      if (!match) {
        announce("No open pair is available. Try Reshuffle.");
        return;
      }

      clearTimeout(hintTimer);
      hintIds = new Set(match.slice(0, 2));
      renderBoard();
      playTone(690);
      hintTimer = window.setTimeout(() => {
        hintIds.clear();
        renderBoard();
      }, 1500);
    }

    function reshuffleRemaining() {
      if (active.size === 0) {
        announce("The board is already clear.");
        return;
      }

      const counts = new Map();
      active.forEach((id) => {
        const face = assignments.get(id);
        counts.set(face, (counts.get(face) || 0) + 1);
      });

      const pairFaces = [];
      for (const [face, count] of counts) {
        for (let i = 0; i < Math.floor(count / 2); i += 1) pairFaces.push(face);
      }

      const replacement = buildSolvableTileAssignment(active, pairFaces);
      if (!replacement) {
        announce("This board could not be reshuffled. Start a new board.");
        return;
      }

      replacement.forEach((face, id) => assignments.set(id, face));
      selected = null;
      moves += 1;
      saveState();
      renderBoard();
      announce("The remaining tiles were reshuffled.");
      playTone(560);
    }

    app.querySelector("#tileNew").addEventListener("click", makeNewBoard);
    app.querySelector("#tileHint").addEventListener("click", showHint);
    app.querySelector("#tileShuffle").addEventListener("click", reshuffleRemaining);

    restoreBoard();

    return () => {
      clearTimeout(hintTimer);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Falling Shapes                                                     */
  /* ------------------------------------------------------------------ */

  const FALLING_COLS = 9;
  const FALLING_ROWS = 18;
  const FALLING_CELL = 30;
  const FALLING_SHAPES = [
    [[1, 1, 1]],
    [[1, 0], [1, 1]],
    [[0, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
  ];
  const FALLING_COLORS = [
    "#6da99d",
    "#d4964c",
    "#a16f9d",
    "#d8bd58",
    "#7194bf",
    "#bd6b63",
    "#7fa866"
  ];

  function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    return Array.from({ length: cols }, (_, col) =>
      Array.from({ length: rows }, (_, row) => matrix[rows - 1 - row][col])
    );
  }

  function renderFallingShapes() {
    let board = Array.from({ length: FALLING_ROWS }, () => Array(FALLING_COLS).fill(0));
    let current = null;
    let next = null;
    let bag = [];
    let score = 0;
    let lines = 0;
    let level = 1;
    let highScore = Number(loadJSON("pg-falling-high-score", 0)) || 0;
    let running = false;
    let started = false;
    let gameOver = false;
    let animationFrame = 0;
    let lastDrop = 0;
    let pointerStart = null;

    app.innerHTML = `
      <section class="game-layout" aria-labelledby="fallingHeading">
        <div class="panel game-intro">
          <div>
            <h2 id="fallingHeading">Falling Shapes</h2>
            <p>Move and rotate each shape. Complete a full row to clear it before the stack reaches the top.</p>
          </div>
          <div class="status-pill"><span>Best score</span><strong id="fallingBest">0</strong></div>
        </div>

        <div class="falling-layout">
          <div class="panel falling-board-panel">
            <canvas id="fallingCanvas" width="270" height="540" aria-label="Falling Shapes game board"></canvas>
            <div class="falling-controls" aria-label="Falling Shapes movement controls">
              <button class="falling-control" id="fallLeft" type="button" aria-label="Move left">←</button>
              <button class="falling-control" id="fallRotate" type="button" aria-label="Rotate clockwise">↻</button>
              <button class="falling-control" id="fallRight" type="button" aria-label="Move right">→</button>
              <button class="falling-control" id="fallDown" type="button" aria-label="Move down">↓</button>
              <button class="falling-control drop" id="fallDrop" type="button" aria-label="Drop to bottom">⇓</button>
            </div>
            <p class="help-text">Swipe on the board, use the buttons, or play with the arrow keys and space bar.</p>
          </div>

          <aside class="falling-side">
            <div class="panel next-piece-panel">
              <strong>Next shape</strong>
              <canvas id="nextCanvas" width="120" height="120" aria-label="Next shape preview"></canvas>
            </div>

            <div class="panel">
              <div class="score-grid">
                <div class="score-box"><span>Score</span><strong id="fallingScore">0</strong></div>
                <div class="score-box"><span>Rows</span><strong id="fallingLines">0</strong></div>
                <div class="score-box"><span>Level</span><strong id="fallingLevel">1</strong></div>
                <div class="score-box"><span>Status</span><strong id="fallingStatus">Ready</strong></div>
              </div>
              <div class="compact-toolbar" style="margin-top: 12px;">
                <button id="fallingNew" class="primary-button" type="button">Start game</button>
                <button id="fallingPause" class="secondary-button" type="button" disabled>Pause</button>
              </div>
            </div>

            <div class="panel">
              <h3>Controls</h3>
              <p class="help-text">← → move · ↑ rotate · ↓ lower · Space drops · P pauses</p>
            </div>
          </aside>
        </div>
      </section>
    `;

    const canvas = app.querySelector("#fallingCanvas");
    const context = canvas.getContext("2d");
    const nextCanvas = app.querySelector("#nextCanvas");
    const nextContext = nextCanvas.getContext("2d");
    const scoreElement = app.querySelector("#fallingScore");
    const linesElement = app.querySelector("#fallingLines");
    const levelElement = app.querySelector("#fallingLevel");
    const bestElement = app.querySelector("#fallingBest");
    const statusElement = app.querySelector("#fallingStatus");
    const newButton = app.querySelector("#fallingNew");
    const pauseButton = app.querySelector("#fallingPause");

    function nextShapeIndex() {
      if (bag.length === 0) bag = shuffle(FALLING_SHAPES.map((_, index) => index));
      return bag.pop();
    }

    function makePiece() {
      const shapeIndex = nextShapeIndex();
      const shape = FALLING_SHAPES[shapeIndex].map((row) => [...row]);
      return {
        shapeIndex,
        shape,
        color: shapeIndex + 1,
        x: Math.floor((FALLING_COLS - shape[0].length) / 2),
        y: 0
      };
    }

    function validBoard(candidate) {
      return Array.isArray(candidate) &&
        candidate.length === FALLING_ROWS &&
        candidate.every((row) => Array.isArray(row) && row.length === FALLING_COLS && row.every((cell) => Number.isInteger(cell)));
    }

    function saveState() {
      saveJSON("pg-falling-save", {
        board,
        current,
        next,
        bag,
        score,
        lines,
        level,
        started,
        gameOver
      });
    }

    function restoreState() {
      const saved = loadJSON("pg-falling-save", null);
      if (saved && validBoard(saved.board)) {
        board = saved.board.map((row) => [...row]);
        current = saved.current && Array.isArray(saved.current.shape) ? saved.current : null;
        next = saved.next && Array.isArray(saved.next.shape) ? saved.next : null;
        bag = Array.isArray(saved.bag) ? saved.bag.filter((value) => Number.isInteger(value) && value >= 0 && value < FALLING_SHAPES.length) : [];
        score = Number(saved.score) || 0;
        lines = Number(saved.lines) || 0;
        level = Math.max(1, Number(saved.level) || 1);
        started = Boolean(saved.started);
        gameOver = Boolean(saved.gameOver);
        running = false;
        if (started && !current && !gameOver) {
          current = makePiece();
          next = makePiece();
        }
      } else {
        prepareBlankGame();
      }
    }

    function prepareBlankGame() {
      board = Array.from({ length: FALLING_ROWS }, () => Array(FALLING_COLS).fill(0));
      bag = [];
      current = makePiece();
      next = makePiece();
      score = 0;
      lines = 0;
      level = 1;
      running = false;
      started = false;
      gameOver = false;
      saveState();
    }

    function collision(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
      for (let row = 0; row < shape.length; row += 1) {
        for (let col = 0; col < shape[row].length; col += 1) {
          if (!shape[row][col]) continue;
          const x = piece.x + col + offsetX;
          const y = piece.y + row + offsetY;
          if (x < 0 || x >= FALLING_COLS || y >= FALLING_ROWS) return true;
          if (y >= 0 && board[y][x] !== 0) return true;
        }
      }
      return false;
    }

    function spawnPiece() {
      current = next || makePiece();
      current.x = Math.floor((FALLING_COLS - current.shape[0].length) / 2);
      current.y = 0;
      next = makePiece();
      if (collision(current)) {
        running = false;
        gameOver = true;
        if (score > highScore) {
          highScore = score;
          saveJSON("pg-falling-high-score", highScore);
        }
        saveState();
        updateStats();
        announce("The stack reached the top. Tap New game to try again.");
        playTone(180, 0.3, 0.05);
      }
    }

    function startNewGame() {
      board = Array.from({ length: FALLING_ROWS }, () => Array(FALLING_COLS).fill(0));
      bag = [];
      current = makePiece();
      next = makePiece();
      score = 0;
      lines = 0;
      level = 1;
      running = true;
      started = true;
      gameOver = false;
      lastDrop = performance.now();
      saveState();
      updateStats();
      playTone(520);
    }

    function moveHorizontal(direction) {
      if (!running || !current) return;
      if (!collision(current, direction, 0)) {
        current.x += direction;
        playTone(360, 0.035, 0.016);
        saveState();
      }
    }

    function rotateCurrent() {
      if (!running || !current) return;
      const rotated = rotateMatrix(current.shape);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collision(current, kick, 0, rotated)) {
          current.shape = rotated;
          current.x += kick;
          playTone(470, 0.05, 0.02);
          saveState();
          return;
        }
      }
      playTone(230, 0.06, 0.02);
    }

    function mergeCurrent() {
      current.shape.forEach((row, rowIndex) => {
        row.forEach((filled, colIndex) => {
          if (!filled) return;
          const y = current.y + rowIndex;
          const x = current.x + colIndex;
          if (y >= 0 && y < FALLING_ROWS && x >= 0 && x < FALLING_COLS) {
            board[y][x] = current.color;
          }
        });
      });
    }

    function clearCompleteRows() {
      const remaining = board.filter((row) => row.some((cell) => cell === 0));
      const cleared = FALLING_ROWS - remaining.length;
      while (remaining.length < FALLING_ROWS) remaining.unshift(Array(FALLING_COLS).fill(0));
      board = remaining;

      if (cleared > 0) {
        const awards = [0, 100, 260, 480, 800];
        score += (awards[cleared] || cleared * 250) * level;
        lines += cleared;
        level = Math.floor(lines / 8) + 1;
        playTone(620 + cleared * 70, 0.14, 0.045);
        vibrate(cleared >= 3 ? [20, 30, 30] : 18);
      }
    }

    function lockCurrent() {
      mergeCurrent();
      clearCompleteRows();
      spawnPiece();
      if (score > highScore) {
        highScore = score;
        saveJSON("pg-falling-high-score", highScore);
      }
      updateStats();
      saveState();
    }

    function stepDown(manual = false) {
      if (!running || !current) return false;
      if (!collision(current, 0, 1)) {
        current.y += 1;
        if (manual) score += 1;
        updateStats();
        saveState();
        return true;
      }
      lockCurrent();
      return false;
    }

    function hardDrop() {
      if (!running || !current) return;
      let distance = 0;
      while (!collision(current, 0, 1)) {
        current.y += 1;
        distance += 1;
      }
      score += distance * 2;
      playTone(410, 0.06, 0.025);
      lockCurrent();
    }

    function togglePause() {
      if (!started || gameOver) return;
      running = !running;
      lastDrop = performance.now();
      updateStats();
      saveState();
      announce(running ? "Game resumed." : "Game paused.");
      playTone(running ? 520 : 340);
    }

    function updateStats() {
      scoreElement.textContent = String(score);
      linesElement.textContent = String(lines);
      levelElement.textContent = String(level);
      bestElement.textContent = String(highScore);
      statusElement.textContent = gameOver ? "Finished" : running ? "Playing" : started ? "Paused" : "Ready";
      pauseButton.disabled = !started || gameOver;
      pauseButton.textContent = !started ? "Pause" : running ? "Pause" : "Resume";
      newButton.textContent = started ? "New game" : "Start game";
      drawNext();
    }

    function drawBlock(ctx, x, y, size, colorIndex, alpha = 1) {
      const color = FALLING_COLORS[(colorIndex - 1 + FALLING_COLORS.length) % FALLING_COLORS.length];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      ctx.fillStyle = "rgba(255,255,255,0.23)";
      ctx.fillRect(x + 5, y + 5, size - 10, Math.max(3, size * 0.12));
      ctx.strokeStyle = "rgba(15,35,31,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      ctx.restore();
    }

    function drawPiece(ctx, piece, offsetY = 0, alpha = 1) {
      piece.shape.forEach((row, rowIndex) => {
        row.forEach((filled, colIndex) => {
          if (!filled) return;
          drawBlock(
            ctx,
            (piece.x + colIndex) * FALLING_CELL,
            (piece.y + rowIndex + offsetY) * FALLING_CELL,
            FALLING_CELL,
            piece.color,
            alpha
          );
        });
      });
    }

    function drawBoard() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#172522";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = "rgba(255,255,255,0.055)";
      context.lineWidth = 1;
      for (let col = 0; col <= FALLING_COLS; col += 1) {
        context.beginPath();
        context.moveTo(col * FALLING_CELL + 0.5, 0);
        context.lineTo(col * FALLING_CELL + 0.5, canvas.height);
        context.stroke();
      }
      for (let row = 0; row <= FALLING_ROWS; row += 1) {
        context.beginPath();
        context.moveTo(0, row * FALLING_CELL + 0.5);
        context.lineTo(canvas.width, row * FALLING_CELL + 0.5);
        context.stroke();
      }

      board.forEach((row, rowIndex) => {
        row.forEach((colorIndex, colIndex) => {
          if (colorIndex) drawBlock(context, colIndex * FALLING_CELL, rowIndex * FALLING_CELL, FALLING_CELL, colorIndex);
        });
      });

      if (current && started && !gameOver) {
        let ghostDistance = 0;
        while (!collision(current, 0, ghostDistance + 1)) ghostDistance += 1;
        if (ghostDistance > 0) drawPiece(context, current, ghostDistance, 0.2);
        drawPiece(context, current);
      }

      if (!running) {
        context.fillStyle = "rgba(11, 25, 23, 0.66)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#fffdf8";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "700 24px system-ui, sans-serif";
        const title = gameOver ? "Game over" : started ? "Paused" : "Ready?";
        context.fillText(title, canvas.width / 2, canvas.height / 2 - 16);
        context.font = "500 14px system-ui, sans-serif";
        context.fillStyle = "rgba(255,253,248,0.85)";
        context.fillText(gameOver ? "Tap New game" : started ? "Tap Resume" : "Tap Start game", canvas.width / 2, canvas.height / 2 + 20);
      }
    }

    function drawNext() {
      nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      nextContext.fillStyle = "#eef2ef";
      nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      if (!next) return;

      const cell = 24;
      const width = next.shape[0].length * cell;
      const height = next.shape.length * cell;
      const offsetX = (nextCanvas.width - width) / 2;
      const offsetY = (nextCanvas.height - height) / 2;
      next.shape.forEach((row, rowIndex) => {
        row.forEach((filled, colIndex) => {
          if (filled) drawBlock(nextContext, offsetX + colIndex * cell, offsetY + rowIndex * cell, cell, next.color);
        });
      });
    }

    function gameLoop(timestamp) {
      if (running) {
        const interval = Math.max(150, 820 - (level - 1) * 65);
        if (timestamp - lastDrop >= interval) {
          stepDown(false);
          lastDrop = timestamp;
        }
      }
      drawBoard();
      animationFrame = requestAnimationFrame(gameLoop);
    }

    function onKeyDown(event) {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "ArrowLeft") moveHorizontal(-1);
      else if (event.key === "ArrowRight") moveHorizontal(1);
      else if (event.key === "ArrowDown") stepDown(true);
      else if (event.key === "ArrowUp") rotateCurrent();
      else if (event.key === " ") hardDrop();
      else if (event.key.toLowerCase() === "p") togglePause();
      else if (event.key.toLowerCase() === "n") startNewGame();
    }

    function onPointerDown(event) {
      pointerStart = { x: event.clientX, y: event.clientY, time: performance.now() };
      canvas.setPointerCapture?.(event.pointerId);
    }

    function onPointerUp(event) {
      if (!pointerStart || !running) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      const distance = Math.hypot(dx, dy);
      pointerStart = null;

      if (distance < 16) {
        rotateCurrent();
      } else if (Math.abs(dx) > Math.abs(dy)) {
        const steps = clamp(Math.round(Math.abs(dx) / 35), 1, 3);
        for (let i = 0; i < steps; i += 1) moveHorizontal(dx > 0 ? 1 : -1);
      } else if (dy > 38) {
        hardDrop();
      } else if (dy < -38) {
        rotateCurrent();
      }
    }

    app.querySelector("#fallLeft").addEventListener("click", () => moveHorizontal(-1));
    app.querySelector("#fallRight").addEventListener("click", () => moveHorizontal(1));
    app.querySelector("#fallRotate").addEventListener("click", rotateCurrent);
    app.querySelector("#fallDown").addEventListener("click", () => stepDown(true));
    app.querySelector("#fallDrop").addEventListener("click", hardDrop);
    newButton.addEventListener("click", startNewGame);
    pauseButton.addEventListener("click", togglePause);
    document.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);

    function onVisibilityChange() {
      if (document.hidden && running) {
        running = false;
        updateStats();
        saveState();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    restoreState();
    updateStats();
    animationFrame = requestAnimationFrame(gameLoop);

    return () => {
      running = false;
      saveState();
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Crate Trail                                                        */
  /* ------------------------------------------------------------------ */

  const CRATE_DIRECTIONS = [
    { id: "up", dr: -1, dc: 0, symbol: "↑", name: "up" },
    { id: "down", dr: 1, dc: 0, symbol: "↓", name: "down" },
    { id: "left", dr: 0, dc: -1, symbol: "←", name: "left" },
    { id: "right", dr: 0, dc: 1, symbol: "→", name: "right" }
  ];

  const CRATE_LEVELS = [
    {
      name: "First Steps",
      difficulty: "Beginner",
      start: [4, 0],
      goal: [1, 3],
      towers: [[4, 0, 2], [3, 2, 2]]
    },
    {
      name: "Corner Climb",
      difficulty: "Beginner",
      start: [5, 0],
      goal: [0, 5],
      towers: [[5, 0, 3], [4, 3, 2], [2, 4, 2]]
    },
    {
      name: "The Side Route",
      difficulty: "Easy",
      start: [5, 1],
      goal: [1, 5],
      towers: [[5, 1, 2], [2, 4, 2], [5, 2, 2], [4, 4, 4], [3, 2, 3], [2, 0, 3]]
    },
    {
      name: "Crossing Paths",
      difficulty: "Easy",
      start: [3, 0],
      goal: [3, 5],
      towers: [[3, 0, 3], [4, 3, 3], [3, 2, 2], [5, 0, 4], [1, 2, 3], [2, 1, 2], [2, 3, 2]]
    },
    {
      name: "Long Way Up",
      difficulty: "Medium",
      start: [4, 2],
      goal: [2, 5],
      towers: [[4, 2, 2], [2, 2, 2], [0, 3, 2], [4, 4, 3], [5, 0, 2], [5, 3, 2]]
    },
    {
      name: "Round the Bend",
      difficulty: "Medium",
      start: [5, 1],
      goal: [3, 3],
      towers: [[5, 1, 2], [3, 0, 3], [1, 2, 4], [2, 4, 4], [2, 2, 2], [0, 1, 3], [2, 5, 2]]
    },
    {
      name: "Switchback",
      difficulty: "Medium",
      start: [0, 1],
      goal: [5, 2],
      towers: [[0, 1, 3], [3, 1, 3], [0, 5, 3], [2, 3, 3], [3, 4, 2], [4, 1, 3]]
    },
    {
      name: "Lantern Run",
      difficulty: "Advanced",
      start: [3, 5],
      goal: [5, 5],
      towers: [[3, 5, 2], [1, 0, 3], [3, 1, 2], [1, 4, 3], [5, 2, 2]]
    },
    {
      name: "Five Tips",
      difficulty: "Advanced",
      start: [4, 2],
      goal: [0, 5],
      towers: [[4, 2, 2], [3, 0, 2], [3, 5, 2], [4, 4, 2], [2, 2, 2], [3, 3, 2], [5, 0, 3]]
    },
    {
      name: "Expert Garden",
      difficulty: "Expert",
      start: [1, 4],
      goal: [0, 0],
      towers: [[1, 4, 4], [5, 3, 3], [2, 3, 2], [0, 2, 4], [1, 1, 4], [4, 0, 3], [5, 0, 3]]
    }
  ];

  function crateOccupied(state, level) {
    const occupied = new Set(state.fallen);
    state.standing.forEach((tower) => occupied.add(keyOf(tower.row, tower.col)));
    occupied.add(keyOf(level.goal[0], level.goal[1]));
    return occupied;
  }

  function crateReachable(state, level) {
    const occupied = crateOccupied(state, level);
    const startKey = keyOf(state.player[0], state.player[1]);
    if (!occupied.has(startKey)) return new Set();

    const seen = new Set([startKey]);
    const queue = [state.player];
    for (let index = 0; index < queue.length; index += 1) {
      const [row, col] = queue[index];
      for (const direction of CRATE_DIRECTIONS) {
        const nextRow = row + direction.dr;
        const nextCol = col + direction.dc;
        const nextKey = keyOf(nextRow, nextCol);
        if (nextRow < 0 || nextRow >= 6 || nextCol < 0 || nextCol >= 6) continue;
        if (occupied.has(nextKey) && !seen.has(nextKey)) {
          seen.add(nextKey);
          queue.push([nextRow, nextCol]);
        }
      }
    }
    return seen;
  }

  function crateTipDestination(state, level, tower, direction) {
    const occupied = crateOccupied(state, level);
    const destination = [];
    for (let distance = 1; distance <= tower.height; distance += 1) {
      const row = tower.row + direction.dr * distance;
      const col = tower.col + direction.dc * distance;
      const key = keyOf(row, col);
      if (row < 0 || row >= 6 || col < 0 || col >= 6 || occupied.has(key)) return null;
      destination.push([row, col]);
    }
    return destination;
  }

  function applyCrateTip(state, level, tower, direction) {
    const destination = crateTipDestination(state, level, tower, direction);
    if (!destination) return null;
    const fallen = new Set(state.fallen);
    destination.forEach(([row, col]) => fallen.add(keyOf(row, col)));
    return {
      standing: state.standing.filter((item) => item.id !== tower.id).map((item) => ({ ...item })),
      fallen,
      player: [...destination[destination.length - 1]]
    };
  }

  function serializeCrateState(state, level) {
    const reachable = [...crateReachable(state, level)].map(parseKey).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const representative = reachable[0] || state.player;
    const standing = [...state.standing]
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((tower) => `${tower.id}:${tower.row},${tower.col},${tower.height}`)
      .join("|");
    const fallen = [...state.fallen].sort((a, b) => {
      const [ar, ac] = parseKey(a);
      const [br, bc] = parseKey(b);
      return ar - br || ac - bc;
    }).join("|");
    return `${standing}#${fallen}#${representative[0]},${representative[1]}`;
  }

  function findCrateSolution(startState, level, maxNodes = 80000) {
    const goalKey = keyOf(level.goal[0], level.goal[1]);
    if (crateReachable(startState, level).has(goalKey)) return [];

    const initial = {
      standing: startState.standing.map((tower) => ({ ...tower })),
      fallen: new Set(startState.fallen),
      player: [...startState.player]
    };
    const queue = [{ state: initial, path: [] }];
    const seen = new Set([serializeCrateState(initial, level)]);

    for (let queueIndex = 0; queueIndex < queue.length && queueIndex < maxNodes; queueIndex += 1) {
      const entry = queue[queueIndex];
      const reachable = crateReachable(entry.state, level);

      for (const tower of entry.state.standing) {
        if (!reachable.has(keyOf(tower.row, tower.col))) continue;
        for (const direction of CRATE_DIRECTIONS) {
          const nextState = applyCrateTip(entry.state, level, tower, direction);
          if (!nextState) continue;
          const action = {
            towerId: tower.id,
            row: tower.row,
            col: tower.col,
            height: tower.height,
            direction: direction.id
          };
          const nextPath = [...entry.path, action];
          if (crateReachable(nextState, level).has(goalKey)) return nextPath;
          const serialized = serializeCrateState(nextState, level);
          if (!seen.has(serialized)) {
            seen.add(serialized);
            queue.push({ state: nextState, path: nextPath });
          }
        }
      }
    }

    return null;
  }

  function renderCrateTrail() {
    let currentLevelIndex = clamp(Number(loadJSON("pg-crates-current", 0)) || 0, 0, CRATE_LEVELS.length - 1);
    let level = CRATE_LEVELS[currentLevelIndex];
    let state = null;
    let selectedTowerId = null;
    let hintDirection = null;
    let moves = 0;
    let completed = false;
    let history = [];
    let hintTimer = 0;
    const completedLevels = new Set(loadJSON("pg-crates-completed", []).filter((index) => Number.isInteger(index)));

    app.innerHTML = `
      <section class="game-layout" aria-labelledby="crateHeading">
        <div class="panel game-intro">
          <div>
            <h2 id="crateHeading">Crate Trail</h2>
            <p>Tip a standing tower only while the explorer can reach it. The fallen crates become a walkway to the red lantern.</p>
          </div>
          <div class="status-pill"><span>Difficulty</span><strong id="crateDifficulty"></strong></div>
        </div>

        <div class="panel toolbar" aria-label="Crate Trail controls">
          <div class="toolbar-group">
            <label class="sr-only" for="crateLevelSelect">Choose a level</label>
            <select id="crateLevelSelect" class="control"></select>
            <button id="crateReset" class="danger-button" type="button">Reset</button>
          </div>
          <div class="toolbar-group">
            <button id="crateUndo" class="secondary-button" type="button">Undo</button>
            <button id="crateHint" class="secondary-button" type="button">Hint</button>
            <button id="crateNext" class="primary-button" type="button">Next level</button>
          </div>
        </div>

        <div class="panel crate-shell">
          <div class="status-row">
            <span class="status-pill">Moves <strong id="crateMoves">0</strong></span>
            <span class="status-pill">Towers left <strong id="crateRemaining">0</strong></span>
            <span class="status-pill">Level <strong id="crateLevelName"></strong></span>
          </div>

          <div id="crateBoard" class="crate-board" role="grid" aria-label="6 by 6 crate puzzle board"></div>

          <div id="directionPad" class="direction-pad" aria-label="Choose a tipping direction">
            ${CRATE_DIRECTIONS.map((direction) => `
              <button class="direction-button" type="button" data-direction="${direction.id}" aria-label="Tip ${direction.name}">${direction.symbol}</button>
            `).join("")}
          </div>

          <p id="crateInstruction" class="help-text">Tap a glowing tower, then choose a direction.</p>
          <div class="legend" aria-label="Board legend">
            <span class="legend-item"><span class="legend-swatch" style="background:#d79a46;">3</span>standing tower</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#bd7b32;"></span>fallen walkway</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#b7433b;color:white;">✦</span>lantern goal</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#fff9e8;">●</span>explorer</span>
          </div>
        </div>
      </section>
    `;

    const boardElement = app.querySelector("#crateBoard");
    const levelSelect = app.querySelector("#crateLevelSelect");
    const difficultyElement = app.querySelector("#crateDifficulty");
    const movesElement = app.querySelector("#crateMoves");
    const remainingElement = app.querySelector("#crateRemaining");
    const levelNameElement = app.querySelector("#crateLevelName");
    const instructionElement = app.querySelector("#crateInstruction");
    const undoButton = app.querySelector("#crateUndo");
    const hintButton = app.querySelector("#crateHint");
    const nextButton = app.querySelector("#crateNext");
    const directionButtons = [...app.querySelectorAll("[data-direction]")];

    function populateLevelSelect() {
      levelSelect.textContent = "";
      CRATE_LEVELS.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${index + 1}. ${item.name}${completedLevels.has(index) ? " ✓" : ""}`;
        levelSelect.append(option);
      });
      levelSelect.value = String(currentLevelIndex);
    }

    function freshState() {
      return {
        standing: level.towers.map(([row, col, height], index) => ({
          id: `L${currentLevelIndex}T${index}`,
          row,
          col,
          height
        })),
        fallen: new Set(),
        player: [...level.start]
      };
    }

    function validSavedState(saved) {
      return saved &&
        Array.isArray(saved.standing) &&
        Array.isArray(saved.fallen) &&
        Array.isArray(saved.player) &&
        saved.player.length === 2;
    }

    function saveState() {
      saveJSON(`pg-crates-level-${currentLevelIndex}`, {
        standing: state.standing,
        fallen: [...state.fallen],
        player: state.player,
        moves,
        completed
      });
      saveJSON("pg-crates-current", currentLevelIndex);
      saveJSON("pg-crates-completed", [...completedLevels]);
    }

    function loadLevel(index) {
      currentLevelIndex = clamp(index, 0, CRATE_LEVELS.length - 1);
      level = CRATE_LEVELS[currentLevelIndex];
      const saved = loadJSON(`pg-crates-level-${currentLevelIndex}`, null);
      if (validSavedState(saved)) {
        state = {
          standing: saved.standing.map((tower) => ({ ...tower })),
          fallen: new Set(saved.fallen),
          player: [...saved.player]
        };
        moves = Number(saved.moves) || 0;
        completed = Boolean(saved.completed);
      } else {
        state = freshState();
        moves = 0;
        completed = false;
      }
      history = [];
      hintDirection = null;
      selectedTowerId = state.standing.find((tower) => tower.row === state.player[0] && tower.col === state.player[1])?.id || null;
      populateLevelSelect();
      renderBoard();
      saveState();
    }

    function snapshot() {
      return {
        standing: state.standing.map((tower) => ({ ...tower })),
        fallen: new Set(state.fallen),
        player: [...state.player],
        moves,
        completed,
        selectedTowerId
      };
    }

    function restoreSnapshot(previous) {
      state = {
        standing: previous.standing.map((tower) => ({ ...tower })),
        fallen: new Set(previous.fallen),
        player: [...previous.player]
      };
      moves = previous.moves;
      completed = previous.completed;
      selectedTowerId = previous.selectedTowerId;
      hintDirection = null;
      saveState();
      renderBoard();
    }

    function checkWin() {
      const goalKey = keyOf(level.goal[0], level.goal[1]);
      if (!crateReachable(state, level).has(goalKey)) return false;
      state.player = [...level.goal];
      if (!completed) {
        completed = true;
        completedLevels.add(currentLevelIndex);
        populateLevelSelect();
        celebrate(`Level ${currentLevelIndex + 1} complete in ${moves} moves!`);
      }
      saveState();
      return true;
    }

    function selectedTower() {
      return state.standing.find((tower) => tower.id === selectedTowerId) || null;
    }

    function renderBoard() {
      const reachable = crateReachable(state, level);
      const selected = selectedTower();
      if (selected && !reachable.has(keyOf(selected.row, selected.col))) selectedTowerId = null;

      boardElement.textContent = "";
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 6; col += 1) {
          const cellKey = keyOf(row, col);
          const tower = state.standing.find((item) => item.row === row && item.col === col);
          const isFallen = state.fallen.has(cellKey);
          const isGoal = row === level.goal[0] && col === level.goal[1];
          const hasPlayer = row === state.player[0] && col === state.player[1];
          const isReachable = reachable.has(cellKey);
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "crate-cell";
          cell.setAttribute("role", "gridcell");
          if (isReachable) cell.classList.add("reachable");
          if (tower?.id === selectedTowerId) cell.classList.add("selected");

          const descriptions = [`row ${row + 1}, column ${col + 1}`];
          if (tower) descriptions.push(`standing tower height ${tower.height}`);
          else if (isFallen) descriptions.push("fallen crate walkway");
          else if (isGoal) descriptions.push("red lantern goal");
          else descriptions.push("empty floor");
          if (hasPlayer) descriptions.push("explorer is here");
          if (isReachable) descriptions.push("reachable");
          cell.setAttribute("aria-label", descriptions.join(", "));

          if (tower) {
            const towerElement = document.createElement("span");
            towerElement.className = `crate-tower height-${tower.height}`;
            towerElement.textContent = String(tower.height);
            towerElement.setAttribute("aria-hidden", "true");
            cell.append(towerElement);
          } else if (isFallen) {
            const fallenElement = document.createElement("span");
            fallenElement.className = "crate-fallen";
            fallenElement.setAttribute("aria-hidden", "true");
            cell.append(fallenElement);
          } else if (isGoal) {
            const goalElement = document.createElement("span");
            goalElement.className = "crate-goal";
            goalElement.textContent = "✦";
            goalElement.setAttribute("aria-hidden", "true");
            cell.append(goalElement);
          }

          if (hasPlayer) {
            const playerElement = document.createElement("span");
            playerElement.className = "crate-player";
            playerElement.textContent = "●";
            playerElement.setAttribute("aria-hidden", "true");
            cell.append(playerElement);
          }

          cell.addEventListener("click", () => {
            if (!isReachable) {
              announce("The explorer cannot walk across the empty floor.");
              playTone(240, 0.07);
              return;
            }
            state.player = [row, col];
            selectedTowerId = tower?.id || null;
            hintDirection = null;
            if (isGoal) checkWin();
            saveState();
            renderBoard();
            playTone(tower ? 470 : 380, 0.05, 0.02);
          });

          boardElement.append(cell);
        }
      }

      const activeTower = selectedTower();
      directionButtons.forEach((button) => {
        const direction = CRATE_DIRECTIONS.find((item) => item.id === button.dataset.direction);
        const legal = Boolean(
          activeTower &&
          reachable.has(keyOf(activeTower.row, activeTower.col)) &&
          crateTipDestination(state, level, activeTower, direction)
        );
        button.disabled = !legal || completed;
        button.classList.toggle("hint", hintDirection === direction.id && legal);
      });

      difficultyElement.textContent = level.difficulty;
      movesElement.textContent = String(moves);
      remainingElement.textContent = String(state.standing.length);
      levelNameElement.textContent = `${currentLevelIndex + 1}: ${level.name}`;
      undoButton.disabled = history.length === 0;
      nextButton.disabled = !completed;
      nextButton.textContent = currentLevelIndex === CRATE_LEVELS.length - 1 ? "Level 1" : "Next level";

      if (completed) {
        instructionElement.textContent = "The explorer reached the lantern. Choose the next level when ready.";
      } else if (activeTower) {
        instructionElement.textContent = `Height ${activeTower.height} tower selected. Choose a direction that is not dimmed.`;
      } else {
        instructionElement.textContent = "Tap a glowing reachable tower, then choose a direction.";
      }
    }

    function tipSelected(directionId) {
      if (completed) return;
      const tower = selectedTower();
      const direction = CRATE_DIRECTIONS.find((item) => item.id === directionId);
      if (!tower || !direction) return;
      const reachable = crateReachable(state, level);
      if (!reachable.has(keyOf(tower.row, tower.col))) return;
      const nextState = applyCrateTip(state, level, tower, direction);
      if (!nextState) {
        announce("That tower cannot fall in that direction.");
        playTone(230, 0.08);
        return;
      }

      history.push(snapshot());
      state = nextState;
      moves += 1;
      selectedTowerId = null;
      hintDirection = null;
      playTone(520, 0.1, 0.035);
      vibrate(22);
      const won = checkWin();
      if (!won) {
        saveState();
        renderBoard();
      } else {
        renderBoard();
      }
    }

    function requestHint() {
      if (completed) {
        announce("This level is complete.");
        return;
      }
      hintButton.disabled = true;
      announce("Looking for a route…");
      window.setTimeout(() => {
        const solution = findCrateSolution(state, level);
        hintButton.disabled = false;
        if (solution === null) {
          announce("This position has no route. Undo a move or reset the level.");
          playTone(220, 0.12);
          return;
        }
        if (solution.length === 0) {
          checkWin();
          renderBoard();
          return;
        }

        const nextMove = solution[0];
        const tower = state.standing.find((item) => item.id === nextMove.towerId);
        if (!tower) {
          announce("No hint is available for this position.");
          return;
        }
        state.player = [tower.row, tower.col];
        selectedTowerId = tower.id;
        hintDirection = nextMove.direction;
        renderBoard();
        const directionName = CRATE_DIRECTIONS.find((item) => item.id === nextMove.direction)?.name || nextMove.direction;
        announce(`Hint: tip the height ${tower.height} tower ${directionName}.`);
        playTone(690);
        clearTimeout(hintTimer);
        hintTimer = window.setTimeout(() => {
          hintDirection = null;
          renderBoard();
        }, 2600);
      }, 30);
    }

    levelSelect.addEventListener("change", () => loadLevel(Number(levelSelect.value)));

    app.querySelector("#crateReset").addEventListener("click", () => {
      state = freshState();
      moves = 0;
      completed = false;
      history = [];
      selectedTowerId = state.standing.find((tower) => tower.row === state.player[0] && tower.col === state.player[1])?.id || null;
      hintDirection = null;
      saveState();
      renderBoard();
      announce("Level reset.");
      playTone(320);
    });

    undoButton.addEventListener("click", () => {
      const previous = history.pop();
      if (!previous) {
        announce("Nothing to undo yet.");
        return;
      }
      restoreSnapshot(previous);
      announce("Last tip undone.");
      playTone(360);
    });

    hintButton.addEventListener("click", requestHint);

    nextButton.addEventListener("click", () => {
      const nextIndex = currentLevelIndex === CRATE_LEVELS.length - 1 ? 0 : currentLevelIndex + 1;
      loadLevel(nextIndex);
      playTone(560);
    });

    directionButtons.forEach((button) => {
      button.addEventListener("click", () => tipSelected(button.dataset.direction));
    });

    function onKeyDown(event) {
      const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
      };
      if (map[event.key]) {
        event.preventDefault();
        tipSelected(map[event.key]);
      } else if (event.key.toLowerCase() === "h") {
        requestHint();
      } else if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        undoButton.click();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    populateLevelSelect();
    loadLevel(currentLevelIndex);

    return () => {
      clearTimeout(hintTimer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }

  /* ------------------------------------------------------------------ */
  /* App startup                                                        */
  /* ------------------------------------------------------------------ */

  applySettings();
  updateInstallUi();
  window.addEventListener("hashchange", route);
  route();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              announce("A new Puzzle Garden version is ready. Reopen the app to update.");
            }
          });
        });
      } catch {
        // Offline installation is optional; the online games still work.
      }
    });
  }
})();
