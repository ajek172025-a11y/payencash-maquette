/* ══ GARDE DE SESSION (fondatrice 05/09) ═══════════════════════════════════════════════════
   « Lorsque je me déconnecte d'un espace, je dois avoir les données de PERSONNE. Si je suis
     déconnectée : créer un compte ou se connecter. Même logique sur chaque espace. »

   Ce module se charge APRÈS payencash-data.js, sur les pages qui affichent des données
   PERSONNELLES (les annuaires, les pages d'entrée et les pages légales restent publics :
   on peut regarder sans compte, comme dans n'importe quelle boutique).

   Hors session, il remplace le contenu de la page par une invitation — la donnée de quelqu'un
   d'autre n'est jamais peinte, même une fraction de seconde : la garde s'exécute AVANT les
   scripts de page (elle masque le corps), puis rend l'invitation au chargement.

   (23/09 — pivot grossiste) QUATRE ESPACES SEULEMENT passent par cette garde : l'app « Mes bons »
   (ui/bons), l'app des commerces partenaires (ui/partenaire), le back-office (ui/manager) et la
   hotline (ui/hotline). L'espace Solution des marques (ui/tech) tient ses propres sessions
   (PEC_TECH.entrer) et ne charge pas ce module.
   ═════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var D = window.PEC_DATA; if (!D) return;

  // Quel espace, d'après le chemin de la page — jamais écrit dans chaque fichier.
  var CHEMIN = String(location.pathname);
  var ESPACE = (CHEMIN.match(/\/ui\/([a-z]+)\//) || [])[1] || '';

  // Les pages PUBLIQUES de chaque espace client (tout le reste y est personnel).
  var PUBLIQUES = {
    /* (23/09) L'APP « MES BONS » (ui/bons) : le porteur y RANGE les codes des bons d'achat des MARQUES du réseau, et
       les y UTILISE chez leur marque (05-offre — l'app est obligatoire : l'usage porte le compte du porteur).
       (23/09, nuit) L'APP A SES PROPRES PORTES : 00-inscription crée le compte client, 06-connexion l'ouvre — les deux
       sont publiques par nature (une page de connexion derrière sa propre garde, c'est une porte qui mène à elle-même).
       Seule la recherche d'une marque ou d'un commerce l'est aussi — un annuaire se consulte sans compte ; la liste
       des bons, le détail d'un bon, le bon proposé par une marque et le compte du porteur sont personnels. */
    bons: ['03-rechercher', '00-inscription', '06-connexion', '07-boutiques', '08-boutique']   // (24/09, nuit) les boutiques se consultent sans compte, comme la carte ; seul « ton code » demande de se connecter
  };
  // Les back-offices : TOUJOURS une session (aucune page publique, hors leurs pages d'entrée).
  // (18/09) `partenaire` : le commerce qui VEND les bons au comptoir — sédentaire ou nomade.
  var BACKOFFICE = { partenaire: 'partenaire', manager: 'manager', hotline: 'hotline' };

  var FICHIER = (CHEMIN.split('/').pop() || '').replace('.html', '');
  function nomFichier(href) { return String(href || '').split('?')[0].replace(/^.*\//, '').replace('.html', ''); }

  function estPublique() {
    /* (fondatrice 06/09 « j'ai créé un compte et je n'arrive pas à me connecter ») LA PAGE D'ENTRÉE D'UN ESPACE
       NE PEUT PAS ÊTRE DERRIÈRE SA PROPRE GARDE : la garde la remplaçait par « Se connecter », et ce bouton
       renvoyait… sur elle-même. Une fois déconnecté, plus aucun chemin de retour. Les deux portes déclarées
       dans OU (créer un compte, se connecter) sont donc publiques, quel que soit l'espace. */
    var o = OU[ESPACE];
    if (o && (nomFichier(o.lien) === FICHIER || nomFichier(o.connexion) === FICHIER)) return true;
    if (BACKOFFICE[ESPACE]) return /connexion|inscription/.test(FICHIER);
    var l = PUBLIQUES[ESPACE];
    return !l || l.indexOf(FICHIER) !== -1;
  }

  // Y a-t-il quelqu'un derrière l'écran ?
  function connecte() {
    // (23/09) `bons` = l'app « Mes bons » : le compte client de l'appareil, ou une session client fraîchement ouverte
    if (ESPACE === 'bons') {
      if (D.clientConnecte && D.clientConnecte()) return true;
      return estSession(D.session ? D.session() : null, 'Client');
    }
    if (BACKOFFICE[ESPACE]) {
      var s = D.session ? D.session() : null;
      // l'identité MÉTIER de l'appareil ouvre l'espace (c'est elle que pose la connexion) ;
      // à défaut, une session dont l'espace correspond — une session partenaire n'ouvre pas
      // le back-office manager.
      if (ESPACE === 'manager') return estSession(s, 'Manager');
      if (ESPACE === 'hotline') return estSession(s, 'Hotline') || estSession(s, 'Manager');
      if (ESPACE === 'partenaire') return estSession(s, 'Partenaire');   // (18/09) le compte du point ouvre l'espace — jamais un point de démo
      return !!s;
    }
    return true;
  }

  function estSession(s, prefixe) { return !!(s && String(s.espace || '').indexOf(prefixe) === 0); }

  var OU = {
    /* (23/09, nuit) « Mes bons » a ses propres portes : 00-inscription crée le compte client (prénom, nom, e-mail,
       mobile, mot de passe, CGU lues dans l'app), 06-connexion l'ouvre (e-mail ou mobile + mot de passe). */
    bons: { lien: '00-inscription.html', connexion: '06-connexion.html', nom: 'PayEnCash Mes bons' },
    manager: { lien: '01-connexion.html', connexion: '01-connexion.html', nom: 'le back-office' },
    hotline: { lien: '00-connexion.html', connexion: '00-connexion.html', nom: 'la hotline' },
    partenaire: { lien: '00-inscription.html', connexion: '01-connexion.html', nom: 'ton espace partenaire' }
  };

  if (estPublique() || connecte()) return;

  // Rien de personnel ne doit s'afficher : on masque tout de suite, on remplace au chargement.
  try { document.documentElement.setAttribute('data-pec-hors-session', '1'); } catch (e) {}
  /* (24/09, soir — relevé par le banc, qui capte désormais les erreurs des pages) UNE PAGE VOILÉE N'ÉCOUTE PLUS LE BUS. La garde vide ce
     qui portait des données ; les écouteurs de la page, eux, répondaient encore à chaque événement et peignaient dans des éléments
     disparus (« Cannot set properties of null »). La garde est chargée avant les scripts de la page : elle s'inscrit la première, et
     arrête l'événement pour eux. Une connexion faite ailleurs rouvre la page à son prochain chargement. */
  ['pec-bus', 'storage'].forEach(function (evt) { window.addEventListener(evt, function (e) { e.stopImmediatePropagation(); }); });
  var st = document.createElement('style');
  // tout ce qui vit dans le cadre (en-tête, corps, panneaux) est masqué : un bandeau d'en-tête
  // porte lui aussi un nom et des chiffres.
  st.textContent = '[data-pec-hors-session] .pec-device > *:not(.pec-statusbar),'
    + '[data-pec-hors-session] .pec-main,[data-pec-hors-session] .pec-aside,'
    + '[data-pec-hors-session] .pec-topbar,[data-pec-hors-session] .pec-tabbar{visibility:hidden!important}'
    /* (18/09 — constaté sur partenaire/02 : PAGE BLANCHE hors session) l'invitation était rendue puis cachée par la
       règle ci-dessus : un `!important` l'emporte sur le `style.visibility = 'visible'` posé en ligne, et `visibility`
       s'hérite. L'invitation, la tabbar et le menu du back-office se rendent visibles au même niveau de priorité —
       « on ferme une page, pas l'application ». */
    + '[data-pec-hors-session] [data-pec-invitation],[data-pec-hors-session] [data-pec-invitation] *,'
    + '[data-pec-hors-session] .pec-tabbar,[data-pec-hors-session] .pec-tabbar *,'
    + '[data-pec-hors-session] .pec-aside,[data-pec-hors-session] .pec-aside *{visibility:visible!important}';
  (document.head || document.documentElement).appendChild(st);

  /* (fondatrice 06/09) « pas de page blanche, c'est n'importe quoi » — l'écran hors session
     était le MÊME partout : « Cette page est la tienne », sans dire ce qu'on y trouve ni où
     aller en attendant. Chaque page personnelle a maintenant sa phrase : ce qui vit ici, et
     pourquoi il faut un compte. Le reste de l'app reste navigable — on ferme une page, pas
     l'application. Les libellés sont ici, en un seul endroit, jamais dans les pages. */
  var CONTEXTES = {
    // (18/09) l'espace du commerçant partenaire — chaque page dit ce qui y vit
    'partenaire/02-accueil':      { titre: 'Ton point', quoi: 'Les ventes de bons de ton commerce, ce que tu as gagné et ce qu\'il te reste à faire vivent sur le compte de ton point.' },
    'partenaire/03-vendre':       { titre: 'Vendre un bon', quoi: 'Un bon ne s\'émet qu\'au nom d\'un point activé par PayEnCash : la vente est réservée au compte du commerce.' },
    'partenaire/04-bons':         { titre: 'Les bons vendus', quoi: 'La liste des bons émis par ton point, leur état et leur ticket sont rattachés à ton compte.' },
    'partenaire/05-releves':      { titre: 'Tes relevés', quoi: 'Le relevé mensuel de ton point — bons vendus, commission gagnée, prélèvements, autofactures — est personnel.' },
    'partenaire/07-mon-point':    { titre: 'Mon point', quoi: 'La fiche de ton commerce, ton dossier de vérification et ton contrat de distribution vivent sur ton compte.' },
    'partenaire/08-notifications': { titre: 'Tes notifications', quoi: 'Le fil de ton point (contrat, activation, carte, prélèvements) est rattaché à ton compte.' },
    'partenaire/09-marques':      { titre: 'Les marques', quoi: 'Le comptoir des marques dont ton point vend les bons est rattaché à ton compte.' },
    // (23/09) l'app « Mes bons » — les codes rangés et leur état sont ceux d'UN porteur
    'bons/01-mes-bons':       { titre: 'Tes bons d’achat', quoi: 'Les codes que tu ranges ici, et ce qu\'il te reste sur chacun, sont rattachés à ton compte : ils te suivent d\'un appareil à l\'autre.' },
    'bons/02-bon':            { titre: 'Le détail d’un bon', quoi: 'Le code d\'un bon vaut titre : il ne s\'affiche que sur le compte qui l\'a rangé.' },
    'bons/04-compte':         { titre: 'Ton compte', quoi: 'Ton identité, tes canaux vérifiés, tes documents acceptés et tes consentements vivent sur ton compte.' },
    'bons/05-offre':          { titre: 'Un bon proposé par une marque', quoi: 'Un bon de marque s\'utilise depuis l\'app, avec ton compte : c\'est ce qui rend chaque usage retraçable — et c\'est sous ce compte que tes bons sont rangés.' }
  };
  // Où continuer à naviguer sans compte, par espace — l'app ne se ferme pas.
  var LIBRE = {
    bons: { href: '03-rechercher.html', lbl: 'Continuer sans compte — voir où acheter un bon' }
  };

  function rendre() {
    var o = OU[ESPACE] || { lien: '', connexion: '', nom: 'PayEnCash' };
    var ctx = CONTEXTES[ESPACE + '/' + FICHIER] || null;
    var libre = LIBRE[ESPACE] || null;
    var connexion = o.connexion, lien = o.lien;
    if (ESPACE === 'bons') {
      /* (23/09, soir) L'APP « MES BONS » RAMÈNE OÙ ON ÉTAIT : le lien partagé par une marque ouvre 05-offre?o=<slug>
         (ou 01-mes-bons?o=<slug> pour qui n'a pas l'app) ; sans session, la connexion se ferait puis laisserait la
         personne ailleurs, le bon proposé perdu. Le chemin de retour (fichier + paramètres, dans le dossier de l'app)
         voyage avec la demande de connexion (`retour`) ; l'inscription, elle, ne garde que le bon proposé (`o`) — une
         fois le compte créé, c'est lui qu'on ouvre. Les deux pages rejouent ce retour après la session ouverte. */
      connexion += '?retour=' + encodeURIComponent(FICHIER + '.html' + location.search);
      var slugO = (location.search.match(/[?&]o=([^&#]+)/) || [])[1] || '';
      if (slugO) lien += '?o=' + slugO;
      var offre = null;
      try { offre = (slugO && D.techLien) ? D.techLien(decodeURIComponent(slugO)) : null; } catch (e) {}
      // un bon proposé se NOMME sur l'invitation : celui qui arrive du lien sait ce qui l'attend derrière la connexion
      if (offre) ctx = { titre: offre.marchand + ' te propose un bon d\'achat de ' + D.eur(offre.montant),
        quoi: 'Il s\'utilise uniquement chez ' + offre.marchand + '. Connecte-toi ou crée ton compte : tu retrouves tes bons ' + offre.marchand + ' pour l\'utiliser, ou tu vois où en acheter un.' };
    }
    var hote = document.querySelector('.pec-body') || document.querySelector('.pec-main') || document.body;
    if (!hote) return;
    // on VIDE tout ce qui portait des données — en-tête, panneaux, feuilles et modales incluses.
    // On ne garde que le chemin qui mène au bloc d'accueil, plus la barre d'état et la tabbar.
    (function purger(parent) {
      [].forEach.call([].slice.call(parent.children), function (el) {
        if (el === hote || el.contains(hote)) { if (el !== hote) purger(el); return; }
        if (el.classList && (el.classList.contains('pec-statusbar') || el.classList.contains('pec-tabbar'))) return;
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'SVG' || el.tagName === 'svg') return;
        if (el.querySelector && el.querySelector('symbol')) return;   // (23/09, nuit) la planche d'icônes (payencash-icons.js) vit dans un <div> : sans elle, l'invitation et la tabbar perdaient leurs icônes
        el.remove();
      });
    })(document.body);
    hote.style.visibility = 'visible';
    hote.innerHTML =
      '<div data-pec-invitation style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:56vh;text-align:center;padding:36px 22px">' +
        '<svg class="pec-ico" viewBox="0 0 24 24" style="font-size:34px;color:var(--color-disabled)"><use href="#i-user"/></svg>' +
        '<h1 style="margin:14px 0 0;font-size:19px;font-weight:800;letter-spacing:-0.02em;color:var(--color-ink)">' +
          (ctx ? ctx.titre : 'Cette page est la tienne') + '</h1>' +
        '<p style="margin:8px 0 0;max-width:340px;font-size:13px;line-height:1.6;color:var(--color-muted)">' +
          (ctx ? ctx.quoi + ' ' : '') +
          'Personne n\'est connecté sur cet appareil : connecte-toi à <b style="color:var(--color-ink)">' + o.nom + '</b> ou crée ton compte pour l\'ouvrir.</p>' +
        // inline-flex, pas inline-block : le socle centre le libellé en flex — en bloc, il collait au haut du bouton
        '<a class="pec-cta tap" href="' + connexion + '" style="display:inline-flex;width:auto;margin-top:18px;min-width:220px">Se connecter</a>' +
        // les DEUX portes, toujours : celui qui n'a pas de compte ne doit pas chercher où le créer
        (nomFichier(o.lien) !== nomFichier(o.connexion) ? '<a class="pec-btn-secondary tap" href="' + lien + '" style="display:inline-flex;margin-top:9px;min-width:220px;text-decoration:none">Créer un compte</a>' : '') +
        // « pas de page blanche » : on ferme une page, jamais l'application — il y a toujours où aller
        (libre ? '<a class="tap" href="' + libre.href + '" style="margin-top:14px;font-size:12.5px;font-weight:800;color:var(--color-primary-dark);text-decoration:none">' + libre.lbl + ' →</a>' : '') +
      '</div>';
    var tb = document.querySelector('.pec-tabbar'); if (tb) tb.style.visibility = 'visible';
    var as = document.querySelector('.pec-aside'); if (as) as.style.visibility = 'visible';
  }
  // Les scripts de page peuvent peindre APRÈS nous (chargement, minuteur, événement bus) :
  // on rejoue la garde à chaque étape, et un observateur retire tout ce qui reviendrait.
  var BLOC = null;
  function verrouiller() {
    rendre();
    if (BLOC || !document.body) return;
    BLOC = new MutationObserver(function () {
      var inv = document.querySelector('[data-pec-invitation]');
      if (!inv) { rendre(); return; }
      (function purge(parent) {
        [].forEach.call([].slice.call(parent.children), function (el) {
          if (el === inv || el.contains(inv)) { if (el !== inv) purge(el); return; }
          if (el.classList && (el.classList.contains('pec-statusbar') || el.classList.contains('pec-tabbar'))) return;
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'SVG' || el.tagName === 'svg') return;
          if (el.querySelector && el.querySelector('symbol')) return;   // la planche d'icônes reste (voir ci-dessus)
          el.remove();
        });
      })(document.body);
    });
    BLOC.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verrouiller);
  else verrouiller();
  window.addEventListener('load', verrouiller);
  setTimeout(verrouiller, 400);
  window.PEC_HORS_SESSION = true;
})();
