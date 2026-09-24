/* ══ PEC_EQUIPE — LES ACCÈS COLLABORATEURS, ÉCRITS UNE FOIS POUR LES DEUX APPS (24/09, nuit) ══════════════════════════════════
   Fondatrice, 24/09 : « un partenaire du réseau, sauf micro, peut ajouter un collaborateur — process simple — ça crée une session
   active pour le salarié qui voit ses ventes exclusivement, et le compte principal a un accès sur tout ce qui se passe ; le partage
   d'accès implique l'envoi d'un SMS, WhatsApp etc. avec le lien de l'application à télécharger, l'identifiant du partenaire et un
   mot de passe à créer, aussi simple que cela » ; « une marque peut également ajouter une session collaborateur / partenaire : il
   peut promouvoir la marque et consulter uniquement ses actions ».
   Le commerce (app Partenaire, Mon point) et la marque (app Solution, Compte › Équipe) gèrent leur équipe de la même façon ; le
   collaborateur active son accès et le retrouve de la même façon dans les deux apps. Ces trois écrans vivent ICI.
   Aucune règle n'est ici : l'ajout, le lien, l'activation, la suspension et ce que chacun a fait sont au data-layer (PEC_DATA,
   bloc « LES COLLABORATEURS »). Ce module montre et relaie les gestes.

   API :
     PEC_EQUIPE.gerer(hote, { type:'point'|'marque', parentId, par }) → l'équipe du titulaire : la liste, l'ajout, le partage de
                                                                        l'accès (SMS, WhatsApp, copier, partager), suspendre,
                                                                        réactiver, retirer. Se repeint sur le bus.
     PEC_EQUIPE.activer(hote, { jeton, onEntrer(compte, motdepasse) }) → « Crée ton mot de passe » depuis le lien reçu
     PEC_EQUIPE.monAcces(hote, { compte, onSortir })                  → l'accès du collaborateur : qui, pour qui, identifiant,
                                                                        changer son mot de passe, se déconnecter
   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function D() { return window.PEC_DATA; }
  function esc(v) { var d = D(); return d && d.esc ? d.esc(v) : String(v == null ? '' : v); }
  function ico(id) { return '<svg class="pec-ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function telMasque(t) { t = String(t || ''); return t.length === 10 ? t.slice(0, 2) + ' •• •• •• ' + t.slice(-2) : t; }
  function quand(at) { var d = D(); return at ? (d.dateHeure ? d.dateHeure(at) : new Date(at).toLocaleString('fr-FR')) : '—'; }
  function initiales(v) { return ((v.prenom || '').charAt(0) + (v.nom || '').charAt(0)).toUpperCase() || '?'; }

  /* LA FEUILLE DE STYLE — une fois par page ; l'échelle du téléphone, puis celle d'un écran de bureau */
  function styles() {
    if (document.getElementById('pe-style')) return;
    var s = document.createElement('style'); s.id = 'pe-style';
    s.textContent =
      '.pe-intro{margin:0 0 10px;font-size:12px;line-height:1.55;color:var(--color-muted)}' +
      '.pe-liste{display:grid;gap:10px}' +
      '.pe-vide{padding:16px;border-radius:14px;background:var(--color-bg);font-size:12.5px;line-height:1.5;color:var(--color-muted);text-align:center}' +
      '.pe-c{padding:12px 14px}' +
      '.pe-c .h{display:flex;align-items:center;gap:10px}' +
      '.pe-c .av{flex:none;width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--color-mint);color:var(--color-primary-dark);font-weight:800;font-size:13px}' +
      '.pe-c .qui{flex:1;min-width:0}' +
      '.pe-c .qui b{display:block;font-size:14px;color:var(--color-ink)}' +
      '.pe-c .qui span{display:block;font-family:var(--font-mono);font-size:11px;color:var(--color-muted);overflow-wrap:anywhere}' +
      '.pe-c .pec-pill{flex:none;font-size:9.5px;padding:3px 8px}' +
      '.pe-c .res{margin:9px 0 0;font-size:12px;line-height:1.5;color:var(--color-ink)}' +
      '.pe-c .tr{margin:4px 0 0;font-size:11px;line-height:1.5;color:var(--color-muted)}' +
      '.pe-c .act{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}' +
      '.pe-c .act button{font:inherit;font-size:11.5px;font-weight:700;border:1px solid var(--color-sep);background:var(--color-surface);color:var(--color-ink);border-radius:8px;padding:7px 11px;cursor:pointer;min-height:34px}' +
      '.pe-c .act button.fort{background:var(--color-primary);border-color:var(--color-primary);color:#fff}' +
      '.pe-c .act button.danger{color:#B3372B;border-color:rgba(179,55,43,.35)}' +
      '.pe-c.clos{opacity:.62}' +
      '.pe-ouvrir{width:100%;margin-top:10px}' +
      '.pe-form{padding:14px;margin-top:10px}' +
      '.pe-form .t{font-weight:800;font-size:13.5px;margin:0 0 4px}' +
      '.pe-form .s{margin:0 0 10px;font-size:11.5px;line-height:1.5;color:var(--color-muted)}' +
      '.pe-form .pec-input-label{margin-top:10px}' +
      '.pe-form .pec-input-label:first-of-type{margin-top:0}' +
      '.pe-form .fac{font-weight:600;color:var(--color-muted)}' +
      '.pe-form .deux{display:grid;grid-template-columns:1fr;gap:0}' +
      '.pe-form .btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}' +
      '.pe-form .btns .pec-cta{flex:1 1 auto}' +
      '.pe-err{margin:8px 0 0;font-size:12px;font-weight:700;line-height:1.45;color:#B3372B}' +
      '.pe-ok{margin:8px 0 0;font-size:12px;font-weight:700;line-height:1.45;color:var(--color-primary-dark)}' +
      '.pe-voile{position:fixed;inset:0;z-index:60;background:rgba(10,26,22,.46);display:flex;align-items:flex-end;justify-content:center;padding:0}' +
      '.pe-voile[hidden]{display:none}' +
      '.pe-feuille{width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;background:var(--color-surface);padding:18px 18px 22px;box-shadow:0 -8px 30px rgba(0,0,0,.18)}' +
      '.pe-feuille h3{margin:0;font-size:17px;font-weight:800;color:var(--color-ink)}' +
      '.pe-feuille .s{margin:4px 0 12px;font-size:12px;line-height:1.5;color:var(--color-muted)}' +
      '.pe-msg{margin:0;white-space:pre-wrap;word-break:break-word;border-radius:12px;background:var(--color-bg);padding:12px;font:inherit;font-size:12.5px;line-height:1.55;color:var(--color-ink)}' +
      '.pe-canaux{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}' +
      '.pe-canaux a,.pe-canaux button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:46px;border-radius:12px;border:1.5px solid var(--color-sep);background:var(--color-surface);font:inherit;font-size:13px;font-weight:800;color:var(--color-ink);text-decoration:none;cursor:pointer}' +
      '.pe-canaux .sms{background:var(--color-primary);border-color:var(--color-primary);color:#fff}' +
      '.pe-canaux .wa{background:#1FA855;border-color:#1FA855;color:#fff}' +
      '.pe-canaux svg{width:18px;height:18px}' +
      '.pe-note{margin:12px 0 0;font-size:11px;line-height:1.5;color:var(--color-muted)}' +
      '.pe-fermer{width:100%;margin-top:12px}' +
      '.pe-kv{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--color-sep);font-size:12.5px}' +
      '.pe-kv:first-child{border-top:0}' +
      '.pe-kv .l{flex:none;color:var(--color-muted)}' +
      '.pe-kv .v{min-width:0;text-align:right;font-weight:700;overflow-wrap:anywhere}' +
      '.pe-kv .v.mono{font-family:var(--font-mono);font-weight:600}' +
      '.pe-regle{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--color-mint);font-size:12px;line-height:1.5;color:var(--color-mint-ink)}' +
      '@media (min-width:640px){.pe-voile{align-items:center;padding:24px}.pe-feuille{border-radius:20px}.pe-form .deux{grid-template-columns:1fr 1fr;gap:0 12px}}' +
      '@media (min-width:1024px){' +
        '.pe-intro{font-size:14px;margin-bottom:14px}' +
        '.pe-liste{grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}' +
        '.pe-c{padding:18px 20px}.pe-c .qui b{font-size:15.5px}.pe-c .qui span{font-size:12.5px}' +
        '.pe-c .pec-pill{font-size:11.5px;padding:4px 10px}.pe-c .res{font-size:13.5px}.pe-c .tr{font-size:12.5px}' +
        '.pe-c .act button{font-size:13px;padding:8px 14px;min-height:38px}' +
        '.pe-ouvrir{width:auto;min-width:260px}' +
        '.pe-form{padding:22px 26px}.pe-form .t{font-size:16px}.pe-form .s{font-size:13px}' +
        '.pe-form .btns .pec-cta{flex:0 0 auto;width:auto;padding:0 26px}' +
        '.pe-err,.pe-ok{font-size:13.5px}' +
        '.pe-feuille{padding:26px 28px}.pe-feuille h3{font-size:19px}.pe-feuille .s{font-size:13.5px}.pe-msg{font-size:14px}' +
        '.pe-note{font-size:12.5px}.pe-kv{font-size:14px;padding:9px 0}.pe-regle{font-size:13.5px}' +
      '}';
    document.head.appendChild(s);
  }

  var SVG_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2z"/></svg>';

  /* ══ LA FEUILLE DE PARTAGE — le message tel qu'il partira, et les canaux du téléphone ═════════════════════════════════════ */
  function feuille(acces, par, apres) {
    styles();
    var d = D(), v = acces.collaborateur, L = d.partageLiens(v.tel, acces.message);
    var z = document.getElementById('pe-voile');
    if (!z) { z = document.createElement('div'); z.id = 'pe-voile'; z.className = 'pe-voile'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-modal', 'true'); z.setAttribute('aria-labelledby', 'pe-f-t'); document.body.appendChild(z); }
    var partageNatif = !!(navigator.share);
    z.innerHTML = '<div class="pe-feuille">'
      + '<h3 id="pe-f-t">Envoie son accès à ' + esc(v.prenom || v.nomAffiche) + '</h3>'
      + '<p class="s">' + (acces.jeton ? 'L’app à télécharger, son identifiant et le lien pour créer son mot de passe — lui seul le connaîtra.' : 'Son accès est déjà activé : le message lui redonne l’app et son identifiant.') + ' Au ' + esc(telMasque(v.tel)) + '.</p>'
      + '<pre class="pe-msg" id="pe-f-msg">' + esc(acces.message) + '</pre>'
      + '<div class="pe-canaux">'
        + '<a class="sms tap" id="pe-f-sms" href="' + esc(L.sms) + '" data-canal="sms">' + ico('i-chat') + 'SMS</a>'
        + '<a class="wa tap" id="pe-f-wa" href="' + esc(L.whatsapp) + '" target="_blank" rel="noopener" data-canal="whatsapp">' + SVG_WA + 'WhatsApp</a>'
        + '<button type="button" class="tap" id="pe-f-copier" data-canal="copie">' + ico('i-file') + 'Copier</button>'
        + (partageNatif ? '<button type="button" class="tap" id="pe-f-partager" data-canal="partage">' + ico('i-share') + 'Partager…</button>' : '')
      + '</div>'
      + '<p class="pe-ok" id="pe-f-ok" role="status" hidden></p>'
      + '<p class="pe-note">Le message part de ton téléphone : c’est toi qu’il connaît. PayEnCash garde la trace de l’envoi (le canal et la date), jamais son texte.' + (acces.jeton ? ' Le lien ne sert qu’une fois ; le renvoyer en tire un nouveau et éteint celui-ci.' : '') + '</p>'
      + '<button type="button" class="pec-btn-secondary tap pe-fermer" id="pe-f-fermer">Fermer</button>'
      + '</div>';
    z.hidden = false;
    function noter(canal, txt) {
      d.collaborateurPartageNoter(v.id, canal, typeof par === 'function' ? par() : par);
      var ok = document.getElementById('pe-f-ok'); if (ok) { ok.hidden = false; ok.textContent = txt; }
      if (apres) apres();
    }
    [].forEach.call(z.querySelectorAll('a[data-canal]'), function (a) {
      a.addEventListener('click', function () { noter(a.getAttribute('data-canal'), '✓ ' + (a.getAttribute('data-canal') === 'sms' ? 'L’app de messages s’ouvre avec le texte : il reste à appuyer sur Envoyer.' : 'WhatsApp s’ouvre avec le texte : il reste à appuyer sur Envoyer.')); });
    });
    document.getElementById('pe-f-copier').addEventListener('click', function () {
      var txt = acces.message, fait = function () { noter('copie', '✓ Message copié : colle-le dans la conversation de ton choix.'); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(fait, function () { copieSecours(txt) ? fait() : echecCopie(); }); return; }
      } catch (e) {}
      if (copieSecours(txt)) fait(); else echecCopie();
    });
    function copieSecours(txt) {
      try { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-100px;opacity:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
    }
    function echecCopie() { var ok = document.getElementById('pe-f-ok'); if (ok) { ok.hidden = false; ok.className = 'pe-err'; ok.textContent = 'La copie est bloquée par le navigateur : sélectionne le message ci-dessus et copie-le.'; } }
    var pn = document.getElementById('pe-f-partager');
    if (pn) pn.addEventListener('click', function () {
      navigator.share({ title: 'Ton accès ' + (acces.app && acces.app.nom || ''), text: acces.message }).then(function () { noter('partage', '✓ Message partagé.'); }, function () {});
    });
    // refermée, la feuille rend la main à la liste, qui se relit : la trace d'un envoi fait pendant qu'elle était ouverte s'y lit aussitôt
    function fermer() { z.hidden = true; z.innerHTML = ''; document.removeEventListener('keydown', echap); if (apres) apres(); }
    function echap(e) { if (e.key === 'Escape') fermer(); }
    document.getElementById('pe-f-fermer').addEventListener('click', fermer);
    z.addEventListener('click', function (e) { if (e.target === z) fermer(); });
    document.addEventListener('keydown', echap);
    var premier = document.getElementById('pe-f-sms'); if (premier) premier.focus();
  }

  /* ══ ① L'ÉQUIPE DU TITULAIRE ═════════════════════════════════════════════════════════════════════════════════════════════
     UNE ÉQUIPE, UNE INSTANCE : une page qui se repeint en entier sur le bus (Compte de la marque) rappelle `gerer` avec un hôte neuf —
     l'instance s'y repose, sans empiler un écouteur de plus à chaque peinture. */
  var instances = {};
  function gerer(hote, o) {
    if (typeof hote === 'string') hote = document.getElementById(hote);
    var d = D(); if (!hote || !d || !d.collaborateurs) return null;
    styles();
    var cleInst = o.type + ':' + o.parentId;
    if (instances[cleInst]) { instances[cleInst].cibler(hote); return instances[cleInst]; }
    var par = function () { return typeof o.par === 'function' ? o.par() : o.par; };
    var aRetirer = null, formOuvert = false, derniere = null;
    function resultats(v) {
      var r = d.collaborateurResultats(v.id); if (!r) return '';
      if (r.type === 'point') return 'Ce mois-ci : <b>' + r.ventesMois + ' bon' + (r.ventesMois > 1 ? 's' : '') + ' vendu' + (r.ventesMois > 1 ? 's' : '') + '</b> · ' + esc(d.eur(r.valeurMois))
        + (r.ventes > r.ventesMois ? ' <span style="color:var(--color-muted)">— ' + r.ventes + ' depuis son arrivée</span>' : '');
      return '<b>' + r.liens + ' lien' + (r.liens > 1 ? 's' : '') + '</b> (' + r.ouvertures + ' ouverture' + (r.ouvertures > 1 ? 's' : '') + ') · <b>' + r.propositions + ' bon' + (r.propositions > 1 ? 's' : '') + ' proposé' + (r.propositions > 1 ? 's' : '') + '</b> · <b>'
        + r.bons + ' bon' + (r.bons > 1 ? 's' : '') + ' acheté' + (r.bons > 1 ? 's' : '') + '</b> — ' + esc(d.eur(r.valeur));
    }
    function pill(v) {
      var cls = v.statut === 'actif' ? 'pec-pill--done' : v.statut === 'invite' ? (v.expiree ? 'pec-pill--off' : 'pec-pill--wait') : 'pec-pill--off';
      return '<span class="pec-pill ' + cls + '">' + esc(v.statutLbl) + '</span>';
    }
    function carte(v) {
      var trace = v.partage ? 'Accès envoyé par ' + esc(d.COLLAB_CANAUX[v.partage.canal] || v.partage.canal) + ' le ' + esc(quand(v.partage.at)) : (v.invite ? 'Accès pas encore envoyé' : '');
      var co = v.derniereConnexion ? 'Dernière connexion le ' + esc(quand(v.derniereConnexion)) : (v.statut === 'actif' ? 'Jamais connecté·e' : '');
      var act = '';
      if (v.statut === 'invite') act += '<button type="button" class="fort tap" data-pe-envoyer="' + esc(v.id) + '">' + (v.partage ? 'Renvoyer l’accès' : 'Envoyer l’accès') + '</button>';
      if (v.statut === 'actif') act += '<button type="button" class="tap" data-pe-envoyer="' + esc(v.id) + '">Redonner son identifiant</button>'
        + '<button type="button" class="tap" data-pe-mdp="' + esc(v.id) + '">Nouveau mot de passe</button>';
      if (v.statut === 'actif' || v.statut === 'invite') act += '<button type="button" class="tap" data-pe-suspendre="' + esc(v.id) + '">Suspendre</button>';
      if (v.statut === 'suspendu') act += '<button type="button" class="fort tap" data-pe-reactiver="' + esc(v.id) + '">Réactiver</button>';
      if (v.statut !== 'clos') act += aRetirer === v.id
        ? '<button type="button" class="danger tap" data-pe-retirer-ok="' + esc(v.id) + '">Confirmer le retrait</button><button type="button" class="tap" data-pe-retirer-non="1">Garder</button>'
        : '<button type="button" class="danger tap" data-pe-retirer="' + esc(v.id) + '">Retirer l’accès</button>';
      return '<div class="pec-card pe-c' + (v.statut === 'clos' ? ' clos' : '') + '" data-collab="' + esc(v.id) + '">'
        + '<div class="h"><span class="av" aria-hidden="true">' + esc(initiales(v)) + '</span><span class="qui"><b>' + esc(v.nomAffiche) + '</b><span>' + esc(v.identifiant) + ' · ' + esc(telMasque(v.tel)) + '</span></span>' + pill(v) + '</div>'
        + (v.statut !== 'invite' ? '<p class="res">' + resultats(v) + '</p>' : '')
        + ((trace || co) ? '<p class="tr">' + [trace, co].filter(Boolean).join(' · ') + '</p>' : '')
        + (act ? '<div class="act">' + act + '</div>' : '')
        + '</div>';
    }
    function peindre() {
      var peut = d.collaborateurPeutAjouter(o.type, o.parentId);
      var l = d.collaborateurs(o.type, o.parentId);
      var emp = JSON.stringify(l.map(function (v) { return [v.id, v.statut, v.expiree, v.partage && v.partage.at, v.derniereConnexion, resultats(v)]; })) + '|' + aRetirer + '|' + peut.ok;
      if (emp === derniere && hote.firstChild) return;
      derniere = emp;
      var garde = { prenom: '', nom: '', tel: '' };
      ['pe-prenom', 'pe-nom', 'pe-tel'].forEach(function (id) { var el = document.getElementById(id); if (el) garde[id.slice(3)] = el.value; });
      var intro = o.type === 'point'
        ? 'Ajoute un ' + d.terme('collaborateur') + ' : il vend au comptoir en ton nom et ne voit que ses ventes ; toi, tu vois tout — ses ventes, sa dernière connexion. Tu peux suspendre ou retirer son accès à tout moment.'
        : 'Ajoute un ' + d.terme('collaborateur') + ' : il fait connaître ta marque avec ses propres liens et ses bons proposés, et ne voit que ce qu’il a produit ; toi, tu vois tout. Tu peux suspendre ou retirer son accès à tout moment.';
      hote.innerHTML = '<p class="pe-intro">' + esc(intro) + '</p>'
        + '<div class="pe-liste" id="pe-liste">' + (l.length ? l.map(carte).join('') : '<div class="pe-vide">Personne pour l’instant. Ajoute ton premier ' + esc(d.terme('collaborateur')) + ' : un prénom et un mobile suffisent.</div>') + '</div>'
        + (peut.ok
          ? '<button type="button" class="pec-btn-secondary tap pe-ouvrir" id="pe-ouvrir"' + (formOuvert ? ' hidden' : '') + '>' + ico('i-plus') + ' Ajouter un ' + esc(d.terme('collaborateur')) + '</button>'
            + '<form class="pec-card pec-card--elevated pe-form" id="pe-form" novalidate autocomplete="off"' + (formOuvert ? '' : ' hidden') + '>'
            + '<p class="t">Nouveau ' + esc(d.terme('collaborateur')) + '</p>'
            + '<p class="s">Son accès part sur son mobile : l’app à télécharger, son identifiant et un lien pour créer son mot de passe.</p>'
            + '<div class="deux"><div><label class="pec-input-label" for="pe-prenom">Prénom</label><input class="pec-input" id="pe-prenom" type="text" autocomplete="off" placeholder="Marie"></div>'
            + '<div><label class="pec-input-label" for="pe-nom">Nom <span class="fac">— facultatif</span></label><input class="pec-input" id="pe-nom" type="text" autocomplete="off" placeholder="Dupont"></div></div>'
            + '<label class="pec-input-label" for="pe-tel">Mobile</label><input class="pec-input" id="pe-tel" type="tel" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="06 12 34 56 78">'
            + '<p class="pe-err" id="pe-err" role="alert" hidden></p>'
            + '<div class="btns"><button type="submit" class="pec-cta tap" id="pe-creer">Créer son accès</button><button type="button" class="pec-btn-secondary tap" id="pe-annuler">Annuler</button></div>'
            + '</form>'
          : '<p class="pe-regle" id="pe-refus">' + esc(peut.motif) + '</p>');
      ['prenom', 'nom', 'tel'].forEach(function (k) { var el = document.getElementById('pe-' + k); if (el && garde[k]) el.value = garde[k]; });
      brancherForm();
    }
    function erreur(txt, champ) { var e = document.getElementById('pe-err'); if (!e) return; e.hidden = !txt; e.textContent = txt || ''; if (champ) { var el = document.getElementById('pe-' + champ); if (el) el.focus(); } }
    function brancherForm() {
      var f = document.getElementById('pe-form'); if (!f) return;
      document.getElementById('pe-ouvrir').addEventListener('click', function () { formOuvert = true; f.hidden = false; this.hidden = true; document.getElementById('pe-prenom').focus(); });
      document.getElementById('pe-annuler').addEventListener('click', function () { formOuvert = false; f.reset(); f.hidden = true; document.getElementById('pe-ouvrir').hidden = false; erreur(''); });
      f.addEventListener('submit', function (e) {
        e.preventDefault(); erreur('');
        var r = d.collaborateurAjouter(o.type, o.parentId, { prenom: document.getElementById('pe-prenom').value, nom: document.getElementById('pe-nom').value, tel: document.getElementById('pe-tel').value }, par());
        if (!r.ok) { erreur(r.motif, r.champ); return; }
        formOuvert = false; derniere = null; peindre();
        feuille(r, par, function () { derniere = null; peindre(); });
      });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null; if (!b || !hote || !hote.contains(b)) return;
      var id;
      if ((id = b.getAttribute('data-pe-envoyer'))) {
        var r = d.collaborateurInviter(id, par());
        if (!r.ok) { alerte(r.motif); return; }
        derniere = null; peindre(); feuille(r, par, function () { derniere = null; peindre(); }); return;
      }
      if ((id = b.getAttribute('data-pe-mdp'))) {   // mot de passe oublié : un nouveau lien, l'ancien mot de passe ne vaut plus
        var rm = d.collaborateurReinitialiser(id, par());
        if (!rm.ok) { alerte(rm.motif); return; }
        derniere = null; peindre(); feuille(rm, par, function () { derniere = null; peindre(); }); return;
      }
      if ((id = b.getAttribute('data-pe-suspendre'))) { resultat(d.collaborateurSuspendre(id, par())); return; }
      if ((id = b.getAttribute('data-pe-reactiver'))) { resultat(d.collaborateurReactiver(id, par())); return; }
      if ((id = b.getAttribute('data-pe-retirer'))) { aRetirer = id; derniere = null; peindre(); return; }
      if (b.getAttribute('data-pe-retirer-non')) { aRetirer = null; derniere = null; peindre(); return; }
      if ((id = b.getAttribute('data-pe-retirer-ok'))) { aRetirer = null; resultat(d.collaborateurRetirer(id, par(), 'retiré par le titulaire du compte')); return; }
    });
    function resultat(r) { if (r && r.ok === false) alerte(r.motif); derniere = null; peindre(); }
    function alerte(txt) { var l = document.getElementById('pe-liste'); if (!l) return; var p = document.createElement('p'); p.className = 'pe-err'; p.setAttribute('role', 'alert'); p.textContent = txt; l.parentNode.insertBefore(p, l); }
    peindre();
    window.addEventListener('pec-bus', function () { if (!document.getElementById('pe-voile') || document.getElementById('pe-voile').hidden) peindre(); });
    window.addEventListener('storage', peindre);
    instances[cleInst] = { peindre: function () { derniere = null; peindre(); },
      cibler: function (h) { if (h === hote) return; hote = h; derniere = null; peindre(); } };
    return instances[cleInst];
  }

  /* ══ ② « CRÉE TON MOT DE PASSE » — depuis le lien reçu par SMS ou WhatsApp ═══════════════════════════════════════════════ */
  function activer(hote, o) {
    if (typeof hote === 'string') hote = document.getElementById(hote);
    var d = D(); if (!hote || !d || !d.collaborateurParJeton) return null;
    styles();
    var c = d.collaborateurParJeton(o.jeton);
    if (!c || c.statut !== 'invite') {
      hote.innerHTML = '<div class="pec-card pe-form"><p class="t">Ce lien n’est plus valable</p><p class="s">'
        + (c ? 'Ton accès est déjà activé : connecte-toi ci-dessous avec ton identifiant <b>' + esc(c.identifiant) + '</b>.' : 'Il a déjà servi, ou un lien plus récent l’a remplacé. Demande à ton responsable de te renvoyer l’accès.') + '</p></div>';
      return { ok: false, compte: c };
    }
    var v = d.collaborateur(c.id), pa = d._collabParentInfo(c.collab.type, c.collab.parentId) || {}, app = d.collaborateurApp(c), min = d.compteMdpMin(c.espace);
    var expiree = v.expiree;
    /* la page d'entrée dit ce qu'elle fait dans ce cas : on n'y « se connecte » pas encore, on active son accès — et sa promesse
       (« tes relevés », « tes paiements ») est celle du titulaire, pas du collaborateur */
    var pt = document.querySelector('.porte-titre'), ps = document.querySelector('.porte-sous');
    if (pt) pt.textContent = 'Active ton accès';
    if (ps) ps.textContent = pa.nom + ' t’ouvre un accès ' + d.terme('collaborateur') + ' à l’app ' + app.nom + '.';
    hote.innerHTML = '<form class="pec-card pec-card--elevated pe-form" id="pe-act" novalidate autocomplete="off">'
      + '<p class="t">Crée ton mot de passe</p>'
      + '<p class="s">Toi seul·e le connaîtras : ' + esc(pa.nom || 'ton responsable') + ' ne le reçoit pas.</p>'
      + '<div class="pe-kv"><span class="l">Toi</span><span class="v">' + esc(v.nomAffiche) + '</span></div>'
      + '<div class="pe-kv"><span class="l">Ton identifiant</span><span class="v mono" id="pe-act-id">' + esc(c.identifiant) + '</span></div>'
      + (expiree ? '<p class="pe-err">Ce lien a expiré le ' + esc(quand(v.inviteExpireAt)) + ' : demande à ton responsable de te renvoyer l’accès.</p>'
        : '<label class="pec-input-label" for="pe-act-mdp" style="margin-top:12px">Mot de passe</label><input class="pec-input" id="pe-act-mdp" type="password" autocomplete="new-password" minlength="' + min + '" placeholder="••••••••••">'
        + '<p class="s" style="margin:5px 0 0">' + min + ' caractères minimum.</p>'
        + '<label class="pec-input-label" for="pe-act-mdp2">Confirme-le</label><input class="pec-input" id="pe-act-mdp2" type="password" autocomplete="new-password" minlength="' + min + '" placeholder="••••••••••">'
        + '<p class="pe-err" id="pe-act-err" role="alert" hidden></p>'
        + '<div class="btns"><button type="submit" class="pec-cta tap" id="pe-act-go">Activer mon accès</button></div>')
      + '</form>';
    if (expiree) return { ok: false, compte: c, expire: true };
    if (window.PEC_INSCRIPTION && PEC_INSCRIPTION.voirMdp) PEC_INSCRIPTION.voirMdp(hote);
    document.getElementById('pe-act').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('pe-act-err'); err.hidden = true;
      var m1 = document.getElementById('pe-act-mdp').value, m2 = document.getElementById('pe-act-mdp2').value;
      var r = d.collaborateurActiver(o.jeton, m1, m2);
      if (!r.ok) { err.hidden = false; err.textContent = r.motif; var ch = document.getElementById(r.champ === 'motdepasse2' ? 'pe-act-mdp2' : 'pe-act-mdp'); if (ch) ch.focus(); return; }
      if (o.onEntrer) o.onEntrer(r.compte, m1);
    });
    var f = document.getElementById('pe-act-mdp'); if (f) f.focus();
    return { ok: true, compte: c };
  }

  /* ══ ③ MON ACCÈS — ce que le collaborateur sait de son accès, et ce qu'il y fait seul ═════════════════════════════════════ */
  function monAcces(hote, o) {
    if (typeof hote === 'string') hote = document.getElementById(hote);
    var d = D(); if (!hote || !d) return null;
    styles();
    var c = o.compte; if (!c || !d.estCollaborateur(c)) { hote.innerHTML = '<div class="pe-vide">Aucun accès collaborateur ouvert sur cet appareil.</div>'; return null; }
    var v = d.collaborateur(c.id), pa = d._collabParentInfo(c.collab.type, c.collab.parentId) || {}, app = d.collaborateurApp(c), min = d.compteMdpMin(c.espace);
    var regle = c.collab.type === 'point'
      ? 'Tu vends au comptoir au nom de ' + pa.nom + ' : tu ne vois que tes ventes ; ' + pa.nom + ' voit tout ce qui se passe à son point.'
      : 'Tu fais connaître ' + pa.nom + ' avec tes propres liens : tu ne vois que ce que tu as produit ; ' + pa.nom + ' voit tout.';
    hote.innerHTML = '<div class="pec-card pe-form" style="margin-top:0">'
      + '<div class="pe-kv"><span class="l">Toi</span><span class="v">' + esc(v.nomAffiche) + '</span></div>'
      + '<div class="pe-kv"><span class="l">Pour</span><span class="v">' + esc(pa.nom || '—') + '</span></div>'
      + '<div class="pe-kv"><span class="l">Identifiant</span><span class="v mono">' + esc(c.identifiant) + '</span></div>'
      + '<div class="pe-kv"><span class="l">App</span><span class="v">' + esc(app.nom) + '</span></div>'
      + '<div class="pe-kv"><span class="l">Accès ouvert le</span><span class="v">' + esc(quand(c.valideAt || v.creeLe)) + '</span></div>'
      + '<div class="pe-kv"><span class="l">Ouvert par</span><span class="v">' + esc(v.creePar || pa.nom || '—') + '</span></div>'
      + '<p class="pe-regle">' + esc(regle) + '</p>'
      + '</div>'
      + '<form class="pec-card pec-card--elevated pe-form" id="pe-mdp" novalidate autocomplete="off">'
      + '<p class="t">Changer mon mot de passe</p>'
      + '<label class="pec-input-label" for="pe-mdp-actuel">Mot de passe actuel</label><input class="pec-input" id="pe-mdp-actuel" type="password" autocomplete="current-password">'
      + '<label class="pec-input-label" for="pe-mdp-nouveau">Nouveau mot de passe</label><input class="pec-input" id="pe-mdp-nouveau" type="password" autocomplete="new-password" minlength="' + min + '">'
      + '<p class="s" style="margin:5px 0 0">' + min + ' caractères minimum.</p>'
      + '<label class="pec-input-label" for="pe-mdp-nouveau2">Confirme-le</label><input class="pec-input" id="pe-mdp-nouveau2" type="password" autocomplete="new-password" minlength="' + min + '">'
      + '<p class="pe-err" id="pe-mdp-err" role="alert" hidden></p><p class="pe-ok" id="pe-mdp-ok" role="status" hidden></p>'
      + '<div class="btns"><button type="submit" class="pec-cta tap" id="pe-mdp-go">Enregistrer</button></div>'
      + '</form>'
      + '<button type="button" class="pec-btn-secondary tap pe-ouvrir" id="pe-sortir">' + ico('i-power') + ' Se déconnecter</button>';
    if (window.PEC_INSCRIPTION && PEC_INSCRIPTION.voirMdp) PEC_INSCRIPTION.voirMdp(hote);
    document.getElementById('pe-mdp').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('pe-mdp-err'), ok = document.getElementById('pe-mdp-ok'); err.hidden = true; ok.hidden = true;
      var n1 = document.getElementById('pe-mdp-nouveau').value, n2 = document.getElementById('pe-mdp-nouveau2').value;
      if (n1 !== n2) { err.hidden = false; err.textContent = 'Les deux nouveaux mots de passe ne correspondent pas.'; return; }
      var r = d.compteMotDePasseChanger(c.id, document.getElementById('pe-mdp-actuel').value, n1);
      if (!r.ok) { err.hidden = false; err.textContent = r.motif; return; }
      this.reset(); ok.hidden = false; ok.textContent = '✓ Mot de passe changé : il te connecte désormais.';
    });
    document.getElementById('pe-sortir').addEventListener('click', function () { if (o.onSortir) o.onSortir(); });
    return { compte: c };
  }

  window.PEC_EQUIPE = { gerer: gerer, activer: activer, monAcces: monAcces, feuille: feuille };
})();
