// Archivio sul telefono (IndexedDB). I dati restano solo su questo dispositivo.
(function () {
  const NOME = 'gls-help';
  const VERSIONE_DB = 2;
  // Elenchi di dati dell'app
  const ARCHIVI = ['oggetti', 'interventi', 'scontrini', 'manutenzioni', 'guide', 'preferiti', 'impostazioni', 'ricerche'];

  let aperto = null;

  function apri() {
    if (aperto) return aperto;
    aperto = new Promise((ok, ko) => {
      const req = indexedDB.open(NOME, VERSIONE_DB);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const nome of ARCHIVI) {
          if (!db.objectStoreNames.contains(nome)) {
            db.createObjectStore(nome, { keyPath: 'id' });
          }
        }
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ko(req.error);
    });
    return aperto;
  }

  async function operazione(archivio, modo, fn) {
    const db = await apri();
    return new Promise((ok, ko) => {
      const tx = db.transaction(archivio, modo);
      const req = fn(tx.objectStore(archivio));
      tx.oncomplete = () => ok(req && req.result);
      tx.onerror = () => ko(tx.error);
      tx.onabort = () => ko(tx.error);
    });
  }

  window.DB = {
    archivi: ARCHIVI,
    tutti: (a) => operazione(a, 'readonly', (s) => s.getAll()),
    leggi: (a, id) => operazione(a, 'readonly', (s) => s.get(id)),
    salva: (a, dato) => operazione(a, 'readwrite', (s) => s.put(dato)),
    elimina: (a, id) => operazione(a, 'readwrite', (s) => s.delete(id)),
    conta: (a) => operazione(a, 'readonly', (s) => s.count()),
    nuovoId: () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))
  };
})();
