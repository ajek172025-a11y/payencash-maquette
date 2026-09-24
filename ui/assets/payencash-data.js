/* =============================================================================
   PayEnCash — DONNÉES DE DÉMO CENTRALISÉES (fin du code en dur, salve 1)
   -----------------------------------------------------------------------------
   RÈGLE : les écrans ne portent plus de montants/produits/réfs en dur — ils
   consomment PEC_DATA. Modifier le scénario = modifier CE fichier, une fois.
   Salve 1 : app MODE (accueil, fiche, panier) + promos FLY (liste + récap).
   Salves suivantes : tunnels FLY (OFFERS), Où payer, Fournisseur, Manager.
   En production, ce fichier devient les réponses des endpoints (Partie 6b).
   ============================================================================= */
window.PEC_DATA = {

  // ─────────────────────────────────────────────────────────────────────────
  // ASSISTANCE — SOURCE UNIQUE partagée entre l'app client (14-assistance) et
  // l'espace manager (manager/24) : c'est le FLUX inter-apps. Tables miroir :
  // support_conversations, support_messages, reclamations, event_log.
  // Escalade : hôte (2 h ouvrées) → manager (48 h) → médiateur de la consommation de Mes bons
  // (désigné après adhésion — CM2C pressenti ; voir ref.juridique.mediationConso).
  // ─────────────────────────────────────────────────────────────────────────
  assistance: {
    // HOTLINE — l'équipe support DÉLÉGUÉE (fondatrice 24/08 : « le manager ne pourra
    // pas tout faire ») : un superviseur assigne, les hôtes traitent, SEULES les
    // réclamations montent au manager. Tables : hotline_calls, satisfaction_responses.
    hotline: {
      /* (08/09 — audit hotline) L'ÉQUIPE = le référentiel du personnel hotline (miroir manager_users, rôle 'hotline' /
         'superviseur'). Plus de `enLigne` ni `enCharge` écrits ici : la CHARGE se dérive du bus (hotlineEquipe) et la
         PRÉSENCE du planning et de l'heure (hotlinePlanning). Un conseiller invité par le manager (compte hotline)
         rejoint l'équipe par son compte. */
      equipe: [
        { nom: "Naïma", role: "superviseure", compteLogin: "hotline.op" },
        { nom: "Karim", role: "hote" },
        { nom: "Léa",   role: "hote" },
        { nom: "Mehdi", role: "hote" }
      ],
      /* RÈGLE DE BASE de la plateforme (fondatrice 25/08) : CHAQUE TÂCHE est associée au PLANNING — une demande est
         dispatchée à l'hôte EN POSTE sur le créneau, jamais « au premier qui la voit ». Le créneau est une DONNÉE
         (jours ISO 1 = lundi … 7 = dimanche, heures) — « en poste » se CALCULE à l'heure courante (hotlinePlanning),
         il n'est plus écrit. Miroir table hotline_shifts. */
      planning: [
        { nom: "Naïma", jours: [1, 2, 3, 4, 5], de: "08:00", a: "13:00" },
        { nom: "Karim", jours: [1, 2, 3, 4, 5], de: "09:00", a: "18:00" },
        { nom: "Léa",   jours: [1, 2, 3, 4, 5], de: "13:00", a: "20:00" },
        { nom: "Mehdi", jours: [6, 7],          de: "09:00", a: "19:00" }
      ]
      // (08/09) demandes / appels / premiersClients : les trois tableaux « zéro seed » ont disparu — plus AUCUNE page ne les lisait,
      // tout passe par le bus (demandesSav, appels, commandes).
    },
    conversations: [],   // ZÉRO seed — les conversations naissent du chat réel (bus)

    reclamations: [],    // ZÉRO seed — une réclamation n'existe que si un client la dépose

    escalade: {
      hote: "réponse sous 2 h ouvrées",
      manager: "résolution sous 48 h — sinon geste commercial proposé",
      mediateur: { nom: "médiateur de la consommation désigné après adhésion (CM2C pressenti)", delai: "saisine dans l'année qui suit une réclamation écrite restée sans solution", site: "" }
    }
  },

  /* ── Le scénario canonique (une seule vérité pour toutes les apps) ── */
  scenario: {
    demo: false,   // (08/09) drapeau de DÉMONSTRATION : à true, les simulateurs de maquette apparaissent ; jamais en production
    volPrix: 62.35,            // Marseille → Barcelone, tout compris
    trajet: { dep: 'Marseille', arr: 'Barcelone' },   // (08/09 — audit partenaire) le trajet de l'offre canonique est une DONNÉE — plus dérivé du comparatif
    // (18/09, soir) `agentTotal` (70,25 € : le total d'une commande réglée à l'agent, frais de déplacement compris)
    // est parti avec l'agent de caisse mobile.
    /* (09/09 — lot 1 socle) VALEURS VIVES : réglables en 10-configuration. Le getter lit la valeur éditée (paramBrut —
       sans repasser par le chemin, donc sans boucle), sinon le réglage du manager serait journalisé et sans effet. */
    /* (18/09, soir — décisions fondatrice) SONT PARTIS AVEC L'AGENT DE CAISSE MOBILE : les FRAIS DE DÉPLACEMENT
       (plus personne ne se déplace), l'AGENT de démonstration, et le PLAFOND LÉGAL D'ESPÈCES avec son complément par
       carte (art. L112-6 CMF — il visait le paiement d'une dette en espèces à AJEK, qui n'existe plus).
       Ce qui tient lieu de plafond aujourd'hui appartient au Bon d’achat : 250 € par bon d’achat, 1 000 € par client et par jour,
       1 000 € par période de 30 jours glissants au-delà desquels l'identité se vérifie (`ref.bons`). */
    refPaiement: "PEC-Z6DNX8HV",
    refCommande: "CMD-Z6DNX8HV",
    prixBloqueMinutes: 60,
    // Fenêtre du code de paiement (fondatrice 30/08) : une fois le code émis, le PRIX reste bloqué 2 h MAX.
    // Au-delà, la commande est annulée à reprogrammer, SANS frais.
    // (09/09 — lot 3) client absent ou annulation : RIEN n'est dû (aucun règlement encaissé) — voir ref.annulationDomicile ;
    // le commentaire promettait des frais exigibles que ni le bus, ni la comptabilité, ni le référentiel ne créaient.
    _fenetreEncaissementMinutesBase: 120,
    get fenetreEncaissementMinutes() { return window.PEC_DATA.paramBrut('scenario.fenetreEncaissementMinutes', this._fenetreEncaissementMinutesBase); },
    /* (18/09, soir) L'APPOINT ET LES BILLETS DE 200/500 € SONT PARTIS AVEC L'AGENT : plus personne ne compte des
       espèces devant le client, donc plus de « sac de pièces » à préparer, plus de gros billet à refuser, plus de
       monnaie à rendre. Ce qui reste de LCB-FT vaut pour l'AVOIR et le remboursement par virement — et, côté Bon d’achat,
       ce sont ses propres plafonds (250 € par bon d’achat, 1 000 € par client et par jour) qui tiennent ce rôle. */
    lcbft: { seuilCommande: 300, virementHeures: 48, avoirValiditeMois: 12, source: "Politique espèces PayEnCash — LCB-FT (à valider par un pro)" },
    waitlistPrioriteMinutes: 15,
    voyageursMax: 6,                  // nombre maximal de voyageurs par commande Fly (récap promo)      // file d'attente pièce unique : durée de priorité du 1er de la file (02-article)
    /* (12/09/2026 — arbitrage fondatrice) LA GRILLE MODE. La marge est
       INDÉPENDANTE des frais : prix client = prix d'achat + 7 % + livraison au
       poids + contrôle atelier. Elle remplace `coefVenteMode: 1.12`, où la marge
       absorbait la livraison et l'atelier — un colis de 4 kg coûtait 15,99 € et se
       refacturait comme un colis d'un kilo, la différence sortait de la marge.
       LIVRAISON : tarifs publics Mondial Relay, mode 24R (Point Relais®), France
       métropolitaine, TTC, relevés le 12/09/2026. Les tranches sont indexées sur le
       POIDS EN GRAMMES — l'unité du paramètre `Poids` de l'API Mondial Relay
       (Web Service v5.11, avril 2024 : grammes, minimum 15 g, mode 24R).
       `tarifsContrat` prend le pas dès que le contrat e-commerçant est signé.
       Hors tranche (poids absent, < 15 g ou > 25 kg) : PAS DE PRIX, et on le dit. */
    grilleMode: {
      marge: 7,                 // EN POURCENTAGE, comme ref.marges.volSeul — réglable en 10-configuration
      /* (19/09 — décision fondatrice « la marge d'un lien partagé n'est pas celle de l'accueil ») LA SECONDE MARGE.
         Quand la pièce est atteinte par le LIEN qu'un fournisseur a partagé (mode/24-lien), PayEnCash prend une
         marge PLUS FAIBLE : la différence est rendue au client, affichée « remise PayEnCash ». Le fournisseur,
         lui, touche exactement le même prix d'achat — la remise sort de NOTRE marge, jamais de la sienne.
         C'est ce qui donne au partage une valeur réelle : le client a intérêt à passer par le lien de l'atelier.
         EN POURCENTAGE, comme `marge`, et bornée par elle (au-delà, un lien coûterait plus cher que l'accueil). */
      margePartage: 4,          // EN POURCENTAGE — réglable en 10-configuration, toujours ≤ marge
      atelier: 2.20,            // contrôle et authentification, forfait
      plancherAchat: 5,         // plancher COMMERCIAL (une remise ne vide pas la facture)
      /* (19/09, soir — décision fondatrice « aucun article ne peut coûter plus de 1 000 €, c'est impossible »)
         LE PLAFOND DU PRIX CLIENT. Il n'existait nulle part : un atelier pouvait publier une pièce à 3 000 € et
         elle partait au catalogue. Deux raisons de le poser, et elles ne sont pas seulement commerciales :
         notre client paie avec un bon d’achat, avec des Bons d'achat de 250 € et 1 000 € par jour et par compte (bonsRef)
         — au-delà de 1 000 €, il n'y a tout simplement AUCUN moyen de régler la commande. Le plafond porte sur
         le PRIX CLIENT (achat + marge + atelier) ; c'est lui que la cliente voit et que le bon doit couvrir. */
      plafondClient: 1000,      // € TTC, prix client maximum d'une pièce — réglable en 10-configuration
      livraison: {
        service: "24R", transporteur: "Mondial Relay",
        source: "tarifs publics France métropolitaine, TTC, relevés le 12/09/2026",
        poidsMin: 15, poidsMax: 25000,
        tranches: [
          { jusqua:   500, prix:  4.15 },
          { jusqua:  1000, prix:  5.99 },
          { jusqua:  3000, prix:  7.99 },
          { jusqua: 10000, prix: 15.99 },
          { jusqua: 25000, prix: 25.99 }
        ],
        tarifsContrat: null
      }
    },
    cagnottePoints: 128,
    // Compteurs « comparés aujourd'hui » (fondatrice 31/08 : sourcés, plus de nombre
    // magique dans l'accueil). Le marketing « plus de 200 compagnies » / « 180 000
    // hôtels » (claims de catalogue, testés au banc) reste une copie éditoriale.
    compagniesComparees: 213,
    hotelsCompares: 1250
  },

  /* ── Réservations du compte (suivi complet : en cours → à régler · payées → détail) ── */
  reservations: [],

  /* ── Fiscalité (source : partie financière — jamais de TVA détaillée sous régime de la marge) ── */
  fiscalite: {
    _tvaTauxNeufBase: 20,
    get tvaTauxNeuf() { return window.PEC_DATA.paramBrut('fiscalite.tvaTauxNeuf', this._tvaTauxNeufBase); },   // (09/09 — lot 1 socle) valeur VIVE (10-configuration) : panierTva et les parcours la lisaient en direct
    voyage:   { regime: "marge",    mention: "Prix TTC — TVA sur la marge (art. 297 A CGI) : la TVA ne figure pas sur la facture." },
    occasion: { regime: "marge",    mention: "Reconditionné : TVA sur la marge des biens d'occasion (art. 297 A CGI) — non détaillée sur la facture." },
    neuf:     { regime: "classique", mention: "Articles neufs : TVA 20 % incluse dans le prix." }
  },

  /* ── Catalogue MODE (esprit Zara × Vinted : l'état est l'identité) ── */
  mode: {
    articles: [
      { id: "airmax", genre: "homme", nom: "Air Max 97", marque: "Nike", taille: "42", categorie: "sneakers", souscategorie: "Lifestyle",
        etat: "Très bon état", badge: "reco", condition: "Reconditionnée", fiscal: "occasion",
        prix: 150, prixNeuf: 240, favoris: 57, ref: "2408/820/97",
        photo: "photo-airmax.jpg", idl: "Nike · 42 · Très bon état",
        piece_unique: true, authentifiee: true,
        couleur: "Rouge feu", couleurHex: "#C0392B", matiere: "Mesh & cuir", coupe: "Basse", motif: "Uni", ajout: 3, ageJours: 6,
        certificat: { ref: "CERT-M-2408820", par: "Atelier PayEnCash · Marignane", date: "12 août 2026", points: 21,
          verifs: ["Coutures & surpiqûres", "Étiquette et code de production", "Semelle & gravures", "Matières et finitions"] },
        historiquePrix: [ { d: "il y a 26 j", p: 165 }, { d: "il y a 12 j", p: 150 } ], prixBas30j: 150,
        description: "Basket rétro à tige mesh. Semelle amortie. Coloris rouge feu. Livrée dans sa boîte d'origine.",
        defaut: "micro-usure de la semelle (photo 3)",
        composition: [["Tige", "mesh · cuir"], ["Semelle", "caoutchouc · unité air"], ["Doublure", "textile"], ["Entretien", "nettoyée & désinfectée en atelier"]] },
      { id: "jordan", genre: "homme", nom: "Jordan 4", marque: "Jordan", taille: "43", categorie: "sneakers", souscategorie: "Basketball",
        etat: "Neuf sans étiquette", badge: "reco", condition: "Reconditionnée", fiscal: "occasion",
        prix: 210, prixNeuf: 320, favoris: 29, ref: "2408/821/43",
        photo: "photo-jordan.jpg", idl: "Jordan · 43 · Neuf sans étiquette",
        piece_unique: true, authentifiee: true,
        couleur: "Blanc / bleu royal", couleurHex: "#2B4C9B", matiere: "Cuir & toile", coupe: "Montante", motif: "Uni", ajout: 4, ageJours: 3,
        certificat: { ref: "CERT-M-2408821", par: "Atelier PayEnCash · Marignane", date: "13 août 2026", points: 21,
          verifs: ["Cuir & matériaux", "Étiquette et code de production", "Semelle & gravures", "Boîte et accessoires"] },
        historiquePrix: [ { d: "à la mise en vente", p: 210 } ], prixBas30j: 210,
        description: "Sneaker montante, cuir et toile. Jamais portée.",
        defaut: null,
        composition: [["Tige", "cuir · toile"], ["Semelle", "caoutchouc"], ["Doublure", "textile"]] },
      { id: "robe", genre: "femme", nom: "Robe de soirée", marque: "Chez Awa · création", taille: "M", categorie: "pap", souscategorie: "Robes",
        etat: "Neuf", badge: "neuf", condition: "Neuve", fiscal: "neuf",
        prix: 85, prixNeuf: null, favoris: 14, ref: "AWA-RB-0012",
        photo: "photo-robe.jpg", idl: "Chez Awa · M · pièce unique",
        piece_unique: true, authentifiee: false,
        couleur: "Émeraude", couleurHex: "#0E7A5F", matiere: "Satin de coton", coupe: "Cintré", motif: "Uni", ajout: 2, ageJours: 34,
        certificat: null,
        historiquePrix: [ { d: "à la mise en vente", p: 85 } ], prixBas30j: 85,
        description: "Robe longue fluide, création de la maison Awa. Pièce unique confectionnée à Paris 18ᵉ.",
        defaut: null,
        composition: [["Tissu", "satin de coton"], ["Doublure", "viscose"], ["Entretien", "lavage main"]] },
      { id: "sac", genre: "mixte", nom: "Sac bandoulière cuir", marque: "Accessoire", taille: "Unique", categorie: "accessoires", souscategorie: "Sacs bandoulière & pochettes",
        etat: "Neuf", badge: "neuf", condition: "Neuf", fiscal: "neuf",
        prix: 45, prixNeuf: null, favoris: 8, ref: "ACC-SC-0034",
        photo: "photo-sac.jpg", idl: "Accessoire · cuir pleine fleur",
        piece_unique: false, authentifiee: false,
        couleur: "Cognac", couleurHex: "#9A5B2E", matiere: "Cuir pleine fleur", coupe: "", motif: "Uni", ajout: 1, ageJours: 41,
        certificat: null,
        historiquePrix: [ { d: "il y a 20 j", p: 55 }, { d: "il y a 6 j", p: 45 } ], prixBas30j: 45,
        description: "Sac bandoulière en cuir pleine fleur, fermoir doré.",
        defaut: null,
        composition: [["Extérieur", "cuir pleine fleur"], ["Doublure", "coton"], ["Bandoulière", "cuir"]] }
    ],
/* ── Recherche & navigation (audit fondatrice : Zara × Vinted) ── */
marques: [
  { id: "nike", nom: "Nike", pieces: 2 }, { id: "jordan", nom: "Jordan", pieces: 1 },
  { id: "awa", nom: "Chez Awa", pieces: 2 }, { id: "adidas", nom: "Adidas", pieces: 0 },
  { id: "levis", nom: "Levi's", pieces: 0 }, { id: "lacoste", nom: "Lacoste", pieces: 0 }
],
// SOUS-CATÉGORIES = MÊME taxonomie que categoriesArbre (source unique) : le générateur, le
// filtre Type, le fil d'ariane et l'accueil parlent des MÊMES sous-catégories que les pièces.
categories: [
  { id: "tout", nom: "Tout", sous: [] },   /* (fondatrice 06/09) « à la place de "tout voir" écris "tout" » */
  { id: "pap", nom: "Prêt-à-porter", sous: ["Robes", "Manteaux & doudounes", "Vestes & blousons", "Blazers & tailleurs", "Ensembles & costumes", "Pulls & gilets", "Sweats & hoodies", "Chemises & blouses", "Tops & bodies", "T-shirts & débardeurs", "Jeans", "Pantalons", "Shorts", "Jupes", "Combinaisons", "Survêtements", "Maillots de bain"] },
  { id: "sneakers", nom: "Sneakers", sous: ["Lifestyle", "Running", "Basketball", "Montantes", "Skate", "Trail", "Tennis", "Rétro / vintage", "Éditions limitées", "Slides & claquettes"] },
  { id: "accessoires", nom: "Accessoires", sous: ["Sacs à main", "Sacs à dos", "Sacs bandoulière & pochettes", "Portefeuilles & petite maroquinerie", "Ceintures", "Montres", "Bijoux", "Lunettes", "Casquettes & chapeaux", "Bonnets & écharpes", "Gants", "Foulards & étoles"] },
  { id: "reconditionne", nom: "Reconditionné", sous: ["Très bon état", "Neuf sans étiquette", "Bon état"] }
],
/* Catalogue de marques (wizard fournisseur) : le fournisseur SÉLECTIONNE dans le
   référentiel — ou « Sans marque » — ou PROPOSE une marque (vérifiée à l'atelier
   avec la pièce). Jamais de champ marque en texte libre incontrôlé. */
catalogueMarques: {
  // Référentiel EXHAUSTIF (audit 02/09 : « les marques sont faibles »). Trois niveaux :
  //   segments        → gamme de prix (le générateur en dérive son multiplicateur : luxe ×3,2, premium ×1,6)
  //   parCategorie    → liste LARGE (repli quand la sous-catégorie n'a pas de liste dédiée)
  //   parSousCategorie→ liste PRIORITAIRE, liée au type de pièce (jamais « une robe Air Jordan »)
  // Le wizard fournisseur (03-ajouter-piece) et le filtre Marque (09-recherche) lisent la MÊME table
  // via marquesPour(cat, sous) — recherche libre côté fournisseur, tri par fréquence côté client.
  segments: {
    luxe: ["Chanel", "Dior", "Louis Vuitton", "Hermès", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Céline", "Loewe", "Bottega Veneta", "Givenchy", "Valentino", "Versace", "Dolce & Gabbana", "Fendi", "Miu Miu", "Balmain", "Off-White", "Alexander McQueen", "Burberry", "Moncler", "Canada Goose", "Chloé", "Stella McCartney", "Marni", "Jil Sander", "Maison Margiela", "Rick Owens", "Comme des Garçons", "Yohji Yamamoto", "Issey Miyake", "Kenzo", "Courrèges", "Paco Rabanne", "Mugler", "Lanvin", "Jacquemus", "Lemaire", "The Row", "Zimmermann", "Amiri", "Golden Goose", "Common Projects", "Yeezy", "Travis Scott", "Sacai", "Max Mara", "Brunello Cucinelli", "Loro Piana", "Tom Ford", "Berluti", "J.M. Weston", "Church's", "Tod's", "Santoni", "Hogan", "Jimmy Choo", "Christian Louboutin", "Manolo Blahnik", "Roger Vivier", "Goyard", "Delvaux", "Moynat", "Cartier", "Rolex", "Omega", "Tag Heuer", "Breitling", "Tudor", "IWC", "Panerai", "Jaeger-LeCoultre", "Audemars Piguet", "Patek Philippe", "Van Cleef & Arpels", "Tiffany & Co.", "Bulgari", "Chopard", "Messika", "Boucheron", "Chaumet", "Y-3", "Fear of God", "Vetements", "Casablanca", "Palm Angels", "Marine Serre", "Acne Studios"],
    premium: ["Nike", "Nike SB", "Jordan", "Adidas", "Adidas Originals", "New Balance", "Asics", "Hoka", "On", "Salomon", "Veja", "Autry", "Axel Arigato", "Lacoste", "Ralph Lauren", "Tommy Hilfiger", "Hugo Boss", "Calvin Klein", "Gant", "Fred Perry", "Barbour", "Stone Island", "C.P. Company", "Carhartt", "The North Face", "Patagonia", "Arc'teryx", "Diesel", "G-Star Raw", "Nudie Jeans", "Jacob Cohën", "A.P.C.", "AMI", "Isabel Marant", "Sandro", "Maje", "Claudie Pierlot", "The Kooples", "Ba&sh", "Sézane", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "Reformation", "Ganni", "Samsøe Samsøe", "Filippa K", "Norse Projects", "Our Legacy", "Officine Générale", "Maison Kitsuné", "Aimé Leon Dore", "Stüssy", "Supreme", "Palace", "A Bathing Ape", "Represent", "Corteiz", "Kith", "Napapijri", "Pyrenex", "Woolrich", "Schott", "Aigle", "Saint James", "Armor Lux", "Eric Bompard", "American Vintage", "Bellerose", "Sessùn", "Vanessa Bruno", "Longchamp", "Michael Kors", "Coach", "Kate Spade", "Tory Burch", "Marc Jacobs", "Furla", "Lancel", "Le Tanneur", "Polène", "Jérôme Dreyfuss", "Fjällräven", "Rains", "Sandqvist", "Ray-Ban", "Persol", "Oakley", "Oliver Peoples", "Moscot", "Garrett Leight", "Gentle Monster", "Vuarnet", "Seiko", "Tissot", "Longines", "Hamilton", "Oris", "Frédérique Constant", "Baume & Mercier", "Raymond Weil", "Garmin", "Apple", "Fossil", "Yema", "Pandora", "Swarovski", "APM Monaco", "Dinh Van", "Fred", "Missoma", "Mejuri", "Monica Vinader", "New Era", "Kangol", "Borsalino", "Stetson", "Hestra", "Roeckl", "Agnelle", "Faliero Sarti", "Épice", "Timberland", "Dr. Martens", "Clarks", "UGG", "Birkenstock", "Paraboot", "Repetto", "Sebago", "Camper", "Mephisto", "Philippe Model", "Premiata", "P448", "Vilebrequin", "Orlebar Brown", "Eres", "Aubade", "Chantelle", "Simone Pérèle", "Bonpoint", "Jacadi", "Tartine et Chocolat", "Petit Bateau", "Mini Rodini", "Bobo Choses", "Lululemon", "Alo Yoga", "Onitsuka Tiger", "Karhu", "Mizuno", "Saucony", "Brooks", "Salomon Sportstyle", "Merrell", "La Sportiva", "Scarpa", "Inov-8", "Altra", "Bexley", "Heschung", "Bobbies", "Faguo"]
  },
  parCategorie: {
    "Sneakers": ["Nike", "Nike SB", "Jordan", "Adidas", "Adidas Originals", "Yeezy", "New Balance", "Puma", "Reebok", "Asics", "Onitsuka Tiger", "Saucony", "Hoka", "On", "Salomon", "Vans", "Converse", "Veja", "Autry", "Golden Goose", "Common Projects", "Axel Arigato", "Diadora", "Kappa", "Fila", "Le Coq Sportif", "K-Swiss", "Lacoste", "Karhu", "Mizuno", "Brooks", "Under Armour", "Ewing Athletics", "Palladium", "Superga", "Bensimon", "Spring Court", "Etnies", "DC Shoes", "Emerica", "Lakai", "Globe", "Skechers", "Ellesse", "Umbro", "Hummel", "Gola", "Walsh", "Novesta", "Tretorn", "Li-Ning", "Anta", "361°", "Inov-8", "Altra", "Merrell", "La Sportiva", "Scarpa", "Columbia", "Keen", "Teva", "Timberland", "Dr. Martens", "Clarks", "UGG", "Birkenstock", "Crocs", "Havaianas", "Ipanema", "Kickers", "Geox", "Camper", "Mephisto", "Hogan", "Tod's", "Philippe Model", "Premiata", "P448", "Balenciaga", "Alexander McQueen", "Gucci", "Dior", "Louis Vuitton", "Prada", "Saint Laurent", "Valentino", "Givenchy", "Burberry", "Maison Margiela", "Rick Owens", "Y-3", "Lanvin", "Off-White", "Amiri", "Represent", "Moncler", "Stone Island", "A Bathing Ape", "Champion", "Zadig & Voltaire", "Isabel Marant", "Sézane", "Bobbies", "Faguo", "Piola", "Ector", "Victoria", "Cienta", "Natural World", "Fear of God", "Travis Scott", "Sacai", "Corteiz", "Aimé Leon Dore", "Bad Bunny", "Union", "A Ma Maniére", "Patta", "Kith", "Salomon Sportstyle", "Arc'teryx", "Norda", "Nnormal", "Craft", "Joma", "Kelme", "Decathlon"],
    "Prêt-à-porter": ["Zara", "H&M", "Mango", "Uniqlo", "Primark", "Bershka", "Pull & Bear", "Stradivarius", "Massimo Dutti", "COS", "Arket", "& Other Stories", "Monki", "Weekday", "Kiabi", "Jules", "Celio", "Camaïeu", "Promod", "Etam", "Undiz", "Cache Cache", "Bonobo", "Naf Naf", "Morgan", "Pimkie", "Jennyfer", "Gémo", "La Halle", "Monoprix", "Cyrillus", "Damart", "Sandro", "Maje", "Claudie Pierlot", "The Kooples", "Ba&sh", "Sézane", "Rouje", "Sœur", "Isabel Marant", "A.P.C.", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Petit Bateau", "Aigle", "Saint James", "Armor Lux", "Le Slip Français", "Faguo", "Bensimon", "Des Petits Hauts", "Vanessa Bruno", "Ines de la Fressange", "Balibaris", "Octobre Éditions", "Hast", "Bréal", "Devred", "Brice", "Father & Sons", "Lacoste", "Le Coq Sportif", "Eden Park", "Vicomte A.", "Serge Blanco", "Gant", "Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Fred Perry", "Barbour", "Burberry", "Moncler", "Canada Goose", "Stone Island", "C.P. Company", "Carhartt", "Dickies", "Levi's", "Lee", "Wrangler", "Diesel", "G-Star Raw", "Nudie Jeans", "Acne Studios", "AMI", "Jacquemus", "Lemaire", "Officine Générale", "Our Legacy", "Norse Projects", "Filippa K", "Samsøe Samsøe", "Ganni", "Stine Goya", "Rotate", "Reformation", "Free People", "Anthropologie", "Urban Outfitters", "Abercrombie & Fitch", "Hollister", "American Vintage", "Bellerose", "Sessùn", "Maison Kitsuné", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Hermès", "Céline", "Loewe", "Bottega Veneta", "Givenchy", "Valentino", "Versace", "Dolce & Gabbana", "Fendi", "Miu Miu", "Balmain", "Off-White", "Alexander McQueen", "Max Mara", "Chloé", "Stella McCartney", "Marni", "Jil Sander", "Maison Margiela", "Comme des Garçons", "Yohji Yamamoto", "Issey Miyake", "Rick Owens", "Kenzo", "Courrèges", "Paco Rabanne", "Mugler", "Lanvin", "Nina Ricci", "Agnès b.", "The Row", "Zimmermann", "Brunello Cucinelli", "Loro Piana", "Tom Ford", "Supreme", "Stüssy", "Palace", "A Bathing Ape", "Fear of God", "Essentials", "Corteiz", "Trapstar", "Represent", "Cole Buxton", "Aimé Leon Dore", "Noah", "Brain Dead", "Kith", "Huf", "Obey", "Thrasher", "Vans", "Champion", "Russell Athletic", "Ellesse", "Fila", "Kappa", "Sergio Tacchini", "Umbro", "Napapijri", "The North Face", "Patagonia", "Columbia", "Arc'teryx", "Salomon", "Helly Hansen", "Jack Wolfskin", "Quiksilver", "Billabong", "Rip Curl", "Volcom", "Element", "Hurley", "O'Neill", "Roxy", "Oxbow", "Sun Valley", "Nike", "Adidas", "Puma", "Reebok", "Under Armour", "New Balance", "Asics", "Lululemon", "Gymshark", "Oysho", "Alo Yoga", "Decathlon", "Aubade", "Chantelle", "Simone Pérèle", "Darjeeling", "Princesse tam.tam", "Calzedonia", "Intimissimi", "Tezenis", "Victoria's Secret", "Eres", "Speedo", "Arena", "Seafolly", "Banana Moon", "Pain de Sucre", "Vilebrequin", "Orlebar Brown", "Sundek", "Jacadi", "Bonpoint", "Tartine et Chocolat", "Catimini", "Okaïdi", "Obaïbi", "Vertbaudet", "DPAM", "Sergent Major", "Zara Kids", "H&M Kids", "Mini Rodini", "Bobo Choses", "Tinycottons", "Molo", "Name it", "Absorba", "Jott", "Pyrenex", "Woolrich", "Schott", "Eric Bompard", "Benetton", "Esprit", "Gap", "Superdry", "Jack & Jones", "Only", "Vero Moda", "Selected", "Scotch & Soda", "Desigual", "Guess", "Michael Kors", "Marc Jacobs", "Karl Lagerfeld", "Armani Exchange", "Emporio Armani", "Polo Ralph Lauren", "Lyle & Scott", "Ben Sherman", "Merc", "Sunspel", "John Smedley", "Uniqlo U", "Vetements", "Casablanca", "Palm Angels", "Marine Serre", "Coperni", "Ottolinger", "Rains", "Nobis", "Mackage", "Parajumpers", "Colmar", "Fusalp", "Rossignol", "Picture Organic", "Vuarnet"],
    "Accessoires":   ["Louis Vuitton", "Hermès", "Chanel", "Dior", "Gucci", "Prada", "Bottega Veneta", "Loewe", "Céline", "Fendi", "Balenciaga", "Saint Laurent", "Chloé", "Givenchy", "Valentino", "Miu Miu", "Goyard", "Delvaux", "Moynat", "Coach", "Michael Kors", "Kate Spade", "Tory Burch", "Marc Jacobs", "Furla", "Longchamp", "Lancel", "Le Tanneur", "Polène", "Sézane", "Jérôme Dreyfuss", "Vanessa Bruno", "A.P.C.", "Maison Kitsuné", "Isabel Marant", "Jacquemus", "JW Anderson", "Staud", "Cult Gaia", "Mansur Gavriel", "Telfar", "Anya Hindmarch", "Herschel", "Eastpak", "Fjällräven", "Kipling", "Lancaster", "Mac Douglas", "Sandqvist", "Rains", "Bellroy", "Secrid", "Osprey", "Deuter", "Quechua", "Dakine", "Vans", "Nike", "Adidas", "Carhartt", "Cabaïa", "Lefrik", "Jack Gomme", "Bensimon", "Samsonite", "Delsey", "Tumi", "Rimowa", "Away", "Levi's", "Diesel", "Lacoste", "Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Maison Boinet", "Anderson's", "Off-White", "Rolex", "Omega", "Cartier", "Tag Heuer", "Breitling", "Tudor", "Longines", "Tissot", "Seiko", "Citizen", "Casio", "G-Shock", "Swatch", "Fossil", "Daniel Wellington", "Cluse", "Garmin", "Apple", "Samsung", "Timex", "Hamilton", "Oris", "IWC", "Panerai", "Jaeger-LeCoultre", "Audemars Piguet", "Patek Philippe", "Baume & Mercier", "Frédérique Constant", "Raymond Weil", "Lip", "Yema", "Herbelin", "Pierre Lannier", "Festina", "Lorus", "Ice-Watch", "Nixon", "Van Cleef & Arpels", "Tiffany & Co.", "Bulgari", "Chopard", "Messika", "Boucheron", "Chaumet", "Dinh Van", "Fred", "Pandora", "Swarovski", "Agatha", "Les Georgettes", "Thomas Sabo", "Zag Bijoux", "Aristocrazy", "Missoma", "Mejuri", "Monica Vinader", "APM Monaco", "Gas Bijoux", "Histoire d'Or", "Maty", "Vivienne Westwood", "Goossens", "Ray-Ban", "Oakley", "Persol", "Tom Ford", "Versace", "Carrera", "Polaroid", "Vuarnet", "Izipizi", "Jimmy Fairly", "Moscot", "Garrett Leight", "Oliver Peoples", "Gentle Monster", "Chimi", "Le Specs", "Quay", "Bollé", "Julbo", "Cébé", "Maui Jim", "Hawkers", "Komono", "New Era", "47 Brand", "Mitchell & Ness", "Stüssy", "Supreme", "Kangol", "Borsalino", "Stetson", "Barts", "Buff", "The North Face", "Patagonia", "Von Dutch", "Acne Studios", "Burberry", "Moncler", "Canada Goose", "Eric Bompard", "Saint James", "Monoprix", "Uniqlo", "COS", "Arket", "Bonpoint", "Roeckl", "Agnelle", "Hestra", "Dents", "Isotoner", "Maison Fabre", "Causse", "Faliero Sarti", "Épice", "Inouitoosh", "Bindi", "Moismont", "Alexander McQueen", "Zadig & Voltaire", "Napapijri", "Champion", "Ellesse", "Fila", "Kappa", "Puma", "Reebok", "Under Armour", "New Balance", "Zara", "H&M", "Mango", "Massimo Dutti", "Parfois", "Pimkie", "Claudie Pierlot", "Sandro", "Maje", "The Kooples", "Ba&sh", "Rouje", "Petit Bateau", "Jacadi", "Okaïdi"]
  },
  parSousCategorie: {
    // — Sneakers —
    "Lifestyle":            ["Nike", "Jordan", "Adidas", "Adidas Originals", "New Balance", "Puma", "Vans", "Converse", "Veja", "Reebok", "Asics", "Onitsuka Tiger", "On", "Axel Arigato", "Autry", "Golden Goose", "Common Projects", "Diadora", "Karhu", "Saucony", "Le Coq Sportif", "Lacoste", "Fila", "Kappa", "Ellesse", "Superga", "Bensimon", "Spring Court", "Novesta", "Gola", "Walsh", "Tretorn", "Hummel", "Philippe Model", "Premiata", "P448", "Hogan", "Tod's", "Faguo", "Piola", "Ector", "Sézane", "Zadig & Voltaire", "Isabel Marant", "Bobbies", "Skechers", "Geox", "Camper", "Gucci", "Balenciaga", "Dior", "Louis Vuitton", "Prada", "Saint Laurent", "Valentino", "Givenchy", "Burberry", "Alexander McQueen", "Maison Margiela", "Rick Owens", "Y-3", "Lanvin", "Off-White", "Amiri", "Represent", "Moncler", "Stone Island", "A Bathing Ape", "Salomon Sportstyle", "Hoka", "Mizuno"],
    "Running":              ["Nike", "Adidas", "Asics", "New Balance", "Hoka", "On", "Saucony", "Brooks", "Mizuno", "Puma", "Under Armour", "Salomon", "Altra", "Reebok", "Kalenji", "Decathlon", "Craft", "Diadora", "Karhu", "Newton", "Topo Athletic", "361°", "Li-Ning", "Anta", "Skechers", "Nnormal", "Norda", "Veja"],
    "Basketball":           ["Nike", "Jordan", "Adidas", "Under Armour", "Puma", "New Balance", "Reebok", "Converse", "Li-Ning", "Anta", "361°", "Peak", "Ewing Athletics", "And1", "Fila", "K1X", "Champion", "Spalding"],
    "Montantes":            ["Nike", "Jordan", "Converse", "Vans", "Adidas", "New Balance", "Reebok", "Puma", "Timberland", "Palladium", "Dr. Martens", "Clarks", "UGG", "Sorel", "Kickers", "Caterpillar", "Red Wing", "Blundstone", "Moon Boot", "Balenciaga", "Rick Owens", "Maison Margiela", "Off-White", "Golden Goose", "Fear of God", "Y-3", "Diadora", "Fila", "Hummel"],
    "Skate":                ["Vans", "Nike SB", "Adidas", "Converse", "DC Shoes", "Etnies", "Emerica", "Lakai", "New Balance Numeric", "ÉS", "Globe", "Osiris", "Fallen", "Supra", "Huf", "Last Resort AB", "Hours Is Yours", "Cariuma", "State Footwear", "Element"],
    "Trail":                ["Salomon", "Hoka", "La Sportiva", "Merrell", "Asics", "Nike", "Adidas", "Saucony", "Scarpa", "Inov-8", "Altra", "Brooks", "Dynafit", "Norda", "Nnormal", "The North Face", "Arc'teryx", "Columbia", "Kalenji", "Evadict", "Mizuno", "New Balance", "On", "Topo Athletic", "Craft", "Keen"],
    "Tennis":               ["Nike", "Adidas", "Asics", "New Balance", "Wilson", "Babolat", "K-Swiss", "Lacoste", "Diadora", "Head", "Yonex", "Fila", "Sergio Tacchini", "Le Coq Sportif", "Artengo", "Decathlon", "Mizuno", "Joma", "Puma", "On"],
    "Rétro / vintage":      ["Nike", "Adidas", "Adidas Originals", "New Balance", "Puma", "Reebok", "Asics", "Onitsuka Tiger", "Saucony", "Diadora", "Karhu", "Le Coq Sportif", "Fila", "Kappa", "Ellesse", "Umbro", "Hummel", "Gola", "Walsh", "Tretorn", "Converse", "Vans", "K-Swiss", "Etonic", "Patrick", "Pony", "British Knights", "LA Gear", "Troop", "Champion"],
    "Éditions limitées":    ["Nike", "Jordan", "Adidas", "New Balance", "Yeezy", "Off-White", "Travis Scott", "Sacai", "Fear of God", "A Ma Maniére", "Union", "Corteiz", "Bad Bunny", "Aimé Leon Dore", "Patta", "Kith", "Supreme", "Palace", "Stüssy", "A Bathing Ape", "Fragment", "Cactus Jack", "Nike SB", "Salehe Bembury", "Joe Freshgoods", "Bodega", "Concepts", "Undefeated", "Atmos", "Ambush", "Comme des Garçons", "Junya Watanabe", "Cactus Plant Flea Market", "Ronnie Fieg", "Gucci", "Dior", "Louis Vuitton", "Balenciaga", "Prada", "Maison Margiela", "Rick Owens", "Y-3"],
    "Slides & claquettes":  ["Adidas", "Nike", "Puma", "Birkenstock", "Crocs", "The North Face", "Yeezy", "Reebok", "Havaianas", "Ipanema", "Teva", "Chaco", "Keen", "UGG", "Gucci", "Balenciaga", "Dior", "Louis Vuitton", "Fendi", "Prada", "Hermès", "Off-White", "Fila", "Champion", "Lacoste", "Under Armour", "Hoka", "Oofos", "Suicoke", "Merrell", "Rider", "Vilebrequin", "Zara", "H&M"],
    // — Prêt-à-porter —
    "Robes":                ["Zara", "Mango", "H&M", "Maje", "Sandro", "Sézane", "Rouje", "The Kooples", "Ba&sh", "Claudie Pierlot", "Sœur", "Reformation", "Ralph Lauren", "Massimo Dutti", "COS", "Arket", "& Other Stories", "Uniqlo", "Bershka", "Stradivarius", "Pull & Bear", "Promod", "Naf Naf", "Morgan", "Kiabi", "Camaïeu", "Cache Cache", "Pimkie", "Jennyfer", "Etam", "Monoprix", "Cyrillus", "Comptoir des Cotonniers", "IKKS", "Zadig & Voltaire", "Isabel Marant", "A.P.C.", "Vanessa Bruno", "Ines de la Fressange", "Des Petits Hauts", "American Vintage", "Sessùn", "Bellerose", "Ganni", "Stine Goya", "Rotate", "Samsøe Samsøe", "Free People", "Anthropologie", "Urban Outfitters", "Desigual", "Guess", "Michael Kors", "Karl Lagerfeld", "Tommy Hilfiger", "Lacoste", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Céline", "Loewe", "Valentino", "Versace", "Dolce & Gabbana", "Fendi", "Miu Miu", "Balmain", "Chloé", "Stella McCartney", "Max Mara", "Jacquemus", "Lemaire", "The Row", "Zimmermann", "Alexander McQueen", "Givenchy", "Marni", "Jil Sander", "Courrèges", "Paco Rabanne", "Mugler", "Lanvin", "Nina Ricci", "Agnès b.", "Coperni", "Chez Awa · création"],
    "Manteaux & doudounes": ["Moncler", "Canada Goose", "The North Face", "Napapijri", "Patagonia", "Jott", "Pyrenex", "Woolrich", "Barbour", "Schott", "Zara", "Uniqlo", "H&M", "Mango", "COS", "Arket", "Massimo Dutti", "Sandro", "Maje", "The Kooples", "Ba&sh", "Sézane", "Claudie Pierlot", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Aigle", "Saint James", "Armor Lux", "Nobis", "Mackage", "Parajumpers", "Colmar", "Fusalp", "Rossignol", "Helly Hansen", "Jack Wolfskin", "Columbia", "Arc'teryx", "Salomon", "Rains", "Stutterheim", "Carhartt", "Dickies", "Levi's", "Nike", "Adidas", "Champion", "Stone Island", "C.P. Company", "Acne Studios", "A.P.C.", "AMI", "Officine Générale", "Norse Projects", "Our Legacy", "Filippa K", "Samsøe Samsøe", "Ganni", "Max Mara", "Burberry", "Balenciaga", "Prada", "Gucci", "Louis Vuitton", "Dior", "Saint Laurent", "Céline", "Loewe", "Bottega Veneta", "Fendi", "Givenchy", "Valentino", "Versace", "Balmain", "Off-White", "Rick Owens", "Maison Margiela", "Loro Piana", "Brunello Cucinelli", "Tom Ford", "Hugo Boss", "Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Gant", "Superdry", "Esprit", "Benetton", "Kiabi", "Celio", "Jules", "Devred", "Brice", "Eden Park", "Vicomte A."],
    "Vestes & blousons":    ["Carhartt", "Dickies", "The North Face", "Schott", "Levi's", "Lee", "Wrangler", "Nike", "Adidas", "Puma", "Champion", "Stone Island", "C.P. Company", "Napapijri", "Patagonia", "Columbia", "Arc'teryx", "Zara", "H&M", "Mango", "Uniqlo", "COS", "Massimo Dutti", "Bershka", "Pull & Bear", "The Kooples", "Sandro", "Maje", "Ba&sh", "Sézane", "Zadig & Voltaire", "IKKS", "Barbour", "Belstaff", "Alpha Industries", "Avirex", "Schott NYC", "Redskins", "Chevignon", "Oakwood", "Giorgio", "Diesel", "G-Star Raw", "Superdry", "Scotch & Soda", "Jack & Jones", "Celio", "Jules", "Lacoste", "Ralph Lauren", "Tommy Hilfiger", "Hugo Boss", "Calvin Klein", "Gant", "Fred Perry", "Lyle & Scott", "Ben Sherman", "Stüssy", "Supreme", "Palace", "A Bathing Ape", "Corteiz", "Represent", "Trapstar", "Kith", "Aimé Leon Dore", "Noah", "Huf", "Obey", "Vans", "Quiksilver", "Volcom", "Element", "Oxbow", "A.P.C.", "AMI", "Acne Studios", "Officine Générale", "Our Legacy", "Norse Projects", "Balenciaga", "Gucci", "Louis Vuitton", "Dior", "Prada", "Saint Laurent", "Off-White", "Amiri", "Rick Owens", "Maison Margiela", "Comme des Garçons", "Yohji Yamamoto", "Moncler", "Burberry", "Givenchy", "Versace", "Balmain", "Kenzo", "Jacquemus"],
    "Ensembles & costumes": ["Zara", "Mango", "H&M", "Massimo Dutti", "COS", "Arket", "& Other Stories", "The Kooples", "Sandro", "Maje", "Claudie Pierlot", "Ba&sh", "Sézane", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "Reformation", "Reiss", "Ralph Lauren", "Polo Ralph Lauren", "Hugo Boss", "Tommy Hilfiger", "Calvin Klein", "Gant", "Emporio Armani", "Karl Lagerfeld", "Michael Kors", "Balibaris", "Hast", "Octobre Éditions", "Devred", "Brice", "Celio", "Jules", "Father & Sons", "Suitsupply", "De Fursac", "Cifonelli", "Smalto", "Ganni", "Samsøe Samsøe", "Filippa K", "A.P.C.", "AMI", "Officine Générale", "Acne Studios", "Isabel Marant", "Jacquemus", "Lemaire", "The Row", "Max Mara", "Chanel", "Dior", "Saint Laurent", "Balenciaga", "Gucci", "Prada", "Céline", "Givenchy", "Valentino", "Versace", "Dolce & Gabbana", "Balmain", "Alexander McQueen", "Stella McCartney", "Jil Sander", "Maison Margiela", "Tom Ford", "Brunello Cucinelli", "Loro Piana", "Courrèges", "Paco Rabanne", "Mugler", "Lanvin", "Coperni", "Adidas", "Nike", "Lacoste", "Sergio Tacchini", "Fila", "Kappa", "Juicy Couture", "Chez Awa · création"],
    "Tops & bodies":        ["Zara", "Mango", "H&M", "Bershka", "Stradivarius", "Pull & Bear", "Uniqlo", "COS", "Arket", "& Other Stories", "Massimo Dutti", "Etam", "Undiz", "Calzedonia", "Intimissimi", "Tezenis", "Oysho", "Princesse tam.tam", "Aubade", "Chantelle", "Simone Pérèle", "Darjeeling", "Sézane", "Maje", "Sandro", "Ba&sh", "Claudie Pierlot", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "American Vintage", "Bellerose", "Sessùn", "Des Petits Hauts", "Vanessa Bruno", "Reformation", "Free People", "Urban Outfitters", "Ganni", "Stine Goya", "Rotate", "Samsøe Samsøe", "Skims", "Wolford", "Alo Yoga", "Lululemon", "Gymshark", "Nike", "Adidas", "Puma", "Calvin Klein", "Tommy Hilfiger", "Guess", "Michael Kors", "Isabel Marant", "Jacquemus", "Courrèges", "Mugler", "Coperni", "Chanel", "Dior", "Saint Laurent", "Balenciaga", "Gucci", "Prada", "Miu Miu", "Versace", "Balmain", "Alexander McQueen", "Chez Awa · création"],
    "Blazers & tailleurs":  ["Zara", "Mango", "H&M", "Massimo Dutti", "COS", "Arket", "& Other Stories", "The Kooples", "Sandro", "Maje", "Claudie Pierlot", "Ba&sh", "Sézane", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Ines de la Fressange", "Ralph Lauren", "Polo Ralph Lauren", "Hugo Boss", "Tommy Hilfiger", "Calvin Klein", "Gant", "Emporio Armani", "Armani Exchange", "Karl Lagerfeld", "Michael Kors", "Balibaris", "Hast", "Octobre Éditions", "Devred", "Brice", "Celio", "Jules", "Father & Sons", "Bréal", "Suitsupply", "De Fursac", "Cifonelli", "Smalto", "Kenzo", "Ganni", "Samsøe Samsøe", "Filippa K", "A.P.C.", "AMI", "Officine Générale", "Acne Studios", "Isabel Marant", "Jacquemus", "Lemaire", "The Row", "Max Mara", "Chanel", "Dior", "Saint Laurent", "Balenciaga", "Gucci", "Prada", "Céline", "Givenchy", "Valentino", "Versace", "Dolce & Gabbana", "Balmain", "Alexander McQueen", "Stella McCartney", "Jil Sander", "Maison Margiela", "Tom Ford", "Brunello Cucinelli", "Loro Piana", "Courrèges", "Paco Rabanne", "Mugler", "Lanvin", "Coperni"],
    "Pulls & gilets":       ["Uniqlo", "Zara", "H&M", "Mango", "COS", "Arket", "Massimo Dutti", "Monoprix", "Kiabi", "Benetton", "Esprit", "Gap", "Ralph Lauren", "Polo Ralph Lauren", "Lacoste", "Tommy Hilfiger", "Hugo Boss", "Calvin Klein", "Gant", "Fred Perry", "Lyle & Scott", "Sézane", "Maje", "Sandro", "The Kooples", "Ba&sh", "Claudie Pierlot", "Sœur", "Rouje", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Des Petits Hauts", "American Vintage", "Bellerose", "Sessùn", "Eric Bompard", "Saint James", "Armor Lux", "Le Slip Français", "Aigle", "Petit Bateau", "Cyrillus", "Ines de la Fressange", "Balibaris", "Octobre Éditions", "Hast", "Celio", "Jules", "Devred", "Brice", "Superdry", "Scotch & Soda", "Jack & Jones", "Only", "Vero Moda", "Selected", "Sunspel", "John Smedley", "A.P.C.", "AMI", "Acne Studios", "Officine Générale", "Norse Projects", "Our Legacy", "Filippa K", "Samsøe Samsøe", "Ganni", "Isabel Marant", "Jacquemus", "Lemaire", "The Row", "Max Mara", "Loro Piana", "Brunello Cucinelli", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Céline", "Loewe", "Bottega Veneta", "Fendi", "Givenchy", "Valentino", "Versace", "Balmain", "Kenzo", "Stone Island", "C.P. Company", "Carhartt", "The North Face", "Patagonia", "Nike", "Adidas", "Stüssy", "Supreme", "Palace", "Represent", "Cole Buxton", "Aimé Leon Dore"],
    "Sweats & hoodies":     ["Nike", "Jordan", "Adidas", "Adidas Originals", "Puma", "Reebok", "Under Armour", "New Balance", "Champion", "Russell Athletic", "Carhartt", "Dickies", "The North Face", "Patagonia", "Columbia", "Napapijri", "Stüssy", "Supreme", "Palace", "A Bathing Ape", "Fear of God", "Essentials", "Corteiz", "Trapstar", "Represent", "Cole Buxton", "Aimé Leon Dore", "Noah", "Brain Dead", "Kith", "Huf", "Obey", "Thrasher", "Vans", "Element", "Volcom", "Quiksilver", "Billabong", "Rip Curl", "Hurley", "Oxbow", "Sun Valley", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Gant", "Fred Perry", "Lyle & Scott", "Ellesse", "Fila", "Kappa", "Sergio Tacchini", "Umbro", "Le Coq Sportif", "Zara", "H&M", "Mango", "Uniqlo", "Bershka", "Pull & Bear", "Stradivarius", "Jules", "Celio", "Kiabi", "Superdry", "Jack & Jones", "The Kooples", "Sandro", "Maje", "Zadig & Voltaire", "Sézane", "Ba&sh", "IKKS", "A.P.C.", "AMI", "Acne Studios", "Off-White", "Balenciaga", "Gucci", "Louis Vuitton", "Dior", "Givenchy", "Versace", "Balmain", "Kenzo", "Amiri", "Palm Angels", "Vetements", "Casablanca", "Maison Kitsuné", "Moncler", "Stone Island", "C.P. Company", "Gymshark", "Lululemon", "Alo Yoga"],
    "Chemises & blouses":   ["Ralph Lauren", "Polo Ralph Lauren", "Lacoste", "Tommy Hilfiger", "Hugo Boss", "Calvin Klein", "Gant", "Fred Perry", "Ben Sherman", "Zara", "H&M", "Mango", "Uniqlo", "COS", "Arket", "& Other Stories", "Massimo Dutti", "Bershka", "Stradivarius", "The Kooples", "Sézane", "Sandro", "Maje", "Claudie Pierlot", "Ba&sh", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Des Petits Hauts", "Ines de la Fressange", "Vanessa Bruno", "American Vintage", "Bellerose", "Sessùn", "Balibaris", "Hast", "Octobre Éditions", "Celio", "Jules", "Devred", "Brice", "Father & Sons", "Bréal", "Café Coton", "Figaret", "Charvet", "Suitsupply", "De Fursac", "Eden Park", "Vicomte A.", "Serge Blanco", "Aigle", "Saint James", "Armor Lux", "Carhartt", "Dickies", "Levi's", "Lee", "Wrangler", "Stüssy", "Supreme", "Palace", "Aimé Leon Dore", "Noah", "A.P.C.", "AMI", "Acne Studios", "Officine Générale", "Our Legacy", "Norse Projects", "Filippa K", "Samsøe Samsøe", "Ganni", "Isabel Marant", "Jacquemus", "Lemaire", "Sunspel", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Céline", "Loewe", "Bottega Veneta", "Fendi", "Givenchy", "Valentino", "Versace", "Dolce & Gabbana", "Balmain", "Max Mara", "Chloé", "Marni", "Jil Sander", "Comme des Garçons", "Casablanca", "Kenzo", "Etam", "Naf Naf", "Morgan", "Promod", "Cache Cache", "Kiabi", "Camaïeu"],
    "T-shirts & débardeurs":["Nike", "Jordan", "Adidas", "Puma", "Reebok", "Under Armour", "New Balance", "Champion", "Russell Athletic", "Carhartt", "Dickies", "The North Face", "Patagonia", "Stüssy", "Supreme", "Palace", "A Bathing Ape", "Fear of God", "Essentials", "Corteiz", "Trapstar", "Represent", "Cole Buxton", "Aimé Leon Dore", "Noah", "Brain Dead", "Kith", "Huf", "Obey", "Thrasher", "Vans", "Element", "Volcom", "Quiksilver", "Billabong", "Rip Curl", "Hurley", "Oxbow", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Gant", "Fred Perry", "Lyle & Scott", "Ellesse", "Fila", "Kappa", "Sergio Tacchini", "Umbro", "Le Coq Sportif", "Uniqlo", "Zara", "H&M", "Mango", "COS", "Arket", "Massimo Dutti", "Bershka", "Pull & Bear", "Stradivarius", "Primark", "Kiabi", "Jules", "Celio", "Monoprix", "Petit Bateau", "Le Slip Français", "Armor Lux", "Saint James", "Sunspel", "American Vintage", "Bellerose", "The Kooples", "Sandro", "Maje", "Zadig & Voltaire", "Sézane", "Ba&sh", "IKKS", "A.P.C.", "AMI", "Acne Studios", "Maison Kitsuné", "Officine Générale", "Norse Projects", "Our Legacy", "Off-White", "Balenciaga", "Gucci", "Louis Vuitton", "Dior", "Saint Laurent", "Prada", "Givenchy", "Versace", "Balmain", "Kenzo", "Amiri", "Palm Angels", "Vetements", "Casablanca", "Comme des Garçons", "Moncler", "Stone Island", "C.P. Company", "Gymshark", "Lululemon", "Alo Yoga", "Superdry", "Jack & Jones", "Gap", "Esprit", "Benetton", "Chez Awa · création"],
    "Jeans":                ["Levi's", "Lee", "Wrangler", "Diesel", "G-Star Raw", "Nudie Jeans", "Jacob Cohën", "Replay", "Pepe Jeans", "Tommy Jeans", "Calvin Klein Jeans", "Guess", "True Religion", "7 For All Mankind", "Citizens of Humanity", "AG Jeans", "Frame", "Mother", "Agolde", "Re/Done", "Paige", "Hudson", "J Brand", "DL1961", "Edwin", "Evisu", "Naked & Famous", "Japan Blue", "Momotaro", "Iron Heart", "Samurai", "Acne Studios", "A.P.C.", "AMI", "Our Legacy", "Norse Projects", "Sandro", "Maje", "The Kooples", "Zadig & Voltaire", "Sézane", "Ba&sh", "Rouje", "IKKS", "Zara", "H&M", "Mango", "Uniqlo", "COS", "Arket", "Weekday", "Monki", "Massimo Dutti", "Bershka", "Pull & Bear", "Stradivarius", "Primark", "Kiabi", "Jules", "Celio", "Bonobo", "Cache Cache", "Camaïeu", "Promod", "Jennyfer", "Pimkie", "Salsa", "Kaporal", "Le Temps des Cerises", "Freeman T. Porter", "Teddy Smith", "Japan Rags", "Cimarron", "Carhartt", "Dickies", "Dr. Denim", "Cheap Monday", "Nudie", "Balenciaga", "Gucci", "Louis Vuitton", "Dior", "Saint Laurent", "Off-White", "Amiri", "Balmain", "Versace", "Dolce & Gabbana", "Fendi", "Givenchy", "Loewe", "Bottega Veneta", "Y/Project", "Vetements", "Ksubi", "Purple Brand", "Represent", "Cole Buxton", "Ralph Lauren", "Tommy Hilfiger", "Hugo Boss", "Gant", "Superdry", "Jack & Jones", "Only", "Vero Moda", "Scotch & Soda", "Esprit", "Gap"],
    "Pantalons":            ["Carhartt", "Dickies", "Zara", "H&M", "Mango", "Uniqlo", "COS", "Arket", "Massimo Dutti", "Bershka", "Pull & Bear", "Stradivarius", "Ralph Lauren", "Polo Ralph Lauren", "Lacoste", "Tommy Hilfiger", "Hugo Boss", "Calvin Klein", "Gant", "Dockers", "Chino", "The Kooples", "Sandro", "Maje", "Claudie Pierlot", "Ba&sh", "Sézane", "Sœur", "Rouje", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Ines de la Fressange", "American Vintage", "Bellerose", "Sessùn", "Balibaris", "Hast", "Octobre Éditions", "Celio", "Jules", "Devred", "Brice", "Father & Sons", "Bréal", "Kiabi", "Camaïeu", "Promod", "Cache Cache", "Naf Naf", "Morgan", "Etam", "Monoprix", "Cyrillus", "Damart", "Nike", "Adidas", "Puma", "Under Armour", "The North Face", "Patagonia", "Columbia", "Arc'teryx", "Salomon", "Decathlon", "Stüssy", "Supreme", "Palace", "Represent", "Cole Buxton", "Aimé Leon Dore", "Noah", "Kith", "Gramicci", "Stan Ray", "Universal Works", "Engineered Garments", "Beams", "Snow Peak", "And Wander", "A.P.C.", "AMI", "Acne Studios", "Officine Générale", "Our Legacy", "Norse Projects", "Filippa K", "Samsøe Samsøe", "Ganni", "Isabel Marant", "Jacquemus", "Lemaire", "The Row", "Max Mara", "Loro Piana", "Brunello Cucinelli", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Céline", "Loewe", "Bottega Veneta", "Fendi", "Givenchy", "Valentino", "Versace", "Balmain", "Off-White", "Amiri", "Rick Owens", "Maison Margiela", "Comme des Garçons", "Yohji Yamamoto", "Issey Miyake", "Kenzo", "Stone Island", "C.P. Company", "Levi's", "Diesel", "G-Star Raw", "Superdry", "Scotch & Soda", "Jack & Jones", "Only", "Vero Moda", "Esprit", "Gap", "Lululemon", "Gymshark", "Alo Yoga"],
    "Shorts":               ["Nike", "Jordan", "Adidas", "Puma", "Reebok", "Under Armour", "New Balance", "Champion", "Ralph Lauren", "Polo Ralph Lauren", "Lacoste", "Tommy Hilfiger", "Hugo Boss", "Calvin Klein", "Gant", "Carhartt", "Dickies", "The North Face", "Patagonia", "Columbia", "Arc'teryx", "Salomon", "Decathlon", "Quiksilver", "Billabong", "Rip Curl", "Volcom", "Element", "Hurley", "O'Neill", "Roxy", "Oxbow", "Sun Valley", "Vilebrequin", "Orlebar Brown", "Sundek", "Zara", "H&M", "Mango", "Uniqlo", "COS", "Arket", "Massimo Dutti", "Bershka", "Pull & Bear", "Stradivarius", "Kiabi", "Jules", "Celio", "Levi's", "Lee", "Wrangler", "Diesel", "G-Star Raw", "Stüssy", "Supreme", "Palace", "Represent", "Cole Buxton", "Aimé Leon Dore", "Kith", "Gramicci", "Stan Ray", "The Kooples", "Sandro", "Maje", "Sézane", "Ba&sh", "Rouje", "Zadig & Voltaire", "A.P.C.", "AMI", "Acne Studios", "Isabel Marant", "Jacquemus", "Ganni", "Balenciaga", "Gucci", "Louis Vuitton", "Dior", "Prada", "Saint Laurent", "Off-White", "Amiri", "Versace", "Kenzo", "Gymshark", "Lululemon", "Alo Yoga"],
    "Jupes":                ["Zara", "Mango", "H&M", "Maje", "Sandro", "Sézane", "The Kooples", "Ba&sh", "Claudie Pierlot", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Ines de la Fressange", "Des Petits Hauts", "Vanessa Bruno", "American Vintage", "Bellerose", "Sessùn", "COS", "Arket", "& Other Stories", "Massimo Dutti", "Uniqlo", "Bershka", "Stradivarius", "Pull & Bear", "Promod", "Naf Naf", "Morgan", "Kiabi", "Camaïeu", "Cache Cache", "Pimkie", "Jennyfer", "Etam", "Monoprix", "Cyrillus", "Reformation", "Ganni", "Stine Goya", "Rotate", "Samsøe Samsøe", "Free People", "Anthropologie", "Urban Outfitters", "Desigual", "Guess", "Michael Kors", "Karl Lagerfeld", "Tommy Hilfiger", "Lacoste", "Ralph Lauren", "A.P.C.", "Acne Studios", "Isabel Marant", "Jacquemus", "Lemaire", "The Row", "Max Mara", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Prada", "Saint Laurent", "Balenciaga", "Céline", "Loewe", "Bottega Veneta", "Fendi", "Givenchy", "Valentino", "Versace", "Dolce & Gabbana", "Miu Miu", "Balmain", "Chloé", "Stella McCartney", "Alexander McQueen", "Marni", "Jil Sander", "Maison Margiela", "Courrèges", "Paco Rabanne", "Mugler", "Coperni", "Chez Awa · création"],
    "Combinaisons":         ["Zara", "Mango", "H&M", "Maje", "Sandro", "Sézane", "The Kooples", "Ba&sh", "Claudie Pierlot", "Rouje", "Sœur", "Zadig & Voltaire", "IKKS", "Comptoir des Cotonniers", "Vanessa Bruno", "American Vintage", "Sessùn", "COS", "Arket", "& Other Stories", "Massimo Dutti", "Bershka", "Stradivarius", "Promod", "Naf Naf", "Morgan", "Kiabi", "Etam", "Reformation", "Ganni", "Free People", "Anthropologie", "Carhartt", "Dickies", "Levi's", "Lee", "Diesel", "G-Star Raw", "Nike", "Adidas", "The North Face", "Isabel Marant", "Jacquemus", "Stella McCartney", "Chloé", "Max Mara", "Dior", "Saint Laurent", "Balmain", "Valentino", "Givenchy", "Versace", "Courrèges", "Paco Rabanne", "Mugler", "Coperni", "Chez Awa · création"],
    "Survêtements":         ["Nike", "Jordan", "Adidas", "Adidas Originals", "Puma", "Reebok", "Under Armour", "New Balance", "Asics", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Sergio Tacchini", "Fila", "Kappa", "Le Coq Sportif", "Ellesse", "Umbro", "Champion", "Russell Athletic", "Diadora", "Hummel", "Joma", "Kelme", "Errea", "Macron", "Decathlon", "Kipsta", "Domyos", "Gymshark", "Lululemon", "Alo Yoga", "Oysho", "The North Face", "Patagonia", "Columbia", "Napapijri", "Carhartt", "Stüssy", "Supreme", "Palace", "Corteiz", "Trapstar", "Represent", "Cole Buxton", "Aimé Leon Dore", "Kith", "Fear of God", "Essentials", "Zara", "H&M", "Mango", "Uniqlo", "Bershka", "Pull & Bear", "Kiabi", "Jules", "Celio", "Primark", "Superdry", "Jack & Jones", "The Kooples", "Sandro", "Maje", "Zadig & Voltaire", "Balenciaga", "Gucci", "Louis Vuitton", "Dior", "Givenchy", "Versace", "Balmain", "Off-White", "Palm Angels", "Amiri", "Moncler", "Stone Island", "C.P. Company", "Y-3", "Juicy Couture", "Bad Bunny", "Adidas by Wales Bonner"],
    "Maillots de bain":     ["Vilebrequin", "Orlebar Brown", "Sundek", "Speedo", "Arena", "Nike", "Adidas", "Puma", "Quiksilver", "Billabong", "Rip Curl", "Volcom", "Hurley", "O'Neill", "Roxy", "Oxbow", "Sun Valley", "Banana Moon", "Pain de Sucre", "Eres", "Seafolly", "Solid & Striped", "Hunza G", "Zimmermann", "Etam", "Undiz", "Calzedonia", "Intimissimi", "Tezenis", "Oysho", "Princesse tam.tam", "Aubade", "Chantelle", "Simone Pérèle", "Darjeeling", "Livia", "Kiwi", "Sunflair", "Triumph", "Zara", "H&M", "Mango", "Uniqlo", "Kiabi", "Monoprix", "Decathlon", "Nabaiji", "Olaian", "Tribord", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Moncler", "Gucci", "Louis Vuitton", "Dior", "Prada", "Saint Laurent", "Balenciaga", "Fendi", "Versace", "Dolce & Gabbana", "Off-White", "Palm Angels", "Chez Awa · création"],
    // — Accessoires —
    "Sacs à main":          ["Longchamp", "Michael Kors", "Polène", "Lancaster", "Lancel", "Le Tanneur", "Vanessa Bruno", "Jérôme Dreyfuss", "Sézane", "Coach", "Kate Spade", "Tory Burch", "Marc Jacobs", "Furla", "Gucci", "Louis Vuitton", "Chanel", "Hermès", "Dior", "Prada", "Saint Laurent", "Bottega Veneta", "Loewe", "Céline", "Fendi", "Balenciaga", "Chloé", "Givenchy", "Valentino", "Miu Miu", "Goyard", "Delvaux", "Moynat", "Jacquemus", "JW Anderson", "Staud", "Cult Gaia", "Mansur Gavriel", "Telfar", "Anya Hindmarch", "A.P.C.", "Maison Kitsuné", "Isabel Marant", "Zadig & Voltaire", "The Kooples", "Sandro", "Maje", "Ba&sh", "Claudie Pierlot", "Rouje", "Mac Douglas", "Gérard Darel", "Nat & Nin", "Craie", "Léo et Violette", "Paul Marius", "Bensimon", "Jack Gomme", "Cabaïa", "Zara", "H&M", "Mango", "Massimo Dutti", "Parfois", "Pimkie", "Desigual", "Guess", "Karl Lagerfeld", "Tommy Hilfiger", "Calvin Klein", "Lacoste", "Ralph Lauren", "Hugo Boss", "Burberry", "Alexander McQueen", "Versace", "Dolce & Gabbana", "Balmain", "Off-White", "Marni", "Jil Sander", "Acne Studios", "Ganni", "Rains", "Sandqvist", "Fjällräven"],
    "Sacs à dos":           ["Eastpak", "Herschel", "Fjällräven", "Kipling", "The North Face", "Nike", "Jordan", "Adidas", "Puma", "Vans", "Carhartt", "Dakine", "Samsonite", "Delsey", "Tumi", "Osprey", "Deuter", "Quechua", "Decathlon", "Lowe Alpine", "Millet", "Lafuma", "Salomon", "Arc'teryx", "Patagonia", "Columbia", "Jack Wolfskin", "Cabaïa", "Lefrik", "Rains", "Sandqvist", "Bellroy", "Aer", "Db", "Côte&Ciel", "Lancaster", "Le Tanneur", "Longchamp", "Polène", "Michael Kors", "Coach", "Kate Spade", "Louis Vuitton", "Gucci", "Prada", "Dior", "Saint Laurent", "Balenciaga", "Fendi", "Loewe", "Goyard", "Off-White", "A Bathing Ape", "Supreme", "Stüssy", "Palace", "Champion", "Fila", "Kappa", "Superdry", "Zara", "H&M", "Mango", "Kiabi", "Jansport", "Tann's", "Pol Fox", "Cameleon", "Bakker", "Jeune Premier", "Petit Bateau", "Jacadi", "Okaïdi"],
    "Sacs bandoulière & pochettes": ["Lacoste", "Nike", "Jordan", "Adidas", "Puma", "The North Face", "Carhartt", "Eastpak", "Herschel", "Fjällräven", "Louis Vuitton", "Gucci", "Chanel", "Dior", "Prada", "Saint Laurent", "Balenciaga", "Fendi", "Loewe", "Céline", "Bottega Veneta", "Goyard", "Off-White", "Polène", "Longchamp", "Lancaster", "Lancel", "Le Tanneur", "Michael Kors", "Coach", "Kate Spade", "Marc Jacobs", "Furla", "Calvin Klein", "Tommy Hilfiger", "Hugo Boss", "Ralph Lauren", "Sézane", "Jérôme Dreyfuss", "Vanessa Bruno", "A.P.C.", "Maison Kitsuné", "Zadig & Voltaire", "The Kooples", "Sandro", "Maje", "Ba&sh", "Jacquemus", "Staud", "Rains", "Sandqvist", "Bellroy", "Cabaïa", "Bensimon", "Zara", "H&M", "Mango", "Parfois", "Guess", "Desigual", "Supreme", "Stüssy", "Palace", "A Bathing Ape", "Champion", "Fila", "Kappa", "Ellesse", "Kipling", "Dakine"],
    "Portefeuilles & petite maroquinerie": ["Le Tanneur", "Lancaster", "Lancel", "Longchamp", "Polène", "Lacoste", "Louis Vuitton", "Gucci", "Chanel", "Hermès", "Dior", "Prada", "Saint Laurent", "Balenciaga", "Fendi", "Loewe", "Céline", "Bottega Veneta", "Goyard", "Off-White", "Fossil", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Ralph Lauren", "Michael Kors", "Coach", "Kate Spade", "Marc Jacobs", "Furla", "Bellroy", "Secrid", "Ögon", "Carhartt", "Herschel", "Eastpak", "Nike", "Adidas", "Sézane", "A.P.C.", "Maison Kitsuné", "Zadig & Voltaire", "The Kooples", "Sandro", "Maje", "Ba&sh", "Mac Douglas", "Paul Marius", "Nat & Nin", "Zara", "H&M", "Mango", "Parfois", "Guess", "Desigual", "Karl Lagerfeld", "Burberry", "Montblanc", "Dunhill", "Smythson", "Aspinal of London", "Il Bisonte", "Bexley", "Cyrillus"],
    "Ceintures":            ["Lacoste", "Levi's", "Diesel", "The Kooples", "Le Tanneur", "Calvin Klein", "Tommy Hilfiger", "Hugo Boss", "Ralph Lauren", "Polo Ralph Lauren", "Gant", "Gucci", "Hermès", "Louis Vuitton", "Dior", "Prada", "Saint Laurent", "Balenciaga", "Fendi", "Versace", "Off-White", "Burberry", "Maison Boinet", "Anderson's", "Carhartt", "Dickies", "Nike", "Adidas", "Zara", "H&M", "Mango", "Massimo Dutti", "Celio", "Jules", "Sézane", "Sandro", "Maje", "Ba&sh", "Zadig & Voltaire", "Isabel Marant", "A.P.C.", "Acne Studios", "Bellroy", "Paul Marius", "Bexley", "Montblanc", "Salvatore Ferragamo", "Tod's", "Guess", "Desigual", "Karl Lagerfeld", "Michael Kors", "Coach"],
    "Montres":              ["Casio", "G-Shock", "Seiko", "Citizen", "Orient", "Fossil", "Daniel Wellington", "Cluse", "Michael Kors", "Hugo Boss", "Diesel", "Armani Exchange", "Emporio Armani", "Tommy Hilfiger", "Lacoste", "Guess", "Swatch", "Tissot", "Longines", "Hamilton", "Certina", "Mido", "Festina", "Lotus", "Lorus", "Ice-Watch", "Nixon", "Timex", "Garmin", "Apple", "Samsung", "Huawei", "Fitbit", "Polar", "Suunto", "Withings", "Lip", "Yema", "Herbelin", "Pierre Lannier", "Beuchat", "Baltic", "Serica", "Rolex", "Omega", "Cartier", "Tag Heuer", "Breitling", "Tudor", "IWC", "Panerai", "Jaeger-LeCoultre", "Audemars Piguet", "Patek Philippe", "Vacheron Constantin", "Zenith", "Hublot", "Bulgari", "Chopard", "Baume & Mercier", "Frédérique Constant", "Raymond Weil", "Oris", "Rado", "Montblanc", "Bell & Ross", "Grand Seiko", "Nomos", "Junghans", "Mondaine", "Bering", "Skagen", "Olivia Burton", "Rosefield", "Komono", "Gucci", "Louis Vuitton", "Chanel", "Hermès", "Dior", "Versace", "Balmain", "Chaumet", "Fred", "Messika", "Tiffany & Co."],
    "Bijoux":               ["Pandora", "Swarovski", "APM Monaco", "Les Georgettes", "Agatha", "Thomas Sabo", "Histoire d'Or", "Maty", "Zag Bijoux", "Aristocrazy", "Gas Bijoux", "Goossens", "Dinh Van", "Fred", "Messika", "Cartier", "Van Cleef & Arpels", "Tiffany & Co.", "Bulgari", "Chopard", "Boucheron", "Chaumet", "Mauboussin", "Poiray", "Mellerio", "Repossi", "Vhernier", "Pomellato", "Piaget", "Graff", "Harry Winston", "Chanel", "Dior", "Louis Vuitton", "Gucci", "Hermès", "Prada", "Saint Laurent", "Balenciaga", "Versace", "Miu Miu", "Céline", "Bottega Veneta", "Loewe", "Alexander McQueen", "Maison Margiela", "Vivienne Westwood", "Ambush", "Missoma", "Mejuri", "Monica Vinader", "Astrid & Miyu", "Ana Luisa", "Lou Yetu", "Gigi Clozeau", "Ginette NY", "Persée", "Nadine Aysoy", "Isabel Marant", "Zadig & Voltaire", "Sézane", "Maje", "Sandro", "Ba&sh", "Claudie Pierlot", "The Kooples", "Zara", "H&M", "Mango", "Parfois", "Pimkie", "Guess", "Michael Kors", "Calvin Klein", "Tommy Hilfiger", "Hugo Boss", "Lacoste", "Fossil", "Skagen", "Swatch", "Ice-Watch", "Casio", "Marc Jacobs", "Coach", "Kate Spade", "Tory Burch"],
    "Lunettes":             ["Ray-Ban", "Oakley", "Persol", "Vuarnet", "Izipizi", "Jimmy Fairly", "Polaroid", "Carrera", "Hawkers", "Komono", "Moscot", "Garrett Leight", "Oliver Peoples", "Gentle Monster", "Chimi", "Le Specs", "Quay", "Bollé", "Julbo", "Cébé", "Maui Jim", "Costa", "Serengeti", "Randolph", "Tom Ford", "Gucci", "Prada", "Dior", "Chanel", "Céline", "Saint Laurent", "Balenciaga", "Bottega Veneta", "Loewe", "Fendi", "Miu Miu", "Versace", "Dolce & Gabbana", "Burberry", "Givenchy", "Valentino", "Off-White", "Alexander McQueen", "Balmain", "Chloé", "Stella McCartney", "Jacquemus", "Acne Studios", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Michael Kors", "Marc Jacobs", "Guess", "Karl Lagerfeld", "Emporio Armani", "Nike", "Adidas", "Puma", "Under Armour", "Smith", "Spy", "Electric", "Dragon", "Von Zipper", "Arnette", "Vogue", "Police", "Fossil", "Zara", "H&M", "Mango", "Parfois", "Afflelou", "Krys", "Optic 2000", "Lunettes pour Tous"],
    "Casquettes & chapeaux":["New Era", "47 Brand", "Mitchell & Ness", "Nike", "Jordan", "Adidas", "Puma", "Under Armour", "Carhartt", "Dickies", "Champion", "The North Face", "Patagonia", "Columbia", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Fred Perry", "Stüssy", "Supreme", "Palace", "A Bathing Ape", "Corteiz", "Trapstar", "Represent", "Kith", "Aimé Leon Dore", "Noah", "Huf", "Obey", "Thrasher", "Vans", "Volcom", "Quiksilver", "Billabong", "Rip Curl", "Hurley", "Oxbow", "Von Dutch", "Kangol", "Borsalino", "Stetson", "Bailey", "Lock & Co", "Christys'", "Barts", "Buff", "Ellesse", "Fila", "Kappa", "Sergio Tacchini", "Le Coq Sportif", "Umbro", "Napapijri", "Moncler", "Burberry", "Gucci", "Louis Vuitton", "Dior", "Prada", "Balenciaga", "Saint Laurent", "Fendi", "Off-White", "Amiri", "Jacquemus", "Maison Michel", "Acne Studios", "A.P.C.", "Sézane", "Zara", "H&M", "Mango", "Uniqlo", "Kiabi", "Decathlon"],
    "Bonnets & écharpes":   ["Carhartt", "Dickies", "The North Face", "Patagonia", "Columbia", "Nike", "Jordan", "Adidas", "Puma", "Napapijri", "Moncler", "Canada Goose", "Acne Studios", "Barts", "Buff", "Weekday", "COS", "Arket", "Uniqlo", "Monoprix", "Zara", "H&M", "Mango", "Eric Bompard", "Saint James", "Armor Lux", "Aigle", "Petit Bateau", "Bonpoint", "Jacadi", "Sézane", "Maje", "Sandro", "Ba&sh", "Zadig & Voltaire", "The Kooples", "A.P.C.", "AMI", "Isabel Marant", "Ganni", "Burberry", "Gucci", "Louis Vuitton", "Dior", "Chanel", "Hermès", "Prada", "Fendi", "Balenciaga", "Saint Laurent", "Loewe", "Bottega Veneta", "Off-White", "Stone Island", "C.P. Company", "Stüssy", "Supreme", "Palace", "Kith", "Aimé Leon Dore", "Champion", "Ellesse", "Fila", "Kappa", "Lacoste", "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Hugo Boss", "Fred Perry", "Superdry", "Jack & Jones", "Decathlon", "Wed'ze", "Quechua", "Salomon", "Arc'teryx"],
    "Gants":                ["The North Face", "Patagonia", "Columbia", "Napapijri", "Barts", "Buff", "Roeckl", "Hestra", "Dents", "Agnelle", "Maison Fabre", "Causse", "Isotoner", "Levi's", "Carhartt", "Nike", "Adidas", "Reusch", "Ziener", "Salomon", "Arc'teryx", "Decathlon", "Wed'ze", "Quechua", "Moncler", "Canada Goose", "Burberry", "Gucci", "Louis Vuitton", "Hermès", "Chanel", "Dior", "Prada", "Fendi", "Saint Laurent", "Bottega Veneta", "Loewe", "Acne Studios", "Sézane", "Zara", "H&M", "Mango", "Uniqlo", "Monoprix", "Eric Bompard", "Saint James", "Lacoste", "Ralph Lauren", "Tommy Hilfiger", "Hugo Boss", "Dakine", "Black Diamond"],
    "Foulards & étoles":    ["Hermès", "Louis Vuitton", "Gucci", "Dior", "Chanel", "Burberry", "Prada", "Fendi", "Saint Laurent", "Balenciaga", "Loewe", "Céline", "Valentino", "Versace", "Alexander McQueen", "Faliero Sarti", "Épice", "Inouitoosh", "Bindi", "Moismont", "Manipuri", "Ma Poésie", "Zadig & Voltaire", "Sézane", "Maje", "Sandro", "Ba&sh", "Claudie Pierlot", "The Kooples", "Rouje", "Sœur", "Vanessa Bruno", "Des Petits Hauts", "American Vintage", "Eric Bompard", "Acne Studios", "Isabel Marant", "Ganni", "Zara", "H&M", "Mango", "Massimo Dutti", "COS", "Arket", "& Other Stories", "Uniqlo", "Monoprix", "Parfois", "Pimkie", "Promod", "Etam", "Desigual", "Guess", "Michael Kors", "Karl Lagerfeld", "Tommy Hilfiger", "Ralph Lauren", "Lacoste", "Chez Awa · création"]
  },
  referentiel: ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "Vans", "Converse", "Levi's", "Lacoste", "Ralph Lauren", "Tommy Hilfiger", "Carhartt", "The North Face", "Zara", "H&M", "Mango", "Uniqlo", "Sandro", "Maje", "Sézane", "The Kooples", "Ba&sh", "Longchamp", "Michael Kors", "Louis Vuitton", "Gucci", "Chanel", "Dior", "Chez Awa · création"],
  sansMarque: "Sans marque — création / pièce artisanale",
  proposition: "Proposer une marque — vérifiée à l'atelier avec la pièce (facture d'origine si neuve)"
},

// ARBRE catégorie → sous-catégories → grille de tailles (référentiel publication) — la
// grille de tailles détermine la logique de stock par TAILLE (une ligne stock par taille).
categoriesArbre: {
  "Prêt-à-porter": { ico: "i-briefcase", subs: ["Robes", "Manteaux & doudounes", "Vestes & blousons", "Blazers & tailleurs", "Ensembles & costumes", "Pulls & gilets", "Sweats & hoodies", "Chemises & blouses", "Tops & bodies", "T-shirts & débardeurs", "Jeans", "Pantalons", "Shorts", "Jupes", "Combinaisons", "Survêtements", "Maillots de bain"] },
  "Sneakers":      { ico: "i-nav",       subs: ["Lifestyle", "Running", "Basketball", "Montantes", "Skate", "Trail", "Tennis", "Rétro / vintage", "Éditions limitées", "Slides & claquettes"] },
  "Accessoires":   { ico: "i-card",      subs: ["Sacs à main", "Sacs à dos", "Sacs bandoulière & pochettes", "Portefeuilles & petite maroquinerie", "Ceintures", "Montres", "Bijoux", "Lunettes", "Casquettes & chapeaux", "Bonnets & écharpes", "Gants", "Foulards & étoles"] }
},
// États d'une pièce (échelle Vinted). neuf=true ⇒ pas de défaut obligatoire ; pièce
// d'occasion (neuf=false) ⇒ pièce unique (1 taille, qté 1) au stock.
etatsPiece: [
  { k: "neuf_etiquette", n: "Neuf avec étiquette", d: "jamais porté, étiquette attachée", neuf: true },
  { k: "neuf_sans",      n: "Neuf sans étiquette", d: "jamais porté",                       neuf: true },
  { k: "tres_bon",       n: "Très bon état",       d: "porté quelques fois, défauts mineurs à signaler", neuf: false },
  { k: "bon",            n: "Bon état",            d: "défauts visibles, photographiés et signalés",      neuf: false }
],
genres: [{ id: 'tout', nom: 'Tout' }, { id: 'femme', nom: 'Femme' }, { id: 'homme', nom: 'Homme' }, { id: 'enfant', nom: 'Enfant' }, { id: 'mixte', nom: 'Mixte' }],
recherchesPopulaires: ["air max", "robe soirée", "jordan 4", "sac cuir", "veste 42"],
tailles: ["36", "38", "40", "41", "42", "43", "44", "S", "M", "L", "Unique"],

/* ── Les commandes (fusionnées dans l'onglet Panier) ──
   "a_payer" = panier validé, FLASHCODE émis, espèces pas encore remises : le code
   vit dans Panier → onglet « À payer » et s'affiche en grand sur mode/11. ── */
commandes: [
  // (fondatrice 05/09 : « je n'ai aucune commande en cours et pourtant je vois 90 € ») — il n'y a
  // PLUS de commande « à payer » posée d'avance dans les comptes : un paiement en attente, avec
  // son flashcode et son décompte, ne peut naître que d'une commande RÉELLEMENT lancée.
  // Les comptes gardent leur HISTORIQUE (en route, livrées), jamais un dû fantôme.
  { ref: "M-1208", statut: "en_cours", etape: "En route — Mondial Relay", articleId: "airmax",
    paye: 90, date: "19 août", mr: "MR-8412007312", relais: "Presse de la Poste · 8 pl. du Marché" },
  { ref: "M-1187", statut: "livree", etape: "Retirée au relais", articleId: "robe",
    paye: 75, date: "2 août", mr: "MR-8411964205", relais: "Tabac du Centre · 12 rue de la Gare" },
  { ref: "M-1154", statut: "livree", etape: "Retirée au relais", articleId: "sac",
    paye: 45, date: "11 juil.", mr: "MR-8411873501", relais: "Presse de la Poste · 8 pl. du Marché" },
  /* ── Un exemple par onglet de « Mes commandes » (parité vue réservations FLY) :
        remboursée (retour dans les 14 j) et annulée (réservation expirée avant paiement).
        Naissent normalement du flux ; seedées ici pour une démo parlante des 4 filtres. ── */
  { ref: "M-1132", statut: "remboursee", etape: "Remboursée — avoir crédité", articleId: "robe",
    paye: 75, date: "24 juil.", motifRetour: "La taille ne me va pas", remb: "Avoir de 75 € — valable FLY et MODE" },
  { ref: "M-1120", statut: "annulee", etape: "Annulée — réservation expirée", articleId: "jordan",
    paye: 0, date: "18 juil.", motifRetour: "Code de réservation expiré avant le paiement" }
],

/* ── TENDANCES (refonte 06/09) ────────────────────────────────────────────────
       CE QUI ÉTAIT LÀ : trois personas inventées (« Yasmine B. », « Kamel O. »,
       « Lina R. »), leurs handles, leurs tenues chiffrées « en boutique », et deux
       collabs datées « depuis le 12 août » / « drop le 30 août · 20 h » — annoncées
       « en cours » alors que `lancement.modeJmoins` place l'ouverture MODE à 59 jours.
       Rien de tout cela n'existait, rien ne l'écrivait (aucun écran manager n'alimente
       cette page, contrairement à ce qu'elle affirmait), et les dates étaient périmées.

       CE QUI LA REMPLACE : la page se calcule sur le CATALOGUE RÉEL. Trois signaux,
       tous dérivés, tous vérifiables à l'écran — écart au prix neuf, arrivées récentes,
       dernier exemplaire (la rangée de marques a été retirée le 07/09). `tendancesVues()` les produit ;
       aucun contenu éditorial n'est stocké ici tant que personne ne l'écrit vraiment. ── */
    tendances: {
      /* La page se sert de tendancesVues() — cette clé ne garde QUE la règle d'animation,
         qui est une intention commerciale, pas une donnée affichée comme un fait. */
      reglesAnimation: "Une collab signée = une vague réseaux (annonce → coulisses atelier → drop) — cockpit Commercial · Agenda"
    },

    /* ── NORMES PHOTOS fournisseur (décision 21/08) : PayEnCash FILTRE la qualité qui
          entre — le fournisseur est informé AU DÉPÔT, l'atelier juge, hors normes = renvoyé.
          Le beau vend ; une photo floue tue la pièce ET la marque. ── */
    normesPhotos: {
      roles: ["Face", "Dos", "Étiquette / semelle", "Défauts"],   // 4 vues obligatoires (défauts requis hors neuf)
      regles: [
        "Fond neutre et uni (mur clair, drap) — rien d'autre dans le cadre",
        "Lumière du jour, sans flash direct ni contre-jour",
        "Pièce ENTIÈRE et nette — à plat ou sur cintre, jamais portée froissée",
        "4 vues : face · dos · étiquette/marque · défaut éventuel en gros plan",
        "Aucun filtre, aucune retouche — la photo doit dire la vérité de la pièce"
      ],
      controle: "Chaque photo passe par l'atelier : hors normes → la pièce est renvoyée en « photos à refaire » (pipeline), rien n'est publié.",
      pourquoi: "La qualité perçue de PayEnCash MODE, c'est d'abord la photo — on refuse ce qui est flou, sombre ou coupé."
    },

    /* ── Favoris (Vinted : central) — page mode/12, cœur sur fiche et grilles ── */
    favoris: ["airmax", "robe"],

    /* ── COULEURS (Phase 2 « confiance ») : filtre couleur = fondamental en mode, il
          manquait. Chaque article porte couleur + couleurHex (pastille). ── */
    /* Palette COMPLÈTE type e-commerce mode (fondatrice 04/09 « il manque des couleurs pour le
       fournisseur ») — les 6 teintes historiques gardent id/nom/hex à l'identique (CL·313 épingle
       rouge/vert). Multicolore = dégradé CSS (les pastilles utilisent hex comme background). */
    couleurs: [
      { id: "noir", nom: "Noir", hex: "#1A1A1A" }, { id: "anthracite", nom: "Gris anthracite", hex: "#4A4D52" },
      { id: "gris", nom: "Gris", hex: "#9AA0A6" }, { id: "argente", nom: "Argenté", hex: "#C6CBD4" },
      { id: "blanc", nom: "Blanc", hex: "#EDEDED" }, { id: "creme", nom: "Crème", hex: "#F4EBD5" },
      { id: "beige", nom: "Beige", hex: "#D9C4A3" }, { id: "camel", nom: "Camel", hex: "#B67A3F" },
      { id: "cognac", nom: "Cognac", hex: "#8C4A21" }, { id: "marron", nom: "Marron", hex: "#9A5B2E" },
      { id: "bordeaux", nom: "Bordeaux", hex: "#7A1F2E" }, { id: "rouge", nom: "Rouge", hex: "#C0392B" },
      { id: "corail", nom: "Corail", hex: "#E8705F" }, { id: "orange", nom: "Orange", hex: "#E07B1F" },
      { id: "jaune", nom: "Jaune", hex: "#E9C82A" }, { id: "moutarde", nom: "Moutarde", hex: "#C79A17" },
      { id: "dore", nom: "Doré", hex: "#D4AF37" }, { id: "kaki", nom: "Kaki", hex: "#6C6F45" },
      { id: "vert", nom: "Vert", hex: "#0E7A5F" }, { id: "menthe", nom: "Menthe", hex: "#9FD9C3" },
      { id: "turquoise", nom: "Turquoise", hex: "#27A69A" }, { id: "bleuciel", nom: "Bleu ciel", hex: "#8FBEE8" },
      { id: "bleu", nom: "Bleu", hex: "#2B4C9B" }, { id: "marine", nom: "Bleu marine", hex: "#1C2A4A" },
      { id: "lilas", nom: "Lilas", hex: "#B9A3DB" }, { id: "violet", nom: "Violet", hex: "#6A3E9E" },
      { id: "rose", nom: "Rose", hex: "#E9A0BE" }, { id: "fuchsia", nom: "Fuchsia", hex: "#C72D7B" },
      { id: "multicolore", nom: "Multicolore", hex: "linear-gradient(90deg,#C0392B,#E9C82A,#0E7A5F,#2B4C9B)" }
    ],
    /* (04/09) plus de liste dure de matières pour le filtre : le vocabulaire est DÉRIVÉ des
       référentiels matieresListe + matieresParFamille + matieresParType — cf. matieresReferentiel(). */

    /* ── AVIS & RÉPUTATION (Phase 2) : les 5★ de 04-commande étaient collectées mais
          jamais stockées ni ré-affichées — pilier d'une résale. Seed + persistance
          (clé pec-mode-avis). Chaque avis est rattaché à un article ET à son vendeur. ── */
    avis: [
      { id: "AV-1", articleId: "airmax", vendeur: "Sneak'Hall", auteur: "Karim B.", note: 5, date: "il y a 6 j",  verifie: true, texte: "Conforme, propre, dans sa boîte d'origine. Le certificat d'authentification rassure vraiment." },
      { id: "AV-2", articleId: "robe",   vendeur: "Chez Awa",   auteur: "Nadia B.", note: 5, date: "il y a 11 j", verifie: true, texte: "Pièce unique magnifique, finitions impeccables. Livrée pliée avec soin." },
      { id: "AV-3", articleId: "sac",    vendeur: "Accessoire", auteur: "Léa M.",   note: 4, date: "il y a 18 j", verifie: true, texte: "Beau cuir, couleur cognac fidèle. Léger pli sur la bandoulière, honnêtement signalé sur la fiche." },
      { id: "AV-4", articleId: "airmax", vendeur: "Sneak'Hall", auteur: "Yanis T.", note: 5, date: "il y a 24 j", verifie: true, texte: "Deuxième achat, toujours au top. Retrait au relais en 3 jours." }
    ],
    /* Profils VENDEURS publics (fournisseurs) + réputation — différenciateur vs Vinted/Vestiaire. */
    vendeurs: [
      { id: "sneakhall",  nom: "Sneak'Hall", categorie: "Sneakers",    depuis: "mars 2026",  atelier: "authentification sneakers",   note: 4.9, nbVentes: 212, desc: "Revendeur de sneakers vérifiées — paires rétro et éditions, contrôlées pièce par pièce.", pieces: ["airmax", "jordan"] },
      { id: "awa",        nom: "Chez Awa",   categorie: "Créations",    depuis: "janv. 2026", atelier: "pièces uniques faites main",   note: 4.8, nbVentes: 64, desc: "Maison de création — pièces uniques confectionnées à Paris 18ᵉ.", pieces: ["robe"] },
      { id: "accessoire", nom: "Accessoire", categorie: "Maroquinerie", depuis: "févr. 2026", atelier: "cuir & maroquinerie",          note: 4.6, nbVentes: 38, desc: "Sélection maroquinerie en cuir pleine fleur.", pieces: ["sac"] }
    ],
    /* Questions PRÉ-ACHAT (messagerie acheteur ↔ vendeur/atelier), rattachées à l'article.
       Seed ; le socle PEC_BUS peut porter le fil réel. */
    /* (06/09 — nettoyage) LES QUESTIONS PRÉ-ACHAT ONT ÉTÉ RETIRÉES. Il restait deux
       questions/réponses inventées, deux fonctions (questionsArticle, questionPoser) que plus
       aucun écran n'appelait, et un commentaire « QUESTIONS PRÉ-ACHAT » posé sur le vide dans
       la fiche article. Une messagerie acheteur ↔ vendeur est une vraie fonctionnalité, à
       reconstruire entière si on la veut — pas un décor de seed qui traîne. */

    /* ── Retours (process complet mode/13) — DÉCISION FONDATRICE 31/08 (arbitrée par Emilie) :
          PayEnCash MODE est VENDEUR PROFESSIONNEL de biens d'occasion (achat ferme au
          fournisseur puis revente) → la vente à distance ouvre le DROIT DE RÉTRACTATION
          LÉGAL de 14 jours (art. L221-18 s. C. consommation), sans justification. Le
          remboursement en ESPÈCES est ÉCARTÉ (traçabilité LCB-FT) : avoir immédiat OU
          virement, au choix du client. Frais de retour : OFFERTS si la pièce est non
          conforme / défectueuse (notre erreur) ; À LA CHARGE DU CLIENT en cas de simple
          changement d'avis (défaut légal L221-23). Aligné sur les vendeurs pros de la
          seconde main (Vestiaire Collective, Vinted Pro).
          ⚠ Contenu à FAIRE VALIDER par un juriste avant mise en ligne réelle. ── */
    retour: {
      jours: 14,
      base: "art. L221-18 s. du Code de la consommation",
      role: "PayEnCash vend en tant que professionnel : les 14 jours sont un droit, pas un geste commercial.",
      fraisRetour: 4.90,   // coût de l'étiquette Mondial Relay retour, à la charge du client en cas de changement d'avis (L221-23)
      motifs: [
        { id: "non_conforme", label: "La pièce ne correspond pas à la fiche", type: "defaut", fraisOfferts: true  },
        { id: "taille",       label: "La taille ne me va pas",                type: "avis",   fraisOfferts: false },
        { id: "avis",         label: "J'ai changé d'avis",                    type: "avis",   fraisOfferts: false }
      ],
      remboursements: [
        { id: "avoir",    nom: "Avoir immédiat",    detail: "crédité tout de suite, valable FLY et MODE" },
        { id: "virement", nom: "Virement bancaire", detail: "sous 14 jours, IBAN à ton nom" }
      ],
      etiquette: "Étiquette Mondial Relay retour — à coller sur le colis, dépose-la dans n'importe quel point relais"
    },

    panier: {
      items: [{ articleId: "airmax", qte: 1 }],
      promo: null,   // aucune promo pré-appliquée : le client saisit un code ÉDITÉ par un fournisseur (03/09)
      /* (18/09) AUCUN bon d’achat posé d'avance : le Bon d’achat PayEnCash naît d'une VENTE chez un commerçant partenaire
         (partenaire/03) ou d'une émission du manager (écran 41) ; il s'applique au sac (panierBonAppliquer),
         il est DÉBITÉ au règlement de la part qu'il règle — le reste du solde reste au client. */
      /* (19/09, soir — décision fondatrice « au-delà de 250 €, ça repart sur l'achat d'un autre bon ») LE SAC
         PORTE UNE LISTE DE BONS, plus un seul. Un bon d'achat est borné à 250 € (LCB-FT) : un sac à 600 € se
         règle avec trois bons. Tant que le sac n'en acceptait qu'un, le comptoir pouvait bien en vendre trois,
         la cliente n'en posait qu'un — le mur était juste déplacé. */
      bons: [],
      // LIVRAISON — les CONDITIONS DU RELAIS appartiennent à Mondial Relay (fondatrice 02/09 : « d'où sors-tu
      // "colis gardé 8 jours" ? c'est Mondial Relay qui communique sur ça ») : elles sont portées ICI, sourcées,
      // et JAMAIS écrites dans une page. En production : remontées par l'API Mondial Relay (par point relais).
      /* (19/09, soir — décision fondatrice « le prix du colis, c'est le prix du colis de Mondial Relay, on ne
         rentre pas dedans ») LE TRANSPORT N'EST PLUS INCLUS DANS LE PRIX DE LA PIÈCE. Il se facture À PART, au
         tarif du transporteur, sans que nous prenions rien dessus : un colis par fournisseur qui expédie, tarifé
         à la tranche de poids (livraisonPanier). `coutInterne` disparaît avec l'absorption — plus rien n'est
         absorbé, donc il n'y a plus de coût interne à estimer. */
      livraison: { transporteur: "Mondial Relay", incluse: false, retourJours: 14, note: "tarif Mondial Relay facturé à l'identique, un colis par fournisseur qui expédie — PayEnCash ne prend aucune marge sur le transport",
        preparationOuvres: 2,                       // PayEnCash : le fournisseur remet le colis au réseau sous 2 j ouvrés (engagement contractuel fournisseur)
        delaiOuvres: [3, 5],                        // Mondial Relay : acheminement relais indicatif 3 à 5 j ouvrés
        gardeJours: 8,                              // Mondial Relay : durée de garde du colis au point relais
        retrait: "ta réf de commande + une pièce d'identité",   // Mondial Relay : conditions de retrait au relais
        sources: { delaiOuvres: "Mondial Relay — CGV livraison relais", gardeJours: "Mondial Relay — CGV livraison relais", retrait: "Mondial Relay — conditions de retrait", preparationOuvres: "PayEnCash — contrat fournisseur (art. Expédition)", retourJours: "Code de la consommation L221-18 (rétractation 14 jours)" } }
    },
codesFournisseur: [
  /* AUCUN code en seed (fondatrice 03/09 : « chaque fournisseur édite ses promos à lui, pas de
     statique ») — les codes naissent dans l'espace fournisseur (ajouterCodeFournisseur, persistés
     pec-mode-codes) et n'existent que là. */
],
    commande: { ref: "M-1208", articleId: "airmax", paye: 90, recu: "B3K-71",
      pointNom: "Tabac du Centre", bordereau: "R-0848",
      mr: "MR-8412007312", relais: "Presse de la Poste · 8 pl. du Marché", gardeJours: 8 },

    /* ── PIPELINE ATELIER (fondatrice 31/08, Phase 1 « faire tourner l'opération ») :
          les pièces en cours de traitement. Seed du référentiel ; les VERDICTS sont
          persistés (clé pec-mode-pieces) et vus de tous les écrans (atelier, stock,
          fournisseur). status ∈ soumis · photos_a_refaire · valide_publie · a_controler (reçue à l'atelier — contrôle physique) ·
          conforme · recote · refuse · expedie. Un vendu=true refusé/re-coté à l'atelier
          déclenche un remboursement client (la pièce a été payée AVANT le contrôle). ── */
    pieces: [
      { ref: "PC-1042", articleId: "airmax", fournisseur: "Sneak'Hall",    etatDeclare: "Très bon état",       authentifiable: true,  buyPrice: 132, sellPrice: 150, status: "a_controler", recu: "aujourd'hui 09:12", vendu: true },
      { ref: "PC-1043", articleId: "jordan", fournisseur: "Sneak'Hall",  etatDeclare: "Neuf sans étiquette", authentifiable: true,  buyPrice: 185, sellPrice: 210, status: "a_controler", recu: "aujourd'hui 09:40", vendu: true },
      { ref: "PC-1031", articleId: "airmax", fournisseur: "Frip'Nord",   etatDeclare: "Très bon état",       authentifiable: true,  buyPrice: 120, sellPrice: 140, status: "a_controler", recu: "aujourd'hui 10:05", vendu: true },
      { ref: "PC-1039", articleId: "robe",   fournisseur: "Chez Awa",    etatDeclare: "Neuf",               authentifiable: false, buyPrice: 74,  sellPrice: 85,  status: "soumis",  recu: "hier 16:20",       vendu: false },
      { ref: "PC-1044", articleId: "sac",    fournisseur: "Accessoire",  etatDeclare: "Neuf",               authentifiable: false, buyPrice: 38,  sellPrice: 45,  status: "soumis",  recu: "hier 17:02",       vendu: false }
    ],

    /* ── RÉSERVATIONS (Phase 1) : une réservation HOLD la pièce pendant que le client paie
          (minuteur), libérée à l'expiration → la pièce revient dispo et la file d'attente est
          notifiée. Le STOCK BRUT n'est plus un tableau à part : il est DÉRIVÉ de `inventaire`
          (fusion 01/09 — source unique). Voir stockDispo() / catalogueStock(). ── */
    /* (11/09) PLUS AUCUNE RÉSERVATION ÉCRITE. Deux holds de démonstration (« Sofiane M. » sur une Air Max 42,
       « Karim B. » sur une Jordan 43) servaient de repli quand le magasin était vide : sur un navigateur neuf,
       ils RETENAIENT du stock réel — la pièce s'affichait « Réservée » au catalogue sans qu'aucun client ne
       l'ait commandée. Une réservation naît d'une commande, jamais d'une liste. */
    reservations: [],
    waitlist: [
      { articleId: "airmax", taille: "42", enAttente: 2 },
      { articleId: "jordan", taille: "43", enAttente: 1 }
    ],

    /* ── COMPTE ENTREPRISE FOURNISSEUR (source UNIQUE — le fournisseur est une société) :
          identité, KYB, banque, contrat, contacts, préférences. Dérivé partout (KYB,
          compte, dashboard), jamais recopié en dur. Éditions persistées (override). ── */
    /* (11/09 — constat C4) PLUS UNE SEULE MENTION LÉGALE ÉCRITE ICI. Ce bloc portait un SIREN, un SIRET, un
       numéro de TVA intracommunautaire, un RCS, un code NAF et un IBAN — tous inventés, tous imprimés sur le
       contrat-cadre et sur les factures d'autofacturation. Il déclarait aussi un KYB « validé le 12 mars 2026 »
       et un contrat « signé le 10 mars 2026 » que personne n'avait vérifié ni signé. L'identité légale se RELÈVE
       sur les pièces déposées (PEC_DOCS.mentions → entrepriseDeriveeFournisseur) ; à défaut, elle MANQUE, et
       `fournisseurMentionsManquantes` refuse d'établir le document. Ne restent ici que la forme par défaut et
       les préférences de notification. */
    fournisseurEntreprise: {
      tel: "06 •• •• •• 12", telComplet: "0651124212",
      kyb: { statut: "en_cours" },
      contrat: { type: "Contrat-cadre d'achat ferme" },
      notifications: { ventes: true, expeditions: true, virements: true, messages: true, offres: false }
    },

    /* ── LISTES SÉLECTIONNABLES (publication) : matières, entretiens, défauts, systèmes
          de tailles — un MAX de données à choisir/suggérer, jamais du texte libre seul. ── */
    matieresListe: ["Cuir", "Cuir pleine fleur", "Daim", "Mesh", "Toile", "Coton", "Lin", "Laine", "Cachemire", "Soie", "Satin", "Denim", "Velours côtelé", "Polyester", "Nylon", "Caoutchouc"],
    // MATIÈRES PAR FAMILLE puis PAR TYPE (fondatrice 02/09 : « toutes les descriptions possibles sans filtre par
    // catégorie ») — le wizard et le générateur lisent matieresPour(cat, sous) ; matieresListe reste l'union (compat).
    matieresParFamille: {
      chaussures: ["Cuir", "Daim", "Nubuck", "Mesh", "Toile", "Cuir synthétique", "Textile recyclé", "Caoutchouc", "Gore-Tex"],
      vetements:  ["Coton", "Lin", "Laine", "Cachemire", "Soie", "Satin", "Viscose", "Jersey", "Maille", "Tweed", "Polyester", "Nylon", "Velours côtelé", "Cuir", "Duvet"],
      bas:        ["Denim", "Coton", "Lin", "Laine", "Velours côtelé", "Polyester", "Nylon", "Cuir", "Jersey", "Élasthanne"],
      ceintures:  ["Cuir", "Cuir pleine fleur", "Daim", "Toile", "Cuir tressé"],
      unique:     ["Cuir", "Cuir pleine fleur", "Daim", "Toile", "Nylon", "Polyester", "Coton", "Laine", "Cachemire", "Soie"]
    },
    matieresParType: {
      "Montres":              ["Acier inoxydable", "Titane", "Or", "Plaqué or", "Céramique", "Cuir (bracelet)", "Silicone", "Nylon (NATO)"],
      "Bijoux":               ["Argent 925", "Plaqué or", "Or 18 carats", "Acier inoxydable", "Laiton", "Perles", "Pierres fines"],
      "Lunettes":             ["Acétate", "Métal", "Titane", "Verres polarisés", "Verres cat. 3"],
      "Casquettes & chapeaux":["Coton", "Laine", "Feutre", "Paille", "Polyester", "Nylon"],
      "Bonnets & écharpes":   ["Laine", "Cachemire", "Acrylique", "Coton", "Alpaga", "Mohair"],
      "Gants":                ["Cuir", "Laine", "Cachemire", "Polaire", "Gore-Tex"],
      "Foulards & étoles":    ["Soie", "Laine", "Cachemire", "Coton", "Viscose", "Modal"],
      "Maillots de bain":     ["Polyamide", "Élasthanne", "Polyester recyclé", "Nylon"],
      "Manteaux & doudounes": ["Laine", "Cachemire", "Duvet", "Polyester", "Nylon", "Cuir", "Tweed", "Laine bouillie"],
      "Jeans":                ["Denim", "Denim stretch", "Denim brut (selvedge)", "Coton", "Élasthanne"],
      "Slides & claquettes":  ["Caoutchouc", "EVA", "Cuir", "Liège", "Textile"]
    },
    // SUGGESTIONS PAR TYPE (composition / entretien / poids) — affinent la catégorie ; le wizard les applique au
    // choix du type, le générateur s'en sert pour des fiches crédibles (un jean n'a pas de « doublure viscose »).
    suggestionsParType: {
      "Jeans":                { compo: ["Toile : denim 98 % coton · 2 % élasthanne"], care: ["Lavage à 30°", "Pas de sèche-linge"], poids: 650 },
      "Pantalons":            { compo: ["Tissu : coton · élasthanne", "Poches : coton"], care: ["Lavage à 30°", "Repassage doux"], poids: 500 },
      "Shorts":               { compo: ["Tissu : coton"], care: ["Lavage à 30°"], poids: 300 },
      "Jupes":                { compo: ["Tissu : viscose", "Doublure : polyester"], care: ["Lavage à la main", "Séchage à plat"], poids: 300 },
      "Robes":                { compo: ["Tissu : viscose", "Doublure : polyester"], care: ["Lavage à 30°", "Séchage à plat"], poids: 400 },
      "Manteaux & doudounes": { compo: ["Extérieur : laine", "Doublure : polyester", "Garnissage : duvet / polyester"], care: ["Nettoyage à sec"], poids: 1400 },
      "Vestes & blousons":    { compo: ["Extérieur : coton", "Doublure : polyester"], care: ["Lavage à 30°", "Pas de sèche-linge"], poids: 800 },
      "Blazers & tailleurs":  { compo: ["Tissu : laine · polyester", "Doublure : viscose"], care: ["Nettoyage à sec"], poids: 700 },
      "Ensembles & costumes": { compo: ["Tissu : laine · polyester", "Doublure : viscose"], care: ["Nettoyage à sec"], poids: 1100 },
      "Pulls & gilets":       { compo: ["Maille : laine · acrylique"], care: ["Lavage à la main", "Séchage à plat"], poids: 450 },
      "Sweats & hoodies":     { compo: ["Molleton : coton · polyester"], care: ["Lavage à 30°", "Pas de sèche-linge"], poids: 550 },
      "Chemises & blouses":   { compo: ["Tissu : coton (popeline)"], care: ["Lavage à 30°", "Repassage doux"], poids: 250 },
      "Tops & bodies":        { compo: ["Jersey : coton · élasthanne"], care: ["Lavage à 30°"], poids: 180 },
      "T-shirts & débardeurs":{ compo: ["Jersey : 100 % coton"], care: ["Lavage à 30°"], poids: 200 },
      "Combinaisons":         { compo: ["Tissu : viscose · lin"], care: ["Lavage à la main", "Séchage à plat"], poids: 450 },
      "Survêtements":         { compo: ["Molleton : coton · polyester"], care: ["Lavage à 30°"], poids: 700 },
      "Maillots de bain":     { compo: ["Polyamide · élasthanne", "Doublure : polyester"], care: ["Rinçage à l'eau claire", "Séchage à plat"], poids: 150 },
      "Slides & claquettes":  { compo: ["Semelle : EVA / caoutchouc", "Bride : textile / cuir"], care: ["Éviter l'eau chaude"], poids: 400 },
      "Sacs à main":          { compo: ["Extérieur : cuir", "Doublure : coton", "Métal : laiton"], care: ["Éviter l'eau", "Crème nourrissante"], poids: 700 },
      "Sacs à dos":           { compo: ["Extérieur : nylon", "Doublure : polyester"], care: ["Lavage à la main"], poids: 600 },
      "Sacs bandoulière & pochettes": { compo: ["Extérieur : cuir", "Doublure : textile"], care: ["Éviter l'eau"], poids: 350 },
      "Portefeuilles & petite maroquinerie": { compo: ["Cuir pleine fleur", "Doublure : cuir"], care: ["Éviter l'eau"], poids: 120 },
      "Ceintures":            { compo: ["Cuir pleine fleur", "Boucle : métal"], care: ["Éviter l'eau"], poids: 150 },
      "Montres":              { compo: ["Boîtier : acier inoxydable", "Bracelet : cuir", "Verre : saphir"], care: ["Étanchéité à vérifier", "Éviter les chocs"], poids: 120 },
      "Bijoux":               { compo: ["Argent 925"], care: ["Éviter parfum et eau", "Chiffon doux"], poids: 30 },
      "Lunettes":             { compo: ["Monture : acétate", "Verres : cat. 3"], care: ["Étui et chiffon microfibre"], poids: 40 },
      "Casquettes & chapeaux":{ compo: ["100 % coton"], care: ["Lavage à la main"], poids: 90 },
      "Bonnets & écharpes":   { compo: ["Maille : laine · acrylique"], care: ["Lavage à la main", "Séchage à plat"], poids: 150 },
      "Gants":                { compo: ["Cuir", "Doublure : cachemire"], care: ["Éviter l'eau"], poids: 80 },
      "Foulards & étoles":    { compo: ["100 % soie"], care: ["Nettoyage à sec"], poids: 60 }
    },
    // COUPE / FIT (comme Ralph Lauren / Zara) : par FAMILLE de pièce. `unique` = pas de coupe (accessoires).
    coupes: {
      bas:        ["Slim", "Droit", "Large", "Bootcut", "Cargo", "Jogger"],
      haut:       ["Ajusté", "Regular", "Oversize", "Cintré", "Boyfriend"],
      chaussures: ["Basse", "Montante", "Mi-montante"],
      unique:     []
    },
    // MOTIF (Uni sur-représenté, comme le vrai catalogue).
    // « Uni » ×4 = PONDÉRATION du tirage générateur (2 pièces sur 3 unies) ; le filtre Motif, lui,
    // déduplique en ne montrant que les motifs présents — jamais de chip en double.
    motifsListe: ["Uni", "Uni", "Uni", "Uni", "Rayé", "Imprimé", "À carreaux", "Fleuri", "Logo", "Camouflage", "Pois"],
    entretiens: ["Lavage à la main", "Lavage à 30°", "Lavage à 40°", "Nettoyage à sec", "Séchage à plat", "Pas de sèche-linge", "Repassage doux", "Éviter l'eau", "Brossage doux", "Imperméabilisant recommandé"],
    defautsTypes: ["Micro-usure de la semelle", "Légère décoloration", "Petite tache", "Bouloches", "Griffure / éraflure", "Couture reprise", "Bouton / accessoire manquant", "Ourlet à reprendre", "Odeur légère", "Trace d'usage aux angles"],
    // Défauts PAR FAMILLE de pièce (02/09 : « micro-usure de la semelle » proposé pour un pantalon) — le wizard
    // lit defautsPour(cat, sous) ; defautsTypes reste l'union (compat).
    defautsParFamille: {
      chaussures: ["Micro-usure de la semelle", "Griffure / éraflure", "Légère décoloration", "Petite tache", "Odeur légère", "Lacets / semelle intérieure remplacés"],
      vetements:  ["Bouloches", "Petite tache", "Légère décoloration", "Couture reprise", "Bouton / accessoire manquant", "Ourlet à reprendre", "Odeur légère", "Fil tiré"],
      bas:        ["Bouloches", "Petite tache", "Légère décoloration", "Ourlet à reprendre", "Couture reprise", "Bouton / zip à reprendre", "Usure de l'entrejambe", "Odeur légère"],
      ceintures:  ["Griffure / éraflure", "Trace d'usage aux angles", "Boucle marquée", "Légère décoloration"],
      bonnets:    ["Bouloches", "Fil tiré", "Petite tache", "Légère décoloration", "Pompon décousu", "Odeur légère"],
      gants:      ["Griffure / éraflure", "Couture reprise", "Légère décoloration", "Doublure marquée", "Petite tache"],
      unique:     ["Griffure / éraflure", "Trace d'usage aux angles", "Petite tache", "Légère décoloration", "Fermeture / accessoire manquant", "Couture reprise", "Doublure marquée"]
    },
    systemesTailles: {
      "36": { uk: "3.5", us: "4.5", cm: "23" }, "37": { uk: "4", us: "5", cm: "23.5" },
      "38": { uk: "5", us: "6", cm: "24" }, "39": { uk: "6", us: "6.5", cm: "24.5" }, "40": { uk: "6.5", us: "7", cm: "25" },
      "41": { uk: "7.5", us: "8", cm: "26" }, "42": { uk: "8", us: "8.5", cm: "26.5" }, "43": { uk: "9", us: "9.5", cm: "27.5" },
      "44": { uk: "9.5", us: "10", cm: "28" }, "45": { uk: "10.5", us: "11", cm: "29" },
      "46": { uk: "11", us: "11.5", cm: "29.5" }, "47": { uk: "12", us: "12.5", cm: "30.5" }
    },
    /* ── GRILLES DE TAILLES (source UNIQUE) — par TYPE de pièce, plus aucune taille en dur
          ni côté wizard ni côté fiche client. Le mapping catégorie/sous-catégorie → grille
          est dans taillesPour() : chaussures (EU), vêtements (XS→XXL), bas (tour de taille FR
          pour jeans/pantalons/jupes/shorts), ceintures (cm), bonnets (S/M-L/XL, tour de tête),
          gants (S-M-L, tour de main), unique (casquettes réglables, sacs, bijoux, foulards…
          — arbitrage 04/09 : casquettes & chapeaux restent Unique, la casquette domine le type). ── */
    grillesTailles: {
      chaussures: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
      vetements:  ["XS", "S", "M", "L", "XL", "XXL"],
      bas:        ["34", "36", "38", "40", "42", "44", "46"],
      ceintures:  ["85", "90", "95", "100", "105", "110"],
      bonnets:    ["S/M", "L/XL"],
      gants:      ["S", "M", "L"],
      unique:     ["Unique"]
    },
    guideTailles: {
      chaussures: "EU 40 = UK 6,5 = US 7 = 25 cm · EU 42 = UK 8 = US 8,5 = 26,5 cm · EU 44 = UK 9,5 = US 10 = 28 cm. Prends ta pointure habituelle.",
      vetements:  "XS = 34 · S = 36 · M = 38-40 · L = 42 · XL = 44 · XXL = 46. Coupe fluide — taille normalement.",
      bas:        "Tour de taille FR : 36 ≈ W28 · 38 ≈ W30 · 40 ≈ W31 · 42 ≈ W33 · 44 ≈ W34. Mesure ton tour de taille au plus juste.",
      ceintures:  "Longueur en cm — prends ton tour de taille pantalon habituel.",
      bonnets:    "S/M ≈ tour de tête 54-58 cm · L/XL ≈ 58-62 cm. Mesure au-dessus des sourcils, mètre bien à plat.",
      gants:      "S ≈ tour de main 18-19 cm · M ≈ 20-21 cm · L ≈ 22-23 cm. Mesure la paume sans le pouce.",
      unique:     null
    },

    /* ── PUBLICATION PRO (fournisseur) : pré-remplissage par catégorie (matière,
          composition, entretien, poids, gamme de tailles) — le fournisseur AJUSTE,
          il ne repart pas de zéro. Zéro donnée en dur côté écran. ── */
    suggestions: {
      "Sneakers":      { matiereDefaut: ["Mesh", "cuir"],        compo: ["Tige : mesh · cuir", "Semelle : caoutchouc", "Doublure : textile"], careDefaut: ["Brossage doux", "Éviter l'eau"],           poids: 1200, prefixe: "SNK", tailles: ["38", "39", "40", "41", "42", "43", "44", "45"] },
      "Prêt-à-porter": { matiereDefaut: ["Coton"],               compo: ["Tissu : coton", "Doublure : viscose"],                              careDefaut: ["Lavage à 30°", "Repassage doux"],         poids: 450,  prefixe: "PAP", tailles: ["XS", "S", "M", "L", "XL"] },
      "Accessoires":   { matiereDefaut: ["Cuir pleine fleur"],   compo: ["Extérieur : cuir", "Doublure : coton"],                             careDefaut: ["Éviter l'eau"],                            poids: 800,  prefixe: "ACC", tailles: ["Unique"] }
    },
    /* (19/09, nuit) LE COMPTEUR DE RÉFÉRENCES NE S'ÉCRIT PLUS À LA MAIN. « refSeq: 1052 » annonçait la
       prochaine référence libre alors que l'inventaire ci-dessous contient déjà PEC-PAP-1052 : la première
       pièce publiée reprenait donc la référence — et l'identifiant d'article — d'une robe existante. Il se
       dérive maintenant de l'inventaire lui-même (_refSeqPlancher) : il suit la démonstration quand elle
       grandit, au lieu de se faire dépasser en silence. */
    refSeq: null,

    /* ── INVENTAIRE FOURNISSEUR (stock pro) : chaque publication = un LOT réf. unique,
          avec ses lignes taille × quantité. Dispo = qté − vendu − réservé par ligne.
          Cycle : brouillon → soumis → valide_publie → (vendu par ligne) → épuisé.
          Seed du fournisseur courant ; persistance clé pec-mode-inventaire. ── */
    fournisseurCourant: "Chez Awa",
    // RÉFÉRENTIEL DES FOURNISSEURS (fondatrice 02/09 : « des fournisseurs bien distincts avec leur accès côté manager »)
    // Chaque compte : identité, ville, catégories/spécialités, KYB, ACCÈS (login = e-mail, code d'accès, statut). Le
    // Manager (26-fournisseurs) le lit et pilote les accès (inviter / suspendre / réactiver, persisté) ; l'app
    // fournisseur ouvre une SESSION sur un compte actif (fournisseurActifSet) — son stock, ses ventes, ses publications.
    // Les 10 noms du générateur de catalogue sont tous ici : chaque pièce générée a un vrai fournisseur.
    fournisseurs: [
      { id: "awa",          nom: "Chez Awa",       ville: "Paris 18ᵉ",   categories: ["Prêt-à-porter"],               specialites: ["Robes", "Jupes", "Tops & bodies", "Combinaisons"],                          kyb: "valide",   depuis: "janv. 2026", acces: { login: "contact@chezawa.fr",        code: "418 205", statut: "actif" },   entreprise: { enseigne: "Chez Awa", raisonSociale: "Chez Awa SARL", ville: "Paris", cp: "75018", adresse: "18 rue des Gardes", dirigeant: "Awa Diallo", email: "contact@chezawa.fr" } },
      { id: "sneakhall",    nom: "Sneak'Hall",     ville: "Marseille",   categories: ["Sneakers"],                    specialites: ["Lifestyle", "Montantes", "Éditions limitées"],                               kyb: "valide",   depuis: "mars 2026",  acces: { login: "hello@sneakhall.fr",        code: "730 916", statut: "actif" },   entreprise: { enseigne: "Sneak'Hall", raisonSociale: "Sneak'Hall SAS", ville: "Marseille", cp: "13001", adresse: "4 rue de la République", dirigeant: "Yanis Bouzid", email: "hello@sneakhall.fr" } },
      { id: "accessoire",   nom: "Accessoire",     ville: "Lyon",        categories: ["Accessoires"],                 specialites: ["Sacs à main", "Sacs bandoulière & pochettes"],                              kyb: "valide",   depuis: "févr. 2026", acces: { login: "atelier@accessoire.fr",      code: "265 471", statut: "actif" },   entreprise: { enseigne: "Accessoire", raisonSociale: "Accessoire SARL", ville: "Lyon", cp: "69002", adresse: "12 rue Mercière", dirigeant: "Claire Morel", email: "atelier@accessoire.fr" } },
      { id: "fripnord",     nom: "Frip'Nord",      ville: "Lille",       categories: ["Prêt-à-porter"],               specialites: ["Manteaux & doudounes", "Vestes & blousons", "Jeans"],                      kyb: "valide",   depuis: "avr. 2026",  acces: { login: "contact@fripnord.fr",        code: "902 338", statut: "actif" },   entreprise: { enseigne: "Frip'Nord", raisonSociale: "Frip'Nord SARL", ville: "Lille", cp: "59000", adresse: "7 rue de Béthune", dirigeant: "Karim Lefebvre", email: "contact@fripnord.fr" } },
      { id: "vintagecorner",nom: "Vintage Corner", ville: "Bordeaux",    categories: ["Prêt-à-porter", "Accessoires"], specialites: ["Chemises & blouses", "Blazers & tailleurs", "Foulards & étoles"],           kyb: "valide",   depuis: "avr. 2026",  acces: { login: "bonjour@vintagecorner.fr",   code: "584 120", statut: "actif" },   entreprise: { enseigne: "Vintage Corner", raisonSociale: "Vintage Corner SAS", ville: "Bordeaux", cp: "33000", adresse: "22 rue Sainte-Catherine", dirigeant: "Léa Dupont", email: "bonjour@vintagecorner.fr" } },
      { id: "ledressing",   nom: "Le Dressing",    ville: "Nantes",      categories: ["Prêt-à-porter"],               specialites: ["Pulls & gilets", "Sweats & hoodies", "T-shirts & débardeurs"],             kyb: "valide",   depuis: "mai 2026",   acces: { login: "contact@ledressing.fr",     code: "116 942", statut: "actif" },   entreprise: { enseigne: "Le Dressing", raisonSociale: "Le Dressing SARL", ville: "Nantes", cp: "44000", adresse: "9 rue Crébillon", dirigeant: "Maël Rousseau", email: "contact@ledressing.fr" } },
      { id: "sneaklab",     nom: "Sneak Lab",      ville: "Toulouse",    categories: ["Sneakers"],                    specialites: ["Running", "Trail", "Tennis"],                                                kyb: "valide",   depuis: "mai 2026",   acces: { login: "lab@sneaklab.fr",           code: "377 604", statut: "actif" },   entreprise: { enseigne: "Sneak Lab", raisonSociale: "Sneak Lab SAS", ville: "Toulouse", cp: "31000", adresse: "3 place du Capitole", dirigeant: "Inès Garcia", email: "lab@sneaklab.fr" } },
      { id: "maisonlea",    nom: "Maison Léa",     ville: "Lyon",        categories: ["Accessoires"],                 specialites: ["Sacs à dos", "Portefeuilles & petite maroquinerie", "Ceintures"],           kyb: "valide",   depuis: "juin 2026",  acces: { login: "contact@maisonlea.fr",      code: "649 283", statut: "actif" },   entreprise: { enseigne: "Maison Léa", raisonSociale: "Maison Léa SAS", ville: "Lyon", cp: "69001", adresse: "15 rue Lanterne", dirigeant: "Léa Fontaine", email: "contact@maisonlea.fr" } },
      { id: "retrokicks",   nom: "Retro Kicks",    ville: "Paris 3ᵉ",    categories: ["Sneakers"],                    specialites: ["Rétro / vintage", "Skate", "Éditions limitées"],                             kyb: "valide",   depuis: "juin 2026",  acces: { login: "shop@retrokicks.fr",        code: "821 075", statut: "actif" },   entreprise: { enseigne: "Retro Kicks", raisonSociale: "Retro Kicks SARL", ville: "Paris", cp: "75003", adresse: "31 rue de Bretagne", dirigeant: "Samir Haddad", email: "shop@retrokicks.fr" } },
      { id: "lafriperie",   nom: "La Friperie",    ville: "Rennes",      categories: ["Prêt-à-porter"],               specialites: ["Pantalons", "Shorts", "Ensembles & costumes"],                              kyb: "valide",   depuis: "juil. 2026", acces: { login: "contact@lafriperie.fr",     code: "293 517", statut: "actif" },   entreprise: { enseigne: "La Friperie", raisonSociale: "La Friperie SARL", ville: "Rennes", cp: "35000", adresse: "5 rue Saint-Georges", dirigeant: "Nolwenn Le Gall", email: "contact@lafriperie.fr" } },
      { id: "ateliersud",   nom: "Atelier Sud",    ville: "Nice",        categories: ["Accessoires"],                 specialites: ["Montres", "Bijoux", "Lunettes"],                                             kyb: "valide",   depuis: "juil. 2026", acces: { login: "atelier@ateliersud.fr",     code: "458 361", statut: "actif" },   entreprise: { enseigne: "Atelier Sud", raisonSociale: "Atelier Sud SAS", ville: "Nice", cp: "06000", adresse: "18 rue Masséna", dirigeant: "Paolo Ferrari", email: "atelier@ateliersud.fr" } },
      { id: "kickzstore",   nom: "Kickz Store",    ville: "Strasbourg",  categories: ["Sneakers"],                    specialites: ["Basketball", "Montantes", "Slides & claquettes"],                            kyb: "valide",   depuis: "août 2026",  acces: { login: "store@kickzstore.fr",       code: "705 148", statut: "actif" },   entreprise: { enseigne: "Kickz Store", raisonSociale: "Kickz Store SAS", ville: "Strasbourg", cp: "67000", adresse: "20 rue des Grandes Arcades", dirigeant: "Thomas Meyer", email: "store@kickzstore.fr" } },
      { id: "secondemain",  nom: "Seconde Main",   ville: "Montpellier", categories: ["Prêt-à-porter", "Accessoires"], specialites: ["Survêtements", "Maillots de bain", "Casquettes & chapeaux", "Bonnets & écharpes", "Gants"], kyb: "en_cours", depuis: "août 2026", acces: { login: "contact@secondemain.fr", code: "—", statut: "invite" }, entreprise: { enseigne: "Seconde Main", raisonSociale: "Seconde Main SARL", ville: "Montpellier", cp: "34000", adresse: "8 rue de la Loge", dirigeant: "Amel Benali", email: "contact@secondemain.fr" } }
    ],
    // Quel fournisseur publie quel TYPE dans la démo (dérivé des spécialités ; repli = 1er fournisseur de la catégorie)

    // SOURCE UNIQUE DU STOCK MODE (fusion 01/09) : les lots portent `articleId` (lien vers
    // l'article client) — le catalogue client, le stock manager et le stock fournisseur
    // dérivent TOUS d'ici. Plus de tableau `mode.stock` en doublon.
    inventaire: [
      { ref: "PEC-SNK-1042", articleId: "airmax", fournisseur: "Sneak'Hall", categorie: "Sneakers", sous: "Lifestyle", genre: "homme", marque: "Nike", modele: "Air Max 97 Silver", couleurs: ["Blanc", "Gris"], matiere: "Mesh · cuir", etat: "Neuf sans étiquette", prix: 120, poids: 1200,
        lignes: [{ taille: "41", qte: 2, vendu: 0, reserve: 0 }, { taille: "42", qte: 3, vendu: 1, reserve: 1 }, { taille: "43", qte: 2, vendu: 0, reserve: 0 }], status: "valide_publie", cree: "il y a 3 j" },
      { ref: "PEC-PAP-1050", articleId: "robe", fournisseur: "Chez Awa", categorie: "Prêt-à-porter", sous: "Robes", genre: "femme", marque: "Chez Awa · création", modele: "Robe de soirée émeraude", couleurs: ["Vert"], matiere: "Satin de coton", etat: "Neuf", prix: 74, poids: 400,
        lignes: [{ taille: "M", qte: 1, vendu: 0, reserve: 0 }], status: "valide_publie", cree: "hier" },
      /* (19/09 — fondatrice « fais le filtre sur la robe aussi ») LE LOT DE LA ROBE ÉTAIT « SOUMIS », ET ELLE
         ÉTAIT POURTANT EN VENTE : sa fiche, ses photos, son prix, ses avis — tout était ouvert alors que son lot
         disait « photos à contrôler ». Personne ne le voyait parce que le stock ignorait le statut. Maintenant
         que le statut fait foi, il faut choisir : la robe est une pièce du référentiel, décrite et notée, elle
         est EN VENTE. Et la file d'atelier garde un cas à elle — un lot qui n'est PAS une pièce vitrine, qui
         vit dans le stock de son fournisseur et n'apparaît nulle part dans Mode tant qu'il n'est pas validé.
         (La file de l'atelier, elle, vit dans `mode.pieces` : ces deux-là ne se confondent plus.) */
      { ref: "PEC-PAP-1052", articleId: "pubpecpap1052", fournisseur: "Chez Awa", categorie: "Prêt-à-porter", sous: "Robes", genre: "femme", marque: "Chez Awa · création", modele: "Robe portefeuille lin", couleurs: ["Beige"], matiere: "Lin", etat: "Neuf avec étiquette", prix: 68, poids: 350,
        lignes: [{ taille: "S", qte: 1, vendu: 0, reserve: 0 }], status: "soumis", cree: "hier" },
      { ref: "PEC-ACC-1051", articleId: "sac", fournisseur: "Accessoire", categorie: "Accessoires", sous: "Sacs bandoulière & pochettes", genre: "mixte", marque: "Sans marque", modele: "Sac bandoulière cuir", couleurs: ["Marron"], matiere: "Cuir pleine fleur", etat: "Neuf", prix: 38, poids: 800,
        lignes: [{ taille: "Unique", qte: 3, vendu: 1, reserve: 0 }], status: "valide_publie", cree: "il y a 6 j" },
      { ref: "PEC-SNK-1049", articleId: "jordan", fournisseur: "Sneak'Hall", categorie: "Sneakers", sous: "Montantes", genre: "homme", marque: "Jordan", modele: "Jordan 4 Retro", couleurs: ["Noir"], matiere: "Cuir · textile", etat: "Neuf sans étiquette", prix: 185, poids: 1300,
        lignes: [{ taille: "43", qte: 1, vendu: 0, reserve: 0 }], status: "valide_publie", cree: "il y a 2 j" }
    ],

    /* ── FACTURATION FOURNISSEURS (Phase 1) : achat ferme → facture émise → virement ≤ 7 j.
          Jamais de « reversement » : les espèces clients restent à AJEK, on VIRE le fournisseur.
          statut ∈ a_facturer (achat ferme, à facturer) · emise (à virer) · viree. ── */
    factures: [],   // (08/09 — audit fournisseur) ZÉRO seed : une facture naît d'un achat ferme (reglerCommande → a_facturer), s'émet (emettreFacture), se vire (virerFacture) — les quatre factures écrites (« Robe de soirée 74 € », F-2026-088…) sont parties

    /* ── EXPÉDITIONS FOURNISSEUR (pivot 31/08 « plus de ramassage agent — le fournisseur
          expédie via Mondial Relay ») : chaque pièce VENDUE est expédiée par le fournisseur
          DIRECTEMENT au client, avec une étiquette Mondial Relay émise sur le COMPTE AJEK
          (expéditeur = AJEK — le fournisseur reste exécutant logistique, jamais vendeur ni
          bénéficiaire des paiements : modèle achat-revente préservé, hors DSP2). Contrôle
          NON systématique : un contrôle ALÉATOIRE peut BLOQUER une pièce → le fournisseur
          l'envoie d'abord à l'atelier AJEK (étiquette atelier), qui contrôle puis réexpédie.
          statut ∈ a_expedier · etiquette_prete · expedie · bloque_controle. Seed du
          fournisseur courant ; persistance clé pec-mode-expeditions. ── */
    expeditions: [],   // (08/09 — audit fournisseur) ZÉRO seed : une expédition naît d'une vente réglée (reglerCommande) — les colis écrits (M-1187 « expedie », bloqué sans lot) contredisaient 08-stock

    /* ── PARTAGE FOURNISSEUR (fournisseur-influenceur) : lien TRACÉ de sa pièce sur
          PayEnCash MODE. (06/09) PLUS AUCUN CHIFFRE DE SEED : le journal est vide au
          départ et ne se remplit que d'événements RÉELS — une ouverture du lien tracé
          (?src=<réf> sur la fiche Mode) écrit un « clic », une commande passée pendant
          la fenêtre d'attribution écrit une « vente ». Un fournisseur qui n'a jamais
          partagé voit 0 — c'est la vérité, pas un écran vide déguisé. ── */
    partage: { journal: [] },

    /* ── FIDÉLITÉ PROPRE À MODE (Phase 4 « engagement ») : un grand-livre de points sur
          les ACHATS MODE (1 pt / € encaissé ; 100 pts = 5 € de remise), distinct de la
          cagnotte Fly/voyage. Seed + persistance (clé pec-mode-fidelite). ── */
    fidelite: [
      { ref: "M-1187", label: "Achat — Robe de soirée",      points: 75, date: "2 août" },
      { ref: "M-1154", label: "Achat — Sac bandoulière cuir", points: 45, date: "11 juil." },
      { ref: "PARRAIN", label: "Parrainage — Nadia B.",       points: 50, date: "20 juil." }
    ],
    fideliteConversion: { parEuro: 1, paliers: [{ points: 100, remise: 5 }, { points: 200, remise: 12 }] },

    /* ── LIVRE DE POLICE (Phase 2 « confiance/conformité », art. 321-7 du code pénal) :
          tout professionnel qui achète pour revendre des objets mobiliers d'OCCASION doit
          tenir un registre (coté et paraphé) permettant d'IDENTIFIER chaque objet ET la
          personne qui l'a cédé. Sortie = vente (réf commande) ou retour. Registre en
          lecture seule côté outil (immuable) ; ligne numérotée. Seed dérivé des pièces. ── */
    /* (12/09 — constats C39/C40) PLUS UNE SEULE LIGNE ÉCRITE. Le registre portait quatre lignes de
       démonstration — dont « Particulier (M. D.) · CNI n° •••• vérifiée », une identité inventée dans un
       registre que la police peut réquisitionner — et elles se mélangeaient aux lignes réelles. Un registre
       ne contient que ce qui est entré et sorti pour de vrai : il est DÉRIVÉ de l'inventaire et de ses
       mouvements, pièce par pièce. */
    registrePolice: [
    ]
  },
  /* ── LANCEMENT SÉQUENCÉ : FLY actif TOUT DE SUITE · MODE ouvre à une DATE ── */
  lancement: {
    fly: "actif",
    /* (10/09 — lot 8, constat D-40) « Prélancement MODE — J-59 » aurait affiché J-59 le jour du lancement :
       le compte à rebours était un NOMBRE figé, pas un compte à rebours. C'est une date (paramétrable en
       10-configuration) ; le J-x s'en déduit, et il tombe à zéro tout seul. */
    modeLe: null,                              // aaaa-mm-jj — posée en configuration, sinon « date à fixer »
    concours: { dotation: "1 000 € d'achats sur PayEnCash", mecanique: "inscription à l'ouverture MODE = participation — tirage au jour du lancement" },
    // (08/09) OBJECTIFS seulement : les « inscrits 47 · KYB 32 · catalogues 19 · pièces 210 » et l'entonnoir chiffré étaient
    // écrits — ils se DÉRIVENT des vrais fournisseurs (lancementEtat)
    objectifFournisseurs: { cible: 120, cataloguesMinPieces: 3 },
    entonnoirObjectifs: [["Candidatures reçues", 120], ["KYB validés", 90], ["Catalogues publiés (≥ 3 pièces)", 60], ["Fournisseurs ACTIFS au jour J", 40]],
    paliers: [25, 50, 100],
    animation: "1 collab signée = 1 vague réseaux · paliers annoncés : 25 · 50 · 100 fournisseurs inscrits"
  },   // J−45 (règle en vigueur depuis le 26/08 ; la logique réelle passe par `semaines`/promosActives)
  /* ══ (20/09 — décision fondatrice « enlève la logique Neosurf, supprime toute mention Neosurf ») ══════
     IL N'Y A PLUS QU'UN MOYEN, ET C'EST LE NÔTRE : le Bon d'achat PayEnCash. Le ticket d'un réseau tiers a
     disparu du parcours, et avec lui la page hébergée d'un prestataire, le plafond anonyme de 50 € et le
     compte vérifié qu'il fallait au-delà : trois règles étrangères que le client devait comprendre pour
     payer chez nous. iDEAL part avec eux — il passait par le même prestataire et ne servait qu'aux Pays-Bas,
     où nous ne vendons rien.
     CE QUI RESTE EST PLUS SIMPLE À DIRE : on achète un bon d'achat au comptoir d'un commerce partenaire ou
     à un distributeur mobile, et on saisit son code. Aucun fonds détenu, nulle part, jamais.
     Chaque moyen porte les PAYS où il est proposé ; `paysClient()` tranche ce que le client voit. ════════ */
  MOYENS_PAIEMENT: [
    /* (18/09, soir — décision fondatrice « le client paie en espèces, il règle comme il veut ») ON NE DIT JAMAIS
       COMMENT LE CLIENT RÈGLE AU COMPTOIR. Ce n'est ni notre affaire, ni notre promesse : la promesse, c'est qu'il
       n'a AUCUNE donnée bancaire à donner ici. Le commerçant encaisse pour le compte de PayEnCash, par les moyens qu'il
       accepte. Dire « en espèces » nous prêtait une règle que nous n'imposons pas — et que nous ne pourrions pas tenir. */
    { k: 'bon',     lbl: 'Bon d’achat PayEnCash', type: 'bon', pays: ['FR'],
      /* (19/09, nuit — « si en ligne alors un client peut utiliser plusieurs bons ») LE CUMUL SE DIT AVANT,
         pas une fois le premier bon appliqué : un sac à 600 € demande trois bons (un bon est borné à 250 €),
         et la cliente doit le savoir en arrivant sur le champ, pas le découvrir en chemin. */
      aide: "Achète un Bon d’achat chez un commerçant partenaire ou auprès d'un distributeur qui se déplace, du MONTANT EXACT que tu veux, puis saisis le code de son ticket. Tu peux en cumuler PLUSIEURS sur la même commande, l'un après l'autre, et utiliser un même bon en plusieurs fois. Chez le commerçant tu règles comme d'habitude, selon ce qu'il accepte : espèces, monnaie ou carte. Aucun fonds ne passe par PayEnCash.", delai: 'immédiat' }
  ],
  /* (18/09) LA LIGNE SOCIÉTÉ. Les standards d'un site marchand exigent la raison sociale et l'adresse
     de l'entreprise « visibles, y compris sur la page de paiement finale » : elle se dérive de ref.societe et s'applique
     à tout élément [data-societe-ligne] — sous chaque bouton « Payer », jamais recopiée dans une page. */
  societeLigne: function () {
    var s = (this.ref && this.ref.societe) || {};
    return [s.nom ? s.nom + (s.forme ? ' ' + s.forme : '') : '', s.siren ? 'SIREN ' + s.siren : '', s.siege || ''].filter(Boolean).join(' · ');
  },
  /* ══ (21/09, fondatrice : « le logo P, et "payEnCash Mode", "Technologie"… dans le style de départ » ; « je ne veux pas
     d'espace dans l'écriture payEnCash » ; « vérifie où le logo n'est pas bien repris ») LA MARQUE D'UNE APP ═══════════
     Un seul bloc pour toutes les apps : le SYMBOLE (le P et son pictogramme, fond transparent), le nom ÉCRIT —
     pay<em>En</em>Cash, d'un seul tenant, jamais passé en capitales — puis l'app en petites capitales et, sur demande, le
     slogan. `[data-pec-marque="<app>"]` le pose ; `data-slogan` sur ce même élément ajoute la ligne du slogan ;
     `data-nom` remplace le nom de l'app (« Assistance ») ; le back-office porte le P générique.
     `[data-slogan]` seul écrit le slogan. Les classes (.pec-marque…) vivent dans le socle. */
  /* (24/09, soir — glossaire de la fondatrice : le nomade est un « distributeur nomade », un commissionnaire, jamais un « coursier »)
     le NOM ÉCRIT de l'app en mode nomade devient « Nomade » ; la clé `coursier` reste celle des fichiers de logo, qui ne portent pas de mot. */
  MARQUE_NOMS: { commerce: 'Commerce', coursier: 'Nomade', partenaire: 'Partenaire',
    solution: 'Solution', pro: 'Pro', manager: 'Manager', hotline: 'Hotline', bons: 'Mes bons' },   // (23/09) l'app du porteur de bons
  /* le symbole de chaque app (fichier payencash-<symbole>-symbole.webp) ; le BACK-OFFICE — commercial, manager, hotline —
     n'a pas de dessin à lui dans les planches : il prend le P GÉNÉRIQUE (fondatrice 21/09 : « P générique ») */
  MARQUE_SYMBOLE: { commerce: 'commerce', coursier: 'coursier', partenaire: 'partenaire',
    solution: 'solution', pro: 'p', manager: 'p', hotline: 'p', bons: 'p' },
  // le dossier des logos, en adresse ABSOLUE tirée de celle de la page : un ticket ou une fenêtre tierce les suit
  logosBase: function () {
    /* (23/09) UNE PAGE PEUT VIVRE HORS DE /ui/ — la vitrine publique est dans ESPACE-COMMERCANT/marketing/, et
       le repli « ../assets/logos/ » l'envoyait chercher les logos dans un dossier qui n'existe pas. Elle pose
       alors `window.PEC_LOGOS_BASE` : une porte explicite vaut mieux qu'une devinette sur le chemin. */
    try { if (window.PEC_LOGOS_BASE) return String(window.PEC_LOGOS_BASE); } catch (e) {}
    var base = (typeof location !== 'undefined' && location.href) ? location.href : '', i = base.indexOf('/ui/');
    return (i > -1 ? base.slice(0, i) + '/ui/' : '../') + 'assets/logos/';
  },
  slogan: function () { return ((this.ref || {}).marque || {}).slogan || ''; },
  marqueHTML: function (app, o) {
    o = o || {};
    var e = this.esc.bind(this), nom = o.nom || this.MARQUE_NOMS[app] || '';
    var sy = this.MARQUE_SYMBOLE[app];
    var sym = sy ? '<img class="pec-symbole" src="' + this.logosBase() + 'payencash-' + sy + '-symbole.webp" alt="" width="30" height="30">' : '';
    return sym + '<span class="pec-marque-txt"><b>pay<em>En</em>Cash</b>' + (nom ? ' <span class="sfx">' + e(nom) + '</span>' : '')
      + (o.slogan ? '<small data-slogan>' + e(this.slogan()) + '</small>' : '') + '</span>';
  },
  /* (24/09, soir) LES CHAMPS DE CODE (autocomplete="one-time-code") prennent leur longueur au référentiel, et `[data-otp-longueur]` l'écrit */
  otpAppliquer: function (root) {
    var n = +(((this.ref || {}).otp || {}).longueur); if (!n) return; var R = root || document;
    [].forEach.call(R.querySelectorAll('input[autocomplete="one-time-code"]'), function (i) { i.maxLength = n; });
    [].forEach.call(R.querySelectorAll('[data-otp-longueur]'), function (el) { el.textContent = String(n); });
  },
  marqueAppliquer: function (root) {
    var d = this, R = root || document;
    [].forEach.call(R.querySelectorAll('[data-pec-marque]'), function (el) {
      el.classList.add('pec-marque');
      el.innerHTML = d.marqueHTML(el.getAttribute('data-pec-marque'), { slogan: el.hasAttribute('data-slogan'), nom: el.getAttribute('data-nom') || null });
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'PayEnCash ' + (el.getAttribute('data-nom') || d.MARQUE_NOMS[el.getAttribute('data-pec-marque')] || ''));
    });
    var sl = this.slogan();
    [].forEach.call(R.querySelectorAll('[data-slogan]:not([data-pec-marque])'), function (el) { el.textContent = sl; });
  },
  societeAppliquer: function (root) {
    var l = this.societeLigne();
    [].forEach.call((root || document).querySelectorAll('[data-societe-ligne]'), function (el) { el.textContent = l; });
  },
  moyenPaiement: function (k) { return this.MOYENS_PAIEMENT.filter(function (m) { return m.k === k; })[0] || null; },
  /* ══ (19/09, nuit) LES TYPES D'APPEL, DITS UNE FOIS ══════════════════════════════════════════
     Le libellé d'un appel était écrit DEUX fois — dans le pilotage de la hotline et dans l'écran du manager —
     et il y disait « Sécurisation 1ʳᵉ commande », ce qui était faux depuis que l'appel confirme aussi une
     RENCONTRE avec un distributeur mobile. Un libellé, un seul endroit, et il s'adapte à ce que l'appel
     confirme vraiment : la référence dit laquelle (RDV-… = une rencontre, le reste = une commande). */
  /* (23/09, nuit — grossiste) DEUX TYPES D'APPEL RESTENT : le rappel demandé et l'appel reçu au 0 805. La sécurisation
     d'une première commande, l'appel de bienvenue et le retour J+1 après un voyage relevaient de Mode et Fly. */
  APPEL_TYPES: {
    rappel:       { lbl: 'Rappel demandé', ton: 'rouge' },
    entrant:      { lbl: 'Appel entrant (0 805)', ton: 'neutre' }
  },
  appelTypeLbl: function (a) {
    var t = (a && a.type) || a, e = this.APPEL_TYPES[t];
    return e ? e.lbl : (t || '—');
  },
  libelleMoyen: function (k) {
    var m = this.moyenPaiement(k);
    return m ? m.lbl : (k || '—');
  },   // ZÉRO historique seedé — remboursements et annulations naissent du flux réel


  /* ── COCKPIT COMMERCIAL/MARKETING (décision 21/08) : le plan marketing en usage
        pragmatique — campagnes lancées DEPUIS l'espace (API des régies), budget en
        direct, concours en force commune (influenceurs + flyers + vidéos), GED, agenda. ── */
  /* ── (08/09 — audit commercial) MARKETING : avant, quatre campagnes avec leurs impressions, clics, installs et CPI, quatre
        influenceurs nommés, trois lots de flyers, sept fiches GED et sept lignes d'agenda étaient ÉCRITS ici — des chiffres
        inventés qu'aucune page ne pouvait faire bouger. Il ne reste que le RÉFÉRENTIEL (budget, canaux, types) ; les campagnes,
        la GED, l'agenda, les rappels, les influenceurs et le lot du concours sont des TABLES écrites depuis l'espace commercial
        (campagnesMarketingGet, gedGet, agendaGet, rappelsCommerciauxGet, influenceursGet, concoursGet). Une mesure qui n'est
        pas rapatriée par l'API de la régie se dit « non mesurée » — jamais un nombre posé pour meubler. ── */
  commercial: {
    budgetMensuel: 3000,                       // budget marketing du mois (plancher — le vivant est param('commercial.budgetMensuel'))
    /* (10/09 — lot 8, constats D-34 et D-44) UNE SEULE LISTE, CELLE DU SCHÉMA. Les canaux JS s'appelaient
       `instagram` / `snapchat` là où `ad_campaigns.channel` n'accepte que ('tiktok','meta','snap','geo') ; les
       statuts de campagne `active|en_pause|terminee` là où le CHECK dit ('draft','active','paused','ended') ; les
       types de créa `Print|Vidéo|Doc|Web` et les statuts accentués « validé »/« en ligne » là où `ged_assets`
       attend des clés sans accent. Aucune de ces écritures ne serait passée en base. La CLÉ est celle du schéma,
       le LIBELLÉ est pour l'écran — et l'écran n'invente plus la sienne. */
    canaux: [
      { k: 'tiktok', lbl: 'TikTok',            api: 'TikTok Marketing API' },
      { k: 'meta',   lbl: 'Instagram · Meta',  api: 'Meta Marketing API' },
      { k: 'snap',   lbl: 'Snapchat',          api: 'Snap Marketing API' },
      { k: 'geo',    lbl: 'Référencement IA',  api: 'GEO — pages structurées', gratuit: true }
    ],
    campagneStatuts: [
      { k: 'draft',  lbl: 'Brouillon' },
      { k: 'active', lbl: 'Active' },
      { k: 'paused', lbl: 'En pause' },
      { k: 'ended',  lbl: 'Terminée' }
    ],
    gedTypes: [
      { k: 'print', lbl: 'Print' }, { k: 'video', lbl: 'Vidéo' },
      { k: 'doc',   lbl: 'Doc' },   { k: 'web',   lbl: 'Web' }
    ],
    gedStatuts: [
      { k: 'brouillon',      lbl: 'brouillon' },
      { k: 'valide',         lbl: 'validé' },
      { k: 'imprime',        lbl: 'imprimé' },
      { k: 'en_ligne',       lbl: 'en ligne' },
      { k: 'en_distribution', lbl: 'en distribution' }
    ],
    agendaTypes: { terrain: 'Terrain', influenceur: 'Influ.', pub: 'Pub', concours: 'Concours', pilotage: 'Pilotage' },
    rappelDelaiJours: 3,                       // un rappel commercial se programme par défaut à J+3
    pitch: { d1Heures: 24, d2Heures: 48 }     // compte-rendu de visite sous 24 h, proposition sous 48 h
    // (17/09 — pivot) `ouvertureEtapes` retirée : c'était la check-list d'ouverture d'un POINT partenaire
    // (kit comptoir, formation à l'encaissement, borne installée). Il n'y a plus de point à ouvrir.
  },

  /* ── Points d'encaissement (Où payer) ── */
  /* ── PROFIL de l'utilisateur connecté (maquette — viendra du serveur) :
        Sofiane M. est LE client canonique (réf PEC-Z6DNX8HV, assistance, bus). ── */
  /* ── PROFIL PERSISTANT (28/08 — « finalité aboutie ») : la modification du
        profil (crayon du Compte, confirmée par code SMS) ÉCRIT réellement —
        l'override vit en localStorage et TOUTES les pages le lisent, car il
        est mergé dans PEC_DATA.profil au chargement (bas de ce fichier). ── */
  profil: { prenom: "Sofiane", nom: "M.", genre: "homme", dateNaissance: "1991-04-12", nomComplet: "Sofiane M.", verifie: true, email: "sofiane.m@email.fr", tel: "06 •• •• •• 78", telComplet: "0650121278" },

  /* ── VÉRIFICATION DU COMPTE (fondatrice 30/08) : le N° de téléphone (code SMS) ET
        l'e-mail (lien) doivent être validés — c'est INDISPENSABLE avant la 1ʳᵉ commande
        (le récap est bloqué sinon) et c'est là qu'arrivent les billets/PNR. Miroir des
        colonnes users.phone_verified_at / email_verified_at. État persisté, jamais en
        dur : un compte neuf démarre NON vérifié. ── */
  compteVerif: function () {
    var v = {}; try { v = JSON.parse(localStorage.getItem('pec-compte-verif') || '{}') || {}; } catch (e) { v = {}; }
    // (03/09) un compte client INSCRIT via le protocole (ou un client de démo ouvert depuis le Manager) porte ses
    // vérifications SMS / e-mail dans le référentiel clients : la porte « compte vérifié » les reconnaît. Le client
    // canonique (cl01) garde le comportement historique (démarre non vérifié — tests VC·).
    try { var c = this.clientCourant ? this.clientCourant() : null; if (c && !c.canonique && c.verif) { if (c.verif.sms && !v.sms) v.sms = 1; if (c.verif.email && !v.mail) v.mail = 1; } } catch (e2) {}
    return v;
  },
  compteVerifSet: function (canal, ok) {            // canal : 'sms' | 'mail'
    var v = this.compteVerif();
    if (ok) v[canal] = (v[canal] || Date.now()); else delete v[canal];
    try { localStorage.setItem('pec-compte-verif', JSON.stringify(v)); } catch (e) {}
    if (ok && this._compteVerifDirect) this._compteVerifDirect(canal);   // (03/09) une seule vérité : le compte
    try { window.dispatchEvent(new Event('pec-verif')); } catch (e) {}
    return v;
  },
  smsVerifie: function () { return !!this.compteVerif().sms; },
  mailVerifie: function () { return !!this.compteVerif().mail; },

  /* ── ATELIER MODE (Phase 1) : état persistant des pièces + verdicts. Le référentiel
        mode.pieces seede la clé pec-mode-pieces ; l'atelier fait avancer les statuts. ── */
  piecesGet: function () {
    var l = null;
    try { l = JSON.parse(localStorage.getItem('pec-mode-pieces') || 'null'); } catch (e) {}
    if (!l || !l.length) l = (this.mode.pieces || []).map(function (p) { return Object.assign({}, p); });
    return l;
  },

  /* ── PUBLICATION & STOCK PRO (fournisseur) : réf auto, suggestions, inventaire ── */
  // Compte ENTREPRISE fournisseur (source unique, éditions persistées).
  /* ── FOURNISSEURS : référentiel + accès (persisté) + session active ── */
  fournisseursGet: function () {
    var over = {}; try { over = JSON.parse(localStorage.getItem('pec-fournisseurs-acces') || '{}') || {}; } catch (e) {}
    var crees = []; try { crees = JSON.parse(localStorage.getItem('pec-fournisseurs-crees') || '[]') || []; } catch (e2) {}   // comptes fournisseurs VALIDÉS par le manager (protocole comptes 03/09)
    return (this.mode.fournisseurs || []).concat(crees).map(function (f) { var o = over[f.id] || {}; return Object.assign({}, f, { acces: Object.assign({}, f.acces, o.acces || {}) }); });
  },
  /* (10/09 — lot 4) LE KYB D'UN FOURNISSEUR SE DÉRIVE DU COFFRE — comme celui du partenaire, et par UNE seule fonction.
     `f.kyb` était écrit à trois endroits (référentiel, overrides d'accès, liaison du compte) et lu par les KPI, l'état de
     lancement et le rapport, pendant que la fiche et la ligne du tableau lisaient PEC_DOCS : un fournisseur activé sans une
     seule pièce était « Vérifié » dans une tuile et « Dossier incomplet » trois colonnes plus loin. La dérivation reste
     HORS du chemin chaud (fournisseursGet est appelé à chaque repeint et pour chaque lot du catalogue) : les lecteurs
     l'appellent. Un fournisseur du référentiel d'origine dont AUCUNE pièce n'est au coffre garde son KYB historique. */
  fournisseurKyb: function (nomOuId) {
    var f = typeof nomOuId === 'string' ? this.fournisseur(nomOuId) : nomOuId;
    if (!f) return { etat: 'inconnu', valide: false, source: null, libelle: 'Fournisseur inconnu' };
    var etat = null; try { etat = (window.PEC_DOCS && PEC_DOCS.etat) ? PEC_DOCS.etat('fournisseur', f.id) : null; } catch (e) {}
    if (!etat) return { etat: f.kyb || 'en_cours', valide: f.kyb === 'valide', source: 'historique', libelle: 'Dossier papier' };
    var auCoffre = false;
    try { auCoffre = PEC_DOCS.dossier('fournisseur', f.id).some(function (x) { return x.statut && x.statut !== 'manquante' && x.statut !== 'a_signer'; }); } catch (e2) {}
    var historique = !auCoffre && (this.mode.fournisseurs || []).some(function (b) { return b.id === f.id; }) && f.kyb === 'valide';
    var et = etat.etat === 'valide' ? 'valide' : (historique ? 'valide' : etat.etat);
    return { etat: et, valide: et === 'valide', source: historique ? 'historique' : 'coffre',
      libelle: historique ? 'Dossier papier validé avant le coffre — aucune pièce déposée' : etat.libelle };
  },
  fournisseur: function (nomOuId) { return this.fournisseursGet().filter(function (f) { return f.nom === nomOuId || f.id === nomOuId; })[0] || null; },
  // Gestion des accès côté Manager : inviter (génère un code), suspendre, réactiver — persisté par compte
  fournisseurAccesSet: function (id, patch, par) {
    var over = {}; try { over = JSON.parse(localStorage.getItem('pec-fournisseurs-acces') || '{}') || {}; } catch (e) {}
    this._journal('fournisseur_acces', id, { par: par, patch: patch || {} });
    over[id] = over[id] || {}; over[id].acces = Object.assign({}, over[id].acces || {}, patch || {});
    // (10/09 — lot 4) activer un accès génère toujours son code de démo, mais ne DÉCRÈTE plus le KYB valide : il se dérive du coffre
    /* (17/09) UN ATELIER INSCRIT PAR LE PROTOCOLE (compte 'cpt-…', mot de passe choisi) N'A PAS DE CODE DE DÉMO : lui en fabriquer un
       à la réactivation dérivait un second compte « vinyle.cuir » (comptesSeeds) qui masquait le vrai — l'atelier, réactivé, ne
       pouvait plus entrer avec son mot de passe (« Mot de passe incorrect »). Le code de démo ne vaut que pour le référentiel. */
    var fA0 = this.fournisseur(id) || {};
    var protocole = /^cpt-/.test(String(fA0.compteId || over[id].acces.compteId || ''));
    if (patch && patch.statut === 'actif' && !protocole && (!over[id].acces.code || over[id].acces.code === '—')) { over[id].acces.code = String(100000 + (String(fA0.nom || id).split('').reduce(function (s2, c2) { return s2 * 31 + c2.charCodeAt(0); }, 7) >>> 0) % 900000).replace(/(\d{3})(\d{3})/, '$1 $2'); }
    delete over[id].kyb;
    try { localStorage.setItem('pec-fournisseurs-acces', JSON.stringify(over)); } catch (e) {}
    /* ══ (12/09 — constat C23 du 09/09) SUSPENDRE UN ATELIER, C'EST RETIRER SES PIÈCES DE LA VENTE ═══════════
       `fournisseurEnVente` existait et n'était lue QUE par `synchroniserArticlesPublies` — elle-même jouée au
       seul BOOT. Suspendre un fournisseur ne retirait donc RIEN : sur l'onglet ouvert d'une cliente, ses pièces
       restaient commandables, la commande se réglait, le stock sortait, une facture d'achat naissait et une
       expédition `a_expedier` partait vers un espace fermé. Et les réservations déjà posées sur ses pièces
       restaient suspendues dans le vide. On rejoue la synchronisation à la bascule, et on relâche ses holds. */
    try {
      if (patch && (patch.statut === 'suspendu' || patch.statut === 'clos')) {
        var self9 = this, nom9 = (this.fournisseur(id) || {}).nom || null;
        if (nom9) {
          var refsLot = {}; this.inventaireGet().forEach(function (lot) { if (lot.fournisseur === nom9) refsLot[lot.ref] = 1; });
          var libres = {};
          this.reservationsGet().forEach(function (r) {
            var lo = self9.inventaireGet().filter(function (x) { return x.ref === r.lot || x.articleId === r.articleId; })[0];
            if (lo && lo.fournisseur === nom9) libres[r.ref] = 1;
          });
          Object.keys(libres).forEach(function (ref) { try { self9.libererReservationsDe(ref, 'atelier ' + nom9 + ' ' + (patch.statut === 'clos' ? 'résilié' : 'suspendu')); } catch (eL) {} });
          this._journal('fournisseur_hors_vente', id, { par: par, statut: patch.statut, lots: Object.keys(refsLot).length, reservations: Object.keys(libres).length });
        }
      }
      if (this.synchroniserArticlesPublies) this.synchroniserArticlesPublies();
      try { window.dispatchEvent(new Event('pec-bus')); } catch (eB9) {}
    } catch (eS9) {}
    return this.fournisseur(id);
  },
  /* ── (24/09, nuit) LES UTILISATEURS DE MES BONS, ET EUX SEULS : ceux qui se sont inscrits (pec-clients-crees, posés par
        compteCreer/_compteLierMetier). Les 30 clients Mode fabriqués au chargement sont partis avec Mode — et leur
        générateur tirait jusqu'à cinq favoris parmi des articles qui n'étaient plus que quatre : il ne finissait plus. ── */
  clientsGet: function () {
    var ov = {}; try { ov = JSON.parse(localStorage.getItem('pec-clients-statut') || '{}'); } catch (e) {}
    var crees = []; try { crees = JSON.parse(localStorage.getItem('pec-clients-crees') || '[]') || []; } catch (e2) {}   // clients inscrits et vérifiés (protocole comptes 03/09)
    return crees.map(function (c) { return ov[c.id] ? Object.assign({}, c, { statut: ov[c.id] }) : c; });
  },
  client: function (id) { return this.clientsGet().filter(function (c) { return c.id === id; })[0] || null; },
  clientStatutSet: function (id, statut, par) { var ov = {}; try { ov = JSON.parse(localStorage.getItem('pec-clients-statut') || '{}'); } catch (e) {} ov[id] = statut; try { localStorage.setItem('pec-clients-statut', JSON.stringify(ov)); } catch (e2) {} this._journal('client_statut', id, { par: par, statut: statut }); return this.client(id); },
  /* ── SESSION CLIENT RÉELLE (fondatrice 05/09 : « quand je me déconnecte, je dois avoir les
        données de PERSONNE ») : hors session, il n'y a AUCUN client actif. Avant, l'identité
        par défaut était « cl01 » (Sofiane M.) et se déconnecter vous transformait en lui :
        ses commandes, ses favoris et ses infos restaient à l'écran. ── */
  clientActifGet: function () { try { return localStorage.getItem('pec-client-actif') || null; } catch (e) { return null; } },
  clientConnecte: function () { return !!this.clientActifGet(); },
  _cleCompte: function (base) { var id = this.clientActifGet(); return id ? base + ':' + id : base; },
  _lireCompte: function (base) {
    var k = this._cleCompte(base), v = null;
    try {
      v = localStorage.getItem(k);
      if (v == null && k !== base) { var g = localStorage.getItem(base); if (g != null) { localStorage.setItem(k, g); localStorage.removeItem(base); v = g; } }   // adoption
    } catch (e) {}
    return v;
  },
  /* (24/09, nuit) LA SESSION DU PORTEUR — Mes bons est la seule app client du grossiste : plus de sac, de favoris ni de
     fidélité Mode à adopter ou à purger. Poser un compte = `pec-client-actif` ; changer de compte ou se déconnecter efface
     l'état personnel de l'appareil (vérification en cours, dernière position). Reposer la même session ne purge rien
     (piège du 18/09 : les écrans rappellent ce setter bien plus souvent qu'on ne le croit). Les bons rangés, eux, sont
     rangés SOUS le compte (pec-bons-porteur:<id>) : ils ne se mélangent pas. */
  clientActifSet: function (id) {
    var avant = this.clientActifGet(), perso = ['pec-compte-verif', 'pec-derniere-pos'];
    if (id && avant === id) return this.client(id);
    try {
      if (id) localStorage.setItem('pec-client-actif', id); else localStorage.removeItem('pec-client-actif');
      perso.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    return id ? this.client(id) : null;
  },
  clientCourant: function () { var id = this.clientActifGet(); return id ? this.client(id) : null; },
  /* ── RÉFÉRENTIELS D'EXPLOITATION (audit zéro-dur 02/09 sur fournisseur / manager) : tout ce que
        les écrans back-office recopiaient (grilles, cycles, zones, seuils, société) vit ICI — les pages lisent D.ref.*.
        Les valeurs déjà portées ailleurs restent la source : fenetreEncaissementMinutes, promosRegleJmoins,
        CGV_VERSION. ── */
  ref: {
    /* ── VÉRIFICATION D'IDENTITÉ & D'ENTREPRISE (fondatrice 05/09) : qui paie quoi, et qui
          contrôle. Le client et le commerçant partenaire ne paient RIEN ; le fournisseur paie l'examen de
          son dossier — 2,99 € s'il le fait à la création de son compte, 9,99 € s'il faut le
          débloquer EN URGENCE parce qu'une commande client attend (traitement prioritaire, pour
          ne pénaliser ni le client ni le fournisseur). Contrôle : hotline ET manager. ── */
    verification: {
      tarifs: { client: 0, partenaire: 0, fournisseur: 2.99, fournisseurUrgence: 9.99 },   // (18/09, soir) `agent: 0` est parti avec l'agent de caisse mobile
      delaiHeures: { standard: 48, urgence: 4 },
      controleurs: ['Hotline', 'Manager'],
      signature: {
        client:      { doc: 'cgu',     label: 'Conditions générales acceptées' },
        fournisseur: { doc: 'contrat', label: "Contrat-cadre d'achat ferme" },
        partenaire:  { doc: 'contrat', label: 'Contrat de distribution du Bon d’achat PayEnCash' }
      },
      source: "Grille AJEK — gratuité client/partenaire, examen fournisseur facturé, urgence prioritaire"
    },
    marges: { volSeul: 15, sejourSeul: 10, package: 8, source: "Grille AJEK — marge sur les offres Fly (la Mode = scenario.grilleMode)" },
// (09/09) retryMin (jamais lu) retiré
    /* (18/09, soir) LES ZONES DE DISPATCH SONT DEVENUES LES VILLES DU RÉSEAU. Elles servaient à répartir des
       courses entre des agents qui se déplaçaient : rayon d'affectation, plafond d'encours, barycentre. Tout cela
       est parti avec l'agent. Ce qui reste est utile et vrai : la LISTE DES VILLES où PayEnCash existe, et le
       CENTRE de chacune — le repère qui permet de placer sur la carte un commerce dont on n'a que l'adresse
       postale, et de dire au client à quelle distance il se trouve. Le centre d'un commerce reste sa propre
       géoposition quand il en a une ; celui de la ville n'est qu'un repli, et il est signalé comme tel. */
    /* ══ (19/09, soir — « récupère dans GitHub la carte, la logique de l'agent qui se déplace ») ════════════
       Reprise de `ref.dispatch` de la dernière sauvegarde d'avant le changement de modèle (9132e7d, 18/09) :
       la VITESSE qui sert à estimer l'arrivée et le RAYON à partir duquel on dit « il est là ». Ce qui n'est
       PAS repris : le rayon de dispatch et la réattribution — personne n'attribue plus une course à un agent,
       il PREND la demande que sa zone couvre. La durée de vie d'une position est une règle de minimisation
       (RGPD) : une position n'est pas un historique de déplacement. */
    rencontre: { vitesseMMin: 300, rayonArriveeM: 40, positionTtlMin: 30,
      /* ══ (23/09, décision fondatrice : « enlève le prix d'une course ; chaque membre du réseau de
         commissionnaires affiche SON prix de déplacement, nous le mettons en concurrence avec les autres —
         ça renforce le caractère indépendant du commissionnaire ») PLUS AUCUN TARIF DE RÉSEAU ═══════════
         Le frais fixe de 7,90 € est SUPPRIMÉ, et rien ne le remplace : ni plancher, ni plafond, ni tarif
         conseillé. Chaque commissionnaire affiche le sien (`fraisDeplacement` sur sa fiche, qu'il pose
         lui-même), le propose au client course par course, et le client choisit entre les propositions.
         Ce n'est pas qu'un choix commercial : la liberté tarifaire est le critère que la Cour de cassation
         a retenu contre Uber (Cass. soc., 4 mars 2020, n° 19-13.316) pour caractériser la subordination.
         Un tarif « conseillé » par nous serait lu comme un tarif imposé — il n'y en a donc aucun, nulle
         part, y compris en Configuration. Ce qui reste ici, ce sont les repères de déplacement (vitesse,
         rayon d'arrivée) et la durée de vie d'une position : aucune règle de prix. */
      tarifLibre: true,
      /* ══ (20/09, soir — décision fondatrice : « le choix d'horaire est illogique CAR LES COMMANDES SONT
         BLOQUÉES, enlève ça ») IL N'Y A PLUS D'HEURE À CHOISIR ══════════════════════════════════════
         Le matin même, l'heure était passée d'un champ libre (« ce soir 18 h ») à une liste de créneaux
         dérivée d'une amplitude de service, d'un pas, d'un délai minimum et d'un horizon de deux jours.
         La liste était juste ; la question ne l'était pas. Une commande est VERROUILLÉE le temps de la
         fenêtre d'encaissement (`scenario.fenetreEncaissementMinutes`, 120 min) : passé ce délai elle
         expire et les pièces sont relibérées. Proposer « demain 9 h 30 » à quelqu'un dont la commande
         tombe dans deux heures, c'est lui faire choisir un rendez-vous qui n'aura pas lieu.
         Le rendez-vous se tient donc DANS la fenêtre, et c'est elle qui fait foi : la demande reste
         ouverte `rencontreFenetreMin()` minutes, l'écran l'affiche et le compte à rebours la montre.
         Sont partis avec la question : `ouvertureH`, `fermetureH`, `pasMin`, `delaiMinimumMin`,
         `horizonJours`, `rencontreReglages`, `rencontreCreneaux`, `rencontreCreneauLbl`, le <select> de
         l'écran, et les colonnes `when_at` / `when_text` de `distributor_meetings`. */
      source: "vitesse et rayon d'arrivée repris de ref.dispatch (banc 18/09) — ~18 km/h en ville ; aucun tarif de déplacement au référentiel depuis le 23/09 (chaque commissionnaire fixe le sien) ; TTL de position : minimisation RGPD, une position vit 30 min et ne s'historise pas" },
    villesReseau: [
      { id: "marseille",   nom: "Marseille",        cp: ["13001","13002","13003","13004","13005","13006","13007","13008","13009","13010","13011","13012","13013","13014","13015","13016"], centre: { lat: 43.2965, lng: 5.3698 } },
      { id: "aix",         nom: "Aix-en-Provence",  cp: ["13100"], centre: { lat: 43.5297, lng: 5.4474 } },
      { id: "marignane",   nom: "Marignane",        cp: ["13700"], centre: { lat: 43.4163, lng: 5.2145 } },
      { id: "vitrolles",   nom: "Vitrolles",        cp: ["13127"], centre: { lat: 43.4603, lng: 5.2486 } },
      { id: "aubagne",     nom: "Aubagne",          cp: ["13400"], centre: { lat: 43.2928, lng: 5.5708 } },
      { id: "martigues",   nom: "Martigues",        cp: ["13500"], centre: { lat: 43.4053, lng: 5.0480 } },
      { id: "laciotat",    nom: "La Ciotat",        cp: ["13600"], centre: { lat: 43.1748, lng: 5.6045 } },
      { id: "gardanne",    nom: "Gardanne",         cp: ["13120"], centre: { lat: 43.4547, lng: 5.4690 } },
      { id: "arles",       nom: "Arles",            cp: ["13200"], centre: { lat: 43.6766, lng: 4.6278 } },
      { id: "toulon",      nom: "Toulon",           cp: ["83000"], centre: { lat: 43.1242, lng: 5.9280 } },
      { id: "nimes",       nom: "Nîmes",            cp: ["30000"], centre: { lat: 43.8367, lng: 4.3601 } },
      { id: "montpellier", nom: "Montpellier",      cp: ["34000"], centre: { lat: 43.6108, lng: 3.8767 } }
    ],
    villesReseauSource: "centres-villes relevés sur les coordonnées publiques des communes (base Adresse nationale) — repère cartographique, jamais l'adresse d'un commerce",
    fournisseursVoyage: { duffel: { nom: "Duffel", mode: "prépayé", solde: 0, seuilAlerte: 500 }, nuitee: { nom: "Nuitée", mode: "post-payé", solde: 0 } },
    /* (10/09 — lot 6, constat C15) LE CONTRÔLE PHYSIQUE ALÉATOIRE. Toute la branche existait — étiquette atelier,
       statut `bloque_controle`, verdict, notification client — mais RIEN ne l'écrivait jamais : du code mort alimenté
       par trois pièces de seed. Le taux est une donnée (une pièce vendue sur `1/tauxControle`), et le tirage est
       DÉTERMINISTE (dérivé de la réf) : un contrôle qualité doit pouvoir se rejouer et s'expliquer, pas dépendre d'un
       hasard qu'on ne sait pas reproduire. Le seuil de valeur force le contrôle des pièces chères. */
    atelier: { delaiReponseH: 24, photosMin: { neuf: 3, occasion: 4 }, coefRecote: 0.85,
      tauxControle: 0.10, seuilControleEuros: 200,
      stockMax: 99,   // (08/09) plafond de quantité par taille sur du neuf (l'occasion = pièce unique)
      exemplesModele: { 'Sneakers': 'ex. Air Max 97 Silver', 'Prêt-à-porter': 'ex. 501 Original, Robe Audrey…', 'Accessoires': 'ex. Le Pliage M, Casio F-91W' } },
    /* (18/09, soir) `visibiliteCoursesClosesH` (combien d'heures une course close restait grisée sur la liste de
       l'agent) et `preavisPieceJours` (l'assurance du véhicule qui arrive à échéance) sont partis avec l'agent de
       caisse mobile, en même temps que la liste et la flotte qu'ils réglaient. */
    /* (08/09 — audit hotline) LES DÉLAIS DE LA HOTLINE : avant, « rappel sous 15 min » vivait dans le bus, « sous 24 h » dans la
       page, « 2 h ouvrées » dans un texte jamais lu. Une seule source ; les écrans dérivent leurs échéances et leurs libellés. */
    hotline: {
      rappelDelaiMin: 15,             // un rappel demandé / une demande ouverte : l'hôte rappelle sous N minutes (échéance dueAt)
      fenetreIndicateursJours: 30,    // (24/09, soir — audit zéro dur) la fenêtre glissante des indicateurs du support : satisfaction, réclamations résolues, messages déclenchés
      slaHoteH: 2,                    // réponse de l'hôte sous N h ouvrées (au-delà : EN RETARD, la superviseure est alertée)
      slaManagerH: 48,                // résolution manager sous N h
      satisfactionSeuilReclamation: 3,// note ≤ N au questionnaire → réclamation ouverte AUTOMATIQUEMENT
      satisfactionCanal: 'Brevo (e-mail)',// (24/09, fondatrice : « courriel, e-mail ») le canal d'envoi du questionnaire post-échange
      /* (10/09 — lot 5, constat C1) L'ESCALADE A DES NIVEAUX. Une demande en retard restait en retard au même
         endroit : personne au-dessus n'était prévenu, et le client n'avait aucune sortie. Trois rungs au-dessus de
         l'hôte, chacun avec son délai — et le dernier n'est pas une politique interne, c'est un droit du client. */
      escalade: [
        { cle: 'hote',        apres: 0,             qui: 'hôte en poste',        libelle: "L'hôte en poste répond" },
        { cle: 'supervision', apres: 2,             qui: 'superviseure hotline', libelle: 'La supervision prend le relais' },
        { cle: 'manager',     apres: 48,            qui: 'manager',              libelle: 'Le manager tranche' },
        { cle: 'mediateur',   apres: 60 * 24,       qui: 'médiateur de la consommation', libelle: 'Le client peut saisir le médiateur',
          source: "réclamation écrite préalable (art. L612-2 du code de la consommation), saisine dans l'année qui suit ; gratuite (R612-1), issue sous 90 jours (R612-5), proposition non contraignante (R612-4) ; jamais un préalable obligatoire à l'action en justice (L612-4) — le délai interne de 60 jours est le nôtre" }
      ]
    },
    /* (18/09, soir) `annulationDomicile` (aucun frais dû à l'annulation, règle d'abus au-delà de trois annulations
       après acceptation) est partie avec l'agent de caisse mobile : il n'y a plus de course à annuler, donc plus
       de déplacement fait pour rien. */
    /* (18/09, soir — l'agent de caisse mobile est abandonné) LE RENDU DE MONNAIE N'EXISTE PLUS. Il n'avait de sens
       que parce qu'un agent encaissait des billets chez le client et devait rendre l'écart — en espèces, ou par
       virement le jour même. Les deux moyens d'aujourd'hui se paient au CENTIME au comptoir d'un commerce : un Bon d’achat
       PayEnCash s'émet au montant exact demandé : rien à rendre. */
    /* (17/09 — pivot) `commissionsCommercial` retirée : elle rémunérait l'apport d'un POINT partenaire (prime de
       signature du mandat B, part sur la commission du point). Le réseau de points n'existe plus ; la rémunération
       de l'apport d'un FOURNISSEUR reste à écrire avec la fondatrice. */
    /* (18/09, soir) LES RÈGLES DE CAISSE ET DE SÉCURITÉ DE L'AGENT sont parties avec lui : `fondCaisseAgent` (les
       200 € qu'il gardait sur lui), `essaisCodeMax` (les trois refus du code de sécurité avant blocage) et
       `echecEncaissementSuites` (ce qui suivait chaque motif d'échec — client absent, montant insuffisant, billet
       refusé, situation à risque). Aucun salarié ne reçoit plus d'espèces de la main d'un client. */
    /* (08/09 — audit juridique fournisseur, contrat-cadre art. « PROPRIÉTÉ ET RISQUES ») PROVENANCE PAR PIÈCE :
       le fournisseur déclare d'où vient chaque lot, joint la facture d'origine quand elle existe, et CERTIFIE
       être propriétaire. C'est la pièce qui protège AJEK contre le recel et la contrefaçon — et ce qui alimente
       le livre de police (art. 321-7 CP). `facture` = un justificatif est attendu (obligatoire sur du neuf). */
    provenances: [
      { k: 'marque',      n: "Achat auprès de la marque ou d'un grossiste", facture: true,  d: "facture d'achat au nom de votre entreprise" },
      { k: 'destockage',  n: "Déstockage / fin de série",                  facture: true,  d: "facture ou bordereau de déstockage" },
      { k: 'retour',      n: "Retour client ou invendu de votre boutique",  facture: true,  d: "facture d'achat d'origine" },
      { k: 'rachat',      n: "Rachat à un particulier",                     facture: false, d: "identité du cédant inscrite à votre livre de police" },
      { k: 'fabrication', n: "Fabrication propre",                          facture: false, d: "vous êtes le fabricant : pas de facture d'achat" }
    ],
    /* Loi Omnibus (art. L112-1-1 C. conso) : toute annonce de réduction affiche le prix le plus bas pratiqué
       dans les 30 jours qui précèdent. Le prix de référence se CALCULE sur l'historique daté du lot. */
    prixReference: { fenetreJours: 30, source: "art. L112-1-1 C. conso — prix le plus bas des 30 jours précédant la réduction" },
    // (08/09 — audit fournisseur) contratFournisseur retiré : les conditions du contrat-cadre se CALCULENT (contratConditions : grilleMode, juridique.virementJours)
    codesPromo: { validiteJours: 30, remiseDefaut: 20, maxUtilisationsDefaut: 50 },   // (08/09) défauts du formulaire fournisseur — plus en dur dans la page
    /* (fondatrice 06/09) REMISE AJEK — « je veux que le fournisseur puisse accepter ou refuser,
       étant donné que la remise porte sur le prix à eux, elle impacte indirectement ». Une
       démarque décidée par AJEK n'est donc plus appliquée d'office : elle est PROPOSÉE, et
       n'existe pour le client qu'une fois ACCEPTÉE par le fournisseur de la pièce.
       `minAchatDefaut` : montant minimum de commande auquel la remise est conditionnée
       (« le fournisseur doit être rentable ») — la proposition l'affiche, le panier l'exige. */
    // (08/09 — audit fournisseur) les canaux de notification du fournisseur — lus par le socle (14-contact-preferences), plus écrits dans le socle
    notificationsFournisseur: [
      { k: 'ventes',      lib: 'Ventes',               txt: 'une pièce vendue (achat ferme)' },
      { k: 'expeditions', lib: 'Expéditions',          txt: 'une pièce vendue à expédier via Mondial Relay' },
      { k: 'virements',   lib: 'Virements',            txt: 'une facture réglée' },
      { k: 'messages',    lib: 'Messages',             txt: "un acheteur ou l'atelier vous écrit" },
      { k: 'offres',      lib: 'Nouveautés PayEnCash', txt: 'conseils et opportunités' }
    ],
    demarque: { minAchatDefaut: 50, delaiReponseJours: 7,
      source: "Remise AJEK — proposée au fournisseur, appliquée seulement s'il l'accepte" },
    /* (fondatrice 06/09) CAMPAGNE AJEK — « si je propose 50 € de remise pour 250 € d'achat,
       comment ça se passe s'il prend plusieurs fournisseurs, certains ayant accepté et d'autres
       non ? » DEUX RÈGLES INTANGIBLES tranchent tout le reste :
         ① un fournisseur qui a REFUSÉ ne voit jamais sa facture bougée ;
         ② AJEK n'absorbe rien en silence.
       D'où la logique retenue : le SEUIL comme la REMISE ne regardent que la part ÉLIGIBLE du
       panier (les pièces des fournisseurs qui ont accepté). Atteinte, la remise est accordée
       ENTIÈRE et répartie au prorata du prix de chaque pièce éligible ; non atteinte, elle n'est
       pas accordée — jamais rabotée à un montant partiel, une promesse affichée ne se négocie
       pas à la caisse. Conséquence utile : la part supportée par une pièce ne dépasse jamais
       `valeur / seuil` de son prix (50/250 = 20 %) — c'est l'exposition MAXIMALE annoncée au
       fournisseur au moment où il accepte. */
    campagnes: { exposition: "au plus valeur ÷ seuil du prix de chaque pièce",
      source: "Campagne AJEK — seuil et remise calculés sur la part éligible du panier, répartis au prorata" },
    /* (11/09) UNE POSITION NE SE GARDE PAS. Elle sert à trier les points les plus proches MAINTENANT ; passé
       un moment, elle ne dit plus rien d'utile et ne fait que traîner. Le miroir affirmait d'ailleurs qu'elle
       « n'est jamais persistée » — elle l'était, sans échéance, et survivait même à un changement de compte :
       la cliente suivante voyait ses points triés depuis le salon de la précédente. */
    rgpd: { exportDelaiH: 48, reponseJours: 30, facturesAns: 10, chiffrement: "AES-256", positionTTLMin: 60 },
    securite: { journalConnexionsMax: 500, source: "Journal de connexion — borne locale du navigateur" },
    /* (fondatrice 06/09) CONNEXION CLIENT — chaque SMS est facturé par le routeur (Brevo pas
       encore branché) : on ne s'en sert donc QUE là où il prouve quelque chose. Un mot de passe
       pour entrer, un SMS à l'inscription (vérifier que le numéro est bien le sien) et un SMS
       à la réinitialisation. Se connecter avec Google ou Apple n'en consomme aucun. */
    connexion: {
      motDePasseMin: 10,   // (08/09) UNE règle : la même que ref.invitations (deux seuils coexistaient, 8 à la réinitialisation, 10 à la création)
      smsQuand: ['vérification du numéro à l\'inscription', 'réinitialisation du mot de passe'],
      sso: [
        { id: 'google', nom: 'Google', couleur: '#1a73e8' },
        { id: 'apple', nom: 'Apple', couleur: '#000000' }
      ],
      source: "Mot de passe pour entrer · SMS réservé à la vérification et à la réinitialisation · Google/Apple sans SMS"
    },
    /* Partage tracé (06/09) : bornes du traçage des liens fournisseur. La fenêtre de stats
       et la fenêtre d'attribution sont DÉCLARÉES ici — l'écran 06-partage les affiche telles
       quelles au lieu d'annoncer « 30 j » en dur. */
    partage: { fenetreStatsJours: 30, attributionJours: 30, journalMax: 1000, antiRebondMin: 30,
      source: "Lien tracé PayEnCash — clic compté à l'ouverture de la fiche, vente attribuée au dernier lien ouvert" },
    /* (fondatrice 06/09 : « enlève “authentifié, contrôle atelier réalisé” — si je crée une
       pièce en tant que fournisseur, elle ne PEUT pas avoir été contrôlée ; c'est la hotline
       et le service contrôle qui le disent. Et si notre contrôle a mal contrôlé, on ne prend
       pas la responsabilité — tu comprends, comme fait Vinted »).
       Quatre niveaux, du plus faible au plus fort. Une pièce ne monte d'un cran que sur une
       PREUVE : un verdict d'atelier, un certificat. Le fournisseur, lui, ne peut jamais
       revendiquer un contrôle — il DÉCRIT, c'est tout. */
    controle: {
      niveaux: [
        { cle: "declaree",    titre: "Décrite par son fournisseur",     detail: "L'état et les caractéristiques sont ceux déclarés par le vendeur professionnel.", par: "fournisseur" },
        { cle: "photos",      titre: "Photos vérifiées par PayEnCash",  detail: "Nos équipes ont validé les photos et la fiche avant publication. La pièce elle-même n'a pas été examinée.", par: "PayEnCash" },
        { cle: "controlee",   titre: "Contrôlée en atelier",            detail: "La pièce a été examinée par notre atelier : état, conformité à la description, propreté.", par: "atelier" },
        { cle: "authentifiee", titre: "Authentifiée en atelier",        detail: "Authenticité vérifiée par notre atelier, certificat à l'appui.", par: "atelier" }
      ],
      reserve: "Nos contrôles sont réalisés avec soin mais ne valent pas garantie d'authenticité : en cas d'erreur, tu es couvert par la garantie légale de conformité et le droit de rétractation, et nous reprenons la pièce.",
      source: "Politique de contrôle AJEK — à faire relire par un juriste avant emploi réel"
    },
    /* Process RÉEL Mondial Relay (vérifié 06/09 sur la doc Connect et la FAQ professionnelle).
       Ce que NOUS pilotons s'arrête au dépôt : au-delà, les étapes appartiennent au
       TRANSPORTEUR — on les lit, on ne les décide pas. Les libellés sont les siens. */
    mondialRelay: {
      validiteEtiquetteJours: 30,      // l'étiquette expire 30 jours après son émission
      depot: "Point Relais ou Locker",
      notre: [
        { cle: "a_expedier",     lbl: "En préparation",             porteur: "fournisseur" },
        { cle: "etiquette_prete", lbl: "Étiquette éditée",          porteur: "fournisseur" },
        { cle: "expedie",        lbl: "Pris en charge au Point Relais", porteur: "fournisseur" }
      ],
      transporteur: [
        { cle: "en_acheminement", lbl: "En cours d'acheminement",   porteur: "transporteur" },
        { cle: "dispo_relais",    lbl: "Disponible au Point Relais", porteur: "transporteur" },
        { cle: "livre",           lbl: "Livré",                     porteur: "transporteur" }
      ],
      source: "Mondial Relay — documentation Connect et FAQ professionnelle (étapes de suivi, validité d'étiquette)"
    },
    // Cadre contractuel (source des contrats générés par PEC_DOCS — jamais de clause inventée à la main)
    /* ══ (10/09 — lot 5 réclamations) LA POLITIQUE DE RÉCLAMATION MODE — document `politique-reclamations-fournisseur.html`.
          PayEnCash ACHÈTE FERME et REVEND EN SON NOM : face au client c'est nous le vendeur (garantie légale, rétractation),
          face au fournisseur notre recours est CONTRACTUEL. D'où la règle qui commande tout : le client est remboursé sur SA
          déclaration, le fournisseur n'est débité que sur un CONSTAT. Aucune de ces valeurs n'est écrite dans un écran.
          ⚠ Les délais et la clause de compensation sont à FAIRE VALIDER par un avocat avant emploi réel. ══ */
    reclamations: {
      fenetreJours: 14,          // pour signaler un problème après la livraison — aligné sur la rétractation (L221-18)
      garantieMois: 24,          // au-delà, la garantie légale de conformité reste ouverte par la hotline (L217-3 s.)
      sansRetourSous: 15,        // en dessous de ce prix client, on rembourse SANS demander le retour (l'étiquette coûte plus que la pièce)
      premierRetourOffert: true, // le 1er retour d'une commande est offert, quel que soit le motif — argument commercial assumé
      depotRetourJours: 14,      // le client a ce délai pour déposer son colis retour en relais
      forfaitTraitement: 5,      // € débités au fournisseur par dossier DÉFINITIF (contrôle, photos, gestion) — forfaitaire et modeste
      contestationJours: 15,     // le fournisseur conteste un constat sous ce délai — même délai que le refus atelier
      trancheur: 'manager',      // un constat contesté se tranche par le MANAGER, jamais par l'atelier qui l'a fait
      echangeV1: false,          // pas d'échange en v1 : sur des pièces uniques, on rembourse en avoir et le client rechoisit
      taux: { fenetreJours: 90, ventesMin: 20, alerte: 0.03, retenue: 0.06, blocage: 0.10, ponderationContrefacon: 5 },
      retenue: { fraction: 0.10, joursLiberation: 60 },
      abusClient: { fenetreJours: 180, seuil: 3 },
      /* LES ONZE CAS. `frais` : qui paie le retour · `impute` : le fournisseur est-il débité · `taux` : ça compte-t-il à son
         taux de défaut · `photos` : preuve exigée du client · `retour` : la pièce doit-elle revenir. */
      motifs: [
        { id: 'non_recu',            label: "Je n'ai jamais reçu le colis",                type: 'livraison', frais: 'aucun',     impute: 'si_non_depose', taux: true,  photos: false, retour: false, ponderation: 1, aide: "On vérifie le suivi du transporteur avant tout." },
        { id: 'manquant',            label: "Le colis est vide, ou une pièce manque",      type: 'livraison', frais: 'aucun',     impute: true,            taux: true,  photos: true,  retour: false, ponderation: 1, aide: "Photographie le colis ouvert, tel que tu l'as reçu." },
        { id: 'transport',           label: "La pièce est abîmée par le transport",        type: 'transport', frais: 'payencash', impute: false,           taux: false, photos: true,  retour: true,  ponderation: 1, aide: "Photographie le colis ET la pièce : le recours est chez le transporteur." },
        { id: 'non_conforme',        label: "La pièce ne correspond pas à la fiche",       type: 'defaut',    frais: 'payencash', impute: true,            taux: true,  photos: true,  retour: true,  ponderation: 1, aide: "Taille, couleur, matière, défaut non déclaré, mauvaise pièce." },
        { id: 'contrefacon',         label: "Je pense que c'est une contrefaçon",          type: 'fraude',    frais: 'payencash', impute: true,            taux: true,  photos: true,  retour: true,  ponderation: 5, aide: "Photographie les étiquettes, les coutures et la semelle ou la doublure." },
        { id: 'vice',                label: "Un défaut est apparu à l'usage",              type: 'defaut',    frais: 'payencash', impute: 'si_moins_12m',  taux: true,  photos: true,  retour: true,  ponderation: 1, aide: "Garantie légale de conformité — jusqu'à 2 ans après l'achat." },
        { id: 'taille',              label: "La taille ne me va pas",                      type: 'avis',      frais: 'client',    impute: false,           taux: false, photos: false, retour: true,  ponderation: 1, aide: null },
        { id: 'avis',                label: "J'ai changé d'avis",                          type: 'avis',      frais: 'client',    impute: false,           taux: false, photos: false, retour: true,  ponderation: 1, aide: "Droit de rétractation — 14 jours après la livraison." },
        /* Les trois derniers ne se choisissent pas par le client : ils naissent du DÉROULÉ (délai dépassé, constat au retour,
           étiquette jamais éditée). Ils vivent au référentiel pour que leur règle soit dite au même endroit que les autres. */
        { id: 'retour_absent',       label: "Retour annoncé, jamais renvoyé",              type: 'systeme',   frais: 'aucun',     impute: false,           taux: false, photos: false, retour: false, ponderation: 1, interne: true },
        { id: 'retour_non_conforme', label: "Retour reçu vide, ou autre pièce",            type: 'systeme',   frais: 'client',    impute: false,           taux: false, photos: true,  retour: false, ponderation: 1, interne: true },
        { id: 'retard',              label: "Le fournisseur n'a pas expédié dans le délai", type: 'systeme',  frais: 'aucun',     impute: true,            taux: true,  photos: false, retour: false, ponderation: 1, interne: true }
      ],
      /* Ce que l'atelier peut conclure en ouvrant le colis retour. Le constat, et lui seul, rend le débit DÉFINITIF. */
      constats: [
        { id: 'conforme',    label: "Conforme à la fiche — le client se trompait", impute: false },
        { id: 'non_conforme', label: "Non conforme à la fiche",                    impute: true  },
        { id: 'transport',   label: "Endommagée pendant le transport",             impute: false },
        { id: 'contrefacon', label: "Contrefaçon",                                 impute: true  },
        { id: 'vide',        label: "Colis vide ou pièce substituée",              impute: false }
      ],
      source: "Politique de réclamation PayEnCash — benchmark Vinted / Temu / Amazon, arbitrages fondatrice du 10/09"
    },
    juridique: {
      droitApplicable: "droit français",
      preavisAmiableJours: 30,
      preavisResiliationMois: 1,
      virementJours: 7, contestationJours: 15,   // (08/09) délai de contestation d'un refus atelier (et de réponse de l'acheteur) — lu par 12 et le contrat généré   // (08/09) règlement du fournisseur par virement sous N jours après contrôle — UNE source (contrat généré, fiche, factures)
      essaiMois: 2,
      /* (24/09 — relecture juridique sourcée, Légifrance/BOFiP/ACPR/CNIL) PAYENCASH N'EST PAS ASSUJETTIE À LA LCB-FT : l'art. L561-2
         du CMF (version du 05/08/2026) ne cite pas les distributeurs exemptés au titre de L521-3, et la position ACPR 2022-P-01 (§ 2.1)
         le confirme. Les durées ci-dessous sont celles du droit commun et de la CNIL — plus « 5 ans (L561-12) », qui ne nous concerne
         pas — et les vérifications d'identité relèvent de notre POLITIQUE DE PRÉVENTION DE LA FRAUDE (intérêt légitime), jamais d'une
         obligation légale de PayEnCash. Chaque écran et chaque contrat lisent ici. */
      lcbft: "PayEnCash n'est pas assujettie à la lutte contre le blanchiment (art. L561-2 CMF, version du 05/08/2026 ; position ACPR 2022-P-01 § 2.1) : ses vérifications relèvent de sa politique de prévention de la fraude",
      conservation: { dossierVerification: "durée de la relation, puis 5 ans (prescription entre commerçants, art. L110-4 du code de commerce)", pieceIdentite: "copie conservée 6 ans au plus, filigranée (référentiel CNIL)", video: "regardée par une personne habilitée, puis supprimée — aucune comparaison automatique", facture: "10 ans (art. L123-22 du code de commerce)", mandatSepa: "13 mois après le dernier prélèvement (art. L133-24 CMF)", compteInactif: "supprimé après 2 ans sans connexion (CNIL)", journal: "durée de la relation, puis 5 ans (art. L110-4 du code de commerce)" },
      baseLegale: { contrat: "exécution du contrat (art. 6.1.b RGPD)", interetLegitime: "prévention de la fraude et sécurité de la relation (art. 6.1.f RGPD)", obligation: "obligation légale comptable et fiscale (art. 6.1.c RGPD)" },
      mediationConso: "le médiateur de la consommation désigné après adhésion (CM2C pressenti) — coordonnées dans les CGU de l'app Mes bons ; jamais un préalable obligatoire à l'action en justice (art. L612-4 du code de la consommation)",
      facturation: { autofacturation: "art. 289 I-2 du CGI et 242 nonies A de l'annexe II — mention « Autofacturation », mandat écrit, acceptation par le fournisseur (tacite au terme du délai de contestation)", plateforme: "Odoo, plateforme agréée (immatriculée le 15/04/2026)", receptionDepuis: "2026-09-01", emissionPme: "2027-09-01" },
      tva: { regle: "art. 256 ter du CGI (CIBS L211-128 à L211-131 au 1/1/2027) — bon à usage unique si, à l'émission, tous les produits sont au même taux et taxables en France ; sinon bon à usages multiples : transferts hors champ, TVA due par la marque à l'utilisation, marge de distribution facturée à 20 %", bum: "BOI-TVA-CHAMP-10-10-40-50 § 80 ; BOI-TVA-BASE-20-40 § 297" },
      prudhommes: "le conseil de prud'hommes du lieu d'exécution du contrat (art. R1412-1 du code du travail)",
      assuranceRcPro: "responsabilité civile professionnelle en cours de validité",
      source: "Cadre juridique AJEK — à faire relire par un avocat avant emploi réel"
    },
    /* (07/09 — audit juridique fournisseur) LES DOCUMENTS QUE LE FOURNISSEUR ACCEPTE, versionnés : la version acceptée
       est enregistrée avec l'horodatage (miroir table `consents` : scope, subject_ref, document, cgv_version) ; une
       nouvelle version impose une ré-acceptation à la connexion (CGU art. 8.1). */
    documents: {
      fournisseur: [
        { cle: 'cgu-fournisseur',              titre: "CGU de l'espace fournisseur",            version: '2026-09-07', url: '../../documents/cgu-espace-fournisseur.html' },
        { cle: 'confidentialite-fournisseur',  titre: 'Politique de confidentialité fournisseur', version: '2026-09-07', url: '../../documents/politique-confidentialite-fournisseur.html' },
        { cle: 'charte-terminologie',          titre: 'Charte de terminologie (annexe au contrat)', version: '2026-09-07', url: '../../documents/charte-terminologie-fournisseur.html' }
      ],
      /* (18/09) LES DOCUMENTS QUE LE COMMERÇANT PARTENAIRE ACCEPTE à l'inscription (versionnés, miroir `consents`) ;
         le contrat de distribution, lui, se SIGNE (modèle `contrat_partenaire` du coffre). */
      /* (24/09, soir) LA RELECTURE JURIDIQUE DU 24/09 A TOUCHÉ LES TEXTES (commissionnaire, TVA des bons, prévention de la fraude,
         médiateur, bon refusé, autofacturation) : chaque texte relu porte la version du jour, et l'espace redemande l'acceptation. */
      partenaire: [
        { cle: 'cgu-partenaire',   titre: "CGU de l'espace partenaire",                       version: '2026-09-24', url: '../../documents/cgu-espace-partenaire.html' },
        /* (23/09, nuit) le commerce vend des bons de MARQUE : l'annexe 1 de son contrat, ce sont leurs conditions — plus celles
           du Bon d'achat PayEnCash, retiré avec Mode et Fly (le fichier n'existe plus : la vitrine et Mon point pointaient dans le vide). */
        { cle: 'conditions-bons',  titre: 'Conditions des bons de marque (annexe 1 au contrat de distribution)', version: '2026-09-24', url: '../../documents/conditions-bons-de-marque.html' },
        /* (24/09, fondatrice : « rédiger une politique dédiée — protège AJEK ») la politique de confidentialité des commerces et des nomades (RGPD art. 13/14) */
        /* (24/09, nuit) nature 'information' : une politique de confidentialité se LIT (RGPD art. 13/14) — elle ne s'accepte pas ;
           « accepter » la ferait passer pour un consentement (art. 6.1.a), qui n'est la base d'aucun de ces traitements. La lecture
           jusqu'au bout reste exigée et tracée, comme voulu le 23/09 (« consultés… sinon pas de possibilité de travailler avec nous »). */
        { cle: 'confidentialite-partenaire', titre: 'Politique de confidentialité — commerces et distributeurs nomades', version: '2026-09-24', url: '../../documents/politique-confidentialite-partenaire.html', nature: 'information' }
      ],
      /* ══ (23/09) LES DOCUMENTS QUE LA MARQUE ACCEPTE — versionnés, miroir `consents` ═══════════════════════
         Une acceptation = un document, une VERSION, un horodatage. Quand une version change, l'espace redemande
         l'acceptation : un consentement donné sur un texte qui a bougé n'est plus un consentement. */
      /* (23/09, fondatrice : « pour chaque document, ils doivent être consultés, et reconnaissance "lu et accepté",
         sinon pas de possibilité de travailler avec nous ; revérifie l'ensemble des documents échangés avec les
         marques ») LA LISTE COMPLÈTE, dans l'ordre où on les lit : les CGU (l'espace), les conditions des bons
         (l'objet vendu), les conditions du logiciel (ce qui est facturé), la charte de communication (ce que la
         marque a le droit de dire de nous — le cadre ACPR se joue aussi dans SA communication), la confidentialité.
         Le contrat-cadre, lui, se SIGNE (modèle `contrat_marchand` du coffre) ; la déclaration « réseau limité »
         se dépose et se statue (techConformite). */
      marchand: [
        { cle: 'cgu-solution',        titre: "CGU de l'espace PayEnCash Solution",                 version: '2026-09-24', url: '../../documents/cgu-espace-solution.html' },
        { cle: 'conditions-bons',     titre: 'Conditions des bons de marque (annexe 1 au contrat)',   version: '2026-09-24', url: '../../documents/conditions-bons-de-marque.html' },
        { cle: 'conditions-logiciel', titre: 'Conditions générales de vente du logiciel d’édition (annexe 2)', version: '2026-09-24', url: '../../documents/conditions-logiciel-solution.html' },
        { cle: 'charte-communication', titre: 'Charte de communication (annexe 3)',                  version: '2026-09-23', url: '../../documents/charte-communication-solution.html' },
        { cle: 'confidentialite',     titre: 'Politique de confidentialité',                       version: '2026-09-24', url: '../../documents/politique-confidentialite-solution.html', nature: 'information' }
      ],
      /* (23/09, fondatrice : « CGV, CGU : pareil pour le bon côté app utilisateur ») LES DOCUMENTS DU PORTEUR DE BONS :
         consultés puis reconnus « lu et accepté » avant de ranger un premier bon — la même mécanique que les marques. */
      bons: [
        { cle: 'cgu-mes-bons',    titre: "Conditions d'utilisation de l'app Mes bons",  version: '2026-09-24', url: '../../documents/cgu-mes-bons.html' },
        /* (23/09, soir — fondatrice : « pour l'app Mes bons, ce sont les bons des marques ») les conditions des bons de MARQUE */
        { cle: 'conditions-bons', titre: 'Conditions des bons d’achat de marque',       version: '2026-09-24', url: '../../documents/conditions-bons-de-marque.html' },
        { cle: 'confidentialite', titre: 'Politique de confidentialité',                version: '2026-09-24', url: '../../documents/politique-confidentialite-solution.html', nature: 'information' }
      ],
      /* (08/09) les ANNEXES que le contrat-cadre engage : elles se lisent (12-contrat-cadre), elles ne se cochent pas — la signature du contrat les couvre */
      annexesFournisseur: [
        { cle: 'annexe-normes-publication',    titre: 'Annexe 1 — Normes de publication',         version: '2026-09-07', url: '../../documents/annexe-1-normes-publication.html' },
        { cle: 'annexe-grille-prix',           titre: 'Annexe 2 — Grille de prix',                version: '2026-09-07', url: '../../documents/annexe-2-grille-prix.html' }
      ]
    },
    invitations: { validiteH: 72, motDePasseMin: 10 },
    otp: { validiteMin: 10, longueur: 6, source: "codes SMS / e-mail : validité annoncée au client" },
    kyc: { paliers: { achats: 3, cumulEuros: 1000, fenetreJours: 7 }, prestataire: "PVID (vérification d'identité à distance)",
      /* (24/09, fondatrice : « paliers réglables ») LES PALIERS DE L'UTILISATEUR MES BONS : au-delà de ces cumuls sur la fenêtre des
         plafonds (ref.bons.fenetrePlafondJours), la pièce d'identité est demandée. Réglés depuis manager/10 (kyc.porteur.*). */
      porteur: { especesEur: 250, carteEur: 500 },
      /* (24/09, soir) pourquoi le lieu de naissance du dirigeant est demandé — dit à l'écran, sous le champ */
      lieuNaissanceMotif: "Avec le nom et la date de naissance, il distingue deux homonymes : notre politique de prévention de la fraude le demande.",
      /* (24/09, fondatrice : « le dirigeant, quel type de document, et si recto-verso ; le genre du dirigeant ») LES PIÈCES
         D'IDENTITÉ ACCEPTÉES, officielles, en cours de validité, avec photographie — chacune dit ses faces : la carte et le
         titre de séjour se photographient des deux côtés, le passeport à sa page d'identité. La civilité et l'âge minimal
         d'un représentant légal sont des données, pas des mots écrits dans un écran. */
      piecesIdentite: [
        { id: 'cni', lbl: 'Carte nationale d’identité', faces: [{ id: 'recto', lbl: 'Recto' }, { id: 'verso', lbl: 'Verso' }] },
        { id: 'passeport', lbl: 'Passeport', faces: [{ id: 'recto', lbl: 'Page d’identité (avec la photo)' }] },
        { id: 'titre_sejour', lbl: 'Titre de séjour', faces: [{ id: 'recto', lbl: 'Recto' }, { id: 'verso', lbl: 'Verso' }] },
        /* (24/09, fondatrice : « permis de conduire accepté s'il est français ») */
        { id: 'permis', lbl: 'Permis de conduire français', faces: [{ id: 'recto', lbl: 'Recto' }, { id: 'verso', lbl: 'Verso' }], france: true }
      ],
      civilites: ['Madame', 'Monsieur'],
      ageMin: 18,
      /* (24/09, fondatrice : « déclarer les bénéficiaires effectifs — oui, marques et partenaires ») LES BÉNÉFICIAIRES EFFECTIFS —
         la définition est celle de l'art. R561-1 du code monétaire et financier (lu le 24/09/2026) : la ou les personnes physiques
         qui détiennent, directement ou indirectement, plus de 25 % du capital ou des droits de vote, ou qui exercent un contrôle
         par d'autres moyens ; à défaut, le représentant légal. PayEnCash n'est pas assujettie à la LCB-FT (art. L561-2 CMF) : la
         déclaration relève de sa politique de prévention de la fraude, pas d'une obligation légale — et l'écran le dit ainsi. */
      beneficiaires: { seuilPct: 25, source: 'art. R561-1 du code monétaire et financier — plus de 25 % du capital ou des droits de vote, ou un contrôle par d’autres moyens ; à défaut, le représentant légal',
        motif: 'Savoir qui est derrière une société que nous payons : notre politique de prévention de la fraude, pas une obligation légale de PayEnCash.' } },
    /* (18/09, soir) TOUT CE QUI TENAIT L'EMPLOI DE L'AGENT EST PARTI AVEC LUI : `paie` (taux salarial et patronal,
       nombre de bulletins affichés), `fondCaisseManager` (les 4 000 € de pièces propres que le manager avançait aux
       agents), `service` (la durée maximale d'un service avant clôture d'office), `travail` (les durées maximales du
       code du travail, citées par le contrat de travail), `priseDePoste` (la check-list de début de service : fond
       recompté, casque, véhicule, attestation d'assurance, sacoche de dépôt) et `frais` (les barèmes de notes de
       frais — carburant, stationnement, repas, transport). PayEnCash n'emploie plus de salarié encaisseur. */
    societe: { nom: "AJEK", forme: "SAS", creeeLe: "2026-07-07", siege: "16 route de la Plage, 13700 Marignane", presidente: "Emilie Ruiz", siren: "107 398 448", rcs: "Aix-en-Provence 107 398 448", tvaIntra: "FR59107398448", capital: "1 000 €", note: "forme SAS/SASU à confirmer (18 dit SAS, À propos disait SASU)" },
    businessPlan: { pointMortCmdMois: 204, moisObjectif: 3 },   // (18/09, soir) `encaissementsJourAgent` est parti avec l'agent de caisse mobile
    invendus: { seuilJours: 30, paliers: [15, 30] },
    /* (21/09, fondatrice : « maintenant les slogans unifiés sur toutes les apps : Vos bons d’achat, notre réseau ») LE SLOGAN, UNE FOIS : chaque app l'écrit depuis ici ([data-slogan], marqueHTML). */
    /* (23/09, fondatrice : « enlève "Vos bons d’achat, notre réseau", de partout » puis « crée un slogan :
       vos bons, notre réseau — pour le cadre ACPR ») LE SLOGAN NE PROMET AUCUN MOYEN DE PAIEMENT : il dit ce que nous
       sommes — un réseau qui vend des bons d'achat. Une seule source : les six apps, le widget et les documents
       lisent `slogan()`. */
    marque: { slogan: "Vos bons d’achat, notre réseau" },
    reseaux: { instagram: "https://instagram.com/payencash", tiktok: "https://tiktok.com/@payencash", snapchat: "https://snapchat.com/add/payencash", whatsapp: "https://whatsapp.com/channel/payencash" },
    /* ══ (18/09) LE BON D’ACHAT PAYENCASH — décisions fondatrice du 18/09 + textes lus sur Légifrance le même jour ═══════════
       Vendu en espèces chez un commerçant partenaire (ou émis par le manager : carte cadeau), utilisable sur Mode et Fly
       en une ou plusieurs fois. Ces valeurs sont les DÉFAUTS ; le manager les ajuste dans Configuration (bons d’achat.*). ══ */
    bons: {
      nom: 'Bon d’achat PayEnCash',
      /* (23/09, fondatrice : « nos règles d'encaissement : 1 000 € max par jour et 3 000 € le mois ») — le plafond du
         MOIS valait 1 000, c'est-à-dire celui du jour : une règle mensuelle qui ne pouvait jamais jouer. */
      minimum: 5, plafondBon: 250, plafondClientJour: 1000, plafondClientMois: 3000, fenetrePlafondJours: 30, validiteMois: 12,
      commissionPct: 1.10, tvaCommissionPct: 20, annulationMinutes: 30,
      prefixeTicket: 'BV-',
      /* (18/09, soir) LE PRESTATAIRE QUI PRÉLÈVE LE COMMERÇANT. (21/09 — décisions fondatrice « je vais retenir Stripe
         Connect », « supprime Stancer de notre modèle désormais ») STRIPE, pour les deux lignes : Mode (la carte du
         partenaire est débitée sur notre compte) et Solution (la marque a son compte connecté, la vente est encaissée
         directement chez elle, notre commission prélevée à la source). Tarif standard relevé le 18/09 sur stripe.com/fr/pricing :
         1,5 % + 0,25 € par transaction carte EEE. La carte se saisit dans le composant Stripe du navigateur (SetupIntent,
         authentification forte une fois) : le serveur ne connaît que l'empreinte `pm_…`. `simulation: true` tant que la
         clé du mode n'est pas posée côté serveur (lib/stripe.js) : rien n'est débité, et l'écran le dit. */
      psp: { nom: 'Stripe', simulation: true, commissionVariablePct: 1.5, commissionFixe: 0.25,
        tarifs: 'https://stripe.com/fr/pricing', api: 'https://docs.stripe.com/api',
        source: "stripe.com — tarif standard et documentation relevés le 18/09 et le 21/09/2026 (1,5 % + 0,25 €, carte EEE ; SetupIntent off_session, PaymentIntent off_session+confirm, Connect direct charges + application_fee_amount)",
        aConfirmer: "l'activité « cartes cadeaux » (catégorie soumise à conditions chez Stripe) et le délai de versement aux marques — à confirmer par écrit auprès de Stripe avant le passage en réel" },
      mentions: [
        "Bon d'achat prépayé, utilisable uniquement sur payencash.fr (Mode et Fly), en une ou plusieurs fois, jusqu'à épuisement du solde.",
        'Valable 12 mois à compter de la date d\'émission ; passé ce délai, le solde restant est perdu.',
        "Ni échangeable, ni remboursable en espèces, ne donne lieu à aucun rendu de monnaie ; en cas de remboursement d'une commande, le montant est re-crédité sur le bon d’achat.",
        "Le code du ticket vaut titre : conservez-le, il ne sera pas remplacé en cas de perte ou de vol.",
        'Ce qu\'il reste sur le bon se consulte dans l\'app Mes bons, ou dans le compte client après la première utilisation.'   // (23/09) l'app du porteur
      ],
      fondement: {
        exemption: "art. L521-3 I 1° CMF — moyen de paiement accepté uniquement « dans les locaux de cette entreprise » (la boutique en ligne d'AJEK) : hors agrément d'établissement de paiement",
        declarationAcpr: "art. L521-3 II CMF — déclaration à l'ACPR dès que la valeur des opérations des 12 derniers mois dépasse 1 000 000 € ; silence = approbation ; actualisation annuelle",
        horsMonnaieElectronique: "art. L315-1 CMF — la monnaie électronique est « acceptée par une personne autre que l'émetteur » : un bon d’achat accepté par AJEK seule n'en est pas (le pendant e-monnaie : art. L525-5 et L525-6)",
        tva: 'art. 256 ter CGI — bon à usage unique si, à l’émission, tous les produits de la marque sont au même taux et taxables en France (chaque transfert est alors taxable) ; sinon bon à usages multiples : transferts hors champ, TVA due par la marque à l’utilisation, marge de distribution facturée à 20 % (BOI-TVA-CHAMP-10-10-40-50 § 80)',
        /* (18/09, soir) LE COMPTOIR N'EST PAS NOTRE RÈGLE. Le client règle son bon d’achat au commerçant par les moyens
           que CE commerçant accepte ; s'il paie en billets, l'art. L112-6 CMF s'applique à ce commerçant, et nos
           montants restent très en dessous de son plafond. Ce qui nous engage, ce sont NOS plafonds — ils se lisent
           dans `bonsRef()` (plafondBon, plafondClientJour, plafondClientMois sur fenetrePlafondJours), jamais ici. */
        comptoir: "art. L112-6 CMF — le règlement du bon d’achat au comptoir relève du commerce du réseau et des moyens qu'il accepte ; en billets, nos montants restent très en dessous du plafond légal. Nos propres plafonds sont ceux de bonsRef().",
        /* (18/09, soir — question fondatrice « vérifie les règles pour les cartes cadeaux, plafond mensuel, loi »)
           LU SUR LÉGIFRANCE LE 18/09 : l'art. R561-16-1 CMF (en vigueur depuis le 25/12/2024, décret 2024-1205)
           dispense de vigilance LCB-FT la MONNAIE ÉLECTRONIQUE à faible risque, sous cinq conditions dont
           « la valeur monétaire maximale stockée n'excède pas 150 euros et, dans l'hypothèse où le support peut
           être rechargé, la valeur monétaire est assortie d'une limite maximale de stockage et de paiement de
           150 euros par période de trente jours » — c'est LE plafond mensuel dont parlent les guides. Le même
           article ajoute que « les opérations de paiement initiées via internet […] dont le montant est supérieur
           à 50 euros par transaction demeurent soumises aux obligations de vigilance ».
           CE TEXTE NE NOUS EST PAS DIRECTEMENT APPLICABLE : le Bon d’achat PayEnCash n'est pas de la monnaie électronique
           (art. L315-1 CMF, il n'est accepté que par son émetteur), et il n'est pas rechargeable — il se débite.
           Deux choses sont pourtant à en retenir, et elles sont appliquées ici :
             ① le 3° a) admet EXPRESSÉMENT le chargement en espèces « dans un réseau limité de personnes » : la vente
                de nos bons d’achat au comptoir est exactement ce cas de figure, y compris lorsque le client paie en
                billets — c'est pour cela qu'il n'a besoin d'aucune carte ;
             ② nos plafonds sont très au-dessus de ce que le régulateur tolère SANS IDENTIFICATION. Ce qui nous en
                sépare, c'est que notre bon d’achat n'est jamais anonyme À L'USAGE : il se rattache au compte du client dès
                sa première utilisation, et ce compte est vérifié (SMS + e-mail), avec la vérification d'identité
                renforcée (PVID) au-delà des paliers de `ref.kyc`. Le plafond de 30 jours ci-dessus n'est donc pas
                un mur : au-delà, c'est la vérification d'identité qui est exigée.
           À VALIDER PAR L'AVOCAT : le niveau exact de ces plafonds et le moment où la vérification d'identité doit
           être exigée pour un titre à usage limité non rechargeable. */
        lcbft: "art. R561-16-1 CMF (décret 2024-1205 du 23/12/2024) — seuils de FAIBLE RISQUE de la monnaie électronique : 150 € stockés, 150 € par période de 30 jours si le support est rechargeable, vigilance au-delà de 50 € par paiement à distance ; le chargement en ESPÈCES y est admis « dans un réseau limité de personnes » (3° a), ce qui couvre le client qui paie son bon d’achat en billets au comptoir. Le Bon d’achat PayEnCash n'est pas de la monnaie électronique (L315-1) et n'est pas rechargeable : ces seuils ne s'appliquent pas, mais ils donnent la mesure — d'où nos plafonds et le rattachement du bon d’achat au compte vérifié dès son premier usage.",
        avertissement: 'Le guide « conformité cartes cadeaux » (source commerciale) a été recoupé avec les textes primaires ; la qualification du contrat de distribution et la déclaration ACPR restent à valider par un avocat.'
      },
      source: 'Décisions fondatrice 18/09/2026 (« les deux coexistent · code généré, ticket imprimé · 250 € par bon d’achat, 1,10 % » ; le soir : « le partenaire paie automatiquement par carte à chaque vente, moins sa marge » — prestataire Stancer) + Légifrance L521-3 / L315-1 / L525-5 / L525-6 + BOFiP 256 ter'
    },
    /* LE PAYS D'OUVERTURE — lu par paysClient() : il décide des moyens proposés. À ne pas confondre avec
       `lancement` (racine), qui séquence l'ouverture des lignes Fly et Mode. */
    lancement: { pays: 'FR', source: "Ouverture France — décision fondatrice du 17/09" },

    /* ══ PAYENCASH SOLUTION (19/09, nuit — cahier des charges « API de mise en relation pour réseaux
       limités de bons d'achat ») ═════════════════════════════════════════════════════════════
       Les taux vivent ICI et se règlent depuis Configuration : « jamais codés en dur, pour pouvoir les faire
       évoluer sans invalider les contrats déjà exécutés » (§9). Un événement de commission fige le sien. */
    /* (24/09, fondatrice : « utilise le vocabulaire adapté, la terminologie qu'on doit employer exclusivement pour les parties
       prenantes ») LE GLOSSAIRE UNIQUE. Le même acteur portait cinq noms d'un écran à l'autre (distributeur nomade, distributeur
       mobile, mandataire nomade, commissionnaire, agent) et l'utilisateur trois (porteur, utilisateur, client final). Chaque
       partie prenante a désormais UN nom par public : `nom` dans les apps professionnelles, `client` face à l'utilisateur de
       Mes bons, `juridique` dans les contrats. Un écran lit ce glossaire (terme()) ; il n'écrit jamais son propre mot. */
    parties: {
      grossiste:   { nom: 'PayEnCash Solution', juridique: 'le Grossiste' },
      marque:      { nom: 'marque', pluriel: 'marques', client: 'marque', juridique: 'la Marque, émettrice des bons' },
      commerce:    { nom: 'commerce du réseau', court: 'commerce', pluriel: 'commerces du réseau', client: 'point de vente', clientPluriel: 'points de vente', juridique: 'le Distributeur sédentaire, revendeur pour son propre compte' },
      nomade:      { nom: 'distributeur nomade', court: 'distributeur', pluriel: 'distributeurs nomades', client: 'distributeur nomade', clientPluriel: 'distributeurs nomades', juridique: 'le Distributeur nomade, commissionnaire (art. L132-1 du code de commerce)' },
      utilisateur: { nom: 'utilisateur', pluriel: 'utilisateurs', client: 'toi', juridique: 'le Porteur du bon' }
    },
    tech: {
      nom: 'PayEnCash Solution',
      /* (24/09, fondatrice : « l'étape déclaration, ça doit être une case à cocher pour la déclaration réseau ») LA DÉCLARATION
         « RÉSEAU LIMITÉ » EST UN TEXTE TYPE, plus une rédaction libre : la marque le lit, rempli de SES données, et le coche.
         Un texte tapé à la main pouvait dire n'importe quoi — et c'est lui qui tient l'exclusion (art. L521-3 I 1° du CMF).
         {marque} et {site} viennent de sa fiche ; sans site, les bons ne valent que dans ses propres points de vente. */
      declaration: {
        avecSite: 'Les bons d’achat émis par {marque} ne sont acceptés qu’en paiement des produits et services que {marque} vend sur son site {site}, à l’exclusion de tout autre site, de toute autre enseigne et de tout autre commerçant.',
        sansSite: 'Les bons d’achat émis par {marque} ne sont acceptés qu’en paiement des produits et services que {marque} vend elle-même, dans ses propres points de vente, à l’exclusion de toute autre enseigne et de tout autre commerçant.'
      },   // (21/09, fondatrice : « à la place du nom PayEnCash Technologie, renomme en PayEnCash Solution »)
      dureeContratMois: 12,          // §3 — contrat de distribution à usage unique, non reconductible
      tvaPct: 20,                    // le logiciel est un service soumis à TVA (les bons, eux, relèvent de l'art. 256 ter CGI)
      cleLongueur: 32,
      prefixeBon: 'TB-',          // le code d'un bon de commerçant : TB-XXXX-XXXX-XXXX
      lienValiditeJours: 30,      // (20/09) un bon proposé à un client périme : au-delà, il ne vaut plus rien
      annulationMinutes: 30,      // une vente s'annule au comptoir dans ce délai si le bon n'a pas servi — comme le Bon d’achat PayEnCash
      /* ══ (22/09 — décisions fondatrice) L'ARGENT DE LA SECONDE LIGNE : NOUS SOMMES GROSSISTE ═══════════════════
         Le montage « place de marché » du 21/09 (comptes connectés, carte du point clonée chez la marque, commission
         prélevée à la source par le prestataire) est ABANDONNÉ — « en tant que grossiste j'ai le droit de faire sans
         marketplace ». Ce qui le remplace ne fait transiter les fonds de personne :
           ① nous ACHETONS les bons de la marque à la valeur faciale MOINS la remise de l'offre qu'elle a choisie ;
           ② nous les REVENDONS au point de vente à la valeur faciale moins SA part ;
           ③ le point les revend au client au prix affiché — sa part est sa marge, jamais une « commission ».
         Notre marge est la DIFFÉRENCE entre les deux remises : c'est elle qui paie le prélèvement, le virement et
         le risque d'impayé. Le point est débité par PRÉLÈVEMENT SEPA (mandat signé une fois) ; la marque est réglée
         par VIREMENT INSTANTANÉ depuis notre banque, au délai de son offre. ══ */
      paiement: {
        banque: 'Crédit Mutuel',             // (22/09) « je suis sur Crédit Mutuel » : c'est elle qui prend nos remises
        canal: 'CMUT Direct PRO',            // l'espace bancaire où le fichier se dépose et où les retours se récupèrent
        offreMensuelle: 4.20,                // € HT/mois — l'option « remises automatisées » retenue par la fondatrice
        ics: '',                             // notre Identifiant Créancier SEPA : la banque le délivre, personne ne l'invente
        iban: '',                            // l'IBAN du compte qui reçoit les prélèvements (le nôtre)
        bic: '',                             // son BIC — les deux se saisissent en Configuration, jamais ici
        formatRemise: 'pain.008.001.08',     // (24/09) le fichier que NOUS déposons — version 2019 de la norme, celle du guide EPC B2B 2025 (LclInstrm B2B seul)
        formatRetour: 'pain.002 · camt.054', // ce que la banque nous rend : acquittement, impayés, relevé
        arreteHeure: '20:00',                // l'heure de la vérification journalière (la fenêtre court de 20:00 à 20:00)
        depotMinutes: 15,                    // le fichier part dans les 15 minutes qui suivent la vérification
        remiseJoursOuvresAvant: 1,           // règle SEPA : une remise est déposée au moins 1 jour ouvré avant l'échéance
        coutPrelevement: 0.36,               // ce que la banque prend par prélèvement remis
        coutRepresentation: 0.36,            // représenter un impayé coûte un prélèvement de plus (réglable en Configuration)
        penaliteImpaye: 12,                  // ce que le contrat met à la charge du point en cas d'impayé (réglable)
        coutVirement: 0.14,                  // virement instantané émis vers la marque (réception gratuite chez elle)
        encoursMaxPoint: 1500,               // ce qu'un point peut devoir à la fois : bons vendus, pas encore réglés
        impayesAvantSuspension: 1,           // un impayé suffit — le point ne vend plus tant qu'il n'a pas régularisé
        mandatDefaut: 'B2B',
        abonnementJour: 1                    // les abonnements logiciels sont prélevés le 1er de chaque mois
      },
      /* ══ (23/09, arbitrage fondatrice : « prélèvement SEPA pour tabac etc., et avance pour micro ») ═══════════
         DEUX RÉSEAUX, DEUX FAÇONS DE PAYER — et ce n'est pas un détail d'implémentation, c'est une différence de
         nature. Le COMMERCE SÉDENTAIRE (tabac, presse, épicerie) vend d'abord et nous le prélevons ensuite, sur son
         mandat SEPA : il a pignon sur rue, un compte professionnel, et nous savons où le trouver. Le COMMISSIONNAIRE
         MICRO-ENTREPRENEUR, lui, PAIE D'AVANCE : une garantie versée une fois, puis un solde qu'il recharge et qui
         se débite à chaque bon vendu. Trois conséquences voulues :
           · risque d'impayé NUL sur ce réseau — il ne vend que ce qu'il a déjà payé ;
           · l'argent qu'il encaisse ensuite auprès du client lui appartient : il se rembourse, il ne détient
             les fonds de personne — c'est ce qui écarte la qualification d'encaissement pour compte de tiers ;
           · aucune ligne de prélèvement, aucune remise, aucun impayé possible : sa vente naît RÉGLÉE.
         La garantie est un DÉPÔT restituable, jamais un droit d'entrée ni une sanction : une somme retenue à titre
         de sanction ferait la preuve d'un pouvoir disciplinaire que nous n'avons pas, et que nous ne voulons pas
         avoir — c'est l'un des sept critères d'indépendance du commissionnaire. ══ */
      avance: {
        garantie: 200,              // le dépôt de garantie versé une fois — restituable intégralement
        restitutionJours: 30,       // délai de restitution après la fin du contrat, sur décompte écrit
        rechargeMin: 50,            // en dessous, un virement coûte plus cher qu'il ne rapporte
        rechargeMax: 3000,          // au-dessus, le manager tranche au cas par cas (vigilance LCB-FT)
        soldeAlerte: 100            // sous ce solde, l'écran l'avertit avant qu'il ne soit bloqué en pleine vente
      },
      /* LES DEUX MANDATS SEPA — ce qui les sépare n'est pas le prix, c'est le DROIT DU DÉBITEUR. Le mandat
         interentreprises ferme le remboursement sur simple demande ; en contrepartie la banque du débiteur doit
         l'enregistrer chez elle avant le premier prélèvement, et le délai de rejet est plus court. */
      mandats: {
        B2B: { libelle: 'Mandat SEPA interentreprises (B2B)', remboursement: false, rejetJoursOuvres: 3, enregistrementBanqueDebiteur: true,   // (24/09) 3 jours ouvrés interbancaires après le règlement (règlement EPC B2B 2025 v1.1)
          /* (24/09, soir — vérifié sur Légifrance) l'art. L133-25-2 CMF n'a pas de III et vise un autre cas : la règle se dit sans article */
          mention: "Mandat SEPA interentreprises : réservé aux professionnels, il n'ouvre aucun droit au remboursement sur simple demande (règlement du prélèvement SEPA interentreprises). Le débiteur fait enregistrer le mandat auprès de sa banque avant le premier prélèvement." },
        CORE: { libelle: 'Mandat SEPA standard (CORE)', remboursement: true, rejetJoursOuvres: 5, remboursementSemaines: 8, enregistrementBanqueDebiteur: false,
          mention: "Mandat SEPA standard : le débiteur peut demander le remboursement d'un prélèvement autorisé pendant 8 semaines, sans motif." }
      },
      /* LES TROIS OFFRES DE PAIEMENT DE LA MARQUE (22/09, fondatrice) — plus elle est réglée vite, plus la remise
         est forte. `partPointPct` est ce que garde le point de vente ; NOTRE part est la DIFFÉRENCE, jamais un
         troisième nombre écrit à côté : deux chiffres qui devraient s'accorder finissent toujours par diverger. */
      modesPaiement: [
        { id: 'j1', libelle: 'Paiement sous 24 heures', court: '24 h', remisePct: 5.5, partPointPct: 3, defaut: true,
          delaiHeures: 24, cadenceJours: 1, base: 'calendaire',
          detail: "Tous les bons vendus entre deux arrêtés de 20:00 sont prélevés le lendemain ; nous payons la marque par virement instantané dans les 24 heures qui suivent l'arrêté." },
        { id: 'j7', libelle: 'Paiement sous 7 jours ouvrés', court: '7 j ouvrés', remisePct: 4.5, partPointPct: 2.5,
          delaiJoursOuvres: 7, cadenceJours: 7, base: 'ouvre',
          detail: "Les ventes sont regroupées sur sept jours ; le prélèvement part à l'arrêté de période et le virement suit dans les 7 jours ouvrés." },
        { id: 'j10', libelle: 'Paiement sous 10 jours', court: '10 j', remisePct: 3.5, partPointPct: 2,
          delaiJours: 10, cadenceJours: 10, base: 'calendaire',
          detail: "Les ventes sont regroupées sur dix jours : c'est l'offre la moins chère pour la marque, parce que c'est elle qui attend." }
      ],
      /* ══ (22/09) LE LOGICIEL, VENDU À PART ═══════════════════════════════════════════════════════════════════
         C'est lui qui justifie l'abonnement : un service réel, facturé pour lui-même — sans quoi un abonnement
         demandé à un fournisseur serait un avantage sans contrepartie (art. L442-1 II du Code de commerce). Il ne
         commande RIEN des dates de paiement : une marque au forfait gratuit choisit son offre de paiement comme
         les autres. Premier mois offert, prélevé sur le mandat SEPA de la marque. ══ */
      /* ══ (23/09, fondatrice : « édition de bons gratuite pour 10 bons ; dépassé 10 bons, abonnement pour la
         gestion et l'émission des bons — service technologique (attention ACPR) ; on passe à émission de 50 bons
         5,90 € ; illimité*, astérisque maximum 1 million d'euros, procédure ACPR dépassé, PayEnCash Solution vous
         aide dans vos démarches » · « on crée par tranche de 100 achetés par PayEnCash, on affiche 100, pagination
         20 éléments vus ») LE LOGICIEL D'ÉDITION DES BONS ═════════════════════════════════════════════
         CE QUE L'ABONNEMENT PAIE, ET LUI SEUL : l'ÉDITION des codes de bons (un service logiciel), jamais la valeur
         des bons, jamais leur distribution, jamais un « droit » sur les fonds. C'est ce qui le tient debout devant
         l'ACPR : nous vendons un logiciel de génération, et nous ACHETONS les bons à la marque quand ils se vendent.
         LE BON S'ÉDITE À LA VENTE, au montant que le client demande — jamais d'avance (23/09 : « nous vendons à des
         montants variables ») : `bonsMax` est le nombre de bons qu'une marque peut éditer PAR MOIS, une vente = une édition. L'astérisque de l'illimité est un SEUIL LÉGAL,
         pas un tarif : au-delà de 1 000 000 € de bons sur douze mois glissants, l'exclusion « réseau limité »
         impose une déclaration à l'ACPR (art. L521-3 II CMF) — l'écran le dit avant, et nous accompagnons. */
      logiciel: {
        essaiMois: 0,
        pageBons: 20,          // la liste des bons se lit 20 par 20 (23/09 : « pagination 20 éléments vus »)
        formules: [
          /* (24/09, soir) LE QUOTA SE RÈGLE (tech.formule.<id>.bonsMax) : les textes portent {n}, que techFormules remplace par le quota
             en vigueur — un texte qui écrirait « 10 » mentirait dès que le manager le change. */
          { id: 'gratuit', nom: 'Offert', prix: 0, bonsMax: 10, defaut: true,
            detail: "Tes {n} premiers bons du mois, sans abonnement : de quoi commencer.",
            inclus: ['Édition de {n} codes de bons par mois', 'Vente dans tout le réseau', 'Suivi des ventes et des règlements'] },
          { id: 'cinquante', nom: '{n} bons', prix: 5.90, bonsMax: 50,
            detail: "L'édition de {n} codes de bons par mois — le logiciel de gestion et d'émission.",
            inclus: ['Édition de {n} codes de bons par mois', 'Lien de vente et visuels', 'Historique complet et exports'] },
          /* (23/09, fondatrice : « abonnement à 19,00 €, INCLUS la création d'un site web depuis leur nom de domaine,
             tourné vers leur marque, ultra facile d'usage ») */
          { id: 'illimite', nom: 'Illimité*', prix: 19.00, bonsMax: null, siteWeb: true,
            detail: "Édition sans limite de nombre, et ton site web sur ton nom de domaine — une vitrine tournée vers ta marque, tes articles et tes bons, sans rien coder. * Illimité en nombre, dans la limite légale de 1 000 000 € de valeur de bons vendus sur douze mois glissants — au-delà, déclaration à l'ACPR (art. L521-3 II CMF), et nous t'accompagnons.",
            /* (23/09, soir — fondatrice : « ce n'est pas 1 million de bons le maximum, c'est la valeur : émission illimitée dans la
               limite de 1 M€ de CA ») : sans limite de NOMBRE, dans la limite du seuil (ref.tech.seuils.acprMontant12Mois) */
            inclus: ['Édition sans limite de nombre — dans la limite de 1 000 000 € de bons vendus sur douze mois (seuil légal)', 'Ton site web sur ton nom de domaine, tourné vers ta marque', 'Tout le forfait {cinquante}', 'Accompagnement de la déclaration ACPR à l’approche du seuil'] }
        ]
      },
      /* LES SEUILS QUI S'IMPOSENT À UNE MARQUE — lus par l'écran Compte, jamais réécrits là-bas. Une seule source
         pour chaque nombre : le seuil ACPR ici, le plafond par bon et la validité dans `bonsRef()`. */
      /* ══ LES SEUILS LÉGAUX — VÉRIFIÉS À LA SOURCE LE 23/09/2026 (fondatrice : « règles en vigueur, revérifie, va chercher
         des informations pour être sûre » ; « une erreur coûte plus qu'une absence d'information ») ═══════════════
         Chaque ligne porte le texte tel que lu, sa version, et l'adresse où il a été lu. Ce qui n'a pas été lu sur une
         source primaire n'est PAS écrit : le « seuil d'identification de 3 000 € » du règlement européen, cité par
         des sources secondaires, n'a pas pu être vérifié sur EUR-Lex ce jour-là — il n'apparaît nulle part. */
      seuils: {
        acprMontant12Mois: 1000000,
        acprSource: "art. L521-3 II du code monétaire et financier (version en vigueur au 13/01/2018, lue sur legifrance.gouv.fr le 23/09/2026) — « Dès que la valeur totale des opérations de paiement exécutées au cours des douze mois précédents dépasse un million d'euros, l'entreprise mentionnée au I du présent article adresse une déclaration contenant une description des services proposés à l'Autorité de contrôle prudentiel et de résolution » ; l'ACPR dispose d'un délai fixé par voie réglementaire pour s'opposer, le silence vaut approbation ; actualisation annuelle de la déclaration ; si les conditions ne sont plus remplies, demande d'agrément sous trois mois",
        acprUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035430673",
        reseauLimiteSource: "art. L521-3 I 1° du code monétaire et financier — « une entreprise peut fournir des services de paiement fondés sur des moyens de paiement qui ne sont acceptés, pour l'acquisition de biens ou de services, que : 1° Dans les locaux de cette entreprise ou, dans le cadre d'un accord commercial avec elle, dans un réseau limité de personnes acceptant ces moyens de paiement »",
        alertePct: 80,           // à 80 % du seuil, l'écran prévient — avant, pas après
        /* LE PAIEMENT EN ESPÈCES — la loi, pas notre politique (qui est plus stricte : voir bonsRef) */
        especesResidentEur: 1000,
        especesMonnaieElectroniqueEur: 3000,
        especesNonResidentAssujettiEur: 15000,
        especesNonResidentEur: 10000,
        especesSource: "art. L112-6 et D112-3 du code monétaire et financier (D112-3 lu sur legifrance.gouv.fr le 23/09/2026 ; fiche service-public.gouv.fr F10999 vérifiée le 26/06/2026) — 1 000 € en espèces (3 000 € en monnaie électronique) lorsque le débiteur a son domicile fiscal en France ou agit pour les besoins d'une activité professionnelle ; 15 000 € pour un non-résident n'agissant pas à titre professionnel qui paie une personne assujettie à la LCB-FT, 10 000 € sinon ; sanction : amende jusqu'à 5 % des sommes indûment réglées (art. L112-7)",
        especesUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036824549",
        /* LA VIGILANCE LCB-FT DU COMMERÇANT */
        lcbftIdentificationEur: 10000,
        lcbftSource: "art. L561-2 11° (version en vigueur du 05/08/2026 au 10/07/2027) et R561-10 (version en vigueur depuis le 25/12/2024, décret n° 2024-1205) du code monétaire et financier, lus sur legifrance.gouv.fr le 23/09/2026 — sont assujetties « les autres personnes se livrant au commerce de biens et acceptant des paiements en espèces ou au moyen de monnaie électronique d'un montant supérieur à un seuil fixé par décret » ; le client occasionnel est identifié et son identité vérifiée avant « une opération ou des opérations liées réglées en espèces ou en monnaie électronique pour un montant excédant 10 000 euros » ; conservation cinq ans (art. L561-12). Ces obligations visent le commerce de biens qui accepte des espèces : PayEnCash, elle, n'est pas assujettie à la LCB-FT (art. L561-2 CMF ; position ACPR 2022-P-01, § 2.1).",
        lcbftUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332948",
        /* CE QUI ARRIVE : le plafond européen */
        europeEspecesEur: 10000,
        europeDepuis: '2027-07-10',
        europeSource: "règlement (UE) 2024/1624 du 31 mai 2024, art. 80 — limite commune de 10 000 € aux paiements en espèces pour une opération professionnelle, les États pouvant fixer une limite inférieure (la France reste à 1 000 €) ; applicable à partir du 10 juillet 2027 (rapport du Sénat n° 120, session 2024-2025, lu le 23/09/2026 ; le texte du règlement sur EUR-Lex n'a pas pu être relu ce jour-là)",
        europeUrl: "https://www.senat.fr/rap/l24-120/l24-1201.html"
      },
      /* ══ CE QUE LE RÉSEAU ACCEPTE AU COMPTOIR (23/09, fondatrice : « rappel que notre réseau de vente de bons accepte
         la CB, les espèces, les pièces, la devise euro, règles de consommation européennes ») ═══════════════════
         Une liste, et pour chaque ligne le texte qui la tient — rien de plus. */
      encaissement: {
        devise: 'EUR',
        deviseSource: "art. L111-1 du code monétaire et financier — « La monnaie de la France est l'euro »",
        moyens: [
          { k: 'especes', lbl: 'Espèces — billets et pièces en euros', source: "cours légal des billets et pièces en euros ; le refus d'un paiement en espèces ayant cours légal est sanctionné (art. R642-3 du code pénal), dans la limite du plafond légal (art. D112-3 CMF) ; nul n'est tenu d'accepter plus de 50 pièces pour un même paiement (règlement (CE) n° 974/98, art. 11)" },
          { k: 'carte', lbl: 'Carte bancaire', source: "selon les moyens que le commerce accepte et affiche — le bon d'achat s'achète au comptoir du commerce, avec ses moyens à lui" }
        ],
        piecesMaxParPaiement: 50,
        consommation: "code de la consommation — information sur le prix, la validité et les conditions du bon avant l'achat (art. L111-1 et L221-5) ; droit de rétractation de quatorze jours lorsque le bon est acheté à distance (art. L221-18), sauf exceptions de l'art. L221-28 ; ces textes transposent la directive 2011/83/UE relative aux droits des consommateurs"
      },
      fondement: {
        /* (23/09) L'ARTICLE ÉTAIT FAUX : L315-1 DÉFINIT la monnaie électronique, il ne porte aucune exemption. Celle
           qui nous tient est l'art. L521-3 I 1° — relu à la source le 23/09. Une citation fausse dans un dossier est
           pire qu'une citation absente : elle se retourne au premier contrôle. */
        exemption: "Art. L521-3 I 1° du Code monétaire et financier — exemption « réseau limité » : un moyen de paiement accepté dans les locaux de l'entreprise émettrice ou, dans le cadre d'un accord commercial avec elle, dans un réseau limité de personnes, échappe au régime des services de paiement. Le pendant en monnaie électronique est l'art. L525-5, et l'art. L315-1 exige qu'elle soit acceptée « par une personne autre que l'émetteur » — un bon accepté par la seule marque émettrice n'en est pas. Déclaration à l'ACPR au-delà d'un million d'euros d'opérations sur douze mois (art. L521-3 II), actualisée chaque année. Relu sur Légifrance le 23/09/2026.",
        /* (24/09, soir — vérifié sur Légifrance) L'ART. L112-1-1 C. CONSO RÉGIT L'ANNONCE D'UNE RÉDUCTION DE PRIX (« Omnibus »), pas la
           validité d'un bon : la citation était fausse. La durée d'au moins douze mois est un ENGAGEMENT du réseau, écrit dans les conditions
           des bons de marque (art. 3) et dans le contrat-cadre de la marque — dit comme tel, sans texte qu'on n'a pas lu. */
        validite: "Engagement contractuel du réseau — durée de validité d'au moins douze mois à compter de l'émission (conditions des bons de marque).",
        reserve: "⚠ Ce cadre est un cahier des charges de travail, pas un avis juridique : la qualification de l'activité (grossiste qui achète et revend les bons, commissionnaire qui paie d'avance ceux qu'il revend) et le respect de l'exemption « réseau limité » doivent être validés par un avocat avant toute mise en production.",
        source: "Cahier des charges technique « API de mise en relation pour réseaux limités de bons d'achat », 19/09"
      },
      mentions: [
        "PayEnCash Solution achète les bons de la marque pour son propre compte et les revend à son réseau de points de vente : il n'encaisse, ne détient et ne transfère jamais de fonds pour le compte d'autrui.",
        "Le prix d'achat est la valeur faciale diminuée de la remise de l'offre de paiement choisie par la marque ; le point de vente achète à la valeur faciale diminuée de sa propre part.",
        "Le point de vente est débité par prélèvement SEPA sur le mandat qu'il a signé une fois ; nous payons la marque par virement au délai de son offre.",
        "Un bon n'est utilisable que sur le site de la marque qui l'a émis — les réseaux ne sont jamais mutualisés.",
        "Le contrat de distribution est à usage unique, d'une durée d'un an, résiliable à tout moment par l'une ou l'autre des parties, sans reconduction tacite.",
        "L'abonnement au logiciel rémunère un service distinct, facturé pour lui-même : il ne conditionne ni le prix d'achat des bons, ni le délai de règlement."
      ]
    },
    /* (21/09) L'ADRESSE DE L'API — un réglage manager (api.base), vide en maquette : les écrans qui savent parler au serveur
       (carte du commerce par le composant Stripe, préparation au réel) ne le font que si elle est posée. */
    api: { base: '' },
    prefixeRecu: "B3K",
    // (18/09, soir) `vehiculesTypes` (scooter, vélo cargo) est parti avec la flotte de l'agent de caisse mobile.
    /* (18/09, soir) 48 LIBELLÉS D'AUDIT SONT PARTIS AVEC L'AGENT DE CAISSE MOBILE : tout ce qui journalisait son
       emploi (habilitation, indisponibilité, fin de contrat, fiche RH, bulletin, salaire viré, solde de tout compte,
       notes de frais, créneaux, zone, véhicule, pièces du dossier, prise de poste), sa course (acceptée, refusée,
       expirée, réaffectée, arrivée, encaissement commencé ou échoué) et son circuit d'espèces (remise et reprise de
       caisse, tournée, dépôt, remise au manager, écart tranché, rapport Cash Services, rapprochement, rendu de
       monnaie, contrôle LCB-FT au comptoir, code de sécurité). Plus aucun de ces événements n'est écrit nulle part :
       un libellé sans événement se lit comme une fonctionnalité encore là. */
    auditLibelles: {
      /* ══ (19/09, nuit) PAYENCASH SOLUTION — chaque événement de la seconde ligne a son libellé : c'est ce
         que lit un humain dans le journal d'audit (UC-14 du cahier des charges), et c'est ce qu'un contrôle
         ACPR ouvrirait en premier. Un événement sans libellé est un événement que personne ne saura relire. ══ */
      tech_revendeur_inscrit: "Fiche de vente d'un partenaire du réseau créée (commerce du réseau ou distributeur nomade)",
      tech_marchand_compte: "Compte d'une marque ouvert (e-mail vérifié ou Google / Apple) — sa fiche naît en brouillon",
      tech_marchand_entreprise: "Entreprise d'une marque renseignée (raison sociale, SIRET, site ou « pas de site »)",
      tech_marchand_inscrit: "Inscription d'une marque envoyée en vérification — société, site, dirigeant déclaré",
      compte_sso: "Compte relié à Google ou Apple",
      partenaire_activite: "Candidature d'un partenaire : activité renseignée (mode, SIRET, raison sociale, adresse ou zone)",
      partenaire_gerant: "Candidature d'un partenaire : gérant déclaré (civilité, naissance, qualité)",
      partenaire_candidature_envoyee: "Candidature d'un partenaire envoyée en vérification",
      tech_dirigeant_declare: "Dirigeant de la marque déclaré (prénom, nom, qualité) — c'est lui qui signe le contrat-cadre",
      /* (22/09 — grossiste) l'argent de la seconde ligne : la vente, le mandat, la remise de prélèvements,
         le retour de la banque, l'impayé et sa pénalité, le virement à la marque */
      tech_mode_paiement_choisi: "Offre de paiement choisie par une marque (24 h · 7 j ouvrés · 10 j) — vaut pour les ventes à venir",
      tech_formule_choisie: "Forfait logiciel choisi par une marque (PayEnCash Solution)",
      tech_abonnement_genere: "Échéance d'abonnement au logiciel générée (période)",
      tech_mandat_sepa_signe: "Mandat de prélèvement SEPA signé — c'est lui qui autorise le débit",
      tech_mandat_sepa_revoque: "Mandat de prélèvement SEPA révoqué — plus aucun débit possible",
      tech_vente: "Bon de marque vendu au comptoir : le point nous doit son prix d'achat (VNT-…)",
      tech_vente_annulee: "Vente d'un bon de marque annulée avant prélèvement — rien n'est débité",
      tech_bon_annule: "Bon de marque annulé au comptoir (jamais utilisé, dans le délai)",
      tech_remise_preparee: "Remise de prélèvements préparée — arrêté d'une offre de paiement (RMS-…)",
      tech_remise_deposee: "Remise de prélèvements déposée à la banque (fichier pain.008)",
      tech_remise_retour: "Retour bancaire importé — payés, impayés et pénalités mis à jour",
      tech_representation: "Prélèvement impayé représenté — la vente repart à la remise suivante", tech_bon_refus_note: "Bon valide refusé par sa marque : noté par la hotline, la marque est prévenue", tech_impaye_appel: "Impayé : le manager a appelé le commerce et noté l'appel (préalable à la représentation)",
      tech_penalite: "Pénalité mise à la charge d'un point de vente (impayé ou représentation)",
      tech_revendeur_suspendu: "Point de vente suspendu après impayé — il ne vend plus tant qu'il n'a pas régularisé",
      tech_revendeur_statut: "La fiche de vente d'un commerce suit son point (validée, suspendue, en attente)",
      tech_revendeur_regularise: "Impayé régularisé — le point de vente revend",
      tech_rib_marque: "RIB d'une marque enregistré — c'est lui qui reçoit les virements",
      tech_reglement_marque: "Marque payée par virement instantané (VIR-…)",
      stripe_mode_reel: "Stripe basculé en RÉEL par le manager — préparation vérifiée",
      stripe_mode_test: "Stripe remis en mode test par le manager",
      stripe_activite_confirmee: "Accord écrit de Stripe sur l'activité « cartes cadeaux » attesté par le manager",
      tech_conformite_deposee: "Déclaration « réseau limité » déposée par une marque",
      tech_conformite_validee: "Déclaration « réseau limité » validée — les mises en relation s'ouvrent",
      tech_conformite_a_corriger: "Déclaration « réseau limité » à corriger (motivée)",
      tech_mandat_signe: "Mandat de représentation signé (art. 1984 s. C. civ.)",
      tech_mandat_revoque: "Mandat de représentation révoqué",
      tech_contrat_cree: "Contrat de distribution généré (brouillon)",
      tech_contrat_envoye: "Contrat de distribution proposé — signature manuelle requise (mandat manquant)",
      tech_contrat_signe: "Contrat de distribution exécuté — CONTRACTUALISATION",
      tech_contrat_actif: "Contrat de distribution en exécution",
      tech_contrat_resilie: "Contrat de distribution éteint — EXTINCTION (terme échu ou résiliation ad nutum)",
      tech_contrat_cloture: "Contrat de distribution clôturé et archivé",
      tech_facture_emise: "Facture d'abonnement au logiciel émise (TVA comprise)",
      tech_beneficiaires_declares: "Bénéficiaires effectifs d'une marque déclarés et attestés", compte_relance: "Relance d'une inscription interrompue (e-mail J+1 / J+7)", distributeur_tarif: "Tarif de déplacement fixé par un distributeur nomade (tarif libre, convenu avec le client)", partenaire_beneficiaires: "Bénéficiaires effectifs d'un partenaire déclarés et attestés",
      tech_facture_payee: "Facture d'abonnement réglée par carte (Odoo · Stripe)", tech_facture_echec: "Débit de la carte refusé — facture d'abonnement restée due",
      tech_abonnements_factures: "Abonnements du mois facturés et débités (tâche du 1er)", tech_carte_marque: "Carte bancaire d'une marque enregistrée pour son abonnement", tech_carte_retiree: "Carte bancaire d'une marque retirée",
      tech_facture_payee: "Facture PayEnCash Solution soldée",
      tech_cle_generee: "Clé d'API générée (le secret n'est pas conservé)",
      tech_cle_revoquee: "Clé d'API révoquée",
      tech_bon_emis: "Bon d'achat émis au nom d'une marque",
      tech_bon_vendu: "Bon d'achat vendu au client par un commerce du réseau",
      tech_bon_utilise: "Bon d'achat utilisé chez la marque émettrice",
      tech_lien_cree: "Bon d'achat proposé par une marque à un client (montant fixé par elle)",
      tech_lien_bon_utilise: "Bon d'achat de la marque utilisé sur un bon proposé, depuis l'app Mes bons",
      tech_lien_couvert: "Bon proposé entièrement couvert par les bons de la marque",
      tech_lien_annulee: "Bon proposé annulé par la marque",
      /* (23/09, soir) LES ÉVÉNEMENTS NÉS DANS LA JOURNÉE ONT LEUR LIBELLÉ D'AUDIT — sans lui, le journal des flux affiche une clé */
      tech_lien_vente_cree: "Lien de vente permanent créé par une marque (à partager)",
      tech_article_publie: "Article publié par une marque (visuel, tailles, prix)",
      tech_article_stock: "Stock d'un article de marque mis à jour",
      tech_article_retire: "Article retiré par sa marque",
      tech_site_marque: "Site web de la marque réglé (domaine, accroche, couleur)",
      tech_reseau_marque: "Compte de réseau social relié par une marque",
      tech_reseau_marque_retire: "Compte de réseau social retiré par une marque",
      tech_marchand_valide: "Compte d'une marque activé par le manager (dossier contrôlé, déclaration validée)",
      tech_marchand_suspendu: "Compte d'une marque suspendu par le manager (motif)",
      tech_marchand_reactive: "Compte d'une marque réactivé par le manager",
      document_consulte: "Document lu jusqu'au bout (consultation notée avec sa version)",
      tech_rencontre_demandee: "Rencontre demandée à un distributeur nomade, depuis la page d'un bon proposé par une marque",
      tech_rencontre_acceptee: "Rencontre prise par un distributeur nomade",
      tech_rencontre_servie: "Rencontre honorée — le distributeur nomade a remis le bon de la marque à l'utilisateur",
      tech_rencontre_annulee: "Rencontre avec un distributeur nomade annulée",
      document_valide: "Pièce validée (coffre)", document_refuse: "Pièce refusée (coffre)", dossier_transfere: "Dossier de candidature transféré à son titulaire validé", compte_clos: "Compte clos (fin de contrat)", compte_rouvert: "Candidature rouverte", compte_recandidature: "Nouvelle candidature après refus", session_planifiee: "Session de recrutement planifiée", encaissement_refuse: "Encaissement refusé par le bus", compte_tel_modifie: "Numéro de téléphone du compte modifié", mdp_code_envoye: "Code de réinitialisation envoyé", appel_assignation: "Appel assigné", registre_sortie: "Mouvement inscrit au livre de police (art. 321-7 CP)", registre_entree: "Objet inscrit au livre de police (entrée en stock, art. 321-7 CP)", fournisseur_hors_vente: "Fournisseur retiré de la vente (accès suspendu ou clos) — pièces dépubliées et réservations relâchées", partage_vente_retiree: "Vente attribuée à un lien de partage retirée (commande remboursée)", registre_rectificatif: "Rectificatif inscrit au livre de police (la ligne d'origine reste inscrite)", reseau_boutique: "Compte de réseau social relié par le fournisseur", reseau_boutique_visibilite: "Affichage d'un réseau sur la boutique modifié", reseau_boutique_retire: "Compte de réseau social retiré par le fournisseur", encaissement_hors_fenetre: "Encaissement enregistré HORS fenêtre par le manager (argent déjà reçu)", reservations_liberees: "Pièces relibérées au catalogue (réservation relâchée)", commande_expiree: "Commande expirée (code de paiement, fenêtre dépassée)", kyc: "Vérification d'identité (KYC)", sav_assignation: "Demande assignée", sav_reponse: "Réponse à une demande", achat_voyage: "Achat fournisseur voyage", atelier_verdict: "Verdict de l'atelier", client_statut: "Statut client modifié", connexion_sso: "Connexion (SSO)", fournisseur_acces: "Accès fournisseur modifié", partage_clic: "Lien de partage ouvert", partage_vente: "Vente issue d'un partage", satisfaction_ajoutee: "Réponse au questionnaire de satisfaction", questionnaire_satisfaction: "Questionnaire de satisfaction envoyé (e-mail)", visite_cr: "Compte-rendu de visite (D1)", proposition_envoyee: "Proposition envoyée (D2)", prospect_cree: "Commerce ajouté au pipeline", prospect_maj: "Fiche prospect mise à jour", prospect_perdu: "Prospect perdu", campagne_marketing: "Campagne créée", campagne_marketing_statut: "Campagne — statut", campagne_marketing_releve: "Campagne — relevé", ged_depot: "Créa déposée (GED)", ged_statut: "Créa — statut", agenda_action: "Action planifiée", agenda_action_faite: "Action faite", rappel_commercial: "Rappel commercial programmé", rappel_commercial_fait: "Rappel commercial passé", influenceur_ajoute: "Influenceur ajouté", influenceur_statut: "Influenceur — statut", concours: "Participation au concours", concours_publie: "Lot du concours publié", facture_pdf: "Facture demandée en PDF", recote_reponse: "Réponse du fournisseur à une re-cotation", concours_tirage: "Tirage du concours effectué", influenceur_clic: "Lien influenceur ouvert", code_promo_fly_cree: "Code promo Fly créé", code_promo_fly_desactive: "Code promo Fly désactivé", prospect_invite_fournisseur: "Atelier invité comme fournisseur", annonce: "Commande annoncée", paiement: "Paiement déclaré", sav: "Demande SAV", code_promo_cree: "Code promo créé", bon_emis: "Bon d’achat PayEnCash émis (vente au comptoir ou carte cadeau)", bon_serie_emise: "Vente découpée en plusieurs bons d’achat (plafond LCB-FT par bon)", bon_serie_utilisee: "Série de bons d’achat utilisée par son code commun (un geste, plusieurs bons débités)", bon_utilise: "Bon d’achat PayEnCash utilisé (débit au règlement)", bon_recredite: "Bon d’achat PayEnCash re-crédité (remboursement)", bon_annule: "Bon d’achat PayEnCash annulé", bon_bloque: "Bon d’achat PayEnCash bloqué", bon_debloque: "Bon d’achat PayEnCash débloqué", bon_applique: "Bon d’achat PayEnCash appliqué à une commande", bon_retire: "Bon d’achat PayEnCash retiré d'une commande", partenaire_enregistre: "Fiche du commerce partenaire enregistrée", point_active: "Partenaire du réseau activé (vente des bons de marque ouverte)", point_refuse: "Relation commerciale refusée (distributeur)", distributeur_zone: "Zone de déplacement définie par le distributeur nomade", distributeur_note: "Distributeur noté par un client après une rencontre", distributeur_tarif: "Tarif de déplacement fixé par le commissionnaire lui-même (aucun tarif de réseau)", avance_mouvement: "Mouvement sur le compte d'avance d'un commissionnaire (garantie, recharge, achat, remboursement, restitution)", rencontre_proposition: "Proposition de tarif faite à un client pour un déplacement", rencontre_proposition_retiree: "Proposition de tarif retirée par le commissionnaire", rencontre_choisie: "Commissionnaire choisi par le client parmi les propositions reçues", rencontre_demandee: "Rencontre avec un distributeur nomade demandée par un utilisateur", rencontre_acceptee: "Rencontre prise par un distributeur nomade", rencontre_servie: "Rencontre honorée — bon d’achat remis au client", rencontre_annulee: "Rencontre annulée", point_suspendu: "Partenaire du réseau suspendu", point_reactive: "Partenaire du réseau réactivé", point_clos: "Contrat de distribution résilié (point clos)", contrat_partenaire_signe: "Contrat de distribution du Bon d’achat PayEnCash signé", signature_envoyee: "Lien de signature envoyé au gérant", signature_otp: "Code de signature envoyé au gérant", carte_partenaire: "Carte de règlement du commerce enregistrée", carte_partenaire_retiree: "Carte de règlement du commerce retirée", commission_partenaire: "Taux de commission de distribution d'un commerce modifié", prelevement: "Prélèvement du commerce à la vente d'un bon d’achat", prelevement_refuse: "Prélèvement refusé par la banque — aucun bon d’achat émis", prelevement_rembourse: "Prélèvement remboursé au commerce (bon d’achat annulé)", autofacture_commission: "Autofacture de commission de distribution émise", etiquette_editee: "Étiquette Mondial Relay éditée", colis_expedie: "Colis expédié (Mondial Relay)", verification: "Vérification de compte", compte_cree: "Compte créé", compte_verifie: "Code confirmé (SMS / e-mail)", compte_valide: "Compte validé", compte_lie: "Entré dans son référentiel", compte_refuse: "Compte refusé", compte_suspendu: "Compte suspendu", compte_reactive: "Compte réactivé", compte_profil: "Profil complété", compte_supprime: "Compte supprimé (RGPD)", connexion: "Connexion", connexion_echec: "Connexion refusée", deconnexion: "Déconnexion", export: "Export de données", export_rgpd: "Export RGPD demandé", suppression_compte: "Suppression de compte demandée", rgpd_code: "Code RGPD envoyé", rgpd_effacement: "Effacement RGPD", rgpd_export: "Export RGPD (support)", rgpd_rectification: "Rectification RGPD", reclamation_decision: "Décision sur réclamation", confirmation_manuelle: "Paiement confirmé manuellement", promo_controlee: "Offre contrôlée", promo_publiee: "Offre publiée", promo_depubliee: "Offre dépubliée", parametre_modifie: "Paramètre modifié", remboursement: "Remboursement", annulation: "Commande annulée", kyb_soumis: "Dossier de vérification envoyé", kyb_frais: "Frais de vérification réglés", kyb_assigne: "Dossier de vérification assigné", document_depose: "Pièce déposée au coffre", document_signe: "Document signé en ligne", document_supprime: "Pièce retirée du coffre", video_verification: "Vidéo de vérification enregistrée", acceptation_documents: "Documents en vigueur acceptés", fiche_entreprise: "Fiche entreprise modifiée", piece_publiee: "Pièce publiée (envoyée à l'atelier)", stock_retrait: "Pièce retirée du stock (vendue hors PayEnCash)", partage_copie: "Lien de partage copié", lot_prix_actualise: "Prix de vente à PayEnCash actualisé par le fournisseur", etiquette_editee: "Étiquette Mondial Relay éditée", colis_expedie: "Colis déposé en point relais", code_promo_cree: "Code promo créé", campagne_creee: "Campagne marketing créée", demarque_proposee: "Démarque proposée au fournisseur", rib_a_controler: "IBAN modifié — RIB à contrôler", rib_controle: "RIB contrôlé par le manager", facture_emise: "Facture fournisseur émise", facture_viree: "Facture fournisseur virée", appel: "Appel passé", notation: "Note laissée par le client", export_rgpd_support: "Export RGPD (support)", rib_client: "RIB enregistré par le client", rib_client_supprime: "RIB retiré par le client", fiche_entreprise: "Fiche entreprise modifiée", code_promo_desactive: "Code promo désactivé", code_promo_reactive: "Code promo réactivé", mentions_legales: "Mentions légales relevées (dossier papier)", contrat_resilie: "Contrat fournisseur résilié", contrat_contresigne: "Contrat contresigné par PayEnCash", colis_suivi: "Suivi transporteur (Mondial Relay)", commande_livree: "Commande livrée au point relais", controle_tire: "Pièce tirée au contrôle qualité", controle_reception: "Pièce reçue à l'atelier (contrôle)", controle_verdict: "Verdict du contrôle qualité sur une pièce vendue", reclamation_ouverte: "Réclamation ouverte (Mode)", reclamation_remboursee: "Réclamation remboursée", reclamation_retour_depose: "Colis retour déposé en relais", reclamation_retour_recu: "Colis retour reçu à l'atelier", reclamation_constat: "Constat de l'atelier sur un retour", reclamation_contestee: "Constat contesté par le fournisseur", reclamation_expiree: "Réclamation close — retour jamais déposé", debits_imputes: "Débits fournisseur imputés sur une facture",
      // (09/09 — lot 2 l'argent)
 annulation_client: "Commande annulée par le client", 
      // (10/09 — lot 7 paie & RH)
 avoir_rattache: "Avoir en attente rattaché à un compte client", avoir_credite: "Avoir crédité sur un compte client", avoir_consomme: "Avoir utilisé à la commande", remboursement_virement_emis: "Remboursement viré au client",
      /* (20/09 — « enlève la logique Neosurf ») LES SIX LIBELLÉS DU PRESTATAIRE EN LIGNE SONT PARTIS avec les
         fonctions qui les journalisaient (paiementPspInitier / paiementPspNotifier / remboursementPspEmettre) :
         plus aucun événement `psp_*` ne peut naître, et ZT·419 n'exige un libellé que pour ce qui s'écrit. */ }
  },
  // Période courante (mois, libellé, semaine ISO) — plus jamais « 2026-08 » ou « semaine 32 » figés dans un écran
  periodeCourante: function (d) {
    d = d || new Date();
    var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var y = d.getFullYear(), m = d.getMonth();
    var prec = new Date(y, m - 1, 1);
    var t = new Date(Date.UTC(y, m, d.getDate())); var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    var semaine = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
    var iso = function (dd) { return dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0'); };
    var cap = function (x) { return x.charAt(0).toUpperCase() + x.slice(1); };
    return { mois: iso(d), label: cap(MOIS[m]) + ' ' + y, moisPrecedent: iso(prec), labelPrecedent: cap(MOIS[prec.getMonth()]) + ' ' + prec.getFullYear(), semaineISO: semaine, dateISO: iso(d) + '-' + String(d.getDate()).padStart(2, '0') };
  },
  /* (18/09, soir) LA CLÉ AGENT ↔ ZONE (`couriers.zone_id`, `zoneId`, la migration des libellés RH en clés, les
     effectifs par zone et les agents qu'aucune zone ne réclamait) est partie avec l'agent de caisse mobile : sans
     course à attribuer, il n'y a plus de secteur à couvrir. */
  // Fiche entreprise DÉRIVÉE d'un compte fournisseur (identifiants stables par id) — complétée par f.entreprise s'il existe
  /* (10/09 — lot 4 comptes/KYB) L'IDENTITÉ LÉGALE NE SE FABRIQUE PLUS. SIRET, TVA intracommunautaire, RCS, capital, forme
     juridique, téléphone, e-mail — et l'IBAN — étaient DÉRIVÉS D'UN HACHAGE de l'identifiant : la fiche « identité légale »,
     le contrat-cadre SIGNÉ (« compte de règlement : IBAN FR76 … ») et les factures portaient des numéros inventés. Trois
     sources réelles, dans cet ordre : ① les mentions relevées sur les pièces VALIDÉES (Kbis, RIB, TVA — PEC_DOCS.mentions),
     ② ce que le fournisseur a déclaré à son inscription (f.entreprise), ③ rien. Ce qui manque reste vide, et les documents
     qui en dépendent sont refusés tant que c'est vide. */
  entrepriseDeriveeFournisseur: function (f) {
    if (!f) return null;
    var m = {}; try { m = (window.PEC_DOCS && PEC_DOCS.mentions) ? PEC_DOCS.mentions('fournisseur', f.id) : {}; } catch (e) {}
    var e2 = f.entreprise || {};
    var ville = e2.ville || String(f.ville || '').replace(/\s\d+ᵉ$/, '');
    var siren = m.siren || String(e2.siren || '').replace(/\D/g, '') || null;
    return {
      enseigne: f.nom, raisonSociale: m.raisonSociale || e2.raisonSociale || null, formeJuridique: m.formeJuridique || null,
      siren: siren ? String(siren).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : null,
      siret: m.siret ? String(m.siret).replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : null,
      tvaIntra: m.tvaIntra || null, regimeTva: m.regimeTva || null,
      capital: m.capital || null, rcs: m.rcs || null, naf: m.naf || null,
      ville: ville, cp: e2.cp || '', adresse: m.adresse || e2.adresse || '',
      dirigeant: m.dirigeant || e2.dirigeant || '', email: e2.email || null,
      tel: e2.tel || null, telComplet: e2.telComplet || e2.tel || null,
      iban: m.iban || null, bic: m.bic || null, titulaireCompte: m.titulaire || null,
      kyb: { statut: f.kyb === 'valide' ? 'valide' : 'en_cours', verifieLe: f.kyb === 'valide' ? f.depuis : null },
      contrat: { type: "Contrat-cadre d'achat ferme", depuis: f.depuis, signeLe: null }   // signeLe se DÉRIVE du document signé (_fournisseurVerite)
    };
  },
  /* ── COMPTES — PROTOCOLE UNIQUE (fondatrice 03/09 : « lance les intégrations création de compte… si le process n'est
        pas formalisé, finalise-le ; échanges entre apps, pas de statique »). UNE table `accounts` (miroir users / partners
        / supplier_users / courier_users / staff_users) pour les six espaces, avec un cycle de vie explicite :
          créer (formulaire de l'app) → vérifier (SMS · e-mail : code) → valider par le MANAGER (KYB · KYC · habilitation ·
          documents) → actif → connexion (session de l'espace) → suspendre / réactiver / refuser.
        Un compte validé ENTRE dans son référentiel métier : fournisseur → `fournisseursGet()` (accès actif),
        client → `clientsGet()`. (18/09, soir : l'entrée `agent → agents()` est partie avec l'agent de caisse mobile.)
        Les comptes de démo (`comptesDemo`, accès fournisseurs, clients construits) sont VUS comme des comptes actifs :
        même connexion, même écran manager. Chaque étape est journalisée sur le bus (compte_cree, compte_verifie,
        compte_valide, compte_refuse, compte_suspendu, compte_reactive, connexion) — le manager les voit arriver. ── */
  version: '1.0.4',   // version affichée dans les écrans Compte (une seule source)
  ESPACES_COMPTE: {
    /* (fondatrice 06/09) « on va envoyer un SMS à chaque fois, ça coûte des sous pour se
       connecter » — le client se connectait avec un code SMS À CHAQUE fois. Il a désormais un
       MOT DE PASSE : le SMS ne part plus qu'aux deux moments où il sert vraiment, la
       vérification du numéro à l'inscription et la réinitialisation du mot de passe. */
    client:      { label: 'Utilisateur Mes bons',   sessionLabel: 'Utilisateur Mes bons',  identifiant: 'téléphone',   motdepasse: true,  verifs: ['sms', 'email'],          validation: [],                        initial: 'a_verifier' },
    // le commerce du réseau (sédentaire ou nomade) : e-mail confirmé, dossier de vérification (Kbis, gérant) contrôlé par le manager
    partenaire:  { label: 'Commerce partenaire',    sessionLabel: 'Partenaire',            identifiant: 'identifiant', motdepasse: true,  verifs: ['email'],                 validation: ['kyb'],                   initial: 'a_verifier' },
    /* (24/09, fondatrice : « on doit pouvoir créer un compte avec Google, Apple, et finir les détails de l'inscription plus
       tard ») LA MARQUE A UN COMPTE, COMME TOUT LE MONDE. Elle entrait dans son espace avec son seul identifiant MCH-…, sans
       mot de passe : n'importe qui le connaissant ouvrait son espace. Le compte naît d'abord (e-mail et mot de passe, ou
       Google / Apple) avec la fiche de la marque en BROUILLON ; l'inscription se termine ensuite, étape par étape, et reprend
       où elle s'était arrêtée. CINQ ESPACES À COMPTE : la marque, le commerce du réseau, l'utilisateur de Mes bons, le
       manager et la hotline. */
    marque:      { label: 'Marque (PayEnCash Solution)', sessionLabel: 'Marque', identifiant: 'e-mail', motdepasse: true, verifs: ['email'], validation: [], initial: 'a_verifier' },
    manager:     { label: 'Manager (back-office)',  sessionLabel: 'Manager (back-office)', identifiant: 'identifiant', motdepasse: true,  verifs: [],                        validation: [],                        initial: 'invite' },
    hotline:     { label: 'Hotline',                sessionLabel: 'Hotline',               identifiant: 'identifiant', motdepasse: true,  verifs: [],                        validation: [],                        initial: 'invite' }
  },
  STATUTS_COMPTE: { a_verifier: 'À vérifier (code SMS / e-mail)', inscription: 'Inscription en cours', a_valider: 'À valider par PayEnCash', actif: 'Actif', suspendu: 'Suspendu', refuse: 'Refusé', clos: 'Clos — fin de contrat', invite: 'Invité — mot de passe à créer' },   // (09/09) clos = départ du salarié
  /* ── COMPTES MANAGER ADOSSÉS À `manager_users` (07/09 — fondatrice « oui adosse »).
        `comptes` reste l'UNIQUE magasin (protocole 03/09) ; managersGet() en est la
        PROJECTION à la forme de la table — pas un second store. Et UNE seule liste de
        rôles : avant, « Direction » (seeds) et « Propriétaire » (invitation) nommaient
        le même rôle, et l'enum du schéma portait finance/commercial/marketing qu'aucun
        formulaire ne pouvait produire. ROLES_MANAGER fait foi partout (MU·418). ── */
  ROLES_MANAGER: [
    { code: 'direction',   label: 'Direction',          espace: 'manager', droits: 'tous les droits — configuration, comptes, effacement client' },
    { code: 'superviseur', label: 'Superviseur',        espace: 'manager', droits: 'réseau, prélèvements et vérifications' },
    { code: 'operateur',   label: 'Opérateur',          espace: 'manager', droits: 'ni configuration, ni comptes ; ne peut pas effacer un compte client' },
    { code: 'hotline',     label: 'Conseiller hotline', espace: 'hotline', droits: 'file de sécurisation & rappels — aucun accès au back-office' }
  ],
  // code OU ancien libellé (Direction/Propriétaire/Superviseur/Opérateur/Conseiller) → la fiche de rôle
  roleManager: function (x) {
    var t = String(x || '').trim().toLowerCase(); if (!t) return null;
    var code = /propri|direction|owner/.test(t) ? 'direction' : /superv/.test(t) ? 'superviseur' : /op[ée]rat/.test(t) ? 'operateur' : /conseil|hotline/.test(t) ? 'hotline' : t;
    return this.ROLES_MANAGER.filter(function (r) { return r.code === code; })[0] || null;
  },
  // la table manager_users, ligne par ligne (id, identifiant, full_name, role, active, last_login_at, created_at)
  managersGet: function () {
    var d = this;
    return d.comptesTous('manager').concat(d.comptesTous('hotline')).map(function (c) {
      var p = c.profil || {};
      var r = d.roleManager(p.role || (c.seed ? p.nom : null)) || d.roleManager(c.espace === 'hotline' ? 'hotline' : 'operateur');
      var nom = (p.nom && !d.roleManager(p.nom)) ? p.nom : c.identifiant;   // un seed porte le rôle dans profil.nom : ce n'est pas un nom
      return { id: c.id, identifiant: c.identifiant, full_name: nom, role: r.code, role_label: r.label, espace: r.espace,
               active: c.statut === 'actif', statut: c.statut, last_login_at: c.derniereConnexion || null, created_at: c.creeAt || null,
               seed: !!c.seed, email: p.email || null, note: p.note || null, invitePar: c.invitePar || null, inviteExpireAt: c.inviteExpireAt || null, compte: c };
    });
  },
  // la ligne manager_users de la SESSION (null si la session n'est pas manager/hotline) — c'est elle
  // que les écritures citent (created_by / updated_by : les apps parlent par identifiant, le service résout l'id)
  managerConnecte: function () {
    var s = this.session(); if (!s || !/Manager|Hotline/.test(String(s.espace || ''))) return null;
    var id = String(s.identifiant || '').toLowerCase();
    return this.managersGet().filter(function (m) { return String(m.identifiant).toLowerCase() === id; })[0] || null;
  },
  comptesCreesGet: function () { try { return JSON.parse(localStorage.getItem('pec-comptes') || '[]') || []; } catch (e) { return []; } },
  comptesCreesPut: function (l) { try { localStorage.setItem('pec-comptes', JSON.stringify(l)); } catch (e) {} return l; },
  comptesReset: function () { try { ['pec-comptes', 'pec-comptes-statut', 'pec-fournisseurs-crees', 'pec-clients-crees', 'pec-partenaires'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} },   // (09/09) + écarts RH, frais, indisponibilités ; (18/09) + les points partenaires, nés des comptes
  _espaceDemo: function (lbl) { lbl = String(lbl || ''); return /Manager/.test(lbl) ? 'manager' : /Hotline/.test(lbl) ? 'hotline' : /Solution/.test(lbl) ? null : /Partenaire/.test(lbl) ? 'partenaire' : 'client'; },
  // Les comptes de DÉMO vus par le protocole (statut actif, vérifs faites) — jamais recopiés : dérivés des tables
  comptesSeeds: function () {
    var d = this, l = [], V = function () { return { sms: true, email: true, kyb: true, kyc: true, documents: true, habilitation: true }; };
    (this.comptesDemo || []).forEach(function (c) {
      // (23/09 — grossiste) le trousseau d'une MARQUE n'est pas un compte du protocole : elle a le sien (techMarchandCreer)
      var esp = d._espaceDemo(c.espace), refId = c.refId || null;
      if (!esp) return;
      l.push({ id: 'demo-' + c.identifiant, seed: true, espace: esp, identifiant: c.identifiant, motdepasse: c.motdepasse, statut: 'actif', verifs: V(), profil: { nom: c.role, note: c.note }, refId: refId, creeAt: 0 });
    });
    /* (23/09 — grossiste) PLUS AUCUN COMPTE FABRIQUÉ : les 30 clients de démonstration de Mode et les ateliers
       fournisseurs ne sont plus des comptes. Un utilisateur de Mes bons naît de SON inscription, un commerce de la sienne. */
    return l;
  },
  comptesTous: function (espace) {
    var ov = {}; try { ov = JSON.parse(localStorage.getItem('pec-comptes-statut') || '{}') || {}; } catch (e) {}
    var seeds = this.comptesSeeds().map(function (c) { return ov[c.id] ? Object.assign({}, c, ov[c.id]) : c; });
    var crees = this.comptesCreesGet();
    var l = seeds.concat(crees.filter(function (c) { return !seeds.some(function (s) { return s.espace === c.espace && s.identifiant.toLowerCase() === String(c.identifiant).toLowerCase(); }); }));
    return espace ? l.filter(function (c) { return c.espace === espace; }) : l;
  },
  compte: function (id) { return this.comptesTous().filter(function (c) { return c.id === id; })[0] || null; },
  compteParIdentifiant: function (espace, identifiant) { var id = String(identifiant || '').trim().toLowerCase().replace(/\s+/g, ''); return this.comptesTous(espace).filter(function (c) { return String(c.identifiant || '').toLowerCase().replace(/\s+/g, '') === id; })[0] || null; },
  _compteNoter: function (evt, c, extra) { try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter(evt, c.id, Object.assign({ espace: c.espace, identifiant: c.identifiant, nom: (c.profil && (c.profil.nom || c.profil.enseigne)) || '' }, extra || {})); } catch (e) {} },
  _compteMaj: function (c, patch, evt, extra) {
    Object.assign(c, patch || {}); c.journal = (c.journal || []).concat([{ evt: evt, at: Date.now() }]);
    if (c.seed) { var ov = {}; try { ov = JSON.parse(localStorage.getItem('pec-comptes-statut') || '{}') || {}; } catch (e) {} ov[c.id] = Object.assign({}, ov[c.id] || {}, patch || {}, { journal: c.journal }); try { localStorage.setItem('pec-comptes-statut', JSON.stringify(ov)); } catch (e2) {} }
    else { var l = this.comptesCreesGet(); var i = l.map(function (x) { return x.id; }).indexOf(c.id); if (i !== -1) l[i] = c; else l.unshift(c); this.comptesCreesPut(l); }
    this._compteNoter(evt, c, extra); return c;
  },
  // ① CRÉER — depuis le formulaire de l'app de l'espace. Renvoie {ok, compte} ou {ok:false, motif}.
  compteCreer: function (espace, form) {
    var E = this.ESPACES_COMPTE[espace]; if (!E) return { ok: false, motif: 'Espace inconnu' };
    form = form || {};
    // (10/09 — lot 4) l'espace COMMERCIAL n'avait aucune porte : aucun écran ne pouvait créer un compte, seul le compte de démo y entrait
    var requis = { client: ['tel'], marque: ['email'], partenaire: ['enseigne', 'adresse', 'cp', 'ville', 'tel', 'email', 'responsable', 'siret'], manager: ['email', 'role', 'nom'], hotline: ['email', 'nom'] }[espace] || [];
    var _req = form.invite ? ['email'] : (requis || []);   // `requis` est DÉJÀ le tableau de cet espace
    /* (24/09, fondatrice : « créer un compte avec Google, Apple, et finir les détails de l'inscription plus tard » — « pareil pour
       devenir partenaire ») LA CANDIDATURE PAR ÉTAPES : le compte d'un partenaire naît de sa seule adresse (et d'un mot de passe,
       ou de Google / Apple) ; son activité, son gérant, ses pièces et ses engagements viennent ensuite, un par un
       (partenaireActiviteSet, partenaireGerantSet, …), et la candidature part en vérification quand tout y est. */
    var parEtapes = espace === 'partenaire' && !form.invite && !!(form.etapes || form.sso);
    if (parEtapes) _req = ['email'];
    /* (19/09, soir) UN DISTRIBUTEUR MOBILE N'A PAS D'ADRESSE : il se déplace. La lui demander, c'est exiger un
       domicile pour exercer — et l'inscrire sur une carte où il n'est pas. Il a une ZONE, posée à côté. */
    if (espace === 'partenaire' && form.mode === 'mobile') _req = _req.filter(function (k) { return k !== 'adresse' && k !== 'cp'; });
    var manque = _req.filter(function (k) { return !String(form[k] || '').trim(); });   // invitation : e-mail seul, le reste est complété à l'activation
    if (manque.length) return { ok: false, motif: 'Champs manquants : ' + manque.join(', ') };
    var identifiant = espace === 'client' ? String(form.tel).replace(/\D/g, '') : String(form.identifiant || form.email || '').trim().toLowerCase();
    if (!identifiant) return { ok: false, motif: 'Identifiant requis' };
    // (09/09 — audit manager↔agent) un compte REFUSÉ peut recandidater : le même identifiant repart « à vérifier » avec le nouveau dossier (journal recandidature)
    var deja = this.compteParIdentifiant(espace, identifiant);
    if (deja && deja.statut === 'refuse') {
      var profilR = Object.assign({}, form); delete profilR.motdepasse; delete profilR.motdepasse2;
      if (!profilR.nom && profilR.enseigne) profilR.nom = profilR.enseigne;
      this._compteMaj(deja, { statut: 'a_verifier', profil: profilR, motdepasse: form.motdepasse || deja.motdepasse, verifs: {}, motifRefus: '', recandidatureAt: Date.now() }, 'compte_recandidature', { par: 'utilisateur' });
      return { ok: true, compte: deja, codes: this.compteCodes(deja), recandidature: true };
    }
    if (deja) return { ok: false, motif: 'Un compte existe déjà avec cet identifiant' };
    var minMdp = this.compteMdpMin(espace);
    // (03/09) INVITATION d'un espace à mot de passe (fournisseur invité par le manager) : pas de mot de passe à la
    // création — la personne le choisit depuis son lien d'activation (compteActiverInvitation).
    var invite = !!form.invite || espace === 'manager' || espace === 'hotline';   // un manager et un conseiller hotline entrent par invitation
    /* (24/09) GOOGLE / APPLE : l'adresse vérifiée par le fournisseur d'identité tient lieu de code e-mail, et aucun mot de
       passe n'est créé — c'est le fournisseur qui authentifie. */
    var sso = (form.sso && this.SSO_FOURNISSEURS[form.sso]) ? form.sso : null;
    /* (06/09) CLIENT : le mot de passe est le sien, mais il n'est pas exigé ICI — l'onboarding
       Fly ouvre un compte sur le seul numéro, et le mot de passe se choisit à l'inscription Mode
       ou depuis « mot de passe oublié ». Un compte sans mot de passe choisi retombe sur celui de
       DÉMO (compteMdpDemo), affiché comme tel à l'écran. Sa longueur minimale lui est propre :
       ref.connexion.motDePasseMin, pas la règle des accès professionnels. */
    if (E.motdepasse && !invite && !sso && espace !== 'client' && String(form.motdepasse || '').length < minMdp) return { ok: false, motif: 'Mot de passe : ' + minMdp + ' caractères minimum' };
    if (espace === 'client' && form.motdepasse != null && String(form.motdepasse).length < minMdp) return { ok: false, motif: 'Mot de passe : ' + minMdp + ' caractères minimum' };
    if (espace === 'fournisseur' && !invite && String(form.siren).replace(/\s/g, '').length !== 9) return { ok: false, motif: 'SIREN : 9 chiffres' };   // un invité complète son SIREN à l'activation
    if (espace === 'partenaire' && !invite && !parEtapes && !this.siretValide(form.siret)) return { ok: false, motif: 'SIRET obligatoire : 14 chiffres, et la clé doit tomber juste (c\'est la pièce du contrôle KYB et du contrat de distribution)' };   // (18/09 ; 23/09 : meme regle que le reseau des marques)
    var profil = Object.assign({}, form); delete profil.motdepasse; delete profil.motdepasse2;
    /* (11/09) le SIRET se RANGE COMPACT, comme l'IBAN : « 123 456 789 00012 » et « 12345678900012 » sont le
       même établissement, et un rapprochement avec le Kbis ne doit pas échouer sur des espaces. */
    if (profil.siret) profil.siret = String(profil.siret).replace(/[\s.]/g, '');
    if (profil.siren) profil.siren = String(profil.siren).replace(/[\s.]/g, '');
    if (!profil.nom && profil.enseigne) profil.nom = profil.enseigne;
    if (parEtapes) { profil.etapes = true; delete profil.sso; }
    if (espace === 'client' && !profil.prenom) { profil.prenom = ''; profil.nom = 'Client'; }   // onboarding Fly : le nom arrive APRÈS le code SMS (compteProfilMaj)
    else if (espace === 'client') profil.nom = profil.prenom + ' ' + String(profil.nom).charAt(0).toUpperCase() + '.';
    var seq = 1; try { seq = parseInt(localStorage.getItem('pec-comptes-seq') || '0', 10) + 1; localStorage.setItem('pec-comptes-seq', String(seq)); } catch (e) {}
    var c = { id: 'cpt-' + espace + '-' + String(seq).padStart(3, '0'), seed: false, espace: espace, identifiant: identifiant, motdepasse: E.motdepasse ? (form.motdepasse || null) : null,
      statut: E.verifs.length ? 'a_verifier' : E.initial, verifs: { sms: false, email: false, kyb: false, kyc: false, documents: false, habilitation: false }, profil: profil, refId: null, creeAt: Date.now(), journal: [] };
    if (invite) { c.statut = 'invite'; c.invitePar = form.invitePar || 'manager'; c.inviteExpireAt = Date.now() + ((this.ref && this.ref.invitations && this.ref.invitations.validiteH) || 72) * 3600000; }
    this._compteMaj(c, {}, 'compte_cree');
    if (sso) this._compteMaj(c, { sso: { fournisseur: sso, email: identifiant, lieLe: Date.now() }, verifs: Object.assign({}, c.verifs, { email: true }),
      statut: (E.verifs || []).filter(function (k) { return k !== 'email'; }).length ? c.statut : this._compteApresVerifs(c) }, 'compte_sso', { fournisseur: sso });
    // (24/09) la fiche de la MARQUE naît en brouillon avec son compte : l'inscription se termine ensuite, étape par étape
    if (espace === 'marque' && !invite) { try { this._compteLierMetier(c, 'inscription'); } catch (eM) {} }
    // Un CLIENT n'a rien à faire valider (ESPACES_COMPTE.client.validation = []) : il entre
    // dans son référentiel TOUT DE SUITE, avec un espace vide qui est le SIEN. Sans cette
    // liaison, refId restait null et l'app retombait sur le client de démo — le nouvel
    // inscrit lisait les commandes de quelqu'un d'autre.
    if (espace === 'client' && !invite) { try { this._compteLierMetier(c, 'inscription'); } catch (eL) {} }
    return { ok: true, compte: c, codes: this.compteCodes(c) };
  },
  /* ══ MOT DE PASSE CLIENT (06/09) ═══════════════════════════════════════════════════
     Les 30 clients du référentiel n'ont jamais choisi de mot de passe : on leur en dérive
     un, stable et lisible, affiché comme « mot de passe de démo » exactement comme le code
     d'accès des comptes fournisseurs. Rien d'inventé — une convention de démonstration,
     dite comme telle à l'écran. */
  compteMdpDemo: function (c) {
    var h = 0, str = String(c.id) + '|mdp';
    for (var i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) % 1000003;
    return 'Client!' + String(1000 + (h % 9000));
  },
  // Le mot de passe ATTENDU pour ce compte : celui qu'il a choisi, sinon celui de démo.
  compteMdpAttendu: function (c) {
    if (c && c.motdepasse) return String(c.motdepasse);
    return (c && c.espace === 'client') ? this.compteMdpDemo(c) : null;
  },
  /* MOT DE PASSE OUBLIÉ — c'est ici, et seulement ici (avec l'inscription), qu'un SMS part.
     Le code renvoyé est celui qu'attend compteVerifier : en maquette l'écran l'affiche,
     en production il est remis au routeur SMS. */
  /* (24/09) UNE RÈGLE DE MOT DE PASSE PAR ESPACE, la même à la création, à l'activation d'une invitation et à la
     réinitialisation : l'utilisateur de Mes bons suit ref.connexion, les comptes professionnels ref.invitations. Un
     commerce créait son mot de passe à 10 caractères et pouvait le réinitialiser à 8 : deux règles pour une porte. */
  compteMdpMin: function (espace) {
    return espace === 'client' ? +this.ref.connexion.motDePasseMin : +this.ref.invitations.motDePasseMin;
  },
  /* (24/09) LE CODE PART PAR LE CANAL QUE L'ESPACE VÉRIFIE : le SMS pour l'utilisateur de Mes bons, l'e-mail pour une
     marque ou un commerce — jamais un SMS vers un numéro que personne n'a vérifié. */
  _compteCanalReinit: function (c) { return ((this.ESPACES_COMPTE[c.espace] || {}).verifs || [])[0] || 'email'; },
  compteMotDePasseOublie: function (espace, identifiant) {
    var c = this.compteParIdentifiant(espace, identifiant);
    if (!c) return { ok: false, motif: 'Aucun compte avec cet identifiant' };
    if (c.statut === 'suspendu') return { ok: false, motif: 'Compte suspendu — contacte PayEnCash', compte: c };
    var canal = this._compteCanalReinit(c);
    try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('mdp_code_envoye', c.id, { espace: espace, identifiant: c.identifiant, canal: canal }); } catch (e) {}
    return { ok: true, compte: c, code: this.compteCode(c, canal), canal: canal };
  },
  compteMotDePasseReinitialiser: function (id, code, nouveau) {
    var c = this.compte(id); if (!c) return { ok: false, motif: 'Compte inconnu' };
    var canal = this._compteCanalReinit(c);
    if (String(code) !== this.compteCode(c, canal)) return { ok: false, motif: 'Code incorrect' };
    var min = this.compteMdpMin(c.espace);
    if (String(nouveau || '').length < min) return { ok: false, motif: 'Mot de passe : ' + min + ' caractères minimum' };
    // le canal vient d'être re-prouvé par le code : sa vérification vaut faite
    var verifs = Object.assign({}, c.verifs); verifs[canal] = true;
    this._compteMaj(c, { motdepasse: String(nouveau), verifs: verifs }, 'mdp_reinitialise');
    return { ok: true, compte: this.compte(id) };
  },
  // Changer son mot de passe depuis son compte : l'ancien est exigé (ou celui de démo).
  compteMotDePasseChanger: function (id, ancien, nouveau) {
    var c = this.compte(id); if (!c) return { ok: false, motif: 'Compte inconnu' };
    if (String(ancien || '') !== String(this.compteMdpAttendu(c) || '')) return { ok: false, motif: 'Mot de passe actuel incorrect' };
    var min = (this.ref && this.ref.connexion && this.ref.connexion.motDePasseMin) || 8;
    if (String(nouveau || '').length < min) return { ok: false, motif: 'Mot de passe : ' + min + ' caractères minimum' };
    if (String(nouveau) === String(ancien)) return { ok: false, motif: 'Le nouveau mot de passe doit être différent' };
    this._compteMaj(c, { motdepasse: String(nouveau) }, 'mdp_change');
    return { ok: true, compte: this.compte(id) };
  },

  // ② VÉRIFIER — code SMS / e-mail (démo : code DÉTERMINISTE dérivé du compte, affiché par l'écran comme « code de démo »)
  /* (24/09, soir — audit zéro dur) LA LONGUEUR D'UN CODE DE VÉRIFICATION est celle du référentiel (ref.otp.longueur) : le générateur, les champs
     de saisie (otpAppliquer) et les textes la lisent au même endroit. Déterministe (démo) : le même compte et le même canal donnent le même code. */
  _codeChiffres: function (graine) { var n = +this.ref.otp.longueur, min = Math.pow(10, n - 1), h = 0, s = String(graine);
    for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) % 1000003; return String(min + (h % (9 * min))); },
  compteCode: function (c, canal) { return this._codeChiffres(String(c.id) + '|' + canal); },
  compteCodes: function (c) { var d = this, o = {}; ((this.ESPACES_COMPTE[c.espace] || {}).verifs || []).forEach(function (k) { o[k] = d.compteCode(c, k); }); return o; },
  /* L'ÉTAT D'UN COMPTE DONT LES CODES SONT CONFIRMÉS : actif, ou à valider par PayEnCash — sauf la candidature par étapes d'un
     partenaire (24/09), qui reste « inscription en cours » tant qu'elle n'est pas envoyée : le manager ne voit pas dans sa file un
     dossier que son auteur n'a pas fini d'écrire. */
  _compteApresVerifs: function (c) {
    var E = this.ESPACES_COMPTE[c.espace] || {};
    if (c.espace === 'partenaire' && c.profil && c.profil.etapes && !c.profil.candidatureEnvoyeeLe) return 'inscription';
    return (E.validation && E.validation.length) ? 'a_valider' : 'actif';
  },
  compteVerifier: function (id, canal, code) {
    var c = this.compte(id); if (!c) return { ok: false, motif: 'Compte inconnu' };
    if (String(code) !== this.compteCode(c, canal)) return { ok: false, motif: 'Code incorrect' };
    var E = this.ESPACES_COMPTE[c.espace], verifs = Object.assign({}, c.verifs); verifs[canal] = true;
    var restent = (E.verifs || []).filter(function (k) { return !verifs[k]; });
    var patch = { verifs: verifs };
    if (!restent.length) patch.statut = this._compteApresVerifs(c);
    this._compteMaj(c, patch, 'compte_verifie', { canal: canal });
    // un CLIENT existe dès que son téléphone est confirmé (l'e-mail peut venir après — la porte « compte vérifié » le réclamera avant la 1ʳᵉ commande)
    if (c.statut === 'actif' || (c.espace === 'client' && verifs.sms)) this._compteLierMetier(c, 'auto');
    this._clientVerifSync(c);
    return { ok: true, compte: c, restent: restent };
  },
  // ③ VALIDER / REFUSER — le MANAGER (KYB, KYC, documents, habilitation) ; validé = entre dans le référentiel métier
  /* (10/09 — lot 4 comptes/KYB ; 18/09, soir) LE DOSSIER D'UN CANDIDAT — une seule lecture pour les espaces qui en
     ont un (fournisseur, partenaire ; la portée `agent` est partie avec l'agent de caisse mobile). Deux choses changent :
     ① LE COFFRE SEUL FAIT FOI, ET SEULE UNE PIÈCE CONTRÔLÉE COMPTE. Une pièce DÉCLARÉE (un nom de fichier tapé à la
        candidature) ou DÉPOSÉE MAIS JAMAIS OUVERTE valait « fournie » : on validait un compte — et on délivrait une
        habilitation à encaisser — sur un dossier dont pas un fichier n'avait été regardé. Une pièce obligatoire doit
        être VALIDÉE au coffre (PEC_DOCS.statuer, écran 42).
     ② LES DEUX ESPACES, PAS UN SEUL. La validation d'un fournisseur ne lisait RIEN : elle posait
        `verifs.kyb = true`, et la fiche naissait « KYB valide » — pendant que le coffre affichait « 0 / 5 pièces ».
     Les DOCUMENTS GÉNÉRÉS viennent APRÈS l'entrée : ils ne manquent pas à la candidature.
     Le contrat-cadre du fournisseur, lui, précède la validation (le contrat le dit : il entre en vigueur après). */
  PORTEE_DOSSIER: { fournisseur: 'fournisseur', partenaire: 'partenaire' },   // (18/09) le dossier du commerçant partenaire (Kbis, gérant, vidéo)
  dossierCandidat: function (c) {
    var vide = { ok: true, manquantes: [], refusees: [], enAttente: [], portee: null, coffre: 0, total: 0, sansDossier: true };
    if (!c) return Object.assign({}, vide, { ok: false, sansDossier: false });
    var portee = this.PORTEE_DOSSIER[c.espace] || null;
    if (!portee) return vide;
    if (c.seed) return vide;   // compte du référentiel d'origine : dossier papier antérieur au coffre
    var id = c.refId || c.id;   // avant liaison : l'id du compte ; après : l'id métier (le dossier a suivi)
    var pieces = [];
    try { pieces = (window.PEC_DOCS && PEC_DOCS.dossier) ? PEC_DOCS.dossier(portee, id) : []; } catch (e) { return vide; }
    var genereRequis = portee === 'fournisseur';   // le contrat-cadre se signe AVANT la validation ; le contrat de travail, après
    var manquantes = [], refusees = [], enAttente = [], coffre = 0, total = 0;
    pieces.forEach(function (p) {
      if (!p.obligatoire) return;
      if (p.genere && !genereRequis) return;
      total++;
      if (p.document) coffre++;
      if (p.statut === 'validee' && (!p.genere || p.signe)) return;
      if (p.statut === 'refusee') { refusees.push(p.label); return; }
      if (p.statut === 'deposee') { enAttente.push(p.label); return; }
      manquantes.push(p.label);
    });
    return { ok: !manquantes.length && !refusees.length && !enAttente.length, manquantes: manquantes, refusees: refusees, enAttente: enAttente, portee: portee, coffre: coffre, total: total, sansDossier: false };
  },
  compteValider: function (id, par, verifs) {
    var c = this.compte(id); if (!c) return { ok: false, motif: 'Compte inconnu' };
    if (c.statut === 'actif') return { ok: true, compte: c };
    var v = Object.assign({}, c.verifs, verifs || {});
    /* (10/09 — lot 4) LE DOSSIER SE LIT AVANT DE VALIDER — dans les trois espaces, plus seulement chez l'agent. La branche
       fournisseur cochait `verifs.kyb` sans rien regarder : le manager « validait le KYB » d'un dossier qui
       n'existait pas encore, et 40 affichait « ✓ KYB » pendant que 26 affichait « dossier incomplet ». */
    var dos = this.dossierCandidat(c);
    if (!dos.sansDossier && !dos.ok) {
      var quoi = [];
      if (dos.manquantes.length) quoi.push('il manque ' + dos.manquantes.join(', '));
      if (dos.refusees.length) quoi.push((dos.refusees.length > 1 ? 'refusées : ' : 'refusée : ') + dos.refusees.join(', '));
      if (dos.enAttente.length) quoi.push('à contrôler : ' + dos.enAttente.join(', ') + ' (ouvre les pièces dans Vérifications)');
      return { ok: false, motif: 'Dossier incomplet : ' + quoi.join(' · ') + '.', dossier: dos };
    }
    ((this.ESPACES_COMPTE[c.espace] || {}).validation || []).forEach(function (k) { v[k] = !dos.sansDossier ? dos.ok : true; });
    /* (10/09 — E6 1.2) LA TRACE DU CONTRÔLE : quelles pièces ont été validées, par qui, et quand — relevée AU MOMENT de
       la décision. Sans elle, « dossier contrôlé » n'était qu'une affirmation de l'écran. */
    var controle = null;
    try {
      if (!dos.sansDossier && window.PEC_DOCS) {
        controle = { par: par || 'manager', at: Date.now(), session: (c.session && c.session.date) || null,
          pieces: PEC_DOCS.dossier(dos.portee, c.refId || c.id).filter(function (pp) { return pp.statut === 'validee'; })
            .map(function (pp) { return { piece: pp.id, label: pp.label, par: (pp.document || {}).statuePar || null, at: (pp.document || {}).statueAt || null }; }) };
      }
    } catch (eC) {}
    this._compteMaj(c, { statut: 'actif', verifs: v, valideAt: Date.now(), validePar: par || 'manager', controle: controle }, 'compte_valide', { par: par || 'manager', pieces: controle ? controle.pieces.length : 0 });
    this._compteLierMetier(c, par || 'manager');
    return { ok: true, compte: c };
  },
  compteRefuser: function (id, motif, par) { var c = this.compte(id); if (!c) return null; if (!String(motif || '').trim()) return { ok: false, motif: 'Un refus se motive — le candidat lit le motif.' }; return this._compteMaj(c, { statut: 'refuse', motifRefus: String(motif).trim() }, 'compte_refuse', { motif: String(motif).trim(), par: par || 'manager' }); },   // (09/09) motif obligatoire, des deux écrans
  /* (11/09) `compteCloturer` RETIRÉ. L'audit du 09/09 le signalait déjà mort (« 05 passe par agentCloturer ») et il
     était en plus faux : sur un fournisseur, `_compteSyncMetier` lui RENDAIT son accès. Les fins de relation ont
     chacune leur chemin vivant et testé (fournisseurResilier), et chacune clôt le compte associé. Une seule porte
     par cas. (18/09, soir : `agentCloturer` — la fin de contrat d'un agent — est partie avec l'agent de caisse mobile.) */
  compteRouvrir: function (id, par) { var c = this.compte(id); if (!c || c.statut !== 'refuse') return null; return this._compteMaj(c, { statut: 'a_valider', motifRefus: '' }, 'compte_rouvert', { par: par || 'manager' }); },
  compteSuspendre: function (id, par) { var c = this.compte(id); if (!c) return null; this._compteMaj(c, { statut: 'suspendu' }, 'compte_suspendu', { par: par || 'manager' }); this._compteSyncMetier(c); return c; },
  compteReactiver: function (id, par) { var c = this.compte(id); if (!c) return null; this._compteMaj(c, { statut: 'actif' }, 'compte_reactive', { par: par || 'manager' }); this._compteSyncMetier(c); return c; },
  compteActiverInvitation: function (id, motdepasse, form) {
    var c = this.compte(id); if (!c) return { ok: false, motif: 'Invitation inconnue' };
    if (c.statut !== 'invite') return { ok: false, motif: 'Invitation déjà utilisée' };
    if (c.inviteExpireAt && Date.now() > c.inviteExpireAt) return { ok: false, motif: 'Invitation expirée' };
    var minMdp = this.compteMdpMin(c.espace);
    if (String(motdepasse || '').length < minMdp) return { ok: false, motif: 'Mot de passe : ' + minMdp + ' caractères minimum' };
    // un FOURNISSEUR invité complète son dossier ici (SIREN, dirigeant, ville) puis part en validation KYB
    var E = this.ESPACES_COMPTE[c.espace] || {}, profil = Object.assign({}, c.profil || {}, form || {});
    if (c.espace === 'fournisseur') {
      if (String(profil.siren || '').replace(/\s/g, '').length !== 9) return { ok: false, motif: 'SIREN : 9 chiffres' };
      if (!String(profil.dirigeant || '').trim() || !String(profil.ville || '').trim()) return { ok: false, motif: 'Dirigeant et ville requis' };
    }
    var statut = (E.validation && E.validation.length) ? 'a_valider' : 'actif';
    this._compteMaj(c, { statut: statut, motdepasse: motdepasse, profil: profil, valideAt: statut === 'actif' ? Date.now() : null }, 'compte_valide', { par: 'invitation' });
    if (statut === 'actif') this._compteLierMetier(c, 'invitation');
    return { ok: true, compte: c, aValider: statut === 'a_valider' };
  },
  // Le compte validé ENTRE dans son référentiel métier (une seule fois) — c'est l'échange inter-apps réel
  _compteLierMetier: function (c, par) {
    if (c.refId) return c.refId;
    var d = this, p = c.profil || {}, slug = String(p.enseigne || p.nom || c.identifiant).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) + '-' + c.id.slice(-3);
    var today = new Date(), MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    var dateFr = today.getDate() + ' ' + MOIS[today.getMonth()], moisFr = MOIS[today.getMonth()] + ' ' + today.getFullYear();
    var refId = null;
    try {
      if (c.espace === 'fournisseur') {
        refId = slug;
        var fl = JSON.parse(localStorage.getItem('pec-fournisseurs-crees') || '[]') || [];
        /* (10/09 — lot 4) PLUS DE `kyb: 'valide'` POSÉ À LA CRÉATION : le statut KYB se dérive du coffre (_fournisseurVerite),
           partout. Le poser ici créait la seconde vérité que le KPI « KYB en attente » lisait — un fournisseur sans une seule
           pièce était « Vérifié » dans une tuile et « Dossier incomplet » trois colonnes plus loin. */
        /* (10/09 — lot 8, constat D-47) L'APPORTEUR SUIT LE FOURNISSEUR (`suppliers.recruited_by`). Un atelier
           recruté par un commercial ne portait aucune trace de qui l'avait amené : l'entonnoir de prélancement
           affichait « 120 candidatures » sans que personne puisse dire d'où elles venaient. */
        fl.push({ id: refId, nom: p.enseigne, ville: p.ville, categories: p.categories || ['Prêt-à-porter'], specialites: p.specialites || [], depuis: moisFr, compteId: c.id,
          recrutePar: p.recrutePar || c.invitePar || null,
          /* (11/09 — constat C3) LE MOT DE PASSE N'EST PLUS RECOPIÉ. Celui que l'atelier choisissait à son
             inscription était dupliqué ici, en clair, dans `pec-fournisseurs-crees` : lisible dans le stockage et
             dans n'importe quel export, alors que l'écran prenait soin de le masquer. Le référentiel ne porte que
             le LOGIN et le compte ; l'authentification passe par `compteConnecter`, qui seul détient le secret.
             Les accès de DÉMONSTRATION, eux, gardent un code affichable — c'est leur raison d'être. */
          acces: { login: c.identifiant, code: null, statut: 'actif', compteId: c.id },
          entreprise: { enseigne: p.enseigne, raisonSociale: p.raisonSociale || (p.enseigne + ' SAS'), siren: String(p.siren || '').replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'), ville: p.ville, cp: p.cp || '', adresse: p.adresse || '', dirigeant: p.dirigeant, email: p.email, tel: p.tel || '' } });
        localStorage.setItem('pec-fournisseurs-crees', JSON.stringify(fl));
        try { if (window.PEC_DOCS && PEC_DOCS.transferer) PEC_DOCS.transferer('fournisseur', c.id, refId); } catch (eTf) {}   // le dossier de candidature suit le fournisseur
        // le prospect qui a produit cette candidature pointe vers SON fournisseur : le pipeline et le réseau parlent du même atelier
        try {
          var d8 = this;
          (this.prospectsGet() || []).forEach(function (pr) {
            if (pr.type === 'fournisseur' && !pr.fournisseurId && pr.invitation && pr.invitation.compteId === c.id) d8.prospectEnregistrer({ id: pr.id, fournisseurId: refId }, 'système');
          });
        } catch (ePf) {}
      } else if (c.espace === 'partenaire') {
        /* (18/09) LE COMPTE VALIDÉ REJOINT SON POINT — ou le crée. Un gérant invité à la signature (profil.pointId) rejoint le
           point existant ; un commerce déjà signé par un commercial se retrouve par son SIRET ; sinon un point NAÎT, « contrat
           à signer ». Le dossier de candidature (déposé sous l'id du compte) suit le point. */
        var pP = p.pointId ? this.partenaire(p.pointId) : null;
        if (!pP && p.siret) pP = this.partenaireParSiret(p.siret);
        if (pP) { refId = pP.id; this.partenaireEnregistrer({ id: pP.id, compteId: c.id, tel: pP.tel || p.tel || null, email: pP.email || p.email || null, responsable: pP.responsable || p.responsable || null }, par); }
        else {
          refId = this._partenaireNouvelId();
          /* (19/09, soir) LE MODE D'EXERCICE SUIT L'INSCRIPTION : commerce ou distributeur mobile. Un mobile
             n'a pas d'adresse — il porte la ZONE qu'il a lui-même choisie, et c'est elle qui dira quelles
             demandes de rencontre peuvent lui être proposées. */
          var _mode = p.mode === 'mobile' ? 'mobile' : 'sedentaire';
          var _zone = null;
          if (_mode === 'mobile') {
            var _noms = {}; this.zoneVillesRef().forEach(function (v) { _noms[v.nom] = 1; });
            var _vl = (p.zoneVilles || []).filter(function (v) { return _noms[v]; });
            var _ry = Math.round(Number(p.zoneRayonKm) || 0);
            _zone = { villes: _vl, rayonKm: _ry > 0 ? _ry : null };
          }
          if (!this.partenaireEnregistrer({ id: refId, enseigne: p.enseigne, adresse: _mode === 'mobile' ? '' : (p.adresse || ''), cp: p.cp || '', ville: p.ville || '', tel: p.tel || null, email: p.email || null,
            responsable: p.responsable || null, siret: p.siret || null, statut: 'contrat_a_signer', compteId: c.id, origine: 'inscription', creeAt: Date.now(),
            mode: _mode, zone: _zone,
            /* (24/09) l'identité légale et le gérant de la candidature par étapes suivent le point : la raison sociale signe le
               contrat de distribution, le gérant (civilité, naissance, qualité) est celui dont la pièce a été contrôlée */
            raisonSociale: p.raisonSociale || null, gerant: p.gerant || null }, par)) return null;
        }
        try { if (window.PEC_DOCS && PEC_DOCS.transferer) PEC_DOCS.transferer('partenaire', c.id, refId); } catch (eTp) {}
        this._revendeurSuitPoint(refId, par);   // (23/09, nuit) sa fiche de vente naît avec lui, « en attente » jusqu'à l'activation
      } else if (c.espace === 'marque') {
        refId = this._techMarchandBrouillon(c);
        if (!refId) return null;
      } else if (c.espace === 'client') {
        var cl = JSON.parse(localStorage.getItem('pec-clients-crees') || '[]') || [];
        /* (11/09) le numéro ne se rejoue pas : la suppression RGPD libérait « cl33 » et la personne
           suivante héritait des favoris, de la fidélité et du RIB scellés sous cet identifiant. */
        /* le plancher s'exprime dans l'espace du COMPTEUR, pas dans celui de l'identifiant :
           « cl31 » = 1er client créé (les 30 premiers sont le référentiel), donc compteur 1. */
        var nCl = this._seq('clients', Math.max(0, this._seqPlancher(cl, '^cl0*(\\d+)$') - 30));
        if (nCl == null) return null;
        refId = 'cl' + String(30 + nCl).padStart(2, '0');
        var tel8 = String(c.identifiant).replace(/\D/g, '').slice(-8);
        cl.push({ id: refId, canonique: false, civilite: p.civilite || '', prenom: p.prenom, nom: p.nom.replace(/^.*\s/, ''), nomComplet: p.nom, genre: p.genre || 'femme', dateNaissance: p.dateNaissance || '', tel: '06 •• •• •• ' + tel8.slice(-2), telComplet: String(c.identifiant), email: p.email, ville: p.ville || '', cp: p.cp || '', adresse: p.adresse || '', relais: '', tailles: { pap: p.taillePap || 'M', sneakers: p.tailleSneakers || '40' }, inscrit: dateFr, statut: 'actif', verif: { sms: !!c.verifs.sms, email: !!c.verifs.email }, favoris: [], commandes: [], fidelite: [], cagnotte: 0, compteId: c.id });
        localStorage.setItem('pec-clients-crees', JSON.stringify(cl));
        if (this.mode && this.mode.clients) this.mode.clients = null;   // force la reconstruction avec le nouveau compte
      }
    } catch (e) {}
    if (refId) this._compteMaj(c, { refId: refId }, 'compte_lie', { refId: refId });
    return refId;
  },
  _compteSyncMetier: function (c) {
    try {
      if (c.espace === 'client' && c.refId && this.clientStatutSet) this.clientStatutSet(c.refId, c.statut === 'suspendu' ? 'suspendu' : 'actif');
      /* (10/09 — lot 4) RÉACTIVER NE FABRIQUE PLUS UN POINT ACTIF. La synchro écrivait « actif » dès que le compte n'était pas
         suspendu : un fournisseur suspendu puis réactivé en 40 revenait ACTIF quel que soit son état d'avant, et une
         CLÔTURE de compte le rendait actif elle aussi. On mémorise l'état d'avant la suspension et on le restaure ;
         un compte clos ferme le métier. */
      if (c.espace === 'fournisseur' && c.refId && this.fournisseurAccesSet) {
        var fA = (this.fournisseur(c.refId) || {}).acces || {};
        if (c.statut === 'suspendu') this.fournisseurAccesSet(c.refId, { statut: 'suspendu', statutAvant: fA.statut === 'suspendu' ? (fA.statutAvant || 'actif') : (fA.statut || 'actif') });
        else if (c.statut === 'clos') this.fournisseurAccesSet(c.refId, { statut: 'clos' });
        else if (c.statut === 'actif') this.fournisseurAccesSet(c.refId, { statut: fA.statutAvant || 'actif', statutAvant: null });
      }
    } catch (e) {}
  },
  // ④ CONNEXION — un seul point d'entrée pour tous les espaces : vérifie le compte, son statut, pose la session de l'espace
  /* ── JOURNAL DE CONNEXION (fondatrice 05/09 : « de vrais logs de connexion pour chaque
        espace ») : chaque TENTATIVE est consignée — les ÉCHECS autant que les réussites, sinon
        le journal ne sert à rien le jour où quelqu'un essaie d'entrer. Conservé localement,
        borné par le référentiel, et poussé au bus pour l'audit du manager. ── */
  connexionsGet: function (filtre) {
    var l = []; try { l = JSON.parse(localStorage.getItem('pec-connexions') || '[]') || []; } catch (e) {}
    filtre = filtre || {};
    return l.filter(function (x) {
      if (filtre.espace && x.espace !== filtre.espace) return false;
      if (filtre.identifiant && String(x.identifiant || '').toLowerCase() !== String(filtre.identifiant).toLowerCase()) return false;
      if (filtre.echecsSeuls && x.ok) return false;
      if (filtre.depuis && x.at < filtre.depuis) return false;
      return true;
    });
  },
  connexionNoter: function (o) {
    var l = []; try { l = JSON.parse(localStorage.getItem('pec-connexions') || '[]') || []; } catch (e) {}
    var max = ((this.ref && this.ref.securite && this.ref.securite.journalConnexionsMax) || 500);
    l.unshift(Object.assign({ at: Date.now() }, o || {}));
    if (l.length > max) l = l.slice(0, max);
    if (!this._ecrit('pec-connexions', l)) return null;
    try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter(o.ok ? 'connexion' : 'connexion_echec', o.compteId || o.identifiant, { espace: o.espace, identifiant: o.identifiant, motif: o.motif || '' }); } catch (e3) {}
    try { window.dispatchEvent(new Event('pec-bus')); } catch (e4) {}
    return l[0];
  },
  connexionsPurger: function () { try { localStorage.removeItem('pec-connexions'); } catch (e) {} },
  // Le libellé de l'espace, tel qu'il s'affiche dans le journal
  connexionEspaceLbl: function (espace) { return ((this.ESPACES_COMPTE[espace] || {}).label) || espace || '—'; },
  // La connexion réelle passe par ici : on consigne AVANT de rendre la main, quel que soit le sort.
  /* ══ (24/09) CONTINUER AVEC GOOGLE / APPLE — créer le compte s'il n'existe pas, puis l'ouvrir ═════════════════════════
     En production, c'est le jeton OpenID Connect du fournisseur qui porte l'adresse vérifiée ; en maquette, l'écran
     demande l'adresse et le dit. Le compte naît vérifié (le fournisseur a vérifié l'adresse), sans mot de passe. */
  SSO_FOURNISSEURS: { google: 'Google', apple: 'Apple' },
  compteSso: function (espace, fournisseur, email) {
    if (!this.SSO_FOURNISSEURS[fournisseur]) return { ok: false, motif: 'Fournisseur d’identité inconnu.' };
    var mail = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail)) return { ok: false, champ: 'email', motif: 'Adresse e-mail non valide.' };
    var nouveau = false;
    if (!this.compteParIdentifiant(espace, mail)) {
      var cr = this.compteCreer(espace, { email: mail, sso: fournisseur });
      if (!cr.ok) return cr;
      nouveau = true;
    }
    return Object.assign({ nouveau: nouveau }, this.compteConnecter(espace, mail, null, { sso: fournisseur }));
  },
  compteConnecter: function (espace, identifiant, motdepasse, o) {
    var r = this._compteConnecterBrut(espace, identifiant, motdepasse, o) || { ok: false, motif: 'échec' };
    var c = r.compte || null;
    this.connexionNoter({ espace: espace, identifiant: String(identifiant || ''), compteId: c ? c.id : null,
      nom: (c && c.profil && (c.profil.nom || c.profil.enseigne)) || null,
      ok: !!r.ok, motif: r.ok ? '' : (r.motif || 'échec'),
      appareil: (typeof navigator !== 'undefined' && navigator.platform) ? navigator.platform : '' });
    return r;
  },
  _compteConnecterBrut: function (espace, identifiant, motdepasse, o) {
    var E = this.ESPACES_COMPTE[espace]; if (!E) return { ok: false, motif: 'Espace inconnu' };
    var c = this.compteParIdentifiant(espace, identifiant);
    if (!c) return { ok: false, motif: 'Identifiant inconnu' };
    if (c.statut === 'invite') return { ok: false, motif: 'Invitation à activer : crée ton mot de passe', compte: c };
    /* (24/09) ON AUTHENTIFIE AVANT DE PARLER DE L'ÉTAT DU COMPTE. Les refus disaient « suspendu », « en attente de validation »,
       « confirme d'abord ton code » à quiconque tapait une adresse — sans mot de passe : l'état d'un compte se lisait de
       l'extérieur, et une candidature pouvait être reprise par n'importe qui. Le mot de passe (ou Google / Apple) d'abord ;
       l'état ensuite, et seulement à son titulaire. */
    /* (06/09) le client entre avec un MOT DE PASSE — plus un SMS à chaque connexion. Les comptes du référentiel, qui n'en ont
       jamais choisi, ont un mot de passe de démo dérivé (dit à l'écran). (24/09) PAR GOOGLE / APPLE, le fournisseur d'identité a
       déjà authentifié la personne : pas de mot de passe à comparer. Un compte ouvert avec un mot de passe se RELIE au fournisseur
       la première fois (même adresse vérifiée). */
    if (o && o.sso && this.SSO_FOURNISSEURS[o.sso]) {
      if (!c.sso && c.statut !== 'supprime') this._compteMaj(c, { sso: { fournisseur: o.sso, email: c.identifiant, lieLe: Date.now() } }, 'compte_sso', { fournisseur: o.sso });
    } else if (E.motdepasse) {
      if (c.sso && !c.motdepasse) return { ok: false, motif: 'Ce compte s’ouvre avec ' + this.SSO_FOURNISSEURS[c.sso.fournisseur] + ' : utilise le bouton « Continuer avec ' + this.SSO_FOURNISSEURS[c.sso.fournisseur] + ' ».', compte: c };
      var attendu = this.compteMdpAttendu(c);
      if (String(motdepasse || '') !== String(attendu || '')) return { ok: false, motif: 'Mot de passe incorrect' };
    }
    if (c.statut === 'suspendu') return { ok: false, motif: 'Compte suspendu — contacte PayEnCash', compte: c };
    if (c.statut === 'refuse') return { ok: false, motif: 'Demande refusée' + (c.motifRefus ? ' : ' + c.motifRefus : ''), compte: c };
    if (c.statut === 'clos') return { ok: false, motif: 'Contrat terminé' + (c.motifClos ? ' (' + c.motifClos + ')' : '') + ' — accès fermé, tes bulletins restent disponibles auprès de PayEnCash', compte: c };   // (09/09)
    if (c.statut === 'supprime') return { ok: false, motif: 'Compte supprimé', compte: c };
    // (24/09) une candidature par étapes pas encore envoyée : elle se REPREND, là où elle s'était arrêtée
    if (c.statut === 'inscription') return { ok: false, inscription: true, compte: c, motif: 'Ta candidature n’est pas terminée : elle reprend où tu l’as laissée.' };
    if (c.statut === 'a_valider') {
      /* (10/09 — lot 4) LE REFUS D'UNE PIÈCE N'EST PLUS UN CUL-DE-SAC. Une pièce refusée laissait le compte « à valider » :
         la connexion se refusait sans un mot, le candidat ne pouvait ni lire le motif, ni remplacer la pièce, ni
         recandidater — son dossier restait bloqué pour toujours. Le refus se DIT, avec ce qu'il faut refaire. */
      var dosC = this.dossierCandidat(c);
      if (!dosC.sansDossier && (dosC.refusees.length || dosC.manquantes.length)) {
        return { ok: false, aCompleter: true, dossier: dosC, compte: c,
          motif: 'Ton dossier est à compléter avant validation : ' + (dosC.refusees.length ? (dosC.refusees.length > 1 ? 'pièces refusées — ' : 'pièce refusée — ') + dosC.refusees.join(', ') : '') + (dosC.refusees.length && dosC.manquantes.length ? ' · ' : '') + (dosC.manquantes.length ? (dosC.manquantes.length > 1 ? 'manquantes — ' : 'manquante — ') + dosC.manquantes.join(', ') : '') + '. Reprends ta candidature pour les joindre à nouveau.' };
      }
      return { ok: false, enAttente: true, motif: 'Compte en attente de validation par PayEnCash (dossier envoyé, contrôle en cours)', compte: c };
    }
    if (c.statut === 'a_verifier' && espace !== 'client') return { ok: false, aVerifier: true, motif: 'Confirme d\'abord le code reçu par ' + (E.verifs[0] === 'sms' ? 'SMS' : 'e-mail'), compte: c };
    /* (10/09 — lot 4) SUSPENDRE UN FOURNISSEUR DEPUIS SON ÉCRAN LE DIT. L'écran 26 suspendait le RÉFÉRENTIEL, pas le compte :
       la connexion réussissait, posait la session, puis la page suivante l'effaçait au démarrage — retour à la connexion,
       sans un mot d'explication. La raison se lit ici, au même endroit que les autres refus. */
    if (espace === 'fournisseur' && c.refId) {
      var acF = (this.fournisseur(c.refId) || {}).acces || {};
      if (acF.statut === 'suspendu') return { ok: false, motif: 'Accès fournisseur suspendu par PayEnCash' + (acF.motifSuspension ? ' : ' + acF.motifSuspension : '') + ' — contacte ton interlocuteur.', compte: c };
      if (acF.statut === 'clos') return { ok: false, motif: 'Contrat résilié' + (acF.motifClos ? ' (' + acF.motifClos + ')' : '') + ' — accès fermé.', compte: c };
    }
    // (07/09) manager/hotline : le rôle de session vient de ROLES_MANAGER (libellé) — plus profil.nom,
    // qui pour un manager INVITÉ est le nom de la personne, pas son rôle
    var roleSess = (espace === 'manager' || espace === 'hotline')
      ? ((this.roleManager((c.profil && (c.profil.role || (c.seed ? c.profil.nom : null))) || (espace === 'hotline' ? 'hotline' : 'operateur')) || {}).label || c.identifiant)
      : ((c.profil && (c.profil.nom || c.profil.enseigne)) || c.identifiant);
    var sess = this.connecter({ identifiant: c.identifiant, espace: E.sessionLabel, role: roleSess });
    // RÉPARATION des comptes créés avant la liaison à l'inscription : plutôt que de laisser
    // l'identité précédente en place, on relie maintenant.
    if (!c.refId && (espace === 'client')) { try { this._compteLierMetier(c, 'connexion'); } catch (eR) {} }
    /* On PURGE l'identité de l'occupant précédent AVANT de poser la nouvelle : une connexion
       qui échoue à se lier ne doit pas donner accès au compte d'avant.
       (fondatrice 06/09 « je me suis connectée sur Karim B. […] je suis allée sur le compte
       utilisateur : rien ») ON NE PURGE QUE L'ESPACE CONCERNÉ. On effaçait les QUATRE
       identités : se connecter à un espace pro déconnectait la cliente sans rien lui dire, et sa
       commande en cours devenait invisible au retour côté Mode. Le risque que cette purge
       couvre — repartir sur le compte du précédent occupant — n'existe qu'à l'intérieur d'un
       même espace ; un fournisseur qui se connecte n'a aucune raison de fermer une session cliente. */
    // (18/09) + le point du commerçant partenaire ; (18/09, soir) `agent: 'pec-agent-actif'` est parti avec l'app de l'agent de caisse mobile
    var CLE_ESPACE = { client: 'pec-client-actif', fournisseur: 'pec-fournisseur-actif', partenaire: 'pec-partenaire-id' };
    /* (11/09 — C4/C1) CHANGER DE CLIENTE, C'EST UNE VRAIE DÉCONNEXION. Retirer la seule clé `pec-client-actif`
       laissait en MÉMOIRE le sac et les favoris de la précédente — et depuis que ce qui a été posé HORS session
       est adopté à la connexion, la suivante se les serait vu attribuer. On déconnecte pour de bon d’achat quand
       quelqu'un occupait la place ; s'il n'y avait personne, l'état anonyme reste là pour être adopté. */
    try {
      if (espace === 'client') { if (this.clientActifGet()) this.clientActifSet(null); }
      else if (CLE_ESPACE[espace]) localStorage.removeItem(CLE_ESPACE[espace]);
    } catch (eP) {}
    try {
      // (07/09 — doublon purgé) UNE seule écriture par espace : le setter est le seul
      // maître de sa clé. Avant, le client et le fournisseur étaient posés DEUX fois
      // (setter puis setItem en dur), la seconde écrasant la première.
      if (espace === 'client' && c.refId) this.clientActifSet(c.refId);
      // (18/09) le POINT du compte partenaire devient le point de session — vide (explicite) quand le compte n'est rattaché à aucun point
      if (espace === 'partenaire') { try { localStorage.setItem('pec-partenaire-id', c.refId || ''); } catch (ePt) {} }
      // le fournisseur connecté devient le fournisseur ACTIF de l'appareil : son enseigne vient
      // de son profil, sinon du référentiel via refId, sinon du rôle du compte de démo.
      if (espace === 'fournisseur') {
        var _fn = (c.profil && c.profil.enseigne) || (c.refId && (this.fournisseur(c.refId) || {}).nom) || c.role || c.nom;
        if (_fn) this.fournisseurActifSet(_fn);
      }
    } catch (e) {}
    this._compteMaj(c, { derniereConnexion: Date.now() }, 'connexion');
    return { ok: true, compte: c, session: sess };
  },
  compteDeconnecter: function () {
    try { var s2 = this.session && this.session(); if (s2 && s2.identifiant) this.connexionNoter({ espace: this._espaceDemo(s2.espace), identifiant: s2.identifiant, nom: s2.role || null, ok: true, motif: '', evt: 'deconnexion' }); } catch (eD) {}
    this.deconnecter(); try { ['pec-fournisseur-actif', 'pec-partenaire-id'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} },   // (18/09) + le point de session
  // Mise à jour du profil d'un compte (nom saisi après le code SMS, e-mail ajouté depuis Compte…) — répercutée sur le client lié
  /* ══ (24/09) LA CANDIDATURE D'UN PARTENAIRE DU RÉSEAU, ÉTAPE PAR ÉTAPE ════════════════════════════════════════════════════
     Fondatrice : « pareil pour devenir partenaire : revérifie, audite, améliore ». L'inscription d'un commerce ou d'un distributeur
     nomade était un seul formulaire de treize champs, le gérant un « Prénom Nom » tapé d'un bloc, la pièce d'identité une pièce
     parmi d'autres, les documents cochés sans être ouverts — et une candidature interrompue ne se reprenait que dans le même
     onglet. Elle suit désormais le parcours des marques : le compte d'abord (compteCreer `etapes`, ou compteSso), puis son
     activité, son gérant, SON identité (la pièce, puis la vidéo), les documents de la société, les engagements — chaque étape
     s'enregistre sur le compte (profil) et le coffre (sous l'id du compte : le dossier suit le point à la validation). La
     candidature n'arrive dans la file du manager qu'une fois ENVOYÉE (statut « inscription » jusque-là). */
  PART_INSCRIPTION_ETAPES: [
    { cle: 'compte', lbl: 'Compte' }, { cle: 'activite', lbl: 'Activité' }, { cle: 'gerant', lbl: 'Gérant' }, { cle: 'beneficiaires', lbl: 'Bénéficiaires effectifs' },
    { cle: 'identite', lbl: 'Identité' }, { cle: 'documents', lbl: 'Documents' }, { cle: 'engagements', lbl: 'Engagements' }, { cle: 'envoi', lbl: 'Envoi' }
  ],
  _partenaireCandidat: function (compteId) {
    var c = this.compte(compteId);
    if (!c || c.espace !== 'partenaire') return { ok: false, motif: 'Candidature introuvable : recommence depuis la connexion.' };
    if (c.statut !== 'inscription' && c.statut !== 'a_verifier') return { ok: false, motif: 'Ta candidature est envoyée : elle se modifie désormais avec PayEnCash.', compte: c };
    return { ok: true, compte: c };
  },
  _partenaireProfilMaj: function (c, patch, evt, extra) { return this._compteMaj(c, { profil: Object.assign({}, c.profil || {}, patch) }, evt, extra); },
  partenaireActiviteSet: function (compteId, o) {
    var k = this._partenaireCandidat(compteId); if (!k.ok) return k;
    o = o || {};
    var M = this.PARTENAIRE_MODES || {}, mode = M[o.mode] ? o.mode : null, t = function (x) { return String(x || '').trim(); };
    if (!mode) return { ok: false, champ: 'mode', motif: 'Choisis comment tu exerces : ' + Object.keys(M).map(function (x) { return M[x].lbl.toLowerCase(); }).join(' ou ') + '.' };
    var siret = t(o.siret).replace(/[\s.]/g, '');
    if (!this.siretValide(siret)) return { ok: false, champ: 'siret', motif: 'SIRET invalide — 14 chiffres, et la clé doit tomber juste : c’est lui que relient le Kbis et le contrat de distribution.' };
    var raison = t(o.raisonSociale);
    if (raison.length < 2) return { ok: false, champ: 'raisonSociale', motif: 'La raison sociale est obligatoire : c’est elle qui signe le contrat de distribution.' };
    var enseigne = t(o.enseigne) || raison;
    var tel = t(o.tel);
    if (tel.replace(/\D/g, '').length < 10) return { ok: false, champ: 'tel', motif: 'Un téléphone joignable est obligatoire : c’est lui que PayEnCash appelle au contrôle du dossier.' };
    var patch = { mode: mode, siret: siret, raisonSociale: raison, enseigne: enseigne, nom: enseigne, tel: tel,
      formeJuridique: t(o.formeJuridique) || null, naf: t(o.naf) || null };
    if (mode === 'sedentaire') {
      var adr = t(o.adresse), cp = t(o.cp).replace(/\s/g, ''), ville = t(o.ville);
      if (adr.length < 4) return { ok: false, champ: 'adresse', motif: 'L’adresse du commerce est obligatoire : c’est elle qui le place sur la carte où les clients cherchent un point de vente.' };
      if (!/^\d{5}$/.test(cp)) return { ok: false, champ: 'cp', motif: 'Code postal : 5 chiffres.' };
      if (ville.length < 2) return { ok: false, champ: 'ville', motif: 'La ville du commerce est obligatoire.' };
      Object.assign(patch, { adresse: adr, cp: cp, ville: ville, zoneVilles: [], zoneRayonKm: null });
    } else {
      /* UN DISTRIBUTEUR NOMADE N'A PAS D'ADRESSE : il se déplace, dans la zone qu'il choisit lui-même (19/09). Les villes sont
         celles du réseau : on n'invente pas une ville que la carte ne connaît pas. */
      var noms = {}; (this.zoneVillesRef() || []).forEach(function (v) { noms[v.nom] = 1; });
      var villes = (o.zoneVilles || []).filter(function (v) { return noms[v]; });
      if (!villes.length) return { ok: false, champ: 'zoneVilles', motif: 'Choisis au moins une ville où tu te déplaces : c’est elle qui te vaudra des demandes de rencontre.' };
      var ry = Math.round(Number(o.zoneRayonKm) || 0);
      if (ry < 0 || ry > 100) return { ok: false, champ: 'zoneRayonKm', motif: 'Le rayon se donne en kilomètres, de 0 à 100.' };
      Object.assign(patch, { adresse: '', cp: '', ville: villes[0], zoneVilles: villes, zoneRayonKm: ry > 0 ? ry : null });
    }
    this._partenaireProfilMaj(k.compte, patch, 'partenaire_activite', { mode: mode, siret: siret });
    return { ok: true, compte: this.compte(compteId) };
  },
  partenaireGerantSet: function (compteId, d) {
    var k = this._partenaireCandidat(compteId); if (!k.ok) return k;
    var g = this._techDirigeantControle(d); if (!g.ok) return g;   // les mêmes règles que le dirigeant d'une marque
    this._partenaireProfilMaj(k.compte, { gerant: g.dirigeant, responsable: g.dirigeant.prenom + ' ' + g.dirigeant.nom }, 'partenaire_gerant', { qualite: g.dirigeant.qualite });
    return { ok: true, gerant: g.dirigeant };
  },
  /* OÙ EN EST LA CANDIDATURE — une étape = un fait vérifiable, lu sur le compte, au coffre et dans les acceptations */
  partenaireCandidature: function (compteId) {
    var c = this.compte(compteId); if (!c || c.espace !== 'partenaire') return null;
    var p = c.profil || {}, g = p.gerant || {}, W = (typeof window !== 'undefined') ? window : {}, DOCS = W.PEC_DOCS || null;
    var dossier = DOCS && DOCS.dossier ? DOCS.dossier('partenaire', c.id) : [];
    var deposee = function (id) { var x = dossier.filter(function (q) { return q.id === id; })[0]; return !!x && !/^(manquante|refusee|incomplete|a_renouveler)$/.test(x.statut); };
    var docs = this.documentsEtat('partenaire', c.identifiant);
    var fait = {
      compte: !!(c.verifs && c.verifs.email),
      activite: !!(p.mode && p.siret && p.raisonSociale && p.tel && (p.mode === 'mobile' ? (p.zoneVilles || []).length : (p.adresse && p.cp && p.ville))),
      gerant: !!(g.civilite && g.prenom && g.nom && g.dateNaissance && g.lieuNaissance && g.qualite),
      beneficiaires: this.beneficiairesEtat(p.beneficiaires, g, p.formeJuridique).ok,
      identite: deposee('cni') && deposee('video'),
      documents: dossier.length > 0 && dossier.every(function (q) { return q.id === 'cni' || q.id === 'video' || q.genere || !q.obligatoire || deposee(q.id); }),
      engagements: docs.length > 0 && docs.every(function (x) { return x.aJour; }),
      envoi: !!p.candidatureEnvoyeeLe
    };
    var etapes = this.PART_INSCRIPTION_ETAPES.map(function (e) { return Object.assign({}, e, { ok: !!fait[e.cle] }); });
    var prochaine = etapes.filter(function (e) { return !e.ok; })[0] || null;
    return { compte: c, profil: p, etapes: etapes, prochaine: prochaine ? prochaine.cle : null, envoyee: !!p.candidatureEnvoyeeLe,
      pret: etapes.every(function (e) { return e.ok || e.cle === 'envoi'; }) };
  },
  /* L'ENVOI — le dossier part au contrôle (PEC_DOCS.soumettre, `candidature` : le contrat se signe APRÈS la validation) et
     le compte entre dans la file du manager (« à valider ») ; il n'en sortait jamais avant. */
  partenaireCandidatureEnvoyer: function (compteId, par) {
    var st = this.partenaireCandidature(compteId); if (!st) return { ok: false, motif: 'Candidature introuvable.' };
    if (st.envoyee) return { ok: true, deja: true, compte: st.compte };
    var manque = st.etapes.filter(function (e) { return !e.ok && e.cle !== 'envoi'; });
    if (manque.length) return { ok: false, champ: manque[0].cle, motif: 'Il reste à compléter : ' + manque.map(function (e) { return e.lbl.toLowerCase(); }).join(', ') + '.' };
    var W = (typeof window !== 'undefined') ? window : {}, s = null;
    try { s = W.PEC_DOCS && W.PEC_DOCS.soumettre ? W.PEC_DOCS.soumettre('partenaire', st.compte.id, { candidature: true }) : null; } catch (e) { s = null; }
    if (s && !s.ok) return { ok: false, motif: s.message || s.motif || 'Le dossier n’a pas pu partir.' };
    var c = st.compte;
    this._compteMaj(c, { statut: 'a_valider', profil: Object.assign({}, c.profil || {}, { candidatureEnvoyeeLe: Date.now() }) }, 'partenaire_candidature_envoyee', { par: par || c.identifiant });
    return { ok: true, compte: this.compte(c.id) };
  },
  compteProfilMaj: function (id, patch) {
    var c = this.compte(id); if (!c) return null; patch = patch || {};
    var p = Object.assign({}, c.profil || {}, patch);
    if (patch.prenom || patch.nom) p.nom = (p.prenom ? p.prenom + ' ' : '') + String(patch.nom || p.nom || '').replace(/^.*\s/, '').charAt(0).toUpperCase() + '.';
    this._compteMaj(c, { profil: p }, 'compte_profil');
    if (c.espace === 'client' && c.refId) {
      try { var cl = JSON.parse(localStorage.getItem('pec-clients-crees') || '[]') || []; cl.forEach(function (x) { if (x.id === c.refId) { if (p.prenom) x.prenom = p.prenom; if (patch.nom) x.nom = patch.nom; x.nomComplet = p.nom; if (p.email) x.email = p.email; if (p.ville) x.ville = p.ville; } }); localStorage.setItem('pec-clients-crees', JSON.stringify(cl)); if (this.mode) this.mode.clients = null; } catch (e) {}
    }
    return c;
  },
  // Vérification faite par PEC_VERIF (code à l'écran) sur le compte client ACTIF → reportée sur le compte (une seule vérité)
  _compteVerifDirect: function (canal) {
    try { var cl = this.clientCourant ? this.clientCourant() : null; if (!cl) return; var c = this.compteParIdentifiant('client', cl.telComplet); if (!c || c.seed) return; var v = Object.assign({}, c.verifs); v[canal === 'mail' ? 'email' : canal] = true; var E = this.ESPACES_COMPTE.client; var restent = E.verifs.filter(function (k) { return !v[k]; }); this._compteMaj(c, { verifs: v, statut: restent.length ? c.statut : 'actif' }, 'compte_verifie', { canal: canal }); this._clientVerifSync(c); } catch (e) {}
  },
  // Les vérifications du compte client sont recopiées sur SA fiche client (référentiel) — une seule vérité, lue par la porte « compte vérifié »
  _clientVerifSync: function (c) {
    if (!c || c.espace !== 'client' || !c.refId) return;
    try { var cl = JSON.parse(localStorage.getItem('pec-clients-crees') || '[]') || []; cl.forEach(function (x) { if (x.id === c.refId) x.verif = { sms: !!c.verifs.sms, email: !!c.verifs.email }; }); localStorage.setItem('pec-clients-crees', JSON.stringify(cl)); if (this.mode) this.mode.clients = null; } catch (e) {}
  },
  // Suppression RGPD par le client : compte fermé, client retiré du référentiel, session purgée
  compteSupprimer: function (id) {
    var c = this.compte(id); if (!c) return false;
    this._compteMaj(c, { statut: 'supprime', supprimeAt: Date.now() }, 'compte_supprime');
    try { if (c.espace === 'client' && c.refId) { var cl = JSON.parse(localStorage.getItem('pec-clients-crees') || '[]') || []; localStorage.setItem('pec-clients-crees', JSON.stringify(cl.filter(function (x) { return x.id !== c.refId; }))); if (this.mode) this.mode.clients = null; } } catch (e) {}
    this.compteDeconnecter(); return true;
  },
  // Vue Manager : tous les comptes, avec libellés — et ce qui attend une action
  comptesPourManager: function () {
    var d = this;
    return this.comptesTous().map(function (c) { var E = d.ESPACES_COMPTE[c.espace] || {}; return Object.assign({}, c, { espaceLabel: E.label || c.espace, statutLabel: d.STATUTS_COMPTE[c.statut] || c.statut, aValider: c.statut === 'a_valider', attente: (E.verifs || []).filter(function (k) { return !c.verifs[k]; }) }); })
      .sort(function (a, b) { return (b.creeAt || 0) - (a.creeAt || 0); });
  },
  comptesAValider: function (espace) { return this.comptesTous(espace).filter(function (c) { return c.statut === 'a_valider'; }); },
  /* ── PARAMÈTRES D'EXPLOITATION MODIFIABLES (fondatrice 03/09 « fais ce qu'il faut ») : les écrans de configuration
        du Manager n'étaient qu'en lecture faute de setter. Un seul mécanisme : `parametresGet()` fusionne `ref` avec
        les valeurs éditées (persistées `pec-parametres`), `parametreSet(chemin, valeur)` écrit et journalise.
        Les lectures existantes (`D.ref.*`, `scenario.*`) passent par `param(chemin)` quand un écran veut la valeur
        VIVE ; le référentiel reste la valeur d'origine (retour possible par `parametresReset`). ── */
  parametresEdites: function () { try { return JSON.parse(localStorage.getItem('pec-parametres') || '{}') || {}; } catch (e) { return {}; } },
  parametresReset: function () { try { localStorage.removeItem('pec-parametres'); } catch (e) {} },
  // Valeur vive d'un paramètre : « ref.marges.volSeul », « scenario.fenetreEncaissementMinutes »…
  /* (09/09 — lot 1 socle) paramBrut(chemin, valeurDuReferentiel) : la valeur ÉDITÉE si elle existe, sinon celle passée.
     Sert aux getters du référentiel (scenario, fiscalité) — param(), lui, résout le chemin et rappellerait le getter. */
  paramBrut: function (chemin, brut) { var e = this.parametresEdites(); return Object.prototype.hasOwnProperty.call(e, chemin) ? e[chemin] : brut; },
  /* (09/09 — lot 1 socle) UNE BRANCHE ENTIÈRE DU RÉFÉRENTIEL, VIVE. Les écrans lisaient `D.ref.marges`, `D.ref.circuitCash`,
     `D.ref.fraisDeplacement` en direct : la configuration (10) écrivait bien `ref.marges.volSeul`, et rien ne bougeait.
     objetVif rend une COPIE de la branche avec les valeurs éditées appliquées — le référentiel reste intact (rétablissable). */
  objetVif: function (chemin, base) {
    var e = this.parametresEdites(), pfx = String(chemin) + '.', out = {};
    Object.keys(base || {}).forEach(function (k) { out[k] = base[k]; });
    Object.keys(e).forEach(function (k) { if (k.indexOf(pfx) === 0) { var reste = k.slice(pfx.length); if (reste.indexOf('.') === -1) out[reste] = e[k]; } });
    return out;
  },
  param: function (chemin, defaut) {
    var e = this.parametresEdites();
    if (Object.prototype.hasOwnProperty.call(e, chemin)) return e[chemin];
    var cur = this, parts = String(chemin).split('.');
    for (var i = 0; i < parts.length; i++) { if (cur == null) return defaut; cur = cur[parts[i]]; }
    return cur == null ? defaut : cur;
  },
  /* (11/09) UN RÉGLAGE QUI N'A PAS PRIS NE DOIT PAS RÉPONDRE « ✓ Enregistré ». L'écriture était avalée comme
     celles du bus l'étaient : sur un appareil au stockage plein, le manager baissait le plafond d'espèces, la
     ligne affichait sa coche verte, et rien n'avait changé nulle part. `parametreSet` rend maintenant null en
     cas de refus (la valeur sinon), et 10-configuration le DIT. */
  parametreSet: function (chemin, valeur, par) {
    var e = this.parametresEdites(), avant = this.param(chemin);
    e[chemin] = valeur;
    var ok = true;
    try { localStorage.setItem('pec-parametres', JSON.stringify(e)); } catch (ex) { ok = false; }
    if (!ok) return null;
    try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('parametre_modifie', chemin, { par: par || 'manager', avant: avant, apres: valeur }); } catch (ex2) {}
    try { window.dispatchEvent(new Event('pec-bus')); } catch (ex3) {}
    return valeur;
  },
  /* la valeur du RÉFÉRENTIEL pour un chemin, sans tenir compte des réglages du manager */
  parametreReference: function (chemin) {
    var cur = this, parts = String(chemin).split('.');
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  },
  /* (11/09) « N paramètres modifiés — écart au référentiel » comptait les CLÉS éditées, y compris celles
     remises à leur valeur d'origine : le bandeau annonçait un écart là où la grille affichait, deux lignes
     plus bas, « Valeur du référentiel (rétablie) ». Un écart, c'est une valeur DIFFÉRENTE. */
  parametresModifies: function () {
    var e = this.parametresEdites(), self = this;
    return Object.keys(e).filter(function (k) { return String(e[k]) !== String(self.parametreReference(k)); }).length;
  },
  /* ══ LE BON D’ACHAT PAYENCASH (fondatrice 18/09 : « le moyen ultime et légal : la carte cadeau à montant variable »,
        renommée « Bon d’achat PayEnCash ») ═══════════════════════════════════════════════════════════════════════════════
     Un bon d'achat PRÉPAYÉ à montant libre, vendu en espèces au comptoir d'un commerçant partenaire (ou émis par le
     manager — c'est alors une carte cadeau), utilisable sur PayEnCash, Mode et Fly, en une ou plusieurs fois.
     Fondement : titre à usage limité accepté par le seul émetteur (art. L521-3 I 1° CMF ; hors monnaie électronique,
     art. L315-1 CMF a contrario ; bon d’achat à usages multiples, art. 256 ter CGI) — les textes vivent dans ref.bons.fondement.
     RÈGLES (ref.bons, valeurs vives via bonsRef) : montant entre `minimum` et `plafondBon` ; `plafondClientJour` de bons d’achat
     utilisés par client et par jour ; validité `validiteMois` ; JAMAIS de remboursement en espèces (re-crédit du bon d’achat) ;
     un bon d’achat émis par erreur s'annule au comptoir dans `annulationMinutes` s'il n'a pas servi.
     Table persistée `pec-bons`, seed VIDE : un bon d’achat naît d'une VENTE (partenaire/03) ou d'une ÉMISSION manager (41).
     Miroir SQL : gift_cards + gift_card_movements. Tout est journalisé au bus. ══ */
  BON_ALPHABET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  bonsGet: function () { try { return JSON.parse(localStorage.getItem('pec-bons') || '[]') || []; } catch (e) { return []; } },
  _bonsPut: function (l) { if (!this._ecrit('pec-bons', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  /* Les règles du bon d’achat, VIVES : le manager les ajuste dans Configuration (paramètres bons d’achat.*), le référentiel donne le défaut. */
  bonsRef: function () {
    var b = (this.ref && this.ref.bons) || {}, self = this;
    var v = function (k, d) { var x = self.param ? self.param('bons.' + k, b[k]) : b[k]; return (x == null || x === '') ? d : x; };
    return { nom: b.nom || 'Bon d’achat PayEnCash', minimum: +v('minimum', 5), plafondBon: +v('plafondBon', 250), plafondClientJour: +v('plafondClientJour', 1000),
      plafondClientMois: +v('plafondClientMois', 3000), fenetrePlafondJours: +v('fenetrePlafondJours', 30),
      validiteMois: +v('validiteMois', 12), commissionPct: +v('commissionPct', 1.1), tvaCommissionPct: +v('tvaCommissionPct', 20),
      annulationMinutes: +v('annulationMinutes', 30),
      prefixeTicket: b.prefixeTicket || 'BV-', mentions: (b.mentions || []).slice(), fondement: b.fondement || {},
      psp: Object.assign({}, b.psp || {}) };   // (18/09, soir) le prestataire qui prélève le commerçant, lu par l'espace partenaire
  },
  /* (18/09, soir) LA PHRASE DE FONDEMENT ET LES ÉTAPES D'ACHAT ÉTAIENT RECOPIÉES DANS CINQ ÉCRANS. Les chiffres
     venaient bien du référentiel, mais la CONSTRUCTION de la phrase était dupliquée : cinq endroits à corriger le
     jour où l'avocat fait bouger un mot, et déjà une page qui avait gardé l'ancien nom du produit en repli. Une
     source, cinq lecteurs. `refArticle` sort la référence courte (« art. L521-3 I 1° CMF ») d'une phrase de
     fondement, pour l'afficher en gras avec le texte complet en infobulle. */
  refArticle: function (txt) { return String(txt || '').split(/[\u2014\u2013]/)[0].trim().replace(/[\s,;]+$/, ''); },
  /* LES ÉTAPES D'ACHAT — des DONNÉES, pas une phrase : chaque écran les met dans sa forme (liste, cartes, puces).
     Aucune ne dit comment le client règle au comptoir : c'est l'affaire du commerçant, et ce n'est pas notre promesse. */
  /* ══ (21/09, fondatrice : « vérifie la logique jusqu'au paiement chez le partenaire / l'agent — les bons ne doivent pas
     se mélanger ») LA SAISIE D'UN CODE RECONNAÎT LES DEUX RÉSEAUX ════════════════════════════════════════════════
     Mode et Fly reformataient tout code tapé en douze caractères — chacun avec SA copie de la fonction. Le code d'un bon
     de boutique (TB-XXXX-XXXX-XXXX) y était amputé, et la cliente lisait « bon d'achat inconnu » au lieu de ce que
     bonValider sait dire depuis le 20/09 : « c'est un bon de Boutique Lila — les deux réseaux ne se mélangent pas ». La
     frontière existait dans les données ; l'écran la cachait. Une seule mise en forme, ici, pour les deux écrans : un code
     qui porte le préfixe des boutiques (ref.tech.prefixeBon) garde sa forme, un Bon d'achat PayEnCash la sienne. */
  bonSaisieFormater: function (v) {
    var brut = String(v || '').toUpperCase(), s = brut.replace(/[^A-Z0-9]/g, '');
    var pre = String((this.techRef ? this.techRef().prefixeBon : '') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pre && s.indexOf(pre) === 0 && (s.length > 12 || brut.replace(/\s/g, '').indexOf(pre + '-') === 0)) {
      return pre + '-' + s.slice(pre.length, pre.length + 12).replace(/(.{4})(?=.)/g, '$1-');
    }
    return s.slice(0, 12).replace(/(.{4})(?=.)/g, '$1-');
  },
  bonNormaliserCode: function (code) {
    var s = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length !== 12) return null;   // le format du bon d’achat : 12 caractères, lus en trois groupes de quatre
    return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
  },
  bonNouveauCode: function () {
    var A = this.BON_ALPHABET, vus = {}, code;
    /* (20/09) LES CODES DE SÉRIE COMPTENT AUSSI. Un code commun n'est pas un bon — il n'a pas de ligne à lui —
       mais il se saisit dans le même champ : s'il tombait sur le code d'un bon existant, la cliente ne saurait
       plus lequel des deux elle vient de présenter. On les réserve donc tous les deux. */
    this.bonsGet().forEach(function (b) { vus[b.code] = 1; if (b.serie && b.serie.code) vus[b.serie.code] = 1; });
    do { code = ''; for (var i = 0; i < 12; i++) { if (i && i % 4 === 0) code += '-'; code += A[Math.floor(Math.random() * A.length)]; } } while (vus[code]);
    return code;
  },
  bonParCode: function (code) { var c = this.bonNormaliserCode(code); if (!c) return null; return this.bonsGet().filter(function (b) { return b.code === c; })[0] || null; },

  /* ══ (20/09 — décision fondatrice « au-delà de 250 € ça crée plusieurs bons ET un code commun sur la facture ;
     envoie les deux codes, les deux sont utilisables ») LE CODE COMMUN D'UNE SÉRIE ═════════════════════
     Au comptoir, une vente de plus de 250 € se découpe en plusieurs bons (le plafond LCB-FT est PAR BON). La
     cliente repart donc avec trois, quatre codes — et doit les saisir un par un. C'est exact, mais c'est une
     corvée que nous lui avons créée, pas une règle de droit.
     LE CODE COMMUN est un ALIAS de la série entière : il ne crée aucune valeur, il n'a pas de solde à lui, il
     DÉSIGNE ses bons. Le présenter revient à les présenter tous, dans l'ordre d'émission. Les deux chemins
     restent ouverts, comme la fondatrice l'a demandé : chaque code individuel marche, et le code commun aussi.
     TOUT SE LIT SUR LES BONS EUX-MÊMES (`b.serie.code`) — aucune table parallèle, aucun solde recopié : ce sont
     les débits des membres qui font foi, et le solde de la série est leur somme. ══ */
  bonsSerie: function (code) {
    var c = this.bonNormaliserCode(code); if (!c) return [];
    return this.bonsGet().filter(function (b) { return b.serie && b.serie.code === c; })
      .sort(function (a, b) { return ((a.serie || {}).rang || 0) - ((b.serie || {}).rang || 0); });
  },
  /* LA VUE D'UNE SÉRIE — un bon VIRTUEL, dérivé de ses membres à chaque appel : jamais stocké, jamais recopié.
     État : actif dès qu'UN membre est utilisable ; sinon le plus explicite des états rencontrés — un bon bloqué
     dans la série se DIT (on ne fait pas passer un blocage pour un solde épuisé). */
  bonSerieVue: function (code, now) {
    var l = this.bonsSerie(code); if (!l.length) return null;
    var d = this, c2 = function (x) { return Math.round(x * 100) / 100; };
    var etats = l.map(function (b) { return d.bonEtat(b, now); });
    var actifs = l.filter(function (b, i) { return etats[i] === 'actif'; });
    var etat = actifs.length ? 'actif'
      : (etats.indexOf('bloque') > -1 ? 'bloque' : etats.indexOf('annule') > -1 ? 'annule'
        : etats.indexOf('expire') > -1 ? 'expire' : 'epuise');
    var prem = l[0], ser = prem.serie || {};
    return { code: this.bonNormaliserCode(code), serieDe: ser.id || null, membres: l, codes: l.map(function (b) { return b.code; }),
      n: l.length, etat: etat,
      montant: c2(l.reduce(function (t, b) { return t + b.montant; }, 0)),
      solde: c2(actifs.reduce(function (t, b) { return t + b.solde; }, 0)),
      soldeTotal: c2(l.reduce(function (t, b) { return t + b.solde; }, 0)),
      statut: etat === 'bloque' || etat === 'annule' ? etat : 'actif',
      expireLe: l.reduce(function (t, b) { return t == null ? b.expireLe : Math.min(t, b.expireLe); }, null),
      emisLe: prem.emisLe, origine: prem.origine, pointId: prem.pointId, enseigne: prem.enseigne,
      ticket: prem.ticket, clientId: (l.filter(function (b) { return b.clientId; })[0] || {}).clientId || null,
      mouvements: l.reduce(function (t, b) { return t.concat(b.mouvements || []); }, []) };
  },
  /* (23/09, soir) LE MASQUE GARDE LE PRÉFIXE du code (TB-… pour un bon de marque) : de quoi reconnaître le sien, pas de quoi s'en servir. */
  bonMasque: function (code) { var c = String(code || ''); if (c.length < 4) return c; var m = c.match(/^([A-Z]{1,4})-/); return (m ? m[1] + '-' : '') + '••••-••••-' + c.slice(-4); },
  /* L'ÉTAT SE DÉRIVE : seuls « bloqué » et « annulé » sont écrits ; épuisé et expiré se lisent sur le solde et la date. */
  bonEtat: function (b, now) {
    if (!b) return 'inconnu'; now = now || Date.now();
    if (b.statut === 'annule') return 'annule';
    if (b.statut === 'bloque') return 'bloque';
    if (b.expireLe && now > b.expireLe) return 'expire';
    if (!(b.solde > 0.004)) return 'epuise';
    return 'actif';
  },
  _bonMontant: function (x) { return Math.round((parseFloat(String(x == null ? '' : x).replace(/\s/g, '').replace(',', '.')) || 0) * 100) / 100; },
  /* LA CRÉATION PURE D'UN BON — sans contrôle, sans prélèvement, sans écriture : `bonEmettre` (un bon) et
     `bonEmettreSerie` (plusieurs) la partagent, pour que les deux chemins produisent le MÊME objet. */
  _bonNouveau: function (montant, ctx) {
    var R = this.bonsRef(), now = Date.now();
    var seq = this._seq('bons', this._seqPlancher(this.bonsGet(), '^' + R.prefixeTicket + '0*(\\d+)$', 'ticket'));
    if (seq == null) return null;
    var exp = new Date(); exp.setMonth(exp.getMonth() + R.validiteMois);
    return { code: this.bonNouveauCode(), montant: montant, solde: montant, statut: 'actif', origine: ctx.origine,
      pointId: ctx.p ? ctx.p.id : null, enseigne: ctx.p ? ctx.p.enseigne : null, ticket: R.prefixeTicket + String(seq).padStart(6, '0'),
      emisLe: now, expireLe: exp.getTime(), emisPar: ctx.par || (ctx.origine === 'manager' ? 'manager' : 'partenaire'), clientId: null,
      prelevement: ctx.prelevementId || null, reversePar: ctx.reversePar != null ? ctx.reversePar : null,
      serie: ctx.serie || null,
      /* (23/09) LE MOYEN DE RÈGLEMENT AU COMPTOIR, NOTÉ SANS ÊTRE AFFICHÉ : l'app du porteur (Mes bons) compte ses bons par
         moyen pour savoir quand demander sa pièce d'identité (kycPorteurRef). Facultatif — un comptoir qui ne le dit pas
         n'est pas bloqué, et le bon ne le porte alors pas. La règle du 18/09 tient : on ne l'IMPRIME jamais. */
      moyen: this.MOYENS_COMPTOIR[ctx.moyen] ? ctx.moyen : null,
      mouvements: [{ type: 'emission', montant: montant, at: now, par: ctx.par || null }] };
  },
  /* ÉMETTRE UN bon d’achat — UN SEUL. Au-dessus du plafond par bon, c'est `bonEmettreSerie` qui prend la main
     (le comptoir y passe toujours) : ici on refuse, en disant où est la porte. */
  bonEmettre: function (o) {
    o = o || {}; var R = this.bonsRef(), montant = this._bonMontant(o.montant), p = null, prelevement = null;
    if (!(montant > 0)) return { ok: false, champ: 'montant', motif: 'Montant invalide — saisis un montant en euros.' };
    if (montant < R.minimum) return { ok: false, champ: 'montant', motif: 'Un bon d’achat fait au moins ' + this.eur(R.minimum) + '.' };
    if (montant > R.plafondBon) return { ok: false, champ: 'montant', motif: 'Un bon d’achat ne dépasse pas ' + this.eur(R.plafondBon) + ' (plafond par bon d’achat, LCB-FT) — au-delà, la vente se découpe d\'elle-même en plusieurs bons (bonEmettreSerie).' };
    var origine = o.origine === 'manager' ? 'manager' : 'partenaire';
    if (origine === 'partenaire') {
      p = this.partenaire(o.pointId); if (!p) return { ok: false, motif: 'Point inconnu — aucun bon d’achat ne s\'émet sans point rattaché.' };
      var et = this.partenaireEtat(p); if (!et.ok) return { ok: false, motif: et.titre + ' — ' + et.txt };
      /* (18/09, soir — pivot) ON NE DIT PLUS COMMENT LE CLIENT RÈGLE AU COMPTOIR : il paie son bon d’achat comme il veut, c'est
         une vente du commerçant à son client. Ce que nous exigeons, c'est qu'il confirme avoir ENCAISSÉ le montant. */
      if (o.prixRecu !== true) return { ok: false, champ: 'encaissement', motif: 'Confirme avoir reçu ' + this.eur(montant) + ' de ton client : le bon d’achat ne s\'émet qu\'une fois payé.' };
      /* (18/09, soir) LE BON D’ACHAT NAÎT DU PAIEMENT. La carte du commerce est débitée AVANT que le code existe : refus de la
         banque, pas de bon d’achat — le commerçant rend son paiement au client. Aucun code ne part sans que PayEnCash ait été payée. */
      var pr = this.prelevementPartenaire(p.id, montant, { par: o.par, echec: o.echecPrelevement === true, motifEchec: o.motifEchec });
      if (!pr.ok) return { ok: false, champ: 'prelevement', motif: pr.message || pr.motif, prelevement: pr.prelevement || null };
      prelevement = pr.prelevement;
    }
    var b = this._bonNouveau(montant, { origine: origine, p: p, par: o.par, moyen: o.moyen,
      prelevementId: prelevement ? prelevement.id : null, reversePar: prelevement ? prelevement.montant : null });
    if (!b) return this._refusEcriture('L\'émission du bon d’achat');
    var l = this.bonsGet(); l.push(b);
    if (!this._bonsPut(l)) { if (prelevement) this.prelevementRembourser(prelevement.id, 'bon d’achat non enregistré (écriture refusée)', 'système'); return this._refusEcriture('L\'émission du bon d’achat'); }
    if (prelevement) this._prelevementLier(prelevement.id, b.code);
    this._journal('bon_emis', b.code, { par: b.emisPar, montant: montant, origine: origine, pointId: b.pointId, enseigne: b.enseigne, ticket: b.ticket, expireLe: b.expireLe });
    return { ok: true, bon: b };
  },
  /* LA VÉRIFICATION D'IDENTITÉ DU COMPTE — au-delà du plafond de 30 jours, le bon d’achat reste utilisable, mais SEULEMENT
     par un compte dont l'identité a été vérifiée (PVID, `ref.kyc.prestataire`). Le plafond n'est pas un mur : c'est
     le moment où la loi demande de savoir qui paie. */
  clientIdentiteVerifiee: function (clientId) {
    if (!clientId) return false;
    try {
      var c = this.client ? this.client(clientId) : null;
      if (c && (c.kyc === 'pvid' || c.kycNiveau === 'pvid' || c.identiteVerifiee === true)) return true;
      if (window.PEC_DOCS && PEC_DOCS.etat) return PEC_DOCS.etat('client', clientId).etat === 'valide';
    } catch (e) {}
    return false;
  },

  /* ══ LES COMMERÇANTS PARTENAIRES v2 (18/09) — ils VENDENT le Bon d’achat PayEnCash, ils n'encaissent aucune commande ═══════════
     Référentiel `pec-partenaires` (overrides), seed VIDE : un point naît de l'inscription (00-inscription → compteValider →
     _compteLierMetier) ou de la signature du contrat par le commercial (contratPartenaireSigner). Cycle de vie :
     contrat_a_signer → contrat_signe (intégration : dossier de vérification) → actif (partenaireActiver) ; suspendu ; clos.
     Aucune borne, aucun RIB de point (l'argent va du partenaire vers AJEK). Miroir SQL : partners. ══ */
  /* (23/09, nuit — grossiste) PLUS DE « RÉSEAU DE DÉPART » FABRIQUÉ. Il posait les 29 buralistes de l'annuaire des points
     relais au statut « actif », sans contrat ni fiche de vente : la vitrine annonçait 29 commerces où acheter un bon qu'aucun
     d'eux ne pouvait vendre, et le socle Solution devait les écarter à la main. Zéro seed : un commerce naît de SON inscription. */
  partenairesOverrides: function () { try { return JSON.parse(localStorage.getItem('pec-partenaires') || '{}') || {}; } catch (e) { return {}; } },
  partenaires: function () {
    var ov = this.partenairesOverrides(), self = this;
    return Object.keys(ov).map(function (id) { return Object.assign({ id: id }, ov[id]); })
      .filter(function (p) { return !p.supprime; }).map(function (p) { return self._partenaireVerite(p); });
  },
  partenaire: function (id) { if (!id) return null; return this.partenaires().filter(function (p) { return p.id === id; })[0] || null; },
  /* LE KYB DU POINT SE DÉRIVE DU COFFRE (PEC_DOCS, dossier 'partenaire' : Kbis, pièce du gérant, vidéo, contrat signé).
     (18/09, soir) LA POSITION AUSSI SE DÉRIVE QUAND ELLE MANQUE. Ni le formulaire d'inscription ni le manager ne
     demandent une géoposition : un commerce n'en avait donc AUCUNE, et il n'apparaissait ni sur la carte du client
     (« où acheter un bon d'achat ») ni sur celle du manager. Plutôt qu'inventer une adresse, on place le commerce au
     CENTRE DE SA VILLE et on le DIT (`geoApprox`) — l'écran peut afficher « position approchée ». Le jour où une
     géoposition exacte est saisie, elle gagne et `geoApprox` retombe à faux. */
  _partenaireVerite: function (p) {
    if (!p) return p;
    if (!p.geo || !isFinite(p.geo.lat) || !isFinite(p.geo.lng)) {
      var c = this.villeGeo ? this.villeGeo(p.ville, p.cp) : null;
      if (c) { p = Object.assign({}, p, { geo: c, geoApprox: true }); }
    } else if (p.geoApprox) { p = Object.assign({}, p, { geoApprox: false }); }
    if (!window.PEC_DOCS || !PEC_DOCS.etat) return p;
    try {
      var e = PEC_DOCS.etat('partenaire', p.id), r = Object.assign({}, p);
      r.kyb = e.etat;   // valide | a_completer | a_soumettre | en_verification | a_corriger
      r.kybDetail = e.etat === 'valide' ? 'Dossier validé (coffre)'
        : (e.manquantes && e.manquantes.length ? 'Il manque ' + this.nb(e.manquantes.length, 'pièce') + ' : ' + e.manquantes.map(function (x) { return x.label || x.id; }).join(', ') : (e.libelle || 'Dossier en cours'));
      var c = PEC_DOCS.get('partenaire', p.id, 'contrat');
      r.contratSigne = !!(c && c.signe);
      if (c && c.signe && c.signeAt && !r.signeLe) r.signeLe = new Date(c.signeAt).toLocaleDateString('fr-FR');
      return r;
    } catch (err) { return p; }
  },
  _partenaireNouvelId: function () {
    var n = 1, vus = {};
    try { this.partenaires().forEach(function (p) { vus[p.id] = 1; }); } catch (e) {}
    Object.keys(this.partenairesOverrides()).forEach(function (k) { vus[k] = 1; });
    Object.keys(vus).forEach(function (k) { var m = /^PRT-(\d+)$/.exec(k); if (m && +m[1] >= n) n = +m[1] + 1; });
    return 'PRT-' + n;
  },
  /* ══ LE SIRET : UNE SEULE RÈGLE, POUR TOUTE LA MAISON (23/09) ═══════════════════════════════════════════
     Il y en avait deux. L'app partenaire se contentait de « 14 chiffres » ; le réseau des marques vérifiait en
     plus la clé de Luhn. Même champ, même pièce d'identité, deux verdicts : un commerce inscrit chez nous avec
     un SIRET dont la clé ne tombait pas juste passait le contrat de distribution, puis se voyait refuser
     l'inscription au réseau des marques — pour la même entreprise, le même numéro, le même écran de KYB.
     Un SIRET dont la clé est fausse n'est pas un SIRET : le contrôle est ici, et il vaut partout. */
  siretValide: function (v) {
    var n = String(v || '').replace(/[\s.]/g, '');
    if (!/^\d{14}$/.test(n)) return false;
    var som = 0;
    for (var i = 0; i < 14; i++) { var c = +n[13 - i]; if (i % 2) { c *= 2; if (c > 9) c -= 9; } som += c; }
    return som % 10 === 0;
  },

  partenaireParSiret: function (siret) {
    var s = String(siret || '').replace(/\D/g, ''); if (s.length !== 14) return null;
    return this.partenaires().filter(function (p) { return String(p.siret || '').replace(/\D/g, '') === s; })[0] || null;
  },
  partenaireParProspect: function (prospectId) {
    if (!prospectId) return null; var brut = null;
    try { brut = (this.prospectsOverrides() || {})[prospectId] || (this.prospectsCommercial || []).filter(function (x) { return x.id === prospectId; })[0] || null; } catch (e) {}
    if (brut && brut.pointId) { var p0 = this.partenaire(brut.pointId); if (p0) return p0; }
    return this.partenaires().filter(function (p) { return p.prospectId === prospectId; })[0] || null;
  },
  partenaireEnregistrer: function (p, par) {
    var ov = this.partenairesOverrides();
    if (!p.id) p.id = this._partenaireNouvelId();
    // suspendu / clos / actif n'ont qu'une porte (partenaireSuspendre / partenaireCloturer / partenaireActiver) : motivées, journalisées
    if (p.statut === 'suspendu' && !p.motifSuspension) delete p.statut;
    if (p.statut === 'clos' && !p.motifClos) delete p.statut;
    if (p.statut === 'actif' && !p.activeAt) delete p.statut;
    if (p.statut === 'refuse' && !p.motifRefus) delete p.statut;   // (19/09, soir) un refus sans motif n'est pas un refus
    Object.keys(p).forEach(function (k) { if (p[k] === undefined) delete p[k]; });   // un champ absent n'est pas un champ vidé
    /* (19/09, soir) UN POINT NAÎT « CONTRAT À SIGNER ». Créé sans statut, il n'en avait AUCUN : ni les listes du
       manager, ni `partenaireEtat`, ni le tri ne savaient qu'en faire — et le geste « Activer » ne s'affichait
       pas. Le défaut est celui du cycle de vie, il se pose à la création, jamais à la mise à jour. */
    if (!ov[p.id] && !p.statut) p.statut = 'contrat_a_signer';
    if (p.siret) p.siret = String(p.siret).replace(/[\s.]/g, '');
    ov[p.id] = Object.assign({}, ov[p.id] || {}, p, { majAt: Date.now() });
    if (!this._ecrit('pec-partenaires', ov)) return null;
    this._journal('partenaire_enregistre', p.id, { par: par, enseigne: p.enseigne || (ov[p.id] || {}).enseigne || '' });
    try { window.dispatchEvent(new CustomEvent('pec-bus')); } catch (e2) {}
    return this.partenaire(p.id);
  },
  /* ACTIVER — la porte de la vente : contrat SIGNÉ et dossier VALIDÉ, sinon refus motivé. */
  /* REFUSER LA RELATION COMMERCIALE — le seul pouvoir du manager sur un distributeur qui se présente
     (décision fondatrice 19/09, soir). Il ne choisit pas sa zone, il ne lui assigne pas de clients : il dit oui
     (partenaireActiver) ou non. Un refus MOTIVÉ, journalisé, et qui ferme la vente sans effacer le dossier. */
  partenaireRefuser: function (id, motif, par) {
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    if (p.statut === 'actif') return { ok: false, motif: p.enseigne + ' est ACTIF : on ne refuse pas une relation en cours — c\'est « Suspendre », puis « Clore ».' };
    if (p.statut === 'refuse') return { ok: false, motif: 'La relation avec ' + p.enseigne + ' est déjà refusée.' };
    var m = String(motif || '').trim();
    if (!m) return { ok: false, champ: 'motif', motif: 'Dis POURQUOI tu refuses : le distributeur doit pouvoir le lire, et l\'audit aussi.' };
    if (!this.partenaireEnregistrer({ id: id, statut: 'refuse', refuseAt: Date.now(), refusePar: par || 'manager', motifRefus: m }, par || 'manager')) return this._refusEcriture('Le refus de ' + p.enseigne);
    this._journal('point_refuse', id, { par: par || 'manager', enseigne: p.enseigne, motif: m });
    this._revendeurSuitPoint(id, par);
    return { ok: true, partenaire: this.partenaire(id) };
  },
  partenaireActiver: function (id, par) {
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    if (p.statut === 'actif') return { ok: false, motif: p.enseigne + ' est déjà actif.' };
    if (p.statut === 'suspendu') return { ok: false, motif: p.enseigne + ' est suspendu : c\'est « Réactiver » qui rend l\'état d\'avant.' };
    if (p.statut === 'clos') return { ok: false, motif: p.enseigne + ' est clos — un point clos ne se réactive pas, le commerce se ré-inscrit.' };
    if (!p.contratSigne) return { ok: false, motif: 'Contrat de distribution non signé : ' + p.enseigne + ' ne peut pas vendre avant la signature.' };
    if (p.kyb !== 'valide') return { ok: false, motif: 'Dossier de vérification non validé (' + (p.kybDetail || p.kyb) + ') : contrôle les pièces dans Vérifications avant d\'activer.' };
    if (!this.partenaireEnregistrer({ id: id, statut: 'actif', activeAt: Date.now(), activePar: par || 'manager' }, par || 'manager')) return this._refusEcriture('L\'activation de ' + p.enseigne);
    this._journal('point_active', id, { par: par || 'manager', enseigne: p.enseigne });
    this._revendeurSuitPoint(id, par);
    return { ok: true, partenaire: this.partenaire(id), revendeur: this.techRevendeurDuPoint(id) };
  },
  partenaireSuspendre: function (id, motif, par) {
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    motif = String(motif || '').trim(); if (!motif) return { ok: false, motif: 'Une suspension se motive — le partenaire lit la raison.' };
    if (p.statut === 'suspendu') return { ok: false, motif: p.enseigne + ' est déjà suspendu.' };
    if (p.statut === 'clos') return { ok: false, motif: p.enseigne + ' est clos.' };
    if (!this.partenaireEnregistrer({ id: id, statut: 'suspendu', statutAvant: p.statut, motifSuspension: motif, suspendueAt: Date.now() }, par || 'manager')) return this._refusEcriture('La suspension de ' + p.enseigne);
    var c = (this.comptesTous('partenaire') || []).filter(function (x) { return x.refId === id; })[0];
    if (c && c.statut === 'actif') this._compteMaj(c, { statut: 'suspendu' }, 'compte_suspendu', { par: par || 'manager', motif: motif });
    this._journal('point_suspendu', id, { par: par || 'manager', enseigne: p.enseigne, motif: motif });
    this._revendeurSuitPoint(id, par);
    return { ok: true, partenaire: this.partenaire(id) };
  },
  partenaireReactiver: function (id, par) {
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    if (p.statut !== 'suspendu') return { ok: false, motif: p.enseigne + ' n\'est pas suspendu.' };
    var avant = p.statutAvant || 'contrat_a_signer';   // on REND l'état d'avant, on ne décrète pas « actif »
    var patch = { id: id, statut: avant, statutAvant: null, motifSuspension: null };
    if (avant === 'actif') patch.activeAt = p.activeAt || Date.now();
    if (!this.partenaireEnregistrer(patch, par || 'manager')) return this._refusEcriture('La réactivation de ' + p.enseigne);
    var c = (this.comptesTous('partenaire') || []).filter(function (x) { return x.refId === id; })[0];
    if (c && c.statut === 'suspendu') this._compteMaj(c, { statut: 'actif' }, 'compte_reactive', { par: par || 'manager' });
    this._journal('point_reactive', id, { par: par || 'manager', enseigne: p.enseigne, statut: avant });
    this._revendeurSuitPoint(id, par);
    return { ok: true, partenaire: this.partenaire(id) };
  },
  /* RÉSILIATION du contrat de distribution : le point ferme, le compte est clos. Les bons d’achat déjà vendus restent valables pour les
     clients ; les prélèvements déjà encaissés restent acquis. */
  partenaireCloturer: function (id, motif, par) {
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    motif = String(motif || '').trim(); if (!motif) return { ok: false, motif: 'La résiliation se motive (départ, fermeture, manquement…).' };
    if (p.statut === 'clos') return { ok: false, motif: p.enseigne + ' est déjà clos.' };
    if (!this.partenaireEnregistrer({ id: id, statut: 'clos', motifClos: motif, closAt: Date.now() }, par || 'manager')) return this._refusEcriture('La clôture de ' + p.enseigne);
    var c = (this.comptesTous('partenaire') || []).filter(function (x) { return x.refId === id; })[0];
    if (c && c.statut !== 'clos') this._compteMaj(c, { statut: 'clos', closAt: Date.now(), motifClos: motif }, 'compte_clos', { par: par || 'manager', motif: motif });
    this._journal('point_clos', id, { par: par || 'manager', enseigne: p.enseigne, motif: motif });
    this._revendeurSuitPoint(id, par);
    return { ok: true, partenaire: this.partenaire(id) };
  },
  /* (19/09, soir — « le manager ne définit plus la zone, il refuse ou non une relation commerciale ») LE REFUS
     EST UN ÉTAT, pas un silence : une candidature écartée doit se lire, avec son motif et sa date. */
  PARTENAIRE_STATUTS: { contrat_a_signer: ['Contrat à signer', 'pec-pill--wait'], contrat_signe: ['Contrat signé — intégration', 'pec-pill--wait'], actif: ['Actif', 'pec-pill--done'], refuse: ['Relation refusée', 'pec-pill--off'], suspendu: ['Suspendu', 'pec-pill--off'], clos: ['Clos', 'pec-pill--off'] },
  partenaireStatutLbl: function (s) { return (this.PARTENAIRE_STATUTS[s] || [s || '—'])[0]; },
  partenaireStatutPill: function (s) { return (this.PARTENAIRE_STATUTS[s] || ['', ''])[1]; },
  /* L'ÉTAT QUI OUVRE OU FERME LA VENTE — une seule lecture, pour l'app partenaire (PEC_PART.etat) et pour bonEmettre. */
  partenaireEtat: function (p) {
    if (!p) return { ok: false, code: 'aucun', point: null, titre: 'Aucun point rattaché à cette session',
      txt: 'Connecte-toi avec l\'identifiant de ton point — la vente des bons de marque est réservée à un point activé par PayEnCash.' };
    if (p.statut === 'actif') return { ok: true, code: 'actif', point: p, titre: '', txt: '' };
    var T = {
      contrat_a_signer: ['Contrat de distribution à signer', p.enseigne + ' : le contrat de distribution des bons de marque n\'est pas encore signé. Lis-le et signe-le depuis Mon point ; PayEnCash active ensuite le point.'],
      contrat_signe: ['Intégration en cours — activation par PayEnCash', p.enseigne + ' : contrat signé. PayEnCash contrôle le dossier de vérification' + (p.kyb !== 'valide' && p.kybDetail ? ' (' + p.kybDetail + ')' : '') + ', puis active la vente.'],
      suspendu: ['Point suspendu', p.enseigne + ' : la vente des bons de marque est coupée' + (p.motifSuspension ? ' — ' + p.motifSuspension : '') + '. Contacte PayEnCash.'],
      clos: ['Point clos', p.enseigne + ' : le contrat est résilié' + (p.motifClos ? ' — ' + p.motifClos : '') + '. Plus aucun bon ne se vend ici ; les bons déjà vendus restent valables pour les clients.']
    };
    var t = T[p.statut] || ['Point non actif', p.enseigne + ' : statut « ' + (p.statut || '—') + ' » — la vente est réservée à un point actif.'];
    return { ok: false, code: p.statut || 'inconnu', point: p, titre: t[0], txt: t[1] };
  },
  // SESSION partenaire : l'id est posé au login (clé pec-partenaire-id) — jamais un point de repli
  partenaireActifId: function () { try { return localStorage.getItem('pec-partenaire-id') || null; } catch (e) { return null; } },
  /* OÙ ACHETER UN BON D’ACHAT — les commerces ACTIFS, pour la carte et les listes : dérivé, jamais listé à la main.
     (18/09, soir) UN SEUL CONTRAT POUR TOUS LES ÉCRANS — quatre d'entre eux recalculaient la distance eux-mêmes,
     chacun à sa façon : { pos } trie du plus proche au plus loin et ajoute distM / distTxt / pied ; { q } filtre sur le
     texte ; { ville } sur la ville ; { limite } coupe la liste. Sans position, l'ordre reste ville puis enseigne —
     on n'invente pas une proximité. Un commerce sans géoposition saisie est placé au centre de sa ville et le DIT
     (`geoApprox`) : l'écran peut afficher « position approchée » plutôt que de faire croire à une adresse pointée. */
  _pointPeutVendre: function (p) { var r = this.techRevendeurDuPoint(p.id); return !!r && this.techPeutVendre(r.id, null, 0).ok; },
  pointsBons: function (opts) {
    opts = opts || {};
    var self = this;
    /* (19/09, soir) LA CARTE DES COMMERCES NE MONTRE QUE LES SÉDENTAIRES. Un distributeur MOBILE n'a pas
       d'adresse : l'afficher ici, c'est l'épingler au centre d'une ville où il n'est pas — exactement le
       « déduire une position » qu'on s'interdit. Il se trouve par `agentsMobiles`, et par sa zone. */
    /* (23/09, nuit) ET QUI PEUVENT VENDRE : un point actif sans mandat SEPA, avec un impayé ou un encours plein refuserait la
       vente au comptoir — le client ferait le chemin pour rien. Même règle que le comptoir (techPeutVendre). */
    var l = this.partenaires().filter(function (p) { return p.statut === 'actif' && !self.partenaireEstMobile(p) && self._pointPeutVendre(p); }).map(function (p) {
      var geo = self.geoNormalise(p.geo);   // le repli « centre de la ville » est posé par _partenaireVerite : une seule source
      var o = { id: p.id, enseigne: p.enseigne, adresse: p.adresse || '', cp: p.cp || '', ville: p.ville || '',
                tel: p.tel || null, geo: geo, geoApprox: !!p.geoApprox };
      if (opts.pos && geo) { o.distM = self.distanceM(opts.pos, geo); o.distTxt = self.fmtDist(o.distM); o.pied = self.fmtPied(o.distM); }
      return o;
    });
    /* (20/09) CE QU'ON Y OBTIENT, DIT PAR LA DONNÉE. La carte portait cette phrase tant qu'il y avait deux
       réseaux à distinguer ; il n'en reste qu'un, mais la phrase reste utile — elle dit au client ce qu'il
       repart avec, et l'écran n'a pas à la réécrire. */
    l.forEach(function (p) { p.achete = 'Le bon de la marque, au montant exact, remis au comptoir.'; p.reseauLbl = self.techRef().nom; });
    return this._pointsTrier(l, opts);
  },
  /* ══ (21/09) LE TRI D'UNE LISTE DE POINTS DE VENTE — UNE FOIS, POUR LES DEUX RÉSEAUX ═════════════════════
     Les commerces du Bon d'achat PayEnCash (pointsBons) et les revendeurs d'une boutique PayEnCash
     Solution (techPoints) se cherchent, se filtrent et se trient de la même façon : c'est ce qui permet
     au choix « Comment veux-tu payer ? » d'être LE MÊME écran dans les deux lignes. Les points arrivent déjà
     avec leur distance (distM) quand on sait d'où mesurer. */
  _pointsTrier: function (l, opts) {
    opts = opts || {};
    var q = String(opts.q || '').toLowerCase().trim(), v = String(opts.ville || '').toLowerCase().trim();
    if (q) l = l.filter(function (p) { return (p.enseigne + ' ' + p.adresse + ' ' + p.ville).toLowerCase().indexOf(q) !== -1; });
    if (v) l = l.filter(function (p) { return String(p.ville || '').toLowerCase().indexOf(v) !== -1; });
    /* (19/09, soir — « récupère la carte, nombre mètre ») LE RAYON, REPRIS DE L'ÉCRAN D'AVANT LE CHANGEMENT DE
       MODÈLE : « − 500 m · 1 km · 2 km ». Il ne s'applique QUE si l'on sait d'où mesurer — sans position, un
       rayon ne veut rien dire, et on ne masque pas des commerces au nom d'une distance qu'on n'a pas. Une
       recherche ou une ville prime sur lui : on regarde CETTE ville, pas un cercle autour de soi. */
    if (opts.rayon > 0 && opts.pos && !q && !v) l = l.filter(function (p) { return p.distM != null && p.distM <= opts.rayon; });
    if (opts.pos) l.sort(function (a, b) { return (a.distM == null ? 1e9 : a.distM) - (b.distM == null ? 1e9 : b.distM); });
    else l.sort(function (a, b) { return (a.ville + a.enseigne).localeCompare(b.ville + b.enseigne, 'fr'); });
    return opts.limite ? l.slice(0, opts.limite) : l;
  },

  /* ══ (19/09, soir — décisions fondatrices : « réintègre l'app agent », « le partenaire et l'agent ont le MÊME
     contrat, cependant l'autre est mobile, il se déplace ») DEUX MODES D'EXERCICE, UN SEUL CONTRAT ════════════
     (24/09, soir — relecture juridique) LE CONTRAT DISTINGUE DÉSORMAIS LES DEUX : le commerce sédentaire achète le bon et le
     revend pour son propre compte ; le distributeur nomade est COMMISSIONNAIRE (art. L132-1 du code de commerce) — il vend en
     son nom pour notre compte et paie d'avance la valeur des bons qu'il revend. Ce qui change aussi, c'est où il exerce :
       · SÉDENTAIRE — un commerce, une adresse, des horaires : le client s'y rend ;
       · MOBILE — pas d'adresse : il définit LUI-MÊME sa zone à l'inscription, et c'est lui qui se déplace.
     C'est ce qui ramène l'agent supprimé le 18/09 au soir : il n'est plus un salarié qui transporte des fonds
     (risque CNAPS relevé le 17/09), c'est un indépendant — et l'encaissement reste celui du pivot,
     un débit sur SA carte au moment de la vente (décision fondatrice du 19/09 au soir : le distributeur ne
     détient jamais nos fonds, l'article 5 du contrat ne s'applique pas en reversement mensuel).
     LE MANAGER NE DÉFINIT PLUS LA ZONE : il accepte ou refuse la relation commerciale, rien de plus. ══ */
  /* LE MOT D'UNE PARTIE PRENANTE, lu au glossaire (ref.parties) : terme('nomade') → « distributeur nomade »,
     terme('commerce', 'clientPluriel', true) → « Points de vente ». Un écran n'écrit jamais son propre mot. */
  terme: function (partie, forme, maj) {
    var p = ((this.ref || {}).parties || {})[partie] || {}, t = p[forme || 'nom'] || p.nom || '';
    return maj ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  },
  /* LES DEUX MODES D'EXERCICE, NOMMÉS PAR LE GLOSSAIRE : « Distributeur mobile », « un agent se déplace », « chez un
     partenaire » — trois mots pour deux acteurs, et un « agent » qui évoquait le salarié encaisseur abandonné le 18/09. */
  get PARTENAIRE_MODES() {
    var t = this.terme.bind(this);
    return {
      sedentaire: { lbl: t('commerce', 'nom', true), court: t('commerce', 'court'), phrase: 'Le client vient à ton comptoir',
        clientLbl: 'Dans un ' + t('commerce', 'client'), clientAide: 'Un ' + t('commerce', 'client') + ' près de chez toi te vend ton bon au comptoir.' },
      mobile:     { lbl: t('nomade', 'nom', true), court: t('nomade', 'court'), phrase: 'Tu te déplaces jusqu’au client',
        clientLbl: 'Un ' + t('nomade', 'client') + ' se déplace', clientAide: 'Un ' + t('nomade', 'client') + ' vient jusqu’à toi et te vend ton bon sur place.' }
    };
  },
  partenaireMode: function (p) { var m = p && p.mode; return this.PARTENAIRE_MODES[m] ? m : 'sedentaire'; },
  partenaireModeLbl: function (p) { return (this.PARTENAIRE_MODES[this.partenaireMode(p)] || {}).lbl || ''; },
  partenaireEstMobile: function (p) { return this.partenaireMode(p) === 'mobile'; },

  /* LA ZONE D'UN DISTRIBUTEUR MOBILE — il la pose lui-même, et il est SEUL à pouvoir la changer. Les villes
     viennent du référentiel (ref.villesReseau) : on ne saisit pas une ville à la main, on en choisit. */
  zoneVillesRef: function () { return (((this.ref || {}).villesReseau) || []).map(function (v) { return { id: v.id, nom: v.nom, centre: v.centre }; }); },
  partenaireZoneSet: function (id, zone, par) {
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    if (!this.partenaireEstMobile(p)) return { ok: false, motif: 'Un commerce n\'a pas de zone : c\'est son adresse qui dit où il vend.' };
    var ref = this.zoneVillesRef(), noms = {}; ref.forEach(function (v) { noms[v.nom] = 1; noms[v.id] = v.nom; });
    var villes = ((zone && zone.villes) || []).map(function (v) { return noms[v] === 1 ? v : noms[v]; }).filter(Boolean);
    villes = villes.filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (!villes.length) return { ok: false, champ: 'villes', motif: 'Choisis au moins une ville où tu te déplaces — c\'est ce qui dit aux clients que tu peux les rejoindre.' };
    var r = Math.round(Number((zone && zone.rayonKm) || 0));
    var avant = p.zone || null;
    if (!this.partenaireEnregistrer({ id: p.id, zone: { villes: villes, rayonKm: r > 0 ? r : null } }, par || 'distributeur')) return { ok: false, motif: 'Zone non enregistrée : le stockage a refusé.' };
    try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('distributeur_zone', p.id, { par: par || null, avant: avant, apres: { villes: villes, rayonKm: r > 0 ? r : null } }); } catch (e) {}
    return { ok: true, zone: { villes: villes, rayonKm: r > 0 ? r : null } };
  },
  /* ══ (24/09, fondatrice — formulaire d'arbitrages : « corriger le contrat : tarif libre convenu ») LE TARIF DE DÉPLACEMENT DU NOMADE
     Il le fixe lui-même, l'affiche, et le convient avec son client au cas par cas ; PayEnCash ne pose ni plancher, ni plafond, ni
     tarif conseillé — un tarif imposé au commissionnaire tirerait la relation vers le lien de subordination. Il se facture en son nom.
     Zéro est un tarif (« sans frais ») ; l'absence de tarif se dit « à convenir ». */
  partenaireTarifSet: function (id, o, par) {
    o = o || {};
    var p = this.partenaire(id); if (!p) return { ok: false, motif: 'Point inconnu.' };
    if (!this.partenaireEstMobile(p)) return { ok: false, motif: 'Un commerce n\'a pas de tarif de déplacement : il vend au comptoir.' };
    var brut = String(o.tarif == null ? '' : o.tarif).trim().replace(',', '.');
    var tarif = brut === '' ? null : Math.round((parseFloat(brut) || 0) * 100) / 100;
    if (tarif != null && !(tarif >= 0 && tarif <= 1000)) return { ok: false, champ: 'tarif', motif: 'Le tarif se donne en euros, de 0 à 1 000 — ou reste vide (« à convenir »).' };
    var mention = String(o.mention || '').trim().slice(0, 140);
    if (!this.partenaireEnregistrer({ id: p.id, tarifDeplacement: tarif, tarifMention: mention || null }, par || 'distributeur')) return { ok: false, motif: 'Tarif non enregistré : le stockage a refusé l\'écriture.' };
    try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter('distributeur_tarif', p.id, { par: par || null, tarif: tarif, mention: mention || null }); } catch (e) {}
    return { ok: true, tarif: tarif, mention: mention || null };
  },
  /* CE QUE LE CLIENT LIT — le tarif tel que le nomade l'affiche, ou « à convenir » ; jamais un chiffre de la maison */
  partenaireTarifLbl: function (p) {
    if (!p || !this.partenaireEstMobile(p)) return '';
    if (p.tarifDeplacement == null) return 'déplacement : tarif à convenir';
    return p.tarifDeplacement === 0 ? 'déplacement sans frais' : 'déplacement : ' + this.eur(p.tarifDeplacement) + (p.tarifMention ? ' — ' + p.tarifMention : '');
  },
  partenaireZoneLbl: function (p) {
    var z = p && p.zone; if (!z || !(z.villes || []).length) return 'zone à définir';
    return z.villes.join(' · ') + (z.rayonKm ? ' (jusqu\'à ' + z.rayonKm + ' km)' : '');
  },
  /* La zone couvre-t-elle CE client ? Par sa ville, ou par sa position si un rayon est posé. */
  zoneCouvre: function (p, o) {
    o = o || {}; var z = p && p.zone; if (!z || !(z.villes || []).length) return false;
    var self = this;
    if (o.ville) { var v = this._sansAccent(o.ville); if (z.villes.some(function (x) { return self._sansAccent(x) === v; })) return true; }
    if (o.pos && z.rayonKm > 0) {
      var ref = this.zoneVillesRef();
      return z.villes.some(function (nom) {
        var c = ref.filter(function (x) { return x.nom === nom; })[0];
        return c && c.centre && self.distanceM(o.pos, c.centre) <= z.rayonKm * 1000;
      });
    }
    return false;
  },
  /* LES DISTRIBUTEURS MOBILES QUI PEUVENT REJOINDRE CE CLIENT — actifs, zone couvrante, triés par NOTE puis par
     distance. Même contrat de lecture que `pointsBons` : { ville, pos, limite }. */
  agentsMobiles: function (opts) {
    opts = opts || {}; var self = this;
    var l = this.partenaires().filter(function (p) { return p.statut === 'actif' && self.partenaireEstMobile(p) && self._pointPeutVendre(p); });
    if (opts.ville || opts.pos) l = l.filter(function (p) { return self.zoneCouvre(p, opts); });
    var out = l.map(function (p) {
      var n = self.distributeurNote(p.id);
      var o = { id: p.id, enseigne: p.enseigne, mode: 'mobile', zone: p.zone || null, zoneLbl: self.partenaireZoneLbl(p),
                note: n.note, avis: n.avis, ventes: n.ventes, geo: self.geoNormalise(p.geo), geoApprox: !!p.geoApprox };
      if (opts.pos && o.geo) { o.distM = self.distanceM(opts.pos, o.geo); o.distTxt = self.fmtDist(o.distM); }
      return o;
    });
    out.sort(function (a, b) {
      if ((b.note || 0) !== (a.note || 0)) return (b.note || 0) - (a.note || 0);
      return (a.distM == null ? 1e9 : a.distM) - (b.distM == null ? 1e9 : b.distM);
    });
    return opts.limite ? out.slice(0, opts.limite) : out;
  },

  /* ══ LA NOTE D'UN DISTRIBUTEUR (décision fondatrice 19/09, soir : « l'agent est noté ») ══════════════════
     Elle se DÉRIVE des notes laissées après une rencontre servie — jamais une étoile écrite d'avance. Un
     distributeur sans avis n'a pas zéro : il n'a pas encore de note, et l'écran le dit. Miroir SQL :
     distributor_ratings. */
  notesDistributeurGet: function () { try { return JSON.parse(localStorage.getItem('pec-distributeur-notes') || '[]') || []; } catch (e) { return []; } },
  distributeurNote: function (id) {
    var l = this.notesDistributeurGet().filter(function (n) { return n.distributeurId === id; });
    if (!l.length) return { note: null, avis: 0, ventes: 0, detail: [] };
    var som = l.reduce(function (s, n) { return s + (Number(n.note) || 0); }, 0);
    return { note: Math.round(som / l.length * 10) / 10, avis: l.length, ventes: l.length, detail: l.slice(0, 20) };
  },

  /* ══ « RENCONTRE UN AGENT » (décision fondatrice 19/09, soir — l'ancien « paiement à domicile », renommé)
     ═════════════════════════════════════════════════════════════════════════════════════════════
     Ce que le client demande, c'est un BON D'ACHAT — pas un encaissement de sa commande. L'agent ne vend que des
     bons (décision du 19/09 au soir) : le client pose ensuite le bon sur son sac, et le pivot reste intact
     (un seul moyen, le Bon d'achat PayEnCash, et rien d'autre).
     Le cycle, et chaque étape est un geste de quelqu'un :
       demandee  — le client demande, en disant où et pour combien ;
       acceptee  — un agent de la zone la prend (premier arrivé : on ne l'attribue pas d'office) ;
       servie    — ils se sont rencontrés, l'agent a vendu le ou les bons : les codes sont rattachés ;
       annulee   — par le client ou par l'agent, avec un motif ;
       expiree   — personne ne l'a prise dans la fenêtre.
     LE LIEU EST CELUI QUE LE CLIENT PROPOSE, et il est PUBLIC par défaut : on ne demande pas une adresse de
     domicile pour une rencontre d'argent — c'est ce qui distingue cette rencontre de l'ancien « à domicile ».
     Miroir SQL : distributor_meetings. ══ */
  RENCONTRE_STATUTS: {
    demandee: ['Demandée — en attente d\'un distributeur nomade', 'pec-pill--wait'],
    acceptee: ['Acceptée — un distributeur nomade vient', 'pec-pill--info'],
    servie:   ['Servie — bon d’achat remis', 'pec-pill--done'],
    annulee:  ['Annulée', 'pec-pill--off'],
    expiree:  ['Expirée — personne ne l\'a prise', 'pec-pill--off']
  },
  rencontreStatutLbl: function (st) { return (this.RENCONTRE_STATUTS[st] || [st || '—'])[0]; },
  rencontreStatutPill: function (st) { return (this.RENCONTRE_STATUTS[st] || ['', ''])[1]; },
  /* La fenêtre d'une demande : celle du référentiel des bons (fenêtre d'encaissement du scénario), jamais un
     nombre écrit ici — le manager l'ajuste comme le reste. */
  rencontreFenetreMin: function () { return ((this.scenario || {}).fenetreEncaissementMinutes) || 120; },
  rencontresGet: function () { try { return JSON.parse(localStorage.getItem('pec-rencontres') || '[]') || []; } catch (e) { return []; } },
  rencontre: function (id) { var d = this; return this.rencontresGet().map(function (r) { return d._rencontreVive(r); }).filter(function (r) { return r.id === id; })[0] || null; },
  _rencontreVive: function (r) {
    if (r.statut === 'demandee' && r.expireTs && Date.now() > r.expireTs) return Object.assign({}, r, { statut: 'expiree' });
    return r;
  },
  /* Ce que le prestataire coûte sur un prélèvement — affiché au manager (marge réelle), jamais au commerçant. */
  fraisPsp: function (montant) {
    var P = (this.ref.bons || {}).psp || {}, m = this._bonMontant(montant);
    var v = this.param ? this.param('bons.psp.commissionVariablePct', P.commissionVariablePct) : P.commissionVariablePct;
    var f = this.param ? this.param('bons.psp.commissionFixe', P.commissionFixe) : P.commissionFixe;
    if (!(m > 0) || v == null || f == null) return 0;
    return Math.round((m * v / 100 + f) * 100) / 100;
  },
  /* LE MOYEN DE RÈGLEMENT DU COMMERCE — enregistré une fois, réutilisé à chaque vente (tokenisation : le composant Stripe
     rend un identifiant de carte réutilisable, `tokenize`). On ne garde JAMAIS le numéro : l'empreinte suffit à débiter. */
  partenaireCarte: function (p) { p = typeof p === 'string' ? this.partenaire(p) : p; return (p && p.carte && p.carte.empreinte) ? p.carte : null; },
  /* ══ (22/09) LA CARTE DU POINT DE VENTE DE PAYENCASH SOLUTION A ÉTÉ RETIRÉE ══════════════════════════════════
     Le point ne paie plus la marque par carte au comptoir : il nous doit ses ventes et nous le prélevons par SEPA,
     sur le mandat qu'il a signé une fois (`techSepaMandatSigner('revendeur', …)`). Une carte enregistrée coûtait
     2,5 % à chaque bon ; un prélèvement coûte le prix d'un prélèvement, et c'est ce qui rend l'offre tenable. ══ */
  /* ══ LE TAUX DE COMMISSION D'UN COMMERCE (19/09 — « paramétrer la commission du partenaire pour tous ou un précisément ») ══
     UN taux vaut pour tout le réseau — `bonsRef().commissionPct`, réglé en 10-configuration — SAUF pour les commerces qui
     ont négocié le leur : `commissionPct` posé sur la fiche du point (pec-partenaires, miroir SQL `partners.commission_pct`)
     l'emporte alors, et pour lui seul. Une valeur absente ou nulle n'est PAS un taux à zéro : c'est « le taux du réseau » —
     c'est ce qui permet de RETIRER une exception sans avoir à la remplacer par un chiffre. Tout ce qui parle du taux d'un
     commerce passe par ici : la vente, le prélèvement, le relevé, l'autofacture et son contrat de distribution — lequel
     porte donc SON taux, et signale un avenant à signer le jour où il bouge. ══ */
  /* LA FICHE BRUTE D'UN POINT — ce qui est ÉCRIT, sans la dérivation de `_partenaireVerite`.
     (19/09) POURQUOI ELLE EXISTE : la fiche dérivée demande son état au coffre, le coffre compare les conditions du
     contrat signé à celles d'aujourd'hui, et ces conditions contiennent LE TAUX DE COMMISSION. Résoudre un identifiant
     par `partenaire(id)` pour connaître son taux rappelait donc la dérivation — sans fin, jusqu'à figer la page.
     Un taux est une donnée ÉCRITE sur la fiche : on la lit à la source, jamais au bout d'un calcul. */
  _partenaireBrut: function (id) {
    if (!id) return null;
    var ov = this.partenairesOverrides()[id] || null;
    if (!ov) return null;
    var p = Object.assign({ id: id }, ov);
    return p.supprime ? null : p;
  },
  commissionPoint: function (p) {
    var R = this.bonsRef(), reseau = +R.commissionPct;
    p = (p && typeof p === 'object') ? p : (p ? this._partenaireBrut(p) : null);
    var x = p ? p.commissionPct : null, propre = (x != null && x !== '' && isFinite(+x));
    return { pct: propre ? +x : reseau, tvaPct: +R.tvaCommissionPct, propre: propre, reseau: reseau,
      pointId: p ? p.id : null, enseigne: p ? p.enseigne : null };
  },
  /* Ce que le commerce doit à AJEK pour un bon d’achat de `montant` : la valeur faciale MOINS sa commission TTC.
     (19/09) Le point est un ARGUMENT : sans lui on applique le taux du réseau, avec lui le taux qui est vraiment le sien. */
  partenaireDu: function (montant, point) {
    var c = this.commissionPoint(point), m = this._bonMontant(montant), r2 = function (x) { return Math.round(x * 100) / 100; };
    var ht = r2(m * c.pct / 100), tva = r2(ht * c.tvaPct / 100);
    return { montant: m, commissionPct: c.pct, tvaPct: c.tvaPct, propre: c.propre, commissionHT: ht, tva: tva,
      commissionTTC: r2(ht + tva), net: r2(m - ht - tva) };
  },
  prelevementsGet: function (pointId) {
    var L = []; try { L = (window.PEC_BUS && PEC_BUS.etatGet) ? (PEC_BUS.etatGet('prelevements', []) || []) : []; } catch (e) {}
    return pointId ? L.filter(function (x) { return x.pointId === pointId; }) : L;
  },
  _prelevementsPut: function (L) { var v = null; try { v = PEC_BUS.etatSet('prelevements', L); } catch (e) {} return v != null; },
  /* LE PRÉLÈVEMENT D'UNE VENTE — appelé par `bonEmettre`, jamais par un écran : le bon d’achat et le débit naissent ensemble
     ou pas du tout. `o.echec` (scénarios, démonstration) force un refus pour montrer ce que le commerçant voit. */
  prelevementPartenaire: function (pointId, montant, o) {
    o = o || {}; var p = this.partenaire(pointId); if (!p) return { ok: false, motif: 'Point inconnu.' };
    var carte = this.partenaireCarte(p);
    if (!carte) return { ok: false, motif: 'carte_absente', message: 'Aucune carte enregistrée pour ce commerce : enregistre-la dans « Mon point » — c\'est elle qui règle PayEnCash à chaque bon d’achat vendu.' };
    var now = new Date();
    if (carte.annee < now.getFullYear() || (carte.annee === now.getFullYear() && carte.mois < now.getMonth() + 1)) {
      return { ok: false, motif: 'carte_expiree', message: 'La carte du commerce a expiré (' + String(carte.mois).padStart(2, '0') + '/' + carte.annee + ') — enregistre la nouvelle dans « Mon point » avant de vendre.' };
    }
    var d = this.partenaireDu(montant, p);
    if (!(d.net > 0)) return { ok: false, motif: 'montant', message: 'Montant à prélever invalide.' };
    var id = 'PRL-' + this._seq('prelevements', this._seqPlancher(this.prelevementsGet(), '^PRL-(\\d+)$'));
    if (id === 'PRL-null') return this._refusEcriture('Le prélèvement');
    var refuse = o.echec === true;
    /* (19/09) LE TAUX SE FIGE SUR LE PRÉLÈVEMENT. Il peut changer demain, pour ce commerce ou pour tout le réseau :
       ce qui a été retenu sur CETTE vente ne se recalcule pas — le relevé et l'autofacture le relisent ici. */
    var pr = { id: id, pointId: p.id, enseigne: p.enseigne, montantBon: d.montant, commissionPct: d.commissionPct, tvaPct: d.tvaPct,
      commissionHT: d.commissionHT, tva: d.tva,
      commissionTTC: d.commissionTTC, montant: d.net, fraisPsp: this.fraisPsp(d.net),
      statut: refuse ? 'refuse' : 'accepte', motif: refuse ? (o.motifEchec || 'Carte refusée par la banque (provision insuffisante).') : null,
      psp: ((this.ref.bons || {}).psp || {}).nom || null, reference: (refuse ? 'ECH-' : 'PAY-') + id.slice(4).padStart(6, '0'),
      carte: { last4: carte.last4, marque: carte.marque }, bon: null, at: Date.now(), par: o.par || 'partenaire' };
    var L = this.prelevementsGet(); L.unshift(pr);
    if (!this._prelevementsPut(L)) return this._refusEcriture('Le prélèvement');
    this._journal(refuse ? 'prelevement_refuse' : 'prelevement', p.id, { par: pr.par, enseigne: p.enseigne, montant: pr.montant, montantBon: pr.montantBon, commissionPct: pr.commissionPct, reference: pr.reference, last4: carte.last4, motif: pr.motif });
    if (refuse) return { ok: false, motif: 'carte_refusee', message: pr.motif + ' Le bon d’achat n\'est pas émis : rembourse le client, ou réessaie avec une autre carte.', prelevement: pr };
    return { ok: true, prelevement: pr };
  },
  // le prélèvement porte le bon d’achat qu'il a payé — posé par `bonEmettre` dès que le code existe
  _prelevementLier: function (id, code) {
    var L = this.prelevementsGet(), x = L.filter(function (y) { return y.id === id; })[0];
    if (!x) return false; x.bon = code; return this._prelevementsPut(L);
  },
  /* REMBOURSEMENT — un bon d’achat annulé au comptoir (jamais utilisé) rend au commerce ce qui lui a été prélevé. */
  prelevementRembourser: function (id, motif, par) {
    var L = this.prelevementsGet(), x = L.filter(function (y) { return y.id === id; })[0];
    if (!x) return { ok: false, motif: 'Prélèvement inconnu.' };
    if (x.statut !== 'accepte') return { ok: false, motif: 'Ce prélèvement n\'a pas été encaissé : il n\'y a rien à rembourser.' };
    x.statut = 'rembourse'; x.rembourseAt = Date.now(); x.motifRemboursement = motif || 'bon d’achat annulé'; x.remboursePar = par || 'système';
    if (!this._prelevementsPut(L)) return this._refusEcriture('Le remboursement du prélèvement');
    this._journal('prelevement_rembourse', x.pointId, { par: x.remboursePar, montant: x.montant, reference: x.reference, motif: x.motifRemboursement, bon: x.bon });
    return { ok: true, prelevement: x };
  },
  satisfactionsGet: function () { try { return JSON.parse(localStorage.getItem('pec-satisfaction') || '[]') || []; } catch (e) { return []; } },
  /* ── (08/09 — audit hotline) LE QUESTIONNAIRE POST-ÉCHANGE est ENVOYÉ (par e-mail depuis le 24/09, canal ref.hotline.satisfactionCanal) à la fin de
        chaque appel passé et de chaque demande close : une DEMANDE de satisfaction persistée (pec-satisfaction-demandes), que le
        client retrouve dans son Assistance (« note ton échange »). Sa réponse fait foi : note ≤ seuil → réclamation ouverte
        AUTOMATIQUEMENT au bus et demande close « insatisfait » ; sinon « satisfait ». Avant, la page hotline promettait le SMS et
        la réclamation automatique, et seul le manager pouvait saisir une note à la main. ── */
  satisfactionDemandesGet: function () { try { return JSON.parse(localStorage.getItem('pec-satisfaction-demandes') || '[]') || []; } catch (e) { return []; } },
  satisfactionDemander: function (o, par) {
    o = o || {}; if (!o.appelId && !o.demandeId) return { ok: false, motif: 'Rattache la demande de note à un appel ou à une demande.' };
    var l = this.satisfactionDemandesGet();
    var deja = l.filter(function (q) { return (o.appelId && q.appelId === o.appelId) || (o.demandeId && q.demandeId === o.demandeId); })[0];
    if (deja) return { ok: true, demande: deja, deja: true };
    var q = { id: 'SATQ-' + this._seq('satq', this._seqPlancher(l, '^SATQ-(\\d+)$')), appelId: o.appelId || null, demandeId: o.demandeId || null, ref: o.ref || null,
              client: o.client || null, clientId: o.clientId || null, tel: o.tel || null, canal: (this.ref.hotline || {}).satisfactionCanal || 'e-mail',
              at: Date.now(), repondueAt: null, reponseId: null, par: par || 'hotline' };
    /* (11/09) ON NE JOURNALISE PAS UN SMS QU'ON N'A PAS MIS EN FILE. L'écriture était avalée, puis le journal
       — la trace de référence — recevait `sms_satisfaction` et la fonction répondait « ok » : un questionnaire
       inexistant, tracé comme envoyé, que personne ne relancerait jamais. */
    l.unshift(q);
    var okEcr = true; try { localStorage.setItem('pec-satisfaction-demandes', JSON.stringify(l)); } catch (e) { okEcr = false; }
    if (!okEcr) return { ok: false, motif: 'stockage', message: 'Le questionnaire de satisfaction n\'a PAS été mis en file (stockage plein) — rien n\'a été envoyé ni tracé.' };
    this._journal('questionnaire_satisfaction', q.ref || q.appelId || q.demandeId, { par: q.par, canal: q.canal, client: q.client, demande: q.id });
    try { window.dispatchEvent(new CustomEvent('pec-bus')); } catch (e2) {}
    return { ok: true, demande: q };
  },
  // les questionnaires qui ATTENDENT la réponse d'un client (par identifiant de compte ou par nom)
  satisfactionEnAttente: function (client) {
    var id = client && client.id, nom = client && (client.nomComplet || client.nom || client);
    return this.satisfactionDemandesGet().filter(function (q) {
      if (q.repondueAt) return false;
      if (id && q.clientId) return q.clientId === id;
      return nom && q.client && String(q.client).trim() === String(nom).trim();
    });
  },
  satisfactionAjouter: function (o, par) {
    o = o || {}; var note = parseInt(o.note, 10);
    if (!(note >= 1 && note <= 5)) return { ok: false, motif: 'Une note de 1 à 5 est requise.' };
    if (!o.ref && !o.appelId && !o.demandeId) return { ok: false, motif: 'Rattache le questionnaire à un appel, à une demande ou à une référence de commande.' };
    var seuil = (this.ref.hotline || {}).satisfactionSeuilReclamation || 3, basse = note <= seuil;
    var l = this.satisfactionsGet();
    var r = { id: 'SAT-' + this._seq('sat', this._seqPlancher(l, '^SAT-(\\d+)$')), ref: o.ref || null, appelId: o.appelId || null, demandeId: o.demandeId || null, note: note,
              raison: String(o.raison || '').trim(), suggestions: String(o.suggestions || '').trim(), notes: String(o.notes || '').trim(),
              aRelancer: basse, reclamationId: null, at: Date.now() };
    // la réponse solde la demande de questionnaire correspondante
    var qs = this.satisfactionDemandesGet(), q = qs.filter(function (x) { return !x.repondueAt && ((o.appelId && x.appelId === o.appelId) || (o.demandeId && x.demandeId === o.demandeId)); })[0];
    if (q) { q.repondueAt = r.at; q.reponseId = r.id; try { localStorage.setItem('pec-satisfaction-demandes', JSON.stringify(qs)); } catch (e0) {} }
    // note ≤ seuil → RÉCLAMATION ouverte automatiquement (visible hotline ET manager) ; la demande close devient « insatisfait »
    try {
      if (window.PEC_BUS) {
        if (basse && PEC_BUS.ouvrirDemande) {
          var rec = PEC_BUS.ouvrirDemande({ type: 'reclamation', ref: r.ref || null, client: o.client || (q && q.client) || null, source: 'satisfaction',
            sujet: 'Insatisfaction après échange — note ' + note + '/5' + (o.appelId ? ' (appel ' + o.appelId + ')' : o.demandeId ? ' (demande ' + o.demandeId + ')' : ''),
            echanges: [{ qui: 'moi', texte: r.raison || ('Note ' + note + '/5 au questionnaire post-échange.'), at: r.at }] });
          r.reclamationId = rec ? rec.id : null;
        }
        if (o.demandeId && PEC_BUS.cloreDemande) PEC_BUS.cloreDemande(o.demandeId, basse ? 'clot_insatisfait' : 'clot_satisfait', { par: 'client', note: note });
      }
    } catch (e1) {}
    l.unshift(r); if (!this._ecrit('pec-satisfaction', l)) return this._refusEcriture('La note du client');
    this._journal('satisfaction_ajoutee', r.ref || r.appelId || r.demandeId, { par: par || 'client', note: note, aRelancer: r.aRelancer, reclamation: r.reclamationId });
    try { window.dispatchEvent(new CustomEvent('pec-bus')); } catch (e2) {}
    return { ok: true, reponse: r };
  },
  // (07/09 — audit manager) une écriture du back-office se JOURNALISE avec son auteur ; sans acteur explicite : la session
  /* ══ (11/09) ÉCRIRE, PUIS SEULEMENT SI ÇA A PRIS, TRACER ═══════════════════════════════════════════════
     `localStorage.setItem` lève quand le stockage de l'appareil est plein, et trente-trois fonctions du
     data-layer avalaient l'exception — puis appelaient `_journal`. Le journal, qui est LA trace de référence
     (c'est lui qu'on relit pour savoir ce qui s'est passé), attestait donc de faits qui n'avaient pas eu
     lieu : un avoir crédité que le client ne verrait jamais, une acceptation de contrat sans contrat, une
     prise de poste qui paierait une journée non enregistrée, une pièce publiée que personne ne verrait.
     `_ecrit` rend vrai/faux ; le refus se dit AVANT la trace. Miroir exact de `ecrire()` côté bus. ══ */
  _ECHEC_ECRITURE: null,
  _ecrit: function (cle, valeur) {
    try { localStorage.setItem(cle, typeof valeur === 'string' ? valeur : JSON.stringify(valeur)); return true; }
    catch (e) {
      this._ECHEC_ECRITURE = { cle: cle, at: Date.now(),
        motif: (e && e.name === 'QuotaExceededError') ? 'stockage plein' : ((e && e.message) || 'écriture refusée') };
      return false;
    }
  },
  _refusEcriture: function (quoi) {
    var m = (this._ECHEC_ECRITURE && this._ECHEC_ECRITURE.motif) || 'écriture refusée';
    return { ok: false, motif: 'stockage',
      message: quoi + ' n\'a PAS été enregistré (' + m + ') — libère de la place sur cet appareil et recommence ; rien n\'a été pris en compte.' };
  },

  /* ══ (11/09) UN NUMÉRO NE SE REJOUE PAS ═══════════════════════════════════════════════════════════════
     Quatorze identifiants étaient dérivés de `liste.length + 1`. Tant que rien ne disparaît, ça tient ; à la
     première suppression, le suivant reprend un numéro DÉJÀ donné. Sur les alertes, `alerteSupprimer` filtre
     par id : il en aurait effacé DEUX. Sur les comptes clients, la suppression RGPD libérait « cl33 », et la
     personne suivante héritait des favoris, de la fidélité, des commandes et du RIB scellés sous cet
     identifiant — dans le flux même dont le but est d'effacer. Le produit avait déjà la bonne réponse
     ailleurs (PEC_BUS.seq, pec-comptes-seq, pec-avoirs-seq) : un compteur qui n'avance que dans un sens.
     `plancher` l'amorce au plus grand numéro déjà attribué, pour ne rien casser de l'existant ; si le
     compteur ne peut pas s'écrire, on rend null — mieux vaut refuser que distribuer deux fois le même. ══ */
  _seq: function (nom, plancher) {
    var k = 'pec-seq:' + nom, n = 0;
    try { n = parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) {}
    if (plancher != null && plancher > n) n = plancher;
    n += 1;
    return this._ecrit(k, String(n)) ? n : null;
  },
  /* le plus grand numéro déjà porté par une liste — l'amorce du compteur sur une installation existante */
  _seqPlancher: function (liste, motif, champ) {
    var max = 0, re = new RegExp(motif), k = champ || 'id';
    (liste || []).forEach(function (x) { var m = re.exec(String((x && x[k]) || x || '')); if (m && +m[1] > max) max = +m[1]; });
    return max;
  },

  _journal: function (evt, ref, data) { var d = data || {}; if (!d.par) { var s = this.session ? this.session() : null; d.par = (s && s.identifiant) || 'manager'; } try { if (window.PEC_BUS && PEC_BUS.noter) PEC_BUS.noter(evt, ref, d); } catch (e) {} },

  /* ── COMPTABILITÉ DÉRIVÉE (fondatrice 03/09) : le compte de résultat et le journal comptable n'avaient aucune
        source — ils affichaient des zéros. Les écritures sont désormais DÉRIVÉES de ce qui existe vraiment :
        encaissements et remboursements (bus), dépôts d'espèces, factures fournisseurs Mode, masse salariale
        (référentiel RH × ref.paie).
        Le RÉGIME de TVA suit la ligne : Fly et occasion = marge (297 A CGI, pas de TVA détaillée), Mode neuf = 20 %.
        Rien n'est inventé : sans mouvement, le journal est vide et le dit. ── */
  /* ══ (11/09) LE RÉGIME DE TVA SE LISAIT SUR UN LIBELLÉ, ET NE VOYAIT JAMAIS RIEN ══════════════════
     Deux défauts superposés, le second masquant le premier :
     ① Il testait `/neuf/i` sur l'ÉTAT AFFICHÉ de la pièce. Or l'état et le régime sont deux choses :
        une paire « Neuf sans étiquette » revendue par un particulier porte `fiscal: 'occasion'` au
        référentiel — on lui aurait facturé 20 % de TVA sur une revente relevant de la marge. Le champ
        `fiscal` existe depuis toujours sur chaque pièce : c'est LUI qui dit le régime.
     ② Il cherchait ce libellé dans `cmd.lignes` ou `cmd.articleId` — or AUCUN écran n'envoie l'un ou
        l'autre au bus : la commande annoncée ne porte que son montant à payer. Le régime retombait donc
        sur la marge à TOUS LES COUPS : une pièce NEUVE vendue 120 € déclarait 0 € de TVA au lieu de 20,
        et le journal comptable la libellait « Reconditionné ».
     La commande porte désormais son caractère fiscal (`fiscal`), ses lignes à défaut, et l'article en
     dernier recours. ══ */
  regimeTva: function (cmd) {
    var f = this.fiscalite || {};
    if (!cmd) return f.voyage;
    if ((cmd.type || 'FLY') !== 'MODE') return f.voyage;
    var d = this;
    function estNeuf(a) { return !!a && (a.fiscal ? a.fiscal === 'neuf' : /neuf/i.test(a.etat || '')); }
    // ① le caractère fiscal porté PAR la commande (posé au moment de la vente) prime
    if (cmd.fiscal === 'neuf') return f.neuf;
    if (cmd.fiscal === 'occasion') return f.occasion;
    var neuf = false;
    try {
      var lignes = cmd.lignes || [];
      // ② toutes les lignes neuves → régime classique ; une seule pièce d'occasion et c'est la marge
      neuf = lignes.length ? lignes.every(function (l) { return estNeuf(d.article(l.articleId)); })
                           : estNeuf(d.article(cmd.articleId));
    } catch (e) {}
    return neuf ? f.neuf : f.occasion;
  },

  /* ── JOURNAL DES ENVOIS (manager/16) : aucun e-mail/SMS ne part de la maquette. Chaque événement du bus qui
        DEVRAIT déclencher un message est listé ici avec son destinataire et son statut « à envoyer (Brevo non
        branché) » — un journal honnête plutôt que des compteurs inventés. ── */
  /* (23/09 — grossiste) LE CATALOGUE DES MESSAGES SUIT LES ÉVÉNEMENTS QUI EXISTENT. Il ne connaissait que Mode et Fly
     (code de paiement, colis, avoir, remboursement) : aucune ligne pour une marque activée, un paiement de marque ou un
     prélèvement impayé. Chaque entrée est déclenchée par l'événement du même nom, noté au journal par la fonction qui fait
     le geste (PEC_BUS.noter → envoiPlanifier) ; `si` restreint l'envoi quand un même événement a deux auteurs — la
     réponse de la hotline part vers le demandeur, pas quand le demandeur répond lui-même. */
  MESSAGES_CATALOGUE: [
    // l'utilisateur de Mes bons, le commerce, les comptes du back-office
    { evt: 'compte_cree', canal: 'sms', modele: 'code_verification', objet: 'Ton code de vérification', cible: 'compte' },
    { evt: 'mdp_code_envoye', canal: 'sms', modele: 'code_mot_de_passe', objet: 'Ton code pour choisir un nouveau mot de passe', cible: 'compte' },
    { evt: 'compte_valide', canal: 'email', modele: 'compte_valide', objet: 'Ton compte est validé', cible: 'compte' },
    { evt: 'compte_refuse', canal: 'email', modele: 'compte_refuse', objet: 'Ta demande n\'a pas été retenue', cible: 'compte' },
    { evt: 'sav_reponse', si: { qui: 'hote' }, canal: 'email', modele: 'sav_reponse', objet: 'Réponse à ta demande', cible: 'demandeur' },
    // la marque (PayEnCash Solution)
    { evt: 'tech_marchand_inscrit', canal: 'email', modele: 'marque_inscrite', objet: 'Inscription reçue — ton compte reste inactif jusqu\'à la vérification', cible: 'marque' },
    /* (24/09, fondatrice : « e-mail à J+1 et J+7, avec le lien de l'étape ») les relances d'une inscription interrompue, marque ou partenaire */
    { evt: 'inscription_relance_j1', canal: 'email', modele: 'inscription_relance', objet: 'Ton inscription t\'attend — reprends là où tu t\'es arrêté', cible: 'compte' },
    { evt: 'inscription_relance_j7', canal: 'email', modele: 'inscription_relance', objet: 'Encore une étape et ton compte est prêt', cible: 'compte' },
    { evt: 'tech_marchand_valide', canal: 'email', modele: 'marque_active', objet: 'Ton compte est actif : le réseau peut acheter tes bons', cible: 'marque' },
    { evt: 'tech_marchand_suspendu', canal: 'email', modele: 'marque_suspendue', objet: 'Ton compte est suspendu', cible: 'marque' },
    { evt: 'tech_reglement_marque', canal: 'email', modele: 'paiement_marque', objet: 'Nous te payons les bons achetés par le réseau', cible: 'marque' },
    { evt: 'tech_lien_couvert', canal: 'email', modele: 'bon_propose_couvert', objet: 'Un bon que tu as proposé est couvert', cible: 'marque' },
    { evt: 'tech_facture_emise', canal: 'email', modele: 'facture_abonnement', objet: 'Ta facture PayEnCash Solution', cible: 'marque' },
    { evt: 'tech_facture_echec', canal: 'email', modele: 'carte_refusee', objet: 'Ta carte n\'a pas pu être débitée : mets-la à jour', cible: 'marque' },
    // le commerce du réseau
    { evt: 'point_active', canal: 'email', modele: 'point_actif', objet: 'Ton point de vente est actif', cible: 'commerce' },
    { evt: 'point_suspendu', canal: 'email', modele: 'point_suspendu', objet: 'Ton point de vente est suspendu', cible: 'commerce' },
    { evt: 'tech_penalite', canal: 'email', modele: 'prelevement_impaye', objet: 'Prélèvement impayé : la pénalité du contrat s\'applique', cible: 'commerce' }
  ],
  /* (09/09 — lot 1 socle) LE JOURNAL DES ENVOIS est PERSISTÉ (magasin du bus), alimenté à la source par PEC_BUS.noter :
     il était recalculé depuis le journal plafonné, donc les messages « à envoyer » disparaissaient au fil de la journée. */
  envoisGet: function () { try { return (window.PEC_BUS && PEC_BUS.etatGet) ? (PEC_BUS.etatGet('envois', []) || []) : []; } catch (e) { return []; } },
  envoiPlanifier: function (evt, ref, data) {
    data = data || {};
    var m = this.MESSAGES_CATALOGUE.filter(function (x) {
      return x.evt === evt && (!x.si || Object.keys(x.si).every(function (k) { return data[k] === x.si[k]; }));
    })[0]; if (!m) return null;
    var e = { at: Date.now(), evt: evt, canal: m.canal, modele: m.modele, objet: m.objet, cible: m.cible,
      destinataire: data.client || data.nom || data.identifiant || ref || '—', ref: ref, clientId: data.clientId || null,
      statut: 'à envoyer', motifStatut: 'Brevo non branché — la maquette n\'envoie rien' };
    var L = this.envoisGet(); L.unshift(e); if (L.length > 500) L = L.slice(0, 500);
    try { PEC_BUS.etatSet('envois', L); } catch (ex) {}
    return e;
  },
  /* ══ (24/09, fondatrice) LES RELANCES D'UNE INSCRIPTION INTERROMPUE — J+1 et J+7 après le dernier geste, avec le lien de la prochaine
     étape ; jamais deux fois la même relance, jamais après l'envoi. Une tâche de la maison (manager › Communications, ou la tâche de
     nuit en production) la rejoue sans rien doubler : ce qui a été relancé est écrit sur le compte (relances.j1 / j7). */
  inscriptionsRelancer: function (o) {
    o = o || {};
    var self = this, now = o.now == null ? Date.now() : o.now, jour = 86400000, envois = [], paliers = [{ cle: 'j1', jours: 1 }, { cle: 'j7', jours: 7 }];
    var dernierGeste = function (c) { var j = c.journal || []; return j.length ? (j[j.length - 1].at || c.creeLe || 0) : (c.creeLe || 0); };
    this.comptesTous().forEach(function (c) {
      if (c.statut === 'supprime' || c.statut === 'refuse') return;
      var etape = null, lien = null;
      if (c.espace === 'marque') {
        var m = self.techMarchandParCompte(c.id); if (!m || m.statut !== 'draft') return;
        var st = self.techMarchandInscription(m.id), pro = st && st.etapes.filter(function (e) { return e.cle === st.prochaine; })[0];
        etape = pro ? pro.lbl : 'envoi'; lien = 'ui/tech/00-inscription.html';
      } else if (c.espace === 'partenaire') {
        if (c.statut !== 'inscription' && c.statut !== 'a_verifier') return;
        var sc = self.partenaireCandidature(c.id), pp = sc && sc.etapes.filter(function (e) { return e.cle === sc.prochaine; })[0];
        etape = pp ? pp.lbl : 'envoi'; lien = 'ui/partenaire/00-inscription.html';
      } else return;
      var age = (now - dernierGeste(c)) / jour, rel = c.relances || {};
      paliers.forEach(function (pal) {
        if (age < pal.jours || rel[pal.cle]) return;
        var e = self.envoiPlanifier('inscription_relance_' + pal.cle, c.id, { identifiant: c.identifiant, etape: etape, lien: lien, espace: c.espace });
        if (e) { rel[pal.cle] = now; envois.push({ compte: c.id, espace: c.espace, palier: pal.cle, etape: etape }); }
      });
      if (envois.some(function (x) { return x.compte === c.id; })) self._compteMaj(c, { relances: rel }, 'compte_relance', { paliers: Object.keys(rel) });
    });
    return { ok: true, envois: envois };
  },
  envoisJournal: function (limite) {
    var l = this.envoisGet();
    return limite ? l.slice(0, limite) : l;
  },
  envoisParCanal: function () {
    var o = { email: 0, sms: 0, push: 0 };
    this.envoisJournal().forEach(function (e) { o[e.canal] = (o[e.canal] || 0) + 1; });
    return o;
  },

  /* (18/09, soir) LE PLANNING DES AGENTS est parti avec l'agent de caisse mobile : `CRENEAUX_JOUR` (matin,
     après-midi, soir), `JOURS_SEMAINE`, `PLANNING_JOURS_MAX` et la proposition « Optimiser » calaient la présence
     de salariés qui se déplaçaient encaisser. Plus de déplacement, plus de présence à caler. Le planning de la
     HOTLINE (`hotlinePlanning`) n'a rien à voir et reste en place. */

  // LIVRAISON — textes publics dérivés du référentiel `mode.panier.livraison` (jamais de chiffre écrit dans une page).
  // Chaque phrase porte sa SOURCE (Mondial Relay / PayEnCash / Code conso) : c'est ce qui répond à « d'où sort cette info ? ».
  livraisonInfo: function () {
    var L = this.mode.panier.livraison, S = L.sources || {};
    var RJ = (this.mode.retour && this.mode.retour.jours) || L.retourJours;   // UNE source pour la rétractation : mode.retour.jours
    var delai = L.delaiOuvres[0] + ' à ' + L.delaiOuvres[1] + ' j ouvrés';
    return {
      transporteur: L.transporteur, incluse: !!L.incluse, gardeJours: L.gardeJours, retourJours: RJ,
      delai: delai,                                                                   // « 3 à 5 j ouvrés »
      delaiTotal: L.preparationOuvres + ' j ouvrés de préparation + ' + delai + ' d\'acheminement',
      garde: 'colis gardé ' + L.gardeJours + ' jours au relais',
      retrait: 'retrait avec ' + L.retrait,
      relais: L.transporteur + ' · ' + L.garde,                                        // (compat) libellé court
      phrase: 'Point relais ' + L.transporteur + ' · colis gardé ' + L.gardeJours + ' jours · retrait avec ' + L.retrait + '.',
      source: 'Conditions ' + L.transporteur,                                          // mention publique courte
      // variantes prêtes à afficher (fiche, panier, sheet relais) — une seule origine
      retourCourt: 'Retour ' + RJ + ' j (rétractation)',
      retourJoursTxt: RJ + ' jours',
      detail: 'Préparation chez le fournisseur (' + L.preparationOuvres + ' j ouvrés), puis ' + L.transporteur + ' (' + delai + ' en relais — délais indicatifs du réseau). Suivi en direct dès l\'expédition · colis gardé ' + L.gardeJours + ' jours au relais.',
      resume: L.transporteur + ' ' + L.delaiOuvres[0] + '–' + L.delaiOuvres[1] + ' j' + (L.incluse ? ' incluse' : '') + ' · retour ' + RJ + ' j (rétractation)',
      sheet: 'Livraison' + (L.incluse ? ' incluse' : '') + ' · colis gardé ' + L.gardeJours + ' jours · retrait avec ' + L.retrait + ' — ' + 'conditions ' + L.transporteur + '.',
      sources: S
    };
  },
  /* (12/09, chasse) FERMER UNE SESSION, CE N'EST PAS EN OUVRIR UNE AUTRE. `fournisseurActifSet(null)` rabattait
     `mode.fournisseurCourant` sur le PREMIER atelier du référentiel : un fournisseur suspendu, dont l'amorce
     ferme la session, se retrouvait dans l'espace de « Chez Awa » — son stock, ses factures, son IBAN. Sans
     session, il n'y a pas de fournisseur courant : les écrans doivent le dire, pas servir celui d'à côté. */
  fournisseurActifSet: function (nom) {
    try { if (nom) localStorage.setItem('pec-fournisseur-actif', nom); else localStorage.removeItem('pec-fournisseur-actif'); } catch (e) {}
    this.mode.fournisseurCourant = nom || null;
    return this.mode.fournisseurCourant;
  },
  // (06/09) `nom` OPTIONNEL : sans lui c'est la fiche de la SESSION (le cas de toutes les pages
  // fournisseur). Avec, c'est la fiche du fournisseur demandé — le reporting et le manager peuvent
  // lire la fiche de quelqu'un d'autre sans se voir servir celle de la session ouverte.
  fournisseurEntreprise: function (nom) {
    var base = this.mode.fournisseurEntreprise || {};
    // le compte CONNECTÉ prime (fondatrice 02/09 : fournisseurs distincts) — ses coordonnées remplacent celles du seed
    // (02/09) chaque compte a SA fiche : identifiants (SIREN, SIRET, TVA, RCS, NAF, IBAN, BIC, tel) DÉRIVÉS de façon
    // stable depuis l'id du compte — plus jamais le RCS Paris et l'IBAN de Chez Awa sur Sneak'Hall Marseille
    /* ══ (11/09 — constat C4 du 09/09) L'IDENTITÉ RELEVÉE GAGNE, ET ELLE GAGNE POUR TOUT LE MONDE ══════════
       Deux défauts se cachaient dans une seule ligne.
       ① La dérivation était SAUTÉE quand le fournisseur actif portait le nom du seed : `actif.nom !== base.enseigne`
          est FAUX pour « Chez Awa », donc sa fiche rendait le seed — SIREN, SIRET, TVA, RCS et IBAN écrits en dur.
          Le contrat-cadre et les factures d'autofacturation (art. 289 CGI) les IMPRIMAIENT. Vérifié en le faisant :
          après avoir relevé « Chez Awa SAS · SIRET 91245678900027 · 12 rue Myrha · IBAN FR76 3000 4000 0312 3456
          7890 143 » au dossier, la fiche rendait encore « Chez Awa SARL · 912 456 789 00027 · 18 rue des Gardes »
          et l'IBAN du seed — une raison sociale, une forme juridique, une adresse et un COMPTE DE RÈGLEMENT qui
          n'appartiennent à personne, sur un acte signé.
       ② L'ordre de fusion mettait `actif.entreprise` APRÈS les mentions relevées : la fiche commerciale du
          référentiel (raison sociale, adresse) écrasait ce qui avait été vérifié pièce en main. Elle passe donc
          avant, et les mentions relevées se posent en dernier — champ par champ, sans jamais effacer avec du vide. */
    var actif = this.fournisseur(nom || this.mode.fournisseurCourant);
    if (actif) {
      base = Object.assign({}, base, actif.entreprise || {}, { categories: actif.categories, notifications: base.notifications });
      var _rel = this.entrepriseDeriveeFournisseur(actif) || {};
      Object.keys(_rel).forEach(function (k) { var v = _rel[k]; if (v !== null && v !== undefined && v !== '') base[k] = v; });
    }
    // éditions persistées SCOPÉES par compte (audit 03/09 : un IBAN modifié depuis Sneak'Hall atterrissait sur la fiche de Chez Awa)
    // (audit 05/09) le snapshot du fournisseur ne doit JAMAIS écraser ce que le MANAGER décide :
    // le STATUT du KYB appartient au manager (fournisseursAccesSet). Avant, dès que le fournisseur
    // déposait un document, « en vérification » se figeait pour toujours — même après validation.
    var res = base;
    try {
      var o = JSON.parse(localStorage.getItem('pec-fournisseur-entreprise:' + ((actif && actif.id) || this._fournisseurIdActif())) || 'null');
      if (o) {
        var fus = Object.assign({}, base, o);
        fus.kyb = Object.assign({}, (o && o.kyb) || {}, (base && base.kyb) || {});   // le manager tranche
        res = fus;
      }
    } catch (e) {}
    return this._fournisseurVerite(res, (actif && actif.id) || this._fournisseurIdActif());
  },
  /* (07/09 — audit fournisseur, capture : l'accueil disait « Fournisseur vérifié · KYB validé » pendant que le dossier
     affichait « 0 / 5 pièces validées » et le contrat « signé le mars 2026 » sans document signé) UNE SEULE VÉRITÉ :
     le dossier de documents (PEC_DOCS). Le statut KYB et la signature du contrat se DÉRIVENT des pièces validées
     et du document signé — jamais d'un statut posé sur la fiche. */
  _fournisseurVerite: function (E, id) {
    if (!E || !window.PEC_DOCS || !PEC_DOCS.etat) return E;
    try {
      var e = PEC_DOCS.etat('fournisseur', id);
      var r = Object.assign({}, E);
      r.kyb = Object.assign({}, E.kyb || {}, { statut: e.etat === 'valide' ? 'valide' : (e.etat === 'a_corriger' ? 'a_corriger' : (e.etat === 'en_verification' ? 'en_verification' : 'en_cours')), libelle: e.libelle, manquantes: (e.manquantes || []).length, refusees: (e.refusees || []).length });
      // (08/09) la grille et le délai viennent du référentiel — les phrases figées « +12 % » / « ≤ 7 j » de la fiche ne pilotent plus rien
      delete r.kyb.kbis; delete r.kyb.cni; delete r.kyb.rib;   // vestiges du dossier à 3 pièces : le coffre (9 pièces) fait foi
      // (08/09 — audit fournisseur) UNE affectation : conditions du référentiel + signature lue du coffre (avant, la 2e affectation écrasait la 1re
      // et la fiche gardait ses phrases écrites « +12 % » / « ≤ 7 j »)
      var ct = PEC_DOCS.get ? PEC_DOCS.get('fournisseur', id, 'contrat') : null;
      r.contrat = Object.assign({}, E.contrat || {}, this.contratConditions(), { signeLe: (ct && ct.signe && ct.signeAt) ? new Date(ct.signeAt).toLocaleDateString('fr-FR') : null, signataire: (ct && ct.signe) ? ct.signataire : null });
      return r;
    } catch (e2) { return E; }
  },
  contratConditions: function () {
    var gl = this.grilleModeLibelle(), vj = (this.ref.juridique || {}).virementJours;
    return { type: "Contrat-cadre d'achat ferme",
      grille: gl != null ? 'prix client = ' + gl + ' · TVA sur la marge (297 A CGI)' : '—',
      virement: vj != null ? 'sous ' + vj + ' j après contrôle atelier' : '—' };
  },
  _fournisseurIdActif: function () { return (this.fournisseur(this.mode.fournisseurCourant) || {}).id || null; },


  /* ══ (12/09 — demande fondatrice « relier leurs réseaux sociaux depuis leur espace ») ═══════════════════════
     L'atelier partenaire vit de sa communauté, et le produit ne lui offrait AUCUN endroit pour relier ses comptes :
     `06-partage` proposait « Copier pour Instagram » sans jamais pouvoir citer LE SIEN, la page vendeur côté Mode
     n'en montrait rien, et les seuls réseaux stockés étaient ceux de PayEnCash (`ref.reseaux`) et ceux des
     influenceuses du marketing. Trois règles tenues ici :
       · ce qui se relie est un IDENTIFIANT, pas une URL libre — le lien se DÉRIVE du réseau (on ne publie pas
         un lien vers n'importe où sur une page ouverte au public) ; un lien collé en entier est accepté mais
         RÉDUIT à son identifiant, et refusé s'il pointe ailleurs que le réseau choisi ;
       · chaque lien porte sa VISIBILITÉ : relier son compte pour la relation commerciale n'oblige pas à
         l'afficher sur sa boutique ;
       · rien n'est « vérifié » tant que personne n'a vérifié : le lien est DÉCLARÉ par le fournisseur, et la
         page le dit — aucune pastille de confiance inventée.
     Stockage : la fiche entreprise du compte (`pec-fournisseur-entreprise:<id>`), déjà scopée par fournisseur,
     déjà journalisée, déjà diffusée aux autres onglets — aucune deuxième clé, aucun second chemin d'écriture. ══ */
  RESEAUX_BOUTIQUE: [
    { k: 'instagram', lbl: 'Instagram', base: 'https://instagram.com/',          hotes: ['instagram.com'],           motif: /^[A-Za-z0-9._]{1,30}$/,        arobase: true,  exemple: 'chez.awa',   aide: "l'identifiant du compte, sans @ — lettres, chiffres, point et tiret bas" },
    { k: 'tiktok',    lbl: 'TikTok',    base: 'https://www.tiktok.com/@',        hotes: ['tiktok.com'],              motif: /^[A-Za-z0-9._]{2,24}$/,        arobase: true,  exemple: 'chezawa',    aide: "l'identifiant TikTok, sans @ — 2 à 24 caractères" },
    { k: 'snapchat',  lbl: 'Snapchat',  base: 'https://www.snapchat.com/add/',   hotes: ['snapchat.com'],            motif: /^[A-Za-z][A-Za-z0-9._-]{2,14}$/, arobase: true, exemple: 'chez-awa',   aide: "le nom d'utilisateur Snapchat — commence par une lettre, 3 à 15 caractères" },
    { k: 'facebook',  lbl: 'Facebook',  base: 'https://www.facebook.com/',       hotes: ['facebook.com', 'fb.com'],  motif: /^[A-Za-z0-9.]{5,50}$/,         arobase: false, exemple: 'chezawa.paris', aide: "le nom de la page Facebook tel qu'il apparaît dans son adresse" },
    { k: 'whatsapp',  lbl: 'WhatsApp Business', base: 'https://wa.me/',          hotes: ['wa.me', 'whatsapp.com'],   motif: /^[0-9]{8,15}$/,                arobase: false, exemple: '33612345678', aide: 'le numéro au format international, chiffres seuls (33… pour la France)' },
    { k: 'site',      lbl: 'Site web',  base: 'https://',                        hotes: [],                          motif: /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i, arobase: false, exemple: 'chezawa.fr', aide: "le nom de domaine seul (sans https:// ni chemin)" }
  ],
  reseauBoutique: function (k) { return this.RESEAUX_BOUTIQUE.filter(function (r) { return r.k === k; })[0] || null; },

  suggestionsCategorie: function (cat) { return (this.mode.suggestions || {})[cat] || null; },
  // Marques proposées au fournisseur, FILTRÉES par catégorie/sous-catégorie, dédoublonnées,
  // « Sans marque » et « Proposer une marque » toujours en fin de liste.
  marquesPour: function (cat, sous) {
    var cm = this.mode.catalogueMarques || {};
    var base = (sous && cm.parSousCategorie && cm.parSousCategorie[sous])
      || (cat && cm.parCategorie && cm.parCategorie[cat])
      || cm.referentiel || [];
    var out = [], seen = {};
    base.forEach(function (m) { if (!seen[m]) { seen[m] = 1; out.push(m); } });
    if (cm.sansMarque) out.push(cm.sansMarque);
    if (cm.proposition) out.push(cm.proposition);
    return out;
  },
  // Grille de tailles pour une (catégorie, sous-catégorie) — source UNIQUE (grillesTailles).
  // Accepte les noms du wizard ('Sneakers'…) ET les codes client ('sneakers','pap'…).
  _grilleKey: function (cat, sub) {
    var overSub = { "Jeans": "bas", "Pantalons": "bas", "Shorts": "bas", "Jupes": "bas", "Ceintures": "ceintures", "Bonnets & écharpes": "bonnets", "Gants": "gants" };
    var defCat = {
      "Sneakers": "chaussures", "sneakers": "chaussures",
      "Prêt-à-porter": "vetements", "pap": "vetements", "pretaporter": "vetements",
      "Accessoires": "unique", "accessoires": "unique"
    };
    // Catégorie TRANSVERSE (« reconditionne ») : la famille se déduit du TYPE via l'arbre (audit 02/09 :
    // « Lifestyle » sous Reconditionné donnait « Unique » au lieu de 36-47). Sans effet sur le générateur
    // (il passe les noms de l'arbre, présents dans defCat) → aucun tirage PRNG décalé.
    if (!defCat[cat] && sub && !overSub[sub]) cat = this._catDuType(sub) || cat;
    return (sub && overSub[sub]) || defCat[cat] || "unique";
  },
  // Catégorie de l'arbre qui possède ce TYPE (sous-catégorie) — pour les catégories transverses.
  // categoriesArbre[k] = { ico, subs:[…] } (jamais un tableau nu).
  _catDuType: function (sub) {
    var arbre = (this.mode && this.mode.categoriesArbre) || {};
    for (var k in arbre) { var subs = (arbre[k] && arbre[k].subs) || []; if (subs.indexOf(sub) !== -1) return k; }
    return null;
  },
  // Matières proposées pour une (catégorie, type) : liste du TYPE si elle existe, sinon la famille de taille.
  matieresPour: function (cat, sub) {
    var m = this.mode, t = sub && (m.matieresParType || {})[sub];
    if (t) return t.slice();
    var f = (m.matieresParFamille || {})[this._grilleKey(cat, sub)];
    return (f || m.matieresListe || []).slice();
  },
  // Suggestions fusionnées catégorie → type (composition, entretien, poids, matière par défaut).
  suggestionsPour: function (cat, sub) {
    var base = this.suggestionsCategorie(cat) || {}, t = sub && (this.mode.suggestionsParType || {})[sub];
    var out = { matiereDefaut: (base.matiereDefaut || []).slice(), compo: (base.compo || []).slice(), careDefaut: (base.careDefaut || []).slice(), poids: base.poids, prefixe: base.prefixe, tailles: base.tailles };
    if (t) { if (t.compo) out.compo = t.compo.slice(); if (t.care) out.careDefaut = t.care.slice(); if (t.poids) out.poids = t.poids; }
    // matière par défaut = la première matière du type quand elle existe (un jean → denim, une montre → acier)
    var mt = sub && this.matieresPour(cat, sub); if (sub && (this.mode.matieresParType || {})[sub] && mt.length) out.matiereDefaut = [mt[0]];
    if (sub === 'Jeans') out.matiereDefaut = ['Denim'];
    return out;
  },
  defautsPour: function (cat, sub) {
    var f = (this.mode.defautsParFamille || {})[this._grilleKey(cat, sub)];
    return (f || this.mode.defautsTypes || []).slice();
  },
  taillesPour: function (cat, sub) {
    var g = this.mode.grillesTailles || {};
    return (g[this._grilleKey(cat, sub)] || g.unique || ["Unique"]).slice();
  },
  guideTaillesPour: function (cat, sub) {
    return (this.mode.guideTailles || {})[this._grilleKey(cat, sub)] || null;
  },
  // ── PHOTOS RÉELLES (libres de droit, Unsplash) par famille visuelle. Une pièce n'affiche
  //    plus une photo recyclée : chaque article tire une vraie image de sa famille (sneaker,
  //    robe, jean, veste, sac, montre…), de façon déterministe (même article → même photo). ──
  // PHOTOS PAR TYPE (fondatrice 02/09 : « les images doivent correspondre à la catégorie ET la sous-catégorie ») —
  // 10 vraies photos Unsplash (portrait, non premium) par sous-catégorie, relevées par mot-clé du type. photoArticle()
  // les préfère à la famille visuelle ; photosCatalogue reste le repli (canoniques, looks).
  photosParType: {
    "Robes": ["1721990336298-90832e791b5a", "1657373307141-349a3393d4d9", "1629737166947-7b5b5ad11622", "1637690048998-1e41c61c254d", "1603914579990-df79451fe9b1", "1762154057377-cc9d3dd6900c", "1651828855101-38dba7f57245", "1590512314358-106da45e067c", "1557771551-634f8d68b0a5", "1599662875272-64de8289f6d8"],
    "Manteaux & doudounes": ["1539533018447-63fcce2678e3", "1737508945707-ebdccee97cc5", "1611747582190-feff22542ba1", "1774754747555-71ef65a23035", "1768134152610-27355e256513", "1774754748211-2cd238bd3448", "1774754747569-ef2ee9129487", "1768372539716-9128f358d217", "1768372644348-7b731e4288a7", "1774754747690-9a943b51dcc0"],
    "Vestes & blousons": ["1513094735237-8f2714d57c13", "1589363358751-ab05797e5629", "1544022613-e87ca75a784a", "1602370463198-086436840055", "1675877879221-871aa9f7c314", "1602562887763-851fa56061e3", "1584216338898-f34d78201414", "1634926938182-f6f6ad286640", "1589363463135-e811e08d8ace", "1551713816-fd3b4a889969"],
    "Blazers & tailleurs": ["1618886614638-80e3c103d31a", "1617137968427-85924c800a22", "1617137984095-74e4e5e3613f", "1617127365659-c47fa864d8bc", "1622497170185-5d668f816a56", "1623880840102-7df0a9f3545b", "1622450180332-3da1126f10a4", "1603394151492-5e9b974b090b", "1631052066165-9720608b36da", "1630173250799-2813d34ed14b"],
    "Ensembles & costumes": ["1617137984095-74e4e5e3613f", "1623880840102-7df0a9f3545b", "1548454782-15b189d129ab", "1600091166971-7f9faad6c1e2", "1534030347209-467a5b0ad3e6", "1522968439036-e6338d0ed84f", "1603394151492-5e9b974b090b", "1472417583565-62e7bdeda490", "1585412459212-8def26f7e84c", "1642886513531-5a1cf3ba164a"],
    "Pulls & gilets": ["1574201635302-388dd92a4c3f", "1601379327928-bedfaf9da2d0", "1610901157620-340856d0a50f", "1580331451062-99ff652288d7", "1600369672890-ac00f1907858", "1610973310510-82f514ea1986", "1641642231157-0849081598a2", "1571139627661-cf707929f465", "1612797748239-a83ed306dcfc", "1646270968349-dafd9f758e93"],
    "Sweats & hoodies": ["1688111421205-a0a85415b224", "1632682582909-2b3a2581eef7", "1512977141980-8cc662e38a0c", "1525199078165-69ce4f553361", "1576790807856-b9205fb5703f", "1619708443838-df616a72bb74", "1618924250113-e162305ac8cd", "1595175131454-8eba9a7e1997", "1635105864405-3e75f624d8aa", "1594587002961-1a75dfaf34b8"],
    "Chemises & blouses": ["1596755094514-f87e34085b2c", "1548778943-5bbeeb1ba6c1", "1555085506-82b8d30d8380", "1566207274740-0f8cf6b7d5a5", "1651687965960-73fe31a2940a", "1595272251257-1bbe120103d5", "1772986054126-b8772372b672", "1704775990821-23af362863d9", "1600973964462-0cf10488d440", "1764337593519-c51a77b4fc3d"],
    "Tops & bodies": ["1633291851903-b684b574d58e", "1718431766314-22a39439e8c0", "1617468505637-1230fb86d2cf", "1711188054302-75e493d78646", "1749113352295-59ac5c036cd6", "1749113352605-b974d2fb54c4", "1604723912979-d5b5ca726c7b", "1749113352366-3a156307ae39", "1783702256421-afb7ef4128dd", "1749113350631-9f4f7e4634a2"],
    "T-shirts & débardeurs": ["1746899603348-ab9afd71e16d", "1759572095329-1dcf9522762b", "1685883518316-355533810d68", "1781705580475-ba86eb972446", "1768935706759-f2be765b3aec", "1622445275463-afa2ab738c34", "1775234576198-a1c680241c07", "1777899051916-067557782b78", "1520923179278-ee25e25e09e4", "1775234576215-4374ffe00b36"],
    "Jeans": ["1602293589930-45aad59ba3ab", "1714729382668-7bc3bb261662", "1721637286605-ae9be19d681f", "1671624759834-bcf0d3dd2517", "1541099649105-f69ad21f3246", "1475178626620-a4d074967452", "1713880453396-aa0493e308ec", "1714729382688-84602a1bd6ec", "1715758890151-2c15d5d482aa", "1741941171881-40832346c7fe"],
    "Pantalons": ["1641839875097-ce22925a0c85", "1633963643586-1a39077623be", "1715532098304-1e81e1f42600", "1525520253389-596543dfe0ee", "1552902875-9ac1f9fe0c07", "1552902865-b72c031ac5ea", "1517445312882-bc9910d016b7", "1779406166955-371cb625567d", "1559334418-672d5a48531b", "1786633861048-9338b24a7434"],
    "Shorts": ["1602437234309-f158b0f83155", "1784916423678-be601c8ccb8b", "1555779877-768c07113b4f", "1780396575834-b7fc396ac77c", "1787057856958-a4c1df18351f", "1776951129328-d85072dbdefe", "1573594699769-596cee3fe733", "1627608172726-8f621568ca28", "1628476801147-b3e3cb99fe68", "1774874017217-c441aa77c73b"],
    "Jupes": ["1653419403196-ab64c4c740c3", "1590852669429-d1cd8775ea59", "1700748910920-81f4826ede95", "1700748910236-3b744b8dacad", "1700748911489-0552c576f274", "1574413230119-f302e1c9035d", "1574413230698-f80892c96e13", "1762343041573-aa2827852bc9", "1551180452-cc3ca222cdfb", "1553096763-6fb9cdc4df14"],
    "Combinaisons": ["1495385794356-15371f348c31", "1556648202-80e751c133da", "1768982596726-c01dd8a8af32", "1768982596945-97c5aa2be5d0", "1768803968271-06b01687c53b", "1763558978011-55404124a148", "1767077280665-c3e251378f9e", "1768803968246-5b8c7d04b722", "1768803968262-320d4752966f", "1768803968265-1385a31e2be5"],
    "Survêtements": ["1540254597053-3901b858d40f", "1602670935908-094f41dcb67c", "1560362614-89027598847b", "1768853968758-bba45ec2f11d", "1760736699270-d1bc09a6509f", "1742210595290-f021aba0d9f2", "1766882322676-38a1f8f11327", "1768929096095-8f379b34278b", "1774542878714-0d7d1b884ac6", "1766882322561-ff203e0e746b"],
    "Maillots de bain": ["1551887283-ca87be316d1d", "1697739348487-75f668fdb6fb", "1700739746391-26561c282181", "1609857992823-4f0f75c76f3f", "1716703723588-cf0fcd9f8bfd", "1699061930674-1be64fe86fc3", "1624319372785-238db1ca3ae5", "1628537428422-4f915fec5607", "1628537553363-640c5da382ba", "1628538184867-c91cd11e2d78"],
    "Lifestyle": ["1560769629-975ec94e6a86", "1603808033192-082d6919d3e1", "1656944227421-416b1d2186c9", "1605523741177-cd660595c2cf", "1603808033176-9d134e6f2c74", "1656944227480-98180d2a5155", "1656164753657-8ff832063a71", "1628413993904-94ecb60f1239", "1618677831708-0e7fda3148b4", "1678802910315-b1bf6ca9f6a6"],
    "Running": ["1606107557195-0e29a4b5b4aa", "1560769629-975ec94e6a86", "1597892657493-6847b9640bac", "1574288763758-a17ce17c4088", "1562183241-b937e95585b6", "1759674804375-3d0c038a0a6a", "1522040942177-269680274214", "1547941126-3d5322b218b0", "1759674915081-b38844dbb613", "1676041669566-fead69bd7007"],
    "Basketball": ["1605348532760-6753d2c43329", "1605523741177-cd660595c2cf", "1620138546344-7b2c38516edf", "1595909236612-9fd30b476365", "1595909336425-5bf541155dec", "1557848979-f13d18a41bb2", "1705440005919-4e4bae8c8fb1", "1616968308985-aa7a285415b0", "1587896661064-2d686db621b4", "1619735497594-d286fd8d2d39"],
    "Montantes": ["1512374382149-233c42b6a83b", "1625697501075-29fa2ae7dfbd", "1781660953322-e2dc76dedbc4", "1761706758140-b94b296f9eab", "1721767642708-4b082d03334b", "1781145856635-36e481312990", "1767440557966-219b4b09b34f", "1765845574797-f5ab7249a8a3", "1685331186633-8654b69129c3", "1784715435231-5547da837fa9"],
    "Skate": ["1569116011158-3ac1ba68ddba", "1559054072-03d03d73baec", "1619203696829-705720cf8f63", "1600045611104-5749d628e684", "1619203696083-02bd602de876", "1594816723274-48cbebd7c908", "1675164055428-bf6e076c6263", "1675163918109-5b39ddaef2f2", "1675163918098-ab366d8be128", "1675163918353-05e244a6d9f1"],
    "Trail": ["1760465809553-ddcbe4bb4753", "1711466297363-54530c33189b", "1711466084162-a2d716817c81", "1582898967731-b5834427fd66", "1671906531003-8634ef6d597c", "1781696195464-7600b30c5ab2", "1781697006930-e0dbf22c1d25", "1759951060353-2679d85ea1b2", "1782145373397-19130f8a3114", "1779812773752-3d19944bf291"],
    "Tennis": ["1612905468542-585ca599afbc", "1718802323268-3c9838e00efd", "1718802322789-531327e98b0d", "1718802323158-b32c0330ad4a", "1561504583-061f9660a9b7", "1777996625665-fc422e294513", "1767627042725-865125616a98", "1772466759719-d5e778f3809e", "1579338559194-a162d19bf842", "1740430824310-fcc19817bfa6"],
    "Rétro / vintage": ["1560769629-975ec94e6a86", "1605523741177-cd660595c2cf", "1622760807800-66cf1466fc08", "1604943235205-3e1ccff688fc", "1620989928625-08536e746255", "1704949841973-9db544ac35ec", "1711702362297-062a1c56ef17", "1694083725663-850cef374ab7", "1781660953322-e2dc76dedbc4", "1584735174965-48c48d7edfde"],
    "Éditions limitées": ["1560769629-975ec94e6a86", "1628413993904-94ecb60f1239", "1656164753657-8ff832063a71", "1600054904350-1d493ae5f922", "1689830570678-956587526e75", "1618677831708-0e7fda3148b4", "1698108223703-0af88bee1104", "1650751909769-f918d36bab92", "1606890657264-e5a411daf9ef", "1708088641654-d096243830c1"],
    "Slides & claquettes": ["1577999499505-a4b64aaa9066", "1662132090920-060bba5cdf18", "1633281651728-b7f0bd1f3eaa", "1785780224395-424b9cf3db0b", "1548366426-bbd21662f0a3", "1562009264-79e069b47674", "1630690799639-fc7158d55ea7", "1651302054264-4e02eed25a36", "1544737593-024eaa00da72", "1534709646158-7d3b53dcc7da"],
    "Sacs à main": ["1594223274512-ad4803739b7c", "1624687943971-e86af76d57de", "1560891958-68bb1fe7fb78", "1598099947145-e85739e7ca28", "1603219527847-24c87f552a77", "1702326626601-74d2e86922b4", "1537440437066-c585a62baf1f", "1654707635149-2c7af90afecd", "1640901555365-cbbb76b0009b", "1650286712513-e1419fa096b2"],
    "Sacs à dos": ["1553062407-98eeb64c6a62", "1622560480654-d96214fdc887", "1622560480605-d83c853bc5c3", "1581605405669-fcdf81165afa", "1622260614153-03223fb72052", "1680039211156-66c721b87625", "1642375352634-ad952121fdb3", "1592388748465-8c4dca8dd703", "1511405946472-a37e3b5ccd47", "1527631615371-98cbbff5125a"],
    "Sacs bandoulière & pochettes": ["1600857062241-98e5dba7f214", "1583623733237-4d5764a9dc82", "1612902456551-333ac5afa26e", "1604176424472-17cd740f74e9", "1626931291835-f1d59553aa2e", "1694803121687-b87bbc61f531", "1614332193229-7dc0dd2785f4", "1760624294514-ca40aafe3d96", "1786872814428-1f0d8d685217", "1781751594989-ac3ad190db3c"],
    "Portefeuilles & petite maroquinerie": ["1627123424574-724758594e93", "1637169797848-12431f1d355c", "1614330315526-166f2d71e544", "1637868796504-32f45a96d5a0", "1636023189308-06668418548d", "1637168943285-a8f9ea0dc3f5", "1620109177168-9f1c9ac4485d", "1628483211662-9bcc692c46dc", "1614260937560-c749cc17da94", "1676276549701-668493cff405"],
    "Ceintures": ["1666723043169-22e29545675c", "1711443982852-b3df5c563448", "1637868796504-32f45a96d5a0", "1734383524180-3c6f9b21e8e3", "1623393807193-e095f7944161", "1721483246145-d5b82d10e3e7", "1776951130605-315af5a524b3", "1710017787729-6eca740cd777", "1776951129366-103426384151", "1776951129328-d85072dbdefe"],
    "Montres": ["1524805444758-089113d48a6d", "1620625515032-6ed0c1790c75", "1547996160-81dfa63595aa", "1622434641406-a158123450f9", "1522312346375-d1a52e2b99b3", "1533139502658-0198f920d8e8", "1660844817855-3ecc7ef21f12", "1587925358603-c2eea5305bbc", "1629581678313-36cf745a9af9", "1582150264904-e0bea5ef0ad1"],
    "Bijoux": ["1722410180687-b05b50922362", "1601821765780-754fa98637c1", "1569397288884-4d43d6738fbd", "1506630448388-4e683c67ddb0", "1599459183200-59c7687a0275", "1705326454924-f6777522b030", "1599459182681-c938b7f65af0", "1590548784585-643d2b9f2925", "1721807551235-4072be6913c0", "1558882268-15aa056d885f"],
    "Lunettes": ["1584036553516-bf83210aa16c", "1653038282189-803202722a05", "1566421966482-ad8076104d8e", "1605813808456-26c16c0dfb77", "1610555423081-85ec0b8eabac", "1618071147329-803bf99d9746", "1552337557-45792b252a2e", "1577744486770-020ab432da65", "1548918901-9b31223c5c3a", "1567473810954-507d59716c25"],
    "Casquettes & chapeaux": ["1720534490358-bc2ad29d51d5", "1588516903922-b694c2153623", "1568246621541-5704b4f0bbf2", "1653325712373-0b421afcb5bb", "1578991480240-5a2cbc1bfbd3", "1728925962995-c5a11993564a", "1715531691726-b2ea11c6568b", "1610384466709-9b83df910cc5", "1775322658880-4098cfd56c93", "1787197126870-6221d89d2cde"],
    "Bonnets & écharpes": ["1771081773903-c5f893dc9a47", "1768324523731-69dec620e6ec", "1772472695345-f361cb6193da", "1774399874295-9bc76bb375c5", "1740381698754-3920d7407365", "1763713415860-2231ecc1cfed", "1740381525037-a0fc62dc63e9", "1740381532326-236048c78d10", "1767020990349-5be7b9e262c9", "1740381536157-e3683bbc6f2a"],
    "Gants": ["1600109978256-6f387208a070", "1644308977849-45a83bf3b067", "1605669226801-86285dacf048", "1645445470303-f96692cf1217", "1580965081770-1169d59f1bbd", "1519084090292-092ced4c57c8", "1642850470069-769d2dcc85f8", "1642952180306-588f9eddce8e", "1644308992821-6feb6375c89b", "1669799189421-a121c16ef9f6"],
    "Foulards & étoles": ["1606259458027-54d2a728b6ab", "1677478863154-55ecce8c7536", "1689193502879-362660fad4a8", "1566534335938-05f1f2949435", "1551028442-ee84b4d3a50a", "1558600333-fd674768ae04", "1707978932202-751b08324daf", "1637273472424-902dea95b78e", "1763906803192-0842ce94e448", "1777795530497-205664bbd965"]
  },
  photosCatalogue: {
    sneakers: ["1542291026-7eec264c27ff","1606107557195-0e29a4b5b4aa","1595950653106-6c9ebd614d3a","1600269452121-4f2416e55c28","1560769629-975ec94e6a86","1525966222134-fcfa99b8ae77","1491553895911-0055eca6402d","1608231387042-66d1773070a5","1549298916-b41d501d3772","1543508282-6319a3e2621f","1600185365926-3a2ce3cdb9eb","1512374382149-233c42b6a83b","1552346154-21d32810aba3","1608667508764-33cf0726b13a"],
    robe: ["1595777457583-95e059d581b8","1623609163859-ca93c959b98a","1618932260643-eee4a2f652a6","1515372039744-b8f02a3ae446","1550639525-c97d455acf70","1539008835657-9e8e9680c956","1574397188460-ab14653bcfa1","1612336307429-8a898d10e223","1605763240000-7e93b172d754","1584273143981-41c073dfe8f8","1612722432474-b971cdcea546"],
    bas: ["1721637286605-ae9be19d681f","1718252540511-e958742e4165","1576995853123-5a10305d93c0","1541840031508-326b77c9a17e","1640336437301-8368b53861ab","1605518216938-7c31b7b14ad0","1560243563-062bfc001d68","1605518215584-5ba74df5dfd8"],
    veste: ["1633931764492-8ecb7742ebc5","1551488831-00ddcb6c6bd3","1521223890158-f9f7c3d5d504","1625327009034-039a65fa3153","1594587639781-a68a2796bb90","1489286696299-aa7486820bd5","1649433911119-7cf48b3e8f50","1578198576866-7e0ba6078128","1555583743-991174c11425","1624548140150-108c3287f551","1649937408746-4d2f603f91c8","1646300451176-f16171b2d03d"],
    sac: ["1598532163257-ae3c6b2524b6","1682745230951-8a5aa9a474a0","1559563458-527698bf5295","1705909237050-7a7625b47fac","1584917865442-de89df76afd3","1600857062241-98e5dba7f214","1614179689702-355944cd0918","1713746834176-04c0069d6593","1683921590274-a83862cb11c3","1613482184972-f9c1022d0928","1566150902887-9679ecc155ba","1594223274512-ad4803739b7c"],
    montre: ["1523170335258-f5ed11844a49","1587925358603-c2eea5305bbc","1582150264904-e0bea5ef0ad1","1619946928632-abefa12506e2","1524805444758-089113d48a6d","1584378687113-8739c327634c","1542496658-e33a6d0d50f6","1542816340-4d3de5047cfd"],
    bijou: ["1601121141418-c1caa10a2a0b","1705326452390-3ecf6070595f","1601121141499-17ae80afc03a","1583937443351-f2f669fbe2cf","1727947074642-0bd47ef70b58","1660860547079-fd4845880af9","1721103418939-5112f0ccfac8","1688406264720-e2f9389c9ed1","1721034917345-d17c5405ead0"],
    lunettes: ["1511499767150-a48a237f0083","1572635196237-14b3f281503f","1577803645773-f96470509666","1584036553516-bf83210aa16c","1610136649349-0f646f318053","1473496169904-658ba7c44d8a","1608539733292-190446b22b83","1508296695146-257a814070b4","1566421966482-ad8076104d8e"],
    ceinture: ["1664286074176-5206ee5dc878","1664285612706-b32633c95820","1666723043169-22e29545675c","1705493655920-20c572928501","1711443982852-b3df5c563448","1664286022075-8e997e95bd17","1664286074240-d7059e004dff","1665573708655-7320ed78bbeb"],
    chapeau: ["1588850561407-ed78c282e89b","1622445275576-721325763afe","1592367630397-65872fe016e9","1609868656710-4f299e957ec5","1663280426574-00126d048f71","1663280419473-f650ee0fd0b9","1737666636073-f15d9762cf83","1656166229825-8bb5c3214111","1663280426478-9294cf296749"],
    echarpe: ["1609803384069-19f3e5a70e75","1577361498959-09c12819b105","1491245257527-395e9c480145","1644269444230-c6d1f2722e10","1609803384370-0e73ef8d424f","1609803364911-9e275e5a2b44","1601379327700-05347ab58e57","1662158014885-8c6de71ccb3d"],
    gants: ["1643650374762-196c86358df3","1675215452949-b7727b6e2808","1519766400364-8824dc3c4e26","1580965081770-1169d59f1bbd","1483118714900-540cf339fd46","1549396555-3d107fd70c85","1519084090292-092ced4c57c8"],
    sacdos: ["1553062407-98eeb64c6a62","1509762774605-f07235a08f1f","1622560480605-d83c853bc5c3","1581605405669-fcdf81165afa","1622560480654-d96214fdc887","1567597243073-2d274aabecec","1622260614153-03223fb72052","1551974222-1d49f576a2a4"]
  },
  // Famille visuelle d'une (catégorie, sous-catégorie).
  _famillephoto: function (code, sub) {
    if (code === "sneakers") return "sneakers";
    if (code === "pap" || code === "Prêt-à-porter") {
      if (/robe|jupe|combinaison|maillot/i.test(sub || "")) return "robe";
      if (/jean|pantalon|short|survêt/i.test(sub || "")) return "bas";
      if (/manteau|doudoune|veste|blouson|blazer|tailleur|ensemble|costume|pull|gilet|sweat|hoodie|chemise|blouse|top|bod(y|ies)|t-?shirt|débardeur/i.test(sub || "")) return "veste";
      return "robe";
    }
    // Accessoires — chaque sous-catégorie a sa propre famille visuelle
    var s = sub || "";
    if (/montre/i.test(s)) return "montre";
    if (/bijou/i.test(s)) return "bijou";
    if (/lunette/i.test(s)) return "lunettes";
    if (/ceinture/i.test(s)) return "ceinture";
    if (/casquette|chapeau|bonnet/i.test(s)) return "chapeau";
    if (/écharpe|echarpe|foulard|étole|etole/i.test(s)) return "echarpe";
    if (/gant/i.test(s)) return "gants";
    if (/dos/i.test(s)) return "sacdos";
    return "sac"; // sacs & petite maroquinerie par défaut
  },
  // Vraie photo d'un article, déterministe (graine = son id). Renvoie une URL absolue Unsplash.
  photoArticle: function (code, sub, seed) {
    var pool = (sub && this.photosParType[sub]) || this.photosCatalogue[this._famillephoto(code, sub)] || this.photosCatalogue.sac;
    var h = 0, s = String(seed || "");
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    /* (fondatrice 06/09 « les pages chargent difficilement ») La vignette faisait 600×750 pour
       être affichée à ~170 px de large : 3,5 fois trop grande, multipliée par 250 photos sur
       l'accueil. On demande la taille réellement affichée (×2 pour les écrans denses). */
    return "https://images.unsplash.com/photo-" + pool[h % pool.length] + "?auto=format&fit=crop&w=360&h=450&q=55";
  },
  /* ── AIDE À LA SAISIE (fondatrice 06/09 : « propose des champs par défaut en fonction de la
        marque, catégorie, sous-catégorie, et automatise une réf fournisseur ; le fournisseur
        peut modifier, mais on l'aide à la saisie »). Tout est DÉRIVÉ du référentiel — la
        composition, l'entretien et le poids viennent de suggestionsPour(cat, sub), la
        référence des initiales du fournisseur et du préfixe de catégorie. Rien d'inventé, et
        rien d'imposé : ce sont des propositions que le fournisseur écrase quand il veut. ── */
  _initiales: function (nom) {
    return String(nom || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z ]/g, '').trim().split(/\s+/)
      .map(function (m) { return m.charAt(0); }).join('').toUpperCase().slice(0, 3) || 'FRN';
  },
  _codeSous: function (sub) {
    return String(sub || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'GEN';
  },
  // Prochaine réf INTERNE du fournisseur : ses initiales · catégorie · sous-catégorie · rang.
  // Le rang compte ce qu'il a DÉJÀ publié dans cette famille — il ne se répète donc jamais.
  refFournisseurSuggeree: function (cat, sub, nom) {
    if (!cat) return '';
    var f = nom || this.mode.fournisseurCourant;
    var pre = this._initiales(f) + '-' + this.refPrefixe(cat) + (sub ? '-' + this._codeSous(sub) : '');
    var n = 0;
    this.inventaireVendeur(f).forEach(function (l) { if (String(l.sku || '').indexOf(pre + '-') === 0) n++; });
    return pre + '-' + String(n + 1).padStart(3, '0');
  },
  // « Robes » au pluriel dans un nom de pièce sonne faux : on singularise le premier mot de la
  // sous-catégorie (Robes → Robe, Tops & bodies → Top, Manteaux → Manteau).
  _singulier: function (sub) {
    var m = String(sub || '').split(/[·&,]/)[0].trim().split(/\s+/)[0] || '';
    if (/aux$/i.test(m)) return m.slice(0, -1);
    if (/[sx]$/i.test(m) && m.length > 3) return m.slice(0, -1);
    return m;
  },
  // Ce qu'on PROPOSE de saisir, à partir de ce que le fournisseur a déjà choisi.
  brouillonPiece: function (o) {
    o = o || {};
    var sug = this.suggestionsPour(o.cat, o.sub) || {};
    var etat = (this.mode.etatsPiece || []).filter(function (e) { return e.k === o.etat || e.n === o.etat; })[0];
    var piece = this._singulier(o.sub);
    var bouts = [];
    if (piece) bouts.push(piece);
    if (o.marque) bouts.push(o.marque);
    var mat = (sug.matiereDefaut || [])[0];
    if (mat) bouts.push('en ' + String(mat).toLowerCase());
    var phrase = bouts.join(' ');
    if (etat) phrase += (phrase ? ', ' : '') + String(etat.n).toLowerCase();
    return {
      modele: [piece, o.marque].filter(Boolean).join(' '),
      // Le fournisseur ne peut PAS affirmer un contrôle : sa pièce n'a encore été vue par
      // personne. Il décrit — la mention de contrôle viendra de l'atelier, s'il a lieu.
      description: phrase ? (phrase + '.') : '',
      sku: this.refFournisseurSuggeree(o.cat, o.sub, o.fournisseur),
      compo: (sug.compo || []).join('\n'),
      care: (sug.careDefaut || []).slice(),
      matiere: (sug.matiereDefaut || []).slice(),
      poids: sug.poids || 0
    };
  },
  refPrefixe: function (cat) { var s = this.suggestionsCategorie(cat); return s ? s.prefixe : 'ART'; },
  /* ── DATES DU STOCK (fondatrice 06/09 : « la date d'entrée, la date de commande, la date de
        sortie… il n'y a aucune info de date par statut »). Tout était en LIBELLÉ FIGÉ — « hier »,
        « il y a 3 j », « aujourd'hui » — jamais un horodatage : impossible de savoir depuis
        quand une pièce dort, ni quand elle est sortie. Chaque transition pose désormais son
        instant, et l'affichage se DÉRIVE de cet instant. ── */
  MOIS_C: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  dateHeure: function (ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getDate() + ' ' + this.MOIS_C[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },
  dateCourte: function (ts) { if (!ts) return ''; var d = new Date(ts); return d.getDate() + ' ' + this.MOIS_C[d.getMonth()]; },
  depuis: function (ts) {
    if (!ts) return '';
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return 'il y a ' + m + ' min';
    var h = Math.floor(m / 60); if (h < 24) return 'il y a ' + h + ' h';
    var j = Math.floor(h / 24); if (j === 1) return 'hier';
    if (j < 31) return 'il y a ' + j + ' j';
    return this.dateCourte(ts);
  },
  // Les lots SEED portent un libellé (« il y a 3 j ») et pas d'instant : on en dérive un, UNE fois,
  // pour que chaque pièce ait une vraie date d'entrée en stock.
  _tsDepuisLabel: function (txt) {
    var t = String(txt || '').toLowerCase(), j = 0;
    var m = t.match(/il y a (\d+)\s*j/); if (m) j = parseInt(m[1], 10);
    else if (/hier/.test(t)) j = 1;
    else if (/instant|aujourd/.test(t)) j = 0;
    else if (/récemment|recemment/.test(t)) j = 3;
    else if (/semaine/.test(t)) j = 7;
    else j = 2;
    return Date.now() - j * 86400000;
  },
  inventaireGet: function () {
    var l = null;
    try { l = JSON.parse(localStorage.getItem('pec-mode-inventaire') || 'null'); } catch (e) {}
    if (!l) l = (this.mode.inventaire || []).map(function (x) { return JSON.parse(JSON.stringify(x)); });
    else {
      // Lots SEED absents de la copie persistée (ex. lots de démo ajoutés après) → fusionnés UNE fois, par réf,
      // pilotée par un marqueur de version (nombre de lots seed) : un `inventairePut` explicite pose le marqueur,
      // donc un inventaire écrit volontairement (tests de charge, remise à zéro) n'est JAMAIS re-fusionné.
      // « r2 » (03/09) : révision de seed — la répartition des lots par SPÉCIALITÉ fournisseur a changé,
      // on réaligne aussi le champ `fournisseur` des lots seed déjà persistés (quantités/ventes intactes).
      // « r5 » (19/09) : le prix client du catalogue passe désormais par la GRILLE (achat + marge + livraison +
      // atelier). Le prix d'achat des lots ne bouge pas ; ce qui manquait à une copie persistée, c'est le prix
      // client que ce lot a produit (`prixVente`) et son poids — on les réaligne, les quantités et les ventes
      // restent intactes. Sans ce réalignement, un navigateur ouvert hier garderait un lot muet sur son prix.
      var seedV = String((this.mode.inventaire || []).length) + ':r5', v = null;
      try { v = localStorage.getItem('pec-mode-inventaire-v'); } catch (e) {}
      if (v !== seedV) {
        var refs = {}; l.forEach(function (x) { refs[x.ref] = x; });
        (this.mode.inventaire || []).forEach(function (x) {
          if (!refs[x.ref]) { l.push(JSON.parse(JSON.stringify(x))); }
          else {
            if (refs[x.ref].fournisseur !== x.fournisseur) refs[x.ref].fournisseur = x.fournisseur;
            if (x.prixVente != null && refs[x.ref].prixVente !== x.prixVente) refs[x.ref].prixVente = x.prixVente;
            if (x.poids != null && refs[x.ref].poids !== x.poids) refs[x.ref].poids = x.poids;
          }
        });
        try { localStorage.setItem('pec-mode-inventaire', JSON.stringify(l)); localStorage.setItem('pec-mode-inventaire-v', seedV); } catch (e) {}
      }
    }
    // Lot PUBLIÉ par un fournisseur (wizard) : pas d'articleId à la création → dérivé de la réf, stable,
    // pour que stockArticle()/fiche/panier retrouvent le lot (connexion fournisseur → Mode, 02/09)
    l.forEach(function (x) { if (!x.articleId && x.ref) x.articleId = 'pub' + String(x.ref).toLowerCase().replace(/[^a-z0-9]/g, ''); });
    // ENTRÉE EN STOCK : un instant, pas un libellé. Les lots seed en héritent une fois, dérivé
    // de leur mention (« il y a 3 j ») ; les lots publiés le posent à la création.
    var self = this, majTs = false;
    l.forEach(function (x) { if (!x.creeTs) { x.creeTs = self._tsDepuisLabel(x.cree); majTs = true; } });
    if (majTs) { try { localStorage.setItem('pec-mode-inventaire', JSON.stringify(l)); } catch (eT) {} }
    return l;
  },   // (12/09) remise à zéro de la démo : les objets disparaissent, leurs lignes de registre n'ont plus d'objet
  inventaireVendeur: function (nom) { nom = nom || this.mode.fournisseurCourant; return this.inventaireGet().filter(function (x) { return x.fournisseur === nom; }); },
  // ENTRÉE de stock : la publication crée un lot réf. unique (statut selon brouillon).
  // ARTICLE DÉRIVÉ D'UN LOT (connexion fournisseur → Mode, 02/09) : le lot publié par le wizard est la
  // SOURCE ; l'article côté client en découle (nom, prix, état, photo de famille, couleur…). Rien de
  // saisi deux fois. Statuts visibles côté Mode : valide_publie (« En vente ») et epuise (masqué par
  // la dispo mais la fiche reste ouvrable) — brouillon / soumis (attente atelier) / refusé restent invisibles.
  _CODE_CAT: { "Sneakers": "sneakers", "sneakers": "sneakers", "Prêt-à-porter": "pap", "pap": "pap", "Accessoires": "accessoires", "accessoires": "accessoires" },
  STATUTS_EN_VENTE: ["valide_publie", "epuise"],
  articleDepuisLot: function (lot) {
    var code = this._CODE_CAT[lot.categorie] || "accessoires";
    var et = (this.mode.etatsPiece || []).filter(function (e) { return e.n === lot.etat; })[0];
    var neuf = et ? !!et.neuf : /neuf/i.test(lot.etat || '');
    var coulNom = (lot.couleurs || [])[0] || '', coul = (this.mode.couleurs || []).filter(function (c) { return c.nom === coulNom; })[0];
    var lignes = lot.lignes || [], qteTot = 0; lignes.forEach(function (l) { qteTot += (l.qte || 0); });
    var taille = lignes.length ? lignes[0].taille : 'Unique';
    var id = lot.articleId || ('pub' + String(lot.ref).toLowerCase().replace(/[^a-z0-9]/g, ''));
    var nom = lot.modele || ((lot.marque && lot.marque.indexOf('Sans marque') === -1 ? lot.marque + ' ' : '') + (lot.sous || lot.categorie || 'Pièce'));
    var prix = lot.prixVente != null ? lot.prixVente : this.prixClientMode(lot.prix, lot.poids);   // prix CLIENT (grille), jamais le prix vendeur
    var compo = String(lot.compo || '').split('\n').map(function (ln) { var i = ln.indexOf(':'); return i > 0 ? [ln.slice(0, i).trim(), ln.slice(i + 1).trim()] : null; }).filter(Boolean);
    if (lot.care) compo.push(["Entretien", lot.care]);
    return {
      id: id, nom: nom, marque: lot.marque || 'Sans marque', categorie: code, souscategorie: lot.sous || '', genre: lot.genre || 'mixte',
      taille: taille, etat: lot.etat || (neuf ? 'Neuf' : 'Bon état'), fiscal: neuf ? 'neuf' : 'occasion', badge: neuf ? 'neuf' : 'reco',
      condition: neuf ? 'Neuve' : 'Reconditionnée', prix: prix, prixNeuf: null, favoris: 0, ref: lot.ref,
      photo: lot.vignette || this.photoArticle(code, lot.sous, lot.ref), photoReelle: !!lot.vignette,
      vues: (lot.photos || []).filter(function (ph) { return ph && ph.piece; }).map(function (ph) { return { role: ph.role, piece: ph.piece }; }),
      idl: (lot.marque || 'Sans marque') + ' · ' + taille + ' · ' + (lot.etat || ''),
      /* (11/09) DEUX FORMES POUR UNE MÊME CHOSE. Le certificat du référentiel est un OBJET
         ({ref, par, date, …}) ; celui délivré par l'atelier n'était qu'une CHAÎNE, rangée sous un
         autre nom (`certificatRef`) que personne ne lisait. Conséquence : une pièce authentifiée
         par NOTRE atelier n'affichait aucun certificat au client, et `mentionControle` lui refusait
         le niveau « Authentifiée en atelier ». Une seule forme, sous un seul nom — et on n'invente
         ni les points de contrôle ni la liste des vérifications : on n'a que la réf et la date. */
      piece_unique: !neuf && qteTot === 1, authentifiee: !!lot.certificat,
      certificat: lot.certificat
        ? { ref: lot.certificat, par: 'Atelier ' + (((this.ref || {}).societe || {}).marque || 'PayEnCash'),
            date: lot.controleTs ? new Date(lot.controleTs).toLocaleDateString('fr-FR') : null }
        : null,
      couleur: coulNom, couleurHex: coul ? coul.hex : '', matiere: lot.matiere || '', coupe: lot.coupe || '', motif: lot.motif || 'Uni',
      // (05/09) `ajout` classe les nouveautés (plus grand = plus récent) : à 0, une pièce tout
      // juste publiée par un fournisseur se retrouvait derrière tout le catalogue seed.
      // (10/09 — lot 4) l'ancienneté se calcule depuis la publication du lot : `ageJours: 0` figeait la liste des invendus
      // sur les seuls articles du référentiel — aucune pièce publiée par un fournisseur n'y entrait jamais
      ajout: 100 + Math.floor((lot.creeTs || Date.now()) / 60000) % 100000, ageJours: Math.max(0, Math.floor((Date.now() - (lot.publieTs || lot.creeTs || Date.now())) / 86400000)), fournisseur: lot.fournisseur || '',
      // (08/09) l'historique DATÉ du lot ; le prix de référence Omnibus se calcule dessus (prixBas30j), il n'est plus figé ici
      historiquePrix: (lot.historiquePrix && lot.historiquePrix.length) ? lot.historiquePrix.map(function (h) { return { d: h.motif || '', p: h.p, at: h.at }; }) : [{ d: "à la publication", p: prix, at: lot.creeTs || Date.now() }],
      provenance: lot.provenance || null, factureOrigine: !!lot.factureOrigine,
      description: lot.description || (nom + (coulNom ? ' — ' + coulNom.toLowerCase() : '') + '. ' + (neuf ? 'Pièce neuve, décrite par son fournisseur.' : 'Pièce d\'occasion, décrite par son fournisseur.')),
      composition: compo.length ? compo : [["Matière principale", lot.matiere || '—']], defaut: lot.defaut || '', publie: true
    };
  },
  // Fusionne dans mode.articles les lots EN VENTE qui n'ont pas encore d'article (publiés via le wizard).
  synchroniserArticlesPublies: function () {
    var self = this, arts = this.mode.articles;
    /* (10/09 — lot 6) ELLE N'AJOUTAIT QUE. Un lot qui QUITTE la vente — re-cotation à accepter, refus d'atelier,
       photos à refaire, fournisseur suspendu — restait au catalogue jusqu'au prochain rechargement de page : sur
       l'onglet ouvert, l'article gardait son ancien prix et restait commandable. Un article DÉRIVÉ (publie:true) ne
       survit pas à son lot ; les articles du référentiel, eux, ne sont jamais touchés. */
    /* (19/09, soir) UNE SEULE LECTURE DE L'INVENTAIRE. La fonction le relisait QUATRE fois — et le relire, c'est
       reparser tout le stock du stockage local. Sur le catalogue généré (des centaines de lots), la page de
       recherche y passait plusieurs secondes à chaque chargement. Un seul appel, quatre parcours. */
    var inv = this.inventaireGet();
    var vivants = {};
    inv.forEach(function (lot) {
      if (self.STATUTS_EN_VENTE.indexOf(lot.status) === -1) return;
      if (lot.fournisseur && !self.fournisseurEnVente(lot.fournisseur)) return;
      vivants[lot.articleId] = 1;
    });
    for (var i = arts.length - 1; i >= 0; i--) if (arts[i].publie && !vivants[arts[i].id]) arts.splice(i, 1);
    var pos = {}; arts.forEach(function (a, i) { pos[a.id] = i; });
    var n = 0;
    inv.forEach(function (lot) {
      if (self.STATUTS_EN_VENTE.indexOf(lot.status) === -1) return;
      // (10/09 — lot 4) un fournisseur SUSPENDU ou RÉSILIÉ ne vend plus : ses lots ne remontent pas au catalogue
      if (lot.fournisseur && !self.fournisseurEnVente(lot.fournisseur)) return;
      var i = pos[lot.articleId];
      if (i === undefined) { arts.push(self.articleDepuisLot(lot)); pos[lot.articleId] = arts.length - 1; n++; return; }
      /* (11/09) ELLE N'AJOUTAIT ET NE RETIRAIT QUE. Le lot 6 avait réglé le RETRAIT d'un article dont le lot
         quitte la vente ; restait la MODIFICATION : un certificat délivré par l'atelier, un prix re-coté
         accepté, un état corrigé, une photo ajoutée ne rejoignaient jamais l'article déjà dérivé — sur un
         onglet resté ouvert, la fiche client gardait l'ancienne version. Un article DÉRIVÉ n'a pas de vie
         propre : il se refait depuis son lot. Les articles du référentiel, eux, ne sont jamais touchés. */
      if (arts[i] && arts[i].publie) arts[i] = self.articleDepuisLot(lot);
    });
    /* (19/09 — même chasse) « PIÈCE UNIQUE » N'EST PAS UNE ÉTIQUETTE, C'EST UNE QUANTITÉ. L'Air Max 97 du
       référentiel la portait ÉCRITE alors que son lot déclare six paires en 41/42/43 : la fiche annonçait
       « pièce unique, réservée dès la commande », ne proposait que le 42, et quatre paires vendables
       restaient invisibles. Un article dérivé la calcule déjà depuis son lot ; quand un lot existe pour un
       article du référentiel, c'est lui qui tranche, là aussi. */
    var qteLot = {};
    inv.forEach(function (lot) {
      if (!lot.articleId || self.STATUTS_EN_VENTE.indexOf(lot.status) === -1) return;
      (lot.lignes || []).forEach(function (l) { qteLot[lot.articleId] = (qteLot[lot.articleId] || 0) + (l.qte || 0); });
    });
    /* On CORRIGE ce que le lot dément, on ne promeut rien : un article qui se dit unique alors que son lot
       en déclare plusieurs ment, point. À une seule pièce déclarée, la valeur du référentiel tient — la
       robe de « Chez Awa » est une création faite main, unique même neuve, et ce n'est pas à une règle
       de quantité de le lui retirer. */
    arts.forEach(function (a) { if (!a.publie && qteLot[a.id] > 1) a.piece_unique = false; });
    /* ══ (19/09, soir — fondatrice « la logique de prix, si lien partagé avec marge spécifique, ne marche pas : si je
       vais sur le site la marge a un montant différent ; le lien doit exprimer une remise car marge différente »)
       MÊME RÈGLE POUR LE PRIX : ON CORRIGE CE QUE LE LOT DÉMENT ═════════════════════════════════════════
       Les quatre pièces du référentiel portaient un prix client ÉCRIT (150, 210, 85, 45 €) pendant que leur lot
       déclare un prix d'achat (120, 185, 74, 38 €) : la grille — achat + marge + atelier — donne 130,60 / 200,15 /
       81,38 / 42,86 €. Deux conséquences, et la seconde se lisait à l'écran :
         ① la marge réelle n'était pas celle de la grille (30 € gardés sur l'Air Max au lieu de 8,40 €) ;
         ② le lien partagé rend la DIFFÉRENCE DES DEUX MARGES (7 % − 4 % du prix d'achat) — une remise calculée sur
            des 7 % qui n'avaient jamais servi à construire le prix affiché : « Mon stock » annonçait au fournisseur un
            prix client et deux marges que le site démentait.
       Le prix d'un article dont le LOT est en vente se construit donc par la grille, exactement comme celui d'une
       pièce publiée par un fournisseur. L'historique de prix et le prix de référence Omnibus (art. L112-1-1 C.
       conso) suivent : on ne laisse pas une mention légale pointer un prix qui n'est plus pratiqué. */
    var lotVente = {};
    inv.forEach(function (lot) {
      if (!lot.articleId || self.STATUTS_EN_VENTE.indexOf(lot.status) === -1) return;
      if (lot.fournisseur && !self.fournisseurEnVente(lot.fournisseur)) return;
      if (lotVente[lot.articleId] === undefined) lotVente[lot.articleId] = lot;
    });
    arts.forEach(function (a) {
      if (a.publie) return;                                   // un article DÉRIVÉ porte déjà le prix de la grille
      var lot = lotVente[a.id]; if (!lot) return;             // sans lot en vente, rien ne dément le référentiel
      var client = self.prixClientMode(Number(lot.prix) || 0, lot.poids);
      if (client == null || !(client > 0) || Math.abs(client - a.prix) < 0.005) return;
      var avant = a.prix;
      a.prix = client;
      (a.historiquePrix || []).forEach(function (h) { if (Math.abs(h.p - avant) < 0.005) h.p = client; });
      if (a.prixBas30j != null) a.prixBas30j = Math.min(a.prixBas30j, client);
    });
    return n;
  },

  /* ── STOCK OPÉRÉ (Phase 1) : réservations persistées, dispo = stock − réservations. ── */
  /* ── (11/09 — constat C5 du 09/09) UNE RÉSERVATION EXPIRÉE NE RETIENT PLUS RIEN ────────────────────────────
     Le hold porte son échéance depuis le 01/09 (`expireTs`, celle de la commande) et AUCUNE des quatre lectures
     ne la regardait : toutes testaient `expireMin`, un champ qui n'existait que sur les holds écrits au
     référentiel. Conséquence : la pièce restait bloquée tant que l'APPAREIL DU CLIENT ne la libérait pas —
     `libererCommande` ne connaît que la commande en cours de CE navigateur. Fermer l'onglet suffisait à retirer
     une pièce de la vente pour toujours. Le prédicat est unique, et il vaut pour les deux formes. */
  _resaActive: function (r) {
    if (!r) return false;
    if (r.expireMin != null && r.expireMin < 0) return false;
    if (r.expireTs && r.expireTs < Date.now()) return false;
    return true;
  },
  /* Le RELÂCHEMENT, lui, est un geste : il sort les holds du magasin et NOTIFIE la file d'attente de chaque
     taille rendue (« zéro vente perdue »). Appelé par le bus quand la commande expire — donc par n'importe
     quelle lecture, depuis n'importe quel appareil, pas seulement celui du client. */
  libererReservationsDe: function (ref, motif) {
    if (!ref) return 0;
    var d = this, l = this.reservationsGet(), garde = [], rendus = {};
    l.forEach(function (r) { if (r.ref !== ref) garde.push(r); else rendus[(r.articleId || '') + '|' + (r.taille || '—')] = 1; });
    var n = l.length - garde.length; if (!n) return 0;
    this.reservationsPut(garde);
    Object.keys(rendus).forEach(function (k) {
      var p = k.split('|'); try { if (d.notifierWaitlist) d.notifierWaitlist(p[0], p[1]); } catch (e) {}
    });
    try { this._journal('reservations_liberees', ref, { par: 'systeme', motif: motif || 'commande expirée', pieces: n }); } catch (e2) {}
    return n;
  },
  reservationsGet: function () {
    var l = null;
    try { l = JSON.parse(localStorage.getItem('pec-mode-resa') || 'null'); } catch (e) {}
    if (!l) l = (this.mode.reservations || []).map(function (r) { return Object.assign({}, r); });
    return l;
  },
  reservationsPut: function (l) { try { localStorage.setItem('pec-mode-resa', JSON.stringify(l)); } catch (e) {} },
  waitlistGet: function () {
    var l = null;
    try { l = JSON.parse(localStorage.getItem('pec-mode-wait') || 'null'); } catch (e) {}
    if (!l) l = (this.mode.waitlist || []).map(function (w) { return Object.assign({}, w); });
    return l;
  },
  waitlistPut: function (l) { try { localStorage.setItem('pec-mode-wait', JSON.stringify(l)); } catch (e) {} },
  notifierWaitlist: function (articleId, taille) {
    var l = this.waitlistGet();
    for (var i = 0; i < l.length; i++) if (l[i].articleId === articleId && l[i].taille === taille) { l[i].notifie = true; }
    this.waitlistPut(l);
    return true;
  },

  /* ── INVENDUS / DÉMARQUE (Phase 4 « engagement/rotation ») : l'occasion = pièces
        uniques ; passé un seuil d'ancienneté, une pièce non vendue est candidate à la
        DÉMARQUE (baisse de prix pilotée) ou au RETRAIT du catalogue. L'overlay est
        persisté (pec-mode-demarque) — les prix de base ne sont jamais réécrits en dur. ── */
  demarquesGet: function () { try { var s = localStorage.getItem('pec-mode-demarque'); if (s) return JSON.parse(s); } catch (e) {} return {}; },
  /* ══ CAMPAGNES AJEK ══════════════════════════════════════════════════════════════
     Une campagne est une remise de PANIER décidée par AJEK (« −50 € dès 250 € d'achat »),
     proposée à chaque fournisseur concerné. Elle ne s'applique qu'aux pièces de ceux qui
     l'ont acceptée. Voir ref.campagnes pour la règle du seuil et du prorata. */
  campagnesGet: function () {
    var l = null; try { l = JSON.parse(localStorage.getItem('pec-campagnes') || 'null'); } catch (e) {}
    return l || [];
  },
  campagne: function (id) { return this.campagnesGet().filter(function (c) { return c.id === id; })[0] || null; },
  // RÉGLER la commande groupée (règlement déclaré) : les pièces réservées sont
  // désormais VENDUES → sortie RÉELLE du stock (brut −1, contrairement à l'expiration qui relâche),
  // réservations retirées, commande journalisée en « Réglées », verrou levé. Déclenché quand le
  // bus déclare la commande 'paye'. `paiement` = données du reçu (par, recu…).
  /* ══ (11/09) LA FACTURE DU CLIENT N'EXISTAIT PAS ══════════════════════════════════════════════════════
     Deux écrans Mode renvoyaient vers LA MÊME IMAGE décorative (`assets/photos/facture.svg`) : « Télécharger
     la facture » sur le suivi de commande, et « Mes factures · chaque commande, en PDF » sur le compte — le
     même dessin pour toutes les commandes de tout le monde. Or PayEnCash VEND EN SON NOM (achat ferme au
     fournisseur, revente au client) : la note de vente est due, et la vente à distance exige la confirmation
     écrite des mentions (art. L221-13 C. conso). Tout existait pour la produire : les lignes de la commande,
     les remises, le moyen de règlement, l'identité de la société.
     Le NUMÉRO et l'IDENTITÉ DU VENDEUR sont FIGÉS à la vente : une facture rééditée dans un an ne doit pas
     porter le siège, le RCS ou le numéro de TVA d'aujourd'hui. Le document lui-même se REND à la demande,
     depuis l'instantané gelé de la commande — rien ne s'entasse dans le stockage de l'appareil. ══ */
  _factureClientStamp: function (ref) {
    var S = (window.PEC_DOCS && PEC_DOCS.societe) ? PEC_DOCS.societe() : {};
    return {
      /* LE NUMÉRO SUIT LA COMMANDE. Les références de commande sont déjà uniques et chronologiques
         (M-1154, M-1187, M-1208…) : en dériver le numéro de facture donne la séquence continue sans
         trou qu'exige une numérotation de facturation, sans second compteur à tenir — et le client
         retrouve sa commande sur sa facture du premier coup d'œil. */
      numero: 'FC-' + (ref || '—'),
      emiseTs: Date.now(),
      vendeur: { nom: S.nom, forme: S.forme, marque: S.marque, siege: S.siege, siren: S.siren, rcs: S.rcs, tva: S.tva, capital: S.capital },
      regimeTva: 'marge',
      /* UNE seule source pour la rétractation : celle que livraisonInfo() sert déjà aux écrans (mode.retour.jours). */
      retourJours: ((this.mode || {}).retour || {}).jours || ((((this.mode || {}).panier || {}).livraison) || {}).retourJours || 14
    };
  },
  // Disponibilité AGRÉGÉE d'un article (toutes tailles confondues) — signal fiable pour la fiche
  // et le panier : le stock est réparti par taille, donc stockDispo(id, tailleParDéfaut) peut
  // afficher 0 alors que l'article a du stock dans d'autres tailles. `tailles` = dispo par taille.
  /* (fondatrice 06/09 « quand je lance un filtrage depuis Mode, c'est super lent »)
     stockArticle() parcourt TOUT l'inventaire et TOUTES les réservations… pour UNE pièce.
     chercher() l'appelait jusqu'à trois fois par article, sur 443 articles : ~450 ms à chaque
     frappe. On construit donc l'index du stock EN UNE PASSE, réutilisé pour tous les articles
     du même filtrage. Le calcul est identique, ligne pour ligne — seul le nombre de passes
     change. La mémoire est invalidée dès que l'inventaire ou les réservations bougent. */
  _stockIndexCalc: function () {
    var d = this;
    var idx = {};
    this.inventaireGet().forEach(function (lot) {
      if (!lot.articleId || !d.lotVendable(lot)) return;
      var e = idx[lot.articleId] || (idx[lot.articleId] = { brut: 0, reserve: 0, dispo: 0, tailles: {} });
      (lot.lignes || []).forEach(function (l) {
        var b = Math.max(0, (l.qte || 0) - (l.vendu || 0));
        e.brut += b; e.tailles[l.taille] = (e.tailles[l.taille] || 0) + b;
      });
    });
    this.reservationsGet().forEach(function (r) {
      if (!d._resaActive(r)) return;   // un hold EXPIRÉ ne retient rien (expireMin < 0 OU expireTs dépassé)
      var e = idx[r.articleId]; if (!e) return;
      e.reserve++;
      if (e.tailles[r.taille] != null) e.tailles[r.taille] = Math.max(0, e.tailles[r.taille] - 1);
    });
    Object.keys(idx).forEach(function (k) {
      var e = idx[k], d = 0;
      Object.keys(e.tailles).forEach(function (t) { d += e.tailles[t]; });
      e.dispo = d;
    });
    return idx;
  },
  /* Clé de fraîcheur — DÉRIVÉE DU CONTENU, pas de la longueur du texte stocké : « vendu:1 »
     et « vendu:2 » ont la même longueur, une vente serait passée inaperçue et l'index aurait
     menti sur le stock. On somme ce qui fait le stock (quantités, vendus, réservés) : toute
     vente, tout réassort, toute réservation change la clé. ~90 additions, négligeable. */
  _stockCle: function () {
    var q = 0, v = 0, r = 0, n = 0, d = this, vend = 0;
    this.inventaireGet().forEach(function (lot) {
      n++;
      /* (19/09) LE STATUT ENTRE DANS LA CLÉ. Depuis que l'index écarte les lots qui ne sont pas en vente,
         sa sortie dépend du STATUT — or la clé ne comptait que des quantités : un lot validé par l'atelier
         ne changeait ni qté, ni vendu, ni réservé, donc l'index mémoïsé continuait de le dire invendable
         jusqu'à la prochaine vente. On compte les lots vendables : le passage soumis → publié la change. */
      if (d.lotVendable(lot)) vend++;
      (lot.lignes || []).forEach(function (l) { q += (l.qte || 0); v += (l.vendu || 0); r += (l.reserve || 0); });
    });
    /* (11/09, revue) LE TEMPS ENTRE DANS LA CLÉ. Depuis que l'index écarte les holds ÉCHUS (`_resaActive`),
       sa sortie dépend de l'horloge — mais la clé, elle, ne comptait que des quantités : un hold qui expire ne
       change ni l'inventaire ni le NOMBRE de réservations, donc l'index mémoïsé continuait de masquer une pièce
       redevenue disponible jusqu'à la prochaine vente. On ajoute la plus proche échéance encore à venir : la clé
       change exactement au moment où un hold cesse de retenir quelque chose. */
    var res = this.reservationsGet(), proch = 0;
    res.forEach(function (x) { if (x.expireTs && x.expireTs > Date.now() && (!proch || x.expireTs < proch)) proch = x.expireTs; });
    var echus = 0; var d = this;
    res.forEach(function (x) { if (!d._resaActive(x)) echus++; });
    return n + ':' + vend + ':' + q + ':' + v + ':' + r + ':' + res.length + ':' + echus + ':' + proch;
  },
  stockIndex: function () {
    var cle = this._stockCle();
    if (this.__idxCle !== cle || !this.__idx) { this.__idx = this._stockIndexCalc(); this.__idxCle = cle; }
    return this.__idx;
  },
  /* (19/09 — fondatrice « fais le filtre sur la robe aussi, ou toute article, pour que la gestion du stock
     soit parfaite ») UN LOT QUI N'EST PAS EN VENTE N'EST PAS DU STOCK VENDABLE. Les trois fonctions qui
     comptent le stock (index, article, taille) parcouraient l'inventaire SANS regarder le statut du lot :
     une pièce dont le lot attendait encore l'atelier (« soumis »), refusée, en brouillon ou en re-cotation
     comptait pour du disponible — donc s'affichait, s'ajoutait au panier et se commandait avant tout
     contrôle. La robe du référentiel était exactement dans ce cas. Le statut fait foi, et il fait foi
     PARTOUT : les trois compteurs et la clé de fraîcheur de l'index appellent cette seule fonction.
     `epuise` reste « en vente » (il ne reste simplement rien) — c'est ce qui permet au réassort de
     rouvrir le lot. Le stock PHYSIQUE d'un fournisseur, lui, se lit par lotStock()/lotRestant() : ses
     brouillons et ses lots à l'atelier restent visibles dans SON espace, ils ne sont juste pas à vendre. */
  lotVendable: function (lot) { return !!lot && this.STATUTS_EN_VENTE.indexOf(lot.status) !== -1; },
  _stockVide: { brut: 0, reserve: 0, dispo: 0, tailles: {} },
  stockArticle: function (articleId) {
    var d = this, brut = 0, parTaille = {};
    this.inventaireGet().forEach(function (lot) {
      if (lot.articleId !== articleId || !d.lotVendable(lot)) return;
      (lot.lignes || []).forEach(function (l) {
        var b = Math.max(0, (l.qte || 0) - (l.vendu || 0));
        brut += b; parTaille[l.taille] = (parTaille[l.taille] || 0) + b;
      });
    });
    // seules les réservations ACTIVES retiennent du stock : un hold EXPIRÉ (expireMin < 0) ne
    // rend pas l'article épuisé (il sera relâché — cf. SM·306). Les holds sans expireMin (commande
    // en cours, tests de charge) sont actifs.
    var resa = d.reservationsGet().filter(function (r) { return r.articleId === articleId && d._resaActive(r); });
    resa.forEach(function (r) { if (parTaille[r.taille] != null) parTaille[r.taille] = Math.max(0, parTaille[r.taille] - 1); });
    var dispo = 0; Object.keys(parTaille).forEach(function (t) { dispo += parTaille[t]; });
    return { brut: brut, reserve: resa.length, dispo: dispo, tailles: parTaille };
  },

  /* ── FACTURATION FOURNISSEURS (Phase 1) : émettre la facture d'un achat ferme, puis virer ≤ 7 j. ── */
  facturesGet: function () {
    var l = null;
    try { l = JSON.parse(localStorage.getItem('pec-mode-factures') || 'null'); } catch (e) {}
    if (!l) l = (this.mode.factures || []).map(function (f) { return Object.assign({}, f); });
    return l;
  },
  /* ══════ (10/09 — lot 5) RÉCLAMATIONS MODE — DU CLIENT AU FOURNISSEUR ══════
     Jusqu'ici la chaîne s'arrêtait au remboursement : le fournisseur n'était JAMAIS informé qu'une de ses pièces avait été
     refusée, et rien ne lui était imputé. Règle de la politique : le client est remboursé sur SA déclaration, le fournisseur
     n'est débité que sur un CONSTAT. Entre les deux, PayEnCash porte le risque — c'est le coût du métier.
     Le débit VIT SUR la réclamation (pas de seconde table) : une créance sans son dossier serait une seconde vérité. ══════ */
  reclamationsGet: function () { try { return JSON.parse(localStorage.getItem('pec-mode-reclamations') || '[]') || []; } catch (e) { return []; } },
  reclamation: function (id) { return this.reclamationsGet().filter(function (r) { return r.id === id; })[0] || null; },
  /* CE QU'UNE FACTURE PORTE VRAIMENT : le brut, moins les débits définitifs non encore imputés, moins la retenue de garantie
     si le palier l'impose. La retenue est ANNONCÉE À L'AVANCE et libérée à date — elle ne porte jamais sur la totalité. */
  /* (10/09 — lot 6, constat C27) LE RÉGIME DE TVA DU FOURNISSEUR — relevé sur sa déclaration validée (pièce `tva` du
     coffre, ou transcription du dossier papier), jamais supposé. La facture d'achat écrivait « TVA : selon le régime du
     fournisseur — mention à sa charge » : une facture qui renvoie la mention obligatoire à quelqu'un d'autre n'est pas
     une facture. Trois régimes, trois conséquences : rien à facturer (franchise, 293 B), une mention de régime
     particulier sans TVA détaillée (marge, 297 A), ou une TVA au taux en vigueur, déductible par l'acheteur. */
  fournisseurRegimeTva: function (nomOuId) {
    var f = this.fournisseur(nomOuId), id = (f && f.id) || nomOuId, m = {};
    try { m = (window.PEC_DOCS && PEC_DOCS.mentions) ? PEC_DOCS.mentions('fournisseur', id) : {}; } catch (e) {}
    var T = {
      franchise: { taux: 0, libelle: 'Franchise en base (art. 293 B CGI)', mention: 'TVA non applicable, article 293 B du code général des impôts.' },
      marge: { taux: 0, libelle: "Régime de la marge sur biens d'occasion (art. 297 A CGI)", mention: "Régime particulier — Biens d'occasion : TVA non détaillée (article 297 A du code général des impôts)." },
      normal: { taux: null, libelle: 'Régime normal', mention: null }
    };
    var cle = m.regimeTva && T[m.regimeTva] ? m.regimeTva : null;
    if (!cle) return { cle: null, connu: false, taux: 0, libelle: null, mention: null, tvaIntra: m.tvaIntra || null };
    var o = T[cle], taux = o.taux != null ? o.taux : ((this.fiscalite && this.fiscalite.tvaTauxNeuf) || 20);
    return { cle: cle, connu: true, taux: taux, libelle: o.libelle, tvaIntra: m.tvaIntra || null,
      mention: o.mention || ('TVA au taux de ' + taux + ' %, déductible par l\'acheteur.') };
  },

  /* ── RÉF DE COMMANDE DE FLUX (fondatrice 27/08) : chaque commande lancée avec
        un montant (?m=) porte SA référence, stable et dérivée du montant — plus
        jamais un ancien règlement du bus rejoué sur une nouvelle commande. ── */
  /* ── COMMANDE EN COURS (fondatrice 27/08) : déposée par le tunnel au moment du
        « Confirmer », attachée à l'annonce bus, affichée par le détail (fly/10).
        Le montant sert de garde (jamais la commande d'un autre flux) ; périmée 2 h. ── */
  /* ── CONSENTEMENTS PROUVABLES (audit juriste 28/08 — art. 7.1 RGPD : le
        responsable doit pouvoir DÉMONTRER le consentement). Chaque acte positif
        (case, interrupteur, confirmation) écrit une trace : type, texte accepté,
        version du document, horodatage, retrait éventuel. Miroir de la table
        serveur `consents` — le retrait est aussi simple que le don (art. 7.3). ── */
  CGV_VERSION: "2026-08-28",
  // (03/09) les consentements appartiennent au COMPTE : un client qui se connecte retrouve les siens, et deux
  // comptes ouverts sur le même navigateur ne se les partagent plus. Clé par client, migration de l'ancienne clé.
  // hors session : un seau « anonyme », jamais celui d'un compte existant
  _cleConsentements: function () { var id = (this.clientActifGet && this.clientActifGet()) || 'anonyme'; return 'pec-consentements:' + id; },
  /* ── ACCEPTATIONS DES ACTEURS PRO (07/09 — audit juridique fournisseur) — miroir table `consents` (scope, subject_ref,
        document, cgv_version, granted_at). Une acceptation = un document, une version, un horodatage, journalisée. ── */
  acceptationsGet: function (espace, identifiant) {
    var l = []; try { l = JSON.parse(localStorage.getItem('pec-acceptations') || '[]') || []; } catch (e) {}
    return l.filter(function (a) { return (!espace || a.scope === espace) && (!identifiant || a.subject_ref === String(identifiant).toLowerCase()); });
  },
  acceptationsPoser: function (espace, identifiant, cles, par) {
    var docs = (this.ref.documents && this.ref.documents[espace]) || [], self = this, at = new Date().toISOString();
    var l = []; try { l = JSON.parse(localStorage.getItem('pec-acceptations') || '[]') || []; } catch (e) {}
    var poses = [];
    (cles || []).forEach(function (k) {
      var d = docs.filter(function (x) { return x.cle === k; })[0]; if (!d) return;
      /* (24/09 — benchmark : Stripe garde la date, l'adresse IP et le navigateur de chaque acceptation) LE NAVIGATEUR EST RELEVÉ
         ici ; l'adresse IP ne se lit pas depuis la page : c'est le serveur qui la relève en production, à la réception. */
      var rec = { scope: espace, subject_ref: String(identifiant || '').toLowerCase(), document: d.cle, type: 'acceptation', texte: d.titre, cgv_version: d.version, granted_at: at, par: par || 'lui-même',
        navigateur: (typeof navigator !== 'undefined' && navigator.userAgent) ? String(navigator.userAgent).slice(0, 240) : null };
      l.push(rec); poses.push(rec);
    });
    /* (11/09) UNE ACCEPTATION NON ÉCRITE N'EST PAS UNE ACCEPTATION. Le journal recevait « acceptation_documents »
       même quand le stockage avait refusé : on aurait relu la trace d'un consentement dont il ne reste rien —
       et l'écran aurait laissé passer le compte. On rend une liste VIDE : les documents restent à accepter. */
    if (!this._ecrit('pec-acceptations', l)) return [];
    if (poses.length) this._journal('acceptation_documents', String(identifiant || ''), { par: par || String(identifiant || ''), espace: espace, documents: poses.map(function (p) { return p.document + '@' + p.cgv_version; }) });
    try { window.dispatchEvent(new Event('pec-bus')); } catch (e2) {}   // (23/09) le verrou « travailler avec nous » se relit partout
    return poses;
  },
  // les documents dont la version EN VIGUEUR n'a pas encore été acceptée par ce compte
  /* ══ (23/09) CONSULTER, PUIS RECONNAÎTRE « LU ET ACCEPTÉ » ══════════════════════════════════════
     Une case cochée sur un texte jamais ouvert n'est pas un consentement. La consultation d'un document se note
     (clé, VERSION, horodatage) ; l'acceptation n'est proposée qu'ensuite, sur la même version. `documentsEtat`
     rend, par document, ce qui a été lu et ce qui a été accepté — l'écran ne déduit rien. */
  documentConsulter: function (espace, identifiant, cle, par) {
    var docs = (this.ref.documents && this.ref.documents[espace]) || [];
    var d = docs.filter(function (x) { return x.cle === cle; })[0]; if (!d) return { ok: false, motif: 'Document inconnu.' };
    var k = 'pec-consultations', l = []; try { l = JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (e) {}
    var rec = { scope: espace, subject_ref: String(identifiant || '').toLowerCase(), document: d.cle, version: d.version, at: new Date().toISOString(), par: par || String(identifiant || '') };
    l.push(rec);
    if (!this._ecrit(k, l)) return this._refusEcriture('La consultation du document');
    this._journal('document_consulte', String(identifiant || ''), { espace: espace, document: d.cle, version: d.version, par: rec.par });
    try { window.dispatchEvent(new Event('pec-bus')); } catch (e2) {}   // l'écran qui propose « lu et accepté » se repeint
    return { ok: true, consultation: rec };
  },
  documentsConsultes: function (espace, identifiant) {
    var l = []; try { l = JSON.parse(localStorage.getItem('pec-consultations') || '[]') || []; } catch (e) {}
    var id = String(identifiant || '').toLowerCase();
    return l.filter(function (x) { return x.scope === espace && x.subject_ref === id; });
  },
  documentsEtat: function (espace, identifiant) {
    var docs = (this.ref.documents && this.ref.documents[espace]) || [], self = this;
    var vus = this.documentsConsultes(espace, identifiant), acc = this.acceptationsGet(espace, identifiant);
    return docs.map(function (d) {
      var vu = vus.filter(function (x) { return x.document === d.cle && x.version === d.version; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); })[0] || null;
      var ok = acc.filter(function (x) { return x.document === d.cle && x.cgv_version === d.version; }).sort(function (a, b) { return String(b.granted_at).localeCompare(String(a.granted_at)); })[0] || null;
      var ancien = acc.filter(function (x) { return x.document === d.cle && x.cgv_version !== d.version; })[0] || null;
      return Object.assign({ cle: d.cle, titre: d.titre, version: d.version, url: d.url,
        consulteLe: vu ? vu.at : null, accepteLe: ok ? ok.granted_at : null,
        aJour: !!ok, aRelire: !ok && !!ancien,     // accepté dans une version qui a bougé : à relire et réaccepter
        peutAccepter: !!vu && !ok }, self.documentMots(d));
    });
  },
  /* (24/09, nuit) LES MOTS D'UN DOCUMENT selon sa nature : un texte d'information (politique de confidentialité) se reconnaît
     « lu », tout autre texte « lu et accepté ». Les écrans (inscriptions, comptes, fil, manager) lisent ces mots ici. */
  documentMots: function (d) {
    var info = !!d && d.nature === 'information';
    return { information: info, geste: info ? 'lire' : 'accepter',
      bouton: info ? 'J’ai lu' : 'J’ai lu et j’accepte', fait: info ? 'Lu' : 'Accepté', aFaire: info ? 'à lire' : 'à accepter' };
  },

  acceptationsRequises: function (espace, identifiant) {
    var docs = (this.ref.documents && this.ref.documents[espace]) || [], deja = this.acceptationsGet(espace, identifiant);
    return docs.filter(function (d) { return !deja.some(function (a) { return a.document === d.cle && a.cgv_version === d.version; }); });
  },
  consentir: function (type, texte) {
    try {
      var k = this._cleConsentements();
      var l = this.consentements();
      l.push({ type: type, texte: texte || '', version: this.CGV_VERSION, at: new Date().toISOString(), retire: null, client: this.clientActifGet ? this.clientActifGet() : null });
      localStorage.setItem(k, JSON.stringify(l));
    } catch (e) {}
  },
  retirerConsentement: function (type) {
    try {
      var k = this._cleConsentements();
      var l = this.consentements();
      l.filter(function (c) { return c.type === type && !c.retire; })
        .forEach(function (c) { c.retire = new Date().toISOString(); });
      localStorage.setItem(k, JSON.stringify(l));
    } catch (e) {}
  },
  consentements: function () {
    try {
      var k = this._cleConsentements(), v = localStorage.getItem(k);
      if (v == null) {
        // migration UNIQUE de l'ancienne clé globale vers le compte courant, puis on l'efface : plus aucun héritage
        var vieux = localStorage.getItem('pec-consentements');
        if (vieux != null) { localStorage.setItem(k, vieux); localStorage.removeItem('pec-consentements'); v = vieux; }
      }
      return JSON.parse(v || '[]');
    } catch (e) { return []; }
  },
  consentementActif: function (type) {
    return this.consentements().some(function (c) { return c.type === type && !c.retire; });
  },

  /* ══ (19/09, nuit — décision fondatrice « remets le domicile avec carnet d'adresses ») LE CARNET ════════
     Retiré le 18/09 au soir avec l'agent salarié, il revient avec le distributeur mobile : c'est LUI qui se
     déplace, et il doit pouvoir trouver la porte sans téléphoner. Miroir de la table `addresses`.
     Domicile, travail, autre — UNE par défaut. Chaque adresse porte les CHAMPS D'AIDE (étage, porte /
     interphone, instructions — comme un VTC) et, si le client l'a voulu, sa GÉOPOSITION réelle.
     Rien d'obligatoire : le lieu de rencontre n'est PAS forcément le domicile — (20/09) c'est L'ADRESSE que
     le client donne, celle de son compte par défaut, une autre s'il la saisit ou la relève de sa position. ══ */
  adresses: function () {
    try { return JSON.parse(this._lireCompte('pec-adresses') || '[]'); } catch (e) { return []; }
  },
  adresse: function (id) { return this.adresses().filter(function (x) { return x.id === id; })[0] || null; },
  // le résumé « aide au distributeur » d'une adresse — ce que son écran affiche, construit ICI et nulle part ailleurs
  adresseAide: function (a) {
    if (!a) return '';
    var b = [];
    if (a.etage) b.push('étage ' + a.etage);
    if (a.porte) b.push('porte/interphone ' + a.porte);
    if (a.instructions) b.push(a.instructions);
    return b.join(' · ');
  },
  /* ══ (10/09 — lot 5, constat F7) LE FIL DES ESPACES PROFESSIONNELS ═══════════════════════════════════════════════
     « Le partenaire, le fournisseur et le commercial n'ont AUCUN fil de notifications. » (17/09 — pivot : il
     reste le fournisseur et le commercial.) Des espaces qui font
     tourner l'entreprise apprenaient les choses en fouillant leurs écrans — ou ne les apprenaient pas : un dossier
     refusé, une facture virée, un colis en retard, un contrat qui attend une signature. Le client, lui, a son fil
     depuis le 08/09 (`notifs`), et le manager depuis le lot 4.
     Comme pour le client, RIEN N'EST STOCKÉ : chaque fait est DÉRIVÉ de sa source (coffre, bus, référentiels) avec
     un identifiant STABLE ; seul lu / non-lu persiste, et par COMPTE — pas par appareil (constat E2 5.1). Une seule
     dérivation pour les trois espaces : les faits communs (dossier, documents à accepter, réponses de la hotline)
     ne s'écrivent pas deux fois. ── */
  _cleFilPro: function (espace, id) { return 'pec-fil-lu:' + espace + ':' + (id || '—'); },
  filProLues: function (espace, id) { try { return JSON.parse(localStorage.getItem(this._cleFilPro(espace, id)) || '{}') || {}; } catch (e) { return {}; } },
  filProLire: function (espace, id, ids) {
    var l = this.filProLues(espace, id), at = Date.now();
    (ids && ids.length ? ids : this.filPro(espace, id).map(function (n) { return n.id; })).forEach(function (k) { if (!l[k]) l[k] = at; });
    try { localStorage.setItem(this._cleFilPro(espace, id), JSON.stringify(l)); } catch (e) {}
    try { window.dispatchEvent(new Event('pec-bus')); } catch (e2) {}
    return l;
  },
  filProNonLues: function (espace, id) { return this.filPro(espace, id).filter(function (n) { return !n.lu; }).length; },
  filPro: function (espace, id) {
    var self = this, out = [], D = this;
    var pousser = function (o) { if (o && o.id) out.push(o); };
    var jr = function (ts) { return self.depuis ? self.depuis(ts) : ''; };

    /* ── LES FAITS COMMUNS AUX TROIS ESPACES ──────────────────────────────────────────────────────────────── */
    // 1) le DOSSIER au coffre : une pièce refusée ou à renouveler bloque tout, et personne ne le disait
    var hrefDossier = { partenaire: '07-mon-point.html#dossier' }[espace];
    if (hrefDossier) {
      try {
        (PEC_DOCS.dossier(espace, id) || []).forEach(function (p) {
          /* (24/09, nuit) le titre dit « Pièce … — libellé » : « Contrat … validée » ou « RIB … validée » ne s'accordaient pas ; et le
             commerce lit « l'équipe PayEnCash », jamais l'identifiant de connexion d'un membre de l'équipe (statuePar) */
          if (p.statut === 'refusee') pousser({ id: 'doc-ko:' + espace + ':' + p.id + ':' + ((p.document || {}).statueAt || 0), at: (p.document || {}).statueAt || Date.now(),
            icone: 'i-alert', urgent: true, titre: 'Pièce refusée — ' + p.label, texte: ((p.document || {}).motif || 'à redéposer') + ' — dépose une nouvelle pièce, le dossier reste bloqué en attendant.', href: hrefDossier, action: 'Redéposer' });
          else if (p.statut === 'a_renouveler') pousser({ id: 'doc-exp:' + espace + ':' + p.id, at: (p.document || {}).at || Date.now(),
            icone: 'i-clock', urgent: true, titre: 'Pièce à renouveler — ' + p.label, texte: (p.libelle || 'à renouveler') + ' — une pièce périmée vaut pièce manquante.', href: hrefDossier, action: 'Renouveler' });
          else if (p.statut === 'a_signer') pousser({ id: 'doc-sign:' + espace + ':' + p.id, at: (p.document || {}).at || Date.now(),
            icone: 'i-edit', urgent: true, titre: 'À signer — ' + p.label, texte: 'Le document est prêt : lis-le et signe-le, rien ne part avant.', href: hrefDossier, action: 'Signer' });
          else if (p.statut === 'validee' && (p.document || {}).statueAt) pousser({ id: 'doc-ok:' + espace + ':' + p.id + ':' + p.document.statueAt, at: p.document.statueAt,
            icone: 'i-check', titre: 'Pièce validée — ' + p.label, texte: 'Contrôle fait par l’équipe PayEnCash ' + jr(p.document.statueAt) + '.', href: hrefDossier });
        });
      } catch (e1) {}
    }
    // 2) les DOCUMENTS EN VIGUEUR à accepter — une nouvelle version se ré-accepte (CGU art. 8.1)
    try {
      var loginA = (espace === 'partenaire') ? ((((this.comptesTous('partenaire') || []).filter(function (c) { return c.refId === id; })[0]) || {}).identifiant || id) : id;   // (18/09) les acceptations du point sont posées sous l'identifiant de son compte
      (this.acceptationsRequises(espace, loginA) || []).forEach(function (dcm) {
        // la date du fait, c'est l'ENTRÉE EN VIGUEUR de la version — pas l'instant où l'on regarde l'écran
        /* (24/09, nuit) ce qui se passe VRAIMENT : la vente reste fermée (techPeutVendre, refus « documents ») — il n'y a pas de voile ;
           et une politique de confidentialité se lit, elle ne s'accepte pas (documentMots) */
        var w = self.documentMots(dcm);
        pousser({ id: 'accept:' + espace + ':' + dcm.cle + '@' + dcm.version, at: Date.parse(dcm.version) || Date.now(), icone: 'i-file', urgent: true,
          titre: dcm.titre + ' — ' + w.aFaire, texte: 'Version ' + dcm.version + ' en vigueur : la vente reste fermée tant que tu ne l\'as pas ' + (w.information ? 'lue' : 'lue et acceptée') + ' dans Mon point.',
          href: { partenaire: '07-mon-point.html#acceptations' }[espace] || null });
      });
    } catch (e2) {}
    // 3) les RÉPONSES DE LA HOTLINE aux demandes ouvertes DEPUIS CET ESPACE (champ `espace` posé à l'ouverture)
    try {
      var nomEsp = id;
      (PEC_BUS.demandesSav() || []).filter(function (dm) { return dm.espace === espace && (dm.client === nomEsp || dm.client === id); }).forEach(function (dm) {
        (dm.echanges || []).filter(function (x) { return x.qui === 'hote'; }).forEach(function (x) {
          pousser({ id: 'sav-rep:' + dm.id + ':' + x.at, at: x.at, icone: 'i-chat', titre: 'Réponse de la hotline — ' + dm.id,
            texte: '« ' + String(x.texte).slice(0, 140) + ' » — ' + (x.par || 'hotline') + '.', href: null });
        });
        if (dm.decision && dm.cloAt) pousser({ id: 'sav-clos:' + dm.id, at: dm.cloAt, icone: 'i-check', titre: 'Demande ' + dm.id + ' close',
          texte: (dm.decision.motif || dm.sujet || '') + ' — par ' + (dm.decision.par || 'hotline') + '.', href: null });
        var esc = self.escaladeDemande(dm);
        if (esc.cle === 'manager' || esc.cle === 'mediateur') pousser({ id: 'sav-esc:' + dm.id + ':' + esc.cle, at: esc.depuis, icone: 'i-alert', urgent: true,
          titre: 'Ta demande ' + dm.id + ' est escaladée', texte: esc.libelle + ' — sans réponse depuis ' + esc.heures + ' h.', href: null });
      });
    } catch (e3) {}

    /* ── (23/09, nuit — grossiste) LE COMMERCE DU RÉSEAU : son contrat, son activation, puis ce qui ouvre ou ferme SA
       vente — le mandat SEPA (sédentaire) ou la garantie et l'avance (nomade), un prélèvement revenu impayé, une
       pénalité, un bon annulé. La carte bancaire du commerce et ses prélèvements à la vente sont partis avec le Bon
       d'achat PayEnCash : le fil annonçait une carte « à enregistrer » vers un écran qui n'existe plus. ── */
    if (espace === 'partenaire') {
      try {
        var pt = this.partenaire(id);
        if (pt) {
          if (pt.statut === 'contrat_a_signer') pousser({ id: 'pt-contrat:' + id, at: pt.creeAt || Date.now(), icone: 'i-edit', urgent: true, titre: 'Contrat de distribution à signer',
            texte: 'Sans contrat signé, ton point ne vend pas les bons des marques — lis-le et signe-le depuis Mon point.', href: '07-mon-point.html#contrat', action: 'Signer' });
          if (pt.activeAt) pousser({ id: 'pt-actif:' + id + ':' + pt.activeAt, at: pt.activeAt, icone: 'i-check', titre: 'Point activé par PayEnCash',
            texte: 'Tu peux vendre les bons des marques du réseau — activé par l’équipe PayEnCash ' + jr(pt.activeAt) + '.',   /* (24/09, nuit) jamais l'identifiant de connexion d'un membre de l'équipe */ href: '03-vendre.html', action: 'Vendre un bon' });
          if (pt.statut === 'suspendu' && pt.suspendueAt) pousser({ id: 'pt-susp:' + id + ':' + pt.suspendueAt, at: pt.suspendueAt, icone: 'i-alert', urgent: true, titre: 'Point suspendu',
            texte: (pt.motifSuspension || 'vente coupée') + ' — contacte PayEnCash.', href: '07-mon-point.html' });
          if (pt.statut === 'clos' && pt.closAt) pousser({ id: 'pt-clos:' + id + ':' + pt.closAt, at: pt.closAt, icone: 'i-x', urgent: true, titre: 'Contrat résilié',
            texte: (pt.motifClos || 'point clos') + ' — les bons déjà vendus restent valables pour tes clients.', href: '07-mon-point.html' });
          var rv = this.techRevendeurDuPoint(id);
          if (rv && pt.statut === 'actif') {
            if (this.techPaieParAvance(rv)) {
              var av = this.avanceSolde('revendeur', rv.id), A = this.techRef().avance;
              if (+A.garantie > 0 && !av.garantieVersee) pousser({ id: 'av-garantie:' + rv.id, at: pt.activeAt || Date.now(), icone: 'i-landmark', urgent: true, titre: 'Garantie à verser',
                texte: 'Verse ta garantie de ' + this.eur(A.garantie) + ' : elle t\'est restituée quand tu quittes le réseau, et c\'est elle qui ouvre ta vente.', href: '07-mon-point.html#avance', action: 'Voir' });
              else if (av.solde <= 0 || av.bas) {
                var mv0 = this.avanceMouvements('revendeur', rv.id)[0], at0 = mv0 ? mv0.at : (pt.activeAt || Date.now());
                pousser({ id: 'av-bas:' + rv.id + ':' + at0, at: at0, icone: 'i-alert', urgent: av.solde <= 0, titre: av.solde <= 0 ? 'Avance épuisée' : 'Avance bientôt épuisée',
                  texte: 'Ton avance est à ' + this.eur(av.solde) + ' : fais un virement d\'avance pour continuer à vendre.', href: '07-mon-point.html#avance', action: 'Voir' });
              }
            } else if (!this.techSepaMandat('revendeur', rv.id)) pousser({ id: 'sepa-abs:' + rv.id, at: pt.activeAt || Date.now(), icone: 'i-edit', urgent: true, titre: 'Mandat de prélèvement SEPA à signer',
              texte: 'Nous te prélevons après l\'arrêté du soir les bons que tu as vendus : sans mandat signé, la vente reste fermée.', href: '07-mon-point.html#sepa', action: 'Signer' });
          }
          if (rv && this._revendeurImpaye(rv)) {
            var enc = this.techEncours(rv.id);
            pousser({ id: 'impaye:' + rv.id + ':' + (rv.suspenduLe || 0), at: rv.suspenduLe || Date.now(), icone: 'i-alert', urgent: true, titre: 'Prélèvement revenu impayé — vente suspendue',
              texte: rv.suspenduMotif + (enc.impayes ? ' · ' + this.eur(enc.impayeMontant) + ' à régulariser' : '') + ' : la vente rouvre dès que le prélèvement représenté est payé.', href: '05-releves.html', action: 'Voir mes relevés' });
          }
          if (rv) {
            this.techPenalites({ revendeurId: rv.id }).forEach(function (x) {
              /* (24/09, nuit) la phrase suit l'ÉTAT de la pénalité : une pénalité revenue impayée n'est pas « prélevée avec le prochain arrêté » */
              var etatPen = { regle: 'réglée.', en_prelevement: 'partie au prélèvement' + (x.remiseRef ? ' (remise ' + x.remiseRef + ')' : '') + '.',
                impaye: 'revenue impayée avec son prélèvement : elle repart avec la représentation.' }[x.statut] || 'prélevée avec le prochain arrêté.';
              pousser({ id: 'pen:' + x.reference + ':' + x.statut, at: x.at, icone: 'i-alert', urgent: x.statut === 'impaye', titre: 'Pénalité ' + self.eur(x.montant) + ' — ' + x.reference,
                texte: (x.motif || 'pénalité du contrat') + ' — ' + etatPen, href: '05-releves.html' });
            });
            this.techBons({ revendeurId: rv.id }).forEach(function (b) {
              if (b.etat === 'cancelled' && b.annuleLe) pousser({ id: 'bon-annule:' + b.code, at: b.annuleLe, icone: 'i-x', titre: 'Bon ' + b.code + ' annulé',
                texte: (b.motifAnnulation || 'annulé') + ' — sa vente n\'est pas prélevée.', href: '04-bons.html' });
            });
          }
        }
      } catch (eP) {}
    }

    var lues = this.filProLues(espace, id);
    return out.map(function (n) { return Object.assign({ urgent: false, action: null }, n, { lu: !!lues[n.id] }); })
      .sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  },

  /* ══ (20/09) L'ANNUAIRE LOCAL DES POINTS RELAIS ═══════════════════════════════════════════════════════
     Ces adresses étaient nos « points d'encaissement » : un commerçant tiers y encaissait pour le compte d'AJEK,
     ce qui est illégal. Elles ont ensuite servi d'annuaire à un réseau tiers, parti le 20/09 avec lui.
     (20/09) IL LEUR RESTE LEUR SEUL USAGE VIVANT : ce sont des POINTS RELAIS Mondial Relay (relaisProches), où
     l'on retire un colis. Aucun lien contractuel de paiement, aucun encaissement pour notre compte : on n'y
     achète pas de bon d'achat — pour ça, il y a nos commerces partenaires (pointsBons).
     Chaque adresse porte sa GÉOPOSITION : les distances se CALCULENT, elles ne s'écrivent pas. ══ */
  points: [
    { id: "tabac-centre",    nom: "Tabac du Centre",         ville: "Marseille",       adresse: "12 rue de la Gare, 13001 Marseille",        geo: { lat: 43.3005, lng: 5.3785 }, ouvert: "20 h" },
    { id: "presse-poste",    nom: "Presse de la Poste",      ville: "Marseille",       adresse: "8 pl. du Marché, 13001 Marseille",          geo: { lat: 43.2985, lng: 5.3702 }, ouvert: "19 h 30" },
    { id: "tabac-halles",    nom: "Tabac des Halles",        ville: "Marseille",       adresse: "3 rue des Halles, 13002 Marseille",         geo: { lat: 43.2937, lng: 5.3768 }, ouvert: "19 h" },
    { id: "tabac-mairie-mgn",  nom: "Tabac de la Mairie",    ville: "Marignane",       adresse: "4 cours Mirabeau, 13700 Marignane",         geo: { lat: 43.4168, lng: 5.2149 }, ouvert: "19 h 30" },
    { id: "presse-vieux-mgn",  nom: "Presse du Vieux Village", ville: "Marignane",     adresse: "18 rue Covet, 13700 Marignane",             geo: { lat: 43.4152, lng: 5.2168 }, ouvert: "19 h" },
    { id: "tabac-plage-mgn",   nom: "Tabac de la Plage",     ville: "Marignane",       adresse: "2 route de la Plage, 13700 Marignane",      geo: { lat: 43.4188, lng: 5.2092 }, ouvert: "20 h" },
    { id: "tabac-cours-aix",   nom: "Tabac du Cours",        ville: "Aix-en-Provence", adresse: "31 cours Mirabeau, 13100 Aix-en-Provence",  geo: { lat: 43.5262, lng: 5.4506 }, ouvert: "20 h" },
    { id: "presse-rotonde-aix", nom: "Presse de la Rotonde", ville: "Aix-en-Provence", adresse: "2 pl. du Général-de-Gaulle, 13100 Aix",     geo: { lat: 43.5256, lng: 5.4442 }, ouvert: "19 h 30" },
    { id: "tabac-facs-aix",    nom: "Tabac des Facultés",    ville: "Aix-en-Provence", adresse: "12 av. Robert-Schuman, 13100 Aix",          geo: { lat: 43.5231, lng: 5.4401 }, ouvert: "19 h" },
    /* ── LES AUTRES VILLES (Aubagne, Toulon, Montpellier, Nîmes, Arles, Gardanne
          + densification Marseille) : même annuaire, mêmes commerces. ── */
    { id: "pt-mars-1", nom: "Tabac de la Joliette", ville: "Marseille", adresse: "55 quai de la Joliette, 13001 Marseille", geo: { lat: 43.2841, lng: 5.3548 }, ouvert: "20 h" },
    { id: "pt-mars-2", nom: "Presse du Prado", ville: "Marseille", adresse: "156 avenue du Prado, 13001 Marseille", geo: { lat: 43.2811, lng: 5.3644 }, ouvert: "20 h" },
    { id: "pt-mars-3", nom: "Tabac de Castellane", ville: "Marseille", adresse: "5 place Castellane, 13001 Marseille", geo: { lat: 43.2923, lng: 5.3846 }, ouvert: "20 h" },
    { id: "pt-mars-4", nom: "Presse Saint-Charles", ville: "Marseille", adresse: "3 square Narvik, 13001 Marseille", geo: { lat: 43.2995, lng: 5.3591 }, ouvert: "20 h" },
    { id: "pt-mars-5", nom: "Tabac du Vieux-Port", ville: "Marseille", adresse: "22 quai du Port, 13001 Marseille", geo: { lat: 43.3101, lng: 5.3522 }, ouvert: "20 h" },
    { id: "pt-mars-6", nom: "Presse de Belsunce", ville: "Marseille", adresse: "41 cours Belsunce, 13001 Marseille", geo: { lat: 43.3121, lng: 5.3740 }, ouvert: "20 h" },
    { id: "pt-mars-7", nom: "Tabac de la Plaine", ville: "Marseille", adresse: "18 place Jean-Jaurès, 13001 Marseille", geo: { lat: 43.3054, lng: 5.3573 }, ouvert: "19 h 30" },
    { id: "pt-mont-1", nom: "Tabac de la Comédie", ville: "Montpellier", adresse: "10 place de la Comédie, 34000 Montpellier", geo: { lat: 43.6084, lng: 3.8650 }, ouvert: "19 h" },
    { id: "pt-mont-2", nom: "Presse de la Gare", ville: "Montpellier", adresse: "1 place Auguste-Gibert, 34000 Montpellier", geo: { lat: 43.6207, lng: 3.8824 }, ouvert: "20 h" },
    { id: "pt-mont-3", nom: "Tabac d’Antigone", ville: "Montpellier", adresse: "120 avenue Jacques-Cartier, 34000 Montpellier", geo: { lat: 43.6131, lng: 3.8903 }, ouvert: "19 h 30" },
    { id: "pt-mont-4", nom: "Presse des Beaux-Arts", ville: "Montpellier", adresse: "14 rue de Substantion, 34000 Montpellier", geo: { lat: 43.6202, lng: 3.8638 }, ouvert: "19 h" },
    { id: "pt-toul-1", nom: "Tabac de la Liberté", ville: "Toulon", adresse: "6 place de la Liberté, 83000 Toulon", geo: { lat: 43.1158, lng: 5.9154 }, ouvert: "19 h 30" },
    { id: "pt-toul-2", nom: "Presse de la Gare", ville: "Toulon", adresse: "2 boulevard Tessé, 83000 Toulon", geo: { lat: 43.1288, lng: 5.9133 }, ouvert: "19 h" },
    { id: "pt-toul-3", nom: "Tabac du Mourillon", ville: "Toulon", adresse: "213 avenue de la Résistance, 83000 Toulon", geo: { lat: 43.1413, lng: 5.9101 }, ouvert: "20 h" },
    { id: "pt-nime-1", nom: "Tabac des Arènes", ville: "Nîmes", adresse: "2 boulevard des Arènes, 30000 Nîmes", geo: { lat: 43.8348, lng: 4.3670 }, ouvert: "20 h" },
    { id: "pt-nime-2", nom: "Presse des Feuchères", ville: "Nîmes", adresse: "9 avenue Feuchères, 30000 Nîmes", geo: { lat: 43.8317, lng: 4.3595 }, ouvert: "20 h" },
    { id: "pt-arle-1", nom: "Tabac des Lices", ville: "Arles", adresse: "27 boulevard des Lices, 13200 Arles", geo: { lat: 43.6776, lng: 4.6393 }, ouvert: "20 h" },
    { id: "pt-auba-1", nom: "Tabac du Cours Foch", ville: "Aubagne", adresse: "11 cours Foch, 13400 Aubagne", geo: { lat: 43.3035, lng: 5.5810 }, ouvert: "19 h 30" },
    { id: "pt-auba-2", nom: "Presse de la Gare", ville: "Aubagne", adresse: "2 avenue Antide-Boyer, 13400 Aubagne", geo: { lat: 43.3029, lng: 5.5667 }, ouvert: "19 h 30" },
    { id: "pt-gard-1", nom: "Tabac du Cours Forbin", ville: "Gardanne", adresse: "24 cours Forbin, 13120 Gardanne", geo: { lat: 43.4548, lng: 5.4759 }, ouvert: "20 h" }
  ],
  /* Un fournisseur dont l'accès n'est pas actif ne vend plus : ses lots quittent la vente et ses réservations se libèrent.
     Avant, suspendre ne retirait RIEN du catalogue — une commande créait une expédition qu'il ne pouvait pas traiter. */
  fournisseurEnVente: function (nomOuId) {
    var f = this.fournisseur(nomOuId); if (!f) return true;   // article sans fournisseur nommé (référentiel) : inchangé
    var st = (f.acces || {}).statut;
    return !(st === 'suspendu' || st === 'clos');
  },
  /* (17/09 — pivot, puis 18/09) LE RÉSEAU DE POINTS QUI ENCAISSAIT A ÉTÉ RETIRÉ ; LE RÉSEAU QUI VEND LE BON D’ACHAT REVIENT.
     Un commerçant tiers qui encaisse une commande pour le compte d'AJEK, c'est un service de paiement sans agrément :
     borne, mandat d'encaissement, commission par vente, participation mensuelle, flyers de point sont partis pour de bon d’achat.
     Le commerçant partenaire du 18/09 VEND un Bon d’achat PayEnCash (titre à usage limité, art. L521-3 CMF) et reverse chaque
     mois : voir le bloc « LES COMMERÇANTS PARTENAIRES v2 » et « LE REVERSEMENT MENSUEL » plus haut (partenaires, partenaire,
     partenaireEtat, partenaireActiver/Suspendre/Reactiver/Cloturer, bonsDuPoint, prelevementPartenaire/releveMensuel).
     La liste des commerces (`points`) ne sert plus qu'aux POINTS RELAIS Mondial Relay (`relaisProches`). */
  /* Le NOM lisible d'un commercial à partir de son identifiant de compte — l'écran montre une personne,
     la donnée garde le compte. (10/09 — lot 8 : `partenaires[].commercial` portait « Emilie R. », un libellé
     que rien ne reliait à un compte : la commission d'apport ne pouvait désigner personne.) */
  commercialNom: function (ident) {
    if (!ident) return '—';
    try {
      var c = this.compteParIdentifiant ? this.compteParIdentifiant('commercial', ident) : null;
      if (c && c.profil && c.profil.nom) return c.profil.nom;
      var d = (this.comptesDemo || []).filter(function (x) { return x.identifiant === ident; })[0];
      if (d && d.role) return ident + ' — ' + d.role;
    } catch (e) {}
    return ident;
  },
  /* (18/09, soir) LE RÉFÉRENTIEL RH DES AGENTS DE CAISSE MOBILE (`agentsBase`, 63 salariés avec véhicule, zone,
     point de prise de poste, matricule, contrat et salaire net) est parti avec eux. Personne ne se déplace plus
     encaisser : le client achète son Bon d’achat PayEnCash au comptoir d'un commerce, ou à un distributeur mobile. */
  /* (18/09, soir) TOUTE LA RH DE L'AGENT EST PARTIE AVEC LUI, et il ne restait ici que les commentaires de fonctions
     déjà supprimées — ce qui se lit comme une promesse encore tenue. Sont partis : les écarts RH persistés
     (`pec-agents-overrides`), la check-list de prise de poste (`_clePriseDePoste`, clé `pec-prise-de-poste`), le
     profil que l'agent rectifiait lui-même, son RIB relevé sur la pièce validée, les BULLETINS DE PAIE et leur calcul
     unique (net → brut → cotisations → charges patronales), les NOTES DE FRAIS et les VIREMENTS DE SALAIRE. */
  /* (18/09, soir — l'agent de caisse mobile est abandonné) TOUT LE DISPATCH EST PARTI AVEC LUI : le rayon
     d'affectation, le barycentre d'une zone, la position déduite d'une adresse de livraison, la liste des agents
     éligibles, la visibilité d'une course. Plus personne ne se déplace : il n'y a plus de lieu à trouver, plus de
     course à attribuer. Ce qui reste de géographie sert au CLIENT — trouver le commerce le plus proche où acheter
     son bon d'achat (pointsBons). */

  /* (17/09 — pivot) LES BORNES N'EXISTENT PLUS : `bornesOverrides / bornes / borneEnregistrer / borneSupprimer /
     bornesProches` sont parties avec l'automate installé chez le commerçant. ⚠ à ne pas confondre avec les
     AUTOMATES CASH SERVICES, partis le 18/09 au soir avec l'agent qui y déposait les espèces.
     `geoNormalise` reste : toute géoposition saisie passe par elle (commerces partenaires, points relais). */
  // geo saines UNIQUEMENT (28/08 : une lat/lng inversée à la saisie envoyait la
  // carte au niveau monde) : inversion France détectée → corrigée ; hors bornes
  // terrestres → geo ignorée ; un override SANS geo ne détruit pas celle de base.
  geoNormalise: function (g) {
    if (!g || !isFinite(g.lat) || !isFinite(g.lng)) return null;
    var lat = +g.lat, lng = +g.lng;
    if (lat >= -6 && lat <= 12 && lng >= 40 && lng <= 53) { var t = lat; lat = lng; lng = t; }   // lat/lng inversées (France)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return Object.assign({}, g, { lat: lat, lng: lng });
  },
  // la référence de zone (repli quand le client refuse sa position) — Marseille centre
  posReference: { lat: 43.2977, lng: 5.3755, label: "Marseille centre" },
  /* (18/09, soir) LA POSITION D'UNE VILLE DU RÉSEAU — par son code postal d'abord (il est exact), par son nom
     ensuite (accents et casse ignorés). `null` quand la ville n'est pas du réseau : on ne devine pas une position,
     l'écran le dit. C'est ce qui permet à un commerce sans géoposition saisie d'apparaître quand même sur la carte,
     au centre de sa ville, avec la mention « position approchée ». */
  _sansAccent: function (v) { var t = String(v == null ? '' : v).toLowerCase(); return t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t; },
  villeReseau: function (ville, cp) {
    var L = ((this.ref || {}).villesReseau) || [], c = String(cp || '').replace(/\s/g, ''), v = this._sansAccent(ville), self = this;
    if (c) { var parCp = L.filter(function (x) { return (x.cp || []).indexOf(c) > -1; })[0]; if (parCp) return parCp; }
    if (!v) return null;
    return L.filter(function (x) { return self._sansAccent(x.nom) === v; })[0]
        || L.filter(function (x) { return v.indexOf(self._sansAccent(x.nom)) > -1 || self._sansAccent(x.nom).indexOf(v) > -1; })[0] || null;
  },
  villeGeo: function (ville, cp) { var z = this.villeReseau(ville, cp); return z ? this.geoNormalise(z.centre) : null; },
  distanceM: function (a, b) {
    if (!a || !b) return null;
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return Math.round(2 * R * Math.asin(Math.sqrt(x)));
  },
  fmtDist: function (m) {
    if (m === null || m === undefined) return '—';
    return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
  },
  /* (18/09, soir) « 327 min à pied » pour un commerce à 26 km n'est pas une information, c'est une absurdité
     affichée. Au-delà d'une marche raisonnable, on ne dit plus un temps de marche : la distance suffit, et
     l'écran n'a pas à faire croire qu'on y va à pied. Le seuil est une DONNÉE, réglable comme les autres. */
  /* (19/09, soir — « la localisation de l'utilisateur, à moins de 500 m, avec la carte comme Uber où on avance
     en direction du partenaire ») LES PALIERS DE PROXIMITÉ. Ce ne sont pas des chiffres décoratifs : ils changent
     ce que l'écran DIT pendant qu'on marche. `procheM` est le seuil demandé — en deçà, on annonce qu'on y est
     presque ; `arriveM` est la distance à laquelle on considère qu'on est sur place : elle est du même ordre que
     la précision d'un GPS piéton en ville (PEC_GEO s'arrête d'affiner à 25 m), sinon on annoncerait « arrivé »
     à un carrefour de distance. Réglables comme le reste (10-configuration, chemin `proximite.*`). */
  proximite: { procheM: 500, arriveM: 60 },
  piedMaxMin: 45,
  proximiteRef: function () {
    var p = this.proximite || {};
    var proche = +this.param('proximite.procheM', p.procheM) || 0;
    var arrive = +this.param('proximite.arriveM', p.arriveM) || 0;
    /* GARDE DE COHÉRENCE : un seuil d'arrivée plus grand que le seuil de proximité ferait dire « tu y es » à
       400 m et ne dirait JAMAIS « c'est tout près ». Le réglage reste libre, la lecture reste ordonnée. */
    return { procheM: proche, arriveM: Math.min(arrive, proche) };
  },
  /* ══ OÙ EN EST-ON DE LA MARCHE (19/09, soir) ═══════════════════════════════════════════════
     Trois états, et un seul endroit qui les nomme — l'écran ne compare pas des mètres lui-même :
       · `arrive`  : on y est (≤ arriveM) — la précision du GPS ne permet pas de dire mieux, et on le dit ;
       · `proche`  : ≤ procheM — le seuil demandé, celui qui fait passer le ton à « c'est tout près » ;
       · `route`   : au-delà — on donne la distance et le temps à pied, rien de plus.
     Sans position, `inconnu` : aucun état inventé. ══ */
  proximiteEtat: function (distM) {
    var P = this.proximiteRef();
    if (distM == null || !isFinite(distM)) return { cle: 'inconnu', titre: 'Position inconnue', texte: 'Autorise ta position pour suivre ton approche.' };
    var m = Math.round(distM);
    if (m <= P.arriveM) return { cle: 'arrive', distM: m, titre: 'Tu y es', texte: 'Tu es sur place à quelques mètres près — entre et demande un ' + (this.bonsRef().nom || 'Bon d’achat PayEnCash') + '.' };
    if (m <= P.procheM) return { cle: 'proche', distM: m, titre: 'C’est tout près', texte: 'Plus que ' + this.fmtDist(m) + (this.fmtPied(m) ? ' · ' + this.fmtPied(m) : '') + '.' };
    return { cle: 'route', distM: m, titre: 'En route', texte: this.fmtDist(m) + (this.fmtPied(m) ? ' · ' + this.fmtPied(m) : '') + ' — la distance se met à jour pendant que tu marches.' };
  },
  fmtPied: function (m) {
    if (m === null || m === undefined) return '';
    var max = this.param ? this.param('piedMaxMin', this.piedMaxMin) : this.piedMaxMin;
    var min = Math.max(1, Math.round(m / 80));
    return min > max ? '' : min + ' min à pied';
  },
  /* (18/09, soir) LE CIRCUIT DE DÉPÔT DES ESPÈCES EST PARTI AVEC L'AGENT DE CAISSE MOBILE : l'ETA calculé sur sa
     position live, l'ANNUAIRE DES 47 AUTOMATES CASH SERVICES (`automatesCS`, `automatesProches` — le réseau BNP
     Paribas · Crédit Mutuel · CIC · SG où il déposait le cash par carte nominative) et le SEUIL D'ENCOURS
     (`seuilDepotAgent`, 400 €, au-delà duquel le dépôt devenait obligatoire). Plus personne ne porte d'espèces
     pour PayEnCash : le client les remet au commerçant, qui nous règle par carte à chaque vente. */

  /* ── COMPTES & ACCÈS DE DÉMONSTRATION (28/08 — fondatrice : « les infos de
        connexion et mots de passe depuis l'espace manager ») : le trousseau de
        la MAQUETTE — un compte par espace/persona pour tester la chaîne de
        bout en bout. ⚠ ENVIRONNEMENT DE DÉMO UNIQUEMENT : en production, les
        mots de passe sont hachés (jamais en clair) et un tel écran n'existe
        pas ; ici ce sont des identifiants fictifs, sans valeur hors maquette.
        Miroir des tables couriers / partners (les comptes manager n'ont pas encore de table au schéma). ── */
  comptesDemo: [
    { espace: 'Manager (back-office)', role: 'Direction',     identifiant: 'emilie.r',        motdepasse: 'Manager!2026',  ecran: '../manager/01-connexion.html',    note: 'accès complet — pilotage, finance, réseau' },
    { espace: 'Manager (back-office)', role: 'Superviseur',   identifiant: 'super.mars',      motdepasse: 'Super!2026',    ecran: '../manager/01-connexion.html',    note: 'supervision du réseau, des prélèvements et des vérifications' },
    { espace: 'Hotline',               role: 'Conseiller',    identifiant: 'hotline.op',      motdepasse: 'Hotline!2026',  ecran: '../hotline/00-connexion.html',     note: 'file de sécurisation & rappels' },
    /* (19/09, nuit — « crée un compte de démo pour PayEnCash Technologie ») LA SECONDE LIGNE A SON TROUSSEAU.
       Deux comptes : le commerçant e-commerce et son revendeur. Ils ne naissent pas d'ici — ce sont des
       IDENTIFIANTS, et le jeu complet (conformité validée, mandats, mise en relation, clé d'API) se monte
       d'un geste depuis la connexion de l'espace : `techJeuDemo()`. Zéro seed : rien n'existe tant que
       personne n'a cliqué. */
    { espace: 'PayEnCash Solution', role: 'Marque', identifiant: 'hello@boutique-lila.fr', motdepasse: 'Solution!2026', ecran: '../tech/01-connexion.html', note: 'Boutique Lila — émet ses bons, utilisables sur son seul site ; le compte naît avec « Monter le jeu de démonstration »' },
  ],
  connecter: function (compte) {
    // (18/09, soir) la session ne porte plus `agentId` : il scopait l'app agent à SES courses, partie avec l'agent de caisse mobile.
    var sess = { identifiant: compte.identifiant, espace: compte.espace, role: compte.role, at: Date.now() };
    try { localStorage.setItem('pec-session', JSON.stringify(sess)); } catch (e) {}
    return sess;
  },
  session: function () {
    try { return JSON.parse(localStorage.getItem('pec-session') || 'null'); } catch (e) { return null; }
  },
  deconnecter: function () { try { localStorage.removeItem('pec-session'); } catch (e) {} },

  /* ── PIPELINE COMMERCIAL (29/08 — audit zéro-dur : les 3 prospects étaient
        en dur dans l'écran commercial/01). Le référentiel des points visés par
        le commercial (miroir table `sales_leads`) — étape du pipeline (repéré →
        pitché → signature → signé), adresse, prochaine action. ── */
  /* (08/09 — audit commercial) LES PROSPECTS DE DÉMO : trois commerces repérés — l'ÉTAPE n'est plus écrite, elle se DÉRIVE du
     journal (visite → proposition → lien de signature → mandat signé) ; le commercial en AJOUTE (prospectEnregistrer). */
  prospectsCommercial: [
    /* (17/09 — pivot, confirmé le 18/09) Le pipeline part VIDE — un prospect n'existe que si un commercial l'ajoute
       (prospectEnregistrer) : un commerce partenaire (il vendra le Bon d’achat PayEnCash) ou un atelier fournisseur. */
  ],
  /* ── (10/09 — lot 8, constat D-47) LE COMMERCIAL RECRUTE AUSSI DES FOURNISSEURS ─────────────────────────────
     Question posée à l'audit : « ce recrutement existe-t-il ? » Non. Le pipeline ne connaissait QU'UN type de
     prospect (commerce/tabac) ; un fournisseur naissait soit de son auto-inscription, soit d'une invitation du
     MANAGER — aucune fiche ne portait d'apporteur. Or l'entonnoir de prélancement MODE affiche un objectif de
     120 candidatures : personne ne pouvait dire d'où elles venaient. Un prospect porte donc sa NATURE, et
     l'atelier a son propre entonnoir : on ne lui fait pas signer un mandat d'apport d'affaires, on l'invite à
     déposer sa candidature, puis son KYB et son catalogue font foi. ── */
  /* (18/09) DEUX NATURES : le COMMERCE PARTENAIRE (tabac, presse, commerce — il signe le contrat de distribution du Bon d’achat
     PayEnCash, puis PayEnCash l'active) et l'ATELIER FOURNISSEUR Mode (candidature → KYB → catalogue). */
  TYPES_PROSPECT: { point: 'Commerce partenaire — Bon d’achat PayEnCash', fournisseur: 'Fournisseur MODE' },
  prospectsOverrides: function () { try { return JSON.parse(localStorage.getItem('pec-prospects') || '{}') || {}; } catch (e) { return {}; } },
  prospectsGet: function () {
    var d = this, ov = this.prospectsOverrides();
    var l = this.prospectsCommercial.map(function (p) { return Object.assign({}, p, ov[p.id] || {}); });
    Object.keys(ov).forEach(function (id) { if (!l.some(function (p) { return p.id === id; })) l.push(Object.assign({ id: id }, ov[id])); });
    return l.filter(function (p) { return !p.supprime; }).map(function (p) { p.etape = d.prospectEtape(p); p.action = d.prospectAction(p); return p; });
  },
  prospect: function (id) { return this.prospectsGet().filter(function (p) { return p.id === id; })[0] || null; },
  prospectEnregistrer: function (p, par) {
    p = p || {};
    if (!p.id) {
      if (!p.nom || !p.adresse) return { ok: false, motif: 'Le nom et l\'adresse du commerce sont obligatoires.' };
      // (10/09 — lot 8, constat D-47) la NATURE du prospect : un point partenaire, ou un atelier fournisseur MODE
      if (p.type && !this.TYPES_PROSPECT[p.type]) return { ok: false, motif: 'Nature de prospect inconnue.' };
      p.type = p.type || 'fournisseur';
      var slug = String(p.nom).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'prospect';
      var ov0 = this.prospectsOverrides(), id = slug, n = 2; while (ov0[id] || this.prospectsCommercial.some(function (x) { return x.id === id; })) { id = slug + '-' + (n++); }
      p.id = id; p.creeAt = Date.now(); p.creePar = par || null;
      if (!p.ville) p.ville = (String(p.adresse).split(',').pop() || '').trim();
    }
    var ov = this.prospectsOverrides(); ov[p.id] = Object.assign({}, ov[p.id] || {}, p, { majAt: Date.now() });
    if (!this._ecrit('pec-prospects', ov)) return this._refusEcriture('Le prospect');
    this._journal(p.creeAt && ov[p.id].creeAt === p.creeAt ? 'prospect_cree' : 'prospect_maj', p.id, { par: par, nom: p.nom });
    try { window.dispatchEvent(new CustomEvent('pec-bus')); } catch (e2) {}
    return { ok: true, prospect: this.prospect(p.id) };
  },
  /* (09/09 — lot 1 socle) L'ÉTAT DU PROSPECT (visite D1, proposition D2, lien de signature et son JETON) est porté par la FICHE
     (pec-prospects), plus par le journal du bus : celui-ci est plafonné, et passé son plafond l'étape régressait à « repéré »
     et le lien envoyé au gérant devenait « invalide ». Le journal reste la trace de chaque geste. */
  // L'ÉTAPE se dérive de FAITS : catalogue publié > KYB validé > candidature déposée > invitation > proposition (D2) > visite (D1) ; perdu prime
  prospectEtape: function (p) {
    if (!p) return 'repere';
    if (p.perdu) return 'perdu';
    return p.type === 'point' ? this._etapeProspectPoint(p) : this._etapeProspectFournisseur(p);
  },
  /* (18/09) L'étape d'un COMMERCE PARTENAIRE se lit sur des faits : le point (actif → ouvert ; contrat signé → signe), le lien de
     signature envoyé, la proposition, la visite. Rien n'est déclaré à la main. */
  _etapeProspectPoint: function (p) {
    var pt = this.partenaireParProspect(p.id);
    if (pt) return (pt.statut === 'actif' || pt.statut === 'suspendu' || pt.statut === 'clos') ? 'ouvert' : 'signe';
    if (p.signature && p.signature.at) return 'signature';
    if (p.proposition && p.proposition.at) return 'pitche';
    if (p.visite && p.visite.at) return 'visite';
    return 'repere';
  },
  /* L'étape d'un prospect FOURNISSEUR se lit sur des faits, comme celle d'un point : le compte invité, la
     candidature déposée, le KYB validé au coffre, le catalogue publié. Rien n'est déclaré à la main. */
  _etapeProspectFournisseur: function (p) {
    var f = p.fournisseurId ? this.fournisseur(p.fournisseurId) : null;
    if (f) {
      var minP = ((this.lancement.objectifFournisseurs || {}).cataloguesMinPieces) || 3, n = 0;
      try { (this.inventaireGet() || []).forEach(function (l) { if (l.fournisseur === f.nom) n += (l.lignes || []).reduce(function (t, x) { return t + (x.qte || 0); }, 0); }); } catch (e) {}
      if (n >= minP) return 'ouvert';
      if (this.fournisseurKyb(f).valide) return 'signe';
      return 'inscrit';
    }
    if (p.invitation && p.invitation.at) return 'invite';
    if (p.proposition && p.proposition.at) return 'pitche';
    if (p.visite && p.visite.at) return 'visite';
    return 'repere';
  },
  prospectAction: function (p) {
      var ef = p.etape || this.prospectEtape(p), Pf = this.commercial.pitch || {};
      if (p.type === 'point') {
        var Rb = this.bonsRef();
        return ({ repere: 'passer voir le commerce, puis compte-rendu de visite sous ' + (Pf.d1Heures || 24) + ' h (D1)',
          visite: 'envoyer la proposition (Bon d’achat PayEnCash : ' + Rb.commissionPct + ' % de commission, zéro matériel, zéro risque) sous ' + (Pf.d2Heures || 48) + ' h (D2)',
          pitche: 'faire signer le contrat de distribution — au comptoir, ou par le lien envoyé au gérant',
          signature: 'relancer — lien envoyé, contrat pas encore signé',
          signe: 'contrat signé : le gérant dépose son dossier (Kbis, pièce d\'identité, vidéo), PayEnCash active le point',
          ouvert: 'point actif — il vend des Bons d’achat PayEnCash',
          perdu: 'perdu' + (p.motifPerdu ? ' — ' + p.motifPerdu : '') })[ef] || '';
      }
      return ({ repere: 'passer voir l\'atelier, puis compte-rendu de visite sous ' + (Pf.d1Heures || 24) + ' h (D1)',
        visite: 'envoyer la proposition (contrat-cadre d\'achat ferme, remise AJEK) sous ' + (Pf.d2Heures || 48) + ' h (D2)',
        pitche: 'inviter l\'atelier à déposer sa candidature fournisseur',
        invite: 'relancer — invitation envoyée, candidature pas encore déposée',
        inscrit: 'candidature déposée : le KYB est à compléter et à valider',
        signe: 'KYB validé — accompagner la publication du premier catalogue (≥ 3 pièces)',
        ouvert: 'fournisseur en exploitation — suivi catalogue',
        perdu: 'perdu' + (p.motifPerdu ? ' — ' + p.motifPerdu : '') })[ef] || '';
  },
  /* Le jeton vaut jusqu'à sa date, et une seule fois : après la signature il est consommé (l'écran redemande un nouveau lien). */
  signatureLienEtat: function (id, jeton) {
    var p = this.prospect(id), s = p && p.signature;
    if (!s || !s.jeton) return { ok: false, motif: 'aucun', message: 'Aucun lien de signature n\'a été envoyé pour ce commerce.' };
    if (!jeton || s.jeton !== jeton) return { ok: false, motif: 'jeton', message: 'Ce lien n\'est pas valide — demande-en un nouveau à ton conseiller.' };
    if (s.consommeAt) return { ok: false, motif: 'consomme', message: 'Ce lien a déjà servi à signer le contrat.', signature: s };
    if (s.expireAt && Date.now() > s.expireAt) return { ok: false, motif: 'expire', message: 'Ce lien a expiré — demande-en un nouveau à ton conseiller.', signature: s };
    return { ok: true, signature: s };
  },
  // le code de DÉMONSTRATION dérivé du jeton : aucun SMS n'est réellement émis en maquette
  signatureOtpCode: function (jeton) { return this._codeChiffres(String(jeton || '') + '|otp'); },
  signatureOtpVerifier: function (id, code) {
    var p = this.prospect(id) || {}, s = p.signature || {}, o = s.otp;
    if (!o) return { ok: false, motif: 'Demande d\'abord ton code de signature : il t\'est envoyé sur le canal déclaré à ton conseiller.' };
    if (o.expireAt && Date.now() > o.expireAt) return { ok: false, motif: 'Ce code a expiré — demandes-en un nouveau.' };
    if (String(code || '').trim() !== this.signatureOtpCode(s.jeton)) return { ok: false, motif: 'Code incorrect.' };
    var preuve = { canal: o.canal, destinataire: o.destinataire, at: Date.now() };
    this.prospectEnregistrer({ id: id, signature: Object.assign({}, s, { otp: Object.assign({}, o, { verifieAt: preuve.at }) }) }, 'gerant');
    return { ok: true, preuve: preuve };
  },
  /* LE CONTRAT SIGNÉ — prospect du pipeline OU point auto-inscrit (la fiche du point sert alors de contexte). Le point naît
     (ou passe) « contrat signé — intégration » : PayEnCash contrôle ensuite le dossier et l'active. */
  contratPartenaireSigner: function (id, o) {
    o = o || {};
    var p = this.prospect(id), pt0 = this.partenaireParProspect(id) || this.partenaire(id);
    if (!p && pt0) p = { id: id, nom: pt0.enseigne, adresse: pt0.adresse || '', ville: pt0.ville || '', cp: pt0.cp || '', tel: pt0.tel || null, email: pt0.email || null, siret: pt0.siret || null, autoInscrit: true };
    if (!p) return { ok: false, motif: 'Commerce inconnu — ni prospect du pipeline, ni point enregistré.' };
    if (p.perdu) return { ok: false, motif: 'Prospect perdu' + (p.motifPerdu ? ' (' + p.motifPerdu + ')' : '') + ' — rouvre-le avant de faire signer le contrat.' };
    var r = String(o.responsable || '').trim(); if (r.length < 3) return { ok: false, motif: 'Indique le signataire (gérant·e) tel qu\'il figure sur le Kbis.' };
    var siret = String(p.siret || '').replace(/\s/g, '');
    if (!this.siretValide(siret)) return { ok: false, champ: 'siret', motif: 'SIRET du commerce obligatoire (14 chiffres, clé comprise) pour identifier le distributeur au contrat.' };
    if (!pt0) pt0 = this.partenaireParSiret(siret);   // un commerce déjà inscrit dans l'app n'ouvre pas un second point
    if (pt0 && /^(contrat_signe|actif|suspendu)$/.test(pt0.statut || '')) return { ok: false, motif: 'Le contrat de ' + p.nom + ' est déjà signé.', partenaire: pt0 };
    if (pt0 && pt0.statut === 'clos') return { ok: false, motif: p.nom + ' est clos : un commerce résilié se ré-inscrit avant de signer à nouveau.', partenaire: pt0 };
    if (o.jeton !== undefined || o.via === 'lien') { var et = this.signatureLienEtat(id, o.jeton); if (!et.ok) return { ok: false, motif: et.message }; }
    var preuve = null;
    if (o.via === 'lien') { var vo = this.signatureOtpVerifier(id, o.otp); if (!vo.ok) return { ok: false, champ: 'otp', motif: vo.motif }; preuve = vo.preuve; }
    var t = new Date(), signeLe = String(t.getDate()).padStart(2, '0') + '/' + String(t.getMonth() + 1).padStart(2, '0') + '/' + t.getFullYear();
    var ville = p.ville || (String(p.adresse).split(',').pop() || '').replace(/^\s*\d{5}\s*/, '').trim();
    var pointId = (pt0 && pt0.id) || this._partenaireNouvelId();
    var fiche = { id: pointId, enseigne: p.nom, ville: ville, cp: p.cp || (pt0 && pt0.cp) || ((String(p.adresse).match(/\b(\d{5})\b/) || [])[1]) || '', adresse: p.adresse, statut: 'contrat_signe',
      responsable: r, tel: p.tel || null, email: p.email || null, siret: siret, signeLe: signeLe, signaturePreuve: preuve,
      commercial: (o.via === 'lien' ? ((p.signature || {}).par || p.creePar || null) : (o.via === 'coffre' ? ((pt0 && pt0.commercial) || null) : (o.par || 'commercial'))),
      prospectId: p.autoInscrit ? null : p.id, signatureVia: o.via || 'saisie', signatureJeton: o.jeton || null };
    if (!this.partenaireEnregistrer(fiche, o.par || 'commercial')) return this._refusEcriture('La signature du contrat de ' + p.nom);
    if (!p.autoInscrit) this.prospectEnregistrer(Object.assign({ id: p.id, pointId: pointId }, o.jeton ? { signature: Object.assign({}, p.signature || {}, { consommeAt: Date.now() }) } : {}), o.par || 'gerant');
    this._journal('contrat_partenaire_signe', pointId, { par: o.via === 'lien' ? r + ' (gérant·e, via le lien)' : (o.par || 'commercial'), enseigne: p.nom, responsable: r, signeLe: signeLe, via: o.via || 'saisie', preuve: preuve });
    var ctxDoc = { nom: p.nom, enseigne: p.nom, ville: ville, adresse: p.adresse, siret: siret, responsable: r, signataireAttendu: r };
    if (o.via !== 'coffre') { try { if (window.PEC_DOCS && PEC_DOCS.signer) PEC_DOCS.signer('partenaire', pointId, 'contrat', r + ' — gérant·e de ' + p.nom, ctxDoc).catch(function () {}); } catch (eD) {} }
    var inv = null; try { inv = this.partenaireInviterGerant(pointId, o.par || 'commercial'); } catch (eI) {}
    if (o.via === 'lien' && inv && inv.compte) {   // le gérant qui signe par le lien n'est jamais passé par l'inscription : ses acceptations se posent ici
      try { this.acceptationsPoser('partenaire', inv.compte.identifiant, ((this.ref.documents || {}).partenaire || []).map(function (d) { return d.cle; }), r); } catch (eA) {}
    }
    return { ok: true, partenaire: this.partenaire(pointId), pointId: pointId, signeLe: signeLe, invitation: inv || null };
  },
  /* LE GÉRANT QUI SIGNE REÇOIT UN ACCÈS — un compte « invité » (mot de passe à créer) rattaché au point EXISTANT. */
  partenaireInviterGerant: function (pointId, par) {
    var pt = this.partenaire(pointId); if (!pt) return { ok: false, motif: 'Point inconnu.' };
    var deja = (this.comptesTous('partenaire') || []).filter(function (c) { return c.refId === pointId || (c.profil || {}).pointId === pointId; })[0];
    if (deja) return { ok: true, compte: deja, deja: true };
    if (!pt.email) return { ok: false, motif: 'Aucun e-mail du gérant : sans lui, pas d\'invitation possible.' };
    var r = this.compteCreer('partenaire', { invite: true, email: pt.email, identifiant: pt.email, invitePar: par || 'commercial',
      enseigne: pt.enseigne, adresse: pt.adresse || '', cp: pt.cp || '', ville: pt.ville || '', tel: pt.tel || '', responsable: pt.responsable || '', siret: pt.siret || '', pointId: pointId });
    if (!r.ok) return r;
    this._compteMaj(r.compte, { refId: pointId }, 'compte_lie', { refId: pointId });   // il rejoint le point EXISTANT, il n'en crée pas un second
    this.partenaireEnregistrer({ id: pointId, compteId: r.compte.id }, par || 'commercial');
    return { ok: true, compte: r.compte, lien: '01-connexion.html?invit=' + encodeURIComponent(r.compte.id) };
  },

  /* ══ MARKETING — les tables écrites depuis le cockpit (zéro seed) ══ */
  /* ── (11/09) UNE SEULE FAÇON D'ÉCHAPPER UNE VALEUR ─────────────────────────────────────────────────────────
     `esc` était réécrite DANS CHAQUE ÉCRAN — dix-neuf variantes pour une même fonction, et plusieurs fausses :
     dix n'échappaient pas le guillemet (une valeur interpolée dans un attribut sortait du sien), une oubliait le
     chevron fermant, trois affichaient « null » ou « undefined » faute de garde. Une valeur qui vient d'un champ
     saisi — le code d'un fournisseur, le nom d'un point — traverse ces écrans : la règle doit être écrite une
     fois, correctement. Les écrans gardent leur `esc` local, qui délègue ici. ── */
  esc: function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },
  // VRAIS logos réseaux (fondatrice 24/08 : « mets les vrais logos ») — une seule trame partout.
  /* ── SAV IN-APP (fondatrice 27/08) : « Un problème de réservation ? » ouvre une
        MODALE — réf du ticket → mini-chat qui cerne le besoin → réponse immédiate ;
        pas résolu → UN HUMAIN prend le relais (hotline, hôte EN POSTE du planning).
        L'arbre vit ICI (données), le moteur dans payencash-filters.js, le
        transport dans payencash-bus.js (canal sav → app hotline en direct). ── */
  sav: {
    intro: "Dis-moi ce qui se passe — je regarde ta réservation et je te réponds tout de suite.",
    demandeRef: "C'est pour quelle réservation ? Touche-la, ou tape la réf de ton ticket (PEC-…, CMD-…).",
    categories: [
      { id: "annulation", type: "information", lbl: "Annuler ma réservation",
        rep: "Tes conditions dépendent de ton tarif : Basique — la compagnie rend ce que son tarif permet · Super Flex — billet remboursable · hôtel — la fenêtre d'annulation affichée avant l'achat. La demande se lance depuis le détail de ta réservation — réponse par SMS et email avec le montant exact remboursable." },
      { id: "remboursement", type: "reclamation", lbl: "Suivre un remboursement",
        rep: "Un remboursement se fait en avoir (crédité sur ton compte, valable FLY et MODE) ou par virement (RIB à ton nom) — jamais en espèces (LCB-FT). Si ta demande est déjà envoyée, la compagnie ou l'hôtel nous répond, puis on te confirme le montant et la date par SMS et email." },
      { id: "modification", type: "information", lbl: "Modifier dates ou voyageurs",
        rep: "Deux cas. ✈ VOL : les dates s'échangent selon ton tarif — la compagnie propose ses vols de remplacement avec le prix exact (pénalité éventuelle + différence de prix), tu valides ou tu gardes ton vol ; le NOM est définitif après l'émission (billet nominatif, jamais transférable — seule une correction de faute de frappe peut être demandée à la compagnie). 🛏 HÔTEL : pas de modification directe — on annule dans ta fenêtre gratuite et on re-réserve aux nouvelles dates, au prix du moment. Avant le paiement, tout se modifie librement dans l'app." },
      { id: "retard", type: "reclamation", lbl: "Vol retardé ou annulé par la compagnie",
        rep: "Si la compagnie modifie ou annule ton vol, tu es protégé : réacheminement ou remboursement selon le règlement européen des passagers — on s'en occupe avec toi, rien à avancer." },
      { id: "encaissement", type: "reclamation", lbl: "Un souci au moment de payer",
        rep: "Ton prix est bloqué 1 h. Code expiré ? « Revalider le prix » sur ton ticket — rien n'est perdu. Un souci pendant le paiement ? Ta commande reste À payer, aucune somme ne part sans validation." },
      { id: "autre", type: "information", lbl: "Autre chose", rep: null }
    ],
    resolu: "Est-ce que ça répond à ta question ?",
    ouiLbl: "Oui, ça répond ✓", nonLbl: "Non — je veux un humain"
  },

  /* L'hôte EN POSTE (règle plateforme 25/08 : chaque tâche suit le PLANNING —
     jamais « au premier qui la voit ») : en poste, le moins chargé. */
  /* ── (08/09 — audit hotline) PLANNING DU JOUR DÉRIVÉ : « en poste » = le jour ISO et l'heure courante tombent dans le créneau.
        Le libellé du créneau se construit depuis les heures (jamais « 8 h – 13 h » écrit). ── */
  /* ── L'ÉQUIPE VIVANTE : présence du planning, charge des demandes / appels VIFS du bus, session courante, et les
        conseillers INVITÉS par le manager (comptes hotline) qui rejoignent l'équipe par leur compte. ── */
  /* (10/09 — lot 5, constat C1) L'ESCALADE HÔTE → SUPERVISION → MANAGER → MÉDIATEUR, CALCULÉE.
     Les niveaux n'étaient jamais écrits nulle part : le SLA de l'hôte (2 h) ne se calculait pas, la superviseure
     n'était alertée de rien, et une décision « manager » n'était réservée à personne. Une demande en retard
     restait en retard, au même endroit, indéfiniment. Le niveau se DÉRIVE de l'âge de la demande sans réponse —
     et le dernier rung n'est pas une politique interne : c'est le droit du client de saisir le médiateur. */
  escaladeNiveaux: function () {
    var H = (this.param ? this.param('ref.hotline', this.ref.hotline) : this.ref.hotline) || {};
    return (H.escalade || []).slice().sort(function (a, b) { return a.apres - b.apres; });
  },
  escaladeDemande: function (d) {
    var N = this.escaladeNiveaux();
    if (!d || (String(d.statut || '').indexOf('clot') === 0)) return { cle: 'close', libelle: 'Demande close', qui: null, heures: 0, niveau: 0, prochain: null };
    // le compteur repart à CHAQUE réponse de l'hôte : c'est le silence qui escalade, pas l'ancienneté du dossier
    var depuis = d.derniereReponseAt || d.at || Date.now();
    var h = Math.max(0, (Date.now() - depuis) / 3600000);
    var idx = 0; for (var i = 0; i < N.length; i++) if (h >= N[i].apres) idx = i;
    var n = N[idx] || { cle: 'hote', qui: 'hôte en poste', libelle: '' };
    return Object.assign({}, n, { heures: Math.floor(h), niveau: idx, depuis: depuis,
      prochain: N[idx + 1] ? Object.assign({}, N[idx + 1], { dansH: Math.max(0, Math.ceil(N[idx + 1].apres - h)) }) : null });
  },
  /* La FILE d'un niveau : ce que la supervision, le manager ou le médiateur ont à traiter — et que personne
     ne voyait. Une demande close en sort d'elle-même : c'est une file, pas une archive. */
  demandesEscaladees: function (cle) {
    var self = this;
    var l = (window.PEC_BUS && PEC_BUS.demandesSav) ? PEC_BUS.demandesSav() : [];
    return l.map(function (d) { return Object.assign({}, d, { escalade: self.escaladeDemande(d) }); })
      .filter(function (d) { return d.escalade.cle !== 'close' && (!cle || d.escalade.cle === cle); })
      .sort(function (a, b) { return b.escalade.heures - a.escalade.heures; });
  },
  hotlinePlanning: function (quand) {
    var H = (this.assistance || {}).hotline; if (!H) return [];
    var d = quand ? new Date(quand) : new Date();
    var jour = d.getDay() === 0 ? 7 : d.getDay(), hm = d.getHours() * 60 + d.getMinutes();
    var min = function (t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null; };
    var heure = function (t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? parseInt(m[1], 10) + ' h' + (m[2] !== '00' ? ' ' + m[2] : '') : (t || '—'); };
    var JOURS = { 1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam', 7: 'dim' };
    return (H.planning || []).map(function (p) {
      var jours = p.jours || [], de = min(p.de), a = min(p.a);
      var enPoste = jours.indexOf(jour) > -1 && de != null && a != null && hm >= de && hm < a;
      var joursLbl = (jours.length === 5 && jours.join('') === '12345') ? 'lun–ven' : (jours.length === 2 && jours.join('') === '67') ? 'week-end' : jours.map(function (j) { return JOURS[j] || j; }).join(', ');
      return { nom: p.nom, jours: jours, de: p.de, a: p.a, enPoste: enPoste, creneau: heure(p.de) + ' – ' + heure(p.a), joursLbl: joursLbl, aujourdHui: jours.indexOf(jour) > -1 };
    });
  },
  hotlineEquipe: function () {
    var H = (this.assistance || {}).hotline; if (!H) return [];
    var vifs = {};
    if (window.PEC_BUS) {
      PEC_BUS.demandesSav().filter(function (d) { return d.statut === 'en_cours' && d.assigne; }).forEach(function (d) { vifs[d.assigne] = (vifs[d.assigne] || 0) + 1; });
      PEC_BUS.appels().filter(function (a) { return a.statut !== 'fait' && a.assigne; }).forEach(function (a) { vifs[a.assigne] = (vifs[a.assigne] || 0) + 1; });
    }
    var postes = {}; this.hotlinePlanning().forEach(function (p) { postes[p.nom] = p; });
    var sess = this.session ? this.session() : null, ident = sess ? String(sess.identifiant || '').toLowerCase() : '';
    var l = (H.equipe || []).map(function (m) { return Object.assign({}, m); });
    // les comptes hotline créés par invitation (hors seed) : un membre par compte, rattaché par son identifiant
    try {
      (this.comptesTous ? this.comptesTous('hotline') : []).filter(function (c) { return !c.seed && c.statut === 'actif'; }).forEach(function (c) {
        if (l.some(function (m) { return String(m.compteLogin || '').toLowerCase() === String(c.identifiant).toLowerCase(); })) return;
        l.push({ nom: (c.profil && c.profil.nom) || c.identifiant, role: 'hote', compteLogin: c.identifiant, invite: true });
      });
    } catch (e) {}
    return l.map(function (m) {
      var p = postes[m.nom];
      var moi = !!(ident && m.compteLogin && String(m.compteLogin).toLowerCase() === ident);
      return Object.assign(m, { charge: vifs[m.nom] || 0, enPoste: !!(p && p.enPoste) || moi, creneau: p ? p.creneau : null, moi: moi });
    });
  },
  hoteEnPoste: function () {
    var H = (this.assistance || {}).hotline; if (!H) return null;
    // présence = planning × heure (plus un booléen écrit) ; charge = les demandes et appels VIFS du bus (plus un chiffre écrit)
    var dispo = this.hotlineEquipe().filter(function (e) { return e.enPoste; }).sort(function (a, b) { return a.charge - b.charge; });
    // fallback : personne en poste → la superviseure (jamais une demande orpheline)
    return dispo[0] || (H.equipe || []).find(function (e) { return e.role === 'superviseure'; }) || null;
  },
  /* ── LES STATUTS D'UNE DEMANDE, une seule liste pour la hotline, le manager ET le client (avant : quatre libellés côté
        hotline, huit côté manager — une réclamation remboursée par le manager s'affichait « En cours » à la hotline). ── */
  STATUTS_DEMANDE: {
    en_cours:         { lbl: 'En cours',                         client: 'En cours',                                   ton: 'mint' },
    en_retard:        { lbl: 'EN RETARD',                        client: 'En cours — en retard, la superviseure est alertée', ton: 'rouge' },
    niveau_manager:   { lbl: 'Escaladée — manager',              client: 'Transmise au manager',                       ton: 'amber' },
    cloturee:         { lbl: 'Close — en attente de la note',    client: 'Close — note ton échange',                   ton: 'neutre' },
    clot_satisfait:   { lbl: 'Close · satisfait',                client: 'Close — résolue',                            ton: 'mint' },
    clot_insatisfait: { lbl: 'Close · INSATISFAIT',              client: 'Close — ton insatisfaction a ouvert une réclamation', ton: 'rouge' },
    clot_rembourse:   { lbl: 'Close — remboursée',               client: 'Close — remboursée en avoir',                ton: 'mint' },
    clot_repondu:     { lbl: 'Close — réponse motivée',          client: 'Close — réponse motivée envoyée',            ton: 'mint' },
    mediateur:        { lbl: 'Saisine médiateur',                client: 'Saisine médiateur',                          ton: 'amber' },
    resolue:          { lbl: 'Résolue',                          client: 'Résolue',                                    ton: 'mint' }
  },
  statutDemande: function (d) {
    var k = (d && d.statut) || 'en_cours';
    if (k === 'en_cours' && d && d.enRetard) k = 'en_retard';
    return Object.assign({ code: k }, this.STATUTS_DEMANDE[k] || { lbl: k, client: k, ton: 'neutre' });
  },
  /* ── LA GRILLE MODE : UNE SEULE SOURCE (12/09/2026) ───────────────────────
     Tout prix client de la branche Mode passe par ici — wizard, stock, partage,
     atelier, contrat, compte de résultat. Aucun « × 1 » ni tarif de repli
     silencieux : sans grille ou hors tranche de poids, on renvoie null et
     l'écran l'écrit. C'est ce silence qui creusait la marge. */
  /* (12/09 — fondatrice « dans l'espace manager il y a la possibilité de mettre
     notre marge, je crois que MODE n'est pas pris »). Elle avait raison, deux fois :
     le panneau « Marges PayEnCash » de 10-configuration ne proposait que Vol seul,
     Séjour seul et Package — la MODE n'y était pas ; et même ajoutée, elle n'aurait
     rien changé, parce que les calculs lisaient `scenario.grilleMode` EN DIRECT au
     lieu de la valeur vive. Le lot 1 du 09/09 avait déjà relevé exactement ce piège
     sur `ref.marges`. Une seule porte d'entrée, désormais : grilleModeVive(). */
  grilleModeVive: function () {
    var g = (this.scenario || {}).grilleMode; if (!g) return null;
    var v = this.objetVif('scenario.grilleMode',
      { marge: g.marge, margePartage: g.margePartage, atelier: g.atelier, plancherAchat: g.plancherAchat, plafondClient: g.plafondClient });
    v.livraison = g.livraison;      // la grille transporteur n'est pas une marge : elle suit son tarif
    return v;
  },
  livraisonMode: function (grammes) {
    var L = ((this.scenario || {}).grilleMode || {}).livraison; if (!L) return null;
    var g = Math.round(Number(grammes));
    if (!isFinite(g) || g < L.poidsMin || g > L.poidsMax) return null;
    var t = (L.tarifsContrat || L.tranches).filter(function (x) { return g <= x.jusqua; })[0];
    return t ? t.prix : null;
  },
  margeMode: function (achat) {
    var G = this.grilleModeVive(); if (!G) return null;
    return Math.round((Number(achat) || 0) * (Number(G.marge) || 0)) / 100;   // marge en %
  },
  /* (19/09, soir — décision fondatrice « le prix du colis, c'est le prix du colis de Mondial Relay, on ne rentre
     pas dedans ») LE COLIS SORT DU PRIX DE LA PIÈCE. Le prix client est désormais ce que vaut la PIÈCE : prix
     d'achat + notre marge + le contrôle atelier. Le transport n'est pas notre produit : il garde son tarif
     Mondial Relay, il se facture À PART sur la commande, et nous ne prenons rien dessus. Le poids reste lu ici
     — il détermine le tarif du colis — mais il ne gonfle plus l'étiquette de la pièce. */
  detailPrixMode: function (achat, grammes) {
    var G = this.grilleModeVive();
    if (!G) return { ok: false, motif: "grille de prix absente du référentiel", achat: Number(achat) || 0, marge: null, livraison: null, atelier: null, client: null };
    var liv = this.livraisonMode(grammes), marge = this.margeMode(achat), a = Number(achat) || 0;
    var client = Math.round((a + marge + G.atelier) * 100) / 100;
    /* Le poids reste EXIGÉ à la publication : sans lui, personne ne sait ce que coûtera le colis, et le
       fournisseur ne peut pas éditer son étiquette. Deux motifs distincts, deux gestes différents. */
    if (liv === null) return { ok: false, motif: !(Number(grammes) > 0)
        ? "poids emballé non renseigné — c'est lui qui fixe le tarif " + G.livraison.transporteur + " facturé à part au client"
        : "poids hors grille " + G.livraison.transporteur + " (" + G.livraison.poidsMin + " g à " + (G.livraison.poidsMax / 1000) + " kg, service " + G.livraison.service + ")",
      achat: a, marge: marge, livraison: null, atelier: G.atelier, client: client };
    return { ok: true, motif: null, achat: a, marge: marge, livraison: liv, atelier: G.atelier, client: client };
  },
  prixClientMode: function (achat, grammes) { return this.detailPrixMode(achat, grammes).client; },
  /* Le libellé de la grille, tel qu'il est relevé à la signature du contrat-cadre
     et comparé ensuite (un changement de grille => avenant, jamais en silence). */
  grilleModeLibelle: function () {
    var G = this.grilleModeVive(); if (!G) return null;
    return "prix d'achat + " + G.marge + " % de marge + livraison "
      + G.livraison.transporteur + " au poids + contrôle atelier " + this.eur(G.atelier);
  },
  /* (19/09, soir) LE CHIFFRE SEUL, sans le symbole — pour les gabarits qui portent déjà le « € » à côté. Le
     total du panier l'écrivait avec String(t.total) : un total de 228,70 € s'affichait « 228,7 € — le zéro des
     centimes tombait. Une seule règle d'écriture d'un montant, et `eur` s'en sert. */
  eurNombre: function (n) { return (Math.round(n * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0 }); },
  /* `eur` se fait DÉTACHER par des écrans qui l'aliasent (`var eur = D.eur`) : elle ne peut pas dépendre de `this`. */
  eur: function (n) { return PEC_DATA.eurNombre(n) + " €"; },
  /* (24/09, nuit) UN NOMBRE ET SON MOT, ACCORDÉS : « 1 bon », « 3 bons », « 2 prélèvements impayés » — plus jamais « bon(s) ».
     `plur` quand le pluriel n'est pas « + s » ou que le mot en porte plusieurs (« bon remis » → « bons remis ») ; 0 et 1 restent
     au singulier (usage français). */
  nb: function (n, sing, plur) { var x = +n || 0; return x + ' ' + (Math.abs(x) >= 2 ? (plur || sing + 's') : sing); },   // espace ordinaire : le banc et les documents lisent « N € » tel quel ; là où le montant ne doit pas se couper, c'est la feuille (white-space:nowrap) qui le tient
  article: function (id) { return this.mode.articles.find(function (a) { return a.id === id; }); },
  /* (19/09 — fondatrice « les articles étant épuisés sont-ils disponibles ? ») SA BOUTIQUE ANNONÇAIT
     DES PIÈCES QU'ON NE PEUT PLUS ACHETER. Deux causes, un seul mensonge. Les profils ÉCRITS portaient
     une liste figée (`pieces: ["airmax", "jordan"]`) : elle gardait une paire épuisée et ignorait les
     trente autres publiées depuis. Les profils DÉRIVÉS prenaient TOUS les lots du fournisseur — brouillon,
     soumis, refusé, épuisé compris — et les comptaient en « pièces en vente ». « En vente » ne veut dire
     qu'une chose : publiée ET encore en stock. Une seule dérivation la dit, pour les deux. */
  vendeurPieces: function (nomOuId) {
    var d = this, v = this._vendeurBrut(nomOuId);
    var nom = v ? v.nom : (((this.fournisseur && this.fournisseur(nomOuId)) || {}).nom || nomOuId);
    var IDX = this.stockIndex ? this.stockIndex() : null;      // le stock se lit une fois, pas par lot
    var vu = {}, ids = [];
    function retenir(id) {
      if (!id || vu[id] || !d.article(id)) return;             // retirée du catalogue → rien à montrer
      var st = IDX ? (IDX[id] || d._stockVide) : d.stockArticle(id);
      if (st.dispo <= 0) return;                               // épuisée → elle n'est plus en vente
      vu[id] = 1; ids.push(id);
    }
    this.inventaireGet().forEach(function (l) {
      if (l.fournisseur !== nom || d.STATUTS_EN_VENTE.indexOf(l.status) === -1) return;
      retenir(l.articleId);
    });
    // profil écrit sans aucun lot à son nom : ses pièces restent sa seule source — filtrées, elles aussi
    if (!ids.length && v) (v.pieces || []).forEach(retenir);
    return ids;
  },
  vendeur: function (nomOuId) {
    var v = this._vendeurBrut(nomOuId);
    if (v) {
      var enV = this.vendeurPieces(v.nom), o = {};
      for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = v[k];
      o.pieces = enV.slice(0, 8); o.piecesTotal = enV.length; return o;
    }
    // (02/09) repli sur le RÉFÉRENTIEL FOURNISSEURS : un compte sans profil « vendeur » garde des KPI cohérents
    var f = this.fournisseur ? this.fournisseur(nomOuId) : null; if (!f) return null;
    var lots = this.inventaireGet().filter(function (l) { return l.fournisseur === f.nom; });
    var enVente = this.vendeurPieces(f.nom);   // publiées ET encore en stock — cf. vendeurPieces
    // (03/09) HONNÊTE : sans vente ni contrôle atelier, pas de note ni de taux de conformité inventés (null → « — » à l'écran)
    var vendues = lots.reduce(function (s, l) { return s + (l.lignes || []).reduce(function (t, x) { return t + (x.vendu || 0); }, 0); }, 0);
    var pc = this.piecesGet ? this.piecesGet().filter(function (p) { return p.fournisseur === f.nom && /conforme|valide|refus|recote/.test(p.status || ''); }) : [];
    var conf = pc.length ? Math.round(100 * pc.filter(function (p) { return /conforme|valide/.test(p.status); }).length / pc.length) : null;
    return { id: f.id, nom: f.nom, categorie: (f.categories || []).join(' · '), depuis: f.depuis, atelier: (f.specialites || []).join(', '), delaiVirement: (((this.ref.juridique || {}).virementJours) || 7) + ' j', note: null, nbVentes: vendues,
      catalogue: lots.filter(function (l) { return l.status === 'valide_publie'; }).length, venduesMois: vendues, conformite: conf, retours: 0,
      desc: f.nom + ' — ' + (f.specialites || []).join(', ') + ' · ' + f.ville + '.', piecesTotal: enVente.length, pieces: enVente.slice(0, 8) };
  },
  _vendeurBrut: function (idOuNom) {
    return this.mode.vendeurs.find(function (v) { return v.id === idOuNom || v.nom === idOuNom; }) || null;
  },
  // Loi Omnibus : prix le plus bas pratiqué sur 30 j (pour tout affichage de réduction).
  prixBas30j: function (id) {
    var a = this.article(id); if (!a) return null;
    // (08/09) historique DATÉ (lots publiés) : le minimum sur la fenêtre légale, calculé — jamais figé
    if (a.historiquePrix && a.historiquePrix.some(function (h) { return h.at; })) return this.prixBasFenetre(a.historiquePrix, a.prix);
    if (a.prixBas30j != null) return a.prixBas30j;
    if (a.historiquePrix && a.historiquePrix.length) return Math.min.apply(null, a.historiquePrix.map(function (h) { return h.p; }));
    return a.prix;
  },
  /* Prix le plus bas pratiqué sur la fenêtre (ref.prixReference.fenetreJours) : les prix entrés en vigueur
     dans la fenêtre, PLUS celui qui était en vigueur à son ouverture. `avant` (horodatage) borne la fenêtre
     à la veille d'une réduction — c'est ainsi qu'on lit « le prix des 30 jours qui précèdent ». */
  prixBasFenetre: function (hist, courant, avant) {
    var jours = ((this.ref && this.ref.prixReference) || {}).fenetreJours || 30;
    var fin = avant || Date.now(), debut = fin - jours * 86400000;
    var h = (hist || []).filter(function (x) { return x.at && x.at <= fin; }).sort(function (a, b) { return a.at - b.at; });
    if (!h.length) return courant;
    var enVigueur = null, min = null;
    h.forEach(function (x) { if (x.at <= debut) enVigueur = x.p; else min = (min == null || x.p < min) ? x.p : min; });
    if (enVigueur != null) min = (min == null || enVigueur < min) ? enVigueur : min;
    return min == null ? courant : min;
  },
  /* (18/09, soir) LE SEUIL DE DÉPÔT EFFECTIF, l'HABILITATION À ENCAISSER (active | suspendue | revoquee |
     a_delivrer) et l'APTITUDE AU DISPATCH sont partis avec l'agent de caisse mobile : plus d'encours à borner,
     plus d'autorisation à délivrer, plus de course à attribuer. */
  /* IBAN (ISO 13616) et BIC (ISO 9362) — UNE validation pour tous les espaces (modale RIB client, socle fournisseur).
     ibanControle / bicControle rendent { ok, valeur (compacte, majuscules), affichage, motif } : le motif nomme la faute
     (pays inconnu, longueur attendue POUR CE PAYS, caractère interdit, clé fausse) au lieu d'un « IBAN invalide » muet.
     ibanValide / bicValide restent les raccourcis booléens (aucune seconde règle : ils appellent le contrôle). */
  // longueur totale de l'IBAN par pays (registre SWIFT IBAN, zone SEPA + pays courants) — la structure du BBAN varie, sa longueur est fixe
  IBAN_LONGUEURS: { AD:24, AE:23, AL:28, AT:20, AZ:28, BA:20, BE:16, BG:22, BH:22, BR:29, BY:28, CH:21, CR:22, CY:28, CZ:24, DE:22, DK:18, DO:28, EE:20, EG:29, ES:24, FI:18, FO:18, FR:27, GB:22, GE:22, GI:23, GL:18, GR:27, GT:28, HR:21, HU:28, IE:22, IL:23, IS:26, IT:27, JO:30, KW:30, KZ:20, LB:28, LI:21, LT:20, LU:20, LV:21, MC:27, MD:24, ME:22, MK:19, MR:27, MT:31, MU:30, NL:18, NO:15, PK:24, PL:28, PS:29, PT:25, QA:29, RO:24, RS:22, SA:24, SE:24, SI:19, SK:24, SM:27, TN:24, TR:26, UA:29, VA:22, VG:24, XK:20 },
  ibanControle: function (v) {
    var s = String(v || '').replace(/\s+/g, '').toUpperCase(), aff = s.replace(/(.{4})/g, '$1 ').trim();
    if (!s) return { ok: false, valeur: s, affichage: aff, motif: 'Indique ton IBAN (il figure sur ton RIB, il commence par le code du pays, ex. FR76).' };
    if (/[^A-Z0-9]/.test(s)) return { ok: false, valeur: s, affichage: aff, motif: 'L\'IBAN ne contient que des lettres et des chiffres : retire les tirets ou la ponctuation.' };
    if (!/^[A-Z]{2}/.test(s)) return { ok: false, valeur: s, affichage: aff, motif: 'L\'IBAN commence par les 2 lettres du pays (FR pour la France), puis 2 chiffres de clé.' };
    var pays = s.slice(0, 2), attendu = this.IBAN_LONGUEURS[pays];
    if (!attendu) return { ok: false, valeur: s, affichage: aff, pays: pays, motif: 'Pays « ' + pays + ' » inconnu : vérifie les 2 premières lettres de ton IBAN.' };
    if (!/^[A-Z]{2}\d{2}/.test(s)) return { ok: false, valeur: s, affichage: aff, pays: pays, motif: 'Les 3e et 4e caractères de l\'IBAN sont les 2 chiffres de la clé (ex. FR76).' };
    if (s.length !== attendu) return { ok: false, valeur: s, affichage: aff, pays: pays, motif: 'Un IBAN ' + pays + ' compte ' + attendu + ' caractères, tu en as saisi ' + s.length + ' : il en ' + (s.length < attendu ? 'manque ' + (attendu - s.length) : 'a ' + (s.length - attendu) + ' de trop') + '.' };
    var r = s.slice(4) + s.slice(0, 4), n = ''; for (var i = 0; i < r.length; i++) { var c = r.charCodeAt(i); n += (c >= 65 && c <= 90) ? String(c - 55) : r[i]; }
    var m = 0; for (var j = 0; j < n.length; j++) m = (m * 10 + (n.charCodeAt(j) - 48)) % 97;
    if (m !== 1) return { ok: false, valeur: s, affichage: aff, pays: pays, motif: 'La clé de contrôle ne correspond pas : un caractère est faux ou manquant. Recopie l\'IBAN tel qu\'il figure sur ton RIB.' };
    return { ok: true, valeur: s, affichage: aff, pays: pays, motif: '' };
  },
  bicControle: function (v) {
    var s = String(v || '').replace(/\s+/g, '').toUpperCase();
    if (!s) return { ok: false, valeur: s, motif: 'Indique le BIC (code de ta banque, 8 ou 11 caractères, ex. BNPAFRPP) : il figure sur ton RIB.' };
    if (s.length !== 8 && s.length !== 11) return { ok: false, valeur: s, motif: 'Un BIC compte 8 ou 11 caractères, tu en as saisi ' + s.length + '.' };
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) return { ok: false, valeur: s, motif: 'Le BIC commence par 6 lettres (banque + pays), puis 2 caractères de lieu' + (s.length === 11 ? ' et 3 d\'agence' : '') + ' : lettres ou chiffres seulement.' };
    return { ok: true, valeur: s, motif: '' };
  },
  /* SAISIE GUIDÉE (fondatrice 08/09 « il faut qu'on rentre que le nombre qu'il faut, bien organisé ») : le champ n'accepte que
     ce qu'un IBAN peut contenir — 2 lettres de pays, 2 chiffres de clé, puis lettres/chiffres — en MAJUSCULES, groupé par 4,
     et il se BLOQUE à la longueur du pays (34 tant que le pays n'est pas connu). Le curseur suit la frappe. */
  ibanSaisie: function (input) {
    var self = this; if (!input || input.getAttribute('data-iban-saisie')) return input; input.setAttribute('data-iban-saisie', '1');
    input.setAttribute('autocapitalize', 'characters'); input.setAttribute('spellcheck', 'false'); input.setAttribute('autocomplete', 'off');
    function nettoyer(v) {
      var src = String(v || '').toUpperCase(), out = '';
      for (var i = 0; i < src.length; i++) {
        var ch = src[i];
        if (out.length < 2) { if (/[A-Z]/.test(ch)) out += ch; continue; }
        if (out.length < 4) { if (/[0-9]/.test(ch)) out += ch; continue; }
        if (/[A-Z0-9]/.test(ch)) out += ch;
      }
      var max = self.IBAN_LONGUEURS[out.slice(0, 2)] || 34;
      return out.slice(0, max);
    }
    function appliquer() {
      var caret = input.selectionStart || 0, avant = nettoyer(input.value.slice(0, caret)).length;
      var raw = nettoyer(input.value), fmt = raw.replace(/(.{4})/g, '$1 ').trim();
      var max = self.IBAN_LONGUEURS[raw.slice(0, 2)] || 34; input.maxLength = max + Math.ceil(max / 4) - 1;
      if (input.value !== fmt) { input.value = fmt; var pos = avant + Math.floor(Math.max(0, avant - 1) / 4); try { input.setSelectionRange(pos, pos); } catch (e) {} }
      input.setAttribute('data-iban-pays', raw.slice(0, 2)); input.setAttribute('data-iban-reste', String(max - raw.length));
    }
    input.addEventListener('input', appliquer); input.addEventListener('blur', appliquer); if (input.value) appliquer();
    return input;
  },
  bicSaisie: function (input) {
    if (!input || input.getAttribute('data-bic-saisie')) return input; input.setAttribute('data-bic-saisie', '1');
    input.setAttribute('autocapitalize', 'characters'); input.setAttribute('spellcheck', 'false'); input.setAttribute('autocomplete', 'off'); input.maxLength = 11;
    function appliquer() {
      var src = input.value.toUpperCase(), out = '';
      for (var i = 0; i < src.length && out.length < 11; i++) { var ch = src[i]; if (out.length < 6 ? /[A-Z]/.test(ch) : /[A-Z0-9]/.test(ch)) out += ch; }
      if (input.value !== out) input.value = out;
    }
    input.addEventListener('input', appliquer); input.addEventListener('blur', appliquer); if (input.value) appliquer();
    return input;
  },
  ibanValide: function (v) { return this.ibanControle(v).ok; },
  bicValide: function (v) { return this.bicControle(v).ok; },
  ibanMasque: function (v) { var s = String(v || '').replace(/\s+/g, ''); return s.length > 8 ? s.slice(0, 4) + ' •••• •••• •••• ' + s.slice(-3) : s; },
  // le MODE DE RENDU choisi par le client (par compte) — 'especes' par défaut ; 'virement' exige un RIB
  provenance: function (k) { return ((this.ref && this.ref.provenances) || []).filter(function (p) { return p.k === k; })[0] || null; },
  /* TVA du panier : les NEUFS portent 20 % incluse (détaillable), les
     reconditionnés relèvent de la marge (art. 297 A — jamais détaillée). */
/* Recherche vivante (mode/09) : texte + filtres — tout se cherche, rien n'est statique. */
chercher: function (q, f) {
  // chaque MOT tapé doit correspondre, peu importe l'ordre : « nike air » trouve « Air Max 97 · Nike »
  var mots = (q || "").toLowerCase().split(/\s+/).filter(Boolean); f = f || {};
  var self = this;
  /* (06/09) TROIS gaspillages par article, sur 443 articles et à chaque frappe :
     stockArticle() relisait tout l'inventaire (jusqu'à 3 fois), demarquesGet() reparsait le
     stockage, et le texte de recherche était concaténé même sans recherche. On sort les trois
     de la boucle. Les règles de filtrage sont inchangées, dans le même ordre. */
  var IDX = self.stockIndex ? self.stockIndex() : null;
  var DEM = (!f.inclureRetire && self.demarquesGet) ? self.demarquesGet() : null;
  var marqueL = f.marque ? String(f.marque).toLowerCase() : null;
  /* (19/09) « Voir les N pièces en vente » d'une boutique pointait ici avec ?vendeur=… que personne
     ne lisait : on atterrissait sur le catalogue entier. Le filtre existe maintenant, et il s'appuie
     sur la MÊME dérivation que la boutique — ce qu'elle montre est ce qu'on retrouve ici. */
  var VEND = null;
  if (f.vendeur && self.vendeurPieces) { VEND = {}; self.vendeurPieces(f.vendeur).forEach(function (id) { VEND[id] = 1; }); }
  return this.mode.articles.filter(function (a) {
    var st = IDX ? (IDX[a.id] || self._stockVide) : (self.stockArticle ? self.stockArticle(a.id) : null);
    if (mots.length) {
      var tl = Object.keys((st && st.tailles) || {});
      var texte = (a.nom + " " + a.marque + " " + a.etat + " " + (a.description || "") + " " + tl.join(" ")).toLowerCase();
      if (!mots.every(function (m) { return texte.indexOf(m) !== -1; })) return false;
    }
    if (marqueL && a.marque.toLowerCase().indexOf(marqueL) === -1) return false;
    if (VEND && !VEND[a.id]) return false;
    if (f.categorie && f.categorie !== 'tout' && a.categorie !== f.categorie && !(f.categorie === 'reconditionne' && a.badge === 'reco')) return false;
    if (f.souscategorie && a.souscategorie !== f.souscategorie && a.etat !== f.souscategorie) return false;
    if (f.genre && f.genre !== 'tout' && a.genre !== 'mixte' && a.genre !== f.genre) return false;
    // TAILLE = ce qu'on peut RÉELLEMENT commander dans cette taille (fondatrice 05/09 :
    // « je filtre sur une taille et ça m'affiche des articles dont le stock ne contient pas la
    // taille demandée »). On comparait a.taille — la taille AFFICHÉE de la fiche — au lieu du
    // stock par taille : une pièce dispo en 42 mais affichée en 40 était cachée, et une pièce
    // affichée en 42 mais épuisée dans cette taille était proposée.
    if (f.taille) {
      if (st) { if (!((st.tailles || {})[f.taille] > 0)) return false; }
      else if (a.taille !== f.taille) return false;
    }
    if (f.etat && a.etat !== f.etat) return false;
    if (f.prixMax && a.prix > f.prixMax) return false;
    if (f.prixMin && a.prix < f.prixMin) return false;
    if (f.coupe && a.coupe !== f.coupe) return false;
    if (f.motif && a.motif !== f.motif) return false;
    if (f.reconditionne === true && a.badge !== "reco") return false;
    // ÉPUISÉ hors recherche (fondatrice 03/09) : une pièce sans stock disponible (dispo agrégée = 0)
    // n'apparaît PLUS à la recherche ni à l'accueil — on ne montre que le disponible. Escape hatch
    // `inclureEpuise` pour un éventuel contrôle interne.
    if (!f.inclureEpuise && st && st.dispo <= 0) return false;
    // RETIRÉ DU CATALOGUE par le manager (invendus) : la pièce ne se propose plus (audit 05/09 —
    // elle restait visible, ajoutable et commandable).
    if (DEM && (DEM[a.id] || {}).retire) return false;
    return true;
  });
},
  /* ══ (22/09) LA PRÉPARATION DU PRÉLÈVEMENT SEPA — l'autre ligne, celle de PayEnCash Solution ════════════════
     Rien ne se dépose chez Crédit Mutuel tant que ces quatre points ne sont pas vrais. Ils se CONSTATENT (le
     paramètre est posé ou il ne l'est pas), ils ne se déclarent pas : une case cochée à la main ne fait pas
     arriver un ICS. Le manager les voit dans Configuration, et l'écran des paiements refuse de préparer
     une remise tant qu'il manque quelque chose. ══ */
  prelevementPreparation: function () {
    var P = this.techRef().paiement, l = [], self = this;
    var li = function (id, ok, libelle, detail) { l.push({ id: id, ok: !!ok, libelle: libelle, detail: detail || null }); };
    li('ics', !!P.ics, 'Identifiant Créancier SEPA (ICS) délivré par ' + P.banque + ' et saisi en Configuration', P.ics ? P.ics : 'sans lui, aucun fichier de prélèvement ne peut être fabriqué');
    li('compte', this.ibanValide(P.iban) && this.bicValide(P.bic), 'IBAN et BIC de notre compte d\'encaissement saisis', P.iban ? this.ibanMasque(P.iban) : 'c\'est le compte crédité par les prélèvements');
    li('canal', !!P.canal && +P.offreMensuelle > 0, 'Service de remises automatisées souscrit (' + (P.canal || '—') + ')', +P.offreMensuelle > 0 ? this.eur(P.offreMensuelle) + ' HT/mois' : 'option à souscrire auprès de la banque');
    var mdt = this.techRevendeursGet().filter(function (r) { return !!self.techSepaMandat('revendeur', r.id); }).length;
    li('mandats', mdt > 0, 'Au moins un point de vente a signé son mandat de prélèvement', this.nb(mdt, 'mandat actif', 'mandats actifs'));
    return { pret: l.every(function (x) { return x.ok; }), lignes: l, manquants: l.filter(function (x) { return !x.ok; }).map(function (x) { return x.id; }) };
  },

  techRef: function () {
    var t = (this.ref && this.ref.tech) || {}, self = this;
    var v = function (k, d) { var x = self.param ? self.param('tech.' + k, t[k]) : t[k]; return (x == null || x === '') ? d : x; };
    /* LES RÉGLAGES D'ARGENT SONT DES PARAMÈTRES, pas des constantes : `tech.paiement.<clé>` se pose en
       Configuration, et ce qui n'a jamais été posé retombe sur le référentiel. Aucun écran n'écrit un taux. */
    var P = t.paiement || {};
    var vp = function (k, d) { var x = self.param ? self.param('tech.paiement.' + k, P[k]) : P[k]; return (x == null || x === '') ? d : x; };
    return {
      nom: t.nom || 'PayEnCash Solution',
      declaration: t.declaration || {},   // (24/09) la déclaration « réseau limité » type, cochée par la marque
      dureeContratMois: +v('dureeContratMois', 12),          // contrat à usage unique, 1 an, non reconductible
      tvaPct: +v('tvaPct', 20),                              // le logiciel est un service soumis à TVA
      cleLongueur: +v('cleLongueur', 32),
      prefixeBon: t.prefixeBon || 'TB-',
      lienValiditeJours: +v('lienValiditeJours', 30),
      annulationMinutes: +v('annulationMinutes', 30),        // l'annulation au comptoir d'une vente
      paiement: {
        banque: vp('banque', 'Crédit Mutuel'), canal: vp('canal', 'CMUT Direct PRO'),
        offreMensuelle: +vp('offreMensuelle', 0),
        ics: vp('ics', ''), iban: vp('iban', ''), bic: vp('bic', ''),
        formatRemise: vp('formatRemise', 'pain.008.001.08'), formatRetour: vp('formatRetour', 'pain.002 · camt.054'),
        arreteHeure: vp('arreteHeure', '20:00'), depotMinutes: +vp('depotMinutes', 15),
        remiseJoursOuvresAvant: +vp('remiseJoursOuvresAvant', 1),
        coutPrelevement: +vp('coutPrelevement', 0), coutRepresentation: +vp('coutRepresentation', 0),
        penaliteImpaye: +vp('penaliteImpaye', 0), coutVirement: +vp('coutVirement', 0),
        encoursMaxPoint: +vp('encoursMaxPoint', 0), impayesAvantSuspension: +vp('impayesAvantSuspension', 1),
        mandatDefaut: vp('mandatDefaut', 'B2B'), abonnementJour: +vp('abonnementJour', 1)
      },
      /* (23/09) LES RÉGLAGES DE L'AVANCE — réglables comme les autres, sous `tech.avance.*`. */
      avance: (function () {
        var A = t.avance || {};
        var va = function (k, d) { var x = self.param ? self.param('tech.avance.' + k, A[k]) : A[k]; return (x == null || x === '') ? d : +x; };
        return { garantie: va('garantie', 0), restitutionJours: va('restitutionJours', 30),
          rechargeMin: va('rechargeMin', 0), rechargeMax: va('rechargeMax', 0), soldeAlerte: va('soldeAlerte', 0) };
      })(),
      mandats: t.mandats || {},
      modesPaiement: (t.modesPaiement || []).slice(),
      logiciel: t.logiciel || {},
      seuils: t.seuils || {},
      encaissement: t.encaissement || {},
      fondement: t.fondement || {},
      mentions: (t.mentions || []).slice()
    };
  },

  /* ══ LES DEUX ACTEURS — ils naissent d'un COMPTE (protocole du 03/09), jamais d'une liste écrite ════════ */
  /* (23/09, soir — fondatrice : « ça peut être remis à plus tard, mais compte inactif ») un compte pas encore contrôlé est INACTIF, et l'écran le dit ainsi */
  TECH_STATUTS: { draft: 'Inscription à terminer', pending: 'Inactif — vérification en attente', validated: 'Validé', suspended: 'Suspendu' },
  techStatutLbl: function (s) { return this.TECH_STATUTS[s] || s || '—'; },
  /* (24/09, soir — audit zéro dur) LA COULEUR DE LA PASTILLE suit le statut, au même endroit que son libellé : les écrans la recopiaient */
  techStatutPill: function (s) { return ({ validated: 'pec-pill--done', suspended: 'pec-pill--off' })[s] || 'pec-pill--wait'; },

  techMarchandsGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-marchands') || '[]') || []; } catch (e) { return []; } },
  _techMarchandsPut: function (l) { if (!this._ecrit('pec-tech-marchands', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techMarchand: function (id) { return this.techMarchandsGet().filter(function (x) { return x.id === id; })[0] || null; },
  /* (24/09) UNE INSCRIPTION EN BROUILLON N'EST PAS ENCORE UNE MARQUE : elle n'a ni raison sociale certaine, ni rien envoyé.
     Les listes ne la voient pas, sauf à la demander (`brouillons: true`, ou `statut: 'draft'`) — l'écran Marques du manager
     la montre à part, sans aucun geste de validation. */
  techMarchands: function (o) {
    o = o || {};
    var l = this.techMarchandsGet().slice();
    if (o.statut) l = l.filter(function (x) { return x.statut === o.statut; });
    else if (!o.brouillons) l = l.filter(function (x) { return x.statut !== 'draft'; });
    return l.sort(function (a, b) { return (b.creeLe || 0) - (a.creeLe || 0); });
  },
  techRevendeursGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-revendeurs') || '[]') || []; } catch (e) { return []; } },
  _techRevendeursPut: function (l) { if (!this._ecrit('pec-tech-revendeurs', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techRevendeur: function (id) { return this.techRevendeursGet().filter(function (x) { return x.id === id; })[0] || null; },
  techRevendeurs: function (o) {
    o = o || {};
    var l = this.techRevendeursGet().slice();
    if (o.statut) l = l.filter(function (x) { return x.statut === o.statut; });
    return l.sort(function (a, b) { return (b.creeLe || 0) - (a.creeLe || 0); });
  },

  _techSiretOk: function (v) { return this.siretValide(v); },

  /* UC-1 — INSCRIPTION D'UN REVENDEUR. Identité légale, coordonnées, CGU acceptées : le compte naît
     « en attente de vérification », jamais validé d'office. */
  techRevendeurCreer: function (o) {
    o = o || {};
    var nom = String(o.raisonSociale || '').trim();
    if (!nom) return { ok: false, champ: 'raisonSociale', motif: 'La raison sociale est obligatoire — c\'est elle qui signera les contrats.' };
    if (!this._techSiretOk(o.siret)) return { ok: false, champ: 'siret', motif: 'SIRET invalide — 14 chiffres, et la clé doit tomber juste.' };
    var mail = String(o.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail)) return { ok: false, champ: 'email', motif: 'Une adresse e-mail valide est obligatoire.' };
    if (o.cgu !== true) return { ok: false, champ: 'cgu', motif: 'Les conditions générales de la plateforme doivent être acceptées.' };
    var l = this.techRevendeursGet();
    if (l.some(function (x) { return String(x.siret) === String(o.siret).replace(/\s/g, ''); })) return { ok: false, champ: 'siret', motif: 'Ce SIRET a déjà une fiche de vente : c\'est le même partenaire du réseau.' };
    var seq = this._seq('tech-revendeurs', this._seqPlancher(l, '^RVD-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('La fiche de vente du partenaire');
    /* LE MODE D'EXERCICE, repris de nos propres distributeurs (PARTENAIRE_MODES) : sédentaire (une boutique,
       une adresse — le client s'y rend) ou mobile (il se déplace). C'est lui qui donne au client les
       trois chemins de la page d'un bon proposé, chez la marque comme chez nous. */
    var mode = this.PARTENAIRE_MODES[o.mode] ? o.mode : 'sedentaire';
    var r = { id: 'RVD-' + String(seq).padStart(5, '0'), raisonSociale: nom, siret: String(o.siret).replace(/\s/g, ''),
      email: mail, tel: String(o.tel || '').trim() || null, statut: 'pending', creeLe: Date.now(),
      cguAcceptees: Date.now(), cguVersion: o.cguVersion || null,
      mode: mode, ville: String(o.ville || '').trim() || null, adresse: String(o.adresse || '').trim() || null };
    /* LE POINT DE VENTE EST UN COMMERCE : s'il est déjà inscrit au réseau PayEnCash (même SIRET), on le rattache à
       son point — les deux lignes parlent alors du même commerce. Son mandat de prélèvement, lui, se signe depuis
       son espace (techSepaMandatSigner) : c'est ce mandat qui ouvre la vente. */
    var pt = this.partenaireParSiret ? this.partenaireParSiret(r.siret) : null;
    if (pt) r.partenaireId = pt.id;
    l.push(r);
    if (!this._techRevendeursPut(l)) return this._refusEcriture('La fiche de vente du partenaire');
    this._journal('tech_revendeur_inscrit', r.id, { raisonSociale: nom, siret: r.siret });
    return { ok: true, revendeur: r };
  },

  /* UC-2 — INSCRIPTION D'UN COMMERÇANT (site e-commerce). La DÉCLARATION DE CONFORMITÉ « réseau limité »
     est exigée à l'inscription : sans elle, aucune mise en relation ne pourra jamais avoir lieu (UC-3). */
  /* ══ (24/09, fondatrice : « reprends le processus d'inscription d'une marque… de vrais formulaires connectés ») L'INSCRIPTION
     D'UNE MARQUE, ÉTAPE PAR ÉTAPE ═════════════════════════════════════════════════════════════════════════════════════════
     Le compte d'abord (compteCreer / compteSso, espace « marque ») : il fait naître la fiche en BROUILLON. Puis, dans cet
     ordre, chaque étape s'enregistre à part et peut attendre : l'entreprise, le dirigeant, SA PIÈCE D'IDENTITÉ (juste après
     lui — elle arrivait en dernier, après la création du compte), les engagements (la déclaration « réseau limité » cochée
     et chaque document lu puis accepté), et l'envoi. Rien n'est perdu si l'on s'arrête : la reprise lit techMarchandInscription.
     Les contrôles sont UNE fois ici — l'écran et le jeu de démonstration passent par les mêmes. */
  _techSiteNormaliser: function (s) {
    var t = String(s || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!t) return { ok: false, motif: 'Indique l’adresse de ton site — ou coche « Je n’ai pas de site ».' };
    if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(\/[^\s]*)?$/.test(t)) return { ok: false, motif: 'Adresse de site non reconnue : écris-la comme boutique-lila.fr ou www.boutique-lila.fr.' };
    var hote = t.split('/')[0];
    return { ok: true, url: 'https://' + hote, domaine: hote.replace(/^www\./, '') };
  },
  _techEntrepriseControle: function (o, idCourant) {
    o = o || {};
    var nom = String(o.raisonSociale || '').trim();
    if (!nom) return { ok: false, champ: 'raisonSociale', motif: 'La raison sociale est obligatoire : c’est elle qui signe le contrat-cadre.' };
    if (!this._techSiretOk(o.siret)) return { ok: false, champ: 'siret', motif: 'SIRET invalide — 14 chiffres, et la clé doit tomber juste.' };
    var siret = String(o.siret).replace(/[\s.]/g, '');
    if (this.techMarchandsGet().some(function (x) { return x.id !== idCourant && String(x.siret || '') === siret; })) return { ok: false, champ: 'siret', motif: 'Ce SIRET est déjà inscrit comme marque : connecte-toi au compte qui l’a déclaré.' };
    var site = null;
    if (o.sansSite !== true) {
      var sn = this._techSiteNormaliser(o.siteUrl);
      if (!sn.ok) return { ok: false, champ: 'siteUrl', motif: sn.motif };
      site = sn.url;
    }
    var t = function (x) { return String(x || '').trim() || null; };
    /* (24/09 — relecture juridique A) LA TVA DU BON N'EST PAS UN CHOIX : elle se déduit de deux faits que la marque déclare — un seul taux de
       TVA sur tout ce qu'elle vend, et une vente taxable en France seulement. Facultatifs à la saisie (le contrôle les redemande), dérivés par techMarchandTva. */
    var tv = null;
    if (o.tauxUnique != null || o.franceSeule != null) tv = { tauxUnique: o.tauxUnique === true || o.tauxUnique === 'oui', franceSeule: o.franceSeule === true || o.franceSeule === 'oui', declareLe: Date.now() };
    return { ok: true, entreprise: Object.assign({ raisonSociale: nom, siret: siret, siteUrl: site, sansSite: o.sansSite === true, tel: t(o.tel),
      formeJuridique: t(o.formeJuridique), adresse: t(o.adresse), naf: t(o.naf) }, tv ? { tva: tv } : {}) };
  },
  /* la fiche naît du COMPTE, en brouillon : elle ne porte que l'adresse e-mail vérifiée, et n'existe pour personne d'autre */
  _techMarchandBrouillon: function (c) {
    var l = this.techMarchandsGet();
    var seq = this._seq('tech-marchands', this._seqPlancher(l, '^MCH-0*(\\d+)$', 'id'));
    if (seq == null) return null;
    var m = { id: 'MCH-' + String(seq).padStart(5, '0'), statut: 'draft', email: String(c.identifiant || ''), compteId: c.id || null,
      creeLe: Date.now(), raisonSociale: null, siret: null, siteUrl: null, sansSite: false, tel: null, dirigeant: null, conformiteId: null };
    l.push(m);
    if (!this._techMarchandsPut(l)) return null;
    this._journal('tech_marchand_compte', m.id, { email: m.email, via: (c.sso && c.sso.fournisseur) || 'e-mail', par: m.email });
    return m.id;
  },
  /* LE RÉGIME DE TVA D'UN BON DE MARQUE, DÉRIVÉ (art. 256 ter CGI, relu le 24/09) : usage unique (BUU) si taux unique ET France seule ;
     usages multiples (BUM) dès qu'un des deux manque ; « à qualifier » tant que la marque n'a rien déclaré. Rien n'est un réglage. */
  techMarchandTva: function (m) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    var R = ((this.ref || {}).juridique || {}).tva || {}, d = m && m.tva;
    if (!d) return { regime: null, code: 'inconnu', libelle: 'Régime à qualifier', explication: 'La marque n’a pas encore dit si ses produits relèvent d’un seul taux de TVA et d’une vente en France seule.', source: R.regle || '' };
    if (d.tauxUnique && d.franceSeule) return { regime: 'BUU', code: 'buu', libelle: 'Bon à usage unique', explication: 'Taux unique et vente en France seule : chaque transfert du bon est une livraison taxable au taux des produits ; la remise est une réduction de prix sur la facture.', source: R.regle || '' };
    return { regime: 'BUM', code: 'bum', libelle: 'Bon à usages multiples', explication: (d.tauxUnique ? 'Vente hors de France possible' : 'Plusieurs taux de TVA') + ' : les transferts du bon sont hors champ, la TVA est due par la marque à l’utilisation, et notre marge de distribution se facture avec TVA à 20 %.', source: R.bum ? (R.regle || '') + ' ; ' + R.bum : (R.regle || '') };
  },
  techMarchandParCompte: function (compteId) { return this.techMarchandsGet().filter(function (x) { return x.compteId === compteId; })[0] || null; },
  techMarchandEntrepriseSet: function (id, o, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var c = this._techEntrepriseControle(o, m.id); if (!c.ok) return c;
    if (!this._techMarchandMaj(m.id, c.entreprise)) return this._refusEcriture('L’enregistrement de l’entreprise');
    this._journal('tech_marchand_entreprise', m.id, { raisonSociale: c.entreprise.raisonSociale, siret: c.entreprise.siret, site: c.entreprise.siteUrl || 'sans site', par: par || m.email });
    return { ok: true, marchand: this.techMarchand(m.id) };
  },
  /* LA DÉCLARATION TYPE, remplie des données de la marque (ref.tech.declaration) — c'est ce texte-là qu'elle coche */
  techMarchandDeclarationTexte: function (idOuM) {
    var m = typeof idOuM === 'string' ? this.techMarchand(idOuM) : idOuM; if (!m) return '';
    var T = this.techRef().declaration || {}, dom = m.siteUrl ? String(m.siteUrl).replace(/^https?:\/\//, '').replace(/^www\./, '') : '';
    return String((m.sansSite || !dom) ? (T.sansSite || '') : (T.avecSite || '')).split('{marque}').join(m.raisonSociale || '…').split('{site}').join(dom);
  },
  techMarchandDeclarer: function (id, o, par) {
    o = o || {};
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (!m.raisonSociale || (!m.siteUrl && !m.sansSite)) return { ok: false, champ: 'entreprise', motif: 'Renseigne d’abord ton entreprise et ton site : la déclaration les cite.' };
    if (o.accepte !== true) return { ok: false, champ: 'declaration', motif: 'Coche la déclaration « réseau limité » : c’est elle qui tient l’exclusion, et elle est conservée comme preuve.' };
    var txt = this.techMarchandDeclarationTexte(m), cn = m.conformiteId ? this.techConformite(m.conformiteId) : null;
    if (!cn || cn.usageDeclare !== txt || cn.statut === 'to_correct' && cn.statueeLe) {
      var d = this.techConformiteDeposer({ marchandId: m.id, usageDeclare: txt });
      if (!d.ok) return d;
    }
    this._techMarchandMaj(m.id, { declarationAccepteeLe: Date.now() });
    return { ok: true, texte: txt, conformite: this.techConformite(this.techMarchand(m.id).conformiteId) };
  },
  /* OÙ EN EST L'INSCRIPTION — une étape = un fait vérifiable ; la pièce d'identité et les autres pièces du dossier (Kbis, RIB,
     bénéficiaires effectifs) peuvent attendre : le compte reste alors inactif, et l'écran le dit. */
  TECH_INSCRIPTION_ETAPES: [
    { cle: 'compte', lbl: 'Compte' }, { cle: 'entreprise', lbl: 'Entreprise' }, { cle: 'dirigeant', lbl: 'Dirigeant' },
    { cle: 'beneficiaires', lbl: 'Bénéficiaires effectifs', plusTard: true },
    { cle: 'identite', lbl: 'Identité', plusTard: true }, { cle: 'documents', lbl: 'Documents', plusTard: true },
    { cle: 'engagements', lbl: 'Engagements' }, { cle: 'envoi', lbl: 'Envoi' }
  ],
  techMarchandInscription: function (id) {
    var m = this.techMarchand(id); if (!m) return null;
    var self = this, compte = m.compteId ? this.compte(m.compteId) : null, dir = m.dirigeant || {};
    var piece = (typeof window !== 'undefined' && window.PEC_DOCS && PEC_DOCS.get) ? PEC_DOCS.get('marchand', m.id, 'cni') : null;
    var video = (typeof window !== 'undefined' && window.PEC_DOCS && PEC_DOCS.get) ? PEC_DOCS.get('marchand', m.id, 'video') : null;
    var videoOk = !!(video && !/^(manquante|refusee|incomplete|a_renouveler)$/.test(video.statut));
    var type = piece ? (((this.ref.kyc || {}).piecesIdentite || []).filter(function (x) { return x.id === piece.typePiece; })[0] || null) : null;
    var docs = this.documentsEtat ? this.documentsEtat('marchand', m.id) : [];
    /* les AUTRES pièces du dossier : chaque pièce obligatoire déposée (ni absente, ni refusée, ni périmée) — la pièce
       d'identité a son étape, le contrat-cadre se signe plus tard (horsDossier) */
    var dossier = (typeof window !== 'undefined' && window.PEC_DOCS && PEC_DOCS.dossier) ? PEC_DOCS.dossier('marchand', m.id) : [];
    var fait = {
      compte: !m.compteId || !!(compte && compte.verifs && compte.verifs.email),
      entreprise: !!(m.raisonSociale && m.siret && (m.siteUrl || m.sansSite)),
      dirigeant: !!(dir.civilite && dir.prenom && dir.nom && dir.dateNaissance && dir.lieuNaissance && dir.qualite),
      beneficiaires: this.beneficiairesEtat(m.beneficiaires, m.dirigeant, m.formeJuridique).ok,
      /* (24/09, fondatrice : « la même vidéo que le partenaire ») l'identité = la pièce complète ET la vidéo du dirigeant */
      identite: !!(piece && type && (type.faces.length < 2 || piece.verso || piece.deuxFaces)) && videoOk,
      documents: dossier.length > 0 && dossier.every(function (p) { return p.id === 'cni' || p.id === 'video' || p.genere || !p.obligatoire || !/^(manquante|refusee|incomplete|a_renouveler)$/.test(p.statut); }),
      engagements: !!(m.declarationAccepteeLe && m.conformiteId && docs.length && docs.every(function (x) { return x.aJour; })),
      envoi: m.statut !== 'draft'
    };
    var etapes = this.TECH_INSCRIPTION_ETAPES.map(function (e) { return Object.assign({}, e, { ok: !!fait[e.cle] }); });
    var prochaine = etapes.filter(function (e) { return !e.ok; })[0] || null;
    return { marchand: m, etapes: etapes, prochaine: prochaine ? prochaine.cle : null, soumise: m.statut !== 'draft',
      pret: etapes.every(function (e) { return e.ok || e.plusTard || e.cle === 'envoi'; }) };
  },
  /* L'ENVOI : l'inscription entre en vérification (statut « pending » : inactif tant que le manager n'a pas contrôlé le dossier).
     `documentsPlusTard` ne sert qu'au geste unique de démonstration (techMarchandCreer) : le verrou des documents reste
     entier, car aucune marque ne vend sans les avoir lus et acceptés (techMarchandPeutTravailler). */
  techMarchandSoumettre: function (id, par, o) {
    o = o || {};
    var st = this.techMarchandInscription(id); if (!st) return { ok: false, motif: 'Marque inconnue.' };
    var m = st.marchand;
    if (m.statut !== 'draft') return { ok: true, deja: true, marchand: m };
    var manque = st.etapes.filter(function (e) { return !e.ok && !e.plusTard && e.cle !== 'envoi' && !(o.documentsPlusTard && e.cle === 'engagements' && m.declarationAccepteeLe); });
    if (manque.length) return { ok: false, champ: manque[0].cle, motif: 'Il reste à compléter : ' + manque.map(function (e) { return e.lbl; }).join(', ') + '.' };
    if (!this._techMarchandMaj(m.id, { statut: 'pending', soumiseLe: Date.now() })) return this._refusEcriture('L’envoi de l’inscription');
    var d = m.dirigeant || {};
    this._journal('tech_marchand_inscrit', m.id, { raisonSociale: m.raisonSociale, siret: m.siret, site: m.siteUrl || 'sans site', dirigeant: d.prenom + ' ' + d.nom, par: par || m.email });
    return { ok: true, marchand: this.techMarchand(m.id) };
  },
  /* LE MÊME PARCOURS, D'UN SEUL GESTE — pour le jeu de démonstration et le banc : mêmes contrôles, mêmes étapes, même fiche. */
  techMarchandCreer: function (o) {
    o = o || {};
    var ent = this._techEntrepriseControle(o, null); if (!ent.ok) return ent;
    var mail = String(o.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail)) return { ok: false, champ: 'email', motif: 'Une adresse e-mail valide est obligatoire.' };
    var dir = this._techDirigeantControle(o.dirigeant); if (!dir.ok) return dir;
    if (o.cgu !== true) return { ok: false, champ: 'cgu', motif: 'Les conditions générales de la plateforme doivent être acceptées.' };
    if (o.declarationAcceptee !== true) return { ok: false, champ: 'declaration', motif: 'Coche la déclaration « réseau limité » : c’est elle qui tient l’exclusion, et elle est conservée comme preuve.' };
    var id = this._techMarchandBrouillon({ identifiant: mail, id: null }); if (!id) return this._refusEcriture('L’inscription de la marque');
    this._techMarchandMaj(id, { cguAcceptees: Date.now(), cguVersion: o.cguVersion || null });
    var e1 = this.techMarchandEntrepriseSet(id, o, 'inscription'); if (!e1.ok) return e1;
    var e2 = this.techMarchandDirigeantSet(id, o.dirigeant, 'inscription'); if (!e2.ok) return e2;
    /* (24/09) le geste unique peut porter les bénéficiaires effectifs ; sinon l'étape reste à faire depuis le compte (plusTard) */
    if (o.beneficiaires) { var eb = this.techMarchandBeneficiairesSet(id, o.beneficiaires, 'inscription'); if (!eb.ok) return eb; }
    var e3 = this.techMarchandDeclarer(id, { accepte: true }, 'inscription'); if (!e3.ok) return e3;
    var e4 = this.techMarchandSoumettre(id, 'inscription', { documentsPlusTard: true }); if (!e4.ok) return e4;
    return { ok: true, marchand: this.techMarchand(id), conformite: e3.conformite || null };
  },
  /* ══ LE DIRIGEANT DE LA MARQUE (23/09 ; 24/09, fondatrice : « le genre du dirigeant ») ══════════════════════════════════
     Civilité, prénom, nom (et nom de naissance s'il diffère), date ET LIEU de naissance, qualité — ce qu'une pièce d'identité
     et un Kbis permettent de contrôler. Le lieu de naissance reste OBLIGATOIRE (décision fondatrice du 24/09) au titre de notre
     politique de prévention de la fraude — avec le nom et la date, il distingue deux homonymes ; aucun article du CMF ne l'impose
     ici, PayEnCash n'étant pas assujettie à la LCB-FT (le motif affiché : ref.kyc.lieuNaissanceMotif). Les qualités admises sont celles d'un représentant légal, et rien d'autre : un texte libre
     ferait signer « le stagiaire ». `nomComplet` est le signataire du contrat-cadre, dérivé, jamais retapé. */
  TECH_QUALITES_DIRIGEANT: ['gérant', 'gérante', 'président', 'présidente', 'directeur général', 'directrice générale', 'entrepreneur individuel', 'autre représentant légal'],
  techQualitesDirigeant: function () { return this.TECH_QUALITES_DIRIGEANT.slice(); },
  /* ══ LES BÉNÉFICIAIRES EFFECTIFS (24/09) — une règle, deux acteurs (marque, partenaire) ═══════════════════════════════════
     Soit personne ne détient plus du seuil (`aucun`) et le représentant légal est retenu d'office (R561-1, dernier alinéa), soit une
     fiche par personne : civilité, prénom, nom, date de naissance, nationalité, part détenue. Une entreprise individuelle n'a pas
     de bénéficiaire à déclarer : son entrepreneur l'est, et l'étape se tient d'elle-même dès qu'il est déclaré. L'attestation
     (« exactes et complètes ») est ce que la déclaration conserve ; elle date et signe. */
  estEntrepriseIndividuelle: function (formeJuridique) { return /individuel|entrepreneur|^EI\b|micro/i.test(String(formeJuridique || '')); },
  _beneficiairesControle: function (o, dirigeant) {
    o = o || {};
    var K = ((this.ref || {}).kyc || {}).beneficiaires || {}, seuil = +K.seuilPct || 25, civ = (((this.ref || {}).kyc || {}).civilites) || [];
    if (o.atteste !== true) return { ok: false, champ: 'atteste', motif: 'Coche l’attestation : c’est elle qui engage la déclaration.' };
    if (o.aucun === true) {
      if (!dirigeant || !dirigeant.nom) return { ok: false, champ: 'dirigeant', motif: 'Sans bénéficiaire au-delà du seuil, c’est le représentant légal qui est retenu : déclare-le d’abord.' };
      return { ok: true, beneficiaires: { aucun: true, personnes: [], attesteLe: Date.now(), seuilPct: seuil } };
    }
    var l = (o.personnes || []), out = [], total = 0;
    if (!l.length) return { ok: false, champ: 'personnes', motif: 'Déclare au moins une personne — ou coche « aucune personne ne détient plus de ' + seuil + ' % ».' };
    for (var i = 0; i < l.length; i++) {
      var p = l[i] || {}, n = i + 1;
      var prenom = String(p.prenom || '').trim(), nom = String(p.nom || '').trim(), nat = String(p.nationalite || '').trim(), c = String(p.civilite || '').trim();
      if (civ.indexOf(c) === -1) return { ok: false, champ: 'civilite', index: i, motif: 'Personne ' + n + ' : indique la civilité (' + civ.join(' ou ') + ').' };
      if (prenom.length < 2 || nom.length < 2) return { ok: false, champ: 'nom', index: i, motif: 'Personne ' + n + ' : prénom et nom sont obligatoires.' };
      var dn = String(p.dateNaissance || '').trim(), ts = /^\d{4}-\d{2}-\d{2}$/.test(dn) ? Date.parse(dn + 'T00:00:00') : NaN;
      if (isNaN(ts) || (Date.now() - ts) / (365.2425 * 86400000) < 18) return { ok: false, champ: 'dateNaissance', index: i, motif: 'Personne ' + n + ' : une date de naissance, et une personne majeure.' };
      if (nat.length < 2) return { ok: false, champ: 'nationalite', index: i, motif: 'Personne ' + n + ' : indique la nationalité.' };
      var part = Math.round((parseFloat(String(p.part == null ? '' : p.part).replace(',', '.')) || 0) * 100) / 100;
      var controle = p.controle === 'autre';
      if (!controle && !(part > seuil && part <= 100)) return { ok: false, champ: 'part', index: i, motif: 'Personne ' + n + ' : la part détenue dépasse ' + seuil + ' % (jusqu’à 100 %) — ou coche « contrôle par d’autres moyens ».' };
      total += controle ? 0 : part;
      out.push({ civilite: c, prenom: prenom, nom: nom, dateNaissance: dn, nationalite: nat, part: controle ? null : part, controle: controle ? 'autre' : 'capital' });
    }
    if (total > 100) return { ok: false, champ: 'part', motif: 'Les parts déclarées dépassent 100 %.' };
    return { ok: true, beneficiaires: { aucun: false, personnes: out, attesteLe: Date.now(), seuilPct: seuil } };
  },
  /* L'ÉTAT DE L'ÉTAPE, DÉRIVÉ : une entreprise individuelle avec son entrepreneur déclaré, ou une déclaration attestée */
  beneficiairesEtat: function (b, dirigeant, formeJuridique) {
    if (this.estEntrepriseIndividuelle(formeJuridique)) return { ok: !!(dirigeant && dirigeant.nom), ei: true, personnes: dirigeant && dirigeant.nom ? [Object.assign({}, dirigeant, { part: 100 })] : [] };
    if (!b || !b.attesteLe) return { ok: false, ei: false, personnes: [] };
    return { ok: true, ei: false, aucun: !!b.aucun, personnes: b.aucun ? (dirigeant && dirigeant.nom ? [Object.assign({}, dirigeant, { representant: true })] : []) : (b.personnes || []), attesteLe: b.attesteLe };
  },
  techMarchandBeneficiairesSet: function (id, o, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var c = this._beneficiairesControle(o, m.dirigeant); if (!c.ok) return c;
    var b = Object.assign(c.beneficiaires, { attestePar: par || m.email });
    if (!this._techMarchandMaj(m.id, { beneficiaires: b })) return this._refusEcriture('La déclaration des bénéficiaires effectifs');
    this._journal('tech_beneficiaires_declares', m.id, { personnes: b.personnes.length, aucun: b.aucun, par: b.attestePar });
    return { ok: true, beneficiaires: b };
  },
  partenaireBeneficiairesSet: function (compteId, o) {
    var k = this._partenaireCandidat(compteId); if (!k.ok) return k;
    var p = k.compte.profil || {}, c = this._beneficiairesControle(o, p.gerant); if (!c.ok) return c;
    var b = Object.assign(c.beneficiaires, { attestePar: k.compte.identifiant });
    this._partenaireProfilMaj(k.compte, { beneficiaires: b }, 'partenaire_beneficiaires', { personnes: b.personnes.length, aucun: b.aucun });
    return { ok: true, beneficiaires: b };
  },
  _techDirigeantControle: function (d) {
    d = d || {};
    var K = (this.ref || {}).kyc || {}, civ = String(d.civilite || '').trim();
    var prenom = String(d.prenom || '').trim(), nom = String(d.nom || '').trim(), q = String(d.qualite || '').trim().toLowerCase();
    if ((K.civilites || []).indexOf(civ) === -1) return { ok: false, champ: 'dirigeantCivilite', motif: 'Indique la civilité du dirigeant (' + (K.civilites || []).join(' ou ') + ') : elle se lit sur sa pièce d’identité.' };
    if (prenom.length < 2) return { ok: false, champ: 'dirigeantPrenom', motif: 'Le prénom du dirigeant est obligatoire : c’est lui qui signe le contrat-cadre.' };
    if (nom.length < 2) return { ok: false, champ: 'dirigeantNom', motif: 'Le nom du dirigeant est obligatoire : c’est lui qui signe le contrat-cadre.' };
    var dn = String(d.dateNaissance || '').trim(), t = /^\d{4}-\d{2}-\d{2}$/.test(dn) ? Date.parse(dn + 'T00:00:00') : NaN;
    if (isNaN(t)) return { ok: false, champ: 'dirigeantNaissance', motif: 'Indique la date de naissance du dirigeant : elle se contrôle sur sa pièce d’identité.' };
    var age = (Date.now() - t) / (365.2425 * 86400000);
    if (age < (+K.ageMin || 18) || age > 120) return { ok: false, champ: 'dirigeantNaissance', motif: age < (+K.ageMin || 18) ? 'Un représentant légal est majeur (' + (+K.ageMin || 18) + ' ans) : vérifie la date de naissance.' : 'Date de naissance non plausible : vérifie-la.' };
    var lieu = String(d.lieuNaissance || '').trim();
    if (lieu.length < 2) return { ok: false, champ: 'dirigeantLieuNaissance', motif: 'Indique le lieu de naissance du dirigeant (ville, et pays s’il est né hors de France) : il se lit sur sa pièce d’identité.' };
    if (this.TECH_QUALITES_DIRIGEANT.indexOf(q) === -1) return { ok: false, champ: 'dirigeantQualite', motif: 'Indique la qualité du dirigeant (' + this.TECH_QUALITES_DIRIGEANT.join(', ') + ') : celle qui figure au Kbis.' };
    return { ok: true, dirigeant: { civilite: civ, prenom: prenom, nom: nom, nomNaissance: String(d.nomNaissance || '').trim() || null, dateNaissance: dn, lieuNaissance: lieu, qualite: q } };
  },
  techMarchandDirigeant: function (m) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    if (!m || !m.dirigeant || !m.dirigeant.nom) return null;
    var d = m.dirigeant;
    return { civilite: d.civilite || null, prenom: d.prenom, nom: d.nom, nomNaissance: d.nomNaissance || null, dateNaissance: d.dateNaissance || null,
      lieuNaissance: d.lieuNaissance || null, qualite: d.qualite, nomComplet: d.prenom + ' ' + d.nom };
  },
  techMarchandDirigeantSet: function (id, d, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var c = this._techDirigeantControle(d); if (!c.ok) return c;
    /* UN DIRIGEANT QUI CHANGE APRÈS LA SIGNATURE, ça se voit : le contrat garde son signataire, l'écran le dira. */
    if (!this._techMarchandMaj(m.id, { dirigeant: c.dirigeant })) return this._refusEcriture('La déclaration du dirigeant');
    this._journal('tech_dirigeant_declare', m.id, { dirigeant: c.dirigeant.prenom + ' ' + c.dirigeant.nom, qualite: c.dirigeant.qualite, par: par || id });
    return { ok: true, dirigeant: this.techMarchandDirigeant(m.id) };
  },
  /* LE KYC DU SIGNATAIRE : sa pièce d'identité, déposée ET contrôlée au coffre. Sans coffre chargé, on ne sait pas —
     et on ne signe pas sur ce qu'on ne sait pas. */
  techKycDirigeant: function (id) {
    if (typeof window === 'undefined' || !window.PEC_DOCS || !PEC_DOCS.get) return { ok: false, refus: 'coffre', motif: 'Le coffre des pièces n\'est pas chargé sur cet écran : la signature se fait depuis Compte › Documents.' };
    var p = PEC_DOCS.get('marchand', id, 'cni');
    if (!p) return { ok: false, refus: 'kyc', motif: 'La pièce d\'identité du dirigeant n\'est pas déposée (Compte › Identité) : sans elle, pas de signature.' };
    if (p.statut !== 'validee') return { ok: false, refus: 'kyc', motif: 'La pièce d\'identité du dirigeant est déposée mais pas encore contrôlée : la signature attend ce contrôle.' };
    return { ok: true, piece: p, verifieeLe: p.statueAt || p.at || null };
  },

  /* ══ UC-3 — LA DÉCLARATION DE CONFORMITÉ « RÉSEAU LIMITÉ » ═══════════════════════════════════
     Le commerçant déclare, horodaté, que ses bons ne seront utilisables QUE sur son propre site. C'est la
     pièce que l'ACPR demanderait en cas de contrôle : elle est conservée telle quelle, et une correction
     n'efface pas la précédente — elle en ajoute une (même règle que le registre de police, 12/09). ══ */
  techConformitesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-conformites') || '[]') || []; } catch (e) { return []; } },
  _techConformitesPut: function (l) { if (!this._ecrit('pec-tech-conformites', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techConformite: function (id) { return this.techConformitesGet().filter(function (x) { return x.id === id; })[0] || null; },
  // la déclaration COURANTE d'un commerçant : la dernière déposée, quelle que soit son issue
  techConformiteMarchand: function (marchandId) {
    var l = this.techConformitesGet().filter(function (x) { return x.marchandId === marchandId; });
    l.sort(function (a, b) { return (b.deposeeLe || 0) - (a.deposeeLe || 0); });
    return l[0] || null;
  },
  techConformiteDeposer: function (o) {
    o = o || {};
    var m = this.techMarchand(o.marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var txt = String(o.usageDeclare || '').trim();
    if (txt.length < 20) return { ok: false, champ: 'usageDeclare', motif: 'Décris l\'usage exclusif des bons sur ton site — c\'est la preuve qu\'on conserve.' };
    var l = this.techConformitesGet();
    var seq = this._seq('tech-conformites', this._seqPlancher(l, '^CNF-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('La déclaration de conformité');
    var d = { id: 'CNF-' + String(seq).padStart(5, '0'), marchandId: m.id, usageDeclare: txt,
      statut: 'to_correct', deposeeLe: Date.now(), statueeLe: null, statueePar: null, motif: null };
    l.push(d);
    if (!this._techConformitesPut(l)) return this._refusEcriture('La déclaration de conformité');
    var ml = this.techMarchandsGet(), i = -1;
    for (var k = 0; k < ml.length; k++) if (ml[k].id === m.id) i = k;
    if (i > -1) { ml[i].conformiteId = d.id; this._techMarchandsPut(ml); }
    this._journal('tech_conformite_deposee', d.id, { marchand: m.id, site: m.siteUrl });
    return { ok: true, declaration: d };
  },
  /* La plateforme statue : « validé » ou « à corriger », et un refus se MOTIVE — le commerçant doit savoir
     ce qui cloche dans son usage déclaré avant de redemander. */
  techConformiteStatuer: function (id, ok, motif, par) {
    var l = this.techConformitesGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === id) i = k;
    if (i < 0) return { ok: false, motif: 'Déclaration inconnue.' };
    motif = String(motif || '').trim();
    if (!ok && !motif) return { ok: false, champ: 'motif', motif: 'Une déclaration se refuse avec un motif — la marque doit pouvoir la corriger.' };
    l[i].statut = ok ? 'validated' : 'to_correct';
    l[i].statueeLe = Date.now(); l[i].statueePar = par || null; l[i].motif = motif || null;
    if (!this._techConformitesPut(l)) return this._refusEcriture('La décision de conformité');
    this._journal(ok ? 'tech_conformite_validee' : 'tech_conformite_a_corriger', id, { par: par || null, motif: motif || null });
    return { ok: true, declaration: this.techConformite(id) };
  },
  // un commerçant est EN RÈGLE quand sa dernière déclaration est validée — dérivé, jamais un drapeau posé à côté
  techMarchandConforme: function (marchandId) {
    var d = this.techConformiteMarchand(marchandId);
    return !!(d && d.statut === 'validated');
  },

  /* ══ UC-4 — LE MANDAT DE REPRÉSENTATION (art. 1984 s. du Code civil) ═══════════════════════════
     Signé UNE fois, à l'inscription, par chaque partie. C'est lui qui autorise la plateforme à générer ET
     exécuter en leur nom les contrats de distribution à venir — sans re-signature à chaque mise en relation.
     Pouvoir exprès, périmètre défini, révocable : les trois conditions du mandat en bonne forme. ══ */
  /* ══ (22/09) LE COMPTE STRIPE CONNECTÉ DE LA MARQUE A ÉTÉ RETIRÉ ═════════════════════════════════════════════
     Il n'y a plus de compte à relier, plus de carte à cloner, plus de commission prélevée à la source : nous
     ACHETONS les bons et nous les revendons. Ce qu'il faut à une marque pour être payée tient en deux choses —
     son offre de paiement (`techMarchandModeChoisir`) et son RIB (`techMarchandRibEnregistrer`). ══ */
  _techMarchandMaj: function (id, patch) {
    var l = this.techMarchandsGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === id) i = k;
    if (i < 0) return false;
    Object.assign(l[i], patch);
    return this._techMarchandsPut(l);
  },
  /* ══ (22/09) L'ABONNEMENT AU LOGICIEL — ce qui remplace la « redevance de stockage » ═══════════════════════
     Une échéance par marque et par mois, au prix de SON forfait (Réseau 0 €, Essentiel, Illimité), premier mois
     offert. Elle naît ici, se prélève dans la remise « abonnements » et se documente par une facture : trois
     gestes distincts, et une période ne se génère qu'une fois — rejouer la tâche ne double pas la facture. ══ */
  techAbonnementsGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-abonnements') || '[]') || []; } catch (e) { return []; } },
  _techAbonnementsPut: function (l) { if (!this._ecrit('pec-tech-abonnements', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techAbonnement: function (id) { return this.techAbonnementsGet().filter(function (x) { return x.id === id; })[0] || null; },
  techAbonnements: function (o) {
    o = o || {};
    return this.techAbonnementsGet().filter(function (x) {
      if (o.marchandId && x.marchandId !== o.marchandId) return false;
      if (o.periode && x.periode !== o.periode) return false;
      if (o.statut && x.statut !== o.statut) return false;
      return true;
    }).sort(function (a, b) { return String(b.periode).localeCompare(String(a.periode)); });
  },
  techPeriodeCourante: function (d) { var x = d ? new Date(d) : new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); },
  techAbonnementGenerer: function (o) {
    o = o || {};
    var m = this.techMarchand(o.marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var per = String(o.periode || this.techPeriodeCourante());
    var deja = this.techAbonnements({ marchandId: m.id, periode: per })[0];
    if (deja) return { ok: false, motif: 'L\'abonnement de ' + per + ' existe déjà pour cette marque.', abonnement: deja };
    var du = this.techAbonnementDu(m, per);
    if (!du) return { ok: false, motif: 'L\'abonnement ne court que pour une marque validée.' };
    if (!(du.montant > 0)) return { ok: false, motif: du.motif || 'Rien à facturer pour cette période.', gratuit: true, formule: du.formule };
    var l = this.techAbonnementsGet();
    var seq = this._seq('tech-abonnements', this._seqPlancher(l, '^ABO-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('L\'abonnement');
    var a = { id: 'ABO-' + String(seq).padStart(5, '0'), marchandId: m.id, marchand: m.raisonSociale, periode: per,
      formule: du.formule.id, formuleNom: du.formule.nom, montantHT: du.montant, statut: 'du',
      remiseRef: null, factureId: null, creeLe: Date.now() };
    l.push(a);
    if (!this._techAbonnementsPut(l)) return this._refusEcriture('L\'abonnement');
    this._journal('tech_abonnement_genere', a.id, { marchand: m.id, periode: per, formule: a.formule, montantHT: a.montantHT });
    return { ok: true, abonnement: a };
  },
  _techAbonnementMaj: function (refs, patch) {
    var set = {}; [].concat(refs).forEach(function (r) { set[r] = true; });
    var l = this.techAbonnementsGet(), n = 0;
    l.forEach(function (x) { if (set[x.id]) { Object.assign(x, patch); n++; } });
    return this._techAbonnementsPut(l) ? n : 0;
  },

  /* ══ LES FACTURES DE LA PLATEFORME — NOS honoraires, et rien d'autre ═════════════════════════
     « Toute intégration de paiement doit se limiter au règlement de la propre facture de commission de la
     plateforme, jamais aux flux entre partenaire et commerçant » (§8). Ces factures portent donc NOTRE
     prestation, soumise à TVA — distincte du régime des bons d'achat eux-mêmes. ══ */
  techFacturesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-factures') || '[]') || []; } catch (e) { return []; } },
  _techFacturesPut: function (l) { if (!this._ecrit('pec-tech-factures', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techFacture: function (id) { return this.techFacturesGet().filter(function (x) { return x.id === id; })[0] || null; },
  techFactures: function (o) {
    o = o || {};
    var l = this.techFacturesGet().slice();
    if (o.marchandId) l = l.filter(function (x) { return x.marchandId === o.marchandId; });
    if (o.statut) l = l.filter(function (x) { return x.statut === o.statut; });
    return l.sort(function (a, b) { return (b.emiseLe || 0) - (a.emiseLe || 0); });
  },
  techFactureEmettre: function (o) {
    o = o || {};
    var src = o.sourceType === 'subscription' ? 'subscription' : null;
    if (!src) return { ok: false, motif: 'Une facture de PayEnCash Solution porte un abonnement au logiciel — et rien d\'autre : le prix des bons est une remise sur achat, pas une prestation facturée.' };
    var base = this.techAbonnement(o.sourceId);
    if (!base) return { ok: false, motif: 'L\'élément à facturer est introuvable.' };
    if (base.factureId) return { ok: false, motif: 'Déjà facturé (' + base.factureId + ').', facture: this.techFacture(base.factureId) };
    var R = this.techRef(), ht = base.montantHT || 0;
    var tva = Math.round(ht * R.tvaPct) / 100, ttc = Math.round((ht + tva) * 100) / 100;
    var l = this.techFacturesGet();
    var seq = this._seq('tech-factures', this._seqPlancher(l, '^FTC-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('La facture');
    var fa = { id: 'FTC-' + String(seq).padStart(5, '0'), sourceType: src, sourceId: base.id,
      marchandId: base.marchandId || null, revendeurId: base.revendeurId || null,
      montantHT: ht, tvaPct: R.tvaPct, tva: tva, montantTTC: ttc,
      statut: 'sent', emiseLe: Date.now(), payeeLe: null };
    l.push(fa);
    if (!this._techFacturesPut(l)) return this._refusEcriture('La facture');
    // la source porte sa facture : on ne refacture pas ce qui l'est déjà
    this._techAbonnementMaj(base.id, { factureId: fa.id });
    this._journal('tech_facture_emise', fa.id, { source: src, sourceId: base.id, ht: ht, ttc: ttc });
    return { ok: true, facture: fa };
  },

  /* ══ LES CLÉS D'API DU COMMERÇANT ════════════════════════════════════════════════════════
     Une clé PUBLIQUE (pk_…), qui vit dans la page de commande du site de la marque et ne peut rien faire seule, et
     une clé SECRÈTE (sk_…), qui signe les appels serveur à serveur.
     LE SECRET N'EST STOCKÉ NULLE PART. Il est tiré de `crypto.getRandomValues`, montré UNE fois, et seule son
     EMPREINTE SHA-256 est conservée — exactement comme un mot de passe. Perdu, il ne se retrouve pas : il se
     révoque et se refait. C'est la règle de la maison (« aucun secret dans le dépôt, aucun secret côté client »),
     et c'est aussi la seule façon honnête de tenir une clé d'API. ══ */
  techClesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-cles') || '[]') || []; } catch (e) { return []; } },
  _techClesPut: function (l) { if (!this._ecrit('pec-tech-cles', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techCles: function (marchandId) {
    return this.techClesGet().filter(function (x) { return x.marchandId === marchandId; })
      .sort(function (a, b) { return (b.creeLe || 0) - (a.creeLe || 0); });
  },
  techCleActive: function (marchandId) {
    return this.techCles(marchandId).filter(function (x) { return !x.revoqueLe; })[0] || null;
  },
  _techAlea: function (n) {
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', out = '';
    var buf = new Uint8Array(n);
    /* PAS DE Math.random POUR UN SECRET : le générateur du navigateur, ou rien. Sans lui, on REFUSE
       d'inventer une clé — une clé prévisible est pire que pas de clé. */
    if (!(window.crypto && window.crypto.getRandomValues)) return null;
    window.crypto.getRandomValues(buf);
    for (var i = 0; i < n; i++) out += abc[buf[i] % abc.length];
    return out;
  },
  _techEmpreinte: function (txt) {
    if (!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest)) return Promise.resolve(null);
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function (b) {
      return [].map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    });
  },
  /* La génération est ASYNCHRONE parce que l'empreinte l'est : `cb({ ok, cle, secret })`. Le secret n'apparaît
     QUE dans ce rappel — il n'est écrit nulle part, et l'écran doit le dire à la cliente. */
  techCleGenerer: function (marchandId, cb) {
    var self = this;
    cb = cb || function () {};
    var m = this.techMarchand(marchandId);
    if (!m) { cb({ ok: false, motif: 'Marque inconnue.' }); return; }
    if (m.statut !== 'validated') { cb({ ok: false, motif: 'Les clés d\'API s\'ouvrent à une marque VALIDÉE — la vérification d\'abord.' }); return; }
    /* (23/09) LA CLÉ N'OUVRE RIEN TANT QUE LA MARQUE NE PEUT PAS TRAVAILLER AVEC NOUS : documents lus et acceptés,
       contrat-cadre signé, déclaration validée — la même règle que la vente (techMarchandPeutTravailler). */
    var trav = this.techMarchandPeutTravailler(m.id);
    if (!trav.ok) { cb({ ok: false, refus: 'marque', motif: 'Avant la clé d\'API : ' + trav.manque[0].libelle, href: trav.href, manque: trav.manque }); return; }
    if (!this.techMarchandConforme(m.id)) { cb({ ok: false, motif: 'La déclaration « réseau limité » doit être validée avant toute clé — c\'est elle qui tient l\'exemption.' }); return; }
    var R = this.techRef();
    var brut = this._techAlea(R.cleLongueur);
    if (!brut) { cb({ ok: false, motif: 'Ce navigateur ne sait pas tirer un secret sûr — aucune clé ne sera inventée.' }); return; }
    var pub = 'pk_' + this._techAlea(24);
    var secret = 'sk_' + brut;
    this._techEmpreinte(secret).then(function (emp) {
      if (!emp) { cb({ ok: false, motif: 'Ce navigateur ne sait pas calculer l\'empreinte du secret — on ne stocke pas une clé en clair.' }); return; }
      var l = self.techClesGet();
      var seq = self._seq('tech-cles', self._seqPlancher(l, '^CLE-0*(\\d+)$', 'id'));
      if (seq == null) { cb(self._refusEcriture('La clé d\'API')); return; }
      // la clé précédente tombe : une seule clé vivante par commerçant, sinon on ne sait plus laquelle révoquer
      l.forEach(function (x) { if (x.marchandId === m.id && !x.revoqueLe) { x.revoqueLe = Date.now(); x.motifRevocation = 'remplacée par une nouvelle clé'; } });
      var c = { id: 'CLE-' + String(seq).padStart(5, '0'), marchandId: m.id, clePublique: pub,
        empreinte: emp, apercu: 'sk_' + brut.slice(0, 4) + '…' + brut.slice(-4),
        creeLe: Date.now(), revoqueLe: null, motifRevocation: null, dernierAppelLe: null };
      l.push(c);
      if (!self._techClesPut(l)) { cb(self._refusEcriture('La clé d\'API')); return; }
      self._journal('tech_cle_generee', c.id, { marchand: m.id, publique: pub });
      cb({ ok: true, cle: c, secret: secret });
    });
  },
  /* LA VÉRIFICATION — c'est ce que ferait le serveur à chaque appel : on recalcule l'empreinte du secret
     présenté et on la compare. Aucune clé en clair n'est jamais lue, ni comparée, ni journalisée. */
  techCleVerifier: function (secret, cb) {
    var self = this;
    cb = cb || function () {};
    if (!secret || String(secret).indexOf('sk_') !== 0) { cb({ ok: false, motif: 'Clé secrète absente ou mal formée.' }); return; }
    this._techEmpreinte(String(secret)).then(function (emp) {
      if (!emp) { cb({ ok: false, motif: 'Empreinte incalculable sur cet appareil.' }); return; }
      var c = self.techClesGet().filter(function (x) { return x.empreinte === emp; })[0];
      if (!c) { cb({ ok: false, motif: 'Clé inconnue.' }); return; }
      if (c.revoqueLe) { cb({ ok: false, motif: 'Cette clé a été révoquée le ' + new Date(c.revoqueLe).toLocaleDateString('fr-FR') + '.' }); return; }
      var l = self.techClesGet(), i = -1;
      for (var k = 0; k < l.length; k++) if (l[k].id === c.id) i = k;
      if (i > -1) { l[i].dernierAppelLe = Date.now(); self._techClesPut(l); }
      cb({ ok: true, cle: c, marchand: self.techMarchand(c.marchandId) });
    });
  },

  /* ══ LES BONS DU COMMERÇANT — LES SIENS, PAS LES NÔTRES ═════════════════════════════════
     Chaque bon porte SON commerçant et n'est utilisable QUE sur le site de celui-ci. Nous en assurons la
     gestion numérique (émission, statut, historique, traçabilité) POUR SON COMPTE, et c'est tout ce que
     facture la redevance de stockage. Aucun flux d'argent ne passe par nous, à aucun moment :
       · émis — il naît à la vente, quand nous l'achetons à la marque au montant demandé par le client ;
       · vendu — le revendeur l'a vendu à un client final, pour son propre compte, avec sa marge ;
       · utilisé — le client l'a dépensé chez le commerçant, qui le décompte.
     Nous n'enregistrons que l'ÉTAT. Le prix d'achat du revendeur et son prix de revente ne nous regardent
     pas et ne sont pas stockés (§5.1 : « cette marge appartient entièrement au revendeur »). ══ */
  /* (23/09, fondatrice : « attention au terme "alloué à un revendeur" — c'est nous qui achetons les bons à la marque »)
     LES ÉTATS PORTENT LES MOTS DU GROSSISTE : un bon naît quand nous l'ACHETONS à la marque, au comptoir, au montant
     que le client demande ; il est ensuite VENDU au client, puis UTILISÉ chez la marque. Personne n'« alloue » rien. */
  TECH_BON_ETATS: { issued: 'Émis', allocated: 'Acheté par le réseau', sold: 'Remis au client', redeemed: 'Utilisé chez la marque', cancelled: 'Annulé' },   // (23/09, soir) « achat du réseau », jamais « vente »
  /* ══ (22/09 — fondatrice) LA VENTE D'UN BON DE MARQUE : NOUS ACHETONS, NOUS REVENDONS ═══════════════════
     Quatre nombres, arrondis au centime et FIGÉS sur la vente — rejouer un taux d'aujourd'hui sur une vente d'hier
     serait réécrire le passé :
       · `montant`    la valeur faciale, ce que le client paie au comptoir ;
       · `partPoint`  ce que le point de vente garde (sa marge, jamais une « commission ») ;
       · `prixPoint`  ce qu'il nous doit : la valeur faciale moins sa part — c'est CE montant qui est prélevé ;
       · `prixMarque` ce que nous payons à la marque : la valeur faciale moins la remise de SON offre.
     Notre marge est la différence, et elle paie le prélèvement, le virement et le risque d'impayé.
     Miroir SQL : tech_sales. ══ */
  techRepartition: function (montant, o) {
    o = o || {}; var r2 = function (x) { return Math.round(x * 100) / 100; };
    var m = r2(+String(montant == null ? '' : montant).replace(',', '.') || 0);
    var mode = o.mode || this.techMode(o.modeId);
    var remisePct = (o.remisePct == null || o.remisePct === '') ? +mode.remisePct : +o.remisePct;
    var pointPct = (o.partPointPct == null || o.partPointPct === '') ? +mode.partPointPct : +o.partPointPct;
    var remise = r2(m * remisePct / 100), partPoint = r2(m * pointPct / 100);
    var prixMarque = r2(m - remise), prixPoint = r2(m - partPoint);
    return { montant: m, modeId: mode.id, modeLbl: mode.libelle,
      remisePct: remisePct, remise: remise, prixMarque: prixMarque,
      partPointPct: pointPct, partPoint: partPoint, prixPoint: prixPoint,
      margePct: r2(remisePct - pointPct), marge: r2(prixPoint - prixMarque),
      valide: m > 0 && prixMarque > 0 && pointPct >= 0 && pointPct <= remisePct && remisePct < 100 };
  },

  /* ══ LES JOURS OUVRÉS — « 7 jours ouvrés », « remis au moins 1 jour ouvré avant l'échéance » : deux règles qui
     ne valent que si quelqu'un sait compter les jours. Samedi, dimanche et les onze fériés français (Pâques
     calculée, pas recopiée d'une table qui périme). Écrit une fois, lu par le prélèvement ET par le règlement. ══ */
  _feriesFr: function (an) {
    var c = this._feriesCache || (this._feriesCache = {});
    if (c[an]) return c[an];
    var a = an % 19, b = Math.floor(an / 100), d = an % 100, e = Math.floor(b / 4), f = b % 4;
    var g = Math.floor((b + 8) / 25), h = Math.floor((b - g + 1) / 3), i2 = (19 * a + b - e - h + 15) % 30;
    var k = Math.floor(d / 4), l2 = d % 4, m2 = (32 + 2 * f + 2 * k - i2 - l2) % 7;
    var n = Math.floor((a + 11 * i2 + 22 * m2) / 451);
    var mois = Math.floor((i2 + m2 - 7 * n + 114) / 31), jour = ((i2 + m2 - 7 * n + 114) % 31) + 1;
    var paques = new Date(an, mois - 1, jour);
    var plus = function (j) { var x = new Date(paques.getTime()); x.setDate(x.getDate() + j); return x; };
    var set = {}, ajout = function (dt) { set[dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate()] = true; };
    [[0, 1], [4, 1], [4, 8], [6, 14], [7, 15], [10, 1], [10, 11], [11, 25]].forEach(function (x) { ajout(new Date(an, x[0], x[1])); });
    ajout(plus(1)); ajout(plus(39)); ajout(plus(50));   // lundi de Pâques, Ascension, lundi de Pentecôte
    c[an] = set; return set;
  },
  estJourOuvre: function (d) {
    var dt = (d instanceof Date) ? d : new Date(d), j = dt.getDay();
    if (j === 0 || j === 6) return false;
    return !this._feriesFr(dt.getFullYear())[dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate()];
  },
  ajouterJoursOuvres: function (d, n) {
    var dt = new Date((d instanceof Date) ? d.getTime() : d), reste = Math.max(0, +n || 0), garde = 0;
    while (reste > 0 && garde++ < 400) { dt.setDate(dt.getDate() + 1); if (this.estJourOuvre(dt)) reste--; }
    return dt;
  },

  /* ══ LES TROIS OFFRES DE PAIEMENT — lues du référentiel, réglables en Configuration, jamais écrites dans un écran ══ */
  techModes: function () {
    var R = this.techRef(), self = this;
    return (R.modesPaiement || []).map(function (m) {
      var p = function (k, d) { var x = self.param ? self.param('tech.mode.' + m.id + '.' + k, m[k]) : m[k]; return (x == null || x === '') ? d : x; };
      var remise = +p('remisePct', m.remisePct), point = +p('partPointPct', m.partPointPct);
      return Object.assign({}, m, { remisePct: remise, partPointPct: point,
        margePct: Math.round((remise - point) * 100) / 100,
        cadenceJours: +p('cadenceJours', m.cadenceJours) });
    });
  },
  techModeDefaut: function () { var l = this.techModes(); return l.filter(function (m) { return m.defaut; })[0] || l[0]; },
  techMode: function (id) { return this.techModes().filter(function (m) { return m.id === id; })[0] || this.techModeDefaut(); },
  /* LE DÉLAI D'UNE OFFRE, calculé et non raconté : c'est lui qui date le virement de la marque. */
  techModeEcheance: function (mode, depuis) {
    var base = new Date((depuis instanceof Date) ? depuis.getTime() : (depuis || Date.now()));
    if (mode.delaiHeures) return new Date(base.getTime() + mode.delaiHeures * 3600000);
    if (mode.delaiJoursOuvres) return this.ajouterJoursOuvres(base, mode.delaiJoursOuvres);
    var d = new Date(base.getTime()); d.setDate(d.getDate() + (mode.delaiJours || 0)); return d;
  },
  techMarchandMode: function (m) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    return this.techMode((m && m.modePaiement) || null);
  },
  /* LE CHOIX DE LA MARQUE — il vaut pour les ventes À VENIR. Les ventes déjà faites gardent le taux qu'elles
     portaient : une offre qu'on change ne rejoue pas ce qui est vendu (§9 du cahier des charges). */
  techMarchandModeChoisir: function (id, modeId, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var mode = this.techModes().filter(function (x) { return x.id === modeId; })[0];
    if (!mode) return { ok: false, champ: 'mode', motif: 'Offre de paiement inconnue.' };
    var avant = this.techMarchandMode(m);
    if (!this._techMarchandMaj(m.id, { modePaiement: mode.id })) return this._refusEcriture('Le choix de l\'offre de paiement');
    this._journal('tech_mode_paiement_choisi', m.id, { mode: mode.id, libelle: mode.libelle, remisePct: mode.remisePct,
      partPointPct: mode.partPointPct, avant: avant ? avant.id : null, par: par || m.id });
    return { ok: true, mode: mode, avant: avant };
  },

  /* ══ LE MANDAT SEPA — signé UNE fois, réutilisé à chaque prélèvement ════════════════════════════════════════
     Le point de vente le signe pour être débité de ses ventes ; la marque le signe pour son abonnement au logiciel.
     Interentreprises (B2B) par défaut, sur décision de la fondatrice : le débiteur professionnel renonce au
     remboursement sur simple demande, et sa banque enregistre le mandat avant le premier prélèvement — c'est la
     seule façon de ne pas voir un impayé revenir huit semaines après. On ne garde que l'IBAN et la RUM : aucune
     donnée qui ne serve pas à prélever. Miroir SQL : tech_sepa_mandates. ══ */
  TECH_MANDAT_ACTEURS: { revendeur: 'Point de vente', marchand: 'Marque' },
  _techActeur: function (type, id) { return type === 'marchand' ? this.techMarchand(id) : this.techRevendeur(id); },
  techSepaMandat: function (type, id) {
    var a = this._techActeur(type, id);
    var mdt = a && a.sepa ? a.sepa : null;
    return (mdt && mdt.statut === 'actif') ? mdt : null;
  },
  techSepaMandatToute: function (type, id) { var a = this._techActeur(type, id); return (a && a.sepa) || null; },
  techSepaMandatSigner: function (type, id, o, par) {
    o = o || {};
    if (!this.TECH_MANDAT_ACTEURS[type]) return { ok: false, motif: 'Type d\'acteur inconnu.' };
    var a = this._techActeur(type, id); if (!a) return { ok: false, motif: this.TECH_MANDAT_ACTEURS[type] + ' inconnu.' };
    var ib = this.ibanControle(o.iban); if (!ib.ok) return { ok: false, champ: 'iban', motif: ib.motif };
    var bic = this.bicControle(o.bic); if (!bic.ok) return { ok: false, champ: 'bic', motif: bic.motif };
    var tit = String(o.titulaire || '').trim();
    if (tit.length < 3) return { ok: false, champ: 'titulaire', motif: 'Indique le titulaire du compte, tel qu\'il figure sur le RIB.' };
    if (o.signature !== true) return { ok: false, champ: 'signature', motif: 'Le mandat doit être signé : c\'est lui qui autorise le prélèvement.' };
    var R = this.techRef(), M = R.mandats || {};
    var typeM = M[o.typeMandat] ? o.typeMandat : (R.paiement.mandatDefaut || 'B2B');
    var regle = M[typeM] || {};
    /* LA RUM — référence unique du mandat. Dérivée de l'acteur : rejouer la signature ne fabrique pas un second
       mandat pour le même compte, et la banque retrouve le nôtre dans son enregistrement. */
    var rum = 'PEC-' + String(type).slice(0, 3).toUpperCase() + '-' + String(id).replace(/[^A-Za-z0-9]/g, '');
    var mdt = { rum: rum, type: typeM, typeLbl: regle.libelle || typeM, iban: ib.valeur, ibanMasque: this.ibanMasque(ib.valeur),
      bic: bic.valeur, titulaire: tit, ics: R.paiement.ics || null, statut: 'actif', signeLe: Date.now(), signePar: par || id,
      premierPrelevement: null, enregistrementBanqueDebiteur: !!regle.enregistrementBanqueDebiteur, mention: regle.mention || null };
    var maj = (type === 'marchand') ? this._techMarchandMaj(id, { sepa: mdt }) : this._techRevendeurMaj(id, { sepa: mdt });
    if (!maj) return this._refusEcriture('La signature du mandat');
    this._journal('tech_mandat_sepa_signe', id, { acteur: type, rum: rum, typeMandat: typeM, iban: mdt.ibanMasque, bic: mdt.bic, par: mdt.signePar });
    return { ok: true, mandat: mdt };
  },
  techSepaMandatRevoquer: function (type, id, par) {
    var mdt = this.techSepaMandat(type, id); if (!mdt) return { ok: false, motif: 'Aucun mandat actif.' };
    var m2 = Object.assign({}, mdt, { statut: 'revoque', revoqueLe: Date.now(), revoquePar: par || id });
    var maj = (type === 'marchand') ? this._techMarchandMaj(id, { sepa: m2 }) : this._techRevendeurMaj(id, { sepa: m2 });
    if (!maj) return this._refusEcriture('La révocation du mandat');
    this._journal('tech_mandat_sepa_revoque', id, { acteur: type, rum: mdt.rum, par: m2.revoquePar });
    return { ok: true };
  },
  _techRevendeurMaj: function (id, patch) {
    var l = this.techRevendeursGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === id) i = k;
    if (i < 0) return false;
    Object.assign(l[i], patch);
    return this._techRevendeursPut(l);
  },
  /* ══ (23/09, nuit — grossiste) UN COMMERCE, UNE VÉRITÉ : LE POINT DÉCIDE, SA FICHE DE VENTE SUIT ══════════════════
     Deux fiches décrivent le même commerce : le POINT (`partenaire`, né du protocole de compte — dossier au coffre,
     contrat de distribution, activation par le manager) et sa FICHE DE VENTE dans le réseau des marques
     (`techRevendeur` — celle que connaissent la vente d'un bon, le mandat SEPA, le compte d'avance, la carte du réseau).
     Rien ne les reliait : un point activé restait « en attente » côté vente, la carte du manager ne le montrait pas, et
     seule une page ouverte côté partenaire rattrapait l'écart. Désormais CHAQUE geste sur le point la fait suivre ici :
     elle naît avec le point, se valide à l'activation, se suspend avec lui, lui est rendue à la réactivation. Une
     suspension pour IMPAYÉ, elle, appartient à la fiche de vente : aucun geste sur le point ne la lève — seule la
     régularisation (techRevendeurRegulariser) le fait. */
  techRevendeurDuPoint: function (pointId) {
    var pt = this.partenaire(pointId); if (!pt) return null;
    var l = this.techRevendeursGet(), siret = String(pt.siret || '').replace(/\D/g, '');
    return l.filter(function (r) { return r.partenaireId === pt.id; })[0]
      || (siret ? l.filter(function (r) { return String(r.siret || '').replace(/\D/g, '') === siret; })[0] : null) || null;
  },
  techRevendeurSuivrePoint: function (pointId, par) { return this._revendeurSuitPoint(pointId, par); },
  _revendeurImpaye: function (r) { return !!r && r.statut === 'suspended' && /^Prélèvement impayé/.test(String(r.suspenduMotif || '')); },
  /* (24/09, nuit) l'identifiant du compte du gérant d'un point : c'est sous lui que sont posées ses acceptations */
  _partenaireIdentifiant: function (pointId) {
    var c = (this.comptesTous('partenaire') || []).filter(function (x) { return x.refId === pointId; })[0];
    return c ? c.identifiant : null;
  },
  _revendeurSuitPoint: function (pointId, par) {
    var pt = this.partenaire(pointId); if (!pt) return null;
    var r = this.techRevendeurDuPoint(pointId);
    if (!r) {
      if (!pt.siret || !pt.email) return null;   // un point sans identité légale n'a pas encore de fiche de vente
      var cgu = (((this.ref || {}).documents || {}).partenaire || []).filter(function (d) { return d.cle === 'cgu-partenaire'; })[0] || null;
      var c = this.techRevendeurCreer({ raisonSociale: pt.raisonSociale || pt.enseigne, siret: pt.siret, email: pt.email, tel: pt.tel,
        mode: this.partenaireMode(pt), ville: pt.ville, adresse: pt.adresse, cgu: true, cguVersion: cgu ? cgu.version : null });
      if (!c.ok) return null;
      r = c.revendeur;
    }
    var patch = { partenaireId: pt.id, mode: this.partenaireMode(pt) }, impaye = this._revendeurImpaye(r);
    if (pt.statut === 'actif') {
      if (r.statut === 'pending' || (r.statut === 'suspended' && !impaye)) Object.assign(patch, { statut: 'validated', valideLe: r.valideLe || Date.now(), validePar: pt.activePar || par || 'manager', suspenduLe: null, suspenduMotif: null });   // c'est l'activation du point qui la valide, pas l'écran qui la constate
    } else if (pt.statut === 'suspendu' || pt.statut === 'clos' || pt.statut === 'refuse') {
      if (r.statut !== 'suspended') Object.assign(patch, { statut: 'suspended', suspenduLe: Date.now(),
        suspenduMotif: pt.statut === 'clos' ? 'Contrat de distribution résilié' : pt.statut === 'refuse' ? 'Relation commerciale refusée' : 'Point suspendu — ' + (pt.motifSuspension || 'motif non précisé') });
    } else if (r.statut === 'validated' || (r.statut === 'suspended' && !impaye)) {
      Object.assign(patch, { statut: 'pending', suspenduLe: null, suspenduMotif: null });   // contrat à signer ou en intégration : la vente attend l'activation
    }
    /* (23/09, nuit) ON N'ÉCRIT QUE CE QUI CHANGE. Chaque écriture réveille les écrans (pec-bus), et la garde de l'app
       partenaire rappelle cette fonction à chaque réveil : une écriture inconditionnelle relançait l'écran, qui
       réécrivait, qui le relançait — une boucle qui figeait la page (et le banc avec elle). Idempotente, elle s'arrête. */
    var change = Object.keys(patch).some(function (k) { return (r[k] == null ? null : r[k]) !== (patch[k] == null ? null : patch[k]); });
    if (!change) return r;
    var avant = r.statut;
    if (!this._techRevendeurMaj(r.id, patch)) return null;
    if (patch.statut && patch.statut !== avant) this._journal('tech_revendeur_statut', r.id, { point: pt.id, statut: patch.statut, motif: patch.suspenduMotif || null, par: par || 'manager' });
    return this.techRevendeur(r.id);
  },
  /* LA RÉGULARISATION LÈVE LA SUSPENSION POUR IMPAYÉ — et elle seule : plus aucun prélèvement impayé au compte du point.
     Elle se fait d'elle-même quand un retour bancaire rapporte le prélèvement représenté comme payé (décision du 24/09 :
     appel noté, puis représentation — aucun autre chemin de règlement n'est ouvert). Le point retrouve alors SON état. */
  techRevendeurRegulariser: function (revendeurId, par) {
    var r = this.techRevendeur(revendeurId); if (!r) return { ok: false, motif: 'Point de vente inconnu.' };
    if (!this._revendeurImpaye(r)) return { ok: false, motif: 'Ce point n\'est pas suspendu pour impayé.' };
    var enc = this.techEncours(r.id);
    if (enc.impayes > 0 || enc.prelevementsImpayes > 0) { var nP = enc.prelevementsImpayes || 1;
      return { ok: false, motif: 'Il reste ' + nP + ' prélèvement' + (nP > 1 ? 's' : '') + ' impayé' + (nP > 1 ? 's' : '') + (enc.impayes ? ' (' + enc.impayes + ' bon' + (enc.impayes > 1 ? 's' : '') + ', ' + this.eur(enc.impayeMontant) + ')' : '') + ' : la suspension tient tant qu\'ils ne sont pas réglés.' }; }
    if (!this._techRevendeurMaj(r.id, { statut: 'validated', suspenduLe: null, suspenduMotif: null, regulariseLe: Date.now(), regularisePar: par || 'manager' })) return this._refusEcriture('La régularisation');
    this._journal('tech_revendeur_regularise', r.id, { par: par || 'manager' });
    if (r.partenaireId) this._revendeurSuitPoint(r.partenaireId, par);
    return { ok: true, revendeur: this.techRevendeur(r.id) };
  },

  /* ══ (23/09) LE COMPTE D'AVANCE DU COMMISSIONNAIRE — « avance pour micro » ══════════════════════════════════
     Un solde ne se stocke pas : il se DÉRIVE de ses mouvements. Écrire un nombre quelque part et le corriger à
     chaque geste, c'est fabriquer un solde que rien n'explique — et un solde qu'on ne peut pas justifier ligne à
     ligne est un solde faux le jour où quelqu'un le conteste. Ici : la garantie, les recharges constatées, les
     achats de bons, les remboursements d'annulation, la restitution finale. Le solde est leur somme, et il se
     recalcule à chaque lecture. Miroir SQL : tech_advance_movements. ══ */
  /* (24/09, soir — relecture juridique) le nomade ne nous « achète » pas le bon : il le vend pour notre compte, et sa valeur s'impute sur son paiement anticipé */
  AVANCE_TYPES: { garantie: 'Dépôt de garantie', recharge: 'Versement d’avance', achat: 'Bon édité (imputé sur l’avance)',
    remboursement: 'Remboursement (vente annulée)', restitution: 'Restitution de la garantie' },
  avanceMouvementsGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-avances') || '[]') || []; } catch (e) { return []; } },
  _avanceMouvementsPut: function (l) { if (!this._ecrit('pec-tech-avances', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  avanceMouvements: function (type, id) {
    return this.avanceMouvementsGet().filter(function (m) { return m.acteurType === type && m.acteurId === id; })
      .sort(function (a, b) { return b.at - a.at; });
  },
  /* LE SOLDE, DÉRIVÉ. `garantie` est à part : elle n'est PAS disponible pour acheter des bons — c'est un dépôt,
     pas une avance de trésorerie, et les confondre reviendrait à laisser vendre sur la garantie. */
  avanceSolde: function (type, id) {
    var mv = this.avanceMouvements(type, id), r2 = function (x) { return Math.round(x * 100) / 100; };
    var A = this.techRef().avance, solde = 0, garantie = 0;
    mv.forEach(function (m) {
      if (m.type === 'garantie') garantie = r2(garantie + m.montant);
      else if (m.type === 'restitution') garantie = r2(garantie + m.montant);
      else solde = r2(solde + m.montant);
    });
    return { solde: r2(solde), garantie: r2(garantie), garantieDue: +A.garantie,
      garantieVersee: garantie >= +A.garantie && +A.garantie > 0,
      bas: +A.soldeAlerte > 0 && solde < +A.soldeAlerte, mouvements: mv.length };
  },
  _avanceEcrire: function (type, id, mtype, montant, o) {
    o = o || {};
    var l = this.avanceMouvementsGet();
    var seq = this._seq('tech-avances', this._seqPlancher(l, '^AVC-0*(\\d+)$', 'reference'));
    if (seq == null) return null;
    var m = { reference: 'AVC-' + String(seq).padStart(6, '0'), acteurType: type, acteurId: id, acteur: o.acteur || null,
      type: mtype, montant: Math.round(montant * 100) / 100, motif: o.motif || null, source: o.source || null,
      at: Date.now(), par: o.par || null };
    l.unshift(m);
    if (!this._avanceMouvementsPut(l)) return null;
    this._journal('avance_mouvement', m.reference, { acteur: type + ':' + id, type: mtype, montant: m.montant,
      motif: m.motif, source: m.source, par: m.par });
    return m;
  },
  /* LA GARANTIE — versée une fois, à l'entrée. Elle n'ouvre pas la vente à elle seule : il faut aussi du solde. */
  avanceGarantieVerser: function (type, id, o) {
    o = o || {};
    var A = this.techRef().avance, et = this.avanceSolde(type, id);
    if (!(+A.garantie > 0)) return { ok: false, motif: 'Aucune garantie n\'est demandée — le réglage est à zéro.' };
    if (et.garantieVersee) return { ok: false, motif: 'La garantie est déjà versée (' + this.eur(et.garantie) + ').' };
    var m = this._avanceEcrire(type, id, 'garantie', +A.garantie - et.garantie,
      { par: o.par, acteur: o.acteur, motif: 'Dépôt de garantie versé à l\'entrée dans le réseau', source: o.reference || null });
    if (!m) return this._refusEcriture('Le versement de la garantie');
    return { ok: true, mouvement: m, etat: this.avanceSolde(type, id) };
  },
  /* LA RESTITUTION — intégrale, sur décompte écrit. Elle n'est JAMAIS une sanction : retenir la garantie pour
     punir un manquement ferait la preuve d'un pouvoir disciplinaire, donc d'un lien de subordination. */
  avanceGarantieRestituer: function (type, id, o) {
    o = o || {};
    var et = this.avanceSolde(type, id);
    if (!(et.garantie > 0)) return { ok: false, motif: 'Aucune garantie à restituer.' };
    var motif = String(o.motif || '').trim();
    if (motif.length < 3) return { ok: false, champ: 'motif', motif: 'Une restitution se motive : fin de contrat, retrait du réseau…' };
    var m = this._avanceEcrire(type, id, 'restitution', -et.garantie, { par: o.par, acteur: o.acteur, motif: motif });
    if (!m) return this._refusEcriture('La restitution de la garantie');
    return { ok: true, mouvement: m, montant: et.garantie, etat: this.avanceSolde(type, id) };
  },
  /* LA RECHARGE — le commissionnaire vire, le manager CONSTATE l'arrivée des fonds. On ne crédite jamais un solde
     sur une intention : tant que l'argent n'est pas là, il n'est pas là. La référence du virement est la preuve. */
  avanceRecharger: function (type, id, montant, o) {
    o = o || {};
    var A = this.techRef().avance;
    var n = Math.round((+String(montant == null ? '' : montant).replace(',', '.') || 0) * 100) / 100;
    if (!(n > 0)) return { ok: false, champ: 'montant', motif: 'Indique le montant reçu.' };
    if (+A.rechargeMin > 0 && n < +A.rechargeMin) return { ok: false, champ: 'montant', motif: 'La recharge minimum est de ' + this.eur(A.rechargeMin) + '.' };
    if (+A.rechargeMax > 0 && n > +A.rechargeMax) return { ok: false, champ: 'montant', motif: 'Au-delà de ' + this.eur(A.rechargeMax) + ', la recharge se traite au cas par cas — contacte-nous.' };
    var ref = String(o.reference || '').trim();
    if (ref.length < 3) return { ok: false, champ: 'reference', motif: 'Indique la référence du virement reçu : c\'est elle qui rattache l\'argent au compte.' };
    var m = this._avanceEcrire(type, id, 'recharge', n, { par: o.par, acteur: o.acteur, source: ref,
      motif: 'Virement reçu · ' + ref });
    if (!m) return this._refusEcriture('La recharge');
    return { ok: true, mouvement: m, etat: this.avanceSolde(type, id) };
  },
  /* LE DÉBIT D'UNE VENTE — appelé par l'émission, jamais par un écran. Pas de solde, pas de bon : c'est toute la
     différence avec le prélèvement du commerce sédentaire, où le bon naît d'abord et le débit suit. */
  /* LE CONTRÔLE SEUL — même règle que le débit, mais il n'écrit rien : l'écran s'en sert AVANT la vente. */
  _avanceControle: function (type, id, montant) {
    var et = this.avanceSolde(type, id), A = this.techRef().avance;
    if (+A.garantie > 0 && !et.garantieVersee) {
      return { ok: false, refus: 'garantie', motif: 'Verse d\'abord ta garantie de ' + this.eur(A.garantie) + ' : elle est restituée intégralement quand tu quittes le réseau.', etat: et };
    }
    var n = Math.round((montant || 0) * 100) / 100;
    if (n > 0 && et.solde < n) {
      return { ok: false, refus: 'solde', motif: 'Avance insuffisante : il te reste ' + this.eur(et.solde) + ' d’avance et ce bon t’en coûte ' + this.eur(n) + '. Fais un virement d’avance avant de vendre.', etat: et };
    }
    return { ok: true, etat: et };
  },
  _avanceDebiter: function (type, id, montant, o) {
    o = o || {};
    var et = this.avanceSolde(type, id), A = this.techRef().avance;
    if (+A.garantie > 0 && !et.garantieVersee) {
      return { ok: false, refus: 'garantie', motif: 'Verse d\'abord ta garantie de ' + this.eur(A.garantie) + ' : elle est restituée intégralement quand tu quittes le réseau.' };
    }
    var n = Math.round(montant * 100) / 100;
    if (et.solde < n) {
      return { ok: false, refus: 'solde', motif: 'Avance insuffisante : il te reste ' + this.eur(et.solde) + ' d’avance et ce bon t’en coûte ' + this.eur(n) + '. Fais un virement d’avance avant de vendre.', etat: et };
    }
    var m = this._avanceEcrire(type, id, 'achat', -n, { par: o.par, acteur: o.acteur, motif: o.motif || 'Bon édité — imputé sur le paiement anticipé', source: o.source || null });
    if (!m) return this._refusEcriture('Le débit de l\'avance');
    return { ok: true, mouvement: m, etat: this.avanceSolde(type, id) };
  },
  _avanceCrediter: function (type, id, montant, o) {
    o = o || {};
    var m = this._avanceEcrire(type, id, 'remboursement', Math.round(montant * 100) / 100,
      { par: o.par, acteur: o.acteur, motif: o.motif || 'Vente annulée', source: o.source || null });
    return m ? { ok: true, mouvement: m, etat: this.avanceSolde(type, id) } : this._refusEcriture('Le remboursement');
  },
  /* CE QUE PAIE UN ACTEUR : l'avance s'il est MOBILE, le prélèvement SEPA s'il est sédentaire. Une seule règle,
     lue par l'écran avant la vente et par l'émission au moment de la vente. */
  techPaieParAvance: function (r) {
    r = (typeof r === 'string') ? this.techRevendeur(r) : r;
    return !!(r && r.mode === 'mobile');
  },

  /* ══ LES VENTES — une ligne par bon vendu, figée au comptoir, qui attend son prélèvement ═════════════════════
     Elle porte les quatre nombres, l'offre de la marque au moment de la vente, et deux états qui ne se confondent
     pas : ce que le POINT nous doit (`statut`) et ce que nous devons à la MARQUE (`marqueStatut`). ══ */
  TECH_VENTE_STATUTS: { a_prelever: ['À prélever', 'pec-pill--wait'], en_prelevement: ['Prélèvement remis', 'pec-pill--info'],
    regle: ['Réglé', 'pec-pill--done'], impaye: ['IMPAYÉ', 'pec-pill--off'], annulee: ['Annulée', 'pec-pill--off'] },
  /* (23/09, soir) LES MOTS DU GROSSISTE : nous DEVONS puis nous PAYONS la marque — jamais « régler ». */
  TECH_MARQUE_STATUTS: { a_payer: ['Nous te devons', 'pec-pill--wait'], paye: ['Payée', 'pec-pill--done'], annule: ['Annulée', 'pec-pill--off'] },
  techVenteStatutLbl: function (s) { return (this.TECH_VENTE_STATUTS[s] || [s || '—'])[0]; },
  techVenteStatutPill: function (s) { return (this.TECH_VENTE_STATUTS[s] || ['', ''])[1]; },
  techVentesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-ventes') || '[]') || []; } catch (e) { return []; } },
  _techVentesPut: function (l) { if (!this._ecrit('pec-tech-ventes', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techVente: function (ref) { return this.techVentesGet().filter(function (x) { return x.reference === ref; })[0] || null; },
  techVentes: function (o) {
    o = o || {}; var b = null;
    if (o.mois && /^\d{4}-\d{2}$/.test(o.mois)) { var an = +o.mois.slice(0, 4), mo = +o.mois.slice(5, 7) - 1; b = [new Date(an, mo, 1).getTime(), new Date(an, mo + 1, 1).getTime()]; }
    return this.techVentesGet().filter(function (x) {
      if (o.marchandId && x.marchandId !== o.marchandId) return false;
      if (o.revendeurId && x.revendeurId !== o.revendeurId) return false;
      if (o.statut && x.statut !== o.statut) return false;
      if (o.marqueStatut && x.marqueStatut !== o.marqueStatut) return false;
      if (o.modeId && x.modeId !== o.modeId) return false;
      if (o.remise && x.remiseRef !== o.remise) return false;
      if (b && !(x.at >= b[0] && x.at < b[1])) return false;
      return true;
    }).sort(function (a, c) { return c.at - a.at; });
  },
  /* CE QU'UN POINT NOUS DOIT à cet instant — vendu, pas encore réglé. C'est lui qu'on borne : en offre « 24 h »
     nous payons la marque avant que le prélèvement ne soit définitif, et un point qui vend sans jamais être
     débité serait une perte sèche. Plafond réglable en Configuration. */
  techEncours: function (revendeurId) {
    var l = this.techVentes({ revendeurId: revendeurId }), r2 = function (x) { return Math.round(x * 100) / 100; };
    var du = l.filter(function (x) { return x.statut === 'a_prelever' || x.statut === 'en_prelevement'; });
    var imp = l.filter(function (x) { return x.statut === 'impaye'; });
    var P = this.techRef().paiement;
    var montant = r2(du.reduce(function (a, x) { return a + x.prixPoint; }, 0));
    /* (24/09, soir) UN PRÉLÈVEMENT N'EST PAS UN BON : un arrêté prélève tous les bons du point en UNE ligne de remise.
       `impayes` compte les bons revenus impayés ; `prelevementsImpayes` compte les lignes revenues impayées et pas
       encore représentées — c'est lui que lit le seuil de suspension (« N impayé(s) avant suspension », manager 10). */
    var lignes = 0;
    this.techRemisesGet().forEach(function (rm) { (rm.lignes || []).forEach(function (li) {
      if (li.debiteurType === 'revendeur' && li.debiteurId === revendeurId && li.statut === 'impaye' && !li.represente) lignes++;
    }); });
    return { montant: montant, ventes: du.length, plafond: +P.encoursMaxPoint,
      reste: r2(P.encoursMaxPoint - montant), depasse: montant > +P.encoursMaxPoint,
      impayes: imp.length, prelevementsImpayes: lignes, impayeMontant: r2(imp.reduce(function (a, x) { return a + x.prixPoint; }, 0)) };
  },
  /* CE QUI BLOQUE UNE VENTE, dans l'ordre où il faut le régler — une seule règle, lue par l'écran du comptoir
     AVANT la vente et par `techBonEmettre` au moment de la vente. Deux endroits, jamais deux règles. */
  techPeutVendre: function (revendeurId, marchandId, montant) {
    var r = this.techRevendeur(revendeurId);
    if (!r) return { ok: false, refus: 'revendeur', motif: 'Point de vente inconnu.' };
    if (r.statut === 'suspended') return { ok: false, refus: 'suspendu', motif: this._revendeurImpaye(r)
      ? 'Ton point est suspendu après un prélèvement impayé : régularise-le auprès de nous pour revendre.'
      : 'Ton point est suspendu' + (r.suspenduMotif ? ' — ' + r.suspenduMotif : '') + '.' };
    if (r.statut !== 'validated') return { ok: false, refus: 'non_valide', motif: 'Ton compte n\'est pas encore validé — la vente s\'ouvre après notre vérification.' };
    /* (24/09, nuit) LES DOCUMENTS EN VIGUEUR : une nouvelle version se présente à la connexion suivante (CGU partenaire) et, tant
       qu'elle n'est pas reconnue (lue, et acceptée si elle s'accepte), la vente attend — comme Mes bons, qui ne range aucun bon
       avant. Une fiche de vente sans compte de gérant n'a personne pour lire : elle n'est pas concernée. */
    var idcP = r.partenaireId ? this._partenaireIdentifiant(r.partenaireId) : null;
    var docsP = idcP ? this.acceptationsRequises('partenaire', idcP) : [];
    if (docsP.length) return { ok: false, refus: 'documents', documents: docsP, motif: 'Lis ' + (docsP.length > 1 ? 'les documents en vigueur' : 'le document en vigueur')
      + ' (' + docsP.map(function (d) { return d.titre; }).join(', ') + ') dans Mon point : la vente reprend dès que c\'est fait.' };
    var m = Math.round((+String(montant == null ? '' : montant).replace(',', '.') || 0) * 100) / 100;
    /* ══ (23/09, arbitrage fondatrice) DEUX RÉSEAUX, DEUX PORTES ══════════════════════════════════════════════
       LE COMMISSIONNAIRE MOBILE paie d'AVANCE : sa garantie, puis son solde. Le contrôle porte sur ce qu'il a
       déjà versé, pas sur ce qu'il devra — il n'y a donc ni mandat, ni encours, ni impayé possible de son côté.
       LE COMMERCE SÉDENTAIRE vend d'abord et nous le prélevons ensuite : mandat SEPA, aucun impayé en cours,
       encours sous plafond. Une seule fonction porte les deux règles : c'est elle que l'écran lit avant la vente
       et que l'émission applique au moment de la vente. ══ */
    if (this.techPaieParAvance(r)) {
      var mq = marchandId ? this.techMarchand(marchandId) : null;
      var pr = m > 0 ? this.techRepartition(m, { mode: this.techMarchandMode(mq) }).prixPoint : 0;
      var av = this._avanceControle('revendeur', r.id, pr);
      if (!av.ok) return av;
      return { ok: true, parAvance: true, avance: av.etat, aDebiter: pr };
    }
    var mdt = this.techSepaMandat('revendeur', r.id);
    if (!mdt) return { ok: false, refus: 'mandat', motif: 'Signe ton mandat de prélèvement SEPA : c\'est lui qui nous autorise à te débiter des bons que tu vends.' };
    var enc = this.techEncours(r.id);
    if (enc.impayes > 0) return { ok: false, refus: 'impaye', motif: 'Un prélèvement est revenu impayé (' + this.eur(enc.impayeMontant) + ') : régularise-le avant de revendre.', encours: enc };
    if (m > 0 && enc.montant + m > enc.plafond) {
      return { ok: false, refus: 'encours', motif: 'Cette vente porterait ton encours à ' + this.eur(enc.montant + m) + ', au-delà de ton plafond de ' + this.eur(enc.plafond) + ' : il redescend à chaque prélèvement réglé.', encours: enc };
    }
    return { ok: true, encours: enc, mandat: mdt };
  },
  /* LA VENTE — appelée par techBonEmettre, jamais par un écran : le bon et la ligne à prélever naissent ensemble
     ou pas du tout. Aucun argent ne bouge ici : le débit part au prochain arrêté, dans la remise de prélèvements. */
  _techVenteEnregistrer: function (r, m, montant, o) {
    o = o || {};
    var mode = this.techMarchandMode(m);
    var d = this.techRepartition(montant, { mode: mode });
    if (!d.valide) return { ok: false, motif: 'montant', message: 'Répartition impossible sur ce montant : rien ne reviendrait à la marque.' };
    var l = this.techVentesGet();
    var seq = this._seq('tech-ventes', this._seqPlancher(l, '^VNT-0*(\\d+)$', 'reference'));
    if (seq == null) return this._refusEcriture('L\'enregistrement de la vente');
    var mdt = this.techSepaMandat('revendeur', r.id);
    /* (23/09) LE COMMISSIONNAIRE MOBILE PAIE MAINTENANT. Son solde est débité AVANT que la vente n'existe : si le
       débit échoue, il n'y a ni vente ni bon. Sa vente naît donc RÉGLÉE — elle n'entrera dans aucune remise, et
       elle ne peut pas revenir impayée. C'est tout l'intérêt de l'avance, et c'est ce que le statut doit dire. */
    var parAvance = this.techPaieParAvance(r), debit = null;
    if (parAvance) {
      debit = this._avanceDebiter('revendeur', r.id, d.prixPoint, { par: o.par || r.id, acteur: r.raisonSociale,
        motif: 'Achat d\'un bon ' + m.raisonSociale + ' (' + this.eur(d.montant) + ')' });
      if (!debit.ok) return { ok: false, motif: debit.refus || 'solde', message: debit.motif };
    }
    var v = { reference: 'VNT-' + String(seq).padStart(6, '0'), marchandId: m.id, marchand: m.raisonSociale,
      revendeurId: r.id, revendeur: r.raisonSociale,
      montant: d.montant, modeId: d.modeId, modeLbl: d.modeLbl,
      remisePct: d.remisePct, remise: d.remise, prixMarque: d.prixMarque,
      partPointPct: d.partPointPct, partPoint: d.partPoint, prixPoint: d.prixPoint, marge: d.marge,
      paiement: parAvance ? 'avance' : 'sepa',
      statut: parAvance ? 'regle' : 'a_prelever', remiseRef: null, echeancePrelevement: null,
      avanceRef: debit ? debit.mouvement.reference : null,
      /* (23/09, audit) L'ÉCHÉANCE DE LA MARQUE SE POSE ICI QUAND LA VENTE EST PAYÉE D'AVANCE. Pour le commerce
         sédentaire, elle se pose à l'arrêté du soir — c'est lui qui fait courir le délai. Mais la vente d'un
         commissionnaire mobile n'entre dans AUCUN arrêté : sans cette ligne, son échéance restait nulle, la marque
         n'était jamais réclamée pour ces bons-là, et l'argent nous restait. C'est le défaut qu'a trouvé l'audit du
         23/09 : un écran qui affiche « rien en attente » alors qu'on doit 113,40 € ne se voit pas, il se calcule. */
      marqueStatut: 'a_payer',
      echeanceMarque: parAvance ? this.techModeEcheance(mode, Date.now()).getTime() : null,
      reglementRef: null,
      rum: mdt ? mdt.rum : null, bon: null, at: Date.now(), par: o.par || r.id };
    l.unshift(v);
    if (!this._techVentesPut(l)) return this._refusEcriture('L\'enregistrement de la vente');
    this._journal('tech_vente', v.reference, { marchand: m.id, revendeur: r.id, montant: d.montant, mode: d.modeId,
      prixPoint: d.prixPoint, prixMarque: d.prixMarque, marge: d.marge, paiement: v.paiement, rum: v.rum,
      avance: v.avanceRef, par: v.par });
    return { ok: true, vente: v };
  },
  _techVenteLier: function (ref, bonId) {
    var l = this.techVentesGet(), x = l.filter(function (y) { return y.reference === ref; })[0];
    if (!x) return false; x.bon = bonId; return this._techVentesPut(l);
  },
  _techVenteMaj: function (refs, patch) {
    var set = {}; [].concat(refs).forEach(function (r) { set[r] = true; });
    var l = this.techVentesGet(), n = 0;
    l.forEach(function (x) { if (set[x.reference]) { Object.assign(x, typeof patch === 'function' ? patch(x) : patch); n++; } });
    return this._techVentesPut(l) ? n : 0;
  },
  /* LES TOTAUX — sommés des ventes, jamais recalculés depuis un taux d'aujourd'hui. */
  techVentesTotaux: function (o) {
    var l = this.techVentes(o), r2 = function (x) { return Math.round(x * 100) / 100; };
    var vives = l.filter(function (x) { return x.statut !== 'annulee'; });
    var som = function (ll, k) { return r2(ll.reduce(function (a, x) { return a + (x[k] || 0); }, 0)); };
    return { ventes: vives.length, annulees: l.length - vives.length,
      valeur: som(vives, 'montant'), prixPoint: som(vives, 'prixPoint'), prixMarque: som(vives, 'prixMarque'), marge: som(vives, 'marge'),
      regle: som(vives.filter(function (x) { return x.statut === 'regle'; }), 'prixPoint'),
      attente: som(vives.filter(function (x) { return x.statut === 'a_prelever' || x.statut === 'en_prelevement'; }), 'prixPoint'),
      impaye: som(vives.filter(function (x) { return x.statut === 'impaye'; }), 'prixPoint'),
      duMarque: som(vives.filter(function (x) { return x.marqueStatut === 'a_payer'; }), 'prixMarque') };
  },

  /* ══ L'ARRÊTÉ — « vérifier tous les bons d'achat vendus de 20:00 à 20:00 » (fondatrice, 22/09) ══════════════
     Une fenêtre se ferme à l'heure dite ; la suivante s'ouvre au même instant. L'offre de la marque commande la
     CADENCE : tous les jours pour « 24 heures », tous les sept jours pour « 7 jours ouvrés », tous les dix pour
     « 10 jours ». Ce qui décide qu'un arrêté est DÛ n'est pas une date écrite quelque part, c'est la dernière
     remise déposée pour cette offre — rien ne se rejoue, rien ne se saute. ══ */
  _techArreteHeure: function () {
    var h = String((this.techRef().paiement || {}).arreteHeure || '20:00').split(':');
    return { h: Math.min(23, Math.max(0, parseInt(h[0], 10) || 0)), m: Math.min(59, Math.max(0, parseInt(h[1], 10) || 0)) };
  },
  /* LE DERNIER ARRÊTÉ PASSÉ : aujourd'hui à l'heure dite si elle est passée, sinon celui d'hier. */
  techDernierArrete: function (now) {
    var A = this._techArreteHeure(), d = new Date(now == null ? Date.now() : now);
    var a = new Date(d.getFullYear(), d.getMonth(), d.getDate(), A.h, A.m, 0, 0);
    if (a.getTime() > d.getTime()) a.setDate(a.getDate() - 1);
    return a.getTime();
  },
  techArrete: function (modeId, o) {
    o = o || {};
    var mode = this.techMode(modeId), self = this, R = this.techRef(), P = R.paiement;
    var now = o.now == null ? Date.now() : o.now;
    var fin = o.fin == null ? this.techDernierArrete(now) : o.fin;
    var prec = this.techRemises({ modeId: mode.id, deposees: true })[0] || null;
    var debut = prec ? prec.fin : fin - mode.cadenceJours * 86400000;
    /* TOUT CE QUI ATTEND ET QUI EST ANTÉRIEUR À L'ARRÊTÉ — pas seulement la fenêtre : une vente qu'un arrêté
       manqué aurait laissée derrière doit partir au suivant, jamais rester au fond du tiroir. */
    var marques = {}; this.techMarchandsGet().forEach(function (m) { if (self.techMarchandMode(m).id === mode.id) marques[m.id] = true; });
    var attente = this.techVentes({ statut: 'a_prelever' }).filter(function (v) { return marques[v.marchandId]; });
    var ventes = attente.filter(function (v) { return v.at < fin; });
    /* CE QUI S'ACCUMULE DANS LA FENÊTRE OUVERTE — vendu APRÈS le dernier arrêté, donc pas encore prélevable.
       L'écran du manager le montre à côté de ce qui est dû : un tableau à zéro un après-midi de vente n'est
       pas une panne, c'est l'heure qui n'est pas venue — encore faut-il le dire. */
    var enCours = attente.filter(function (v) { return v.at >= fin; });
    var retard = ventes.filter(function (v) { return v.at < debut; }).length;
    var ecart = fin - (prec ? prec.fin : 0);
    var du = ventes.length > 0 && (!prec || ecart >= (mode.cadenceJours * 86400000) - 3600000);
    var points = {}, r2 = function (x) { return Math.round(x * 100) / 100; };
    ventes.forEach(function (v) {
      var p = points[v.revendeurId] || (points[v.revendeurId] = { revendeurId: v.revendeurId, revendeur: v.revendeur, ventes: [], montant: 0 });
      p.ventes.push(v.reference); p.montant = r2(p.montant + v.prixPoint);
    });
    return { mode: mode, debut: debut, fin: fin, du: du, prochain: prec ? prec.fin + mode.cadenceJours * 86400000 : fin,
      ventes: ventes, enRetard: retard, points: Object.keys(points).map(function (k) { return points[k]; }),
      enCours: enCours.length, enCoursTotal: r2(enCours.reduce(function (a, v) { return a + v.prixPoint; }, 0)),
      prochaineFin: fin + mode.cadenceJours * 86400000,
      total: r2(ventes.reduce(function (a, v) { return a + v.prixPoint; }, 0)),
      depotAvant: null, precedente: prec ? prec.reference : null,
      echeance: this.ajouterJoursOuvres(now, +P.remiseJoursOuvresAvant).getTime() };
  },

  /* ══ LES PÉNALITÉS — ce que le contrat met à la charge du point quand son prélèvement revient impayé.
     Le montant et le coût d'une représentation se règlent en Configuration ; ils se prélèvent sur la remise
     suivante, jamais par un geste à part : un débiteur, un mandat, un débit. ══ */
  techPenalitesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-penalites') || '[]') || []; } catch (e) { return []; } },
  _techPenalitesPut: function (l) { if (!this._ecrit('pec-tech-penalites', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techPenalites: function (o) {
    o = o || {};
    return this.techPenalitesGet().filter(function (x) {
      if (o.revendeurId && x.revendeurId !== o.revendeurId) return false;
      if (o.statut && x.statut !== o.statut) return false;
      return true;
    }).sort(function (a, c) { return c.at - a.at; });
  },
  _techPenaliteCreer: function (revendeurId, montant, motif, source) {
    var m = Math.round((+montant || 0) * 100) / 100;
    if (!(m > 0)) return null;
    var l = this.techPenalitesGet();
    var seq = this._seq('tech-penalites', this._seqPlancher(l, '^PEN-0*(\\d+)$', 'reference'));
    if (seq == null) return null;
    var p = { reference: 'PEN-' + String(seq).padStart(6, '0'), revendeurId: revendeurId, montant: m, motif: motif,
      source: source || null, statut: 'a_prelever', remiseRef: null, at: Date.now() };
    l.unshift(p);
    if (!this._techPenalitesPut(l)) return null;
    this._journal('tech_penalite', p.reference, { revendeur: revendeurId, montant: m, motif: motif, source: source || null });
    return p;
  },

  /* ══ LA REMISE DE PRÉLÈVEMENTS — le fichier que nous déposons chez Crédit Mutuel ════════════════════════════
     (22/09, fondatrice : « je dépose mon fichier, j'ai les sous demain ».) Une remise = un fichier = une
     échéance. Elle groupe, par point de vente, les ventes de la fenêtre et les pénalités en attente : un
     débiteur n'est débité qu'UNE fois par remise, quel que soit le nombre de bons qu'il a vendus.
     Un point sans mandat actif n'entre pas dans le fichier : sa ligne est ÉCARTÉE et le dit — inventer un
     mandat pour faire tomber le fichier juste serait le seul vrai mensonge possible ici.
     Miroir SQL : tech_dd_files (la remise) et tech_direct_debits (ses lignes). ══ */
  TECH_REMISE_STATUTS: { prepare: ['Préparée', 'pec-pill--wait'], depose: ['Déposée', 'pec-pill--info'],
    partiel: ['Retour partiel', 'pec-pill--info'], traite: ['Traitée', 'pec-pill--done'], annulee: ['Annulée', 'pec-pill--off'] },
  TECH_LIGNE_STATUTS: { prepare: ['Préparée', 'pec-pill--wait'], depose: ['Remis à la banque', 'pec-pill--info'],
    paye: ['Payé', 'pec-pill--done'], impaye: ['IMPAYÉ', 'pec-pill--off'], ecartee: ['Écartée', 'pec-pill--off'] },
  techRemiseStatutLbl: function (s) { return (this.TECH_REMISE_STATUTS[s] || [s || '—'])[0]; },
  techRemiseStatutPill: function (s) { return (this.TECH_REMISE_STATUTS[s] || ['', ''])[1]; },
  techLigneStatutLbl: function (s) { return (this.TECH_LIGNE_STATUTS[s] || [s || '—'])[0]; },
  techLigneStatutPill: function (s) { return (this.TECH_LIGNE_STATUTS[s] || ['', ''])[1]; },
  techRemisesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-remises') || '[]') || []; } catch (e) { return []; } },
  _techRemisesPut: function (l) { if (!this._ecrit('pec-tech-remises', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techRemise: function (ref) { return this.techRemisesGet().filter(function (x) { return x.reference === ref; })[0] || null; },
  techRemises: function (o) {
    o = o || {};
    return this.techRemisesGet().filter(function (x) {
      if (o.modeId && x.modeId !== o.modeId) return false;
      if (o.nature && x.nature !== o.nature) return false;
      if (o.statut && x.statut !== o.statut) return false;
      if (o.deposees && !x.deposeLe) return false;
      return true;
    }).sort(function (a, c) { return (c.fin || c.at) - (a.fin || a.at); });
  },
  /* CE QUI EST DÛ, TOUTES OFFRES CONFONDUES — ce que lit l'écran du manager avant de préparer quoi que ce soit. */
  techArretesDus: function (o) {
    var self = this;
    return this.techModes().map(function (m) { return self.techArrete(m.id, o); });
  },
  techRemisePreparer: function (o) {
    o = o || {};
    var R = this.techRef(), P = R.paiement, self = this, r2 = function (x) { return Math.round(x * 100) / 100; };
    /* (24/09) LES ABONNEMENTS NE SE PRÉLÈVENT PLUS : ils se facturent et se débitent par carte (techAbonnementsFacturer). */
    if (o.nature === 'abonnements') return { ok: false, motif: 'L\'abonnement au logiciel se règle par carte bancaire, pas par prélèvement : la tâche du mois est techAbonnementsFacturer.' };
    var nature = 'ventes';
    var now = o.now == null ? Date.now() : o.now;
    var lignes = [], fin = null, mode = null, ventes = [];
    if (nature === 'ventes') {
      mode = this.techMode(o.modeId);
      var a = this.techArrete(mode.id, { now: now, fin: o.fin });
      if (!a.du && o.force !== true) return { ok: false, motif: a.ventes.length ? 'L\'arrêté de cette offre n\'est pas encore dû : la cadence est de ' + this.nb(mode.cadenceJours, 'jour') + ', la dernière remise date du ' + this.dateCourte(a.debut) + '.' : 'Aucune vente à prélever pour cette offre.', arrete: a };
      if (!a.ventes.length) return { ok: false, motif: 'Aucune vente à prélever pour cette offre.', arrete: a };
      fin = a.fin; ventes = a.ventes;
      a.points.forEach(function (p) {
        var pen = self.techPenalites({ revendeurId: p.revendeurId, statut: 'a_prelever' });
        lignes.push({ debiteurType: 'revendeur', debiteurId: p.revendeurId, debiteur: p.revendeur,
          ventes: p.ventes, penalites: pen.map(function (x) { return x.reference; }),
          montant: r2(p.montant + pen.reduce(function (t, x) { return t + x.montant; }, 0)) });
      });
    }
    /* LE MANDAT FAIT LE FICHIER : pas de mandat actif, pas de ligne — et on dit lequel manque. */
    lignes.forEach(function (li) {
      var mdt = self.techSepaMandat(li.debiteurType, li.debiteurId);
      if (!mdt) { li.statut = 'ecartee'; li.motif = 'Aucun mandat de prélèvement actif : rien ne peut être débité tant qu\'il n\'est pas signé.'; return; }
      li.statut = 'prepare'; li.rum = mdt.rum; li.iban = mdt.ibanMasque; li.bic = mdt.bic; li.titulaire = mdt.titulaire;
      li.sequence = mdt.premierPrelevement ? 'RCUR' : 'FRST';
      li.typeMandat = mdt.type;
    });
    var retenues = lignes.filter(function (li) { return li.statut === 'prepare'; });
    if (!retenues.length) return { ok: false, motif: 'Aucune ligne prélevable : ' + this.nb(lignes.length, 'débiteur') + ' sans mandat actif.', lignes: lignes };
    var l = this.techRemisesGet();
    var seq = this._seq('tech-remises', this._seqPlancher(l, '^RMS-0*(\\d+)$', 'reference'));
    if (seq == null) return this._refusEcriture('La remise de prélèvements');
    var rem = { reference: 'RMS-' + String(seq).padStart(6, '0'), nature: nature, modeId: mode ? mode.id : null, modeLbl: mode ? mode.libelle : 'Abonnements au logiciel',
      debut: nature === 'ventes' ? this.techArrete(mode.id, { now: now, fin: fin }).debut : null, fin: fin,
      lignes: lignes, total: r2(retenues.reduce(function (t, x) { return t + x.montant; }, 0)),
      statut: 'prepare', at: now, par: o.par || 'manager',
      depotAvant: now + (+P.depotMinutes) * 60000,
      echeance: this.ajouterJoursOuvres(now, +P.remiseJoursOuvresAvant).getTime(),
      format: P.formatRemise, ics: P.ics || null, banque: P.banque, canal: P.canal,
      cout: r2(retenues.length * (+P.coutPrelevement)), deposeLe: null, depotDansLesTemps: null, retourLe: null };
    l.unshift(rem);
    if (!this._techRemisesPut(rem ? l : l)) return this._refusEcriture('La remise de prélèvements');
    /* LES LIGNES RETENUES EMPORTENT LEURS VENTES ET LEURS PÉNALITÉS : elles ne repartiront pas dans la remise suivante. */
    var refsV = [], refsP = {};
    retenues.forEach(function (li) { refsV = refsV.concat(li.ventes || []); (li.penalites || []).forEach(function (r) { refsP[r] = true; }); });
    if (refsV.length) {
      var ech = this.techModeEcheance(mode, fin).getTime();
      this._techVenteMaj(refsV, { statut: 'en_prelevement', remiseRef: rem.reference, echeancePrelevement: rem.echeance, echeanceMarque: ech });
    }
    if (Object.keys(refsP).length) {
      var lp = this.techPenalitesGet();
      lp.forEach(function (x) { if (refsP[x.reference]) { x.statut = 'en_prelevement'; x.remiseRef = rem.reference; } });
      this._techPenalitesPut(lp);
    }
    this._journal('tech_remise_preparee', rem.reference, { nature: nature, mode: rem.modeId, lignes: retenues.length,
      ecartees: lignes.length - retenues.length, total: rem.total, ventes: refsV.length, echeance: rem.echeance, par: rem.par });
    return { ok: true, remise: rem, ecartees: lignes.filter(function (li) { return li.statut === 'ecartee'; }) };
  },
  /* LE FICHIER LUI-MÊME — pain.008.001.08 (24/09 : la version du guide EPC B2B 2025 ; LclInstrm B2B seul, adresses structurées avant le 15/11/2026), celui que CMUT Direct attend. Il ne se fabrique pas sans notre
     Identifiant Créancier SEPA : tant que la banque ne l'a pas délivré, on le dit au lieu d'en inventer un. */
  techRemiseFichier: function (ref) {
    var rem = this.techRemise(ref); if (!rem) return { ok: false, motif: 'Remise inconnue.' };
    var P = this.techRef().paiement, self = this;
    if (!P.ics) return { ok: false, motif: 'Notre Identifiant Créancier SEPA (ICS) n\'est pas renseigné : la banque le délivre à l\'ouverture du service, et aucun fichier ne part sans lui. Il se saisit dans Configuration.' };
    var lignes = (rem.lignes || []).filter(function (li) { return li.statut !== 'ecartee'; });
    var iso = function (t) { return new Date(t).toISOString().replace(/\.\d{3}Z$/, ''); };
    var jour = function (t) { return new Date(t).toISOString().slice(0, 10); };
    var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    /* LE CRÉANCIER, C'EST LA SOCIÉTÉ, pas la marque commerciale : c'est son nom qui figure au mandat et sur le
       relevé du débiteur — le voir changer d'une ligne à l'autre ferait rejeter le prélèvement. */
    var nous = (this.ref.societe && this.ref.societe.nom) || 'PayEnCash';
    var par = {};
    lignes.forEach(function (li) { (par[li.sequence] || (par[li.sequence] = [])).push(li); });
    var x = '<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08">\n  <CstmrDrctDbtInitn>\n';
    x += '    <GrpHdr>\n      <MsgId>' + esc(rem.reference) + '</MsgId>\n      <CreDtTm>' + iso(rem.at) + '</CreDtTm>\n';
    x += '      <NbOfTxs>' + lignes.length + '</NbOfTxs>\n      <CtrlSum>' + rem.total.toFixed(2) + '</CtrlSum>\n';
    x += '      <InitgPty><Nm>' + esc(nous) + '</Nm></InitgPty>\n    </GrpHdr>\n';
    Object.keys(par).forEach(function (sq, n) {
      var lot = par[sq], tot = lot.reduce(function (a, li) { return a + li.montant; }, 0);
      x += '    <PmtInf>\n      <PmtInfId>' + esc(rem.reference + '-' + sq) + '</PmtInfId>\n      <PmtMtd>DD</PmtMtd>\n';
      x += '      <NbOfTxs>' + lot.length + '</NbOfTxs>\n      <CtrlSum>' + (Math.round(tot * 100) / 100).toFixed(2) + '</CtrlSum>\n';
      x += '      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>' + esc(lot[0].typeMandat === 'B2B' ? 'B2B' : 'CORE') + '</Cd></LclInstrm><SeqTp>' + esc(sq) + '</SeqTp></PmtTpInf>\n';
      x += '      <ReqdColltnDt>' + jour(rem.echeance) + '</ReqdColltnDt>\n';
      x += '      <Cdtr><Nm>' + esc(nous) + '</Nm></Cdtr>\n';
      x += '      <CdtrAcct><Id><IBAN>' + esc(P.iban || '') + '</IBAN></Id></CdtrAcct>\n';
      x += '      <CdtrAgt><FinInstnId><BIC>' + esc(P.bic || '') + '</BIC></FinInstnId></CdtrAgt>\n';
      x += '      <CdtrSchmeId><Id><PrvtId><Othr><Id>' + esc(P.ics) + '</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId>\n';
      lot.forEach(function (li) {
        x += '      <DrctDbtTxInf>\n        <PmtId><EndToEndId>' + esc(li.reference || (rem.reference + '/' + li.debiteurId)) + '</EndToEndId></PmtId>\n';
        x += '        <InstdAmt Ccy="EUR">' + li.montant.toFixed(2) + '</InstdAmt>\n';
        x += '        <DrctDbtTx><MndtRltdInf><MndtId>' + esc(li.rum) + '</MndtId><DtOfSgntr>' + jour((self.techSepaMandatToute(li.debiteurType, li.debiteurId) || {}).signeLe || rem.at) + '</DtOfSgntr></MndtRltdInf></DrctDbtTx>\n';
        x += '        <DbtrAgt><FinInstnId><BIC>' + esc(li.bic) + '</BIC></FinInstnId></DbtrAgt>\n';
        x += '        <Dbtr><Nm>' + esc(li.titulaire || li.debiteur) + '</Nm></Dbtr>\n';
        x += '        <DbtrAcct><Id><IBAN>' + esc((self.techSepaMandatToute(li.debiteurType, li.debiteurId) || {}).iban || '') + '</IBAN></Id></DbtrAcct>\n';
        x += '        <RmtInf><Ustrd>' + esc(rem.nature === 'abonnements' ? 'Abonnement logiciel ' + (li.periode || '') : 'Bons vendus - arrete du ' + jour(rem.fin)) + '</Ustrd></RmtInf>\n';
        x += '      </DrctDbtTxInf>\n';
      });
      x += '    </PmtInf>\n';
    });
    x += '  </CstmrDrctDbtInitn>\n</Document>\n';
    return { ok: true, nom: rem.reference + '.xml', contenu: x, lignes: lignes.length, total: rem.total, echeance: rem.echeance };
  },
  /* LE DÉPÔT — « fichier déposé dans les 15 min de la vérification journalière ». On ne refuse pas un dépôt en
     retard (le fichier doit partir), on l'ÉCRIT : un retard qui ne laisse pas de trace est un retard qui se répète. */
  techRemiseDeposer: function (ref, par) {
    var rem = this.techRemise(ref); if (!rem) return { ok: false, motif: 'Remise inconnue.' };
    if (rem.deposeLe) return { ok: false, motif: 'Cette remise a déjà été déposée le ' + this.dateHeure(rem.deposeLe) + '.' };
    var f = this.techRemiseFichier(ref); if (!f.ok) return f;
    var l = this.techRemisesGet(), x = l.filter(function (y) { return y.reference === ref; })[0];
    var now = Date.now(), dans = now <= rem.depotAvant;
    x.statut = 'depose'; x.deposeLe = now; x.depotDansLesTemps = dans; x.deposePar = par || 'manager';
    x.echeance = this.ajouterJoursOuvres(now, +this.techRef().paiement.remiseJoursOuvresAvant).getTime();
    (x.lignes || []).forEach(function (li) { if (li.statut === 'prepare') li.statut = 'depose'; });
    if (!this._techRemisesPut(l)) return this._refusEcriture('Le dépôt de la remise');
    /* LE PREMIER PRÉLÈVEMENT D'UN MANDAT est un FRST ; les suivants des RCUR — la banque le contrôle. */
    var self = this;
    (x.lignes || []).forEach(function (li) {
      if (li.statut !== 'depose') return;
      var mdt = self.techSepaMandat(li.debiteurType, li.debiteurId);
      if (mdt && !mdt.premierPrelevement) {
        var m2 = Object.assign({}, mdt, { premierPrelevement: now });
        if (li.debiteurType === 'marchand') self._techMarchandMaj(li.debiteurId, { sepa: m2 }); else self._techRevendeurMaj(li.debiteurId, { sepa: m2 });
      }
    });
    this._techVenteMaj(this.techVentes({ remise: ref }).map(function (v) { return v.reference; }), { echeancePrelevement: x.echeance });
    this._journal('tech_remise_deposee', ref, { canal: x.canal, banque: x.banque, lignes: (x.lignes || []).filter(function (li) { return li.statut === 'depose'; }).length,
      total: x.total, echeance: x.echeance, dansLesTemps: dans, par: x.deposePar });
    return { ok: true, remise: this.techRemise(ref), fichier: f, dansLesTemps: dans };
  },

  /* ══ LE RETOUR DE LA BANQUE — « ça me retourne un fichier, je l'analyse, ça me dit qui a payé et qui n'a pas
     payé, et derrière je le télécharge dans notre logiciel, ça met à jour » (fondatrice, 22/09).
     Deux formats sont lus : le pain.002 que la banque rend (statuts par transaction) et le relevé en colonnes
     (référence ; statut ; motif) quand on préfère le CSV. Une référence inconnue n'est jamais ignorée en
     silence : elle ressort dans `inconnues`. ══ */
  TECH_MOTIFS_SEPA: { AC04: 'Compte clôturé', AC06: 'Compte bloqué', AG01: 'Prélèvement interdit sur ce compte',
    AM04: 'Provision insuffisante', MD01: 'Mandat absent ou non valide chez la banque du débiteur',
    MD06: 'Remboursement demandé par le débiteur', MD07: 'Débiteur décédé', MS02: 'Refus du débiteur',
    MS03: 'Motif non précisé par la banque', RR01: 'Coordonnées du débiteur incomplètes', SL01: 'Service refusé par la banque du débiteur' },
  techMotifSepa: function (c) { return this.TECH_MOTIFS_SEPA[String(c || '').toUpperCase()] || null; },
  techRetourLire: function (texte) {
    var t = String(texte || ''), lignes = [];
    if (/<TxInfAndSts|<OrgnlPmtInfAndSts|pain\.002/i.test(t)) {
      var blocs = t.split(/<TxInfAndSts>/i).slice(1);
      blocs.forEach(function (b) {
        var id = (b.match(/<OrgnlEndToEndId>([^<]+)<\/OrgnlEndToEndId>/i) || [])[1];
        var st = (b.match(/<TxSts>([^<]+)<\/TxSts>/i) || [])[1];
        var cd = (b.match(/<Rsn>\s*<Cd>([^<]+)<\/Cd>/i) || [])[1];
        if (id) lignes.push({ reference: id.trim(), statut: String(st || '').trim().toUpperCase(), motif: cd ? cd.trim().toUpperCase() : null });
      });
    } else {
      t.split(/\r?\n/).forEach(function (li) {
        var s2 = li.trim(); if (!s2 || /^(#|reference|référence)/i.test(s2)) return;
        var c = s2.split(/[;,\t]/);
        if (c.length < 2) return;
        lignes.push({ reference: c[0].trim(), statut: c[1].trim().toUpperCase(), motif: (c[2] || '').trim().toUpperCase() || null });
      });
    }
    var paye = { ACSC: 1, ACCP: 1, ACSP: 1, PAYE: 1, PAYÉ: 1, OK: 1, ACCEPTE: 1, ACCEPTÉ: 1 };
    lignes.forEach(function (x) { x.paye = !!paye[x.statut]; });
    return lignes;
  },
  /* L'IMPORT — il met à jour les VENTES, pas seulement les lignes : c'est la vente qui porte ce que le point
     nous doit et ce que nous devons à la marque. Un impayé ferme le point (règle de Configuration) et crée sa
     pénalité, qui partira dans la remise suivante. */
  techRetourImporter: function (ref, texte, par) {
    var rem = this.techRemise(ref); if (!rem) return { ok: false, motif: 'Remise inconnue.' };
    if (!rem.deposeLe) return { ok: false, motif: 'Cette remise n\'a pas encore été déposée : il ne peut pas y avoir de retour.' };
    var lues = this.techRetourLire(texte);
    if (!lues.length) return { ok: false, motif: 'Aucune ligne lisible dans ce retour. Attendu : le pain.002 de la banque, ou un relevé « référence ; statut ; motif » par ligne.' };
    var self = this, P = this.techRef().paiement, l = this.techRemisesGet();
    var x = l.filter(function (y) { return y.reference === ref; })[0];
    var parRef = {}; (x.lignes || []).forEach(function (li) { if (li.reference) parRef[li.reference] = li; parRef[ref + '/' + li.debiteurId] = li; });
    var inconnues = [], payees = 0, impayees = 0, suspendus = [], penalites = [];
    lues.forEach(function (r) {
      var li = parRef[r.reference];
      if (!li || li.statut === 'ecartee') { inconnues.push(r.reference); return; }
      li.retourLe = Date.now(); li.motifBanque = r.motif || null; li.motifBanqueLbl = self.techMotifSepa(r.motif);
      if (r.paye) { li.statut = 'paye'; payees++; } else { li.statut = 'impaye'; impayees++; }
    });
    if (!this._techRemisesPut(l)) return this._refusEcriture('L\'import du retour bancaire');
    /* LES VENTES SUIVENT LEUR LIGNE — et elles seules : une ligne sans retour reste « remise à la banque ». */
    (x.lignes || []).forEach(function (li) {
      if (li.statut !== 'paye' && li.statut !== 'impaye') return;
      if (li.ventes && li.ventes.length) self._techVenteMaj(li.ventes, { statut: li.statut === 'paye' ? 'regle' : 'impaye' });
      if (li.penalites && li.penalites.length) {
        var lp = self.techPenalitesGet(), maj = {};
        li.penalites.forEach(function (r) { maj[r] = true; });
        lp.forEach(function (p) { if (maj[p.reference]) p.statut = li.statut === 'paye' ? 'regle' : 'impaye'; });
        self._techPenalitesPut(lp);
      }
      if (li.statut === 'impaye') {
        var pen = self._techPenaliteCreer(li.debiteurId, P.penaliteImpaye, 'Prélèvement revenu impayé' + (li.motifBanqueLbl ? ' — ' + li.motifBanqueLbl : ''), li.reference || ref);
        if (pen) penalites.push(pen.reference);
        if (li.debiteurType === 'revendeur') {
          var enc = self.techEncours(li.debiteurId);
          if (enc.prelevementsImpayes >= +P.impayesAvantSuspension) {
            var r0 = self.techRevendeur(li.debiteurId);
            if (r0 && r0.statut !== 'suspended') {
              self._techRevendeurMaj(li.debiteurId, { statut: 'suspended', suspenduLe: Date.now(), suspenduMotif: 'Prélèvement impayé (' + (li.motifBanqueLbl || li.motifBanque || 'motif non précisé') + ')' });
              suspendus.push(li.debiteurId);
              self._journal('tech_revendeur_suspendu', li.debiteurId, { motif: li.motifBanqueLbl || li.motifBanque || null, remise: ref, par: par || 'manager' });
            }
          }
        }
      }
    });
    /* (23/09, nuit) LE PRÉLÈVEMENT REPRÉSENTÉ REVIENT PAYÉ : le point qui était suspendu pour impayé retrouve la vente,
       s'il ne lui reste aucun autre impayé (techRevendeurRegulariser le vérifie, et refuse sinon). */
    (x.lignes || []).forEach(function (li) {
      if (li.statut === 'paye' && li.debiteurType === 'revendeur' && self._revendeurImpaye(self.techRevendeur(li.debiteurId))) self.techRevendeurRegulariser(li.debiteurId, par);
    });
    var reste = (x.lignes || []).filter(function (li) { return li.statut === 'depose'; }).length;
    var l2 = this.techRemisesGet(), x2 = l2.filter(function (y) { return y.reference === ref; })[0];
    x2.statut = reste ? 'partiel' : 'traite'; x2.retourLe = Date.now(); x2.retourPar = par || 'manager';
    this._techRemisesPut(l2);
    this._journal('tech_remise_retour', ref, { payees: payees, impayees: impayees, inconnues: inconnues.length,
      suspendus: suspendus.length, penalites: penalites.length, reste: reste, par: par || 'manager' });
    return { ok: true, remise: this.techRemise(ref), payees: payees, impayees: impayees, inconnues: inconnues,
      suspendus: suspendus, penalites: penalites, enAttente: reste };
  },
  /* LA REPRÉSENTATION — un impayé se représente une fois, à nos frais bancaires, que le contrat met à la charge
     du point : la vente redevient « à prélever » et repartira dans la remise suivante. */
  /* ══ (24/09, fondatrice — formulaire d'arbitrages : « bloqué immédiatement, le manager suit et doit appeler, le manager valide la
     demande de nouveau prélèvement ») L'IMPAYÉ SE TRAITE EN TROIS TEMPS : le point est suspendu dès le retour de la banque
     (techRetourImporter), le manager APPELLE le commerce et note l'appel ici, puis il valide la représentation — jamais avant l'appel. */
  techImpayeAppelNoter: function (ref, ligneRef, o) {
    o = o || {};
    var rem = this.techRemise(ref); if (!rem) return { ok: false, motif: 'Remise inconnue.' };
    var li = (rem.lignes || []).filter(function (y) { return (y.reference || '') === ligneRef || y.debiteurId === ligneRef; })[0];
    if (!li) return { ok: false, motif: 'Ligne inconnue dans cette remise.' };
    if (li.statut !== 'impaye') return { ok: false, motif: 'Cette ligne n\'est pas impayée : il n\'y a personne à appeler.' };
    var cr = String(o.compteRendu || '').trim();
    if (cr.length < 5) return { ok: false, champ: 'compteRendu', motif: 'Note ce que le commerce a dit : c\'est le compte rendu qui autorise la représentation.' };
    var l = this.techRemisesGet(), x = l.filter(function (y) { return y.reference === ref; })[0];
    var li2 = (x.lignes || []).filter(function (y) { return y.debiteurId === li.debiteurId; })[0];
    li2.appel = { at: Date.now(), par: o.par || 'manager', compteRendu: cr, accord: o.accord !== false };
    if (!this._techRemisesPut(l)) return this._refusEcriture('Le compte rendu d\'appel');
    this._journal('tech_impaye_appel', ref, { debiteur: li.debiteurId, compteRendu: cr, accord: li2.appel.accord, par: li2.appel.par });
    return { ok: true, appel: li2.appel };
  },
  techRepresenter: function (ref, ligneRef, par) {
    var rem = this.techRemise(ref); if (!rem) return { ok: false, motif: 'Remise inconnue.' };
    var li = (rem.lignes || []).filter(function (y) { return (y.reference || '') === ligneRef || y.debiteurId === ligneRef; })[0];
    if (!li) return { ok: false, motif: 'Ligne inconnue dans cette remise.' };
    if (li.statut !== 'impaye') return { ok: false, motif: 'Cette ligne n\'est pas impayée : il n\'y a rien à représenter.' };
    if (li.represente) return { ok: false, motif: 'Cette ligne a déjà été représentée le ' + this.dateCourte(li.represente) + '.' };
    if (!li.appel) return { ok: false, refus: 'appel', motif: 'Appelle d\'abord le commerce et note l\'appel (décision du 24/09) : c\'est le compte rendu qui autorise la représentation.' };
    var P = this.techRef().paiement;
    var l = this.techRemisesGet(), x = l.filter(function (y) { return y.reference === ref; })[0];
    var li2 = (x.lignes || []).filter(function (y) { return y.debiteurId === li.debiteurId; })[0];
    li2.represente = Date.now(); li2.representePar = par || 'manager';
    if (!this._techRemisesPut(l)) return this._refusEcriture('La représentation');
    if (li.ventes && li.ventes.length) this._techVenteMaj(li.ventes, { statut: 'a_prelever', remiseRef: null });
    /* (24/09, nuit) la ligne représentée emporte AUSSI ses pénalités : elles étaient restées « impayées » pour toujours, jamais
       reprélevées — et la régularisation du point les oubliait */
    var penRep = 0;
    if (li.penalites && li.penalites.length) {
      var lp = this.techPenalitesGet(), maj = {};
      li.penalites.forEach(function (r0) { maj[r0] = true; });
      lp.forEach(function (x) { if (maj[x.reference] && x.statut === 'impaye') { x.statut = 'a_prelever'; x.remiseRef = null; penRep++; } });
      if (penRep && !this._techPenalitesPut(lp)) return this._refusEcriture('La représentation des pénalités');
    }
    var pen = this._techPenaliteCreer(li.debiteurId, P.coutRepresentation, 'Frais de représentation du prélèvement impayé', li.reference || ref);
    this._journal('tech_representation', ref, { debiteur: li.debiteurId, ventes: (li.ventes || []).length, penalitesReprises: penRep, cout: +P.coutRepresentation, penalite: pen ? pen.reference : null, par: par || 'manager' });
    return { ok: true, penalite: pen, ventes: (li.ventes || []).length, penalitesReprises: penRep };
  },

  /* ══ LE RÈGLEMENT DE LA MARQUE — virement instantané depuis notre banque ══════════════════════════════════
     (22/09, fondatrice : « pour les paiements on effectue les virements via notre banque, virement en immédiat ».)
     L'échéance est portée par la VENTE, posée à l'arrêté : c'est la promesse de l'offre choisie, pas une date
     saisie à la main. Le manager voit, en face de chaque règlement dû, si le prélèvement correspondant est déjà
     réglé — en offre « 24 heures » il ne l'est pas encore, et c'est exactement le risque que borne l'encours. ══ */
  /* ══ LES COMPTES DE RÉSEAUX SOCIAUX D'UNE MARQUE (23/09, fondatrice : « liés au compte réseau depuis config ») ═════
     La même liste que les fournisseurs (RESEAUX_BOUTIQUE : format du pseudo, adresse de base) ; le compte se range
     sur la fiche de la marque et l'éditeur de visuels le lit pour signer et partager. Un pseudo qui ne respecte pas
     le format du réseau est refusé avec le motif du référentiel — jamais un @ inventé. */
  techMarchandReseauxGet: function (id) {
    var m = this.techMarchand(id); if (!m) return [];
    var self = this;
    return (m.reseaux || []).map(function (x) {
      var r = self.reseauBoutique(x.k) || {};
      return { k: x.k, lbl: r.lbl || x.k, pseudo: x.pseudo, url: (r.base || '') + x.pseudo, arobase: !!r.arobase, at: x.at };
    });
  },
  techMarchandReseauSet: function (id, k, saisie, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var r = this.reseauBoutique(k); if (!r) return { ok: false, champ: 'reseau', motif: 'Réseau inconnu.' };
    var v = String(saisie || '').trim().replace(/^@/, '');
    /* une adresse collée entière est acceptée : on en garde le pseudo, s'il vient bien de ce réseau */
    (r.hotes || []).forEach(function (h) { var re = new RegExp('^https?://(www\\.)?' + h.replace('.', '\\.') + '/@?'); if (re.test(v)) v = v.replace(re, '').replace(/[/?#].*$/, ''); });
    if (!r.motif.test(v)) return { ok: false, champ: 'pseudo', motif: 'Ce pseudo ne ressemble pas à un compte ' + r.lbl + (r.aide ? ' — ' + r.aide : '') + '.' };
    var l = (m.reseaux || []).filter(function (x) { return x.k !== k; });
    l.push({ k: k, pseudo: v, at: Date.now() });
    if (!this._techMarchandMaj(m.id, { reseaux: l })) return this._refusEcriture('Le compte ' + r.lbl);
    this._journal('tech_reseau_marque', m.id, { reseau: k, pseudo: v, par: par || id });
    return { ok: true, reseau: this.techMarchandReseauxGet(m.id).filter(function (x) { return x.k === k; })[0] };
  },
  techMarchandReseauRetirer: function (id, k, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var l = (m.reseaux || []).filter(function (x) { return x.k !== k; });
    if (!this._techMarchandMaj(m.id, { reseaux: l })) return this._refusEcriture('Le retrait du compte');
    this._journal('tech_reseau_marque_retire', m.id, { reseau: k, par: par || id });
    return { ok: true };
  },

  /* ══ LE CONTRAT-CADRE D'ACHAT ET DE DISTRIBUTION — SIGNÉ PAR LA MARQUE (23/09) ════════════════════════
     Le document vit au coffre (modèle `contrat_marchand`, signé puis contresigné) ; la marque garde en plus le
     TAMPON de sa signature (`contratSigneLe`, signataire) : les écrans qui ne chargent pas le coffre — le
     comptoir, la vente — lisent le tampon, jamais un coffre absent. Pas de coffre dans la fenêtre ? On signe
     quand même (la génération PDF se fera depuis Compte) et on le dit. */
  /* ══ LE STATUT D'UNE MARQUE EST UN GESTE DU MANAGER (23/09) ════════════════════════════════════════════════
     Personne ne validait une marque autrement que par une ligne de banc ou le jeu de démo. Le manager valide quand
     le dossier est complet et la déclaration « réseau limité » validée ; il suspend avec un motif que la marque lit ;
     il réactive. Chaque geste est journalisé avec son auteur. */
  techMarchandValider: function (id, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (m.statut === 'draft') return { ok: false, motif: 'Cette inscription n’est pas envoyée : il n’y a encore rien à valider.' };
    if (m.statut === 'validated') return { ok: false, motif: m.raisonSociale + ' est déjà validée.' };
    if (!this.techMarchandConforme(m.id)) return { ok: false, motif: 'Sa déclaration « réseau limité » n\'est pas validée : statue-la d\'abord.' };
    /* (24/09) les bénéficiaires effectifs se déclarent avant la validation (décision du 24/09) — une entreprise individuelle en est dispensée */
    if (!this.beneficiairesEtat(m.beneficiaires, m.dirigeant, m.formeJuridique).ok) return { ok: false, motif: 'Ses bénéficiaires effectifs ne sont pas déclarés : la marque les atteste dans Compte › Identité avant toute validation.' };
    try { if (window.PEC_DOCS && PEC_DOCS.etat) { var e = PEC_DOCS.etat('marchand', m.id); if (e.etat !== 'valide') return { ok: false, motif: 'Dossier de vérification non validé (' + (e.libelle || e.etat) + ') : contrôle les pièces dans Vérifications avant de valider.' }; } } catch (e0) {}
    if (!this._techMarchandMaj(m.id, { statut: 'validated', valideLe: Date.now(), validePar: par || 'manager', motifSuspension: null })) return this._refusEcriture('La validation de ' + m.raisonSociale);
    this._journal('tech_marchand_valide', m.id, { par: par || 'manager', raisonSociale: m.raisonSociale });
    return { ok: true, marchand: this.techMarchand(m.id) };
  },
  techMarchandSuspendre: function (id, motif, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    motif = String(motif || '').trim(); if (!motif) return { ok: false, motif: 'Une suspension se motive — la marque lit la raison.' };
    if (m.statut === 'suspended') return { ok: false, motif: m.raisonSociale + ' est déjà suspendue.' };
    if (!this._techMarchandMaj(m.id, { statut: 'suspended', statutAvant: m.statut, motifSuspension: motif, suspendueLe: Date.now() })) return this._refusEcriture('La suspension de ' + m.raisonSociale);
    this._journal('tech_marchand_suspendu', m.id, { par: par || 'manager', motif: motif });
    return { ok: true, marchand: this.techMarchand(m.id) };
  },
  techMarchandReactiver: function (id, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (m.statut !== 'suspended') return { ok: false, motif: m.raisonSociale + ' n\'est pas suspendue.' };
    if (!this._techMarchandMaj(m.id, { statut: m.statutAvant || 'validated', motifSuspension: null, reactiveeLe: Date.now() })) return this._refusEcriture('La réactivation de ' + m.raisonSociale);
    this._journal('tech_marchand_reactive', m.id, { par: par || 'manager' });
    return { ok: true, marchand: this.techMarchand(m.id) };
  },

  /* ══ LE SITE WEB DE LA MARQUE (23/09, fondatrice : « abonnement à 19,00 €, INCLUS la création d'un site web depuis leur
     nom de domaine, tourné vers leur marque, ultra facile d'usage ») ══════════════════════════════════════════
     Le site est DÉRIVÉ : ses articles, son lien de vente, le réseau, ses mentions — la marque ne régle que trois choses
     (son domaine, son accroche, sa couleur). Il n'est servi que si sa formule le comprend (`siteWeb` au référentiel) :
     un site qui s'affiche sans l'abonnement qui le paie, c'est un cadeau non déclaré. */
  techMarchandSite: function (id) {
    var m = (typeof id === 'string') ? this.techMarchand(id) : id; if (!m) return null;
    var f = this.techMarchandFormule(m);
    var st = m.site || {};
    return { domaine: st.domaine || null, accroche: st.accroche || null, couleur: st.couleur || null, majLe: st.majLe || null,
      inclus: !!f.siteWeb, formule: f.nom, url: this.techMarchandSiteUrl(m.id), actif: !!f.siteWeb && m.statut === 'validated' };
  },
  techMarchandSiteSet: function (id, o, par) {
    o = o || {};
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (!this.techMarchandFormule(m).siteWeb) return { ok: false, refus: 'formule', motif: 'Le site web est compris dans la formule « ' + (this.techFormules().filter(function (f) { return f.siteWeb; })[0] || {}).nom + ' » : souscris-la pour l\'activer.' };
    var dom = String(o.domaine || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (dom && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dom)) return { ok: false, champ: 'domaine', motif: 'Un nom de domaine s\'écrit comme « ma-marque.fr » — sans http ni chemin.' };
    var coul = String(o.couleur || '').trim();
    if (coul && !/^#[0-9a-fA-F]{6}$/.test(coul)) return { ok: false, champ: 'couleur', motif: 'La couleur s\'écrit en hexadécimal, comme #0F2A24.' };
    var st = { domaine: dom || null, accroche: String(o.accroche || '').trim().slice(0, 140) || null, couleur: coul || null, majLe: Date.now() };
    if (!this._techMarchandMaj(m.id, { site: st })) return this._refusEcriture('Le site web');
    this._journal('tech_site_marque', m.id, { domaine: st.domaine, par: par || id });
    return { ok: true, site: this.techMarchandSite(m.id) };
  },
  techMarchandSiteUrl: function (id) {
    var base = (typeof location !== 'undefined' && location.href) ? location.href : '';
    var i = base.indexOf('/ui/');
    var racine = i > -1 ? base.slice(0, i) + '/ui/tech/' : '';
    return racine + '11-site.html?m=' + encodeURIComponent(id);
  },

  /* (23/09, fondatrice : « KYC pour la signature du contrat-cadre effectuée par le dirigeant ») LE SIGNATAIRE N'EST
     PAS TAPÉ, IL EST LU : le dirigeant déclaré sur le compte, dont la pièce d'identité a été contrôlée au coffre.
     Un champ libre signait au nom de n'importe qui ; une case cochée sans dirigeant vérifié ne signe plus rien. */
  techMarchandContratSigner: function (id, o) {
    o = o || {};
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var dir = this.techMarchandDirigeant(m);
    if (!dir) return { ok: false, refus: 'dirigeant', champ: 'dirigeant', motif: 'Déclare d\'abord le dirigeant de la société (prénom, nom, qualité) : c\'est lui qui signe le contrat-cadre.', href: '10-compte.html?s=identite' };
    if (o.accepte !== true) return { ok: false, champ: 'accepte', motif: 'La case « j\'ai lu le contrat et je le signe » doit être cochée.' };
    var kyc = this.techKycDirigeant(m.id);
    if (!kyc.ok) return { ok: false, refus: kyc.refus, motif: kyc.motif, href: '10-compte.html?s=identite' };
    var sig = dir.nomComplet + ' (' + dir.qualite + ')';
    var now = Date.now(), coffre = null;
    try {
      if (window.PEC_DOCS && PEC_DOCS.signer) {
        coffre = PEC_DOCS.signer('marchand', m.id, 'contrat', sig, Object.assign({ id: m.id, nom: m.raisonSociale, siteUrl: m.siteUrl, dirigeant: dir.nomComplet, dirigeantQualite: dir.qualite, kycLe: kyc.verifieeLe || null, signataireAttendu: dir.nomComplet }, o.ctx || {}));
        if (coffre && coffre.catch) coffre.catch(function () {});
      }
    } catch (e) {}
    if (!this._techMarchandMaj(m.id, { contratSigneLe: now, contratSignataire: sig, contratKycLe: kyc.verifieeLe || now })) return this._refusEcriture('La signature du contrat');
    this._journal('tech_contrat_signe', m.id, { signataire: sig, kyc: 'pièce d\'identité du dirigeant contrôlée', par: o.par || id });
    return { ok: true, signeLe: now, signataire: sig, coffre: !!coffre };
  },
  /* ══ LE VERROU (23/09, fondatrice : « sinon pas de possibilité de travailler avec nous ») ════════════════════
     Une marque travaille avec nous quand : son compte est vérifié, sa déclaration « réseau limité » validée, CHAQUE
     document en vigueur consulté puis accepté dans sa version, et le contrat-cadre signé. Ce qui manque est rendu
     avec l'écran où le régler — la vente, la clé d'API et le lien de vente lisent la même règle. */
  techMarchandPeutTravailler: function (id) {
    var m = this.techMarchand(id); if (!m) return { ok: false, manque: [{ cle: 'compte', libelle: 'Marque inconnue.' }] };
    var manque = [];
    /* (23/09, soir — fondatrice : « si une autre page me demande quelque chose, ça doit me ramener à l'endroit où je dois
       agir : raccourci immédiat vers le détail ») CHAQUE MANQUE PORTE L'ADRESSE DE SA CARTE (section + ancre) : l'écran
       Compte y défile et la signale. */
    if (m.statut !== 'validated') manque.push({ cle: 'statut', libelle: 'Compte en attente de vérification.', href: '10-compte.html?s=identite#dossier' });
    if (!this.techMarchandDirigeant(m)) manque.push({ cle: 'dirigeant', libelle: 'Dirigeant de la société à déclarer (prénom, nom, qualité) : c\'est lui qui signe.', href: '10-compte.html?s=identite#dirigeant' });
    if (!this.techMarchandConforme(m.id)) manque.push({ cle: 'declaration', libelle: 'Déclaration « réseau limité » à déposer ou à faire valider.', href: '10-compte.html?s=documents#declaration' });
    this.documentsEtat('marchand', m.id).forEach(function (d) {
      /* (24/09, nuit) une politique de confidentialité se lit, elle ne s'accepte pas (documentMots) */
      if (!d.aJour) manque.push({ cle: d.cle, libelle: (d.information
          ? (d.aRelire ? 'Nouvelle version à relire : ' : (d.consulteLe ? 'Lecture à confirmer : ' : 'À lire : '))
          : (d.aRelire ? 'Nouvelle version à relire et accepter : ' : (d.consulteLe ? 'À accepter : ' : 'À lire puis accepter : '))) + d.titre, href: '10-compte.html?s=documents#documents' });
    });
    if (!m.contratSigneLe) manque.push({ cle: 'contrat', libelle: 'Contrat-cadre d’achat et de distribution à signer.', href: '10-compte.html?s=documents#contrat' });
    return { ok: !manque.length, manque: manque, href: manque.length ? manque[0].href : null };
  },

  techMarchandRib: function (m) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    if (!m) return null;
    if (m.rib && m.rib.iban) return m.rib;
    var mdt = this.techSepaMandat('marchand', m.id);
    if (mdt) return { iban: mdt.iban, ibanMasque: mdt.ibanMasque, bic: mdt.bic, titulaire: mdt.titulaire, via: 'mandat' };
    /* (23/09, soir — audit) LE RIB CONTRÔLÉ AU COFFRE VAUT : le contrôleur l'a relevé sur la pièce (mentions iban/bic/titulaire) —
       redemander la même saisie à la marque, c'était deux vérités pour un compte. */
    try {
      var men = (typeof window !== 'undefined' && window.PEC_DOCS && PEC_DOCS.mentions) ? (PEC_DOCS.mentions('marchand', m.id) || {}) : {};
      if (men.iban && men.bic) return { iban: men.iban, ibanMasque: this.ibanMasque(men.iban), bic: men.bic, titulaire: men.titulaire || m.raisonSociale, via: 'coffre' };
    } catch (e) {}
    return null;
  },
  techMarchandRibEnregistrer: function (id, o, par) {
    o = o || {};
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var ib = this.ibanControle(o.iban); if (!ib.ok) return { ok: false, champ: 'iban', motif: ib.motif };
    var bic = this.bicControle(o.bic); if (!bic.ok) return { ok: false, champ: 'bic', motif: bic.motif };
    var tit = String(o.titulaire || '').trim();
    if (tit.length < 3) return { ok: false, champ: 'titulaire', motif: 'Indique le titulaire du compte, tel qu\'il figure sur le RIB.' };
    var rib = { iban: ib.valeur, ibanMasque: this.ibanMasque(ib.valeur), bic: bic.valeur, titulaire: tit, at: Date.now(), par: par || id };
    if (!this._techMarchandMaj(m.id, { rib: rib })) return this._refusEcriture('L\'enregistrement du RIB');
    this._journal('tech_rib_marque', m.id, { iban: rib.ibanMasque, bic: rib.bic, par: rib.par });
    return { ok: true, rib: rib };
  },
  /* ══ (24/09, fondatrice — formulaire d'arbitrages : « carte pour l'abonnement marque ») LA CARTE DE L'ABONNEMENT ══════════
     L'abonnement au logiciel se règle par carte bancaire, débitée à chaque échéance — Stripe comme moyen de paiement d'Odoo,
     jamais un mandat SEPA (le prélèvement reste celui des commerces du réseau, sur notre banque). LE NUMÉRO NE S'ÉCRIT NULLE
     PART : en production, Stripe le prend dans le navigateur de la marque et nous rend un jeton ; ici, la maquette contrôle
     le numéro (Luhn), n'en garde que les quatre derniers chiffres, le réseau et l'échéance, et fabrique un jeton opaque. */
  techMarchandCarte: function (m) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    return (m && m.carte && m.carte.fin4) ? m.carte : null;
  },
  _carteLuhn: function (num) {
    var s = 0, alt = false;
    for (var i = num.length - 1; i >= 0; i--) { var d = +num.charAt(i); if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; }
    return s % 10 === 0;
  },
  techMarchandCarteEnregistrer: function (id, o, par) {
    o = o || {};
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var num = String(o.numero || '').replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(num) || !this._carteLuhn(num)) return { ok: false, champ: 'numero', motif: 'Numéro de carte invalide : 13 à 19 chiffres, et la clé doit tomber juste.' };
    var reseau = /^4/.test(num) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(num) ? 'Mastercard' : /^3[47]/.test(num) ? 'American Express' : 'Carte';
    var mm = parseInt(o.expMois, 10), aa = parseInt(o.expAnnee, 10); if (aa < 100) aa += 2000;
    if (!(mm >= 1 && mm <= 12) || !(aa >= 2000)) return { ok: false, champ: 'expiration', motif: 'Indique l’expiration de la carte (mois et année).' };
    var fin = new Date(aa, mm, 0, 23, 59, 59);
    if (fin.getTime() < Date.now()) return { ok: false, champ: 'expiration', motif: 'Cette carte est expirée : il en faut une en cours de validité.' };
    var tit = String(o.titulaire || '').trim();
    if (tit.length < 3) return { ok: false, champ: 'titulaire', motif: 'Indique le nom du titulaire, tel qu’il figure sur la carte.' };
    var jeton = this._techAlea ? this._techAlea(16) : null;
    var carte = { reseau: reseau, fin4: num.slice(-4), expMois: mm, expAnnee: aa, titulaire: tit, jeton: jeton ? 'card_' + jeton : null, enregistreeLe: Date.now(), par: par || id };
    if (!this._techMarchandMaj(m.id, { carte: carte })) return this._refusEcriture('L’enregistrement de la carte');
    this._journal('tech_carte_marque', m.id, { reseau: reseau, fin4: carte.fin4, expiration: mm + '/' + aa, par: carte.par });
    return { ok: true, carte: carte };
  },
  /* LA FACTURATION DU MOIS — la tâche du 1er : chaque échéance due naît (techAbonnementGenerer, jamais deux fois), sa facture est
     émise (Odoo, TVA comprise) puis débitée sur la carte de la marque. Sans carte, la facture reste due et la marque est prévenue ;
     rejouer la tâche ne double rien. Rend ce qui a été facturé, débité, et ce qui a échoué. */
  techAbonnementsFacturer: function (o) {
    o = o || {};
    var self = this, per = o.periode || this.techPeriodeCourante(), par = o.par || 'manager';
    var factures = [], debitees = [], echecs = [];
    this.techMarchandsGet().forEach(function (m) { self.techAbonnementGenerer({ marchandId: m.id, periode: per }); });
    this.techAbonnements({ periode: per }).filter(function (a) { return a.statut === 'du' || a.statut === 'impaye'; }).forEach(function (a) {
      var fa = a.factureId ? { ok: true, facture: self.techFacture(a.factureId) } : self.techFactureEmettre({ sourceType: 'subscription', sourceId: a.id, par: par });
      if (!fa.ok || !fa.facture) { echecs.push({ marchandId: a.marchandId, motif: fa.motif }); return; }
      factures.push(fa.facture.id);
      var d = self.techFactureDebiter(fa.facture.id, par);
      if (d.ok) debitees.push(fa.facture.id); else echecs.push({ marchandId: a.marchandId, facture: fa.facture.id, motif: d.motif });
    });
    if (!factures.length && !echecs.length) return { ok: false, motif: 'Aucun abonnement à facturer pour ' + per + ' — les forfaits gratuits et les premiers mois offerts ne se facturent pas.' };
    this._journal('tech_abonnements_factures', per, { periode: per, factures: factures.length, debitees: debitees.length, echecs: echecs.length, par: par });
    return { ok: true, periode: per, factures: factures, debitees: debitees, echecs: echecs };
  },
  /* LE DÉBIT D'UNE FACTURE SUR LA CARTE — en production, Odoo demande le débit à Stripe (carte enregistrée, débit sans la
     cliente) ; ici, une carte enregistrée et non expirée vaut débit. L'échec se dit et s'écrit : la marque est prévenue, la
     facture reste due, l'échéance passe « impayée » jusqu'à la carte suivante. */
  techFactureDebiter: function (factureId, par) {
    var fa = this.techFacture(factureId); if (!fa) return { ok: false, motif: 'Facture introuvable.' };
    if (fa.statut === 'payee') return { ok: true, deja: true, facture: fa };
    var m = this.techMarchand(fa.marchandId), c = this.techMarchandCarte(m);
    var l = this.techFacturesGet(), i = -1; for (var k = 0; k < l.length; k++) if (l[k].id === fa.id) i = k;
    if (i < 0) return { ok: false, motif: 'Facture introuvable.' };
    var echec = !c ? 'Aucune carte enregistrée : la marque doit en enregistrer une (Compte › Abonnement).'
      : (new Date(c.expAnnee, c.expMois, 0).getTime() < Date.now() ? 'La carte enregistrée a expiré.' : null);
    if (echec) {
      l[i].echec = { at: Date.now(), motif: echec, tentatives: ((l[i].echec || {}).tentatives || 0) + 1 };
      this._techFacturesPut(l);
      this._techAbonnementMaj(fa.sourceId, { statut: 'impaye' });
      this._journal('tech_facture_echec', fa.id, { marchand: fa.marchandId, motif: echec, ttc: fa.montantTTC, par: par || 'manager' });
      return { ok: false, motif: echec, facture: l[i] };
    }
    l[i].statut = 'payee'; l[i].payeeLe = Date.now(); l[i].moyen = 'carte'; l[i].carte = { reseau: c.reseau, fin4: c.fin4 }; l[i].echec = null;
    if (!this._techFacturesPut(l)) return this._refusEcriture('Le débit de la facture');
    this._techAbonnementMaj(fa.sourceId, { statut: 'regle' });
    this._journal('tech_facture_payee', fa.id, { marchand: fa.marchandId, moyen: 'carte', reseau: c.reseau, fin4: c.fin4, ttc: fa.montantTTC, par: par || 'manager' });
    return { ok: true, facture: this.techFacture(fa.id) };
  },
  techReglementsGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-reglements') || '[]') || []; } catch (e) { return []; } },
  _techReglementsPut: function (l) { if (!this._ecrit('pec-tech-reglements', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techReglements: function (o) {
    o = o || {};
    return this.techReglementsGet().filter(function (x) {
      if (o.marchandId && x.marchandId !== o.marchandId) return false;
      return true;
    }).sort(function (a, c) { return c.at - a.at; });
  },
  /* CE QUE NOUS DEVONS, PAR MARQUE — dérivé des ventes, jamais d'un compteur tenu à part. */
  techReglementsDus: function (o) {
    o = o || {};
    var now = o.now == null ? Date.now() : o.now, self = this, r2 = function (x) { return Math.round(x * 100) / 100; };
    /* (23/09, soir) UN GROUPE PAR ÉCHÉANCE, pas par marque : une marque qui change d'offre garde, pour les ventes déjà
       faites, le délai qu'elles portaient — tout fondre en un seul virement à la date la plus proche payait d'avance ce
       qui n'était pas dû, et l'écran n'affichait qu'une échéance sur deux. L'échéance se lit au jour. */
    var par = {}, jour = function (ts) { var d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    this.techVentes({ marqueStatut: 'a_payer' }).forEach(function (v) {
      if (v.statut === 'annulee') return;
      if (v.echeanceMarque == null) return;           // pas encore arrêtée : rien n'est dû
      if (o.marchandId && v.marchandId !== o.marchandId) return;
      var cle = v.marchandId + '|' + jour(v.echeanceMarque);
      var g = par[cle] || (par[cle] = { marchandId: v.marchandId, marchand: v.marchand, ventes: [], montant: 0, echeance: null, regles: 0, attente: 0, impayes: 0, remisePct: v.remisePct });
      g.ventes.push(v.reference); g.montant = r2(g.montant + v.prixMarque);
      if (v.remisePct !== g.remisePct) g.remiseMixte = true;   // deux taux dans la même journée d'échéance : ça se dit, on ne moyenne pas
      g.echeance = (g.echeance == null || v.echeanceMarque < g.echeance) ? v.echeanceMarque : g.echeance;
      if (v.statut === 'regle') g.regles++; else if (v.statut === 'impaye') g.impayes++; else g.attente++;
    });
    return Object.keys(par).map(function (k) {
      var g = par[k], m = self.techMarchand(g.marchandId);
      g.mode = self.techMarchandMode(m); g.rib = self.techMarchandRib(m);
      g.echu = g.echeance != null && g.echeance <= now;
      g.couvert = g.attente === 0 && g.impayes === 0;      // tout ce qui est dû a déjà été encaissé
      return g;
    }).filter(function (g) { return o.echus ? g.echu : true; }).sort(function (a, b) { return (a.echeance || 0) - (b.echeance || 0); });
  },
  techReglementEmettre: function (marchandId, o) {
    o = o || {};
    var m = this.techMarchand(marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var rib = this.techMarchandRib(m);
    if (!rib) return { ok: false, refus: 'rib', motif: m.raisonSociale + ' n\'a pas déposé de RIB : aucun virement ne part sans lui.' };
    /* (23/09, soir) LE VIREMENT PAIE UNE ÉCHÉANCE : celle demandée (`o.echeance`, au jour), sinon la première — les groupes
       sont triés par échéance, la première est donc la plus ancienne. */
    var dus = this.techReglementsDus({ marchandId: marchandId, now: o.now });
    var memeJour = function (a, b) { var x = new Date(a), y = new Date(b); return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate(); };
    var du = o.echeance != null ? dus.filter(function (g) { return memeJour(g.echeance, o.echeance); })[0] : dus[0];
    if (!du || !du.ventes.length) return { ok: false, motif: 'Rien à payer à cette marque' + (o.echeance != null ? ' pour cette échéance' : '') + '.' };
    if (!du.echu && o.avantEcheance !== true) return { ok: false, refus: 'echeance', motif: 'L\'échéance de cette marque tombe le ' + this.dateHeure(du.echeance) + ' : rien ne se paie avant.' };
    var P = this.techRef().paiement, r2 = function (x) { return Math.round(x * 100) / 100; };
    var l = this.techReglementsGet();
    var seq = this._seq('tech-reglements', this._seqPlancher(l, '^VIR-0*(\\d+)$', 'reference'));
    if (seq == null) return this._refusEcriture('Le virement');
    var v = { reference: 'VIR-' + String(seq).padStart(6, '0'), marchandId: m.id, marchand: m.raisonSociale,
      modeId: du.mode.id, modeLbl: du.mode.libelle, ventes: du.ventes.slice(), montant: du.montant,
      iban: rib.ibanMasque, bic: rib.bic, titulaire: rib.titulaire, instantane: true, cout: +P.coutVirement,
      banque: P.banque, echeance: du.echeance, couvert: du.couvert, at: Date.now(), par: o.par || 'manager' };
    l.unshift(v);
    if (!this._techReglementsPut(l)) return this._refusEcriture('Le virement');
    this._techVenteMaj(du.ventes, { marqueStatut: 'paye', reglementRef: v.reference });
    this._journal('tech_reglement_marque', v.reference, { marchand: m.id, montant: v.montant, ventes: du.ventes.length,
      mode: du.mode.id, iban: v.iban, cout: v.cout, couvert: du.couvert, par: v.par });
    return { ok: true, reglement: v };
  },

  /* ══ L'ABONNEMENT AU LOGICIEL — vendu à part, prélevé à part (22/09) ══════════════════════════════════════
     C'est le service qui justifie l'abonnement : il ne commande RIEN des dates de paiement des bons. Premier
     mois offert ; le forfait gratuit ne se prélève pas. Miroir SQL : tech_subscriptions. ══ */
  techFormules: function () {
    var R = this.techRef(), self = this;
    var l = ((R.logiciel || {}).formules || []).map(function (f) {
      var p = self.param ? self.param('tech.formule.' + f.id + '.prix', f.prix) : f.prix;
      /* (24/09, fondatrice : « quotas des formules réglables ») le nombre de bons du forfait se règle comme son prix ; null = sans limite */
      var q = self.param ? self.param('tech.formule.' + f.id + '.bonsMax', f.bonsMax) : f.bonsMax;
      return Object.assign({}, f, { prix: (p == null || p === '') ? f.prix : +p, bonsMax: (q == null || q === '') ? f.bonsMax : +q });
    });
    /* (24/09, soir) les textes disent le quota EN VIGUEUR : {n} = le quota de la formule, {<id>} = le nom d'une autre formule */
    var noms = {};
    l.forEach(function (f) { noms[f.id] = String(f.nom).split('{n}').join(f.bonsMax == null ? '' : String(f.bonsMax)); });
    var remplir = function (s, f) {
      s = String(s == null ? '' : s).split('{n}').join(f.bonsMax == null ? '' : String(f.bonsMax));
      Object.keys(noms).forEach(function (k) { s = s.split('{' + k + '}').join(noms[k]); });
      return s;
    };
    return l.map(function (f) { return Object.assign(f, { nom: remplir(f.nom, f), detail: remplir(f.detail, f), inclus: (f.inclus || []).map(function (x) { return remplir(x, f); }) }); });
  },
  techFormuleDefaut: function () { var l = this.techFormules(); return l.filter(function (f) { return f.defaut; })[0] || l[0]; },
  techFormule: function (id) { return this.techFormules().filter(function (f) { return f.id === id; })[0] || this.techFormuleDefaut(); },
  techMarchandFormule: function (m) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    return this.techFormule((m && m.formule) || null);
  },
  techMarchandFormuleChoisir: function (id, formuleId, par) {
    var m = this.techMarchand(id); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var f = this.techFormules().filter(function (x) { return x.id === formuleId; })[0];
    if (!f) return { ok: false, champ: 'formule', motif: 'Forfait inconnu.' };
    var patch = { formule: f.id };
    if (f.prix > 0 && !m.formuleDepuis) patch.formuleDepuis = Date.now();   // le premier mois offert court du jour où l'on paie
    if (!this._techMarchandMaj(m.id, patch)) return this._refusEcriture('Le choix du forfait');
    this._journal('tech_formule_choisie', m.id, { formule: f.id, prix: f.prix, par: par || m.id });
    return { ok: true, formule: f };
  },
  /* CE QU'UNE MARQUE DOIT POUR UNE PÉRIODE — 0 pendant le mois offert, 0 sur le forfait gratuit, et jamais deux
     fois la même période (la remise déjà passée fait foi). */
  techAbonnementDu: function (m, periode) {
    m = (typeof m === 'string') ? this.techMarchand(m) : m;
    if (!m || m.statut !== 'validated') return null;
    var f = this.techMarchandFormule(m), R = this.techRef();
    var per = periode || this.periodeCourante().mois;
    if (!(f.prix > 0)) return { formule: f, montant: 0, motif: 'Forfait gratuit' };
    var essai = +((R.logiciel || {}).essaiMois || 0);
    if (m.formuleDepuis && essai > 0) {
      var d = new Date(m.formuleDepuis), fin = new Date(d.getFullYear(), d.getMonth() + essai, d.getDate());
      var per0 = new Date(+per.slice(0, 4), +per.slice(5, 7) - 1, 1);
      if (per0.getTime() < fin.getTime() && new Date(per0.getFullYear(), per0.getMonth() + 1, 0).getTime() < fin.getTime()) {
        return { formule: f, montant: 0, motif: 'Premier mois offert' };
      }
    }
    var deja = this.techAbonnements({ marchandId: m.id, periode: per }).some(function (a) { return a.statut === 'regle'; });
    if (deja) return { formule: f, montant: 0, motif: 'Déjà réglé pour ' + per };
    return { formule: f, montant: f.prix, periode: per };
  },
  /* L'ANNULATION AU COMPTOIR — dans le délai, jamais un bon qui a servi : la vente tombe AVANT d'être prélevée,
     le bon est annulé, le volume du contrat redescend. Rien ne s'efface. Une fois la vente partie dans une remise,
     l'annulation ne se fait plus ici : l'ordre est chez la banque, et ce qui a été débité se rembourse. */
  techBonAnnuler: function (code, o) {
    o = o || {};
    var b = this.techBon(code); if (!b) return { ok: false, motif: 'Bon inconnu.' };
    if (b.etat === 'cancelled') return { ok: false, motif: 'Ce bon est déjà annulé.' };
    if (b.etat === 'redeemed' || b.solde < b.montant) return { ok: false, motif: 'Ce bon a déjà servi chez ' + b.marchand + ' : la vente ne s\'annule plus.' };
    var R = this.techRef();
    if (Date.now() - b.emisLe > R.annulationMinutes * 60000) return { ok: false, motif: 'Le délai d\'annulation au comptoir (' + R.annulationMinutes + ' min) est passé — seule la marque peut encore rembourser.' };
    var motif = String(o.motif || '').trim();
    if (motif.length < 3) return { ok: false, champ: 'motif', motif: 'Un motif est obligatoire : l\'annulation se lit dans le journal.' };
    var pr = b.venteRef ? this.techVente(b.venteRef) : null;
    if (pr && pr.paiement !== 'avance' && pr.statut !== 'a_prelever' && pr.statut !== 'annulee') {
      return { ok: false, motif: 'La vente ' + pr.reference + ' est déjà partie au prélèvement (' + (pr.remiseRef || 'remise déposée') + ') : elle ne s\'annule plus au comptoir. Fais une reprise avec la marque.' };
    }
    /* (23/09) LA VENTE PAYÉE D'AVANCE S'ANNULE AUSSI — et elle RECRÉDITE le solde du commissionnaire : il a payé,
       il récupère. Elle n'a jamais été « à prélever », elle est née réglée ; le contrôle porte donc sur le
       paiement, pas sur le statut. */
    if (pr && pr.paiement === 'avance' && pr.statut === 'regle') {
      this._avanceCrediter('revendeur', b.revendeurId, pr.prixPoint, { par: o.par || b.revendeurId,
        acteur: pr.revendeur, motif: 'Vente annulée · ' + pr.reference, source: pr.reference });
      this._techVenteMaj(pr.reference, { statut: 'annulee', marqueStatut: 'annule', annuleeLe: Date.now(), motifAnnulation: motif, annuleePar: o.par || b.revendeurId });
      this._journal('tech_vente_annulee', pr.reference, { marchand: b.marchandId, revendeur: b.revendeurId, bon: b.id,
        prixPoint: pr.prixPoint, prixMarque: pr.prixMarque, paiement: 'avance', motif: motif, par: o.par || b.revendeurId });
    } else if (pr && pr.statut === 'a_prelever') {
      this._techVenteMaj(pr.reference, { statut: 'annulee', marqueStatut: 'annule', annuleeLe: Date.now(), motifAnnulation: motif, annuleePar: o.par || b.revendeurId });
      this._journal('tech_vente_annulee', pr.reference, { marchand: b.marchandId, revendeur: b.revendeurId, bon: b.id,
        prixPoint: pr.prixPoint, prixMarque: pr.prixMarque, motif: motif, par: o.par || b.revendeurId });
    }
    var l = this.techBonsGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === b.id) i = k;
    l[i].etat = 'cancelled'; l[i].annuleLe = Date.now(); l[i].motifAnnulation = motif;
    if (!this._techBonsPut(l)) return this._refusEcriture('L\'annulation du bon');
    this._journal('tech_bon_annule', b.id, { marchand: b.marchandId, revendeur: b.revendeurId, montant: b.montant, motif: motif, vente: b.venteRef || null, par: o.par || b.revendeurId });
    return { ok: true, bon: this.techBon(code), vente: pr ? this.techVente(pr.reference) : null };
  },
  techBonEtatLbl: function (e) { return this.TECH_BON_ETATS[e] || e || '—'; },
  techBonsGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-bons') || '[]') || []; } catch (e) { return []; } },
  _techBonsPut: function (l) { if (!this._ecrit('pec-tech-bons', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techBon: function (code) {
    var c = String(code || '').toUpperCase().replace(/\s/g, '');
    return this.techBonsGet().filter(function (x) { return x.code === c; })[0] || null;
  },
  techBons: function (o) {
    o = o || {};
    var l = this.techBonsGet().slice();
    if (o.marchandId) l = l.filter(function (x) { return x.marchandId === o.marchandId; });
    if (o.revendeurId) l = l.filter(function (x) { return x.revendeurId === o.revendeurId; });
    if (o.etat) l = l.filter(function (x) { return x.etat === o.etat; });
    return l.sort(function (a, b) { return (b.emisLe || 0) - (a.emisLe || 0); });
  },
  /* L'ÉMISSION — elle exige un contrat VIVANT entre ce commerçant et ce revendeur. Sans contrat, pas de
     bon : c'est le contrat qui ouvre la distribution, et c'est lui qui la ferme. */
  /* ══ LE QUOTA D'ÉDITION D'UNE MARQUE — DÉRIVÉ (23/09) ═════════════════════════════════════════════
     `bonsMax` était écrit dans le référentiel et appliqué nulle part : un forfait « 30 bons par mois » qui n'en
     comptait aucun. Ici on compte les codes ÉDITÉS ce mois (une tranche compte à son édition, une vente à la
     volée compte à la vente), et la valeur des bons VENDUS sur douze mois glissants — le seuil de l'ACPR. */
  /* LES MOYENS DE RÈGLEMENT AU COMPTOIR — la liste que le comptoir peut cocher, et que l'app cliente lit pour sa
     vigilance. Ce n'est PAS une information client : c'est un fait LCB-FT, gardé sur le bon, jamais imprimé. */
  MOYENS_COMPTOIR: { especes: 'Espèces', carte: 'Carte bancaire' },
  /* (23/09, fondatrice) LES PALIERS DE VÉRIFICATION D'IDENTITÉ DU PORTEUR DE BONS : cumul des bons réglés en espèces
     au-delà de 250 €, ou par carte au-delà de 500 €, sur la fenêtre glissante des plafonds (bonsRef). Paramétrables. */
  kycPorteurRef: function () {
    var p = this.param ? this.param.bind(this) : function (k, d) { return d; };
    var K = ((this.ref || {}).kyc || {}).porteur || {};
    return { especesEur: +p('kyc.porteur.especesEur', K.especesEur), carteEur: +p('kyc.porteur.carteEur', K.carteEur),
      fenetreJours: +p('kyc.porteur.fenetreJours', this.bonsRef().fenetrePlafondJours || 30),
      source: "politique de prévention de la fraude (intérêt légitime, art. 6.1.f RGPD) — PayEnCash n'est pas assujettie à la LCB-FT (art. L561-2 CMF ; position ACPR 2022-P-01) ; l'identification au-delà de 10 000 € en espèces (art. L561-2 11° et R561-10) s'impose au commerce de biens, pas à nous" };
  },

  techQuota: function (marchandId, now) {
    var m = this.techMarchand(marchandId); if (!m) return null;
    now = now == null ? Date.now() : now;
    var f = this.techMarchandFormule(m), R = this.techRef(), S = R.seuils || {};
    var d0 = new Date(now), debutMois = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime();
    var bons = this.techBons({ marchandId: m.id });
    var emisMois = bons.filter(function (b) { return (b.emisLe || 0) >= debutMois && b.etat !== 'cancelled'; }).length;
    var depuis12 = new Date(d0.getFullYear() - 1, d0.getMonth(), d0.getDate()).getTime();
    /* LE SEUIL SE COMPTE À L'ÉDITION : nous achetons le bon quand il naît (au comptoir, au montant demandé) — un bon
       émis et non annulé est une opération, qu'il ait ou non reçu son tampon « vendu » ensuite. */
    var valeur12 = bons.filter(function (b) { return (b.emisLe || 0) >= depuis12 && b.etat !== 'cancelled'; })
      .reduce(function (a, b) { return a + (b.montant || 0); }, 0);
    var max = (f.bonsMax == null) ? null : +f.bonsMax;
    var reste = max == null ? null : Math.max(0, max - emisMois);
    var seuil = +S.acprMontant12Mois || 0;
    return { formule: f, emisMois: emisMois, max: max, reste: reste, illimite: max == null,
      valeur12Mois: Math.round(valeur12 * 100) / 100, seuilAcpr: seuil,
      seuilPct: seuil > 0 ? Math.round(valeur12 / seuil * 1000) / 10 : 0,
      seuilProche: seuil > 0 && valeur12 >= seuil * ((+S.alertePct || 80) / 100),
      seuilAtteint: seuil > 0 && valeur12 >= seuil,
      page: +((R.logiciel || {}).pageBons) || 20 };
  },
  techBonEmettre: function (o) {
    o = o || {};
    var m = this.techMarchand(o.marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (m.statut !== 'validated') return { ok: false, motif: 'Cette marque n\'est pas validée — aucun bon ne s\'émet.' };
    if (!this.techMarchandConforme(m.id)) return { ok: false, motif: 'Sa déclaration « réseau limité » n\'est pas validée — aucun bon ne s\'émet.' };
    var montant = Math.round((+String(o.montant || '').toString().replace(',', '.') || 0) * 100) / 100;
    if (!(montant > 0)) return { ok: false, champ: 'montant', motif: 'Un bon porte un montant.' };
    /* ══ (23/09, fondatrice : « enlève mes points de vente — simplement une carte de tous les points du réseau »,
       « c'est nous qui achetons les bons à la marque ») LA VENTE NE DÉPEND PLUS D'UN CONTRAT MARQUE↔POINT : le point
       est lié à PayEnCash par son contrat de distribution, la marque à PayEnCash par son contrat-cadre ; entre
       eux, rien — c'est le grossiste qui achète et qui revend. (23/09, nuit) La mise en relation de l'ancien modèle
       (mandat de représentation, match, contrat à usage unique) est retirée : il n'y a plus de contrat à porter. */
    var trav = this.techMarchandPeutTravailler(m.id);
    if (!trav.ok) return { ok: false, refus: 'marque', motif: 'Cette marque ne peut pas encore vendre : ' + trav.manque[0].libelle + (trav.manque.length > 1 ? ' (+' + (trav.manque.length - 1) + ')' : ''), href: trav.href, manque: trav.manque };
    /* (22/09 — grossiste) LE BON NAÎT DE LA VENTE, ET LA VENTE DE CE QUI LA REND POSSIBLE : un point validé, un
       mandat de prélèvement signé, aucun impayé, un encours sous le plafond. Aucun argent ne bouge au comptoir —
       le débit du point part au prochain arrêté, dans la remise de prélèvements, et la marque est réglée au délai
       de l'offre qu'elle a choisie. Un refus se dit ici, avant d'émettre : jamais un bon sans ligne à prélever. */
    var peut = this.techPeutVendre(o.revendeurId, m.id, montant);
    if (!peut.ok) return { ok: false, refus: peut.refus, motif: peut.motif, encours: peut.encours || null };
    /* ══ (23/09) LE CODE VIENT D'UNE TRANCHE ÉDITÉE PAR LA MARQUE, S'IL Y EN A ; sinon il s'édite à la volée
       et COMPTE dans le quota du mois. Au bout du quota, la vente est refusée AVANT d'écrire quoi que ce soit —
       et le refus dit à quoi ça tient (le forfait de la marque), pas « erreur ». */
    /* ══ (23/09) LE BON S'ÉDITE À LA VENTE, AU MONTANT QUE LE CLIENT DEMANDE — JAMAIS D'AVANCE (fondatrice : « nous
       vendons à des montants variables : c'est à chaque édition de bon, pas 10 d'avance »). Chaque vente est une
       édition, et elle COMPTE dans le quota du mois de la marque : au bout du forfait, la vente est refusée AVANT
       d'écrire quoi que ce soit, et le refus dit à quoi ça tient. */
    var q = this.techQuota(m.id);
    if (q.seuilAtteint) return { ok: false, refus: 'seuil_acpr', motif: 'Cette marque a atteint le seuil légal de ' + this.eur(q.seuilAcpr) + ' de bons sur douze mois : aucun bon ne s\'émet avant sa déclaration à l\'ACPR (art. L521-3 II CMF).' };
    if (q.reste != null && q.reste <= 0) return { ok: false, refus: 'quota', motif: 'Cette marque a édité ses ' + q.max + ' bons du mois (forfait « ' + q.formule.nom + ' ») : elle doit souscrire un forfait supérieur pour que la vente reprenne.' };
    var pr = this._techVenteEnregistrer(this.techRevendeur(o.revendeurId), m, montant, o);
    if (!pr.ok) return { ok: false, refus: pr.motif, motif: pr.message || pr.motif };
    var l = this.techBonsGet(), now = Date.now(), R = this.bonsRef(), b;
    {
      var seq = this._seq('tech-bons', this._seqPlancher(l, '^TBN-0*(\\d+)$', 'id'));
      if (seq == null) return this._refusEcriture('L\'émission du bon');
      /* LE CODE PORTE LE PRÉFIXE DU RÉFÉRENTIEL, pas une lettre écrite ici — et il se tire du générateur sûr
         du navigateur, jamais de Math.random : un code de bon prévisible, c'est un bon qu'on devine. */
      var g1 = this._techAlea(4), g2 = this._techAlea(4), g3 = this._techAlea(4);
      if (!g1 || !g2 || !g3) return { ok: false, motif: 'Ce navigateur ne sait pas tirer un code sûr — aucun bon ne sera inventé.' };
      var code = (this.techRef().prefixeBon + g1 + '-' + g2 + '-' + g3).toUpperCase();
      var exp = new Date(now); exp.setMonth(exp.getMonth() + (R.validiteMois || 12));
      b = { id: 'TBN-' + String(seq).padStart(5, '0'), code: code, marchandId: m.id, marchand: m.raisonSociale,
        site: m.siteUrl, revendeurId: o.revendeurId, montant: montant, solde: montant,
        etat: 'allocated', emisLe: now, expireLe: exp.getTime(), venduLe: null, utiliseLe: null, annuleLe: null,
        venteRef: pr.vente.reference, prixPoint: pr.vente.prixPoint, prixMarque: pr.vente.prixMarque,   // le bon porte la vente qui le paiera
        moyen: this.MOYENS_COMPTOIR[o.moyen] ? o.moyen : null };
      l.push(b);
    }
    if (!this._techBonsPut(l)) return this._refusEcriture('L\'émission du bon');
    this._techVenteLier(pr.vente.reference, b.id);
    this._journal('tech_bon_emis', b.id, { marchand: m.id, revendeur: o.revendeurId, montant: montant,
      vente: pr.vente.reference, prixPoint: pr.vente.prixPoint, prixMarque: pr.vente.prixMarque });
    return { ok: true, bon: b, ticket: this.techBonTicketHTML(b), vente: this.techVente(pr.vente.reference) };
  },
  techBonVendu: function (code, o) {
    o = o || {};
    var b = this.techBon(code); if (!b) return { ok: false, motif: 'Bon inconnu.' };
    if (b.etat !== 'allocated') return { ok: false, motif: 'Ce bon est « ' + this.techBonEtatLbl(b.etat) + ' » — il ne se vend pas deux fois.' };
    var l = this.techBonsGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === b.id) i = k;
    l[i].etat = 'sold'; l[i].venduLe = Date.now();
    if (!this._techBonsPut(l)) return this._refusEcriture('La vente du bon');
    /* ON N'ENREGISTRE NI LE PRIX DE VENTE, NI LA MARGE : ils appartiennent au revendeur (§5.1), et les
       inscrire ici reviendrait à tenir la comptabilité d'un flux qui ne nous regarde pas. */
    this._journal('tech_bon_vendu', b.id, { marchand: b.marchandId, revendeur: b.revendeurId });
    return { ok: true, bon: this.techBon(code) };
  },
  /* ══ (21/09) VÉRIFIER, PUIS UTILISER — les deux gestes de l'app Mes bons sur un bon proposé ═══════════
     Décision fondatrice du 20/09 : « si vérifié, alors [utiliser] ». Le porteur voit ce que son bon PRENDRA avant
     de le laisser prendre : un contrôle, une seule fois écrit, qui sert aux deux portes. Il ne touche à rien. */
  _techBonControle: function (code, o) {
    o = o || {};
    var b = this.techBon(code);
    if (!b) {
      /* (20/09) LA FRONTIÈRE SE DIT, elle ne se devine pas. Un Bon d'achat PayEnCash présenté chez un
         commerçant du réseau n'est pas un « code inconnu » : c'est un code d'un AUTRE réseau, et le dire
         évite au revendeur de chercher une faute qui n'existe pas. (21/09) Le motif est du TEXTE : il
         s'affichait balises comprises (« <b>Bon d'achat… »), les deux écrans le posant en textContent. */
      var pec = this.bonParCode ? this.bonParCode(code) : null;
      if (pec) return { ok: false, reseauAutre: 'payencash', motif: 'Ce code est un Bon d\'achat PayEnCash : il s\'utilise sur payencash.fr (Mode, Fly), jamais chez une marque du réseau. Les deux réseaux ne se mélangent pas.' };
      return { ok: false, motif: 'Bon inconnu — vérifie le code imprimé sur ton ticket.' };
    }
    if (o.marchandId && o.marchandId !== b.marchandId) {
      return { ok: false, motif: 'Ce bon n\'est utilisable que chez ' + b.marchand + ' — c\'est un réseau limité, il ne vaut pas ailleurs.', reseauLimite: true };
    }
    if (b.etat === 'redeemed') return { ok: false, motif: 'Ce bon a déjà été utilisé le ' + new Date(b.utiliseLe).toLocaleDateString('fr-FR') + '.' };
    if (b.etat === 'cancelled') return { ok: false, motif: 'Ce bon a été annulé.' };
    if (b.expireLe && Date.now() > b.expireLe) return { ok: false, motif: 'Ce bon a expiré le ' + new Date(b.expireLe).toLocaleDateString('fr-FR') + '.' };
    var du = Math.round((+o.montant || 0) * 100) / 100;
    if (!(du > 0)) return { ok: false, champ: 'montant', motif: 'Dis ce qu\'il manque encore sur ce bon proposé.' };
    var pris = Math.min(b.solde, du);
    if (!(pris > 0)) return { ok: false, motif: 'Ce bon est épuisé.' };
    return { ok: true, bon: b, pris: pris, soldeApres: Math.round((b.solde - pris) * 100) / 100 };
  },
  techBonVerifier: function (code, o) { return this._techBonControle(code, o); },
  /* ══ (24/09, soir — décision fondatrice : « la marque n'a pas le droit de refuser un bon émis par elle-même » ; relecture, constat 127)
     LE BON REFUSÉ, DE BOUT EN BOUT. Le porteur le signale depuis Mes bons (une demande `motif: 'bon_refuse'`, avec le code et la
     marque) ; la hotline CONTRÔLE le bon — la même règle que l'utilisation, sans montant — et, s'il est valide, NOTE le refus chez la
     marque ; la marque le lit dans son « à faire », le manager sur sa fiche. Un bon utilisé, annulé, expiré ou épuisé n'est pas un
     refus : la hotline l'explique au porteur, et rien n'est noté. */
  techBonEtatPorteur: function (code) {
    var b = this.techBon(code); if (!b) return { ok: false, motif: 'code inconnu du réseau' };
    if (b.etat === 'cancelled') return { ok: false, bon: b, motif: 'bon annulé' };
    if (b.etat === 'redeemed' || !(b.solde > 0.004)) return { ok: false, bon: b, motif: 'bon déjà utilisé en totalité' };
    if (b.expireLe && Date.now() > b.expireLe) return { ok: false, bon: b, motif: 'bon expiré le ' + this.dateCourte(b.expireLe) };
    return { ok: true, bon: b, motif: 'bon valide : ' + this.eur(b.solde) + ' restant' + (b.expireLe ? ', jusqu’au ' + this.dateCourte(b.expireLe) : '') };
  },
  techRefusSignales: function (marchandId) {
    if (typeof window === 'undefined' || !window.PEC_BUS || !PEC_BUS.demandesSav) return [];
    return PEC_BUS.demandesSav().filter(function (d) { return d.motif === 'bon_refuse' && (!marchandId || d.marchandId === marchandId); });
  },
  techRefusNoter: function (demandeId, par) {
    var d = this.techRefusSignales().filter(function (x) { return x.id === demandeId; })[0];
    if (!d) return { ok: false, motif: 'Signalement inconnu.' };
    if (d.refusNote) return { ok: false, motif: 'Refus déjà noté le ' + this.dateCourte(d.refusNote.at) + ' par ' + (d.refusNote.par || '—') + '.' };
    var c = this.techBonEtatPorteur(d.ref);
    if (!c.ok) return { ok: false, refus: 'bon', motif: 'Pas un refus de la marque : ' + c.motif + '. Explique-le au porteur.' };
    var note = { at: Date.now(), par: par || 'hotline', solde: c.bon.solde };
    var x = PEC_BUS.annoterDemande(d.id, { refusNote: note }, 'tech_bon_refus_note', { marchand: d.marchandId, code: d.ref, par: note.par });
    if (!x) return this._refusEcriture('Le refus noté');
    return { ok: true, note: note };
  },
  /* L'UTILISATION — chez le commerçant, et NULLE PART AILLEURS. C'est la règle du réseau limité, et elle
     est vérifiée ici : un bon présenté sur le site d'un autre commerçant est refusé, avec son motif. */
  techBonUtiliser: function (code, o) {
    var v = this._techBonControle(code, o);
    if (!v.ok) return v;
    var b = v.bon, pris = v.pris;
    var l = this.techBonsGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === b.id) i = k;
    l[i].solde = Math.round((b.solde - pris) * 100) / 100;
    if (l[i].solde <= 0) { l[i].etat = 'redeemed'; l[i].utiliseLe = Date.now(); }
    if (!this._techBonsPut(l)) return this._refusEcriture('L\'utilisation du bon');
    this._journal('tech_bon_utilise', b.id, { marchand: b.marchandId, pris: pris, reste: l[i].solde });
    return { ok: true, pris: pris, reste: l[i].solde, bon: this.techBon(code) };
  },
  /* ══ LE BON PROPOSÉ (20/09, fondatrice : « je veux que le e-commerce puisse générer par lui-même un lien
     pour un client avec le montant variable souhaité ; ça génère un ticket avec flashcode, pas d'encaissement »)
     (23/09, fondatrice : « vérifie "demander une somme à un client" par la vente d'un bon — attention au
     vocabulaire juridique ») ═══════════════════════════════════════════════════════════════════════════
     Ça s'appelait « demande de paiement », et le mot était faux en droit : nous ne demandons aucun paiement à
     personne, nous ne réglons rien, nous ne tenons pas de dette. Ce que la marque fait ici, c'est PROPOSER UN
     BON D'ACHAT d'un montant précis à un client (pour sa commande, son devis — sa référence à elle) : le client
     l'achète au comptoir d'un commerce du réseau (nous l'achetons à la marque à ce moment-là), puis il
     l'UTILISE chez la marque, et chez elle seule — réseau limité. Le lien porte cette proposition ; la page
     du client dit où acheter le bon, et l'app « Mes bons » sert à l'utiliser.
     L'USAGE D'UN BON PASSE PAR L'APP « MES BONS », TOUJOURS (23/09 : « app obligatoire pour utiliser un bon de
     marque, ça permet de retracer ») : techLienUtiliserBon exige le compte du porteur (`par`), et chaque usage
     le garde. Aucun fonds ne transite, à aucun moment : nous tenons l'état d'un titre, pas d'un paiement.
     PLUSIEURS BONS SONT ADMIS sur un même bon proposé (règle du 19/09, soir) : ce qui manque encore se
     décompte bon après bon, et la proposition est « couverte » quand plus rien ne manque. ═══════════════ */
  TECH_LIEN_ETATS: { open: 'Proposé', partial: 'Entamé', used: 'Couvert', cancelled: 'Annulé', expired: 'Expiré' },
  techLienEtatLbl: function (e) { return this.TECH_LIEN_ETATS[e] || e || '—'; },
  techLiensGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-liens') || '[]') || []; } catch (e) { return []; } },
  _techLiensPut: function (l) { if (!this._ecrit('pec-tech-liens', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  /* L'ÉTAT VIF SE DÉRIVE, il ne s'écrit pas : un bon proposé périmé l'est par le calendrier, pas parce qu'une
     tâche est passée. Ce qui manque encore aussi — c'est le montant proposé moins ce que les bons ont pris. */
  _techLienVif: function (x) {
    if (!x) return null;
    var l = Object.assign({}, x);
    var pris = (l.usages || []).reduce(function (a, p) { return a + (p.pris || 0); }, 0);
    l.pris = Math.round(pris * 100) / 100;
    l.restant = Math.round((l.montant - pris) * 100) / 100;
    if (l.etat === 'cancelled' || l.etat === 'used') return l;
    if (l.expireLe && Date.now() > l.expireLe) { l.etat = 'expired'; return l; }
    l.etat = pris > 0 ? 'partial' : 'open';
    return l;
  },
  techLien: function (slug) {
    var x = this.techLiensGet().filter(function (y) { return y.slug === slug || y.id === slug; })[0];
    return x ? this._techLienVif(x) : null;
  },
  techLiens: function (o) {
    o = o || {};
    var d = this;
    var l = this.techLiensGet().map(function (x) { return d._techLienVif(x); });
    if (o.marchandId) l = l.filter(function (x) { return x.marchandId === o.marchandId; });
    if (o.etat) l = l.filter(function (x) { return x.etat === o.etat; });
    if (o.vivantes) l = l.filter(function (x) { return x.etat === 'open' || x.etat === 'partial'; });
    return l.sort(function (a, b) { return (b.creeLe || 0) - (a.creeLe || 0); });
  },
  /* ══ (23/09, fondatrice : « la possibilité de générer un lien à partager par Snap, WhatsApp, TikTok etc.,
     pour vendre un bon d'achat / carte cadeau — démarche commerciale ») LE LIEN DE VENTE ═════════════════
     CE N'EST PAS UNE DEMANDE DE PAIEMENT. Une demande porte un montant et s'éteint quand elle est réglée ;
     un lien de vente est PERMANENT, sans montant, et sert à une seule chose : faire connaître à un public le
     bon d'achat d'une marque. Celui qui l'ouvre choisit SA somme, et c'est à ce moment-là seulement qu'une
     demande naît — avec `origineLien`, pour que la marque sache ce que son partage a produit.
     VOCABULAIRE (règle ACPR, 23/09 : « une erreur coûte plus qu'une absence d'information ») : ce lien VEND un
     BON D'ACHAT utilisable uniquement chez la marque qui l'émet (exclusion « réseau limité », art. L521-3 I 1°
     CMF). Il n'ouvre aucun compte, ne recharge rien, ne transfère pas de fonds, et PayEnCash ne détient à
     aucun moment l'argent du client : le bon s'achète au comptoir d'un commerce du réseau. ══ */
  /* ══ (23/09, fondatrice : « dans Outils je veux un éditeur visuel · intègre la logique de fournisseur pour
     publier un article · supprime le contrôle facture fournisseur pour la provenance, ce sont leurs boutiques,
     nous ne contrôlons pas ce qu'ils vendent, ils doivent simplement respecter la loi ») L'ARTICLE D'UNE MARQUE
     ═══════════════════════════════════════════════════════════════════════════════════════
     C'EST LA MÊME MÉCANIQUE QUE LA PUBLICATION D'UN FOURNISSEUR MODE — photo, marque, modèle, prix, tailles et
     quantités — MOINS LE CONTRÔLE DE PROVENANCE. Et c'est une différence de DROIT, pas de confort : le
     fournisseur Mode revend des biens d'occasion, ce qui nous impose le livre de police et la facture
     d'achat (art. 321-7 du code pénal) ; une marque vend SES produits, dans SA boutique, sous SA
     responsabilité. Nous n'avons rien à contrôler de ce qu'elle vend : nous lui achetons des BONS D'ACHAT.
     LE STOCK SE DÉRIVE : quantités déclarées moins les bons que le réseau a vendus sur CET article. Aucun
     nombre « restant » n'est stocké — un stock écrit est un stock faux le jour où une vente lui échappe. */
  techArticlesGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-articles') || '[]') || []; } catch (e) { return []; } },
  _techArticlesPut: function (l) { if (!this._ecrit('pec-tech-articles', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techArticle: function (id) { return this.techArticlesGet().filter(function (x) { return x.id === id; })[0] || null; },
  techArticles: function (o) {
    o = o || {};
    var l = this.techArticlesGet().slice();
    if (o.marchandId) l = l.filter(function (x) { return x.marchandId === o.marchandId; });
    return l.sort(function (a, b) { return (b.creeLe || 0) - (a.creeLe || 0); });
  },
  techArticleCreer: function (o) {
    o = o || {};
    var m = this.techMarchand(o.marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    var nom = String(o.modele || '').trim();
    if (!nom) return { ok: false, champ: 'modele', motif: 'Donne un nom à ton article : c\'est ce qui sera écrit sur le visuel.' };
    var prix = Math.round((parseFloat(String(o.prix == null ? '' : o.prix).replace(',', '.')) || 0) * 100) / 100;
    if (!(prix > 0)) return { ok: false, champ: 'prix', motif: 'Le prix de l\'article est obligatoire — c\'est lui qui s\'affiche, barré ou non.' };
    /* LA REMISE EST FACULTATIVE. Avec elle, le visuel montre le prix BARRÉ et ce qu'il reste à payer avec le
       bon ; sans elle, il ne montre aucun faux rabais — il propose le bon comme un cadeau. */
    var rem = Math.round((parseFloat(String(o.remise == null ? '' : o.remise).replace(',', '.')) || 0) * 100) / 100;
    if (rem < 0) rem = 0;
    if (rem >= prix) return { ok: false, champ: 'remise', motif: 'Une remise égale ou supérieure au prix n\'en est pas une.' };
    /* LES TAILLES ET LEURS QUANTITÉS (23/09 : « sur les visuels ça doit afficher les tailles disponibles par
       leur quantité »). Une taille sans quantité n'est pas disponible : on ne l'écrit pas. */
    var tailles = (o.tailles || []).map(function (t) {
      return { taille: String(t.taille || '').trim(), qte: Math.max(0, parseInt(t.qte, 10) || 0) };
    }).filter(function (t) { return t.taille && t.qte > 0; });
    if (!tailles.length) return { ok: false, champ: 'tailles', motif: 'Indique au moins une taille avec sa quantité — c\'est ce que le visuel annonce.' };
    var l = this.techArticlesGet();
    var seq = this._seq('tech-articles', this._seqPlancher(l, '^TAR-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('La publication de l\'article');
    var alea = this._techAlea(6);
    if (!alea) return { ok: false, motif: 'Ce navigateur ne sait pas tirer un identifiant sûr — aucun lien ne sera inventé.' };
    var base = String(nom).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18);
    /* (23/09) CE QUE LA MODALE DE PUBLICATION SAISIT, tel quel : la marque décrit SON article (catégorie, genre,
       couleurs, matière, état déclaré, description, photos). Aucun contrôle d'atelier, aucune provenance : c'est sa
       boutique. La première photo est celle du visuel. */
    var photos = (o.photos || []).map(function (p) { return String(p || '').trim(); }).filter(Boolean);
    var a = { id: 'TAR-' + String(seq).padStart(5, '0'), marchandId: m.id, marque: String(o.marque || m.raisonSociale).trim(),
      modele: nom, prix: prix, remise: rem, photo: String(o.photo || photos[0] || '').trim() || null, photos: photos,
      tailles: tailles, esprit: String(o.esprit || '').trim() || null,
      categorie: String(o.categorie || '').trim() || null, sous: String(o.sous || '').trim() || null, genre: String(o.genre || '').trim() || null,
      couleurs: (o.couleurs || []).map(String).filter(Boolean), matiere: String(o.matiere || '').trim() || null,
      etat: String(o.etat || '').trim() || null, description: String(o.description || '').trim() || null,
      slug: (base || 'article') + '-' + alea.toLowerCase(), creeLe: Date.now(), creePar: o.par || null };
    l.push(a);
    if (!this._techArticlesPut(l)) return this._refusEcriture('La publication de l\'article');
    this._journal('tech_article_publie', a.id, { marchand: m.id, modele: nom, prix: prix });
    return { ok: true, article: this.techArticle(a.id) };
  },
  /* GÉRER SON STOCK APRÈS PUBLICATION (23/09, fondatrice : « ils doivent publier et gérer leur stock pour leur bon
     d'achat ») : les quantités déclarées se corrigent ; les bons déjà vendus restent déduits (le disponible se
     DÉRIVE), et on ne peut pas déclarer moins que ce qui est déjà vendu. Aucune livraison, aucune expédition : nous
     ne gérons que le stock de BONS, jamais la marchandise. */
  techArticleMajTailles: function (id, tailles, par) {
    var l = this.techArticlesGet(), i = -1;
    l.forEach(function (x, k) { if (x.id === id) i = k; });
    if (i < 0) return { ok: false, motif: 'Article inconnu.' };
    var t = (tailles || []).map(function (x) { return { taille: String(x.taille || '').trim(), qte: Math.max(0, parseInt(x.qte, 10) || 0) }; })
      .filter(function (x) { return x.taille; });
    if (!t.some(function (x) { return x.qte > 0; })) return { ok: false, champ: 'tailles', motif: 'Garde au moins une taille avec une quantité — ou retire l\'article.' };
    var vendus = this.techArticleStock(l[i]).vendus, total = t.reduce(function (n, x) { return n + x.qte; }, 0);
    if (total < vendus) return { ok: false, champ: 'tailles', motif: vendus + ' bon(s) sont déjà vendus sur cet article : le total déclaré ne peut pas descendre en dessous.' };
    l[i].tailles = t; l[i].majLe = Date.now();
    if (!this._techArticlesPut(l)) return this._refusEcriture('La mise à jour du stock');
    this._journal('tech_article_stock', id, { par: par || null, total: total });
    return { ok: true, article: l[i], stock: this.techArticleStock(l[i]) };
  },
  techArticleSupprimer: function (id, par) {
    var l = this.techArticlesGet(), n = l.length;
    l = l.filter(function (x) { return x.id !== id; });
    if (l.length === n) return { ok: false, motif: 'Article inconnu.' };
    if (!this._techArticlesPut(l)) return this._refusEcriture('Le retrait de l\'article');
    this._journal('tech_article_retire', id, { par: par || null });
    return { ok: true };
  },
  /* LE STOCK D'UN ARTICLE — DÉRIVÉ. « Lorsque nous lui achetons un bon, ça se déduit du stock » : chaque bon
     vendu par le réseau sur CET article en retire une unité. Rien n'est écrit : on compte. */
  techArticleStock: function (id) {
    var a = (typeof id === 'string') ? this.techArticle(id) : id;
    if (!a) return { total: 0, vendus: 0, dispo: 0, tailles: [], epuise: true };
    var total = (a.tailles || []).reduce(function (n, t) { return n + t.qte; }, 0);
    var self = this;
    var dem = this.techLiensGet().filter(function (x) { return x.origineLien === a.slug; });
    var vendus = 0;
    dem.forEach(function (d) { (d.usages || []).forEach(function (p) { if (p.code && self.techBon(p.code)) vendus++; }); });
    var dispo = Math.max(0, total - vendus);
    return { total: total, vendus: vendus, dispo: dispo, epuise: dispo <= 0,
      tailles: (a.tailles || []).map(function (t) { return { taille: t.taille, qte: t.qte }; }) };
  },
  /* L'ADRESSE DU VISUEL — le même chemin que le lien de vente, avec le slug de l'article : ce que le
     flashcode porte, c'est ce que le client ouvrira. */
  techArticleUrl: function (slug) {
    var base = (typeof location !== 'undefined' && location.href) ? location.href : '';
    var i = base.indexOf('/ui/');
    var racine = i > -1 ? base.slice(0, i) + '/ui/tech/' : '';
    return racine + '07-lien.html?a=' + encodeURIComponent(slug);
  },
  techArticleParSlug: function (slug) { return this.techArticlesGet().filter(function (x) { return x.slug === slug; })[0] || null; },

  techVenteLiensGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-liens-vente') || '[]') || []; } catch (e) { return []; } },
  _techVenteLiensPut: function (l) { if (!this._ecrit('pec-tech-liens-vente', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  techVenteLien: function (marchandId) { return this.techVenteLiensGet().filter(function (x) { return x.marchandId === marchandId; })[0] || null; },
  techVenteLienParSlug: function (slug) { return this.techVenteLiensGet().filter(function (x) { return x.slug === slug; })[0] || null; },
  /* UN SEUL LIEN PAR MARQUE : on le rend s'il existe, on ne multiplie pas les adresses d'un même partage. */
  techVenteLienCreer: function (marchandId, par) {
    var m = this.techMarchand(marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (m.statut !== 'validated') return { ok: false, motif: 'Cette marque n\'est pas vérifiée — aucun lien ne part à son nom.' };
    if (!this.techMarchandConforme(m.id)) return { ok: false, motif: 'Sa déclaration « réseau limité » n\'est pas validée — rien ne s\'ouvre avant.' };
    var trav = this.techMarchandPeutTravailler(m.id);
    if (!trav.ok) return { ok: false, refus: 'marque', motif: 'Avant de partager un lien : ' + trav.manque[0].libelle, href: trav.href, manque: trav.manque };
    var deja = this.techVenteLien(m.id); if (deja) return { ok: true, lien: deja, reprise: true };
    var alea = this._techAlea(6);
    if (!alea) return { ok: false, motif: 'Ce navigateur ne sait pas tirer un identifiant sûr — aucun lien ne sera inventé.' };
    var base = String(m.raisonSociale || m.id).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18);
    var x = { slug: (base || 'marque') + '-' + alea.toLowerCase(), marchandId: m.id, marchand: m.raisonSociale,
      site: m.siteUrl, creeLe: Date.now(), creePar: par || null, ouvertures: 0, derniereOuverture: null };
    var l = this.techVenteLiensGet(); l.push(x);
    if (!this._techVenteLiensPut(l)) return this._refusEcriture('Le lien de vente');
    this._journal('tech_lien_vente_cree', x.slug, { par: par || null, marchand: m.id });
    return { ok: true, lien: x };
  },
  /* L'OUVERTURE SE COMPTE À LA SOURCE : c'est la page ouverte qui la déclare, pas un calcul d'écran. */
  techVenteLienOuvrir: function (slug) {
    var l = this.techVenteLiensGet(), i = -1;
    l.forEach(function (x, k) { if (x.slug === slug) i = k; });
    if (i < 0) return { ok: false, motif: 'Lien inconnu.' };
    l[i].ouvertures = (l[i].ouvertures || 0) + 1; l[i].derniereOuverture = Date.now();
    if (!this._techVenteLiensPut(l)) return { ok: false, motif: 'Écriture refusée.' };
    return { ok: true, lien: l[i] };
  },
  /* CE QUE LE PARTAGE A PRODUIT — DÉRIVÉ des bons proposés nés du lien et des bons qui les ont couverts. */
  techVenteLienStats: function (marchandId) {
    var v = this.techVenteLien(marchandId);
    if (!v) return { lien: null, ouvertures: 0, demandes: 0, bons: 0, valeur: 0 };
    var self = this;
    var dem = this.techLiensGet().filter(function (x) { return x.origineLien === v.slug; });
    var bons = 0, valeur = 0;
    dem.forEach(function (d) {
      (d.usages || []).forEach(function (p) {
        var b = p.code ? self.techBon(p.code) : null;
        if (b) { bons++; valeur += b.montant; }
      });
    });
    return { lien: v, ouvertures: v.ouvertures || 0, demandes: dem.length, bons: bons,
      valeur: Math.round(valeur * 100) / 100 };
  },
  /* L'ADRESSE QU'ON PARTAGE — la même construction que l'ordre de vente : jamais un domaine écrit à la main. */
  techVenteLienUrl: function (slug) {
    var base = (typeof location !== 'undefined' && location.href) ? location.href : '';
    var i = base.indexOf('/ui/');
    var racine = i > -1 ? base.slice(0, i) + '/ui/tech/' : '';
    return racine + '07-lien.html?v=' + encodeURIComponent(slug);
  },

  techLienCreer: function (o) {
    o = o || {};
    var m = this.techMarchand(o.marchandId); if (!m) return { ok: false, motif: 'Marque inconnue.' };
    if (m.statut !== 'validated') return { ok: false, motif: 'Cette marque n\'est pas vérifiée — aucun bon ne se propose en son nom.' };
    if (!this.techMarchandConforme(m.id)) return { ok: false, motif: 'Sa déclaration « réseau limité » n\'est pas validée — rien ne s\'ouvre avant.' };
    var montant = Math.round((parseFloat(String(o.montant == null ? '' : o.montant).replace(',', '.')) || 0) * 100) / 100;
    if (!(montant > 0)) return { ok: false, champ: 'montant', motif: 'Un bon proposé porte un montant.' };
    var R = this.techRef();
    var l = this.techLiensGet();
    var seq = this._seq('tech-liens', this._seqPlancher(l, '^TLK-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('Le bon proposé');
    /* LE SLUG NE SE DEVINE PAS : il porte le nom du commerçant pour être lisible, et un tirage sûr pour
       qu'on ne tombe pas sur la demande du voisin en changeant un chiffre. */
    var alea = this._techAlea(6);
    if (!alea) return { ok: false, motif: 'Ce navigateur ne sait pas tirer un identifiant sûr — aucun lien ne sera inventé.' };
    var base = String(m.raisonSociale || m.id).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18);
    var now = Date.now();
    var x = { id: 'TLK-' + String(seq).padStart(5, '0'), slug: (base || 'lien') + '-' + alea.toLowerCase(),
      marchandId: m.id, marchand: m.raisonSociale, site: m.siteUrl, montant: montant,
      reference: String(o.reference || '').trim() || null, client: String(o.client || '').trim() || null,
      /* (23/09) D'OÙ IL VIENT : né d'un lien de vente partagé ou d'un article, il le dit — c'est ainsi que la
         marque sait ce que son partage a produit, sans qu'on invente un compteur ailleurs. */
      origineLien: String(o.origineLien || '').trim() || null,
      etat: 'open', creeLe: now, expireLe: now + (R.lienValiditeJours * 86400000), couvertLe: null, annuleLe: null,
      usages: [] };
    l.push(x);
    if (!this._techLiensPut(l)) return this._refusEcriture('Le bon proposé');
    this._journal('tech_lien_cree', x.id, { marchand: m.id, montant: montant, reference: x.reference });
    return { ok: true, lien: this.techLien(x.slug) };
  },
  /* ══ (21/09, fondatrice : « lorsqu'il clique sur PayEnCash Technologie, la modale qui s'ouvre doit être
     celle COMMENT PAYER, en sachant que c'est pour la boutique connectée ») UNE COMMANDE DU SITE DE LA MARQUE
     OUVRE UN BON PROPOSÉ ═══════════════════════════════════════════════════════════════════════════════
     Le bouton posé sur le site de la marque ne prend rien : il propose au client un bon d'achat de la marque,
     du montant de sa commande (tech_bon_offers : un montant, une référence, plusieurs bons admis), et la fenêtre
     montre la page de ce bon proposé — où l'acheter, et l'app pour l'utiliser.
     LA MÊME COMMANDE ROUVRE LE MÊME BON PROPOSÉ : fermer la fenêtre après un premier bon, puis revenir,
     retrouve ce qui manque encore — pas une seconde proposition qui l'ignorerait. Une commande dont le
     montant a changé (le panier a bougé) en ouvre une nouvelle.
     Ce geste n'ouvre RIEN d'autre qu'une proposition au nom de la marque de la clé, pour SA référence : il ne
     touche ni aux bons, ni aux contrats, et ne fait circuler aucun fonds. */
  techLienPourCommande: function (o) {
    o = o || {};
    var ref = String(o.reference || '').trim();
    if (!ref) return { ok: false, champ: 'reference', motif: 'Une commande porte sa référence (data-commande) : c\'est elle qui retrouve le bon proposé.' };
    var montant = Math.round((parseFloat(String(o.montant == null ? '' : o.montant).replace(',', '.')) || 0) * 100) / 100;
    var deja = this.techLiens({ marchandId: o.marchandId }).filter(function (x) {
      return x.reference === ref && x.montant === montant && x.etat !== 'cancelled' && x.etat !== 'expired';
    })[0];
    if (deja) return { ok: true, lien: deja, reprise: true };
    return this.techLienCreer({ marchandId: o.marchandId, montant: montant, reference: ref });
  },
  /* ══ (20/09 — décision fondatrice « à l'issue de chaque confirmation ça génère un flashcode … le partenaire
     lit le flashcode AVEC LE MONTANT À VENDRE … chaque flashcode a l'identifiant de la boutique pour qui le
     code est généré : on n'encaisse pas un code PayEnCash Mode ou Fly pour la boutique Lila ») ════════════
     L'ORDRE DE VENTE — CE QUE LE REVENDEUR LIT DANS LE FLASHCODE
     Nous sommes GROSSISTE : nous achetons les bons d'une marque et notre réseau les vend. Le flashcode d'un
     bon proposé ne sert donc pas à payer — il sert à dire au commerce QUOI VENDRE : le bon de quelle marque,
     et pour combien. Ces deux informations ne sont pas déduites à l'écran : elles viennent du bon proposé
     lui-même (`marchandId`, `restant`), et le lien les porte dans son adresse.
     C'EST CET IDENTIFIANT QUI FAIT LA FRONTIÈRE. Le revendeur qui scanne sait immédiatement de quel réseau
     il s'agit ; `techBonEmettre` refuse ensuite s'il n'a pas de contrat vivant avec CETTE boutique. Un bon
     PayEnCash (Mode, Fly) et un bon de boutique ne se rencontrent jamais : ce sont deux réseaux, et les
     deux portes le disent (`techBonUtiliser`, `bonValider`). ══ */
  /* (23/09) L'ORDRE DE VENTE OUVRE L'APP DU COMMERCE, pas un écran de Solution : le comptoir des marques a
     déménagé à l'onglet « Marques » de l'app partenaire, et un flashcode qui mène à une redirection est un
     flashcode qui mènera un jour à une page morte. */
  techOrdreVenteUrl: function (slug) {
    var x = this.techLien(slug); if (!x) return null;
    var base = (typeof location !== 'undefined' && location.href) ? location.href : '';
    var i = base.indexOf('/ui/');
    var racine = i > -1 ? base.slice(0, i) + '/ui/partenaire/' : '';
    return racine + '09-marques.html?vendre=' + encodeURIComponent(x.slug);
  },
  /* CE QUE LE COMMERCE DOIT LIRE, RÉDIGÉ UNE FOIS : la marque, le montant à vendre, et l'état du bon proposé.
     Rend null s'il n'existe pas ou n'attend plus rien — on ne fait pas vendre pour une proposition couverte. */
  techOrdreVente: function (slug) {
    var x = this.techLien(slug); if (!x) return null;
    var m = this.techMarchand(x.marchandId) || {};
    return { slug: x.slug, reference: x.reference, marchandId: x.marchandId, marchand: x.marchand || m.raisonSociale,
      site: x.site || m.siteUrl, montant: x.restant, montantDemande: x.montant, etat: x.etat,
      etatLbl: this.techLienEtatLbl(x.etat), client: x.client || null, expireLe: x.expireLe,
      vendable: (x.etat === 'open' || x.etat === 'partial') && x.restant > 0 };
  },
  /* LE BLOC DU FLASHCODE — écrit UNE fois pour les trois cartes « À régler » (Mode, Fly, la page d'une boutique) :
     même forme, mêmes mots, un seul endroit où les changer. `url` est l'ordre de vente, `ref` ce qu'on lit dessous.
     (21/09, fondatrice : « ça facilite le traitement des bons, pour savoir quelle boutique vend son bon — PayEnCash
     vend des bons pour ses apps, PayEnCash Solution est grossiste et les vend pour des entreprises ; le
     partenaire doit vendre un bon pour une entité PayEnCash ou pour les autres ») LE BLOC DIT POUR QUI EST LE BON.
     `entite` le nomme — un Bon d'achat PayEnCash, ou le bon d'une boutique : le client sait ce qu'il achète, le
     partenaire ce qu'il vend, et les deux réseaux ne se mélangent jamais (bonValider / techBonUtiliser). */
  ordreVenteBlocHTML: function (o) {
    o = o || {};
    if (!o.url) return '';
    var e = this.esc.bind(this);
    var qr = (typeof window !== 'undefined' && window.PEC_QR) ? window.PEC_QR.svg(o.url, { size: 112 }) : '';
    return '<div class="pec-ordre-qr">' + (qr || '<span>Flashcode indisponible sur cet appareil — la référence suffit.</span>') + '</div>'
      + '<div class="pec-ordre-txt"><b>À présenter au point de vente ou au distributeur nomade</b>'
      + (o.entite ? '<span class="entite">Bon à t’acheter : <b>' + e(o.entite) + '</b></span>' : '')
      + '<span>Il y lit le bon à te vendre et son montant : tu n’as rien à dicter. Ce flashcode n’est pas un moyen de paiement — il dit quoi vendre.</span>'
      + (o.ref ? '<span class="ref">' + e(o.ref) + '</span>' : '') + '</div>';
  },
  techLienUrl: function (slug) {
    var base = '';
    try { if (location.origin && location.origin.indexOf('http') === 0) base = location.origin + location.pathname.replace(/[^/]*$/, ''); } catch (e) {}
    return (base || 'https://solution.payencash.fr/') + '07-lien.html?l=' + encodeURIComponent(slug);
  },
  /* UTILISER UN BON SUR UN BON PROPOSÉ — avec les bons DE LA MARQUE, et rien d'autre. `techBonUtiliser` tient
     déjà la règle du réseau limité : un bon présenté ici au nom d'une autre marque est refusé, avec son motif.
     (23/09, fondatrice : « l'app est obligatoire pour utiliser un bon de marque, ça permet de retracer ») LE
     PORTEUR EST EXIGÉ : `o.par` est le compte client de l'app « Mes bons », et l'usage le garde. Une page sans
     compte (le lien partagé, la fenêtre du widget) ne peut donc pas utiliser un bon : elle mène à l'app. */
  techLienUtiliserBon: function (slug, code, o) {
    o = o || {};
    var par = String(o.par || '').trim();
    if (!par) return { ok: false, refus: 'porteur', motif: 'Un bon de marque s\'utilise depuis l\'app Mes bons, avec ton compte — c\'est ce qui permet de retracer chaque usage.' };
    var x = this.techLien(slug); if (!x) return { ok: false, motif: 'Bon proposé inconnu.' };
    if (x.etat === 'cancelled') return { ok: false, motif: 'Ce bon proposé a été annulé par la marque.' };
    if (x.etat === 'expired') return { ok: false, motif: 'Ce bon proposé a expiré le ' + new Date(x.expireLe).toLocaleDateString('fr-FR') + '.' };
    if (x.etat === 'used') return { ok: false, motif: 'Ce bon proposé est déjà couvert : rien ne manque plus.' };
    var u = this.techBonUtiliser(code, { marchandId: x.marchandId, montant: x.restant });
    if (!u.ok) return u;
    var l = this.techLiensGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === x.id) i = k;
    if (i < 0) return { ok: false, motif: 'Bon proposé introuvable.' };
    (l[i].usages = l[i].usages || []).push({ code: u.bon.code, pris: u.pris, at: Date.now(), par: par });
    var pris = l[i].usages.reduce(function (a, p) { return a + (p.pris || 0); }, 0);
    var reste = Math.round((l[i].montant - pris) * 100) / 100;
    if (reste <= 0) { l[i].etat = 'used'; l[i].couvertLe = Date.now(); }
    if (!this._techLiensPut(l)) return this._refusEcriture('L\'usage du bon');
    this._journal('tech_lien_bon_utilise', x.id, { marchand: x.marchandId, bon: u.bon.code, pris: u.pris, reste: Math.max(0, reste), par: par });
    if (reste <= 0) this._journal('tech_lien_couvert', x.id, { marchand: x.marchandId, montant: l[i].montant, bons: l[i].usages.length, par: par });
    return { ok: true, pris: u.pris, reste: Math.max(0, reste), soldeBon: u.reste, lien: this.techLien(x.slug) };
  },
  techLienAnnuler: function (slug, par) {
    var x = this.techLien(slug); if (!x) return { ok: false, motif: 'Bon proposé inconnu.' };
    if (x.etat === 'used') return { ok: false, motif: 'Un bon proposé déjà couvert ne s\'annule pas — il a servi.' };
    if (x.etat === 'cancelled') return { ok: false, motif: 'Ce bon proposé est déjà annulé.' };
    var l = this.techLiensGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === x.id) i = k;
    l[i].etat = 'cancelled'; l[i].annuleLe = Date.now();
    if (!this._techLiensPut(l)) return this._refusEcriture('L\'annulation du bon proposé');
    this._journal('tech_lien_annulee', x.id, { marchand: x.marchandId, par: par || null, deja: x.pris });
    return { ok: true, lien: this.techLien(x.slug) };
  },
  /* ══ (21/09, fondatrice : « et pour payer, comment tu paies — pourquoi c'est pas comme Fly et Mode, la
     carte etc. ») UN REVENDEUR SE DÉPLACE — LA RENCONTRE D'UNE BOUTIQUE CONNECTÉE ═══════════════════════════
     Le chemin « un agent se déplace » de la page d'une boutique ne montrait qu'une liste de noms, avec un
     lien pour écrire : ni carte, ni adresse, ni demande — rien de ce que Mode et Fly font. Il fait désormais
     la même chose. Le client dit OÙ (une adresse, relevée de sa position ou cherchée), la demande part aux
     revendeurs MOBILES de CETTE boutique, l'un d'eux la prend depuis son espace, vient, reçoit le prix POUR
     SON PROPRE COMPTE et émet le bon (techBonEmettre — son contrat vivant fait la loi) ; le code est rattaché
     à la rencontre, et le client règle la demande avec, dans « En ligne ».
     CE QUI DIFFÈRE DE LA RENCONTRE PAYENCASH, ET POURQUOI :
       · pas de compte client ici : l'adresse n'entre dans aucun carnet, et le client laisse le NUMÉRO où le
         revendeur l'appellera. Seul le revendeur qui a PRIS la demande le lit, et il s'efface dès qu'elle
         se ferme (servie ou annulée) : il ne sert qu'à ce rendez-vous ;
       · pas d'hôte PayEnCash qui confirme : la plateforme met en relation, c'est le revendeur qui appelle ;
       · pas de position partagée : un revendeur de boutique ne nous la confie pas. La carte montre le point
         de rendez-vous, jamais un trajet inventé.
     Les états et la fenêtre sont ceux de la rencontre PayEnCash (RENCONTRE_STATUTS, rencontreFenetreMin) :
     un même mot pour une même chose. « Expirée » se DÉRIVE de l'échéance, elle ne s'écrit pas.
     Miroir SQL : table `tech_meetings`. AUCUN FONDS ne transite : nous tenons l'état, rien d'autre. ══ */
  techRencontresGet: function () { try { return JSON.parse(localStorage.getItem('pec-tech-rencontres') || '[]') || []; } catch (e) { return []; } },
  _techRencontresPut: function (l) { if (!this._ecrit('pec-tech-rencontres', l)) return false; try { window.dispatchEvent(new Event('pec-bus')); } catch (e) {} return true; },
  _techRencontreVive: function (r) {
    if (r && r.statut === 'demandee' && r.expireTs && Date.now() > r.expireTs) return Object.assign({}, r, { statut: 'expiree' });
    return r;
  },
  techRencontre: function (id) {
    var d = this;
    return this.techRencontresGet().map(function (r) { return d._techRencontreVive(r); }).filter(function (r) { return r.id === id; })[0] || null;
  },
  // les rencontres d'UN bon proposé — ce que la page du client relit
  techRencontresLien: function (slug) {
    var d = this;
    return this.techRencontresGet().filter(function (r) { return r.lienSlug === slug; }).map(function (r) { return d._techRencontreVive(r); });
  },
  // un numéro français, tel qu'on peut l'appeler : 0X XX XX XX XX ou +33 — rendu sous sa forme internationale
  _telFr: function (v) {
    var n = String(v || '').replace(/[\s.\-()]/g, '');
    if (/^0[1-9]\d{8}$/.test(n)) return '+33' + n.slice(1);
    if (/^\+33[1-9]\d{8}$/.test(n)) return n;
    return null;
  },
  telFrLbl: function (v) {
    var n = this._telFr(v); if (!n) return String(v || '');
    var l = '0' + n.slice(3);
    return l.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  },
  // ceux qui peuvent la prendre : les mobiles de la boutique, dans la ville du rendez-vous (sans ville déclarée : partout)
  techRevendeursMobilesVille: function (marchandId, ville) {
    var d = this, v = this._sansAccent(String(ville || '').trim());
    return this.techRevendeursMobiles(marchandId).filter(function (r) { return !r.ville || !v || d._sansAccent(r.ville) === v; });
  },
  /* LE CONTRÔLE À BLANC — les mêmes refus que la demande, sans rien écrire : l'écran l'appelle AVANT d'ouvrir
     la mise en relation, pour ne pas faire lire une modale à quelqu'un qu'on refusera ensuite. */
  techRencontreVerifier: function (o) {
    o = o || {};
    var x = this.techLien(o.slug);
    if (!x) return { ok: false, motif: 'Bon proposé inconnu.' };
    if (x.etat !== 'open' && x.etat !== 'partial') return { ok: false, motif: 'Cette demande n\'attend plus de règlement (' + this.techLienEtatLbl(x.etat).toLowerCase() + ') : personne n\'a à se déplacer.' };
    if (!(x.restant > 0)) return { ok: false, motif: 'Il ne reste rien à régler sur cette demande.' };
    if (!this.techRevendeursMobiles(x.marchandId).length) return { ok: false, motif: 'Aucun ' + this.terme('nomade', 'client') + ' ne se déplace pour ' + x.marchand + ' pour l\'instant.' };
    var a = o.adresse || {};
    var num = String(a.numero || '').trim(), voie = String(a.voie || '').trim(), cp = String(a.cp || '').trim(), ville = String(a.ville || '').trim();
    if (!num || !voie) return { ok: false, champ: 'adresse', motif: 'Dis où il vient te rejoindre : le numéro et la voie.' };
    if (!/^\d{5}$/.test(cp)) return { ok: false, champ: 'cp', motif: 'Le code postal a cinq chiffres.' };
    if (!ville) return { ok: false, champ: 'ville', motif: 'Il manque la commune — c\'est elle qui dit à quels ' + this.terme('nomade', 'clientPluriel') + ' proposer la rencontre.' };
    /* UNE DEMANDE QUE PERSONNE NE VERRA NE PART PAS : un revendeur voit celles de SA commune (ou toutes, s'il n'en a
       pas déclaré). S'il n'y en a aucun ici, on le dit tout de suite plutôt que de laisser attendre pour rien. */
    var joignables = this.techRevendeursMobilesVille(x.marchandId, ville).length;
    if (!joignables) return { ok: false, champ: 'ville', motif: 'Aucun ' + this.terme('nomade', 'client') + ' ne se déplace à ' + ville + ' pour l\'instant — cherche plutôt « ' + ((this.PARTENAIRE_MODES.sedentaire || {}).clientLbl || '') + ' », ou règle « En ligne » si tu as déjà un bon.' };
    var vivante = this.techRencontresLien(x.slug).filter(function (r) { return r.statut === 'demandee' || r.statut === 'acceptee'; })[0];
    if (vivante) return { ok: false, motif: 'Une rencontre est déjà en cours pour cette demande (' + vivante.ref + ') : attends-la, ou annule-la avant d\'en demander une autre.', rencontre: vivante };
    var geo = (a.geo && isFinite(a.geo.lat) && isFinite(a.geo.lng)) ? { lat: a.geo.lat, lng: a.geo.lng } : null;
    return { ok: true, lien: x, montant: x.restant, ville: ville,
      lieu: num + ' ' + voie + ', ' + cp + ' ' + ville,
      adresse: { numero: num, voie: voie, cp: cp, ville: ville, etage: String(a.etage || '').trim() || null,
        porte: String(a.porte || '').trim() || null, instructions: String(a.instructions || '').trim() || null },
      geo: geo || (this.villeGeo ? this.villeGeo(ville) : null), geoApprox: !geo, joignables: joignables };
  },
  techRencontreDemander: function (o) {
    o = o || {};
    var v = this.techRencontreVerifier(o);
    if (!v.ok) return v;
    var tel = this._telFr(o.tel);
    if (!tel) return { ok: false, champ: 'tel', motif: 'Laisse un numéro où il peut t\'appeler (06 12 34 56 78) : c\'est lui qui confirme le rendez-vous.' };
    var canal = ({ appel: 1, whatsapp: 1, facetime: 1 })[o.canal] ? o.canal : 'appel';
    /* L'ACCORD EST CELUI QU'IL A LU, mot pour mot, et il voyage avec la rencontre : sans compte, il n'y a pas
       d'autre endroit où le ranger — et sans lui, personne n'appelle personne. */
    var accord = String(o.consentement || '').trim();
    if (!accord) return { ok: false, champ: 'consentement', motif: 'Coche l\'accord : il ne t\'appelle pas sans ton autorisation.' };
    var l = this.techRencontresGet();
    var seq = this._seq('tech-rencontres', this._seqPlancher(l, '^TRV-0*(\\d+)$', 'id'));
    if (seq == null) return this._refusEcriture('La demande de rencontre');
    var x = v.lien, now = Date.now(), id = 'TRV-' + String(seq).padStart(5, '0');
    var r = { id: id, ref: id, lienSlug: x.slug, lienId: x.id, marchandId: x.marchandId, marchand: x.marchand,
      montant: v.montant, ville: v.ville, lieu: v.lieu, adresse: v.adresse, aide: this.adresseAide(v.adresse) || null,
      geo: v.geo, geoApprox: v.geoApprox, tel: tel, canal: canal, note: String(o.note || '').trim().slice(0, 200) || null,
      consentement: accord.slice(0, 400), consentiTs: now,
      statut: 'demandee', creeTs: now, expireTs: now + this.rencontreFenetreMin() * 60000,
      revendeurId: null, revendeur: null, codes: [], joignables: v.joignables };
    l.unshift(r);
    if (!this._techRencontresPut(l)) return this._refusEcriture('La demande de rencontre');
    this._journal('tech_rencontre_demandee', id, { marchand: x.marchandId, lien: x.id, ville: v.ville, montant: v.montant, joignables: v.joignables });
    return { ok: true, rencontre: r };
  },
  /* CE QU'UN REVENDEUR MOBILE VOIT : les demandes VIVANTES des boutiques avec qui il a un contrat en cours, dans
     sa ville — et les siennes. Avant qu'il la prenne, il ne lit ni le numéro ni l'étage : la commune, le montant,
     la rue. Le reste se découvre en acceptant. */
  techRencontresRevendeur: function (revendeurId) {
    var d = this, rv = this.techRevendeur(revendeurId);
    if (!rv || this.partenaireMode(rv) !== 'mobile') return [];
    var v = this._sansAccent(String(rv.ville || '').trim());
    return this.techRencontresGet().map(function (r) { return d._techRencontreVive(r); }).filter(function (r) {
      if (r.revendeurId === revendeurId) return true;
      return r.statut === 'demandee' && !r.revendeurId && (!v || d._sansAccent(r.ville) === v);   // (23/09, nuit) plus de contrat par marque : tout nomade de la ville la voit
    }).map(function (r) {
      if (r.revendeurId === revendeurId) return r;
      return Object.assign({}, r, { tel: null, adresse: { voie: r.adresse.voie, cp: r.adresse.cp, ville: r.adresse.ville }, aide: null, note: null });
    });
  },
  _techRencontreMaj: function (id, patch, evt, jnl) {
    var l = this.techRencontresGet(), i = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === id) i = k;
    if (i < 0) return null;
    for (var c in patch) l[i][c] = patch[c];
    if (!this._techRencontresPut(l)) return null;
    if (evt) this._journal(evt, id, jnl || {});
    return l[i];
  },
  techRencontreAccepter: function (id, revendeurId) {
    var r = this.techRencontre(id); if (!r) return { ok: false, motif: 'Rencontre inconnue.' };
    var rv = this.techRevendeur(revendeurId); if (!rv) return { ok: false, motif: 'Partenaire du réseau inconnu.' };
    if (this.partenaireMode(rv) !== 'mobile') return { ok: false, motif: 'Seul un ' + this.terme('nomade') + ' se déplace.' };
    if (r.statut === 'expiree') return { ok: false, motif: 'Cette demande a expiré (' + this.rencontreFenetreMin() + ' min) — l\'utilisateur en refera une.' };
    if (r.statut !== 'demandee') return { ok: false, motif: 'Cette rencontre est déjà ' + this.rencontreStatutLbl(r.statut).toLowerCase() + '.' };
    /* (23/09, nuit) PLUS DE CONTRAT PAR MARQUE : ce qui compte, c'est qu'il puisse vendre CE bon au rendez-vous (garantie
       versée, avance suffisante) — la même règle que le comptoir, sinon il se déplacerait pour une vente refusée. */
    var pv = this.techPeutVendre(revendeurId, r.marchandId, r.montant);
    if (!pv.ok) return { ok: false, refus: pv.refus, motif: pv.motif };
    var m = this._techRencontreMaj(id, { statut: 'acceptee', revendeurId: rv.id, revendeur: rv.raisonSociale, accepteeTs: Date.now() },
      'tech_rencontre_acceptee', { marchand: r.marchandId, revendeur: rv.id });
    return m ? { ok: true, rencontre: m } : { ok: false, motif: 'Acceptation non enregistrée : le stockage a refusé.' };
  },
  /* LA RENCONTRE A EU LIEU : le revendeur a reçu le prix, POUR SON PROPRE COMPTE, et émet le bon par la même
     porte que tout bon de la boutique (techBonEmettre, puis « vendu »). On n'inscrit ni son prix ni sa marge. */
  techRencontreServir: function (id, o) {
    o = o || {};
    var r = this.techRencontre(id); if (!r) return { ok: false, motif: 'Rencontre inconnue.' };
    if (r.statut === 'servie') return { ok: false, motif: 'Cette rencontre a déjà été servie.', servie: true };
    if (r.statut !== 'acceptee' || r.revendeurId !== o.revendeurId) return { ok: false, motif: 'Prends d\'abord la demande : seul le ' + this.terme('nomade') + ' qui l\'a acceptée la sert.' };
    if (o.prixRecu !== true) return { ok: false, champ: 'prixRecu', motif: 'Confirme d\'abord avoir reçu le prix : un bon ne s\'émet qu\'une fois payé.' };
    var x = this.techLien(r.lienSlug);
    if (!x || (x.etat !== 'open' && x.etat !== 'partial')) return { ok: false, motif: 'Ce bon proposé n\'attend plus rien (' + (x ? this.techLienEtatLbl(x.etat).toLowerCase() : 'introuvable') + ') : n\'émets pas de bon, annule la rencontre.' };
    var em = this.techBonEmettre({ marchandId: r.marchandId, revendeurId: r.revendeurId, montant: r.montant });
    if (!em.ok) return em;
    this.techBonVendu(em.bon.code);
    // le numéro du client ne sert plus : il s'efface avec le rendez-vous
    var m = this._techRencontreMaj(id, { statut: 'servie', servieTs: Date.now(), codes: [em.bon.code], tel: null },
      'tech_rencontre_servie', { marchand: r.marchandId, revendeur: r.revendeurId, bon: em.bon.id });
    if (!m) return { ok: false, motif: 'Rencontre non enregistrée : le stockage a refusé.' };
    return { ok: true, rencontre: m, bon: this.techBon(em.bon.code), ticket: em.ticket || '' };
  },
  techRencontreAnnuler: function (id, motif, par) {
    var r = this.techRencontre(id); if (!r) return { ok: false, motif: 'Rencontre inconnue.' };
    if (r.statut === 'servie') return { ok: false, motif: 'Cette rencontre a eu lieu : elle ne s\'annule plus.' };
    if (r.statut === 'annulee') return { ok: false, motif: 'Cette rencontre est déjà annulée.' };
    var m = this._techRencontreMaj(id, { statut: 'annulee', annuleeTs: Date.now(), annuleePar: par || null,
      motifAnnulation: String(motif || '').trim().slice(0, 200) || null, tel: null },
      'tech_rencontre_annulee', { marchand: r.marchandId, par: par || null });
    return m ? { ok: true, rencontre: m } : { ok: false, motif: 'Annulation non enregistrée : le stockage a refusé.' };
  },
  /* LE TICKET DU BON PROPOSÉ — construit ICI, avec la marque dedans : on ne peut pas en composer un sans elle.
     Son flashcode est un ORDRE DE VENTE (la marque + le montant), que le client tend au commerce du réseau. */
  techLienTicketHTML: function (x, url) {
    if (!x) return '';
    var R = this.techRef(), e = this.esc.bind(this);
    /* SANS ENCODEUR, PAS DE FLASHCODE MUET : un ticket amputé qui ne le dit pas laisse croire que la
       demande n'en a pas. Il le DIT, et l'adresse reste lisible juste en dessous. */
    var lienUrl = url || this.techLienUrl(x.slug);
    /* (20/09 — « le partenaire lit le flashcode avec le montant à vendre ») LE FLASHCODE EST UN ORDRE DE VENTE,
       pas un raccourci vers cette page. Il porte l'IDENTIFIANT DE LA BOUTIQUE et le MONTANT à vendre : le
       revendeur le scanne, son écran lui dit quoi émettre, et son contrat avec CETTE boutique fait la loi.
       L'adresse de la page, elle, reste écrite en clair en dessous — c'est le client qui en a besoin. */
    var ordreUrl = this.techOrdreVenteUrl(x.slug) || lienUrl;
    var qr = (typeof window !== 'undefined' && window.PEC_QR)
      ? window.PEC_QR.svg(ordreUrl, { size: 132 })
      : '<span style="font-size:10.5px;line-height:1.5;color:#6b7e77">Flashcode indisponible sur cet appareil — l\'adresse ci-dessous fait le même travail.</span>';
    var T = this._techTicketStyles();
    return '<div class="tech-ticket" style="' + T.boite + '">'
      + '<div style="' + T.h + '">' + this.techMarqueHTML() + '</div>'
      + '<div style="' + T.m + '">' + e(this.eur(x.montant)) + '</div>'
      + (x.reference ? '<div style="' + T.c + '">' + e(x.reference) + '</div>' : '')
      + '<div style="' + T.qr + '">' + qr + '</div>'
      + '<div style="' + T.s + '">Bon d\'achat <b>' + e(x.marchand) + '</b> proposé'
      + (x.client ? ' à ' + e(x.client) : '') + ', utilisable uniquement sur <b>' + e(x.site) + '</b>'
      + (x.expireLe ? ' — proposition valable jusqu\'au ' + e(new Date(x.expireLe).toLocaleDateString('fr-FR')) : '') + '.</div>'
      + '<div style="' + T.s + ';font-weight:700">À présenter au comptoir d\'un commerce du réseau ' + e(R.nom) + ' : son écran lira <b>la marque et le montant du bon à te vendre</b>. Pour l\'utiliser ensuite chez ' + e(x.marchand) + ' : l\'app Mes bons.</div>'
      + '<div style="' + T.l + '">' + e(R.nom) + ' n\'encaisse rien : ce flashcode est un <b>ordre de vente</b> (marque + montant), pas un moyen de paiement. '
      + 'Un bon ' + e(x.marchand) + ' ne s\'utilise que sur ' + e(x.site) + ' — réseau limité — et n\'est ni remboursable en espèces, ni rendu en monnaie. '
      + 'Aucun fonds ne transite par la plateforme, à aucun moment.</div>'
      + '</div>';
  },
  /* LES STYLES DU TICKET SONT ÉCRITS AVEC LUI, jamais dans une feuille : un ticket s'imprime, se copie dans
     un courriel, s'ouvre dans une fenêtre nue — partout où la feuille de style de l'écran ne le suit pas.
     Ils étaient dans des classes (`tt-h`, `tt-m`…) que RIEN ne définissait : le ticket sortait sans mise en
     forme, déjà à l'écran. Une seule source pour les deux tickets, ici. */
  _techTicketStyles: function () {
    return {
      boite: 'max-width:320px;margin:0 auto;background:#fff;border:1px dashed #b7c6c0;border-radius:14px;padding:15px 16px;text-align:center;color:#12211c',
      h: 'padding-bottom:9px;border-bottom:1px dashed #dfe8e4',
      m: 'font-size:27px;font-weight:800;letter-spacing:-0.02em;margin:10px 0 2px',
      c: 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;font-weight:800;letter-spacing:.08em;color:#0C7F54',
      qr: 'margin:11px 0 3px;display:flex;justify-content:center',
      s: 'font-size:11.5px;line-height:1.55;color:#12211c;margin-top:9px',
      l: 'font-size:10px;line-height:1.5;color:#6b7e77;margin-top:9px;padding-top:9px;border-top:1px dashed #dfe8e4'
    };
  },

  /* ══ (21/09, fondatrice : « la modale qui s'ouvre doit être celle COMMENT PAYER, en sachant que c'est pour
     la boutique connectée ») LES REVENDEURS D'UNE BOUTIQUE, VUS COMME DES POINTS DE VENTE ═══════════════
     Même contrat de lecture que `pointsBons` — { pos, rayon, q, ville, limite } → id, enseigne, adresse, ville,
     geo, distM / distTxt / pied, achete — pour que la carte, la recherche, le rayon et le guidage du choix
     « Comment veux-tu payer ? » servent tels quels. Seuls les SÉDENTAIRES y figurent : un mobile n'a pas
     d'adresse, l'épingler serait inventer où il est.
     UN REVENDEUR N'A QU'UNE VILLE ET UNE ADRESSE EN CLAIR, pas de géoposition : son point est donc le centre
     de sa ville, et il le DIT (`geoApprox`) — la même règle que nos commerces sans position saisie. */
  /* (23/09, soir) LE RÉSEAU QUI VEND LES BONS D'UNE MARQUE, C'EST TOUT LE RÉSEAU : depuis que la vente ne dépend plus d'un
     contrat marque↔point (techBonEmettre, 23/09), un commerce vérifié vend les bons de toutes les marques. Lire les seuls
     points sous contrat sous-listait « où acheter » — la page partagée, l'app Mes bons et la carte de 02-espace en
     cachaient la plus grande part.
     (23/09, nuit) ET SEULEMENT CEUX QUI PEUVENT VENDRE MAINTENANT : un commerce vérifié sans mandat SEPA, avec un impayé
     ou un encours plein, un nomade sans garantie versée — la même règle que le comptoir (techPeutVendre). Envoyer un client
     vers un comptoir qui refusera la vente, c'est lui faire faire le chemin pour rien. */
  techReseauVente: function (marchandId) {
    var self = this;
    return this.techRevendeurs({ statut: 'validated' }).filter(function (r) { return self.techPeutVendre(r.id, marchandId, 0).ok; }).map(function (r) {
      return { id: r.id, raisonSociale: r.raisonSociale, depuis: r.valideLe || r.creeLe || null,
        mode: self.partenaireMode(r), modeLbl: self.partenaireModeLbl(r), mobile: self.partenaireEstMobile(r),
        ville: r.ville || null, adresse: r.adresse || null, partenaireId: r.partenaireId || null };
    });
  },
  techPoints: function (marchandId, opts) {
    opts = opts || {};
    var self = this, m = this.techMarchand(marchandId);
    if (!m) return [];
    var l = this.techReseauVente(marchandId).filter(function (r) { return !r.mobile; }).map(function (r) {
      var geo = (r.ville && self.villeGeo) ? self.villeGeo(r.ville) : null;
      var o = { id: r.id, enseigne: r.raisonSociale, adresse: r.adresse || '', cp: '', ville: r.ville || '',
        geo: geo, geoApprox: !!geo,
        achete: 'Ton bon ' + m.raisonSociale + ', au montant exact — il l’encaisse pour son propre compte.' };
      if (opts.pos && geo) { o.distM = self.distanceM(opts.pos, geo); o.distTxt = self.fmtDist(o.distM); o.pied = self.fmtPied(o.distM); }
      return o;
    });
    return this._pointsTrier(l, opts);
  },
  /* ET SES REVENDEURS MOBILES — ceux qui viennent au client. On ne les épingle pas : un mobile n'a pas d'adresse.
     On les JOINT par une demande de rencontre (techRencontreDemander), comme les distributeurs de PayEnCash. */
  techRevendeursMobiles: function (marchandId) {
    var self = this;
    return this.techReseauVente(marchandId).filter(function (r) { return r.mobile; }).map(function (r) {
      /* (24/09, soir) LE TARIF DE DÉPLACEMENT, TEL QUE LE NOMADE L'AFFICHE (partenaireTarifLbl) : le client le lit avant de demander
         la rencontre — le tarif est libre et se convient entre eux ; nous ne l'écrivons pas, nous le montrons. */
      var pt = r.partenaireId && self.partenaire ? self.partenaire(r.partenaireId) : null;
      return { id: r.id, enseigne: r.raisonSociale, ville: r.ville || null,
        zoneLbl: r.ville ? 'Se déplace à ' + r.ville : 'Se déplace partout où la boutique vend',
        tarifLbl: pt && self.partenaireTarifLbl ? self.partenaireTarifLbl(pt) : '' };
    });
  },

  /* ══ UC-8 — LA PAGE DE PAIEMENT DU COMMERÇANT : NOS TROIS CHEMINS ════════════════════════════
     Décision fondatrice du 19/09 au soir : « lorsque le e-commerce l'ajoute, il doit automatiquement avoir la
     page de paiement avec Comment tu paies : tu as un bon, chez un partenaire, un agent se déplace — c'est
     notre marque de fabrique. Il choisit PayEnCash, ça ouvre la modale avec les trois solutions. »
     Les trois chemins sont les NÔTRES, mais appliqués au réseau DU COMMERÇANT : ce sont SES revendeurs sous
     contrat vivant qui vendent SES bons (UC-8), les sédentaires d'un côté, les mobiles de l'autre. Un chemin
     sans personne derrière ne s'affiche pas : on ne propose pas d'aller nulle part. */
  techChemins: function (marchandId) {
    var m = this.techMarchand(marchandId);
    if (!m) return [];
    /* (23/09, soir) LES CHEMINS SUIVENT LE RÉSEAU ENTIER (techReseauVente) : un commerce vérifié vend les bons de toutes les
       marques, un distributeur nomade vérifié se déplace pour toutes — le contrat marque↔point n'ouvre plus rien. */
    var rv = this.techReseauVente(marchandId);
    var sed = rv.filter(function (x) { return !x.mobile; }), mob = rv.filter(function (x) { return x.mobile; });
    var M = this.PARTENAIRE_MODES || {};
    return [
      /* (20/09) LE PREMIER CHEMIN PORTE LE NOM DE LA MAISON : « En ligne », comme sur « Comment payer » de
         Mode. Il s'appelait « J'ai un bon » ici et nulle part ailleurs — un même geste sous deux noms, c'est
         deux gestes pour celui qui le lit. Et il admet PLUSIEURS bons, comme chez nous. */
      { cle: 'enligne', titre: 'En ligne',
        aide: 'Tu as d\u00e9j\u00e0 un bon ' + m.raisonSociale + ' : saisis son code, il se d\u00e9duit de ce qui est d\u00fb. Plusieurs bons sont admis.',
        dispo: true, n: null },
      { cle: 'partenaire', titre: (M.sedentaire || {}).clientLbl,
        aide: sed.length ? (M.sedentaire || {}).clientAide : 'Aucun ' + this.terme('commerce', 'client') + ' pour l\'instant.',
        dispo: sed.length > 0, n: sed.length, revendeurs: sed },
      { cle: 'agent', titre: (M.mobile || {}).clientLbl,
        aide: mob.length ? (M.mobile || {}).clientAide : 'Aucun ' + this.terme('nomade', 'client') + ' pour l\'instant.',
        dispo: mob.length > 0, n: mob.length, revendeurs: mob }
    ];
  },

  /* ══ LA MARQUE — « il doit utiliser le logo PayEnCash Technologie au moment de l'émission du bon » ═════
     (décision fondatrice du 19/09 au soir). Le ticket ne se compose pas à la main dans un écran : il se
     construit ICI, avec la marque dedans. On ne peut donc pas émettre un bon sans elle — et la mention dit
     ce qui est vrai : nous gérons, nous ne possédons pas. ══ */
  /* (21/09, fondatrice : « intègre le logo sur PayEnCash Technologie ; tu utilises le P avec le shop ») LE SYMBOLE —
     le P au sac, fond transparent — remplace le bouclier. Son adresse est ABSOLUE, tirée de celle de la page (comme
     l'ordre de vente) : le ticket quitte l'écran — imprimé, recopié dans un courriel — et l'image doit le suivre. */
  techLogoUrl: function () { return this.logosBase() + 'payencash-solution-symbole.webp'; },
  techLogoHTML: function (h) {
    h = h || 16;
    return '<img src="' + this.techLogoUrl() + '" alt="" width="' + h + '" height="' + h + '" style="width:' + h + 'px;height:' + h + 'px;object-fit:contain;vertical-align:middle">';
  },
  techMarqueHTML: function () {
    var R = this.techRef();
    /* (20/09) LA MARQUE VOYAGE AVEC LE TICKET : imprimé, copié dans un courriel, elle quitte la feuille de
       style de l'écran. Ses couleurs sont donc écrites en clair, pas en variables — c'est le seul endroit
       du dépôt où c'est justifié, et c'est pour que le logo survive au détachement. */
    return '<span class="tech-marque" style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;letter-spacing:-0.01em;color:#0C7F54">'
      + this.techLogoHTML(20) + ' <b>pay<span style="color:#10A06A">En</span>Cash</b> '
      + this.esc(R.nom.replace(/^PayEnCash\s*/i, '')) + '</span>';
  },
  techBonTicketHTML: function (b) {
    if (!b) return '';
    var R = this.techRef(), e = this.esc.bind(this);
    var T = this._techTicketStyles();
    return '<div class="tech-ticket" style="' + T.boite + '">'
      + '<div style="' + T.h + '">' + this.techMarqueHTML() + '</div>'
      + '<div style="' + T.m + '">' + e(this.eur(b.montant)) + '</div>'
      + '<div style="' + T.c + '">' + e(b.code) + '</div>'
      + '<div style="' + T.s + '">Bon d\'achat émis par <b>' + e(b.marchand) + '</b>, utilisable uniquement sur '
      + '<b>' + e(b.site) + '</b>' + (b.expireLe ? ' — valable jusqu\'au ' + e(new Date(b.expireLe).toLocaleDateString('fr-FR')) : '') + '.</div>'
      + '<div style="' + T.l + '">' + e(R.nom) + ' a acheté ce bon à la marque et l\'a vendu à travers son réseau : un grossiste, '
      + 'qui ne détient jamais les fonds des clients.</div>'
      + '</div>';
  }};

/* (24/09, nuit) L'AMORCE HÉRITÉE DE MODE EST RETIRÉE : elle générait à CHAQUE chargement de CHAQUE page 400 articles,
   39 lots de démonstration et 30 clients fictifs, reprenait panier et favoris Mode et fermait des sessions fournisseur —
   aucun écran du grossiste ne lit rien de tout cela (vérifié : ni profil, ni articles, ni inventaire, ni clients). */

/* =============================================================================
   PEC_GEO — LA couche de géolocalisation (gros audit fondatrice 28/08 : « comme
   Uber : on se localise facilement, la borne, la position, la distance »).
   Un SEUL paramétrage pour toute l'app — fini les getCurrentPosition épars aux
   timeouts courts et aux échecs muets.

   · localiser(onFix, onErr) : FIX RAPIDE puis AFFINAGE — d'abord une position
     en cache (instantanée si l'OS en a une), puis watchPosition haute précision
     qui rappelle onFix à chaque amélioration ; s'arrête net sous 25 m ou après
     20 s. onFix({lat,lng,precision,affine}) peut être appelé plusieurs fois —
     c'est voulu : le point bleu s'affine comme chez Uber.
   · suivre(onFix, onErr) : watchPosition continu.
   · erreurs PARLANTES par cause (refus / indisponible / délai) — jamais un
     échec silencieux.
   · chercherAdresses(q, cb) / autocompleteAdresse(input, onPick) : la Base
     Adresse Nationale — l'adresse se CHERCHE, et la suggestion choisie arrive
     découpée (numéro, voie, code postal, commune) ET géolocalisée.
   · adresseDepuisPosition(pos, cb) : le chemin INVERSE, même base — la position
     rend le NUMÉRO ET LE NOM DE LA RUE, pas des degrés décimaux, et sous la
     même forme qu'une suggestion : un seul remplissage de formulaire pour les
     deux. Cache ~80 m. cb(null) hors ligne : on ne devine jamais une rue.
   ============================================================================= */
(function () {
  function fix(pos, affine) {
    var f = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6),
              precision: Math.round(pos.coords.accuracy), affine: !!affine };
    // la DERNIÈRE position connue est mémorisée : chaque écran DÉMARRE dessus
    // (fondatrice 28/08 : « ça affiche Marseille puis ça va sur Marignane —
    // je veux direct sur la position ») — plus de saut visuel.
    try { localStorage.setItem('pec-derniere-pos', JSON.stringify({ lat: f.lat, lng: f.lng, precision: f.precision, at: Date.now() })); } catch (e) {}
    return f;
  }
  /* ══ (20/09, fondatrice : « pourquoi lorsque je recherche ma position ça ne la détecte pas ? » — sur les
     DEUX chemins, agent et partenaire) UN REFUS SE NOMME ═══════════════════════════════════════════════
     « Position refusée — autorise la localisation dans les réglages du navigateur » ne dit à personne OÙ
     cliquer, et ne distingue pas les trois causes réelles, qui appellent trois gestes différents :
       · le NAVIGATEUR a bloqué ce site (le plus fréquent : un « Bloquer » cliqué une fois, et il ne
         redemande plus jamais — la popup ne réapparaît pas, l'écran semble « ne pas détecter ») ;
       · l'APPAREIL a coupé son service de localisation (macOS : Réglages Système › Confidentialité) ;
       · la PAGE n'est pas en HTTPS — Safari refuse alors la position sans rien demander.
     Chaque cas a sa phrase et son geste, et tous rappellent la porte de sortie : saisir son adresse. */
  function pageNonSure() {
    try { return typeof window !== 'undefined' && window.isSecureContext === false; } catch (e) { return false; }
  }
  function messageErreur(e) {
    if (pageNonSure()) return 'Cette page n\'est pas en HTTPS : le navigateur refuse la position sans même la demander. Passe par la recherche, juste en dessous.';
    if (e && e.code === 1) return 'Ton navigateur a BLOQUÉ la position pour ce site : touche le cadenas à gauche de l\'adresse, mets « Position » sur Autoriser, puis recommence. Si le cadenas dit déjà Autoriser, c\'est l\'appareil : Réglages Système › Confidentialité et sécurité › Service de localisation. Tu peux aussi continuer sans : la recherche est juste en dessous.';
    if (e && e.code === 2) return 'Ton appareil n\'arrive pas à se situer (localisation coupée, ou aucun signal) — vérifie le service de localisation de l\'appareil, ou passe par la recherche juste en dessous.';
    if (e && e.code === 3) return 'La position met trop de temps à venir — réessaie, ou passe par la recherche juste en dessous.';
    return 'Géolocalisation indisponible sur cet appareil — l\'adresse suffit.';
  }
  var cacheRue = null;
  window.PEC_GEO = {
    dispo: function () { return !!navigator.geolocation; },
    messageErreur: messageErreur,
    /* ══ (21/09, fondatrice : « les cartes ne fonctionnent pas », « revérifie code, doublon, code mort »)
       UN SEUL MONTAGE DE CARTE POUR TOUTE LA MAQUETTE ═══════════════════════════════════════════════
       Quatre écrans montaient la leur — Comment payer (Mode, Fly, boutique), Où acheter un bon, l'écran de
       la rencontre, la carte des opérations — et trois recopiaient le même bricolage, déjà divergent. Il avait
       un défaut que Chromium pardonne et Safari non : la toile WebGL restait masquée (display:none) jusqu'au
       chargement COMPLET, puis se dévoilait SANS être redessinée. WebKit ne garde pas l'image dessinée pendant
       qu'elle était masquée : la carte « chargée » restait vide. Et le bandeau disait « indisponible » au bout
       de quatre secondes à qui avait seulement un réseau lent.
       Désormais la toile se dévoile aux PREMIÈRES tuiles, se redimensionne et se REDESSINE ; le bandeau
       n'arrive qu'après huit secondes sans tuile, et il dit POURQUOI (pas de WebGL, la réponse du serveur) ;
       un navigateur sans WebGL ne lève plus d'exception : il le dit.
         conteneur    l'élément (ou son id) où la carte se dessine — VISIBLE : MapLibre mesure sa taille ;
         o.centre     { lat, lng } · o.zoom · o.interactive (défaut : oui)
         o.cadre      l'élément qui porte le bandeau (défaut : le parent du conteneur).
       Rend la carte MapLibre, ou null — et l'écran garde ses adresses et ses distances, qui restent justes. ══ */
    CARTE_FOND: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    carte: function (conteneur, o) {
      o = o || {};
      var el = typeof conteneur === 'string' ? document.getElementById(conteneur) : conteneur;
      var cadre = o.cadre || (el && el.parentElement);
      if (!el || !o.centre || typeof maplibregl === 'undefined') return null;
      var esc = function (v) { return (window.PEC_DATA && PEC_DATA.esc) ? PEC_DATA.esc(v) : String(v == null ? '' : v); };
      function bandeau(pourquoi) {
        if (!cadre || cadre.querySelector('.carte-hs')) return;
        var b = document.createElement('div');
        b.className = 'carte-hs';
        b.innerHTML = 'Carte indisponible (' + esc(pourquoi) + ') — <b>les adresses et les distances restent justes</b>.';
        cadre.appendChild(b);
      }
      var m;
      try {
        m = new maplibregl.Map({ container: el, style: this.CARTE_FOND, center: [o.centre.lng, o.centre.lat],
          zoom: o.zoom || 13, attributionControl: false, interactive: o.interactive !== false });
      } catch (e) { bandeau('ce navigateur n’affiche pas les cartes — WebGL'); return null; }
      /* MASQUÉE, PAS RETIRÉE : `visibility` garde la toile dans le rendu de la page. Hors ligne, elle peindrait
         BLANC par-dessus le fond CSS (.pec-map-canvas) ; on ne la montre qu'avec des tuiles dedans. */
      var cc = m.getCanvas(), montree = false, raison = null;
      cc.style.visibility = 'hidden';
      function montrer() {
        if (montree) return;
        montree = true;
        cc.style.visibility = '';
        var b = cadre && cadre.querySelector('.carte-hs'); if (b) b.remove();
        m.resize();
        m.triggerRepaint();   // WebKit : ce qui a été dessiné toile masquée ne s'affiche pas — on redessine
      }
      m.on('load', montrer);
      m.on('data', function (e) { if (e && e.dataType === 'source' && e.isSourceLoaded) montrer(); });
      m.on('error', function (e) {
        var er = e && e.error;
        if (er) raison = er.status ? 'le serveur de cartes répond ' + er.status : String(er.message || '').slice(0, 90);
      });
      setTimeout(function () { if (!montree) bandeau(raison || 'connexion lente ou coupée'); }, 8000);
      return m;
    },
    /* L'ACCORD SE DONNE UNE FOIS (fondatrice 28/08 : « l'utilisateur ne doit
       pas appuyer pour se localiser — c'est fait lorsqu'il accepte ») : noté à
       la première autorisation, chaque écran se localise ensuite TOUT SEUL.
       Double source de vérité : notre note + l'état réel de la permission
       navigateur (Permissions API) — révoquée dans les réglages = plus d'auto. */
    noterAccord: function () { try { localStorage.setItem('pec-geo-ok', '1'); } catch (e) {} },
    /* (11/09) LA POSITION A UNE DURÉE DE VIE. Au-delà de `ref.rgpd.positionTTLMin`, elle est effacée et rendue
       nulle : les écrans retombent sur leur repli (adresse saisie, position de référence) plutôt que de trier
       depuis un endroit où la personne n'est plus. Minimisation (art. 5.1.c et 5.1.e du RGPD). */
    positionTTLMin: function () {
      try { var D = window.PEC_DATA; var v = D && D.param ? D.param('ref.rgpd.positionTTLMin', (D.ref.rgpd || {}).positionTTLMin) : null; return (typeof v === 'number' && v > 0) ? v : 60; }
      catch (e) { return 60; }
    },
    oublierPos: function () { try { localStorage.removeItem('pec-derniere-pos'); } catch (e) {} },
    /* (11/09) LA PHRASE QUE LES ÉCRANS DISENT SUR LA POSITION — UNE SEULE, ET VRAIE. Trois écrans la
       recopiaient à la main et promettaient « votre position n'est JAMAIS stockée » ; la même page relisait
       `pec-derniere-pos` au chargement suivant pour démarrer sur la dernière position connue. On disait le
       contraire de ce qu'on faisait, dans le pop-up même où la personne donne son accord. La vérité tient en
       trois faits : rien ne part au serveur, ça reste sur l'appareil le temps du réglage, ça s'efface à la
       déconnexion. `tu` choisit le registre (les pop-ups d'autorisation vouvoient comme celui du téléphone). */
    phraseRetention: function (tu) {
      var m = this.positionTTLMin(), d = (m % 60 === 0) ? (m / 60) + ' h' : m + ' min';
      /* la phrase se suffit à elle-même : « Elle » n'avait plus d'antécédent dans le pop-up (vu à l'écran). */
      return tu
        ? 'Ta position n\'est jamais envoyée à nos serveurs : elle reste sur ton appareil ' + d + ' au maximum, puis elle s\'efface — et elle part avec ta déconnexion.'
        : 'Votre position n\'est jamais envoyée à nos serveurs : elle reste sur votre appareil ' + d + ' au maximum, puis elle s\'efface — et elle part avec votre déconnexion.';
    },
    appliquerRetention: function (root) {
      var self = this;
      [].forEach.call((root || document).querySelectorAll('[data-geo-retention]'), function (el) {
        el.textContent = self.phraseRetention(el.getAttribute('data-geo-retention') === 'tu');
      });
    },
    dernierePos: function () {
      try {
        var p = JSON.parse(localStorage.getItem('pec-derniere-pos') || 'null');
        if (!p) return null;
        if (!p.at || (Date.now() - p.at) > this.positionTTLMin() * 60000) { this.oublierPos(); return null; }
        return p;
      } catch (e) { return null; }
    },
    accordConnu: function () { try { return localStorage.getItem('pec-geo-ok') === '1'; } catch (e) { return false; } },
    /* (20/09) CE QUE LE NAVIGATEUR EN PENSE, AVANT DE RIEN DÉCLENCHER : 'granted' | 'denied' | 'prompt', et
       'inconnu' quand il ne sait pas le dire (Safari ancien). Savoir que le site est BLOQUÉ permet de le DIRE
       au lieu d'afficher « Recherche de ta position… » sur une recherche qui n'aura jamais lieu. */
    permissionEtat: function (cb) {
      try {
        if (!navigator.permissions || !navigator.permissions.query) { cb('inconnu'); return; }
        navigator.permissions.query({ name: 'geolocation' })
          .then(function (st) { cb(st && st.state ? st.state : 'inconnu'); })
          .catch(function () { cb('inconnu'); });
      } catch (e) { cb('inconnu'); }
    },
    autoLocaliser: function (onFix, onErr) {
      var self = this;
      function go() { self.localiser(onFix, function (msg, e) { if (e && e.code === 1) { try { localStorage.removeItem('pec-geo-ok'); } catch (x) {} } if (onErr) onErr(msg, e); }); }
      if (this.accordConnu()) { go(); return true; }
      /* ══ (19/09, soir — « faut accepter la localisation ») ELLE NE SE DEMANDAIT JAMAIS ══════════════════
         On rendait `true` dès que l'API Permissions existe — c'est-à-dire sur TOUS les navigateurs modernes —
         alors qu'on ne localisait que si l'état était déjà « granted ». En « prompt » (le cas de tout nouveau
         visiteur) : aucune localisation, aucune erreur, et les quatre écrans qui lisent ce retour n'affichaient
         PAS leur encart d'explication — la position n'était donc jamais demandée, nulle part.
         Désormais on rend `false` : l'écran affiche son encart (« voilà à quoi ça sert », puis un bouton), et si
         la permission était déjà accordée, la promesse localise et l'encart se referme tout seul. On ne
         déclenche jamais la popup du navigateur sans avoir d'abord dit pourquoi. */
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function (st) {
          if (st.state === 'granted') { self.noterAccord(); go(); }
        }).catch(function () {});
      }
      return false;
    },
    /* LE TEMPS AU-DELÀ DUQUEL ON ARRÊTE D'ATTENDRE et où l'on DIT qu'on n'a rien eu. Nommé plutôt qu'écrit
       au milieu d'un setTimeout : c'est un réglage, et le banc doit pouvoir éprouver le silence sans
       attendre vingt secondes. */
    delaiMaxMs: 20000,
    localiser: function (onFix, onErr) {
      if (!navigator.geolocation) { if (onErr) onErr(messageErreur(null)); return null; }
      var fini = false, meilleur = null, watchId = null, dit = false;
      function stop() { if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; } }
      function echouer(e) { if (dit || meilleur) return; dit = true; stop(); if (onErr) onErr(messageErreur(e), e); }
      function reussir(f) { dit = true; meilleur = f; onFix(f); }
      /* (20/09) SI LE SITE EST DÉJÀ BLOQUÉ, ON LE DIT TOUT DE SUITE. Le navigateur ne repose jamais la
         question une fois « Bloquer » cliqué : `getCurrentPosition` échoue en silence quelques millisecondes
         plus tard, et l'écran restait sur « Recherche de ta position… ». Autant nommer le geste. */
      this.permissionEtat(function (etat) {
        if (etat === 'denied' && !meilleur) echouer({ code: 1 });
      });
      if (pageNonSure()) { echouer({ code: 1 }); return null; }
      // 1) le fix RAPIDE : une position récente du système (cache 60 s) — réponse quasi instantanée
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (fini) return;
        reussir(fix(pos, false));   // une position qui arrive APRÈS un refus annoncé reste une position : on la prend
      }, function () { /* pas de cache : l'affinage ci-dessous prend le relais */ },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 3000 });
      // 2) l'AFFINAGE : haute précision, chaque amélioration remonte
      watchId = navigator.geolocation.watchPosition(function (pos) {
        var f = fix(pos, true);
        if (!meilleur || f.precision <= meilleur.precision) { reussir(f); }
        if (f.precision <= 25) { fini = true; stop(); }
      }, function (e) { echouer(e); }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });
      /* (20/09) ET SI RIEN NE RÉPOND — NI FIX, NI ERREUR — ON LE DIT AUSSI. Ce garde-fou coupait la montre
         de position et s'arrêtait là : l'écran gardait « Recherche de ta position… » indéfiniment, ce qui se
         lit exactement comme « ça ne détecte pas ». Un silence est un échec, et un échec s'affiche. */
      setTimeout(function () { fini = true; stop(); if (!meilleur && !dit) echouer({ code: 3 }); }, this.delaiMaxMs);
      return { stop: stop };
    },
    suivre: function (onFix, onErr) {
      if (!navigator.geolocation) { if (onErr) onErr(messageErreur(null)); return null; }
      var id = navigator.geolocation.watchPosition(function (pos) { onFix(fix(pos, true)); },
        function (e) { if (onErr) onErr(messageErreur(e), e); },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
      return { stop: function () { navigator.geolocation.clearWatch(id); } };
    },
    /* (18/09, soir) `simulerTrajet` est parti avec l'agent de caisse mobile : il faisait glisser le point le long de
       l'itinéraire OSRM pour montrer l'agent en route vers le client. Personne ne se déplace plus. */
    /* ── AUTOCOMPLÉTION D'ADRESSES (28/08 — fondatrice : « numéro, voie, code
          postal, ville sélectionnables, recherchables ») : la Base Adresse
          Nationale (api-adresse.data.gouv.fr — publique, sans clé). Chaque
          suggestion porte son libellé complet ET sa géoposition : choisir une
          adresse la géolocalise d'office. Biais de proximité : la dernière
          position connue priorise les résultats proches. ── */
    chercherAdresses: function (q, cb) {
      if (!q || q.trim().length < 3) { cb([]); return; }
      var url = 'https://api-adresse.data.gouv.fr/search/?limit=5&q=' + encodeURIComponent(q.trim());
      var dp = this.dernierePos ? this.dernierePos() : null;
      if (dp) url += '&lat=' + dp.lat + '&lon=' + dp.lng;
      fetch(url, { signal: (window.AbortSignal && AbortSignal.timeout) ? AbortSignal.timeout(5000) : undefined })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          cb((j && j.features || []).map(function (f) {
            var pr = f.properties || {};
            return { label: pr.label, ville: pr.city, cp: pr.postcode,
                     numero: pr.housenumber || '', voie: pr.street || pr.name || '',
                     geo: (f.geometry && f.geometry.coordinates) ? { lat: +f.geometry.coordinates[1].toFixed(6), lng: +f.geometry.coordinates[0].toFixed(6), precision: 10 } : null };
          }));
        })
        .catch(function () { cb([]); });
    },
    /* branche l'autocomplétion sur un input : suggestions sous le champ,
       debounce 300 ms, clic = adresse complète + geo → onPick(s). */
    autocompleteAdresse: function (input, onPick) {
      if (!input) return;
      var self = this, timer = null, boite = null;
      function fermer() { if (boite) { boite.remove(); boite = null; } }
      function ouvrir(suggestions) {
        fermer();
        if (!suggestions.length) return;
        boite = document.createElement('div');
        boite.setAttribute('data-pec-suggestions', '');
        boite.style.cssText = 'position:absolute;left:0;right:0;top:100%;z-index:80;background:var(--color-card, #fff);border-radius:12px;box-shadow:0 14px 34px rgba(15,42,36,.22);overflow:hidden;margin-top:4px';
        suggestions.forEach(function (sug) {
          var b = document.createElement('button');
          b.type = 'button';
          b.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 12px;font-size:12.5px;line-height:1.4;color:var(--color-ink, #1a1f1c);background:none;border:none;border-bottom:1px solid var(--color-sep, #eee);cursor:pointer';
          b.textContent = sug.label;
          b.addEventListener('mousedown', function (e) {   // mousedown : avant le blur de l'input
            e.preventDefault();
            input.value = sug.label;
            fermer();
            if (onPick) onPick(sug);
          });
          boite.appendChild(b);
        });
        var host = input.parentNode;
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        host.appendChild(boite);
      }
      input.setAttribute('autocomplete', 'off');
      input.addEventListener('input', function () {
        clearTimeout(timer);
        var v = input.value;
        if (v.trim().length < 3) { fermer(); return; }
        timer = setTimeout(function () { self.chercherAdresses(v, ouvrir); }, 300);
      });
      input.addEventListener('blur', function () { setTimeout(fermer, 150); });
    },
    /* ══ (20/09, fondatrice : « il peut changer par SA POSITION ou une adresse saisie — numéro de rue,
       rue, code postal, ville ; ATTENTION RÉCUPÈRE LE NOM DES RUES ») L'ADRESSE DEPUIS LA POSITION ══════
       `rueDepuis` rendait une PHRASE (« avenue Jean Jaurès, 13001 Marseille ») qu'aucun formulaire ne
       pouvait consommer — ni numéro, ni voie, ni code postal séparés — et personne ne l'appelait : se
       localiser ne remplissait donc RIEN. Elle est remplacée par le reverse de la base qui sert déjà la
       recherche (BAN), qui rend exactement la forme d'une suggestion : le même remplissage sert aux deux.
       La géoposition rendue est celle de l'APPAREIL, pas le centre de la voie : c'est elle qui mène le
       distributeur à la porte. cb(null) hors ligne — on ne devine jamais une rue. */
    adresseDepuisPosition: function (pos, cb) {
      if (!pos || !isFinite(pos.lat) || !isFinite(pos.lng)) { cb(null); return; }
      if (cacheRue && window.PEC_DATA && PEC_DATA.distanceM(cacheRue.pos, pos) < 80) { cb(cacheRue.adr); return; }
      fetch('https://api-adresse.data.gouv.fr/reverse/?lat=' + pos.lat + '&lon=' + pos.lng,
        { signal: (window.AbortSignal && AbortSignal.timeout) ? AbortSignal.timeout(5000) : undefined })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var f = (j && j.features || [])[0];
          if (!f) { cb(null); return; }
          var pr = f.properties || {};
          var a = { label: pr.label, ville: pr.city, cp: pr.postcode,
                    numero: pr.housenumber || '', voie: pr.street || pr.name || '',
                    geo: { lat: pos.lat, lng: pos.lng, precision: pos.precision || 10 } };
          cacheRue = { pos: pos, adr: a };
          cb(a);
        })
        .catch(function () { cb(null); });
    }
  };
})();

/* (18/09, soir) L'AUTO-SOURCE `.pec-fdep` (frais de déplacement) et `.pec-atot` (total agent) est partie avec
      l'agent de caisse mobile : aucune page ne porte plus ces classes, et `scenario.fraisDeplacement` comme
      `scenario.agentTotal` n'ont plus de sens. Ce qui suit reste : la livraison, la rétention de position, la
      ligne société et les formulaires. ── */
/* ══ (19/09, nuit) UNE PAGE VIVANTE S'ANNONCE ═════════════════════════════════════════════════
   Deux pages PayEnCash ouvertes sur la même origine partagent le même stockage. La seconde se repeint
   quand la première écrit — et réécrit au passage SA copie des données, vieille de son chargement. Une
   pièce publiée à l'instant disparaît, un bon émis s'évapore : c'est ce qui faisait tomber des scénarios
   au hasard, et c'est invisible à l'œil nu.
   Une page qui charge cette couche répond donc « je suis là » à qui le demande. Le banc s'en sert pour
   REFUSER DE JOUER plutôt que de rendre un résultat faux ; rien d'autre ne dépend de ce canal, et une
   absence de réponse n'empêche jamais une page de fonctionner. */
if (typeof BroadcastChannel !== 'undefined' && typeof location !== 'undefined') {
  try {
    var _pecPresence = new BroadcastChannel('pec-presence');
    _pecPresence.onmessage = function (e) {
      if (!e || !e.data || e.data.q !== 'qui-est-la') return;
      try { _pecPresence.postMessage({ ici: location.href }); } catch (e2) {}
    };
  } catch (e) {}
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    try {
      if (window.PEC_GEO && PEC_GEO.appliquerRetention) PEC_GEO.appliquerRetention();
      if (PEC_DATA.societeAppliquer) PEC_DATA.societeAppliquer();
      if (PEC_DATA.marqueAppliquer) PEC_DATA.marqueAppliquer();   // (21/09) la marque de chaque app et son slogan
      if (PEC_DATA.otpAppliquer) PEC_DATA.otpAppliquer();         // (24/09, soir) la longueur des codes de vérification
    } catch (e) {}
  });
}
