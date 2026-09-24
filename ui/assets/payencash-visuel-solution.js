/* =============================================================================
   PAYENCASH SOLUTION — LE VISUEL ET LA VIDÉO D'UN ARTICLE DE MARQUE
   (23/09, fondatrice : « dans Outils je veux un éditeur visuel pour générer · publier un article pas à pas ·
   ça doit générer à la fin un visuel et un aperçu de stock · ça doit
   aussi générer une vidéo courte de 10 secondes · sur chaque design, le logo PayEnCash Solution, valoriser
   l'esprit de sa marque, les informations à lui · PayEnCash est une solution de sa boutique · sur les visuels
   ça doit afficher les tailles disponibles par leur quantité · il peut appliquer une remise : prix affiché
   barré moins remise avec ce bon d'achat, ou sinon “faites un cadeau à vous ou à vos proches”, pas de remise »)

   L'OBJET DESSINÉ : l'article d'une MARQUE — son prix à elle, sa remise à elle, ses tailles, son site — et les
   mentions de son bon d'achat. L'encodeur de flashcode (PEC_QR) est partagé pour de bon.

   CE QUI EST ÉCRIT NE VIENT QUE DE L'ARTICLE ET DU RÉFÉRENTIEL : la marque, le modèle, le prix, la remise
   s'il y en a une, les tailles avec LEUR quantité, l'adresse du lien, et les mentions légales du bon.
   Aucun texte inventé, aucun rabais supposé : sans remise, le visuel ne barre aucun prix.

   VOCABULAIRE (règle ACPR rappelée le 23/09 : « une erreur coûte plus qu'une absence d'information ») —
   ce qui est vendu est un BON D'ACHAT utilisable uniquement chez la marque qui l'émet (réseau limité,
   art. L521-3 I 1° CMF). Jamais « carte prépayée », « compte », « recharge », « monnaie », « cagnotte ».
   ============================================================================= */
