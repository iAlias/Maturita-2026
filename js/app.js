/* App: caricamento dati, routing tab, rendering viste. Vanilla JS, nessuna dipendenza. */

const SUBJECT_IDS = ["italiano", "scienze-umane", "inglese", "arte"];

const App = {
  data: {},        // subjId -> json materia
  tab: localStorage.getItem("mat26.tab") || "piano",
  schedaAperta: null,   // {subj, topicId}
  subjSchede: "italiano",
  subjQuiz: null,       // null = schermata scelta
  subjCarte: null,
  quizDone: false
};

function todayISO() { return toISO(new Date()); }

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ——— Argomenti completati ——— */
function doneLoad() {
  try { return JSON.parse(localStorage.getItem("mat26.done")) || {}; }
  catch { return {}; }
}
function isDone(subj, topicId) { return !!doneLoad()[`${subj}/${topicId}`]; }
function toggleDone(subj, topicId) {
  const d = doneLoad();
  const k = `${subj}/${topicId}`;
  if (d[k]) delete d[k]; else d[k] = true;
  localStorage.setItem("mat26.done", JSON.stringify(d));
}

/* ——— Countdown in alto ——— */
function renderCountdown() {
  const el = document.getElementById("countdown");
  const t = todayISO();
  const chips = [
    { label: "1ª prova", date: EXAM_DATES.p1 },
    { label: "2ª prova", date: EXAM_DATES.p2 },
    { label: "Orale", date: EXAM_DATES.orale }
  ];
  el.innerHTML = chips.map(c => {
    const diff = dayDiff(t, c.date);
    if (diff < 0) return "";
    const now = diff === 0;
    return `<div class="cd-chip ${now ? "cd-now" : ""}">
      <b>${now ? "OGGI" : "-" + diff}</b><span>${esc(c.label)}</span>
    </div>`;
  }).join("");
}

/* ——— Tab ——— */
function setTab(tab) {
  App.tab = tab;
  localStorage.setItem("mat26.tab", tab);
  document.querySelectorAll(".tab").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab));
  render();
}

function render() {
  const view = document.getElementById("view");
  renderCountdown();
  if (App.tab === "piano") view.innerHTML = renderPiano();
  else if (App.tab === "schede") view.innerHTML = renderSchede();
  else if (App.tab === "quiz") view.innerHTML = renderQuiz();
  else view.innerHTML = renderCarte();
  window.scrollTo(0, 0);
}

function subjName(sid) { return App.data[sid] ? App.data[sid].nome : sid; }

function pills(current, includeAll, handler) {
  const ids = includeAll ? ["tutte", ...SUBJECT_IDS] : SUBJECT_IDS;
  return `<div class="subject-pills">` + ids.map(sid =>
    `<button class="pill ${sid === current ? "active" : ""}" data-subj="${sid}"
       onclick="${handler}('${sid}')">${sid === "tutte" ? "Tutte" : esc(subjName(sid))}</button>`
  ).join("") + `</div>`;
}

