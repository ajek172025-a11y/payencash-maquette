/* ══ PEC_FIL — LE FIL DE L'ESPACE PARTENAIRE (10/09 — lot 5, constat F7) ════════════════════════════════════════
   Un espace qui fait tourner l'entreprise apprenait les choses en fouillant ses écrans — ou ne les apprenait pas.
   Le commerce du réseau (sédentaire ou nomade) a donc son fil : son dossier, son point, son argent, les réponses
   de la hotline.

   La dérivation des faits vit dans PEC_DATA.filPro('partenaire', pointId) (rien n'est stocké, seul lu / non-lu
   persiste, et par COMPTE) ; ce module ne fait que la mettre en page, et poser la cloche.

   API :
     PEC_FIL.rendre(hote, espace, id, opts)  → peint le fil dans `hote` (et le repeint sur le bus)
     PEC_FIL.pastille(el, espace, id)        → pose le compteur de non-lus sur une cloche
     PEC_FIL.cloche(hote, espace, id, href)  → crée le bouton-cloche (rond, pastille) et le branche
   ═════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var F = {};
  function D() { return window.PEC_DATA; }
  function esc(v) { return (window.PEC_DATA && PEC_DATA.esc) ? PEC_DATA.esc(v) : String(v == null ? '' : v); }   // (11/09) l'échappement du data-layer
  function quand(at) {
    var d = D(); if (d && d.depuis) return d.depuis(at);
    return new Date(at).toLocaleDateString('fr-FR');
  }

  /* La pastille : le NOMBRE de non-lus, jamais un point décoratif — on doit savoir s'il y en a un ou douze. */
  F.pastille = function (el, espace, id) {
    if (!el || !D() || !D().filProNonLues) return 0;
    var n = D().filProNonLues(espace, id);
    var b = el.querySelector('.pf-pastille');
    if (!n) { if (b) b.remove(); return 0; }
    if (!b) {
      b = document.createElement('span'); b.className = 'pf-pastille';
      b.setAttribute('style', 'position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#B3372B;color:#fff;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--color-card,#fff);font-variant-numeric:tabular-nums');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(b);
    }
    b.textContent = n > 99 ? '99+' : String(n);
    el.setAttribute('aria-label', n + ' notification' + (n > 1 ? 's' : '') + ' non lue' + (n > 1 ? 's' : ''));
    return n;
  };

  /* La cloche : un bouton rond posé dans un en-tête, qui ouvre le fil. Elle se repeint sur le bus — une
     notification qui arrive pendant qu'on regarde l'écran doit s'y voir. */
  F.cloche = function (hote, espace, id, href) {
    if (!hote) return null;
    var a = document.createElement('a');
    a.className = 'tap'; a.href = href; a.setAttribute('aria-label', 'Notifications');
    a.setAttribute('style', 'position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:var(--color-mint);color:var(--color-primary-dark);flex:none');
    a.innerHTML = '<svg class="pec-ico" viewBox="0 0 24 24" style="font-size:17px"><use href="#i-bell"/></svg>';
    hote.appendChild(a);
    var maj = function () { F.pastille(a, espace, id); };
    maj(); window.addEventListener('pec-bus', maj); window.addEventListener('storage', maj);
    return a;
  };

  F.rendre = function (hote, espace, id, opts) {
    if (!hote || !D() || !D().filPro) return function () {};
    opts = opts || {};
    var STYLE = 'pf-fil-style';
    if (!document.getElementById(STYLE)) {
      var st = document.createElement('style'); st.id = STYLE;
      st.textContent =
        '.pf-nt{border-radius:14px;background:var(--color-card,#fff);box-shadow:0 1px 4px rgba(15,42,36,.07);padding:12px 14px;margin-bottom:10px;display:block;text-decoration:none;color:inherit}' +
        '.pf-nt.urg{box-shadow:0 0 0 1.5px var(--color-amber-text,#B9791A),0 1px 4px rgba(15,42,36,.07)}' +
        '.pf-nt .h{display:flex;align-items:center;gap:10px}' +
        '.pf-nt .ic{flex:none;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--color-mint);color:var(--color-primary-dark)}' +
        '.pf-nt.urg .ic{background:var(--color-amber-well,#FDF1E7);color:var(--color-amber-text,#B9791A)}' +
        '.pf-nt .t{min-width:0;flex:1;font-size:14px;font-weight:800;color:var(--color-ink)}' +
        '.pf-nt .pt{flex:none;width:8px;height:8px;border-radius:999px;background:var(--color-primary)}' +
        '.pf-nt p{margin:7px 0 0;font-size:12.5px;line-height:1.5;color:var(--color-ink)}' +
        '.pf-nt .m{margin-top:6px;font-size:11px;color:var(--color-muted);display:flex;gap:8px;align-items:center;justify-content:space-between}' +
        '.pf-nt.lu{opacity:.72}.pf-nt.lu .t{font-weight:700;color:var(--color-muted)}' +
        '.pf-vide{padding:26px 16px;text-align:center;font-size:12.5px;color:var(--color-muted)}';
      document.head.appendChild(st);
    }
    function peindre() {
      var l = D().filPro(espace, id);
      var nonLus = l.filter(function (n) { return !n.lu; }).length;
      if (opts.sousTitre) opts.sousTitre.textContent = !l.length ? 'Rien à signaler pour l’instant.'
        : (nonLus ? nonLus + ' non lue' + (nonLus > 1 ? 's' : '') + ' sur ' + l.length : l.length + ' notification' + (l.length > 1 ? 's' : '') + ' · tout est lu');
      if (opts.toutLu) opts.toutLu.hidden = !nonLus;
      hote.innerHTML = l.length ? l.map(function (n) {
        var tag = n.href ? 'a' : 'div';
        return '<' + tag + ' class="pf-nt' + (n.lu ? ' lu' : '') + (n.urgent ? ' urg' : '') + '"' + (n.href ? ' href="' + esc(n.href) + '"' : '') + ' data-nt="' + esc(n.id) + '">' +
          '<span class="h"><span class="ic"><svg class="pec-ico" viewBox="0 0 24 24"><use href="#' + esc(n.icone || 'i-bell') + '"/></svg></span>' +
          '<span class="t">' + esc(n.titre) + '</span>' + (n.lu ? '' : '<span class="pt" aria-label="non lue"></span>') + '</span>' +
          '<p>' + esc(n.texte) + '</p>' +
          '<span class="m"><span>' + esc(quand(n.at)) + '</span>' + (n.action ? '<span style="font-weight:800;color:var(--color-primary-dark)">' + esc(n.action) + ' →</span>' : '') + '</span>' +
          '</' + tag + '>';
      }).join('') : '<div class="pf-vide"><b style="color:var(--color-ink)">Rien à signaler.</b><br>Ce fil se remplit tout seul : ton dossier, ton point, ton argent, les réponses de la hotline.</div>';
    }
    /* Ouvrir une notification la marque lue — comme un courrier qu'on ouvre. Le lien part APRÈS. */
    hote.addEventListener('click', function (ev) {
      var n = ev.target.closest('[data-nt]'); if (!n) return;
      D().filProLire(espace, id, [n.getAttribute('data-nt')]);
      if (n.tagName !== 'A') peindre();
    });
    if (opts.toutLu) opts.toutLu.addEventListener('click', function () { D().filProLire(espace, id); peindre(); });
    peindre();
    window.addEventListener('pec-bus', peindre); window.addEventListener('storage', peindre);
    return peindre;
  };

  /* ── LA CLOCHE SE POSE TOUTE SEULE ─────────────────────────────────────────────────────────────────────────
     Poser une cloche à la main sur chaque écran, c'était autant d'occasions de l'oublier. Le fil sait de quel
     espace il parle — il le déduit du chemin —, et l'identité vient de la même source que le reste de la page :
     le point de la session (PEC_PART.pointId).
     Sur la page du fil elle-même, et avant d'être entré (connexion, inscription), pas de cloche. */
  F.espaceDuChemin = function () {
    return /\/ui\/partenaire\//.test(String(location.pathname)) ? 'partenaire' : null;
  };
  F.identiteDe = function (espace) {
    if (espace !== 'partenaire') return null;
    return (window.PEC_PART && PEC_PART.pointId) ? PEC_PART.pointId() : null;
  };
  F.brancher = function () {
    var espace = F.espaceDuChemin(); if (!espace) return;
    var f = String(location.pathname).split('/').pop() || '';
    if (/connexion|inscription|notifications/.test(f)) return;
    if (document.getElementById('pec-cloche')) return;
    var sb = document.querySelector('.pec-statusbar'); if (!sb) return;
    var ic = sb.querySelector('.pec-sb-icons') || sb;
    var a = F.cloche(ic, espace, F.identiteDe(espace), '08-notifications.html');
    if (a) { a.id = 'pec-cloche'; a.style.width = '22px'; a.style.height = '22px'; a.style.marginLeft = '8px'; a.style.background = 'none'; a.style.color = 'inherit'; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', F.brancher); else F.brancher();

  window.PEC_FIL = F;
})();
