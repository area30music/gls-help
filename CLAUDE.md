# GLS Help – Istruzioni per Claude Code

## Obiettivo

Crea **GLS Help**, una web app installabile (PWA) per iPhone e Android, con interfaccia tutta in italiano. Aiuta a riparare oggetti di casa, a fare lavori fai da te e a gestire la manutenzione.

Sviluppa **per fasi** e fermati alla fine di ogni fase per farmi provare. Prima di scrivere codice, mostrami il piano della fase 1 e dimmi quali account e chiavi devo preparare.

## Struttura del repository

- `web/`: la web app statica, pubblicata su GitHub Pages.
- `worker/`: il server su Cloudflare Workers (piano gratuito).
- `docs/`: logo e materiale grafico.
- `.github/workflows/`: pubblicazione automatica di `web/` su GitHub Pages e di `worker/` su Cloudflare (wrangler) a ogni push sul ramo `main`.
- **Nessuna chiave API nel repository** (che è pubblico): le chiavi stanno solo nei secret di Cloudflare e di GitHub.

## Web app

- HTML, CSS e JavaScript leggeri, senza framework pesanti.
- Manifest e service worker: installazione sulla schermata Home e uso offline.
- Dati salvati **solo sul telefono** con IndexedDB: oggetti, storico interventi, scontrini, guide salvate, preferiti. Ogni persona che installa l'app ha i suoi dati (nessuna condivisione tra utenti).
- All'apertura controlla la versione: se ce n'è una nuova mostra "Nuova versione disponibile – Aggiorna".
- Barra di ricerca in ogni sezione con **pulsante microfono**: registra l'audio e lo manda al worker.
- **Esporta e importa backup** in un unico file JSON (foto comprese), da salvare su iCloud, Google Drive o NAS.

## Grafica

- Tema **chiaro e pulito**, con un solo colore forte: **arancione** (indicativo `#F28C28`) per pulsanti e elementi importanti.
- **Modalità scura automatica** che segue l'impostazione del telefono.
- Icone grandi, uso comodo con una mano.
- Logo: iniziali **GLS** in un riquadro arancione arrotondato con una piccola chiave inglese, scritta "HELP" sotto. File in `docs/logo.svg`; usarlo anche per icone PWA e favicon.
- Home: in alto logo e "GLS Help" con il sottotitolo "Cosa sistemiamo oggi?"; sotto la barra di ricerca con microfono; poi le tre sezioni come card grandi ("Ho un guasto" in evidenza); poi la card "Prossima manutenzione"; in basso il menu Home, Preferiti, Backup.

## Le tre sezioni

1. **Ho un guasto**: foto della targhetta con la fotocamera, lettura di marca, modello e seriale con conferma; ricerca di manuali PDF, guide iFixit e video YouTube; descrizione del problema a testo o voce; risposta con cause, soluzione passo passo, pagina del manuale, minuto del video, fonti che concordano o divergono, livello di affidabilità e avvisi di sicurezza. Inoltre: **codici errore** con spiegazione, **ricambi** con codice del pezzo e link di ricerca, pulsante **"Chiedi aiuto"** che prepara un riepilogo con foto e modello da condividere su WhatsApp.
2. **Come si fa**: guida con attrezzi e materiali, difficoltà, tempo, passaggi numerati con schema dei collegamenti (SVG), video al minuto giusto, domande su ogni passaggio, analisi di una foto della situazione. **Modalità mani libere** (lettura ad alta voce, comandi "avanti" e "ripeti"), **lista della spesa** dei materiali, consiglio **"fai da te o professionista"** con stima del costo, **guide offline**, preferiti e categorie (elettricità, idraulica, montaggio mobili, auto, tecnologia).
3. **I miei oggetti**: elenco degli oggetti con scheda, **storico interventi**, **scontrini e scadenza garanzia** con avviso, **manutenzioni ricorrenti** (es. filtri del climatizzatore ogni X settimane) con **notifiche push** e **calendario in abbonamento** (.ics) da aggiungere al calendario di iPhone o Android.

## Worker Cloudflare

- Usa l'**API gratuita di Gemini** per: lettura di targhette e scontrini dalle foto, trascrizione e comprensione dell'audio, lettura dei PDF, ricerca con Google integrata, diagnosi, guide, traduzione in italiano. Risposte sempre in JSON strutturato.
- Usa **YouTube Data API** e **iFixit API** per video e guide.
- Endpoint: `identify`, `search`, `diagnose`, `howto`, `error-code`, `receipt`, `transcribe`, `push/subscribe`, `maintenance`, `calendar/<codice>.ics`.
- Per notifiche e calendario conserva sul server solo il minimo, in Cloudflare KV, legato a un codice anonimo del telefono: iscrizione push e scadenze delle manutenzioni.
- Un **cron giornaliero** controlla le scadenze e invia le notifiche (Web Push con chiavi VAPID).
- Accetta richieste solo dal dominio della web app e limita il numero di richieste per restare nella quota gratuita di Gemini.

## Regole di sicurezza nelle risposte

- Ogni guida elettrica inizia con "stacca la corrente" e segnala quando serve un elettricista abilitato.
- Avvisi per acqua, gas, gas refrigerante e condensatori.
- I manuali si collegano con il link; si salvano solo per uso personale, senza ripubblicarli.

## Fasi

1. Struttura del repository, pubblicazione automatica, scheletro della web app con le tre sezioni, grafica e logo.
2. Ricerca manuali e video da marca e modello.
3. Foto della targhetta e ricerca a voce.
4. Diagnosi con IA, confronto fonti, codici errore, ricambi, chiedi aiuto.
5. Come si fa completa, con mani libere e guide offline.
6. I miei oggetti: garanzie, storico, manutenzioni, notifiche, calendario, backup.
7. Extra futuri: illustrazioni passo passo dalle immagini dei manuali; video 3D solo quando esisteranno strumenti affidabili.
