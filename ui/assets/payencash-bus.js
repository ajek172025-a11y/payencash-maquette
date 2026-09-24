/* PEC_BUS — le canal INTER-APPS réel de la maquette (fondatrice 25/08 : « je veux de
   vraies interactions entre apps, pas un système pré-rempli »).
   Même origine = localStorage PARTAGÉ entre l'app client, l'app partenaire et le back-office
   + événement 'storage' entre onglets. AUCUNE simulation automatique :
   ① le CLIENT annonce sa commande (annoncerCommande) → elle apparaît au manager, en direct ;
   ② trois déclarants, et personne d'autre (17/09 — pivot : plus de borne, plus de point qui encaisse une commande) :
        · le BON D’ACHAT PAYENCASH, quand il couvre la commande — par:'bon' ;
        · le MANAGER qui enregistre un encaissement déjà fait, motif à l'appui — par:'manager' ;
        · le BON D’ACHAT PAYENCASH (18/09) qui couvre toute la commande — par:'bon' : le bus débite le bon d’achat lui-même (PEC_DATA.bonDebiter) ;
          un bon d’achat qui ne couvre qu'une partie s'APPLIQUE (bonAppliquer) et le reste se règle par un autre déclarant.
   ③ l'écran du client ATTEND (surPaiement) et bascule quand SA réf est payée.
   Règle miroir de la contrainte SQL payments.valideur_obligatoire.
   ── FLUX CONSIGNÉS (écran par écran) ─────────────────────────────────────────
   EN LIGNE (Bon d’achat PayEnCash) :
     mode/05 · fly/01 (comment payer)    → le client saisit le code de son bon, vérifié par bonValider
                                           → payer(ref, {par:'bon', bon}) : le bus le débite et solde la commande
   (18/09, soir) LE FLUX « À DOMICILE (agent) » A DISPARU : fly/05-recherche-agent, coursier/06-scan-code et
   coursier/07-encaissement sont partis avec l'agent de caisse mobile, et avec eux le déclarant par:'agent'.
   Personne ne se déplace plus compter des espèces : le client achète son Bon d’achat PayEnCash au comptoir
   d'un commerce — ou à un distributeur mobile qui vient jusqu'à lui — puis règle avec.
   La réf canonique vient de PEC_DATA.scenario.refPaiement (le littéral n'est qu'un
   filet si le data-layer ne charge pas). Le banc rejoue le flux en ligne : BUS·218. */
