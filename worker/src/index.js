// Server di GLS Help (Cloudflare Worker).
import { cercaManuali, cercaIfixit, cercaYoutube, tipoInglese, cercaWeb, cercaDuckDuckGo, cercaBing, cercaDuckDuckGoLite, cercaBingHtml } from './fonti.js';

const VERSIONE = '__VERSIONE__';

// Endpoint previsti e fase in cui arrivano
const IN_ARRIVO = {
  identify: 3,
  diagnose: 4,
  howto: 5,
  'error-code': 4,
  receipt: 6,
  transcribe: 3,
  'push/subscribe': 6,
  maintenance: 6
};

function origineAmmessa(request, env) {
  const origine = request.headers.get('Origin');
  if (!origine) return null;
  const ammesse = (env.ORIGINI_AMMESSE || '').split(',').map((s) => s.trim()).filter(Boolean);
  return ammesse.includes(origine) ? origine : null;
}

function rispondi(dati, stato, origine) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin'
  };
  if (origine) {
    headers['Access-Control-Allow-Origin'] = origine;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return new Response(JSON.stringify(dati), { status: stato, headers });
}

// ---------- Limite di richieste (per restare nella quota gratuita) ----------
const contatori = new Map();
function troppeRichieste(request, max = 20, finestraMs = 10 * 60 * 1000) {
  const ip = request.headers.get('CF-Connecting-IP') || 'sconosciuto';
  const ora = Date.now();
  const voce = contatori.get(ip);
  if (!voce || ora - voce.inizio > finestraMs) { contatori.set(ip, { inizio: ora, n: 1 }); return false; }
  voce.n += 1;
  return voce.n > max;
}

function pulisci(v, max = 120) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function chiaveCache(dati) {
  const testo = JSON.stringify(dati).toLowerCase();
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return new Request(`https://cache.gls-help.local/search/v1/${hex}`);
}

