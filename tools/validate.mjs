import { readFileSync } from "node:fs";

const SUBJECTS = ["italiano", "scienze-umane", "inglese", "arte"];
const MATERIE_OK = new Set(SUBJECTS);
let errors = 0;

for (const sid of SUBJECTS) {
  let j;
  try {
    j = JSON.parse(readFileSync(`data/${sid}.json`, "utf8"));
  } catch (e) {
    console.log(`✗ ${sid}: JSON NON VALIDO — ${e.message}`);
    errors++;
    continue;
  }
  const probs = [];
  if (j.id !== sid) probs.push(`id "${j.id}" ≠ "${sid}"`);
  const slugs = new Set((j.argomenti || []).map(a => a.id));
  for (const a of j.argomenti || []) {
    if (!a.titolo || !a.area || !a.scheda) probs.push(`argomento ${a.id}: campi mancanti`);
    if (![1, 2, 3].includes(a.priorita)) probs.push(`argomento ${a.id}: priorita ${a.priorita}`);
    if (!a.scheda?.sintesi || !a.scheda?.sezioni?.length) probs.push(`argomento ${a.id}: scheda incompleta`);
    for (const c of a.scheda?.collegamenti || []) {
      if (!MATERIE_OK.has(c.materia)) probs.push(`argomento ${a.id}: collegamento materia "${c.materia}"`);
    }
  }
  (j.quiz || []).forEach((q, i) => {
    if (!slugs.has(q.argomento)) probs.push(`quiz[${i}]: argomento "${q.argomento}" inesistente`);
    if (!Array.isArray(q.opzioni) || q.opzioni.length !== 4) probs.push(`quiz[${i}]: opzioni ≠ 4`);
    if (!(q.corretta >= 0 && q.corretta <= 3)) probs.push(`quiz[${i}]: corretta=${q.corretta}`);
    if (!q.spiegazione) probs.push(`quiz[${i}]: manca spiegazione`);
  });
  (j.flashcards || []).forEach((f, i) => {
    if (!slugs.has(f.argomento)) probs.push(`flashcard[${i}]: argomento "${f.argomento}" inesistente`);
    if (!f.fronte || !f.retro) probs.push(`flashcard[${i}]: fronte/retro mancante`);
  });
  const dist = {};
  for (const q of j.quiz || []) dist[q.corretta] = (dist[q.corretta] || 0) + 1;
  console.log(`${probs.length ? "✗" : "✓"} ${sid}: ${j.argomenti?.length} argomenti, ${j.quiz?.length} quiz, ${j.flashcards?.length} flashcard — distribuzione corrette ${JSON.stringify(dist)}`);
  for (const p of probs.slice(0, 12)) console.log(`   - ${p}`);
  if (probs.length > 12) console.log(`   … e altri ${probs.length - 12}`);
  errors += probs.length;
}
process.exit(errors ? 1 : 0);
