/* ══ PAYENCASH SOLUTION — LE BOUTON « BON D'ACHAT DE LA MARQUE » (19/09, nuit ; 23/09 : vocabulaire) ═════════
   Décision fondatrice : « lorsque le e-commerce l'ajoute, il doit automatiquement avoir la page avec Comment tu
   paies : tu as un bon, chez un partenaire, un agent se déplace — c'est notre marque de fabrique. »
   (23/09, fondatrice : « attention au vocabulaire juridique ») CE N'EST PAS UN WIDGET DE PAIEMENT : PayEnCash n'est
   pas un moyen de paiement. Le bouton PROPOSE au client un bon d'achat DE LA MARQUE, du montant de sa commande ;
   le client l'achète dans un point de vente ou auprès d'un distributeur nomade, et l'utilise chez la marque.

   CE QUE LE COMMERÇANT COLLE CHEZ LUI, et rien d'autre :
     <script src="…/ui/tech/payencash-tech-widget.js"></script>
     <div data-payencash="pk_…" data-montant="49.90" data-commande="CMD-2026-001"></div>

   CE QUE ÇA FAIT : un bouton « Bon d'achat {marque} » à côté de ses moyens de paiement ; au clic, une fenêtre
   qui montre NOTRE page du bon proposé pour cette commande.
   (21/09, fondatrice : « lorsqu'il clique sur PayEnCash Technologie, la modale qui s'ouvre doit être celle
   COMMENT PAYER, en sachant que c'est pour la boutique connectée ») LA FENÊTRE NE REFAIT PAS LE CHOIX : elle
   montre, dans un cadre, la page du bon proposé pour CETTE commande (07-lien). (24/09, nuit — fondatrice : « enlève en
   ligne ; s'il a un code, il déclare avoir un bon, sinon où acheter un bon ») : « J'ai un bon » — son code, contrôlé puis
   confirmé, couvre la commande —, sinon « Où l'acheter » : un point de vente, ou un distributeur nomade qui se déplace.
   Le cadre est la façon ordinaire d'intégrer une page tierce : notre page reste la nôtre — notre marque, nos règles —
   et le code se saisit chez nous, jamais dans la page de la marque (elle n'en reçoit qu'un aperçu voilé).

   CE QUE ÇA NE FAIT PAS, ET NE FERA JAMAIS : encaisser. Aucun champ de carte, aucun montant qui transite,
   aucun appel de paiement. Le client achète son bon dans un point de vente ou à un distributeur nomade (qui en
   reçoit le prix pour son propre compte) et le pose sur sa commande ; la page de la marque est prévenue quand sa
   commande est couverte — c'est son serveur qui vérifie, avec sa clé secrète.

   LE MONTANT SUIT LE PANIER (24/09, nuit) : quand le total change (quantité, code promo), la page met à jour
   data-montant — ou data-commande — et le bouton se redessine seul, sans rien d'autre à appeler.

   LE BLOC « BON D'ACHAT » D'UN PIED DE PAGE (24/09, nuit — fondatrice : « un outil à insérer sur chaque pied de page ou
   autre d'une marque, qui aide à ouvrir la page client et à choisir son montant ») :
     <div data-payencash-bon="pk_…"></div>            (data-fond="sombre" sur un pied de page foncé)
   Le titre, les mentions du bon, où il s'achète, « Choisir mon montant » (notre page de son lien de vente, dans un nouvel
   onglet) et son flashcode pour qui lit sur un ordinateur — le même bloc que le site hébergé (techBlocBon).

   LA CLÉ PUBLIQUE SUFFIT, et ne peut rien d'autre : elle identifie la marque et ouvre le bon proposé de SA
   commande (un par référence — rouvrir la fenêtre le retrouve). La clé secrète ne doit JAMAIS figurer dans
   une page — le bouton ne la lit pas, ne la demande pas, et refuse de fonctionner avec.
   ═══════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.PEC_DATA;
  /* NOTRE PAGE VIT À CÔTÉ DE CE FICHIER : son adresse se déduit de celle du script, jamais d'une valeur écrite. */
  var ICI = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^/]*$/, '') : '';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  function eur(v) { return D && D.eur ? D.eur(v) : (Math.round(v * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }

  /* LES STYLES DU WIDGET sont posés UNE fois et portent tous un préfixe : il vit dans la page de quelqu'un
     d'autre, il n'a pas à lui imposer quoi que ce soit ni à hériter de ses règles par accident. */
  function styles() {
    if (document.getElementById('pect-css')) return;
    var s = document.createElement('style');
    s.id = 'pect-css';
    s.textContent = [
      '.pect-btn{display:flex;align-items:center;gap:10px;width:100%;border:1.5px solid #cfe0d8;border-radius:14px;background:#fff;padding:13px 14px;cursor:pointer;font:inherit;text-align:left}',
      '.pect-btn:hover{border-color:#10a06a}',
      '.pect-btn:focus-visible{outline:2px solid #0c7f54;outline-offset:2px}',
      '.pect-btn .pect-ic{flex:none;display:block;width:34px;height:34px}',
      '.pect-btn .pect-ic img{display:block;width:100%;height:100%;object-fit:contain}',
      /* le nom est du TEXTE en ligne : en inline-flex, chaque morceau (pay · En · Cash) devenait une case, et
         l'écart de la boîte s'intercalait entre eux — « pay En Cash » (21/09) */
      '.pect-mk{display:inline;font-weight:800;font-size:14px;color:#0f2a24}',
      '.pect-mk em{font-style:normal;color:#10a06a}',
      '.pect-btn small{display:block;font-size:11.5px;line-height:1.45;color:#5d7570;margin-top:2px}',
      /* (20/09, soir — décision fondatrice : « ça doit être TOUJOURS LA MÊME ANIMATION ») LA MÊME OUVERTURE
         QUE NOS ÉCRANS : le fond se voile, la feuille monte de douze pixels. Les images sont RECOPIÉES ici
         — ce widget vit dans la page d'un commerçant, il n'a pas notre feuille de style et ne doit rien lui
         demander — mais la courbe et les durées sont celles du socle (pecVoile / pecModale), au millième. */
      '@keyframes pectVoile{from{opacity:0}to{opacity:1}}',
      '@keyframes pectModale{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}',
      '@media (prefers-reduced-motion:reduce){@keyframes pectModale{from{opacity:0}to{opacity:1}}}',
      '.pect-scrim{position:fixed;inset:0;z-index:2147483000;background:rgba(15,42,36,.5);display:flex;align-items:center;justify-content:center;padding:18px;animation:pectVoile .18s ease-out both}',
      /* LE CADRE A LA TAILLE D'UN ÉCRAN DE TÉLÉPHONE : c'est une page de nos applications qui s'y affiche. */
      '.pect-mod{position:relative;width:100%;max-width:420px;height:min(760px,92vh);background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(15,42,36,.4);animation:pectModale .24s cubic-bezier(.22,.8,.3,1) both}',
      '.pect-mod iframe{display:block;width:100%;height:100%;border:0}',
      '.pect-x{position:absolute;top:9px;right:10px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:none;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 2px 8px rgba(15,42,36,.2);font-size:21px;line-height:1;color:#0f2a24;cursor:pointer}',
      '.pect-x:focus-visible{outline:2px solid #0c7f54;outline-offset:2px}',
      /* SUR UN TÉLÉPHONE, LA FENÊTRE MONTE DU BAS et prend l'écran : c'est la forme qu'on y attend. */
      '@media (max-width:480px){.pect-scrim{padding:0;align-items:flex-end}.pect-mod{max-width:none;height:94vh;border-radius:22px 22px 0 0}}',
      '.pect-msg{margin:9px 0 0;font-size:12px;line-height:1.5;border-radius:12px;padding:10px 12px}',
      '.pect-msg.ko{background:#fdecea;color:#8e2a1e;font-weight:700}',
      /* LE BLOC DU PIED DE PAGE — la couleur de la marque (sa vitrine) sur le bouton, le texte choisi pour rester lisible dessus */
      '.pect-bon{--pect-m:#0f2a24;--pect-mt:#fff;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;background:#fff;border:1px solid #e3e9e6;border-radius:16px;padding:18px 20px;color:#1b2a24;text-align:left;box-sizing:border-box}',
      '.pect-bon-h{display:block;font-size:18px;line-height:1.25;font-weight:800;letter-spacing:-.01em}',
      '.pect-bon p{margin:7px 0 0;font-size:12.5px;line-height:1.6;color:#5d7570}',
      '.pect-bon-a{display:inline-block;margin-top:12px;border-radius:999px;background:var(--pect-m);color:var(--pect-mt);padding:11px 18px;font-weight:800;font-size:14px;line-height:1.2;text-decoration:none}',
      '.pect-bon-a:focus-visible{outline:2px solid #0c7f54;outline-offset:2px}',
      '.pect-bon-sig{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:12px;font-size:11px;color:#5d7570}',
      '.pect-bon-sig img{display:block;width:16px;height:16px}',
      '.pect-bon-sig .pect-mk{font-size:11.5px}',
      '.pect-bon-q svg{display:block;width:112px;height:112px}',
      '.pect-bon--sombre{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2);color:#fff}',
      '.pect-bon--sombre p,.pect-bon--sombre .pect-bon-sig{color:rgba(255,255,255,.78)}',
      '.pect-bon--sombre .pect-mk{color:#fff}',
      '.pect-bon--sombre .pect-bon-q{background:#fff;border-radius:10px;padding:5px}',
      /* sur un téléphone, on lit ET on achète sur le même écran : le flashcode, fait pour passer d'un ordinateur au téléphone, se retire */
      '@media (max-width:560px){.pect-bon{grid-template-columns:1fr}.pect-bon-q{display:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function marque() { return '<span class="pect-mk">pay<em>En</em>Cash <span style="font-weight:700">Solution</span></span>'; }
  /* LA MARQUE D'UNE CLÉ PUBLIQUE — la seule chose que la page donne ; une clé révoquée ne désigne plus personne */
  function marqueParCle(pk) {
    try { return (D.techMarchands() || []).filter(function (x) { return (D.techCles(x.id) || []).some(function (c) { return c.clePublique === pk && !c.revoqueLe; }); })[0] || null; } catch (e) { return null; }
  }
  /* LE TEXTE SUR LA COULEUR DE LA MARQUE — sa clarté relative (WCAG) décide : l'encre sur une couleur claire, le blanc sur une foncée */
  function texteSur(hex) {
    var c = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!c) return '#fff';
    var n = parseInt(c[1], 16), v = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) > 0.2 ? '#0f2a24' : '#fff';
  }
  /* (21/09, fondatrice : « intègre le logo sur PayEnCash Technologie ; tu utilises le P avec le shop ») LE SYMBOLE
     DE LA MARQUE — le P au sac — remplace le bouclier dessiné ici. Il est servi par NOUS, à côté de notre page de
     bon proposé (même dossier que ce script, `ICI`) : la page de la marque n'a rien à héberger. */
  var SYMBOLE = '<img src="' + ICI + '../assets/logos/payencash-solution-symbole.webp" alt="" width="34" height="34">';

  /* ══ LA FENÊTRE — notre page du bon proposé, dans un cadre ═══════════════════════════════════════════ */
  function ouvrir(ctx) {
    var r = D.techLienPourCommande({ marchandId: ctx.marchand.id, montant: ctx.montant, reference: ctx.commande });
    if (!r.ok) {
      /* ON NE MONTRE PAS UNE FENÊTRE VIDE : le refus se dit sous le bouton, avec son motif. */
      var e = ctx.hote.querySelector('.pect-msg') || document.createElement('div');
      e.className = 'pect-msg ko'; e.textContent = r.motif;
      ctx.hote.appendChild(e);
      return;
    }
    var retour = document.activeElement;
    var scrim = document.createElement('div');
    scrim.className = 'pect-scrim';
    scrim.setAttribute('role', 'dialog');
    scrim.setAttribute('aria-modal', 'true');
    scrim.setAttribute('aria-label', 'Bon d’achat ' + ctx.marchand.raisonSociale + ' — PayEnCash Solution');
    var mod = document.createElement('div');
    mod.className = 'pect-mod';
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'pect-x'; x.setAttribute('aria-label', 'Fermer'); x.innerHTML = '&times;';
    var f = document.createElement('iframe');
    f.className = 'pect-frame';
    f.title = 'Ton bon d’achat ' + ctx.marchand.raisonSociale + ' — PayEnCash Solution';
    f.src = ICI + '07-lien.html?l=' + encodeURIComponent(r.lien.slug) + '&integre=1';
    mod.appendChild(x); mod.appendChild(f); scrim.appendChild(mod);
    document.body.appendChild(scrim);
    var origine = null;
    try { origine = new URL(f.src, location.href).origin; } catch (e2) {}

    function fermer() {
      window.removeEventListener('message', surMessage);
      document.removeEventListener('keydown', surTouche);
      scrim.remove();
      if (retour && retour.focus) retour.focus();
    }
    function surTouche(e) { if (e.key === 'Escape') fermer(); }
    /* ON N'ÉCOUTE QUE NOTRE CADRE : même fenêtre, même origine. Et ce qu'il dit est une information pour le
       tunnel de la marque, pas une preuve — son serveur vérifie le bon proposé avec sa clé secrète. */
    function surMessage(e) {
      if (e.source !== f.contentWindow || e.origin !== origine) return;
      var m = e.data || {};
      if (m.source !== 'payencash-solution') return;
      if (m.type === 'fermer') { fermer(); return; }
      /* (23/09) « COUVERT », pas « payé » : la commande de la marque est couverte par ses bons — nous n'avons rien
         réglé, nous le lui disons. */
      if (m.type === 'couvert') {
        try {
          ctx.hote.dispatchEvent(new CustomEvent('payencash:couvert', { bubbles: true,
            detail: { commande: m.commande, montant: m.montant, bons: m.bons || [], offre: m.offre, marchand: m.marchand } }));
        } catch (e3) {}
      }
    }
    window.addEventListener('message', surMessage);
    document.addEventListener('keydown', surTouche);
    x.addEventListener('click', fermer);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) fermer(); });
    x.focus();
  }

  /* ══ LE MONTAGE — un bouton par emplacement déclaré ══════════════════════════════════════════════════ */
  function monter(hote) {
    if (hote.getAttribute('data-pect-monte') === '1') return;
    hote.setAttribute('data-pect-monte', '1');
    var pk = hote.getAttribute('data-payencash') || '';
    var montant = Math.round((parseFloat(String(hote.getAttribute('data-montant') || '').replace(',', '.')) || 0) * 100) / 100;
    var commande = hote.getAttribute('data-commande') || null;

    /* LA CLÉ SECRÈTE N'A RIEN À FAIRE DANS UNE PAGE : si on en voit une, on refuse net et on le dit. */
    if (/^sk_/.test(pk)) {
      hote.innerHTML = '<div class="pect-msg ko">Clé SECRÈTE dans la page : PayEnCash Solution refuse de démarrer. '
        + 'Utilise ta clé publique (pk_…) ici, et garde la clé secrète sur ton serveur.</div>';
      return;
    }
    var m = marqueParCle(pk);
    if (!m) {
      hote.innerHTML = '<div class="pect-msg ko">Clé publique inconnue ou révoquée — vérifie-la dans ton espace PayEnCash Solution.</div>';
      return;
    }
    if (!(montant > 0)) {
      hote.innerHTML = '<div class="pect-msg ko">Aucun montant (data-montant) — le bouton ne s’affiche pas.</div>';
      return;
    }
    if (!commande) {
      hote.innerHTML = '<div class="pect-msg ko">Aucune référence de commande (data-commande) — c’est elle qui retrouve le bon proposé.</div>';
      return;
    }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pect-btn';
    b.innerHTML = '<span class="pect-ic">' + SYMBOLE + '</span><span style="min-width:0;flex:1">' + marque()
      /* (21/09) le slogan unifié (ref.marque.slogan), puis ce que le bouton propose — un bon d'achat de CETTE marque */
      + '<small>' + esc(D.slogan ? D.slogan() : '') + ' · bon d’achat ' + esc(m.raisonSociale) + '</small></span>'
      + '<span style="flex:none;font-weight:800;font-size:13.5px">' + esc(eur(montant)) + '</span>';
    b.addEventListener('click', function () { ouvrir({ marchand: m, montant: montant, commande: commande, hote: hote }); });
    hote.innerHTML = '';
    hote.appendChild(b);
  }

  /* ══ LE BLOC « BON D'ACHAT » — un emplacement de pied de page (ou d'ailleurs) ═══════════════════════════════════════ */
  function flashcode(z, url) {
    if (!z) return;
    var poser = function () { try { z.innerHTML = window.PEC_QR.svg(url, { size: 112 }); } catch (e) { z.hidden = true; } };
    if (window.PEC_QR && window.PEC_QR.svg) { poser(); return; }
    /* l'encodeur vit à côté de nos pages : la page de la marque n'a rien à charger de plus */
    var s = document.createElement('script');
    s.src = ICI + '../assets/payencash-qr.js';
    s.onload = poser; s.onerror = function () { z.hidden = true; };
    document.head.appendChild(s);
  }
  function monterBloc(hote) {
    if (hote.getAttribute('data-pect-monte') === '1') return;
    hote.setAttribute('data-pect-monte', '1');
    var pk = hote.getAttribute('data-payencash-bon') || '';
    if (/^sk_/.test(pk)) {
      hote.innerHTML = '<div class="pect-msg ko">Clé SECRÈTE dans la page : PayEnCash Solution refuse de démarrer. '
        + 'Utilise ta clé publique (pk_…) ici, et garde la clé secrète sur ton serveur.</div>';
      return;
    }
    var m = marqueParCle(pk);
    if (!m) { hote.innerHTML = '<div class="pect-msg ko">Clé publique inconnue ou révoquée — vérifie-la dans ton espace PayEnCash Solution.</div>'; return; }
    var b = D.techBlocBon ? D.techBlocBon(m.id, { base: ICI }) : { ok: false, motif: 'Le bloc « bon d’achat » n’est pas disponible dans cette version.' };
    if (!b.ok) { hote.innerHTML = '<div class="pect-msg ko">' + esc(b.motif) + '</div>'; return; }
    var coul = b.couleur ? '--pect-m:' + esc(b.couleur) + ';--pect-mt:' + texteSur(b.couleur) : '';
    hote.innerHTML = '<div class="pect-bon' + (hote.getAttribute('data-fond') === 'sombre' ? ' pect-bon--sombre' : '') + '"' + (coul ? ' style="' + coul + '"' : '') + '>'
      + '<div><b class="pect-bon-h">' + esc(b.titre) + '</b>'
      + '<p>' + esc(b.mentions) + '</p><p>' + esc(b.ou) + '</p>'
      + '<a class="pect-bon-a" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + esc(b.cta) + '</a>'
      + '<span class="pect-bon-sig"><img src="' + ICI + '../assets/logos/payencash-solution-symbole.webp" alt="">' + marque() + '<span>· ' + esc(D.slogan ? D.slogan() : '') + '</span></span></div>'
      + '<div class="pect-bon-q" role="img" aria-label="Flashcode : choisir le montant de mon bon ' + esc(b.marque) + '"></div></div>';
    flashcode(hote.querySelector('.pect-bon-q'), b.url);
  }

  function demarrer() {
    if (!window.PEC_DATA || !window.PEC_DATA.techLienPourCommande) {
      /* SANS LE DATA-LAYER, ON NE FAIT PAS SEMBLANT : le widget le dit à l'intégrateur, dans sa page. */
      [].forEach.call(document.querySelectorAll('[data-payencash],[data-payencash-bon]'), function (h) {
        h.textContent = 'PayEnCash Solution : la couche de données n’est pas chargée sur cette page.';
      });
      return;
    }
    D = window.PEC_DATA;
    styles();
    [].forEach.call(document.querySelectorAll('[data-payencash]'), function (h) {
      monter(h);
      /* LE MONTANT SUIT LE PANIER : un attribut changé redessine le bouton — le montage suivant relit tout, clé comprise */
      if (window.MutationObserver) new MutationObserver(function () { h.removeAttribute('data-pect-monte'); monter(h); })
        .observe(h, { attributes: true, attributeFilter: ['data-payencash', 'data-montant', 'data-commande'] });
    });
    [].forEach.call(document.querySelectorAll('[data-payencash-bon]'), function (h) {
      monterBloc(h);
      if (window.MutationObserver) new MutationObserver(function () { h.removeAttribute('data-pect-monte'); monterBloc(h); })
        .observe(h, { attributes: true, attributeFilter: ['data-payencash-bon', 'data-fond'] });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
