# Tool online preparazione maturità — Design

Data: 2026-06-11
Utente finale: studente 5ª liceo delle scienze umane (IIS "E. Medi – N. Vaccalluzzo", Leonforte), esame di Stato 2026.
Materie d'esame: Italiano, Scienze umane, Inglese, Storia dell'arte.
Prima prova: 18/06/2026. Seconda prova: 19/06/2026. Orale: stimato inizio luglio 2026.

## Obiettivo

Web app statica single-user per il ripasso del programma svolto delle 4 materie,
usabile da telefono, senza account, senza backend, deploy gratuito.

## Fonti contenuti

Programmi svolti forniti in `Programmi/`:
- `Italiano.pdf` — programma dettagliato di Lingua e letteratura italiana (Romanticismo → Montale, Paradiso canti I, III, VI, XI, XV, XXXIII, con elenco testi letti)
- `Inglese e storia dell'arte.pdf` — contiene in realtà tutti e 4 i programmi sintetici (Italiano, Scienze umane, Inglese con riferimenti pagina, Arte: Rinascimento → Barocco)
- `psicologia (1-4).jpeg` — programma di Filosofia e Scienze umane (pedagogia, sociologia, antropologia, filosofia)

Tutti i contenuti (schede, quiz, flashcard) sono generati da Claude a partire da questi programmi.

## Architettura

SPA statica, vanilla HTML/CSS/JS, nessun framework, nessuna build.

```
/
├── index.html
├── css/style.css
├── js/app.js          (routing tab, stato, render)
├── js/planner.js      (distribuzione argomenti sui giorni)
├── js/quiz.js
├── js/flashcards.js
└── data/
    ├── italiano.json
    ├── scienze-umane.json
    ├── inglese.json
    └── arte.json
```

Ogni JSON materia contiene: elenco argomenti (id, titolo, macro-area, priorità),
schede di ripasso (markdown-like strutturato), quiz (MCQ con 4 opzioni, indice corretta,
spiegazione), flashcard (fronte/retro, riferite ad argomento).

## Funzionalità

1. **Planner** — countdown alle 3 date d'esame; argomenti delle 4 materie distribuiti
   automaticamente sui giorni rimanenti (scritti: priorità italiano/scienze umane fino al 17-18/6,
   poi tutte e 4 per l'orale); checkbox completamento per argomento; barra progresso per materia.
2. **Schede** — una scheda per argomento: concetti chiave, opere/testi/date, sezione
   "Collegamenti" interdisciplinari per il colloquio orale.
3. **Quiz** — selezione materia (e opzionalmente argomento), domande a risposta multipla,
   correzione immediata con spiegazione, punteggio finale, statistiche per materia.
4. **Flashcard** — mazzo per materia, fronte/retro con tap, ripetizione spaziata semplice
   (3 box Leitner in localStorage: sbagliata → box 1, ricompare prima).

## Stato e persistenza

localStorage: argomenti completati, statistiche quiz, box flashcard. Nessun account, nessun server.

## Volume contenuti (target)

~70 schede (Italiano ~22, Scienze umane ~20, Inglese ~18, Arte ~10 raggruppate per artista/periodo),
~300 quiz (~75 a materia), ~250 flashcard (~60 a materia).

## Deploy

Repository GitHub + GitHub Pages. Link finale da condividere con lo studente. Mobile-first.

## Fuori scope

Tutor AI chat, multi-utente, backend, correzione di testi scritti.
