/* ══ PAYENCASH SOLUTION — « COMMENT VEUX-TU PAYER ? », LE CHOIX DE LA PAGE D'UN BON PROPOSÉ (20/09, soir ; 23/09) ══════
   Décision fondatrice du 21/09 : « la modale qui s'ouvre doit être celle COMMENT PAYER, en sachant que c'est pour la
   boutique connectée » ; « ça doit être toujours la même animation ». Le choix vit ICI, une fois, et la page d'un bon
   proposé par une marque le monte — son lien partagé comme la fenêtre de son widget (ui/tech/07-lien.html) :
     · le TRIO (en ligne · chez un partenaire · un distributeur nomade se déplace) et la navigation qui y amène ;
     · CHEZ UN PARTENAIRE — la carte, la recherche, le rayon, la liste, le guidage « M'y rendre » ;
     · UN DISTRIBUTEUR NOMADE SE DÉPLACE — l'adresse de rencontre (position, recherche, saisie), le récap, la modale de mise en
       relation, puis le suivi de la demande ;
     · la modale d'accord de position, et un seul montage de carte pour les deux chemins.
   CE QUI RESTE À LA PAGE : ce qu'on achète (le bon proposé, son montant) et le chemin ① — un bon de marque s'utilise
   depuis l'app Mes bons. Le module ne sait pas CE qu'on achète : il demande combien (`montantDu`), et le RÉSEAU de la
   marque (`o.reseau`, PEC_TECH.reseauOu) lui dit où sont ses points, qui se déplace et comment demander une rencontre.
   Le balisage est posé par le module dans trois points d'accroche de la page (data-pec-ou="trio" · "acheter" ·
   "modales"), avec des identifiants stables : c'est sur eux que s'appuient la logique ci-dessous, le banc et l'audit.
   Rien ici n'est écrit en dur — tout vient de PEC_DATA, du réseau de la marque et de PEC_GEO. ══ */
