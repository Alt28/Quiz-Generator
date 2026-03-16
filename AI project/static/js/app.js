/* ═══════════════════════════════════════════════
   CLARKO — StudyBuddy  |  Kahoot-style Game Engine
   ═══════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── DOM refs — Input ──────────────────────
  const fileInput    = document.getElementById("fileInput");
  const browseBtn    = document.getElementById("browseBtn");
  const uploadZone   = document.getElementById("uploadZone");
  const uploadInner  = document.getElementById("uploadInner");
  const fileChosen   = document.getElementById("fileChosen");
  const fileName     = document.getElementById("fileName");
  const removeFile   = document.getElementById("removeFile");
  const notesInput   = document.getElementById("notesInput");
  const generateBtn  = document.getElementById("generateBtn");
  const btnText      = document.querySelector(".btn-text");
  const btnLoading   = document.getElementById("btnLoading");
  const toast        = document.getElementById("toast");
  const inputPanel   = document.getElementById("inputPanel");

  // ── DOM refs — Game ───────────────────────
  const gameContainer   = document.getElementById("gameContainer");
  const gameScore       = document.getElementById("gameScore");
  const gameStreak      = document.getElementById("gameStreak");
  const gameCount       = document.getElementById("gameCount");
  const gameTimerFill   = document.getElementById("gameTimerFill");
  const gameQuestion    = document.getElementById("gameQuestion");
  const gameTypeBadge   = document.getElementById("gameTypeBadge");
  const gameAnswers     = document.getElementById("gameAnswers");
  const gameFeedback    = document.getElementById("gameFeedback");
  const gameOver        = document.getElementById("gameOver");
  const gameFinalScore  = document.getElementById("gameFinalScore");
  const gameCorrectCount = document.getElementById("gameCorrectCount");
  const gameMsg         = document.getElementById("gameMsg");
  const gameRestart     = document.getElementById("gameRestart");
  const gameBack        = document.getElementById("gameBack");

  let selectedFile = null;

  // ── Game state ────────────────────────────
  let questions   = [];
  let currentIdx  = 0;
  let points      = 0;
  let streak      = 0;
  let correct     = 0;
  let timer       = null;
  let timeLeft    = 0;
  let locked      = false;
  let storedData  = null;

  // Timer durations per mode
  const TIMERS = {
    quiz: { mcq: 15, fill: 20, enum: 25 },
    exam: { mcq: 10, fill: 15, enum: 18 }
  };
  const SHAPES = ["\u25B2", "\u25C6", "\u25CF", "\u25A0"];
  let gameMode = "quiz";  // "quiz" or "exam"

  // ── Input tabs ────────────────────────────
  const inputTabs   = document.querySelectorAll(".input-tab");
  const tabUpload   = document.getElementById("tabUpload");
  const tabPaste    = document.getElementById("tabPaste");
  const fileExt     = document.getElementById("fileExt");

  inputTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      inputTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      tabUpload.classList.toggle("active", target === "upload");
      tabPaste.classList.toggle("active", target === "paste");
    });
  });

  // ── File upload ───────────────────────────
  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) pickFile(fileInput.files[0]);
  });

  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });
  uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    if (e.dataTransfer.files.length) pickFile(e.dataTransfer.files[0]);
  });

  removeFile.addEventListener("click", clearFile);

  function pickFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "pptx", "txt"].includes(ext)) {
      showToast("Unsupported file type. Use PDF, DOCX, PPTX, or TXT.");
      return;
    }
    selectedFile = file;
    // Show truncated name + ext badge
    const basename = file.name.replace(/\.[^.]+$/, "");
    fileName.textContent = basename;
    fileExt.textContent = ext.toUpperCase();
    uploadInner.classList.add("hidden");
    fileChosen.classList.remove("hidden");
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    uploadInner.classList.remove("hidden");
    fileChosen.classList.add("hidden");
  }

  // ── Chip toggles ──────────────────────────
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const cb = chip.querySelector("input");
      cb.checked = !cb.checked;
      chip.classList.toggle("active", cb.checked);
    });
  });

  // ── Mode toggle ───────────────────────────
  const modeQuiz = document.getElementById("modeQuiz");
  const modeExam = document.getElementById("modeExam");
  const hudMode  = document.getElementById("hudMode");

  modeQuiz.addEventListener("click", function () {
    modeQuiz.classList.add("active");
    modeExam.classList.remove("active");
    gameMode = "quiz";
    generateBtn.classList.remove("exam-mode");
    document.querySelector(".btn-text").textContent = "\u26A1 Generate Quiz";
  });
  modeExam.addEventListener("click", function () {
    modeExam.classList.add("active");
    modeQuiz.classList.remove("active");
    gameMode = "exam";
    generateBtn.classList.add("exam-mode");
    document.querySelector(".btn-text").textContent = "\uD83D\uDD25 Start Exam";
  });

  // ── Generate quiz ─────────────────────────
  generateBtn.addEventListener("click", generate);

  async function generate() {
    hideToast();

    const types = [];
    document.querySelectorAll(".chip input:checked").forEach((cb) => types.push(cb.value));
    if (types.length === 0) {
      showToast("Select at least one quiz type.");
      return;
    }

    const fd = new FormData();
    if (selectedFile) fd.append("file", selectedFile);
    fd.append("notes", notesInput.value);
    types.forEach((t) => fd.append("quiz_types", t));
    if (gameMode === "exam") fd.append("exam_mode", "1");

    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    generateBtn.disabled = true;

    try {
      const res = await fetch("/generate", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Something went wrong.");
        return;
      }

      startGame(data);
    } catch (err) {
      showToast("Network error \u2014 is the server running?");
    } finally {
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");
      generateBtn.disabled = false;
    }
  }

  // ══════════════════════════════════════════════
  //  GAME ENGINE
  // ══════════════════════════════════════════════

  // ── Smooth View Transitions ────────────

  function showView(el) {
    el.classList.remove("hidden", "view-out");
    el.classList.add("view", "view-in");
  }

  function hideView(el, cb) {
    el.classList.add("view", "view-out");
    el.classList.remove("view-in");
    setTimeout(function () {
      el.classList.add("hidden");
      el.classList.remove("view", "view-out");
      if (cb) cb();
    }, 400);
  }

  function switchView(hideEl, showEl) {
    hideView(hideEl, function () { showView(showEl); });
  }

  function startGame(data) {
    storedData = data;
    questions = data.questions || [];

    if (questions.length === 0 && (!data.flashcards || data.flashcards.length === 0)) {
      showToast("No questions could be generated \u2014 try adding more detailed notes.");
      return;
    }

    shuffleArray(questions);

    currentIdx = 0;
    points = 0;
    streak = 0;
    correct = 0;
    locked = false;

    // Hide input, show game
    hideView(inputPanel, function () {
      showView(gameContainer);
    });
    gameOver.classList.add("hidden");

    // Ensure HUD & timer visible
    document.querySelector(".game-hud").classList.remove("hidden");
    document.querySelector(".game-timer").classList.remove("hidden");

    // Exam mode HUD badge
    if (gameMode === "exam") {
      hudMode.classList.remove("hidden");
    } else {
      hudMode.classList.add("hidden");
    }

    // Flashcards (shown below the game)
    if (data.flashcards && data.flashcards.length > 0) {
      initFlashcards(data.flashcards);
    } else {
      document.getElementById("flashcardSection").classList.add("hidden");
    }

    if (questions.length > 0) {
      showQuestion();
    } else {
      // Only flashcards selected — show flashcards with transition
      gameContainer.classList.add("hidden");
      showView(document.getElementById("flashcardSection"));
    }
  }

  function showQuestion() {
    const q = questions[currentIdx];
    locked = false;

    // Update HUD
    gameScore.textContent = points;
    gameStreak.textContent = streak;
    gameCount.textContent = (currentIdx + 1) + " / " + questions.length;

    // Question text
    gameQuestion.innerHTML = highlightBlanks(escapeHTML(q.question));

    // Type badge
    if (q.type === "multiple_choice") {
      gameTypeBadge.innerHTML = '<span class="badge-tag mcq">Multiple Choice</span>';
    } else if (q.type === "fill_in_the_blank") {
      gameTypeBadge.innerHTML = '<span class="badge-tag fill">Fill in the Blank</span>';
    } else if (q.type === "enumeration") {
      gameTypeBadge.innerHTML = '<span class="badge-tag enum">Enumeration</span>';
    }

    // Hide feedback
    gameFeedback.classList.add("hidden");

    // Render answer area
    gameAnswers.innerHTML = "";

    var t = TIMERS[gameMode] || TIMERS.quiz;
    if (q.type === "multiple_choice") {
      renderGameMCQ(q);
      startTimer(t.mcq);
    } else if (q.type === "fill_in_the_blank") {
      renderGameFill(q);
      startTimer(t.fill);
    } else if (q.type === "enumeration") {
      renderGameEnum(q);
      startTimer(t.enum);
    }
  }

  // ── MCQ Renderer ──────────────────────────
  function renderGameMCQ(q) {
    var grid = document.createElement("div");
    grid.className = "game-choices";

    q.choices.forEach(function (c, ci) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "game-choice gc-" + ci;
      btn.innerHTML = '<span class="gc-shape">' + SHAPES[ci] + "</span> " + escapeHTML(c);
      btn.dataset.value = c;
      btn.addEventListener("click", function () { handleMCQAnswer(btn, q); });
      grid.appendChild(btn);
    });

    gameAnswers.appendChild(grid);
  }

  // ── Fill Renderer ─────────────────────────
  function renderGameFill(q) {
    var area = document.createElement("div");
    area.className = "game-input-area";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "game-input";
    input.placeholder = "Type your answer\u2026";
    input.autocomplete = "off";

    var submit = document.createElement("button");
    submit.type = "button";
    submit.className = "game-submit";
    submit.textContent = "Submit";
    submit.addEventListener("click", function () { handleFillAnswer(input, q); });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleFillAnswer(input, q);
    });

    area.appendChild(input);
    area.appendChild(submit);
    gameAnswers.appendChild(area);
    setTimeout(function () { input.focus(); }, 100);
  }

  // ── Enum Renderer ─────────────────────────
  function renderGameEnum(q) {
    var area = document.createElement("div");
    area.className = "game-input-area";

    var label = document.createElement("div");
    label.className = "enum-label";
    label.textContent = "Enter " + q.count + " items:";
    area.appendChild(label);

    for (var i = 0; i < q.count; i++) {
      var input = document.createElement("input");
      input.type = "text";
      input.className = "game-input game-enum-input";
      input.placeholder = "Item " + (i + 1);
      input.autocomplete = "off";
      area.appendChild(input);
    }

    var submit = document.createElement("button");
    submit.type = "button";
    submit.className = "game-submit";
    submit.textContent = "Submit";
    submit.addEventListener("click", function () { handleEnumAnswer(q); });

    area.appendChild(submit);
    gameAnswers.appendChild(area);

    var first = area.querySelector(".game-enum-input");
    if (first) setTimeout(function () { first.focus(); }, 100);
  }

  // ── Answer Handlers ───────────────────────

  function handleMCQAnswer(btn, q) {
    if (locked) return;
    locked = true;
    clearInterval(timer);

    var userVal = btn.dataset.value;
    var isCorrect = userVal.toLowerCase() === q.answer.toLowerCase();

    document.querySelectorAll(".game-choice").forEach(function (b) {
      b.disabled = true;
      if (b.dataset.value.toLowerCase() === q.answer.toLowerCase()) {
        b.classList.add("g-correct");
      } else {
        b.classList.add("g-wrong");
      }
    });

    processResult(isCorrect, q.answer);
  }

  function handleFillAnswer(input, q) {
    if (locked) return;
    var userVal = input.value.trim();
    if (!userVal) return;
    locked = true;
    clearInterval(timer);
    input.disabled = true;

    var isCorrect = userVal.toLowerCase() === q.answer.toLowerCase();
    processResult(isCorrect, q.answer);
  }

  function handleEnumAnswer(q) {
    if (locked) return;
    locked = true;
    clearInterval(timer);

    var inputs = document.querySelectorAll(".game-enum-input");
    var userAnswers = Array.from(inputs).map(function (inp) { return inp.value.trim().toLowerCase(); });
    var expected = q.answers.map(function (a) { return a.toLowerCase(); });

    var matched = 0;
    var remaining = expected.slice();
    userAnswers.forEach(function (ua) {
      var i = remaining.indexOf(ua);
      if (i !== -1) { matched++; remaining.splice(i, 1); }
    });

    inputs.forEach(function (inp) { inp.disabled = true; });

    var isCorrect = matched === expected.length;
    var detail = isCorrect
      ? q.answers.join(", ")
      : matched + "/" + expected.length + " correct \u2014 Expected: " + q.answers.join(", ");
    processResult(isCorrect, detail);
  }

  // ── Scoring & Feedback ────────────────────

  function processResult(isCorrect, answer) {
    if (isCorrect) {
      streak++;
      var timeBonus = Math.round(timeLeft * 100);
      var streakBonus = streak >= 3 ? 200 : streak >= 2 ? 100 : 0;
      var pts = 500 + timeBonus + streakBonus;
      points += pts;
      correct++;

      gameFeedback.textContent = "\u2705 +" + pts + " pts" + (streakBonus ? "  (\ud83d\udd25 streak +" + streakBonus + ")" : "");
      gameFeedback.className = "game-feedback fb-correct";
    } else {
      streak = 0;
      gameFeedback.textContent = "\u274C Answer: " + answer;
      gameFeedback.className = "game-feedback fb-wrong";
    }

    gameFeedback.classList.remove("hidden");
    gameScore.textContent = points;
    gameStreak.textContent = streak;

    setTimeout(nextQuestion, 1800);
  }

  // ── Timer ─────────────────────────────────

  function startTimer(seconds) {
    timeLeft = seconds;
    var totalTime = seconds;
    gameTimerFill.style.width = "100%";
    clearInterval(timer);
    timer = setInterval(function () {
      timeLeft -= 0.1;
      var pct = Math.max(0, (timeLeft / totalTime) * 100);
      gameTimerFill.style.width = pct + "%";
      if (timeLeft <= 0) {
        clearInterval(timer);
        onTimeUp();
      }
    }, 100);
  }

  function onTimeUp() {
    if (locked) return;
    locked = true;
    streak = 0;

    var q = questions[currentIdx];

    // Reveal correct answer for MCQ
    if (q.type === "multiple_choice") {
      document.querySelectorAll(".game-choice").forEach(function (b) {
        b.disabled = true;
        if (b.dataset.value.toLowerCase() === q.answer.toLowerCase()) {
          b.classList.add("g-correct");
        } else {
          b.classList.add("g-wrong");
        }
      });
    }

    var answerText = q.type === "enumeration" ? q.answers.join(", ") : q.answer;
    gameFeedback.textContent = "\u23F0 Time\u2019s up! Answer: " + answerText;
    gameFeedback.className = "game-feedback fb-time";
    gameFeedback.classList.remove("hidden");
    gameStreak.textContent = streak;

    setTimeout(nextQuestion, 2000);
  }

  function nextQuestion() {
    currentIdx++;
    if (currentIdx >= questions.length) {
      showGameOver();
    } else {
      showQuestion();
    }
  }

  // ── Game Over ─────────────────────────────

  function showGameOver() {
    clearInterval(timer);
    gameQuestion.innerHTML = "";
    gameAnswers.innerHTML = "";
    gameTypeBadge.innerHTML = "";
    gameFeedback.classList.add("hidden");
    gameTimerFill.style.width = "0%";

    // Hide HUD & timer
    document.querySelector(".game-hud").classList.add("hidden");
    document.querySelector(".game-timer").classList.add("hidden");

    gameOver.classList.remove("hidden");

    // Update title based on mode
    var overTitle = gameOver.querySelector("h2");
    if (gameMode === "exam") {
      overTitle.textContent = "Exam Complete!";
      gameOver.querySelector(".game-over-icon").textContent = "\ud83c\udf93";
    } else {
      overTitle.textContent = "Quiz Complete!";
      gameOver.querySelector(".game-over-icon").textContent = "\ud83c\udfc6";
    }

    gameFinalScore.textContent = points;
    gameCorrectCount.textContent = correct + " / " + questions.length + " correct";

    var pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    if (pct === 100)      gameMsg.textContent = "\ud83c\udf89 Perfect score! You\u2019re a legend!";
    else if (pct >= 80)   gameMsg.textContent = "\ud83c\udf1f Amazing! Almost flawless!";
    else if (pct >= 60)   gameMsg.textContent = "\ud83d\udc4f Great job! Keep it up!";
    else if (pct >= 40)   gameMsg.textContent = "\ud83d\udcd6 Not bad \u2014 review and try again!";
    else                  gameMsg.textContent = "\ud83d\udcaa Keep studying! You\u2019ll get there!";

    // Show keywords
    if (storedData && storedData.keywords && storedData.keywords.length > 0) {
      var kwSection = document.getElementById("gameOverKeywords");
      var pillRow = document.getElementById("gameKeywordPills");
      pillRow.innerHTML = "";
      storedData.keywords.forEach(function (kw) {
        var span = document.createElement("span");
        span.className = "pill";
        span.textContent = kw;
        pillRow.appendChild(span);
      });
      kwSection.classList.remove("hidden");
    }
  }

  // ── Pause / Resume / Quit ──────────────────

  var pauseOverlay  = document.getElementById("pauseOverlay");
  var pauseProgress = document.getElementById("pauseProgress");
  var pausedTimeLeft = 0;
  var pausedTotalTime = 0;

  // tracks which mode opened the pause overlay: "quiz" or "flash"
  var pauseSource = "quiz";

  document.getElementById("gameMenuBtn").addEventListener("click", function () {
    if (locked) return;  // don't pause during feedback transition
    clearInterval(timer);
    pausedTimeLeft = timeLeft;
    var q = questions[currentIdx];
    var tm = TIMERS[gameMode] || TIMERS.quiz;
    pausedTotalTime = q.type === "fill_in_the_blank" ? tm.fill : q.type === "enumeration" ? tm.enum : tm.mcq;
    pauseProgress.textContent = "Question " + (currentIdx + 1) + " of " + questions.length + "  •  Score: " + points;
    pauseSource = "quiz";
    pauseOverlay.classList.remove("hidden");
  });

  document.getElementById("flashMenuBtn").addEventListener("click", function () {
    pauseProgress.textContent = "Flashcard " + (flashIdx + 1) + " of " + flashcards.length;
    pauseSource = "flash";
    pauseOverlay.classList.remove("hidden");
  });

  document.getElementById("pauseContinue").addEventListener("click", function () {
    pauseOverlay.classList.add("fade-out");
    setTimeout(function () {
      pauseOverlay.classList.add("hidden");
      pauseOverlay.classList.remove("fade-out");
    }, 250);
    if (pauseSource === "quiz") {
      // Resume the timer from where it left off
      timeLeft = pausedTimeLeft;
      var totalTime = pausedTotalTime;
      var fill = gameTimerFill;
      timer = setInterval(function () {
        timeLeft -= 0.1;
        var pct = Math.max(0, (timeLeft / totalTime) * 100);
        fill.style.width = pct + "%";
        if (timeLeft <= 0) {
          clearInterval(timer);
          onTimeUp();
        }
      }, 100);
    }
    // flash: just close overlay, nothing to resume
  });

  document.getElementById("pauseQuit").addEventListener("click", function () {
    pauseOverlay.classList.add("fade-out");
    setTimeout(function () {
      pauseOverlay.classList.add("hidden");
      pauseOverlay.classList.remove("fade-out");
    }, 250);
    clearInterval(timer);
    var flash = document.getElementById("flashcardSection");
    var hasGame = !gameContainer.classList.contains("hidden");
    var hasFlash = !flash.classList.contains("hidden");
    document.getElementById("gameOverKeywords").classList.add("hidden");
    document.querySelector(".game-hud").classList.remove("hidden");
    document.querySelector(".game-timer").classList.remove("hidden");
    if (hasGame && hasFlash) {
      hideView(gameContainer);
      hideView(flash, function () { showView(inputPanel); });
    } else if (hasGame) {
      hideView(gameContainer, function () { showView(inputPanel); });
    } else if (hasFlash) {
      hideView(flash, function () { showView(inputPanel); });
    } else {
      showView(inputPanel);
    }
  });

  // ── Restart / Back ────────────────────────

  gameRestart.addEventListener("click", function () {
    document.querySelector(".game-hud").classList.remove("hidden");
    document.querySelector(".game-timer").classList.remove("hidden");
    startGame(storedData);
  });

  gameBack.addEventListener("click", function () {
    clearInterval(timer);
    document.getElementById("gameOverKeywords").classList.add("hidden");
    document.querySelector(".game-hud").classList.remove("hidden");
    document.querySelector(".game-timer").classList.remove("hidden");
    var flash = document.getElementById("flashcardSection");
    var hasFlash = !flash.classList.contains("hidden");
    if (hasFlash) hideView(flash);
    hideView(gameContainer, function () { showView(inputPanel); });
  });

  // ── Toast ─────────────────────────────────
  function showToast(msg) { toast.textContent = msg; toast.classList.remove("hidden"); }
  function hideToast() { toast.classList.add("hidden"); }

  // ── Helpers ───────────────────────────────
  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightBlanks(html) {
    return html.replace(/________/g, '<span class="blank">???</span>');
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  // ══════════════════════════════════════════════
  //  FLASHCARD CAROUSEL
  // ══════════════════════════════════════════════

  var flashcards = [];
  var flashIdx = 0;

  function initFlashcards(cards) {
    flashcards = cards;
    flashIdx = 0;
    var section = document.getElementById("flashcardSection");
    section.classList.remove("hidden");
    showFlashcard();

    document.getElementById("flashcard").onclick = function () {
      document.getElementById("flashcard").classList.toggle("flipped");
    };
    document.getElementById("flashPrev").onclick = function () {
      if (flashIdx > 0) { flashIdx--; showFlashcard(); }
    };
    document.getElementById("flashNext").onclick = function () {
      if (flashIdx < flashcards.length - 1) { flashIdx++; showFlashcard(); }
    };
  }

  function showFlashcard() {
    var card = flashcards[flashIdx];
    document.getElementById("flashTerm").textContent = card.term;
    document.getElementById("flashDef").textContent = card.definition;
    document.getElementById("flashCounter").textContent = (flashIdx + 1) + " / " + flashcards.length;
    document.getElementById("flashcard").classList.remove("flipped");
  }

})();
