// Server di GLS Help (Cloudflare Worker).
import { cercaManuali, cercaIfixit, cercaYoutube, tipoInglese } from './fonti.js';
import { trascrivi, identifica, diagnostica } from './ia.js';

const VERSIONE = '__VERSIONE__';

// Endpoint previsti e fase in cui arrivano
const IN_ARRIVO = {
  howto: 5,
  receipt: 6,
  'push/subscribe': 6,
  maintenance: 6
};

function origineAmmessa(request, env) {
  const origine = request.headers.get('Origin');
  if (!origine) return null;
  const ammesse = (env.ORIGINI_AMMESSE || '').split(',').map((s) => s.trim()).filter(Boolean);
  return ammesse.includes(origine) ? origine : null;
}

function intestazioni(origine) {
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
  return headers;
}

function rispondi(dati, stato, origine) {
  return new Response(JSON.stringify(dati), { status: stato, headers: intestazioni(origine) });
}

// ---------- Limite di richieste (per restare nella quota gratuita) ----------
const contatori = new Map();
function troppeRichieste(request, max = 20, finestraMs = 10 * 60 * 1000, tipo = 'search') {
  const ip = tipo + ':' + (request.headers.get('CF-Connecting-IP') || 'sconosciuto');
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
  return new Request(`https://cache.gls-help.local/search/v2/${hex}`);
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

    // Il calendario (.ics) verrà aperto dalle app calendario, senza Origin: fase 6
    if (percorso.startsWith('calendar/')) {
      return rispondi({ ok: false, errore: 'Calendario in arrivo nella fase 6' }, 501, null);
    }

    // Tutto il resto: solo dalla web app
    if (!origine) {
      return rispondi({ ok: false, errore: 'Origine non autorizzata' }, 403, null);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: intestazioni(origine) });
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

    // Voce, foto della targhetta, diagnosi del guasto e codici di errore
    const funzioni = { transcribe: [trascrivi, 40], identify: [identifica, 20], diagnose: [diagnostica, 20], 'error-code': [diagnostica, 20] };
    if (percorso in funzioni) {
      if (request.method !== 'POST') return rispondi({ ok: false, errore: 'Usa POST' }, 405, origine);
      const [funzione, max] = funzioni[percorso];
      if (troppeRichieste(request, max, 10 * 60 * 1000, percorso)) {
        return rispondi({ ok: false, errore: 'Troppe richieste in poco tempo: riprova tra qualche minuto' }, 429, origine);
      }
      let corpo;
      try { corpo = await request.json(); } catch { return rispondi({ ok: false, errore: 'Richiesta non valida' }, 400, origine); }
      try {
        const dati = await funzione(env, corpo);
        return rispondi({ ok: true, ...dati }, 200, origine);
      } catch (e) {
        return rispondi({ ok: false, errore: e.message }, 502, origine);
      }
    }

    if (percorso in IN_ARRIVO) {
      return rispondi({ ok: false, errore: `Funzione in arrivo nella fase ${IN_ARRIVO[percorso]}` }, 501, origine);
    }
    return rispondi({ ok: false, errore: 'Indirizzo non trovato' }, 404, origine);
  }
};
