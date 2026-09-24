/* PEC_BANC — la boîte à outils commune au BANC D'ESSAI et aux AUDITS (clics, mise en page, navigation).
   Deux outils qui parcourent les mêmes écrans ont les mêmes besoins : attendre vraiment, et disposer d'un commerce
   partenaire en règle ou d'une marque au dossier contrôlé. Les écrire deux fois, c'est les laisser diverger.
   (23/09, grossiste) Le fournisseur Mode, le concours Fly, le paiement en ligne d'une commande, la carte bancaire du
   commerce et l'adresse de rencontre de Mode sont partis avec leurs écrans : il ne reste que ce que le grossiste éprouve. */
(function (g) {

  /* ── ATTENDRE VRAIMENT, MÊME DANS UN ONGLET MASQUÉ ──────────────────────────────────────────────────────────────
     (06/09, généralisé le 10/09) Chrome bride les minuteries d'un onglet caché : d'abord à une seconde, puis — au-delà
     de cinq minutes de masquage — à UN réveil par MINUTE. Les Web Workers ne sont pas bridés : on leur délègue
     l'attente. Repli sur setTimeout si le Worker est indisponible (page ouverte en file://). */
  var tic = (function () {
    try {
      var src = 'onmessage=function(e){setTimeout(function(){postMessage(e.data);},e.data.ms);}';
      var w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      var n = 0, att = {};
      w.onmessage = function (e) { var f = att[e.data.id]; if (f) { delete att[e.data.id]; f(); } };
      return function (ms) { return new Promise(function (r) { var id = ++n; att[id] = r; w.postMessage({ id: id, ms: ms }); }); };
    } catch (e) { return null; }
  })();

  function coffre(w) { return (w && w.PEC_DOCS) || window.PEC_DOCS || null; }
  function donnees(w) { return (w && w.PEC_DATA) || window.PEC_DATA || null; }

  /* ── (19/09, soir) UNE POSITION QUI MARCHE ───────────────────────────────────────────────
     Le module « Comment veux-tu payer ? » de la page d'un bon proposé (tech/07-lien) demande la position du visiteur
     pour trier les commerces par distance. Un navigateur de banc ne se déplace pas : ce simulateur remplace
     `navigator.geolocation` DANS LA FENÊTRE TESTÉE et rend la main pour publier les relevés un par un.
     (20/09) IL SAIT AUSSI ÉCHOUER : le navigateur qui a bloqué le site (`refus: 1`), celui qui ne répond jamais
     (`muet: true`), et `etat` force ce que le navigateur pense de la permission (« prompt » pour un visiteur neuf). */
  function simulerGeolocation(w, depart, o) {
    o = o || {};
    var cbs = [], arrets = 0, pos = depart || { lat: 0, lng: 0 };
    var ancien = null, ancienPerm = null;
    try { ancien = Object.getOwnPropertyDescriptor(w.navigator, 'geolocation'); } catch (e0) {}
    try {
      ancienPerm = Object.getOwnPropertyDescriptor(w.navigator, 'permissions');
      var etat = o.etat || (o.refus === 1 ? 'denied' : (o.refus || o.muet) ? 'prompt' : 'granted');
      Object.defineProperty(w.navigator, 'permissions', { configurable: true, value: {
        query: function (q) {
          if (!q || q.name !== 'geolocation') return Promise.resolve({ state: 'prompt' });
          return Promise.resolve({ state: etat });
        }
      } });
    } catch (eP) {}
    function fix() { return { coords: { latitude: pos.lat, longitude: pos.lng, accuracy: pos.precision || 12 }, timestamp: Date.now() }; }
    function erreur() { return { code: o.refus, message: 'simulation banc' }; }
    try {
      Object.defineProperty(w.navigator, 'geolocation', { configurable: true, value: {
        getCurrentPosition: function (ok, ko) {
          if (o.muet) return;
          if (o.refus) { w.setTimeout(function () { if (ko) ko(erreur()); }, 0); return; }
          var f = fix(); w.setTimeout(function () { ok(f); }, 0);
        },
        watchPosition: function (ok, ko) {
          if (o.muet) { cbs.push(ok); return cbs.length; }
          if (o.refus) { cbs.push(ok); w.setTimeout(function () { if (ko) ko(erreur()); }, 0); return cbs.length; }
          cbs.push(ok); var f = fix(); w.setTimeout(function () { ok(f); }, 0); return cbs.length;
        },
        clearWatch: function (id) { if (cbs[id - 1]) { cbs[id - 1] = null; arrets++; } }
      } });
    } catch (e) { return null; }
    return {
      avancer: function (p) { pos = p; cbs.forEach(function (ok) { if (ok) ok(fix()); }); return p; },
      arrets: function () { return arrets; },
      actifs: function () { return cbs.filter(Boolean).length; },
      restaurer: function () {
        try { if (ancien) Object.defineProperty(w.navigator, 'geolocation', ancien); } catch (e2) {}
        try { if (ancienPerm) Object.defineProperty(w.navigator, 'permissions', ancienPerm); } catch (e3) {}
      }
    };
  }

  /* ── (18/09 ; 23/09, grossiste) UN COMMERCE PARTENAIRE PRÊT À VENDRE LES BONS DES MARQUES ────────────────────────
     Le parcours réel, geste par geste, par les fonctions que les écrans appellent — jamais une fiche posée à la main :
     compte créé (00-inscription) → e-mail confirmé → pièces déposées au coffre puis contrôlées (42-verifications) →
     compte VALIDÉ par le manager (→ le point naît « contrat à signer ») → contrat de distribution signé (pièce générée
     du coffre) et contresigné → point ACTIVÉ (29-partenaires). `o.sansContrat` / `o.sansActivation` arrêtent le parcours
     avant ces étapes pour les scénarios qui les testent eux-mêmes. PLUS DE CARTE BANCAIRE : le commerce n'est plus
     débité à la vente, il est prélevé après l'arrêté sur le mandat SEPA qu'il signe côté réseau des marques
     (techSepaMandatSigner), ou paie d'avance s'il est nomade. Rend { ok, compte, pointId, point, identifiant, motdepasse }. */
  /* (18/09, soir) UN SIRET PAR COMMERCE, (23/09) ET SA CLÉ DOIT TOMBER JUSTE : le SIRET n'a qu'une règle dans la maison
     (D.siretValide). On fabrique les treize premiers chiffres depuis le compteur du banc, puis on cherche le quatorzième. */
  function _siretUnique(w) {
    var n = 0;
    try { n = (parseInt(w.localStorage.getItem('pec-banc-siret') || '0', 10) || 0) + 1; w.localStorage.setItem('pec-banc-siret', String(n)); } catch (e) { n = Math.floor(Math.random() * 90000) + 1; }
    var base = '812345678' + String(1000 + (n % 8999)).slice(-4), D = donnees(w);
    for (var k = 0; k < 10; k++) { if (!D || !D.siretValide || D.siretValide(base + k)) return base + k; }
    return base + '0';
  }
  function pointPartenairePret(w, o) {
    o = o || {}; var D = donnees(w), DOCS = coffre(w); if (!D || !DOCS || !D.compteCreer) return { ok: false, motif: 'data-layer ou coffre absent', etape: 'setup' };
    /* ══ (23/09) LA FENÊTRE DOIT PORTER LE COFFRE, ET ON LE DIT TOUT DE SUITE : `_partenaireVerite` dérive `contratSigne`
       et `kyb` DU COFFRE de SA fenêtre ; sans `PEC_DOCS` chargé là, le contrat paraît non signé et l'activation est
       refusée — pour un défaut de fenêtre, pas de modèle. Un setup qui échoue doit DIRE pourquoi. ══ */
    if (!w || !w.PEC_DOCS) return { ok: false, etape: 'setup', motif: 'cette fenêtre ne charge pas payencash-docs.js : le contrat et le KYB s\'y liraient toujours comme absents (monte le commerce depuis une page qui porte le coffre, par exemple /ui/partenaire/…)' };
    var n = ((o.enseigne || 'Tabac du Banc') + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1000)).toLowerCase().replace(/[^a-z0-9]+/g, '.');
    var form = Object.assign({ enseigne: o.enseigne || 'Tabac du Banc', adresse: '12 rue de la Gare', cp: '13001', ville: 'Marseille', tel: '04 91 00 00 00', email: n + '@tabac.fr',
      responsable: 'Nadia Benali', siret: _siretUnique(w), identifiant: n, motdepasse: 'Tabac!2026xx', motdepasse2: 'Tabac!2026xx' }, o.form || {});
    var r = D.compteCreer('partenaire', form); if (!r.ok) return { ok: false, motif: r.motif, etape: 'compteCreer' };
    var v = D.compteVerifier(r.compte.id, 'email', D.compteCodes(r.compte).email); if (!v.ok) return { ok: false, motif: v.motif, etape: 'compteVerifier' };
    // les documents en vigueur, acceptés à l'inscription (00-inscription les fait cocher)
    try { D.acceptationsPoser('partenaire', form.identifiant, ((D.ref.documents || {}).partenaire || []).map(function (d) { return d.cle; }), form.responsable); } catch (eA) {}
    DOCS.piecesDe('partenaire').forEach(function (p) {
      if (!p.obligatoire || p.genere) return;
      var extra = null;
      if (p.id === 'kbis') extra = { mentions: { raisonSociale: form.enseigne + ' SNC', formeJuridique: 'SNC', siren: form.siret.slice(0, 9), siret: form.siret, rcs: 'Marseille B ' + form.siret.slice(0, 9), adresse: form.adresse + ', ' + form.cp + ' ' + form.ville, dirigeant: form.responsable } };
      else if (p.expire) extra = { expiresOn: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10) };
      try { w.localStorage.setItem('pec-doc:partenaire:' + r.compte.id + ':' + p.id, JSON.stringify({ portee: 'partenaire', id: r.compte.id, piece: p.id, nom: p.id + '.pdf', type: 'application/pdf', taille: 1024, at: Date.now(), statut: 'deposee', motif: '', data: 'data:application/pdf;base64,JVBERi0=' })); } catch (e) {}
      DOCS.statuer('partenaire', r.compte.id, p.id, 'validee', '', 'emilie.r', extra);
    });
    var val = D.compteValider(r.compte.id, 'emilie.r', { kyb: true }); if (!val.ok) return { ok: false, motif: val.motif, etape: 'compteValider' };
    var pointId = (D.compte(r.compte.id) || {}).refId; if (!pointId) return { ok: false, motif: 'aucun point lié au compte validé', etape: 'lier' };
    var fin = function (extra) { try { w.dispatchEvent(new w.Event('pec-bus')); } catch (e3) {} return Object.assign({ ok: true, compte: D.compte(r.compte.id), pointId: pointId, point: D.partenaire(pointId), identifiant: form.identifiant, motdepasse: form.motdepasse }, extra || {}); };
    if (o.sansContrat) return fin();
    /* (23/09, grossiste) le contrat de distribution est signé par le gérant et contresigné par le MANAGER — l'espace commercial n'existe plus */
    var sg = D.contratPartenaireSigner(pointId, { responsable: form.responsable, via: 'coffre', par: 'emilie.r' }); if (!sg.ok) return { ok: false, motif: sg.motif, etape: 'contrat' };
    var pc = DOCS.piecesDe('partenaire').filter(function (p) { return p.genere; })[0];
    try { w.localStorage.setItem('pec-doc:partenaire:' + pointId + ':' + pc.id, JSON.stringify({ portee: 'partenaire', id: pointId, piece: pc.id, nom: 'contrat-distribution.pdf', type: 'application/pdf', taille: 2048, at: Date.now(), statut: 'validee', signe: true, signataire: form.responsable, signeAt: Date.now(), empreinte: 'fixture', genere: pc.genere, modele: pc.genere, contresigne: { par: 'emilie.r', at: Date.now() }, statueAt: Date.now(), statuePar: 'emilie.r', data: 'data:application/pdf;base64,JVBERi0=' })); } catch (e) {}
    if (o.sansActivation) return fin();
    var act = D.partenaireActiver(pointId, 'emilie.r'); if (!act.ok) return { ok: false, motif: act.motif, etape: 'activer' };
    /* (23/09, nuit) UN POINT PRÊT EST UN POINT QUI PEUT VENDRE : sa fiche de vente est née avec lui et l'activation l'a
       validée ; il lui reste ce qui ouvre sa caisse — le mandat SEPA (sédentaire) ou la garantie et l'avance (nomade).
       Sans ça, « où acheter » ne le liste pas, et c'est la règle, pas le banc. `sansVente` le laisse fermé. */
    if (!o.sansVente) {
      var rv = D.techRevendeurDuPoint(pointId); if (!rv) return { ok: false, motif: 'la fiche de vente du point n\'est pas née', etape: 'fiche' };
      if (D.techPaieParAvance(rv)) { D.avanceGarantieVerser('revendeur', rv.id, { par: 'banc' }); D.avanceRecharger('revendeur', rv.id, 500, { reference: 'VIRT-BANC-' + rv.id, par: 'banc' }); }
      else { var sm = D.techSepaMandatSigner('revendeur', rv.id, { iban: 'FR8430003035000500001234567', bic: 'CMCIFR2A', titulaire: form.enseigne, signature: true }, 'banc'); if (!sm.ok) return { ok: false, motif: sm.motif, etape: 'mandat SEPA' }; }
    }
    return fin();
  }

  /* ── (23/09, soir) LE DOSSIER DE VÉRIFICATION D'UNE MARQUE, CONTRÔLÉ AU COFFRE ─────────────────────────────
     Le manager ne valide plus une marque sans dossier valide (techMarchandValider lit PEC_DOCS.etat dès que le coffre
     est chargé dans la fenêtre). Le banc pose donc les pièces obligatoires de la portée « marchand » telles que
     Vérifications les aurait contrôlées — déposées puis validées, le Kbis et le RIB avec leurs mentions — et le
     contrat-cadre généré, signé par la marque et contresigné : rien de plus, et par la même écriture que le coffre.
     Rend { ok, etat, motif } ; refuse net, en le disant, si la fenêtre ne porte pas le coffre (il s'y lirait absent). */
  function dossierMarquePret(w, marchandId, o) {
    o = o || {};
    var D = donnees(w), DOCS = w && w.PEC_DOCS;
    if (!D || !DOCS || !DOCS.piecesDe || !DOCS.statuer) return { ok: false, etape: 'setup', motif: 'cette fenêtre ne charge pas payencash-docs.js : le dossier s\'y lirait toujours comme absent (monte la marque depuis une page qui porte le coffre)' };
    var m = D.techMarchand ? D.techMarchand(marchandId) : null;
    if (!m) return { ok: false, etape: 'marque', motif: 'marque inconnue : ' + marchandId };
    var siren = String(m.siret || '').slice(0, 9), dans180 = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
    DOCS.piecesDe('marchand').forEach(function (p) {
      if (!p.obligatoire) return;
      var k = 'pec-doc:marchand:' + m.id + ':' + p.id;
      if (p.genere) {
        // le contrat-cadre : généré, signé par la marque, contresigné par nous — la pièce telle que le coffre l'écrit
        try { w.localStorage.setItem(k, JSON.stringify({ portee: 'marchand', id: m.id, piece: p.id, nom: 'contrat-cadre.pdf', type: 'application/pdf', taille: 2048, at: Date.now(), statut: 'validee', signe: true, signataire: o.signataire || 'Banc S.', signeAt: Date.now(), empreinte: 'fixture', genere: p.genere, modele: p.genere, contresigne: { par: 'emilie.r', at: Date.now() }, statueAt: Date.now(), statuePar: 'emilie.r', data: 'data:application/pdf;base64,JVBERi0=' })); } catch (e) {}
        return;
      }
      var extra = {};
      if (p.id === 'kbis') extra.mentions = { raisonSociale: m.raisonSociale, formeJuridique: 'SAS', siren: siren, siret: m.siret, rcs: 'Marseille B ' + siren, adresse: '1 rue du Test, 13001 Marseille', dirigeant: o.dirigeant || 'Banc S.' };
      if (p.id === 'rib') extra.mentions = { iban: 'FR7630004000031234567890143', bic: 'BNPAFRPP', titulaire: m.raisonSociale };
      if (p.expire) extra.expiresOn = dans180;
      try { w.localStorage.setItem(k, JSON.stringify({ portee: 'marchand', id: m.id, piece: p.id, nom: p.id + '.pdf', type: 'application/pdf', taille: 1024, at: Date.now(), statut: 'deposee', motif: '', data: 'data:application/pdf;base64,JVBERi0=' })); } catch (e2) {}
      DOCS.statuer('marchand', m.id, p.id, 'validee', '', 'emilie.r', Object.keys(extra).length ? extra : null);
    });
    var e = DOCS.etat('marchand', m.id);
    try { w.dispatchEvent(new w.Event('pec-bus')); } catch (e3) {}   // l'écran repeint avec le dossier posé
    return { ok: e.etat === 'valide', etat: e, motif: e.etat === 'valide' ? '' : ((e.libelle || e.etat) + (e.manquantes && e.manquantes.length ? ' — manquantes : ' + e.manquantes.map(function (p) { return p.id; }).join(', ') : '')) };
  }

  /* ── (23/09, grossiste) UNE MARQUE PRÊTE À VENDRE — pour les AUDITS, qui n'ont pas les aides du runner ─────────────
     Inscription (dirigeant déclaré, déclaration cochée), validation, déclaration « réseau limité » statuée, documents consultés puis acceptés,
     dossier contrôlé au coffre, contrat-cadre signé par le dirigeant, offre de paiement et RIB ; un point sédentaire
     validé, sous mandat SEPA. Le SIRET cherche sa clé (_techSiretOk), comme le runner. Rend { ok, marchand, revendeur, motif }. */
  function marquePrete(w, o) {
    o = o || {};
    var D = donnees(w); if (!D || !D.techMarchandCreer) return { ok: false, motif: 'data-layer absent' };
    if (!w || !w.PEC_DOCS) return { ok: false, motif: 'cette fenêtre ne charge pas payencash-docs.js (le contrat-cadre exige le KYC du dirigeant)' };
    var siret = function (base) { for (var k = 0; k < 10; k++) { var c = base + k; if (D._techSiretOk(c)) return c; } return null; };
    /* (24/09) la déclaration « réseau limité » est le TEXTE TYPE du référentiel, coché (declarationAcceptee) ; le dirigeant porte
       sa civilité et sa date de naissance, comme l'exige l'inscription réelle */
    var rm = D.techMarchandCreer({ raisonSociale: o.raisonSociale || 'Boutique Audit', siret: siret(o.siretBase || '4048330480002'), siteUrl: o.siteUrl || 'https://boutique-audit.fr',
      email: o.email || 'hello@boutique-audit.fr', cgu: true, declarationAcceptee: true,
      dirigeant: { civilite: 'Monsieur', prenom: 'Audit', nom: 'S.', dateNaissance: '1980-05-12', lieuNaissance: 'Lyon', qualite: 'gérant' } });
    var ra = D.techRevendeurCreer({ raisonSociale: o.revendeur || 'Presse de l\'audit', siret: siret(o.siretRevendeur || '5521005540001'), email: 'contact@presse-audit.fr', cgu: true, mode: 'sedentaire', ville: 'Marseille', adresse: '31 cours Mirabeau' });
    if (!rm.ok || !ra.ok) return { ok: false, motif: [rm.motif, ra.motif].filter(Boolean).join(' · ') };
    ['pec-tech-marchands', 'pec-tech-revendeurs'].forEach(function (k) {
      try { var l = JSON.parse(w.localStorage.getItem(k) || '[]'); l.forEach(function (x) { if (x.statut === 'pending') x.statut = 'validated'; }); w.localStorage.setItem(k, JSON.stringify(l)); } catch (e) {}
    });
    var cnf = D.techConformiteMarchand(rm.marchand.id); if (cnf) D.techConformiteStatuer(cnf.id, true, '', 'audit');
    var docs = ((D.ref.documents || {}).marchand || []).map(function (d) { return d.cle; });
    docs.forEach(function (k) { D.documentConsulter('marchand', rm.marchand.id, k, 'audit'); });
    D.acceptationsPoser('marchand', rm.marchand.id, docs, 'audit');
    var pj = dossierMarquePret(w, rm.marchand.id, { dirigeant: 'Audit S.', signataire: 'Audit S.' }); if (!pj.ok) return { ok: false, motif: 'dossier : ' + pj.motif };
    var s = D.techMarchandContratSigner(rm.marchand.id, { accepte: true, par: 'audit' }); if (!s.ok) return { ok: false, motif: 'contrat-cadre : ' + (s.motif || '?') };
    D.techMarchandModeChoisir(rm.marchand.id, 'j1', 'audit');
    D.techMarchandFormuleChoisir(rm.marchand.id, 'illimite', 'audit');
    D.techMarchandRibEnregistrer(rm.marchand.id, { iban: 'FR7630004000031234567890143', bic: 'CMCIFR2A', titulaire: 'SAS BOUTIQUE AUDIT' }, 'audit');
    D.techSepaMandatSigner('revendeur', ra.revendeur.id, { iban: 'FR8430003035000500001234567', bic: 'CMCIFR2A', titulaire: 'SARL AUDIT', signature: true }, 'audit');
    var t = D.techMarchandPeutTravailler(rm.marchand.id);
    return { ok: !!t.ok, marchand: D.techMarchand(rm.marchand.id), revendeur: D.techRevendeur(ra.revendeur.id), motif: t.ok ? '' : t.manque.map(function (x) { return x.libelle; }).join(' · ') };
  }

  /* (24/09, nuit) L'ARDOISE PROPRE DES AUDITS — la règle du banc (clés `pec-` et `pec_bus_`) : un audit qui bâtit ses acteurs
     par-dessus un stockage laissé par une exécution interrompue échouait à sa préparation (« ce SIRET est déjà inscrit »).
     L'audit a pris son instantané au chargement ; il efface, prépare, mesure, puis restaure l'instantané. */
  function ardoise(w) {
    try { var ls = (w || window).localStorage; Object.keys(ls).filter(function (k) { return k.indexOf('pec_bus_') === 0 || k.indexOf('pec-') === 0; }).forEach(function (k) { ls.removeItem(k); }); } catch (e) {}
  }

  g.PEC_BANC = {
    ardoise: ardoise,
    bride: !tic,                                     // vrai = repli setTimeout, les attentes seront bridées
    sleep: function (ms) { return tic ? tic(ms) : new Promise(function (r) { setTimeout(r, ms); }); },
    pointPartenairePret: pointPartenairePret,   // (18/09 ; 23/09) le commerce partenaire, prêt à vendre les bons des marques — sans carte
    dossierMarquePret: dossierMarquePret,       // (23/09, soir) le dossier KYB d'une marque contrôlé au coffre — ce que techMarchandValider exige
    marquePrete: marquePrete,                   // (23/09, grossiste) une marque qui peut vendre, pour les audits
    simulerGeolocation: simulerGeolocation      // (19/09, soir) une position qui MARCHE, pour le module « Comment veux-tu payer ? »
  };
})(window);
