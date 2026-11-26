// Funzioni di intelligenza artificiale: voce, foto della targhetta, diagnosi del guasto.
import { chiediGemini, leggiJSON } from './gemini.js';
import { cercaYoutube, cercaTavily, contieneModello } from './fonti.js';

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
  let manualePdf = null;
  const compatto = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const [webProblema, webManuale] = await Promise.allSettled([
    cercaTavily(env, [oggettoTesto, codice ? `errore ${codice}` : '', problema].filter(Boolean).join(' ').slice(0, 300), { max: 6 }),
    p.modello ? cercaTavily(env, `${p.marca} ${p.modello} manual pdf`, { max: 6 }) : Promise.resolve([])
  ]);
  if (webProblema.status === 'fulfilled') fontiWeb = webProblema.value.slice(0, 6);
  if (webManuale.status === 'fulfilled') {
    const pezzo = compatto(p.modello).replace(/^(surecolor|sc)/, '');
    manualePdf = webManuale.value.find((x) => /\.pdf(\?|$)/i.test(x.url) && !/scribd|coursehero|studocu/i.test(x.url)
      && contieneModello(compatto(x.titolo + ' ' + x.url + ' ' + x.estratto), pezzo)) || null;
  }
  const leggiManuale = manualePdf
    ? `\nManuale ufficiale del prodotto (PDF, aprilo e leggilo): ${manualePdf.url}\nUsalo per dare indicazioni precise per QUESTO modello (menu, nomi dei pulsanti, procedure) e indica le pagine.\n`
    : '';
  const contesto = fontiWeb.length
    ? `\nInformazioni trovate sul web (usale se pertinenti; se sono in contrasto tra loro, dillo nella nota sull'affidabilità):\n${fontiWeb.map((f, n) => `[${n + 1}] ${f.titolo} (${f.url})\n${f.estratto}`).join('\n\n')}\n`
    : '';

  const prompt = `Sei il tecnico esperto di GLS Help, un'app italiana per riparare oggetti di casa e risolvere problemi di tecnologia.
${REGOLE_PROFILO[profilo]}

Oggetto: ${[p.tipo, p.marca, p.modello].filter(Boolean).join(' ') || 'non indicato (deducilo dalla descrizione)'}
Problema descritto: ${problema || '(nessuna descrizione)'}
${codice ? `Codice di errore sul display: ${codice}` : ''}
${contesto}${leggiManuale}
Regole di sicurezza OBBLIGATORIE:
- Se c'è da toccare parti elettriche, il PRIMO passaggio è "Stacca la corrente" (togli la spina o abbassa l'interruttore) ${profilo === 'professionista' ? 'e verifica l\'assenza di tensione' : ''}.
- Avvisa per acqua (chiudi il rubinetto, attenzione all'acqua residua), gas (mai fai da te sull'impianto gas), gas refrigerante (solo frigorista abilitato), condensatori (possono restare carichi anche a spina staccata), parti calde o taglienti.
- Non inventare codici di ricambio: se non sei sicuro, lascia il codice vuoto.
- Sii onesto sull'affidabilità: se il modello è poco noto o il problema è vago, dillo.
- Sii CONCRETO e SPECIFICO per questo modello: niente consigli generici validi per qualsiasi apparecchio. Considera che tipo di macchina è davvero (es. una stampante DTG per tessuti usa inchiostri a pigmento e bianco, non sublimazione).

Rispondi SOLO con JSON:
{
 "oggetto": "nome dell'oggetto",
 "prodotto": {"tipo": "tipo di oggetto in italiano", "marca": "", "modello": ""},
 "riassunto": "1-2 frasi: cosa sta probabilmente succedendo",
 "codice_errore": {"codice": "", "significato": ""},
 "sicurezza": ["avvisi di sicurezza, il più importante per primo"],
 "professionista": {"serve": false, "chi": "es. elettricista abilitato", "perche": ""},
 "cause": [{"causa": "", "probabilita": "alta|media|bassa", "come_verificare": ""}],
 "passi": [{"titolo": "azione breve", "dettaglio": "come farlo, con i nomi esatti di menu e pulsanti di questo modello", "attenzione": "", "pagina_manuale": ""}],
 "pagine_manuale": [{"pagina": "", "argomento": ""}],
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

  const conManuale = (pr) => chiediGemini(env, pr, { json: true, qualita: 'brava', temperatura: 0.3, leggiIndirizzi: Boolean(manualePdf) })
    .catch(() => chiediGemini(env, pr.replace(leggiManuale, ''), { json: true, qualita: 'brava', temperatura: 0.3 }));
  const [risposta, video] = await Promise.allSettled([
    conManuale(prompt),
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
    passi: lista(d.passi, profilo === 'semplice' ? 5 : 10).map((s) => ({ titolo: testo(s.titolo, 120), dettaglio: testo(s.dettaglio, 600), attenzione: testo(s.attenzione, 300), pagina: testo(s.pagina_manuale, 12) })).filter((s) => s.titolo),
    manuale: manualePdf ? {
      url: manualePdf.url, titolo: testo(manualePdf.titolo, 120),
      pagine: lista(d.pagine_manuale, 6).map((x) => ({ pagina: testo(x.pagina, 12), argomento: testo(x.argomento, 120) })).filter((x) => x.pagina)
    } : null,
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
    fonte: (manualePdf ? 'Gemini con il manuale ufficiale e fonti dal web' : fontiWeb.length ? 'Gemini con fonti dal web' : 'Conoscenze di Gemini') + ' (' + risposta.value.modello + ')',
    data: new Date().toISOString()
  };
}


// ---------- manuale: domande al manuale (anche in inglese), risposta in italiano ----------
export async function chiediManuale(env, corpo) {
  const url = String(corpo.url || '');
  if (!/^https:\/\//.test(url)) throw new Error('Indirizzo del manuale non valido');
  const p = corpo.prodotto || {};
  const domanda = testo(corpo.domanda, 500);
  const profilo = REGOLE_PROFILO[corpo.profilo] ? corpo.profilo : 'standard';
  const prompt = `Sei l'assistente di GLS Help. Apri e leggi questo manuale: ${url}
