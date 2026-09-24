/* =============================================================================
   PayEnCash — Barre latérale de l'ESPACE MANAGER (source unique)
   -----------------------------------------------------------------------------
   La même barre était recopiée à l'identique dans chaque maquette manager. Une
   entrée renommée, c'était autant de fichiers à éditer — et, en pratique, des copies
   qui divergent. Elle est désormais décrite ICI et nulle part ailleurs.

   Usage dans un écran :
       <aside class="pec-aside" data-pec-nav></aside>
   L'entrée active est déduite du nom de fichier courant : aucun paramètre à
   maintenir écran par écran, donc rien à oublier de mettre à jour.

   Icônes : ids du sprite `payencash-icons.js` — jamais d'emoji (charte).
   ============================================================================= */
(function () {
  /* (23/09 — pivot grossiste) CINQ GROUPES, ET RIEN D'AUTRE. Nous sommes grossiste en bons d'achat de marque :
     une marque émet ses bons, les commerces de notre réseau (sédentaires ou nomades) les vendent au comptoir,
     nous achetons ces bons à la marque et nous la payons à l'échéance de son offre, le commerce nous règle par
     prélèvement SEPA après l'arrêté de 20:00 (ou d'avance s'il est micro-entrepreneur), le client utilise son bon
     chez la marque depuis l'app Mes bons. Les groupes Mode, Fly, fournisseurs, espace commercial, agents salariés
     et le Bon d'achat PayEnCash (carte cadeau) ont quitté le menu avec leurs écrans : plus personne ne les sert. */
  var GROUPS = [
    {
      label: 'Pilotage', key: 'pilotage',
      items: [
        { file: '02-tableau-de-bord.html', icon: 'i-home', label: 'Tableau de bord' },
        { file: '30-carte-operations.html', icon: 'i-map-pin', label: 'Carte du réseau' },
        { file: '27-journal-flux.html', icon: 'i-route', label: 'Journal des flux' },
        { file: '20-notifications.html', icon: 'i-bell', label: 'Notifications' },
        { file: '11-audit.html', icon: 'i-history', label: 'Journal d’audit' }
      ]
    },
    {
      label: 'Réseau & marques', key: 'reseau',
      items: [
        { file: '46-marques.html', icon: 'i-tag', label: 'Marques — Solution' },
        { file: '29-partenaires.html', icon: 'i-store', label: 'Commerces du réseau' },
        { file: '45-solution-paiements.html', icon: 'i-banknote', label: 'Prélèvements & paiements' },
        { file: '42-verifications.html', icon: 'i-shield', label: 'Vérifications KYC / KYB' }
      ]
    },
    {
      label: 'Finance', key: 'finance',
      items: [
        { file: '21-compte-resultat.html', icon: 'i-coin', label: 'Compte de résultat' },
        { file: '07-tresorerie.html', icon: 'i-landmark', label: 'Trésorerie' },
        { file: '08-finance.html', icon: 'i-banknote', label: 'Suivi financier' },
        { file: '14-comptabilite.html', icon: 'i-file', label: 'Comptabilité & TVA' }
      ]
    },
    {
      label: 'Support', key: 'support',
      items: [
        { file: '18-fiche-client.html', icon: 'i-user', label: 'Utilisateurs Mes bons' },
        { file: '09-appels.html', icon: 'i-headset', label: 'Centre d’appels' },
        { file: '27-assistance-reclamations.html', icon: 'i-shield', label: 'Assistance & réclamations' },
        { file: '16-communications.html', icon: 'i-mail', label: 'Communications' }
      ]
    },
    {
      label: 'Administration', key: 'admin',
      items: [
        { file: '40-comptes.html', icon: 'i-user', label: 'Comptes & accès' },
        { file: '17-comptes-manager.html', icon: 'i-users', label: 'Comptes manager' },
        { file: '19-invitation.html', icon: 'i-mail', label: 'Inviter un manager / hotline' },
        { file: '10-configuration.html', icon: 'i-edit', label: 'Configuration' },
        { file: '31-comptes-demo.html', icon: 'i-lock', label: 'Accès & comptes démo' }
      ]
    }
  ];

  // SESSION MANAGER (audit 03/09 — zéro-dur) : le pied lit PEC_DATA.session() : la session n'est « manager » que si
  // son espace contient « Manager » (une session partenaire ou marque ouverte dans le même navigateur n'est
  // JAMAIS prise pour le manager — règle appliquée à tout acteur d'action manager : PEC_MGR.acteur()).
  function sessionManager() {
    try {
      var s = window.PEC_DATA && PEC_DATA.session ? PEC_DATA.session() : null;
      return s && /Manager/.test(String(s.espace || '')) ? s : null;
    } catch (e) { return null; }
  }
  function sessionQuelconque() {
    try { return window.PEC_DATA && PEC_DATA.session ? PEC_DATA.session() : null; } catch (e) { return null; }
  }
  // (11/09) l'échappement du data-layer — celui-ci oubliait le guillemet, donc ne protégeait pas un attribut
  function escapeHtml(s) { return (window.PEC_DATA && PEC_DATA.esc) ? PEC_DATA.esc(s) : String(s == null ? '' : s); }
  function foot() {
    var s = sessionManager();
    var qui = s ? escapeHtml((s.role ? s.role + ' · ' : '') + s.identifiant) : 'Aucune session manager';
    // « Se déconnecter » = PEC_DATA.compteDeconnecter() (protocole unique de compte) — purge la session
    // ET les clés de l'espace métier ouvert ; l'ancien appel `deconnecter()` ne faisait que la moitié.
    return 'Espace manager · v2.0<br>' + qui +
      '<a class="pec-aside-logout" href="01-connexion.html" onclick="try{window.PEC_DATA&&(PEC_DATA.compteDeconnecter?PEC_DATA.compteDeconnecter():PEC_DATA.deconnecter())}catch(e){}">' +
      '<svg class="pec-ico" viewBox="0 0 24 24"><use href="#i-power"/></svg>Se déconnecter</a>';
  }

  /* ══ (23/09 — grossiste) L'ARGENT DU GROSSISTE, DÉRIVÉ UNE FOIS POUR TOUS LES ÉCRANS DE FINANCE ═══════════════
     Trésorerie (07), Suivi financier (08), Comptabilité (14) et Compte de résultat (21) lisaient chacun le bus
     des commandes Mode/Fly. Ils lisent désormais LA MÊME dérivation des tables Solution : ventes (achat du bon à
     la marque, revente au commerce du réseau), remises de prélèvements et virements (frais bancaires), pénalités,
     abonnements au logiciel (la seule prestation soumise à TVA), mouvements d'avance des commissionnaires.
     Aucun nombre n'est posé ici : tout vient de PEC_DATA. Cette dérivation a sa place dans le data-layer
     (techEcritures / techTresorerie) — elle vit ici parce que le data-layer est élagué APRÈS les écrans. ══ */
  function r2(x) { return Math.round((+x || 0) * 100) / 100; }
  function bornesMois(mois) {
    if (!mois || !/^\d{4}-\d{2}$/.test(mois)) return null;
    var an = +mois.slice(0, 4), mo = +mois.slice(5, 7) - 1;
    return [new Date(an, mo, 1).getTime(), new Date(an, mo + 1, 1).getTime()];
  }
  function finance(mois) {
    var D = window.PEC_DATA;
    if (!D || !D.techVentes || !D.techRemises || !D.techReglements || !D.techPenalites || !D.techAbonnements) return null;
    var b = bornesMois(mois), dans = function (ts) { return !b || ((ts || 0) >= b[0] && (ts || 0) < b[1]); };
    var L = [];
    var T = { valeur: 0, achats: 0, ventes: 0, marge: 0, nVentes: 0, nAnnulees: 0, frais: 0, nRemises: 0, nReglements: 0, payeMarques: 0,
      penalites: 0, nPenalites: 0, abonnementsHT: 0, abonnementsTVA: 0, nAbonnements: 0, impayes: 0, nImpayes: 0 };
    var noms = {}; try { D.techRevendeursGet().forEach(function (x) { noms[x.id] = x.raisonSociale; }); } catch (e) {}
    D.techVentes(b ? { mois: mois } : {}).forEach(function (v) {
      if (v.statut === 'annulee') { T.nAnnulees++; return; }
      L.push({ at: v.at, journal: 'Achats', libelle: 'Bon ' + v.marchand + ' de ' + D.eur(v.montant) + ' acheté à la marque (remise ' + String(v.remisePct).replace('.', ',') + ' %)',
        piece: v.reference, debit: r2(v.prixMarque), credit: 0, tva: 0, source: 'techVentes' });
      L.push({ at: v.at, journal: 'Ventes', libelle: 'Bon ' + v.marchand + ' revendu à ' + v.revendeur + ' (part du commerce ' + String(v.partPointPct).replace('.', ',') + ' %)' + (v.paiement === 'avance' ? ' — payé d’avance' : ''),
        piece: v.reference, debit: 0, credit: r2(v.prixPoint), tva: 0, source: 'techVentes' });
      T.valeur = r2(T.valeur + v.montant); T.achats = r2(T.achats + v.prixMarque); T.ventes = r2(T.ventes + v.prixPoint); T.marge = r2(T.marge + v.marge); T.nVentes++;
    });
    D.techRemises({ deposees: true }).forEach(function (r) {
      if (!dans(r.deposeLe)) return;
      T.nRemises++;
      if (r.cout > 0) { L.push({ at: r.deposeLe, journal: 'Banque', libelle: 'Frais de remise de prélèvements — ' + (r.modeLbl || r.reference), piece: r.reference, debit: r2(r.cout), credit: 0, tva: 0, source: 'techRemises' }); T.frais = r2(T.frais + r.cout); }
    });
    D.techReglements({}).forEach(function (v) {
      if (!dans(v.at)) return;
      T.nReglements++; T.payeMarques = r2(T.payeMarques + v.montant);
      if (v.cout > 0) { L.push({ at: v.at, journal: 'Banque', libelle: 'Frais de virement instantané — ' + v.marchand, piece: v.reference, debit: r2(v.cout), credit: 0, tva: 0, source: 'techReglements' }); T.frais = r2(T.frais + v.cout); }
    });
    D.techPenalites({}).forEach(function (p) {
      if (!dans(p.at)) return;
      L.push({ at: p.at, journal: 'Pénalités', libelle: (p.motif || 'Pénalité') + ' — ' + (noms[p.revendeurId] || p.revendeurId), piece: p.reference, debit: 0, credit: r2(p.montant), tva: 0, source: 'techPenalites' });
      T.penalites = r2(T.penalites + p.montant); T.nPenalites++;
    });
    var tvaPct = D.techRef ? +D.techRef().tvaPct : 0;
    D.techAbonnements(b ? { periode: mois } : {}).forEach(function (a) {
      var f = (a.factureId && D.techFacture) ? D.techFacture(a.factureId) : null;
      var ht = r2(a.montantHT), tva = f ? r2(f.tva) : r2(ht * tvaPct / 100);
      L.push({ at: a.creeLe, journal: 'Abonnements', libelle: 'Abonnement au logiciel — ' + a.marchand + ' · ' + a.formuleNom + ' · ' + a.periode + (f ? ' (facture ' + f.id + ')' : ''),
        piece: f ? f.id : a.id, debit: 0, credit: ht, tva: tva, source: f ? 'techFactures' : 'techAbonnements' });
      T.abonnementsHT = r2(T.abonnementsHT + ht); T.abonnementsTVA = r2(T.abonnementsTVA + tva); T.nAbonnements++;
    });
    D.techVentes({ statut: 'impaye' }).forEach(function (v) { T.impayes = r2(T.impayes + v.prixPoint); T.nImpayes++; });
    L.sort(function (a, c) { return (c.at || 0) - (a.at || 0); });
    T.produits = r2(T.ventes + T.penalites + T.abonnementsHT);
    T.charges = r2(T.achats + T.frais);
    T.resultat = r2(T.produits - T.charges);
    T.tva = T.abonnementsTVA;
    var parJournal = {};
    L.forEach(function (e) { var j = parJournal[e.journal] || (parJournal[e.journal] = { debit: 0, credit: 0, n: 0 }); j.debit = r2(j.debit + (e.debit || 0)); j.credit = r2(j.credit + (e.credit || 0)); j.n++; });
    return { mois: mois || null, lignes: L, totaux: T, parJournal: parJournal };
  }
  /* LES POCHES — un ÉTAT, pas une période : où est l'argent à cet instant. */
  function tresorerie() {
    var D = window.PEC_DATA;
    if (!D || !D.techVentesGet || !D.techPenalites || !D.techReglementsDus || !D.techReglements) return null;
    var P = { aPrelever: 0, nAPrelever: 0, remis: 0, nRemis: 0, encaisseSepa: 0, encaisseAvance: 0, impayes: 0, nImpayes: 0,
      penalitesDues: 0, duMarques: 0, nEcheances: 0, nEchues: 0, nonArrete: 0, nNonArrete: 0, payeMarques: 0, nReglements: 0,
      avancesDisponibles: 0, garanties: 0, nCommissionnaires: 0, frais: 0 };
    D.techVentesGet().forEach(function (v) {
      if (v.statut === 'annulee') return;
      if (v.statut === 'a_prelever') { P.aPrelever = r2(P.aPrelever + v.prixPoint); P.nAPrelever++; }
      else if (v.statut === 'en_prelevement') { P.remis = r2(P.remis + v.prixPoint); P.nRemis++; }
      else if (v.statut === 'regle') { if (v.paiement === 'avance') P.encaisseAvance = r2(P.encaisseAvance + v.prixPoint); else P.encaisseSepa = r2(P.encaisseSepa + v.prixPoint); }
      else if (v.statut === 'impaye') { P.impayes = r2(P.impayes + v.prixPoint); P.nImpayes++; }
      if (v.marqueStatut === 'a_payer' && v.echeanceMarque == null) { P.nonArrete = r2(P.nonArrete + v.prixMarque); P.nNonArrete++; }
    });
    D.techPenalites({}).forEach(function (p) {
      if (p.statut === 'a_prelever') { P.aPrelever = r2(P.aPrelever + p.montant); P.penalitesDues = r2(P.penalitesDues + p.montant); }
      else if (p.statut === 'en_prelevement') P.remis = r2(P.remis + p.montant);
      else if (p.statut === 'regle') P.encaisseSepa = r2(P.encaisseSepa + p.montant);
    });
    var now = Date.now();
    D.techReglementsDus().forEach(function (g) { P.duMarques = r2(P.duMarques + g.montant); P.nEcheances++; if (g.echeance != null && g.echeance <= now) P.nEchues++; });
    D.techReglements({}).forEach(function (v) { P.payeMarques = r2(P.payeMarques + v.montant); P.nReglements++; P.frais = r2(P.frais + (v.cout || 0)); });
    if (D.techRemises) D.techRemises({ deposees: true }).forEach(function (r) { P.frais = r2(P.frais + (r.cout || 0)); });
    if (D.techRevendeursGet && D.techPaieParAvance && D.avanceSolde) D.techRevendeursGet().forEach(function (r) {
      if (!D.techPaieParAvance(r)) return;
      var e = D.avanceSolde('revendeur', r.id);
      P.nCommissionnaires++; P.avancesDisponibles = r2(P.avancesDisponibles + e.solde); P.garanties = r2(P.garanties + e.garantie);
    });
    return P;
  }

  // UTILITAIRES PARTAGÉS DES ÉCRANS MANAGER (une seule source, chargée par tous les écrans à barre latérale)
  window.PEC_MGR = {
    // l'acteur d'une action manager : l'identifiant de la session SI elle est manager, sinon « manager (démo) »
    acteur: function () { var s = sessionManager(); return s ? s.identifiant : 'manager (démo)'; },
    sessionManager: sessionManager,
    finance: finance,
    tresorerie: tresorerie,
    bornesMois: bornesMois,
    // EXPORT CSV RÉEL (les boutons « Exporter » n'avaient aucun handler) : fichier téléchargé, dérivé des
    // données passées par l'écran, et journalisé sur le bus (evt `export`, acteur) — « chaque export est journalisé ».
    csv: function (nom, entetes, lignes) {
      var esc = function (v) { v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var txt = '﻿' + [entetes].concat(lignes || []).map(function (l) { return l.map(esc).join(';'); }).join('\n');
      /* (11/09) « chaque export est journalisé » : encore faut-il qu'il ait eu lieu. L'échec du téléchargement
         était avalé, et le journal portait quand même la ligne « export » — un registre qui atteste d'une
         sortie de données qui n'est jamais partie. */
      var parti = true;
      try {
        var a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(txt);
        a.download = nom + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { parti = false; }
      if (!parti) return null;
      try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('export', nom, { par: this.acteur(), lignes: (lignes || []).length }); } catch (e2) {}
      return txt;
    }
  };

  // GARDE DE SESSION (audit 03/09) : aucun écran manager ne vérifiait la session. Bandeau discret en tête
  // de l'écran — SANS redirection (les tests chargent les pages sans session) : « Session manager absente —
  // se connecter », ou « session d'un autre espace » quand un partenaire ou une marque est connecté à la place.
  function garde() {
    var id = 'pec-garde-session';
    var old = document.getElementById(id); if (old) old.remove();
    if (sessionManager()) return;
    var autre = sessionQuelconque();
    var div = document.createElement('div');
    div.id = id;
    div.setAttribute('role', 'status');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;margin:0 0 14px;padding:9px 14px;border-radius:12px;background:var(--color-amber-well,#FFF4E0);color:var(--color-amber-text,#8A5A10);font-size:12.5px;font-weight:600';
    div.innerHTML = '<svg class="pec-ico" viewBox="0 0 24 24"><use href="#i-alert"/></svg><span>' +
      (autre ? 'Session « ' + escapeHtml(autre.espace || '') + ' » (' + escapeHtml(autre.identifiant || '') + ') ouverte — cet espace est réservé au manager. '
             : 'Session manager absente — ') +
      '<a href="01-connexion.html" style="color:inherit;font-weight:800">se connecter</a></span>';
    try {
      var main = document.querySelector('.pec-main');
      if (main) main.insertBefore(div, main.firstChild); else document.body.insertBefore(div, document.body.firstChild);
    } catch (e) {}
  }

  function icon(id) {
    return '<svg class="pec-ico" viewBox="0 0 24 24"><use href="#' + id + '"/></svg>';
  }

  function currentFile() {
    var parts = window.location.pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] || '');
  }

  function render(aside) {
    var here = currentFile();
    var html =
      /* (21/09, fondatrice : « P générique ») la marque du back-office : le P et le nom écrit, plus un billet et « PayEnCash » */
      '<div class="pec-aside-brand">' + ((window.PEC_DATA && PEC_DATA.marqueHTML) ? '<span class="pec-marque pec-marque--sombre">' + PEC_DATA.marqueHTML('manager') + '</span>' : 'PayEnCash') + '</div>';

    // état d'ouverture mémorisé (localStorage) ; le groupe de l'écran courant est toujours ouvert
    var ouverts = {}; try { ouverts = JSON.parse(localStorage.getItem('pec-manager-nav-ouverts') || '{}') || {}; } catch (e) {}
    GROUPS.forEach(function (group) {
      var contientActif = group.items.some(function (it) { return it.file === here; });
      var open = contientActif || ouverts[group.key] === true;
      html += '<button type="button" class="pec-aside-group pec-aside-group--btn' + (open ? ' is-open' : '') + '" data-grp="' + group.key + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        escapeHtml(group.label) + '<span class="pec-aside-chev" aria-hidden="true">›</span></button>';
      html += '<div class="pec-aside-items" data-grp-items="' + group.key + '"' + (open ? '' : ' hidden') + '>';
      group.items.forEach(function (item) {
        var active = item.file === here;
        // L'écran courant garde un lien inerte : un lien vers soi-même relance un
        // chargement pour rien et fait clignoter la page.
        html +=
          '<a href="' + (active ? '#' : item.file) + '"' +
          (active ? ' aria-current="page"' : '') + '>' +
          icon(item.icon) + escapeHtml(item.label) + '</a>';
      });
      html += '</div>';
    });

    html += '<div class="pec-aside-foot">' + foot() + '</div>';
    aside.innerHTML = html;
    // repli / dépli au clic sur l'en-tête de groupe (mémorisé) — navigation « facile » : 5 domaines, pas 40 lignes
    aside.addEventListener('click', function (e) {
      var b = e.target.closest('.pec-aside-group--btn'); if (!b) return;
      var key = b.getAttribute('data-grp'), items = aside.querySelector('[data-grp-items="' + key + '"]');
      var open = items.hasAttribute('hidden');
      if (open) items.removeAttribute('hidden'); else items.setAttribute('hidden', '');
      b.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
      try { var o = JSON.parse(localStorage.getItem('pec-manager-nav-ouverts') || '{}') || {}; o[key] = open; localStorage.setItem('pec-manager-nav-ouverts', JSON.stringify(o)); } catch (err) {}
    });
    // styles minimaux du groupe repliable (une seule source : ici)
    if (!document.getElementById('pec-aside-groups-css')) {
      var st = document.createElement('style'); st.id = 'pec-aside-groups-css';
      st.textContent = '.pec-aside-group--btn{display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:0;cursor:pointer;text-align:left;font:inherit;color:inherit}' +
        '.pec-aside-group--btn .pec-aside-chev{font-size:16px;line-height:1;transition:transform .18s;opacity:.7}' +
        '.pec-aside-group--btn.is-open .pec-aside-chev{transform:rotate(90deg)}' +
        '.pec-aside-items[hidden]{display:none}';
      document.head.appendChild(st);
    }
  }

  function mount() {
    var nodes = document.querySelectorAll('[data-pec-nav]');
    for (var i = 0; i < nodes.length; i++) render(nodes[i]);
    garde();
    // la session change dans un autre onglet (connexion / déconnexion) → bandeau et pied se mettent à jour
    window.addEventListener('storage', function (e) {
      if (e && e.key && e.key !== 'pec-session') return;
      garde();
      for (var j = 0; j < nodes.length; j++) { var f = nodes[j].querySelector('.pec-aside-foot'); if (f) f.innerHTML = foot(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
