/* PayEnCash — FILTRES VIVANTS (kit, 21/08).
   Audit fondatrice : « beaucoup de pages ne filtrent rien » — des groupes role=tab /
   .pec-filter étaient purement décoratifs. Ce script rend n'importe quel groupe
   RÉELLEMENT filtrant par convention d'attributs, sans JS par écran :

   · Groupe FILTRANT : <div data-fscope=".selecteur"> avec boutons data-fval="x"
     → chaque élément visé porte data-ftag="a b c" ; il reste visible si son tag
     contient la valeur (data-fval="tous" montre tout). data-finit sur le groupe
     applique le bouton actif dès le chargement.
   · Groupe à PANES : <div data-fpanes> avec boutons data-pane="id"
     → montre le pane choisi, cache les autres.
   · CHAMP DE RECHERCHE : <input data-fsearch=".selecteur">
     → filtre les éléments par texte contenu (en plus du filtre actif).
   · data-fplaceholder="#champ" + boutons data-ph="…" → change le placeholder
     (sélecteur de mode de recherche).

   La bascule aria-pressed / aria-selected / .on est gérée dans tous les cas. */
(function () {
  function basculer(grp, b) {
    [].forEach.call(grp.children, function (x) {
      if (x.hasAttribute('aria-pressed')) x.setAttribute('aria-pressed', 'false');
      if (x.hasAttribute('aria-selected')) x.setAttribute('aria-selected', 'false');
      x.classList.remove('on');
    });
    if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'true');
    if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', 'true');
    b.classList.add('on');
  }

  function appliquer(grp, b) {
    if (grp.hasAttribute('data-fpanes')) {
      [].forEach.call(grp.querySelectorAll('[data-pane]'), function (x) {
        var p = document.getElementById(x.getAttribute('data-pane'));
        if (p) p.style.display = (x === b) ? '' : 'none';
      });
      return;
    }
    if (grp.hasAttribute('data-fplaceholder')) {
      var champ = document.querySelector(grp.getAttribute('data-fplaceholder'));
      if (champ && b.hasAttribute('data-ph')) { champ.placeholder = b.getAttribute('data-ph'); champ.value = ''; }
      return;
    }
    var scope = grp.getAttribute('data-fscope'), val = b.getAttribute('data-fval');
    if (!scope) return;
    var n = 0;
    [].forEach.call(document.querySelectorAll(scope), function (el) {
      var tags = (el.getAttribute('data-ftag') || '').split(/\s+/);
      var ok = (val === 'tous' || tags.indexOf(val) !== -1);
      delete el.dataset.fpg;   // (07/09) le filtre reprend la main sur la visibilité : la pagination ne doit pas ressusciter une ligne filtrée
      el.style.display = ok ? '' : 'none';
      if (ok) n++;
    });
    // état vide nommé (jamais une liste qui disparaît sans explication)
    var vide = document.querySelector('[data-fvide="' + scope.replace(/"/g, '') + '"]');
    if (vide) vide.style.display = n ? 'none' : '';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fval],[data-pane],[data-ph],[data-fset],[data-fpick] > *');
    if (!b) return;
    var grp = b.parentElement;
    if (!grp || !(grp.hasAttribute('data-fscope') || grp.hasAttribute('data-fpanes') || grp.hasAttribute('data-fplaceholder') || grp.hasAttribute('data-fpick'))) return;
    if (b.tagName === 'A') e.preventDefault();
    basculer(grp, b);
    appliquer(grp, b);
    // data-fset : le choix remplit des cibles ({"#sel":"texte", …}) — sous-titre,
    // libellé de bouton, aperçu… le contenu SUIT réellement la sélection.
    if (b.hasAttribute('data-fset')) {
      try {
        var m = JSON.parse(b.getAttribute('data-fset'));
        Object.keys(m).forEach(function (sel) {
          var c = document.querySelector(sel);
          if (c) { if ('value' in c && c.tagName === 'INPUT') c.value = m[sel]; else c.textContent = m[sel]; }
        });
      } catch (err) {}
    }
  });

  function appliquerRecherche(i, sansPage) {
    var q = i.value.trim().toLowerCase(), sel = i.getAttribute('data-fsearch'), nVis = 0;
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      if (el.hasAttribute('data-fvide-row')) return;
      if (el.dataset.fpg === '1') { el.style.display = ''; delete el.dataset.fpg; }   // la pagination rend la main
      if (!q) { if (el.dataset.fq === '1') { el.style.display = ''; delete el.dataset.fq; } }   // effacer rend ce que LA RECHERCHE avait caché…
      else if (el.style.display === 'none' && el.dataset.fq !== '1') { return; }               // …et le filtre actif garde la main sur le reste
      if (q) { var ok = el.textContent.toLowerCase().indexOf(q) !== -1; el.style.display = ok ? '' : 'none'; if (ok) delete el.dataset.fq; else el.dataset.fq = '1'; }
      if (el.style.display !== 'none') nVis++;
    });
    /* (07/09 — audit navigation « les barres de recherche doivent fonctionner ») une recherche qui vide la liste
       LE DIT : l'élément [data-fvide="<même sélecteur>"] s'affiche, avec le mot cherché. */
    var vide = document.querySelector('[data-fvide="' + sel.replace(/"/g, '') + '"]');
    // (09/09) data-fvide-defaut : le texte de repos revient dès que la recherche est effacée — les pages ne le recopient plus
    if (vide && !q && vide.hasAttribute('data-fvide-defaut')) vide.textContent = vide.getAttribute('data-fvide-defaut');
    if (vide) { vide.style.display = (q && !nVis) ? '' : 'none'; if (q && !nVis && vide.hasAttribute('data-fvide-txt')) vide.textContent = vide.getAttribute('data-fvide-txt').replace('%q', i.value.trim()); }
    if (!sansPage) paginerTout(true);
  }
  document.addEventListener('input', function (e) { var i = e.target.closest('[data-fsearch]'); if (i) appliquerRecherche(i, false); });
  /* (07/09 — audit navigation « recherche inerte ») les listes VIVANTES se redessinent (bus, polling 1,5 s) et
     perdaient la recherche saisie : après tout changement du DOM, les recherches non vides sont ré-appliquées
     (styles seulement — pas de nouvelle mutation, pas de boucle). */
  var __reappl = false;
  function reappliquerRecherches() {
    /* SYNCHRONE, pas différé : un onglet caché bride les minuteries à 1 s et ne rend aucune image — une
       liste redessinée y resterait non paginée et la recherche perdue jusqu'au retour au premier plan
       (vu au banc, document.hidden = true). La boucle est évitée à la source : l'observateur ignore ce que
       le kit écrit lui-même (nav de pagination, état vide, réordonnancement du tri). */
    if (__reappl) return; __reappl = true;
    try {
      // (08/09) les FILTRES actifs aussi : une liste redessinée par le bus perdait le filtre choisi
      [].forEach.call(document.querySelectorAll('[data-fscope]'), function (grp) {
        var b = [].filter.call(grp.children, function (x) { return x.classList.contains('on') || x.getAttribute('aria-pressed') === 'true'; })[0];
        if (b && b.getAttribute('data-fval')) appliquer(grp, b);   // « Toutes » compris : c'est lui qui pilote l'état vide
      });
      [].forEach.call(document.querySelectorAll('[data-fsearch]'), function (i) { if (i.value && i.value.trim()) appliquerRecherche(i, true); });
      paginerTout(false);
    } finally { __reappl = false; }
  }
  function mutationDuKit(m) {
    var t = m.target;
    if (t && t.nodeType === 1 && (t.closest('.pec-fpage') || t.hasAttribute('data-fvide'))) return true;
    for (var i = 0; i < m.addedNodes.length; i++) { var n = m.addedNodes[i]; if (n.nodeType === 1 && n.classList.contains('pec-fpage')) return true; }
    return false;
  }
  if (window.MutationObserver) new MutationObserver(function (ms) {
    for (var k = 0; k < ms.length; k++) { if ((ms[k].addedNodes.length || ms[k].removedNodes.length) && !mutationDuKit(ms[k])) { reappliquerRecherches(); return; } }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ── (07/09) PAGINATION & TRI par convention (audit navigation fondatrice) ──
     · <tbody data-fpage="15"> (ou tout conteneur) : 15 lignes visibles à la fois, nav « a–b sur T · ‹ › »
       posée juste après le tableau/la liste ; rendue à nouveau après chaque filtre, recherche ou rendu.
     · <select data-fsort="#conteneur"> dont les options valent « cle » ou « cle:desc » : trie les enfants
       par leur attribut data-s-<cle> (numérique si possible, sinon texte). */
  function paginer(cont, reset) {
    var n = parseInt(cont.getAttribute('data-fpage'), 10) || 0; if (!n) return;
    var rows = [].filter.call(cont.children, function (el) { return !el.hasAttribute('data-fvide-row'); });
    rows.forEach(function (el) { if (el.dataset.fpg === '1') { el.style.display = ''; delete el.dataset.fpg; } });
    var vis = rows.filter(function (el) { return el.style.display !== 'none'; });
    var pages = Math.max(1, Math.ceil(vis.length / n));
    var page = reset ? 0 : (parseInt(cont.getAttribute('data-fpage-cur') || '0', 10) || 0); if (page >= pages) page = pages - 1;
    cont.setAttribute('data-fpage-cur', page);
    vis.forEach(function (el, i) { if (i < page * n || i >= (page + 1) * n) { el.style.display = 'none'; el.dataset.fpg = '1'; } });
    // (24/09, nuit) une table posée dans une bande qui défile (.pec-table-defile) : la pagination va SOUS la bande, pas dedans
    var hote = cont.closest('.pec-table-defile') || cont.closest('table') || cont, nav = hote.nextElementSibling;
    if (!nav || !nav.classList.contains('pec-fpage')) { nav = document.createElement('nav'); nav.className = 'pec-fpage'; nav.setAttribute('aria-label', 'Pagination'); hote.insertAdjacentElement('afterend', nav); }
    if (pages <= 1) { nav.style.display = 'none'; return; }
    nav.style.display = '';
    /* (08/09 — fondatrice « fais du beau travail ») : pages NUMÉROTÉES (fenêtre de 5 autour de la courante, points de suspension),
       pastille pleine sur la page courante, flèches, et « a–b sur T » — la même nav pour toutes les apps */
    var nums = [], lo = Math.max(0, page - 2), hi = Math.min(pages - 1, page + 2);
    if (hi - lo < 4) { if (lo === 0) hi = Math.min(pages - 1, lo + 4); else if (hi === pages - 1) lo = Math.max(0, hi - 4); }
    if (lo > 0) { nums.push(0); if (lo > 1) nums.push(-1); }
    for (var pi = lo; pi <= hi; pi++) nums.push(pi);
    if (hi < pages - 1) { if (hi < pages - 2) nums.push(-1); nums.push(pages - 1); }
    nav.innerHTML = '<span class="pec-fpage-info">' + (page * n + 1) + '–' + Math.min(vis.length, (page + 1) * n) + ' sur ' + vis.length + '</span>' +
      '<span class="pec-fpage-nav">' +
      '<button type="button" class="tap" data-fpg="prev" aria-label="Page précédente"' + (page === 0 ? ' disabled' : '') + '>‹</button>' +
      nums.map(function (p) { return p < 0 ? '<span class="pec-fpage-dots">…</span>' : '<button type="button" class="tap' + (p === page ? ' on' : '') + '" data-fpg="p:' + p + '"' + (p === page ? ' aria-current="page"' : '') + '>' + (p + 1) + '</button>'; }).join('') +
      '<button type="button" class="tap" data-fpg="next" aria-label="Page suivante"' + (page >= pages - 1 ? ' disabled' : '') + '>›</button></span>';
    nav.__cont = cont;
  }
  function paginerTout(reset) { [].forEach.call(document.querySelectorAll('[data-fpage]'), function (c) { paginer(c, reset); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fpg]'); if (!b) return;
    var nav = b.closest('.pec-fpage'), cont = nav && nav.__cont; if (!cont) return;
    var cur = parseInt(cont.getAttribute('data-fpage-cur') || '0', 10) || 0;
    var k = b.getAttribute('data-fpg');
    cont.setAttribute('data-fpage-cur', k === 'next' ? cur + 1 : k === 'prev' ? Math.max(0, cur - 1) : (parseInt(k.slice(2), 10) || 0));
    paginer(cont, false);
    (cont.closest('table') || cont).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-fval]')) setTimeout(function () { paginerTout(true); }, 0); });
  function trier(sel) {
    var cont = document.querySelector(sel.getAttribute('data-fsort')); if (!cont || !sel.value) return;
    var k = sel.value.split(':')[0], desc = sel.value.split(':')[1] === 'desc';
    var rows = [].filter.call(cont.children, function (el) { return !el.hasAttribute('data-fvide-row'); });
    rows.sort(function (a, b) {
      var va = a.getAttribute('data-s-' + k) || '', vb = b.getAttribute('data-s-' + k) || '';
      var na = parseFloat(String(va).replace(',', '.')), nb = parseFloat(String(vb).replace(',', '.'));
      var r = (isFinite(na) && isFinite(nb)) ? na - nb : String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' });
      return desc ? -r : r;
    });
    // déjà dans l'ordre → rien à déplacer (sinon la réinsertion déclencherait l'observateur, qui retrierait : boucle)
    var deja = rows.every(function (el, i) { return cont.children[i] === el; });
    if (!deja) {
      cont.__tri = true; rows.forEach(function (el) { cont.appendChild(el); });
      setTimeout(function () { cont.__tri = false; }, 0);   // l'observateur est asynchrone : le drapeau doit lui survivre
    }
    paginer(cont, true);
  }
  document.addEventListener('change', function (e) { var s = e.target.closest('[data-fsort]'); if (s) trier(s); });
  /* (07/09) TRI PAR EN-TÊTE : <table data-fsortable> — cliquer un <th> trie le corps sur cette colonne
     (numérique si les cellules le sont, sinon texte), un second clic inverse ; aria-sort le dit. */
  function valCell(tr, i) { var td = tr.children[i]; var t = td ? (td.getAttribute('data-s') || td.textContent || '').trim() : ''; var n = parseFloat(t.replace(/\s/g, '').replace(',', '.')); return { t: t, n: (/^-?[\d\s]+([.,]\d+)?\s*(€|%)?$/.test(t) && isFinite(n)) ? n : null }; }
  document.addEventListener('click', function (e) {
    var th = e.target.closest('th'); if (!th) return;
    var table = th.closest('table[data-fsortable]'); if (!table || e.target.closest('input, button, select, a')) return;
    var tbody = table.tBodies[0]; if (!tbody) return;
    var idx = [].indexOf.call(th.parentElement.children, th), desc = th.getAttribute('aria-sort') === 'ascending';
    [].forEach.call(th.parentElement.children, function (x) { x.removeAttribute('aria-sort'); x.style.cursor = 'pointer'; });
    th.setAttribute('aria-sort', desc ? 'descending' : 'ascending');
    var rows = [].filter.call(tbody.children, function (el) { return !el.hasAttribute('data-fvide-row'); });
    rows.sort(function (a, b) { var va = valCell(a, idx), vb = valCell(b, idx); var r = (va.n !== null && vb.n !== null) ? va.n - vb.n : va.t.localeCompare(vb.t, 'fr', { sensitivity: 'base', numeric: true }); return desc ? -r : r; });
    tbody.__tri = true; rows.forEach(function (el) { tbody.appendChild(el); }); setTimeout(function () { tbody.__tri = false; }, 0);
    paginer(tbody, true);
  });
  [].forEach.call(document.querySelectorAll('table[data-fsortable] th'), function (th) { th.style.cursor = 'pointer'; th.title = th.title || 'Trier sur cette colonne'; });
  function observer() {
    [].forEach.call(document.querySelectorAll('[data-fpage], [data-fsort]'), function (el) {
      var cont = el.hasAttribute('data-fsort') ? document.querySelector(el.getAttribute('data-fsort')) : el;
      if (!cont || cont.__fobs) return; cont.__fobs = true;
      new MutationObserver(function () {
        if (cont.__tri) return;
        var s = document.querySelector('[data-fsort="#' + cont.id + '"]');
        if (s && s.value) trier(s); else paginer(cont, false);
      }).observe(cont, { childList: true });   // trier() ne réinsère que si l'ordre change, et lève __tri le temps de l'observation
    });
  }
  (function () {   // (07/09) le style des champs de recherche et de la nav de pagination — une fois, pour toutes les apps
    if (document.getElementById('pec-filters-style')) return;
    var st = document.createElement('style'); st.id = 'pec-filters-style';
    st.textContent = 'input[data-fsearch]{display:block;width:100%;box-sizing:border-box;border:1px solid var(--color-sep,#D8E0DC);border-radius:12px;padding:10px 12px;font:inherit;font-size:13px;background:var(--color-surface,#fff);color:inherit;outline:none}input[data-fsearch]:focus{border-color:var(--color-primary,#2F9E6B);box-shadow:0 0 0 3px rgba(47,158,107,.15)}' +
      '.pec-fpage{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:7px 8px 7px 12px;border-radius:14px;background:var(--color-surface,#fff);border:1px solid var(--color-sep,#D8E0DC)}' +
      '.pec-fpage-info{font-size:11.5px;font-weight:600;color:var(--color-muted,#6b7a75);white-space:nowrap}.pec-fpage-nav{display:flex;align-items:center;gap:3px}' +
      '.pec-fpage-nav button{min-width:30px;height:30px;padding:0 8px;border:0;border-radius:999px;background:transparent;font:inherit;font-size:12.5px;font-weight:700;color:var(--color-ink,#0f2a24);cursor:pointer;transition:background .12s}' +
      '.pec-fpage-nav button.on{background:var(--color-primary,#2F9E6B);color:#fff}.pec-fpage-nav button[disabled]{opacity:.35;cursor:not-allowed}.pec-fpage-nav button:not([disabled]):not(.on):hover{background:var(--color-mint,#e6f4ee)}' +
      '.pec-fpage-dots{font-size:12px;color:var(--color-muted,#6b7a75);padding:0 2px}';
    document.head.appendChild(st);
  })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { observer(); paginerTout(false); }); else { observer(); paginerTout(false); }

  // ACTION CONFIRMÉE (audit précision 21/08 : plus aucun bouton qui ne répond pas) :
  // tout élément [data-done="✓ …"] : au clic, son libellé devient la confirmation
  // et il se fige — le geste a une réponse, toujours.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-done]');
    if (!b) return;
    e.preventDefault();
    b.textContent = b.getAttribute('data-done');
    b.style.pointerEvents = 'none';
    b.style.opacity = '.85';
  });

  // filtre initial (l'écran s'ouvre déjà filtré sur le bouton actif)
  document.addEventListener('DOMContentLoaded', function () {
    [].forEach.call(document.querySelectorAll('[data-finit]'), function (grp) {
      var actif = grp.querySelector('[aria-pressed="true"],[aria-selected="true"],.on');
      if (actif) appliquer(grp, actif);
    });
  });
})();
