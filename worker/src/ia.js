// Funzioni di intelligenza artificiale: voce, foto della targhetta, diagnosi del guasto.
import { chiediGemini, leggiJSON } from './gemini.js';
import { cercaYoutube, cercaTavily } from './fonti.js';

const testo = (v, max = 300) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
const MAX_BASE64 = 8 * 1024 * 1024; // circa 6 MB di file

function datiFile(base64, mime, tipiAmmessi) {
  const pulito = String(base64 || '').replace(/^data:[^,]+,/, '');
  if (!pulito) throw new Error('File mancante');
  if (pulito.length > MAX_BASE64) throw new Error('File troppo grande');
  const tipo = String(mime || '').split(';')[0].trim().toLowerCase();
  if (!tipiAmmessi.some((t) => tipo.startsWith(t))) throw new Error(`Formato non supportato: ${tipo || 'sconosciuto'}`);
  return { inline_data: { mime_type: tipo, data: pulito } };
}

// ---------- transcribe: dalla voce al testo ----------
export async function trascrivi(env, corpo) {
  const audio = datiFile(corpo.audio, corpo.mime, ['audio/', 'video/mp4', 'video/webm']);
  // Gemini preferisce "audio/..." anche quando il telefono registra in un contenitore video
  audio.inline_data.mime_type = audio.inline_data.mime_type.replace(/^video\//, 'audio/');
  const prompt = `Trascrivi fedelmente in italiano quello che dice la persona in questo audio.
È una richiesta di aiuto per riparare un oggetto o risolvere un problema (es. elettrodomestici, telefono, auto, TV).
Scrivi marche e modelli in modo corretto (es. "Samsung", "WW90T534DAW", "Sky Q").
Rispondi SOLO con JSON: {"testo":"...","capito":true}
Se non si sente nulla o non è comprensibile: {"testo":"","capito":false}`;
  const r = await chiediGemini(env, [audio, { text: prompt }], { json: true });
  const d = leggiJSON(r.testo);
  return { testo: testo(d.testo, 600), capito: Boolean(d.capito && d.testo) };
}

// ---------- identify: leggere la targhetta da una foto ----------
export async function identifica(env, corpo) {
  const foto = datiFile(corpo.immagine, corpo.mime || 'image/jpeg', ['image/']);
  const prompt = `Questa è la foto della targhetta (o dell'etichetta) di un oggetto: elettrodomestico, caldaia, stampante, telefono, auto, ecc.
Leggi con attenzione e ricava i dati. Non inventare: se un dato non si legge, lascialo vuoto.
Rispondi SOLO con JSON:
{"leggibile":true,"tipo":"tipo di oggetto in italiano (es. lavatrice)","marca":"","modello":"codice del modello esatto","nome_commerciale":"","seriale":"","anno":"","altri_dati":["es. 230V 50Hz","2000W"],"note":"consigli se la foto è sfocata o manca qualcosa"}
- "modello": il codice del modello (spesso dopo "Model", "Mod.", "Type", "Typ", "PNC", "E-Nr"), senza il seriale.
- "seriale": dopo "S/N", "Serial", "Ser. No", "FD".
- Se la foto non è una targhetta o non si legge: "leggibile": false e spiega in "note".`;
  const r = await chiediGemini(env, [foto, { text: prompt }], { json: true, qualita: 'brava' });
  const d = leggiJSON(r.testo);
  return {
    leggibile: Boolean(d.leggibile),
    tipo: testo(d.tipo, 60),
    marca: testo(d.marca, 60),
    modello: testo(d.modello, 60),
    nome: testo(d.nome_commerciale, 80),
    seriale: testo(d.seriale, 60),
    anno: testo(d.anno, 10),
    altri: (Array.isArray(d.altri_dati) ? d.altri_dati : []).map((x) => testo(x, 60)).filter(Boolean).slice(0, 8),
    note: testo(d.note, 300)
  };
}

// ---------- diagnose: dal problema alla soluzione ----------
const REGOLE_PROFILO = {
  semplice: `La persona è anziana o poco pratica di tecnologia.
- Linguaggio semplicissimo, frasi brevi, niente termini tecnici.
- Al massimo 5 passaggi, ognuno con UNA sola azione.
- Per elettricità (dentro gli apparecchi), gas, acqua sotto pressione, caldaie: niente fai da te, consiglia sempre di chiamare un professionista o un familiare.
- Va bene aiutare con controlli semplici e sicuri (spina, interruttore, riavvio, telecomando, impostazioni).`,
  standard: `La persona è pratica di fai da te ma non è un tecnico.
- Linguaggio chiaro, spiega i termini tecnici quando servono.
- Passaggi numerati e precisi.
- Segnala quando serve un professionista (es. elettricista abilitato, tecnico caldaie, frigorista).`,
  professionista: `La persona è un tecnico del settore (es. elettricista).
- Linguaggio tecnico, risposte dense, niente spiegazioni di base.
- Indica valori, misure, componenti, sezioni dei cavi e riferimenti normativi (es. CEI 64-8) quando pertinenti.
- Non dire di chiamare un professionista, ma mantieni SEMPRE gli avvisi di sicurezza (togliere tensione, verificare l'assenza di tensione).`
};

export async function diagnostica(env, corpo) {
  const prodotto = corpo.prodotto || {};
  const p = { tipo: testo(prodotto.tipo, 60), marca: testo(prodotto.marca, 60), modello: testo(prodotto.modello, 60) };
  const problema = testo(corpo.problema, 800);
  const codice = testo(corpo.codice, 40);
  if (!problema && !codice) throw new Error('Descrivi il problema o scrivi il codice di errore');
  const profilo = REGOLE_PROFILO[corpo.profilo] ? corpo.profilo : 'standard';

  // Fonti reali dal web (se c'è la chiave Tavily): rendono la risposta specifica per il modello
  const oggettoTesto = [p.marca, p.modello, p.tipo].filter(Boolean).join(' ');
  let fontiWeb = [];
  try {
    fontiWeb = (await cercaTavily(env, [oggettoTesto, codice ? `errore ${codice}` : '', problema].filter(Boolean).join(' ').slice(0, 300), { max: 6 })).slice(0, 6);
  } catch { /* facoltativo */ }
  const contesto = fontiWeb.length
    ? `\nInformazioni trovate sul web (usale se pertinenti; se sono in contrasto tra loro, dillo nella nota sull'affidabilità):\n${fontiWeb.map((f, n) => `[${n + 1}] ${f.titolo} (${f.url})\n${f.estratto}`).join('\n\n')}\n`
    : '';

  const prompt = `Sei il tecnico esperto di GLS Help, un'app italiana per riparare oggetti di casa e risolvere problemi di tecnologia.
${REGOLE_PROFILO[profilo]}

Oggetto: ${[p.tipo, p.marca, p.modello].filter(Boolean).join(' ') || 'non indicato (deducilo dalla descrizione)'}
Problema descritto: ${problema || '(nessuna descrizione)'}
${codice ? `Codice di errore sul display: ${codice}` : ''}
${contesto}
Regole di sicurezza OBBLIGATORIE:
- Se c'è da toccare parti elettriche, il PRIMO passaggio è "Stacca la corrente" (togli la spina o abbassa l'interruttore) ${profilo === 'professionista' ? 'e verifica l\'assenza di tensione' : ''}.
- Avvisa per acqua (chiudi il rubinetto, attenzione all'acqua residua), gas (mai fai da te sull'impianto gas), gas refrigerante (solo frigorista abilitato), condensatori (possono restare carichi anche a spina staccata), parti calde o taglienti.
- Non inventare codici di ricambio: se non sei sicuro, lascia il codice vuoto.
- Sii onesto sull'affidabilità: se il modello è poco noto o il problema è vago, dillo.

Rispondi SOLO con JSON:
{
 "oggetto": "nome dell'oggetto",
 "prodotto": {"tipo": "tipo di oggetto in italiano", "marca": "", "modello": ""},
 "riassunto": "1-2 frasi: cosa sta probabilmente succedendo",
 "codice_errore": {"codice": "", "significato": ""},
 "sicurezza": ["avvisi di sicurezza, il più importante per primo"],
 "professionista": {"serve": false, "chi": "es. elettricista abilitato", "perche": ""},
 "cause": [{"causa": "", "probabilita": "alta|media|bassa", "come_verificare": ""}],
 "passi": [{"titolo": "azione breve", "dettaglio": "come farlo", "attenzione": ""}],
 "ricambi": [{"nome": "nome del pezzo in italiano", "codice": "", "ricerca": "testo da cercare per trovarlo"}],
 "difficolta": "facile|media|difficile",
 "tempo": "es. 15 minuti",
 "costo": "stima indicativa in euro, se c'è da comprare qualcosa o chiamare un tecnico",
 "affidabilita": "alta|media|bassa",
 "nota_affidabilita": "perché",
 "domande": ["1-3 domande che aiuterebbero a capire meglio il guasto"],
 "fonti_usate": [1, 2],
 "ricerca_video": "4-7 parole per cercare un video di riparazione su YouTube"
}
"codice_errore" vuoto se non c'è un codice. "ricambi" vuoto se non servono pezzi. Massimo 4 cause e ${profilo === 'semplice' ? 5 : 10} passi.`;

  const [risposta, video] = await Promise.allSettled([
    chiediGemini(env, prompt, { json: true, qualita: 'brava', temperatura: 0.3 }),
    cercaYoutube(env, [p.marca, p.modello, p.tipo, codice, problema].filter(Boolean).join(' ').slice(0, 120))
  ]);
  if (risposta.status !== 'fulfilled') throw risposta.reason;
  const d = leggiJSON(risposta.value.testo);

  const lista = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
  const ricambi = lista(d.ricambi, 6).map((r) => {
    const cerca = testo(r.ricerca || [p.marca, p.modello, r.nome, r.codice].filter(Boolean).join(' '), 120);
    return {
      nome: testo(r.nome, 80),
      codice: testo(r.codice, 40),
      link: {
        google: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(cerca)}`,
        amazon: `https://www.amazon.it/s?k=${encodeURIComponent(cerca)}`,
        ebay: `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(cerca)}`
      }
    };
  }).filter((r) => r.nome);

  return {
    ok: true,
    profilo,
    prodotto: p,
    problema,
    codice,
    oggetto: testo(d.oggetto, 100),
    prodottoDedotto: {
      tipo: testo((d.prodotto || {}).tipo || p.tipo, 60),
      marca: testo((d.prodotto || {}).marca || p.marca, 60),
      modello: testo((d.prodotto || {}).modello || p.modello, 60)
    },
    riassunto: testo(d.riassunto, 500),
    codiceErrore: d.codice_errore && d.codice_errore.codice ? { codice: testo(d.codice_errore.codice, 40), significato: testo(d.codice_errore.significato, 400) } : null,
    sicurezza: lista(d.sicurezza, 6).map((x) => testo(x, 300)).filter(Boolean),
    professionista: d.professionista && d.professionista.serve ? { chi: testo(d.professionista.chi, 80), perche: testo(d.professionista.perche, 300) } : null,
    cause: lista(d.cause, 4).map((c) => ({ causa: testo(c.causa, 160), probabilita: testo(c.probabilita, 10), verifica: testo(c.come_verificare, 300) })).filter((c) => c.causa),
    passi: lista(d.passi, profilo === 'semplice' ? 5 : 10).map((s) => ({ titolo: testo(s.titolo, 120), dettaglio: testo(s.dettaglio, 600), attenzione: testo(s.attenzione, 300) })).filter((s) => s.titolo),
    ricambi,
    difficolta: testo(d.difficolta, 20),
    tempo: testo(d.tempo, 40),
    costo: testo(d.costo, 120),
    affidabilita: testo(d.affidabilita, 10),
    notaAffidabilita: testo(d.nota_affidabilita, 300),
    domande: lista(d.domande, 3).map((x) => testo(x, 200)).filter(Boolean),
    video: video.status === 'fulfilled' ? video.value : [],
    fonti: (Array.isArray(d.fonti_usate) ? d.fonti_usate : []).map((n) => fontiWeb[Number(n) - 1]).filter(Boolean)
      .map((f) => ({ titolo: f.titolo, url: f.url })).slice(0, 5),
    fonte: (fontiWeb.length ? 'Gemini con fonti dal web' : 'Conoscenze di Gemini') + ' (' + risposta.value.modello + ')',
    data: new Date().toISOString()
  };
}
