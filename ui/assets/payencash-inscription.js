/* ══ PEC_INSCRIPTION — LES BRIQUES COMMUNES DES DEUX INSCRIPTIONS (24/09) ══════════════════════════════════════════════════
   Fondatrice, 24/09 : « reprends le processus d'inscription d'une marque… de vrais formulaires connectés, un design au top » ;
   « pareil pour devenir partenaire : revérifie, audite, améliore ».
   L'inscription d'une marque (ui/tech/00-inscription) et celle d'un partenaire du réseau (ui/partenaire/00-inscription)
   demandent les mêmes choses de la même façon : un compte par Google, Apple ou e-mail ; la société trouvée au registre ;
   la pièce d'identité d'une personne (son type, ses faces, sa validité) ; les autres pièces du dossier ; des documents lus
   jusqu'au bout avant d'être acceptés. Ces briques sont écrites ICI, une fois ; chaque page les pose dans ses étapes et garde
   ce qui lui est propre (la déclaration « réseau limité » de la marque, le mode d'exercice du partenaire).
   Aucune règle n'est ici : les contrôles sont au data-layer (PEC_DATA), les pièces au coffre (PEC_DOCS), le registre dans
   PEC_ENTREPRISE. Ce module ne fait que les montrer et relayer les gestes.

   API — `pre` est le préfixe des identifiants de la page (« ti » pour la marque, « pi » pour le partenaire) :
     PEC_INSCRIPTION.boutonsSso(el, pre)            → les deux boutons « Continuer avec Google / Apple »
     PEC_INSCRIPTION.sso({ pre, racine, portee, emailDefaut, onValider(fournisseur, email) → { ok, motif } })
                                                    → la feuille qui tient lieu de fenêtre du fournisseur (maquette)
     PEC_INSCRIPTION.registre({ champ, liste, onChoix(entreprise) })         → la recherche libre : nom, SIREN ou SIRET
     PEC_INSCRIPTION.registreNumero({ champ, onFiche(entreprise, n), onInfo(html, cls) }) → la fiche d'un numéro tapé
     PEC_INSCRIPTION.registreLigne(entreprise)      → { html, cls } : ce que dit le registre, sourcé
     PEC_INSCRIPTION.identite({ pre, conteneur, portee, id, piece })         → { peindre, deposer(): Promise, deja, complete, choisis }
     PEC_INSCRIPTION.pieces({ pre, conteneur, portee, id, garder, onChange }) → { peindre, manquantes }
     PEC_INSCRIPTION.lecteur({ pre, racine, espace, cle, par, onChange, retour }) → { ouvrir(doc), fermer, ouvert }
     PEC_INSCRIPTION.beneficiaires({ pre, conteneur, lire(), dirigeant(), forme() }) → { peindre, lire(), ei(), viser(refus) }
     PEC_INSCRIPTION.porte({ app, marque, nom, fil, docs, bascule, retour, cadre })   → le cadre commun des pages d'entrée (panneau + bascule)
   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function D() { return window.PEC_DATA; }
  function esc(v) { var d = D(); return d && d.esc ? d.esc(v) : String(v == null ? '' : v); }
  function el(id) { return document.getElementById(id); }
  function montrer(id, txt) { var z = el(id); if (!z) return; z.hidden = !txt; z.textContent = txt || ''; }

  var SVG_GOOGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 2.2 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z"/></svg>';
  var SVG_APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-4zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>';

  var I = {};

  /* ══ ① GOOGLE / APPLE ══════════════════════════════════════════════════════════════════════════════════════════════ */
  I.boutonsSso = function (conteneur, pre) {
    if (!conteneur) return;
    conteneur.innerHTML = '<button type="button" class="sso tap" data-sso="google" id="' + pre + '-google">' + SVG_GOOGLE + 'Continuer avec Google</button>'
      + '<button type="button" class="sso apple tap" data-sso="apple" id="' + pre + '-apple">' + SVG_APPLE + 'Continuer avec Apple</button>';
  };
  /* LA FEUILLE — en production, la fenêtre du fournisseur s'ouvre et renvoie l'adresse vérifiée (OpenID Connect) ; en
     maquette, la feuille demande l'adresse et le DIT. `onValider` fait le geste (compteSso) et rend { ok, motif }. */
  I.sso = function (o) {
    var pre = o.pre;
    if (!el(pre + '-sso')) {
      var v = document.createElement('div');
      v.className = 'voile'; v.id = pre + '-sso'; v.hidden = true;
      v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-labelledby', pre + '-sso-t');
      v.innerHTML = '<div class="feuille"><h3 id="' + pre + '-sso-t">—</h3><p class="demo" id="' + pre + '-sso-demo">—</p>'
        + '<div class="champ"><label for="' + pre + '-sso-mail">Adresse du compte</label><input class="pec-input" id="' + pre + '-sso-mail" type="email" autocomplete="email"></div>'
        + '<p class="err" id="' + pre + '-sso-err" role="alert" hidden></p>'
        + '<div class="actions"><button type="button" class="pec-btn-secondary tap" id="' + pre + '-sso-annuler">Annuler</button><button type="button" class="pec-cta tap" id="' + pre + '-sso-go">Continuer</button></div></div>';
      o.racine.appendChild(v);
    }
    var courant = null;
    function fermer() { el(pre + '-sso').hidden = true; }
    [].forEach.call((o.portee || document).querySelectorAll('[data-sso]'), function (b) {
      b.addEventListener('click', function () {
        courant = b.getAttribute('data-sso');
        var nom = D().SSO_FOURNISSEURS[courant];
        el(pre + '-sso-t').textContent = 'Continuer avec ' + nom;
        el(pre + '-sso-demo').textContent = 'Maquette : en production, la fenêtre de ' + nom + ' s’ouvre et nous renvoie ton adresse vérifiée. Ici, indique l’adresse de ton compte ' + nom + '.';
        montrer(pre + '-sso-err', ''); el(pre + '-sso').hidden = false;
        el(pre + '-sso-mail').value = o.emailDefaut ? (o.emailDefaut() || '') : '';
        el(pre + '-sso-mail').focus();
      });
    });
    el(pre + '-sso-annuler').addEventListener('click', fermer);
    el(pre + '-sso-go').addEventListener('click', function () {
      var r = o.onValider(courant, String(el(pre + '-sso-mail').value || '').trim().toLowerCase()) || {};
      if (r.ok === false) { montrer(pre + '-sso-err', r.motif || 'Refusé.'); return; }
      fermer();
    });
    el(pre + '-sso-mail').addEventListener('keydown', function (e) { if (e.key === 'Enter') el(pre + '-sso-go').click(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el(pre + '-sso') && !el(pre + '-sso').hidden) fermer(); });
    return { fermer: fermer };
  };

  /* ══ ② LE REGISTRE DES ENTREPRISES — il pré-remplit, il ne prouve pas : le Kbis, contrôlé, fera foi ═════════════════ */
  I.registreLigne = function (e) {
    var nomReg = e.raisonSociale || e.nomComplet || '';
    var etatTxt = e.actif ? 'en activité' : (e.etatAdministratif === 'C' ? 'cessée' : 'fermée');
    return { cls: e.actif ? 'ok' : 'warn',
      html: 'Registre : <b>' + esc(nomReg) + '</b>' + (e.forme ? ', ' + esc(e.forme) : '') + (e.adresse ? ' — siège ' + esc(e.adresse) : '') + ' — <b>' + etatTxt + '</b>.'
        + (!e.actif ? ' <b>Une société cessée ne peut pas s’inscrire</b> : vérifie le numéro.' : '')
        + '<span class="src">Source : ' + esc(e.source || 'registre des entreprises') + '. Le Kbis, contrôlé, fera foi.</span>' };
  };
  /* LA RECHERCHE LIBRE — nom, SIREN ou SIRET ; chaque résultat est une ligne qu'on touche */
  I.registre = function (o) {
    var trouvees = [], t = null, dernier = '';
    function chercher() {
      var Ent = window.PEC_ENTREPRISE, q = String(o.champ.value || '').trim(), z = o.liste;
      if (!Ent || !Ent.suggerer || q === dernier) return;
      dernier = q;
      if (q.replace(/[\s.]/g, '').length < 3) { z.hidden = true; z.innerHTML = ''; return; }
      z.hidden = false; z.innerHTML = '<p class="aide">Recherche au registre des entreprises…</p>';
      Ent.suggerer(q).then(function (r) {
        if (String(o.champ.value || '').trim() !== q) return;
        if (!r.ok) { trouvees = []; z.innerHTML = '<p class="aide">' + esc(r.motif) + '</p>'; return; }
        trouvees = r.liste;
        z.innerHTML = r.liste.map(function (e, i) {
          return '<button type="button" data-ent="' + i + '"><b>' + esc(e.raisonSociale || e.nomComplet) + '</b><small>'
            + esc([e.forme, e.ville, 'SIREN ' + e.siren].filter(Boolean).join(' · ')) + (e.actif ? '' : ' · <span class="cessee">cessée</span>') + '</small></button>';
        }).join('');
      });
    }
    o.champ.addEventListener('input', function () { clearTimeout(t); t = setTimeout(chercher, 350); });
    o.liste.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-ent]') : null; if (!b) return;
      var e = trouvees[+b.getAttribute('data-ent')]; if (!e) return;
      o.liste.hidden = true; o.liste.innerHTML = ''; o.champ.value = ''; dernier = '';
      o.onChoix(e);
    });
  };
  /* LE NUMÉRO TAPÉ — un SIREN ou un SIRET complet va chercher sa fiche ; `onInfo` écrit la ligne sourcée (ou l'échec) */
  I.registreNumero = function (o) {
    var t = null, dernier = '';
    function chercher() {
      var Ent = window.PEC_ENTREPRISE, n = String(o.champ.value || '').replace(/[\s.]/g, '');
      if (!Ent || !Ent.chercher) return;
      if (!/^\d{9}$|^\d{14}$/.test(n)) { dernier = ''; o.onInfo('', ''); return; }
      if (n === dernier) return;
      dernier = n; o.onInfo('Recherche au registre des entreprises…', '');
      Ent.chercher(n).then(function (r) {
        if (String(o.champ.value || '').replace(/[\s.]/g, '') !== n) return;
        if (!r || !r.ok) { o.onInfo(esc((r && r.motif) || 'Le registre ne répond pas : continue à la main.'), 'warn'); return; }
        o.onFiche(r.entreprise, n);
      }).catch(function () { o.onInfo('Le registre ne répond pas : continue à la main, la vérification se fera au contrôle.', 'warn'); });
    }
    o.champ.addEventListener('input', function () { clearTimeout(t); t = setTimeout(chercher, 400); });
    o.champ.addEventListener('blur', function () { clearTimeout(t); chercher(); });
    return { oublier: function (n) { dernier = n || ''; } };
  };

  /* ══ ③ LA PIÈCE D'IDENTITÉ D'UNE PERSONNE — le type d'abord (ref.kyc.piecesIdentite dit ses faces), puis chaque face et la
     date de fin de validité. Le recto (re)crée la pièce au coffre, le verso s'y ajoute (PEC_DOCS.deposer, meta.face). ═══════ */
  I.identite = function (o) {
    var pre = o.pre, piece = o.piece || 'cni', type = null, fichiers = {};
    var K = function () { return (D().ref && D().ref.kyc) || {}; };
    o.conteneur.innerHTML = '<div class="champ"><span class="lbl" id="' + pre + '-type-lbl">Quelle pièce ?</span>'
      + '<div class="choix types" id="' + pre + '-types" role="radiogroup" aria-labelledby="' + pre + '-type-lbl"></div></div>'
      + '<div id="' + pre + '-faces-z" hidden><div class="faces" id="' + pre + '-faces"></div>'
      + '<label class="case" for="' + pre + '-deux-faces" id="' + pre + '-deux-faces-z" hidden><input type="checkbox" id="' + pre + '-deux-faces"><span>Mon fichier contient déjà les deux faces (un PDF recto verso, par exemple).</span></label>'
      + '<div class="champ"><label for="' + pre + '-expire">Valable jusqu’au</label><input class="pec-input" id="' + pre + '-expire" type="date"></div>'
      + '<ul class="conseils"><li>La pièce entière, les quatre coins visibles.</li><li>Nette, sans reflet ni doigt sur l’image.</li><li>Une photo (JPG, PNG) ou un PDF de l’original — pas de capture d’écran.</li></ul></div>'
      + '<p class="aide ok" id="' + pre + '-id-deja" hidden></p>';
    function typeDe(id) { return (K().piecesIdentite || []).filter(function (x) { return x.id === id; })[0] || null; }
    function deja() { var DOCS = window.PEC_DOCS; return DOCS && DOCS.get ? DOCS.get(o.portee, o.id(), piece) : null; }
    function peindreFaces() {
      var t = typeDe(type); el(pre + '-faces-z').hidden = !t; if (!t) return;
      var deux = t.faces.length > 1, unFichier = deux && el(pre + '-deux-faces').checked;
      el(pre + '-deux-faces-z').hidden = !deux;
      var faces = unFichier ? [t.faces[0]] : t.faces;
      el(pre + '-faces').className = 'faces' + (faces.length < 2 ? ' une' : '');
      el(pre + '-faces').innerHTML = faces.map(function (f) {
        var fi = fichiers[f.id];
        return '<label class="face' + (fi ? ' pleine' : '') + '" for="' + pre + '-face-' + f.id + '">'
          + (fi && fi.apercu ? '<img src="' + fi.apercu + '" alt="">' : '')
          + '<b>' + esc(unFichier ? 'Les deux faces' : f.lbl) + '</b><small>' + (fi ? esc(fi.f.name) : 'Toucher pour choisir') + '</small>'
          + '<input type="file" id="' + pre + '-face-' + f.id + '" data-face="' + f.id + '" accept="image/jpeg,image/png,.pdf"></label>';
      }).join('');
      el(pre + '-expire').min = new Date().toISOString().slice(0, 10);
    }
    function peindre() {
      var d = deja(), DOCS = window.PEC_DOCS;
      type = type || (d && d.typePiece) || null;
      el(pre + '-types').innerHTML = (K().piecesIdentite || []).map(function (t) {
        return '<button type="button" role="radio" aria-checked="' + (t.id === type) + '" data-type="' + esc(t.id) + '"><span>' + esc(t.lbl) + '</span><small>' + (t.faces.length > 1 ? 'recto et verso' : esc(t.faces[0].lbl.toLowerCase())) + '</small></button>';
      }).join('');
      var manquantes = d && DOCS.facesManquantes ? DOCS.facesManquantes(d) : [];
      el(pre + '-id-deja').hidden = !d;
      el(pre + '-id-deja').textContent = d ? 'Déjà déposée : ' + ((DOCS.typePiece(d) || {}).lbl || 'pièce') + (manquantes.length ? ' — il manque : ' + manquantes.map(function (f) { return f.lbl.toLowerCase(); }).join(', ') + '.' : '. Tu peux la remplacer.') : '';
      peindreFaces();
    }
    el(pre + '-types').addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-type]') : null; if (!b) return;
      type = b.getAttribute('data-type'); fichiers = {};
      [].forEach.call(this.querySelectorAll('[data-type]'), function (x) { x.setAttribute('aria-checked', String(x === b)); });
      peindreFaces();
    });
    el(pre + '-deux-faces').addEventListener('change', function () { delete fichiers.verso; peindreFaces(); });
    el(pre + '-faces').addEventListener('change', function (ev) {
      var inp = ev.target; if (!inp || !inp.getAttribute || !inp.getAttribute('data-face')) return;
      var f = inp.files && inp.files[0], face = inp.getAttribute('data-face'); if (!f) return;
      fichiers[face] = { f: f, apercu: null };
      if (/^image\//.test(f.type || '')) { var fr = new FileReader(); fr.onload = function () { fichiers[face].apercu = String(fr.result); peindreFaces(); }; fr.readAsDataURL(f); }
      else peindreFaces();
    });
    /* DÉPOSER — rend une promesse ; un refus est une Error dont le message se lit tel quel */
    function deposer() {
      var t = typeDe(type), DOCS = window.PEC_DOCS;
      if (!t) return Promise.reject(new Error('Choisis d’abord le type de pièce.'));
      var unFichier = t.faces.length > 1 && el(pre + '-deux-faces').checked, faces = unFichier ? [t.faces[0]] : t.faces;
      var manque = faces.filter(function (f) { return !fichiers[f.id]; })[0];
      if (manque) return Promise.reject(new Error('Il manque : ' + (unFichier ? 'le fichier des deux faces' : manque.lbl.toLowerCase()) + '.'));
      var exp = String(el(pre + '-expire').value || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exp) || Date.parse(exp + 'T23:59:59') < Date.now()) { el(pre + '-expire').focus(); return Promise.reject(new Error('Indique la date de fin de validité : la pièce doit être en cours de validité.')); }
      if (!DOCS || !DOCS.deposer) return Promise.reject(new Error('Le coffre des pièces n’est pas chargé sur cet écran.'));
      return DOCS.deposer(o.portee, o.id(), piece, fichiers.recto.f, { typePiece: t.id, expireLe: exp, deuxFaces: unFichier })
        .then(function () { return (!unFichier && fichiers.verso) ? DOCS.deposer(o.portee, o.id(), piece, fichiers.verso.f, { face: 'verso' }) : null; })
        .then(function () { fichiers = {}; return { ok: true }; });
    }
    /* À LA REPRISE : une pièce déjà au coffre et complète n'a pas à être redéposée ; de nouveaux fichiers choisis la remplacent */
    function complete() { var d = deja(), DOCS = window.PEC_DOCS; return !!(d && DOCS && DOCS.typePiece(d) && !DOCS.facesManquantes(d).length); }
    function choisis() { return Object.keys(fichiers).length > 0; }
    return { peindre: peindre, deposer: deposer, deja: deja, complete: complete, choisis: choisis };
  };

  /* ══ ④ LES AUTRES PIÈCES DU DOSSIER — chacune se dépose d'un geste ; son état vient du coffre, jamais de l'écran ══════════ */
  I.pieces = function (o) {
    var erreurs = {};
    function liste() {
      var DOCS = window.PEC_DOCS; if (!DOCS || !DOCS.dossier) return [];
      return DOCS.dossier(o.portee, o.id()).filter(function (p) { return !p.genere && (!o.garder || o.garder(p)); });
    }
    function peindre() {
      o.conteneur.className = 'pieces';
      o.conteneur.innerHTML = liste().map(function (p) {
        var dep = p.statut !== 'manquante', cls = p.statut === 'refusee' ? ' refusee' : (dep ? ' deposee' : '');
        var motif = p.statut === 'refusee' && p.document && p.document.motif ? ' — ' + p.document.motif : '';
        return '<div class="piece' + cls + '" data-piece="' + esc(p.id) + '"><div class="t"><b>' + esc(p.label) + (p.obligatoire ? '' : ' <span style="font-weight:600;color:var(--color-muted)">(facultatif)</span>') + '</b>'
          + (p.aide ? '<small>' + esc(p.aide) + '</small>' : '')
          + '<span class="etat">' + esc(p.libelle) + (p.document && p.document.nom ? ' · ' + esc(p.document.nom) : '') + esc(motif) + '</span>'
          + (erreurs[p.id] ? '<p class="err" role="alert">' + esc(erreurs[p.id]) + '</p>' : '') + '</div>'
          + '<label class="depot tap">' + (dep ? 'Remplacer' : 'Déposer') + '<input type="file" id="' + o.pre + '-piece-' + esc(p.id) + '" data-depot="' + esc(p.id) + '" accept="' + (p.video ? 'video/*' : 'image/jpeg,image/png,.pdf') + '" aria-label="' + esc(p.label) + '"></label></div>';
      }).join('');
    }
    o.conteneur.addEventListener('change', function (ev) {
      var inp = ev.target, id = inp && inp.getAttribute ? inp.getAttribute('data-depot') : null; if (!id) return;
      var f = inp.files && inp.files[0]; if (!f || !window.PEC_DOCS) return;
      delete erreurs[id];
      window.PEC_DOCS.deposer(o.portee, o.id(), id, f).then(function () { peindre(); if (o.onChange) o.onChange(); },
        function (e) { erreurs[id] = (e && e.message) || 'Dépôt impossible.'; peindre(); });
    });
    // ce qui manque encore pour envoyer : une pièce obligatoire absente, refusée, incomplète ou périmée
    function manquantes() { return liste().filter(function (p) { return p.obligatoire && /^(manquante|refusee|incomplete|a_renouveler)$/.test(p.statut); }); }
    return { peindre: peindre, manquantes: manquantes, liste: liste };
  };

  /* ══ ⑤ LE LECTEUR DES DOCUMENTS — le texte EN VIGUEUR (ref.documents.*.url), sans sa mise en page de bureau ; arriver au
     bout vaut lecture (documentConsulter), puis l'acceptation se donne sur cette version (acceptationsPoser). « Une case
     cochée sur un texte jamais ouvert n'est pas un consentement » (23/09). ══════════════════════════════════════════════ */
  I.lecteur = function (o) {
    var pre = o.pre;
    if (!el(pre + '-lecteur')) {
      var v = document.createElement('div');
      v.className = 'lect'; v.id = pre + '-lecteur'; v.hidden = true;
      v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-labelledby', pre + '-lect-titre');
      v.innerHTML = '<div class="h"><button type="button" class="retour tap" id="' + pre + '-lect-fermer"><svg class="pec-ico" viewBox="0 0 24 24"><use href="#i-chevron-left"/></svg>Retour</button>'
        + '<div class="titre" id="' + pre + '-lect-titre">—</div><span class="v" id="' + pre + '-lect-version"></span></div>'
        + '<div class="c" id="' + pre + '-lect-corps"></div><div class="f" id="' + pre + '-lect-pied"></div>';
      o.racine.appendChild(v);
    }
    var doc = null, lu = false, charge = false;
    function etat() { return doc ? (D().documentsEtat(o.espace, o.cle()).filter(function (x) { return x.cle === doc.cle; })[0] || {}) : {}; }
    /* (24/09, nuit) les mots suivent la NATURE du document (documentMots) : une politique de confidentialité se reconnaît « lue »,
       elle ne s'accepte pas ; le retour dit où l'on revient (o.retour : « à l'inscription », « à Mon point »…). */
    function pied() {
      var e = etat(), w = D().documentMots(doc);
      el(pre + '-lect-pied').innerHTML = e.aJour ? '<button type="button" class="pec-cta tap" id="' + pre + '-lect-retour">' + w.fait + ' — revenir ' + esc(o.retour || 'à l’inscription') + '</button>'
        : (lu || e.consulteLe) ? '<button type="button" class="pec-cta tap" id="' + pre + '-lect-accepter">' + w.bouton + ' (version ' + esc(doc.version) + ')</button>'
        : '<p class="s">Fais défiler le texte jusqu’au bout : c’est la lecture qui ' + (w.information ? 'ouvre la confirmation.' : 'ouvre l’acceptation.') + '</p>';
    }
    function fin() {
      var c = el(pre + '-lect-corps'); if (!c || lu || !doc) return;
      if (!charge || !c.clientHeight) return;   // la fin ne se mesure que sur un texte posé
      if (c.scrollTop + c.clientHeight < c.scrollHeight - 24) return;
      lu = true; D().documentConsulter(o.espace, o.cle(), doc.cle, o.par()); pied(); if (o.onChange) o.onChange();
    }
    function ouvrir(d) {
      if (!d) return;
      doc = d; lu = false; charge = false;
      var corps = el(pre + '-lect-corps');
      el(pre + '-lect-titre').textContent = d.titre; el(pre + '-lect-version').textContent = 'v. ' + d.version;
      corps.innerHTML = '<p style="color:var(--color-muted)">Chargement du document…</p>';
      el(pre + '-lecteur').hidden = false; pied();
      var cadre = function () { corps.innerHTML = ''; charge = true; var f = document.createElement('iframe'); f.src = d.url; f.title = d.titre; corps.appendChild(f); setTimeout(fin, 300); };
      try {
        fetch(d.url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
          if (doc !== d) return;
          var dd = new DOMParser().parseFromString(html, 'text/html');
          var body = dd.querySelector('.sheet .body') || dd.querySelector('main') || dd.querySelector('article') || dd.body;
          if (!body) { cadre(); return; }
          ['script', 'style', 'link', '.toolbar', 'nav', 'header', '.toc'].forEach(function (sel) { [].forEach.call(body.querySelectorAll(sel), function (n) { n.remove(); }); });
          [].forEach.call(body.querySelectorAll('a[href]'), function (n) { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener'); });
          var t = dd.querySelector('header h1, h1'), titreTxt = t ? t.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
          corps.innerHTML = (titreTxt ? '<h1>' + esc(titreTxt) + '</h1>' : '') + body.innerHTML + '<p class="fin-doc">— fin du document —</p>';
          corps.scrollTop = 0; charge = true; setTimeout(fin, 120);
        }).catch(cadre);
      } catch (e0) { cadre(); }
    }
    function fermer() { el(pre + '-lecteur').hidden = true; el(pre + '-lect-corps').innerHTML = ''; doc = null; lu = false; charge = false; if (o.onChange) o.onChange(); }
    el(pre + '-lect-corps').addEventListener('scroll', fin, { passive: true });
    el(pre + '-lect-fermer').addEventListener('click', fermer);
    el(pre + '-lect-pied').addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('#' + pre + '-lect-retour')) { fermer(); return; }
      if (ev.target.closest && ev.target.closest('#' + pre + '-lect-accepter') && doc) { D().acceptationsPoser(o.espace, o.cle(), [doc.cle], o.par()); fermer(); }
    });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && el(pre + '-lecteur') && !el(pre + '-lecteur').hidden) fermer(); });
    return { ouvrir: ouvrir, fermer: fermer, ouvert: function () { return !el(pre + '-lecteur').hidden; } };
  };

  /* ══ ⑥ LES BÉNÉFICIAIRES EFFECTIFS (24/09, fondatrice : « oui, marques et partenaires ») ══════════════════════════════════
     Une fiche par personne au-delà du seuil (ref.kyc.beneficiaires.seuilPct — art. R561-1 CMF), ou « aucune » et le représentant
     légal retenu d'office ; une entreprise individuelle n'a rien à déclarer, et la brique le dit. L'attestation ferme la
     déclaration. `lire()` rend ce que le data-layer contrôle (_beneficiairesControle) ; rien n'est validé ici. */
  I.beneficiaires = function (o) {
    var pre = o.pre, etat = { aucun: false, personnes: [], atteste: false }, charge = false;
    var K = function () { return ((D().ref || {}).kyc || {}); };
    function vide() { return { civilite: '', prenom: '', nom: '', dateNaissance: '', nationalite: 'Française', part: '', controle: 'capital' }; }
    function ei() { var d = D(); return !!(d.estEntrepriseIndividuelle && d.estEntrepriseIndividuelle(o.forme ? o.forme() : null)); }
    function charger() {
      if (charge) return; charge = true;
      var b0 = o.lire ? o.lire() : null;
      if (b0 && b0.attesteLe) { etat.aucun = !!b0.aucun; etat.personnes = (b0.personnes || []).map(function (p) { return Object.assign(vide(), p, { part: p.part == null ? '' : String(p.part) }); }); etat.atteste = true; }
    }
    function fiche(p, i) {
      var civ = K().civilites || [], n = i + 1;
      return '<div class="benef-fiche" data-b="' + i + '"><div class="benef-t"><b>Personne ' + n + '</b><button type="button" class="tap" data-b-retirer="' + i + '">Retirer</button></div>'
        + '<div class="deux-col"><div class="champ" style="margin-top:8px"><label for="' + pre + '-b' + i + '-civ">Civilité</label><select class="pec-input" id="' + pre + '-b' + i + '-civ" data-k="civilite"><option value="">Choisir…</option>' + civ.map(function (c) { return '<option value="' + esc(c) + '"' + (p.civilite === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>'
        + '<div class="champ" style="margin-top:8px"><label for="' + pre + '-b' + i + '-nat">Nationalité</label><input class="pec-input" id="' + pre + '-b' + i + '-nat" data-k="nationalite" type="text" value="' + esc(p.nationalite) + '"></div></div>'
        + '<div class="deux-col"><div class="champ"><label for="' + pre + '-b' + i + '-prenom">Prénom</label><input class="pec-input" id="' + pre + '-b' + i + '-prenom" data-k="prenom" type="text" autocomplete="off" value="' + esc(p.prenom) + '"></div>'
        + '<div class="champ"><label for="' + pre + '-b' + i + '-nom">Nom</label><input class="pec-input" id="' + pre + '-b' + i + '-nom" data-k="nom" type="text" autocomplete="off" value="' + esc(p.nom) + '"></div></div>'
        + '<div class="deux-col"><div class="champ"><label for="' + pre + '-b' + i + '-dn">Date de naissance</label><input class="pec-input" id="' + pre + '-b' + i + '-dn" data-k="dateNaissance" type="date" value="' + esc(p.dateNaissance) + '"></div>'
        + '<div class="champ"><label for="' + pre + '-b' + i + '-part">Part détenue (%)</label><input class="pec-input" id="' + pre + '-b' + i + '-part" data-k="part" type="text" inputmode="decimal" placeholder="ex. 60" value="' + esc(p.part) + '"' + (p.controle === 'autre' ? ' disabled' : '') + '></div></div>'
        + '<label class="case" for="' + pre + '-b' + i + '-ctrl" style="margin-top:8px"><input type="checkbox" id="' + pre + '-b' + i + '-ctrl" data-k="controle"' + (p.controle === 'autre' ? ' checked' : '') + '><span>Exerce un contrôle par d’autres moyens (sans détenir plus du seuil).</span></label></div>';
    }
    function peindre() {
      charger();
      var B = K().beneficiaires || {}, seuil = B.seuilPct || 25, dir = o.dirigeant ? o.dirigeant() : null, nomDir = dir ? [dir.civilite, dir.prenom, dir.nom].filter(Boolean).join(' ') : 'le représentant légal';
      if (ei()) {
        o.conteneur.innerHTML = '<div class="reg ok"><b>Entreprise individuelle</b> : ' + esc(nomDir) + ' en est le bénéficiaire effectif d’office — rien à déclarer ici.'
          + '<span class="src">' + esc(B.source || '') + '</span></div>';
        return;
      }
      o.conteneur.innerHTML = '<p class="aide" style="margin-top:0">' + esc(B.motif || '') + ' <span style="display:block;margin-top:2px">' + esc(B.source || '') + '</span></p>'
        + '<label class="case" for="' + pre + '-benef-aucun"><input type="checkbox" id="' + pre + '-benef-aucun"' + (etat.aucun ? ' checked' : '') + '><span>Aucune personne physique ne détient plus de ' + seuil + ' % du capital ou des droits de vote : <b>' + esc(nomDir) + '</b>, représentant légal, est retenu comme bénéficiaire effectif.</span></label>'
        + '<div id="' + pre + '-benef-liste"' + (etat.aucun ? ' hidden' : '') + '>' + etat.personnes.map(fiche).join('')
        + '<button type="button" class="pec-btn-secondary tap" id="' + pre + '-benef-plus" style="margin-top:10px">' + (etat.personnes.length ? 'Ajouter une autre personne' : 'Ajouter une personne') + '</button></div>'
        + '<label class="case' + (etat.atteste ? ' fait' : '') + '" for="' + pre + '-benef-atteste" style="margin-top:14px"><input type="checkbox" id="' + pre + '-benef-atteste"' + (etat.atteste ? ' checked' : '') + '><span>J’atteste que ces informations sont exactes et complètes, et je m’engage à signaler tout changement.</span></label>';
    }
    o.conteneur.addEventListener('input', function (ev) {
      var f = ev.target.closest ? ev.target.closest('[data-b]') : null, k = ev.target.getAttribute && ev.target.getAttribute('data-k');
      if (!f || !k || k === 'controle') return;
      var i = +f.getAttribute('data-b'); if (etat.personnes[i]) etat.personnes[i][k] = ev.target.value;
    });
    o.conteneur.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === pre + '-benef-aucun') { etat.aucun = t.checked; peindre(); return; }
      if (t.id === pre + '-benef-atteste') { etat.atteste = t.checked; return; }
      var f = t.closest ? t.closest('[data-b]') : null, k = t.getAttribute && t.getAttribute('data-k');
      if (f && k === 'controle') { var i = +f.getAttribute('data-b'); if (etat.personnes[i]) { etat.personnes[i].controle = t.checked ? 'autre' : 'capital'; if (t.checked) etat.personnes[i].part = ''; peindre(); } return; }
      if (f && k === 'civilite') { var j = +f.getAttribute('data-b'); if (etat.personnes[j]) etat.personnes[j].civilite = t.value; }
    });
    o.conteneur.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-b-retirer]') : null;
      if (b) { etat.personnes.splice(+b.getAttribute('data-b-retirer'), 1); etat.atteste = false; peindre(); return; }
      if (ev.target.closest && ev.target.closest('#' + pre + '-benef-plus')) { etat.personnes.push(vide()); etat.atteste = false; peindre(); var last = o.conteneur.querySelector('[data-b="' + (etat.personnes.length - 1) + '"] input, [data-b="' + (etat.personnes.length - 1) + '"] select'); if (last) last.focus(); }
    });
    function lire() { return { aucun: etat.aucun, personnes: etat.personnes.map(function (p) { return Object.assign({}, p); }), atteste: etat.atteste }; }
    /* le refus du data-layer nomme la personne et le champ : on y met le curseur */
    function viser(r) {
      if (!r || r.ok) return;
      var cible = r.champ === 'atteste' ? el(pre + '-benef-atteste') : (r.index != null ? o.conteneur.querySelector('[data-b="' + r.index + '"] [data-k="' + ({ nom: 'nom', civilite: 'civilite', dateNaissance: 'dateNaissance', nationalite: 'nationalite', part: 'part' }[r.champ] || 'prenom') + '"]') : el(pre + '-benef-plus'));
      if (cible && cible.focus) cible.focus();
    }
    return { peindre: peindre, lire: lire, ei: ei, viser: viser };
  };

  /* ══ ⑧ LA PORTE — le cadre commun des pages qui créent un compte ou y font entrer (24/09, nuit) ══════════════════════════
     Fondatrice : « le manque de cohérence pour créer un compte — applique un design professionnel, inspire-toi de Stancer,
     Stripe… pour les pages d'inscription, aligne ça de partout ». La page garde son formulaire et ses identifiants ; la porte
     pose autour d'elle, une fois pour toutes les apps :
       · le PANNEAU de l'app (au bureau, la colonne de gauche ; sur un téléphone, l'en-tête) : la marque de l'app, sa promesse
         et ce qu'on y gagne (ref.portes), les étapes de l'inscription quand il y en a (le fil de la page y est déplacé : ses
         identifiants ne changent pas), les documents de l'espace et la société ;
       · la BASCULE « Déjà un compte ? Se connecter » / « Pas encore de compte ? Créer un compte », en haut à droite ;
       · la classe `pec-porte` sur le cadre : la navigation de l'app s'efface (on entre, on ne navigue pas) et les champs,
         boutons et messages prennent l'allure commune (payencash-inscription.css).
     o = { app: 'tech'|'partenaire'|'bons'|'manager'|'hotline', marque: symbole de l'app (data-pec-marque), nom: nom écrit
           de l'app (facultatif), fil: id du fil des étapes (facultatif), docs: espace des documents (ref.documents),
           bascule: { q, lbl, href }, retour: { lbl, href } (facultatif), cadre: élément (défaut : .pec-device) } */
  I.porte = function (o) {
    var d = D(); if (!d) return null;
    var cadre = o.cadre || document.querySelector('.pec-device') || document.body;
    cadre.classList.add('pec-porte');
    var P = (((d.ref || {}).portes || {})[o.app]) || {};
    var offres = (d.techModes ? d.techModes() : []).map(function (m) { return String(m.libelle || '').replace(/^Paiement\s+sous\s+/i, ''); }).filter(Boolean);
    var offresTxt = offres.length ? 'sous ' + (offres.length > 1 ? offres.slice(0, -1).join(', ') + ' ou ' + offres[offres.length - 1] : offres[0]) : '';
    var pct = function (x) { var n = +x; return (n % 1 ? String(Math.round(n * 100) / 100) : String(n)).replace('.', ',') + ' %'; };
    var parts = (d.techModes ? d.techModes() : []).map(function (m) { return +m.partPointPct; }).filter(function (x) { return x > 0; }).sort(function (x, y) { return x - y; });
    var partsTxt = parts.length ? (parts[0] === parts[parts.length - 1] ? pct(parts[0]) : 'de ' + pct(parts[0]) + ' à ' + pct(parts[parts.length - 1])) : '';
    function remplir(s) {
      return String(s || '').split('{offres}').join(offresTxt).split('{parts}').join(partsTxt)
        .split('{commerce}').join(d.terme ? d.terme('commerce', 'court') : 'commerce')
        .split('{nomade}').join(d.terme ? d.terme('nomade') : 'distributeur nomade')
        .split('{societe}').join(d.societeLigne ? d.societeLigne() : '');
    }
    var coche = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var docs = o.docs ? ((((d.ref || {}).documents || {})[o.docs]) || []).filter(function (x) { return /^cgu|confidentialite/.test(x.cle); }) : [];
    var lienDoc = function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + (/^confidentialite/.test(x.cle) ? 'Confidentialité' : 'Conditions d’utilisation') + '</a>'; };
    var bascule = o.bascule ? '<span class="q">' + esc(o.bascule.q) + ' </span><a href="' + esc(o.bascule.href) + '">' + esc(o.bascule.lbl) + '</a>' : '';
    var a = document.createElement('aside');
    a.className = 'porte-aside';
    a.innerHTML = '<div class="porte-tete">'
        + (o.retour ? '<a class="porte-marque" href="' + esc(o.retour.href) + '" aria-label="' + esc(o.retour.lbl) + '">' : '<span class="porte-marque">')
        + '<span class="pec-marque--sombre" data-pec-marque="' + esc(o.marque) + '"' + (o.nom ? ' data-nom="' + esc(o.nom) + '"' : '') + '></span>'
        + (o.retour ? '</a>' : '</span>')
        + (bascule ? '<p class="porte-bascule porte-tel">' + bascule + '</p>' : '')
      + '</div>'
      + (P.titre ? '<div class="porte-promesse"><h2>' + esc(remplir(P.titre)) + '</h2>' + (P.texte ? '<p>' + esc(remplir(P.texte)) + '</p>' : '')
        + ((P.avantages || []).length ? '<ul class="porte-avantages">' + P.avantages.map(function (x) { return '<li><span class="c">' + coche + '</span><span>' + esc(remplir(x)) + '</span></li>'; }).join('') + '</ul>' : '')
        + '</div>' : '')
      + '<div class="porte-etapes"></div>'
      + '<div class="porte-pied">' + (docs.length ? '<p class="liens">' + docs.map(lienDoc).join('<span aria-hidden="true"> · </span>') + '</p>' : '')
        + (P.pied ? '<p>' + esc(remplir(P.pied)) + '</p>' : '')
        + (o.retour ? '<p><a href="' + esc(o.retour.href) + '">← ' + esc(o.retour.lbl) + '</a></p>' : '') + '</div>';
    var sb = cadre.querySelector(':scope > .pec-statusbar');
    cadre.insertBefore(a, sb ? sb.nextSibling : cadre.firstChild);
    if (d.marqueAppliquer) d.marqueAppliquer(a);
    if (o.fil) { var f = el(o.fil); if (f) a.querySelector('.porte-etapes').appendChild(f); }
    if (bascule) {
      var h = document.createElement('p'); h.className = 'porte-bascule porte-haut'; h.innerHTML = bascule;
      var corps = cadre.querySelector(':scope > .pec-body');
      cadre.insertBefore(h, corps || null);
    }
    I.voirMdp(cadre);
    return a;
  };
  /* « AFFICHER » LE MOT DE PASSE, sur chaque champ de mot de passe d'une page d'entrée (24/09, nuit) : Mes bons l'avait, les
     marques et les commerces non. Un champ qui porte déjà son bouton (.voir) est laissé tel quel. */
  I.voirMdp = function (racine) {
    [].forEach.call((racine || document).querySelectorAll('input[type="password"]'), function (i) {
      if (i.getAttribute('data-voir') || (i.parentElement && i.parentElement.querySelector('.voir'))) return;
      i.setAttribute('data-voir', '1');
      var enveloppe = document.createElement('span'); enveloppe.className = 'porte-mdp';
      i.parentNode.insertBefore(enveloppe, i); enveloppe.appendChild(i);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'voir tap'; b.textContent = 'Afficher';
      b.setAttribute('aria-label', 'Afficher le mot de passe'); b.setAttribute('aria-controls', i.id || '');
      b.addEventListener('click', function () {
        var vu = i.type === 'text'; i.type = vu ? 'password' : 'text';
        b.textContent = vu ? 'Afficher' : 'Masquer'; b.setAttribute('aria-label', vu ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
      });
      enveloppe.appendChild(b);
    });
  };

  window.PEC_INSCRIPTION = I;
})();
