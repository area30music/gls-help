// GLS Help – app principale: pagine, navigazione, avvisi e aggiornamenti
(function () {
  'use strict';

  // Impostazioni: la versione viene scritta dalla pubblicazione automatica
  const GLS = window.GLS = {
    versione: '__VERSIONE__',
    worker: 'https://gls-help.info-area30.workers.dev', // server (Cloudflare Worker)
    profilo: null
  };

  // ---------- Icone (SVG semplici, a tratto) ----------
  const I = {
    cerca: '<path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"/><path d="m16 16 5 5"/>',
    microfono: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
    indietro: '<path d="M15 5l-7 7 7 7"/>',
    freccia: '<path d="m9 5 7 7-7 7"/>',
    chiave: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    guida: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 12h5"/>',
    scatola: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>',
    fotocamera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    fumetto: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    codice: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M12 8v3M12 13.5v.01"/>',
    ricambio: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    fulmine: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    goccia: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"/>',
    mobile: '<rect x="4" y="3" width="16" height="15" rx="1.5"/><path d="M4 10.5h16M10 7h4M10 14h4M6 18v3M18 18v3"/>',
    auto: '<path d="M5 11 7 6h10l2 5"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2M18 17v2"/><circle cx="7.5" cy="14" r=".6"/><circle cx="16.5" cy="14" r=".6"/>',
    tecnologia: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    stella: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    esporta: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
    importa: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
    piu: '<path d="M12 5v14M5 12h14"/>',
    documento: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    play: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    esterno: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    stellaPiena: '<path fill="currentColor" d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    orologio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ingranaggio: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    casa: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
    casco: '<path d="M3 18.5h18"/><path d="M4.5 18.5V16a7.5 7.5 0 0 1 15 0v2.5"/><path d="M9.5 9V5.5h5V9"/>'
  };

  // ---------- Profili ----------
  const PROFILI = {
    semplice: { nome: 'Semplice', icona: 'persona', testo: 'Caratteri grandi, poche scelte, risposte brevi lette ad alta voce' },
    standard: { nome: 'Standard', icona: 'casa', testo: "L'app completa, per i lavori di casa e il fai da te" },
    professionista: { nome: 'Professionista', icona: 'casco', testo: 'Linguaggio tecnico, schemi dettagliati e riferimenti alle norme' }
  };

  function applicaProfilo(id) {
    GLS.profilo = PROFILI[id] ? id : null;
    if (GLS.profilo) document.documentElement.dataset.profilo = GLS.profilo;
    else delete document.documentElement.dataset.profilo;
  }
  const svg = (nome) => `<svg aria-hidden="true" viewBox="0 0 24 24">${I[nome]}</svg>`;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Pezzi ricorrenti ----------
  function barraRicerca(segnaposto, etichetta) {
    return `
      <form class="ricerca" role="search" data-ricerca>
        ${svg('cerca')}
        <label class="visivamente-nascosto" for="q">${esc(etichetta)}</label>
        <input id="q" name="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(segnaposto)}">
        <button type="button" class="microfono" data-microfono aria-label="Cerca con la voce">${svg('microfono')}</button>
      </form>`;
  }

  function testataSezione(titolo, indietro) {
    return `
      <header class="testata-sezione">
        <a class="indietro" href="${indietro || '#/'}" aria-label="Indietro">${svg('indietro')}</a>
        <h1>${esc(titolo)}</h1>
      </header>`;
  }

  function cardAzione(icona, titolo, testo, attr) {
    return `
      <button type="button" class="card" ${attr || ''} style="width:100%;text-align:left;font:inherit">
        <span class="icona">${svg(icona)}</span>
        <span class="testo"><span class="tit">${esc(titolo)}</span><span class="sotto">${esc(testo)}</span></span>
        ${svg('freccia').replace('<svg', '<svg class="freccia"')}
      </button>`;
  }

  // ---------- Pagine ----------
  function sceltaProfili() {
    return `
      <div class="elenco-card">
        ${Object.entries(PROFILI).map(([id, pr]) => `
          <button type="button" class="card${GLS.profilo === id ? ' scelto' : ''}" data-profilo="${id}" aria-pressed="${GLS.profilo === id}">
            <span class="icona">${svg(pr.icona)}</span>
            <span class="testo"><span class="tit">${pr.nome}${GLS.profilo === id ? ' <span class="etichetta">Attivo</span>' : ''}</span><span class="sotto">${esc(pr.testo)}</span></span>
          </button>`).join('')}
      </div>`;
  }

  const pagine = {
    profilo: {
      titolo: 'Come vuoi usarla?',
      html: () => `
        <header class="testata">
          <img src="favicon.svg" alt="Logo GLS Help: le lettere GLS con una chiave inglese, in un riquadro arancione" width="56" height="56">
          <div>
            <h1>Come vuoi usarla?</h1>
            <p>Potrai cambiarlo quando vuoi dalle Impostazioni.</p>
          </div>
        </header>
        ${sceltaProfili()}`
    },

    home: {
      titolo: 'GLS Help',
      html: () => `
        <header class="testata">
          <img src="favicon.svg" alt="Logo GLS Help: le lettere GLS con una chiave inglese, in un riquadro arancione" width="56" height="56">
          <div>
            <h1>GLS Help</h1>
            <p>Cosa sistemiamo oggi?</p>
          </div>
          <a class="ingranaggio" href="#/impostazioni" aria-label="Impostazioni">${svg('ingranaggio')}</a>
        </header>

        ${barraRicerca('Cerca un oggetto o un problema…', 'Cerca in GLS Help')}

        <div class="elenco-card">
          <a class="card card-evidenza" href="#/guasto">
            <span class="icona">${svg('chiave')}</span>
            <span class="testo"><h2>Ho un guasto</h2><p>Fotografa la targhetta, descrivi il problema e trova la soluzione</p></span>
            ${svg('freccia').replace('<svg', '<svg class="freccia"')}
          </a>
          <a class="card" href="#/come-si-fa">
            <span class="icona">${svg('guida')}</span>
            <span class="testo"><h2>Come si fa</h2><p>Guide fai da te passo passo</p></span>
            ${svg('freccia').replace('<svg', '<svg class="freccia"')}
          </a>
          <a class="card" href="#/oggetti">
            <span class="icona">${svg('scatola')}</span>
            <span class="testo"><h2>I miei oggetti</h2><p>Oggetti e dispositivi, garanzie e manutenzioni</p></span>
            ${svg('freccia').replace('<svg', '<svg class="freccia"')}
          </a>
        </div>

        <h2 class="titoletto">Prossima manutenzione</h2>
        <a class="card" href="#/oggetti" id="prossima">
          <span class="icona">${svg('calendario')}</span>
          <span class="testo"><h2>Nessuna in programma</h2><p>Aggiungi i tuoi oggetti per ricevere i promemoria</p></span>
        </a>`,
      dopo: aggiornaProssimaManutenzione
    },

    guasto: {
      titolo: 'Ho un guasto',
      html: () => `
        ${testataSezione('Ho un guasto')}
        ${barraRicerca('Es. lavatrice Samsung WW90', 'Cerca manuali, guide e video')}

        <form class="modulo" data-cerca-modello>
          <h2>Manuali, guide e video</h2>
          <p>Scrivi marca e modello: li trovi sulla targhetta dell'oggetto.</p>
          <label><span>Che oggetto è? <em>(facoltativo)</em></span>
            <input name="tipo" autocomplete="off" placeholder="Es. lavatrice" enterkeyhint="next">
          </label>
          <label><span>Marca</span>
            <input name="marca" autocomplete="off" placeholder="Es. Samsung" required enterkeyhint="next">
          </label>
          <label><span>Modello</span>
            <input name="modello" autocomplete="off" autocapitalize="characters" placeholder="Es. WW90T534DAW" required enterkeyhint="search">
          </label>
          <button type="submit" class="btn btn-accento btn-pieno">${svg('cerca')} Cerca</button>
        </form>

        <div id="recenti"></div>

        <h2 class="titoletto">In arrivo</h2>
        <div class="elenco-card">
          ${cardAzione('fotocamera', 'Fotografa la targhetta', 'Leggo marca, modello e numero di serie', 'data-presto="3"')}
          ${cardAzione('fumetto', 'Descrivi il problema', 'A parole o con la voce', 'data-presto="4"')}
          ${cardAzione('codice', 'Codice errore', 'Cosa significa il codice sul display', 'data-presto="4"')}
          ${cardAzione('ricambio', 'Ricambi', 'Codice del pezzo e dove cercarlo', 'data-presto="4"')}
        </div>
        <p class="nota">La lettura della targhetta arriva nella fase 3; la diagnosi completa nella fase 4.</p>`,
      dopo: mostraRecenti
    },

    risultati: {
      titolo: 'Risultati',
      html: () => `
        ${testataSezione('Risultati', '#/guasto')}
        <div id="risultati">
          <div class="caricamento" role="status">
            <span class="rotella" aria-hidden="true"></span>
            <p>Cerco manuali, guide e video…</p>
            <p class="nota">Può servire qualche secondo.</p>
          </div>
        </div>`,
      dopo: caricaRisultati
    },

    'come-si-fa': {
      titolo: 'Come si fa',
      html: () => `
        ${testataSezione('Come si fa')}
        ${barraRicerca('Es. cambiare una presa', 'Cerca una guida')}
        <h2 class="titoletto" style="margin-top:4px">Categorie</h2>
        <div class="griglia">
          ${[['fulmine', 'Elettricità'], ['goccia', 'Idraulica'], ['mobile', 'Montaggio mobili'], ['auto', 'Auto'], ['tecnologia', 'Tecnologia']]
            .map(([i, t]) => `<button type="button" class="card" data-presto="5" style="font:inherit;text-align:left"><span class="icona">${svg(i)}</span><span class="tit">${t}</span></button>`).join('')}
        </div>
        <p class="nota">Le guide passo passo, la modalità mani libere e la lista della spesa arrivano nella fase 5.</p>`
    },

    oggetti: {
      titolo: 'I miei oggetti',
      html: () => `
        ${testataSezione('I miei oggetti')}
        ${barraRicerca('Cerca tra i tuoi oggetti', 'Cerca tra i tuoi oggetti')}
        <div class="vuoto">
          <span class="icona">${svg('scatola')}</span>
          <h2>Nessun oggetto ancora</h2>
          <p>Qui terrai scontrini, garanzie, interventi e manutenzioni.</p>
          <button type="button" class="btn btn-accento" data-presto="6">${svg('piu')} Aggiungi oggetto</button>
        </div>`
    },

    preferiti: {
      titolo: 'Preferiti',
      html: () => `
        <header class="testata-sezione"><h1>Preferiti</h1></header>
        <div id="elenco-preferiti"></div>`,
      dopo: mostraPreferiti
    },

    backup: {
      titolo: 'Backup',
      html: () => `
        <header class="testata-sezione"><h1>Backup</h1></header>
        <div class="riga-pulsanti">
          <button type="button" class="btn btn-accento btn-pieno" data-presto="6">${svg('esporta')} Esporta backup</button>
          <button type="button" class="btn btn-pieno" data-presto="6">${svg('importa')} Importa backup</button>
        </div>
        <p class="nota">Un unico file con tutti i tuoi dati e le foto, da salvare su iCloud, Google Drive o NAS.</p>

        <h2 class="titoletto">Altro</h2>
        <a class="card" href="#/impostazioni">
          <span class="icona">${svg('ingranaggio')}</span>
          <span class="testo"><span class="tit">Impostazioni</span><span class="sotto">Profilo, versione e installazione</span></span>
          ${svg('freccia').replace('<svg', '<svg class="freccia"')}
        </a>`
    },

    impostazioni: {
      titolo: 'Impostazioni',
      html: () => `
        ${testataSezione('Impostazioni')}
        <h2 class="titoletto" style="margin-top:4px">Come vuoi usarla?</h2>
        ${sceltaProfili()}

        <h2 class="titoletto">Informazioni</h2>
        <dl class="info">
          <div><dt>Versione</dt><dd id="info-versione"></dd></div>
          <div><dt>Installata sulla Home</dt><dd id="info-installata"></dd></div>
          <div><dt>Funziona senza internet</dt><dd id="info-offline"></dd></div>
          <div><dt>Server</dt><dd id="info-server"><span class="pallino"></span>controllo…</dd></div>
          <div><dt>Schermo</dt><dd id="info-schermo"></dd></div>
        </dl>

        <h2 class="titoletto">Installa l'app</h2>
        <div class="info" style="padding:14px 18px">
          <p style="margin:0 0 8px"><strong>iPhone</strong> (Safari): tocca <em>Condividi</em> e poi <em>Aggiungi alla schermata Home</em>.</p>
          <p style="margin:0"><strong>Android</strong> (Chrome): tocca il menu <em>⋮</em> e poi <em>Installa app</em>.</p>
        </div>`,
      dopo: aggiornaInfo
    }
  };

  // ---------- Navigazione ----------
  const vista = document.getElementById('vista');
  let primaVolta = true;

  function percorso() {
    if (!GLS.profilo) return 'profilo';
    const p = location.hash.replace(/^#\/?/, '').split('?')[0];
    return pagine[p] ? p : 'home';
  }

  function mostra() {
    const nome = percorso();
    const pagina = pagine[nome];
    vista.innerHTML = pagina.html();
    document.title = nome === 'home' ? 'GLS Help' : `${pagina.titolo} – GLS Help`;

    const voce = nome === 'preferiti' || nome === 'backup' ? nome : nome === 'impostazioni' ? '' : 'home';
    document.querySelector('.menu').hidden = !GLS.profilo;
    document.querySelectorAll('.menu a').forEach((a) => {
      if (a.dataset.voce === voce) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (!primaVolta) {
      document.getElementById('contenitore').scrollTop = 0;
      vista.focus({ preventScroll: true });
    }
    primaVolta = false;
    if (pagina.dopo) pagina.dopo();
  }

  function vai(indirizzo) {
    if (location.hash === indirizzo) { mostra(); return; }
    history.pushState(null, '', indirizzo);
    mostra();
  }
  window.addEventListener('hashchange', mostra);
  window.addEventListener('popstate', mostra);

  // Tutti i link interni (#/...) aprono la pagina subito, senza ricaricare
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#/"]');
    if (!link || e.defaultPrevented) return;
    e.preventDefault();
    vai(link.getAttribute('href'));
  });

  // Altezza reale dello schermo (iPhone installato sulla Home)
  function misuraSchermo() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--altezza', Math.round(h) + 'px');
  }
  misuraSchermo();
  window.addEventListener('resize', misuraSchermo);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', misuraSchermo);

  // ---------- Avvisi brevi ----------
  const avviso = document.getElementById('avviso');
  let timerAvviso;
  function mostraAvviso(testo) {
    avviso.textContent = testo;
    avviso.hidden = false;
    clearTimeout(timerAvviso);
    timerAvviso = setTimeout(() => { avviso.hidden = true; }, 3200);
  }

  // Funzioni non ancora pronte, ricerca e microfono
  vista.addEventListener('click', async (e) => {
    const scelta = e.target.closest('[data-profilo]');
    if (scelta) {
      const id = scelta.dataset.profilo;
      try { await DB.salva('impostazioni', { id: 'profilo', valore: id }); } catch (err) { console.warn(err); }
      const primoAvvio = !GLS.profilo;
      applicaProfilo(id);
      mostraAvviso(`Profilo ${PROFILI[id].nome} attivato.`);
      // Al primo avvio va alla Home; dalle Impostazioni resta lì
      if (primoAvvio) vai('#/');
      else mostra();
      return;
    }
    const presto = e.target.closest('[data-presto]');
    if (presto) {
      mostraAvviso(`In arrivo nella fase ${presto.dataset.presto}.`);
      return;
    }
    if (e.target.closest('[data-microfono]')) {
      mostraAvviso('La ricerca a voce arriva nella fase 3.');
    }
  });
  vista.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-ricerca]')) return;
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    e.target.q.blur();
    vai('#/risultati?' + new URLSearchParams({ testo: q }));
  });
  vista.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-cerca-modello]')) return;
    e.preventDefault();
    const f = e.target;
    const dati = { marca: f.marca.value.trim(), modello: f.modello.value.trim(), tipo: f.tipo.value.trim() };
    if (!dati.marca || !dati.modello) return;
    document.activeElement && document.activeElement.blur();
    vai('#/risultati?' + new URLSearchParams(Object.entries(dati).filter(([, v]) => v)));
  });

  // ---------- Ricerca di manuali, guide e video (fase 2) ----------
  const parametri = () => new URLSearchParams((location.hash.split('?')[1]) || '');
  const LINGUE = { it: 'Italiano', en: 'Inglese', de: 'Tedesco', fr: 'Francese', es: 'Spagnolo' };
  const GENERI = { utente: "Manuale d'uso", installazione: 'Installazione', servizio: 'Manuale di servizio', ricambi: 'Ricambi', supporto: 'Supporto', 'scheda tecnica': 'Scheda tecnica' };

  function chiaveRicerca(d) {
    return ['marca', 'modello', 'tipo', 'testo'].map((k) => (d[k] || '').toLowerCase().trim()).join('|');
  }

  async function caricaRisultati() {
    const p = parametri();
    const domanda = { testo: p.get('testo') || '', marca: p.get('marca') || '', modello: p.get('modello') || '', tipo: p.get('tipo') || '' };
    const box = document.getElementById('risultati');
    const id = chiaveRicerca(domanda);
    // L'archivio si legge in parallelo: la ricerca parte subito
    const salvataP = DB.leggi('ricerche', id).catch(() => null);

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 45000);
      const r = await fetch(GLS.worker + '/search', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...domanda, profilo: GLS.profilo })
      });
      clearTimeout(t);
      const dati = await r.json();
      if (!r.ok || !dati.ok) throw new Error(dati.errore || 'Errore ' + r.status);
      const voce = { id, domanda, risultato: dati, data: new Date().toISOString() };
      DB.salva('ricerche', voce).catch(() => {});
      if (document.getElementById('risultati') === box) disegnaRisultati(box, dati);
    } catch (err) {
      if (document.getElementById('risultati') !== box) return;
      const salvata = await salvataP;
      if (salvata) {
        disegnaRisultati(box, salvata.risultato);
        mostraAvviso('Senza connessione: ti mostro i risultati salvati.');
      } else {
        const msg = err.name === 'AbortError' ? 'La ricerca ci sta mettendo troppo.'
          : !navigator.onLine ? 'Sei offline.'
            : err instanceof TypeError ? 'Non riesco a collegarmi al server. Controlla la connessione e riprova.'
              : err.message;
        box.innerHTML = `
          <div class="vuoto">
            <span class="icona">${svg('cerca')}</span>
            <h2>Ricerca non riuscita</h2>
            <p>${esc(msg)}</p>
            <button type="button" class="btn btn-accento" data-riprova>Riprova</button>
          </div>`;
      }
    }
  }

  async function disegnaRisultati(box, d) {
    let preferiti = new Set();
    try { preferiti = new Set((await DB.tutti('preferiti')).map((x) => x.id)); } catch { /* niente */ }
    const max = GLS.profilo === 'semplice' ? 3 : 6;
    const prodotto = d.prodotto || {};
    const nome = prodotto.nome || [prodotto.marca, prodotto.modello].filter(Boolean).join(' ');
    const contesto = esc(JSON.stringify({ nome }));

    const stella = (tipo, el) => {
      const pref = preferiti.has(el.url);
      const dati = esc(JSON.stringify({ tipo, titolo: el.titolo, url: el.url, immagine: el.immagine || null, info: el.info || '' }));
      return `<button type="button" class="stella${pref ? ' attiva' : ''}" data-preferito="${dati}" data-contesto="${contesto}" aria-pressed="${pref}" aria-label="${pref ? 'Togli dai preferiti' : 'Salva nei preferiti'}">${svg(pref ? 'stellaPiena' : 'stella')}</button>`;
    };

    const manuali = (d.manuali || []).slice(0, max).map((m) => {
      const info = [GENERI[m.genere] || '', LINGUE[m.lingua] || '', m.pdf ? 'PDF' : '', m.fonte].filter(Boolean).join(' · ');
      return `
        <li class="risultato">
          <a href="${esc(m.url)}" target="_blank" rel="noopener">
            <span class="icona piccola">${svg('documento')}</span>
            <span class="testo"><span class="tit">${esc(m.titolo)}</span><span class="sotto">${esc(info)}</span></span>
          </a>
          ${stella('manuale', { ...m, info })}
        </li>`;
    }).join('');

    const video = (d.video || []).slice(0, max).map((v) => {
      const info = [v.canale, v.durata].filter(Boolean).join(' · ');
      return `
        <li class="risultato video">
          <a href="${esc(v.url)}" target="_blank" rel="noopener">
            <span class="anteprima">${v.immagine ? `<img src="${esc(v.immagine)}" alt="Anteprima del video: ${esc(v.titolo)}" loading="lazy" width="320" height="180">` : svg('play')}${v.durata ? `<span class="durata">${esc(v.durata)}</span>` : ''}</span>
            <span class="testo"><span class="tit">${esc(v.titolo)}</span><span class="sotto">${esc(v.canale || '')}</span></span>
          </a>
          ${stella('video', { ...v, info })}
        </li>`;
    }).join('');

    const guide = (d.guide || []).slice(0, max).map((g) => {
      const info = [g.difficolta, g.minuti ? `${g.minuti} min` : '', 'iFixit'].filter(Boolean).join(' · ');
      return `
        <li class="risultato">
          <a href="${esc(g.url)}" target="_blank" rel="noopener">
            ${g.immagine ? `<img class="miniatura" src="${esc(g.immagine)}" alt="Foto della guida: ${esc(g.titolo)}" loading="lazy" width="200" height="150">` : `<span class="icona piccola">${svg('chiave')}</span>`}
            <span class="testo"><span class="tit">${esc(g.titolo)}</span><span class="sotto">${esc(info)}</span></span>
          </a>
          ${stella('guida', { ...g, info })}
        </li>`;
    }).join('');

    const errori = d.errori || {};
    const sezione = (titolo, contenuto, vuoto, errore) => `
      <h2 class="titoletto">${titolo}</h2>
      ${contenuto ? `<ul class="risultati">${contenuto}</ul>` : `<p class="nota" style="margin-top:0">${esc(errore ? 'Non disponibile ora: ' + errore : vuoto)}</p>`}`;
    const altrove = d.altrove || {};

    box.innerHTML = `
      ${nome ? `<div class="prodotto"><span class="icona">${svg('scatola')}</span><div><h2>${esc(nome)}</h2>${prodotto.tipo ? `<p>${esc(prodotto.tipo)}</p>` : ''}</div></div>` : ''}
      ${sezione('Manuali', manuali, 'Nessun manuale verificato trovato. Prova con "Cerca su Google" qui sotto.', errori.manuali)}
      ${sezione('Video', video, 'Nessun video trovato.', errori.video)}
      ${sezione('Guide di riparazione', guide, 'Nessuna guida iFixit per questo modello.', errori.guide)}
      ${guide ? '<p class="nota">Le guide iFixit sono quasi sempre in inglese.</p>' : ''}
      <h2 class="titoletto">Cerca anche su</h2>
      <div class="riga-link">
        ${altrove.google ? `<a class="btn" href="${esc(altrove.google)}" target="_blank" rel="noopener">${svg('esterno')} Google</a>` : ''}
        ${altrove.youtube ? `<a class="btn" href="${esc(altrove.youtube)}" target="_blank" rel="noopener">${svg('esterno')} YouTube</a>` : ''}
        ${altrove.ifixit ? `<a class="btn" href="${esc(altrove.ifixit)}" target="_blank" rel="noopener">${svg('esterno')} iFixit</a>` : ''}
      </div>
      <p class="nota">I manuali si aprono dal sito originale: puoi salvarli per uso personale, senza ripubblicarli.</p>`;
  }

  async function mostraRecenti() {
    const box = document.getElementById('recenti');
    if (!box) return;
    let elenco = [];
    try { elenco = await DB.tutti('ricerche'); } catch { return; }
    elenco.sort((a, b) => b.data.localeCompare(a.data));
    if (!elenco.length) return;
    box.innerHTML = `
      <h2 class="titoletto">Ricerche recenti</h2>
      <div class="elenco-card">
        ${elenco.slice(0, 5).map((r) => {
          const d = r.domanda;
          const nome = (r.risultato && r.risultato.prodotto && r.risultato.prodotto.nome) || d.testo || [d.marca, d.modello].join(' ');
          const q = new URLSearchParams(Object.entries(d).filter(([, v]) => v));
          return `<a class="card compatta" href="#/risultati?${q}"><span class="icona piccola">${svg('orologio')}</span><span class="testo"><span class="tit">${esc(nome)}</span></span>${svg('freccia').replace('<svg', '<svg class="freccia"')}</a>`;
        }).join('')}
      </div>`;
    // Tiene solo le 20 ricerche più recenti
    for (const vecchia of elenco.slice(20)) DB.elimina('ricerche', vecchia.id).catch(() => {});
  }

  // ---------- Preferiti ----------
  const TIPI_PREFERITI = { manuale: 'Manuali', video: 'Video', guida: 'Guide di riparazione' };

  async function mostraPreferiti() {
    const box = document.getElementById('elenco-preferiti');
    if (!box) return;
    let elenco = [];
    try { elenco = await DB.tutti('preferiti'); } catch { /* niente */ }
    if (!elenco.length) {
      box.innerHTML = `
        <div class="vuoto">
          <span class="icona">${svg('stella')}</span>
          <h2>Nessun preferito</h2>
          <p>Tocca la stella accanto a un manuale, un video o una guida per ritrovarlo qui.</p>
        </div>`;
      return;
    }
    elenco.sort((a, b) => b.data.localeCompare(a.data));
    box.innerHTML = Object.entries(TIPI_PREFERITI).map(([tipo, titolo]) => {
      const gruppo = elenco.filter((x) => x.tipo === tipo);
      if (!gruppo.length) return '';
      return `
        <h2 class="titoletto">${titolo}</h2>
        <ul class="risultati">
          ${gruppo.map((x) => `
            <li class="risultato">
              <a href="${esc(x.url)}" target="_blank" rel="noopener">
                ${x.immagine ? `<img class="miniatura" src="${esc(x.immagine)}" alt="Anteprima: ${esc(x.titolo)}" loading="lazy" width="200" height="150">` : `<span class="icona piccola">${svg(tipo === 'video' ? 'play' : tipo === 'guida' ? 'chiave' : 'documento')}</span>`}
                <span class="testo"><span class="tit">${esc(x.titolo)}</span><span class="sotto">${esc([x.prodotto, x.info].filter(Boolean).join(' · '))}</span></span>
              </a>
              <button type="button" class="stella attiva" data-togli="${esc(x.id)}" aria-label="Togli dai preferiti">${svg('stellaPiena')}</button>
            </li>`).join('')}
        </ul>`;
    }).join('');
  }

  vista.addEventListener('click', async (e) => {
    const riprova = e.target.closest('[data-riprova]');
    if (riprova) { mostra(); return; }

    const togli = e.target.closest('[data-togli]');
    if (togli) {
      await DB.elimina('preferiti', togli.dataset.togli).catch(() => {});
      mostraAvviso('Tolto dai preferiti.');
      mostraPreferiti();
      return;
    }

    const b = e.target.closest('[data-preferito]');
    if (!b) return;
    const el = JSON.parse(b.dataset.preferito);
    const ctx = JSON.parse(b.dataset.contesto || '{}');
    const attivo = b.classList.contains('attiva');
    try {
      if (attivo) await DB.elimina('preferiti', el.url);
      else await DB.salva('preferiti', { id: el.url, ...el, prodotto: ctx.nome || '', data: new Date().toISOString() });
    } catch { mostraAvviso('Non riesco a salvare sul telefono.'); return; }
    b.classList.toggle('attiva', !attivo);
    b.setAttribute('aria-pressed', String(!attivo));
    b.setAttribute('aria-label', attivo ? 'Salva nei preferiti' : 'Togli dai preferiti');
    b.innerHTML = svg(attivo ? 'stella' : 'stellaPiena');
    mostraAvviso(attivo ? 'Tolto dai preferiti.' : 'Salvato nei preferiti.');
  });

  // ---------- Dati delle pagine ----------
  async function aggiornaProssimaManutenzione() {
    try {
      const elenco = await DB.tutti('manutenzioni');
      const prossime = elenco.filter((m) => m.scadenza).sort((a, b) => a.scadenza.localeCompare(b.scadenza));
      const card = document.getElementById('prossima');
      if (!card || !prossime.length) return;
      const m = prossime[0];
      const data = new Date(m.scadenza + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
      card.querySelector('h2').textContent = m.titolo || 'Manutenzione';
      card.querySelector('p').textContent = `Entro il ${data}`;
    } catch (err) {
      console.warn('Archivio non disponibile', err);
    }
  }

  async function aggiornaInfo() {
    const v = GLS.versione.startsWith('__') ? 'sviluppo' : GLS.versione;
    const imposta = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    imposta('info-versione', esc(v));
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    imposta('info-installata', standalone ? 'Sì' : 'No');
    const vv = window.visualViewport;
    imposta('info-schermo', `${Math.round(vv ? vv.height : innerHeight)} / ${innerHeight} / ${screen.height}`);
    imposta('info-offline', navigator.serviceWorker && navigator.serviceWorker.controller ? 'Sì' : 'Non ancora');

    const pallino = (ok, testo) => `<span class="pallino ${ok ? 'ok' : 'ko'}"></span>${testo}`;
    if (!GLS.worker) {
      imposta('info-server', pallino(false, 'non configurato'));
      return;
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(GLS.worker + '/salute', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      imposta('info-server', r.ok ? pallino(true, 'collegato') : pallino(false, 'errore ' + r.status));
    } catch {
      imposta('info-server', pallino(false, navigator.onLine ? 'non raggiungibile' : 'sei offline'));
    }
  }

  // ---------- Aggiornamenti (service worker) ----------
  const barraAggiorna = document.getElementById('aggiorna');
  let inAttesa = null;

  function proponiAggiornamento(sw) {
    inAttesa = sw;
    barraAggiorna.hidden = false;
  }

  document.getElementById('aggiorna-btn').addEventListener('click', () => {
    if (inAttesa) inAttesa.postMessage({ tipo: 'ATTIVA' });
    barraAggiorna.hidden = true;
  });

  if ('serviceWorker' in navigator) {
    // Alla prima installazione non serve ricaricare la pagina
    const avevaVersione = !!navigator.serviceWorker.controller;
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('sw.js');
        if (reg.waiting && navigator.serviceWorker.controller) proponiAggiornamento(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const nuovo = reg.installing;
          if (!nuovo) return;
          nuovo.addEventListener('statechange', () => {
            if (nuovo.state === 'installed' && navigator.serviceWorker.controller) proponiAggiornamento(nuovo);
          });
        });
        // Controlla se c'è una nuova versione ogni volta che l'app torna in primo piano
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      } catch (err) {
        console.warn('Service worker non registrato', err);
      }
    });

    let ricaricata = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (ricaricata || !avevaVersione) return;
      ricaricata = true;
      location.reload();
    });
  }

  // Avvio: legge il profilo salvato sul telefono
  DB.leggi('impostazioni', 'profilo')
    .then((r) => applicaProfilo(r && r.valore))
    .catch(() => applicaProfilo(null))
    .finally(mostra);
})();
