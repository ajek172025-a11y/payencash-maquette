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
      tauxUnique: o.tva ? o.tva.tauxUnique : null, franceSeule: o.tva ? o.tva.franceSeule : null }, o.email); if (!e1.ok) return e1;
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

  J.monter = function (w, cb) {
    cb = cb || function () {};
    var D = w.PEC_DATA, B = w.PEC_BUS, fait = [], refus = [], ids = {};
    if (!D || !w.PEC_DOCS || !B) { cb({ ok: false, motif: 'Cette page ne charge pas le data-layer, le coffre et le bus.' }); return; }
    charger(w, '../../tests/outils-banc.js').then(function () {
      var K = w.PEC_BANC;
      /* ① LES MARQUES */
      var TR = (D.comptesDemo || []).filter(function (c) { return /Solution/i.test(c.espace || ''); })[0] || {};
      var m1 = marque(w, { raisonSociale: 'Boutique Lila', siteUrl: 'https://boutique-lila.fr', email: TR.identifiant || 'hello@boutique-lila.fr', mdp: TR.motdepasse || 'Solution!2026', tva: { tauxUnique: true, franceSeule: true }, tel: '04 91 33 20 10', siretBase: '4048330480002', iban: 'FR7630004000031234567890143',
        dirigeant: { civilite: 'Madame', prenom: 'Lila', nom: 'Benali', dateNaissance: '1988-03-14', lieuNaissance: 'Marseille', qualite: 'présidente' },
        beneficiaires: { personnes: [{ civilite: 'Madame', prenom: 'Lila', nom: 'Benali', dateNaissance: '1988-03-14', nationalite: 'Française', part: 60 }, { civilite: 'Monsieur', prenom: 'Samir', nom: 'Benali', dateNaissance: '1985-09-02', nationalite: 'Française', part: 40 }], atteste: true } });
      var m2 = marque(w, { raisonSociale: 'Maison Arlo', siteUrl: 'https://maison-arlo.fr', email: 'bonjour@maison-arlo.fr', mdp: 'Arlo!2026xx', tva: { tauxUnique: false, franceSeule: true }, forme: 'SARL', siretBase: '8123456780001', iban: 'FR1420041010050500013M02606', mode: 'j7', formule: 'pro',
        dirigeant: { civilite: 'Monsieur', prenom: 'Arlo', nom: 'Vidal', dateNaissance: '1979-11-02', lieuNaissance: 'Aix-en-Provence', qualite: 'gérant' } });
      [m1, m2].forEach(function (m, i) { if (m.ok) { fait.push('marque ' + m.marchand.raisonSociale + (m.deja ? ' (déjà là)' : ' prête')); ids['marque' + (i + 1)] = m.marchand.id; } else refus.push('marque ' + (i + 1) + ' : ' + m.motif); });
      if (!m1.ok) { cb({ ok: false, fait: fait, refus: refus }); return; }
      var M1 = m1.marchand.id, M2 = m2.ok ? m2.marchand.id : null;
      /* ② LES COMMERCES ET LE NOMADE, nés de leur inscription (fixture réelle du banc : compte → dossier → validation → contrat → activation) */
      var pts = [
        { enseigne: 'Tabac de la Gare', form: { identifiant: 'tabac.gare', email: 'contact@tabacdelagare.fr', adresse: '12 boulevard National', cp: '13003', ville: 'Marseille', tel: '04 91 62 10 20', responsable: 'Nadia Benali', motdepasse: 'Tabac!2026xx', motdepasse2: 'Tabac!2026xx' } },
        { enseigne: 'Presse du Vieux-Port', form: { identifiant: 'presse.vieuxport', email: 'presse.vieuxport@orange.fr', adresse: '3 quai des Belges', cp: '13001', ville: 'Marseille', tel: '04 91 54 33 08', responsable: 'Marc Ferrandi', motdepasse: 'Presse!2026xx', motdepasse2: 'Presse!2026xx' } },
        { enseigne: 'Karim D.', form: { identifiant: 'karim.d', email: 'karim.d@gmail.com', mode: 'mobile', ville: 'Marseille', tel: '06 52 14 78 90', responsable: 'Karim Daoudi', motdepasse: 'Nomade!2026xx', motdepasse2: 'Nomade!2026xx' } }
      ];
      var P = [];
      pts.forEach(function (p) {
        var c0 = D.compteParIdentifiant('partenaire', p.form.identifiant);
        if (c0 && c0.refId) { P.push({ ok: true, pointId: c0.refId, identifiant: p.form.identifiant, deja: true }); fait.push(p.enseigne + ' (déjà là)'); return; }
        var r = K.pointPartenairePret(w, { enseigne: p.enseigne, form: p.form });
        if (r.ok) { P.push(r); fait.push(p.enseigne + ' actif' + (p.form.mode === 'mobile' ? ' (nomade)' : '')); } else refus.push(p.enseigne + ' : ' + r.etape + ' — ' + r.motif);
      });
      if (P[2] && P[2].ok) { var z = D.partenaireZoneSet(P[2].pointId, { villes: ['Marseille', 'Aubagne'], rayonKm: 15 }, 'karim.d'); if (!z.ok) refus.push('zone du nomade : ' + z.motif); }
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
        [['Robe en lin Ava', 89, 15, 'Robes', [['S', 3], ['M', 5], ['L', 2]], 'FEM', 'robe'], ['Chemise Oscar', 69, 0, 'Chemises', [['M', 4], ['L', 4]], 'HOM', 'chemise'], ['Sneakers Lune', 119, 20, 'Sneakers', [['38', 2], ['39', 3], ['41', 1]], 'FEM', 'sneakers']].forEach(function (a, i) {
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
      /* ⑥ LA FILE DU MANAGER : une candidature de commerce envoyée (promesse, à la fin), un brouillon d'inscription de marque */
      if (!D.compteParIdentifiant('marque', 'contact@atelier-nino.fr')) {
        var br = D.compteCreer('marque', { email: 'contact@atelier-nino.fr', motdepasse: 'Nino!2026xx', motdepasse2: 'Nino!2026xx' });
        if (br.ok) { D.compteVerifier(br.compte.id, 'email', (br.codes || {}).email); var mb = D.techMarchandParCompte(br.compte.id); if (mb) { D.techMarchandEntrepriseSet(mb.id, { raisonSociale: 'Atelier Nino', siret: siretOk(D, '9012345670001'), siteUrl: 'atelier-nino.fr' }, mb.id); fait.push('brouillon Atelier Nino (à l’étape dirigeant)'); } }
      }
      /* ⑦ LES PORTEURS — deux comptes Mes bons ; Inès garde la session (PEC_JEU.porteur range ses bons depuis l'app) */
      var por = [];
      [['Yanis', 'Kacem', '0611223344', 'yanis.k@gmail.com'], ['Inès', 'Martin', '0612345678', 'ines.martin@gmail.com']].forEach(function (p) {
        var c = D.compteParIdentifiant('client', p[2]), mdp = 'Porteur!2026x';
        if (!c) { var r = D.compteCreer('client', { prenom: p[0], nom: p[1], tel: p[2], email: p[3], motdepasse: mdp }); if (!r.ok) { refus.push('porteur ' + p[0] + ' : ' + r.motif); return; } c = r.compte; var codes = r.codes || D.compteCodes(c); ((D.ESPACES_COMPTE.client || {}).verifs || []).forEach(function (v) { D.compteVerifier(c.id, v, codes[v]); }); }
        var cx = D.compteConnecter('client', p[2], mdp); if (!cx.ok) { refus.push('connexion ' + p[0] + ' : ' + cx.motif); return; }
        try { if (D.compteVerifSet && cx.compte && cx.compte.verifs) { D.compteVerifSet('sms', !!cx.compte.verifs.sms); D.compteVerifSet('mail', !!cx.compte.verifs.email); } } catch (e) {}
        por.push({ nom: p[0] + ' ' + p[1].charAt(0) + '.', clientId: D.clientActifGet(), tel: p[2] });
      });
      ids.porteurs = por; fait.push(por.length + ' porteurs (Inès reste connectée)');
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