(function () {
  'use strict';
  var L = 1080, H = 1350, VIDEO_SECONDES = 10;   // le format story, et « une vidéo courte de 10 secondes » (fondatrice)
  var ENCRE = '#0F2A24', VIF = '#3FD99B', BLANC = '#FFFFFF', GRIS = '#B9CCC4';
  function D() { return window.PEC_DATA; }
  function police(w, t) { return w + ' ' + t + 'px -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'; }

  /* ══ NOTRE LOGO SUR CHAQUE DESSIN (fondatrice : « sur chaque design, le logo PayEnCash Solution ») ═══════════════
     Le symbole de l'app (le même fichier que l'en-tête des écrans, via logosBase) est chargé UNE fois, puis dessiné à
     côté de la marque écrite comme partout (pay·En·Cash + SOLUTION). Une image qui « salit » la toile (ouverte en
     fichier local, le navigateur refuse alors l'export) est écartée dès le chargement : mieux vaut le nom seul qu'un
     visuel qui ne se télécharge plus. */
  var LOGO = null, LOGO_ETAT = 'vierge';   // vierge | en_cours | ok | absent
  function chargerLogo(cb) {
    cb = cb || function () {};
    if (LOGO_ETAT === 'ok' || LOGO_ETAT === 'absent') { cb(LOGO); return; }
    if (LOGO_ETAT === 'en_cours') { setTimeout(function () { chargerLogo(cb); }, 60); return; }
    var d = D();
    if (!d || !d.logosBase) { LOGO_ETAT = 'absent'; cb(null); return; }
    LOGO_ETAT = 'en_cours';
    var im = new Image();
    im.onload = function () {
      try { var cv = document.createElement('canvas'); cv.width = 2; cv.height = 2; cv.getContext('2d').drawImage(im, 0, 0, 2, 2); cv.toDataURL(); LOGO = im; LOGO_ETAT = 'ok'; }
      catch (e) { LOGO = null; LOGO_ETAT = 'absent'; }
      cb(LOGO);
    };
    im.onerror = function () { LOGO = null; LOGO_ETAT = 'absent'; cb(null); };
    im.src = d.logosBase() + 'payencash-solution-symbole.webp';
  }

  /* LA MARQUE, ÉCRITE COMME DANS LES EN-TÊTES (pay·En·Cash, le « En » en vert, puis SOLUTION), alignée à droite sur
     `xr`, la ligne de base en `y` ; le symbole à sa gauche s'il a pu être chargé. Rend la largeur occupée. */
  function marque(x, xr, y, nom) {
    var sfx = String(nom || '').replace(/^PayEnCash\s*/i, '').toUpperCase();
    var parts = [{ t: 'pay', c: BLANC, f: police('800', 34) }, { t: 'En', c: VIF, f: police('800', 34) }, { t: 'Cash', c: BLANC, f: police('800', 34) }];
    if (sfx) parts.push({ t: '  ' + sfx, c: GRIS, f: police('700', 18) });
    var larg = 0;
    parts.forEach(function (p) { x.font = p.f; p.w = x.measureText(p.t).width; larg += p.w; });
    var x0 = xr - larg;
    x.textAlign = 'left';
    parts.forEach(function (p) { x.font = p.f; x.fillStyle = p.c; x.fillText(p.t, x0, y); x0 += p.w; });
    if (LOGO) { try { x.drawImage(LOGO, xr - larg - 54, y - 36, 44, 44); } catch (e) {} }
    return larg;
  }

  /* LES DEUX PRIX — celui qui est écrit gros, et celui qu'on barre quand il y a une remise. */
  function prix(a) {
    var d = D(), rem = +a.remise || 0, net = Math.round((a.prix - rem) * 100) / 100;
    return { plein: a.prix, remise: rem, net: net,
      pleinTxt: d.eur(a.prix), netTxt: d.eur(net), remiseTxt: d.eur(rem) };
  }

  /* LES TAILLES AVEC LEUR QUANTITÉ — telles qu'elle les a déclarées, et seulement celles qui restent.
     Une taille à zéro n'est pas « bientôt » : elle n'est pas là, et on ne l'écrit pas. */
  function taillesTxt(a) {
    var st = D().techArticleStock(a);
    var l = (st.tailles || []).filter(function (t) { return t.qte > 0; });
    if (!l.length) return '';
    return l.map(function (t) { return t.taille + ' (' + t.qte + ')'; }).join('  ·  ');
  }

  /* LE FLASHCODE, DESSINÉ DANS LA TOILE — pas un SVG posé à côté : l'image doit se télécharger entière.
     On lit la matrice de l'encodeur du projet (PEC_QR) et on peint ses modules. */
  function flashcode(x, url, gx, gy, taille) {
    if (!window.PEC_QR || !PEC_QR.matrix) return false;
    var m;
    try { m = PEC_QR.matrix(url, 'M'); } catch (e) { return false; }
    var n = m.length, marge = 4, pas = taille / (n + marge * 2);
    x.fillStyle = BLANC; x.fillRect(gx, gy, taille, taille);
    x.fillStyle = '#0B1F1A';
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      if (m[i][j]) x.fillRect(gx + (j + marge) * pas, gy + (i + marge) * pas, Math.ceil(pas), Math.ceil(pas));
    }
    return true;
  }

  /* LE TEXTE QUI TIENT DANS SA COLONNE — on coupe aux mots, jamais au milieu d'un nom. */
  function lignes(x, mot, large, max) {
    var out = [], cur = '';
    String(mot || '').split(' ').forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (x.measureText(t).width > large) { if (cur) out.push(cur); cur = w; } else cur = t;
    });
    if (cur) out.push(cur);
    return out.slice(0, max || 2);
  }

  /* ══ LE DESSIN — 1080 × 1350 (format story). `t` va de 0 à 1 : à 1 tout est peint (le visuel fixe), en
     dessous les éléments entrent l'un après l'autre (la vidéo de dix secondes). ══ */
  function dessiner(x, a, photo, t) {
    var d = D(), R = d.techRef(), m = d.techMarchand(a.marchandId) || {}, p = prix(a);
    t = (t == null) ? 1 : Math.max(0, Math.min(1, t));
    var ap = function (d0, l0) { return Math.max(0, Math.min(1, (t - d0) / l0)); };   // apparition : début, longueur

    x.fillStyle = ENCRE; x.fillRect(0, 0, L, H);
    if (photo) {
      /* LE ZOOM LENT de la vidéo : la photo grandit de 6 % sur les dix secondes. Sur le visuel fixe (t = 1),
         il n'y a pas de mouvement — c'est la même image, au repos. */
      var z = 1 + 0.06 * t;
      try {
        var r = Math.max(L / photo.width, (H * 0.72) / photo.height) * z;
        var w = photo.width * r, h = photo.height * r;
        x.drawImage(photo, (L - w) / 2, (H * 0.72 - h) / 2, w, h);
      } catch (e) {}
    }
    var g = x.createLinearGradient(0, H * 0.40, 0, H);
    g.addColorStop(0, 'rgba(15,42,36,0)'); g.addColorStop(.45, 'rgba(15,42,36,.93)'); g.addColorStop(1, ENCRE);
    x.fillStyle = g; x.fillRect(0, H * 0.36, L, H * 0.64);

    /* LE BLOC DU HAUT SE MESURE AVANT DE SE DESSINER (23/09, soir — audit : avec une phrase d'esprit ET des tailles, les
       tailles venaient s'écrire SUR la ligne de remise). Marque, modèle (≤ 2 lignes), esprit (≤ 2 lignes), tailles :
       on calcule sa hauteur, et on le pose pour qu'il s'arrête au-dessus du prix — plus haut sur la photo s'il le faut. */
    x.font = police('800', 76); var lModele = lignes(x, a.modele, 640, 2);
    x.font = police('500 italic', 27); var lEsprit = a.esprit ? lignes(x, a.esprit, 640, 2) : [];
    var tt = taillesTxt(a);
    var haut = 86 + lModele.length * 84 + 14 + (lEsprit.length ? 8 + lEsprit.length * 34 : 0) + (tt ? 82 : 0);
    var y = Math.min(H - 545, (H - 232 - 44 - 48) - haut);   // la ligne de remise (ou de cadeau) est à H − 276 ; 48 px d'air au-dessus
    /* ① LA MARQUE ET LE MODÈLE — c'est SON nom qui ouvre l'image, pas le nôtre. */
    x.globalAlpha = ap(0, .18);
    x.fillStyle = VIF; x.font = police('700', 34);
    x.fillText(String(a.marque || m.raisonSociale || '').toUpperCase(), 72, y);
    x.fillStyle = BLANC; x.font = police('800', 76);
    lModele.forEach(function (l, i) { x.fillText(l, 72, y + 86 + i * 84); });
    x.globalAlpha = 1;

    /* ② L'ESPRIT DE LA MARQUE — sa phrase, si elle en a écrit une. Rien d'inventé à sa place. */
    var yb = y + 86 + lModele.length * 84 + 14;
    if (lEsprit.length) {
      x.globalAlpha = ap(.18, .18);
      x.fillStyle = GRIS; x.font = police('500 italic', 27);
      lEsprit.forEach(function (l, i) { x.fillText(l, 72, yb + 8 + i * 34); });
      x.globalAlpha = 1;
      yb += 8 + lEsprit.length * 34;
    }

    /* ③ LES TAILLES AVEC LEUR QUANTITÉ — ce que le client peut réellement obtenir aujourd'hui. */
    if (tt) {
      x.globalAlpha = ap(.3, .18);
      x.fillStyle = VIF; x.font = police('800', 22);
      x.fillText('TAILLES DISPONIBLES', 72, yb + 46);
      x.fillStyle = BLANC; x.font = police('700', 29);
      x.fillText(tt, 72, yb + 82);
      x.globalAlpha = 1;
    }

    /* ④ LE PRIX. Avec remise : la ligne verte, le prix net en grand, l'ancien barré à côté.
          Sans remise : le prix seul, et l'invitation au cadeau — jamais un faux rabais.
          La remise est LA SIENNE (elle l'a fixée à la publication) : elle ne porte pas notre nom. */
    x.globalAlpha = ap(.42, .2);
    var yp = H - 232;
    if (p.remise > 0) {
      x.fillStyle = VIF; x.font = police('800', 31);
      x.fillText('Remise de ' + p.remiseTxt + ' avec ce bon d’achat', 72, yp - 44);
      x.fillStyle = BLANC; x.font = police('800', 92);
      x.fillText(p.netTxt, 72, yp + 42);
      var wn = x.measureText(p.netTxt).width;
      x.fillStyle = GRIS; x.font = police('700', 42);
      x.fillText(p.pleinTxt, 72 + wn + 26, yp + 42);
      var wp = x.measureText(p.pleinTxt).width;
      x.strokeStyle = GRIS; x.lineWidth = 4;
      x.beginPath(); x.moveTo(72 + wn + 22, yp + 27); x.lineTo(72 + wn + 30 + wp, yp + 27); x.stroke();
    } else {
      x.fillStyle = BLANC; x.font = police('800', 92);
      x.fillText(p.pleinTxt, 72, yp + 42);
      x.fillStyle = VIF; x.font = police('700', 29);
      x.fillText('Fais un cadeau — à toi, ou à tes proches.', 72, yp - 40);
    }
    x.globalAlpha = 1;

    /* ⑤ CE QUE C'EST, OÙ ÇA S'ACHÈTE, OÙ ÇA VAUT. Court, exact : un bon d'achat de SA boutique, qui s'achète au
          comptoir d'un commerce du réseau — le client n'y paie pas l'article, il y achète le bon. */
    x.globalAlpha = ap(.55, .2);
    x.fillStyle = VIF; x.font = police('800', 30);
    x.fillText('Bon d’achat ' + (a.marque || m.raisonSociale || ''), 72, H - 152);
    x.fillStyle = BLANC; x.font = police('800', 27);
    x.fillText('à acheter chez un commerce du réseau', 72, H - 116);
    x.fillStyle = GRIS; x.font = police('600', 23);
    x.fillText('valable uniquement sur ' + (m.siteUrl || 'son site'), 72, H - 84);
    x.globalAlpha = 1;

    /* ⑥ LE FLASHCODE ET SON ADRESSE EN CLAIR — une image ne se clique pas, l'adresse doit se lire. */
    x.globalAlpha = ap(.66, .2);
    var url = d.techArticleUrl(a.slug), c = 226, cx = L - c - 72, cy = H - 500;
    if (flashcode(x, url, cx, cy, c)) {
      x.fillStyle = VIF; x.font = police('800', 21); x.textAlign = 'center';
      x.fillText('Scanne, ou tape', cx + c / 2, cy + c + 32);
      x.fillStyle = BLANC; x.font = police('700', 17);
      x.fillText(String(url).replace(/^https?:\/\//, ''), cx + c / 2, cy + c + 56);
      x.textAlign = 'left';
    }
    x.globalAlpha = 1;

    /* ⑦ NOTRE MARQUE — le logo et le nom écrits comme partout, et le slogan du référentiel dessous. Rien d'inventé :
          « solution de paiement » serait un mot de prestataire de services de paiement, et nous n'en sommes pas un. */
    x.globalAlpha = ap(.78, .22);
    marque(x, L - 72, H - 116, R.nom);
    x.textAlign = 'right';
    x.fillStyle = GRIS; x.font = police('600', 19);
    x.fillText(d.slogan ? d.slogan() : '', L - 72, H - 88);
    x.textAlign = 'left';
    x.globalAlpha = 1;
    /* L'ÉPUISÉ NE SE DIT PAS SUR L'IMAGE : les tailles à zéro n'y sont déjà plus écrites, et l'écran le dit en pastille. */
  }

  /* CHARGER LA PHOTO — et ne jamais faire semblant : si elle ne vient pas, on rend l'image SANS elle et
     l'appelant le DIT (`avecPhoto` faux). Un fond vert reste lisible ; une image muette, non. */
  function photo(a, cb) {
    /* une photo d'article est déposée (embarquée) ou donnée par son adresse : un nom de fichier nu ne désigne rien ici */
    var src = /^(https?:|data:|blob:)/.test(String(a.photo || '')) ? a.photo : '';
    if (!src) { cb(null); return; }
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () { cb(im); };
    im.onerror = function () { cb(null); };
    im.src = src;
  }

  function composer(a, opts, cb) {
    opts = opts || {};
    if (!D() || !a) { cb(null, false); return; }
    chargerLogo(function () { photo(a, function (im) {
      var cv = document.createElement('canvas'); cv.width = L; cv.height = H;
      var x = cv.getContext('2d');
      dessiner(x, a, im, 1);
      var url = null;
      try { url = cv.toDataURL('image/png'); } catch (e) { url = null; }
      cb(url, !!im);
    }); });
  }

  /* ══ LA VIDÉO DE DIX SECONDES ═════════════════════════════════════════════════════════════════════════
     Enregistrée depuis la toile (`captureStream` + `MediaRecorder`) : aucune bibliothèque, aucun serveur.
     Le navigateur qui ne sait pas enregistrer le DIT — on ne rend pas un fichier vide. Le mouvement est
     volontairement sobre : un zoom lent sur la photo, les blocs qui entrent l'un après l'autre. ══ */
  function video(a, opts, cb) {
    opts = opts || {};
    var secondes = opts.secondes || VIDEO_SECONDES;
    if (typeof MediaRecorder === 'undefined') { cb(null, 'Ce navigateur ne sait pas enregistrer de vidéo (MediaRecorder absent).'); return; }
    chargerLogo(function () { photo(a, function (im) {
      var cv = document.createElement('canvas'); cv.width = L; cv.height = H;
      var x = cv.getContext('2d'), flux, rec;
      try { flux = cv.captureStream(25); } catch (e) { cb(null, 'Ce navigateur ne sait pas filmer une toile.'); return; }
      var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
      var type = types.filter(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } })[0];
      try { rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined); } catch (e2) { cb(null, 'Ce navigateur refuse l’enregistrement (' + (e2.message || '') + ').'); return; }
      var bouts = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) bouts.push(e.data); };
      rec.onstop = function () {
        var b = new Blob(bouts, { type: type || 'video/webm' });
        cb(b.size ? URL.createObjectURL(b) : null, b.size ? null : 'L’enregistrement est revenu vide.', b);
      };
      var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      rec.start();
      (function boucle() {
        var now = (window.performance && performance.now) ? performance.now() : Date.now();
        var t = (now - t0) / (secondes * 1000);
        dessiner(x, a, im, Math.min(1, t * 1.25));   // tout est en place aux quatre cinquièmes, puis la pose
        if (t >= 1) { try { rec.stop(); } catch (e3) {} return; }
        requestAnimationFrame(boucle);
      })();
    }); });
  }

  function nomFichier(a, ext) {
    return 'payencash-solution-' + (a.slug || a.id) + '.' + (ext || 'png');
  }
  function telecharger(url, nom) {
    if (!url) return false;
    var el = document.createElement('a'); el.href = url; el.download = nom;
    document.body.appendChild(el); el.click(); el.remove();
    return true;
  }
  /* LA LÉGENDE À POSTER — c'est ELLE qui porte le lien cliquable : aucune plateforme ne lit une adresse
     dessinée dans une image. On donne les deux, et on ne promet pas le contraire. */
  function legende(a) {
    var d = D(), m = d.techMarchand(a.marchandId) || {}, p = prix(a);
    return (a.modele || '') + ' — ' + (p.remise > 0 ? p.netTxt + ' avec ce bon d’achat (au lieu de ' + p.pleinTxt + ')' : p.pleinTxt)
      + '. Ton bon d’achat ' + (a.marque || m.raisonSociale || '') + ' s’achète chez un commerçant du réseau : '
      + d.techArticleUrl(a.slug);
  }

  /* LE LOGO SE CHARGE DÈS L'ARRIVÉE DU MODULE : l'aperçu de l'éditeur (qui appelle `dessiner` sans attendre) le
     trouve prêt le temps d'arriver à la dernière étape. */
  chargerLogo();

  window.PEC_VSOL = { LARGEUR: L, HAUTEUR: H, VIDEO_SECONDES: VIDEO_SECONDES, composer: composer, video: video, dessiner: dessiner,
    logo: chargerLogo, telecharger: telecharger, nomFichier: nomFichier, legende: legende, prix: prix, taillesTxt: taillesTxt };
})();
