// Chiamate all'API di Gemini (piano gratuito).
// Nota: la "ricerca Google integrata" di Gemini NON è nel piano gratuito (errore 429),
// per questo le ricerche sul web le fa il server (vedi fonti.js).

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
// Prima il modello indicato nelle impostazioni, poi le alternative se non esiste più
const MODELLI_RISERVA = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest'];

export async function chiediGemini(env, prompt, { ricercaGoogle = false, json = false, temperatura = 0.2 } = {}) {
  if (!env.GEMINI_API_KEY) throw new Error('Chiave Gemini mancante');
  const modelli = [...new Set([env.GEMINI_MODELLO, ...MODELLI_RISERVA].filter(Boolean))];
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: temperatura }
  };
  if (ricercaGoogle) body.tools = [{ google_search: {} }];
  if (json && !ricercaGoogle) body.generationConfig.responseMimeType = 'application/json';

  let ultimoErrore;
  for (const modello of modelli) {
    const r = await fetch(`${BASE}${modello}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(body)
    });
    if (r.status === 404) { ultimoErrore = new Error(`Modello ${modello} non disponibile`); continue; }
    if (r.status === 503 || r.status === 500) { ultimoErrore = new Error(`Gemini è sovraccarico in questo momento (${modello}): riprova tra poco`); continue; }
    if (r.status === 429) {
      // Quota del modello finita (o assente): si prova il modello successivo
      let motivo = '';
      try { motivo = ((await r.json()).error || {}).message || ''; } catch { /* niente */ }
      ultimoErrore = new Error(`Quota gratuita di Gemini esaurita per ora (${modello}): ${motivo.split('\n')[0].slice(0, 220)}`);
      continue;
    }
    if (!r.ok) throw new Error(`Gemini ha risposto ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const dati = await r.json();
    const candidato = (dati.candidates || [])[0] || {};
    const testo = ((candidato.content || {}).parts || []).map((p) => p.text || '').join('');
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