(function () {
  var P = 'pec_bus_';
  function lire(k) { try { return JSON.parse(localStorage.getItem(P + k) || 'null'); } catch (e) { return null; } }
  /* ── (11/09) UNE ÉCRITURE QUI ÉCHOUE SE DIT — Y COMPRIS ICI ────────────────────────────────────────────────
     `ecrire` avalait l'exception. Or TOUT passe par elle : la commande annoncée, le paiement, le dépôt, la
     reprise de caisse, le rapprochement. Stockage plein, navigation privée, quota d'un iPhone bien rempli —
     et `payer()` répondait `{ok:true}` sur une commande qui n'existait nulle part. Le client voit « réglé »,
     le manager ne verra jamais l'argent. Elle renvoie maintenant si elle a écrit, et retient le
     dernier échec pour que les écrans puissent le dire. ── */
  var ECHEC = null;
  function ecrire(k, v) {
    var ok = true;
    try { localStorage.setItem(P + k, JSON.stringify(v)); }
    catch (e) { ok = false; ECHEC = { cle: k, at: Date.now(), motif: (e && e.name === 'QuotaExceededError') ? 'stockage plein' : ((e && e.message) || 'écriture refusée') }; }
    // l'événement 'storage' n'atteint JAMAIS l'onglet qui écrit (spec) : on
    // notifie aussi l'onglet courant — les listes se rafraîchissent en direct (28/08)
    try { window.dispatchEvent(new CustomEvent('pec-bus', { detail: { cle: k, ecrit: ok } })); } catch (e2) {}
    return ok;
  }
  // Le message qu'un écran affiche quand le bus n'a pas pu écrire : jamais un succès muet.
  function refusEcriture(quoi) {
    var m = (ECHEC && ECHEC.motif) || 'écriture refusée';
    return { ok: false, motif: 'stockage', message: quoi + ' n\'a PAS été enregistré (' + m + ') — libère de la place sur cet appareil et recommence ; rien n\'a été pris en compte.' };
  }

  window.PEC_BUS = {
    /* (09/09 — revue lot 3) LA FENÊTRE D'ENCAISSEMENT SE LIT EN UN SEUL ENDROIT : trois copies la relisaient (annonce,
       expiration, réaffectation) et deux d'entre elles ignoraient le paramètre VIF — une fenêtre reconfigurée n'était
       appliquée qu'à la naissance de la commande. */
    _fenetreMin: function () {
      var fen = 120;
      try {
        var D = window.PEC_DATA;
        if (D && D.param) { var v = D.param('scenario.fenetreEncaissementMinutes', D.scenario && D.scenario.fenetreEncaissementMinutes); if (typeof v === 'number' && v > 0) fen = v; }
        else if (D && D.scenario && D.scenario.fenetreEncaissementMinutes > 0) fen = D.scenario.fenetreEncaissementMinutes;
      } catch (e) {}
      return fen;
    },
    /* (18/09, soir) L'APPEL DE SÉCURISATION DE LA PREMIÈRE COMMANDE À DOMICILE est parti avec l'agent de caisse
       mobile : il protégeait un salarié qui allait sonner chez un client inconnu. Plus de déplacement, plus d'appel. */
    /* ── CANAL SAV (fondatrice 27/08) : la modale « problème de réservation »
          OUVRE une demande ici — l'app hotline la voit EN DIRECT. La réf du
          ticket (PEC-, CMD-) reste la clé commune ; l'assignation suit le
          PLANNING (hôte en poste), jamais « au premier qui la voit ». ── */
    /* id UNIQUE par compteur — plusieurs utilisateurs / plusieurs demandes en même
       temps ne se marchent jamais dessus (Date.now() collisionnait). */
    seq: function () {
      var n = parseInt(localStorage.getItem(P + 'seq') || '1000', 10) + 1;
      try { localStorage.setItem(P + 'seq', String(n)); } catch (e) {}
      return n;
    },
    /* ── CANAL KYC (spec-kyc-verifications, 28/08) : le client SOUMET, le
          prestataire PVID INSTRUIT (avis consultatif), la HOTLINE DÉCIDE d'un
          CLIC — aucune bascule automatique (miroir de la règle paiement).
          États : transmise_pvid → a_controler → validee | refusee | a_refaire. ── */
    ouvrirVerification: function (d) {
      d = this._poseClient(Object.assign({}, d || {}), d);   // (09/09 — lot 1 socle) la vérification porte le COMPTE
      var id = 'KYC-' + this.seq();
      var v = Object.assign({ id: id, at: Date.now(), statut: 'transmise_pvid', evenements: [{ acteur: 'client', evenement: 'soumission (pièce + selfie → prestataire)', at: Date.now() }] }, d || {});
      /* ══ (11/09 — constat C28 du 09/09) L'AVIS DU PRESTATAIRE NE REGARDAIT AUCUNE PIÈCE ═══════════════════
         Il rendait « conforme · score 0,97 » à TOUS LES COUPS, sans jamais ouvrir le dossier — une vérification
         ouverte sur un coffre vide s'annonçait donc conforme, et c'est ce que le conseiller lisait avant de
         trancher. Deux vérités pour un même dossier : l'avis mock d'un côté, les pièces de l'autre.
         L'adaptateur (toujours un mock, il le dit) rend maintenant ce que le COFFRE permet de dire : conforme
         quand les pièces obligatoires sont là et validées, « incomplet » sinon, avec ce qui manque. */
      var _et = null;
      try { if (window.PEC_DOCS && PEC_DOCS.etat && v.clientId) _et = PEC_DOCS.etat('client', v.clientId); } catch (eK) {}
      var _manque = _et ? (_et.manquantes || []) : null;
      /* CE QU'ON EXIGE DU DÉPOSANT, ET RIEN DE PLUS : aucune pièce obligatoire manquante, aucune refusée. Ni
         `etat === 'valide'` (qui réclame en plus l'envoi au contrôle — une vérification arrivée ici l'a été),
         ni `complet()` (qui attend AUSSI la contresignature PayEnCash des CGU : la balle est chez nous, pas
         chez le client — l'exiger bloquerait toute validation). Sans coffre lisible (parcours hors compte),
         l'avis reste consultatif. */
      var _ok = _et ? (!(_et.manquantes || []).length && !(_et.refusees || []).length) : true;
      v.pvid = _et
        ? { ref: 'PVID-' + id.slice(4), resultat: _ok ? 'conforme' : 'incomplet', score: _ok ? 0.97 : null, mock: true,
            manquantes: _manque.map(function (p) { return p.label || p.id; }) }
        : { ref: 'PVID-' + id.slice(4), resultat: 'non instruit', score: null, mock: true, motif: 'aucun dossier rattaché à un compte' };
      v.statut = _ok ? 'a_controler' : 'a_completer';
      v.evenements.push({ acteur: 'pvid', at: Date.now(), evenement: _ok
        ? 'résultat prestataire : conforme · score 0,97 (adaptateur mock, pièces du coffre lues)'
        : 'résultat prestataire : dossier incomplet — ' + ((v.pvid.manquantes || []).join(', ') || (v.pvid.motif || 'pièces non lisibles')) + ' (adaptateur mock)' });
      // (11/09) une vérification qui ne s'écrit pas, c'est un client qui attend un contrôle que personne n'a reçu
      if (!ecrire('kyc_' + id, v)) return refusEcriture('Ta demande de vérification');
      return v;
    },
    verifications: function () {
      var l = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(P + 'kyc_') === 0) { var v = lire(k.slice(P.length)); if (v) l.push(v); }
      }
      return l.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    },
    deciderVerification: function (id, decision, motif, par) {
      // decision : 'validee' | 'refusee' | 'a_refaire' — motif OBLIGATOIRE hors validation
      var v = lire('kyc_' + id); if (!v) return null;
      if (decision !== 'validee' && !(motif || '').trim()) return null;
      /* (11/09 — C28) ON NE VALIDE PAS UNE IDENTITÉ SANS REGARDER LES PIÈCES. La décision s'écrivait sans
         jamais consulter le coffre : une vérification pouvait passer « validée » alors que la pièce d'identité
         manquait, attendait encore un contrôle, ou venait d'être REFUSÉE par le manager. Le coffre fait foi. */
      if (decision === 'validee' && v.clientId) {
        var complet = true, det = '';
        try {
          if (window.PEC_DOCS && PEC_DOCS.etat) {
            var e = PEC_DOCS.etat('client', v.clientId);
            complet = !(e.manquantes || []).length && !(e.refusees || []).length;
            det = [].concat((e.manquantes || []).map(function (p) { return p.label || p.id; }),
                            (e.refusees || []).map(function (p) { return (p.label || p.id) + ' (refusée)'; })).join(', ') || 'dossier non lisible';
          }
        } catch (eD) {}
        if (!complet) return { ok: false, motif: 'Dossier incomplet au coffre : ' + det + ' — on ne valide pas une identité sur un avis de prestataire.', verification: v };
      }
      v.statut = decision;
      v.motif = (motif || '').trim() || null;
      v.decidePar = par || 'hotline';
      v.decideAt = Date.now();
      v.evenements.push({ acteur: 'hote', evenement: 'décision : ' + decision + (motif ? ' — ' + motif : '') + ' (par ' + (par || 'hotline') + ')', at: Date.now() });
      // (11/09) la décision D'ABORD, la trace ensuite — un verdict journalisé que le client ne verra jamais n'est pas un verdict
      if (!ecrire('kyc_' + id, v)) return refusEcriture('La décision sur la vérification ' + id);
      this.noter('kyc', id, { decision: decision, par: par });
      return v;
    },

    ouvrirDemande: function (d) {
      d = this._poseClient(Object.assign({}, d || {}), d);   // (09/09 — lot 1 socle) la demande porte le COMPTE
      var n = this.seq();
      var id = (d.type === 'reclamation' ? 'REC-' : d.type === 'conversation' ? 'CNV-' : 'INF-') + n;
      var hote = (window.PEC_DATA && PEC_DATA.hoteEnPoste) ? PEC_DATA.hoteEnPoste() : null;
      // (08/09 — audit hotline) l'ÉCHÉANCE est une DATE (dueAt = ouverture + ref.hotline.rappelDelaiMin), plus une chaîne « rappel sous
      // 15 min » écrite ici ; le libellé `due` reste dérivé pour les écrans. Un retard se DÉRIVE à la lecture (demandesSav → enRetard).
      var delaiMin = ((window.PEC_DATA && PEC_DATA.ref && PEC_DATA.ref.hotline) || {}).rappelDelaiMin || 15;
      var clos = d.statut && d.statut.indexOf('clot') === 0, at = Date.now();
      var dem = Object.assign({ id: id, at: at, canal: 'app', statut: 'en_cours',
        assigne: hote ? hote.nom : null, assigneSource: hote ? 'planning' : null,
        dueAt: clos ? null : at + delaiMin * 60000, due: clos ? '—' : 'rappel sous ' + delaiMin + ' min' }, d, { id: id });
      /* ══ (11/09 — constat C1 du 09/09) LE MESSAGE DU CLIENT EST LE PREMIER ÉCHANGE ═══════════════════════
         Le formulaire de contact et la réclamation Mode passaient le message dans `texte` — et RIEN ne le
         convertissait en `echanges`. La hotline, qui ne lit que ce fil, affichait « Aucun échange consigné »
         sur un dossier ouvert justement parce que quelqu'un avait écrit : le conseiller devait répondre à une
         question qu'il ne voyait pas. Un seul point de passage, tous les émetteurs rattrapés. */
      if (dem.texte && !(dem.echanges && dem.echanges.length)) {
        dem.echanges = [{ qui: 'moi', texte: String(dem.texte).trim(), at: at, par: dem.client || 'client' }];
        dem.derniereReponseClientAt = at;
      }
      /* (11/09) UNE DEMANDE NON ÉCRITE N'EST PAS UNE DEMANDE. L'écriture était avalée et le journal recevait
         « sav » quand même : l'écran annonçait un numéro de dossier à quelqu'un qui attendait un rappel que
         personne ne verrait jamais arriver. */
      if (!ecrire('sav_' + id, dem)) return null;
      this.noter('sav', d.ref || '—', { par: d.source === 'satisfaction' ? 'systeme' : 'client', sujet: d.sujet, demande: id, statut: dem.statut, source: d.source || 'app' });
      return dem;
    },
    /* (08/09 — audit hotline) LE CONSEILLER RÉPOND : l'échange s'écrit sur la demande (qui:'hote', par = l'hôte), le client le lit dans
       son Assistance et dans son fil de notifications. Avant, « Chat en direct » était en lecture seule. */
    repondreDemande: function (id, texte, par, qui) {
      var d = lire('sav_' + id); if (!d) return { ok: false, motif: 'Demande introuvable.' };
      texte = String(texte || '').trim(); if (!texte) return { ok: false, motif: 'Le message est vide.' };
      if ((d.statut || '').indexOf('clot') === 0) return { ok: false, motif: 'La demande est close : rouvre-la avant de répondre.' };
      qui = qui === 'moi' ? 'moi' : 'hote';   // 'moi' = le CLIENT répond dans son fil (support_messages.auteur = client), sinon l'hôte
      d.echanges = d.echanges || [];
      d.echanges.push({ qui: qui, texte: texte, at: Date.now(), par: qui === 'hote' ? (par || 'hotline') : (par || d.client || 'client') });
      if (qui === 'hote') d.derniereReponseAt = Date.now(); else d.derniereReponseClientAt = Date.now();
      // (11/09) un message « envoyé » qui n'est écrit nulle part, c'est un client qui attend une réponse à une question que personne n'a reçue
      if (!ecrire('sav_' + id, d)) return refusEcriture('Ton message');
      this.noter('sav_reponse', d.ref || '—', { par: qui === 'hote' ? (par || 'hotline') : 'client', demande: id, qui: qui });
      return { ok: true, demande: d };
    },
    /* (08/09) RÉASSIGNER : la superviseure (ou l'hôte qui « prend ») change l'assigné — tracé, source 'reprise' */
    assignerDemande: function (id, nom, par) {
      var d = lire('sav_' + id); if (!d || !nom) return null;
      d.assigne = nom; d.assigneSource = 'reprise'; d.assigneAt = Date.now(); ecrire('sav_' + id, d);
      this.noter('sav_assignation', d.ref || '—', { par: par || 'hotline', demande: id, assigne: nom });
      return d;
    },
    /* (24/09, soir) ANNOTER UNE DEMANDE : un fait daté s'ajoute au dossier (le refus d'un bon noté chez la marque) — jamais son fil ni son id */
    annoterDemande: function (id, patch, evt, data) {
      var d = lire('sav_' + id); if (!d) return null;
      Object.keys(patch || {}).forEach(function (k) { if (k !== 'id' && k !== 'echanges') d[k] = patch[k]; });
      if (!ecrire('sav_' + id, d)) return null;
      if (evt) this.noter(evt, d.ref || '—', Object.assign({ demande: id }, data || {}));
      return d;
    },
    assignerAppel: function (id, nom, par) {
      var a = lire('apl_' + id); if (!a || !nom) return null;
      a.assigne = nom; a.assigneSource = 'reprise'; a.assigneAt = Date.now(); ecrire('apl_' + id, a);
      this.noter('appel_assignation', a.ref || '—', { par: par || 'hotline', appel: id, assigne: nom });
      return a;
    },
    /* ── CANAL APPELS (audit 27/08 ; 23/09, nuit — grossiste) : le RAPPEL demandé remonte ici, la hotline le voit en
          direct ; l'appel ENTRANT (0 805) y est journalisé par l'hôte qui l'a pris. Assignation : l'hôte EN POSTE. ── */
    demanderAppel: function (a) {
      a = this._poseClient(Object.assign({}, a || {}), a);   // (09/09 — lot 1 socle) l'appel porte le COMPTE
      var id = 'APL-' + this.seq(), at = Date.now();
      var hote = (window.PEC_DATA && PEC_DATA.hoteEnPoste) ? PEC_DATA.hoteEnPoste() : null;
      // (08/09 — audit hotline) l'ÉCHÉANCE se calcule du référentiel (ref.hotline) selon le type ; le libellé `quand` en dérive.
      // Un appel ENTRANT (0 805) journalisé par l'hôte naît déjà « fait », signé par lui.
      var R = ((window.PEC_DATA && PEC_DATA.ref && PEC_DATA.ref.hotline) || {});
      var dueAt = a.type === 'rappel' ? at + (R.rappelDelaiMin || 15) * 60000 : null;
      var quand = a.type === 'rappel' ? 'sous ' + (R.rappelDelaiMin || 15) + ' min' : a.type === 'entrant' ? 'reçu' : 'dès que possible';   // (18/09, soir) le repli disait « avant le départ de l'agent » : plus personne ne part
      var entrant = a.type === 'entrant';
      var apl = Object.assign({ id: id, at: at, statut: entrant ? 'fait' : 'a_faire',   // (07/09) le mot de SQL (hotline_calls.status)
        assigne: entrant ? (a.hote || null) : (hote ? hote.nom : null), assigneSource: entrant ? 'reprise' : (hote ? 'planning' : null),
        priorite: a.type === 'rappel' ? 'haute' : 'normale',
        dueAt: dueAt, quand: quand }, a, { id: id });
      if (entrant) { apl.faitAt = at; apl.faitPar = a.hote || 'hotline'; }
      ecrire('apl_' + id, apl);
      this.noter('appel', a.ref || '—', { par: entrant ? (a.hote || 'hotline') : (a.par || 'client'), type: a.type, canal: a.canal, appel: id, statut: apl.statut });
      return apl;
    },
    appels: function () {
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(P + 'apl_') === 0) { var v = lire(k.slice(P.length)); if (v) out.push(v); }
      }
      return out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    },
    traiterAppel: function (id, extra) {
      extra = extra || {};   // (03/09) qui a passé l'appel : hôte de la session hotline, sinon 'hotline'
      var a = lire('apl_' + id); if (!a) return null;
      // (08/09 — audit hotline) l'issue est un mot de SQL (hotline_calls.status) : fait · sans_reponse · rappeler ; le compte rendu
      // (notes) est conservé et le client le lit ; « sans réponse » reste en file pour être retenté
      var issue = extra.statut === 'sans_reponse' || extra.statut === 'rappeler' ? extra.statut : 'fait';
      a.statut = issue; a.faitAt = Date.now(); a.faitPar = extra.par || 'hotline';
      if (extra.compteRendu) a.compteRendu = String(extra.compteRendu).trim();
      a.tentatives = (a.tentatives || 0) + 1;
      ecrire('apl_' + id, a);
      this.noter('appel', a.ref || '—', { par: a.faitPar, appel: id, statut: issue, tentatives: a.tentatives });
      return a;
    },

    demandesSav: function () {
      var out = [], now = Date.now();
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(P + 'sav_') === 0) { var v = lire(k.slice(P.length)); if (v) out.push(v); }
      }
      // (08/09) EN RETARD se dérive : en cours, échéance passée, aucune réponse de l'hôte depuis — jamais un statut écrit
      out.forEach(function (d) { d.enRetard = d.statut === 'en_cours' && !!d.dueAt && d.dueAt < now && !(d.derniereReponseAt && d.derniereReponseAt >= d.dueAt - 0); });
      return out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    },
    cloreDemande: function (id, statut, extra) {
      extra = extra || {};   // (03/09) l'acteur de la clôture (hotline, manager) est porté par l'appelant
      var d = lire('sav_' + id); if (!d) return;
      // (08/09 — audit hotline) l'hôte CLÔT ('cloturee') ; « satisfait / insatisfait » vient de la NOTE du client (satisfactionAjouter)
      d.statut = statut || 'cloturee'; d.cloAt = Date.now(); if (extra.par) d.cloPar = extra.par; if (extra.note) d.note = extra.note;
      // (09/09 — lot 1 socle) LA DÉCISION est portée par la demande : 27-assistance la reconstruisait depuis le journal (tronqué)
      d.decision = { statut: d.statut, par: extra.par || 'hotline', at: d.cloAt, commande: extra.commande || d.ref || null, mode: extra.mode || null, motif: extra.motif || '' };
      ecrire('sav_' + id, d);
      this.noter('sav', d.ref || '—', { par: extra.par || 'hotline', demande: id, statut: d.statut, motif: extra.motif || '' });
    },

    commandes: function () {
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(P + 'cmd_') === 0) { var v = lire(k.slice(P.length)); if (v) out.push(v); }
      }
      /* Une commande « à payer » que personne n'a réglée dans la fenêtre du code (scenario.fenetreEncaissementMinutes,
         la même que le prix bloqué côté client) EXPIRE : 'annule' par le système, motif tracé. Dérivé à la lecture,
         donc valable pour les commandes créées avant cette règle. */
      var fen = this._fenetreMin();
      var limite = Date.now() - fen * 60000, self3 = this;
      /* (11/09, revue) ON N'ÉCRIT PAS DEPUIS LA LECTURE, EN PLEINE BOUCLE. `ecrire` réveille les écrans
         SYNCHRONEMENT (événement `pec-bus`) : expirer la première commande relançait le rendu, qui rappelait
         `commandes()`, qui expirait la deuxième, et ainsi de suite — une réentrance en escalier, des
         notifications en double et un rendu qui travaillait sur une liste déjà périmée. On REPÈRE d'abord,
         on applique ENSUITE, une seule fois, et on relit chaque commande juste avant de l'écrire (un autre
         onglet a pu la payer entre-temps). */
      var aExpirer = [];
      out.forEach(function (c) {
        // (11/09 — C15) toute commande a son échéance : `expireTs` d'abord, l'âge en repli pour celles d'avant cette règle
        var _exp = c.expireTs ? (c.expireTs < Date.now()) : ((c.fenetreAt || c.at) && (c.fenetreAt || c.at) < limite);
        if (c.statut === 'a_payer' && _exp) aExpirer.push(c);   // (09/09) fenetreAt = rouverte par une réaffectation
      });
      aExpirer.forEach(function (c) {
        var frais = lire('cmd_' + c.ref);
        if (!frais || frais.statut !== 'a_payer') return;   // payée ou annulée entre-temps : on ne la ferme pas
        c.statut = 'annule'; c.annuleAt = Date.now(); c.annulePar = 'systeme';
        c.motifAnnulation = 'expirée — le code de paiement a dépassé sa fenêtre (' + fen + ' min), le client peut la relancer';
        // (09/09 — lot 3) l'EXPIRATION est explicite (plus une regex sur le motif — miroir orders.expired_at).
        c.expire = true; c.expireAt = c.annuleAt;
        /* (11/09 — constat C5) LES PIÈCES RETENUES REVIENNENT À LA VENTE. Le relâchement ne vivait que dans
           `libererCommande`, qui ne connaît que la commande en cours de CE navigateur : un client qui fermait
           son onglet retirait la pièce du catalogue pour toujours. L'expiration se dérivant à la lecture, la
           libération suit — depuis n'importe quel écran, et la file d'attente est notifiée. */
        try { if (window.PEC_DATA && PEC_DATA.libererReservationsDe) PEC_DATA.libererReservationsDe(c.ref, 'commande expirée'); } catch (eR3) {}
        ecrire('cmd_' + c.ref, c);
        try { window.PEC_BUS.noter('commande_expiree', c.ref, { par: 'systeme', fenetreMin: fen }); } catch (e2) {}
      });
      return out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    },
    commande: function (ref) { return lire('cmd_' + ref); },
    // LE JOURNAL — la trace de ce qui fait basculer le client
    noter: function (evt, ref, data) {
      // JOURNAL DES FLUX (fondatrice 27/08) : chaque événement inter-apps est
      // consigné — qui a fait quoi, quand. Consultable : manager/27-journal-flux.
      /* (09/09 — lot 1 socle) LE JOURNAL EST UNE TRACE, PLUS UNE BASE DE DONNÉES. Il était plafonné à 200 entrées ET relu comme
         source d'ÉTAT (virements de commission, étape d'un prospect, jeton de signature, participations au concours,
         envois, notations, vérification du flashcode…) : passé 200 événements, ces états
         DISPARAISSAIENT — une commission pouvait être virée deux fois. Chaque état a désormais son magasin
         (etatGet/etatSet ici, ou l'entité elle-même) ; le journal ne sert plus qu'à l'audit, avec un plafond ASSUMÉ et dit
         à l'écran (manager/11), jamais silencieux. */
      try {
        var j = JSON.parse(localStorage.getItem(P + 'journal') || '[]');
        j.unshift(Object.assign({ evt: evt, ref: ref, at: Date.now() }, data || {}));
        var cap = this.JOURNAL_MAX;
        if (j.length > cap) { j = j.slice(0, cap); }
        localStorage.setItem(P + 'journal', JSON.stringify(j));
      } catch (e) {}
      // le CATALOGUE des messages transactionnels est alimenté ici, à la source (un seul point de branchement)
      try { if (window.PEC_DATA && PEC_DATA.envoiPlanifier) PEC_DATA.envoiPlanifier(evt, ref, data || {}); } catch (e2) {}
    },
    JOURNAL_MAX: 1000,   // (09/09) plafond de la TRACE — aucun état n'en dépend
    /* ── ÉTATS PERSISTÉS DU BUS (09/09 — lot 1 socle) : les faits que le journal portait à tort. Rangés dans l'espace du bus
          (pec_bus_etat_…) : ils suivent le même cycle de vie que les commandes et sont remis à zéro par PEC_BUS.reset(). ── */
    /* ── L'IDENTITÉ DE COMPTE (09/09 — lot 1 socle) ─────────────────────────────────────────────────────────
       Le bus ne posait JAMAIS d'identité : une commande, une demande, un appel, une vérification ne portaient qu'un NOM
       en clair. Tout se joignait donc par le nom — deux homonymes partageaient leurs réservations, leurs tickets et leur
       vérification d'identité ; le RIB du remboursement par virement (clientRibPour(c.clientId)) n'était jamais retrouvé.
       Le bus pose désormais l'id LUI-MÊME, et seulement depuis une APP CLIENT (Mode, Fly, écrans, parcours) : une app
       partenaire, fournisseur ou manager n'attribue jamais un compte qu'elle ne détient pas. Un appelant qui sait mieux passe
       `clientId` explicitement ; `clientId: null` reste un effacement volontaire (règle du 04/09). */
    _espaceCourant: function () { try { var m = String(location.pathname || '').match(/\/ui\/([a-z]+)\//); return m ? m[1] : null; } catch (e) { return null; } },
    _estAppClient: function () { return ['mode', 'fly', 'ecrans', 'parcours'].indexOf(this._espaceCourant()) > -1; },
    _clientCourant: function () { try { return (window.PEC_DATA && PEC_DATA.clientActifGet) ? (PEC_DATA.clientActifGet() || null) : null; } catch (e) { return null; } },
    _poseClient: function (obj, data) {
      if (data && data.clientId !== undefined) return obj;              // l'appelant a tranché (id ou null volontaire)
      if (obj.clientId) return obj;                                     // déjà porté (fusion additive)
      if (!this._estAppClient()) return obj;                            // geste d'un autre espace : on n'invente pas un compte
      var id = this._clientCourant(); if (id) obj.clientId = id;
      return obj;
    },
    etatGet: function (cle, defaut) { var v = lire('etat_' + cle); return v == null ? (defaut === undefined ? null : defaut) : v; },
    // (11/09) un état qui n'a pas pu être écrit le DIT à son appelant : la liste qu'il repeint n'existerait pas au rechargement
    etatSet: function (cle, valeur) { return ecrire('etat_' + cle, valeur) ? valeur : null; },
    journal: function () {
      try { return JSON.parse(localStorage.getItem(P + 'journal') || '[]'); } catch (e) { return []; }
    },
    viderJournal: function () { try { localStorage.removeItem(P + 'journal'); } catch (e) {} },
    /* (18/09, soir) LES JALONS D'UNE COURSE (arrivée déclarée, encaissement commencé) sont partis avec l'agent de
       caisse mobile : entre son arrivée et le paiement, le client ne voyait rien pendant que l'agent comptait les
       espèces. Plus de déplacement, donc plus d'étape à montrer entre les deux. */
    paiement: function (ref) { return lire('pay_' + ref); },
    /* ANNULATION (manager, 03/09) : une commande non payée passe en 'annule' avec motif et acteur — jamais une commande payée. */
    annuler: function (ref, data) {
      data = data || {};
      var c = lire('cmd_' + ref) || { ref: ref };
      if (c.statut === 'paye' || c.statut === 'rembourse') return c;   // une commande encaissée (même remboursée) ne s'annule jamais
      c.statut = 'annule'; c.annuleAt = Date.now(); c.motifAnnulation = data.motif || ''; c.annulePar = data.par || 'manager';
      ecrire('cmd_' + ref, c);
      this.noter('annulation', ref, { par: c.annulePar, motif: c.motifAnnulation });
      try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {}
      return c;
    },
    /* (18/09, soir) Sont parties avec l'agent de caisse mobile : la lecture des annulations APRÈS acceptation (elle
       servait à fermer le domicile à un compte qui en abusait), la RÉAFFECTATION d'une course à un autre agent, et
       la purge RGPD de la position live, du fil de messages et du code de sécurité d'une course close. */
    /* (07/09 — UN vocabulaire ; 18/09, soir) le bus porte les cycles de vie de la commande, du remboursement par
       virement, du paiement en ligne, de l'appel, de la demande et de la vérification PVID. La TOURNÉE, la REMISE et
       le DÉPÔT d'espèces sont partis avec l'agent de caisse mobile. Chacun est le MIROIR d'une colonne SQL : table, colonne, correspondances.
       Tout statut que le bus ÉCRIT figure ici, et chaque cible existe dans le CHECK/ENUM de sa colonne —
       ZT·419 le vérifie contre le source du bus ET contre schema.sql. */
    STATUT_SQL: {
      /* (18/09, soir) L'ÉCHEC D'ENCAISSEMENT N'EXISTE PLUS. `COLLECTION_FAILED` disait « l'agent s'est déplacé et
         n'a pas pu encaisser » : plus personne ne se déplace, et l'enum du serveur ne porte plus cette valeur. Une
         commande qui n'est pas réglée EXPIRE (orders.expired_at) ou est ANNULÉE — il n'y a pas de troisième sort.
         Partis avec l'agent : la tournée de collecte, la remise au manager, le dépôt d'espèces, et l'automate. */
      commande:     { table: 'orders',                colonne: 'status', vers: { a_payer: 'AWAITING_CASH', paye: 'PAID', livree: 'FULFILLED', annule: 'CANCELLED', rembourse: 'REFUNDED' } },
      // (18/09, soir) le cycle du RENDU DE MONNAIE PAR VIREMENT (`change_transfers`) est parti avec l'agent : il n'y a plus de monnaie à rendre.
      remboursementVirement: { table: 'refund_transfers', colonne: 'status', vers: { a_virer: 'a_virer', vire: 'vire' } },   // (09/09 — lot 2) remboursement par virement
      appel:        { table: 'hotline_calls',         colonne: 'status', vers: { a_faire: 'a_faire', fait: 'fait', sans_reponse: 'sans_reponse', rappeler: 'rappeler' } },
      demande:      { table: 'support_conversations', colonne: 'statut', vers: { en_cours: 'en_cours', cloturee: 'resolue', clot_satisfait: 'resolue', clot_insatisfait: 'resolue', clot_rembourse: 'resolue', clot_repondu: 'resolue', niveau_manager: 'transferee', mediateur: 'transferee' } },   // l'issue va dans support_conversations.issue
      verification: { table: 'kyc_checks',            colonne: 'status', vers: { transmise_pvid: 'transmise_pvid', a_controler: 'a_controler', validee: 'validee', refusee: 'refusee', a_refaire: 'a_refaire' } },
      /* ── (11/09 — lot 9) LES CYCLES DE VIE QUE LE DATA-LAYER TIENT ────────────────────────────────────────────
         Le dictionnaire ne couvrait que ce que LE BUS écrit : ni le point partenaire, ni sa borne, ni le compte,
         ni le fournisseur, ni la facture, ni la campagne, ni la créa, ni l'influenceur n'y figuraient — huit
         cycles de vie tenus par PEC_DATA, dont personne ne vérifiait qu'ils tiennent en base. Chacun est ici, et
         le banc contrôle que chaque valeur existe dans le CHECK ou l'ENUM réel de sa colonne (ZT·419).
         Une entrée `source: 'data'` dit qui l'écrit : le bus n'a pas à connaître ces gestes, il les DÉCLARE. ── */
      compte:       { table: 'accounts',   colonne: 'statut', source: 'data', vers: { a_verifier: 'a_verifier', a_valider: 'a_valider', invite: 'invite', actif: 'actif', suspendu: 'suspendu', refuse: 'refuse', clos: 'clos', supprime: 'supprime' } },
      fournisseur:  { table: 'suppliers',  colonne: 'status', source: 'data', vers: { candidature: 'candidate', kyb_en_cours: 'kyb_pending', actif: 'active', surveille: 'watch', suspendu: 'suspended' } },
      campagne:     { table: 'ad_campaigns', colonne: 'status', source: 'data', vers: { draft: 'draft', active: 'active', paused: 'paused', ended: 'ended' } },
      crea:         { table: 'ged_assets', colonne: 'status', source: 'data', vers: { brouillon: 'brouillon', valide: 'valide', imprime: 'imprime', en_ligne: 'en_ligne', en_distribution: 'en_distribution' } },
      influenceur:  { table: 'influencer_links', colonne: 'status', source: 'data', vers: { brief: 'brief', actif: 'actif', termine: 'termine' } },
      expedition:   { table: 'shipments',  colonne: 'status', source: 'data', vers: { a_expedier: 'to_ship', etiquette_prete: 'label_created', expedie: 'picked_up', en_acheminement: 'in_transit', dispo_relais: 'at_relay', livre: 'delivered', bloque_controle: 'blocked_control', controle_refuse: 'control_refused' } },
      facture:      { table: 'supplier_invoices', colonne: 'status', source: 'data', vers: { a_facturer: 'a_facturer', emise: 'emise', viree: 'viree', annulee: 'annulee' } },
      reclamation:  { table: 'mode_claims', colonne: 'status', source: 'data', vers: { ouverte: 'ouverte', remboursee: 'remboursee', retour_attendu: 'retour_attendu', retour_recu: 'retour_recu', constatee: 'constatee', contestee: 'contestee', close: 'close' } },
      debitFournisseur: { table: 'supplier_debits', colonne: 'status', source: 'data', vers: { gele: 'gele', definitif: 'definitif', conteste: 'conteste', annule: 'annule', impute: 'impute' } },
      /* (18/09) LE BON D’ACHAT PAYENCASH ET SON RÉSEAU : le point (partners), le bon d’achat (gift_cards — seuls bloqué/annulé s'écrivent, épuisé et
         expiré se dérivent) et le prélèvement à la vente (`partner_charges`). Chaque valeur existe dans le CHECK réel de sa colonne. */
      partenaire:   { table: 'partners',  colonne: 'status', source: 'data', vers: { contrat_a_signer: 'contrat_a_signer', contrat_signe: 'contrat_signe', actif: 'actif', suspendu: 'suspendu', clos: 'clos' } },
      bon:          { table: 'gift_cards', colonne: 'status', source: 'data', vers: { actif: 'active', bloque: 'blocked', annule: 'cancelled' } },
      /* (18/09, soir — décision fondatrice « le partenaire paie par carte à chaque vente ») Le REVERSEMENT mensuel
         (une créance, une échéance, une relance, et sa table) est abandonné : ce qui vit désormais est le
         PRÉLÈVEMENT, accepté, refusé ou remboursé — et un refus n'émet aucun bon d’achat. */
      prelevement:  { table: 'partner_charges', colonne: 'status', source: 'data', vers: { accepte: 'accepted', refuse: 'refused', rembourse: 'refunded' } },
      /* (19/09, nuit — « supprime le flashcode, il achète un bon ») LA DEMANDE DE BON D'ACHAT est partie avec
         le flashcode : au comptoir le client n'a rien à montrer, donc rien à suivre. La table SQL voucher_requests
         est partie avec — elle n'est plus le miroir de rien. */
      /* ══ (19/09, nuit) PAYENCASH SOLUTION — les sept cycles de vie de la seconde ligne ═══════════════
         Ils sont tenus par le DATA-LAYER, pas par le bus : c'est lui qui les écrit, et le garde-fou ZT·419
         vérifie que chacun tient en base. Sans eux, un statut comme « revoked » ou « paid » vivrait dans le
         code sans colonne en face — exactement le trou qu'on s'interdit. */
      techActeur:     { table: 'tech_merchants', colonne: 'status', source: 'data', vers: { pending: 'pending', validated: 'validated', suspended: 'suspended' } },
      techConformite: { table: 'tech_compliance_declarations', colonne: 'status', source: 'data', vers: { validated: 'validated', to_correct: 'to_correct' } },
      techFacture:    { table: 'tech_invoices', colonne: 'status', source: 'data', vers: { draft: 'draft', sent: 'sent', paid: 'paid', overdue: 'overdue' } },
      techBon:        { table: 'tech_vouchers', colonne: 'state', source: 'data', vers: { issued: 'issued', allocated: 'allocated', sold: 'sold', redeemed: 'redeemed', cancelled: 'cancelled' } },
      /* (20/09) LA DEMANDE DE PAIEMENT : deux de ses états sont DÉRIVÉS — « entamée » se lit dans ses
         règlements, « expirée » dans le calendrier. La table garde l'état POSÉ (open/paid/cancelled) ;
         le miroir doit connaître les cinq, sinon il accuse deux états d'être sans colonne. */
      techLien:       { table: 'tech_bon_offers', colonne: 'state', source: 'data', vers: { open: 'open', partial: 'open', used: 'used', cancelled: 'cancelled', expired: 'open' } },   // (23/09, soir) le bon proposé : couvert = used
      /* ══ (23/09 — grossiste) LES CINQ CYCLES DE L'ARGENT DE SOLUTION ══════════════════════════════════════
         La vente porte DEUX états qui ne se confondent pas : ce que le point nous doit (`techVente`) et ce que
         nous devons à la marque (`techVenteMarque`). Viennent ensuite la remise déposée à la banque, ses lignes,
         la pénalité d'impayé et l'abonnement au logiciel. Chacun tient dans une colonne réelle — ZT·419 le
         vérifie, et c'est ce garde-fou qui interdit un statut vivant dans le code sans table en face. */
      techVente:      { table: 'tech_sales', colonne: 'statut', source: 'data', vers: { a_prelever: 'a_prelever', en_prelevement: 'en_prelevement', regle: 'regle', impaye: 'impaye', annulee: 'annulee' } },
      techVenteMarque:{ table: 'tech_sales', colonne: 'brand_status', source: 'data', vers: { a_payer: 'a_payer', paye: 'paye', annule: 'annule' } },
      techRemise:     { table: 'tech_dd_files', colonne: 'statut', source: 'data', vers: { prepare: 'prepare', depose: 'depose', partiel: 'partiel', traite: 'traite', annulee: 'annulee' } },
      techPrelevement:{ table: 'tech_direct_debits', colonne: 'statut', source: 'data', vers: { prepare: 'prepare', depose: 'depose', paye: 'paye', impaye: 'impaye', ecartee: 'ecartee' } },
      techPenalite:   { table: 'tech_penalties', colonne: 'statut', source: 'data', vers: { a_prelever: 'a_prelever', en_prelevement: 'en_prelevement', regle: 'regle', impaye: 'impaye' } },
      techAbonnement: { table: 'tech_subscriptions', colonne: 'statut', source: 'data', vers: { du: 'du', en_prelevement: 'en_prelevement', regle: 'regle', impaye: 'impaye' } },
      techSepaMandat: { table: 'tech_sepa_mandates', colonne: 'statut', source: 'data', vers: { actif: 'actif', revoque: 'revoque' } }
    },   // alias côté client (11-suivi-etats-echec)
    /* (18/09, soir) LE CIRCUIT DES ESPÈCES EST PARTI AVEC L'AGENT : l'échec d'encaissement à domicile, le rapport
       de l'automate Cash Services, le rapprochement d'un dépôt et l'arbitrage d'un écart n'ont plus d'objet — plus
       aucun billet ne transite par PayEnCash. L'argent du client va au commerçant, et le commerçant nous règle par
       carte à la vente (prelevementPartenaire). */
    reset: function () {
      var del = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(P) === 0) del.push(k); }
      del.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    }
  };
})();
