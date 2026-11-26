// Server di GLS Help (Cloudflare Worker).
// Fase 1: solo lo scheletro. Gli endpoint veri arrivano nelle fasi successive.

const VERSIONE = '__VERSIONE__';

// Endpoint previsti e fase in cui arrivano
const IN_ARRIVO = {
  identify: 3,
  search: 2,
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const percorso = url.pathname.replace(/^\/+|\/+$/g, '');
    const origine = origineAmmessa(request, env);

    // Controllo dello stato: aperto a tutti, non usa quote
    if (percorso === 'salute' || percorso === '') {
      return rispondi({ ok: true, servizio: 'GLS Help', versione: VERSIONE }, 200, origine);
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

    if (percorso in IN_ARRIVO) {
      return rispondi({ ok: false, errore: `Funzione in arrivo nella fase ${IN_ARRIVO[percorso]}` }, 501, origine);
    }
    return rispondi({ ok: false, errore: 'Indirizzo non trovato' }, 404, origine);
  }
};
