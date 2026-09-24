/* ══ ESPACE PARTENAIRE — socle partagé (18/09 ; refondu le 23/09 pour le grossiste) ══════════════════════
   (fondatrice 23/09 : « nous sommes grossiste en bons d'achat de marque ; l'app partenaire : logique sédentaire,
   logique réseau nomade, plus de clarté juridique — sédentaire point physique, mandataire nomade »).
   Le commerce du réseau VEND LES BONS DES MARQUES au comptoir : il nous les achète au moment où il les vend
   (valeur faciale moins sa part), il les revend au client au prix affiché, et il nous règle ses achats par
   PRÉLÈVEMENT SEPA après l'arrêté du soir (sédentaire) ou D'AVANCE, sur l'avance qu'il a versée (distributeur nomade).

   UNE ENTREPRISE, UNE IDENTITÉ. Le data-layer tient deux fiches pour le même commerce : le POINT (`partenaire`,
   PRT-…, né du protocole de compte : dossier au coffre, contrat de distribution, activation par PayEnCash) et le
   REVENDEUR (`techRevendeur`, RVD-…, celui que la vente d'un bon de marque, le mandat SEPA et l'avance
   connaissent). Le point est l'identité ; le revendeur est sa fiche de vente — DÉRIVÉE, jamais ressaisie, et tenue
   par le data-layer (même raison sociale, même SIRET, même mode d'exercice, même ville).

   Ce module porte UNE fois ce qui est commun aux pages de l'app partenaire. Il se charge APRÈS
   payencash-data.js et payencash-bus.js, AVANT les scripts de page.

   API :
     PEC_PART.compteSession()   → le compte partenaire de la session (pec-session), ou null
     PEC_PART.pointId()         → l'id du point : refId du compte > clé pec-partenaire-id > null (jamais un point de démo)
     PEC_PART.point()           → la fiche du point (référentiel partenaires) ou null
     PEC_PART.etat()            → PEC_DATA.partenaireEtat(point) : { ok, code, titre, txt, point } — ce qui ouvre ou ferme la vente
     PEC_PART.revendeur()       → la fiche de vente du point (techRevendeur) ou null
     PEC_PART.revendeurAssurer()→ la fait suivre au point (data-layer : techRevendeurSuivrePoint), la crée s'il n'en a pas
     PEC_PART.nomade()          → vrai pour un distributeur nomade (mode « mobile »), faux pour un commerce sédentaire
     PEC_PART.par()             → qui signe un geste : l'identifiant du compte, sinon l'enseigne du point
     PEC_PART.vente()           → ce qui ouvre ou ferme la vente d'un bon de marque (techPeutVendre), lu une fois
     PEC_PART.garde(opts)       → pose #pt-garde (créé au besoin) et masque/désactive les contrôles listés ; rejouée sur le bus
     PEC_PART.aFaire()          → ce qui reste à faire pour que le point vende (contrat, dossier, mandat, avance), dérivé
     PEC_PART.deconnexion()     → compteDeconnecter + retour à la connexion
     PEC_PART.brancher()        → bouton de déconnexion commun dans la barre d'état
     PEC_PART.surBus(fn)        → fn rejouée sur 'pec-bus' et 'storage' (écrans non sourds)
     PEC_PART.marque(mode)      → le logo de l'app : COMMERCE (sédentaire) ou COURSIER (mobile) — onglet, écran
                                  d'accueil, en-tête ; sans argument, celui du point connecté (PARTENAIRE sans point)
     PEC_PART.collab()          → (24/09, nuit) l'accès collaborateur de la session (PEC_DATA.collaborateur), ou null
     PEC_PART.vendeur()         → le filtre « mes ventes » : l'identifiant du collaborateur, null pour le titulaire (il voit tout)
     PEC_PART.reserveTitulaire()→ une page du titulaire (relevés, Mon point, notifications) renvoie un collaborateur à l'accueil
     PEC_PART.menu()            → la barre de navigation, écrite UNE fois : celle du titulaire, ou celle du collaborateur
   ══════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var P = {};
  P.D = function () { return window.PEC_DATA; };

  /* Le compte partenaire derrière la session — c'est LUI qui dit à quel point on est rattaché. */
  P.compteSession = function () {
    var D = P.D(); var s = D && D.session ? D.session() : null;
    if (!s || !D.compteParIdentifiant || !/^Partenaire/.test(s.espace || '')) return null;
    return D.compteParIdentifiant('partenaire', s.identifiant);
  };

  /* L'IDENTITÉ DU POINT. Un compte connecté SANS point rattaché vaut « aucun point » — l'écran le dit ;
     il n'existe AUCUN point de repli (zéro seed : un point naît de l'inscription ou de la signature). */
  P.pointId = function () {
    var D = P.D(); if (!D) return null;
    var c = P.compteSession();
    if (c) return D.comptePoint ? D.comptePoint(c) : (c.refId || null);   // (24/09, nuit) un collaborateur vend pour le point qui l'a invité
    return D.partenaireActifId ? D.partenaireActifId() : null;
  };
  /* ══ (24/09, nuit — fondatrice : « un partenaire du réseau, sauf micro, peut ajouter un collaborateur… il voit ses ventes
     exclusivement, et le compte principal a accès à tout ») LE COLLABORATEUR DANS L'APP ══════════════════════════════════════
     Il entre par la même porte et vend pour le même point ; ce qui change, c'est ce qu'il VOIT : ses ventes, pas celles des autres ;
     ni les relevés, ni le contrat, ni le mandat, ni les réglages du point. */
  P.collab = function () { var D = P.D(), c = P.compteSession(); return (D && c && D.estCollaborateur && D.estCollaborateur(c)) ? D.collaborateur(c.id) : null; };
  P.vendeur = function () { var k = P.collab(); return k ? k.identifiant : null; };
  P.reserveTitulaire = function () {
    if (!P.collab()) return false;
    location.replace('02-accueil.html');
    return true;
  };
  /* LA NAVIGATION, ÉCRITE UNE FOIS (24/09, nuit) — les sept écrans recopiaient chacun leur barre. Le titulaire a ses cinq entrées ;
     le collaborateur les siennes : il vend, il voit SES ventes et son accès — pas les relevés ni Mon point. `aussi` rattache une page
     à son onglet (on arrive aux bons vendus depuis l'accueil, au fil depuis la cloche). */
  P.MENUS = {
    titulaire: [
      { href: '02-accueil.html', lbl: 'Accueil', ico: 'i-home', aussi: ['04-bons.html', '08-notifications.html'] },
      { href: '03-vendre.html', lbl: 'Vendre', ico: 'i-ticket' },
      { href: '09-marques.html', lbl: 'Marques', ico: 'i-tag' },
      { href: '05-releves.html', lbl: 'Mes relevés', ico: 'i-banknote' },
      { href: '07-mon-point.html', lbl: 'Mon point', ico: 'i-store' }
    ],
    collaborateur: [
      { href: '02-accueil.html', lbl: 'Accueil', ico: 'i-home' },
      { href: '03-vendre.html', lbl: 'Vendre', ico: 'i-ticket' },
      { href: '09-marques.html', lbl: 'Marques', ico: 'i-tag' },
      { href: '04-bons.html', lbl: 'Mes ventes', ico: 'i-receipt' },
      { href: '10-mon-acces.html', lbl: 'Mon accès', ico: 'i-user' }
    ]
  };
  P.menu = function () {
    var items = P.MENUS[P.collab() ? 'collaborateur' : 'titulaire'];
    [].forEach.call(document.querySelectorAll('nav[data-part-menu]'), function (nav) {
      var actif = nav.getAttribute('data-part-menu');
      nav.setAttribute('data-app', 'PayEnCash Partenaire');   // le nom de l'app en tête de la colonne de navigation, sur bureau
      nav.innerHTML = items.map(function (x) {
        var ici = x.href === actif || (x.aussi || []).indexOf(actif) !== -1;
        return '<a class="pec-tab" href="' + x.href + '"' + (ici ? ' aria-current="page"' : '') + '><svg class="pec-ico" viewBox="0 0 24 24"><use href="#' + x.ico + '"/></svg>' + x.lbl + '</a>';
      }).join('');
    });
  };
  P.point = function () { var D = P.D(), id = P.pointId(); return (D && D.partenaire && id) ? D.partenaire(id) : null; };
  P.nomade = function () { var D = P.D(), p = P.point(); return !!(D && p && D.partenaireEstMobile && D.partenaireEstMobile(p)); };
  P.par = function () { var c = P.compteSession(), p = P.point(); return (c && c.identifiant) || (p && p.enseigne) || 'partenaire'; };

  /* L'ÉTAT DU POINT, une seule lecture (data-layer) : contrat à signer, contrat signé (intégration), actif,
     suspendu, clos. La vente d'un bon de marque ne s'ouvre qu'avec un point ACTIF. */
  P.etat = function () {
    var D = P.D(), p = P.point();
    if (D && D.partenaireEtat) return D.partenaireEtat(p);
    return { ok: false, code: 'aucun', point: null, titre: 'Aucun point rattaché à cette session', txt: 'Connecte-toi avec l\'identifiant de ton point.' };
  };

  /* ══ LA FICHE DE VENTE DU POINT (23/09) ══════════════════════════════════════════════════════════════════
     `techRevendeur` est celui que la vente connaît : c'est son id que `techBonEmettre` exige, c'est sur lui que
     le mandat SEPA se signe et que le compte d'avance se tient. (23/09, nuit) LE DATA-LAYER LA TIENT LUI-MÊME :
     elle naît avec le point et suit chacun de ses états (techRevendeurSuivrePoint) — actif → validée, suspendu ou
     clos → suspendue, sans jamais lever une suspension pour impayé, qui ne tombe qu'à la régularisation. Ce module
     se contente de la lire, et de rattraper un point né avant la règle. */
  P.revendeur = function () {
    var D = P.D(), pt = P.point();
    return (D && pt && D.techRevendeurDuPoint) ? D.techRevendeurDuPoint(pt.id) : null;
  };
  P._rvdRefus = null;
  P.revendeurAssurer = function () {
    var D = P.D(), pt = P.point();
    if (!D || !pt || !D.techRevendeurSuivrePoint) return { ok: false, motif: 'Aucun point rattaché à cette session.' };
    var r = D.techRevendeurSuivrePoint(pt.id, P.par());
    P._rvdRefus = r ? null : 'l\'identité légale du point (SIRET, e-mail) est incomplète';
    return r ? { ok: true, revendeur: r } : { ok: false, motif: 'Ta fiche de vente n\'a pas pu être créée : ' + P._rvdRefus + '.' };
  };
  /* CE QUI OUVRE OU FERME LA VENTE D'UN BON DE MARQUE — la règle unique du data-layer (techPeutVendre : point
     validé, mandat SEPA signé, aucun impayé, encours sous plafond — ou garantie versée et solde suffisant pour
     un distributeur nomade). Sans fiche de vente, on le dit avec la raison. */
  P.vente = function (marchandId, montant) {
    var D = P.D(), r = P.revendeur();
    if (!D || !D.techPeutVendre) return { ok: false, refus: 'aucun', motif: 'Couche de données indisponible.' };
    if (!r) return { ok: false, refus: 'aucun', motif: P._rvdRefus ? 'Ta fiche de vente n\'a pas pu être créée : ' + P._rvdRefus : 'Aucun point rattaché à cette session.' };
    return D.techPeutVendre(r.id, marchandId || null, montant || 0);
  };

  /* Le bandeau de garde — en tête de .pec-info-body, après le titre. */
  function gardeEl() {
    var g = document.getElementById('pt-garde');
    if (g) return g;
    var host = document.querySelector('.pec-info-body'); if (!host) return null;
    g = document.createElement('div'); g.id = 'pt-garde'; g.hidden = true;
    g.style.cssText = 'border-radius:16px;background:var(--color-amber-well);padding:14px;margin:0 0 18px;font-size:13px;line-height:1.55;color:var(--color-amber-text)';
    g.innerHTML = '<b id="pt-garde-titre">—</b><div id="pt-garde-txt" style="margin-top:4px;font-size:12px">—</div>';
    var h1 = host.querySelector('h1'), apres = h1 && h1.nextElementSibling && h1.nextElementSibling.tagName === 'P' ? h1.nextElementSibling : h1;
    if (apres && apres.parentNode === host) apres.insertAdjacentElement('afterend', g); else host.insertBefore(g, host.firstChild);
    return g;
  }
  /* opts.masquer : ids à cacher · opts.desactiver : ids à griser/désactiver · opts.apres(etat). Rejouée sur le bus
     (un point suspendu puis réactivé par le manager rouvre l'écran sans rechargement). Retourne l'état.
     LA GARDE SE RAPPELLE, ELLE NE S'EMPILE PLUS (23/09) : un seul écouteur, les dernières consignes. C'est aussi elle
     qui fait suivre la fiche de vente (revendeurAssurer) : le point activé pendant que l'écran est ouvert vend. */
  P.garde = function (opts) {
    opts = opts || P._gardeOpts || {};
    P._gardeOpts = opts;
    function appliquer() {
      opts = P._gardeOpts || opts;
      if (P.point()) P.revendeurAssurer();
      var e = P.etat(), g = gardeEl();
      window.__ptBloque = !e.ok;
      if (g) {
        g.hidden = e.ok;
        var t = document.getElementById('pt-garde-titre'), x = document.getElementById('pt-garde-txt');
        if (t) t.textContent = e.titre; if (x) x.textContent = e.txt;
      }
      (opts.masquer || []).forEach(function (id) { var el = document.getElementById(id); if (!el) return;
        if (!e.ok) { el.setAttribute('data-pt-masque', '1'); el.style.display = 'none'; }
        else if (el.getAttribute('data-pt-masque')) { el.removeAttribute('data-pt-masque'); el.style.display = ''; } });
      (opts.desactiver || []).forEach(function (id) { var el = document.getElementById(id); if (!el) return;
        if (!e.ok) { el.style.opacity = '.45'; el.style.pointerEvents = 'none'; el.setAttribute('aria-disabled', 'true'); if ('disabled' in el) el.disabled = true; }
        else if (el.getAttribute('aria-disabled') === 'true') { el.style.opacity = ''; el.style.pointerEvents = ''; el.removeAttribute('aria-disabled'); if ('disabled' in el) el.disabled = false; } });
      if (opts.apres) { try { opts.apres(e); } catch (err) {} }
      return e;
    }
    var e0 = appliquer();
    if (!P._gardeBranchee) { P._gardeBranchee = true; P.surBus(appliquer); }
    return e0;
  };

  /* CE QU'IL RESTE À FAIRE pour que le point vende — dérivé, jamais écrit : le contrat de distribution
     (signé au coffre), le dossier de vérification (KYB dérivé du coffre), l'activation par PayEnCash, puis ce
     que la vente d'un bon de marque exige (la règle unique du data-layer, techPeutVendre) : le mandat SEPA du
     commerce sédentaire, la garantie et le solde du distributeur nomade, un impayé à régulariser. */
  P.aFaire = function () {
    var D = P.D(), p = P.point(), out = []; if (!D || !p) return out;
    if (p.statut === 'contrat_a_signer') out.push({ k: 'contrat', txt: 'Contrat de distribution à signer — depuis Mon point, ou par le lien envoyé par ton conseiller', href: '07-mon-point.html#contrat' });
    if (p.kyb !== 'valide') out.push({ k: 'dossier', txt: p.kybDetail || 'Dossier de vérification à compléter (Kbis, pièce d\'identité du gérant, vidéo)', href: '07-mon-point.html#dossier' });
    if (p.statut === 'contrat_signe' && p.kyb === 'valide') out.push({ k: 'activation', txt: 'Dossier complet et contrat signé : PayEnCash active ton point — tu en es informé ici', href: '08-notifications.html' });
    if (p.statut === 'suspendu') out.push({ k: 'suspendu', txt: 'Point suspendu' + (p.motifSuspension ? ' — ' + p.motifSuspension : '') + ' : contacte PayEnCash', href: '08-notifications.html' });
    if (p.statut !== 'actif') return out;
    var v = P.vente(null, 0);
    if (v.ok) return out;
    var T = {
      aucun:      { k: 'fiche',   txt: 'Fiche de vente introuvable — ' + v.motif, href: '07-mon-point.html#fiche' },
      mandat:     { k: 'mandat',  txt: 'Mandat de prélèvement SEPA à signer — c\'est lui qui nous autorise à te débiter des bons que tu vends', href: '07-mon-point.html#sepa' },
      garantie:   { k: 'avance',  txt: 'Garantie à verser — un dépôt, restitué intégralement quand tu quittes le réseau', href: '07-mon-point.html#avance' },
      solde:      { k: 'avance',  txt: 'Avance insuffisante — verse un complément d\'avance avant de vendre', href: '07-mon-point.html#avance' },
      impaye:     { k: 'impaye',  txt: v.motif, href: '05-releves.html' },
      suspendu:   { k: 'suspendu', txt: v.motif, href: '05-releves.html' },
      non_valide: { k: 'validation', txt: v.motif, href: '08-notifications.html' },
      documents:  { k: 'documents', txt: v.motif, href: '07-mon-point.html#acceptations' },   // (24/09, nuit) une nouvelle version à lire
      encours:    { k: 'encours', txt: v.motif, href: '05-releves.html' }
    };
    out.push(T[v.refus] || { k: v.refus || 'vente', txt: v.motif, href: '05-releves.html' });
    return out;
  };

  /* DÉCONNEXION RÉELLE : compteDeconnecter efface pec-session ET pec-partenaire-id — retour à la connexion. */
  P.deconnexion = function () {
    var D = P.D();
    try { if (D && D.compteDeconnecter) D.compteDeconnecter(); else if (D && D.deconnecter) D.deconnecter(); } catch (e) {}
    location.href = '01-connexion.html';
  };

  /* Le bouton de déconnexion commun : dans la barre d'état du cadre, à droite — le même sur chaque page. */
  function boutonDeconnexion() {
    if (document.getElementById('pt-deconnexion')) return;
    if (/connexion|inscription/.test(String(location.pathname).split('/').pop() || '')) return;   // personne n'est encore entré
    var sb = document.querySelector('.pec-statusbar'); if (!sb) return;
    var c = P.compteSession();
    var b = document.createElement('button'); b.type = 'button'; b.id = 'pt-deconnexion'; b.className = 'tap';
    b.title = 'Se déconnecter' + (c ? ' (' + c.identifiant + ')' : '');
    b.setAttribute('aria-label', b.title);
    /* (19/09, soir — passe écran par écran) « Quitter » faisait 51 × 16 px : on le vise mal du doigt, et on
       tombe à côté. La marge intérieure agrandit la ZONE TOUCHÉE ; la marge négative annule son effet visuel,
       le bouton reste exactement où il était dans la barre d'état. */
    b.style.cssText = 'margin-left:4px;border:none;background:none;padding:6px 4px;margin-top:-6px;margin-bottom:-6px;min-height:28px;display:inline-flex;align-items:center;gap:4px;font:inherit;font-size:10px;font-weight:700;color:inherit;cursor:pointer;opacity:.85';
    b.innerHTML = '<svg class="pec-ico" viewBox="0 0 24 24" style="font-size:14px"><use href="#i-power"/></svg><span>Quitter</span>';
    b.addEventListener('click', function () { P.deconnexion(); });
    var ic = sb.querySelector('.pec-sb-icons');
    if (ic) ic.appendChild(b); else sb.appendChild(b);
  }

  P.surBus = function (fn) {
    window.addEventListener('pec-bus', fn);
    window.addEventListener('storage', fn);
  };

  P.brancher = function () { boutonDeconnexion(); };

  /* ══ (21/09, fondatrice : « voici les logos », puis « deux versions par marque … quand c'est sur fond blanc »)
     TROIS LOGOS POUR UNE MÊME APP ══════════════════════════════════════════════════════════════════════
     PayEnCash PARTENAIRE tant qu'on ne sait pas encore qui est là (la connexion) ; PayEnCash COMMERCE pour le point
     de vente au comptoir, PayEnCash NOMADE pour le distributeur nomade — même contrat, deux métiers (19/09 ; nom écrit
     « Nomade » depuis le 24/09 : le glossaire bannit « coursier »). Les noms écrits vivent dans PEC_DATA.MARQUE_NOMS. À
     l'inscription, le mode choisi décide. L'onglet et l'écran d'accueil prennent la version BLANCHE (la barre est
     claire) ; l'en-tête, sombre, la MARQUE ÉCRITE (symbole transparent + nom + slogan). */
  P.LOGOS = { sedentaire: 'commerce', mobile: 'coursier' };
  /* Le mode qu'une page a CHOISI (l'inscription : « Commerce » ou « Distributeur nomade ») ne se réécrit pas : la pose
     automatique, au chargement complet, le reprenait pour « Partenaire », faute de point connecté. */
  P._modeChoisi = null;
  P.marque = function (mode) {
    var D = P.D(), p = P.point();
    if (mode) P._modeChoisi = mode;
    var k = mode || P._modeChoisi || ((p && D && D.partenaireMode) ? D.partenaireMode(p) : null);
    var nom = P.LOGOS[k] || 'partenaire', base = '../assets/logos/payencash-' + nom;
    var ic = document.querySelector('link[rel="icon"]'), at = document.querySelector('link[rel="apple-touch-icon"]');
    if (ic) ic.setAttribute('href', base + '-blanc-64.png');
    if (at) at.setAttribute('href', base + '-blanc-180.png');
    /* (21/09, « vérifie où le logo n'est pas bien repris ») LA MARQUE ÉCRITE suit le métier : le symbole, le nom
       (payEnCash COMMERCE / COURSIER / PARTENAIRE) et le slogan — posés par PEC_DATA.marqueHTML, comme dans les autres
       apps. */
    [].forEach.call(document.querySelectorAll('[data-pec-marque-part]'), function (el) {
      el.setAttribute('data-pec-marque', nom); el.removeAttribute('aria-label');
      if (D && D.marqueAppliquer) D.marqueAppliquer(el.parentNode);
    });
    return nom;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { P.marque(); });
  else P.marque();

  window.PEC_PART = P;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', P.brancher); else P.brancher();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', P.menu); else P.menu();
})();