// ---------- search: manuali, guide iFixit e video da marca e modello ----------
async function cerca(request, env, ctx) {
  let corpo;
  try { corpo = await request.json(); } catch { return [{ ok: false, errore: 'Richiesta non valida' }, 400]; }
  const domanda = {
    testo: pulisci(corpo.testo, 200),
    marca: pulisci(corpo.marca, 60),
    modello: pulisci(corpo.modello, 60),
    tipo: pulisci(corpo.tipo, 60)
  };
  if (!domanda.testo && !domanda.marca && !domanda.modello) {
    return [{ ok: false, errore: 'Scrivi almeno marca e modello, o cosa stai cercando' }, 400];
  }

  // Stessa ricerca già fatta di recente: risposta salvata (non consuma quote)
  const cache = caches.default;
  const chiave = await chiaveCache(domanda);
  const salvata = await cache.match(chiave);
  if (salvata) return [{ ...(await salvata.json()), daCache: true }, 200];

  if (troppeRichieste(request)) {
    return [{ ok: false, errore: 'Troppe ricerche in poco tempo: riprova tra qualche minuto' }, 429];
  }

  const frase = [domanda.marca, domanda.modello, domanda.tipo, domanda.testo].filter(Boolean).join(' ');
  const errori = {};

  const [manuali, video] = await Promise.allSettled([
    cercaManuali(env, domanda),
    cercaYoutube(env, frase)
  ]);
  const datiManuali = manuali.status === 'fulfilled' ? manuali.value : null;
  if (!datiManuali) errori.manuali = manuali.reason && manuali.reason.message;
  if (video.status !== 'fulfilled') errori.video = video.reason && video.reason.message;

  // iFixit funziona meglio in inglese: usa la frase preparata da Gemini
  const marcaModello = [domanda.marca, domanda.modello].filter(Boolean).join(' ');
  const perIfixit = (datiManuali && datiManuali.ricercaInglese) || marcaModello || domanda.testo;
  let guide = [];
  try {
    guide = await cercaIfixit(perIfixit);
    if (!guide.length && marcaModello && perIfixit !== marcaModello) guide = await cercaIfixit(marcaModello);
    // Ancora niente: marca + tipo di oggetto in inglese (es. "Samsung washing machine")
    const generico = [domanda.marca, tipoInglese(domanda.tipo || (datiManuali && datiManuali.prodotto && datiManuali.prodotto.tipo))].filter(Boolean).join(' ');
    if (!guide.length && generico && generico.includes(' ')) guide = await cercaIfixit(generico);
  } catch (e) { errori.guide = e.message; }

  const prodotto = (datiManuali && datiManuali.prodotto) || {};
  const nome = pulisci(prodotto.nome) || [prodotto.marca || domanda.marca, prodotto.modello || domanda.modello].filter(Boolean).join(' ') || domanda.testo;
  const risposta = {
    ok: true,
    domanda,
    prodotto: {
      marca: pulisci(prodotto.marca || domanda.marca, 60),
      modello: pulisci(prodotto.modello || domanda.modello, 60),
      tipo: pulisci(prodotto.tipo || domanda.tipo, 60),
      nome
    },
    manuali: datiManuali ? datiManuali.manuali : [],
    guide,
    video: video.status === 'fulfilled' ? video.value : [],
    altrove: {
      google: `https://www.google.com/search?q=${encodeURIComponent(nome + ' manuale pdf')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(frase)}`,
      ifixit: `https://www.ifixit.com/Search?query=${encodeURIComponent(perIfixit)}`
    },
    errori,
    data: new Date().toISOString()
  };

  // Salva per 7 giorni solo le ricerche riuscite
  if (!Object.keys(errori).length) {
    const daSalvare = new Response(JSON.stringify(risposta), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=604800' }
    });
    ctx.waitUntil(cache.put(chiave, daSalvare));
  }
  return [risposta, 200];
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const percorso = url.pathname.replace(/^\/+|\/+$/g, '');
    const origine = origineAmmessa(request, env);

    // Controllo dello stato: aperto a tutti, non usa quote
    if (percorso === 'salute' || percorso === '') {
      return rispondi({
        ok: true, servizio: 'GLS Help', versione: VERSIONE,
        gemini: Boolean(env.GEMINI_API_KEY), youtube: Boolean(env.YOUTUBE_API_KEY)
      }, 200, origine);
    }

    // Diagnosi tecnica: quali modelli Gemini può usare la chiave (non mostra la chiave)
    if (percorso === 'diagnosi/gemini') {
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': env.GEMINI_API_KEY || '' } });
        const d = await r.json();
        const modelli = (d.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
        const prova = {};
        const daProvare = (url.searchParams.get('modelli') || `${env.GEMINI_MODELLO},gemini-3.8-flash,gemini-3.5-flash,gemini-3.5-flash-lite`).split(',').slice(0, 6);
        for (const m of daProvare) {
          for (const conRicerca of [false, true]) {
            const corpo = { contents: [{ parts: [{ text: 'Rispondi solo: ok' }] }] };
            if (conRicerca) corpo.tools = [{ google_search: {} }];
            const t = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY || '' },
              body: JSON.stringify(corpo)
            });
            const err = t.status === 200 ? null : ((await t.json().catch(() => ({}))).error || {});
            prova[`${m}${conRicerca ? ' + ricerca Google' : ''}`] = t.status === 200 ? 'ok'
              : `${t.status} ${(err.message || '').split('\n')[0].slice(0, 120)} ${JSON.stringify((err.details || []).filter((x) => /QuotaFailure/.test(x['@type'] || '')).map((x) => x.violations)).slice(0, 300)}`;
          }
        }
        return rispondi({ stato: r.status, modelli, prova }, 200, null);
      } catch (e) {
        return rispondi({ errore: e.message }, 500, null);
      }
    }

    // Diagnosi tecnica: cosa restituiscono i motori di ricerca dal server
    if (percorso === 'diagnosi/web') {
      const q = url.searchParams.get('q') || 'Samsung WW90T534DAW manuale pdf';
      const esito = {};
      for (const [nome, fn] of [['duckduckgo', cercaDuckDuckGo], ['duckduckgo-lite', cercaDuckDuckGoLite], ['bing', cercaBingHtml], ['bing-rss', cercaBing]]) {
        try { esito[nome] = (await fn(q)).slice(0, 8).map((x) => x.url); } catch (e) { esito[nome] = 'errore: ' + e.message; }
      }
      return rispondi(esito, 200, null);
    }

    // Il calendario (.ics) verrà aperto dalle app calendario, senza Origin: fase 6
    if (percorso.startsWith('calendar/')) {
      return rispondi({ ok: false, errore: 'Calendario in arrivo nella fase 6' }, 501, null);
    }

    // Tutto il resto: solo dalla web app
    if (!origine) {
      return rispondi({ ok: false, errore: 'Origine non autorizzata' }, 403, null);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: rispondi({}, 204, origine).headers });
    }

    if (percorso === 'search') {
      if (request.method !== 'POST') return rispondi({ ok: false, errore: 'Usa POST' }, 405, origine);
      try {
        const [dati, stato] = await cerca(request, env, ctx);
        return rispondi(dati, stato, origine);
      } catch (e) {
        return rispondi({ ok: false, errore: 'Errore del server: ' + e.message }, 500, origine);
      }
    }

    if (percorso in IN_ARRIVO) {
      return rispondi({ ok: false, errore: `Funzione in arrivo nella fase ${IN_ARRIVO[percorso]}` }, 501, origine);
    }
    return rispondi({ ok: false, errore: 'Indirizzo non trovato' }, 404, origine);
  }
};
