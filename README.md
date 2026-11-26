# gls-help
GLS Help – web app per guasti, guide fai da te e manutenzione degli oggetti di casa

## Come è fatto

- `web/`: la web app (HTML, CSS, JavaScript), pubblicata su https://area30music.github.io/gls-help/
- `worker/`: il server su Cloudflare Workers
- `docs/`: logo; `python3 tools/icone.py` rigenera le icone dell'app (solo su Mac)
- Pubblicazione automatica a ogni push su `main` (`.github/workflows/`)
- Anteprima locale: `python3 -m http.server 8010 --directory web`
