/* Flashcard con ripetizione spaziata semplice (3 box di Leitner):
   box 1 = ogni giorno, box 2 = ogni 2 giorni, box 3 = ogni 4 giorni.
   Sbagliata → torna nel box 1. Giusta → sale di box. */

const FC_INTERVALS = { 1: 1, 2: 2, 3: 4 };

function fcStateLoad() {
  try { return JSON.parse(localStorage.getItem("mat26.fc")) || {}; }
  catch { return {}; }
}

function fcStateSave(state) {
  localStorage.setItem("mat26.fc", JSON.stringify(state));
}

function fcKey(subj, idx) { return `${subj}/${idx}`; }

/* Carte da rivedere oggi per una materia (o per tutte). */
function fcDueCards(data, subj, todayISO) {
  const state = fcStateLoad();
  const due = [];
  const ids = subj === "tutte" ? Object.keys(data) : [subj];
  for (const sid of ids) {
    if (!data[sid]) continue;
    data[sid].flashcards.forEach((card, idx) => {
      const st = state[fcKey(sid, idx)];
      if (!st) { due.push({ ...card, subj: sid, idx }); return; }
      const wait = FC_INTERVALS[st.box] || 1;
      if (dayDiff(st.ultima, todayISO) >= wait) due.push({ ...card, subj: sid, idx });
    });
  }
  return shuffle(due);
}

function fcAnswer(subj, idx, knew, todayISO) {
  const state = fcStateLoad();
  const key = fcKey(subj, idx);
  const prev = state[key] || { box: 1 };
  state[key] = {
    box: knew ? Math.min(3, prev.box + 1) : 1,
    ultima: todayISO
  };
  fcStateSave(state);
}

const FcState = {
  queue: [],   // carte della sessione corrente
  pos: 0,
  flipped: false,
  fatte: 0,
  sapute: 0
};
