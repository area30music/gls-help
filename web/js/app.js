// GLS Help – app principale: pagine, navigazione, avvisi e aggiornamenti
(function () {
  'use strict';

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

  function testataSezione(titolo) {
    return `
      <header class="testata-sezione">
        <a class="indietro" href="#/" aria-label="Torna alla Home">${svg('indietro')}</a>
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
  const pagine = {
    profilo: {
      titolo: 'Come vuoi usarla?',
      html: () => `
        <header class="testata">
          <img src="favicon.svg" alt="Logo GLS Help: le lettere GLS con una chiave inglese, in un riquadro arancione" width="56" height="56">
          <div>
            <h1>Come vuoi usarla?</h1>
            <p>Potrai cambiare in ogni momento da Backup.</p>
          </div>
        </header>
        <div class="elenco-card">
          ${Object.entries(PROFILI).map(([id, pr]) => `
            <button type="button" class="card${GLS.profilo === id ? ' scelto' : ''}" data-profilo="${id}" style="width:100%;text-align:left;font:inherit"${GLS.profilo === id ? ' aria-pressed="true"' : ''}>
              <span class="icona">${svg(pr.icona)}</span>
              <span class="testo"><span class="tit">${pr.nome}</span><span class="sotto">${esc(pr.testo)}</span></span>
              ${svg('freccia').replace('<svg', '<svg class="freccia"')}
            </button>`).join('')}
        </div>`
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
            <span class="testo"><h2>I miei oggetti</h2><p>Garanzie, interventi e manutenzioni</p></span>
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
        ${barraRicerca('Es. lavatrice non scarica', 'Descrivi il guasto')}
        <div class="elenco-card">
          ${cardAzione('fotocamera', 'Fotografa la targhetta', 'Leggo marca, modello e numero di serie', 'data-presto="3"')}
          ${cardAzione('fumetto', 'Descrivi il problema', 'A parole o con la voce', 'data-presto="4"')}
          ${cardAzione('codice', 'Codice errore', 'Cosa significa il codice sul display', 'data-presto="4"')}
          ${cardAzione('ricambio', 'Ricambi', 'Codice del pezzo e dove cercarlo', 'data-presto="4"')}
        </div>
        <p class="nota">Manuali, guide e video arrivano nella fase 2; la diagnosi completa nella fase 4.</p>`
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
        <div class="vuoto">
          <span class="icona">${svg('stella')}</span>
          <h2>Nessun preferito</h2>
          <p>Le guide e le soluzioni che salvi con la stella appariranno qui, anche senza internet.</p>
        </div>`
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

        <h2 class="titoletto">Impostazioni</h2>
        <a class="card" href="#/profilo">
          <span class="icona">${svg(PROFILI[GLS.profilo] ? PROFILI[GLS.profilo].icona : 'persona')}</span>
          <span class="testo"><span class="tit">Profilo: ${PROFILI[GLS.profilo] ? PROFILI[GLS.profilo].nome : '—'}</span><span class="sotto">Tocca per cambiare</span></span>
          ${svg('freccia').replace('<svg', '<svg class="freccia"')}
        </a>

        <h2 class="titoletto">Informazioni</h2>
        <dl class="info">
          <div><dt>Versione</dt><dd id="info-versione"></dd></div>
          <div><dt>Installata sulla Home</dt><dd id="info-installata"></dd></div>
          <div><dt>Funziona senza internet</dt><dd id="info-offline"></dd></div>
          <div><dt>Server</dt><dd id="info-server"><span class="pallino"></span>controllo…</dd></div>
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

    const voce = nome === 'preferiti' || nome === 'backup' ? nome : 'home';
    document.querySelector('.menu').hidden = !GLS.profilo;
    document.querySelectorAll('.menu a').forEach((a) => {
      if (a.dataset.voce === voce) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (!primaVolta) {
      window.scrollTo(0, 0);
      vista.focus({ preventScroll: true });
    }
    primaVolta = false;
    if (pagina.dopo) pagina.dopo();
  }

  window.addEventListener('hashchange', mostra);

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
      applicaProfilo(id);
      mostraAvviso(`Profilo ${PROFILI[id].nome} attivato.`);
      // Torna alla Home (se ci sei già, ridisegna la pagina)
      if (location.hash === '#/' || location.hash === '') mostra();
      else location.hash = '#/';
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
    mostraAvviso('La ricerca di manuali e video arriva nella fase 2.');
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
