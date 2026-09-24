/* PEC_QR — encodeur QR Code (Model 2) VANILLA, sans aucune librairie externe.
   Fondatrice 29/08 : « il nous faut du VRAI » — le QR encode la RÉFÉRENCE réelle
   de la commande (issue du bus/table) ; un scan photo la ressort telle quelle.
   Rien de figé : `PEC_QR.svg(ref)` prend la réf du data-layer → le jour où la
   vraie base fournit la réf, le même générateur l'encode, zéro changement.

   Implémentation : mode OCTET (UTF-8), niveaux de correction L/M/Q/H, sélection
   automatique de version (1→10, ~271 octets à L : très au-delà d'une réf/URL),
   Reed-Solomon sur GF(256), placement des motifs (repères, timing, alignement,
   format, version), 8 masques + pénalité → meilleur.
   Vérifié : Reed-Solomon confronté au vecteur d'exemple ISO/IEC 18004
   (« 01234567 », 1-M) + round-trip de la réf (décodage → texte d'origine).
   Référence algorithme : ISO/IEC 18004 (domaine public). */
(function () {
  'use strict';

  // ── GF(256) : logarithmes / exponentielles (primitif 0x11d) ────────────────
  var EXP = new Array(256), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    EXP[255] = EXP[0];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[(LOG[a] + LOG[b]) % 255]; }

  // Diviseur Reed-Solomon de degré `degree` : les `degree` coefficients du
  // polynôme générateur réduit (le coefficient de tête 1 est implicite).
  // Vérifié contre le vecteur ISO/IEC 18004 (« 01234567 », 1-M).
  function rsGenPoly(degree) {
    var result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    var root = 1;
    for (var i = 0; i < degree; i++) {
      for (var j = 0; j < degree; j++) {
        result[j] = gmul(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = gmul(root, 2);
    }
    return result;
  }
  // Codewords de correction d'erreur pour un bloc de données.
  function rsEncode(data, degree) {
    var gen = rsGenPoly(degree);
    var result = new Array(degree).fill(0);
    for (var k = 0; k < data.length; k++) {
      var factor = data[k] ^ result[0];
      result.shift(); result.push(0);
      for (var j = 0; j < degree; j++) result[j] ^= gmul(gen[j], factor);
    }
    return result;
  }

  // ── Tables ISO/IEC 18004 ───────────────────────────────────────────────────
  // Capacité en codewords de DONNÉES par [version][niveau L,M,Q,H].
  var DATA_CW = [null,
    [19,16,13,9],[34,28,22,16],[55,44,34,26],[80,64,48,36],[108,86,62,46],
    [136,108,76,60],[156,124,88,66],[194,154,110,86],[232,182,132,100],[274,216,154,122],
    [324,254,180,140],[370,290,206,158],[428,334,244,180],[461,365,261,197],[523,415,295,223],
    [589,453,325,253],[647,507,367,283],[721,563,397,313],[795,627,445,341],[861,669,485,385],
    [932,714,512,406],[1006,782,568,442],[1094,860,614,464],[1174,914,664,514],[1276,1000,718,538],
    [1370,1062,754,596],[1468,1128,808,628],[1531,1193,871,661],[1631,1267,911,701],[1735,1373,985,745],
    [1843,1455,1033,793],[1955,1541,1115,845],[2071,1631,1171,901],[2191,1725,1231,961],[2306,1812,1286,986],
    [2434,1914,1354,1054],[2566,1992,1426,1096],[2702,2102,1502,1142],[2812,2216,1582,1222],[2956,2334,1666,1276]];
  // Codewords EC par bloc, et nb de blocs (groupe1, groupe2) par [version][niveau].
  // Format : [ecPerBlock, g1Blocks, g1DataCw, g2Blocks, g2DataCw] — ISO/IEC 18004
  // Table 9. Validé au chargement (voir plus bas) contre DATA_CW. Versions 1→10
  // (v10-L = 271 octets : très au-delà d'une réf/URL de commande).
  var ECB = [null,
    [[7,1,19,0,0],[10,1,16,0,0],[13,1,13,0,0],[17,1,9,0,0]],
    [[10,1,34,0,0],[16,1,28,0,0],[22,1,22,0,0],[28,1,16,0,0]],
    [[15,1,55,0,0],[26,1,44,0,0],[18,2,17,0,0],[22,2,13,0,0]],
    [[20,1,80,0,0],[18,2,32,0,0],[26,2,24,0,0],[16,4,9,0,0]],
    [[26,1,108,0,0],[24,2,43,0,0],[18,2,15,2,16],[22,2,11,2,12]],
    [[18,2,68,0,0],[16,4,27,0,0],[24,4,19,0,0],[28,4,15,0,0]],
    [[20,2,78,0,0],[18,4,31,0,0],[18,2,14,4,15],[26,4,13,1,14]],
    [[24,2,97,0,0],[22,2,38,2,39],[22,4,18,2,19],[26,4,14,2,15]],
    [[30,2,116,0,0],[22,3,36,2,37],[20,4,16,4,17],[24,4,12,4,13]],
    [[18,2,68,2,69],[26,4,43,1,44],[24,6,19,2,20],[28,6,15,2,16]]];
  // Positions des centres des motifs d'alignement par version.
  var ALIGN = [null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
    [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],
    [6,30,58,86],[6,34,62,90]];
  var ECC = { L: 0, M: 1, Q: 2, H: 3 };

  // Bits de format (niveau+masque) et de version, pré-calculés BCH.
  var FMT = { L:['111011111000100','111001011110011','111110110101010','111100010011101','110011000101111','110001100011000','110110001000001','110100101110110'],
              M:['101010000010010','101000100100101','101111001111100','101101101001011','100010111111001','100000011001110','100111110010111','100101010100000'],
              Q:['011010101011111','011000001101000','011111100110001','011101000000110','010010010110100','010000110000011','010111011011010','010101111101101'],
              H:['001011010001001','001001110111110','001110011100111','001100111010000','000011101100010','000001001010101','000110100001100','000100000111011'] };
  var VER = [null,null,null,null,null,null,null,'000111110010010100','001000010110111100','001001101010011001',
    '001010010011010011','001011101111110110','001100011101100010','001101100001000111','001110011000001101','001111100100101000',
    '010000101101111000','010001010001011101','010010101000010111','010011010100110010','010100100110100110'];

  // ── Encodage des données (mode octet) ──────────────────────────────────────
  function bytesUtf8(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
      else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
    }
    return out;
  }

  // AUTO-VALIDATION (chargement) : chaque bloc EC doit reconstituer EXACTEMENT le
  // nombre de codewords de données de DATA_CW — un tableau incohérent = QR invalide.
  (function () {
    for (var v = 1; v < ECB.length; v++) for (var l = 0; l < 4; l++) {
      var s = ECB[v][l], sum = s[1] * s[2] + s[3] * s[4];
      if (sum !== DATA_CW[v][l]) throw 'PEC_QR: table EC incohérente v' + v + ' niveau ' + l + ' (' + sum + '≠' + DATA_CW[v][l] + ')';
    }
  })();

  function chooseVersion(len, eccLvl) {
    for (var v = 1; v < ECB.length; v++) {   // bornée à la couverture ECB (1→10)
      var cap = DATA_CW[v][eccLvl];
      var ccBits = v < 10 ? 8 : 16;                // mode octet : 8 bits (v1→9), 16 bits (v10)
      var need = 4 + ccBits + len * 8;             // indicateur mode + compteur + données
      if (need <= cap * 8) return v;
    }
    throw 'PEC_QR: donnée trop longue (max ~' + (DATA_CW[ECB.length - 1][eccLvl]) + ' octets à ce niveau)';
  }

  function buildCodewords(text, eccLvl) {
    var data = bytesUtf8(text);
    var v = chooseVersion(data.length, eccLvl);
    var totalDataCw = DATA_CW[v][eccLvl];
    var ccBits = v < 10 ? 8 : 16;
    // flux de bits : 0100 (octet) + compteur + octets
    var bits = [];
    function push(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    push(0x4, 4); push(data.length, ccBits);
    for (var i = 0; i < data.length; i++) push(data[i], 8);
    // terminateur (max 4 bits) puis alignement octet
    var cap = totalDataCw * 8;
    var term = Math.min(4, cap - bits.length); push(0, term);
    while (bits.length % 8 !== 0) bits.push(0);
    // octets de remplissage 0xEC / 0x11 alternés
    var pad = [0xEC, 0x11], pi = 0;
    while (bits.length < cap) { push(pad[pi], 8); pi ^= 1; }
    // regroupement en codewords
    var dataCw = [];
    for (var b = 0; b < bits.length; b += 8) { var byte = 0; for (var k = 0; k < 8; k++) byte = (byte << 1) | bits[b + k]; dataCw.push(byte); }

    // découpe en blocs + Reed-Solomon
    var spec = ECB[v][eccLvl]; // [ecPerBlock, g1Blocks, g1Cw, g2Blocks, g2Cw]
    var ecPerBlock = spec[0], g1n = spec[1], g1cw = spec[2], g2n = spec[3], g2cw = spec[4];
    var blocks = [], pos = 0, ci;
    for (ci = 0; ci < g1n; ci++) { blocks.push(dataCw.slice(pos, pos + g1cw)); pos += g1cw; }
    for (ci = 0; ci < g2n; ci++) { blocks.push(dataCw.slice(pos, pos + g2cw)); pos += g2cw; }
    var ecBlocks = blocks.map(function (blk) { return rsEncode(blk, ecPerBlock); });
    // entrelacement des données puis des EC
    var maxData = Math.max(g1cw, g2cw), out = [];
    for (ci = 0; ci < maxData; ci++) for (var bl = 0; bl < blocks.length; bl++) if (ci < blocks[bl].length) out.push(blocks[bl][ci]);
    for (ci = 0; ci < ecPerBlock; ci++) for (var bl2 = 0; bl2 < ecBlocks.length; bl2++) out.push(ecBlocks[bl2][ci]);
    return { version: v, codewords: out };
  }

  // ── Construction de la matrice de modules ──────────────────────────────────
  function makeMatrix(version, eccLvl, codewords) {
    var size = version * 4 + 17;
    var m = [], reserved = [];
    for (var r = 0; r < size; r++) { m.push(new Array(size).fill(0)); reserved.push(new Array(size).fill(false)); }
    function set(r, c, v) { m[r][c] = v ? 1 : 0; reserved[r][c] = true; }

    // repères de position (3 coins) + séparateurs
    function finder(r0, c0) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var rr = r0 + r, cc = c0 + c; if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        var inner = (r >= 0 && r <= 6 && c >= 0 && c <= 6) &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        set(rr, cc, inner ? 1 : 0);
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    // motifs de synchronisation (timing)
    for (var i = 8; i < size - 8; i++) { if (!reserved[6][i]) set(6, i, i % 2 === 0 ? 1 : 0); if (!reserved[i][6]) set(i, 6, i % 2 === 0 ? 1 : 0); }

    // motifs d'alignement
    var ap = ALIGN[version] || [];
    for (var a = 0; a < ap.length; a++) for (var b = 0; b < ap.length; b++) {
      var ar = ap[a], ac = ap[b];
      if (reserved[ar][ac]) continue; // chevauche un repère
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
        var on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        set(ar + dr, ac + dc, on ? 1 : 0);
      }
    }

    // module sombre + zones de format réservées
    set(size - 8, 8, 1);
    for (var k = 0; k <= 8; k++) { if (!reserved[8][k]) reserved[8][k] = true; if (!reserved[k][8]) reserved[k][8] = true; }
    for (var k2 = 0; k2 < 8; k2++) { reserved[8][size - 1 - k2] = true; reserved[size - 1 - k2][8] = true; }
    // zones d'info de version (v ≥ 7)
    if (version >= 7) for (var vr = 0; vr < 6; vr++) for (var vc = 0; vc < 3; vc++) { reserved[vr][size - 11 + vc] = true; reserved[size - 11 + vc][vr] = true; }

    // placement des bits de données/EC en zigzag (bas-droite → haut)
    var bitStr = [];
    for (var ci = 0; ci < codewords.length; ci++) for (var bit = 7; bit >= 0; bit--) bitStr.push((codewords[ci] >> bit) & 1);
    var idx = 0, upward = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5; // saute la colonne de timing
      for (var row = 0; row < size; row++) {
        var rr = upward ? size - 1 - row : row;
        for (var cc = 0; cc < 2; cc++) {
          var c2 = col - cc;
          if (reserved[rr][c2]) continue;
          m[rr][c2] = idx < bitStr.length ? bitStr[idx] : 0; idx++;
        }
      }
      upward = !upward;
    }

    // masques + pénalité
    function maskFn(k) {
      return [
        function (r, c) { return (r + c) % 2 === 0; },
        function (r, c) { return r % 2 === 0; },
        function (r, c) { return c % 3 === 0; },
        function (r, c) { return (r + c) % 3 === 0; },
        function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
        function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
        function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
        function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
      ][k];
    }
    function applyFormat(mat, mask) {
      var bitsF = FMT[Object.keys(ECC)[eccLvl]][mask];
      // horizontale (haut-gauche + haut-droite) et verticale
      for (var i = 0; i < 15; i++) {
        var bit = bitsF[i] === '1' ? 1 : 0;
        // positions standard ISO 18004 pour les 15 bits de format
        var posA = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]][i];
        var posB = [[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],[8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]][i];
        mat[posA[0]][posA[1]] = bit; mat[posB[0]][posB[1]] = bit;
      }
    }
    function applyVersion(mat) {
      if (version < 7) return;
      var vb = VER[version];
      for (var i = 0; i < 18; i++) {
        var bit = vb[17 - i] === '1' ? 1 : 0; // bits de poids faible d'abord
        var r = Math.floor(i / 3), c = i % 3;
        mat[r][size - 11 + c] = bit; mat[size - 11 + c][r] = bit;
      }
    }
    function penalty(mat) {
      var n = size, score = 0, r, c, i;
      // règle 1 : séries de 5+ même couleur (lignes & colonnes)
      for (r = 0; r < n; r++) { var run = 1; for (c = 1; c < n; c++) { if (mat[r][c] === mat[r][c-1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; } else run = 1; } }
      for (c = 0; c < n; c++) { var run2 = 1; for (r = 1; r < n; r++) { if (mat[r][c] === mat[r-1][c]) { run2++; if (run2 === 5) score += 3; else if (run2 > 5) score++; } else run2 = 1; } }
      // règle 2 : blocs 2x2
      for (r = 0; r < n-1; r++) for (c = 0; c < n-1; c++) if (mat[r][c] === mat[r][c+1] && mat[r][c] === mat[r+1][c] && mat[r][c] === mat[r+1][c+1]) score += 3;
      // règle 3 : motif 1:1:3:1:1 (repère-like)
      var pat1 = [1,0,1,1,1,0,1,0,0,0,0], pat2 = [0,0,0,0,1,0,1,1,1,0,1];
      function match(arr, off, pat) { for (var k = 0; k < pat.length; k++) if (arr[off+k] !== pat[k]) return false; return true; }
      for (r = 0; r < n; r++) { var rowArr = mat[r]; for (c = 0; c <= n-11; c++) { if (match(rowArr, c, pat1) || match(rowArr, c, pat2)) score += 40; } }
      for (c = 0; c < n; c++) { var colArr = []; for (r = 0; r < n; r++) colArr.push(mat[r][c]); for (r = 0; r <= n-11; r++) { if (match(colArr, r, pat1) || match(colArr, r, pat2)) score += 40; } }
      // règle 4 : proportion de modules sombres
      var dark = 0; for (r = 0; r < n; r++) for (c = 0; c < n; c++) dark += mat[r][c];
      var pct = dark * 100 / (n*n); score += Math.floor(Math.abs(pct - 50) / 5) * 10;
      return score;
    }

    var best = null, bestScore = Infinity, bestMask = 0;
    for (var mk = 0; mk < 8; mk++) {
      var trial = m.map(function (row) { return row.slice(); });
      var fn = maskFn(mk);
      for (var r2 = 0; r2 < size; r2++) for (var c2b = 0; c2b < size; c2b++) if (!reserved[r2][c2b] && fn(r2, c2b)) trial[r2][c2b] ^= 1;
      applyFormat(trial, mk); applyVersion(trial);
      var sc = penalty(trial);
      if (sc < bestScore) { bestScore = sc; best = trial; bestMask = mk; }
    }
    return best;
  }

  // ── API publique ───────────────────────────────────────────────────────────
  function matrix(text, eccName) {
    var eccLvl = ECC[(eccName || 'M').toUpperCase()]; if (eccLvl == null) eccLvl = ECC.M;
    var built = buildCodewords(String(text), eccLvl);
    return makeMatrix(built.version, eccLvl, built.codewords);
  }

  function svg(text, opts) {
    opts = opts || {};
    var m = matrix(text, opts.ecc || 'M');
    var n = m.length, margin = opts.margin == null ? 4 : opts.margin;
    var total = n + margin * 2;
    var dark = opts.color || '#0f2a24', light = opts.background || '#ffffff';
    var px = opts.size ? (opts.size / total) : 1; // taille CSS gérée en dehors par viewBox
    var rects = '';
    for (var r = 0; r < n; r++) { var run = -1; for (var c = 0; c < n; c++) {
      if (m[r][c]) { if (run < 0) run = c; }
      else if (run >= 0) { rects += '<rect x="' + (margin + run) + '" y="' + (margin + r) + '" width="' + (c - run) + '" height="1"/>'; run = -1; }
    } if (run >= 0) rects += '<rect x="' + (margin + run) + '" y="' + (margin + r) + '" width="' + (n - run) + '" height="1"/>'; }
    var wh = opts.size ? (' width="' + opts.size + '" height="' + opts.size + '"') : '';
    return '<svg xmlns="http://www.w3.org/2000/svg"' + wh + ' viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img" aria-label="Code QR ' + String(text).replace(/"/g, '') + '">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
      '<g fill="' + dark + '">' + rects + '</g></svg>';
  }

  // Rend le QR de `text` dans l'élément (remplace son contenu). Retourne l'élément.
  function render(el, text, opts) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el) return null;
    el.innerHTML = svg(text, opts);
    el.setAttribute('data-qr', String(text));
    return el;
  }

  window.PEC_QR = { matrix: matrix, svg: svg, render: render };
})();
