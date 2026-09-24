/* ══ PEC_ENTREPRISE — LES INFORMATIONS D'UNE SOCIÉTÉ À PARTIR DE SON SIREN / SIRET (23/09, soir) ═══════════════════
   Fondatrice : « essaie de récupérer une API gratuite pour récupérer les infos société à partir du SIREN, pour faire
   gagner du temps à celui qui s'inscrit ; pareil côté manager, logique de flux ».

   LA SOURCE : l'API « Recherche d'entreprises » de l'État (https://recherche-entreprises.api.gouv.fr), gratuite, sans
   clé, ouverte aux appels depuis un navigateur (Access-Control-Allow-Origin: *). Elle sert les données publiques de
   l'INSEE (Sirene) et du RNE : dénomination, siège, état administratif, activité, forme juridique, dirigeants.
   Vérifié le 23/09/2026 par un appel réel (SIREN 404 833 048 → « ERIC BARJOT », établissement fermé en 2021).

   CE QUE ÇA FAIT, ET NE FAIT PAS : ça PRÉ-REMPLIT (l'inscription) et ça COMPARE (le contrôle du manager : ce que la
   marque déclare face au registre) ; ça ne remplace ni le Kbis, ni la pièce d'identité du dirigeant, ni le contrôle
   humain. La donnée publique aide, elle ne prouve pas : le coffre et le contrôleur gardent le dernier mot.
   Sans réseau, sans réponse ou hors ligne : on le DIT, et l'écran reste utilisable à la main.
   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var BASE = 'https://recherche-entreprises.api.gouv.fr/search';
  /* Les codes de nature juridique que l'on rencontre chez des marques et des commerces — le libellé est celui de l'INSEE
     (catégories juridiques niveau III). Un code inconnu est rendu tel quel : on ne l'invente pas. */
  var NATURES = {
    '1000': 'Entrepreneur individuel', '5202': 'Société en nom collectif', '5306': 'Société en commandite simple',
    '5410': 'SARL nationale', '5499': 'SARL', '5498': 'SARL unipersonnelle', '5710': 'SAS', '5720': 'SASU',
    '5505': 'SA à conseil d\'administration', '5510': 'SA à conseil d\'administration', '5599': 'SA', '5605': 'SA à directoire',
    '5699': 'SA à directoire', '5385': 'Société d\'exercice libéral à responsabilité limitée', '5426': 'SARL unipersonnelle', '5430': 'SARL', '5470': 'SARL', '5485': 'SARL',
    '6540': 'SCI', '6598': 'Société civile', '6599': 'Société civile', '9220': 'Association déclarée', '9210': 'Association non déclarée'
  };
  /* La qualité d'un dirigeant, telle que le registre l'écrit, ramenée aux qualités admises du data-layer
     (techQualitesDirigeant) : on ne garde que ce qui correspond, le reste reste à choisir à la main. */
  function qualiteVersReferentiel(q) {
    var s = String(q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!s) return null;
    if (/^gerant/.test(s)) return /gerante/.test(s) ? 'gérante' : 'gérant';
    if (/^president/.test(s)) return /presidente/.test(s) ? 'présidente' : 'président';
    if (/directeur general|directrice generale/.test(s)) return /directrice/.test(s) ? 'directrice générale' : 'directeur général';
    if (/entrepreneur individuel|micro/.test(s)) return 'entrepreneur individuel';
    return null;
  }
  function majInit(s) {
    return String(s || '').toLowerCase().replace(/(^|[\s\-'’])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function normaliser(r) {
    var siege = r.siege || {};
    var dirigeants = (r.dirigeants || []).filter(function (d) { return d && d.type_dirigeant === 'personne physique'; }).map(function (d) {
      var prenoms = String(d.prenoms || '').trim().split(/[\s,]+/).filter(Boolean);
      return { prenom: majInit(prenoms[0] || ''), prenoms: majInit(prenoms.join(' ')), nom: majInit(String(d.nom || '').replace(/\s*\(.*\)$/, '')),
        qualiteRegistre: d.qualite || null, qualite: qualiteVersReferentiel(d.qualite), anneeNaissance: d.annee_de_naissance || null };
    });
    var morales = (r.dirigeants || []).filter(function (d) { return d && d.type_dirigeant !== 'personne physique'; }).map(function (d) {
      return { denomination: d.denomination || d.nom || '', siren: d.siren || null, qualiteRegistre: d.qualite || null };
    });
    return {
      siren: r.siren, siret: siege.siret || null,
      raisonSociale: r.nom_raison_sociale || r.nom_complet || '', nomComplet: r.nom_complet || '',
      forme: NATURES[r.nature_juridique] || (r.nature_juridique ? 'code ' + r.nature_juridique : ''), natureJuridique: r.nature_juridique || null,
      adresse: siege.adresse || '', codePostal: siege.code_postal || '', ville: majInit(siege.libelle_commune || ''),
      naf: r.activite_principale || siege.activite_principale || '',
      dateCreation: r.date_creation || null,
      /* A = active, C = cessée, F = fermée (établissement) — un compte ne s'ouvre pas pour une société cessée */
      actif: (r.etat_administratif || '') === 'A', etatAdministratif: r.etat_administratif || null,
      siegeActif: (siege.etat_administratif || '') === 'A',
      dirigeants: dirigeants, dirigeantsMoraux: morales,
      majRegistre: r.date_mise_a_jour || r.date_mise_a_jour_insee || null,
      source: 'Recherche d’entreprises (api.gouv.fr — INSEE Sirene, RNE)', lu: Date.now()
    };
  }
  /* UN APPEL AU REGISTRE, avec son délai : rend les résultats bruts, ou lève l'erreur que l'appelant traduit */
  function appel(q, parPage) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
    return fetch(BASE + '?q=' + encodeURIComponent(q) + '&page=1&per_page=' + (parPage || 3), { signal: ctrl ? ctrl.signal : undefined, headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (timer) clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { return (j && j.results) || []; }, function (err) { if (timer) clearTimeout(timer); throw err; });
  }
  function horsLigne(err) {
    return { ok: false, code: 'reseau', motif: 'Le registre des entreprises ne répond pas pour l’instant (' + (err && err.name === 'AbortError' ? 'délai dépassé' : (err && err.message) || 'réseau') + ') — continue à la main, la vérification se fera au contrôle.' };
  }
  window.PEC_ENTREPRISE = {
    /* Un SIREN (9 chiffres) ou un SIRET (14) — les espaces sont admis. Rend une promesse :
         { ok:true, entreprise } · { ok:false, motif, code:'format'|'introuvable'|'reseau' } */
    chercher: function (siren) {
      var n = String(siren || '').replace(/\s/g, '');
      if (!/^\d{9}$|^\d{14}$/.test(n)) return Promise.resolve({ ok: false, code: 'format', motif: 'Indique un SIREN (9 chiffres) ou un SIRET (14 chiffres).' });
      var q = n.slice(0, 9);
      return appel(q, 3).then(function (l) {
        var r = l.filter(function (x) { return x.siren === q; })[0] || null;
        if (!r) return { ok: false, code: 'introuvable', motif: 'Aucune société au registre pour le SIREN ' + q + ' — vérifie le numéro, ou continue à la main.' };
        var e = normaliser(r);
        if (n.length === 14 && e.siret && e.siret !== n) e.siretDiffere = true;   // le SIRET saisi n'est pas celui du siège : on le dit, on ne l'écrase pas
        return { ok: true, entreprise: e };
      }).catch(horsLigne);
    },
    /* (24/09 — benchmark des grands acteurs : on trouve son entreprise par son NOM, son SIREN ou son SIRET) LA RECHERCHE
       LIBRE : un numéro va droit à la fiche ; trois lettres ou plus rendent jusqu'à six sociétés, les cessées comprises
       (elles se signalent — c'est l'écran qui refuse de s'y inscrire). { ok:true, liste } · { ok:false, motif, code } */
    suggerer: function (texte) {
      var t = String(texte || '').trim(), n = t.replace(/[\s.]/g, '');
      if (/^\d{9}$|^\d{14}$/.test(n)) return this.chercher(n).then(function (r) { return r.ok ? { ok: true, liste: [r.entreprise] } : r; });
      if (t.length < 3) return Promise.resolve({ ok: false, code: 'format', motif: 'Trois lettres au moins, ou le SIREN (9 chiffres) / SIRET (14 chiffres).' });
      return appel(t, 6).then(function (l) {
        if (!l.length) return { ok: false, code: 'introuvable', motif: 'Aucune entreprise trouvée pour « ' + t + ' » — vérifie l’orthographe, ou remplis les champs à la main.' };
        return { ok: true, liste: l.map(normaliser) };
      }).catch(horsLigne);
    },
    /* COMPARER ce qu'un dossier déclare à ce que dit le registre — pour le contrôleur. Chaque écart est dit, aucun n'est
       tranché ici : c'est le contrôleur qui lit la pièce. `declare` = { raisonSociale, siret, dirigeant: { prenom, nom } }. */
    comparer: function (entreprise, declare) {
      declare = declare || {};
      var nu = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); };
      var ecarts = [], accords = [];
      if (declare.raisonSociale) {
        var a = nu(declare.raisonSociale), b = nu(entreprise.raisonSociale), c = nu(entreprise.nomComplet);
        (a && (b.indexOf(a) !== -1 || a.indexOf(b) !== -1 || c.indexOf(a) !== -1) ? accords : ecarts).push({ k: 'raisonSociale', l: 'Dénomination', declare: declare.raisonSociale, registre: entreprise.raisonSociale || entreprise.nomComplet });
      }
      if (declare.siret) {
        (nu(declare.siret) === nu(entreprise.siret) ? accords : ecarts).push({ k: 'siret', l: 'SIRET du siège', declare: declare.siret, registre: entreprise.siret || '—' });
      }
      if (declare.dirigeant && (declare.dirigeant.nom || declare.dirigeant.prenom)) {
        var dn = nu(declare.dirigeant.nom), dp = nu(declare.dirigeant.prenom);
        var trouve = (entreprise.dirigeants || []).filter(function (d) { return dn && nu(d.nom) === dn && (!dp || nu(d.prenoms).indexOf(dp) !== -1 || nu(d.prenom) === dp); })[0] || null;
        (trouve ? accords : ecarts).push({ k: 'dirigeant', l: 'Dirigeant', declare: [declare.dirigeant.prenom, declare.dirigeant.nom].filter(Boolean).join(' '),
          registre: (entreprise.dirigeants || []).map(function (d) { return d.prenom + ' ' + d.nom + (d.qualiteRegistre ? ' (' + d.qualiteRegistre + ')' : ''); }).join(', ') || '— aucune personne physique au registre' });
      }
      if (!entreprise.actif) ecarts.push({ k: 'etat', l: 'État au registre', declare: 'société en activité', registre: entreprise.etatAdministratif === 'C' ? 'cessée' : 'fermée' });
      return { ecarts: ecarts, accords: accords, ok: !ecarts.length };
    }
  };
})();
