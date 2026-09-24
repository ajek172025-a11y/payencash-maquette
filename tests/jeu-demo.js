/* ══ PEC_JEU — LE JEU DE DÉMONSTRATION DU GROSSISTE (24/09) ═══════════════════════════════════════════════════════════
   Fondatrice, 24/09 (formulaire d'arbitrages, « Démonstration de Solution sans commerces fictifs ») : « Ajouter des commerces
   de démonstration ». Et la règle du dossier : zéro seed — rien n'existe tant que personne n'a fait le geste.
   Ce fichier fait les GESTES, par les fonctions réelles du data-layer, dans l'ordre réel, comme un manager, une marque, un
   commerce et un porteur les feraient : deux marques (inscrites, contrôlées, validées, contrat-cadre signé), deux commerces
   du réseau et un distributeur nomade (candidature, dossier, validation, contrat de distribution, mandat SEPA ou avance),
   des ventes de bons, l'arrêté de 20 h et sa remise, un retour de banque avec un impayé, un règlement à la marque, des liens
   de vente, des articles, une candidature en cours et un brouillon d'inscription pour la file du manager, des demandes et
   des appels pour la hotline. Rien ici n'écrit dans le stockage à la main, sauf ce que le banc écrit déjà de la même façon
   (les pièces du coffre, via PEC_BANC).
   Il se charge depuis une page qui porte le data-layer, le coffre, le bus et le socle Solution (ui/tech/01-connexion), et
   `PEC_JEU.porteur` se joue ensuite depuis une page de Mes bons (elle seule range un bon).
     PEC_JEU.monter(window, cb)   → { ok, fait: [...], refus: [...], ids }
     PEC_JEU.porteur(window)      → range les bons du porteur connecté, en utilise un sur un bon proposé
   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var J = {};
  function charger(w, src) {
    return new Promise(function (res, rej) {
      if (w.PEC_BANC) { res(); return; }
      var s = w.document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('impossible de charger ' + src)); };
      w.document.head.appendChild(s);
    });
  }
  function siretOk(D, base) { for (var k = 0; k < 10; k++) { var c = base + k; if (D._techSiretOk(c)) return c; } return null; }

  /* UNE MARQUE PRÊTE À VENDRE, par le parcours réel du 24/09 : son COMPTE d'abord (e-mail + mot de passe, adresse confirmée),
     puis les étapes de l'inscription, l'envoi, le contrôle du manager, le contrat-cadre — comme T.jeuDemo, sans la fiche de
     vente orpheline que marquePrete du banc crée. Le compte permet de se connecter à l'espace avec le trousseau de démo. */
  function marque(w, o) {
    var D = w.PEC_DATA, B = w.PEC_BANC;
    var deja = D.techMarchands({ brouillons: true }).filter(function (x) { return x.siteUrl === o.siteUrl; })[0];
    if (deja) {
      /* une marque déjà là mais née avant le 24/09 n'a pas répondu aux deux questions de TVA : on les pose (même geste que l'écran) */
      if (o.tva && !deja.tva) D.techMarchandEntrepriseSet(deja.id, { raisonSociale: deja.raisonSociale, siret: deja.siret, siteUrl: deja.siteUrl, sansSite: deja.sansSite, tel: deja.tel, formeJuridique: deja.formeJuridique, adresse: deja.adresse, naf: deja.naf, tauxUnique: o.tva.tauxUnique, franceSeule: o.tva.franceSeule }, o.email);
      if (!deja.beneficiaires) D.techMarchandBeneficiairesSet(deja.id, o.beneficiaires || { aucun: true, atteste: true }, o.email);
      if (o.categorie && !deja.categorie && D.techMarchandCategorieSet) D.techMarchandCategorieSet(deja.id, o.categorie, o.email);   // (24/09, nuit)
      if (D.techCleGenerer && D.techCleActive && !D.techCleActive(deja.id) && deja.statut === 'validated') D.techCleGenerer(deja.id, function () {});
      return { ok: true, marchand: D.techMarchand(deja.id) || deja, deja: true };
    }
    var cpt = D.compteParIdentifiant('marque', o.email);
    if (!cpt) {
      var cr = D.compteCreer('marque', { email: o.email, motdepasse: o.mdp, motdepasse2: o.mdp }); if (!cr.ok) return cr;
      cpt = cr.compte; var cv = D.compteVerifier(cpt.id, 'email', (cr.codes || {}).email); if (!cv.ok) return cv;
    }
    var m0 = D.techMarchandParCompte(cpt.id); if (!m0) return { ok: false, motif: 'la fiche de la marque n’est pas née avec son compte' };
    /* (24/09) la TVA des bons se qualifie par ce que la marque déclare (art. 256 ter CGI) : Lila un seul taux en France (BUU), Arlo plusieurs taux (BUM) */
    var e1 = D.techMarchandEntrepriseSet(m0.id, { raisonSociale: o.raisonSociale, siret: siretOk(D, o.siretBase), siteUrl: o.siteUrl, tel: o.tel || null, formeJuridique: o.forme || 'SAS',
      tauxUnique: o.tva ? o.tva.tauxUnique : null, franceSeule: o.tva ? o.tva.franceSeule : null, categorie: o.categorie || null }, o.email); if (!e1.ok) return e1;
    var e2 = D.techMarchandDirigeantSet(m0.id, o.dirigeant, o.email); if (!e2.ok) return e2;
    var eb = D.techMarchandBeneficiairesSet(m0.id, o.beneficiaires || { aucun: true, atteste: true }, o.email); if (!eb.ok) return eb;
    var e3 = D.techMarchandDeclarer(m0.id, { accepte: true }, o.email); if (!e3.ok) return e3;
    var e4 = D.techMarchandSoumettre(m0.id, o.email, { documentsPlusTard: true }); if (!e4.ok) return e4;
    var id = m0.id;
    try { var l = JSON.parse(w.localStorage.getItem('pec-tech-marchands') || '[]'); l.forEach(function (x) { if (x.id === id && x.statut === 'pending') x.statut = 'validated'; }); w.localStorage.setItem('pec-tech-marchands', JSON.stringify(l)); } catch (e) {}
    var cnf = D.techConformiteMarchand(id); if (cnf) D.techConformiteStatuer(cnf.id, true, '', 'emilie.r');
    var docs = ((D.ref.documents || {}).marchand || []).map(function (d) { return d.cle; });
    docs.forEach(function (k) { D.documentConsulter('marchand', id, k, o.email); });
    D.acceptationsPoser('marchand', id, docs, o.email);
    var pj = B.dossierMarquePret(w, id, { dirigeant: o.dirigeant.prenom + ' ' + o.dirigeant.nom, signataire: o.dirigeant.prenom + ' ' + o.dirigeant.nom });
    if (!pj.ok) return { ok: false, motif: 'dossier : ' + pj.motif };
    var s = D.techMarchandContratSigner(id, { accepte: true, par: o.email }); if (!s.ok) return { ok: false, motif: 'contrat-cadre : ' + s.motif };
    D.techMarchandModeChoisir(id, o.mode || 'j1', o.email);
    D.techMarchandFormuleChoisir(id, o.formule || 'illimite', o.email);
    D.techMarchandRibEnregistrer(id, { iban: o.iban, bic: 'CMCIFR2A', titulaire: o.raisonSociale.toUpperCase() }, o.email);
    var t = D.techMarchandPeutTravailler(id);
    /* (24/09) LA CLÉ D'API de la marque : la démonstration du bouton (tech/04) la lit du compte — sans clé, elle le dit et n'affiche rien */
    if (t.ok && D.techCleGenerer && !D.techCleActive(id)) D.techCleGenerer(id, function () {});
    return { ok: !!t.ok, marchand: D.techMarchand(id), motif: t.ok ? '' : t.manque.map(function (x) { return x.libelle; }).join(' · ') };
  }

  /* UNE CANDIDATURE DE PARTENAIRE ENVOYÉE, PAS ENCORE VALIDÉE — pour la file du manager (protocole par étapes du 24/09).
     Les pièces passent par le VRAI dépôt du coffre (PEC_DOCS.deposer, un fichier par pièce, la carte d'identité avec ses
     deux faces dans un seul fichier) : c'est ce que l'écran fait, et c'est ce que la candidature relit. Rend une promesse. */
  var CANDIDATE = { email: 'contact@presse-plaine.fr', mdp: 'Plaine!2026xx', siretBase: '3801298660002', raisonSociale: 'Presse de la Plaine SARL', enseigne: 'Presse de la Plaine', tel: '04 91 47 20 11', adresse: '18 rue des Trois Mages', cp: '13006', ville: 'Marseille',
    gerant: { civilite: 'Madame', prenom: 'Sonia', nom: 'Rahmani', dateNaissance: '1985-07-22', lieuNaissance: 'Marseille', qualite: 'gérante' } };
  J.candidature = function (w, o) {
    o = o || CANDIDATE;
    var D = w.PEC_DATA, DOCS = w.PEC_DOCS;
    var fichier = function (nom, type) { return new w.File([new w.Blob([type === 'video/webm' ? new Uint8Array(64) : '%PDF-1.4 demonstration ' + nom], { type: type })], nom, { type: type }); };
    return new Promise(function (res) {
      var c0 = D.compteParIdentifiant('partenaire', o.email);
      if (c0 && c0.profil && c0.profil.candidatureEnvoyeeLe) { res({ ok: true, deja: true }); return; }
      var c = c0;
      if (!c) {
        var r = D.compteCreer('partenaire', { email: o.email, motdepasse: o.mdp, motdepasse2: o.mdp, etapes: true }); if (!r.ok) { res(r); return; }
        c = r.compte; var v = D.compteVerifier(c.id, 'email', (r.codes || D.compteCodes(c)).email); if (!v.ok) { res(v); return; }
      }
      var a = D.partenaireActiviteSet(c.id, { mode: 'sedentaire', siret: siretOk(D, o.siretBase), raisonSociale: o.raisonSociale, enseigne: o.enseigne, tel: o.tel, adresse: o.adresse, cp: o.cp, ville: o.ville, formeJuridique: 'SARL' }); if (!a.ok) { res(a); return; }
      var g2 = D.partenaireGerantSet(c.id, o.gerant); if (!g2.ok) { res(g2); return; }
      var b2 = D.partenaireBeneficiairesSet(c.id, { personnes: [{ civilite: o.gerant.civilite, prenom: o.gerant.prenom, nom: o.gerant.nom, dateNaissance: o.gerant.dateNaissance, nationalite: 'Française', part: 100 }], atteste: true }); if (!b2.ok) { res(b2); return; }
      var pieces = DOCS.piecesDe('partenaire').filter(function (p) { return p.obligatoire && !p.genere; });
      var suite = Promise.resolve();
      pieces.forEach(function (p) {
        suite = suite.then(function () {
          var f = fichier(p.id + (p.video ? '.webm' : '.pdf'), p.video ? 'video/webm' : 'application/pdf');
          var meta = p.id === 'cni' ? { typePiece: 'cni', expireLe: '2031-06-30', deuxFaces: true } : (p.expire ? { expiresOn: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10) } : null);
          return DOCS.deposer('partenaire', c.id, p.id, f, meta);
        });
      });
      suite.then(function () {
        var docs = ((D.ref.documents || {}).partenaire || []).map(function (d) { return d.cle; });
        docs.forEach(function (k) { D.documentConsulter('partenaire', o.email, k, o.email); });
        D.acceptationsPoser('partenaire', o.email, docs, o.email);
        res(D.partenaireCandidatureEnvoyer(c.id, o.email));
      }, function (e) { res({ ok: false, motif: 'dépôt : ' + (e && e.message) }); });
    });
  };

  /* LES POINTS DU RÉSEAU DE DÉMONSTRATION — deux commerces et un distributeur nomade ; le trousseau (J.trousseau) les relit */
  var POINTS = [
    { enseigne: 'Tabac de la Gare', form: { identifiant: 'tabac.gare', email: 'contact@tabacdelagare.fr', adresse: '12 boulevard National', cp: '13003', ville: 'Marseille', tel: '04 91 62 10 20', responsable: 'Nadia Benali', motdepasse: 'Tabac!2026xx', motdepasse2: 'Tabac!2026xx' } },
    { enseigne: 'Presse du Vieux-Port', form: { identifiant: 'presse.vieuxport', email: 'presse.vieuxport@orange.fr', adresse: '3 quai des Belges', cp: '13001', ville: 'Marseille', tel: '04 91 54 33 08', responsable: 'Marc Ferrandi', motdepasse: 'Presse!2026xx', motdepasse2: 'Presse!2026xx' } },
    { enseigne: 'Karim D.', form: { identifiant: 'karim.d', email: 'karim.d@gmail.com', mode: 'mobile', ville: 'Marseille', tel: '06 52 14 78 90', responsable: 'Karim Daoudi', motdepasse: 'Nomade!2026xx', motdepasse2: 'Nomade!2026xx' } },
    /* (24/09, nuit — fondatrice : « libre concurrence entre les distributeurs nomades ») deux autres nomades, chacun sa politique de prix */
    { enseigne: 'Sofiane B.', form: { identifiant: 'sofiane.b', email: 'sofiane.b@gmail.com', mode: 'mobile', ville: 'Marseille', tel: '06 47 25 81 36', responsable: 'Sofiane Brahimi', motdepasse: 'Sofiane!2026x', motdepasse2: 'Sofiane!2026x' } },
    { enseigne: 'Léa R.', form: { identifiant: 'lea.r', email: 'lea.r@gmail.com', mode: 'mobile', ville: 'Aubagne', tel: '06 33 18 72 45', responsable: 'Léa Roussel', motdepasse: 'LeaNomade!2026', motdepasse2: 'LeaNomade!2026' } },
    /* (24/09, nuit — fondatrice : « crée des nomades dans la base pour afficher des données, en respectant un process complet ») trois
       de plus, nés comme les autres : compte, dossier, validation, contrat signé, activation, garantie et avance (pointPartenairePret) */
    { enseigne: 'Mehdi A.', form: { identifiant: 'mehdi.a', email: 'mehdi.a@gmail.com', mode: 'mobile', ville: 'Marseille', tel: '06 58 41 27 93', responsable: 'Mehdi Amrani', motdepasse: 'MehdiNomade!26', motdepasse2: 'MehdiNomade!26' } },
    { enseigne: 'Nadia K.', form: { identifiant: 'nadia.k', email: 'nadia.k@gmail.com', mode: 'mobile', ville: 'Aix-en-Provence', tel: '06 72 90 14 38', responsable: 'Nadia Khelifi', motdepasse: 'NadiaNomade!26', motdepasse2: 'NadiaNomade!26' } },
    { enseigne: 'Julie P.', form: { identifiant: 'julie.p', email: 'julie.p@gmail.com', mode: 'mobile', ville: 'Marignane', tel: '06 24 66 51 07', responsable: 'Julie Perrin', motdepasse: 'JulieNomade!26', motdepasse2: 'JulieNomade!26' } }
  ];
  /* (24/09, nuit — fondatrice : « chaque distributeur nomade affiche son propre prix de déplacement : de 0 à 1 km un prix, etc., jusqu'à
     20 ») LEUR DÉPLACEMENT, posé par chacun comme dans Mon point (partenaireDeplacementSet) : son départ, SES prix par palier. Karim part
     du centre de Marseille ; Sofiane de sa position exacte (Castellane) et ne va pas au-delà de 5 km ; Léa d'Aubagne, jusqu'à 20 km. */
  /* (24/09, nuit — « uniquement les distributeurs qui sont disponibles ») `disponible` : allumé par chacun depuis son accueil ; Julie ne
     l'est pas — elle n'apparaît donc sur aucune carte, même à portée. Mehdi part de la Joliette ; Nadia d'Aix (hors du secteur du
     Vieux-Port) ; Julie de Marignane. */
  var DEPLACEMENTS = {
    'karim.d':   { depart: { ville: 'Marseille' }, paliers: { 1: '3', 3: '5', 5: '7', 10: '10', 15: '13' }, mention: 'je viens en scooter', disponible: true },
    'sofiane.b': { depart: { ville: 'Marseille', geo: { lat: 43.2856, lng: 5.3838 } }, paliers: { 1: '2', 3: '4', 5: '6' }, disponible: true },
    'lea.r':     { depart: { ville: 'Aubagne' }, paliers: { 1: '0', 3: '3', 5: '5', 10: '8', 15: '11', 20: '14' }, mention: 'offert dans Aubagne centre', disponible: true },
    'mehdi.a':   { depart: { ville: 'Marseille', geo: { lat: 43.3048, lng: 5.3665 } }, paliers: { 1: '4', 3: '4', 5: '5', 10: '6', 15: '8', 20: '10' }, mention: 'même prix jusqu’à 3 km', disponible: true },
    'nadia.k':   { depart: { ville: 'Aix-en-Provence' }, paliers: { 1: '3', 3: '4', 5: '6', 10: '9' }, disponible: true },
    'julie.p':   { depart: { ville: 'Marignane' }, paliers: { 1: '2', 3: '3', 5: '5', 10: '7', 15: '9', 20: '12' }, disponible: false }
  };
  /* (24/09, nuit — fondatrice : « un partenaire du réseau, sauf micro, peut ajouter un collaborateur » ; « une marque peut également
     ajouter une session collaborateur ») LES ÉQUIPES DE DÉMONSTRATION : une collaboratrice au comptoir du Tabac de la Gare, un
     collaborateur chez Boutique Lila. Ils naissent par les vrais gestes : le titulaire ajoute, envoie l'accès, la personne crée son
     mot de passe depuis le lien. `parent` : l'identifiant du compte titulaire (le point) ou « marque1 » (la marque du trousseau). */
  var EQUIPES = [
    { type: 'point', parent: 'tabac.gare', prenom: 'Sofia', nom: 'Amrani', tel: '0698765432', motdepasse: 'Sofia!2026xx' },
    { type: 'marque', parent: 'marque1', prenom: 'Hugo', nom: 'Lemaire', tel: '0687654321', motdepasse: 'Hugo!2026xxx' }
  ];
  J.monter = function (w, cb) {
    cb = cb || function () {};
    var D = w.PEC_DATA, B = w.PEC_BUS, fait = [], refus = [], ids = {};
    if (!D || !w.PEC_DOCS || !B) { cb({ ok: false, motif: 'Cette page ne charge pas le data-layer, le coffre et le bus.' }); return; }
    charger(w, '../../tests/outils-banc.js').then(function () {
      var K = w.PEC_BANC;
      /* ① LES MARQUES */
      var TR = (D.comptesDemo || []).filter(function (c) { return /Solution/i.test(c.espace || ''); })[0] || {};
      var m1 = marque(w, { raisonSociale: 'Boutique Lila', categorie: 'mode', siteUrl: 'https://boutique-lila.fr', email: TR.identifiant || 'hello@boutique-lila.fr', mdp: TR.motdepasse || 'Solution!2026', tva: { tauxUnique: true, franceSeule: true }, tel: '04 91 33 20 10', siretBase: '4048330480002', iban: 'FR7630004000031234567890143',
        dirigeant: { civilite: 'Madame', prenom: 'Lila', nom: 'Benali', dateNaissance: '1988-03-14', lieuNaissance: 'Marseille', qualite: 'présidente' },
        beneficiaires: { personnes: [{ civilite: 'Madame', prenom: 'Lila', nom: 'Benali', dateNaissance: '1988-03-14', nationalite: 'Française', part: 60 }, { civilite: 'Monsieur', prenom: 'Samir', nom: 'Benali', dateNaissance: '1985-09-02', nationalite: 'Française', part: 40 }], atteste: true } });
      var m2 = marque(w, { raisonSociale: 'Maison Arlo', categorie: 'maison', siteUrl: 'https://maison-arlo.fr', email: 'bonjour@maison-arlo.fr', mdp: 'Arlo!2026xx', tva: { tauxUnique: false, franceSeule: true }, forme: 'SARL', siretBase: '8123456780001', iban: 'FR1420041010050500013M02606', mode: 'j7', formule: 'cinquante',
        dirigeant: { civilite: 'Monsieur', prenom: 'Arlo', nom: 'Vidal', dateNaissance: '1979-11-02', lieuNaissance: 'Aix-en-Provence', qualite: 'gérant' } });
      /* (24/09, nuit — fondatrice : « ajoute à Bon d'achat les marques compagnie aérienne, revendeur de billets d'avion ») DEUX MARQUES DU
         VOYAGE : une compagnie aérienne (sa boutique en ligne comprise dans l'abonnement) et un revendeur de billets (son propre site) */
      var m3 = marque(w, { raisonSociale: 'Azur Ailes', categorie: 'aerien', siteUrl: 'https://azur-ailes.fr', email: 'contact@azur-ailes.fr', mdp: 'Azur!2026xxx', tva: { tauxUnique: true, franceSeule: false }, forme: 'SAS', siretBase: '5321654980002', iban: 'FR7610278089000002052760112', mode: 'j1', formule: 'illimite',
        dirigeant: { civilite: 'Madame', prenom: 'Nora', nom: 'Belkacem', dateNaissance: '1982-06-18', lieuNaissance: 'Marseille', qualite: 'présidente' } });
      var m4 = marque(w, { raisonSociale: 'Billets Soleil', categorie: 'billets-avion', siteUrl: 'https://billets-soleil.fr', email: 'bonjour@billets-soleil.fr', mdp: 'Soleil!2026x', tva: { tauxUnique: false, franceSeule: false }, forme: 'SARL', siretBase: '4412398760005', iban: 'FR7630003012340005041855296', mode: 'j7', formule: 'cinquante',
        dirigeant: { civilite: 'Monsieur', prenom: 'Karim', nom: 'Haddad', dateNaissance: '1976-02-09', lieuNaissance: 'Lyon', qualite: 'gérant' } });
      [m1, m2, m3, m4].forEach(function (m, i) { if (m.ok) { fait.push('marque ' + m.marchand.raisonSociale + (m.deja ? ' (déjà là)' : ' prête')); ids['marque' + (i + 1)] = m.marchand.id; } else refus.push('marque ' + (i + 1) + ' : ' + m.motif); });
      /* (24/09, nuit — fondatrice : « ça doit provenir du site de l'abonnement, il sera connecté ») LA VITRINE DE LEUR SITE, posée par le
         geste de Compte › Abonnement (techMarchandSiteSet) : la boutique de Mes bons reprend sa couleur, son accroche et son domaine */
      [[m1, { domaine: 'boutique-lila.fr', accroche: 'Des pièces choisies avec soin, à s’offrir ou à offrir.', couleur: '#7A3E48' }],
       [m3, { domaine: 'azur-ailes.fr', accroche: 'Nos vols au départ de Marseille, à offrir en bon d’achat.', couleur: '#0B4F8A' }]].forEach(function (x) {
        if (!x[0].ok || (D.techMarchandSite(x[0].marchand.id) || {}).couleur) return;
        var s = D.techMarchandSiteSet(x[0].marchand.id, x[1], x[0].marchand.email || 'demo');
        if (s.ok) fait.push('vitrine du site ' + x[0].marchand.raisonSociale); else refus.push('vitrine ' + x[0].marchand.raisonSociale + ' : ' + s.motif);
      });
      if (!m1.ok) { cb({ ok: false, fait: fait, refus: refus }); return; }
      var M1 = m1.marchand.id, M2 = m2.ok ? m2.marchand.id : null;
      /* ② LES COMMERCES ET LE NOMADE, nés de leur inscription (fixture réelle du banc : compte → dossier → validation → contrat → activation) */
      var pts = POINTS;
      var P = [];
      pts.forEach(function (p) {
        var c0 = D.compteParIdentifiant('partenaire', p.form.identifiant);
        if (c0 && c0.refId) { P.push({ ok: true, pointId: c0.refId, identifiant: p.form.identifiant, deja: true }); fait.push(p.enseigne + ' (déjà là)'); return; }
        var r = K.pointPartenairePret(w, { enseigne: p.enseigne, form: p.form });
        if (r.ok) { P.push(r); fait.push(p.enseigne + ' actif' + (p.form.mode === 'mobile' ? ' (nomade)' : '')); } else { refus.push(p.enseigne + ' : ' + r.etape + ' — ' + r.motif); P.push({ ok: false }); }
      });
      /* (24/09, nuit) LE DÉPLACEMENT DES DISTRIBUTEURS NOMADES — le geste de Mon point, rejoué pour chacun ; un déplacement déjà posé reste */
      POINTS.forEach(function (pt, i) {
        var dp = DEPLACEMENTS[pt.form.identifiant]; if (!dp || !P[i] || !P[i].ok) return;
        var cur = D.partenaireDeplacement(P[i].pointId);
        if (!(cur && cur.pret)) {
          var z = D.partenaireDeplacementSet(P[i].pointId, dp, pt.form.identifiant);
          if (z.ok) fait.push('déplacement de ' + pt.enseigne + ' — ' + D.partenaireTarifLbl(D.partenaire(P[i].pointId))); else { refus.push('déplacement de ' + pt.enseigne + ' : ' + z.motif); return; }
        }
        /* SA DISPONIBILITÉ, allumée (ou non) par lui depuis son accueil — rejouée seulement si elle n'est pas déjà dans l'état voulu */
        if (!!dp.disponible !== D.partenaireDisponible(P[i].pointId)) {
          var dz = D.partenaireDisponibiliteSet(P[i].pointId, !!dp.disponible, pt.form.identifiant);
          if (dz.ok) fait.push(pt.enseigne + (dp.disponible ? ' disponible' : ' indisponible')); else refus.push('disponibilité de ' + pt.enseigne + ' : ' + dz.motif);
        }
      });
      ids.points = P.map(function (x) { return x.pointId; });
      var RV = P.map(function (x) { return x.ok ? D.techRevendeurDuPoint(x.pointId) : null; });
      /* ③ LES VENTES — ce que les commerces vendent au comptoir, ce que le nomade vend en rencontre */
      D.parametreSet('tech.paiement.ics', 'FR12ZZZ123456', 'emilie.r'); D.parametreSet('tech.paiement.iban', 'FR7630004000031234567890143', 'emilie.r'); D.parametreSet('tech.paiement.bic', 'CMCIFR2A', 'emilie.r');
      var ventes = [[0, M1, 50], [0, M1, 30], [0, M2, 80], [1, M1, 100], [1, M2, 40], [2, M1, 25], [2, M1, 60], [0, M1, 20]], bons = [];
      /* (24/09, soir) LE JEU SE REJOUE SANS DOUBLON : des ventes déjà faites par ces points disent que la journée de démonstration
         a eu lieu — on ne revend pas (la presse, suspendue par son impayé, refuserait à juste titre), on reprend ses bons. */
      var dejaVendus = [];
      RV.forEach(function (rv) { if (rv) D.techBons({ revendeurId: rv.id }).forEach(function (x) { if (x.etat !== 'annule' && x.code) dejaVendus.push(x.code); }); });
      if (dejaVendus.length) { ids.bons = dejaVendus; fait.push(dejaVendus.length + ' bons déjà vendus (journée de démonstration déjà jouée)'); }
      else ventes.forEach(function (v) {
        var rv = RV[v[0]]; if (!rv || !v[1]) return;
        var e = D.techBonEmettre({ marchandId: v[1], revendeurId: rv.id, montant: v[2], par: P[v[0]].identifiant });
        if (!e.ok) { refus.push('vente ' + v[2] + ' € (' + pts[v[0]].enseigne + ') : ' + e.motif); return; }
        D.techBonVendu(e.bon.code, { par: P[v[0]].identifiant }); bons.push(e.bon.code);
      });
      if (!dejaVendus.length) { fait.push(bons.length + ' bons vendus'); ids.bons = bons; }
      /* ④ L'ARRÊTÉ DE 20 H, LA REMISE, LE DÉPÔT, LE RETOUR DE LA BANQUE (un impayé chez la presse).
         (24/09, soir — décision fondatrice : « bloqué immédiatement, le manager suit et doit appeler, le manager valide la demande
         de nouveau prélèvement ») LA REPRÉSENTATION N'EST PLUS JOUÉE ICI : l'impayé reste ouvert, pour que le manager voie le
         parcours réel — l'alerte, l'appel à noter, puis la représentation (Prélèvements & paiements). */
      var apres = D.techDernierArrete(Date.now() + 86400000) + 60000;
      var rem = dejaVendus.length ? { ok: false, deja: true } : D.techRemisePreparer({ modeId: 'j1', par: 'emilie.r', now: apres });
      if (rem.ok) {
        D.techRemiseDeposer(rem.remise.reference, 'emilie.r'); fait.push('remise ' + rem.remise.reference + ' déposée');
        var rvP = RV[1]; if (rvP) {
          var e2e = rem.remise.reference + '/' + rvP.id;
          var xml = '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.002.001.03"><CstmrPmtStsRpt><OrgnlPmtInfAndSts><TxInfAndSts><OrgnlEndToEndId>' + e2e + '</OrgnlEndToEndId><TxSts>RJCT</TxSts><StsRsnInf><Rsn><Cd>AM04</Cd></Rsn></StsRsnInf></TxInfAndSts></OrgnlPmtInfAndSts></CstmrPmtStsRpt></Document>';
          var imp = D.techRetourImporter(rem.remise.reference, xml, 'emilie.r'); if (imp.ok) fait.push('retour de banque : 1 impayé (Presse du Vieux-Port) — à appeler, puis à représenter'); else refus.push('retour : ' + imp.motif);
        }
      } else if (!rem.deja) refus.push('remise : ' + rem.motif);
      /* la marque est payée à l'échéance de son offre, jamais avant : une échéance à venir est un fait du jeu, pas un échec */
      var reg = D.techReglementEmettre(M1, { par: 'emilie.r' });
      if (reg.ok) fait.push('règlement émis à Boutique Lila'); else if (reg.refus === 'echeance') fait.push('règlement de Boutique Lila : ' + reg.motif); else refus.push('règlement : ' + reg.motif);
      /* ⑤ CE QUE LA MARQUE FAIT DANS SON ESPACE : des articles, un lien de vente public, deux bons proposés */
      if (!D.techArticles({ marchandId: M1 }).length) {
        /* (24/09, nuit) LA PHOTO SE CHOISIT PAR LE RÉFÉRENTIEL DES PHOTOS (photosParType, puis la famille du rayon) : « FEM »/« robe » n'y
           étaient pas, et les trois articles tombaient sur la famille par défaut — une robe et des sneakers photographiées en sac à main */
        [['Robe en lin Ava', 89, 15, 'Robes', [['S', 3], ['M', 5], ['L', 2]], 'pap', 'Robes'], ['Chemise Oscar', 69, 0, 'Chemises', [['M', 4], ['L', 4]], 'pap', 'Chemises & blouses'], ['Sneakers Lune', 119, 20, 'Sneakers', [['38', 2], ['39', 3], ['41', 1]], 'sneakers', 'Lifestyle']].forEach(function (a, i) {
          var ph = D.photoArticle ? D.photoArticle(a[5], a[6], 'demo' + i) : '';
          var r = D.techArticleCreer({ marchandId: M1, modele: a[0], prix: a[1], remise: a[2], categorie: a[3], tailles: a[4].map(function (t) { return { taille: t[0], qte: t[1] }; }), photos: ph ? [ph] : [], par: 'hello@boutique-lila.fr' });
          if (!r.ok) refus.push('article ' + a[0] + ' : ' + r.motif);
        });
        fait.push('3 articles publiés (Boutique Lila)');
      }
      if (!D.techLiensGet().filter(function (x) { return x.marchandId === M1; }).length) {
        var l1 = D.techLienCreer({ marchandId: M1, montant: 30, par: 'hello@boutique-lila.fr' }); if (l1.ok) { ids.lien = l1.lien.slug; fait.push('bon proposé ' + l1.lien.slug); } else refus.push('bon proposé : ' + l1.motif);
        var l2 = D.techLienCreer({ marchandId: M1, montant: 15, par: 'hello@boutique-lila.fr' }); if (!l2.ok) refus.push('bon proposé 2 : ' + l2.motif);
      }
      if (D.techVenteLienCreer && !(D.techVenteLien && D.techVenteLien(M1))) { var vl = D.techVenteLienCreer(M1, 'hello@boutique-lila.fr'); if (vl && vl.ok) fait.push('lien de vente public créé'); }
      /* ⑤bis LES ÉQUIPES — le titulaire ajoute et envoie l'accès ; la personne crée son mot de passe depuis le lien reçu ; puis chacun
         travaille : Sofia vend au comptoir du Tabac de la Gare — dont le bon qu'Hugo a proposé pour Boutique Lila. Rejoué, rien ne double. */
      var equipe = function (e) {
        var parentId = e.type === 'point' ? ((D.compteParIdentifiant('partenaire', e.parent) || {}).refId || null) : M1;
        var par = e.type === 'point' ? e.parent : (TR.identifiant || 'hello@boutique-lila.fr');
        if (!parentId) { refus.push('équipe ' + e.prenom + ' : titulaire absent'); return null; }
        var deja = D.collaborateurs(e.type, parentId).filter(function (x) { return x.tel === e.tel && x.statut !== 'clos'; })[0];
        if (deja) { fait.push(e.prenom + ' (déjà dans l’équipe)'); return D.compte(deja.id); }
        var a = D.collaborateurAjouter(e.type, parentId, { prenom: e.prenom, nom: e.nom, tel: e.tel }, par);
        if (!a.ok) { refus.push('équipe ' + e.prenom + ' : ' + a.motif); return null; }
        D.collaborateurPartageNoter(a.compte.id, 'sms', par);
        var ac = D.collaborateurActiver(a.jeton, e.motdepasse, e.motdepasse);
        if (!ac.ok) { refus.push('équipe ' + e.prenom + ' : ' + ac.motif); return null; }
        fait.push(e.prenom + ' ' + e.nom.charAt(0) + '. ' + (e.type === 'point' ? 'au comptoir du Tabac de la Gare' : 'dans l’équipe de Boutique Lila') + ' (' + ac.compte.identifiant + ')');
        return ac.compte;
      };
      var hugo = equipe(EQUIPES[1]), sofia = equipe(EQUIPES[0]);
      if (hugo && !D.techLiens({ marchandId: M1, collaborateur: hugo.id }).length) {
        D.techVenteLienCreer(M1, hugo.identifiant, { collaborateur: hugo.id });
        var ph = D.techLienCreer({ marchandId: M1, montant: 45, client: 'Mme Roux', reference: 'Devis 2026-118', collaborateur: hugo.id, par: hugo.identifiant });
        if (ph.ok && sofia && RV[0]) {
          var vs = D.techBonEmettre({ marchandId: M1, revendeurId: RV[0].id, montant: 45, moyen: 'carte', par: sofia.identifiant, ordre: ph.lien.slug });
          if (vs.ok) { D.techBonVendu(vs.bon.code, { par: sofia.identifiant }); fait.push('Sofia vend le bon proposé par Hugo (' + ph.lien.code + ')'); } else refus.push('vente de Sofia : ' + vs.motif);
        } else if (!ph.ok) refus.push('bon proposé d’Hugo : ' + ph.motif);
      }
      /* ⑥ LA FILE DU MANAGER : une candidature de commerce envoyée (promesse, à la fin), un brouillon d'inscription de marque */
      if (!D.compteParIdentifiant('marque', 'contact@atelier-nino.fr')) {
        var br = D.compteCreer('marque', { email: 'contact@atelier-nino.fr', motdepasse: 'Nino!2026xx', motdepasse2: 'Nino!2026xx' });
        if (br.ok) { D.compteVerifier(br.compte.id, 'email', (br.codes || {}).email); var mb = D.techMarchandParCompte(br.compte.id); if (mb) { D.techMarchandEntrepriseSet(mb.id, { raisonSociale: 'Atelier Nino', siret: siretOk(D, '9012345670001'), siteUrl: 'atelier-nino.fr' }, mb.id); fait.push('brouillon Atelier Nino (à l’étape dirigeant)'); } }
      }
      /* ⑦ LES PORTEURS — deux comptes Mes bons ; Inès garde la session (PEC_JEU.porteur range ses bons depuis l'app) */
      var por = [];
      PORTEURS.forEach(function (p) {
        var c = D.compteParIdentifiant('client', p[2]), mdp = MDP_PORTEUR;
        if (!c) { var r = D.compteCreer('client', { prenom: p[0], nom: p[1], tel: p[2], email: p[3], motdepasse: mdp }); if (!r.ok) { refus.push('porteur ' + p[0] + ' : ' + r.motif); return; } c = r.compte; var codes = r.codes || D.compteCodes(c); ((D.ESPACES_COMPTE.client || {}).verifs || []).forEach(function (v) { D.compteVerifier(c.id, v, codes[v]); }); }
        var cx = D.compteConnecter('client', p[2], mdp); if (!cx.ok) { refus.push('connexion ' + p[0] + ' : ' + cx.motif); return; }
        try { if (D.compteVerifSet && cx.compte && cx.compte.verifs) { D.compteVerifSet('sms', !!cx.compte.verifs.sms); D.compteVerifSet('mail', !!cx.compte.verifs.email); } } catch (e) {}
        por.push({ nom: p[0] + ' ' + p[1].charAt(0) + '.', clientId: D.clientActifGet(), tel: p[2] });
      });
      ids.porteurs = por; fait.push(por.length + ' porteurs (Inès reste connectée)');
      /* ⑦bis (24/09, nuit — fondatrice : « jeu de rôle : qui fait quoi à quel moment ») UNE MISE EN RELATION JOUÉE DE BOUT EN BOUT :
         Yanis, au Vieux-Port, choisit sur la carte le distributeur nomade le moins cher pour sa distance ; celui-ci est prévenu, l'appelle,
         valide le rendez-vous, vient, lui vend un bon Boutique Lila de 40 €, et Yanis le note. Et une demande qui attend encore son
         appel, faite sans compte : Farid, cours Julien, a choisi Sofiane B. (elle expire si personne n'appelle). Rejoué, rien ne double. */
      var VIEUX_PORT = { lat: 43.2951, lng: 5.3740 }, COURS_JULIEN = { lat: 43.2941, lng: 5.3836 };
      var accord = function (qui, tel) { return 'J’accepte que ' + qui + ' m’appelle au ' + D.telFrLbl(tel) + ' pour convenir de ce rendez-vous. Mon numéro ne lui sert qu’à cela, et s’efface quand la demande se ferme.'; };
      if (por[0] && !D.techRencontresClient({ clientId: por[0].clientId }).length) {
        var offres = D.nomadesAutour({ pos: VIEUX_PORT }).sort(function (a, b) { return (a.tarif - b.tarif) || (a.distM - b.distM); });
        var ch = offres[0];
        if (!ch) refus.push('mise en relation : aucun distributeur nomade ne vient jusqu’au Vieux-Port');
        else {
          var dm = D.techMiseEnRelationDemander({ partenaireId: ch.id, pos: VIEUX_PORT, lieu: 'Quai du Port, Marseille', ville: 'Marseille', clientId: por[0].clientId,
            prenom: 'Yanis', tel: por[0].tel, marchandId: M1, montant: '40', consentement: accord(ch.enseigne, por[0].tel) });
          var vd = dm.ok ? D.techRencontreValider(dm.rencontre.id, ch.revendeurId, { appele: true, heure: 'dans 20 min' }) : dm;
          var sv = vd.ok ? D.techRencontreServir(dm.rencontre.id, { revendeurId: ch.revendeurId, prixRecu: true, moyen: 'especes', par: ch.enseigne }) : vd;
          var nt = sv.ok ? D.distributeurNoter(dm.rencontre.id, 5, { commentaire: 'À l’heure, et le bon tout de suite.', par: por[0].clientId }) : sv;
          if (nt.ok) fait.push('mise en relation jouée : Yanis → ' + ch.enseigne + ' (' + ch.tarifTxt + ', ' + ch.distTxt + ') — appel, rendez-vous validé, bon de 40 € vendu, noté 5/5');
          else refus.push('mise en relation : ' + nt.motif);
        }
      }
      var cSof = D.compteParIdentifiant('partenaire', 'sofiane.b'), sofId = cSof ? cSof.refId : null;
      if (sofId && !D.techRencontresGet().some(function (r) { return r.origine === 'carte' && r.partenaireId === sofId; })) {
        var dF = D.techMiseEnRelationDemander({ partenaireId: sofId, pos: COURS_JULIEN, lieu: 'Cours Julien, Marseille', ville: 'Marseille', prenom: 'Farid',
          tel: '06 11 22 33 44', consentement: accord('Sofiane B.', '06 11 22 33 44') });
        if (dF.ok) fait.push('Farid attend l’appel de Sofiane B. (' + dF.rencontre.ref + ')'); else refus.push('demande de Farid : ' + dF.motif);
      }
      /* ⑧ LA HOTLINE : une réclamation, un rappel demandé puis passé, un appel entrant, un questionnaire */
      var R = D.ref.hotline || {};
      if (por[0] && !B.demandesSav().length) {
        var d1 = B.ouvrirDemande({ type: 'reclamation', ref: bons[0] || 'PEC-DEMO', client: por[0].nom, clientId: por[0].clientId, sujet: 'Bon refusé à la caisse du site', echanges: [{ qui: 'moi', texte: 'Le site de la marque dit que mon code n’est pas valable.' }] });
        B.repondreDemande(d1.id, 'Bonjour Yanis, je vérifie ton bon avec la marque et je reviens vers toi sous 48 h.', 'Naïma');
        var a1 = B.demanderAppel({ type: 'rappel', ref: bons[0] || 'PEC-DEMO', client: por[0].nom, clientId: por[0].clientId, canal: 'formulaire', tel: por[0].tel });
        B.traiterAppel(a1.id, { par: 'Naïma', compteRendu: 'Client rassuré : le bon est bien valable, la marque avait un souci de caisse.' });
        D.satisfactionDemander({ appelId: a1.id, ref: bons[0] || 'PEC-DEMO', client: por[0].nom, clientId: por[0].clientId, tel: por[0].tel }, 'Naïma');
        B.demanderAppel({ type: 'entrant', canal: '0805', client: 'Farid B.', tel: '06 11 22 33 44', motif: 'Où acheter un bon Boutique Lila ?', compteRendu: 'Orienté vers la carte de Mes bons : Tabac de la Gare, à 400 m.', hote: 'Karim' });
        if (por[1]) B.demanderAppel({ type: 'rappel', ref: bons[1] || 'PEC-DEMO', client: por[1].nom, clientId: por[1].clientId, canal: 'formulaire', tel: por[1].tel });
        fait.push('hotline : 1 réclamation, 2 rappels, 1 appel entrant, 1 questionnaire');
      }
      return J.candidature(w).then(function (cd) {
        if (cd.ok) fait.push('candidature Presse de la Plaine envoyée' + (cd.deja ? ' (déjà là)' : '')); else refus.push('candidature : ' + cd.motif);
        try { w.dispatchEvent(new w.Event('pec-bus')); } catch (e) {}
        cb({ ok: !refus.length, fait: fait, refus: refus, ids: ids });
      });
    }).catch(function (e) { cb({ ok: false, motif: e && e.message, fait: fait, refus: refus }); });
  };

  /* (24/09, nuit) LE TROUSSEAU DU JEU — les comptes que le jeu a créés, lus sur CET appareil : titulaires des points, seconde marque,
     porteurs de Mes bons, et les collaborateurs (leur identifiant est celui que le data-layer leur a donné). Même forme que
     PEC_DATA.comptesDemo : la page des comptes de démonstration les ajoute à sa liste. */
  var PORTEURS = [['Yanis', 'Kacem', '0611223344', 'yanis.k@gmail.com'], ['Inès', 'Martin', '0612345678', 'ines.martin@gmail.com']], MDP_PORTEUR = 'Porteur!2026x';
  J.trousseau = function (D) {
    if (!D || !D.compteParIdentifiant) return [];
    var l = [], existe = function (esp, id) { return !!D.compteParIdentifiant(esp, id); };
    POINTS.forEach(function (p) {
      if (!existe('partenaire', p.form.identifiant)) return;
      l.push({ espace: 'Partenaire du réseau', role: 'Titulaire — ' + p.enseigne, identifiant: p.form.identifiant, motdepasse: p.form.motdepasse, ecran: '../partenaire/01-connexion.html',
        note: p.form.mode === 'mobile' ? D.terme('nomade', 'nom', true) + ' : son départ et ses prix, ses mises en relation, son avance' : D.terme('commerce', 'nom', true) + ' : le comptoir, ses relevés, son équipe' });
    });
    if (existe('marque', 'bonjour@maison-arlo.fr')) l.push({ espace: 'PayEnCash Solution', role: 'Marque — Maison Arlo', identifiant: 'bonjour@maison-arlo.fr', motdepasse: 'Arlo!2026xx', ecran: '../tech/01-connexion.html', note: 'la seconde marque du réseau' });
    if (existe('marque', 'contact@azur-ailes.fr')) l.push({ espace: 'PayEnCash Solution', role: 'Marque — Azur Ailes', identifiant: 'contact@azur-ailes.fr', motdepasse: 'Azur!2026xxx', ecran: '../tech/01-connexion.html', note: 'compagnie aérienne, sa boutique en ligne comprise' });
    if (existe('marque', 'bonjour@billets-soleil.fr')) l.push({ espace: 'PayEnCash Solution', role: 'Marque — Billets Soleil', identifiant: 'bonjour@billets-soleil.fr', motdepasse: 'Soleil!2026x', ecran: '../tech/01-connexion.html', note: 'revendeur de billets d’avion, sur son propre site' });
    EQUIPES.forEach(function (e) {
      var parentId = e.type === 'point' ? ((D.compteParIdentifiant('partenaire', e.parent) || {}).refId || null) : ((D.techMarchands ? D.techMarchands() : []).filter(function (m) { return m.siteUrl === 'https://boutique-lila.fr'; })[0] || {}).id;
      var k = parentId ? D.collaborateurs(e.type, parentId).filter(function (x) { return x.tel === e.tel && x.statut === 'actif'; })[0] : null;
      if (!k) return;
      l.push({ espace: e.type === 'point' ? 'Partenaire du réseau' : 'PayEnCash Solution', role: D.terme('collaborateur', 'nom', true) + ' — ' + k.nomAffiche,
        identifiant: k.identifiant, motdepasse: e.motdepasse, ecran: e.type === 'point' ? '../partenaire/01-connexion.html' : '../tech/01-connexion.html',
        note: e.type === 'point' ? 'vend au comptoir du Tabac de la Gare, ne voit que ses ventes' : 'promeut Boutique Lila, ne voit que ce qu’il a produit' });
    });
    PORTEURS.forEach(function (p) { if (existe('client', p[2])) l.push({ espace: 'Mes bons', role: 'Utilisateur — ' + p[0] + ' ' + p[1].charAt(0) + '.', identifiant: p[2], motdepasse: MDP_PORTEUR, ecran: '../bons/06-connexion.html', note: 'ses bons de marque, la carte des points de vente' }); });
    return l;
  };

  /* DEPUIS MES BONS : le porteur connecté range ses bons (les codes vendus par le réseau), puis en utilise un sur un bon proposé */
  J.porteur = function (w) {
    var D = w.PEC_DATA, PB = w.PEC_BONS, fait = [], refus = [];
    if (!D || !PB || !PB.ajouter) return { ok: false, motif: 'Cette page ne charge pas Mes bons.' };
    var id = D.clientActifGet(); if (!id) return { ok: false, motif: 'Aucun porteur connecté.' };
    // les documents de l'app, lus puis acceptés — l'inscription réelle le fait avant le premier bon
    (PB.documents() || []).forEach(function (d) { try { PB.consulter(d.cle); PB.accepter(d.cle); } catch (e) {} });
    var codes = D.techBonsGet().filter(function (b) { return b.etat === 'sold'; }).map(function (b) { return b.code; }).slice(0, 4);
    codes.forEach(function (c) { var r = PB.ajouter(c); if (r && r.ok === false) refus.push(c + ' : ' + r.motif); else fait.push('rangé ' + c); });
    var lien = D.techLiensGet().filter(function (x) { return x.etat === 'open'; })[0];
    if (lien && codes[0]) { var u = PB.utiliser ? PB.utiliser(lien.slug, codes[0]) : D.techLienUtiliserBon(lien.slug, codes[0], { par: id }); if (u && u.ok) fait.push('bon ' + codes[0] + ' utilisé sur ' + lien.slug); else refus.push('usage : ' + ((u && u.motif) || '?')); }
    try { w.dispatchEvent(new w.Event('pec-bus')); } catch (e) {}
    return { ok: !refus.length, fait: fait, refus: refus };
  };

  g.PEC_JEU = J;
})(window);