/* ——— PIANO ——— */
function renderPiano() {
  const t = todayISO();
  let html = `<h2 class="section-title">Piano di studio</h2>
    <p class="section-sub">Si aggiorna da solo: spunta gli argomenti e ridistribuisce quelli che restano.</p>`;

  html += `<div class="exam-strip">
    <div class="exam-box"><small>1ª prova</small><b>18 giu</b></div>
    <div class="exam-box"><small>2ª prova</small><b>19 giu</b></div>
    <div class="exam-box"><small>Orale (stima)</small><b>~1 lug</b></div>
  </div>`;

  // progresso per materia
  html += `<div class="card">`;
  for (const sid of SUBJECT_IDS) {
    const subj = App.data[sid];
    if (!subj) continue;
    const tot = subj.argomenti.length;
    const fatti = subj.argomenti.filter(a => isDone(sid, a.id)).length;
    const pct = tot ? Math.round(fatti / tot * 100) : 0;
    html += `<div class="progress-row">
      <span class="pr-name"><span class="subj-dot dot-${sid}"></span>${esc(subj.nome)}</span>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%; background: var(--accent-${sid})"></div></div>
      <span class="pr-pct">${pct}%</span>
    </div>`;
  }
  html += `</div>`;

  const plan = buildPlan(App.data, isDone, t);
  if (!plan.length) {
    html += `<p class="empty-note">L'esame è passato. Goditi l'estate! ☀</p>`;
    return html;
  }

  for (const day of plan) {
    const isToday = day.date === t;
    const isPast = day.date < t;
    if (isPast) continue;
    let tag = "";
    if (day.examNote) tag = `<span class="day-tag tag-exam">esame</span>`;
    else if (isToday) tag = `<span class="day-tag tag-today">oggi</span>`;
    else if (day.phase === "orale") tag = `<span class="day-tag">verso l'orale</span>`;
    html += `<div class="day-block">
      <h3 class="day-head">${esc(formatDay(day.date))} ${tag}</h3>`;
    if (day.examNote) {
      html += `<p class="exam-day-note">✦ ${esc(day.examNote)}</p>`;
    } else if (!day.tasks.length) {
      html += `<p class="exam-day-note" style="color: var(--ink-soft)">Giornata libera: ripasso leggero o quiz.</p>`;
    } else {
      for (const task of day.tasks) {
        const done = isDone(task.subj, task.topic.id);
        html += `<label class="task ${done ? "done" : ""}">
          <input type="checkbox" ${done ? "checked" : ""}
            onchange="onTaskToggle('${task.subj}','${esc(task.topic.id)}')">
          <span>
            <span class="task-title"><span class="subj-dot dot-${task.subj}"></span>${esc(task.topic.titolo)}</span>
            <span class="task-area">${esc(subjName(task.subj))} · ${esc(task.topic.area)}</span>
          </span>
        </label>`;
      }
    }
    html += `</div>`;
  }
  return html;
}

function onTaskToggle(subj, topicId) {
  toggleDone(subj, topicId);
  render();
}

/* ——— SCHEDE ——— */
function setSubjSchede(sid) { App.subjSchede = sid; App.schedaAperta = null; render(); }

function apriScheda(subj, topicId) {
  App.schedaAperta = { subj, topicId };
  render();
}

function chiudiScheda() { App.schedaAperta = null; render(); }

function renderSchede() {
  if (App.schedaAperta) return renderSchedaDetail();
  const sid = App.subjSchede;
  const subj = App.data[sid];
  let html = `<h2 class="section-title">Schede di ripasso</h2>
    <p class="section-sub">Tocca un argomento per aprire la scheda.</p>`;
  html += pills(sid, false, "setSubjSchede");
  if (!subj) return html + `<p class="empty-note">Materia non disponibile.</p>`;

  const byArea = new Map();
  for (const a of subj.argomenti) {
    if (!byArea.has(a.area)) byArea.set(a.area, []);
    byArea.get(a.area).push(a);
  }
  for (const [area, topics] of byArea) {
    html += `<p class="topic-group-title">${esc(area)}</p>`;
    for (const a of topics) {
      const done = isDone(sid, a.id);
      html += `<button class="topic-item" onclick="apriScheda('${sid}','${esc(a.id)}')">
        <span class="subj-dot dot-${sid}"></span>
        <span class="ti-title">${esc(a.titolo)}</span>
        ${done ? `<span class="ti-check">✓</span>` : ""}
        <span class="ti-arrow">›</span>
      </button>`;
    }
  }
  return html;
}

function renderSchedaDetail() {
  const { subj, topicId } = App.schedaAperta;
  const topic = App.data[subj].argomenti.find(a => a.id === topicId);
  if (!topic) { App.schedaAperta = null; return renderSchede(); }
  const s = topic.scheda;
  const done = isDone(subj, topicId);

  let html = `<div class="scheda-detail">
    <button class="back-btn" onclick="chiudiScheda()">‹ Tutte le schede</button>
    <h2 class="scheda-title">${esc(topic.titolo)}</h2>
    <p class="scheda-area"><span class="subj-dot dot-${subj}"></span>${esc(subjName(subj))} · ${esc(topic.area)}</p>
    <p class="scheda-sintesi">${esc(s.sintesi)}</p>`;

  for (const sec of s.sezioni) {
    html += `<div class="scheda-sec"><h3>${esc(sec.titolo)}</h3><ul>` +
      sec.punti.map(p => `<li>${esc(p)}</li>`).join("") + `</ul></div>`;
  }

  if (s.collegamenti && s.collegamenti.length) {
    html += `<div class="colleg"><div class="scheda-sec"><h3>Collegamenti per l'orale</h3></div>` +
      s.collegamenti.map(c =>
        `<div class="colleg-item"><span class="subj-dot dot-${esc(c.materia)}"></span><span>${esc(c.testo)}</span></div>`
      ).join("") + `</div>`;
  }

  html += `<button class="mark-done-btn ${done ? "is-done" : ""}" onclick="onSchedaDone('${subj}','${esc(topicId)}')">
    ${done ? "✓ Completato — tocca per annullare" : "Segna come ripassato"}
  </button></div>`;
  return html;
}

