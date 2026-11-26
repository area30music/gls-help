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

// I link delle fonti di Google passano da un indirizzo di reindirizzamento: lo risolviamo
async function risolviReindirizzamento(url) {
  if (!/vertexaisearch\.cloud\.google\.com\/grounding-api-redirect/.test(url)) return url;
  try {
    const r = await conTempo(fetch(url, { method: 'HEAD', redirect: 'manual' }), 4000);
    return r.headers.get('Location') || null;
  } catch { return null; }
}

// Scarta i link che non esistono (404) o non rispondono
async function linkValido(url) {
  try {
    const r = await conTempo(fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { Range: 'bytes=0-0', 'User-Agent': 'Mozilla/5.0 (compatible; GLSHelp/1.0)' }
    }), 5000);
    try { await r.body?.cancel(); } catch { /* niente */ }
    return ![404, 410].includes(r.status) && r.status < 500;
  } catch { return false; }
}

// ---------- Manuali ----------
export async function cercaManuali(env, { testo, marca, modello, tipo }) {
  const descrizione = [marca && `Marca: ${marca}`, modello && `Modello: ${modello}`, tipo && `Tipo di oggetto: ${tipo}`, testo && `Richiesta: ${testo}`]
    .filter(Boolean).join('\n');

  const prompt = `Sei l'assistente di GLS Help, un'app italiana per riparare oggetti di casa.
Usa la ricerca Google per trovare i manuali ufficiali di questo prodotto:
${descrizione}

Cerca prima sul sito ufficiale del produttore, poi su archivi affidabili di manuali (es. ManualsLib, manualzz).
Preferisci i PDF e i manuali in italiano; se non esistono, va bene l'inglese.
Usa SOLO indirizzi che hai visto nei risultati di ricerca: non inventare link.

Rispondi SOLO con un oggetto JSON, senza altro testo, con questa forma:
{
  "prodotto": { "marca": "", "modello": "", "tipo": "", "nome": "" },
  "ricerca_inglese": "",
  "manuali": [
    { "titolo": "", "url": "", "lingua": "it", "genere": "utente", "fonte": "", "pdf": true }
  ]
}
- "prodotto": marca, modello e tipo di oggetto in italiano (es. "lavatrice"); "nome" è il nome completo leggibile.
- "ricerca_inglese": 2-5 parole in inglese per cercare guide di riparazione (es. "Samsung WW90 washing machine").
- "genere": uno tra "utente", "installazione", "servizio", "ricambi", "scheda tecnica".
- "titolo" in italiano, breve. Massimo 6 manuali, i più utili per primi.`;

  const risposta = await chiediGemini(env, prompt, { ricercaGoogle: true });
  let dati;
  try { dati = leggiJSON(risposta.testo); } catch { dati = { manuali: [] }; }

  // Link proposti da Gemini, poi (se servono) le fonti trovate da Google
  let candidati = (Array.isArray(dati.manuali) ? dati.manuali : []).slice(0, 8);
  candidati = await Promise.all(candidati.map(async (m) => ({ ...m, url: soloHttps(await risolviReindirizzamento(m.url || '')) })));
  candidati = candidati.filter((m) => m.url);

  if (candidati.length < 2 && risposta.fonti.length) {
    const extra = await Promise.all(risposta.fonti.slice(0, 5).map(async (f) => {
      const url = soloHttps(await risolviReindirizzamento(f.url));
      return url && { titolo: f.titolo || 'Documento trovato', url, lingua: '', genere: 'utente', fonte: f.titolo || '', pdf: /\.pdf(\?|$)/i.test(url) };
    }));
    candidati.push(...extra.filter(Boolean));
  }

  // Niente doppioni e solo link che esistono
  const visti = new Set();
  candidati = candidati.filter((m) => !visti.has(m.url) && visti.add(m.url));
  const validi = await Promise.all(candidati.map(async (m) => ((await linkValido(m.url)) ? m : null)));

  const fonte = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  return {
    prodotto: dati.prodotto || {},
    ricercaInglese: dati.ricerca_inglese || '',
    manuali: validi.filter(Boolean).slice(0, 6).map((m) => ({
      titolo: String(m.titolo || 'Manuale').slice(0, 140),
      url: m.url,
      lingua: String(m.lingua || '').slice(0, 5),
      genere: String(m.genere || '').slice(0, 30),
      fonte: fonte(m.url),
      pdf: Boolean(m.pdf) || /\.pdf(\?|$)/i.test(m.url)
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
