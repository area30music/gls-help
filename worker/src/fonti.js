// Ricerca di manuali (archivi + Gemini + Bing, con controllo dei link), guide iFixit e video YouTube.
import { chiediGemini, leggiJSON, ricercaGoogleDisponibile } from './gemini.js';

const ATTESA_MS = 6000;

async function conTempo(promessa, ms = ATTESA_MS) {
  let timer;
  const scadenza = new Promise((_, ko) => { timer = setTimeout(() => ko(new Error('Tempo scaduto')), ms); });
  try { return await Promise.race([promessa, scadenza]); } finally { clearTimeout(timer); }
}

function decodificaHtml(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function soloHttps(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'http:') u.protocol = 'https:';
    return u.protocol === 'https:' ? u.toString() : null;
  } catch { return null; }
}

// I link delle fonti di Google passano da un indirizzo di reindirizzamento: lo risolviamo
async function risolviReindirizzamento(url) {
  if (!/vertexaisearch\.cloud\.google\.com\/grounding-api-redirect/.test(url)) return url;
  try {
    const r = await conTempo(fetch(url, { method: 'HEAD', redirect: 'manual' }), 4000);
    return r.headers.get('Location') || null;
  } catch { return null; }
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

function testoSemplice(html) {
  return decodificaHtml(String(html || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// ---------- Ricerca sul web (gratuita) ----------
export async function cercaBingHtml(q) {
  const r = await conTempo(fetch('https://www.bing.com/search?setlang=it&cc=IT&q=' + encodeURIComponent(q), {
    headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8', Accept: 'text/html' }
  }));
  if (!r.ok) throw new Error(`Bing ha risposto ${r.status}`);
  const html = await r.text();
  const risultati = [];
  for (const b of html.split('<li class="b_algo"').slice(1)) {
    const a = /<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(b);
    if (!a) continue;
    let url = decodificaHtml(a[1]);
    // I link di Bing passano da bing.com/ck/a?...&u=a1<base64>
    try {
      const u = new URL(url);
      if (u.hostname.endsWith('bing.com') && u.searchParams.get('u')) {
        const cod = u.searchParams.get('u').replace(/^a1/, '').replace(/-/g, '+').replace(/_/g, '/');
        url = atob(cod + '==='.slice((cod.length + 3) % 4));
      }
    } catch { continue; }
    const estratto = testoSemplice((/<p[^>]*>([\s\S]*?)<\/p>/.exec(b) || [])[1]);
    risultati.push({ url, titolo: testoSemplice(a[2]), estratto });
  }
  if (!risultati.length) throw new Error(`Bing: nessun risultato (${html.length} caratteri)`);
  return risultati;
}

const fonte = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

// ---------- Tavily: motore di ricerca per app di IA (1000 ricerche/mese gratis) ----------
export async function cercaTavily(env, query, { max = 8 } = {}) {
  if (!env.TAVILY_API_KEY) return [];
  const r = await conTempo(fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.TAVILY_API_KEY}` },
    body: JSON.stringify({ query, max_results: max, search_depth: 'basic', include_answer: false })
  }), 12000);
  if (!r.ok) throw new Error(`Tavily ha risposto ${r.status}`);
  const d = await r.json();
  return (d.results || []).map((x) => ({ url: soloHttps(x.url), titolo: testoSemplice(x.title), estratto: testoSemplice(x.content).slice(0, 300) }))
    .filter((x) => x.url);
}

// ---------- Manuali ----------
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const compatto = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Il testo contiene il codice del modello? ("f1000" sì in "scf1000series", no in "scf10000")
function contieneModello(testo, pezzo) {
  if (!pezzo) return true;
  let i = testo.indexOf(pezzo);
  while (i >= 0) {
    const dopo = testo[i + pezzo.length] || '';
    const prima = testo[i - 1] || '';
    const finisceConNumero = /\d$/.test(pezzo);
    const iniziaConNumero = /^\d/.test(pezzo);
    if (!(finisceConNumero && /\d/.test(dopo)) && !(iniziaConNumero && /\d/.test(prima))) return true;
    i = testo.indexOf(pezzo, i + 1);
  }
  return false;
}

// La pagina esiste davvero e parla di quel modello?
async function paginaValida(url, modello, { senzaRedirect = false, sitoUfficiale = false, giaVerificato = false } = {}) {
  try {
    const r = await conTempo(fetch(url, {
      redirect: senzaRedirect ? 'manual' : 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8' }
    }), 6000);
    // Alcuni siti ufficiali bloccano i controlli automatici (403): la pagina esiste, si tiene
    if ((r.status === 403 || r.status === 401) && (sitoUfficiale || giaVerificato)) { try { await r.body?.cancel(); } catch { /* */ } return true; }
    if (r.status !== 200) { try { await r.body?.cancel(); } catch { /* */ } return false; }
    if (giaVerificato || contieneModello(compatto(url), compatto(modello))) { try { await r.body?.cancel(); } catch { /* */ } return true; }
    const tipo = r.headers.get('Content-Type') || '';
    if (/pdf/i.test(tipo)) { try { await r.body?.cancel(); } catch { /* */ } return true; }
    const pezzo = compatto(modello);
    if (!pezzo) { try { await r.body?.cancel(); } catch { /* */ } return true; }
    const html = (await r.text()).slice(0, 400000);
    return contieneModello(compatto(html), pezzo);
  } catch { return false; }
}

// Archivi di manuali con indirizzi prevedibili (se il modello non c'è, rispondono con un reindirizzamento)
function indirizziArchivi(marca, modello) {
  const mo = slug(modello);
  if (!slug(marca) || !mo) return [];
  // La marca può essere scritta con o senza trattino (es. "de-longhi" o "delonghi")
  const marche = [...new Set([slug(marca), slug(marca).replace(/-/g, '')])];
  return marche.flatMap((m) => [
    { titolo: "Manuale d'uso in italiano", url: `https://www.manualeitaliano.it/${m}/${mo}/manuale`, lingua: 'it', genere: 'utente' },
    { titolo: "Manuale d'uso (archivio internazionale)", url: `https://www.manua.ls/${m}/${mo}/manual`, lingua: 'en', genere: 'utente' }
  ]);
}

export async function cercaManuali(env, { testo, marca, modello, tipo }) {
  const descrizione = [marca && `Marca: ${marca}`, modello && `Modello: ${modello}`, tipo && `Tipo di oggetto: ${tipo}`, testo && `Richiesta: ${testo}`]
    .filter(Boolean).join('\n');

  // 1. Gemini riconosce il prodotto e propone le pagine ufficiali di supporto
  const prompt = `Sei l'assistente di GLS Help, un'app italiana per riparare oggetti di casa.
Prodotto:
${descrizione}

1. Riconosci il prodotto: marca, modello esatto (codice), tipo di oggetto in italiano (es. "lavatrice") e nome completo.
2. Proponi fino a 4 indirizzi web dove con buona probabilità si trovano il manuale o la pagina di supporto/download di QUESTO modello, preferendo il sito ufficiale italiano del produttore (es. pagine "support" o "download manuali"). Usa solo schemi di indirizzo reali che conosci bene: verranno controllati uno per uno.
3. Scrivi 2-5 parole in inglese per cercare guide di riparazione (es. "Samsung WW90 washing machine").

Rispondi SOLO con JSON:
{"prodotto":{"marca":"","modello":"","tipo":"","nome":""},"ricerca_inglese":"","pagine":[{"titolo":"titolo breve in italiano","url":"https://...","lingua":"it","genere":"supporto"}]}
"genere" è uno tra: utente, installazione, servizio, ricambi, supporto.`;

  // 0. Se disponibile (piano a consumo), la ricerca Google di Gemini trova i manuali veri
  const daGoogle = [];
  if (ricercaGoogleDisponibile()) {
    try {
      const g = await chiediGemini(env, `Cerca con Google i manuali (PDF o pagine di download) di questo prodotto:
${descrizione}
Preferisci il sito ufficiale del produttore e i manuali in italiano. Rispondi SOLO con JSON:
{"manuali":[{"titolo":"titolo breve in italiano","url":"https://...","lingua":"it","genere":"utente"}]}
Massimo 6, solo indirizzi visti nei risultati.`, { ricercaGoogle: true });
      let elencoG = [];
      try { elencoG = leggiJSON(g.testo).manuali || []; } catch { /* niente */ }
      if (!elencoG.length) elencoG = g.fonti.map((x) => ({ titolo: x.titolo, url: x.url, genere: 'utente' }));
      for (const m of elencoG.slice(0, 6)) {
        const url = soloHttps(await risolviReindirizzamento(m.url || ''));
        if (url) daGoogle.push({ titolo: m.titolo || 'Manuale', url, lingua: m.lingua || '', genere: m.genere || 'utente', giaVerificato: true });
      }
    } catch { /* piano gratuito: si prosegue senza */ }
  }

  let dati = {};
  let avviso = '';
  try {
    dati = leggiJSON((await chiediGemini(env, prompt, { json: true, qualita: 'brava' })).testo) || {};
  } catch (e) { avviso = e.message; }

  const prodotto = dati.prodotto || {};
  const marcaOk = marca || prodotto.marca || '';
  const modelloOk = modello || prodotto.modello || '';

  // 1b. Ricerca web vera (Tavily), se c'è la chiave: risultati reali che contengono il modello
  const daWeb = [];
  if (env.TAVILY_API_KEY && (modelloOk || testo)) {
    const base = [marcaOk, modelloOk].filter(Boolean).join(' ') || testo;
    const pezzo = compatto(modelloOk).replace(/^(surecolor|sc)/, '');
    const risultati = (await Promise.allSettled([
      cercaTavily(env, `${base} manuale istruzioni pdf`),
      cercaTavily(env, `${base} user manual pdf`)
    ])).flatMap((x) => (x.status === 'fulfilled' ? x.value : []));
    const negozi = /amazon\.|ebay\.|aliexpress|idealo|trovaprezzi|youtube\.com|facebook\.com|instagram/i;
    for (const x of risultati) {
      const testoRis = compatto(x.titolo + ' ' + x.url + ' ' + x.estratto);
      if (negozi.test(x.url)) continue;
      if (pezzo && !contieneModello(testoRis, pezzo)) continue;
      if (!/manual|istruzion|guida|guide|pdf|support|download|libretto|handbuch/i.test(x.titolo + ' ' + x.url)) continue;
      daWeb.push({ titolo: x.titolo || 'Manuale', url: x.url, lingua: /lang=it|\/it[_/-]|italian|italiano|\.it\//i.test(x.url + x.titolo) ? 'it' : '', genere: /support|download/i.test(x.url) ? 'supporto' : 'utente', giaVerificato: true });
    }
  }

  // 2. Candidati: risultati web, archivi, pagine proposte da Gemini, risultati di Bing con il codice del modello
  const candidati = [...daGoogle, ...daWeb];
  for (const a of indirizziArchivi(marcaOk, modelloOk)) candidati.push({ ...a, senzaRedirect: true });
  const marcaCompatta = compatto(marcaOk);
  for (const p of (Array.isArray(dati.pagine) ? dati.pagine : []).slice(0, 5)) {
    const url = soloHttps(p.url);
    if (!url) continue;
    // Con risultati veri dal web, le pagine proposte da Gemini devono rispondere davvero (niente eccezioni per i 403)
    const sitoUfficiale = !daWeb.length && marcaCompatta.length > 2 && compatto(fonte(url)).includes(marcaCompatta);
    candidati.push({ titolo: p.titolo || 'Pagina di supporto', url, lingua: p.lingua || '', genere: p.genere || 'supporto', sitoUfficiale });
  }
  if (modelloOk) {
    try {
      const pezzo = compatto(modelloOk).slice(0, 7);
      const web = await cercaBingHtml(`${marcaOk} ${modelloOk} manuale pdf`).catch(() => []);
      for (const w of web.filter((x) => compatto(x.titolo + x.url).includes(pezzo)).slice(0, 4)) {
        candidati.push({ titolo: w.titolo || 'Manuale', url: soloHttps(w.url), lingua: '', genere: 'utente' });
      }
    } catch { /* facoltativo */ }
  }

  // 3. Si tengono solo le pagine che esistono davvero
  const visti = new Set();
  const unici = candidati.filter((c) => {
    if (!c.url) return false;
    const k = c.url.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
    return !visti.has(k) && visti.add(k);
  }).slice(0, 14);
  const controllati = await Promise.all(unici.map(async (c) => ((await paginaValida(c.url, modelloOk, c)) ? c : null)));

  return {
    prodotto,
    ricercaInglese: dati.ricerca_inglese || '',
    avviso,
    controllati: unici.map((c, n) => ({ url: c.url, ok: Boolean(controllati[n]) })),
    manuali: controllati.filter(Boolean).slice(0, 6).map((m) => ({
      titolo: String(m.titolo).slice(0, 140),
      url: m.url,
      lingua: String(m.lingua || '').slice(0, 5),
      genere: String(m.genere || '').slice(0, 30),
      fonte: fonte(m.url),
      pdf: /\.pdf(\?|$)/i.test(m.url)
    }))
  };
}

// ---------- iFixit ----------
// Nomi degli oggetti in inglese, per cercare su iFixit anche senza Gemini
const TIPI_INGLESE = {
  lavatrice: 'washing machine', lavastoviglie: 'dishwasher', asciugatrice: 'dryer', frigorifero: 'refrigerator',
  frigo: 'refrigerator', congelatore: 'freezer', forno: 'oven', microonde: 'microwave', piano: 'cooktop',
  climatizzatore: 'air conditioner', condizionatore: 'air conditioner', caldaia: 'boiler', aspirapolvere: 'vacuum',
  robot: 'robot vacuum', 'macchina del caffè': 'coffee maker', caffettiera: 'coffee maker', telefono: 'phone',
  smartphone: 'phone', cellulare: 'phone', tablet: 'tablet', computer: 'laptop', portatile: 'laptop',
  televisore: 'tv', tv: 'tv', stampante: 'printer', console: 'game console', bicicletta: 'bike', auto: 'car'
};
export function tipoInglese(tipo) {
  const t = String(tipo || '').toLowerCase().trim();
  if (!t) return '';
  return TIPI_INGLESE[t] || Object.entries(TIPI_INGLESE).find(([it]) => t.includes(it))?.[1] || '';
}

export async function cercaIfixit(query) {
  if (!query) return [];
  const url = `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(query)}?filter=guide&limit=6`;
  const r = await conTempo(fetch(url, { headers: { Accept: 'application/json' } }));
  if (!r.ok) throw new Error(`iFixit ha risposto ${r.status}`);
  const dati = await r.json();
  const difficolta = { 'Very easy': 'Molto facile', Easy: 'Facile', Moderate: 'Media', Difficult: 'Difficile', 'Very difficult': 'Molto difficile' };
  return (dati.results || []).filter((g) => g.url).map((g) => ({
    titolo: decodificaHtml(g.title),
    url: soloHttps(g.url),
    immagine: g.image ? soloHttps(g.image['200x150'] || g.image.thumbnail) : null,
    difficolta: difficolta[g.difficulty] || g.difficulty || '',
    minuti: g.time_required_max ? Math.round(g.time_required_max / 60) : null,
    lingua: g.locale || 'en'
  })).filter((g) => g.url);
}

// ---------- YouTube ----------
function durata(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return '';
  const [h, min, s] = [Number(m[1] || 0), Number(m[2] || 0), Number(m[3] || 0)];
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(min).padStart(2, '0')}:${ss}` : `${min}:${ss}`;
}

export async function cercaYoutube(env, query) {
  if (!env.YOUTUBE_API_KEY) throw new Error('Chiave YouTube mancante');
  const p = new URLSearchParams({
    part: 'snippet', type: 'video', maxResults: '6', q: query,
    relevanceLanguage: 'it', regionCode: 'IT', safeSearch: 'moderate', key: env.YOUTUBE_API_KEY
  });
  const r = await conTempo(fetch(`https://www.googleapis.com/youtube/v3/search?${p}`));
  if (r.status === 403) throw new Error('Quota giornaliera di YouTube esaurita o chiave non valida');
  if (!r.ok) throw new Error(`YouTube ha risposto ${r.status}`);
  const dati = await r.json();
  const video = (dati.items || []).filter((v) => v.id && v.id.videoId);
  if (!video.length) return [];

  // Durata dei video (costa pochissimo della quota)
  const durate = {};
  try {
    const p2 = new URLSearchParams({ part: 'contentDetails', id: video.map((v) => v.id.videoId).join(','), key: env.YOUTUBE_API_KEY });
    const r2 = await conTempo(fetch(`https://www.googleapis.com/youtube/v3/videos?${p2}`));
    if (r2.ok) for (const v of (await r2.json()).items || []) durate[v.id] = durata(v.contentDetails && v.contentDetails.duration);
  } catch { /* la durata è facoltativa */ }

  return video.map((v) => ({
    id: v.id.videoId,
    titolo: decodificaHtml(v.snippet.title),
    canale: decodificaHtml(v.snippet.channelTitle),
    immagine: ((v.snippet.thumbnails || {}).medium || (v.snippet.thumbnails || {}).default || {}).url || null,
    durata: durate[v.id.videoId] || '',
    url: `https://www.youtube.com/watch?v=${v.id.videoId}`
  }));
}