(function () {
  /* ══ LE BALISAGE DU CHOIX ══ */
  var GAB_TRIO = [
    "      <!-- (19/09, soir — décision fondatrice « donc comment : en ligne, ou chez un partenaire, ou un agent se déplace »)",
    "           LES TROIS CHEMINS, AU PREMIER NIVEAU : la question à poser d'abord n'est pas « quel moyen » mais « OÙ ».",
    "           « En ligne » mène à l'app Mes bons (un bon déjà en main) ; les deux autres mènent à l'achat d'un bon,",
    "           au comptoir d'un commerce du réseau ou en main propre. -->",
    "      <div class=\"choix2 duo3\" role=\"tablist\" id=\"op-ou\" aria-label=\"Comment veux-tu payer ?\">",
    "        <button type=\"button\" class=\"tap\" id=\"op-ou-enligne\" role=\"tab\" aria-selected=\"true\">",
    "          <span class=\"ic2\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:17px\"><use href=\"#i-smartphone\"/></svg></span>",
    "          <span class=\"txt2\"><b>En ligne</b><small id=\"op-ou-enligne-s\">—</small></span>",
    "        </button>",
    "        <button type=\"button\" class=\"tap\" id=\"op-ou-partenaire\" role=\"tab\" aria-selected=\"false\">",
    "          <span class=\"ic2\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:17px\"><use href=\"#i-store\"/></svg></span>",
    "          <span class=\"txt2\"><b id=\"op-ou-partenaire-t\">—</b><small id=\"op-ou-partenaire-s\">—</small></span>",
    "        </button>",
    "        <button type=\"button\" class=\"tap\" id=\"op-ou-agent\" role=\"tab\" aria-selected=\"false\">",
    "          <span class=\"ic2\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:17px\"><use href=\"#i-map-pin\"/></svg></span>",
    "          <span class=\"txt2\"><b id=\"op-ou-agent-t\">—</b><small id=\"op-ou-agent-s\">—</small></span>",
    "        </button>",
    "      </div>"
  ].join('\n');
  var GAB_ACHETER = [
    "          <!-- DEUX FAÇONS D'ACHETER SON BON : au comptoir d'un commerce du réseau, ou d'un distributeur nomade qui se déplace. Les",
    "               libellés viennent du réseau de la marque (techChemins → PARTENAIRE_MODES) : le jour où un mode change de nom,",
    "               l'écran suit. -->",
    "",
    "          <div class=\"pec-card\" id=\"ach-carte-commerce\" style=\"margin-top:12px;padding:14px 16px\">",
    "            <div style=\"font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--color-muted)\">Acheter un bon d’achat</div>",
    "            <div style=\"font-size:16px;font-weight:800;letter-spacing:-0.01em;color:var(--color-ink);margin-top:3px\">Les commerces les plus proches</div>",
    "            <!-- (23/09, fondatrice : « notre réseau accepte espèces, pièces et CB ; ses bons d'achat sont utilisés sur le site",
    "                 de l'émetteur ; une fois utilisé, non remboursable ; réseau limité ») CE QU'IL FAUT SAVOIR, rendu par le",
    "                 RÉSEAU (R.rappel) — retiré du balisage au montage si le réseau n'en a pas. -->",
    "            <div class=\"pec-rappel\" id=\"ach-rappel\" hidden></div>",
    "            <p class=\"plaisir\">Fais-toi plaisir — ou fais plaisir à quelqu’un : un bon d’achat s’offre aussi.</p>",
    "",
    "            <div class=\"mapwrap pec-map-canvas\" id=\"ach-mapwrap\" hidden><div id=\"ach-map\" style=\"position:absolute;inset:0\"></div></div>",
    "",
    "            <!-- LE GUIDAGE (19/09, soir) : visible seulement quand un commerce a été choisi, et que la position suit. -->",
    "            <div class=\"navb\" id=\"ach-nav\" hidden>",
    "              <span class=\"dt\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:18px\"><use href=\"#i-map-pin\"/></svg></span>",
    "              <span style=\"flex:1;min-width:0\">",
    "                <span class=\"tt\" id=\"ach-nav-titre\">—</span>",
    "                <span class=\"ss\" id=\"ach-nav-txt\" style=\"display:block\">—</span>",
    "              </span>",
    "              <button type=\"button\" class=\"st tap\" id=\"ach-nav-stop\">Arrêter</button>",
    "            </div>",
    "",
    "            <!-- L'accord de position ne se demande pas par un bouton quand il est connu (règle PEC_GEO) :",
    "                 autoLocaliser part seul. Sinon, on dit D'ABORD à quoi la position sert. -->",
    "            <div class=\"geoask\" id=\"ach-geoask\" hidden>",
    "              <b>Pour te montrer les points de vente les plus proches</b>, on a besoin de ta position — c'est tout ce qu'elle sert ici.",
    "              <span data-geo-retention=\"tu\"></span>",
    "              <button type=\"button\" class=\"pec-btn-secondary tap\" id=\"ach-geook\" style=\"display:block;width:100%;margin-top:9px;font-weight:800\">Autoriser ma position</button>",
    "              <p id=\"ach-geoerr\" hidden style=\"margin:8px 0 0;font-size:11.5px;font-weight:700;color:#8E2A1E\"></p>",
    "            </div>",
    "",
    "            <!-- LA RECHERCHE ET LES VILLES : chercher autour de soi est le défaut, mais on peut chercher PAR VILLE ou par nom.",
    "                 Dès qu'une ville ou une recherche est active, le rayon ne bride plus : on regarde CETTE ville. Le rayon",
    "                 (− 500 m · 1 km · 2 km) ne s'affiche que si l'on sait d'où mesurer. -->",
    "            <input class=\"pec-input\" id=\"ach-q\" type=\"search\" placeholder=\"Chercher un commerce ou une ville…\" style=\"width:100%;height:34px;padding:0 12px;font-size:12px;margin-top:10px\">",
    "            <div id=\"ach-villes\" style=\"display:flex;gap:6px;flex-wrap:wrap;margin-top:8px\"></div>",
    "            <div class=\"seclbl\" id=\"ach-rayon-l\" hidden style=\"display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px\">",
    "              <b id=\"ach-rayon-txt\" style=\"font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--color-muted)\">—</b>",
    "              <span id=\"ach-rayon\" style=\"display:flex;gap:6px\">",
    "                <button type=\"button\" class=\"pec-pill tap\" data-km=\"500\" aria-pressed=\"false\">− 500 m</button>",
    "                <button type=\"button\" class=\"pec-pill tap\" data-km=\"1000\" aria-pressed=\"false\">1 km</button>",
    "                <button type=\"button\" class=\"pec-pill pec-pill--done tap\" data-km=\"2000\" aria-pressed=\"true\">2 km</button>",
    "              </span>",
    "            </div>",
    "            <div id=\"ach-liste\" style=\"margin-top:8px\"></div>",
    "            <div class=\"vide\" id=\"ach-vide\" hidden>—</div>",
    "            <p id=\"ach-note\" hidden style=\"margin:8px 0 0;font-size:10.5px;line-height:1.5;color:var(--color-muted)\">Distances à vol d'oiseau depuis ta position · <span data-geo-retention=\"tu\"></span></p>",
    "          </div>",
    "",
    "          <!-- LE DISTRIBUTEUR NOMADE QUI SE DÉPLACE — le client dit OÙ, un nomade de sa commune prend la demande. L'endroit est une",
    "               ADRESSE : relevée de sa position, cherchée, ou saisie — le client n'a pas de compte chez nous, rien n'entre",
    "               dans un carnet. -->",
    "          <div class=\"pec-card\" id=\"ach-carte-agent\" hidden style=\"margin-top:12px;padding:14px 16px\">",
    "            <div style=\"font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--color-muted)\" id=\"agt-lbl\">—</div>",
    "            <div style=\"font-size:16px;font-weight:800;letter-spacing:-0.01em;color:var(--color-ink);margin-top:3px\" id=\"agt-titre\">—</div>",
    "",
    "            <div id=\"agt-encours\" hidden class=\"pec-mint-banner\" style=\"margin-top:10px;font-size:12.5px;line-height:1.5\"></div>",
    "            <!-- LA CARTE DU POINT DE RENDEZ-VOUS — même montage que la carte des commerces (MapLibre, init paresseuse). -->",
    "            <div class=\"mapwrap pec-map-canvas\" id=\"agt-mapwrap\" hidden><div id=\"agt-map\" style=\"position:absolute;inset:0\"></div></div>",
    "            <!-- LA LÉGENDE DU POINT : précis (adresse géolocalisée) ou approché (centre de la commune). On ne laisse jamais",
    "                 croire à un point pointé au mètre près quand c'est un centre-ville. -->",
    "            <p id=\"agt-pt\" hidden style=\"margin:7px 0 0;font-size:11px;line-height:1.5;color:var(--color-muted)\"></p>",
    "",
    "            <div id=\"agt-form\">",
    "              <!-- (20/09, fondatrice : « uniquement ADRESSE DE RENCONTRE ; il peut changer par SA POSITION ou une ADRESSE",
    "                   SAISIE — numéro de rue, rue, code postal, ville ; attention récupère le nom des rues ») UNE SEULE",
    "                   ADRESSE, ENTIÈREMENT À L'ÉCRAN : la position et la recherche sont ouvertes dès l'arrivée. -->",
    "              <div id=\"adr-bloc\" style=\"margin-top:12px\">",
    "                <div style=\"font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--color-muted)\">Adresse de rencontre <span class=\"req\">· requis</span></div>",
    "                <div id=\"dom-form\" style=\"border-top:1px solid var(--color-sep);padding-top:12px;margin-top:11px\">",
    "                  <!-- ① MA POSITION — elle rapporte le NUMÉRO ET LE NOM DE LA RUE (Base Adresse Nationale), pas des degrés. -->",
    "                  <button type=\"button\" id=\"df-geoloc\" class=\"pec-btn-secondary tap\" style=\"display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-bottom:9px;font-weight:800\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:16px\"><use href=\"#i-locate\"/></svg> <span id=\"df-geoloc-txt\">Utiliser ma position</span></button>",
    "                  <!-- ② OU JE LA CHERCHE — la suggestion choisie remplit les quatre champs ET arrive géolocalisée ; les",
    "                       champs restent dessous, pour corriger ou tout saisir à la main. -->",
    "                  <label class=\"pec-input-label\" for=\"df-q\">Ou cherche une autre adresse</label>",
    "                  <div style=\"position:relative;margin-bottom:9px\">",
    "                    <input class=\"pec-input\" id=\"df-q\" type=\"search\" autocomplete=\"off\" placeholder=\"Numéro et rue, puis la commune…\" style=\"width:100%\">",
    "                  </div>",
    "                  <p id=\"df-q-aide\" style=\"margin:-4px 0 10px;font-size:10.5px;line-height:1.45;color:var(--color-muted)\">Choisis une suggestion : le numéro, la voie, le code postal, la commune et la position se remplissent tout seuls. Tu peux aussi tout saisir à la main.</p>",
    "                  <div style=\"display:flex;gap:7px;margin-bottom:8px\">",
    "                    <input class=\"pec-input\" id=\"df-numero\" type=\"text\" inputmode=\"numeric\" aria-label=\"Numéro de voie\" placeholder=\"N°\" style=\"flex:0 0 64px;min-width:0\">",
    "                    <input class=\"pec-input\" id=\"df-voie\" type=\"text\" aria-label=\"Voie\" placeholder=\"Voie (rue, avenue, quai…)\" style=\"flex:1;min-width:0\">",
    "                  </div>",
    "                  <div style=\"display:flex;gap:7px;margin-bottom:9px\">",
    "                    <input class=\"pec-input\" id=\"df-cp\" type=\"text\" inputmode=\"numeric\" maxlength=\"5\" aria-label=\"Code postal\" placeholder=\"Code postal\" style=\"flex:0 0 96px;min-width:0\">",
    "                    <input class=\"pec-input\" id=\"df-ville\" type=\"text\" aria-label=\"Commune\" placeholder=\"Commune\" style=\"flex:1;min-width:0\">",
    "                  </div>",
    "                  <p id=\"df-err\" hidden style=\"margin:0 0 9px;font-size:11px;font-weight:700;color:#8E2A1E\"></p>",
    "                  <!-- ③ LES PRÉCISIONS D'ACCÈS (fondatrice 20/09 : « si portail, étage etc. ») -->",
    "                  <div style=\"font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--color-muted);margin-bottom:7px\">Précisions d'accès <span class=\"opt\">· facultatif</span></div>",
    "                  <div style=\"display:flex;gap:7px;margin-bottom:8px\">",
    "                    <input class=\"pec-input\" id=\"df-etage\" type=\"text\" aria-label=\"Étage\" placeholder=\"Étage\" style=\"flex:1;min-width:0\">",
    "                    <input class=\"pec-input\" id=\"df-porte\" type=\"text\" aria-label=\"Porte ou interphone\" placeholder=\"Porte / interphone\" style=\"flex:1.5;min-width:0\">",
    "                  </div>",
    "                  <input class=\"pec-input\" id=\"df-instructions\" type=\"text\" aria-label=\"Instructions d'accès\" placeholder=\"Portail, cour, bâtiment, digicode…\" style=\"width:100%\">",
    "                </div>",
    "              </div>",
    "              <!-- LE MOT DU JOUR — distinct des précisions d'accès : il ne vaut que pour CETTE rencontre (`note`). -->",
    "              <div class=\"frow\" style=\"margin-top:8px\"><label class=\"pec-input-label\" for=\"agt-note\">Un mot pour cette rencontre <span class=\"opt\">· facultatif</span></label>",
    "                <input class=\"pec-input\" id=\"agt-note\" type=\"text\" autocomplete=\"off\" maxlength=\"200\" aria-describedby=\"agt-note-aide\" placeholder=\"je suis en terrasse, veste rouge…\">",
    "                <p class=\"aide\" id=\"agt-note-aide\">Ce qui change aujourd'hui seulement — l'étage et la porte sont déjà dans l'adresse.</p></div>",
    "              <!-- CE QU'IL Y A À SAVOIR AVANT DE DEMANDER TIENT DANS UNE CARTE : le montant, qui se déplace, et ce qu'il vend. -->",
    "              <div class=\"pec-card\" id=\"agt-recap\" style=\"margin-top:12px;padding:4px 14px\">",
    "                <div class=\"agt-lig\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\"><use href=\"#i-receipt\"/></svg><span id=\"agt-montant\">—</span></div>",
    "                <div class=\"agt-lig\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\"><use href=\"#i-map-pin\"/></svg><span id=\"agt-dispo\">—</span></div>",
    "                <div class=\"agt-lig\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\"><use href=\"#i-shield\"/></svg><span id=\"agt-garantie\">—</span></div>",
    "              </div>",
    "              <p id=\"agt-erreur\" hidden style=\"margin:8px 0 0;font-size:12px;font-weight:700;line-height:1.5;color:#8E2A1E\"></p>",
    "              <button type=\"button\" class=\"pec-cta tap\" id=\"agt-demander\" style=\"display:block;width:100%;text-align:center;margin-top:11px\">—</button>",
    "            </div>",
    "            <div id=\"agt-liste\" style=\"margin-top:10px\"></div>",
    "          </div>"
  ].join('\n');
  var GAB_MODALES = [
    "  <!-- LA MODALE D'ACCORD DE POSITION — elle ne s'affiche QUE si la question n'a jamais été posée, et jamais deux fois. -->",
    "  <div class=\"scrim\" id=\"geopop\" hidden>",
    "    <div class=\"popup\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"geopop-t\">",
    "      <span class=\"pic\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:22px\"><use href=\"#i-locate\"/></svg></span>",
    "      <h3 id=\"geopop-t\">Autoriser PayEnCash à utiliser ta position ?</h3>",
    "      <p id=\"geopop-p\">—</p>",
    "      <button type=\"button\" class=\"allow tap\" id=\"geopop-ok\">Autoriser ma position</button>",
    "      <button type=\"button\" class=\"deny tap\" id=\"geopop-non\">Continuer sans — je saisis une adresse</button>",
    "      <p class=\"err\" id=\"geopop-err\" hidden></p>",
    "    </div>",
    "  </div>",
    "",
    "  <!-- LA MISE EN RELATION : avant d'envoyer la demande, on dit ce qui va se passer, on demande le numéro où être appelé",
    "       (le client n'a pas de compte chez nous), on laisse choisir le canal, et on ne part qu'avec son accord. -->",
    "  <div class=\"scrim\" id=\"rdvpop\" hidden>",
    "    <div class=\"popup lg\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"rdvpop-t\">",
    "      <span class=\"pic\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\" style=\"font-size:22px\"><use href=\"#i-headset\"/></svg></span>",
    "      <h3 id=\"rdvpop-t\">On te met en relation</h3>",
    "      <p id=\"rdvpop-p\">—</p>",
    "      <div class=\"recap\" id=\"rdvpop-recap\">—</div>",
    "      <div class=\"tel\" id=\"rdvpop-tel-saisie\">",
    "        <label class=\"k\" for=\"rdvpop-tel-in\">Le numéro où il t'appelle</label>",
    "        <input class=\"pec-input\" id=\"rdvpop-tel-in\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\" placeholder=\"06 12 34 56 78\" style=\"width:100%;margin-top:6px;background:var(--color-card)\">",
    "      </div>",
    "      <p class=\"pec-section-label\" style=\"margin:12px 0 0\">Comment préfères-tu être contacté·e ?</p>",
    "      <div class=\"canaux\" id=\"rdvpop-canaux\">",
    "        <button type=\"button\" class=\"tap\" data-canal=\"appel\" aria-pressed=\"true\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\"><use href=\"#i-phone\"/></svg><span>Appel</span></button>",
    "        <button type=\"button\" class=\"tap\" data-canal=\"whatsapp\" aria-pressed=\"false\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\"><use href=\"#i-chat\"/></svg><span>WhatsApp</span></button>",
    "        <button type=\"button\" class=\"tap\" data-canal=\"facetime\" aria-pressed=\"false\"><svg class=\"pec-ico\" viewBox=\"0 0 24 24\"><use href=\"#i-headset\"/></svg><span>Visio</span></button>",
    "      </div>",
    "      <label class=\"rgpdrow\" for=\"rdvpop-rgpd\">",
    "        <input type=\"checkbox\" id=\"rdvpop-rgpd\">",
    "        <span id=\"rdvpop-rgpd-txt\">—</span>",
    "      </label>",
    "      <p class=\"err\" id=\"rdvpop-err\" hidden></p>",
    "      <button type=\"button\" class=\"allow tap\" id=\"rdvpop-ok\" style=\"margin-top:12px;opacity:.45\" aria-disabled=\"true\">J’ai compris — qu’il m’appelle</button>",
    "      <button type=\"button\" class=\"deny tap\" id=\"rdvpop-non\">Revenir en arrière</button>",
    "    </div>",
    "  </div>"
  ].join('\n');

  /* POSER LE BALISAGE AVANT D'Y BRANCHER QUOI QUE CE SOIT. Un point d'accroche absent n'est pas une erreur : une page
     peut ne vouloir que certains volets. */
  function poser() {
    var t = document.querySelector('[data-pec-ou="trio"]'); if (t) t.outerHTML = GAB_TRIO;
    var a = document.querySelector('[data-pec-ou="acheter"]'); if (a) a.innerHTML = GAB_ACHETER;
    var p = document.querySelector('[data-pec-ou="modales"]'); if (p) p.outerHTML = GAB_MODALES;
  }
  window.PEC_OU = {
    /* o.reseau           → le réseau de la marque (PEC_TECH.reseauOu) — obligatoire :
                              points(opts)   même contrat que pointsBons ({ pos, rayon, q, ville })
                              videTxt(f)     ce qu'on dit (HTML échappé) quand personne ne vend ici
                              trio()         { enligne, partenaire: { t, s }, agent: { t, s } }
                              rappel()       ce qu'il faut savoir avant d'aller au comptoir (facultatif)
                              rencontre      la demande de rencontre de CE bon proposé (voir PEC_TECH.reseauOu)
       o.montantDu()      → { cents } : ce qui manque encore sur le bon proposé (la page sait ce qu'elle vend)
       o.utiliserCode(c)  → ouvre l'app Mes bons avec le code remis par le distributeur nomade : c'est là qu'un bon de marque s'utilise */
    monter: function (o) {
      o = o || {};
      var D = window.PEC_DATA, R = o.reseau;
      if (!D || !R) return null;   // sans réseau, on ne monte pas un choix vers nulle part
      var esc = function (v) { return D.esc ? D.esc(v) : String(v == null ? '' : v); };
      poser();
      /* LE RAPPEL DU RÉSEAU N'EXISTE QUE SI LE RÉSEAU EN A UN : le bloc est RETIRÉ, pas caché — un balisage vide finit
         toujours par s'afficher un jour. */
      if (!R.rappel) { var zr0 = document.getElementById('ach-rappel'); if (zr0) zr0.remove(); }
      var $ = function (id) { return document.getElementById(id); };
      var montantDu = o.montantDu || function () { return { cents: 0 }; };

    /* ══ (18/09, soir) CHEZ UN PARTENAIRE — LA CARTE GÉOGRAPHIQUE, LA LISTE, LA DISTANCE ═════════════════════════════
       Ici, les TROIS plus proches : un volet d'achat n'est pas un annuaire. LA DISTANCE VIENT DU DATA-LAYER : `points({pos})`
       rend distM / distTxt / pied et trie. Le temps à pied est calculé par `D.fmtPied` (vide au-delà d'une marche
       raisonnable). Un commerce sans géoposition saisie est placé au centre de sa ville et le dit (`geoApprox`). */
      function achPied(p) { return p.pied ? (' · ' + p.pied) : ''; }
    var ACH_MAX = 3;                               // combien de commerces tiennent dans le volet (donnée de la page)
    var achRayon = 2000;   // (19/09, soir) − 500 m · 1 km · 2 km — le défaut de l'écran d'avant
    var achQ = '', achVille = '';   // chercher par nom, ou par ville
    var achPos = null, achMap = null, achMkUser = null, achMkPts = {}, achVu = null, achPeint = false;
    var achSuivi = null, achCible = null;          // (19/09, soir) le guidage : la montre de position, et le commerce visé
    function achPoints() {
      /* LE RAYON ne s'applique que si l'on sait d'où mesurer — c'est le data-layer qui tranche, pas l'écran. */
      var q = achPos ? { pos: achPos, rayon: achRayon } : {};
      if (achQ) q.q = achQ;
      if (achVille) q.ville = achVille;
      return R.points(q);
    }
    /* (21/09) LE MONTAGE DE CARTE VIT DANS LE SOCLE (PEC_GEO.carte) : init PARESSEUSE (MapLibre exige un conteneur
       visible — ce volet est masqué à l'ouverture), bounds étendu point par point, bandeau « carte indisponible » qui
       dit pourquoi. Un seul montage pour les deux volets. */
    function achCarte(pts) {
      var wrap = $('ach-mapwrap');
      if (!pts.length) { wrap.hidden = true; return; }
      wrap.hidden = false;
      if (typeof maplibregl === 'undefined') return;
      var centre = achPos || pts[0].geo || D.posReference;
      if (!achMap) achMap = PEC_GEO.carte('ach-map', { centre: centre, zoom: 13, cadre: wrap });
      else achMap.resize();                       // le volet vient de s'ouvrir : le conteneur a enfin une taille
      if (!achMap) return;                        // pas de carte sur ce navigateur : le bandeau le dit, la liste reste
      if (achPos) {
        if (!achMkUser) { var u = document.createElement('div'); u.className = 'mk-user'; achMkUser = new maplibregl.Marker({ element: u }).setLngLat([achPos.lng, achPos.lat]).addTo(achMap); }
        else achMkUser.setLngLat([achPos.lng, achPos.lat]);
        // la pastille RESPIRE tant que la position suit : on distingue à l'œil un relevé vivant d'un relevé figé
        if (achMkUser.getElement) achMkUser.getElement().classList.toggle('live', !!achSuivi);
      }
      Object.keys(achMkPts).forEach(function (id) { if (!pts.some(function (p) { return p.id === id; })) { achMkPts[id].remove(); delete achMkPts[id]; } });
      pts.forEach(function (p) {
        if (!p.geo) return;
        if (!achMkPts[p.id]) {
          var el = document.createElement('div'); el.className = 'mk-pt';
          el.innerHTML = '<svg class="pec-ico" viewBox="0 0 24 24"><use href="#i-map-pin"/></svg>' + esc(p.enseigne);
          el.addEventListener('click', function () { achVu = p.id; achListe(); var f = document.querySelector('[data-cmz="' + p.id + '"]'); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
          achMkPts[p.id] = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.geo.lng, p.geo.lat]).addTo(achMap);
        } else achMkPts[p.id].setLngLat([p.geo.lng, p.geo.lat]);
      });
      /* EN GUIDAGE, LA CAMÉRA APPARTIENT AU TRAJET : cadrer les trois commerces à chaque pas ramènerait sans cesse
         la vue en arrière. `achNav` s'en charge, et ne bouge que si l'on sort du cadre. */
      if (achCible) { achNav(); return; }
      var avecGeo = pts.filter(function (p) { return p.geo; });
      if (!avecGeo.length && !achPos) return;
      var d0 = achPos ? [achPos.lng, achPos.lat] : [avecGeo[0].geo.lng, avecGeo[0].geo.lat];
      var bb = new maplibregl.LngLatBounds(d0, d0);
      avecGeo.forEach(function (p) { bb.extend([p.geo.lng, p.geo.lat]); });
      achMap.fitBounds(bb, { padding: { top: 40, bottom: 40, left: 34, right: 52 }, maxZoom: 15.5, duration: document.hidden ? 0 : 400 });
    }
    /* ══ LE GUIDAGE (19/09, soir) — « la carte comme Uber où on avance en direction du partenaire » ══════════
       Une position QUI SUIT (PEC_GEO.suivre), un trait vers le commerce visé, la distance et les paliers recalculés à
       chaque pas. Ce qu'on NE fait PAS, et qu'on ne laisse pas croire : un itinéraire. Le trait est une DIRECTION à vol
       d'oiseau — nous n'avons pas de moteur de trajet. ══ */
    function achCouleurTrait() {
      var c = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
      return (c && c.trim()) || '#10a06a';
    }
    function achTrace(cible) {
      if (!achMap || typeof maplibregl === 'undefined') return;
      if (!achMap.isStyleLoaded()) { achMap.once('load', function () { achTrace(cible); }); return; }
      var coords = (achPos && cible && cible.geo) ? [[achPos.lng, achPos.lat], [cible.geo.lng, cible.geo.lat]] : [];
      var gj = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
      var src = achMap.getSource('ach-cap');
      if (src) { src.setData(gj); return; }
      if (!coords.length) return;                  // rien à tracer : on ne crée pas une couche vide
      achMap.addSource('ach-cap', { type: 'geojson', data: gj });
      achMap.addLayer({ id: 'ach-cap', type: 'line', source: 'ach-cap', layout: { 'line-cap': 'round' },
        paint: { 'line-color': achCouleurTrait(), 'line-width': 4, 'line-dasharray': [1.4, 1.4], 'line-opacity': .85 } });
    }
    /* LA CAMÉRA NE SE REJOUE PAS À CHAQUE PAS : elle ne recadre que si l'un des deux points est SORTI du cadre. */
    function achCadrer(cible) {
      if (!achMap || !achPos || !cible || !cible.geo || typeof maplibregl === 'undefined') return;
      if (achMap.isMoving && achMap.isMoving()) return;
      var b = achMap.getBounds();
      if (b && b.contains([achPos.lng, achPos.lat]) && b.contains([cible.geo.lng, cible.geo.lat])) return;
      var bb = new maplibregl.LngLatBounds([achPos.lng, achPos.lat], [achPos.lng, achPos.lat]);
      bb.extend([cible.geo.lng, cible.geo.lat]);
      // marge large à gauche et à droite : l'étiquette d'une épingle déborde de son ancre et se faisait couper au bord
      achMap.fitBounds(bb, { padding: { top: 46, bottom: 46, left: 66, right: 66 }, maxZoom: 16.5, duration: document.hidden ? 0 : 600 });
    }
    function achNav() {
      var b = $('ach-nav'); if (!b) return;
      var cible = achCible ? achPoints().filter(function (x) { return x.id === achCible; })[0] : null;
      if (!cible || !achSuivi) { b.hidden = true; return; }
      b.hidden = false;
      var dm = (achPos && cible.geo && D.distanceM) ? D.distanceM(achPos, cible.geo) : null;
      var e = D.proximiteEtat ? D.proximiteEtat(dm) : { cle: 'inconnu', titre: '—', texte: '' };
      b.classList.toggle('arrive', e.cle === 'arrive');
      $('ach-nav-titre').textContent = e.titre + ' · ' + cible.enseigne;
      $('ach-nav-txt').textContent = e.texte + (cible.geoApprox ? ' Position du commerce approchée (centre de la ville).' : '');
      achTrace(cible); achCadrer(cible);
    }
    function achGuider(id) {
      if (!window.PEC_GEO || !PEC_GEO.suivre) return;
      var p = achPoints().filter(function (x) { return x.id === id; })[0];
      if (!p || !p.geo) return;                    // sans géoposition du commerce, il n'y a rien vers quoi avancer
      if (achCible === id) { achArreter(); return; }   // re-cliquer le commerce suivi arrête le suivi
      if (achSuivi) { achSuivi.stop(); achSuivi = null; }
      achCible = id; achVu = id;
      achSuivi = PEC_GEO.suivre(function (f) {
        if (PEC_GEO.noterAccord) PEC_GEO.noterAccord();
        if (PEC_GEO.appliquerRetention) PEC_GEO.appliquerRetention();
        achPos = f; $('ach-geoask').hidden = true;
        achListe(); achNav();
      }, function (msg) {
        if (!achPos) {                             // refusée d'entrée : on arrête, on ne laisse pas un bandeau vide tourner
          achArreter();
          var g = $('ach-geoask'), er = $('ach-geoerr');
          if (g) g.hidden = false;
          if (er) { er.hidden = false; er.textContent = msg; }
          return;
        }
        var t = $('ach-nav-txt'); if (t) t.textContent = msg + ' — dernière position connue conservée.';
      });
      if (!achSuivi) { achCible = null; return; }  // pas de géolocalisation du tout : on ne fait pas semblant de guider
      achListe(); achNav();
    }
    function achArreter() {
      if (achSuivi) { achSuivi.stop(); achSuivi = null; }
      achCible = null;
      achTrace(null);
      if (achMkUser && achMkUser.getElement) achMkUser.getElement().classList.remove('live');
      var b = $('ach-nav'); if (b) { b.hidden = true; b.classList.remove('arrive'); }
      achListe();
    }
    /* CE QU'IL FAUT SAVOIR — sous le titre de « Acheter un bon d'achat », avant la carte : les mots viennent du RÉSEAU
       (R.rappel), qui les lit au référentiel. Repeint seulement s'il change. */
    var achRappelPeint = '';
    function achRappel() {
      var z = $('ach-rappel'); if (!z || !R.rappel) return;
      var h = R.rappel() || '';
      if (h === achRappelPeint) return;
      achRappelPeint = h; z.innerHTML = h; z.hidden = !h;
    }
    function achListe() {
      var tous = achPoints(), pts = tous.slice(0, ACH_MAX);
      /* LE COMMERCE SUIVI NE DISPARAÎT JAMAIS DE LA LISTE : voir sa cible s'effacer pendant qu'on avance vers elle serait absurde. */
      if (achCible && !pts.some(function (p) { return p.id === achCible; })) {
        var c = tous.filter(function (x) { return x.id === achCible; })[0];
        if (c) pts = pts.slice(0, Math.max(0, ACH_MAX - 1)).concat([c]);
      }
      var liste = $('ach-liste'), vide = $('ach-vide'), note = $('ach-note');
      if (!tous.length) {
        // ÉTAT VIDE HONNÊTE : on ne promet pas un réseau qui n'existe pas
        liste.innerHTML = ''; achCarte([]);
        vide.hidden = false;
        vide.innerHTML = R.videTxt(!!(achQ || achVille));
        if (note) note.hidden = true;
        return;
      }
      /* LES VILLES OÙ IL Y A RÉELLEMENT UN COMMERCE — dérivées de la liste, jamais écrites. */
      var zv = $('ach-villes');
      if (zv) {
        var villes = []; R.points({}).forEach(function (p) { if (p.ville && villes.indexOf(p.ville) === -1) villes.push(p.ville); });
        zv.hidden = villes.length < 2;
        zv.innerHTML = villes.length < 2 ? '' : villes.map(function (v) {
          var on = achVille === v;
          return '<button type="button" class="pec-pill tap' + (on ? ' pec-pill--done' : '') + '" data-ville="' + esc(v) + '" aria-pressed="' + on + '">' + esc(v) + '</button>';
        }).join('');
      }
      /* LE RAYON NE BRIDE PLUS dès qu'une ville ou une recherche est active : le libellé le dit. */
      var zr = $('ach-rayon-l'), brider = !!achPos && !achQ && !achVille;
      if (zr) {
        zr.hidden = !achPos;
        if (achPos) $('ach-rayon-txt').textContent = 'Points de vente — ' + pts.length
          + (brider ? ' à moins de ' + (achRayon >= 1000 ? (achRayon / 1000) + ' km' : achRayon + ' m')
                    : (achVille ? ' à ' + achVille : ' pour « ' + achQ + ' »'));
        [].forEach.call($('ach-rayon').querySelectorAll('[data-km]'), function (b) { b.disabled = !brider; b.style.opacity = brider ? '' : '.45'; });
      }
      vide.hidden = true;
      if (note) note.hidden = !achPos;
      liste.innerHTML = '<div class="pec-card" style="padding:2px 13px 4px">' + pts.map(function (p, i) {
        var adr = [p.adresse, [p.cp, p.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ');
        return '<div class="cmz' + (p.id === achVu ? ' vu' : '') + '" data-cmz="' + esc(p.id) + '">' +
          '<span class="rg">' + (achPos ? (i + 1) : '<svg class="pec-ico" viewBox="0 0 24 24" style="font-size:14px"><use href="#i-map-pin"/></svg>') + '</span>' +
          '<div style="min-width:0;flex:1"><div class="nm">' + esc(p.enseigne) + '</div>'
          + '<div class="ad">' + esc(adr) + (p.horaires ? ' · ' + esc(p.horaires) : '') + '</div>' +
          // la distance ne s'affiche QUE si elle a été calculée : pas de position, pas de distance inventée
          (p.distTxt ? '<span class="di">' + esc(p.distTxt) + esc(achPied(p)) + '</span>' : '') +
          /* LA FICHE OUVERTE DIT CE QU'ON REPART AVEC — la phrase vient de la donnée (`achete`), pas de l'écran. */
          (p.id === achVu ? '<div class="qo">' + esc(p.achete || '') + '</div>' : '') +
          '</div>' +
          /* « M'y rendre » n'apparaît que si le commerce a une géoposition ET que l'appareil sait suivre : un bouton
             qui ne peut rien faire est pire que pas de bouton. Le premier clic déclenche la demande de position. */
          ((p.geo && window.PEC_GEO && PEC_GEO.suivre) ? '<button type="button" class="go tap" data-go="' + esc(p.id) + '" aria-pressed="' + (p.id === achCible ? 'true' : 'false') + '">' + (p.id === achCible ? 'Suivi…' : 'M’y rendre') + '</button>' : '') +
          '</div>';
      }).join('') + '</div>'
        + (tous.length > pts.length ? '<p style="margin:7px 2px 0;font-size:10.5px;font-weight:700;color:var(--color-muted)">' + (tous.length - pts.length) + ' autre' + (tous.length - pts.length > 1 ? 's' : '') + ' point' + (tous.length - pts.length > 1 ? 's' : '') + ' de vente plus loin — élargis le rayon, ou cherche ta ville.</p>' : '');
      achCarte(pts);
    }
    /* ══ (19/09, nuit) L'ACCORD SE DEMANDE ═══════════════════════════════════════════════════════════════════
       Accord déjà donné → `autoLocaliser` part seul. Accord jamais donné → on dit d'abord à quoi la position sert,
       dans une modale, et c'est SON bouton qui déclenche la question du navigateur. « Continuer sans » n'est pas un
       cul-de-sac : chez un partenaire on cherche par ville, pour une rencontre on saisit l'adresse. ══ */
    var geopopRepondu = false;
    /* BLOQUÉ ≠ RÉPONDU : « bloqué », c'est le NAVIGATEUR, et cet état SE RELIT (on vient peut-être de le débloquer).
       Ce drapeau ne sert qu'à ne pas réécrire le même refus à chaque peinture. */
    var geopopBloque = false;
    var geopopApres = null;   // le geste qui attend l'accord (relever son adresse), rejoué dès qu'il est donné
    function geopopFermer() { var z = $('geopop'); if (z) z.hidden = true; }
    /* (20/09) ON NE DEMANDE PAS UN ACCORD QUI NE VIENDRA JAMAIS : site bloqué → pas de modale, le refus se dit une fois
       à l'endroit qui en dépend, et la recherche par ville prend le relais. */
    function geopopOuvrir() {
      var z = $('geopop'); if (!z || geopopRepondu || window.__pecSansPosition) return;
      if (!window.PEC_GEO || achPos || PEC_GEO.accordConnu()) { z.hidden = true; return; }
      if (!PEC_GEO.permissionEtat) { geopopPeindre(); return; }
      PEC_GEO.permissionEtat(function (etat) {
        if (etat === 'denied') { z.hidden = true; if (!geopopBloque) { geopopBloque = true; direRefusPosition(); } return; }
        geopopPeindre();
      });
    }
    function direRefusPosition() {
      var ga = $('ach-geoask'), e = $('ach-geoerr');
      if (!ga || !e || ouChemin !== 'partenaire') return;
      ga.hidden = false;
      e.hidden = false;
      e.textContent = PEC_GEO.messageErreur({ code: 1 });
    }
    function geopopPeindre() {
      var z = $('geopop'); if (!z) return;
      var p = $('geopop-p');
      if (p) {
        p.textContent = ouChemin === 'agent'
          ? 'Uniquement pour retrouver le numéro et le nom de ta rue, et poser le point de rendez-vous au bon endroit. '
          : 'Uniquement pour calculer les distances et trier les points de vente du plus proche au plus loin. ';
        var sp = document.createElement('span');
        sp.setAttribute('data-geo-retention', 'tu');
        p.appendChild(sp);
        p.appendChild(document.createTextNode(' Ton téléphone te demandera son autorisation.'));
        if (PEC_GEO.appliquerRetention) PEC_GEO.appliquerRetention(z);
      }
      $('geopop-err').hidden = true;
      $('geopop-non').textContent = ouChemin === 'agent'
        ? 'Continuer sans — je saisis mon adresse'
        : 'Continuer sans — je cherche par ville';
      z.hidden = false;
    }
    if ($('geopop-ok')) $('geopop-ok').addEventListener('click', function () {
      var b = this, e = $('geopop-err');
      e.hidden = true; b.textContent = 'Localisation…';
      PEC_GEO.localiser(function (f) {
        PEC_GEO.noterAccord();
        geopopRepondu = true;
        b.textContent = 'Autoriser ma position';
        geopopFermer();
        achPos = f;
        if (PEC_GEO.appliquerRetention) PEC_GEO.appliquerRetention();
        var ga = $('ach-geoask'); if (ga) ga.hidden = true;
        achListe(); peindreAgent();
        /* CE QUI ATTENDAIT L'ACCORD REPREND SON COURS : le geste lancé par la cliente aboutit seul. */
        if (geopopApres) { var suite = geopopApres; geopopApres = null; suite(f); }
      }, function (msg) {
        b.textContent = 'Réessayer';
        e.hidden = false; e.textContent = msg;
      });
    });
    if ($('geopop-non')) $('geopop-non').addEventListener('click', function () {
      geopopRepondu = true; geopopApres = null;
      geopopFermer();
      var q = $(ouChemin === 'agent' ? 'df-q' : 'ach-q');
      if (q) { q.scrollIntoView({ block: 'center', behavior: 'smooth' }); q.focus(); }
    });
    function achFix(f) {
      achPos = f;
      $('ach-geoask').hidden = true;
      if (window.PEC_GEO && PEC_GEO.appliquerRetention) PEC_GEO.appliquerRetention();
      achListe();
    }
    /* LE VOLET S'INITIALISE À SA PREMIÈRE OUVERTURE, jamais avant : MapLibre a besoin d'un conteneur VISIBLE, et on ne
       demande pas une position pour un chemin que la cliente n'a pas encore choisi. */
    function achOuvrir() {
      achListe();
      if (achPeint) { if (achMap) achMap.resize(); return; }
      achPeint = true;
      if (!window.PEC_GEO) return;
      var d = PEC_GEO.dernierePos ? PEC_GEO.dernierePos() : null;
      if (d) { achPos = d; achListe(); }            // on DÉMARRE sur la dernière position connue (pas de saut visuel)
      var auto = PEC_GEO.autoLocaliser(achFix, function (msg) {
        var e = $('ach-geoerr'); if (e && !achPos) { $('ach-geoask').hidden = false; e.hidden = false; e.textContent = msg; }
      });
      // on ne demande PAS une position pour trier une liste vide : on ne pose la question qu'avec des points
      if (!auto && !PEC_GEO.accordConnu() && achPoints().length) { $('ach-geoask').hidden = false; geopopOuvrir(); }
      var b = $('ach-geook');
      if (b) b.addEventListener('click', function () {
        var e = $('ach-geoerr'); if (e) e.hidden = true;
        b.textContent = 'Localisation…';
        PEC_GEO.localiser(function (f) { PEC_GEO.noterAccord(); b.textContent = 'Autoriser ma position'; achFix(f); },
          function (msg) { b.textContent = 'Autoriser ma position'; if (e) { e.hidden = false; e.textContent = msg; } });
      });
    }
    (function () {
      var q = $('ach-q');
      if (q) q.addEventListener('input', function () { achQ = q.value.trim(); if (achQ) achVille = ''; achListe(); });
      var zv = $('ach-villes');
      if (zv) zv.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-ville]') : null; if (!b) return;
        var v = b.getAttribute('data-ville');
        achVille = (achVille === v) ? '' : v;   // re-cliquer la ville active la retire : on revient autour de soi
        if (achVille && q) { q.value = ''; achQ = ''; }
        achListe();
      });
    })();
    /* LES PASTILLES DE RAYON : un clic, la liste et la carte se refont sur ce rayon. */
    (function () {
      var z = $('ach-rayon'); if (!z) return;
      z.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-km]') : null; if (!b) return;
        achRayon = parseInt(b.getAttribute('data-km'), 10) || 2000;
        [].forEach.call(z.querySelectorAll('[data-km]'), function (x) {
          var on = x === b;
          x.setAttribute('aria-pressed', String(on));
          x.classList.toggle('pec-pill--done', on);
        });
        achListe();
      });
    })();
    $('ach-liste').addEventListener('click', function (e) {
      var g = e.target.closest ? e.target.closest('[data-go]') : null;
      if (g) { achGuider(g.getAttribute('data-go')); return; }     // le bouton avant la fiche : sinon le recentrage l'avale
      var f = e.target.closest ? e.target.closest('[data-cmz]') : null; if (!f) return;
      achVu = f.getAttribute('data-cmz');
      var p = achPoints().filter(function (x) { return x.id === achVu; })[0];
      achListe();
      if (achMap && p && p.geo) achMap.flyTo({ center: [p.geo.lng, p.geo.lat], zoom: 15.5, duration: document.hidden ? 0 : 400 });
    });
    if ($('ach-nav-stop')) $('ach-nav-stop').addEventListener('click', achArreter);
    /* ON NE LAISSE JAMAIS UNE MONTRE DE POSITION TOURNER DERRIÈRE SOI : quitter l'écran coupe le suivi. */
    window.addEventListener('pagehide', achArreter);
    /* ══ LE TRIO COMMANDE TOUT L'ÉCRAN (19/09, soir) ═════════════════════════════════════════════
       'enligne'    → le chemin ① de la page : un bon déjà en main s'utilise depuis l'app Mes bons ;
       'partenaire' → la carte des commerces, le rayon, la liste : on va chercher son bon au comptoir ;
       'agent'      → la demande de rencontre : un distributeur nomade vient le vendre.
       Les libellés viennent du réseau (R.trio) — l'écran n'écrit aucun nom de mode.
       (19/09, nuit — « par défaut sur chez un partenaire ») c'est le chemin de la plupart : pas encore de bon en main. */
    var ouChemin = 'partenaire';
    function agtMontant() { var du = montantDu(); return Math.round(du.cents) / 100; }
    function peindreOu() {
      var bl = $('op-ou-enligne'), bp = $('op-ou-partenaire'), bg = $('op-ou-agent');
      if (!bl || !bp || !bg) return;
      var T3 = R.trio();
      $('op-ou-enligne-s').textContent = T3.enligne;
      $('op-ou-partenaire-t').textContent = T3.partenaire.t;
      $('op-ou-partenaire-s').textContent = T3.partenaire.s;
      $('op-ou-agent-t').textContent = T3.agent.t;
      $('op-ou-agent-s').textContent = T3.agent.s;
      var al = $('agt-lbl'); if (al) al.textContent = T3.agent.t;
      [[bl, 'enligne'], [bp, 'partenaire'], [bg, 'agent']].forEach(function (x) {
        x[0].setAttribute('aria-selected', String(ouChemin === x[1]));
        x[0].classList.toggle('on', ouChemin === x[1]);
      });
      /* `pane-bon` est le CONTENEUR des trois chemins : il reste ouvert ; ce sont les deux voies à l'intérieur qui basculent. */
      var pb = $('pane-bon'); if (pb) pb.classList.add('active');
      var vj = $('voie-jai-z'); if (vj) vj.classList.toggle('on', ouChemin === 'enligne');
      var va = $('voie-acheter-z'); if (va) va.classList.toggle('on', ouChemin !== 'enligne');
      $('ach-carte-commerce').hidden = ouChemin !== 'partenaire';
      $('ach-carte-agent').hidden = ouChemin !== 'agent';
      achRappel();
      if (ouChemin === 'partenaire') achOuvrir();
      if (ouChemin === 'agent') agtOuvrir();
      /* LA MODALE D'ACCORD NE CONCERNE QUE LA CARTE DES COMMERCES : pour une rencontre, la position ne sert qu'à REMPLIR
         l'adresse, sur le geste de la cliente. Sur tout autre chemin, elle s'efface au lieu de bloquer l'écran. */
      if (ouChemin === 'partenaire') geopopOuvrir();
      else geopopFermer();
    }
    /* ══ UN DISTRIBUTEUR NOMADE SE DÉPLACE — l'adresse, la carte du point de rendez-vous, la demande ═════════════════════
       Le client n'a pas de compte chez nous : l'adresse part avec la demande et n'entre dans aucun carnet ; il laisse le
       numéro où le distributeur nomade l'appellera. `dfGeo` est la géoposition de CE QUI EST à l'écran — null dès qu'on retape. */
    var agtMap = null, agtMkLieu = null, agtPeint = false;
    var dfGeo = null;
    // CE QUI EST À L'ÉCRAN, TEL QU'IL PARTIRA : le formulaire fait foi, jamais le souvenir d'un clic précédent
    function adrSaisie() {
      var v = function (id) { var e = $(id); return e ? e.value.trim() : ''; };
      var num = v('df-numero'), voie = v('df-voie'), cp = v('df-cp'), ville = v('df-ville');
      return { numero: num, voie: voie, cp: cp, ville: ville,
        adresse: (num ? num + ' ' : '') + voie + ((cp || ville) ? ', ' + cp + ' ' + ville : ''),
        etage: v('df-etage'), porte: v('df-porte'), instructions: v('df-instructions'),
        geo: dfGeo || undefined };
    }
    // LA COMMUNE vient de l'adresse de rencontre — elle ne se saisit jamais deux fois
    function agtVille() { var e = $('df-ville'); return e ? e.value.trim() : ''; }
    /* LE POINT DE RENDEZ-VOUS, DANS CET ORDRE — le même que la demande, pour que la carte montre EXACTEMENT le point qui
       partira : la géoposition de l'adresse, sinon le centre de sa commune (et la légende DIT qu'il est approché).
       Jamais la position du téléphone : le rendez-vous est à CETTE adresse. */
    function agtPointRdv() {
      var ville = agtVille();
      if (dfGeo && isFinite(dfGeo.lat) && isFinite(dfGeo.lng)) return { geo: dfGeo, geoApprox: false, ville: ville, adresse: adrSaisie() };
      var g = (D.villeGeo && ville) ? D.villeGeo(ville) : null;
      return g ? { geo: g, geoApprox: true, ville: ville } : null;
    }
    function dfAide(txt) { var a = $('df-q-aide'); if (a) a.textContent = txt; }
    var DF_AIDE_NEUVE = 'Choisis une suggestion : tout se remplit, et l’adresse arrive géolocalisée.';
    // LE FORMULAIRE REPART VIDE — c'est le SEUL endroit qui efface les champs ; la frappe de la cliente ne passe jamais par ici
    function dfVider() {
      if (!$('df-numero')) return;
      dfGeo = null;
      ['df-numero', 'df-voie', 'df-cp', 'df-ville', 'df-etage', 'df-porte', 'df-instructions', 'df-q'].forEach(function (id) { var e = $(id); if (e) e.value = ''; });
      [].forEach.call(document.querySelectorAll('#dom-form .pec-input.ko'), function (x) { x.classList.remove('ko'); });
      $('df-err').hidden = true;
      $('df-geoloc-txt').textContent = 'Utiliser ma position';
      dfAide(DF_AIDE_NEUVE);
    }
    function agtCarte(r) {
      var wrap = $('agt-mapwrap'); if (!wrap) return;
      if (!r || !r.geo || typeof maplibregl === 'undefined') { wrap.hidden = true; return; }
      wrap.hidden = false;
      if (!agtMap) agtMap = PEC_GEO.carte('agt-map', { centre: r.geo, zoom: 14, cadre: wrap });
      else agtMap.resize();      // le volet vient de s'ouvrir : le conteneur a enfin une taille
      if (!agtMap) return;
      var lbl = r.ref ? 'Rendez-vous' : 'Ton point de rendez-vous';
      if (!agtMkLieu) {
        var el = document.createElement('div'); el.className = 'mk-pt';
        el.innerHTML = '<svg class="pec-ico" viewBox="0 0 24 24"><use href="#i-map-pin"/></svg><span class="lb"></span>';
        agtMkLieu = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([r.geo.lng, r.geo.lat]).addTo(agtMap);
      } else agtMkLieu.setLngLat([r.geo.lng, r.geo.lat]);
      var sp = agtMkLieu.getElement().querySelector('.lb'); if (sp) sp.textContent = lbl;
      /* LA CAMÉRA SUIT LE POINT : changer de commune doit déplacer la carte, sinon elle montre encore la précédente.
         Un distributeur nomade ne partage pas sa position : la carte n'a que le point de rendez-vous à montrer. */
      agtMap.easeTo({ center: [r.geo.lng, r.geo.lat], zoom: r.geoApprox ? 12.5 : 14.5, duration: document.hidden ? 0 : 400 });
    }
    /* LE VOLET S'OUVRE SUR UN FORMULAIRE VIDE, ET NE DEMANDE RIEN : la position ne sert qu'à REMPLIR l'adresse, sur le
       geste de la cliente. La demander avant, c'était la demander pour rien — ce que la minimisation interdit. */
    function agtOuvrir() {
      if (!agtPeint) { agtPeint = true; dfVider(); }
      peindreAgent();
      if (agtMap) agtMap.resize();
    }
    /* UN CODE REMIS PAR LE DISTRIBUTEUR NOMADE S'UTILISE DANS L'APP MES BONS (23/09 : « app obligatoire pour utiliser un bon de
       marque, ça permet de retracer ») : on l'y ouvre, c'est là que le bon se range et s'utilise. */
    function poserCode(code) { if (code && o.utiliserCode) o.utiliserCode(code); }
    /* ══ LA RENCONTRE DU RÉSEAU DE LA MARQUE — ses états, lus chez CE réseau ═══════════════════════════════════════
       Demandée : on attend qu'un distributeur nomade la prenne. Acceptée : il vient, et il appelle. Servie : il a remis le bon — on
       ouvre l'app Mes bons avec son code. Pas d'écran de suivi à part : la carte n'a que le point de rendez-vous. */
    function peindreAgent() {
      var RR = R.rencontre, m = agtMontant(), zb = $('agt-encours');
      if (!RR) {
        /* sans bon proposé, il n'y a pas de rencontre à demander : on le dit, on n'affiche pas un formulaire mort */
        zb.hidden = false; zb.textContent = 'Une rencontre se demande depuis la page d’un bon proposé par la marque.';
        $('agt-form').style.display = 'none'; $('agt-liste').innerHTML = ''; agtCarte(null);
        return;
      }
      var enc = RR.enCours(), serv = enc ? null : RR.servie();
      zb.hidden = !(enc || serv);
      $('agt-form').style.display = (enc || serv) ? 'none' : '';
      $('agt-titre').textContent = RR.titre(enc ? enc.montant : m);
      if (enc) {
        zb.innerHTML = '<b>' + esc(D.rencontreStatutLbl(enc.statut)) + '</b> — ' + esc(enc.ref) + ' · ' + esc(D.eur(enc.montant)) + ' · ' + esc(enc.lieu)
          + (enc.revendeur
              ? '<br>' + esc(enc.revendeur) + ' vient te rejoindre : il t’appelle au ' + esc(D.telFrLbl(enc.tel)) + ' pour convenir du moment.'
              : '<br>En attente qu’un ' + esc(D.terme('nomade', 'client')) + ' la prenne <span class="dots"><i></i><i></i><i></i></span>')
          + '<button type="button" id="agt-annuler" class="pec-btn-secondary tap" style="display:block;width:100%;margin-top:10px;font-weight:800">Annuler ma demande</button>';
        $('agt-liste').innerHTML = '';
        var zp0 = $('agt-pt'); if (zp0) zp0.hidden = !enc.geoApprox;
        if (zp0 && enc.geoApprox) zp0.innerHTML = 'Point <b>approché</b> — centre de ' + esc(enc.ville) + '.';
        agtCarte(enc);
        return;
      }
      if (serv) {
        zb.innerHTML = '<b>' + esc(serv.revendeur || ('Ton ' + D.terme('nomade', 'client'))) + ' t’a remis ton bon.</b>'
          + '<div style="margin-top:7px;font-family:var(--font-mono,monospace);font-size:14px;font-weight:800;letter-spacing:.08em;color:var(--color-ink)">'
          + serv.codes.map(function (x) { return esc(x); }).join('<br>') + '</div>'
          + '<p style="margin:6px 0 0;font-size:11.5px;line-height:1.5;color:var(--color-muted)">Il ne reste qu’à l’utiliser : range-le dans l’app Mes bons, puis choisis-le pour cette commande.</p>'
          + '<button type="button" id="agt-payer" class="pec-cta tap" style="display:block;width:100%;text-align:center;margin-top:10px">Ouvrir Mes bons avec ce bon</button>';
        $('agt-liste').innerHTML = '';
        var zp1 = $('agt-pt'); if (zp1) zp1.hidden = true;
        agtCarte(null);
        return;
      }
      var prdv = agtPointRdv();
      agtCarte(prdv);
      /* LA LÉGENDE NE PARLE QUE QUAND ELLE A QUELQUE CHOSE À DIRE : le point PRÉCIS se voit ; le point APPROCHÉ ressemble
         à une adresse, il faut le DIRE, avec ce qui le corrige. */
      var zpt = $('agt-pt');
      if (zpt) {
        var flou = !!prdv && prdv.geoApprox;
        zpt.hidden = !flou;
        if (flou) zpt.innerHTML = 'Point <b>approché</b> — centre de ' + esc(prdv.ville) + '. « Utiliser ma position » ou une suggestion d’adresse le pose au mètre.';
      }
      $('agt-montant').innerHTML = RR.montantHTML(m);
      $('agt-garantie').innerHTML = RR.garantieHTML;
      var ville = agtVille(), ags = ville ? RR.joignables(ville) : [];
      var fen = ' Ta demande reste ouverte ' + D.rencontreFenetreMin() + ' min.';
      /* (24/09) LES MOTS DU GLOSSAIRE, VUS DU CLIENT : « distributeur nomade », jamais « mandataire » ni « revendeur » */
      $('agt-dispo').textContent = !ville
        ? 'Saisis l’adresse où il vient te rejoindre — c’est sa commune qui dit à quels ' + D.terme('nomade', 'clientPluriel') + ' proposer la rencontre.'
        : (ags.length ? ags.length + ' ' + D.terme('nomade', ags.length > 1 ? 'clientPluriel' : 'client') + ' se déplace' + (ags.length > 1 ? 'nt' : '') + ' à ' + ville + '.' + fen
                      : RR.personneTxt(ville));
      $('agt-liste').innerHTML = ags.map(function (a) {
        return '<div class="agtc"><span style="flex:1;min-width:0"><span class="nm">' + esc(a.enseigne) + '</span>'
          + '<span class="zn" style="display:block">' + esc(a.zoneLbl) + (a.tarifLbl ? ' · ' + esc(a.tarifLbl) : '') + '</span></span></div>';
      }).join('');
      $('agt-demander').textContent = RR.cta;
      $('agt-demander').disabled = !(m > 0) || (!!ville && !ags.length);
    }
    /* (20/09, fondatrice : « la navigation n'est pas fluide ») CHOISIR UN CHEMIN Y AMÈNE : le volet ouvert vient se placer
       sous le trio, qui reste visible. CE QUI DÉFILE N'EST PAS LA PAGE : `.pec-device` a une hauteur fixe, c'est une zone
       INTÉRIEURE qui défile — on remonte jusqu'au vrai défileur et on le pose nous-mêmes. */
    function defileur(el) {
      for (var p = el.parentElement; p; p = p.parentElement) {
        var ov = getComputedStyle(p).overflowY;
        if ((ov === 'auto' || ov === 'scroll') && p.scrollHeight > p.clientHeight + 4) return p;
      }
      return null;
    }
    function amenerAuVolet(chemin) {
      var z = $(chemin === 'partenaire' ? 'ach-carte-commerce' : chemin === 'agent' ? 'ach-carte-agent' : 'pane-bon');
      if (!z || z.hidden) return;
      var d = defileur(z);
      var hauteur = d ? d.clientHeight : window.innerHeight;
      var haut = d ? (z.getBoundingClientRect().top - d.getBoundingClientRect().top) : z.getBoundingClientRect().top;
      // on ne bouge que s'il y a de quoi : un volet déjà installé dans la moitié haute ne se déplace pas sous les doigts
      if (haut < hauteur * 0.55) return;
      // LE TRIO RESTE À L'ÉCRAN : on s'arrête 90 px au-dessus du volet
      if (d) d.scrollTo({ top: Math.max(0, d.scrollTop + haut - 90), behavior: 'smooth' });
      else if (z.scrollIntoView) z.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    [['op-ou-enligne', 'enligne'], ['op-ou-partenaire', 'partenaire'], ['op-ou-agent', 'agent']].forEach(function (x) {
      var b = $(x[0]); if (!b) return;
      b.addEventListener('click', function () {
        ouChemin = x[1]; if (ouChemin !== 'partenaire') achArreter();
        peindreOu();
        amenerAuVolet(ouChemin);
      });
    });
    if ($('agt-encours')) $('agt-encours').addEventListener('click', function (e) {
      if (!R.rencontre) return;
      var an = e.target.closest ? e.target.closest('#agt-annuler') : null;
      if (an) { var enc = R.rencontre.enCours(); if (enc) R.rencontre.annuler(enc.id); peindreAgent(); return; }
      var py = e.target.closest ? e.target.closest('#agt-payer') : null;
      if (py) { var sv = R.rencontre.servie(); if (sv) poserCode(sv.codes[0]); }
    });
    /* LE BORD ROUGE S'EFFACE DÈS QU'ON CORRIGE : garder la faute affichée pendant qu'on la répare, c'est accuser
       quelqu'un qui est déjà en train de faire ce qu'on lui demande. */
    ['df-numero', 'df-voie', 'df-cp', 'df-ville', 'agt-note'].forEach(function (id) {
      var el = $(id); if (!el) return;
      var net = function () {
        el.classList.remove('ko');
        var e1 = $('agt-erreur'); if (e1) e1.hidden = true;
        var e2 = $('df-err'); if (e2) e2.hidden = true;
      };
      el.addEventListener('input', net); el.addEventListener('change', net);
    });
    /* RETAPER LA VOIE DÉTACHE LA POSITION : elle était celle de l'adresse d'AVANT. Mieux vaut un point approché — et la
       légende qui le dit — qu'une épingle plantée sur la rue précédente. */
    ['df-numero', 'df-voie', 'df-cp', 'df-ville'].forEach(function (id) {
      var el = $(id); if (!el) return;
      el.addEventListener('input', function () {
        if (dfGeo) { dfGeo = null; dfAide(DF_AIDE_NEUVE); $('df-geoloc-txt').textContent = 'Utiliser ma position'; }
      });
      // la commune change les distributeurs nomades joignables et le point de la carte : on repeint à la sortie du champ
      el.addEventListener('change', peindreAgent);
    });
    /* ══ (19/09, nuit) LA RECHERCHE D'ADRESSE — Base Adresse Nationale, via `PEC_GEO.autocompleteAdresse` : la
       suggestion choisie remplit les QUATRE champs et pose la géoposition. « Voie » la garde en secours. ══ */
    function dfRemplir(sug) {
      $('df-numero').value = sug.numero || '';
      $('df-voie').value = sug.voie || sug.label || '';
      $('df-cp').value = sug.cp || '';
      $('df-ville').value = sug.ville || '';
      if (sug.geo) { dfGeo = sug.geo; dfAide('Adresse trouvée et géolocalisée.'); }
      else { dfGeo = null; dfAide('Adresse reprise, sans position : touche « Utiliser ma position » si tu es sur place.'); }
      $('df-geoloc-txt').textContent = 'Utiliser ma position';
      $('df-err').hidden = true;
      [].forEach.call(document.querySelectorAll('#dom-form .pec-input.ko'), function (x) { x.classList.remove('ko'); });
      peindreAgent();
    }
    if (window.PEC_GEO && PEC_GEO.autocompleteAdresse) {
      if ($('df-q')) PEC_GEO.autocompleteAdresse($('df-q'), dfRemplir);
      if ($('df-voie')) PEC_GEO.autocompleteAdresse($('df-voie'), dfRemplir);
    }
    /* ══ (20/09, fondatrice : « il peut changer par SA POSITION … ATTENTION RÉCUPÈRE LE NOM DES RUES ») LA POSITION
       REMPLIT L'ADRESSE, par le reverse de la Base Adresse Nationale (`adresseDepuisPosition`) ; la géoposition gardée
       est celle de l'APPAREIL. Si la base ne reconnaît rien, on le DIT et on garde la position. ══ */
    function dfPositionFix(f) {
      var t = $('df-geoloc-txt');
      achPos = achPos || f;
      dfGeo = { lat: f.lat, lng: f.lng, precision: f.precision };
      t.textContent = 'Lecture de l’adresse…';
      // LE POINT EST DÉJÀ JUSTE : la carte s'y pose TOUT DE SUITE, sans attendre la lecture de la rue
      peindreAgent();
      if (!PEC_GEO.adresseDepuisPosition) { t.textContent = '✓ Position attachée'; return; }
      PEC_GEO.adresseDepuisPosition(f, function (a) {
        if (!a) {
          t.textContent = '✓ Position attachée (~' + (f.precision || 0) + ' m) — la rue n’a pas été reconnue, complète-la ci-dessous.';
          peindreAgent(); return;
        }
        $('df-numero').value = a.numero || '';
        $('df-voie').value = a.voie || '';
        $('df-cp').value = a.cp || '';
        $('df-ville').value = a.ville || '';
        dfGeo = a.geo;
        t.textContent = '✓ ' + (a.label || 'Adresse relevée') + (f.precision ? ' (~' + f.precision + ' m)' : '');
        dfAide('Adresse relevée de ta position — vérifie le numéro.');
        $('df-err').hidden = true;
        [].forEach.call(document.querySelectorAll('#dom-form .pec-input.ko'), function (x) { x.classList.remove('ko'); });
        peindreAgent();
      });
    }
    /* UN ÉCHEC DE POSITION SE LIT EN ENTIER, ET EN ROUGE — dans la ligne de refus du formulaire ; le bouton reprend son nom. */
    function dfEchecPosition(msg) {
      var t = $('df-geoloc-txt'), e = $('df-err');
      if (t) t.textContent = 'Utiliser ma position';
      if (e) { e.hidden = false; e.textContent = msg; if (e.scrollIntoView) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      var q = $('df-q'); if (q && q.focus) q.focus();   // la porte de sortie est juste au-dessus : la recherche
    }
    function dfPosition() {
      var t = $('df-geoloc-txt');
      if (!window.PEC_GEO) { dfEchecPosition('Géolocalisation indisponible sur cet appareil — cherche ton adresse ci-dessus.'); return; }
      t.textContent = 'Recherche de ta position…';
      PEC_GEO.localiser(function (f) {
        PEC_GEO.noterAccord();
        if (PEC_GEO.appliquerRetention) PEC_GEO.appliquerRetention();
        dfPositionFix(f);
      }, dfEchecPosition);
    }
    if ($('df-geoloc')) $('df-geoloc').addEventListener('click', function () {
      /* ON DIT À QUOI ELLE SERT AVANT QUE LE NAVIGATEUR NE LE DEMANDE. Accord déjà donné, déjà répondu, ou site bloqué :
         on ne repose pas la question — dans le dernier cas `dfPosition` échoue tout de suite, et son refus nomme le geste. */
      if (!window.PEC_GEO || !$('geopop') || PEC_GEO.accordConnu() || geopopRepondu || !PEC_GEO.permissionEtat) { dfPosition(); return; }
      PEC_GEO.permissionEtat(function (etat) {
        if (etat !== 'prompt') { dfPosition(); return; }
        geopopApres = dfPositionFix;
        geopopPeindre();
      });
    });
    /* LE CHAMP QUE LE DATA-LAYER NOMME → CELUI QU'ON MARQUE À L'ÉCRAN. La correspondance vit ici, en un seul endroit. */
    var AGT_CHAMPS = { ville: 'df-ville', adresse: 'df-numero', cp: 'df-cp' };
    var rdvBrouillon = null;
    /* L'ADRESSE PART AVEC LA DEMANDE, et le contrôle à blanc du réseau (techRencontreVerifier) dit ce qui manque — avec le
       champ à marquer. Le contrôle d'abord, la modale ensuite : on ne fait pas lire trois écrans pour refuser après. */
    if ($('agt-demander')) $('agt-demander').addEventListener('click', function () {
      var e0 = $('agt-erreur'); e0.hidden = true;
      if (!R.rencontre) return;
      [].forEach.call(document.querySelectorAll('#agt-form .pec-input.ko'), function (x) { x.classList.remove('ko'); });
      var n0 = adrSaisie();
      rdvBrouillon = { adresse: { numero: n0.numero, voie: n0.voie, cp: n0.cp, ville: n0.ville, etage: n0.etage,
        porte: n0.porte, instructions: n0.instructions, geo: dfGeo || null }, note: $('agt-note') ? $('agt-note').value : '' };
      var v0 = R.rencontre.verifier(rdvBrouillon);
      if (!v0.ok) {
        e0.hidden = false; e0.textContent = v0.motif;
        var c0 = v0.champ && AGT_CHAMPS[v0.champ] ? $(AGT_CHAMPS[v0.champ]) : null;
        if (c0) { c0.classList.add('ko'); if (c0.focus) c0.focus(); if (c0.scrollIntoView) c0.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        return;
      }
      rdvPopOuvrir(v0);
    });
    /* ══ LA MODALE DE MISE EN RELATION — ce qui va se passer, le numéro où être appelé, le canal, l'accord. ═══ */
    function rdvPopFermer() { var z = $('rdvpop'); if (z) z.hidden = true; }
    function rdvPopOuvrir(v) {
      var z = $('rdvpop'); if (!z || !R.rencontre) return;
      $('rdvpop-p').innerHTML = R.rencontre.popupHTML;
      $('rdvpop-recap').innerHTML = '<b>' + esc(v.lieu) + '</b><br>' + R.rencontre.recapHTML(v.montant);
      $('rdvpop-rgpd-txt').textContent = rdvConsentementTxt();
      $('rdvpop-rgpd').checked = false;
      $('rdvpop-err').hidden = true;
      rdvPopCta();
      z.hidden = false;
      var ti = $('rdvpop-tel-in'); if (ti && ti.focus) ti.focus();
    }
    function rdvCanal() {
      var b = document.querySelector('#rdvpop-canaux [aria-pressed="true"]');
      return (b && b.getAttribute('data-canal')) || 'appel';
    }
    /* LE LIBELLÉ D'UN CANAL SE LIT SUR SON BOUTON — il n'est écrit qu'une fois, dans le balisage. */
    function rdvCanalLbl(k) {
      var b = document.querySelector('#rdvpop-canaux [data-canal="' + k + '"] span');
      return b ? b.textContent : k;
    }
    // LA PHRASE DE CONSENTEMENT EST CELLE QU'ON ENREGISTRE — pas un résumé poli d'une autre phrase
    function rdvConsentementTxt() {
      return 'J’accepte d’être contacté·e par ' + rdvCanalLbl(rdvCanal()) + ' pour confirmer ce rendez-vous. '
        + ((R.rencontre && R.rencontre.accordSuffixe) || '');
    }
    function rdvPopCta() {
      var ok = $('rdvpop-rgpd').checked, b = $('rdvpop-ok');
      b.setAttribute('aria-disabled', String(!ok));
      b.style.opacity = ok ? '' : '.45';
    }
    if ($('rdvpop-canaux')) $('rdvpop-canaux').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-canal]') : null; if (!b) return;
      [].forEach.call(this.querySelectorAll('[data-canal]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $('rdvpop-rgpd-txt').textContent = rdvConsentementTxt();   // la phrase suit le canal : c'est elle qu'on enregistre
    });
    if ($('rdvpop-rgpd')) $('rdvpop-rgpd').addEventListener('change', rdvPopCta);
    if ($('rdvpop-non')) $('rdvpop-non').addEventListener('click', function () { rdvPopFermer(); });
    if ($('rdvpop-ok')) $('rdvpop-ok').addEventListener('click', function () {
      var e1 = $('rdvpop-err'); e1.hidden = true;
      if (!$('rdvpop-rgpd').checked) { e1.hidden = false; e1.textContent = 'Coche l\'accord : on ne t\'appelle pas sans ton autorisation.'; return; }
      if (!rdvBrouillon || !R.rencontre) { rdvPopFermer(); return; }
      var ti = $('rdvpop-tel-in'); if (ti) ti.classList.remove('ko');
      var rr = R.rencontre.demander(Object.assign({}, rdvBrouillon, { tel: ti ? ti.value : '', canal: rdvCanal(), consentement: rdvConsentementTxt() }));
      if (!rr.ok) {
        e1.hidden = false; e1.textContent = rr.motif;
        if (rr.champ === 'tel' && ti) { ti.classList.add('ko'); ti.focus(); }
        return;
      }
      rdvBrouillon = null;
      rdvPopFermer();
      peindreAgent();
      amenerAuVolet('agent');
    });

      /* CE QUE LA PAGE PEUT DEMANDER AU CHOIX — et rien d'autre : le reste est sa mécanique interne. */
      return {
        choisir: function (c) { ouChemin = c; peindreOu(); },
        peindre: peindreOu,
        rafraichirListe: function () { if (achPeint) achListe(); },
        poserCode: poserCode,
        chemin: function () { return ouChemin; }
      };
    }
  };
})();
