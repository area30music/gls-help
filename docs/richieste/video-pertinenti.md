# Richiesta: video solo pertinenti

## Il problema

Ho fatto una domanda e tra i risultati è comparso un video YouTube di circa **60 ore, in giapponese**, che non c'entrava niente con la domanda. I video vanno filtrati e controllati prima di mostrarli.

## Cosa voglio

1. **Lingua**: prima i video in italiano, poi in inglese. Altre lingue solo se non c'è altro e solo se pertinenti, segnalate con la lingua (es. "video in tedesco").
    - Nella ricerca YouTube usa `relevanceLanguage` e la query tradotta in italiano e in inglese.
2. **Durata**: escludi dirette, video in diretta registrati e video troppo lunghi (indicativamente oltre 30-40 minuti), salvo che sia una guida completa davvero pertinente. Usa `videoDuration` e controlla la durata reale con la chiamata `videos` (contentDetails), escludendo `liveBroadcastContent` diverso da `none`.
3. **Pertinenza verificata**: prima di mostrare un video, Gemini controlla titolo, descrizione e, quando ci sono, i sottotitoli, e lo scarta se non riguarda quel dispositivo o quel problema. Mostra solo i video che superano il controllo, al massimo 3-5.
4. **Minuto giusto**: se dai sottotitoli si capisce dove inizia la parte utile, il link parte da quel minuto.
5. **Meglio niente che un video sbagliato**: se nessun video è pertinente, scrivi "Nessun video adatto trovato" invece di mostrare risultati a caso.
6. In ogni video mostra: titolo, durata, lingua e una riga su perché è utile.

Prima di scrivere codice, mostrami il piano.
