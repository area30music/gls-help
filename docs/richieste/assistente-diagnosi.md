# Richiesta: trasformare la diagnosi in un vero assistente

## Il problema di oggi

Ho provato "Ho un guasto" con un caso reale: nella casa di campagna ho un impianto fotovoltaico **ad isola** e ogni giorno, quando arrivo verso mezzogiorno, l'inverter è spento. Probabilmente le batterie non si caricano abbastanza, o c'è qualcosa che non va nell'impianto.

La risposta è stata generica ("prova a scollegare e ricollegare"). Dopo la prima risposta **non posso aggiungere foto**, l'app **non me le chiede** e **non mi fa domande** per capire meglio. Così non è un assistente, è una ricerca.

## A chi serve l'app (i tre profili)

- **Semplice**: la do ai miei nonni. Deve risolvere da soli la maggior parte dei problemi "stupidi" di tutti i giorni con telefono, TV e decoder, macchina (es. Bluetooth), Wi-Fi, WhatsApp. Domande facilissime, una foto alla volta, passaggi letti a voce, e se non ce la fanno il tasto per chiamarmi.
- **Standard**: la uso io per i problemi più seri: es. una stampante che non va, un collegamento elettrico, un impianto. Deve dare **schemi dei collegamenti** quando servono, foto da fare, misure da prendere.
- **Professionista**: **stesse funzioni della Standard**, non una versione diversa; cambia solo il livello di dettaglio: **più schemi e più dettagliati**, linguaggio tecnico, parametri, misure e riferimenti alle norme. Restano sempre gli avvisi di sicurezza.

In tutti e tre i profili la diagnosi è la stessa conversazione guidata descritta sotto: cambiano tono, quantità di dettaglio e numero di schemi.

## Cosa voglio

La diagnosi deve diventare una **conversazione guidata**, come un tecnico esperto al telefono.

1. **Prima capire, poi rispondere**
    - Dopo la descrizione del problema, se mancano informazioni l'app fa **1-2 domande alla volta**, non un questionario lungo.
    - Domande con **risposte rapide a pulsanti** quando possibile (es. "Sì / No / Non so"), più risposta libera a testo o voce.
    - Le domande devono servire a distinguere tra le cause possibili, non essere generiche.

2. **Foto, video e misure in qualsiasi momento**
    - In ogni punto della conversazione posso allegare **foto o un breve video** (fotocamera o galleria).
    - L'app **chiede di sua iniziativa** le foto utili, dicendo esattamente cosa inquadrare: es. "fotografa il display dell'inverter", "la targhetta delle batterie", "i LED del regolatore di carica", "i collegamenti".
    - Gemini analizza le foto (codici errore, valori sul display, LED, cablaggi) e ne tiene conto.
    - Può chiedere **valori da leggere o misurare** (es. tensione batteria, percentuale di carica, ora in cui si spegne), spiegando come leggerli in sicurezza.

3. **Ragionamento per ipotesi**
    - Mostra le **cause probabili in ordine**, con quanto è probabile ciascuna, e le aggiorna dopo ogni risposta o foto.
    - Propone le verifiche **dalla più semplice e sicura alla più complessa**.
    - Niente consigli generici tipo "scollega e ricollega" se non c'è un motivo preciso; quando consiglia qualcosa, dice **perché**.
    - Quando la soluzione riguarda collegamenti (elettrici, cavi, stampanti, impianti) mostra uno **schema** (SVG), più dettagliato nel profilo Professionista.
    - Usa i dati del dispositivo (modello dell'inverter, batterie, pannelli) e se mancano li chiede, anche con la foto della targhetta, e li aggiunge ai dispositivi.

4. **Il caso test: inverter di un impianto ad isola spento a mezzogiorno**
    Usalo per provare la nuova diagnosi. Un buon assistente dovrebbe chiedere cose come: modello di inverter, regolatore e batterie; se il display mostra un codice o un allarme; tensione o percentuale delle batterie; se di notte resta acceso qualcosa che consuma (standby dell'inverter compreso); se il giorno prima era nuvoloso; se l'inverter si riaccende da solo quando c'è sole. E valutare cause come: spegnimento per batteria scarica durante la notte (soglia di bassa tensione), protezione del BMS delle batterie, pannelli che non caricano abbastanza (sporchi, ombre, guasto), regolatore di carica o impostazioni dell'inverter (soglie di spegnimento e riaccensione), batterie a fine vita.

5. **Il problema resta aperto finché non è risolto**
    - Ogni diagnosi è una **scheda problema** salvata sul telefono, con tutta la conversazione, le foto e le prove fatte.
    - Posso chiuderla e **riprenderla dopo** (es. "domani vado in campagna e faccio la foto").
    - Alla fine chiede "Ha funzionato?": se sì segna il problema come risolto nello storico del dispositivo, se no continua con l'ipotesi successiva.
    - Se non si risolve, propone "Chiedi aiuto" con un riepilogo pronto (problema, prove fatte, foto) da mandare al tecnico o a me.

6. **Sicurezza**
    - Impianti con batterie: avvisi su correnti continue elevate, cortocircuiti, isolamento, protezioni prima di toccare i collegamenti.

## Lato tecnico

- Usa Gemini in modalità **multi-turno**: a ogni messaggio il worker manda la cronologia della scheda problema, le foto, i dispositivi e il profilo.
- Gemini risponde in JSON con: domande da fare (con eventuali pulsanti), foto richieste, ipotesi con probabilità, prossima verifica, eventuale schema, eventuale soluzione e avvisi di sicurezza.
- Ridimensiona le foto sul telefono prima dell'invio per restare nella quota gratuita.

Prima di scrivere codice, mostrami il piano e come cambia la schermata della diagnosi.
