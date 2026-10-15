// ===== ENTRATE DI GIORNATA (solo calcoli, nessun accesso al database) =====
// Usa le funzioni già esistenti: getPercentualeRiempimento (stadio.js) e FF_LIVELLI (fastfood.js).

const PREZZO_BIGLIETTO = 80;
const PREZZO_MAGLIA = 100;       // singola maglia
const PREZZO_MAGLIA_KIT = 150;   // kit completo

// % tifosi per evento: [base, kit]
const MAGLIE_PCT_TIFOSI = {
  n7:       { assist: [2.5, 2.8], gol: [1.5, 1.8] },
  n9:       { gol: [2.0, 2.2],    assist: [1.5, 1.8] },
  n10:      { assist: [2.5, 2.8], gol: [1.5, 1.8] },
  portiere: { cleansheet: [1.0, 1.2] }
};
const FOLLOWER_PCT_EVENTO = [0.15, 0.25]; // [base, kit]
const CAPITANO = { baseTifosi: 5, baseFollower: 1, tifosiVoto: 1, followerVoto: 0.25, sogliaVoto: 6.5 };

// Biglietteria di UNA partita in casa. La classifica usata è quella PRIMA della giornata.
function calcBiglietteriaPartita(tifosi, capienza, piazzamento) {
  const paganti = Math.floor(Math.min(tifosi || 0, capienza || 10000) * getPercentualeRiempimento(piazzamento || 12) / 100);
  return { paganti, incasso: paganti * PREZZO_BIGLIETTO };
}

// Fast food di UNA partita in casa (stessa formula di calcGuadagnoFF, senza il ×19).
function calcFastFoodPartita(livello, paganti) {
  const ff = FF_LIVELLI[livello] || FF_LIVELLI[0];
  if (ff.pct === 0) return 0;
  return Math.floor(paganti * ff.pct) * ff.spesa;
}

// Magliette della giornata: conta SOLO l'incremento di questa giornata.
// eventi = { n7:{gol,assist}, n9:{gol,assist}, n10:{gol,assist}, portiere:{cleansheet} }
// capitanoVoto = voto del capitano in questa giornata (null se non ha giocato)
// primaGiornata = true la prima volta: accredita anche la base del capitano (5% tifosi, 1% follower)
function calcMaglieGiornata({ eventi = {}, capitanoVoto = null, kit = false, tifosi = 0, follower = 0, primaGiornata = false }) {
  const k = kit ? 1 : 0;
  let pctT = 0, pctF = 0;

  for (const [maglia, tabella] of Object.entries(MAGLIE_PCT_TIFOSI)) {
    for (const [evento, pct] of Object.entries(tabella)) {
      const n = (eventi[maglia] && eventi[maglia][evento]) || 0;
      pctT += n * pct[k];
      pctF += n * FOLLOWER_PCT_EVENTO[k];
    }
  }

  if (primaGiornata) { pctT += CAPITANO.baseTifosi; pctF += CAPITANO.baseFollower; }
  if (capitanoVoto !== null && capitanoVoto >= CAPITANO.sogliaVoto) {
    pctT += CAPITANO.tifosiVoto;
    pctF += CAPITANO.followerVoto;
  }

  const prezzo = kit ? PREZZO_MAGLIA_KIT : PREZZO_MAGLIA;
  const venduteTifosi = Math.floor(tifosi * pctT / 100);
  const venduteFollower = Math.floor(follower * pctF / 100);
  return {
    pctTifosi: pctT, pctFollower: pctF,
    venduteTifosi, venduteFollower,
    incasso: (venduteTifosi + venduteFollower) * prezzo
  };
}

// Riepilogo di una giornata per UNA squadra che gioca in casa (da mostrare in anteprima).
function calcEntrateGiornataCasa(sq, piazzamentoPrima, datiMaglie) {
  const b = calcBiglietteriaPartita(sq.tifosi, sq.capienza_stadio, piazzamentoPrima);
  const ff = calcFastFoodPartita(sq.fastfood_livello || 0, b.paganti);
  const m = calcMaglieGiornata({ ...datiMaglie, kit: !!(sq.maglie && sq.maglie.upgrade_kit), tifosi: sq.tifosi || 0, follower: sq.social_followers || 0 });
  return { biglietteria: b.incasso, paganti: b.paganti, fastFood: ff, magliette: m.incasso, dettaglioMaglie: m,
           totale: b.incasso + ff + m.incasso };
}
