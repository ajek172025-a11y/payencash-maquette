/* ══ PEC_COQUE — LE BACK-OFFICE SUR UN TÉLÉPHONE (24/09) ═════════════════════════════════════════════════════════════
   Fondatrice : « reprends toutes les apps : elles doivent être en mode desktop et responsive pour iPhone ».
   Le manager et la hotline sont nés pour le bureau : une colonne de navigation fixe de 248 px, des tableaux denses. Sur un
   téléphone, la colonne mangeait les deux tiers de l'écran. En dessous de 900 px (payencash-manager.css), elle devient un
   TIROIR : une barre en haut porte le bouton « menu » et le titre de la page ; le tiroir glisse par-dessus, un voile le
   referme, un lien choisi ou la touche Échap aussi. Aucune page n'est réécrite : ce module pose la barre dans toute page
   qui a la coque du back-office (.pec-admin > .pec-aside), et ne fait rien ailleurs.
   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var ICONE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  function monter() {
    var admin = document.querySelector('.pec-admin'), aside = admin && admin.querySelector('.pec-aside');
    if (!admin || !aside || admin.querySelector('.pec-coque-barre')) return;
    if (!aside.id) aside.id = 'pec-coque-nav';
    var barre = document.createElement('div');
    barre.className = 'pec-coque-barre';
    barre.innerHTML = '<button type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="' + aside.id + '">' + ICONE + '</button><span class="t"></span>';
    admin.insertBefore(barre, admin.firstChild);
    var bouton = barre.querySelector('button'), titre = barre.querySelector('.t'), voile = null;
    // le titre de la page : son h1, relu s'il change (certains écrans le peignent après le chargement)
    function majTitre() { var h = document.querySelector('.pec-main h1'); titre.textContent = String((h && h.textContent) || document.title || '').replace(/\s+/g, ' ').trim(); }
    majTitre(); window.addEventListener('load', majTitre);
    function ouvrir(o) {
      admin.classList.toggle('pec-menu-ouvert', o);
      bouton.setAttribute('aria-expanded', String(o));
      bouton.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
      if (o && !voile) {
        voile = document.createElement('div'); voile.className = 'pec-coque-voile';
        voile.addEventListener('click', function () { ouvrir(false); });
        admin.appendChild(voile);
        var premier = aside.querySelector('a, button'); if (premier) premier.focus();
      } else if (!o && voile) { voile.remove(); voile = null; bouton.focus(); }
    }
    bouton.addEventListener('click', function () { ouvrir(!admin.classList.contains('pec-menu-ouvert')); });
    aside.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href]') && admin.classList.contains('pec-menu-ouvert')) ouvrir(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && admin.classList.contains('pec-menu-ouvert')) ouvrir(false); });
    // repassé en largeur de bureau, le tiroir n'a plus de raison d'être ouvert
    try { window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) { if (m.matches) ouvrir(false); }); } catch (e0) {}
  }
  /* ══ (24/09, soir — fondatrice : « je consulte et le design n'a pas été repris ») LA COLONNE DE NAVIGATION DES APPS ═══════
     Sur bureau, la barre d'onglets d'une app de téléphone (Solution, Partenaire, Mes bons) devient une colonne — mais une
     colonne qui ne portait qu'un nom en texte n'est pas une navigation de bureau. Elle reçoit une TÊTE (le symbole et le nom
     écrit de l'app, comme dans son en-tête de téléphone) et un PIED (qui est connecté, et la porte pour sortir), sans que
     les pages changent : ce module lit la session de chaque app par son socle (PEC_TECH, PEC_PART, PEC_BONS) et n'écrit
     rien. Sous 1024 px, la tête et le pied sont masqués par la feuille : la barre du bas reste ce qu'elle est. */
  function ico(id) { return '<svg class="pec-ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function esc(v) { var D = window.PEC_DATA; return D && D.esc ? D.esc(v) : String(v == null ? '' : v); }
  /* CE QUE CHAQUE APP SAIT D'ELLE-MÊME : sa marque, sa page d'accueil, qui est là, et comment on sort */
  function identite() {
    var D = window.PEC_DATA, T = window.PEC_TECH, P = window.PEC_PART, B = window.PEC_BONS;
    if (!D) return null;
    if (T && T.session) {
      var s = T.session('marchand'), m = s && D.techMarchand ? D.techMarchand(s.id) : null;
      var nom = (D.techRef ? D.techRef().nom : 'PayEnCash Solution').replace(/^PayEnCash\s*/i, '');
      /* (24/09, nuit) LE COLLABORATEUR D'UNE MARQUE : son nom, pour qui il travaille, et sa porte de sortie à lui */
      var kc = T.collab ? T.collab() : null;
      if (kc) return { marque: 'solution', nom: nom, accueil: '12-promouvoir.html', qui: kc.vue.nomAffiche,
        role: (D.terme ? D.terme('collaborateur', 'nom', true) : 'Collaborateur') + ' · ' + kc.marque.raisonSociale, entree: '01-connexion.html',
        sortir: function () { T.deconnecter('collaborateur'); var s2 = D.session(); if (s2 && String(s2.identifiant || '').toLowerCase() === String(kc.compte.identifiant).toLowerCase()) D.deconnecter(); location.href = '01-connexion.html'; } };
      return { marque: 'solution', nom: nom, accueil: s ? '02-espace.html' : '../../index.html',
        qui: m ? (m.raisonSociale || m.email) : null, role: m ? (D.terme ? D.terme('marque', 'nom', true) : 'Marque') + (m.statut === 'validated' ? ' · validée' : m.statut === 'draft' ? ' · inscription en cours' : ' · en vérification') : null,
        entree: '01-connexion.html',
        sortir: function () { T.deconnecter('marchand'); var ss = D.session(); if (ss && D.ESPACES_COMPTE && ss.espace === D.ESPACES_COMPTE.marque.sessionLabel) D.deconnecter(); location.href = '01-connexion.html'; } };
    }
    if (P && P.point) {
      var pt = P.point(), c = P.compteSession ? P.compteSession() : null, mode = pt && D.partenaireMode ? D.partenaireMode(pt) : null;
      var logo = mode ? (P.LOGOS || {})[mode] || 'partenaire' : 'partenaire';
      var kp = P.collab ? P.collab() : null;   // (24/09, nuit) un collaborateur : son nom, et le point pour qui il vend
      return { marque: logo, nom: (D.MARQUE_NOMS || {})[logo] || 'Partenaire', accueil: pt ? '02-accueil.html' : '01-connexion.html',
        qui: kp ? kp.nomAffiche : (pt ? pt.enseigne : (c ? c.identifiant : null)),
        role: kp ? (D.terme ? D.terme('collaborateur', 'nom', true) : 'Collaborateur') + (pt ? ' · ' + pt.enseigne : '') : (pt ? (D.partenaireModeLbl ? D.partenaireModeLbl(pt) : '') + (pt.ville ? ' · ' + pt.ville : '') : null),
        entree: '01-connexion.html', sortir: function () { P.deconnexion(); } };
    }
    if (B && B.porteurId) {
      var cl = D.clientCourant ? D.clientCourant() : null;
      return { marque: 'bons', nom: 'Mes bons', accueil: '03-rechercher.html',
        qui: cl ? (cl.nomComplet || ((cl.prenom || '') + ' ' + (cl.nom || '')).trim()) : null, role: cl ? (D.terme ? D.terme('utilisateur', 'nom', true) : 'Utilisateur') + (cl.telComplet || cl.tel ? ' · ' + (cl.telComplet || cl.tel) : '') : null,
        entree: '06-connexion.html', sortir: function () { if (D.compteDeconnecter) D.compteDeconnecter(); if (D.clientActifSet) D.clientActifSet(null); location.href = '03-rechercher.html'; } };
    }
    return null;
  }
  function monterApp() {
    var nav = document.querySelector('.pec-device > .pec-tabbar'), D = window.PEC_DATA;
    if (!nav || !D || !D.marqueHTML) return;
    var id = identite(); if (!id) return;
    var tete = nav.querySelector('.pec-nav-tete'), pied = nav.querySelector('.pec-nav-pied');
    if (!tete) {
      tete = document.createElement('a'); tete.className = 'pec-nav-tete pec-marque';
      nav.insertBefore(tete, nav.firstChild);
    }
    tete.href = id.accueil; tete.setAttribute('aria-label', 'PayEnCash ' + id.nom);
    tete.innerHTML = D.marqueHTML(id.marque, { nom: id.nom, slogan: true });
    if (!pied) { pied = document.createElement('div'); pied.className = 'pec-nav-pied'; nav.appendChild(pied); }
    pied.innerHTML = id.qui
      ? '<span class="qui">' + esc(id.qui) + '</span><span class="role">' + esc(id.role || '') + '</span><button type="button" class="sortie">' + ico('i-power') + 'Se déconnecter</button>'
      : '<span class="role">Personne n’est connecté</span><a class="sortie" href="' + id.entree + '">' + ico('i-user') + 'Se connecter</a>';
    var b = pied.querySelector('button.sortie'); if (b) b.addEventListener('click', id.sortir);
    nav.classList.add('pec-nav-complete');
  }
  function monterTout() { monter(); monterApp(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monterTout); else monterTout();
  // les socles peignent leur barre après le chargement, et la session peut changer sous nos pieds : on repasse
  window.addEventListener('load', monterApp);
  window.addEventListener('pec-bus', monterApp);
  window.PEC_COQUE = { monter: monterTout, app: monterApp };
})();