function onSchedaDone(subj, topicId) {
  toggleDone(subj, topicId);
  render();
}

/* ——— QUIZ ——— */
function setSubjQuiz(sid) {
  quizStart(App.data, sid);
  App.subjQuiz = sid;
  App.quizDone = false;
  render();
}

function renderQuiz() {
  let html = `<h2 class="section-title">Quiz</h2>`;
  if (!App.subjQuiz || !QuizState.active) {
    html += `<p class="section-sub">Sessioni da ${QUIZ_SESSION_SIZE} domande, correzione immediata.</p>`;
    html += pills(null, true, "setSubjQuiz");
    // statistiche
    const stats = quizStatsLoad();
    const keys = Object.keys(stats);
    if (keys.length) {
      html += `<div class="card"><div class="scheda-sec"><h3 style="margin-top:4px">Le tue statistiche</h3></div>`;
      for (const sid of keys) {
        const s = stats[sid];
        const pct = s.risposte ? Math.round(s.corrette / s.risposte * 100) : 0;
        html += `<div class="stat-line"><span><span class="subj-dot dot-${sid}"></span>${sid === "tutte" ? "Miste" : esc(subjName(sid))}</span>
          <span><b>${pct}%</b> · ${s.corrette}/${s.risposte}</span></div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  const st = QuizState.active;
  if (App.quizDone) {
    const pct = Math.round(st.correct / st.questions.length * 100);
    const commento = pct >= 80 ? "Pronto per l'esame su questi argomenti."
      : pct >= 60 ? "Buona base: ripassa le schede degli errori."
      : "Riparti dalle schede, poi riprova il quiz.";
    html += `<div class="card">
      <p class="quiz-score-big">${st.correct}/${st.questions.length}</p>
      <p class="quiz-score-sub">${esc(commento)}</p>
      <button class="quiz-next" onclick="setSubjQuiz('${st.subj}')">Nuova sessione</button>
      <button class="quiz-next" style="margin-top:8px; background:transparent; color:var(--ink); border:1.5px solid var(--ink)"
        onclick="quizEsci()">Cambia materia</button>
    </div>`;
    return html;
  }

  const q = st.questions[st.index];
  html += `<p class="quiz-progress">Domanda ${st.index + 1} di ${st.questions.length} · ${esc(subjName(q.subj))}</p>`;
  html += `<div class="card"><p class="quiz-q">${esc(q.domanda)}</p>`;
  q.opzioni.forEach((opt, i) => {
    let cls = "";
    if (st.answered) {
      if (i === q.corretta) cls = "is-correct";
      else if (i === st.picked) cls = "is-wrong";
    }
    html += `<button class="quiz-opt ${cls}" ${st.answered ? "disabled" : ""}
      onclick="quizPick(${i})">${esc(opt)}</button>`;
  });
  if (st.answered) {
    html += `<div class="quiz-expl"><b>${st.picked === q.corretta ? "Esatto." : "Non proprio."}</b> ${esc(q.spiegazione)}</div>
      <button class="quiz-next" onclick="quizNext()">${st.index + 1 < st.questions.length ? "Avanti" : "Vedi risultato"}</button>`;
  }
  html += `</div>`;
  return html;
}

function quizPick(i) {
  const st = QuizState.active;
  if (st.answered) return;
  st.answered = true;
  st.picked = i;
  const q = st.questions[st.index];
  const ok = i === q.corretta;
  if (ok) st.correct += 1;
  quizStatsRecord(q.subj, ok);
  render();
}

function quizNext() {
  const st = QuizState.active;
  if (st.index + 1 < st.questions.length) {
    st.index += 1;
    st.answered = false;
    st.picked = null;
  } else {
    App.quizDone = true;
  }
  render();
}

function quizEsci() {
  App.subjQuiz = null;
  QuizState.active = null;
  App.quizDone = false;
  render();
}

/* ——— FLASHCARD ——— */
function setSubjCarte(sid) {
  FcState.queue = fcDueCards(App.data, sid, todayISO());
  FcState.pos = 0;
  FcState.flipped = false;
  FcState.fatte = 0;
  FcState.sapute = 0;
  App.subjCarte = sid;
  render();
}

function renderCarte() {
  let html = `<h2 class="section-title">Flashcard</h2>`;
  if (!App.subjCarte) {
    html += `<p class="section-sub">Ripetizione spaziata: le carte sbagliate tornano più spesso.</p>`;
    html += pills(null, true, "setSubjCarte");
    html += `<p class="empty-note">Scegli un mazzo per cominciare.</p>`;
    return html;
  }

  if (FcState.pos >= FcState.queue.length) {
    html += `<div class="card">
      <p class="quiz-score-big">${FcState.sapute}/${FcState.fatte || 0}</p>
      <p class="quiz-score-sub">${FcState.fatte ? "carte sapute in questa sessione" : "Nessuna carta da rivedere oggi in questo mazzo: torna domani."}</p>
      <button class="quiz-next" onclick="fcEsci()">Scegli un altro mazzo</button>
    </div>`;
    return html;
  }

  const card = FcState.queue[FcState.pos];
  html += `<div class="fc-meta">
    <span>${FcState.pos + 1} di ${FcState.queue.length} da rivedere</span>
    <span><span class="subj-dot dot-${card.subj}"></span>${esc(subjName(card.subj))}</span>
  </div>
  <div class="fc-stage">
    <div class="fc-card ${FcState.flipped ? "flipped" : ""}" onclick="fcFlip()">
      <div class="fc-face front"><span class="fc-label">Domanda</span><p class="fc-text">${esc(card.fronte)}</p></div>
      <div class="fc-face back"><span class="fc-label">Risposta</span><p class="fc-text">${esc(card.retro)}</p></div>
    </div>
  </div>`;
  if (!FcState.flipped) {
    html += `<p class="fc-hint">Tocca la carta per girarla</p>`;
  } else {
    html += `<div class="fc-actions">
      <button class="fc-btn no" onclick="fcRispondi(false)">Non la sapevo</button>
      <button class="fc-btn ok" onclick="fcRispondi(true)">La sapevo ✓</button>
    </div>`;
  }
  return html;
}

function fcFlip() { FcState.flipped = !FcState.flipped; render(); }

function fcRispondi(knew) {
  const card = FcState.queue[FcState.pos];
  fcAnswer(card.subj, card.idx, knew, todayISO());
  FcState.fatte += 1;
  if (knew) FcState.sapute += 1;
  FcState.pos += 1;
  FcState.flipped = false;
  render();
}

function fcEsci() { App.subjCarte = null; render(); }

/* ——— Avvio ——— */
async function boot() {
  const view = document.getElementById("view");
  view.innerHTML = `<p class="loading">Sto aprendo il quaderno…</p>`;
  document.querySelectorAll(".tab").forEach(b =>
    b.addEventListener("click", () => setTab(b.dataset.tab)));

  const results = await Promise.allSettled(
    SUBJECT_IDS.map(sid => fetch(`data/${sid}.json`).then(r => {
      if (!r.ok) throw new Error(sid);
      return r.json();
    }))
  );
  results.forEach((r, i) => {
    if (r.status === "fulfilled") App.data[SUBJECT_IDS[i]] = r.value;
  });

  if (!Object.keys(App.data).length) {
    view.innerHTML = `<p class="empty-note">Non riesco a caricare i contenuti. Controlla la connessione e ricarica.</p>`;
    return;
  }
  setTab(App.tab);
}

boot();
