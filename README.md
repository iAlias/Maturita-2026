# 📖 Maturità 2026 — Quaderno di ripasso

> Webapp di ripasso per la **Maturità 2026** — Liceo delle Scienze Umane.  
> Piano di studio adattivo, schede sintetiche, quiz a risposta multipla e flashcard con ripetizione spaziata.  
> Nessuna dipendenza esterna, zero installazioni, funziona su qualsiasi browser.

---

## Indice

- [Demo](#demo)
- [Funzionalità](#funzionalità)
- [Materie](#materie)
- [Struttura del progetto](#struttura-del-progetto)
- [Come avviare in locale](#come-avviare-in-locale)
- [Formato dei dati](#formato-dei-dati)
- [Strumenti di sviluppo](#strumenti-di-sviluppo)
- [Come contribuire ai contenuti](#come-contribuire-ai-contenuti)
- [Tecnologie](#tecnologie)

---

## Demo

Apri `index.html` in un browser (oppure metti il progetto su qualsiasi server statico, GitHub Pages incluso).

---

## Funzionalità

| Sezione | Cosa fa |
|---|---|
| **✦ Piano** | Distribuce automaticamente gli argomenti non ancora studiati sui giorni che mancano agli esami. Tiene conto delle due prove scritte e dell'orale. Aggiorna le barre di progresso per materia. |
| **❡ Schede** | Mostra le schede di sintesi per ogni argomento, raggruppate per area tematica. Ogni scheda ha una sintesi, sezioni con punti chiave e collegamenti interdisciplinari per l'orale. |
| **? Quiz** | Sessioni da 10 domande a scelta multipla con correzione immediata e spiegazione della risposta. Traccia le statistiche (% corrette per materia) in locale. |
| **⁂ Carte** | Flashcard con algoritmo di **ripetizione spaziata**: le carte sbagliate tornano più spesso, quelle sapute si distanziano nel tempo. Sessioni personalizzabili per materia. |

### Altre caratteristiche

- **Countdown** agli esami sempre visibile in cima alla pagina.
- **Progresso persistente**: lo stato di avanzamento (argomenti completati, statistiche quiz, stato flashcard) viene salvato nel `localStorage` del browser — non si perde al ricaricamento.
- **Piano adattivo in due fasi**:
  - *Fase scritti* (da oggi al 17 giugno): ripasso di Italiano e Scienze Umane.
  - *Fase orale* (dal 20 giugno al giorno prima del colloquio): ripasso di tutte e quattro le materie.
- **Design responsive** ottimizzato per uso mobile.

---

## Materie

| Materia | File dati |
|---|---|
| 📝 Italiano | `data/italiano.json` |
| 🧠 Scienze Umane | `data/scienze-umane.json` |
| 🇬🇧 Inglese | `data/inglese.json` |
| 🎨 Storia dell'Arte | `data/arte.json` |

---

## Struttura del progetto

```
Maturit-2026/
│
├── index.html              # Entry point
│
├── css/
│   └── style.css           # Tutti gli stili (design system, componenti, responsive)
│
├── js/
│   ├── app.js              # Routing tab, rendering viste, logica principale
│   ├── planner.js          # Algoritmo di distribuzione del piano di studio
│   ├── quiz.js             # Motore quiz e statistiche
│   └── flashcards.js       # Motore flashcard con ripetizione spaziata
│
├── data/
│   ├── italiano.json       # Argomenti, quiz e flashcard di Italiano
│   ├── scienze-umane.json  # Argomenti, quiz e flashcard di Scienze Umane
│   ├── inglese.json        # Argomenti, quiz e flashcard di Inglese
│   └── arte.json           # Argomenti, quiz e flashcard di Storia dell'Arte
│
├── docs/
│   ├── Italiano.pdf        # Programma svolto — Italiano
│   └── Inglese e storia dell'arte.pdf
│
├── tools/
│   └── validate.mjs        # Script Node.js per validare i file JSON
│
└── simplify_italiano.py    # Script Python di supporto alla redazione dei contenuti
```

---

## Come avviare in locale

L'app usa `fetch()` per caricare i file JSON, quindi è necessario servirla tramite un server HTTP (non aprire direttamente `index.html` come file `file://`).

### Opzione 1 — Python (nessuna installazione)

```bash
# Python 3
python3 -m http.server 8080
```

Poi apri [http://localhost:8080](http://localhost:8080) nel browser.

### Opzione 2 — Node.js

```bash
npx serve .
```

### Opzione 3 — VS Code

Installa l'estensione **Live Server** e clicca su *"Go Live"* in basso a destra.

---

## Formato dei dati

Ogni file in `data/` segue questo schema JSON:

```jsonc
{
  "id": "italiano",          // deve corrispondere al nome del file
  "nome": "Italiano",        // nome visualizzato nell'interfaccia
  "argomenti": [
    {
      "id": "manzoni",       // slug univoco (usato da quiz e flashcard)
      "titolo": "Alessandro Manzoni",
      "area": "Romanticismo",
      "priorita": 1,         // 1 = alta, 2 = media, 3 = bassa
      "scheda": {
        "sintesi": "Testo breve di presentazione...",
        "sezioni": [
          {
            "titolo": "Vita e poetica",
            "punti": ["punto uno", "punto due"]
          }
        ],
        "collegamenti": [    // opzionale — per l'orale interdisciplinare
          {
            "materia": "arte",  // id di un'altra materia
            "testo": "Descrizione del collegamento..."
          }
        ]
      }
    }
  ],
  "quiz": [
    {
      "argomento": "manzoni",   // id dell'argomento a cui appartiene
      "domanda": "...",
      "opzioni": ["A", "B", "C", "D"],
      "corretta": 0,            // indice (0–3) della risposta corretta
      "spiegazione": "..."
    }
  ],
  "flashcards": [
    {
      "argomento": "manzoni",
      "fronte": "Domanda o concetto...",
      "retro": "Risposta o spiegazione..."
    }
  ]
}
```

> **Regola**: ogni `argomento` nelle sezioni `quiz` e `flashcards` deve corrispondere a un `id` presente nell'array `argomenti`.

---

## Strumenti di sviluppo

### Validazione dei dati

Lo script `tools/validate.mjs` controlla l'integrità di tutti i file JSON: campi obbligatori, slug coerenti tra argomenti/quiz/flashcard, distribuzione delle risposte corrette.

**Requisiti**: Node.js ≥ 18

```bash
node tools/validate.mjs
```

Output di esempio:

```
✓ italiano: 18 argomenti, 40 quiz, 60 flashcard — distribuzione corrette {0:10,1:11,2:9,3:10}
✓ scienze-umane: 20 argomenti, 45 quiz, 65 flashcard — distribuzione corrette {0:12,...}
✓ inglese: 14 argomenti, 30 quiz, 45 flashcard — ...
✓ arte: 12 argomenti, 25 quiz, 40 flashcard — ...
```

### Script Python

`simplify_italiano.py` è uno script di supporto per semplificare o riformattare testi lunghi da inserire nelle schede.

---

## Come contribuire ai contenuti

1. Apri il file JSON della materia interessata in `data/`.
2. Aggiungi un nuovo oggetto nell'array `argomenti` rispettando lo schema sopra.
3. (Facoltativo) Aggiungi domande in `quiz` e carte in `flashcards` con `"argomento"` corrispondente al nuovo `id`.
4. Esegui la validazione:
   ```bash
   node tools/validate.mjs
   ```
5. Apri l'app nel browser e verifica che tutto sia visualizzato correttamente.

---

## Tecnologie

- **HTML5 / CSS3 / JavaScript ES2022** — Vanilla, zero dipendenze runtime
- **Font**: [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) via Google Fonts
- **Persistenza**: `localStorage` del browser
- **Node.js** (opzionale, solo per lo script di validazione)

---

*Buona fortuna per la maturità! 🍀*