Prodotto: ${[p.tipo, p.marca, p.modello].filter(Boolean).join(' ') || 'quello del manuale'}
${REGOLE_PROFILO[profilo]}

${domanda
    ? `Domanda della persona: "${domanda}"\nRispondi usando il manuale: spiega in italiano cosa fare, passo passo, con le pagine.`
    : `Fai una guida in italiano alle parti più utili del manuale: cosa contiene, manutenzione ordinaria, risoluzione dei problemi e codici di errore principali, con le pagine.`}
Se il manuale è in un'altra lingua, traduci tu in italiano. Non inventare: se il manuale non ne parla, dillo.

Rispondi SOLO con JSON:
{"trovato": true, "lingua_manuale": "en", "risposta": "spiegazione in italiano", "passi": [{"titolo": "", "dettaglio": "", "pagina": ""}], "sicurezza": [""], "pagine": [{"pagina": "", "argomento": ""}]}`;
  const r = await chiediGemini(env, prompt, { json: true, leggiIndirizzi: true, temperatura: 0.2 });
  const d = leggiJSON(r.testo);
  const lista = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
  return {
    trovato: d.trovato !== false,
    linguaManuale: testo(d.lingua_manuale, 5),
    risposta: testo(d.risposta, 1500),
    passi: lista(d.passi, 12).map((s) => ({ titolo: testo(s.titolo, 120), dettaglio: testo(s.dettaglio, 600), pagina: testo(s.pagina, 12) })).filter((s) => s.titolo),
    sicurezza: lista(d.sicurezza, 5).map((x) => testo(x, 300)).filter(Boolean),
    pagine: lista(d.pagine, 10).map((x) => ({ pagina: testo(x.pagina, 12), argomento: testo(x.argomento, 120) })).filter((x) => x.pagina),
    url,
    fonte: 'Manuale letto da Gemini (' + r.modello + ')'
  };
}

// ---------- howto: guide "Come si fa" ----------
export async function guidaComeSiFa(env, corpo) {
  const richiesta = testo(corpo.richiesta, 300);
  if (!richiesta) throw new Error('Scrivi cosa vuoi fare');
  const categoria = testo(corpo.categoria, 40);
  const profilo = REGOLE_PROFILO[corpo.profilo] ? corpo.profilo : 'standard';
  let fontiWeb = [];
  try { fontiWeb = (await cercaTavily(env, `come ${richiesta} guida passo passo`, { max: 5 })).slice(0, 5); } catch { /* facoltativo */ }
  const contesto = fontiWeb.length
    ? `\nInformazioni trovate sul web (usale se affidabili):\n${fontiWeb.map((f, n) => `[${n + 1}] ${f.titolo} (${f.url})\n${f.estratto}`).join('\n\n')}\n` : '';

  const prompt = `Sei l'esperto di fai da te di GLS Help, un'app italiana.
${REGOLE_PROFILO[profilo]}
Lavoro richiesto: "${richiesta}"${categoria ? ` (categoria: ${categoria})` : ''}
${contesto}
Regole di sicurezza OBBLIGATORIE:
- Lavori elettrici: il PRIMO passaggio è staccare la corrente dal quadro e ${profilo === 'professionista' ? 'verificare l\'assenza di tensione con lo strumento' : 'verificare che sia davvero spenta'}. ${profilo === 'professionista' ? '' : 'Segnala quando la legge richiede un elettricista abilitato (DM 37/08), es. nuove linee o modifiche all\'impianto.'}
- Acqua: chiudere il rubinetto generale. Gas: mai fai da te sull'impianto. Auto: freno a mano, motore spento, cavalletti e non solo il cric.
- Materiali e misure realistici, prezzi indicativi in euro (Italia).

