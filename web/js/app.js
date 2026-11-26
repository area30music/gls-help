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
    attenzione: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.3v.01"/>',
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
    lampadina: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
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
          <button type="button" class="card${GLS.profilo === id ? ' scelto' : ''}" data-scegli-profilo="${id}" aria-pressed="${GLS.profilo === id}">
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
      html: () => {
        const o = oggettoCorrente;
        return `
        ${testataSezione('Ho un guasto')}

        <form class="modulo" data-guasto>
          <h2><span class="numero">1</span> Che oggetto è?</h2>
          <button type="button" class="btn btn-pieno" data-foto-targhetta>${svg('fotocamera')} Fotografa la targhetta</button>
          <input type="file" accept="image/*" capture="environment" id="foto-targhetta" hidden>
          <div id="esito-targhetta"></div>
          <label><span>Tipo di oggetto</span>
            <input name="tipo" autocomplete="off" placeholder="Es. lavatrice, stampante, TV" value="${esc(o.tipo || '')}" enterkeyhint="next">
          </label>
          <label><span>Marca</span>
            <input name="marca" autocomplete="off" placeholder="Es. Samsung" value="${esc(o.marca || '')}" enterkeyhint="next">
          </label>
          <label><span>Modello</span>
            <input name="modello" autocomplete="off" autocapitalize="characters" placeholder="Es. WW90T534DAW" value="${esc(o.modello || '')}" enterkeyhint="next">
          </label>

          <h2 style="margin-top:8px"><span class="numero">2</span> Qual è il problema?</h2>
          <div class="campo-voce">
            <textarea name="problema" rows="3" placeholder="Es. non scarica l'acqua e fa un rumore strano">${esc(o.problema || '')}</textarea>
            <button type="button" class="microfono" data-microfono="problema" aria-label="Descrivi il problema con la voce">${svg('microfono')}</button>
          </div>
          <label><span>Codice di errore <em>(se c'è sul display)</em></span>
            <input name="codice" autocomplete="off" autocapitalize="characters" placeholder="Es. E21, 5C, F05" value="${esc(o.codice || '')}">
          </label>

          <button type="submit" class="btn btn-accento btn-pieno" data-azione="soluzione">${svg('lampadina')} Trova la soluzione</button>
          <button type="submit" class="btn btn-pieno" data-azione="manuali">${svg('documento')} Solo manuali e video</button>
        </form>

        <div id="recenti"></div>`;
      },
      dopo: mostraRecenti
    },

    soluzione: {
      titolo: 'Soluzione',
      html: () => `
        ${testataSezione('Soluzione', '#/guasto')}
        <div id="soluzione">
          <div class="caricamento" role="status">
            <span class="rotella" aria-hidden="true"></span>
            <p>Sto analizzando il problema…</p>
            <p class="nota">Di solito servono 10-20 secondi.</p>
          </div>
        </div>`,
      dopo: caricaSoluzione
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
  // La tastiera deve coprire la pagina, non rimpicciolirla: si usa l'altezza piena dello schermo
  // e non la si cambia mentre si scrive in un campo.
  let altezzaMax = 0;
  let orientamento = screen.orientation ? screen.orientation.type : String(window.orientation);
  const staScrivendo = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };
  function misuraSchermo() {
    const ora = screen.orientation ? screen.orientation.type : String(window.orientation);
    if (ora !== orientamento) { orientamento = ora; altezzaMax = 0; }
    if (staScrivendo() && altezzaMax) return;
    altezzaMax = Math.max(altezzaMax, window.innerHeight);
    document.documentElement.style.setProperty('--altezza', altezzaMax + 'px');
  }
  misuraSchermo();
  window.addEventListener('resize', misuraSchermo);
  window.addEventListener('orientationchange', () => setTimeout(misuraSchermo, 300));
  document.addEventListener('focusout', () => setTimeout(misuraSchermo, 400));

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
    const scelta = e.target.closest('[data-scegli-profilo]');
    if (scelta) {
      const id = scelta.dataset.scegliProfilo;
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
    const mic = e.target.closest('[data-microfono]');
    if (mic) { ascolta(mic); return; }
    if (e.target.closest('[data-foto-targhetta]')) { document.getElementById('foto-targhetta').click(); }
  });
  vista.addEventListener('change', (e) => {
    if (e.target.id === 'foto-targhetta' && e.target.files && e.target.files[0]) leggiTarghetta(e.target.files[0]);
  });
  vista.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-ricerca]')) return;
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    e.target.q.blur();
    // Una frase libera ("la lavatrice non scarica") va alla soluzione
    vai('#/soluzione?' + new URLSearchParams({ problema: q }));
  });
  // Oggetto e problema in lavorazione (restano compilati tornando indietro)
  let oggettoCorrente = {};
  try { oggettoCorrente = JSON.parse(sessionStorage.getItem('gls-oggetto') || '{}'); } catch { /* niente */ }
  function ricordaOggetto(dati) {
    oggettoCorrente = { ...oggettoCorrente, ...dati };
    try { sessionStorage.setItem('gls-oggetto', JSON.stringify(oggettoCorrente)); } catch { /* niente */ }
  }
  vista.addEventListener('input', (e) => {
    const f = e.target.form;
    if (f && f.matches('[data-guasto]') && e.target.name) ricordaOggetto({ [e.target.name]: e.target.value });
  });

  vista.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-guasto]')) return;
    e.preventDefault();
    const f = e.target;
    const azione = (e.submitter && e.submitter.dataset.azione) || 'soluzione';
    const dati = {
      tipo: f.tipo.value.trim(), marca: f.marca.value.trim(), modello: f.modello.value.trim(),
      problema: f.problema.value.trim(), codice: f.codice.value.trim()
    };
    ricordaOggetto(dati);
    if (document.activeElement) document.activeElement.blur();
    if (azione === 'manuali') {
      if (!dati.marca && !dati.modello && !dati.tipo) { mostraAvviso('Scrivi almeno marca e modello, o fotografa la targhetta.'); return; }
      vai('#/risultati?' + new URLSearchParams(Object.entries({ marca: dati.marca, modello: dati.modello, tipo: dati.tipo }).filter(([, v]) => v)));
    } else {
      if (!dati.problema && !dati.codice) { mostraAvviso('Descrivi il problema (anche con il microfono) o scrivi il codice di errore.'); f.problema.focus(); return; }
      vai('#/soluzione?' + new URLSearchParams(Object.entries(dati).filter(([, v]) => v)));
    }
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
      <h2 class="titoletto">Ultime ricerche</h2>
      <div class="elenco-card">
        ${elenco.slice(0, 5).map((r) => {
          const d = r.domanda;
          const q = new URLSearchParams(Object.entries(d).filter(([, v]) => v));
          if (r.tipo === 'soluzione') {
            const nome = (r.risultato && r.risultato.oggetto) || [d.marca, d.modello].join(' ') || 'Problema';
            return `<a class="card compatta" href="#/soluzione?${q}"><span class="icona piccola">${svg('lampadina')}</span><span class="testo"><span class="tit">${esc(nome)}</span><span class="sotto">${esc(d.problema || d.codice || '')}</span></span>${svg('freccia').replace('<svg', '<svg class="freccia"')}</a>`;
          }
          const nome = (r.risultato && r.risultato.prodotto && r.risultato.prodotto.nome) || d.testo || [d.marca, d.modello].join(' ');
          return `<a class="card compatta" href="#/risultati?${q}"><span class="icona piccola">${svg('documento')}</span><span class="testo"><span class="tit">${esc(nome)}</span><span class="sotto">Manuali e video</span></span>${svg('freccia').replace('<svg', '<svg class="freccia"')}</a>`;
        }).join('')}
      </div>`;
    // Tiene solo le 20 ricerche più recenti
    for (const vecchia of elenco.slice(20)) DB.elimina('ricerche', vecchia.id).catch(() => {});
  }

  // ---------- Chiamate al server ----------
  async function chiedi(percorso, corpo, ms = 60000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(GLS.worker + '/' + percorso, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...corpo, profilo: GLS.profilo })
      });
      let dati = {};
      try { dati = await r.json(); } catch { /* niente */ }
      if (!r.ok || dati.ok === false) throw new Error(dati.errore || 'Errore del server (' + r.status + ')');
      return dati;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Il server ci sta mettendo troppo: riprova.');
      if (!navigator.onLine) throw new Error('Sei offline.');
      if (err instanceof TypeError) throw new Error('Non riesco a collegarmi al server. Controlla la connessione e riprova.');
      throw err;
    } finally { clearTimeout(t); }
  }

  const inBase64 = (blob) => new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] || '');
    r.onerror = () => ko(r.error);
    r.readAsDataURL(blob);
  });

  // ---------- Microfono: registra, trascrive e compila ----------
  const pannelloVoce = document.createElement('div');
  pannelloVoce.className = 'voce';
  pannelloVoce.hidden = true;
  pannelloVoce.setAttribute('role', 'dialog');
  pannelloVoce.setAttribute('aria-label', 'Registrazione vocale');
  pannelloVoce.innerHTML = `
    <div class="voce-box">
      <span class="onde" aria-hidden="true"><span></span><span></span><span></span></span>
      <p class="voce-titolo">Ti ascolto…</p>
      <p class="voce-sotto">Parla pure, poi tocca <strong>Fatto</strong>.</p>
      <button type="button" class="btn btn-accento btn-pieno" data-voce="fatto">Fatto</button>
      <button type="button" class="btn btn-pieno" data-voce="annulla">Annulla</button>
    </div>`;
  document.body.appendChild(pannelloVoce);
  let registrazione = null;

  async function ascolta(pulsante) {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      mostraAvviso('Questo telefono non permette di registrare la voce dall’app.');
      return;
    }
    let flusso;
    try {
      flusso = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      mostraAvviso('Serve il permesso per il microfono: controlla nelle impostazioni del telefono.');
      return;
    }
    const tipi = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    const mime = tipi.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    const rec = new MediaRecorder(flusso, mime ? { mimeType: mime } : undefined);
    const pezzi = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) pezzi.push(e.data); };
    const fine = new Promise((ok) => { rec.onstop = ok; });
    rec.start();
    registrazione = { rec, flusso, annullata: false };
    pannelloVoce.hidden = false;
    pannelloVoce.querySelector('.voce-titolo').textContent = 'Ti ascolto…';
    pannelloVoce.querySelector('.voce-sotto').innerHTML = 'Parla pure, poi tocca <strong>Fatto</strong>.';
    pannelloVoce.querySelector('[data-voce="fatto"]').disabled = false;
    const limite = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 45000);

    await fine;
    clearTimeout(limite);
    flusso.getTracks().forEach((t) => t.stop());
    const annullata = registrazione && registrazione.annullata;
    registrazione = null;
    if (annullata || !pezzi.length) { pannelloVoce.hidden = true; return; }

    pannelloVoce.querySelector('.voce-titolo').textContent = 'Sto capendo…';
    pannelloVoce.querySelector('.voce-sotto').textContent = 'Un attimo.';
    pannelloVoce.querySelector('[data-voce="fatto"]').disabled = true;
    try {
      const audio = new Blob(pezzi, { type: rec.mimeType || mime || 'audio/mp4' });
      const dati = await chiedi('transcribe', { audio: await inBase64(audio), mime: audio.type }, 45000);
      pannelloVoce.hidden = true;
      if (!dati.capito || !dati.testo) { mostraAvviso('Non ho capito bene: riprova parlando vicino al telefono.'); return; }
      const destinazione = pulsante.dataset.microfono;
      if (destinazione === 'problema') {
        const campo = document.querySelector('[data-guasto] [name="problema"]');
        if (campo) {
          campo.value = (campo.value ? campo.value.trim() + ' ' : '') + dati.testo;
          ricordaOggetto({ problema: campo.value });
        }
      } else {
        const form = pulsante.closest('form');
        if (form && form.q) {
          form.q.value = dati.testo;
          form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    } catch (err) {
      pannelloVoce.hidden = true;
      mostraAvviso(err.message);
    }
  }
  pannelloVoce.addEventListener('click', (e) => {
    const b = e.target.closest('[data-voce]');
    if (!b || !registrazione) { if (b && b.dataset.voce === 'annulla') pannelloVoce.hidden = true; return; }
    if (b.dataset.voce === 'annulla') registrazione.annullata = true;
    if (registrazione.rec.state === 'recording') registrazione.rec.stop();
  });

  // ---------- Foto della targhetta ----------
  let fotoTarghetta = null; // ultima foto (per "Chiedi aiuto")

  async function riduciFoto(file, lato = 1600) {
    const img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error('Non riesco ad aprire la foto'));
      i.src = URL.createObjectURL(file);
    });
    const scala = Math.min(1, lato / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scala);
    c.height = Math.round(img.naturalHeight * scala);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
  }

  async function leggiTarghetta(file) {
    const box = document.getElementById('esito-targhetta');
    if (!box) return;
    box.innerHTML = `<div class="esito"><span class="rotella piccola" aria-hidden="true"></span> Leggo la targhetta…</div>`;
    try {
      const foto = await riduciFoto(file);
      fotoTarghetta = foto;
      const d = await chiedi('identify', { immagine: await inBase64(foto), mime: 'image/jpeg' }, 60000);
      const form = document.querySelector('[data-guasto]');
      if (!d.leggibile || (!d.marca && !d.modello)) {
        box.innerHTML = `<div class="esito errore">${svg('attenzione')}<div><strong>Non riesco a leggerla bene.</strong><br>${esc(d.note || 'Riprova con più luce, senza riflessi e più vicino.')}</div></div>`;
        return;
      }
      if (form) {
        for (const k of ['tipo', 'marca', 'modello']) if (d[k]) form[k].value = d[k];
      }
      ricordaOggetto({ tipo: d.tipo || oggettoCorrente.tipo, marca: d.marca, modello: d.modello, seriale: d.seriale });
      const extra = [d.seriale && `S/N ${d.seriale}`, d.anno && `Anno ${d.anno}`, ...(d.altri || [])].filter(Boolean).join(' · ');
      box.innerHTML = `<div class="esito ok">${svg('fotocamera')}<div><strong>Ho letto: ${esc([d.marca, d.modello].filter(Boolean).join(' '))}</strong>${d.tipo ? ` (${esc(d.tipo)})` : ''}<br><span>${esc(extra)}</span><br><span>Controlla i dati qui sotto e correggili se serve.</span></div></div>`;
    } catch (err) {
      box.innerHTML = `<div class="esito errore">${svg('attenzione')}<div>${esc(err.message)}</div></div>`;
    }
  }

  // ---------- Soluzione (diagnosi con IA) ----------
  async function caricaSoluzione() {
    const p = parametri();
    const domanda = {};
    for (const k of ['tipo', 'marca', 'modello', 'problema', 'codice']) if (p.get(k)) domanda[k] = p.get(k);
    const box = document.getElementById('soluzione');
    const id = 'soluzione|' + [domanda.tipo, domanda.marca, domanda.modello, domanda.problema, domanda.codice, GLS.profilo].map((x) => (x || '').toLowerCase().trim()).join('|');
    const salvataP = DB.leggi('ricerche', id).catch(() => null);
    try {
      const d = await chiedi('diagnose', { prodotto: { tipo: domanda.tipo, marca: domanda.marca, modello: domanda.modello }, problema: domanda.problema, codice: domanda.codice }, 70000);
      DB.salva('ricerche', { id, tipo: 'soluzione', domanda, risultato: d, data: new Date().toISOString() }).catch(() => {});
      if (document.getElementById('soluzione') === box) disegnaSoluzione(box, d, domanda);
    } catch (err) {
      if (document.getElementById('soluzione') !== box) return;
      const salvata = await salvataP;
      if (salvata) { disegnaSoluzione(box, salvata.risultato, domanda); mostraAvviso('Ti mostro la risposta salvata.'); return; }
      box.innerHTML = `
        <div class="vuoto">
          <span class="icona">${svg('attenzione')}</span>
          <h2>Non ci sono riuscito</h2>
          <p>${esc(err.message)}</p>
          <button type="button" class="btn btn-accento" data-riprova>Riprova</button>
        </div>`;
    }
  }

  const PROB = { alta: 'Probabile', media: 'Possibile', bassa: 'Meno probabile' };

  function disegnaSoluzione(box, d, domanda) {
    const prodotto = d.prodottoDedotto || d.prodotto || {};
    const nome = d.oggetto || [prodotto.marca, prodotto.modello].filter(Boolean).join(' ') || 'Il tuo oggetto';
    const linkManuali = '#/risultati?' + new URLSearchParams(Object.entries({ marca: prodotto.marca, modello: prodotto.modello, tipo: prodotto.tipo }).filter(([, v]) => v));
    const video = (d.video || []).slice(0, GLS.profilo === 'semplice' ? 3 : 6).map((v) => `
      <li class="risultato video">
        <a href="${esc(v.url)}" target="_blank" rel="noopener">
          <span class="anteprima">${v.immagine ? `<img src="${esc(v.immagine)}" alt="Anteprima del video: ${esc(v.titolo)}" loading="lazy" width="320" height="180">` : svg('play')}${v.durata ? `<span class="durata">${esc(v.durata)}</span>` : ''}</span>
          <span class="testo"><span class="tit">${esc(v.titolo)}</span><span class="sotto">${esc(v.canale || '')}</span></span>
        </a>
      </li>`).join('');

    box.innerHTML = `
      <div class="prodotto"><span class="icona">${svg('lampadina')}</span><div><h2>${esc(nome)}</h2>${domanda.problema ? `<p class="problema">"${esc(domanda.problema)}"</p>` : ''}</div></div>

      ${d.riassunto ? `<p class="riassunto">${esc(d.riassunto)}</p>` : ''}

      ${d.codiceErrore ? `<div class="riquadro codice"><strong>Codice ${esc(d.codiceErrore.codice)}</strong><p>${esc(d.codiceErrore.significato)}</p></div>` : ''}

      ${(d.sicurezza || []).length ? `
        <div class="riquadro sicurezza" role="note">
          <h2>${svg('attenzione')} Sicurezza</h2>
          <ul>${d.sicurezza.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>` : ''}

      ${d.professionista ? `
        <div class="riquadro professionista">
          <h2>Chiama ${esc(d.professionista.chi || 'un professionista')}</h2>
          <p>${esc(d.professionista.perche)}</p>
        </div>` : ''}

      ${(d.cause || []).length ? `
        <h2 class="titoletto">Cause possibili</h2>
        <ul class="cause">
          ${d.cause.map((c) => `
            <li><span class="etichetta prob-${esc(c.probabilita)}">${esc(PROB[c.probabilita] || c.probabilita || '')}</span>
              <strong>${esc(c.causa)}</strong>${c.verifica ? `<p>${esc(c.verifica)}</p>` : ''}</li>`).join('')}
        </ul>` : ''}

      ${(d.passi || []).length ? `
        <h2 class="titoletto">Cosa fare, passo passo</h2>
        <ol class="passi">
          ${d.passi.map((s) => `
            <li><strong>${esc(s.titolo)}</strong>${s.dettaglio ? `<p>${esc(s.dettaglio)}</p>` : ''}${s.attenzione ? `<p class="attenzione">${svg('attenzione')} ${esc(s.attenzione)}</p>` : ''}</li>`).join('')}
        </ol>` : ''}

      <dl class="info">
        ${d.difficolta ? `<div><dt>Difficoltà</dt><dd>${esc(d.difficolta)}</dd></div>` : ''}
        ${d.tempo ? `<div><dt>Tempo</dt><dd>${esc(d.tempo)}</dd></div>` : ''}
        ${d.costo ? `<div><dt>Costo indicativo</dt><dd>${esc(d.costo)}</dd></div>` : ''}
        <div><dt>Affidabilità</dt><dd>${esc(d.affidabilita || '—')}</dd></div>
      </dl>
      ${d.notaAffidabilita ? `<p class="nota">${esc(d.notaAffidabilita)}</p>` : ''}

      ${(d.ricambi || []).length ? `
        <h2 class="titoletto">Ricambi</h2>
        <ul class="risultati">
          ${d.ricambi.map((r) => `
            <li class="ricambio">
              <div><strong>${esc(r.nome)}</strong>${r.codice ? `<span class="sotto">Codice: ${esc(r.codice)}</span>` : ''}</div>
              <div class="riga-link">
                <a class="btn" href="${esc(r.link.google)}" target="_blank" rel="noopener">Google</a>
                <a class="btn" href="${esc(r.link.amazon)}" target="_blank" rel="noopener">Amazon</a>
                <a class="btn" href="${esc(r.link.ebay)}" target="_blank" rel="noopener">eBay</a>
              </div>
            </li>`).join('')}
        </ul>
        <p class="nota">Prima di comprare, controlla che il codice del pezzo corrisponda al tuo modello.</p>` : ''}

      ${(d.domande || []).length ? `
        <h2 class="titoletto">Per capire meglio</h2>
        <ul class="domande">${d.domande.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="nota">Se sai rispondere, aggiungi i dettagli alla descrizione e riprova.</p>` : ''}

      ${(d.fonti || []).length ? `
        <h2 class="titoletto">Fonti</h2>
        <ul class="risultati">${d.fonti.map((f) => `
          <li class="risultato"><a href="${esc(f.url)}" target="_blank" rel="noopener"><span class="icona piccola">${svg('esterno')}</span><span class="testo"><span class="tit">${esc(f.titolo || f.url)}</span><span class="sotto">${esc((() => { try { return new URL(f.url).hostname.replace(/^www\./, ''); } catch { return ''; } })())}</span></span></a></li>`).join('')}
        </ul>` : ''}

      ${video ? `<h2 class="titoletto">Video utili</h2><ul class="risultati">${video}</ul>` : ''}

      <div class="riga-pulsanti" style="margin-top:22px">
        <button type="button" class="btn btn-accento btn-pieno" data-chiedi-aiuto>${svg('whatsapp')} Chiedi aiuto</button>
        ${prodotto.marca || prodotto.modello ? `<a class="btn btn-pieno" href="${esc(linkManuali)}">${svg('documento')} Manuali e video del modello</a>` : ''}
        <a class="btn btn-pieno" href="#/guasto">Modifica la descrizione</a>
      </div>
      <p class="nota">${esc(d.fonte || '')}. Le risposte dell'IA possono sbagliare: in caso di dubbio chiedi a un tecnico.</p>`;

    box.dataset.riepilogo = JSON.stringify({ nome, domanda, riassunto: d.riassunto, codice: d.codiceErrore, seriale: oggettoCorrente.seriale || '' });
  }

  async function chiediAiuto() {
    const box = document.getElementById('soluzione');
    let r = {};
    try { r = JSON.parse(box.dataset.riepilogo || '{}'); } catch { /* niente */ }
    const d = r.domanda || {};
    const righe = [
      'Ciao, mi daresti una mano? 🙏',
      `Oggetto: ${[d.tipo, d.marca, d.modello].filter(Boolean).join(' ') || r.nome || ''}`,
      r.seriale ? `Seriale: ${r.seriale}` : '',
      d.problema ? `Problema: ${d.problema}` : '',
      d.codice ? `Codice errore: ${d.codice}` : '',
      r.riassunto ? `GLS Help dice: ${r.riassunto}` : ''
    ].filter(Boolean);
    const testo = righe.join('\n');
    try {
      const file = fotoTarghetta ? new File([fotoTarghetta], 'targhetta.jpg', { type: 'image/jpeg' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: testo, files: [file] });
        return;
      }
      if (navigator.share) { await navigator.share({ text: testo }); return; }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(testo), '_blank', 'noopener');
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
    if (e.target.closest('[data-chiedi-aiuto]')) { chiediAiuto(); return; }

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
