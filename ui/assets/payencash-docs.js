/* ══ COFFRE DE DOCUMENTS (fondatrice 05/09) ═══════════════════════════════════════════════
   « Je veux l'échange de VRAIS documents : télécharger, stocker, déposer, et le voir dans
     l'espace. Et pouvoir générer des PDF à signer. »

   Avant : le fournisseur avait bien un champ fichier, mais seuls le NOM et la TAILLE étaient
   conservés — le fichier lui-même n'était jamais lu. Personne ne pouvait donc l'ouvrir, et le
   manager validait un document qu'il n'avait jamais vu.

   Ici, le fichier est RÉELLEMENT lu (FileReader), conservé, consultable et téléchargeable par
   celui qui l'a déposé COMME par le manager qui le contrôle. Chaque geste passe au journal du
   bus. Portées : fournisseur · client · partenaire (18/09 : le commerçant qui vend le Bon d’achat PayEnCash — Kbis,
   gérant, vidéo, contrat de distribution).
   (18/09, soir) La portée `agent` est partie avec l'agent de caisse mobile : personne ne dépose plus de permis,
   d'assurance de véhicule ni de contrat de travail, parce qu'aucun salarié ne se déplace plus encaisser.

   ⚠ Maquette : le stockage est le localStorage du navigateur (quelques Mo). En production ce
   sera un stockage objet chiffré ; l'API ci-dessous ne changerait pas.
   ═════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var P = 'pec-doc:';                       // pec-doc:<portee>:<id>:<piece>
  var MAX = 1400000;                        // ~1,4 Mo par pièce scannée : au-delà, on le DIT
  var MAX_VIDEO = 3200000;                  // la vidéo de vérification pèse plus lourd

  function cle(portee, id, piece) { return P + portee + ':' + id + ':' + piece; }
  function lire(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function noter(evt, ref, data) { try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter(evt, ref, data); } catch (e) {} }
  /* (11/09) LE COFFRE PORTE LES PREUVES — une écriture refusée ne doit pas laisser une trace au journal.
     Quatre gestes du coffre (statuer une pièce, régler les frais KYB, soumettre le dossier, l'assigner)
     avalaient l'exception de `setItem` puis notaient l'événement : on aurait relu « document_valide »
     sur une pièce dont la validation n'existe nulle part. `ecrit` rend vrai/faux, comme dans le bus. */
  function ecrit(k, v) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); return true; } catch (e) { return false; } }
  function reveiller() { try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} }

  var DOCS = {
    /* ── RÉFÉRENTIEL DES PIÈCES par acteur : la source unique de « ce qu'il faut fournir ».
          `obligatoire` conditionne la validation du dossier ; `expire` = pièce à renouveler. ── */
    PIECES: {
      /* (18/09, soir) LE DOSSIER DU CANDIDAT AGENT est parti avec l'agent de caisse mobile : pièce d'identité,
         permis, assurance du véhicule, RIB de paie, attestation de sécurité sociale et contrat de travail
         n'avaient de sens que pour un salarié qui se déplaçait encaisser des espèces. */
      /* (23/09, nuit — grossiste) LE COMMERCE DU RÉSEAU — il nous achète les bons des marques et les revend au comptoir : Kbis,
         pièce du gérant, vidéo, RIB et CONTRAT DE DISTRIBUTION signé (modèle `contrat_partenaire`). Le RIB devient
         obligatoire : c'est le compte que le mandat SEPA prélève (sédentaire) et celui où la garantie est restituée (nomade) —
         l'article 9 du contrat l'exige, le dossier ne pouvait pas le dire facultatif. */
      partenaire: [
        { id: 'kbis',    label: 'Extrait Kbis (moins de 3 mois)', obligatoire: true, expire: true, aide: 'Extrait de moins de 3 mois — le SIRET et le gérant doivent se lire.' },
        { id: 'cni',     label: "Pièce d'identité du gérant",     obligatoire: true },
        { id: 'video',   label: 'Vidéo du gérant (visage + pièce)', obligatoire: true, video: true },
        { id: 'rib',     label: 'RIB du commerce',                obligatoire: true, aide: 'Au nom du commerce — le compte prélevé par le mandat SEPA, ou celui où la garantie est restituée.' },
        { id: 'contrat', label: 'Contrat de distribution des bons d’achat de marque', obligatoire: true, genere: 'contrat_partenaire' }
      ],
      /* ══ (23/09) LA MARQUE PARTENAIRE DE PAYENCASH SOLUTION — son dossier de vérification (KYB) ══════════════
         Nous lui ACHETONS ses bons et nous la PAYONS par virement : il faut donc savoir qui elle est (Kbis,
         dirigeant, bénéficiaires effectifs) et où virer (RIB au nom de l'entreprise). La déclaration « réseau
         limité » ne figure pas ici : elle a sa propre porte (techConformite), parce qu'elle se statue et se
         corrige, et qu'elle tient l'exemption à elle seule. Le contrat-cadre, lui, se lit et se signe par le
         dirigeant depuis le Compte : il n'entre pas dans le dépôt du dossier (horsDossier). ══ */
      marchand: [
        { id: 'kbis',    label: 'Extrait Kbis (moins de 3 mois)', obligatoire: true, expire: true, aide: 'Extrait de moins de 3 mois — le SIRET, l\'objet social et le dirigeant doivent se lire.' },
        { id: 'cni',     label: "Pièce d'identité du dirigeant",  obligatoire: true },
        /* (24/09, fondatrice : « la même vidéo que le partenaire ») la vivacité du dirigeant : son visage, puis la pièce — regardée par une personne, puis supprimée */
        { id: 'video',   label: 'Vidéo du dirigeant (visage + pièce)', obligatoire: true, video: true },
        { id: 'rib',     label: "RIB de l'entreprise",            obligatoire: true, aide: "RIB au nom de la société — c'est ce compte que nous virons. Sans lui, aucun règlement ne part." },
        { id: 'rbe',     label: 'Extrait du registre des bénéficiaires effectifs', obligatoire: true, expire: true, aide: 'Extrait RBE de moins de 12 mois, cohérent avec le Kbis et avec les bénéficiaires que tu as déclarés — demandé au titre de notre politique de prévention de la fraude.' },
        /* (23/09, soir — fondatrice : « que fait le contrat-cadre dans le dépôt de dossier ? ce n'est pas son emplacement »)
           LE CONTRAT N'EST PAS UNE PIÈCE DU DOSSIER KYB : il se lit et se signe dans « Mes documents » (le dirigeant, une
           fois son identité contrôlée). Le coffre garde seulement le PDF signé et sa contresignature sous cette clé —
           `horsDossier` le tient à l'écart du dépôt, de l'état du dossier et de la file de vérification. */
        { id: 'contrat', label: 'Contrat-cadre d’achat et de distribution des bons d’achat', obligatoire: false, genere: 'contrat_marchand', horsDossier: true }
      ],
      client: [
        { id: 'cni',    label: "Pièce d'identité (recto-verso)", obligatoire: true },
        { id: 'selfie', label: 'Photo de toi tenant ta pièce',   obligatoire: true, aide: 'Ton visage bien visible et la pièce à côté, lisible.' },
        { id: 'video',  label: 'Vidéo de vérification (visage + pièce)', obligatoire: true, video: true },
        { id: 'cgu',    label: 'Conditions générales acceptées', obligatoire: true, genere: 'cgu_client' }
      ],
      fournisseur: [
        { id: 'kbis',    label: 'Extrait Kbis (moins de 3 mois)', obligatoire: true, expire: true, aide: 'Extrait de moins de 3 mois, toutes les pages.' },
        { id: 'cni',     label: "Pièce d'identité du dirigeant",  obligatoire: true },
        { id: 'rib',     label: "RIB de l'entreprise",            obligatoire: true, aide: "RIB au nom de l'entreprise — l'IBAN doit se lire." },
        { id: 'video',   label: 'Vidéo du dirigeant (visage + pièce)', obligatoire: true, video: true },
        { id: 'contrat', label: "Contrat-cadre d'achat ferme signé", obligatoire: true, genere: 'contrat_fournisseur' },
        /* (07/09 — audit juridique fournisseur) les pièces qui manquaient : le contrat exigeait la RC pro sans la demander ;
           bénéficiaires effectifs (L561-45-1 CMF) ; régime de TVA (293 B / 297 A CGI) ; vigilance URSSAF dès 5 000 € HT
           d'achats sur 12 mois (L8222-1 C. trav. — obligatoire seulement au seuil : `condition`). */
        { id: 'rbe',     label: 'Extrait du registre des bénéficiaires effectifs', obligatoire: true, expire: true, aide: 'Extrait RBE de moins de 12 mois — cohérent avec le Kbis.' },
        { id: 'rcpro',   label: "Attestation d'assurance RC professionnelle", obligatoire: true, expire: true, aide: "Attestation en cours de validité au nom de l'entreprise (renouvelée chaque année)." },
        { id: 'tva',     label: 'Déclaration de régime TVA + n° intracommunautaire', obligatoire: true, aide: 'Attestation de régime (franchise en base art. 293 B ou assujetti) et numéro de TVA intracommunautaire vérifiable (VIES). Conditionne le régime de la marge à la revente (art. 297 A CGI).' },
        { id: 'urssaf',  label: 'Attestation de vigilance URSSAF', obligatoire: false, expire: true, aide: "Obligatoire dès 5 000 € HT d'achats sur 12 mois (art. L8222-1 C. trav.), à renouveler tous les 6 mois.",
          condition: function (id) { try { var D = window.PEC_DATA; if (!D || !D.facturesGet) return false; var f = D.fournisseur(id) || {}; var nom = f.nom || id, depuis = Date.now() - 365 * 86400000; var tot = 0; D.facturesGet().forEach(function (x) { if (x.fournisseur === nom && x.statut !== 'annule' && (!x.at || x.at >= depuis)) tot += (parseFloat(x.montant) || 0); }); return tot >= 5000; } catch (e) { return false; } } }
      ],
      /* (10/09 — lot 6, constats B3, C14 et B8) UN LOT A UN DOSSIER, LUI AUSSI. Les vues photo et la facture d'origine
         n'étaient que des NOMS DE FICHIER : l'atelier « contrôlait les photos » sans pouvoir en ouvrir une seule, le
         livre de police citait un justificatif qui n'existait nulle part, et la fiche client montrait une image
         d'illustration à la place de la pièce vendue. Les fichiers entrent au coffre comme les autres — même plafond,
         mêmes formats, même traçabilité. Les VUES, elles, varient en nombre : elles sont rangées sous `vue-<rôle>`
         et se listent par `vuesLot`, sans figurer dans cette liste de pièces attendues. */
      lot: [
        { id: 'facture_origine', label: "Facture d'origine du lot", obligatoire: false,
          aide: "Facture d'achat du fournisseur — exigée sur le neuf, et attendue par le registre de police (art. 321-7 du code pénal)." }
      ]
    },
    piecesDe: function (portee) { return (this.PIECES[portee] || []).map(function (p) { return Object.assign({}, p); }); },

    /* ── (10/09 — lot 4) LES MENTIONS QUE PORTE UNE PIÈCE ────────────────────────────────────────────────────────────
       L'identité légale d'un acteur (raison sociale, SIREN, SIRET, RCS, capital, TVA intracommunautaire, IBAN) était
       FABRIQUÉE PAR UN HACHAGE de son identifiant : la fiche, le contrat-cadre SIGNÉ et les factures portaient des
       numéros inventés — un IBAN « FR76 … » compris. Elle vient désormais d'un seul endroit : ce que le contrôleur LIT
       sur la pièce au moment où il la valide. Rien n'est deviné ; ce qui manque manque, et les documents qui en
       dépendent (contrat, facture, livre de police) sont refusés tant que c'est vide. ── */
    MENTIONS: {
      kbis: { titre: 'Ce que porte le Kbis', champs: [
        { k: 'raisonSociale', l: 'Dénomination sociale', requis: true },
        { k: 'formeJuridique', l: 'Forme juridique (SAS, SARL, EI…)', requis: true },
        { k: 'siren', l: 'SIREN (9 chiffres)', requis: true, motif: /^\d{9}$/, aide: '9 chiffres' },
        { k: 'siret', l: 'SIRET du siège (14 chiffres)', requis: true, motif: /^\d{14}$/, aide: '14 chiffres' },
        { k: 'rcs', l: 'RCS (ville et numéro)', requis: true },
        { k: 'capital', l: 'Capital social' },
        { k: 'naf', l: 'Code NAF / APE' },
        { k: 'adresse', l: 'Adresse du siège', requis: true },
        { k: 'dirigeant', l: 'Représentant légal', requis: true } ] },
      rib: { titre: 'Ce que porte le RIB', champs: [
        { k: 'iban', l: 'IBAN', requis: true, motif: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, normaliser: 'iban', aide: 'sans espaces, ex. FR7630004…' },
        { k: 'bic', l: 'BIC', requis: true, motif: /^[A-Z0-9]{8}([A-Z0-9]{3})?$/, normaliser: 'majuscules' },
        { k: 'titulaire', l: 'Titulaire du compte', requis: true } ] },
      tva: { titre: 'Ce que porte la déclaration de TVA', champs: [
        { k: 'tvaIntra', l: 'N° de TVA intracommunautaire', requis: true, motif: /^[A-Z]{2}[A-Z0-9]{2,13}$/, normaliser: 'majuscules' },
        /* (10/09 — lot 6, constat C27) LE RÉGIME N'EST PAS UNE PHRASE LIBRE : c'est lui qui décide de la TVA portée par
           la facture d'achat. Trois cas, et trois seulement, pour un fournisseur de PayEnCash. */
        { k: 'regimeTva', l: 'Régime de TVA', requis: true, choix: [
          { k: 'franchise', l: 'Franchise en base — art. 293 B du CGI (aucune TVA facturée)' },
          { k: 'marge',     l: "Assujetti, régime de la marge sur biens d'occasion — art. 297 A du CGI (TVA non détaillée)" },
          { k: 'normal',    l: 'Assujetti au régime normal — TVA au taux en vigueur, déductible par l\'acheteur' } ] } ] }
    },
    mentionsDe: function (piece) { return this.MENTIONS[piece] || null; },
    /* ── (10/09 — lot 4, constat C12) UN CONTRAT SIGNÉ FIGE SES CONDITIONS. Le PDF portait un coefficient et un délai
          lus au moment de la signature, mais l'écran du contrat et les factures relisaient les valeurs COURANTES : si le
          coefficient changeait, le fournisseur se voyait appliquer des conditions qu'il n'avait jamais signées, sans
          avenant. On relève les conditions AU MOMENT de la signature, on les garde avec le document, et l'écart se voit. ── */
    CONDITIONS: {
      contrat_fournisseur: function () {
        var D = window.PEC_DATA, sc = (D && D.scenario) || {}, J = ((D && D.ref) || {}).juridique || {};
        return { grilleMode: { l: 'Grille de prix', v: (D && D.grilleModeLibelle) ? D.grilleModeLibelle() : null },
                 virementJours: { l: 'Délai de virement (jours)', v: J.virementJours },
                 contestationJours: { l: 'Délai de contestation (jours)', v: J.contestationJours },
                 essaiMois: { l: "Période d'essai (mois)", v: J.essaiMois },
                 preavisResiliationMois: { l: 'Préavis de résiliation (mois)', v: J.preavisResiliationMois } };
      },
      /* (18/09, soir) LES CONDITIONS DU CONTRAT DE TRAVAIL (durées maximales, repos quotidien) sont parties avec
         l'agent de caisse mobile : PayEnCash n'emploie plus de salarié qui se déplace encaisser, donc plus de
         durée du travail à relever à la signature. */
      /* (23/09) LE CONTRAT DE DISTRIBUTION DES BONS DE MARQUE fige ce qu'il chiffre : la part du point sur chaque offre de
         paiement des marques, l'heure de l'arrêté, le plafond d'encours et la pénalité d'impayé (commerce sédentaire, art. 5),
         la garantie, les bornes d'un virement d'avance et le délai de restitution (distributeur nomade, art. 6), le délai
         d'annulation au comptoir, la validité du bon et le préavis. UN SEUL CONTRAT POUR LES DEUX MODES : un réglage qui
         bouge change le texte signé par tous, et l'écart se lit sur chaque dossier (conditionsEcart) — l'avenant suit. */
      contrat_partenaire: function () {
        var D = window.PEC_DATA, T = (D && D.techRef) ? D.techRef() : {}, P = T.paiement || {}, A = T.avance || {};
        var B = (D && D.bonsRef) ? D.bonsRef() : {}, J = ((D && D.ref) || {}).juridique || {}, out = {};
        ((D && D.techModes) ? D.techModes() : []).forEach(function (m) { out['part_' + m.id] = { l: 'Part du point — ' + m.libelle + ' (%)', v: m.partPointPct }; });
        out.arreteHeure = { l: 'Heure de l’arrêté', v: P.arreteHeure };
        out.encoursMaxPoint = { l: 'Plafond d’encours du commerce sédentaire (€)', v: P.encoursMaxPoint };
        out.penaliteImpaye = { l: 'Pénalité par prélèvement impayé (€)', v: P.penaliteImpaye };
        out.garantie = { l: 'Garantie du distributeur nomade (€)', v: A.garantie };
        out.rechargeMin = { l: 'Virement d’avance minimal (€)', v: A.rechargeMin };
        out.rechargeMax = { l: 'Virement d’avance maximal (€)', v: A.rechargeMax };
        out.restitutionJours = { l: 'Restitution de la garantie et de l’avance (jours)', v: A.restitutionJours };
        out.annulationMinutes = { l: 'Annulation d’une vente au comptoir (minutes)', v: T.annulationMinutes };
        out.validiteMois = { l: 'Validité du bon (mois)', v: B.validiteMois };
        out.preavisResiliationMois = { l: 'Préavis de résiliation (mois)', v: J.preavisResiliationMois };
        return out;
      },
    },
    /* (19/09) LES CONDITIONS SE LISENT POUR UN DOSSIER, pas dans l'absolu : `portee`/`id` désignent l'acteur, et le
       modèle peut alors rendre ce qui vaut POUR LUI (le taux de commission de son contrat de distribution). */
    conditionsDe: function (modele, portee, id) { var f = this.CONDITIONS[modele]; if (!f) return null; var o = f({ portee: portee || null, id: id || null }), out = {}; Object.keys(o).forEach(function (k) { if (o[k].v != null) out[k] = { l: o[k].l, v: o[k].v }; }); return out; },
    /* L'écart entre ce qui a été SIGNÉ et ce qui s'applique AUJOURD'HUI. Un document signé avant cette règle ne porte
       aucun relevé : on ne lui reproche pas un écart qu'on ne peut pas mesurer. */
    conditionsEcart: function (portee, id, piece) {
      var d = this.get(portee, id, piece);
      if (!d || !d.signe || !d.conditions || !d.modele) return [];
      var maintenant = this.conditionsDe(d.modele, portee, id) || {}, out = [];
      Object.keys(d.conditions).forEach(function (k) {
        var a = d.conditions[k], b = maintenant[k];
        if (b && String(a.v) !== String(b.v)) out.push({ cle: k, libelle: a.l, signe: a.v, courant: b.v });
      });
      return out;
    },
    /* L'identité légale d'un acteur = les mentions de ses pièces VALIDÉES, fusionnées. Une pièce refusée, déposée ou
       manquante n'apporte rien : c'est ce qui rend le contrat et la facture honnêtes ou impossibles. */
    mentions: function (portee, id) {
      var self = this, out = {};
      /* Un acteur ENTRÉ AVANT LE COFFRE a ses mentions sur un dossier papier : le manager les relève une fois
         (mentionsSaisir), avec la même exigence de format. C'est la seule autre source admise — jamais un calcul. */
      var saisie = lire('pec-mentions:' + portee + ':' + id);
      if (saisie && saisie.mentions) Object.keys(saisie.mentions).forEach(function (k) { if (saisie.mentions[k]) out[k] = saisie.mentions[k]; });
      Object.keys(this.MENTIONS).forEach(function (piece) {
        var d = self.get(portee, id, piece);
        if (!d || d.statut !== 'validee' || !d.mentions) return;
        Object.keys(d.mentions).forEach(function (k) { if (d.mentions[k]) out[k] = d.mentions[k]; });   // la pièce contrôlée prime sur la transcription
      });
      return out;
    },
    /* Ce qui manque pour produire un document juridique (contrat-cadre, facture, livre de police). */
    mentionsManquantes: function (portee, id, requis) {
      var m = this.mentions(portee, id), LBL = { siret: 'SIRET', siren: 'SIREN', raisonSociale: 'dénomination sociale', rcs: 'RCS', iban: 'IBAN', bic: 'BIC', tvaIntra: 'n° de TVA intracommunautaire', regimeTva: 'régime de TVA', adresse: 'adresse du siège', dirigeant: 'représentant légal' };
      return (requis || ['raisonSociale', 'siret', 'adresse']).filter(function (k) { return !m[k]; }).map(function (k) { return LBL[k] || k; });
    },

    /* ── DÉPÔT RÉEL : le fichier est lu et conservé. Renvoie une promesse — l'appelant sait
          quand c'est écrit, et pourquoi ça ne l'est pas (trop gros, type refusé). ── */
    deposer: function (portee, id, piece, fichier, meta) {
      var self = this;
      return new Promise(function (res, rej) {
        if (!fichier) return rej(new Error('Aucun fichier choisi.'));
        var estVideo = /^video\//i.test(fichier.type || '') || /\.(webm|mp4|mov)$/i.test(fichier.name || '');
        var plafond = estVideo ? MAX_VIDEO : MAX;
        if (fichier.size > plafond) return rej(new Error('Fichier trop lourd (' + self.taille(fichier.size) + ') — ' + self.taille(plafond) + ' maximum dans cette maquette.'));
        var ok = /^(application\/pdf|image\/(png|jpe?g|heic|webp)|video\/(webm|mp4|quicktime))$/i.test(fichier.type || '');
        if (!ok && !/\.(pdf|png|jpe?g|heic|webp|webm|mp4|mov)$/i.test(fichier.name || '')) return rej(new Error('Format accepté : PDF, JPG, PNG — ou une vidéo WebM/MP4.'));
        var fr = new FileReader();
        fr.onerror = function () { rej(new Error('Lecture du fichier impossible.')); };
        fr.onload = function () {
          /* (24/09, fondatrice : « si recto verso ») UNE PIÈCE D'IDENTITÉ A DEUX FACES : le recto (re)crée la pièce avec son
             type (carte, passeport, titre de séjour — ref.kyc.piecesIdentite), le verso s'y AJOUTE. Remplacer le recto
             oblige à redonner le verso : les deux faces doivent venir de la même pièce. */
          if (meta && meta.face === 'verso') {
            var base = lire(cle(portee, id, piece));
            if (!base || !base.data) return rej(new Error('Dépose d’abord le recto de la pièce.'));
            var avecVerso = Object.assign({}, base, { verso: { nom: fichier.name, type: fichier.type || 'application/octet-stream', taille: fichier.size, at: Date.now(), data: String(fr.result) },
              statut: base.statut === 'refusee' ? 'deposee' : base.statut, motif: base.statut === 'refusee' ? '' : base.motif });
            try { localStorage.setItem(cle(portee, id, piece), JSON.stringify(avecVerso)); }
            catch (eV) { return rej(new Error('Coffre plein sur cet appareil — supprime un document déjà validé.')); }
            noter('document_depose', id, { portee: portee, piece: piece, face: 'verso', nom: fichier.name, par: portee });
            reveiller();
            return res(avecVerso);
          }
          var m0 = Object.assign({}, meta || {}); delete m0.face;
          var doc = Object.assign({
            portee: portee, id: id, piece: piece,
            nom: fichier.name, type: fichier.type || 'application/octet-stream', taille: fichier.size,
            at: Date.now(), statut: 'deposee', motif: '', data: String(fr.result)
          }, m0);
          try { localStorage.setItem(cle(portee, id, piece), JSON.stringify(doc)); }
          catch (e) { return rej(new Error('Coffre plein sur cet appareil — supprime un document déjà validé.')); }
          noter('document_depose', id, { portee: portee, piece: piece, nom: doc.nom, par: portee });
          reveiller();
          res(doc);
        };
        fr.readAsDataURL(fichier);
      });
    },

    /* (10/09 — lot 6, constat C14) UNE VIGNETTE POUR LES LISTES. Le catalogue ne peut pas charger l'image d'origine
       — plusieurs méga-octets — pour chaque case d'une grille : on en réduit une copie au format d'affichage, en
       JPEG. L'original, lui, reste intact au coffre : c'est lui que l'atelier ouvre et que la fiche montre en grand. */
    vignette: function (fichier, max) {
      return new Promise(function (res) {
        if (!fichier || !/^image\//i.test(fichier.type || '')) return res(null);
        var u = URL.createObjectURL(fichier), img = new Image();
        img.onload = function () {
          try {
            var k = Math.min(1, (max || 480) / Math.max(img.width || 1, img.height || 1));
            var c = document.createElement('canvas');
            c.width = Math.max(1, Math.round((img.width || 1) * k)); c.height = Math.max(1, Math.round((img.height || 1) * k));
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.72));
          } catch (e) { res(null); }
          URL.revokeObjectURL(u);
        };
        img.onerror = function () { URL.revokeObjectURL(u); res(null); };
        img.src = u;
      });
    },
    get: function (portee, id, piece) { return lire(cle(portee, id, piece)); },
    // Tout le dossier d'un acteur : chaque pièce du référentiel, avec son document s'il existe.
    /* LES FACES ATTENDUES D'UNE PIÈCE D'IDENTITÉ (ref.kyc.piecesIdentite) — et celles qui manquent encore. Un fichier qui
       porte les deux faces (`deuxFaces`) les couvre toutes. Une pièce sans type (déposée avant la règle) n'en exige aucune. */
    typePiece: function (doc) {
      var L = (window.PEC_DATA && PEC_DATA.ref && PEC_DATA.ref.kyc && PEC_DATA.ref.kyc.piecesIdentite) || [];
      return doc && doc.typePiece ? (L.filter(function (x) { return x.id === doc.typePiece; })[0] || null) : null;
    },
    facesManquantes: function (doc) {
      var t = this.typePiece(doc); if (!t || !doc || doc.deuxFaces) return [];
      return t.faces.filter(function (f) { return f.id === 'recto' ? !doc.data : !(doc[f.id] && doc[f.id].data); });
    },
    dossier: function (portee, id) {
      var self = this;
      return this.piecesDe(portee).filter(function (p) { return !p.horsDossier; }).map(function (p) {
        if (typeof p.condition === 'function') { p.obligatoire = !!p.condition(id); }   // (07/09) obligation conditionnelle (seuil de vigilance)
        var d = self.get(portee, id, p.id);
        // un document À SIGNER passe par un état intermédiaire : généré mais pas encore signé —
        // il ne compte pas comme fourni tant que la signature manque.
        var st = d ? d.statut : 'manquante';
        if (d && p.genere && !d.signe && st !== 'refusee') st = 'a_signer';
        /* (10/09 — lot 4) UNE PIÈCE À DURÉE DE VIE SE REDEMANDE. Le Kbis « de moins de 3 mois » et l'attestation RC pro
           « en cours de validité » étaient validés une fois pour toutes : rien ne les redemandait, rien n'alertait le
           manager, et la colonne `expires_on` du schéma n'était jamais alimentée. */
        var perimee = !!(d && st === 'validee' && d.expiresOn && Date.parse(d.expiresOn) < Date.now());
        if (perimee) st = 'a_renouveler';
        // (10/09 — lot 4) un CONTRAT signé du seul intéressé n'engage personne en face : il attend la contresignature
        if (d && p.genere && d.signe && !d.contresigne && st !== 'refusee' && st !== 'a_renouveler') st = 'a_contresigner';
        // (24/09) une pièce d'identité à deux faces sans son verso (ni les deux faces dans un seul fichier) n'est pas complète
        if (d && !p.genere && st !== 'refusee' && self.facesManquantes(d).length) st = 'incomplete';
        /* (10/09 — lot 4, constat C12) LES CONDITIONS ONT BOUGÉ DEPUIS LA SIGNATURE : le document reste valable, mais
           il ne dit plus ce qui s'applique. Un avenant se signe — et tant qu'il ne l'est pas, la pièce n'est pas « à jour ». */
        var ecarts = (d && p.genere && d.signe && st !== 'refusee') ? self.conditionsEcart(portee, id, p.id) : [];
        if (ecarts.length) st = 'avenant';
        return Object.assign({}, p, {
          document: d, signe: !!(d && d.signe), statut: st, expiresOn: (d && d.expiresOn) || null, perimee: perimee,
          contresigne: !!(d && d.contresigne), ecarts: ecarts,
          libelle: { validee: 'Validée' + ((d && d.expiresOn) ? ' — valable jusqu\'au ' + new Date(d.expiresOn).toLocaleDateString('fr-FR') : ''), refusee: 'Refusée', deposee: 'Déposée — en vérification',
                     a_contresigner: 'Signé — attend la contresignature de PayEnCash', a_renouveler: 'Périmée — à renouveler', a_signer: 'Généré — à signer',
                     avenant: 'Conditions modifiées depuis la signature — avenant à signer', manquante: p.genere ? 'À générer puis signer' : 'À fournir',
                     incomplete: 'Incomplète — ' + self.facesManquantes(d).map(function (f) { return f.lbl.toLowerCase(); }).join(', ') + ' à déposer' }[st]
        });
      });
    },
    // Le dossier est COMPLET quand toutes les pièces obligatoires sont VALIDÉES par le manager.
    complet: function (portee, id) {
      return this.dossier(portee, id).every(function (p) { return !p.obligatoire || (p.statut === 'validee' && (!p.genere || p.signe)); });
    },
    manquantes: function (portee, id) {
      return this.dossier(portee, id).filter(function (p) { return p.obligatoire && p.statut !== 'validee'; });
    },

    // Le MANAGER contrôle : il ouvre le document, puis valide ou refuse AVEC un motif.
    statuer: function (portee, id, piece, statut, motif, par, extra) {
      var k = cle(portee, id, piece), d = lire(k); if (!d) return null;
      d.statut = statut; d.motif = motif || ''; d.statueAt = Date.now(); d.statuePar = par || 'manager';
      // (10/09 — lot 4) ce que le contrôleur a LU sur la pièce, et jusqu'à quand elle vaut : deux faits du contrôle, pas de l'écran
      if (extra && extra.mentions) d.mentions = extra.mentions;
      if (extra && extra.expiresOn) d.expiresOn = extra.expiresOn;
      if (!ecrit(k, d)) return null;                       // (11/09) verdict NON écrit : ni trace, ni retour de pièce
      noter(statut === 'validee' ? 'document_valide' : 'document_refuse', id, { portee: portee, piece: piece, motif: d.motif, par: d.statuePar });
      reveiller();
      return d;
    },
    /* TRANSFÉRER un dossier : les pièces déposées PENDANT la candidature vivent sous l'id du COMPTE ;
       à l'entrée dans le référentiel (compteValider → _compteLierMetier) elles suivent l'entité sous son id métier — rien ne se perd. */
    transferer: function (portee, deId, versId) {
      if (!deId || !versId || deId === versId) return 0;
      var n = 0, pfx = P + portee + ':' + deId + ':';
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf(pfx) === 0; }).forEach(function (k) {
          var piece = k.slice(pfx.length), v = localStorage.getItem(k);
          if (!localStorage.getItem(cle(portee, versId, piece))) { localStorage.setItem(cle(portee, versId, piece), v); n++; }
          localStorage.removeItem(k);
        });
      } catch (e) {}
      if (n) { noter('dossier_transfere', versId, { portee: portee, de: deId, pieces: n }); reveiller(); }
      return n;
    },
    supprimer: function (portee, id, piece) {
      try { localStorage.removeItem(cle(portee, id, piece)); } catch (e) {}
      noter('document_supprime', id, { portee: portee, piece: piece });
      reveiller();
    },
    reset: function (portee) {
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf(P + (portee ? portee + ':' : '')) === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    },

    /* ── FRAIS D'EXAMEN (référentiel PEC_DATA.ref.verification.tarifs) : gratuit pour le
          client et le commerçant partenaire ; payant pour le fournisseur — au tarif
          normal à la création, au tarif URGENCE quand une commande client attend derrière. ── */
    tarifs: function () {
      try { return (window.PEC_DATA && PEC_DATA.ref && PEC_DATA.ref.verification && PEC_DATA.ref.verification.tarifs) || {}; }
      catch (e) { return {}; }
    },
    fraisDe: function (portee, urgence) {
      var t = this.tarifs();
      if (portee === 'fournisseur') return urgence ? (t.fournisseurUrgence || 0) : (t.fournisseur || 0);
      return t[portee] || 0;
    },
    fraisRegles: function (portee, id) { return lire('pec-kyb-frais:' + portee + ':' + id); },

    /* ── L'ÉTAT DU DOSSIER, en un mot : ce qui manque, ce qui est dû, où on en est. ── */
    etat: function (portee, id) {
      var d = this.dossier(portee, id);
      // (08/09) une pièce obligatoire GÉNÉRÉE mais NON SIGNÉE manque autant qu'une pièce absente — avant, le dossier se disait « prêt à envoyer », les frais partaient, et il ne pouvait jamais devenir valide
      // (10/09 — lot 4) `a_contresigner` n'est PAS un manque du déposant : la balle est chez PayEnCash. Elle empêche le
      // dossier d'être COMPLET (donc la validation du compte), pas son envoi au contrôle.
      var manque = d.filter(function (p) { return p.obligatoire && (p.statut === 'manquante' || p.statut === 'a_signer' || p.statut === 'a_renouveler' || p.statut === 'incomplete'); });   // un PDF déposé (signé hors app) compte comme fourni ; une pièce PÉRIMÉE manque (10/09)
      var refus = d.filter(function (p) { return p.statut === 'refusee'; });
      var attente = d.filter(function (p) { return p.statut === 'deposee'; });
      var frais = this.fraisRegles(portee, id);
      var du = this.fraisDe(portee, false);
      var soumis = lire('pec-kyb-soumis:' + portee + ':' + id);
      var etat = this.complet(portee, id) ? 'valide'
        : refus.length ? 'a_corriger'
        : (manque.length ? 'a_completer' : (soumis ? 'en_verification' : 'a_soumettre'));
      return { etat: etat, manquantes: manque, refusees: refus, enAttente: attente,
        fraisDus: du, fraisRegles: frais, urgence: !!(soumis && soumis.urgence),
        soumisAt: soumis ? soumis.at : null,
        libelle: { valide: 'Dossier validé', a_corriger: 'Pièce refusée — à remplacer',
                   a_completer: 'Dossier incomplet', a_soumettre: 'Prêt à envoyer',
                   en_verification: 'En cours de vérification' }[etat] };
    },
    // ENVOYER SON DOSSIER : refusé tant qu'il manque une pièce ou que les frais sont dus.
    soumettre: function (portee, id, opts) {
      opts = opts || {};
      var e = this.etat(portee, id);
      // en CANDIDATURE, les pièces GÉNÉRÉES (contrat) viennent après la validation du dossier : elles ne manquent pas
      var manq = opts.candidature ? e.manquantes.filter(function (p) { return !p.genere; }) : e.manquantes;
      if (manq.length) return { ok: false, motif: 'Il manque ' + manq.length + ' pièce' + (manq.length > 1 ? 's' : '') + ' : ' + manq.map(function (p) { return p.label; }).join(', ') + '.' };
      if (e.refusees.length) return { ok: false, motif: 'Une pièce a été refusée — remplace-la avant d\'envoyer.' };
      var du = this.fraisDe(portee, opts.urgence);
      if (du > 0 && !this.fraisRegles(portee, id)) return { ok: false, motif: 'frais', montant: du, urgence: !!opts.urgence };
      // DISPATCH AUTOMATIQUE (fondatrice 05/09 : « comment s'organise le dispatch des KYB/KYC
      // côté hotline — automatise tout ça ») : le dossier part vers l'hôte EN POSTE (le moins
      // chargé, comme les appels), avec l'échéance du référentiel. Sans personne en poste, il
      // reste « à prendre » — jamais assigné à un fantôme.
      var hote = null;
      try { var h = window.PEC_DATA && PEC_DATA.hoteEnPoste && PEC_DATA.hoteEnPoste(); hote = h ? (h.nom || h) : null; } catch (eH) {}
      var dl = ((((window.PEC_DATA || {}).ref || {}).verification || {}).delaiHeures) || { standard: 48, urgence: 4 };
      var heures = opts.urgence ? (dl.urgence || 4) : (dl.standard || 48);
      var s2 = { portee: portee, id: id, at: Date.now(), urgence: !!opts.urgence, commande: opts.commande || null,
                 assigne: hote, echeance: Date.now() + heures * 3600000, heures: heures };
      if (!ecrit('pec-kyb-soumis:' + portee + ':' + id, s2)) return { ok: false, motif: 'stockage', message: 'Le dossier n\'a PAS été soumis (stockage de l\'appareil plein) — rien n\'a été transmis ni tracé.' };
      noter('kyb_soumis', id, { portee: portee, urgence: s2.urgence, commande: s2.commande, assigne: s2.assigne, echeance: s2.echeance });
      reveiller();
      return { ok: true, dossier: s2 };
    },
    // LA FILE DE CONTRÔLE — la même pour la hotline et le manager ; l'urgent d'abord.
    aVerifier: function () {
      var self = this, out = [];
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf('pec-kyb-soumis:') === 0; }).forEach(function (k) {
          var s2 = lire(k); if (!s2) return;
          var e = self.etat(s2.portee, s2.id);
          if (e.etat === 'valide') return;
          var reste = (s2.echeance || 0) - Date.now();
          out.push({ portee: s2.portee, id: s2.id, urgence: !!s2.urgence, at: s2.at, commande: s2.commande,
                     enAttente: e.enAttente.length, etat: e.etat, libelle: e.libelle,
                     assigne: s2.assigne || null, echeance: s2.echeance || null, heures: s2.heures || null,
                     resteMs: reste, retard: !!(s2.echeance && reste < 0),
                     // ESCALADE : passé l'échéance, le dossier remonte au manager, qui le voit en rouge
                     escalade: !!(s2.echeance && reste < 0) });
        });
        /* (10/09 — lot 4) LES DOSSIERS DÉPOSÉS MAIS PAS ENCORE ENVOYÉS SE VOIENT AUSSI. Un candidat qui joint ses pièces
           sans cliquer « Régler et envoyer » n'apparaissait NULLE PART côté manager : ni dans la file de contrôle, ni
           dans un écran ouvrable — alors que ce sont précisément les pièces que la validation du compte exige. */
        var vus = {}; out.forEach(function (o) { vus[o.portee + ':' + o.id] = true; });
        Object.keys(localStorage).filter(function (k) { return k.indexOf(P) === 0; }).forEach(function (k) {
          var parts = k.slice(P.length).split(':'); if (parts.length < 3) return;
          var portee = parts[0], id = parts[1], cle2 = portee + ':' + id;
          if (vus[cle2] || !self.PIECES[portee]) return;
          vus[cle2] = true;
          var e2 = self.etat(portee, id);
          if (e2.etat === 'valide') return;
          out.push({ portee: portee, id: id, urgence: false, at: 0, commande: null, nonSoumis: true,
                     enAttente: e2.enAttente.length, etat: e2.etat, libelle: e2.libelle + ' — pas encore envoyé au contrôle',
                     assigne: null, echeance: null, heures: null, resteMs: null, retard: false, escalade: false });
        });
      } catch (e3) {}
      return out.sort(function (a, b) { return (b.urgence - a.urgence) || (a.nonSoumis - b.nonSoumis) || (a.at - b.at); });
    },
    // Prendre un dossier (ou le passer à quelqu'un) — le dispatch automatique reste rattrapable.
    assigner: function (portee, id, qui) {
      var k = 'pec-kyb-soumis:' + portee + ':' + id, d = lire(k); if (!d) return null;
      d.assigne = qui || null;
      if (!ecrit(k, d)) return null;
      noter('kyb_assigne', id, { portee: portee, assigne: d.assigne });
      reveiller();
      return d;
    },
    // Le temps restant, en clair.
    resteLbl: function (ms) {
      if (ms == null) return '';
      var neg = ms < 0; ms = Math.abs(ms);
      var h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
      var t = h >= 1 ? (h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : '')) : (m + ' min');
      return neg ? ('en retard de ' + t) : ('sous ' + t);
    },

    // OUVRIR / TÉLÉCHARGER le vrai fichier — c'est ce qui manquait : on validait sans voir.
    // Découpe un data URL en {type, base64}. On coupe au PREMIER « , » (c'est la règle), et
    // si le préfixe contient un « ;base64 » plus loin, c'est un data URL malformé par un type
    // à virgule (« codecs=vp8,opus ») : on rattrape en repartant du dernier « ;base64, ».
    depiecer: function (data) {
      var d = String(data || ''), i = d.indexOf(',');
      if (i === -1) return null;
      var tete = d.slice(0, i), corps = d.slice(i + 1);
      if (corps.indexOf(';base64,') !== -1) {
        var j = corps.lastIndexOf(';base64,');
        tete = tete + ',' + corps.slice(0, j) + ';base64';
        corps = corps.slice(j + 8);
      }
      return { type: (tete.match(/^data:([^;]+)/) || [])[1] || '', b64: corps };
    },
    blob: function (doc) {
      if (!doc || !doc.data) return null;
      var p = this.depiecer(doc.data); if (!p) return null;
      var bin; try { bin = atob(p.b64); } catch (e) { return null; }
      var n = bin.length, u = new Uint8Array(n);
      for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
      return new Blob([u], { type: p.type || doc.type || 'application/octet-stream' });
    },
    // Une source LISIBLE par <video>/<img>, même si le document stocké est malformé.
    source: function (doc) {
      var p = this.depiecer(doc && doc.data); if (!p) return '';
      var t = (p.type || doc.type || '').split(';')[0];
      return 'data:' + (t || 'application/octet-stream') + ';base64,' + p.b64;
    },
    ouvrir: function (portee, id, piece) {
      var d = typeof portee === 'object' ? portee : this.get(portee, id, piece);
      var b = this.blob(d); if (!b) return false;
      var u = URL.createObjectURL(b);
      window.open(u, '_blank', 'noopener');
      setTimeout(function () { URL.revokeObjectURL(u); }, 30000);
      return true;
    },
    telecharger: function (portee, id, piece) {
      var d = typeof portee === 'object' ? portee : this.get(portee, id, piece);
      var b = this.blob(d); if (!b) return false;
      var u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = d.nom || 'document'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
      return true;
    },
    /* (10/09 — lot 4) UNE TAILLE QU'ON N'A PAS NE S'AFFICHE PAS. Un document entré autrement que par un dépôt de fichier
       (dossier papier transcrit, entrée héritée) n'a pas d'octets : la ligne affichait « NaN Ko » au contrôleur. */
    taille: function (o) { var n = Number(o); if (!isFinite(n) || n <= 0) return 'taille inconnue'; return n > 999999 ? (n / 1048576).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' Ko'; },

    /* ── GÉNÉRATEUR DE PDF (vanilla, sans librairie) : un vrai fichier PDF, ouvrable et
          imprimable, pour les documents QUE NOUS produisons — contrat, facture, reçu de dépôt.
          Une page A4, Helvetica, texte simple : c'est ce qu'un document à signer demande. ── */
    pdf: function (titre, lignes, opts) {
      opts = opts || {};
      var esc = function (t) { return String(t == null ? '' : t).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); };
      // les accents en WinAnsi : le PDF de base ne connaît pas l'UTF-8
      var win = function (t) {
        var m = { 'é': '\\351', 'è': '\\350', 'ê': '\\352', 'ë': '\\353', 'à': '\\340', 'â': '\\342', 'ä': '\\344',
                  'î': '\\356', 'ï': '\\357', 'ô': '\\364', 'ö': '\\366', 'ù': '\\371', 'û': '\\373', 'ü': '\\374',
                  'ç': '\\347', 'É': '\\311', 'È': '\\310', 'À': '\\300', 'Ç': '\\307', '°': '\\260', '€': 'EUR',
                  '’': "'", '«': '\\253', '»': '\\273', '—': '-', '–': '-', '·': '\\267', '✓': 'v' };
        return String(t == null ? '' : t).replace(/[^\x00-\x7F]/g, function (c) { return m[c] !== undefined ? m[c] : '?'; });
      };
      // MULTI-PAGES (05/09) : une page unique coupait la fin des documents — un contrat perdait
      // son bloc de signature en silence. On ouvre une page dès qu'on atteint le bas.
      var pages = [], flux = '', y = 0;
      function nouvellePage(avecTitre) {
        if (flux) pages.push(flux);
        flux = ''; y = 800;
        if (avecTitre) { flux += 'BT\n/F2 16 Tf\n60 ' + y + ' Td\n(' + win(esc(titre)) + ') Tj\nET\n'; y -= 30; }
        else { flux += 'BT\n/F1 8 Tf\n60 812 Td\n(' + win(esc(titre + ' — suite')) + ') Tj\nET\n'; }
      }
      // Coupe à la LARGEUR RÉELLE (table Helvetica), pas à 92 caractères : une ligne de
      // capitales est 25 % plus large qu'une ligne de minuscules — compter les signes
      // débordait la page d'un côté et laissait des lignes orphelines de l'autre.
      var LARG = { ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
        '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, ':': 278,
        ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015, '[': 278, '\\': 278, ']': 278,
        '^': 469, '_': 556, '`': 333, '{': 334, '|': 260, '}': 334, '~': 584,
        'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778, 'H': 722, 'I': 278,
        'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778, 'P': 667, 'Q': 778, 'R': 722,
        'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667, 'Y': 667, 'Z': 611,
        'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556, 'h': 556, 'i': 222,
        'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556, 'p': 556, 'q': 556, 'r': 333,
        's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722, 'x': 500, 'y': 500, 'z': 500 };
      var ACC = { 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'à': 'a', 'â': 'a', 'ä': 'a', 'î': 'i',
        'ï': 'i', 'ô': 'o', 'ö': 'o', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'É': 'E', 'È': 'E',
        'Ê': 'E', 'À': 'A', 'Â': 'A', 'Î': 'I', 'Ô': 'O', 'Ù': 'U', 'Û': 'U', 'Ç': 'C',
        '’': "'", '«': '"', '»': '"', '—': '-', '–': '-', '·': '.', '€': 'EUR', '°': 'o', '✓': 'v' };
      var MAXL = 490; // 595 (A4) - 60 de marge gauche - 45 de marge droite
      function larg(t, gras) {
        var s2 = 0;
        for (var i5 = 0; i5 < t.length; i5++) {
          var c = t.charAt(i5); if (ACC[c] !== undefined) c = ACC[c];
          if (c.length > 1) { s2 += larg(c, false) * 100; continue; }
          var w = LARG[c]; if (w === undefined) w = 556;
          s2 += w;
        }
        return s2 * (gras ? 1.09 : 1) / 100;
      }
      function couper(txt, gras) {
        var t = String(txt == null ? '' : txt);
        // Une ligne qui tient est rendue TELLE QUELLE : les colonnes du bloc de signature
        // sont alignées avec des suites d'espaces, et normaliser les écraserait.
        if (!t) return [];
        if (larg(t, gras) <= MAXL) return [t];
        var indent = (t.match(/^\s*/) || [''])[0], corps = t.slice(indent.length);
        var max = MAXL - larg(indent, false);
        var mots = corps.split(/\s+/).filter(Boolean), out = [], cur = '';
        for (var i6 = 0; i6 < mots.length; i6++) {
          var essai = cur ? cur + ' ' + mots[i6] : mots[i6];
          if (cur && larg(essai, gras) > max) { out.push(cur); cur = mots[i6]; }
          else cur = essai;
        }
        if (cur) out.push(cur);
        return out.map(function (l) { return indent + l; });
      }
      function ecrire(txt, gras) {
        couper(txt, gras).forEach(function (part) {
          if (y < 70) nouvellePage(false);
          flux += 'BT\n/' + (gras ? 'F2' : 'F1') + ' 10 Tf\n60 ' + y + ' Td\n(' + win(esc(part)) + ') Tj\nET\n';
          y -= 15;
        });
      }
      nouvellePage(true);
      (lignes || []).forEach(function (l) {
        if (l && typeof l === 'object') {
          if (l.saut) { y -= (l.saut === true ? 12 : l.saut); if (y < 70) nouvellePage(false); return; }
          ecrire(l.texte, !!l.gras);
        } else ecrire(l, false);
      });
      pages.push(flux);

      // assemblage : 1 catalogue, 1 arbre de pages, N pages, N flux, 2 polices
      var nb = pages.length, objets = [], kids = [];
      for (var i = 0; i < nb; i++) kids.push((3 + i) + ' 0 R');
      objets.push('<< /Type /Catalog /Pages 2 0 R >>');
      objets.push('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + nb + ' >>');
      for (var i2 = 0; i2 < nb; i2++) {
        objets.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ' + (3 + nb + nb) + ' 0 R /F2 ' + (4 + nb + nb) + ' 0 R >> >> /Contents ' + (3 + nb + i2) + ' 0 R >>');
      }
      for (var i3 = 0; i3 < nb; i3++) objets.push('<< /Length ' + pages[i3].length + ' >>\nstream\n' + pages[i3] + 'endstream');
      objets.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      objets.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

      var out = '%PDF-1.4\n', pos = [];
      objets.forEach(function (o, i4) { pos.push(out.length); out += (i4 + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
      var xref = out.length;
      out += 'xref\n0 ' + (objets.length + 1) + '\n0000000000 65535 f \n';
      pos.forEach(function (p2) { out += String(p2).padStart(10, '0') + ' 00000 n \n'; });
      out += 'trailer\n<< /Size ' + (objets.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
      var b = new Blob([out], { type: 'application/pdf' });
      if (opts.telecharger !== false) {
        var u = URL.createObjectURL(b), a = document.createElement('a');
        a.href = u; a.download = (opts.nom || titre.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
      }
      return b;
    },

    // Le PDF devient un DOCUMENT du dossier : généré, il se dépose comme un fichier reçu.
    deposerPdf: function (portee, id, piece, titre, lignes, meta) {
      var b = this.pdf(titre, lignes, { telecharger: false });
      var self = this;
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () {
          var doc = Object.assign({ portee: portee, id: id, piece: piece,
            nom: (meta && meta.nom) || (titre.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf'),
            type: 'application/pdf', taille: b.size, at: Date.now(), statut: 'deposee', motif: '',
            data: String(fr.result), genere: true }, meta || {});
          try { localStorage.setItem(cle(portee, id, piece), JSON.stringify(doc)); } catch (e) { return rej(new Error('Coffre plein sur cet appareil.')); }
          noter('document_depose', id, { portee: portee, piece: piece, nom: doc.nom, par: portee, genere: true });
          reveiller(); res(doc);
        };
        fr.onerror = function () { rej(new Error('Génération impossible.')); };
        fr.readAsDataURL(b);
      });
    }
  };


  /* ── LE DOSSIER À L'ÉCRAN : un seul composant pour les deux espaces (fournisseur et partenaire
        côté dépôt ; manager côté contrôle). Chaque ligne dit l'état RÉEL de la
        pièce et propose les gestes possibles — déposer, ouvrir, télécharger, remplacer ;
        et côté manager : valider ou refuser avec motif. Rien n'est simulé. ── */
  /* ── VIDÉO DE VÉRIFICATION (fondatrice 05/09 : « pour un KYC ou KYB il y a une vidéo qui
        doit être faite ») : capture RÉELLE par la caméra (getUserMedia + MediaRecorder) avec
        une consigne tirée au sort — le contrôleur vérifie que la personne l'a bien suivie, ce
        qui distingue une vraie prise d'une vidéo rejouée. Sans caméra (ordinateur sans webcam,
        autorisation refusée), on le DIT et on propose de déposer une vidéo depuis l'appareil. ── */
  // Un SCÉNARIO, pas une phrase : des étapes minutées qui défilent pendant la prise. Le
  // contrôleur reçoit la même liste — il coche ce qu'il voit. C'est la succession de gestes
  // demandés CE JOUR-LÀ qui distingue une prise réelle d'une vidéo rejouée.
  DOCS.SCENARIOS = [
    { id: 'gauche', etapes: [
        { t: 'Regarde l\'objectif, visage bien éclairé', s: 3 },
        { t: 'Montre ta pièce d\'identité à côté de ton visage', s: 4 },
        { t: 'Tourne lentement la tête à gauche', s: 3 } ] },
    { id: 'droite', etapes: [
        { t: 'Regarde l\'objectif, visage bien éclairé', s: 3 },
        { t: 'Montre ta pièce d\'identité à côté de ton visage', s: 4 },
        { t: 'Tourne lentement la tête à droite', s: 3 } ] },
    { id: 'approche', etapes: [
        { t: 'Regarde l\'objectif, visage bien éclairé', s: 3 },
        { t: 'Montre ta pièce d\'identité à côté de ton visage', s: 4 },
        { t: 'Approche la pièce de la caméra, texte lisible', s: 3 } ] },
    { id: 'date', etapes: [
        { t: 'Regarde l\'objectif, visage bien éclairé', s: 3 },
        { t: 'Montre ta pièce d\'identité à côté de ton visage', s: 4 },
        { t: 'Dis à voix haute la date du jour', s: 4 } ] }
  ];
  // Le scénario du jour pour ce dossier — stable dans la journée, différent d'un jour à l'autre.
  DOCS.scenarioDuJour = function (id) {
    var n = 0, t = String(id || '') + new Date().toDateString();
    for (var i = 0; i < t.length; i++) n = (n * 31 + t.charCodeAt(i)) >>> 0;
    var sc = this.SCENARIOS[n % this.SCENARIOS.length];
    var duree = sc.etapes.reduce(function (a2, e) { return a2 + e.s; }, 0);
    return { id: sc.id, etapes: sc.etapes, duree: duree, jour: new Date().toDateString() };
  };
  // La consigne reste une PHRASE (affichée partout, stockée avec la pièce) : c'est le résumé
  // du scénario, pas une donnée de plus à maintenir en double.
  DOCS.consigneDuJour = function (id) {
    var sc = this.scenarioDuJour(id);
    return sc.etapes.map(function (e) { return e.t; }).join(' · ') + '.';
  };
  // Ouvre la caméra, enregistre `secondes`, et dépose la vidéo comme pièce du dossier.
  DOCS.capturerVideo = function (portee, id, piece, opts) {
    opts = opts || {};
    var self = this, sc = opts.scenario || self.scenarioDuJour(id);
    var secondes = opts.secondes || sc.duree || 6;
    return new Promise(function (res, rej) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
        return rej(new Error("La caméra n'est pas disponible sur cet appareil — dépose une vidéo enregistrée à la place."));
      }
      var ouvrir = opts.flux ? Promise.resolve(opts.flux)
        : navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      ouvrir.then(function (flux) {
        var type = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].filter(function (t) {
          try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; }
        })[0] || '';
        var rec = new MediaRecorder(flux, type ? { mimeType: type, videoBitsPerSecond: 600000 } : undefined);
        var morceaux = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) morceaux.push(e.data); };
        rec.onstop = function () {
          // On ne coupe QUE le flux qu'on a ouvert soi-même : celui de l'aperçu appartient
          // à l'appelant, qui le referme quand il ferme sa fenêtre.
          if (!opts.flux) flux.getTracks().forEach(function (t2) { t2.stop(); });
          // Type SANS paramètres : une virgule dans « codecs=vp8,opus » coupe le data URL en
          // deux et rend la vidéo illisible — c'est pour ça qu'on ne voyait rien côté hotline.
          var typeSimple = String(type || 'video/webm').split(';')[0] || 'video/webm';
          var b = new Blob(morceaux, { type: typeSimple });
          var fr = new FileReader();
          fr.onload = function () {
            var doc = { portee: portee, id: id, piece: piece, nom: 'verification-' + id + '.webm',
              type: typeSimple, taille: b.size, at: Date.now(), statut: 'deposee', motif: '',
              data: String(fr.result), consigne: opts.consigne || self.consigneDuJour(id),
              etapes: (sc.etapes || []).map(function (e) { return e.t; }), scenario: sc.id, secondes: secondes, capturee: true };
            try { localStorage.setItem('pec-doc:' + portee + ':' + id + ':' + piece, JSON.stringify(doc)); }
            catch (e) { return rej(new Error('Vidéo trop lourde pour le coffre — refais-en une plus courte.')); }
            try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('video_verification', id, { portee: portee, secondes: secondes, consigne: doc.consigne }); } catch (e2) {}
            try { window.dispatchEvent(new Event('pec-bus')); } catch (e3) {}
            res(doc);
          };
          fr.onerror = function () { rej(new Error('Enregistrement illisible.')); };
          fr.readAsDataURL(b);
        };
        if (opts.apercu) {
          // aperçu MUET (sinon larsen) et en MIROIR : on se regarde comme dans une glace.
          try { opts.apercu.srcObject = flux; opts.apercu.muted = true; opts.apercu.play(); } catch (e) {}
        }
        rec.start();
        // Le scénario défile PENDANT la prise : chaque étape s'affiche à son tour, avec le
        // temps qui reste. Sans ça, la personne enregistre sans savoir quoi faire.
        var reste = secondes, iEt = 0, ecoule = 0, borne = (sc.etapes[0] || {}).s || secondes;
        if (opts.onEtape) opts.onEtape(sc.etapes[0], 0, sc.etapes.length);
        var t3 = setInterval(function () {
          reste--; ecoule++;
          if (opts.onTick) opts.onTick(Math.max(0, reste));
          if (ecoule >= borne && iEt < sc.etapes.length - 1) {
            iEt++; borne += (sc.etapes[iEt] || {}).s || 0;
            if (opts.onEtape) opts.onEtape(sc.etapes[iEt], iEt, sc.etapes.length);
          }
          if (reste <= 0) clearInterval(t3);
        }, 1000);
        setTimeout(function () { try { clearInterval(t3); rec.stop(); } catch (e) {} }, secondes * 1000);
      }).catch(function (e) {
        rej(new Error("Caméra refusée ou indisponible — dépose une vidéo enregistrée à la place."));
      });
    });
  };

  /* ── LES DOCUMENTS QUE NOUS PRODUISONS (fondatrice 05/09 : « revois les documents juridiques
        liés au process ») : un seul endroit pour les rédiger, et TOUT vient du référentiel —
        raison sociale, SIREN, RCS, siège, plafonds, délais, taux, version des CGV. On n'invente
        ni un montant ni une mention légale ; ce qui n'existe pas dans les données n'est pas écrit.
        ⚠ Rédaction de maquette : à faire relire par un juriste avant emploi réel. ── */
  DOCS.societe = function () {
    var r = (window.PEC_DATA && PEC_DATA.ref) || {}, s2 = r.societe || {};
    return { nom: s2.nom || 'AJEK', forme: s2.forme || '', marque: 'PayEnCash',
      siege: s2.siege || '', siren: s2.siren || '', rcs: s2.rcs || '', presidente: s2.presidente || '',
      naf: s2.naf || '', tva: s2.tvaIntra || s2.tva || '', capital: s2.capital || '' };
  };
  DOCS.enTete = function (titre) {
    var s2 = this.societe();
    return [
      { texte: s2.nom + (s2.forme ? ', ' + s2.forme : '') + (s2.capital ? ' au capital de ' + s2.capital : '') + ' — marque ' + s2.marque, gras: true },
      'Siège social : ' + s2.siege,
      [s2.rcs ? 'RCS ' + s2.rcs : (s2.siren ? 'SIREN ' + s2.siren : ''), s2.tva ? 'TVA intracommunautaire ' + s2.tva : '', s2.naf ? 'NAF ' + s2.naf : ''].filter(Boolean).join(' · '),
      s2.presidente ? 'Représentée par ' + s2.presidente + ', présidente, dûment habilitée.' : '',
      { saut: 6 },
      'Ci-après « ' + s2.nom + ' ».',
      { saut: 12 }
    ].filter(function (l) { return l !== ''; });
  };
  /* « Fait à 13700 Marignane » : le code postal n'a rien à faire dans un lieu de signature. */
  DOCS.ville = function () {
    var v = (String(this.societe().siege).split(',').pop() || '').trim();
    return v.replace(/^\d{4,5}\s*/, '') || v;
  };
  DOCS.pied = function (qui) {
    return [
      { saut: 14 },
      'Fait à ' + this.ville() + ', le ' + new Date().toLocaleDateString('fr-FR') + ', en deux exemplaires.',
      { saut: 8 },
      "Chaque partie reconnaît avoir lu l'intégralité du présent document avant de le signer.",
      { saut: 22 },
      'Pour ' + this.societe().nom + ' :                                   Pour ' + qui + ' :',
      { saut: 26 },
      '(signature et cachet)                                    (signature, précédée de « lu et approuvé »)'
    ];
  };

  /* Petit rédacteur : les articles se numérotent tout seuls — aucun « ARTICLE 7 » figé qui se
     décale dès qu'on insère une clause, et aucune numérotation à maintenir à la main. */
  function Redac() { this.n = 0; this.l = []; }
  Redac.prototype.bloc = function (titre) { this.l.push({ saut: 10 }); this.l.push({ texte: titre, gras: true }); return this; };
  Redac.prototype.art = function (titre) { this.n++; this.l.push({ saut: 8 }); this.l.push({ texte: 'ARTICLE ' + this.n + ' — ' + titre, gras: true }); return this; };
  Redac.prototype.p = function () { for (var i = 0; i < arguments.length; i++) { if (arguments[i]) this.l.push(arguments[i]); } return this; };

  /* « de AJEK » se lit mal : l'élision se calcule, elle ne se recopie pas. */
  DOCS.deSociete = function () {
    var n = this.societe().nom || '';
    return (/^[aeiouyàâéèêîôûh]/i.test(n) ? "d'" : 'de ') + n;
  };
  DOCS.juridique = function () { var r = (window.PEC_DATA && PEC_DATA.ref) || {}; return r.juridique || {}; };
  /* Le tribunal se déduit du RCS du référentiel — on n'écrit pas une ville en dur. */
  DOCS.tribunal = function () {
    var v = String(this.societe().rcs || '').replace(/[0-9\s]+$/, '').trim();
    if (!v) return 'le tribunal de commerce territorialement compétent';
    return 'le tribunal de commerce ' + (/^[aeiouyàâéèêîôû]/i.test(v) ? "d'" : 'de ') + v;
  };

  /* Les clauses que TOUT contrat professionnel porte. Écrites une fois, numérotées à la suite
     de celles du contrat qui les appelle. `qui` = la partie signataire (« le distributeur », « le fournisseur »…).
     (24/09 — relecture juridique) DONNÉES PERSONNELLES : bases 6.1.b / 6.1.f / 6.1.c (comptable seulement) — AJEK n'est
     pas assujettie à la LCB-FT ; les durées viennent de ref.juridique.conservation (à aligner : L110-4, pièce 6 ans,
     vidéo regardée puis supprimée, mandat SEPA 13 mois L133-24, compte inactif 2 ans) ; les nouvelles clés
     (interetLegitime, pieceIdentite, mandatSepa, compteInactif) sont lues avec un repli exact. */
  DOCS.clausesCommunes = function (R, qui, opts) {
    opts = opts || {};
    var J = this.juridique(), S = this.societe(), C = J.conservation || {}, B = J.baseLegale || {};
    var rg = ((window.PEC_DATA && PEC_DATA.ref) || {}).rgpd || {};
    var Qui = qui.charAt(0).toUpperCase() + qui.slice(1);
    R.art('CONFIDENTIALITÉ')
     .p("Chaque partie s'interdit de divulguer les informations commerciales, techniques et financières",
        "portées à sa connaissance au titre du présent contrat, et de les utiliser à d'autres fins que",
        "son exécution. Cette obligation survit deux ans à la fin du contrat.")
     .art('PROPRIÉTÉ INTELLECTUELLE ET MARQUE')
     .p("La marque " + S.marque + ", les applications, les visuels, la signalétique et la documentation restent",
        "la propriété exclusive " + this.deSociete() + ". " + Qui + " bénéficie, pour la seule durée du contrat, d'un",
        "droit d'usage limité aux supports qui lui sont remis. Toute autre utilisation, tout dépôt de",
        "signe similaire et toute communication publique sont soumis à l'accord écrit préalable " + this.deSociete() + ".")
     .art('DONNÉES PERSONNELLES')
     .p("Responsable de traitement : " + S.nom + ", " + S.siege + ".",
        "Finalités : exécution du contrat, facturation et comptabilité, prévention de la fraude et sécurité de la relation.",
        "Bases légales : " + (B.contrat || "exécution du contrat (art. 6.1.b RGPD)") + " ; " + (B.interetLegitime || "intérêt légitime — prévention de la fraude et sécurité contractuelle (art. 6.1.f RGPD)") + " ; " + (B.obligation || "obligation légale comptable et fiscale (art. 6.1.c RGPD)") + ", pour la seule comptabilité et le fiscal.",
        S.nom + " n'est pas assujettie à la lutte contre le blanchiment (art. L. 561-2 du code monétaire et financier) : ses vérifications relèvent de la prévention de la fraude.",
        "Conservation — dossier de vérification : " + (C.dossierVerification || "la durée de la relation, puis 5 ans (art. L. 110-4 du code de commerce)") + ".",
        "Conservation — pièces comptables : " + (C.facture || "10 ans (art. L. 123-22 du code de commerce)") + ".",
        ["copie de la pièce d'identité : " + (C.pieceIdentite || "6 ans au plus, filigranée (référentiel CNIL)"),
         "vidéo de vérification : " + (C.video || "regardée par une personne habilitée puis supprimée, sans comparaison automatique"),
         "mandat SEPA : " + (C.mandatSepa || "13 mois après le dernier prélèvement (art. L. 133-24 du code monétaire et financier)"),
         "journal des opérations : " + (C.journal || "la durée de la relation, puis 5 ans"),
         "compte inactif : " + (C.compteInactif || "supprimé après 2 ans sans connexion")].join(' · ') + ".",
        "Droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité :",
        "demande écrite au siège, réponse sous " + (rg.reponseJours || 30) + " jours. Réclamation possible auprès de la CNIL.",
        "Les documents déposés sont chiffrés" + (rg.chiffrement ? ' (' + rg.chiffrement + ')' : '') + " et ne sont consultables que par les personnes habilitées.",
        "La politique de confidentialité en vigueur pour " + qui + " complète le présent article.")
     .art('FORCE MAJEURE')
     .p("Aucune partie n'est responsable d'un manquement causé par un événement de force majeure au sens",
        "de l'article 1218 du code civil. Si l'empêchement dure plus de trente jours, chaque partie peut",
        "résilier de plein droit par lettre recommandée, sans indemnité.");
    if (opts.cession !== false) {
      R.art('CESSION, INTÉGRALITÉ ET NULLITÉ PARTIELLE')
       .p("Le contrat est conclu en considération de la personne : il ne peut être cédé ni transféré sans",
          "l'accord écrit préalable de l'autre partie. Il exprime l'intégralité de l'accord des parties et",
          "annule tout échange antérieur de même objet. La nullité d'une clause n'emporte pas celle du",
          "contrat : les parties lui substituent une clause de portée économique équivalente.");
    }
    R.art('DIFFÉRENDS ET JURIDICTION COMPÉTENTE')
     .p("Avant toute action, la partie la plus diligente notifie son grief par écrit ; les parties disposent",
        "de " + (J.preavisAmiableJours || 30) + " jours pour rechercher une solution amiable.",
        "Le présent contrat est soumis au " + (J.droitApplicable || 'droit français') + ".",
        "À défaut d'accord amiable, le litige est porté devant " + (opts.instance || this.tribunal()) + ".");
    return R;
  };

  /* Les documents du process, chacun avec les clauses qui le rendent utile. */
  DOCS.MODELES = {
    /* ══ (23/09) MARQUE PARTENAIRE : CONTRAT-CADRE D'ACHAT ET DE DISTRIBUTION DES BONS D'ACHAT (nous ACHETONS — plus de mandat) ══
       Il porte la structure arrêtée par la consultation du 23/09 (Étape 5 du document juridique) : exclusivité
       ÉTROITE (réseaux de commerces physiques seulement — la marque garde toute sa vente directe), durée ferme
       d'un an SANS reconduction tacite, obligation de MOYENS de notre côté, clause de rendez-vous à six mois
       plutôt qu'une résiliation automatique, garantie MONO-ENSEIGNE qualifiée de déterminante du consentement
       (c'est elle qui fonde l'exclusion de l'art. L521-3 I 1° CMF), et survie de l'obligation d'honorer les bons
       après l'extinction. Les taux et délais viennent de l'OFFRE que la marque a choisie — ils sont FIGÉS dans
       le contrat qu'elle signe, et un changement d'offre passe par un avenant (conditionsEcart).
       ⚠ Modèle de travail : à faire relire par un avocat avant tout emploi réel. ══ */
    contrat_marchand: function (ctx) {
      var D = window.PEC_DATA, S = DOCS.societe(), J = DOCS.juridique();
      var R0 = (D && D.techRef) ? D.techRef() : {};
      var m = (D && D.techMarchand && ctx && ctx.id) ? D.techMarchand(ctx.id) : null;
      var M = (ctx && ctx.id) ? (DOCS.mentions('marchand', ctx.id) || {}) : {};
      var nom = M.raisonSociale || (m && m.raisonSociale) || (ctx && ctx.nom) || '—';
      var siret = M.siret || (m && m.siret) || '—';
      var adresse = M.adresse || (ctx && ctx.adresse) || '—';
      /* (23/09, soir) LE SIGNATAIRE EST LE DIRIGEANT DÉCLARÉ, dont la pièce d'identité a été contrôlée (KYC) : le contrat le
         nomme avec sa qualité et la date du contrôle — c'est ce qui rend la signature opposable. Le Kbis validé, s'il porte
         un autre nom, se lit au dossier : ici on écrit qui signe. */
      var dirD = (m && D.techMarchandDirigeant) ? D.techMarchandDirigeant(m) : null;
      var dirigeant = (ctx && ctx.dirigeant) || (dirD && dirD.nomComplet) || M.dirigeant || 'son représentant légal';
      var qualite = (ctx && ctx.dirigeantQualite) || (dirD && dirD.qualite) || '';
      var kycLe = ctx && ctx.kycLe ? new Date(ctx.kycLe).toLocaleDateString('fr-FR') : null;
      var site = (m && m.siteUrl) || (ctx && ctx.siteUrl) || '—';
      var mode = (D && D.techMarchandMode) ? D.techMarchandMode(m) : {};
      var pct = function (x) { return String(x).replace('.', ',') + ' %'; };
      var R = new Redac();
      R.bloc('ENTRE LES SOUSSIGNÉS')
       .p("Le grossiste : " + S.nom + ", ci-dessus désignée, exploitant la solution " + (R0.nom || 'PayEnCash Solution') + ", ci-après « le Grossiste ».",
          "La marque : " + nom + (siret !== '—' ? ' — SIRET ' + siret : '') + (adresse !== '—' ? ' — ' + adresse : '') + ', représentée par ' + dirigeant + (qualite ? ', ' + qualite : '') + (kycLe ? ' (pièce d\'identité contrôlée le ' + kycLe + ')' : '') + ',',
          "exploitant le site " + site + ", ci-après « la Marque ».");
      R.art('OBJET ET QUALIFICATION')
       .p("La Marque émet des bons d'achat et cartes cadeaux utilisables exclusivement sur son propre site.",
          "Le Grossiste les lui ACHÈTE pour son propre compte et les REVEND à son réseau de commerces sous contrat.",
          "Le Grossiste n'émet aucun bon, ne fournit aucun service de paiement au sens de l'article L314-1 du code",
          "monétaire et financier, n'émet aucune monnaie électronique au sens de l'article L315-1 du même code, et",
          "ne détient ni ne manie aucun fonds pour le compte de la Marque.");
      R.art('EXCLUSIVITÉ DE DISTRIBUTION')
       .p("La Marque confie au Grossiste l'exclusivité de la distribution de ses bons auprès de réseaux de commerces",
          "physiques et de distributeurs de proximité, sur le territoire français.",
          "La Marque conserve PLEINE ET ENTIÈRE LIBERTÉ de vendre ses propres bons en direct sur son site, dans ses",
          "boutiques en propre et lors de ses opérations promotionnelles : la présente exclusivité ne restreint ni son",
          "activité de vente directe, ni sa politique commerciale, ni ses prix.",
          "Elle s'interdit, pendant la durée du contrat, de confier la distribution de ses bons à tout autre grossiste,",
          "distributeur ou réseau de commerces physiques.");
      R.art('DURÉE — ' + (R0.dureeContratMois || 12) + ' MOIS FERMES, SANS RECONDUCTION TACITE')
       .p("Le contrat est conclu pour une durée ferme de " + (R0.dureeContratMois || 12) + " mois à compter de sa signature.",
          "Il NE FAIT L'OBJET D'AUCUNE RECONDUCTION TACITE : son renouvellement suppose un nouvel accord exprès et écrit,",
          "donnant lieu à un nouveau contrat.");
      R.art("PRIX D'ACHAT ET OFFRE DE PAIEMENT")
       .p("Le Grossiste achète les bons à leur valeur faciale diminuée de la remise attachée à l'offre de paiement",
          "choisie par la Marque, soit à ce jour : « " + (mode.libelle || '—') + " », remise de " + pct(mode.remisePct != null ? mode.remisePct : '—') + ".",
          "La remise consentie rémunère le réseau de distribution et le Grossiste. Son traitement suit le régime de TVA du",
          "bon (art. 256 ter du CGI ; annexe 1, article 6), relevé à la signature d'après les conditions d'utilisation des bons",
          "de la Marque : bon à usage unique, la remise est une réduction de prix portée sur la facture (art. L441-9 du code",
          "de commerce) ; bon à usages multiples, la différence entre la valeur faciale et le prix payé rémunère la prestation",
          "de distribution du Grossiste, facturée à la Marque avec TVA à 20 %, même compensée avec le règlement du bon.",
          /* (24/09, soir — relecture juridique, constat 19) LE CONTRAT DIT LEQUEL DES DEUX RÉGIMES S'APPLIQUE À CETTE MARQUE : sa qualification,
             déduite de ses deux réponses (techMarchandTva), est imprimée ici et figée par la signature — la changer passe par un avenant. */
          (function () {
            var q = (D && D.techMarchandTva && m) ? D.techMarchandTva(m) : null;
            return q && q.regime
              ? "Au vu des déclarations de la Marque (un seul taux de TVA : " + (m.tva.tauxUnique ? 'oui' : 'non') + " ; vente en France seule : " + (m.tva.franceSeule ? 'oui' : 'non') + "), ses bons sont à ce jour des " + (q.regime === 'BUU' ? 'bons à usage unique' : 'bons à usages multiples') + " (" + q.regime + "). Toute modification de ces déclarations est notifiée sans délai au Grossiste et fait l'objet d'un avenant."
              : "La Marque déclare, avant la première vente, si tous ses produits relèvent d'un seul taux de TVA et d'une vente en France seule ; la qualification de ses bons qui en résulte est portée par avenant.";
          })(),
          "La Marque peut changer d'offre à tout moment depuis son espace : le nouveau taux vaut pour les ventes à",
          "venir, les bons déjà vendus conservant celui qu'ils portaient.");
      R.art('RÈGLEMENT DE LA MARQUE')
       .p("Le Grossiste règle la Marque par virement instantané depuis sa banque, après l'arrêté quotidien de ses ventes,",
          "au délai de l'offre choisie, sur le compte dont elle a déposé le relevé d'identité bancaire. Aucun règlement",
          "ne peut partir sans ce relevé.",
          "Le Grossiste supporte seul le risque d'impayé de son réseau : la créance de la Marque lui est due",
          "indépendamment du recouvrement.");
      R.art('FACTURATION')
       .p("La Marque donne mandat au Grossiste d'établir en son nom et pour son compte les factures de ses ventes de bons au",
          "Grossiste (art. 289, I-2 du CGI ; art. 242 nonies A de l'annexe II au CGI). Le régime suit la qualification du bon",
          "(art. 256 ter du CGI ; annexe 1, article 6) : bon à usage unique, facture avec TVA au taux des biens, la remise portée",
          "comme réduction de prix (art. L441-9 du code de commerce) ; bon à usages multiples, document hors champ de TVA, et facture",
          "de la prestation de distribution émise par le Grossiste à la Marque, avec TVA à 20 %, même compensée. Chaque facture",
          "établie par le Grossiste porte la mention « Autofacturation », est mise à disposition dans l'Espace et vaut acceptée à",
          "défaut de contestation écrite sous " + (J.contestationJours || 15) + " jours. La Marque reste seule redevable de sa TVA ; le mandat est révocable",
          "par écrit. Les factures sont émises et reçues sous forme électronique par la plateforme agréée qu'utilise le Grossiste",
          "(Odoo, immatriculée le 15/04/2026) — réception obligatoire depuis le 1er septembre 2026, émission obligatoire au",
          "1er septembre 2027 pour les PME (art. 289 bis du CGI). Un bon jamais utilisé ne donne lieu à aucune TVA s'il est à",
          "usages multiples ; la TVA n'est pas restituée s'il est à usage unique.");
      R.art('RÉSEAU LIMITÉ — GARANTIE MONO-ENSEIGNE')
       .p("La Marque GARANTIT que ses bons sont et demeureront utilisables exclusivement sur son propre site, à",
          "l'exclusion de tout autre accepteur.",
          "Le Grossiste s'interdit toute mutualisation, conversion, compensation ou solde commun entre les bons de",
          "marques différentes.",
          "Les parties reconnaissent que cette stipulation est DÉTERMINANTE DE LEUR CONSENTEMENT : elle fonde",
          "l'application de l'exclusion prévue à l'article L521-3 I 1° du code monétaire et financier.");
      R.art("SEUIL DE DÉCLARATION À L'ACPR")
       .p("Le Grossiste communique mensuellement à la Marque la valeur totale des opérations réalisées sur ses bons.",
          "Il appartient à la Marque, en sa qualité d'ÉMETTEUR, d'effectuer la déclaration prévue à l'article L521-3 II",
          "du code monétaire et financier dès que cette valeur dépasse un million d'euros sur douze mois glissants, et",
          "de l'actualiser annuellement. Le Grossiste l'accompagne dans cette démarche ; à l'approche du seuil il l'en",
          "avertit, et au-delà il suspend l'édition de nouveaux bons jusqu'à la déclaration.");
      R.art("BON PROPOSÉ ET USAGE DEPUIS L'APPLICATION « MES BONS »")
       .p("La Marque peut proposer à un client un bon d'achat d'un montant précis (lien, bouton sur son site, visuel).",
          "Ce bon s'achète au comptoir d'un commerce du réseau ; le Grossiste ne demande, ne reçoit et ne règle aucune",
          "somme pour le compte de la Marque. Le bon s'utilise chez la Marque exclusivement, depuis l'application",
          "« Mes bons », avec le compte de son porteur : chaque usage est retraçable. La commande de la Marque est",
          "dite « couverte » lorsque les bons présentés y suffisent ; la Marque en est prévenue et la valide elle-même.");
      R.art('DOCUMENTS, LECTURE ET SIGNATURE')
       .p("Les conditions générales de l'Espace, les conditions des bons de marque (annexe 1), les conditions du logiciel",
          "(annexe 2) et la charte de communication (annexe 3) sont lues jusqu'au bout puis acceptées, chacune dans sa",
          "version, depuis l'Espace ; une nouvelle version redemande l'accord. Le présent contrat est signé par le",
          "dirigeant déclaré de la Marque, après contrôle de sa pièce d'identité et du dossier de la société, puis",
          "contresigné par le Grossiste.");
      R.art('OBLIGATIONS DU GROSSISTE')
       .p("Mettre les bons de la Marque à la disposition de l'ensemble des commerces actifs de son réseau ; les référencer",
          "dans son application ; en assurer la promotion dans les mêmes conditions que celles réservées aux autres marques",
          "partenaires ; tenir à disposition l'état des ventes et des règlements. Le Grossiste est tenu d'une OBLIGATION DE",
          "MOYENS : il ne garantit aucun volume de ventes.");
      R.art('OBLIGATIONS DE LA MARQUE')
       .p("Honorer tout bon régulièrement vendu jusqu'à son terme de validité, d'une durée minimale d'un an à compter de son",
          "émission ; maintenir son site en service ; informer le Grossiste sans délai de toute difficulté,",
          "procédure collective ou cessation d'activité ; ne pas modifier unilatéralement les conditions d'utilisation des bons",
          "déjà vendus. La Marque ne peut refuser un bon valide qu'elle a émis. Tout refus signalé par un porteur est notifié à",
          "la Marque par la hotline du Grossiste, consigné, et constitue un manquement au présent contrat (résiliation pour",
          "manquement).");
      R.art('CLAUSE DE RENDEZ-VOUS')
       .p("À l'issue du sixième mois, les parties se rencontrent pour examiner les volumes constatés. Chacune peut alors",
          "demander la renégociation des conditions ou mettre fin au contrat, par lettre recommandée avec accusé de réception,",
          "moyennant un préavis de " + (J.preavisAmiableJours || 30) + " jours. Aucun objectif manqué n'emporte résiliation de plein droit.");
      R.art("SORT DES BONS EN CIRCULATION À L'EXTINCTION")
       .p("La Marque s'oblige à honorer, jusqu'à leur terme de validité, l'intégralité des bons vendus pendant la durée du",
          "contrat, Y COMPRIS APRÈS SON EXTINCTION pour quelque cause que ce soit. Cette obligation survit au contrat.");
      R.art('RÉSILIATION POUR MANQUEMENT')
       .p("En cas de manquement aux articles relatifs à l'exclusivité, à la garantie mono-enseigne ou à l'obligation d'honorer les bons, la partie lésée met",
          "l'autre en demeure d'y remédier par lettre recommandée avec accusé de réception. À défaut de régularisation dans",
          "les " + (J.preavisAmiableJours || 30) + " jours, le contrat peut être résilié de plein droit, sans préjudice des dommages et intérêts. La résiliation",
          "ne dispense pas la Marque de l'obligation d'honorer les bons déjà vendus.");
      R.art('PROPRIÉTÉ INTELLECTUELLE')
       .p("La Marque concède au Grossiste, pour la durée et le périmètre du contrat, une licence d'usage non exclusive et non",
          "cessible de sa marque et de ses visuels, aux seules fins de distribution de ses bons.");
      R.art('DONNÉES PERSONNELLES')
       .p("Responsable de traitement : " + S.nom + ", " + S.siege + ". Les données du dirigeant et des contacts de la Marque, et les",
          "données d'usage des bons, sont traitées pour l'exécution du contrat (art. 6.1.b du RGPD) et la prévention de la fraude",
          "(intérêt légitime, art. 6.1.f) ; l'obligation légale (art. 6.1.c) ne vaut que pour la comptabilité et le fiscal. Le Grossiste",
          "n'est pas assujetti à la lutte contre le blanchiment (art. L561-2 du code monétaire et financier). Conservation selon la",
          "politique de confidentialité en vigueur (durée de la relation puis 5 ans ; pièces comptables 10 ans). La vidéo de vérification",
          "du dirigeant est regardée par une personne habilitée puis supprimée ; elle ne sert à aucune comparaison automatique.");
      R.art('CONFIDENTIALITÉ, FORCE MAJEURE, INTÉGRALITÉ')
       .p("Chaque partie s'interdit de divulguer les informations commerciales et financières échangées. Aucune partie n'est",
          "responsable d'un manquement causé par un événement de force majeure au sens de l'article 1218 du code civil.",
          "Le présent contrat et ses annexes expriment l'intégralité de l'accord des parties.");
      R.art('DIFFÉRENDS ET JURIDICTION COMPÉTENTE')
       .p("Avant toute action, la partie la plus diligente notifie son grief par écrit ; les parties disposent de",
          (J.preavisAmiableJours || 30) + " jours pour rechercher une solution amiable. Le contrat est soumis au " + (J.droitApplicable || 'droit français') + ".",
          "À défaut d'accord amiable, le litige est porté devant " + DOCS.tribunal() + ".");
      /* (23/09, soir — audit) LE MODÈLE REND CE QUE LE COFFRE ATTEND : un titre et des lignes. Il rendait l'objet Redac
         lui-même : `DOCS.signer` levait « m.lignes.concat » (avalé par techMarchandContratSigner), le PDF signé n'entrait
         jamais au coffre et la contresignature répondait « Document introuvable ». */
      return { titre: 'Contrat-cadre d’achat et de distribution des bons d’achat — ' + nom, lignes: DOCS.enTete().concat(R.l).concat(DOCS.pied('la Marque')) };
    },
    /* ── (23/09) COMMERCE PARTENAIRE : CONTRAT DE DISTRIBUTION DES BONS D'ACHAT DE MARQUE ──────────────────────────
          Il remplace le contrat du Bon d’achat PayEnCash (18/09), titre qui n'a plus d'accepteur. Miroir du document lisible
          documents/contrat-distribution-bons.html : un mot qui bouge là-bas bouge ici. UN SEUL CONTRAT POUR LES DEUX MODES —
          le commerce sédentaire ACHÈTE chaque bon au prix réseau et le revend pour son propre compte, puis il est prélevé
          après l'arrêté sur son mandat SEPA (art. 5) ; le distributeur nomade est commissionnaire et paie D'AVANCE (art. 6).
          Les chiffres viennent du référentiel (techRef, techModes, bonsRef, ref.juridique) et sont figés par la signature
          (CONDITIONS.contrat_partenaire) ; l'identité, des mentions relevées sur le dossier validé. ⚠ À faire relire par un
          avocat avant toute signature. ── */
    contrat_partenaire: function (ctx) {
      ctx = ctx || {};
      var D = window.PEC_DATA, S = DOCS.societe(), J = DOCS.juridique();
      var T = (D && D.techRef) ? D.techRef() : {}, P = T.paiement || {}, A = T.avance || {};
      var B = (D && D.bonsRef) ? D.bonsRef() : {};
      var modes = (D && D.techModes) ? D.techModes() : [];
      var M = ctx.id ? (DOCS.mentions('partenaire', ctx.id) || {}) : {};
      var nom = M.raisonSociale || ctx.enseigne || ctx.nom || '—', siret = M.siret || ctx.siret || '—', adresse = M.adresse || ctx.adresse || '—', gerant = M.dirigeant || ctx.responsable || '—';
      // « 1 500 € », comme dans le document lisible : les milliers se séparent d'une espace simple, que toute police du PDF sait écrire
      var eur = function (n) { return (Math.round((n || 0) * 100) / 100).toFixed(2).replace('.', ',').replace(/,00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €'; };
      var pct = function (n) { return (n == null || n === '') ? '—' : String(Math.round(+n * 100) / 100).replace('.', ',') + ' %'; };
      var nb = function (n, d) { return (n == null || n === '' || !isFinite(+n)) ? d : +n; };
      /* LE MODE EST CELUI DU DOSSIER : le texte est le même, seul le préambule dit lequel des articles 5 et 6 s'applique. */
      var pt = (D && D.partenaire && ctx.id) ? D.partenaire(ctx.id) : null;
      var nomade = !!(D && D.partenaireEstMobile && pt && D.partenaireEstMobile(pt));
      var zone = (D && D.partenaireZoneLbl && pt) ? D.partenaireZoneLbl(pt) : 'zone à définir';
      var Nous = S.marque;
      /* LA PART DU POINT SE LIT SUR LES OFFRES DE PAIEMENT DES MARQUES — jamais un taux écrit ici. */
      var parts = modes.map(function (m, i) { return pct(m.partPointPct) + (i ? ' en « ' : ' pour une Marque en « ') + m.libelle + ' »'; }).join(', ');
      var defaut = (D && D.techModeDefaut) ? D.techModeDefaut() : modes[0];
      var ex = (defaut && D && D.techRepartition) ? D.techRepartition(50, { mode: defaut }) : null;
      var heure = P.arreteHeure ? String(P.arreteHeure).replace(':', ' h ') : '—';
      var R = new Redac();
      R.bloc('ENTRE LES SOUSSIGNÉS')
       .p(S.nom + ", ci-dessus désignée, agissant sous sa marque " + (T.nom || S.marque) + ", ci-après « " + Nous + " »,",
          "et " + nom + (siret !== '—' ? ' — SIRET ' + siret : '') + (adresse !== '—' ? ' — ' + adresse : '') + (nomade ? ' — zone déclarée : ' + zone : '') + ', représenté par ' + gerant + ',',
          "ci-après « le distributeur ».")
       .bloc('PRÉAMBULE')
       .p(S.nom + ", sous la marque " + (T.nom || S.marque) + ", est grossiste en bons d’achat de marque : elle achète aux marques partenaires, à",
          "mesure qu'ils sont vendus, les bons d’achat qu'elles émettent, et les distribue par un réseau de commerces sédentaires et de",
          "distributeurs nomades. Chaque bon est émis par une marque et utilisable exclusivement sur le site de cette marque : un moyen de",
          "paiement accepté dans un réseau limité au sens de l'article L. 521-3, I, 1° du code monétaire et financier, qui ne requiert",
          "aucun agrément d'établissement de paiement. " + S.nom + " n'émet aucun",
          "bon, n'en détient aucune valeur, n'encaisse rien pour le compte des marques et ne fournit aucun service de paiement.",
          "Le distributeur exerce soit comme commerce sédentaire — un commerce de proximité ouvert au public, où le client vient acheter son",
          "bon —, soit comme distributeur nomade — un professionnel indépendant, sans établissement recevant du public, qui se déplace pour",
          "remettre le bon à ses clients dans la zone qu'il définit lui-même. Le présent contrat est le même quel que soit le mode",
          "d'exercice : seuls les articles 5 et 6 disent ce qui change. Le mode du distributeur, relevé sur son dossier, est : " + (nomade ? 'distributeur nomade (' + zone + ')' : 'commerce sédentaire') + ".")
       .art('DÉFINITIONS')
       .p("« Marque » : une entreprise partenaire de " + (T.nom || S.marque) + ", émettrice de bons d’achat utilisables sur son seul site, dont le",
          "dossier est validé et le contrat-cadre signé.",
          "« Bon » : le bon d’achat de marque, titre dématérialisé identifié par un code unique, émis par la Marque au moment de la vente, au",
          "montant demandé par le client ou proposé par la Marque, et remis au client sous forme de ticket.",
          "« Valeur faciale » : le montant du bon, utilisable chez la Marque ; c'est le prix de vente conseillé au client.",
          "« Vente » : la remise d'un bon à un client contre le paiement immédiat et intégral de son prix, au comptoir du distributeur",
          "ou lors d'une rencontre.",
          "« Part » : le pourcentage de la valeur faciale que le distributeur conserve sur chaque vente — la remise du commerce sédentaire",
          "sur son prix d'achat, la commission du distributeur nomade —, attaché à l'offre de paiement choisie par la Marque et affiché dans",
          "l'application avant la vente.",
          "« Prix réseau » : la valeur faciale diminuée de la part du distributeur ; c'est ce que le distributeur doit à " + Nous + " pour chaque bon vendu.",
          "« Application » : l'application partenaire fournie par " + Nous + ", seul outil de vente des bons.",
          "« Ordre de vente » : le flashcode par lequel un client présente au distributeur un bon proposé par une Marque, avec son montant.",
          "« Arrêté » : la vérification quotidienne des ventes, à l'heure fixée dans l'application (" + heure + " à la date de signature).",
          "« Mandat de prélèvement » : le mandat SEPA interentreprises signé par le commerce sédentaire, support des prélèvements du prix réseau.",
          "« Garantie » : le dépôt versé une fois par le distributeur nomade, restituable à la fin du contrat. « Paiement anticipé » (ou",
          "« Avance ») : la valeur des bons à revendre, versée d'avance par le distributeur nomade et imputée sur chaque bon édité, à hauteur",
          "du prix réseau.")
       /* LA CLAUSE ANTI-REQUALIFICATION : deux qualifications, une par mode, et ce qui est commun aux deux. Le sédentaire
          achète pour son propre compte ; le nomade vend pour notre compte mais n'avance que son propre argent — aucun des deux
          ne détient jamais les fonds d'autrui, ce qui écarte l'encaissement pour compte de tiers. */
       .art('OBJET ET QUALIFICATION')
       .p("2.1 Objet. " + Nous + " confie au distributeur, qui l'accepte, la distribution auprès de ses clients des bons d’achat des Marques",
          "que " + Nous + " achète à celles-ci. Le distributeur ne vend que par l'application, et seulement les bons des Marques qui y figurent.",
          "2.2 Le commerce sédentaire est revendeur pour son propre compte : à chaque vente, il achète le bon à " + Nous + " au prix réseau et",
          "le revend à son client au prix qu'il fixe librement, la valeur faciale étant un prix conseillé (art. L. 442-6 du code de commerce :",
          "aucun prix de revente minimal n'est imposé). Il vend en son nom et pour son propre compte ; le prix qu'il perçoit de son client lui",
          "appartient ; ce qu'il doit à " + Nous + " est une créance commerciale ordinaire, réglée selon l'article 5. Il ne détient à aucun",
          "moment de fonds appartenant à " + Nous + " ni à une Marque.",
          "2.3 Le distributeur nomade est commissionnaire au sens de l'article L. 132-1 du code de commerce : il vend en son nom, mais pour",
          "le compte de " + Nous + ", en exécution du présent contrat de commission, écrit et préalable à toute vente. Il paie d'avance la valeur",
          "des bons à revendre (article 6.3) : il ne détient donc jamais de fonds d'autrui. Sa rémunération est une commission (article 6.4).",
          "Il agit pour le seul compte du vendeur, jamais pour celui du client.",
          "2.4 Commun aux deux modes. Le distributeur n'est ni agent de paiement, ni établissement de paiement, ni prestataire de services de",
          "paiement : il ne reçoit aucun fonds destiné à régler une commande et ne rend aucun service de paiement. Il n'émet pas les bons,",
          "n'en fixe ni la valeur ni les conditions, et ne s'engage pas au nom d'une Marque. Le présent contrat n'emporte ni exclusivité, ni",
          "représentation générale, ni pouvoir d'engager " + Nous + " au-delà de la vente d'un bon dans l'application.")
       .art('ÉMISSION ET REMISE DU BON')
       .p("3.1 Un bon n'est émis que par l'application, après que le distributeur a confirmé avoir reçu le prix de son client, au montant",
          "demandé par le client ou porté par l'ordre de vente qu'il présente. L'application refuse la vente tant qu'une condition manque :",
          "dossier, contrat, activation, mandat de prélèvement ou avance (articles 5, 6 et 9), plafonds du réseau. Aucune vente à crédit ;",
          "aucun fractionnement destiné à contourner un plafond.",
          "3.2 Le distributeur remet au client le ticket portant le code, le montant, la Marque et son site, la date d'expiration, la mention",
          "« s'utilise depuis l'app Mes bons » et les conditions d'utilisation ; il conserve l'enregistrement de chaque ticket. Une vente faite",
          "par erreur peut être annulée dans l'application dans les " + nb(T.annulationMinutes, 30) + " minutes qui la suivent, si le bon n'a pas servi ; au-delà,",
          "l'annulation relève de " + Nous + " et de la Marque. Une vente annulée n'est pas prélevée (commerce sédentaire) ou est recréditée",
          "sur l'avance (distributeur nomade).",
          "3.3 Le distributeur nomade vend au prix fixé par " + Nous + " : la valeur faciale, sans frais. Le commerce sédentaire fixe librement",
          "son prix de revente ; la valeur faciale est le prix conseillé. Le tarif du déplacement d'un distributeur nomade est une prestation",
          "distincte, fixée et facturée par lui en son nom (article 6.5) : il ne se confond jamais avec le prix du bon.")
       .art('CONDITIONS DU BON ET PRIX DU CLIENT')
       .p("Les conditions du bon sont celles de sa Marque, rappelées dans les conditions des bons de marque annexées : validité d'au moins",
          nb(B.validiteMois, 12) + " mois, usage exclusif sur le site de la Marque, depuis l'application « Mes bons », en une ou plusieurs fois, ni échange",
          "ni remboursement en espèces, aucun rendu de monnaie. Le distributeur s'interdit toute condition, promesse ou remise qui y",
          "dérogerait, et ne présente jamais le bon comme utilisable ailleurs que chez sa Marque.")
       .art('LE COMMERCE SÉDENTAIRE : ACHAT, MANDAT DE PRÉLÈVEMENT, ARRÊTÉ, ENCOURS')
       .p("5.1 Prix réseau et part. Le commerce sédentaire achète chaque bon au prix réseau : la valeur faciale diminuée de sa part. La part",
          "est celle attachée à l'offre de paiement choisie par la Marque, affichée avant chaque vente et figée sur la vente — à la date de",
          "signature : " + (parts || '—') + ". Sa marge lui appartient : " + Nous + " n'y prélève rien. Lorsque le bon est à usages multiples (article 5.6),",
          "cette part rémunère une prestation de distribution, facturée par autofacturation (article 5.7).",
          ex && ex.valide ? "Exemple, à la date de signature : un bon de " + eur(ex.montant) + " d'une Marque en « " + ex.modeLbl + " » laisse " + eur(ex.partPoint) + " au commerce, qui doit " + eur(ex.prixPoint) + " à " + Nous + "." : '',
          "5.2 Mandat de prélèvement. Le commerce sédentaire signe dans l'application un mandat de prélèvement SEPA interentreprises sur son",
          "compte professionnel et le fait enregistrer auprès de sa banque avant le premier prélèvement. Ce mandat ne donne pas lieu à",
          "remboursement sur simple demande. Le commerce maintient son compte provisionné et s'interdit de contester un prélèvement",
          "correspondant à une vente régulièrement enregistrée. Sans mandat valide, la vente est fermée dans l'application.",
          "5.3 Arrêté, pré-notification et échéance. Les ventes sont arrêtées chaque jour à l'heure de l'arrêté (" + heure + "). Le relevé de",
          "l'arrêté, mis à disposition dans l'application, vaut pré-notification de chaque prélèvement : les parties conviennent de ce délai,",
          "plus court que celui du schéma SEPA. L'ordre de prélèvement des ventes arrêtées est remis à la banque après l'arrêté, avec une",
          "échéance qui suit le rythme de l'offre de paiement de la Marque dont le bon a été vendu ; la date d'échéance de chaque vente est",
          "affichée dans l'application avant la vente et sur le relevé.",
          "5.4 Encours. Les bons vendus et non encore prélevés forment l'encours du point, plafonné à " + (P.encoursMaxPoint ? eur(P.encoursMaxPoint) : '—') + " : l'application",
          "refuse une vente qui le dépasserait.",
          "5.5 Impayé. Un prélèvement impayé suspend immédiatement la vente jusqu'à régularisation. " + Nous + " prend contact avec le commerce ;",
          "le prélèvement n'est représenté qu'après cet échange, sur validation de " + Nous + ". Une pénalité forfaitaire de " + (P.penaliteImpaye ? eur(P.penaliteImpaye) : '—') + " est due par impayé.",
          "5.6 Relevé, facture et TVA. Le relevé de chaque arrêté (bons vendus, prix réseau, part conservée, ventes annulées, état des",
          "prélèvements) est établi par l'application, consultable par les deux parties et fait foi entre elles. " + Nous + " émet, par arrêté, la",
          "facture des bons achetés par le commerce ; le relevé en est le détail. Les pièces comptables sont conservées dix ans (art. L. 123-22",
          "du code de commerce). Le régime de TVA des bons (art. 256 ter du code général des impôts) résulte des conditions d'utilisation de",
          "chaque Marque (annexe 1, article 6). Bon à usage unique : la vente du bon au commerce sédentaire est une livraison taxable au taux",
          "des biens, facturée par " + Nous + ", la part figurant comme réduction de prix sur la facture (art. L. 441-9 du code de commerce). Bon à",
          "usages multiples : la vente est hors champ de TVA en tant que telle ; la part conservée par le commerce et la commission du",
          "distributeur nomade sont des prestations de distribution taxables (20 %, ou franchise en base, art. 293 B du CGI), facturées par",
          "autofacturation (articles 5.7 et 6.8).",
          "5.7 Autofacturation de la part. Lorsque le bon est à usages multiples, le commerce sédentaire donne mandat à " + Nous + " d'établir en",
          "son nom et pour son compte la facture de sa prestation de distribution — sa part, retenue sur le prix réseau et facturée même ainsi",
          "compensée (art. 289, I-2 du CGI ; art. 242 nonies A de l'annexe II au CGI). Chaque facture porte la mention « Autofacturation », est",
          "mise à disposition dans l'application et vaut acceptée à défaut de contestation écrite sous " + nb(J.contestationJours, 15) + " jours. Le commerce reste",
          "seul redevable de la TVA et déclare son régime (franchise en base, art. 293 B du CGI, ou assujetti) ; le mandat est révocable par écrit.",
          "5.8 Facture électronique (commun aux deux modes). Les factures et autofactures sont émises et reçues sous forme électronique par la",
          "plateforme agréée qu'utilise " + S.nom + " (Odoo, immatriculée le 15/04/2026) — réception obligatoire depuis le 1er septembre 2026,",
          "émission obligatoire au 1er septembre 2027 pour les PME (art. 289 bis du CGI).")
       .art('LE DISTRIBUTEUR NOMADE : COMMISSION, GARANTIE, PAIEMENT ANTICIPÉ, INDÉPENDANCE')
       .p("6.1 Commission. Le présent contrat vaut contrat de commission (art. L. 132-1 du code de commerce), écrit et préalable : le",
          "distributeur nomade vend les bons en son nom, pour le compte de " + Nous + ". Il informe son client que le bon est émis par la Marque",
          "et vendu par le réseau " + Nous + " — le ticket le dit.",
          "6.2 Garantie. Il verse une fois, à l'entrée, une garantie de " + (A.garantie ? eur(A.garantie) : '—') + ". C'est un dépôt, non productif d'intérêts, affecté à",
          "la garantie de ses obligations, restitué intégralement dans les " + nb(A.restitutionJours, 30) + " jours de la fin du contrat, déduction faite des seules",
          "sommes dues et justifiées, sur décompte écrit. Il n'est jamais retenu à titre de sanction.",
          "6.3 Paiement anticipé. Il verse d'avance, par virement, la valeur des bons à revendre (chaque virement entre " + (A.rechargeMin ? eur(A.rechargeMin) : '—') + " et",
          (A.rechargeMax ? eur(A.rechargeMax) : '—') + ") ; ce paiement anticipé est imputé, sans intérêt, sur chaque bon édité, à hauteur du prix réseau. Sans paiement anticipé",
          "suffisant, l'application refuse la vente : il ne vend que ce qu'il a déjà payé. Sa commission forfaitaire (article 6.4) couvre tous",
          "ses frais ; les pertes qu'il subit restent à sa charge, sauf faute de " + Nous + ". Le solde non imputé lui est restitué dans les",
          nb(A.restitutionJours, 30) + " jours de la fin du contrat, sur décompte écrit, avec la garantie. Les parties écartent expressément les articles 1999 à 2001",
          "du code civil.",
          "6.4 Commission. Sa rémunération est la différence entre la valeur faciale qu'il encaisse et le prix réseau imputé sur son paiement",
          "anticipé — le pourcentage attaché à l'offre de paiement de la Marque, affiché avant la vente (article 5.1). Elle lui est acquise à",
          "chaque vente. Sa commission est forfaitaire et couvre l'ensemble de ses frais. L'application rend compte de chaque vente, opération",
          "par opération. Il ne supporte aucun risque de mévente.",
          /* (24/09 — relecture juridique, décision fondatrice) LE TARIF EST LIBRE, AFFICHÉ PAR LE NOMADE ET CONVENU AVEC LE CLIENT :
             un seul texte pour le HTML et le modèle signé. Il l'affiche depuis Mon point (« Mon tarif de déplacement » : son départ et ses
             prix par palier, partenaireDeplacementSet) et le client le lit avant de le choisir (carte de Mes bons, nomadesAutour) ; chacun
             affiche le sien et le client choisit — l'application n'organise aucune enchère, ni « propositions » à départager. */
          "6.5 Tarif de déplacement. Il fixe librement le tarif de son déplacement, l'affiche dans l'application et le convient avec son",
          "client, au cas par cas. " + Nous + " ne fixe ni plancher, ni plafond, ni tarif conseillé. Il facture ce tarif en son nom propre, au",
          "client, sur sa propre facture.",
          "6.6 Indépendance. Le distributeur nomade est un professionnel indépendant, immatriculé, qui organise librement son activité et peut",
          "en exercer d'autres. Il définit lui-même sa zone ; il accepte ou refuse toute rencontre, sans motif et sans conséquence sur son",
          "accès au réseau ; il n'a ni horaire, ni planning, ni obligation de disponibilité ; il utilise ses propres moyens ; il agit sous sa",
          "propre dénomination et est autorisé, non obligé, à faire état de sa qualité de partenaire du réseau " + Nous + ". " + Nous + " ne lui",
          "donne aucun ordre ni directive et n'exerce sur lui aucun pouvoir de sanction : les seules mesures sont celles de l'article 10,",
          "pour des manquements objectifs, après mise en demeure.",
          "6.7 Prévention de la fraude. Il applique les plafonds du réseau lus dans l'application, s'interdit tout fractionnement, identifie",
          "le client en cas de doute, signale toute opération inhabituelle à " + Nous + " et ne conserve aucune pièce d'identité de client sur",
          "son appareil.",
          "6.8 Autofacturation. Le distributeur nomade donne mandat à " + Nous + " d'établir en son nom et pour son compte les factures de sa",
          "commission (art. 289, I-2 du CGI ; art. 242 nonies A de l'annexe II au CGI). Chaque facture porte la mention « Autofacturation », est",
          "mise à disposition dans l'application et vaut acceptée à défaut de contestation écrite sous " + nb(J.contestationJours, 15) + " jours. Il reste seul",
          "redevable de la TVA et déclare son régime (franchise en base, art. 293 B du CGI, ou assujetti) ; le mandat est révocable par écrit.",
          "Ces factures sont électroniques (article 5.8).")
       .art('OBLIGATIONS DU DISTRIBUTEUR')
       .p("Vendre au comptant, dans la limite des plafonds ; ne remettre aucun bon sans avoir reçu le prix ; ne consentir aucun crédit ;",
          "maintenir provisionné le compte prélevé (commerce sédentaire) ou une avance suffisante (distributeur nomade) ; ne pas contester",
          "un prélèvement correspondant à une vente régulièrement enregistrée ; afficher les supports remis par " + Nous + " et ne rien",
          "promettre sur le bon au-delà de l'annexe 1 ; préserver la confidentialité de ses identifiants ; signaler sans délai toute",
          "anomalie, perte ou fraude ; respecter les règles de prévention de la fraude du réseau (refus d'une vente manifestement anormale,",
          "identification en cas de doute) ; justifier d'une assurance de responsabilité civile professionnelle en cours de validité ;",
          "informer " + Nous + " sous quinze jours de tout changement affectant son identité légale, son gérant ou son compte bancaire.")
       .art('OBLIGATIONS DE ' + Nous.toUpperCase())
       .p("Fournir l'application, l'assistance et les supports ; acheter à sa Marque chaque bon vendu, à l'instant de la vente — un bon",
          "régulièrement vendu est ainsi un bon que la Marque s'est engagée à honorer jusqu'à son terme ; tenir les relevés, l'état des",
          "prélèvements et les mouvements de l'avance ; ne prélever, ou ne débiter de l'avance, que le prix réseau des ventes enregistrées ;",
          "restituer sans délai toute somme prélevée ou débitée pour une vente annulée ; restituer la garantie et le reste de l'avance à la",
          "fin du contrat, sur décompte écrit ; informer le distributeur de toute modification des réglages du réseau (parts, plafonds,",
          "encours, heure de l'arrêté, garantie, montants de l'avance) avec un préavis d'un mois.")
       .art('VÉRIFICATION DU DOSSIER ET ENTRÉE EN VIGUEUR')
       .p("Le présent contrat n'ouvre la vente qu'après validation par " + S.nom + " du dossier du distributeur (extrait Kbis ou extrait",
          "d'immatriculation de moins de trois mois, pièce d'identité du représentant légal — carte nationale d'identité, passeport ou permis",
          "de conduire français —, vidéo de vérification — regardée par une personne habilitée puis supprimée —, déclaration des bénéficiaires",
          "effectifs — une fiche par personne détenant plus de 25 %, avec attestation —, relevé d'identité bancaire du compte professionnel),",
          "signature du présent contrat par le gérant, activation du point dans l'application, puis —",
          "selon le mode d'exercice — signature et enregistrement du mandat de prélèvement (article 5.2) ou versement de la garantie et",
          "d'une avance (articles 6.2 et 6.3). Le distributeur informe " + Nous + " de tout changement affectant ces éléments sous quinze jours.")
       .art('DURÉE ET RÉSILIATION')
       .p("10.1 Le contrat est conclu sans durée déterminée. Chaque partie peut y mettre fin par écrit avec un préavis de " + nb(J.preavisResiliationMois, 1) + " mois.",
          "10.2 " + Nous + " peut résilier pour manquement, après mise en demeure restée sans effet, dans les seuls cas suivants : impayé non",
          "régularisé, fraude, violation des règles de prévention de la fraude, perte de l'immatriculation, défaut d'assurance. Une suspension dans",
          "l'attente d'une régularisation (impayé, avance insuffisante, mandat manquant) n'est pas une sanction : elle ferme la vente jusqu'à",
          "ce que le distributeur y remédie.",
          "10.3 À la fin du contrat, le distributeur cesse toute vente et restitue les supports ; les ventes du commerce sédentaire non encore",
          "prélevées le sont à leur échéance ; la garantie et le reste de l'avance du distributeur nomade lui sont restitués dans les",
          nb(A.restitutionJours, 30) + " jours, sur décompte écrit ; les bons déjà vendus restent valables chez leur Marque.");
      DOCS.clausesCommunes(R, 'le distributeur');
      R.art('ANNEXES')
       .p("Annexe 1 — conditions des bons de marque, remises au client sur le ticket et dans l'application « Mes bons ».",
          "Annexe 2 — conditions générales d'utilisation de l'espace partenaire.",
          "Annexe 3 — dossier de vérification du distributeur (extrait Kbis ou d'immatriculation, pièce d'identité du représentant légal,",
          "vidéo de vérification, déclaration des bénéficiaires effectifs, relevé d'identité bancaire).",
          "Annexe 4 — selon le mode d'exercice : le mandat de prélèvement SEPA interentreprises (commerce sédentaire), ou le décompte de la",
          "garantie et du paiement anticipé (distributeur nomade), établis par l'application.",
          "Annexe 5 — politique de confidentialité des commerces sédentaires et distributeurs nomades (information au titre des articles 13",
          "et 14 du RGPD).",
          "Les annexes font partie intégrante du présent contrat.");
      return { titre: 'Contrat de distribution des bons d’achat de marque — ' + nom,
        lignes: DOCS.enTete().concat(R.l).concat(DOCS.pied('le distributeur')) };
    },
    // ── FOURNISSEUR : contrat-cadre d'achat ferme (AJEK achète, puis revend en son nom)
    contrat_fournisseur: function (ctx) {
      var D = window.PEC_DATA, sc = (D && D.scenario) || {};
      var E = (D && D.fournisseurEntreprise) ? D.fournisseurEntreprise() : {};
      var S = DOCS.societe(), J = DOCS.juridique();
      var L = (D && D.livraisonInfo) ? D.livraisonInfo() : {};
      var prep = (((D && D.mode && D.mode.panier && D.mode.panier.livraison) || {}).preparationOuvres) || 2;
      var R = new Redac();
      R.bloc('ENTRE LES SOUSSIGNÉS')
       .p("L'acheteur : " + S.nom + ", ci-dessus désignée.",
          "Le fournisseur : " + (E.raisonSociale || ctx.nom || '—') + (E.siret ? ' — SIRET ' + E.siret : '') + (E.adresse ? ' — ' + E.adresse : '') + ',',
          "ci-après « le fournisseur ».")
       .bloc('PRÉAMBULE')
       .p(S.nom + " exploite sous la marque " + S.marque + " une boutique en ligne de vêtements, chaussures et",
          "accessoires d'occasion. Elle ACHÈTE FERME les pièces auprès de fournisseurs professionnels, les",
          "contrôle en atelier, puis les revend EN SON NOM PROPRE aux consommateurs, dont elle est le seul",
          "vendeur au sens du code de la consommation.",
          "Le fournisseur exerce à titre professionnel la vente de telles pièces et souhaite les proposer.",
          "Le présent contrat n'est ni un dépôt-vente, ni un mandat, ni un contrat de commission.")
       .art('DÉFINITIONS')
       .p("« Pièce » : un article proposé par le fournisseur et publié sur la boutique.",
          "« Lot » : un ensemble de pièces déposées en une seule fois.",
          "« Prix vendeur » : le prix demandé par le fournisseur. « Prix client » : le prix affiché en boutique.",
          "« Contrôle atelier » : l'examen de conformité et d'authenticité réalisé par l'acheteur.")
       .art('OBJET — ACHAT FERME')
       .p("L'acheteur achète ferme au fournisseur les pièces qu'il publie, puis les revend en son nom propre.",
          "Il ne s'agit ni d'un dépôt-vente, ni d'une commission : les sommes réglées par le client",
          "appartiennent à l'acheteur dès l'encaissement, et le fournisseur n'a aucun droit sur elles.")
       .art('FORMATION DE LA VENTE ET TRANSFERT DE PROPRIÉTÉ')
       .p("La vente entre le fournisseur et l'acheteur est formée au moment où le client règle sa commande.",
          "La propriété est transférée à l'acheteur à cet instant précis ; les RISQUES sont transférés à la",
          "remise du colis au point relais (article « Expédition »). Avant la vente, la pièce demeure la",
          "propriété du fournisseur, qui peut la retirer librement de la boutique.")
       .art('PRIX, FACTURATION ET RÈGLEMENT — MANDAT DE FACTURATION')
       .p("Le prix d'achat est le prix vendeur affiché au moment de la publication de la pièce.",
          "Le prix client s'obtient en y AJOUTANT, en sus : la marge de l'acheteur, le coût réel de livraison",
          "Mondial Relay à la tranche de poids du colis, et le contrôle atelier (grille en vigueur : "
            + ((D && D.grilleModeLibelle && D.grilleModeLibelle()) || "annexe 2") + ").",
          "Le fournisseur perçoit son prix d'achat EN ENTIER : ni la livraison ni le contrôle ne sont prélevés dessus.",
          /* (10/09 — lot 6, constat C27) La facture est matériellement établie par l'acheteur : c'est de
             l'AUTOFACTURATION, qui suppose un mandat écrit préalable. Le contrat disait « le fournisseur émet sa
             facture » pendant que le produit l'émettait à sa place — l'acte ne décrivait pas ce qui se passait. */
          "Le fournisseur donne à l'acheteur MANDAT d'établir ses factures d'achat en son nom et pour son compte",
          "(art. 289, I, 2 du code général des impôts). Chaque facture porte la mention « Autofacturation », est",
          "mise à sa disposition dans son espace dès son émission et vaut acceptée à défaut de contestation sous",
          (J.contestationJours || 15) + " jours. Le fournisseur reste seul responsable de ses obligations en matière de taxe sur la",
          "valeur ajoutée et informe l'acheteur de tout changement de régime sous quinze jours. Le mandat est",
          "révocable par écrit à tout moment ; le fournisseur émet alors lui-même ses factures.",
          "Le règlement intervient par virement sous " + (((D.ref || {}).juridique || {}).virementJours || 7) + " jours après contrôle.",
          "Aucun « reversement » ni aucune retenue n'existe : il s'agit d'un prix d'achat, dû en totalité.",
          "Compte de règlement : " + (E.iban ? 'IBAN ' + E.iban : 'IBAN communiqué au dossier de vérification') + ".")
       .art('GARANTIES DU FOURNISSEUR')
       .p("Le fournisseur garantit : être propriétaire des pièces et les avoir acquises licitement ; leur",
          "authenticité et l'absence de contrefaçon ; leur conformité à la description publiée (état, taille,",
          "composition, entretien) ; l'absence de vice caché.",
          "Il garantit l'acheteur contre toute éviction et contre toute action d'un tiers, notamment d'un",
          "titulaire de marque, et fournit sur demande le justificatif d'origine de la pièce.")
       .art('CONTRÔLE ATELIER ET REFUS')
       .p("Les PHOTOS de toute pièce sont contrôlées avant publication (annexe 1 — normes de publication) :",
          "hors normes, la pièce est renvoyée en « photos à refaire » et rien n'est publié. Le contrôle",
          "PHYSIQUE (état, défauts, authenticité) intervient de façon aléatoire après la vente, la pièce",
          "étant alors expédiée d'abord à l'atelier, ou sur retour du client.",
          "Une pièce non conforme à sa description est RE-COTÉE (prix ajusté, motivé par écrit et photos à",
          "l'appui, que le fournisseur accepte ou refuse dans son espace) ; une pièce contrefaisante, de",
          "provenance douteuse ou substantiellement non conforme est REFUSÉE : la vente est résolue, la pièce",
          "restituée ou remise aux autorités. Tout refus est motivé par écrit ; le fournisseur peut le",
          "contester sous " + (J.contestationJours || '—') + " jours ; sans réponse de l'acheteur sous " + (J.contestationJours || '—') + " jours, la contestation est",
          "réputée admise.")
       .art('REGISTRE DES OBJETS MOBILIERS')
       .p("L'acheteur inscrit chaque pièce d'occasion à son registre des objets mobiliers, conformément à",
          "l'article 321-7 du code pénal. Le fournisseur communique à cette fin son identité complète, celle",
          "de son représentant légal et les références de son immatriculation.")
       .art('EXPÉDITION')
       .p("Le fournisseur expédie lui-même le colis au point relais choisi par le client, sous " + prep + " jours",
          "ouvrés, avec l'étiquette " + (L.transporteur || 'Mondial Relay') + " fournie par l'acheteur et émise sur le compte de",
          "celui-ci ; il agit comme simple exécutant logistique et n'encaisse jamais aucune somme du client,",
          "à aucun titre. Le récépissé de dépôt fait preuve de l'expédition. Jusqu'à la remise au point",
          "relais, la pièce est sous la garde du fournisseur ; après, le transport relève du compte de",
          "l'acheteur. Un retard d'expédition répété relève de l'article « Durée, résiliation ».")
       .art('RETOURS, RÉTRACTATION ET GARANTIES LÉGALES')
       .p("L'acheteur assume seul, en qualité de vendeur, le droit de rétractation du client (" + (L.retourJours || 14) + " jours,",
          "art. L221-18 du code de la consommation), la garantie légale de conformité (art. L217-3 du même",
          "code) et la garantie des vices cachés (art. 1641 du code civil).",
          "Une pièce retournée conforme reste acquise à l'acheteur. Une pièce non conforme à la description",
          "du fournisseur lui est reprise, frais de retour inclus, et le prix d'achat est restitué.")
       .art('RESPONSABILITÉ ET ASSURANCE')
       .p("Le fournisseur justifie d'une " + (J.assuranceRcPro || 'assurance de responsabilité civile professionnelle') + ".",
          "Il répond des dommages résultant d'une pièce non conforme, dangereuse ou contrefaisante, y compris",
          "des frais de retrait, des remboursements consentis aux clients et des sanctions encourues.")
       .art('AVENANTS DE PRIX — CAMPAGNES, DÉMARQUES, RE-COTATIONS')
       .p("Une campagne de l'acheteur, une démarque ou une re-cotation ne modifie le prix d'achat convenu",
          "qu'avec l'acceptation du fournisseur, donnée dans son espace ; cette acceptation, horodatée et",
          "journalisée, vaut modification du contrat d'un commun accord (art. 1193 du code civil). Le refus",
          "est sans conséquence sur la relation. Un récapitulatif des avenants acceptés est consultable.")
       .art('FACTURATION ÉLECTRONIQUE')
       .p("Les factures du fournisseur sont transmises sous forme électronique, dans le format et par la",
          "plateforme de dématérialisation indiqués par l'acheteur, conformément à l'article 289 bis du code",
          "général des impôts et au calendrier en vigueur ; jusqu'à l'obligation d'émission applicable au",
          "fournisseur, une facture au format PDF est acceptée.")
       .art('VÉRIFICATION DU DOSSIER ET ENTRÉE EN VIGUEUR')
       .p("Le présent contrat n'entre en vigueur qu'après validation du dossier d'entreprise du fournisseur",
          "(extrait Kbis, pièce d'identité du dirigeant, RIB, vidéo de vérification, extrait du registre des",
          "bénéficiaires effectifs, attestation d'assurance RC professionnelle, déclaration de régime TVA)",
          "par " + S.nom + ". Dès que les achats atteignent 5 000 € HT sur douze mois, le fournisseur remet",
          "une attestation de vigilance URSSAF, renouvelée tous les six mois (art. L8222-1 du code du",
          "travail) ; à défaut, les nouvelles publications sont suspendues jusqu'à réception.",
          "Le fournisseur informe l'acheteur de tout changement affectant ces éléments sous quinze jours.")
       .art('CONFORMITÉ DES PRODUITS ET INVENDUS')
       .p("Le fournisseur garantit la traçabilité des pièces (identification, composition et étiquetage",
          "textile — règl. (UE) 1007/2011 ; sécurité générale des produits — règl. (UE) 2023/988) et",
          "coopère à tout retrait ou rappel. Les pièces qui lui reviennent (refus, résolution) ne sont ni",
          "détruites ni mises au rebut : réemploi, réutilisation ou don (art. L541-15-8 du code de",
          "l'environnement).")
       .art('DURÉE, RÉSILIATION ET SORT DES COMMANDES EN COURS')
       .p("Le contrat est conclu sans durée déterminée. Chaque partie peut y mettre fin par écrit avec un",
          "préavis de " + (J.preavisResiliationMois || 1) + " mois. Les commandes déjà réglées par un client sont menées à leur terme :",
          "le fournisseur expédie et l'acheteur règle le prix d'achat correspondant.");
      DOCS.clausesCommunes(R, 'le fournisseur');
      R.art('ANNEXES')
       .p("Annexe 1 — normes de publication et critères du contrôle atelier.",
          "Annexe 2 — grille de prix : marge, livraison au poids, contrôle atelier.",
          "Annexe 3 — dossier de vérification d'entreprise et pièces déposées.",
          "Les annexes font partie intégrante du présent contrat-cadre.");
      return { titre: "Contrat-cadre d'achat ferme — fournisseur Mode",
        lignes: DOCS.enTete().concat(R.l).concat(DOCS.pied('le fournisseur')) };
    },

    /* (18/09, soir) LE CONTRAT DE TRAVAIL « agent de caisse » est parti avec l'agent de caisse mobile : il
       engageait un salarié à se déplacer chez le client, à lui demander un code de sécurité et à compter ses
       espèces. Aucun salarié ne fait plus cela — les deux moyens de paiement s'achètent au comptoir d'un commerce. */

    // ── CLIENT : acceptation des conditions générales (preuve horodatée, art. 1366 code civil)
    cgu_client: function (ctx) {
      var D = window.PEC_DATA, sc = (D && D.scenario) || {};
      var c = (D && D.client && D.client(ctx.id)) || {};
      var S = DOCS.societe(), J = DOCS.juridique();
      var L = (D && D.livraisonInfo) ? D.livraisonInfo() : {};
      var rg = ((D && D.ref) || {}).rgpd || {};
      var R = new Redac();
      R.bloc('CE DOCUMENT ATTESTE')
       .p("que " + (c.nomComplet || ctx.nom || '—') + " a accepté les conditions générales de vente et d'utilisation",
          "de " + S.marque + ", version " + ((D && D.CGV_VERSION) || '—') + ", le " + new Date().toLocaleDateString('fr-FR') + ".",
          "Le vendeur est " + S.nom + (S.rcs ? ', ' + S.rcs : '') + ", " + S.siege + ".")
       .bloc('OBJET ET PRIX')
       .p("· Le prix affiché est ferme, toutes taxes comprises. Il est bloqué pendant la fenêtre",
          "  d'encaissement (" + (sc.fenetreEncaissementMinutes || 120) + " minutes) ; passé ce délai la commande expire sans frais et les",
          "  pièces sont relibérées.",
          "· Le règlement en espèces est plafonné à " + (sc.plafondEspeces || 1000) + " EUR par commande (art. L112-6 du code",
          "  monétaire et financier) ; au-delà, le solde est réglé par carte.",
          "· Aucun remboursement n'est effectué en espèces : il prend la forme d'un avoir ou d'un virement,",
          "  pour des raisons de traçabilité (LCB-FT).")
       .bloc('RÉTRACTATION ET GARANTIES LÉGALES')
       .p("· Droit de rétractation de " + (L.retourJours || 14) + " jours à compter de la réception, sans motif ni pénalité",
          "  (art. L221-18 du code de la consommation), au moyen du formulaire mis à disposition.",
          "· Garantie légale de conformité (art. L217-3 et suivants du code de la consommation) et garantie",
          "  des vices cachés (art. 1641 du code civil), indépendantes de toute garantie commerciale.",
          "· Les pièces d'occasion sont vendues sous le régime de la TVA sur la marge (art. 297 A du CGI) :",
          "  la TVA ne figure donc pas au détail sur la facture.")
       .bloc("VÉRIFICATION D'IDENTITÉ")
       .p("L'ouverture du compte suppose la vérification de l'identité : pièce d'identité, photo et vidéo de",
          "vérification. Une vérification complémentaire est requise pour toute commande dépassant",
          (((sc.lcbft || {}).seuilCommande) || 300) + " EUR réglée en espèces. Ces éléments sont conservés " + ((J.conservation || {}).dossierVerification || "le temps du contrôle réglementaire") + ".")
       .bloc('DONNÉES PERSONNELLES')
       .p("Responsable de traitement : " + S.nom + ", " + S.siege + ".",
          "Bases légales : " + ((J.baseLegale || {}).contrat || "exécution du contrat") + " et " + ((J.baseLegale || {}).obligation || "obligation légale") + ".",
          "Droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité",
          "exerçables depuis l'espace Compte de l'application ou à l'adresse du siège — réponse sous",
          (rg.reponseJours || 30) + " jours. Réclamation possible auprès de la CNIL.")
       .bloc('RÉCLAMATION, MÉDIATION ET JURIDICTION')
       .p("Toute réclamation est adressée au service client, qui répond dans les délais annoncés à l'écran.",
          "En cas de désaccord persistant, le client peut recourir gratuitement à " + (J.mediationConso || "un médiateur de la consommation") + ".",
          "Le client conserve le droit de saisir la juridiction du lieu de son domicile (art. R631-3 du code",
          "de la consommation). Le " + (J.droitApplicable || 'droit français') + " est applicable.")
       .p({ saut: 14 },
          "Accepté par voie électronique le " + new Date().toLocaleString('fr-FR') + " — cette acceptation vaut",
          "signature au sens de l'article 1366 du code civil.");
      return { titre: "Acceptation des conditions générales", lignes: DOCS.enTete().concat(R.l) };
    }
  };

  /* ── SIGNATURE ÉLECTRONIQUE ─────────────────────────────────────────────────────────────
        Un document du process (mandat, contrat, CGU) ne s'ajoute pas en pièce jointe : il est
        GÉNÉRÉ par nous, LU, puis SIGNÉ. La signature réécrit le PDF avec le nom du signataire,
        la mention « lu et approuvé », l'horodatage et une empreinte du document — de quoi
        prouver QUI a signé QUOI et QUAND. Tant qu'il n'est pas signé, le dossier n'est pas
        complet : un contrat non signé n'engage personne. ── */
  DOCS.empreinte = function (txt) {
    var h1 = 0x811c9dc5, s2 = String(txt || '');
    for (var i = 0; i < s2.length; i++) { h1 ^= s2.charCodeAt(i); h1 = (h1 * 0x01000193) >>> 0; }
    return h1.toString(16).toUpperCase().padStart(8, '0');
  };
  DOCS.signer = function (portee, id, piece, signataire, ctx) {
    var self = this;
    var p = this.piecesDe(portee).filter(function (x) { return x.id === piece; })[0];
    var modele = p && p.genere && this.MODELES[p.genere];
    if (!modele) return Promise.reject(new Error("Ce document ne se signe pas — il se dépose."));
    if (!signataire || String(signataire).trim().length < 3) return Promise.reject(new Error('Indique le nom et la qualité du signataire.'));
    /* (10/09 — lot 4) LE SIGNATAIRE EST BIEN L'INTÉRESSÉ. « ≥ 3 caractères » suffisait : n'importe quel texte signait le
       contrat de travail de n'importe qui. On confronte au nom porté par l'acte. */
    /* (10/09 — C12) …et pour un contrat d'entreprise, l'intéressé est le REPRÉSENTANT LÉGAL relevé sur le Kbis validé.
       Tant que le Kbis n'est pas contrôlé, la mention n'existe pas et la contrainte ne s'applique pas — on ne bloque
       personne sur une donnée qu'on n'a pas. */
    var attendu = (ctx && ctx.signataireAttendu) || (this.mentions(portee, id) || {}).dirigeant || null;
    if (attendu) {
      var norm = function (x) { return String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, ''); };
      if (norm(signataire).indexOf(norm(String(attendu).split(' ')[0])) === -1) return Promise.reject(new Error('Le signataire doit être ' + attendu + ' — c\'est le nom porté par le document.'));
    }
    var m = modele(Object.assign({ portee: portee, id: id }, ctx || {}));
    var quand = new Date();
    var emp = this.empreinte(m.titre + '|' + signataire + '|' + quand.toISOString());
    var lignes = m.lignes.concat([
      { saut: 10 },
      { texte: 'SIGNATURE ÉLECTRONIQUE', gras: true },
      'Signé par : ' + signataire,
      'Mention : lu et approuvé.',
      'Le ' + quand.toLocaleString('fr-FR') + '.',
      "Empreinte du document : " + emp + " — toute modification ultérieure la change.",
      "Cette signature électronique vaut engagement des parties (art. 1367 du code civil)."
    ]);
    return this.deposerPdf(portee, id, piece, m.titre, lignes, {
      modele: p.genere, signe: true, signataire: String(signataire).trim(),
      signeAt: quand.getTime(), empreinte: emp,
      conditions: this.conditionsDe(p.genere, portee, id),   // (10/09 — C12) ce qui est signé reste lisible tel quel, même si le référentiel bouge
      nom: m.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-signe.pdf'
    }).then(function (doc) {
      try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('document_signe', id, { portee: portee, piece: piece, par: doc.signataire, empreinte: emp }); } catch (e) {}
      return doc;
    });
  };
  // Un document à signer n'est « fourni » que SIGNÉ.
  DOCS.estSigne = function (portee, id, piece) { var d = this.get(portee, id, piece); return !!(d && d.signe); };

  // Génère le document du process pour un acteur, et le dépose dans son dossier.
  /* (08/09 — audit fournisseur) LA FACTURE D'ACHAT FERME : le fournisseur facture AJEK pour la pièce vendue (prix vendeur convenu).
     Générée à l'émission (emettreFacture), rangée au coffre sous pec-doc:fournisseur:<id>:facture-<numéro>, ouverte par le
     fournisseur (05) et le manager (36). Tout vient de la facture elle-même, de la fiche entreprise du fournisseur et du référentiel. */
  DOCS.MODELES.facture_fournisseur = function (ctx) {
    var D = window.PEC_DATA, f = ctx.facture || {}, S = DOCS.societe(), J = DOCS.juridique();
    var E = (D && D.fournisseurEntreprise) ? D.fournisseurEntreprise(f.fournisseur) : {};
    var eur = function (n) { return (Math.round((n || 0) * 100) / 100).toFixed(2).replace('.', ',') + ' €'; };
    var q = new Date(f.emiseTs || Date.now()), dateFr = q.toLocaleDateString('fr-FR');
    var vj = J.virementJours || 7;
    var R = new Redac();
    R.bloc('FACTURE N° ' + (f.numero || f.id))
     .p('Date d\'émission : ' + dateFr + ' · Référence achat : ' + (f.id || '—') + (f.commande ? ' · Commande client : ' + f.commande : ''))
     .bloc('ÉMETTEUR (fournisseur)')
     .p((E.raisonSociale || f.fournisseur || '—') + (E.siret ? ' — SIRET ' + E.siret : '') + (E.tva ? ' — TVA ' + E.tva : ''),
        E.adresse || '', E.email ? 'Contact : ' + E.email : '')
     .bloc('DESTINATAIRE (acheteur)')
     .p(S.nom + (S.forme ? ', ' + S.forme : '') + ' — marque ' + S.marque, 'Siège social : ' + S.siege, S.rcs ? 'RCS ' + S.rcs : '', S.tva ? 'TVA intracommunautaire ' + S.tva : '')
     .bloc('DÉSIGNATION');
    var pieces = f.pieces || [], arts = f.articles || [];
    if (pieces.length) pieces.forEach(function (ref, i) { R.p((i + 1) + '. ' + (arts[i] || 'Pièce') + ' — réf. ' + ref + ' · achat ferme (contrat-cadre fournisseur)'); });
    else R.p('Pièces vendues en achat ferme — contrat-cadre fournisseur.');
    /* (10/09 — lot 6, constat C27) CE QUE PORTE UNE FACTURE D'ACHAT. Elle affichait un TOTAL déjà net, sans dire ce
       qui en avait été déduit, et renvoyait la mention de TVA « à la charge du fournisseur » — une facture ne délègue
       pas ses mentions obligatoires. Le régime se lit sur la déclaration validée du fournisseur ; les déductions
       (débits de réclamation imputés, retenue de garantie) se détaillent ; le net à payer se retrouve à l'addition. */
    var T = f.tva || ((D && D.fournisseurRegimeTva) ? (function () { var t = D.fournisseurRegimeTva(f.fournisseur); return { regime: t.cle, libelle: t.libelle, taux: t.taux, montant: 0, mention: t.mention }; })() : null);
    var ht = f.montantHt != null ? f.montantHt : f.montant;
    var tvaM = (T && T.montant) || 0, du = f.montantDu != null ? f.montantDu : (ht + tvaM);
    R.p({ saut: 6 }, { texte: 'TOTAL HT : ' + eur(ht) + ' (prix vendeur convenu)', gras: true });
    if (T && T.taux) R.p('TVA ' + T.taux + ' % : ' + eur(tvaM), { texte: 'TOTAL TTC : ' + eur(du), gras: true });
    R.p((T && T.mention) || 'Régime de TVA du fournisseur non relevé.',
        S.nom + ' revend la pièce en son nom sous le régime de la marge des biens d\'occasion (art. 297 A CGI).');
    var deductions = [];
    (f.debits || []).forEach(function (r) { deductions.push('Réclamation ' + (r.ref || r.reclamation || '') + (r.article ? ' — ' + r.article : '') + (r.motif ? ' (' + r.motif + ')' : '') + ' : − ' + eur(r.montant)); });
    if (f.retenue && f.retenue.montant) deductions.push('Retenue de garantie (' + (f.retenue.raison || f.retenue.palier) + ') : − ' + eur(f.retenue.montant) + ' — libérée le ' + new Date(f.retenue.libereLe).toLocaleDateString('fr-FR'));
    if (deductions.length) { R.bloc('DÉDUCTIONS').p.apply(R, deductions); if (f.reliquatDebits) R.p('Reste dû par le fournisseur, reporté sur la facture suivante : ' + eur(f.reliquatDebits) + '.'); }
    R.bloc('NET À PAYER').p({ texte: eur(f.montant), gras: true })
     .bloc('RÈGLEMENT')
     .p('Par virement ' + (E.iban ? 'sur l\'IBAN ' + E.iban : 'sur le compte de la fiche entreprise du fournisseur') + (E.bic ? ' (BIC ' + E.bic + ')' : '') + ',',
        'échéance : ' + (f.echeance || ('sous ' + vj + ' j après contrôle')) + '. Aucun règlement en espèces.')
     .bloc('AUTOFACTURATION')
     /* Mention obligatoire de l'art. 242 nonies A de l'annexe II au CGI lorsque la facture est établie par le client. */
     .p('Facture établie par ' + S.nom + ' au nom et pour le compte de ' + (E.raisonSociale || f.fournisseur || 'du fournisseur') + ',',
        'en vertu du mandat de facturation de l\'article « Prix, facturation et règlement » du contrat-cadre' + (f.contratSigneLe ? ' signé le ' + new Date(f.contratSigneLe).toLocaleDateString('fr-FR') : '') + '.',
        'Le fournisseur reste seul redevable de la taxe. À défaut de contestation sous ' + (J.contestationJours || 15) + ' jours, la facture est réputée acceptée.');
    return { titre: 'Facture ' + (f.numero || f.id) + ' — ' + (f.fournisseur || ''), lignes: DOCS.enTete().concat(R.l) };
  };
  /* ── (18/09) L'AUTOFACTURE DE COMMISSION DU COMMERÇANT PARTENAIRE : AJEK établit, au nom du distributeur, la facture de sa
        commission de distribution (art. 289, I, 2 CGI ; mention de l'art. 242 nonies A, ann. II) quand le reversement du mois
        est soldé. Rangée au coffre du point sous `autofacture-<mois>` ; ouverte par le partenaire (05) et le manager (29). ── */
  DOCS.MODELES.facture_commission_bons = function (ctx) {
    var D = window.PEC_DATA, r = ctx.releve || {}, p = ctx.point || {}, S = DOCS.societe(), J = DOCS.juridique();
    var M = (D && p.id) ? (DOCS.mentions('partenaire', p.id) || {}) : {};
    var eur = function (n) { return (Math.round((n || 0) * 100) / 100).toFixed(2).replace('.', ',') + ' €'; };
    var q = new Date(ctx.at || Date.now());
    var R = new Redac();
    R.bloc('FACTURE N° ' + ctx.numero)
     .p("Date d'émission : " + q.toLocaleDateString('fr-FR') + ' · Période : ' + r.mois + ' · Relevé mensuel du Bon d’achat PayEnCash')
     .bloc('ÉMETTEUR (distributeur)')
     .p((M.raisonSociale || p.enseigne || '—') + ((M.siret || p.siret) ? ' — SIRET ' + (M.siret || p.siret) : '') + (M.tvaIntra ? ' — TVA ' + M.tvaIntra : ''),
        M.adresse || [p.adresse, p.cp, p.ville].filter(Boolean).join(', ') || '')
     .bloc('DESTINATAIRE')
     .p(S.nom + (S.forme ? ', ' + S.forme : '') + ' — marque ' + S.marque, 'Siège social : ' + S.siege, S.rcs ? 'RCS ' + S.rcs : '', S.tva ? 'TVA intracommunautaire ' + S.tva : '')
     .bloc('DÉSIGNATION')
     .p('Commission de distribution du Bon d’achat PayEnCash — ' + r.nb + ' bon d’achat(s) vendu(s) en ' + r.mois + ' pour ' + eur(r.ventes) + " (contrat de distribution, article « Règlement à la vente et commission »).",
        /* (19/09 — taux par commerce) LE TAUX SE DIT TEL QU'IL A ÉTÉ RETENU : celui des ventes du mois, et lorsqu'il a
           changé en cours de mois, le taux effectif ANNONCÉ comme tel — une facture ne présente pas une moyenne
           comme si c'était le taux du contrat. */
        'Taux : ' + String(r.commissionPct).replace('.', ',') + ' % du montant vendu' + (r.tauxMultiples ? ' (taux effectif du mois — le taux de commission a changé en cours de période ; chaque vente a retenu celui qui lui était applicable)' : '') + '.')
     .p({ saut: 6 }, { texte: 'TOTAL HT : ' + eur(r.commissionHT), gras: true }, 'TVA ' + r.tvaPct + ' % : ' + eur(r.tva), { texte: 'TOTAL TTC : ' + eur(r.commissionTTC), gras: true })
     .bloc('RÈGLEMENT')
     .p('Retenue à la source : le distributeur conserve sa commission sur chaque vente, et sa carte n\'est prélevée que du solde — ' + eur(r.ventes) + ' vendus − ' + eur(r.commissionTTC) + ' de commission TTC = ' + eur(r.preleve) + ' prélevés par ' + S.nom + '.',
        'Aucun règlement en espèces.')
     .bloc('AUTOFACTURATION')
     .p('Facture établie par ' + S.nom + ' au nom et pour le compte de ' + (M.raisonSociale || p.enseigne || 'du distributeur') + ', en vertu du mandat de facturation du contrat de distribution' + (p.signeLe ? ' signé le ' + p.signeLe : '') + '.',
        'Le distributeur reste seul redevable de la taxe. À défaut de contestation sous ' + (J.contestationJours || 15) + ' jours, la facture est réputée acceptée.');
    return { titre: 'Autofacture ' + ctx.numero + ' — ' + (p.enseigne || ''), lignes: DOCS.enTete().concat(R.l) };
  };
  /* ── (11/09) LA FACTURE DU CLIENT. Elle n'existait pas : deux écrans Mode renvoyaient vers la même image
        décorative. PayEnCash achète ferme au fournisseur et REVEND EN SON NOM — face au client, c'est nous le
        vendeur. La note de vente se rend donc, et la vente à distance exige la confirmation écrite des mentions
        (art. L221-13 C. conso). Elle est RENDUE À LA DEMANDE depuis l'instantané GELÉ de la commande réglée
        (lignes, remises, moyen de règlement) et depuis l'identité du vendeur figée à la vente (cmd.facture) :
        rééditée dans un an, elle est identique — et rien ne s'entasse dans le stockage de l'appareil.
        Pas de TVA détaillée : régime de la marge sur biens d'occasion (art. 297 A du CGI). ── */
  DOCS.MODELES.facture_client = function (ctx) {
    var D = window.PEC_DATA, c = (ctx && ctx.commande) || {}, f = c.facture || {};
    var V = f.vendeur || DOCS.societe();
    var eur = function (n) { return (Math.round((n || 0) * 100) / 100).toFixed(2).replace('.', ',') + ' €'; };
    var q = new Date(f.emiseTs || c.regleeTs || Date.now());
    var R = new Redac();
    R.bloc('FACTURE N° ' + (f.numero || '—'))
     .p('Date : ' + q.toLocaleDateString('fr-FR') + ' · Commande ' + (c.ref || '—') +
        (c.recu ? ' · Reçu d\'encaissement ' + c.recu : ''))
     .bloc('VENDEUR')
     .p(V.nom + (V.forme ? ', ' + V.forme : '') + (V.capital ? ' au capital de ' + V.capital : '') + ' — marque ' + (V.marque || 'PayEnCash'),
        V.siege ? 'Siège social : ' + V.siege : '',
        [V.siren ? 'SIREN ' + V.siren : '', V.rcs ? 'RCS ' + V.rcs : '', V.tva ? 'TVA ' + V.tva : ''].filter(Boolean).join(' · '))
     .bloc('CLIENT')
     .p(c.client || '—', c.relais ? 'Livraison en point relais : ' + c.relais : (c.adresse || ''))
     .bloc('DÉTAIL');
    /* UNE COMMANDE DE L'HISTORIQUE DU COMPTE ne porte qu'un article et le montant payé (elle précède le
       panier multi-pièces) : on écrit la ligne qu'on a VRAIMENT, jamais un détail inventé. */
    var lignes = c.lignes || [], sous = 0;
    if (!lignes.length && c.articleId) {
      var art = (D && D.article) ? D.article(c.articleId) : null;
      lignes = [{ nom: (art && art.nom) || c.articleId, taille: (art && art.taille) || null, qte: 1, prix: c.paye != null ? c.paye : c.total }];
    }
    lignes.forEach(function (l, i) {
      var pu = l.prix || 0, qte = l.qte || 1; sous += pu * qte;
      R.p((i + 1) + '. ' + (l.nom || 'Pièce') + (l.taille ? ' · taille ' + l.taille : '') +
          ' — ' + qte + ' × ' + eur(pu) + ' = ' + eur(pu * qte));
    });
    if (!lignes.length) R.p('Aucune ligne enregistrée sur cette commande.');
    R.p({ saut: 6 }, { texte: 'Sous-total : ' + eur(c.sousTotal != null ? c.sousTotal : sous), gras: true });
    var remises = [];
    if (c.remisePromo > 0) remises.push('Code promo' + (c.promo && c.promo.code ? ' ' + c.promo.code : '') + ' : − ' + eur(c.remisePromo));
    if (c.remiseCampagne > 0) remises.push('Campagne' + (c.campagne && c.campagne.libelle ? ' « ' + c.campagne.libelle + ' »' : '') + ' : − ' + eur(c.remiseCampagne));
    /* (19/09) LA REMISE D'UN LIEN PARTAGÉ est une déduction comme les autres : elle a baissé le prix, la facture
       le dit, et elle dit d'où elle vient — le lien d'un atelier, sur une marge PayEnCash réduite. */
    if (c.remisePartage > 0) remises.push('Remise PayEnCash — lien partagé' + (c.partage && c.partage.fournisseur ? ' de ' + c.partage.fournisseur : '') + ' : − ' + eur(c.remisePartage));
    if (c.carte > 0) remises.push('Bon d’achat PayEnCash : − ' + eur(c.carte));
    if (c.avoir > 0) remises.push('Avoir : − ' + eur(c.avoir));
    if (remises.length) { R.bloc('DÉDUCTIONS'); R.p.apply(R, remises); }
    var MOY = { especes: 'en espèces', avoir: 'par avoir', carte: 'par Bon d’achat PayEnCash', bon: 'par Bon d’achat PayEnCash' };
    R.bloc('TOTAL PAYÉ')
     .p({ texte: eur(c.paye != null ? c.paye : c.total), gras: true })
     /* (20/09) le CANAL du règlement : le Bon d’achat PayEnCash
        acheté au comptoir d'un commerce. Le moyen exact vient de la commande (c.moyen) — jamais supposé. La
        mention « à un agent PayEnCash à domicile » est partie avec l'agent de caisse mobile. */
     .p('Réglé ' + (MOY[c.reglementMode] || (c.moyen ? 'par ' + ((window.PEC_DATA && PEC_DATA.libelleMoyen) ? PEC_DATA.libelleMoyen(c.moyen) : c.moyen) : 'par Bon d’achat PayEnCash')) + '.',
        /* (19/09, soir) LE COLIS EST FACTURÉ À PART, au tarif du transporteur : la facture le dit et le chiffre. */
        (c.livraisonCout > 0 ? 'Livraison ' + eur(c.livraisonCout) + ' — ' : 'Livraison — ') + (c.livraison || 'Mondial Relay, point relais'))
     .bloc('TVA')
     /* Régime de la marge : la TVA n'est JAMAIS détaillée sur la facture (art. 297 A du CGI). */
     .p('Régime particulier de la marge bénéficiaire sur les biens d\'occasion — art. 297 A du CGI.',
        'TVA non détaillée et non récupérable par l\'acheteur.')
     .bloc('DROITS DU CLIENT')
     .p('Rétractation : ' + (f.retourJours || 14) + ' jours à compter de la réception, sans justification (art. L221-18 s. du code de la consommation).',
        'Garantie légale de conformité (art. L217-3 s. C. conso) et garantie des vices cachés (art. 1641 s. du code civil).',
        'Médiation de la consommation : ' + (DOCS.juridique().mediationConso || 'un médiateur de la consommation, coordonnées aux CGV en vigueur') + '.');
    /* PAS d'en-tête de contrat ici : « Ci-après « AJEK » », « représentée par … dûment habilitée » sont
       des formules d'acte, et elles rejouaient une SECONDE identité du vendeur — celle d'aujourd'hui —
       au-dessus de celle qui a été figée à la vente. Une facture porte UN vendeur, dans son bloc. */
    return { titre: 'Facture ' + (f.numero || c.ref || ''), lignes: R.l };
  };

  /* (17/09 — pivot) LA FACTURE D'AUTO-FACTURATION DU POINT (`MODELES.facture_commission` et `factureCommission`)
     a été retirée : elle facturait au nom du mandataire la « commission d'apport d'affaires — accueil et supervision
     de la borne ». Plus de commission de point, donc plus d'auto-facture à produire. */

  /* ── (10/09 — lot 6, constat C22) L'ÉTIQUETTE ÉTAIT UNE PHRASE, PAS UN DOCUMENT. « Étiquette Mondial Relay — à imprimer »
        s'affichait, mais il n'y avait rien à imprimer : aucun PDF, rien au coffre, et l'expéditeur était celui de la fiche
        de la SESSION (donc faux si l'appel venait d'ailleurs). Elle devient un vrai document, déposé au coffre sous la
        portée `expedition`, avec l'expéditeur RÉEL du colis, le destinataire et le point relais. ── */
  DOCS.MODELES.etiquette_mr = function (ctx) {
    var e = (ctx && ctx.expedition) || {}, S = DOCS.societe();
    var exp = e.expediteur || {};
    var R = new Redac();
    R.bloc('BORDEREAU D\'EXPÉDITION — POINT RELAIS')
     .p('Numéro de suivi : ' + (e.mr || '—'),
        'Émis le ' + new Date(e.etiquetteAt || Date.now()).toLocaleString('fr-FR') +
        (e.etiquetteExpireTs ? ' — à déposer avant le ' + new Date(e.etiquetteExpireTs).toLocaleDateString('fr-FR') : ''))
     .bloc('EXPÉDITEUR')
     /* Le compte transporteur est celui d'AJEK (pivot du 31/08 : l'étiquette est émise sur NOTRE compte, ce qui évite
        que le fournisseur avance des frais — et écarte la qualification de service financier). Le colis part pourtant
        de chez le fournisseur : les deux se disent, sinon le transporteur va au mauvais endroit. */
     .p(S.nom + ' (' + S.marque + ') — compte transporteur',
        'c/o ' + (exp.enseigne || e.fournisseur || '—') + (exp.adresse ? ', ' + exp.adresse : ''))
     .bloc('DESTINATAIRE')
     .p(e.client || '—',
        (e.clientTel ? 'Tél. ' + e.clientTel : '') + (e.clientEmail ? (e.clientTel ? ' · ' : '') + e.clientEmail : ''),
        'Point Relais : ' + (e.relaisNom || e.relais || '—') + (e.relaisId ? ' (' + e.relaisId + ')' : ''),
        e.relaisAdresse ? e.relaisAdresse + (e.relaisVille ? ', ' + e.relaisVille : '') : '')
     .bloc('CONTENU')
     .p((e.nom || 'Pièce') + (e.taille ? ' — taille ' + e.taille : ''),
        'Commande ' + (e.commande || '—') + ' · lot ' + (e.lot || '—'))
     .bloc('À FAIRE')
     .p('Imprimer ce bordereau, le coller sur le colis fermé, et le déposer dans un Point Relais.',
        'Le colis reste gardé ' + ((((window.PEC_DATA || {}).mode || {}).panier || {}).livraison || {}).gardeJours + ' jours au relais destinataire.');
    return { titre: 'Étiquette ' + (e.mr || 'Mondial Relay'), lignes: DOCS.enTete().concat(R.l) };
  };

  /* (10/09 — lot 4) LES MENTIONS QU'UN DOCUMENT DOIT PORTER. Le contrat-cadre nommait le fournisseur « — » et son compte de
     règlement « IBAN communiqué au dossier de vérification » : on faisait signer un engagement d'achat ferme à une entreprise
     qu'aucune mention n'identifiait. Un document ne se génère qu'une fois ces mentions relevées sur les pièces validées. */
  DOCS.MENTIONS_REQUISES = { contrat_fournisseur: ['raisonSociale', 'siret', 'adresse', 'iban'] };
  /* (18/09, soir) `PREALABLES.contrat_agent` (pas de contrat de travail sans salaire ni type de contrat fixés)
     est parti avec le contrat lui-même. La table reste : un autre modèle y pose ses préalables. */
  DOCS.PREALABLES = {
  };
  /* Un contrat signé par le seul intéressé·e n'engage personne en face : PayEnCash contresigne, et c'est cette
     contresignature qui rend la pièce complète (le dossier la compte « validée » à ce moment seulement). */
  DOCS.contresigner = function (portee, id, piece, par) {
    var d = this.get(portee, id, piece);
    if (!d) return { ok: false, motif: 'Document introuvable.' };
    if (!d.signe) return { ok: false, motif: 'Le document n\'est pas encore signé par l\'intéressé·e.' };
    if (d.contresigne) return { ok: true, deja: true, document: d };
    d.contresigne = { par: par || 'PayEnCash', at: Date.now() };
    try { localStorage.setItem(P + portee + ':' + id + ':' + piece, JSON.stringify(d)); } catch (e) { return { ok: false, motif: 'Écriture impossible.' }; }
    noter('contrat_contresigne', id, { portee: portee, piece: piece, par: d.contresigne.par });
    /* (10/09 — lot 4) LA CONTRESIGNATURE EST LE CONTRÔLE. Un document que PayEnCash a produit, que l'intéressé·e a signé
       et que PayEnCash signe en face n'a plus rien à contrôler : il est complet à cet instant. Sans cela la pièce restait
       « en vérification », l'écran offrait encore un « Valider » — et le cliquer ne changeait rien, l'état étant recalculé
       sur la contresignature. Un contrôle qui ne peut rien changer n'est pas un contrôle. */
    return { ok: true, document: this.statuer(portee, id, piece, 'validee', '', d.contresigne.par) || d };
  };
  DOCS.genererDocument = function (portee, id, piece, ctx) {
    var p = this.piecesDe(portee).filter(function (x) { return x.id === piece; })[0];
    var modele = p && p.genere && this.MODELES[p.genere];
    if (!modele) return Promise.reject(new Error('Aucun modèle pour cette pièce.'));
    var requis = this.MENTIONS_REQUISES[p.genere];
    if (requis) {
      var manque = this.mentionsManquantes(portee, id, requis);
      if (manque.length) return Promise.reject(new Error('Document impossible : ' + manque.join(', ') + ' — ces mentions se relèvent sur les pièces (Kbis, RIB) au moment où le contrôleur les valide.'));
    }
    var pre = this.PREALABLES[p.genere] ? this.PREALABLES[p.genere](portee, id, ctx || {}) : null;
    if (pre) return Promise.reject(new Error('Document impossible : ' + pre + '.'));
    var m = modele(Object.assign({ portee: portee, id: id }, ctx || {}));
    return this.deposerPdf(portee, id, piece, m.titre, m.lignes, { modele: p.genere });
  };


  DOCS.rendreDossier = function (hote, portee, id, opts) {
    hote = typeof hote === 'string' ? document.getElementById(hote) : hote;
    if (!hote) return;
    opts = opts || {};
    var self = this;
    /* (23/09, soir — fondatrice : « clique, remplis, visualise, valide un KYC et un KYB et tu vas comprendre la galère ») CE QUE
       L'ACTEUR A DÉCLARÉ, sous les yeux du contrôleur : l'écran appelant passe `opts.contexte` ({ raisonSociale, siret,
       adresse, dirigeantNomComplet, dirigeantQualite, site, email } ou une fonction qui le rend). Il PRÉ-REMPLIT le relevé des
       mentions (le contrôleur vérifie sur la pièce au lieu de tout retaper) et sert de référence au contrôle de la pièce
       d'identité. Le registre des entreprises (PEC_ENTREPRISE, s'il est chargé) s'ajoute à côté : ce qu'il dit, et les écarts. */
    function contexte() { try { return (typeof opts.contexte === 'function' ? opts.contexte() : opts.contexte) || null; } catch (e) { return null; } }
    var apercus = {};   // les pièces dont l'aperçu est déplié — survit aux repeintes du bus

    var TEINTE = {
      validee:   { bg: '#E7F4ED', fg: '#1E7A50', bord: '#BFE3D0', ic: 'i-check' },
      a_signer:  { bg: '#FFF4D6', fg: '#7A5A18', bord: '#EDD9A3', ic: 'i-edit' },
      deposee:   { bg: '#EEF1F0', fg: '#42544C', bord: '#DDE3E0', ic: 'i-clock' },
      refusee:   { bg: '#FDECEC', fg: '#B3261E', bord: '#E8B4AE', ic: 'i-alert' },
      manquante: { bg: 'transparent', fg: 'var(--color-muted)', bord: 'var(--color-sep)', ic: 'i-file' },
      // (10/09 — lot 4) deux états de plus, qui existaient dans les faits sans jamais s'afficher
      a_contresigner: { bg: '#FFF4D6', fg: '#7A5A18', bord: '#EDD9A3', ic: 'i-edit' },
      a_renouveler:   { bg: '#FDECEC', fg: '#B3261E', bord: '#E8B4AE', ic: 'i-clock' },
      avenant:        { bg: '#FFF4D6', fg: '#7A5A18', bord: '#EDD9A3', ic: 'i-alert' },
      incomplete:     { bg: '#FFF4D6', fg: '#7A5A18', bord: '#EDD9A3', ic: 'i-alert' }
    };
    function btn(attr, val, txt, fort) {
      return '<button type="button" class="pd-b' + (fort ? ' pd-b--fort' : '') + '" ' + attr + '="' + val + '">' + txt + '</button>';
    }

    function ligne(p, i) {
      var d = p.document, t = TEINTE[p.statut] || TEINTE.manquante;
      var meta = d
        ? (d.signe ? 'Signé par ' + d.signataire + ' le ' + new Date(d.signeAt).toLocaleDateString('fr-FR') + ' · empreinte ' + d.empreinte
                   : (self.typePiece(d) ? self.typePiece(d).lbl + (d.deuxFaces ? ' (recto et verso dans le même fichier)' : (d.verso ? ' — recto et verso' : '')) + (d.expireLe ? ', valable jusqu’au ' + new Date(d.expireLe).toLocaleDateString('fr-FR') : '') + ' · ' : '')
                     + d.nom + ' · ' + self.taille(d.taille) + ' · déposé le ' + new Date(d.at).toLocaleDateString('fr-FR'))
        : (p.genere ? 'Document produit par PayEnCash — à générer, à lire, puis à signer.'
                    : p.video ? 'Courte vidéo, face caméra, en suivant la consigne ci-dessous.'
                              : (p.aide || 'Photo nette ou PDF — recto-verso si la pièce en a un.'));
      var actions = '';
      /* (11/09) « OUVRIR » ET « TÉLÉCHARGER » N'ONT DE SENS QUE S'IL Y A DES OCTETS. Une pièce peut exister au
         dossier SANS fichier — une mention transcrite d'un dossier papier (mentionsSaisir), une entrée héritée :
         `taille()` le disait déjà (« taille inconnue »), mais les deux boutons étaient offerts quand même et le
         clic ne faisait RIEN, sans un mot. On les propose quand le fichier est là ; sinon on dit pourquoi. */
      var aFichier = !!(d && d.data);
      var sansFichier = (d && !d.data)
        ? '<span class="pd-note" style="font-size:11px;color:var(--color-muted)">Pièce sans fichier — relevée du dossier papier : rien à ouvrir ni à télécharger.</span>'
        : '';
      if (opts.manager) {
        /* (23/09, soir) LA PIÈCE SE REGARDE ICI : un PDF s'ouvrait dans un autre onglet, et le contrôleur perdait son
           formulaire de vue. « Aperçu » le déplie sous la pièce ; « Ouvrir » reste pour qui veut l'onglet. */
        if (aFichier) actions += (/^application\/pdf$/.test(d.type || '') ? btn('data-apercu', p.id, apercus[p.id] ? 'Replier l\'aperçu' : 'Aperçu') : '') + btn('data-voir', p.id, 'Ouvrir') + btn('data-dl', p.id, 'Télécharger');
        actions += sansFichier;
        // (10/09 — lot 4) PayEnCash CONTRESIGNE ce que l'intéressé a signé : un contrat à une seule signature n'engage personne en face
        if (p.statut === 'a_contresigner') actions += btn('data-cosign', p.id, 'Contresigner pour PayEnCash', true);
        /* (10/09 — lot 4) ON NE VALIDE QUE CE QUI EST REMIS. Une pièce que l'intéressé·e n'a pas encore signée (`a_signer`),
           ou que PayEnCash n'a pas encore contresignée (`a_contresigner`), attend le geste de QUELQU'UN D'AUTRE : son état
           se recalcule sur la signature manquante, si bien que « Valider » y était offert sans jamais rien changer. Le
           refus, lui, reste possible — PayEnCash peut décliner de contresigner. */
        if (d && p.statut !== 'validee' && p.statut !== 'a_signer' && p.statut !== 'a_contresigner') actions += btn('data-ok', p.id, 'Valider', true);
        if (d && p.statut !== 'validee') actions += btn('data-ko', p.id, 'Refuser…');
      } else {
        if (aFichier) actions += btn('data-voir', p.id, d.type === 'application/pdf' ? 'Lire' : 'Ouvrir') + btn('data-dl', p.id, 'Télécharger');
        actions += sansFichier;
        if (p.genere) {
          if (!d) actions += btn('data-gen', p.id, 'Générer le document', true);
          else if (!d.signe) actions += btn('data-sign', p.id, 'Signer', true) + btn('data-gen', p.id, 'Régénérer');
          else if (p.statut === 'avenant') actions += btn('data-sign', p.id, 'Signer l\'avenant', true);
          else if (p.statut !== 'validee') actions += btn('data-sign', p.id, 'Signer à nouveau');
        } else {
          if (p.video) actions += btn('data-vid', p.id, d ? 'Refaire la vidéo' : 'Enregistrer la vidéo', !d);
          if (!(p.genere && p.signe)) actions += '<label class="pd-b' + (!d && !p.video ? ' pd-b--fort' : '') + '" style="cursor:pointer">' + (d ? 'Remplacer' : (p.video ? 'Déposer un fichier' : 'Déposer')) + '<input type="file" accept=".pdf,image/*,video/*" data-up="' + p.id + '" hidden></label>';
        }
      }
      // LECTURE SUR PLACE (fondatrice 05/09 « pourquoi la vidéo on peut la lire côté hotline,
      // il faut un vrai process ») : côté contrôleur, la vidéo se regarde DANS l'écran, avec
      // la consigne demandée juste à côté — c'est la comparaison qui fait le contrôle. Une
      // image se déplie de la même façon ; un PDF garde « Lire » (visionneuse du navigateur).
      function lecteur(p2, d2) {
        if (!opts.manager || !d2 || !d2.data) return '';
        var src = self.source(d2);
        if (p2.video || /^video\//.test(d2.type || '')) {
          // Le contrôleur reçoit la LISTE des gestes demandés ce jour-là : il coche ce qu'il
          // voit. Une phrase résumée ne permet pas de contrôler, une liste si.
          var et = (d2.etapes && d2.etapes.length) ? d2.etapes
                 : String(d2.consigne || self.consigneDuJour(id)).replace(/\.$/, '').split(' · ');
          return '<div class="pd-v"><video src="' + src + '" controls playsinline preload="metadata"></video>' +
            '<p class="pd-vc">Gestes demandés' + (d2.secondes ? ' (' + d2.secondes + ' s)' : '') + ' — chacun doit se voir :</p>' +
            '<ol class="pd-et">' + et.map(function (x) { return '<li><span>' + x + '</span></li>'; }).join('') + '</ol>' +
            '<p class="pd-vc">Le visage doit être net et correspondre à la pièce d\'identité déposée.</p></div>';
        }
        if (/^image\//.test(d2.type || '')) {
          // (24/09) les deux faces côte à côte : c'est leur comparaison qui fait le contrôle
          var v2 = d2.verso && d2.verso.data && /^image\//.test(d2.verso.type || '') ? '<img src="' + d2.verso.data + '" alt="' + p2.label + ' — verso">' : '';
          return '<div class="pd-v"' + (v2 ? ' style="display:grid;grid-template-columns:1fr 1fr;gap:8px"' : '') + '><img src="' + src + '" alt="' + p2.label + (v2 ? ' — recto' : '') + '">' + v2 + '</div>';
        }
        if (apercus[p2.id] && /^application\/pdf$/.test(d2.type || '')) {
          return '<div class="pd-v pd-pv"><iframe src="' + src + '" title="' + p2.label + '" style="width:100%;max-width:none;height:460px;border:1px solid var(--color-sep);border-radius:10px;background:#fff"></iframe></div>';
        }
        return '';
      }
      var CTX = contexte();
      var attendu = (opts.manager && CTX) ? (p.id === 'cni' && CTX.dirigeantNomComplet ? '<br><b style="color:var(--color-ink)">Attendu : la pièce de ' + CTX.dirigeantNomComplet + (CTX.dirigeantQualite ? ' (' + CTX.dirigeantQualite + ')' : '') + '</b>, telle que déclarée sur le compte.'
        : p.id === 'kbis' && CTX.raisonSociale ? '<br><b style="color:var(--color-ink)">Attendu : ' + CTX.raisonSociale + (CTX.siret ? ' — SIRET ' + CTX.siret : '') + '</b>, tel que déclaré.'
        : p.id === 'rib' && CTX.raisonSociale ? '<br><b style="color:var(--color-ink)">Attendu : un compte au nom de ' + CTX.raisonSociale + '</b>.' : '') : '';
      return '<div class="pd-l" style="border:1px solid ' + t.bord + ';background:' + (p.statut === 'manquante' ? 'transparent' : t.bg) + '">' +
        '<div class="pd-n">' + (i + 1) + '</div>' +
        '<div class="pd-c">' +
          '<div class="pd-t">' + p.label + (p.obligatoire ? '' : ' <span class="pd-opt">facultatif</span>') + '</div>' +
          '<div class="pd-m">' + meta + attendu +
          // (10/09 — C12) DIRE CE QUI A CHANGÉ, pas seulement qu'il faut re-signer
          ((p.ecarts && p.ecarts.length) ? '<br><b style="color:#7A5A18">Depuis la signature : ' + p.ecarts.map(function (e) { return e.libelle + ' ' + e.signe + ' → ' + e.courant; }).join(' · ') + '</b>' : '') +
          (d && d.statut === 'refusee' && d.motif ? '<br><b style="color:#B3261E">Refusé : ' + d.motif + '</b>' : '') +
            (p.video ? '<br><i>' + ((d && d.consigne) || self.consigneDuJour(id)) + '</i>' : '') + '</div>' +
          lecteur(p, d) +
          (actions ? '<div class="pd-a">' + actions + '</div>' : '') +
        '</div>' +
        '<div class="pd-s" style="color:' + t.fg + '"><svg class="pec-ico" viewBox="0 0 24 24"><use href="#' + t.ic + '"/></svg>' + p.libelle + '</div>' +
      '</div>';
    }

    function peindre() {
      // opts.pieces : n'afficher qu'une partie du dossier (la page « Contrat-cadre » ne montre
      // que le contrat ; la page KYB montre tout). La progression suit ce qui est affiché.
      var dossier = self.dossier(portee, id);
      if (opts.pieces && opts.pieces.length) dossier = dossier.filter(function (p) { return opts.pieces.indexOf(p.id) !== -1; });
      var faits = dossier.filter(function (p) { return p.statut === 'validee'; }).length;
      var reste = dossier.filter(function (p) { return p.obligatoire && p.statut !== 'validee'; });
      var pct = Math.round(faits / dossier.length * 100);
      hote.innerHTML =
        '<style>' +
        '.pd-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px}' +
        '.pd-h b{font-size:14px;font-weight:800;color:var(--color-ink)}' +
        '.pd-h span{font-size:11.5px;color:var(--color-muted)}' +
        '.pd-j{height:6px;border-radius:99px;background:var(--color-sep);overflow:hidden;margin:6px 0 14px}' +
        '.pd-j i{display:block;height:100%;background:var(--color-primary);transition:width .3s}' +
        // (05/09) le libellé de statut est en nowrap : dans un panneau étroit il mangeait TOUTE
        // la ligne et la colonne de contenu tombait à 0 px (un mot par ligne). Elle garde une
        // largeur plancher, le statut passe dessous quand il n'y a plus la place.
        '.pd-l{display:flex;flex-wrap:wrap;gap:11px;align-items:flex-start;border-radius:12px;padding:12px 13px;margin-bottom:9px}' +
        '.pd-n{flex:none;width:22px;height:22px;border-radius:99px;background:rgba(0,0,0,.06);color:var(--color-ink);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:1px}' +
        '.pd-c{min-width:0;flex:1 1 190px}' +
        '.pd-t{font-size:13px;font-weight:800;color:var(--color-ink);letter-spacing:-.01em}' +
        '.pd-opt{font-weight:600;color:var(--color-muted);font-size:11px}' +
        '.pd-m{font-size:11.5px;line-height:1.55;color:var(--color-muted);margin-top:3px}' +
        '.pd-a{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}' +
        '.pd-b{font:inherit;font-size:11.5px;font-weight:700;border:1px solid var(--color-sep);background:#fff;color:var(--color-ink);border-radius:8px;padding:6px 11px;cursor:pointer}' +
        '.pd-b--fort{background:var(--color-primary);border-color:var(--color-primary);color:#fff}' +
        '.pd-s{flex:none;display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;padding-top:2px}' +
        '.pd-s svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.1}' +
        '.pd-sign{border:1px solid var(--color-sep);border-radius:12px;padding:12px 13px;margin-bottom:9px;background:#fff}' +
        '.pd-et{margin:9px 0 0;padding:0 0 0 18px;font-size:11.5px;line-height:1.6;color:var(--color-muted)}' +
        '.pd-et li{margin-bottom:2px}.pd-et li span{color:var(--color-ink);font-weight:600}' +
        '.pd-et li b{color:var(--color-muted);font-weight:700;margin-left:6px}' +
        // ── MODALE DE VÉRIFICATION VIDÉO ──
        '.pd-modal{position:absolute;inset:0;z-index:80;display:flex;flex-direction:column;padding:14px;overflow-y:auto;background:rgba(9,20,17,.94);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:pdmo .18s ease-out}' +
        '@keyframes pdmo{from{opacity:0;transform:translateY(8px)}}' +
        '.pd-mo-tete{display:flex;align-items:flex-start;gap:10px;color:#fff;margin-bottom:11px}' +
        '.pd-mo-k{font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.52)}' +
        '.pd-mo-h{font-size:17px;font-weight:800;letter-spacing:-.02em;margin-top:2px}' +
        '.pd-mo-h b{color:var(--color-bright,#7BE3B0)}' +
        '.pd-mo-x{flex:none;margin-left:auto;width:32px;height:32px;border-radius:999px;border:none;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
        '.pd-mo-x svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}' +
        '.pd-mo-scene{position:relative;border-radius:18px;overflow:hidden;background:#0c1512;aspect-ratio:3/4;flex:none;box-shadow:0 18px 40px rgba(0,0,0,.45)}' +
        '.pd-mo-v{display:block;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);background:#0c1512}' +
        '.pd-modal[data-phase="relecture"] .pd-mo-v{transform:none}' +
        '.pd-mo-vide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;color:rgba(255,255,255,.6);font-size:12.5px;line-height:1.6}' +
        '.pd-mo-vide span{display:block;margin-top:5px;font-size:11px;color:rgba(255,255,255,.38)}' +
        '.pd-mo-cpt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(9,20,17,.5);color:#fff;font-size:72px;font-weight:800;letter-spacing:-.04em}' +
        '.pd-mo-rec{position:absolute;top:11px;left:11px;display:inline-flex;align-items:center;gap:6px;background:#D2372B;color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.1em;border-radius:999px;padding:5px 11px 5px 9px}' +
        '.pd-mo-rec:before{content:"";width:7px;height:7px;border-radius:99px;background:#fff;animation:pdblink 1s infinite}' +
        '@keyframes pdblink{50%{opacity:.15}}' +
        '.pd-mo-chrono{position:absolute;top:11px;right:11px;display:inline-flex;align-items:baseline;gap:2px;background:rgba(0,0,0,.5);color:#fff;border-radius:999px;padding:5px 11px;font-variant-numeric:tabular-nums}' +
        '.pd-mo-chrono b{font-size:14px;font-weight:800}.pd-mo-chrono span{font-size:10px;opacity:.7}' +
        '.pd-mo-bas{position:absolute;left:0;right:0;bottom:0;padding:26px 13px 12px;background:linear-gradient(to top,rgba(6,14,12,.92),transparent)}' +
        '.pd-mo-etape{color:#fff;font-size:14.5px;font-weight:700;line-height:1.35;text-shadow:0 1px 12px rgba(0,0,0,.6)}' +
        '.pd-mo-jauge{height:4px;border-radius:99px;background:rgba(255,255,255,.22);overflow:hidden;margin-top:9px}' +
        '.pd-mo-jauge i{display:block;height:100%;border-radius:99px;background:var(--color-bright,#7BE3B0);transition:width .9s linear}' +
        '.pd-mo-liste{list-style:none;margin:12px 0 0;padding:0}' +
        '.pd-mo-liste li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:11px;color:rgba(255,255,255,.62);font-size:12px;line-height:1.4}' +
        '.pd-mo-liste li .n{flex:none;width:20px;height:20px;border-radius:99px;background:rgba(255,255,255,.12);color:#fff;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center}' +
        '.pd-mo-liste li .t{flex:1;min-width:0}' +
        '.pd-mo-liste li b{flex:none;font-size:10.5px;font-weight:700;opacity:.55}' +
        '.pd-mo-liste li.on{background:rgba(123,227,176,.14);color:#fff;font-weight:700}' +
        '.pd-mo-liste li.on .n{background:var(--color-bright,#7BE3B0);color:#0c2f22}' +
        '.pd-mo-liste li.fait{color:rgba(255,255,255,.42)}' +
        '.pd-mo-liste li.fait .n{background:rgba(123,227,176,.28);color:#7BE3B0}' +
        '.pd-mo-msg{margin:11px 2px 0;color:rgba(255,255,255,.62);font-size:11.5px;line-height:1.55}' +
        '.pd-mo-pied{margin-top:auto;padding-top:13px;display:flex;flex-direction:column;gap:8px}' +
        '.pd-mo-b{width:100%;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;border-radius:13px;padding:13px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}' +
        '.pd-mo-b--fort{background:var(--color-primary,#10A06A);border-color:var(--color-primary,#10A06A)}' +
        '.pd-mo-b[disabled]{opacity:.45;cursor:progress}' +
        '.pd-v{margin-top:9px}' +
        '.pd-v video,.pd-v img{display:block;width:100%;max-width:min(320px,100%);border-radius:10px;background:#000;border:1px solid var(--color-sep)}' +
        '.pd-vc{margin:7px 0 0;font-size:11.5px;line-height:1.55;color:var(--color-muted)}' +
        '.pd-vc b{color:var(--color-ink)}' +
        '</style>' +
        '<div class="pd-h"><b>' + (reste.length ? 'Dossier en cours' : 'Dossier complet') + '</b>' +
          '<span>' + faits + ' / ' + dossier.length + ' pièces validées' +
          (reste.length ? ' — il reste : ' + reste.map(function (p) { return p.label; }).join(', ') : ' — plus rien à faire') + '</span></div>' +
        '<div class="pd-j"><i style="width:' + pct + '%"></i></div>' +
        dossier.map(ligne).join('');
    }

    /* ── (10/09 — lot 4) VALIDER, C'EST RELEVER CE QU'ON LIT. Valider était un clic sans contenu : rien de la pièce n'entrait
       nulle part, si bien que l'identité légale de l'acteur devait ensuite être… inventée. Le contrôleur recopie les mentions
       du document (elles alimentent la fiche, le contrat et les factures) et, pour une pièce à durée de vie, jusqu'à quand
       elle vaut. Une pièce sans mention ni échéance se valide toujours d'un clic. ── */
    function panneauValider(piece, apres) {
      var spec = self.mentionsDe(piece), p0 = self.piecesDe(portee).filter(function (x) { return x.id === piece; })[0] || {};
      var d0 = self.get(portee, id, piece) || {}, dejaM = d0.mentions || {};
      var CTX = contexte();
      /* LA PIÈCE D'IDENTITÉ DU DIRIGEANT (KYC) NE SE VALIDE PAS D'UN CLIC MUET : le contrôleur atteste qu'elle est au nom du
         dirigeant déclaré, lisible et en cours de validité — c'est ce qui autorise ensuite la signature du contrat-cadre. */
      if (!spec && !p0.expire && piece === 'cni' && CTX && CTX.dirigeantNomComplet) return panneauIdentite(piece, apres);
      if (!spec && !p0.expire) { self.statuer(portee, id, piece, 'validee', '', opts.par || 'manager'); return apres(); }
      var l = hote.querySelector('.pd-l [data-ok="' + piece + '"]');
      var carte = l ? l.closest('.pd-l') : hote;
      var z = document.createElement('div');
      z.className = 'pd-sign';
      /* PRÉ-REMPLI AVEC CE QUI EST DÉCLARÉ : le contrôleur VÉRIFIE sur la pièce, il ne retape pas. Une mention déjà relevée prime. */
      var pre = {};
      if (CTX) {
        pre.raisonSociale = CTX.raisonSociale || ''; pre.siret = String(CTX.siret || '').replace(/\s/g, ''); pre.siren = pre.siret.slice(0, 9);
        pre.dirigeant = CTX.dirigeantNomComplet || ''; pre.titulaire = CTX.raisonSociale || ''; pre.adresse = CTX.adresse || '';
      }
      var champs = (spec ? spec.champs : []).map(function (c) {
        var v = dejaM[c.k] || pre[c.k] || '';
        return '<label style="display:block;margin-top:8px;font-size:11.5px;font-weight:700;color:var(--color-muted)">' + c.l + (c.requis ? '' : ' <span style="font-weight:500">(si présent)</span>') + (!dejaM[c.k] && pre[c.k] ? ' <span style="font-weight:600;color:var(--color-primary-dark)">— déclaré, à vérifier</span>' : '') + '</label>' +
          '<input type="text" data-m="' + c.k + '" value="' + String(v).replace(/"/g, '&quot;') + '" placeholder="' + (c.aide || '').replace(/"/g, '&quot;') + '" class="pec-input" style="width:100%;border:1.5px solid var(--color-sep);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px">';
      }).join('');
      var ech = p0.expire ? '<label style="display:block;margin-top:8px;font-size:11.5px;font-weight:700;color:var(--color-muted)">Valable jusqu\'au (cette pièce se renouvelle)</label>' +
        '<input type="date" data-exp value="' + String(d0.expiresOn || '').slice(0, 10) + '" style="width:100%;border:1.5px solid var(--color-sep);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px">' : '';
      z.innerHTML = '<div class="pd-t">' + (spec ? spec.titre : 'Validité de la pièce') + '</div>' +
        '<div class="pd-m">' + (CTX ? 'Pré-rempli avec ce qui a été déclaré : <b>vérifie chaque mention sur le document</b> et corrige ce qui diffère — ' : 'Recopie ce que tu LIS sur le document : ') + 'ces mentions deviennent l\'identité légale de l\'acteur (fiche, contrat, factures). Rien n\'est deviné.</div>' +
        '<div data-registre></div>' +
        champs + ech +
        '<p data-err style="margin:8px 0 0;font-size:11.5px;font-weight:700;color:var(--color-amber-text)" hidden></p>' +
        '<div class="pd-a"><button type="button" class="pd-b pd-b--fort" data-ok-m aria-disabled="true" style="opacity:.45">Valider la pièce</button><button type="button" class="pd-b" data-annule-m>Annuler</button></div>';
      carte.parentNode.insertBefore(z, carte.nextSibling);
      var err = z.querySelector('[data-err]'), okB = z.querySelector('[data-ok-m]');
      /* LE REGISTRE DES ENTREPRISES À CÔTÉ DU KBIS (23/09, soir — « une API gratuite pour récupérer les infos société ») :
         ce que dit l'État pour ce SIREN, les écarts avec le déclaré, et un bouton pour reprendre ses mentions. Sans réseau,
         rien ne bloque : le relevé à la main reste la règle. */
      var sirenReg = (pre.siren || String(dejaM.siren || '').slice(0, 9));
      if (piece === 'kbis' && window.PEC_ENTREPRISE && /^\d{9}$/.test(sirenReg)) {
        var zr = z.querySelector('[data-registre]');
        zr.innerHTML = '<p class="pd-m" style="margin-top:6px">Registre des entreprises : consultation en cours…</p>';
        PEC_ENTREPRISE.chercher(sirenReg).then(function (r) {
          if (!zr.isConnected) return;
          if (!r.ok) { zr.innerHTML = '<p class="pd-m" style="margin-top:6px">Registre des entreprises : ' + r.motif + '</p>'; return; }
          var e = r.entreprise, cmp = PEC_ENTREPRISE.comparer(e, { raisonSociale: pre.raisonSociale, siret: pre.siret, dirigeant: CTX && CTX.dirigeant ? CTX.dirigeant : null });
          var esc2 = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
          zr.innerHTML = '<div style="margin-top:8px;border-radius:10px;background:var(--color-mint,#E7F4ED);padding:9px 11px;font-size:11.5px;line-height:1.55">'
            + '<b>Ce que dit le registre</b> (' + esc2(e.source) + ') — ' + esc2(e.raisonSociale || e.nomComplet) + (e.forme ? ', ' + esc2(e.forme) : '') + ' · SIREN ' + esc2(e.siren) + (e.siret ? ' · siège SIRET ' + esc2(e.siret) : '') + (e.adresse ? ' · ' + esc2(e.adresse) : '') + (e.naf ? ' · NAF ' + esc2(e.naf) : '') + (e.dateCreation ? ' · créée le ' + esc2(e.dateCreation) : '')
            + ' · <b style="color:' + (e.actif ? 'var(--color-primary-dark)' : '#B3261E') + '">' + (e.actif ? 'en activité' : 'CESSÉE au registre') + '</b>'
            + (e.dirigeants.length ? '<br>' + (e.dirigeants.length > 1 ? 'Dirigeants' : 'Dirigeant') + ' : ' + e.dirigeants.map(function (d) { return esc2(d.prenom + ' ' + d.nom) + (d.qualiteRegistre ? ' (' + esc2(d.qualiteRegistre) + ')' : ''); }).join(', ') : '<br>Aucun dirigeant personne physique au registre.')
            + (cmp.ecarts.length ? '<br><b style="color:#B3261E">Écarts avec le déclaré : </b>' + cmp.ecarts.map(function (x) { return esc2(x.l) + ' — déclaré « ' + esc2(x.declare) + ' », registre « ' + esc2(x.registre) + ' »'; }).join(' · ') : '<br><b style="color:var(--color-primary-dark)">Concordant avec le déclaré</b> (' + cmp.accords.map(function (x) { return esc2(x.l); }).join(', ') + ').')
            + '<div class="pd-a" style="margin-top:8px"><button type="button" class="pd-b" data-reprendre>Reprendre les mentions du registre</button></div></div>';
          zr.querySelector('[data-reprendre]').addEventListener('click', function () {
            var m = { raisonSociale: e.raisonSociale || e.nomComplet, formeJuridique: e.forme, siren: e.siren, siret: e.siret, adresse: e.adresse, naf: e.naf,
              dirigeant: e.dirigeants.length ? e.dirigeants[0].prenom + ' ' + e.dirigeants[0].nom : '', rcs: e.ville && e.siren ? e.ville + ' ' + e.siren : '' };
            Object.keys(m).forEach(function (k) { var i2 = z.querySelector('[data-m="' + k + '"]'); if (i2 && m[k]) i2.value = m[k]; });
            majEtatBouton();
          });
        });
      }
      /* Le bouton DIT s'il peut aboutir : tant qu'une mention obligatoire manque, il est inactif — un contrôle qui refuse
         toujours de la même façon n'informe personne (et l'audit de clics le compte, à juste titre, comme sans effet). */
      function majEtatBouton() {
        var pret = (spec ? spec.champs : []).every(function (c) { return !c.requis || String((z.querySelector('[data-m="' + c.k + '"]') || {}).value || '').trim(); })
          && (!p0.expire || String((z.querySelector('[data-exp]') || {}).value || ''));
        okB.setAttribute('aria-disabled', pret ? 'false' : 'true');
        okB.style.opacity = pret ? '' : '.45';
      }
      z.addEventListener('input', majEtatBouton); z.addEventListener('change', majEtatBouton); majEtatBouton();
      z.querySelector('[data-annule-m]').addEventListener('click', function () { z.remove(); });
      okB.addEventListener('click', function () {
        if (this.getAttribute('aria-disabled') === 'true') return;
        var mentions = {}, manque = [];
        (spec ? spec.champs : []).forEach(function (c) {
          var el = z.querySelector('[data-m="' + c.k + '"]'), v = String(el.value || '').trim();
          if (c.normaliser === 'iban') v = v.replace(/\s/g, '').toUpperCase();
          if (c.normaliser === 'majuscules') v = v.toUpperCase();
          if (!v) { if (c.requis) manque.push(c.l); return; }
          if (c.motif && !c.motif.test(v.replace(/\s/g, ''))) { manque.push(c.l + (c.aide ? ' (' + c.aide + ')' : '')); return; }
          mentions[c.k] = v;
        });
        var expEl = z.querySelector('[data-exp]'), exp = expEl ? String(expEl.value || '') : '';
        if (p0.expire && !exp) manque.push('la date de validité');
        if (manque.length) { err.hidden = false; err.textContent = '⚠ À relever sur le document : ' + manque.join(', ') + '.'; return; }
        self.statuer(portee, id, piece, 'validee', '', opts.par || 'manager', { mentions: mentions, expiresOn: exp || null });
        z.remove(); apres();
      });
    }

    /* ── (23/09, soir) LA PIÈCE D'IDENTITÉ DU DIRIGEANT : le contrôleur atteste trois choses, lisibles une par une — c'est
       le KYC du signataire du contrat-cadre. La date de fin de validité est relevée quand elle se lit. ── */
    function panneauIdentite(piece, apres) {
      var CTX = contexte() || {};
      var l = hote.querySelector('.pd-l [data-ok="' + piece + '"]');
      var carte = l ? l.closest('.pd-l') : hote;
      var z = document.createElement('div');
      z.className = 'pd-sign';
      var nom = CTX.dirigeantNomComplet || '—';
      z.innerHTML = '<div class="pd-t">Contrôle de la pièce d\'identité — ' + nom + (CTX.dirigeantQualite ? ', ' + CTX.dirigeantQualite : '') + '</div>' +
        '<div class="pd-m">C\'est le dirigeant déclaré sur le compte : c\'est lui qui signera le contrat-cadre. Coche ce que tu constates sur la pièce.</div>' +
        ['La pièce est au nom de <b>' + nom + '</b> (mêmes prénom et nom).', 'La photo et les mentions sont lisibles, le document n\'est ni tronqué ni retouché.', 'La pièce est en cours de validité.'].map(function (t, i2) {
          return '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:8px;font-size:12px;line-height:1.5;color:var(--color-ink)"><input type="checkbox" data-kyc="' + i2 + '" style="margin-top:2px;flex:none"><span>' + t + '</span></label>';
        }).join('') +
        '<label style="display:block;margin-top:9px;font-size:11.5px;font-weight:700;color:var(--color-muted)">Fin de validité de la pièce (si elle se lit)</label>' +
        '<input type="date" data-exp-id style="width:100%;border:1.5px solid var(--color-sep);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px">' +
        '<div class="pd-a"><button type="button" class="pd-b pd-b--fort" data-ok-id aria-disabled="true" style="opacity:.45">Valider la pièce d\'identité</button><button type="button" class="pd-b" data-annule-id>Annuler</button></div>';
      carte.parentNode.insertBefore(z, carte.nextSibling);
      var okB = z.querySelector('[data-ok-id]');
      function maj() { var pret = [].every.call(z.querySelectorAll('[data-kyc]'), function (c) { return c.checked; }); okB.setAttribute('aria-disabled', pret ? 'false' : 'true'); okB.style.opacity = pret ? '' : '.45'; }
      z.addEventListener('change', maj);
      z.querySelector('[data-annule-id]').addEventListener('click', function () { z.remove(); });
      okB.addEventListener('click', function () {
        if (this.getAttribute('aria-disabled') === 'true') return;
        var exp = String((z.querySelector('[data-exp-id]') || {}).value || '');
        self.statuer(portee, id, piece, 'validee', '', opts.par || 'manager', { mentions: { identiteDe: nom, controle: 'nom, lisibilité, validité' }, expiresOn: exp || null });
        z.remove(); apres();
      });
    }
    /* ── (23/09, soir) REFUSER, SANS window.prompt : les motifs courants en pastilles, un mot libre, et le déposant lit le tout. ── */
    function panneauRefuser(piece, apres) {
      var l = hote.querySelector('.pd-l [data-ko="' + piece + '"]');
      var carte = l ? l.closest('.pd-l') : hote;
      var z = document.createElement('div');
      z.className = 'pd-sign';
      var MOTIFS = ['Illisible ou tronquée', 'Périmée', 'Pas au nom déclaré', 'Ce n\'est pas le bon document', 'Il manque une ou plusieurs pages'];
      z.innerHTML = '<div class="pd-t">Refuser la pièce</div><div class="pd-m">Le motif revient au déposant, tel quel, dans son espace : dis-lui quoi refaire.</div>' +
        '<div class="pd-a" style="margin-top:8px">' + MOTIFS.map(function (m) { return '<button type="button" class="pd-b" data-motif="' + m.replace(/"/g, '&quot;') + '">' + m + '</button>'; }).join('') + '</div>' +
        '<input type="text" data-motif-libre class="pec-input" placeholder="Précision (facultative) — ex. la page 2 manque" style="width:100%;margin-top:9px;border:1.5px solid var(--color-sep);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px">' +
        '<div class="pd-a"><button type="button" class="pd-b pd-b--fort" data-ok-ko aria-disabled="true" style="opacity:.45">Refuser et prévenir</button><button type="button" class="pd-b" data-annule-ko>Annuler</button></div>';
      carte.parentNode.insertBefore(z, carte.nextSibling);
      var choisi = null, okB = z.querySelector('[data-ok-ko]');
      function maj() { var pret = !!(choisi || String(z.querySelector('[data-motif-libre]').value || '').trim()); okB.setAttribute('aria-disabled', pret ? 'false' : 'true'); okB.style.opacity = pret ? '' : '.45'; }
      [].forEach.call(z.querySelectorAll('[data-motif]'), function (b) { b.addEventListener('click', function () { choisi = b.getAttribute('data-motif'); [].forEach.call(z.querySelectorAll('[data-motif]'), function (x) { x.classList.toggle('pd-b--fort', x === b); }); maj(); }); });
      z.querySelector('[data-motif-libre]').addEventListener('input', maj);
      z.querySelector('[data-annule-ko]').addEventListener('click', function () { z.remove(); });
      okB.addEventListener('click', function () {
        if (this.getAttribute('aria-disabled') === 'true') return;
        var libre = String(z.querySelector('[data-motif-libre]').value || '').trim();
        var motif = [choisi, libre].filter(Boolean).join(' — ') || 'non conforme';
        self.statuer(portee, id, piece, 'refusee', motif, opts.par || 'manager'); z.remove(); apres();
      });
    }

    // ── signer : on demande le nom et la qualité, et la mention « lu et approuvé »
    function panneauSignature(piece, apres) {
      var l = hote.querySelector('.pd-l [data-sign="' + piece + '"]');
      var carte = l ? l.closest('.pd-l') : hote;
      var z = document.createElement('div');
      z.className = 'pd-sign';
      z.innerHTML = '<div class="pd-t">Signature du document</div>' +
        '<div class="pd-m">En signant, tu déclares avoir lu l\'intégralité du document. La signature électronique vaut engagement (art. 1367 du code civil) : le PDF est réécrit avec ton nom, la date et une empreinte.</div>' +
        '<input type="text" class="pec-input" placeholder="Nom, prénom et qualité (ex. Awa D., gérante)" style="width:100%;margin-top:9px;border:1.5px solid var(--color-sep);border-radius:9px;padding:9px 11px;font:inherit;font-size:12.5px">' +
        '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:9px;font-size:11.5px;line-height:1.5;color:var(--color-muted)"><input type="checkbox" style="margin-top:2px"><span>J\'ai lu le document et je l\'approuve.</span></label>' +
        '<div class="pd-a"><button type="button" class="pd-b pd-b--fort" data-ok-sign>Signer</button><button type="button" class="pd-b" data-annule-sign>Annuler</button></div>';
      carte.parentNode.insertBefore(z, carte.nextSibling);
      var champ = z.querySelector('input[type=text]'), coche = z.querySelector('input[type=checkbox]');
      champ.focus();
      z.querySelector('[data-annule-sign]').addEventListener('click', function () { z.remove(); });
      z.querySelector('[data-ok-sign]').addEventListener('click', function () {
        if (!coche.checked) return window.alert('Coche « j\'ai lu le document et je l\'approuve » avant de signer.');
        self.signer(portee, id, piece, champ.value, opts.ctx || {})
          .then(function () { z.remove(); apres(); })
          .catch(function (e) { window.alert(e.message); });
      });
    }

    /* ── MODALE DE VÉRIFICATION VIDÉO ────────────────────────────────────────────────────
       (fondatrice 05/09 : « côté fournisseur on ne se voit pas — ouvre une modale, un truc
       du genre, que ça fasse pro »).

       Le panneau en ligne avait un défaut net : DEUX gestionnaires vivaient sur le même
       bouton (un addEventListener pour ouvrir la caméra, puis un onclick pour démarrer). Au
       second clic les deux partaient — la caméra se rouvrait pendant que le décompte
       commençait, et l'aperçu retombait au noir. D'où « on ne se voit pas ».

       Ici : une seule machine à états (prêt → aperçu → décompte → prise → relecture), un
       seul gestionnaire qui aiguille dessus, et le flux de l'aperçu est RÉUTILISÉ pour la
       prise — plus de coupure, plus de seconde demande d'autorisation. ── */
    function panneauVideo(piece, apres) {
      var sc = self.scenarioDuJour(id);
      var scene = hote.closest('.pec-device') || document.body;
      if (scene !== document.body && getComputedStyle(scene).position === 'static') scene.style.position = 'relative';

      var m = document.createElement('div');
      m.className = 'pd-modal';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.setAttribute('aria-label', 'Vidéo de vérification');
      m.innerHTML =
        '<div class="pd-mo-tete">' +
          '<div><div class="pd-mo-k">Vérification d\'identité</div>' +
          '<div class="pd-mo-h">Vidéo de <b>' + sc.duree + ' secondes</b></div></div>' +
          '<button type="button" class="pd-mo-x" data-fermer aria-label="Fermer">' +
          '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '</div>' +
        '<div class="pd-mo-scene">' +
          '<video class="pd-mo-v" playsinline muted></video>' +
          '<div class="pd-mo-vide" data-vide>Ta caméra s\'affichera ici.<br><span>Rien n\'est enregistré tant que tu n\'as pas démarré.</span></div>' +
          '<div class="pd-mo-chrono" data-chrono hidden><b data-chrono-n>0</b><span>s</span></div>' +
          '<div class="pd-mo-rec" data-rec hidden>ENREGISTREMENT</div>' +
          '<div class="pd-mo-cpt" data-cpt hidden>3</div>' +
          '<div class="pd-mo-bas">' +
            '<div class="pd-mo-etape" data-etape>Prépare ta pièce d\'identité.</div>' +
            '<div class="pd-mo-jauge"><i data-jauge style="width:0%"></i></div>' +
          '</div>' +
        '</div>' +
        '<ol class="pd-mo-liste" data-liste>' +
          sc.etapes.map(function (e, i2) {
            return '<li data-et="' + i2 + '"><span class="n">' + (i2 + 1) + '</span><span class="t">' + e.t + '</span><b>' + e.s + ' s</b></li>';
          }).join('') +
        '</ol>' +
        '<p class="pd-mo-msg" data-msg></p>' +
        '<div class="pd-mo-pied">' +
          '<button type="button" class="pd-mo-b pd-mo-b--fort" data-action>Activer ma caméra</button>' +
          '<button type="button" class="pd-mo-b" data-second hidden>Refaire</button>' +
        '</div>';
      scene.appendChild(m);

      var video = m.querySelector('.pd-mo-v'), vide = m.querySelector('[data-vide]'),
          chrono = m.querySelector('[data-chrono]'), chronoN = m.querySelector('[data-chrono-n]'),
          rec = m.querySelector('[data-rec]'), cpt = m.querySelector('[data-cpt]'),
          etape = m.querySelector('[data-etape]'), jauge = m.querySelector('[data-jauge]'),
          liste = m.querySelector('[data-liste]'), msg = m.querySelector('[data-msg]'),
          action = m.querySelector('[data-action]'), second = m.querySelector('[data-second]');

      var phase = 'pret', flux = null, docFait = null, minuteur = null;

      function fermer() {
        if (minuteur) clearInterval(minuteur);
        if (flux) { try { flux.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} flux = null; }
        try { video.pause(); video.srcObject = null; } catch (e2) {}
        m.remove();
      }
      m.querySelector('[data-fermer]').addEventListener('click', function () {
        if (phase === 'prise' && !window.confirm('Interrompre l\'enregistrement ?')) return;
        fermer();
      });
      m.addEventListener('click', function (e) { if (e.target === m && phase !== 'prise') fermer(); });

      function etat(p) { phase = p; m.setAttribute('data-phase', p); }

      // ① APERÇU — on se voit AVANT d'enregistrer quoi que ce soit.
      function apercu() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          msg.textContent = "La caméra n'est pas disponible ici. Ferme cette fenêtre et utilise « Déposer un fichier » pour envoyer une vidéo enregistrée.";
          action.disabled = true; return;
        }
        action.disabled = true; action.textContent = 'Ouverture de la caméra…';
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: true })
          .then(function (f) {
            flux = f; video.srcObject = f; video.muted = true;
            var lance = video.play();
            if (lance && lance.catch) lance.catch(function () {});
            vide.hidden = true; etat('apercu');
            action.disabled = false; action.textContent = 'Je me vois — démarrer';
            msg.textContent = 'Cadre bien ton visage, lumière devant toi. Prépare ta pièce d\'identité.';
          })
          .catch(function () {
            action.disabled = false; action.textContent = 'Réessayer';
            msg.textContent = "Caméra refusée ou occupée par une autre application. Autorise-la dans ton navigateur, ou ferme cette fenêtre et dépose une vidéo enregistrée.";
          });
      }

      // ② DÉCOMPTE — on n'enregistre personne par surprise.
      function decompte() {
        etat('decompte'); action.disabled = true; action.textContent = 'Prêt…'; msg.textContent = '';
        cpt.hidden = false; var n = 3; cpt.textContent = String(n);
        minuteur = setInterval(function () {
          n--;
          if (n > 0) { cpt.textContent = String(n); return; }
          clearInterval(minuteur); minuteur = null; cpt.hidden = true; prise();
        }, 1000);
      }

      // ③ PRISE — les étapes défilent, la jauge avance, l'aperçu reste vivant.
      function prise() {
        etat('prise'); rec.hidden = false; chrono.hidden = false;
        action.textContent = 'Enregistrement en cours…';
        var total = sc.duree;
        self.capturerVideo(portee, id, piece, {
          scenario: sc, apercu: video, flux: flux,
          onEtape: function (e, i2) {
            etape.textContent = e.t;
            [].forEach.call(liste.querySelectorAll('li'), function (li, j) {
              li.classList.toggle('on', j === i2);
              li.classList.toggle('fait', j < i2);
            });
          },
          onTick: function (r) {
            chronoN.textContent = String(r);
            jauge.style.width = Math.round((total - r) / total * 100) + '%';
          }
        }).then(function (doc) {
          rec.hidden = true; chrono.hidden = true; docFait = doc;
          [].forEach.call(liste.querySelectorAll('li'), function (li) { li.classList.remove('on'); li.classList.add('fait'); });
          relecture();
        }).catch(function (err) {
          rec.hidden = true; chrono.hidden = true; etat('apercu');
          action.disabled = false; action.textContent = 'Réessayer'; msg.textContent = err.message;
        });
      }

      // ④ RELECTURE — on se regarde, puis on garde ou on refait.
      function relecture() {
        etat('relecture');
        if (flux) { try { flux.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} flux = null; }
        video.srcObject = null;
        video.src = self.source(docFait);
        video.muted = false; video.setAttribute('controls', 'controls');
        video.play().catch(function () {});
        etape.textContent = 'Relis-toi : les ' + sc.etapes.length + ' gestes doivent se voir.';
        jauge.style.width = '100%';
        msg.textContent = 'Ton visage doit être net et la pièce lisible. Si ce n\'est pas le cas, refais la prise.';
        action.disabled = false; action.textContent = 'Garder cette vidéo';
        second.hidden = false;
      }

      // UN SEUL gestionnaire : c'est l'état qui décide, plus deux écouteurs qui se marchent dessus.
      action.addEventListener('click', function () {
        if (phase === 'pret') return apercu();
        if (phase === 'apercu') return decompte();
        if (phase === 'relecture') { fermer(); apres(); return; }
      });
      second.addEventListener('click', function () {
        if (phase !== 'relecture') return;
        self.supprimer(portee, id, piece);
        fermer(); panneauVideo(piece, apres);
      });
      etat('pret');
    }

    hote.addEventListener('change', function (e) {
      var i = e.target.closest('input[data-up]'); if (!i || !i.files || !i.files[0]) return;
      self.deposer(portee, id, i.getAttribute('data-up'), i.files[0])
        .then(function () { peindre(); if (opts.onChange) opts.onChange(); })
        .catch(function (err) { window.alert(err.message); });
    });
    hote.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = b.getAttribute('data-voir'), dl = b.getAttribute('data-dl'), ok = b.getAttribute('data-ok'),
          ko = b.getAttribute('data-ko'), gen = b.getAttribute('data-gen'), sg = b.getAttribute('data-sign'),
          vid = b.getAttribute('data-vid');
      if (v) return void self.ouvrir(portee, id, v);
      if (dl) return void self.telecharger(portee, id, dl);
      if (ok) {
        /* (10/09 — lot 4) UN ÉCRAN PÉRIMÉ SE CORRIGE. La même pièce peut être affichée dans deux dossiers ouverts (file de
           contrôle, fiche) : validée d'un côté, l'autre gardait son bouton « Valider ». Le cliquer ne pouvait plus rien
           changer — le contrôleur croyait que l'écran ne répondait pas. On repeint, il voit l'état réel. */
        var dOk = self.get(portee, id, ok);
        if (!dOk || dOk.statut === 'validee') { peindre(); if (opts.onChange) opts.onChange(); return; }
        return void panneauValider(ok, function () { peindre(); if (opts.onChange) opts.onChange(); });
      }
      if (ko) return void panneauRefuser(ko, function () { peindre(); if (opts.onChange) opts.onChange(); });
      var ap = b.getAttribute('data-apercu');
      if (ap) { apercus[ap] = !apercus[ap]; peindre(); return; }
      if (sg) return void panneauSignature(sg, function () { peindre(); if (opts.onChange) opts.onChange(); });
      var cs = b.getAttribute('data-cosign');
      if (cs) { var rC = self.contresigner(portee, id, cs, opts.par || 'PayEnCash'); if (rC && rC.ok === false) window.alert(rC.motif); peindre(); if (opts.onChange) opts.onChange(); return; }
      if (vid) return void panneauVideo(vid, function () { peindre(); if (opts.onChange) opts.onChange(); });
      if (gen) {
        var faire = opts.genererPdf ? opts.genererPdf(gen) : self.genererDocument(portee, id, gen, opts.ctx || {});
        Promise.resolve(faire).then(function () { peindre(); if (opts.onChange) opts.onChange(); })
          .catch(function (err) { window.alert(err.message); });
      }
    });
    /* (10/09 — lot 4) ON NE REPEINT PAS SOUS LES DOIGTS. Le dossier se redessine à chaque battement du bus ; un panneau
       ouvert (relevé des mentions, signature) partait avec, et la saisie en cours était perdue — le contrôleur voyait son
       formulaire disparaître. Le repeint attend qu'il soit refermé. */
    function peindreSiLibre() { if (hote.querySelector('.pd-sign')) return; peindre(); }
    window.addEventListener('storage', peindreSiLibre);
    window.addEventListener('pec-bus', peindreSiLibre);
    peindre();
    return peindre;
  };

  window.PEC_DOCS = DOCS;
})();