Rispondi SOLO con JSON:
{
 "titolo": "titolo breve della guida",
 "categoria": "elettricità|idraulica|montaggio mobili|auto|tecnologia|altro",
 "difficolta": "facile|media|difficile",
 "tempo": "es. 30 minuti",
 "fai_da_te": {"consiglio": "fai da te|professionista", "perche": "", "costo_fai_da_te": "es. 15-25 €", "costo_professionista": "es. 60-100 €"},
 "sicurezza": [""],
 "attrezzi": [""],
 "materiali": [{"nome": "", "quantita": "", "note": "es. misura o caratteristica da chiedere in negozio"}],
 "passi": [{"titolo": "azione breve", "dettaglio": "come farlo con precisione", "attenzione": ""}],
 "consigli": [""],
 "errori_comuni": [""],
 "ricerca_video": "4-7 parole per cercare un video tutorial su YouTube",
 "fonti_usate": [1]
}
Massimo ${profilo === 'semplice' ? 6 : 12} passi.`;

  const [risposta, video] = await Promise.allSettled([
    chiediGemini(env, prompt, { json: true, qualita: 'brava', temperatura: 0.3 }),
    cercaYoutube(env, richiesta + ' tutorial')
  ]);
  if (risposta.status !== 'fulfilled') throw risposta.reason;
  const d = leggiJSON(risposta.value.testo);
  const lista = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
  const fdt = d.fai_da_te || {};
  return {
    richiesta,
    titolo: testo(d.titolo, 120) || richiesta,
    categoria: testo(d.categoria, 30),
    difficolta: testo(d.difficolta, 20),
    tempo: testo(d.tempo, 40),
    faiDaTe: { consiglio: testo(fdt.consiglio, 20), perche: testo(fdt.perche, 300), costoFaiDaTe: testo(fdt.costo_fai_da_te, 40), costoProfessionista: testo(fdt.costo_professionista, 40) },
    sicurezza: lista(d.sicurezza, 6).map((x) => testo(x, 300)).filter(Boolean),
    attrezzi: lista(d.attrezzi, 15).map((x) => testo(x, 80)).filter(Boolean),
    materiali: lista(d.materiali, 15).map((m) => ({ nome: testo(m.nome, 80), quantita: testo(m.quantita, 30), note: testo(m.note, 120) })).filter((m) => m.nome),
    passi: lista(d.passi, 12).map((s) => ({ titolo: testo(s.titolo, 120), dettaglio: testo(s.dettaglio, 600), attenzione: testo(s.attenzione, 300) })).filter((s) => s.titolo),
    consigli: lista(d.consigli, 5).map((x) => testo(x, 250)).filter(Boolean),
    errori: lista(d.errori_comuni, 5).map((x) => testo(x, 250)).filter(Boolean),
    video: video.status === 'fulfilled' ? video.value : [],
    fonti: lista(d.fonti_usate, 5).map((n) => fontiWeb[Number(n) - 1]).filter(Boolean).map((f) => ({ titolo: f.titolo, url: f.url })),
    fonte: (fontiWeb.length ? 'Gemini con fonti dal web' : 'Conoscenze di Gemini') + ' (' + risposta.value.modello + ')',
    data: new Date().toISOString()
  };
}

// ---------- domanda: domanda su un passaggio, anche con una foto della situazione ----------
export async function domandaLibera(env, corpo) {
  const domanda = testo(corpo.domanda, 500);
  if (!domanda && !corpo.immagine) throw new Error('Scrivi la domanda');
  const profilo = REGOLE_PROFILO[corpo.profilo] ? corpo.profilo : 'standard';
  const parti = [];
  if (corpo.immagine) parti.push(datiFile(corpo.immagine, corpo.mime || 'image/jpeg', ['image/']));
  parti.push({ text: `Sei il tecnico di GLS Help. ${REGOLE_PROFILO[profilo]}
Contesto: ${testo(corpo.contesto, 1500) || 'nessuno'}
${corpo.immagine ? 'La persona ti manda una foto della situazione: guardala con attenzione e descrivi cosa vedi di rilevante.' : ''}
Domanda: "${domanda || 'Cosa vedi nella foto e cosa devo fare?'}"
Rispondi in italiano, breve e pratico, con gli avvisi di sicurezza se servono. Rispondi SOLO con JSON: {"risposta": "", "sicurezza": [""]}` });
  const r = await chiediGemini(env, parti, { json: true, qualita: 'brava' });
  const d = leggiJSON(r.testo);
  return { risposta: testo(d.risposta, 1500), sicurezza: (Array.isArray(d.sicurezza) ? d.sicurezza : []).map((x) => testo(x, 300)).filter(Boolean).slice(0, 4) };
}
