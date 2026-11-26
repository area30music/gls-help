// Chiamate all'API di Gemini.
// Nota: la "ricerca Google integrata" di Gemini NON è nel piano gratuito (errore 429).
// Il server la prova comunque: se un giorno si attiva la fatturazione su Google AI Studio,
// funziona subito senza cambiare codice; finché dà 429 viene saltata per un'ora.

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MODELLI_VELOCI = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest'];
const MODELLI_BRAVI = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

let ricercaGoogleBloccataFino = 0;
export const ricercaGoogleDisponibile = () => Date.now() > ricercaGoogleBloccataFino;

/**
 * @param parti testo (stringa) oppure elenco di parti Gemini ({text} / {inline_data})
 * @param opzioni.qualita 'veloce' (predefinito) o 'brava' (per diagnosi e foto)
 */
export async function chiediGemini(env, parti, { ricercaGoogle = false, json = false, temperatura = 0.2, qualita = 'veloce' } = {}) {
  if (!env.GEMINI_API_KEY) throw new Error('Chiave Gemini mancante');
  if (ricercaGoogle && !ricercaGoogleDisponibile()) throw new Error('Ricerca Google di Gemini non disponibile (piano gratuito)');

  const elenco = qualita === 'brava' ? MODELLI_BRAVI : MODELLI_VELOCI;
  const modelli = [...new Set([qualita === 'veloce' ? env.GEMINI_MODELLO : null, ...elenco].filter(Boolean))];
  const body = {
    contents: [{ role: 'user', parts: typeof parti === 'string' ? [{ text: parti }] : parti }],
    generationConfig: { temperature: temperatura }
  };
  if (ricercaGoogle) body.tools = [{ google_search: {} }];
  if (json && !ricercaGoogle) body.generationConfig.responseMimeType = 'application/json';

  let ultimoErrore;
  const corpo = JSON.stringify(body);
  const inizio = Date.now();
  // Se tutti i modelli sono sovraccarichi, un secondo giro breve sul più leggero
  const giro = ricercaGoogle ? modelli.slice(0, 1) : [...modelli, 'gemini-3.5-flash-lite'];
  for (const [n, modello] of giro.entries()) {
    const restante = 55000 - (Date.now() - inizio);
    if (restante < 4000) break;
    if (n === modelli.length) await new Promise((ok) => setTimeout(ok, 1500));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(restante, n === 0 ? 18000 : 15000));
    let r;
    try {
      r = await fetch(`${BASE}${modello}:generateContent`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: corpo
      });
    } catch (e) {
      clearTimeout(timer);
      ultimoErrore = new Error('Gemini non ha risposto in tempo: riprova tra poco');
      continue;
    }
    clearTimeout(timer);
    if (r.status === 404) { ultimoErrore = new Error(`Modello ${modello} non disponibile`); continue; }
    if (r.status === 503 || r.status === 500) { ultimoErrore = new Error('Gemini è sovraccarico in questo momento: riprova tra poco'); continue; }
    if (r.status === 429) {
      let motivo = '';
      try { motivo = ((await r.json()).error || {}).message || ''; } catch { /* niente */ }
      if (ricercaGoogle) {
        ricercaGoogleBloccataFino = Date.now() + 60 * 60 * 1000;
        throw new Error('Ricerca Google di Gemini non disponibile (piano gratuito)');
      }
      ultimoErrore = new Error(`Quota gratuita di Gemini esaurita per ora: riprova tra qualche minuto. ${motivo.split('\n')[0].slice(0, 120)}`);
      continue;
    }
    if (!r.ok) throw new Error(`Gemini ha risposto ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const dati = await r.json();
    const candidato = (dati.candidates || [])[0] || {};
    const testo = ((candidato.content || {}).parts || []).map((p) => p.text || '').join('');
    // Risposta JSON rotta o tagliata: si riprova con il modello successivo
    if (json && !ricercaGoogle) {
      try { leggiJSON(testo); } catch { ultimoErrore = new Error('Risposta di Gemini incompleta: riprova'); continue; }
    }
    const fonti = ((candidato.groundingMetadata || {}).groundingChunks || [])
      .map((c) => c.web).filter(Boolean).map((w) => ({ url: w.uri, titolo: w.title || '' }));
    return { testo, fonti, modello };
  }
  throw ultimoErrore || new Error('Nessun modello Gemini disponibile');
}

// Estrae il primo oggetto JSON da una risposta di testo
export function leggiJSON(testo) {
  const pulito = String(testo || '').replace(/```(?:json)?/gi, '');
  const inizio = pulito.indexOf('{');
  const fine = pulito.lastIndexOf('}');
  if (inizio < 0 || fine <= inizio) throw new Error('Risposta di Gemini non in JSON');
  return JSON.parse(pulito.slice(inizio, fine + 1));
}
