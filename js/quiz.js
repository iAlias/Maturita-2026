/* Quiz: sessioni da 10 domande, correzione immediata, statistiche in localStorage. */

const QUIZ_SESSION_SIZE = 10;

const QuizState = {
  active: null // { subj, questions: [...], index, correct }
};

function quizStatsLoad() {
  try { return JSON.parse(localStorage.getItem("mat26.quizStats")) || {}; }
  catch { return {}; }
}

function quizStatsSave(stats) {
  localStorage.setItem("mat26.quizStats", JSON.stringify(stats));
}

function quizStatsRecord(subj, isCorrect) {
  const stats = quizStatsLoad();
  if (!stats[subj]) stats[subj] = { risposte: 0, corrette: 0 };
  stats[subj].risposte += 1;
  if (isCorrect) stats[subj].corrette += 1;
  quizStatsSave(stats);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* subj = id materia oppure "tutte" */
function quizStart(data, subj) {
  let pool = [];
  const ids = subj === "tutte" ? Object.keys(data) : [subj];
  for (const sid of ids) {
    if (!data[sid]) continue;
    for (const q of data[sid].quiz) pool.push({ ...q, subj: sid });
  }
  QuizState.active = {
    subj,
    questions: shuffle(pool).slice(0, QUIZ_SESSION_SIZE),
    index: 0,
    correct: 0,
    answered: false
  };
}
