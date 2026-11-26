# gls-help
GLS Help – web app per guasti, guide fai da te e manutenzione degli oggetti di casa

## Come è fatto

- `web/`: la web app (HTML, CSS, JavaScript), pubblicata su https://area30music.github.io/gls-help/
- `worker/`: il server su Cloudflare Workers
- `docs/`: logo; `python3 tools/icone.py` rigenera le icone dell'app (solo su Mac)
- Pubblicazione automatica a ogni push su `main` (`.github/workflows/`)
- Anteprima locale: `python3 -m http.server 8010 --directory web`

## Note sul server (fase 2)

- Gemini gratuito: modello in `worker/wrangler.toml` (`GEMINI_MODELLO`), con modelli di riserva in `worker/src/gemini.js`.
- La "ricerca Google integrata" di Gemini **non** è nel piano gratuito: i manuali si trovano con archivi a indirizzo prevedibile (manualeitaliano.it, manua.ls), pagine ufficiali proposte da Gemini e risultati Bing, tutti controllati prima di mostrarli.
- Le chiavi `GEMINI_API_KEY` e `YOUTUBE_API_KEY` stanno nei secret di GitHub e la pubblicazione le passa a Cloudflare.
- Le ricerche riuscite restano in cache 7 giorni sul server per non consumare quota.
