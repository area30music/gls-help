// Ricerca di manuali (Gemini + Google), guide iFixit e video YouTube.
import { chiediGemini, leggiJSON } from './gemini.js';

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

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

function testoSemplice(html) {
  return decodificaHtml(String(html || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// ---------- Ricerca sul web (gratuita): DuckDuckGo, con Bing come riserva ----------
async function cercaDuckDuckGo(q) {
  const r = await conTempo(fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), {
    headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8' }
  }));
  if (!r.ok) throw new Error(`DuckDuckGo ha risposto ${r.status}`);
  const html = await r.text();
  const risultati = [];
  const blocchi = html.split('class="result__a"').slice(1);
  for (const b of blocchi) {
    const href = (/href="([^"]+)"/.exec(b) || [])[1];
    if (!href) continue;
    let url = decodificaHtml(href);
    if (url.startsWith('//')) url = 'https:' + url;
    try {
      const u = new URL(url);
      if (u.hostname.endsWith('duckduckgo.com')) {
        if (u.pathname.startsWith('/y.js')) continue; // pubblicità
        const vero = u.searchParams.get('uddg');
        if (vero) url = vero;
      }
    } catch { continue; }
    const titolo = testoSemplice((/>([\s\S]*?)<\/a>/.exec(b) || [])[1]);
    const estratto = testoSemplice((/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/.exec(b) || [])[1]);
    risultati.push({ url, titolo, estratto });
  }
  return risultati;
}

async function cercaBing(q) {
  const r = await conTempo(fetch('https://www.bing.com/search?format=rss&setlang=it&q=' + encodeURIComponent(q), {
    headers: { 'User-Agent': UA }
  }));
  if (!r.ok) throw new Error(`Bing ha risposto ${r.status}`);
  const xml = await r.text();
  return xml.split('<item>').slice(1).map((i) => ({
    url: decodificaHtml((/<link>([\s\S]*?)<\/link>/.exec(i) || [])[1] || '').trim(),
    titolo: testoSemplice((/<title>([\s\S]*?)<\/title>/.exec(i) || [])[1]),
    estratto: testoSemplice((/<description>([\s\S]*?)<\/description>/.exec(i) || [])[1])
  })).filter((x) => x.url);
}

export async function cercaWeb(q) {
  let risultati = [];
  try { risultati = await cercaDuckDuckGo(q); } catch { /* si prova Bing */ }
  if (risultati.length < 3) {
    try { risultati = risultati.concat(await cercaBing(q)); } catch { /* niente */ }
  }
  const visti = new Set();
  return risultati
    .map((x) => ({ ...x, url: soloHttps(x.url) }))
    .filter((x) => x.url && !visti.has(x.url) && visti.add(x.url))
    .slice(0, 15);
}

const fonte = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const ARCHIVI = /manualslib|manua\.ls|manuals\.|manualzz|manualsonline|libretto|istruzioni|bedienungsanleitu|usermanual|manualeduso|safe-manuals|device\.report/i;

// Scelta senza Gemini: risultati che sembrano manuali
function sceltaSemplice(risultati, { marca, modello }) {
  const m = String(modello || '').toLowerCase().replace(/\s+/g, '');
  const b = String(marca || '').toLowerCase();
  return risultati.filter((x) => {
    const t = (x.titolo + ' ' + x.url).toLowerCase();
    const pertinente = !m || t.replace(/\s+/g, '').includes(m.slice(0, 6));
    return pertinente && (/manual|istruzion|libretto|guida|\.pdf/.test(t) || (b && fonte(x.url).includes(b)) || ARCHIVI.test(x.url));
  }).slice(0, 6).map((x) => ({
    titolo: x.titolo.slice(0, 140) || 'Manuale', url: x.url, lingua: '', genere: 'utente',
    fonte: fonte(x.url), pdf: /\.pdf(\?|$)/i.test(x.url)
  }));
}

// ---------- Manuali ----------
export async function cercaManuali(env, { testo, marca, modello, tipo }) {
  const base = [marca, modello].filter(Boolean).join(' ') || testo;
  const risultati = await cercaWeb(`${base} ${tipo || ''} manuale istruzioni pdf`.replace(/\s+/g, ' '));

  const descrizione = [marca && `Marca: ${marca}`, modello && `Modello: ${modello}`, tipo && `Tipo di oggetto: ${tipo}`, testo && `Richiesta: ${testo}`]
    .filter(Boolean).join('\n');
  const elenco = risultati.map((x, i) => `[${i + 1}] ${x.titolo}\n${x.url}\n${x.estratto}`).join('\n\n');

  const prompt = `Sei l'assistente di GLS Help, un'app italiana per riparare oggetti di casa.
Prodotto cercato:
${descrizione}

Risultati di una ricerca sul web:
${elenco || '(nessun risultato)'}

Compiti:
1. Riconosci il prodotto: marca, modello, tipo di oggetto in italiano (es. "lavatrice") e nome completo.
2. Scegli dai risultati SOLO le pagine che contengono davvero un manuale, un libretto di istruzioni o la pagina di supporto/download di QUESTO prodotto (o di un modello quasi identico). Escludi negozi, recensioni, pubblicità e prodotti diversi. Prima il sito ufficiale del produttore, poi gli archivi di manuali. Massimo 6, i più utili per primi.
3. Scrivi 2-5 parole in inglese per cercare guide di riparazione (es. "Samsung WW90 washing machine").

Rispondi SOLO con JSON:
{"prodotto":{"marca":"","modello":"","tipo":"","nome":""},"ricerca_inglese":"","scelti":[{"n":1,"titolo":"titolo breve in italiano","lingua":"it","genere":"utente"}]}
"genere" è uno tra: utente, installazione, servizio, ricambi, supporto. "lingua" è il codice della lingua del documento se si capisce, altrimenti "".`;

  let dati = null;
  try {
    const risposta = await chiediGemini(env, prompt, { json: true });
    dati = leggiJSON(risposta.testo);
  } catch (e) {
    // Gemini non disponibile: scelta automatica più semplice
    return { prodotto: {}, ricercaInglese: '', manuali: sceltaSemplice(risultati, { marca, modello }), avviso: e.message };
  }

  const scelti = (Array.isArray(dati.scelti) ? dati.scelti : [])
    .map((s) => ({ s, r: risultati[Number(s.n) - 1] }))
    .filter((x) => x.r)
    .slice(0, 6)
    .map(({ s, r }) => ({
      titolo: String(s.titolo || r.titolo || 'Manuale').slice(0, 140),
      url: r.url,
      lingua: String(s.lingua || '').slice(0, 5),
      genere: String(s.genere || '').slice(0, 30),
      fonte: fonte(r.url),
      pdf: /\.pdf(\?|$)/i.test(r.url)
    }));

  return { prodotto: dati.prodotto || {}, ricercaInglese: dati.ricerca_inglese || '', manuali: scelti };
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
