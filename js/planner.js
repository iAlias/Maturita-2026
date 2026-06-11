/* Pianificazione: distribuisce gli argomenti non completati sui giorni che mancano.
   Fase scritti (fino al 17/6): italiano + scienze umane.
   Fase orale (dal 20/6 al giorno prima del colloquio): tutte le materie. */

const EXAM_DATES = {
  p1: "2026-06-18",
  p2: "2026-06-19",
  orale: "2026-07-01" // stima: inizio luglio
};

function dateFromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const p = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function dayDiff(fromISO_, toISO_) {
  return Math.round((dateFromISO(toISO_) - dateFromISO(fromISO_)) / 86400000);
}

function formatDay(iso) {
  const giorni = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const d = dateFromISO(iso);
  return `${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]}`;
}

/* Round-robin tra materie: ogni giorno mescola materie diverse invece di blocchi monotematici. */
function interleaveBySubject(topics) {
  const bySubj = new Map();
  for (const t of topics) {
    if (!bySubj.has(t.subj)) bySubj.set(t.subj, []);
    bySubj.get(t.subj).push(t);
  }
  for (const list of bySubj.values()) {
    list.sort((a, b) => (a.topic.priorita || 2) - (b.topic.priorita || 2));
  }
  const queues = [...bySubj.values()];
  const out = [];
  while (queues.some(q => q.length)) {
    for (const q of queues) if (q.length) out.push(q.shift());
  }
  return out;
}

function distribute(topics, days) {
  const plan = days.map(d => ({ date: d, tasks: [] }));
  if (!days.length || !topics.length) return plan;
  const ordered = interleaveBySubject(topics);
  ordered.forEach((t, i) => {
    plan[i % days.length].tasks.push(t);
  });
  // riordina i task del giorno per materia, lettura più pulita
  for (const day of plan) day.tasks.sort((a, b) => a.subj.localeCompare(b.subj));
  return plan;
}

function datesBetween(fromISO_, toISO_) {
  const out = [];
  const end = dateFromISO(toISO_);
  for (let d = dateFromISO(fromISO_); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toISO(d));
  }
  return out;
}

/* data: {subjId: subjectJson}, isDone(subjId, topicId) -> bool */
function buildPlan(data, isDone, todayISO) {
  const days = [];
  const remaining = subjIds => {
    const out = [];
    for (const sid of subjIds) {
      if (!data[sid]) continue;
      for (const topic of data[sid].argomenti) {
        if (!isDone(sid, topic.id)) out.push({ subj: sid, topic });
      }
    }
    return out;
  };

  // Fase scritti: oggi → 17/6
  if (dayDiff(todayISO, EXAM_DATES.p1) > 0) {
    const lastPrep = toISO(new Date(dateFromISO(EXAM_DATES.p1).getTime() - 86400000));
    const prepDays = datesBetween(todayISO, lastPrep);
    const written = distribute(remaining(["italiano", "scienze-umane"]), prepDays);
    for (const d of written) days.push({ ...d, phase: "scritti" });
  }

  // Giorni di prova
  if (dayDiff(todayISO, EXAM_DATES.p1) >= 0) {
    days.push({ date: EXAM_DATES.p1, tasks: [], examNote: "Prima prova scritta — Italiano. In bocca al lupo!" });
  }
  if (dayDiff(todayISO, EXAM_DATES.p2) >= 0) {
    days.push({ date: EXAM_DATES.p2, tasks: [], examNote: "Seconda prova scritta — Scienze umane. Forza!" });
  }

  // Fase orale: dal giorno dopo la seconda prova (o da oggi) → giorno prima dell'orale
  const oralStart = dayDiff(todayISO, EXAM_DATES.p2) >= 0
    ? toISO(new Date(dateFromISO(EXAM_DATES.p2).getTime() + 86400000))
    : todayISO;
  const oralEnd = toISO(new Date(dateFromISO(EXAM_DATES.orale).getTime() - 86400000));
  if (dayDiff(oralStart, oralEnd) >= 0 && dayDiff(todayISO, EXAM_DATES.orale) > 0) {
    const oralDays = datesBetween(oralStart, oralEnd);
    // per l'orale si ripassa tutto ciò che resta, su tutte e quattro le materie
    const oral = distribute(remaining(["italiano", "scienze-umane", "inglese", "arte"]), oralDays);
    for (const d of oral) days.push({ ...d, phase: "orale" });
  }

  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}
