"""Localized seed content for ARCHIVO BÍBLICO PERDIDO.
Entities (characters, locations, events), questions and per-entity clues.
All content is bilingual (es/en) and expandable via the admin panel.
"""

IMG = "https://static.prod-images.emergentagent.com/jobs/853e5b4e-0492-4560-99fd-a438ec12e4f4/images/{}.jpeg"


def _img(h):
    return IMG.format(h)


# ----------------------------- CHARACTERS -----------------------------
CHARACTERS = [
    {
        "id": "jesus", "category": "character", "active": True,
        "image": _img("08cb86c4ae15794fa517edfcb7b4f5dbcb0440e56f736ae4cd8f9031785e14a3"),
        "references": ["Juan 1:14", "Lucas 2:11"],
        "translations": {
            "es": {"name": "Jesús", "description": "Maestro y Salvador nacido en Belén."},
            "en": {"name": "Jesus", "description": "Teacher and Savior born in Bethlehem."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje realizó milagros.", "Este personaje aparece en el Nuevo Testamento."],
            "en": ["The missing character is male.", "This character performed miracles.", "This character appears in the New Testament."],
        },
    },
    {
        "id": "pablo", "category": "character", "active": True,
        "image": _img("af63344988f7f02214b64cd8439e5bde5b43dfd5786a8064adee32b7f05ee4d8"),
        "references": ["Hechos 9:15", "Filipenses 1:1"],
        "translations": {
            "es": {"name": "Pablo", "description": "Apóstol y misionero, autor de varias cartas."},
            "en": {"name": "Paul", "description": "Apostle and missionary, author of several letters."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje escribió parte de la Biblia.", "Este personaje aparece en el Nuevo Testamento."],
            "en": ["The missing character is male.", "This character wrote part of the Bible.", "This character appears in the New Testament."],
        },
    },
    {
        "id": "moises", "category": "character", "active": True,
        "image": _img("1713c2f5ccdbe96ae698f8ae0bb0108d5c72fd86aa1a3c93648f9a6a9f9d069b"),
        "references": ["Éxodo 3:10", "Deuteronomio 34:10"],
        "translations": {
            "es": {"name": "Moisés", "description": "Profeta que guió a Israel fuera de Egipto."},
            "en": {"name": "Moses", "description": "Prophet who led Israel out of Egypt."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje guió al pueblo de Israel.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is male.", "This character led the people of Israel.", "This character appears in the Hebrew Scriptures."],
        },
    },
    {
        "id": "david", "category": "character", "active": True,
        "image": _img("bc36eefe5d5d1812b6c08036c3790483ef4d5a6afd6ee752e45dcbcd8260a512"),
        "references": ["1 Samuel 16:13", "Salmos 23:1"],
        "translations": {
            "es": {"name": "David", "description": "Pastor que llegó a ser rey de Israel."},
            "en": {"name": "David", "description": "Shepherd who became king of Israel."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje fue rey de Israel.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is male.", "This character was a king of Israel.", "This character appears in the Hebrew Scriptures."],
        },
    },
    {
        "id": "ester", "category": "character", "active": True,
        "image": _img("2880f06396882603c47b40f375bd77ef759de683aaa553e6c7c11e70720abdd2"),
        "references": ["Ester 2:17", "Ester 4:14"],
        "translations": {
            "es": {"name": "Ester", "description": "Reina que salvó a su pueblo con valentía."},
            "en": {"name": "Esther", "description": "Queen who bravely saved her people."},
        },
        "clues": {
            "es": ["El personaje perdido es mujer.", "Este personaje llegó a ser reina.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is female.", "This character became a queen.", "This character appears in the Hebrew Scriptures."],
        },
    },
    {
        "id": "daniel", "category": "character", "active": True,
        "image": _img("12a83ce8499390e9bd50e9c6d579764815dc5227ae2aa63bf5ccdbf50dd5640f"),
        "references": ["Daniel 1:6", "Daniel 6:22"],
        "translations": {
            "es": {"name": "Daniel", "description": "Profeta fiel llevado cautivo a Babilonia."},
            "en": {"name": "Daniel", "description": "Faithful prophet taken captive to Babylon."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje fue llevado a Babilonia.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is male.", "This character was taken to Babylon.", "This character appears in the Hebrew Scriptures."],
        },
    },
    {
        "id": "pedro", "category": "character", "active": True,
        "image": _img("ee9df46bca8fd409f8e682289559b643b9e9d92568f6ad70dff9b52d46b3d930"),
        "references": ["Mateo 4:18", "Mateo 16:16"],
        "translations": {
            "es": {"name": "Pedro", "description": "Pescador que se convirtió en apóstol."},
            "en": {"name": "Peter", "description": "Fisherman who became an apostle."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje fue pescador.", "Este personaje aparece en el Nuevo Testamento."],
            "en": ["The missing character is male.", "This character was a fisherman.", "This character appears in the New Testament."],
        },
    },
    {
        "id": "rahab", "category": "character", "active": True,
        "image": _img("348b17cd52cf24f8a202ba929fe1f79e2a875e55fb941269c34849f4420c5f65"),
        "references": ["Josué 2:1", "Hebreos 11:31"],
        "translations": {
            "es": {"name": "Rahab", "description": "Mujer de Jericó que ayudó a los espías."},
            "en": {"name": "Rahab", "description": "Woman of Jericho who helped the spies."},
        },
        "clues": {
            "es": ["El personaje perdido es mujer.", "Este personaje vivió en Jericó.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is female.", "This character lived in Jericho.", "This character appears in the Hebrew Scriptures."],
        },
    },
    {
        "id": "gedeon", "category": "character", "active": True,
        "image": _img("c988e6f2009fb1257237d92a5893fa4d74a5240faf7d2e04645aefef50c8f244"),
        "references": ["Jueces 6:12", "Jueces 7:20"],
        "translations": {
            "es": {"name": "Gedeón", "description": "Juez que venció con solo 300 hombres."},
            "en": {"name": "Gideon", "description": "Judge who won with only 300 men."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje fue un juez de Israel.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is male.", "This character was a judge of Israel.", "This character appears in the Hebrew Scriptures."],
        },
    },
    {
        "id": "elias", "category": "character", "active": True,
        "image": _img("5d5c7d379c2e19447c008eebb1e549009c75025ae493cb4cf3207d6f93e235e4"),
        "references": ["1 Reyes 18:38", "1 Reyes 17:1"],
        "translations": {
            "es": {"name": "Elías", "description": "Profeta de fuego en el Monte Carmelo."},
            "en": {"name": "Elijah", "description": "Prophet of fire at Mount Carmel."},
        },
        "clues": {
            "es": ["El personaje perdido es hombre.", "Este personaje fue profeta.", "Este personaje aparece en las Escrituras Hebreas."],
            "en": ["The missing character is male.", "This character was a prophet.", "This character appears in the Hebrew Scriptures."],
        },
    },
]

# ----------------------------- LOCATIONS -----------------------------
LOCATIONS = [
    {"id": "jerusalen", "hash": "02ece8b211382bc5f282eba4df7b7ff9772e316502d33d012660451a7b7ef827", "map": {"x": 52, "y": 46},
     "es": ("Jerusalén", "Ciudad santa con el gran templo."), "en": ("Jerusalem", "Holy city with the great temple."),
     "ref": ["2 Crónicas 3:1"], "clues_es": ["El lugar perdido tiene un templo importante.", "El lugar aparece en las Escrituras."], "clues_en": ["The missing place has an important temple.", "The place appears in the Scriptures."]},
    {"id": "jerico", "hash": "068589d4fde1fd3c5749a67cbcc076676dbe1adb40c619bc0ce285be11fdb942", "map": {"x": 56, "y": 44},
     "es": ("Jericó", "Ciudad amurallada del desierto."), "en": ("Jericho", "Walled city of the desert."),
     "ref": ["Josué 6:1"], "clues_es": ["El lugar perdido tenía grandes murallas.", "El lugar aparece en las Escrituras Hebreas."], "clues_en": ["The missing place had great walls.", "The place appears in the Hebrew Scriptures."]},
    {"id": "belen", "hash": "4eb1b54354bfb82cc0fb95b5e0174096d6aca2432d8e75a1d19b878d4eff28e6", "map": {"x": 50, "y": 50},
     "es": ("Belén", "Pequeño pueblo donde nació Jesús."), "en": ("Bethlehem", "Small town where Jesus was born."),
     "ref": ["Miqueas 5:2"], "clues_es": ["En el lugar perdido nació un rey.", "El lugar es un pueblo pequeño."], "clues_en": ["A king was born in the missing place.", "The place is a small town."]},
    {"id": "galilea", "hash": "d98e7a06914e700fec26d834fe93fd9d8be781738b270bbc183a7b7a6674889d", "map": {"x": 55, "y": 34},
     "es": ("Galilea", "Región del lago y los pescadores."), "en": ("Galilee", "Region of the lake and fishermen."),
     "ref": ["Mateo 4:18"], "clues_es": ["El lugar perdido está junto a un lago.", "El lugar aparece en el Nuevo Testamento."], "clues_en": ["The missing place is by a lake.", "The place appears in the New Testament."]},
    {"id": "babilonia", "hash": "2d0f29a5a9267faccd9ec09243e60bd509216600c3cdf46db878e0ddee18f58a", "map": {"x": 80, "y": 42},
     "es": ("Babilonia", "Gran ciudad del imperio en Mesopotamia."), "en": ("Babylon", "Great city of the empire in Mesopotamia."),
     "ref": ["Daniel 1:1"], "clues_es": ["El lugar perdido fue un gran imperio.", "El lugar aparece en las Escrituras Hebreas."], "clues_en": ["The missing place was a great empire.", "The place appears in the Hebrew Scriptures."]},
    {"id": "egipto", "hash": "d19a12ac5eaf8bdc3788f090d31207bd6ddbae0798bdb9f6cf151060d7316690", "map": {"x": 34, "y": 66},
     "es": ("Egipto", "Tierra de las pirámides y el Nilo."), "en": ("Egypt", "Land of the pyramids and the Nile."),
     "ref": ["Éxodo 1:8"], "clues_es": ["El lugar perdido tuvo esclavitud del pueblo de Israel.", "El lugar tiene un gran río."], "clues_en": ["The missing place held Israel in slavery.", "The place has a great river."]},
    {"id": "ninive", "hash": "7b3529db6fe1d36ae6c297127ea33b47bd975c5a08b2ac954fcc7042684e9db8", "map": {"x": 78, "y": 28},
     "es": ("Nínive", "Gran ciudad a la que fue enviado Jonás."), "en": ("Nineveh", "Great city where Jonah was sent."),
     "ref": ["Jonás 3:2"], "clues_es": ["Un profeta fue enviado al lugar perdido.", "El lugar era una ciudad muy grande."], "clues_en": ["A prophet was sent to the missing place.", "The place was a very large city."]},
    {"id": "carmelo", "hash": "bdab4144dc4d680af576d6c4121a394fb1c116766b4468fc4ea16946a188fffc", "map": {"x": 51, "y": 32},
     "es": ("Monte Carmelo", "Monte donde cayó fuego del cielo."), "en": ("Mount Carmel", "Mountain where fire fell from heaven."),
     "ref": ["1 Reyes 18:20"], "clues_es": ["El lugar perdido es un monte.", "Allí ocurrió un milagro de fuego."], "clues_en": ["The missing place is a mountain.", "A fire miracle happened there."]},
    {"id": "ararat", "hash": "65b1cab64d5e559b61e8ecda2d330de4cde8d7ec9dd7d8dbd9d911f12d8ee9d3", "map": {"x": 74, "y": 20},
     "es": ("Ararat", "Montes donde reposó el arca."), "en": ("Ararat", "Mountains where the ark rested."),
     "ref": ["Génesis 8:4"], "clues_es": ["El lugar perdido es una montaña alta.", "Allí reposó una embarcación."], "clues_en": ["The missing place is a tall mountain.", "A vessel rested there."]},
    {"id": "damasco", "hash": "02a092b45e287bae3e90a7401d6e57cc8ba9ffdc64891f48519d36ee1f4c9cfa", "map": {"x": 60, "y": 26},
     "es": ("Damasco", "Ciudad del camino donde cambió Pablo."), "en": ("Damascus", "City on the road where Paul changed."),
     "ref": ["Hechos 9:3"], "clues_es": ["En el camino al lugar perdido cambió un perseguidor.", "El lugar aparece en el Nuevo Testamento."], "clues_en": ["A persecutor changed on the road to the missing place.", "The place appears in the New Testament."]},
]

# ----------------------------- EVENTS -----------------------------
EVENTS = [
    {"id": "mar_rojo", "hash": "839b6950b3724df0dcd71da2375c70640a320487fd92be284887b86514cdb73a",
     "es": ("Cruce del Mar Rojo", "El mar se abrió para el pueblo de Israel."), "en": ("Crossing of the Red Sea", "The sea opened for the people of Israel."),
     "ref": ["Éxodo 14:21"], "clues_es": ["El acontecimiento involucró un milagro con agua.", "Ocurrió durante la salida de Egipto."], "clues_en": ["The event involved a water miracle.", "It happened during the exit from Egypt."]},
    {"id": "jerico", "hash": "9b13d5d3aac70814fa639a369778fc6be0c80e293647f71e2cc0a51b215529cd",
     "es": ("Caída de Jericó", "Las murallas cayeron tras rodear la ciudad."), "en": ("Fall of Jericho", "The walls fell after marching around the city."),
     "ref": ["Josué 6:20"], "clues_es": ["El acontecimiento derribó murallas.", "Involucró trompetas."], "clues_en": ["The event brought down walls.", "It involved trumpets."]},
    {"id": "carmelo", "hash": "fff50a7c14ced75c13c43e3f74256f3462e3e22ff1a921752064d1718bfe6da7",
     "es": ("Fuego en el Monte Carmelo", "Cayó fuego sobre el altar del profeta."), "en": ("Fire on Mount Carmel", "Fire fell on the prophet's altar."),
     "ref": ["1 Reyes 18:38"], "clues_es": ["El acontecimiento involucró fuego del cielo.", "Ocurrió en un monte."], "clues_en": ["The event involved fire from heaven.", "It happened on a mountain."]},
    {"id": "daniel_leones", "hash": "98792c535221f9f3e3339bb8aef87844f4b220b01feab04f9f247caf45eabb5e",
     "es": ("Daniel en el foso de los leones", "Dios cerró la boca de los leones."), "en": ("Daniel in the lions' den", "God shut the lions' mouths."),
     "ref": ["Daniel 6:22"], "clues_es": ["El acontecimiento involucró animales peligrosos.", "Ocurrió en Babilonia."], "clues_en": ["The event involved dangerous animals.", "It happened in Babylon."]},
    {"id": "diluvio", "hash": "ac9a13ca2a3f07349f144f1401cf164865805c01586b56482f13505b6455c136",
     "es": ("El Diluvio", "Una gran inundación cubrió la tierra."), "en": ("The Flood", "A great flood covered the earth."),
     "ref": ["Génesis 7:17"], "clues_es": ["El acontecimiento involucró mucha agua y un arca.", "Aparece en el libro de Génesis."], "clues_en": ["The event involved much water and an ark.", "It appears in the book of Genesis."]},
    {"id": "david_goliat", "hash": "a5f23c26fc8cf89b5b54eae5743fd803e5de69c299be962ab9c2fd216611d8d3",
     "es": ("David y Goliat", "Un joven venció a un gigante con una honda."), "en": ("David and Goliath", "A young man defeated a giant with a sling."),
     "ref": ["1 Samuel 17:49"], "clues_es": ["El acontecimiento involucró a un gigante.", "Un joven usó una honda."], "clues_en": ["The event involved a giant.", "A young man used a sling."]},
    {"id": "jesus_tormenta", "hash": "b7ce982bceb3e1f72b20690f8230353efd51477fa6720b72fd675ec8b6d4e939",
     "es": ("Jesús calma la tormenta", "Con una orden el mar quedó en calma."), "en": ("Jesus calms the storm", "With a word the sea became calm."),
     "ref": ["Marcos 4:39"], "clues_es": ["El acontecimiento ocurrió en un lago.", "Aparece en el Nuevo Testamento."], "clues_en": ["The event happened on a lake.", "It appears in the New Testament."]},
    {"id": "tres_hebreos", "hash": "95b8deb7099a811cb32c66702f2fffbdf57262c503217d3bc39d9e1da3922e77",
     "es": ("Los tres hebreos en el horno", "Salieron ilesos del fuego ardiente."), "en": ("The three Hebrews in the furnace", "They came out of the fire unharmed."),
     "ref": ["Daniel 3:27"], "clues_es": ["El acontecimiento involucró un horno de fuego.", "Ocurrió en Babilonia."], "clues_en": ["The event involved a fiery furnace.", "It happened in Babylon."]},
    {"id": "jonas", "hash": "3f9636891f33d21ebee14fd3a8edf345a507e1564e67d8f36d56d2d717419ea3",
     "es": ("Jonás y el gran pez", "Un gran pez se tragó al profeta."), "en": ("Jonah and the great fish", "A great fish swallowed the prophet."),
     "ref": ["Jonás 1:17"], "clues_es": ["El acontecimiento involucró un gran pez.", "Un profeta huía de Dios."], "clues_en": ["The event involved a great fish.", "A prophet was fleeing from God."]},
    {"id": "ultima_cena", "hash": "387b3383fd2865910d57f58c58a6faf28f38e304a4955b6c443c32ef6d012adf",
     "es": ("La Última Cena", "Jesús compartió el pan y la copa."), "en": ("The Last Supper", "Jesus shared the bread and the cup."),
     "ref": ["Lucas 22:19"], "clues_es": ["El acontecimiento involucró pan y una copa.", "Aparece en el Nuevo Testamento."], "clues_en": ["The event involved bread and a cup.", "It appears in the New Testament."]},
]


def _build_locations():
    out = []
    for l in LOCATIONS:
        out.append({
            "id": l["id"], "category": "location", "active": True,
            "image": _img(l["hash"]), "map_position": l["map"], "references": l["ref"],
            "translations": {"es": {"name": l["es"][0], "description": l["es"][1]},
                             "en": {"name": l["en"][0], "description": l["en"][1]}},
            "clues": {"es": ["El lugar perdido aparece en las Escrituras."] + l["clues_es"],
                      "en": ["The missing place appears in the Scriptures."] + l["clues_en"]},
        })
    return out


def _build_events():
    out = []
    for e in EVENTS:
        out.append({
            "id": e["id"], "category": "event", "active": True,
            "image": _img(e["hash"]), "references": e["ref"],
            "translations": {"es": {"name": e["es"][0], "description": e["es"][1]},
                             "en": {"name": e["en"][0], "description": e["en"][1]}},
            "clues": {"es": ["El acontecimiento perdido aparece en la Biblia."] + e["clues_es"],
                      "en": ["The missing event appears in the Bible."] + e["clues_en"]},
        })
    return out


def all_entities():
    return CHARACTERS + _build_locations() + _build_events()


# ----------------------------- QUESTIONS -----------------------------
def Q(qid, category, entity, rank, correct, ref, es, en):
    """es/en = (question, [a,b,c,d], explanation)"""
    return {
        "id": qid, "category": category, "related_entity_id": entity, "rank": rank,
        "correct_answer": correct, "bible_reference": ref, "active": True,
        "translations": {
            "es": {"question": es[0], "answer_a": es[1][0], "answer_b": es[1][1],
                   "answer_c": es[1][2], "answer_d": es[1][3], "explanation": es[2]},
            "en": {"question": en[0], "answer_a": en[1][0], "answer_b": en[1][1],
                   "answer_c": en[1][2], "answer_d": en[1][3], "explanation": en[2]},
        },
    }


QUESTIONS = [
    # ---- CHARACTERS ----
    Q("q_david_1", "character", "david", "explorer", "B", "1 Samuel 17:49",
      ("¿Quién derrotó a Goliat?", ["Moisés", "David", "Pedro", "Daniel"], "David venció al gigante Goliat con una honda y una piedra."),
      ("Who defeated Goliath?", ["Moses", "David", "Peter", "Daniel"], "David defeated the giant Goliath with a sling and a stone.")),
    Q("q_david_2", "character", "david", "investigator", "C", "1 Samuel 16:13",
      ("¿Qué oficio tenía David antes de ser rey?", ["Carpintero", "Pescador", "Pastor", "Escriba"], "David cuidaba las ovejas de su padre antes de ser ungido rey."),
      ("What was David's job before becoming king?", ["Carpenter", "Fisherman", "Shepherd", "Scribe"], "David tended his father's sheep before being anointed king.")),
    Q("q_david_3", "character", "david", "archaeologist", "A", "Salmos 23:1",
      ("¿Qué colección de cantos se atribuye en gran parte a David?", ["Salmos", "Proverbios", "Eclesiastés", "Cantares"], "Muchos de los Salmos se atribuyen a David."),
      ("Which collection of songs is largely attributed to David?", ["Psalms", "Proverbs", "Ecclesiastes", "Song of Songs"], "Many of the Psalms are attributed to David.")),
    Q("q_moises_1", "character", "moises", "explorer", "A", "Éxodo 3:10",
      ("¿A quién usó Dios para sacar a Israel de Egipto?", ["Moisés", "Josué", "Aarón", "Caleb"], "Dios llamó a Moisés para liberar a Israel de Egipto."),
      ("Whom did God use to lead Israel out of Egypt?", ["Moses", "Joshua", "Aaron", "Caleb"], "God called Moses to free Israel from Egypt.")),
    Q("q_moises_2", "character", "moises", "archaeologist", "D", "Éxodo 3:2",
      ("¿Cómo se le apareció Dios a Moisés la primera vez?", ["En un sueño", "En una nube", "En un trueno", "En una zarza ardiente"], "Dios habló a Moisés desde una zarza que ardía sin consumirse."),
      ("How did God first appear to Moses?", ["In a dream", "In a cloud", "In thunder", "In a burning bush"], "God spoke to Moses from a bush that burned without being consumed.")),
    Q("q_jesus_1", "character", "jesus", "explorer", "B", "Lucas 2:11",
      ("¿En qué ciudad nació Jesús?", ["Nazaret", "Belén", "Jerusalén", "Jericó"], "Jesús nació en Belén de Judea."),
      ("In which city was Jesus born?", ["Nazareth", "Bethlehem", "Jerusalem", "Jericho"], "Jesus was born in Bethlehem of Judea.")),
    Q("q_jesus_2", "character", "jesus", "investigator", "C", "Marcos 4:39",
      ("¿Qué hizo Jesús durante la tormenta en el mar?", ["Caminó a la orilla", "Durmió todo el tiempo", "Calmó el viento y el mar", "Llamó a otro barco"], "Jesús reprendió al viento y al mar, y hubo gran calma."),
      ("What did Jesus do during the storm on the sea?", ["Walked to shore", "Slept the whole time", "Calmed the wind and sea", "Called another boat"], "Jesus rebuked the wind and the sea, and there was a great calm.")),
    Q("q_pablo_1", "character", "pablo", "investigator", "A", "Hechos 13:2",
      ("¿Quién acompañó a Pablo en varios de sus viajes?", ["Bernabé", "Noé", "Josué", "Gedeón"], "Bernabé acompañó a Pablo en parte de su obra misionera."),
      ("Who accompanied Paul on several of his journeys?", ["Barnabas", "Noah", "Joshua", "Gideon"], "Barnabas accompanied Paul during part of his missionary work.")),
    Q("q_pablo_2", "character", "pablo", "archaeologist", "D", "Hechos 9:3",
      ("¿Camino a qué ciudad tuvo Pablo su encuentro con Jesús?", ["Roma", "Éfeso", "Corinto", "Damasco"], "Pablo se encontró con el Señor camino a Damasco."),
      ("On the road to which city did Paul meet Jesus?", ["Rome", "Ephesus", "Corinth", "Damascus"], "Paul met the Lord on the road to Damascus.")),
    Q("q_daniel_1", "character", "daniel", "explorer", "C", "Daniel 6:22",
      ("¿De qué peligro libró Dios a Daniel?", ["De un incendio", "De una tormenta", "De los leones", "De un gigante"], "Dios cerró la boca de los leones para proteger a Daniel."),
      ("From what danger did God save Daniel?", ["A fire", "A storm", "The lions", "A giant"], "God shut the lions' mouths to protect Daniel.")),
    Q("q_pedro_1", "character", "pedro", "explorer", "B", "Mateo 4:18",
      ("¿Qué oficio tenía Pedro cuando Jesús lo llamó?", ["Carpintero", "Pescador", "Soldado", "Médico"], "Pedro era pescador cuando Jesús lo llamó a seguirle."),
      ("What was Peter's job when Jesus called him?", ["Carpenter", "Fisherman", "Soldier", "Doctor"], "Peter was a fisherman when Jesus called him to follow.")),
    Q("q_ester_1", "character", "ester", "investigator", "A", "Ester 2:17",
      ("¿Qué llegó a ser Ester?", ["Reina", "Profeta", "Jueza", "Sacerdotisa"], "Ester llegó a ser reina y salvó a su pueblo."),
      ("What did Esther become?", ["Queen", "Prophet", "Judge", "Priestess"], "Esther became queen and saved her people.")),
    Q("q_rahab_1", "character", "rahab", "investigator", "C", "Josué 2:1",
      ("¿En qué ciudad vivía Rahab cuando ayudó a los espías?", ["Belén", "Nínive", "Jericó", "Babilonia"], "Rahab vivía en Jericó y escondió a los espías de Israel."),
      ("In which city did Rahab live when she helped the spies?", ["Bethlehem", "Nineveh", "Jericho", "Babylon"], "Rahab lived in Jericho and hid the spies of Israel.")),
    Q("q_gedeon_1", "character", "gedeon", "archaeologist", "D", "Jueces 7:7",
      ("¿Con cuántos hombres venció Gedeón al ejército enemigo?", ["3000", "1000", "600", "300"], "Dios le dio la victoria a Gedeón con solo 300 hombres."),
      ("With how many men did Gideon defeat the enemy army?", ["3000", "1000", "600", "300"], "God gave Gideon victory with only 300 men.")),
    Q("q_elias_1", "character", "elias", "investigator", "B", "1 Reyes 18:38",
      ("¿Qué cayó del cielo sobre el altar de Elías?", ["Lluvia", "Fuego", "Maná", "Granizo"], "Cayó fuego del cielo que consumió el sacrificio de Elías."),
      ("What fell from heaven onto Elijah's altar?", ["Rain", "Fire", "Manna", "Hail"], "Fire fell from heaven and consumed Elijah's sacrifice.")),

    # ---- LOCATIONS ----
    Q("q_jerico_1", "location", "jerico", "explorer", "A", "Josué 6:20",
      ("¿Qué le pasó a las murallas de Jericó?", ["Cayeron", "Se quemaron", "Crecieron", "Se movieron"], "Las murallas de Jericó cayeron después de que Israel las rodeó."),
      ("What happened to the walls of Jericho?", ["They fell", "They burned", "They grew", "They moved"], "The walls of Jericho fell after Israel marched around them.")),
    Q("q_jerusalen_1", "location", "jerusalen", "investigator", "C", "2 Crónicas 3:1",
      ("¿Qué construyó Salomón en Jerusalén?", ["Un palacio", "Un muro", "El templo", "Un mercado"], "Salomón edificó el templo del Señor en Jerusalén."),
      ("What did Solomon build in Jerusalem?", ["A palace", "A wall", "The temple", "A market"], "Solomon built the temple of the Lord in Jerusalem.")),
    Q("q_belen_1", "location", "belen", "explorer", "B", "Miqueas 5:2",
      ("¿Qué importante nacimiento ocurrió en Belén?", ["Moisés", "Jesús", "David y Goliat", "Jonás"], "Jesús nació en Belén, tal como fue anunciado."),
      ("What important birth happened in Bethlehem?", ["Moses", "Jesus", "David and Goliath", "Jonah"], "Jesus was born in Bethlehem, just as foretold.")),
    Q("q_galilea_1", "location", "galilea", "investigator", "A", "Mateo 4:18",
      ("¿Qué caracteriza a la región de Galilea?", ["Su lago y pescadores", "Sus pirámides", "Sus leones", "Su desierto sin agua"], "Galilea es conocida por su lago donde muchos eran pescadores."),
      ("What characterizes the region of Galilee?", ["Its lake and fishermen", "Its pyramids", "Its lions", "Its waterless desert"], "Galilee is known for its lake where many were fishermen.")),
    Q("q_babilonia_1", "location", "babilonia", "archaeologist", "D", "Daniel 1:1",
      ("¿A qué ciudad fue llevado cautivo Daniel?", ["Egipto", "Nínive", "Roma", "Babilonia"], "Daniel fue llevado cautivo a Babilonia."),
      ("To which city was Daniel taken captive?", ["Egypt", "Nineveh", "Rome", "Babylon"], "Daniel was taken captive to Babylon.")),
    Q("q_egipto_1", "location", "egipto", "explorer", "C", "Éxodo 1:8",
      ("¿De qué tierra salió Israel guiado por Moisés?", ["Babilonia", "Jericó", "Egipto", "Nínive"], "Israel salió de Egipto donde había estado esclavo."),
      ("From which land did Israel leave, led by Moses?", ["Babylon", "Jericho", "Egypt", "Nineveh"], "Israel left Egypt where they had been slaves.")),
    Q("q_ninive_1", "location", "ninive", "archaeologist", "B", "Jonás 3:2",
      ("¿A qué ciudad fue enviado Jonás a predicar?", ["Damasco", "Nínive", "Belén", "Ararat"], "Jonás fue enviado a la gran ciudad de Nínive."),
      ("To which city was Jonah sent to preach?", ["Damascus", "Nineveh", "Bethlehem", "Ararat"], "Jonah was sent to the great city of Nineveh.")),
    Q("q_carmelo_1", "location", "carmelo", "investigator", "A", "1 Reyes 18:20",
      ("¿En qué monte pidió Elías fuego del cielo?", ["Carmelo", "Ararat", "Sinaí", "Sion"], "El desafío de Elías ocurrió en el Monte Carmelo."),
      ("On which mountain did Elijah ask for fire from heaven?", ["Carmel", "Ararat", "Sinai", "Zion"], "Elijah's challenge took place on Mount Carmel.")),
    Q("q_ararat_1", "location", "ararat", "archaeologist", "D", "Génesis 8:4",
      ("¿Sobre qué montes reposó el arca de Noé?", ["Sinaí", "Carmelo", "Olivos", "Ararat"], "El arca reposó sobre los montes de Ararat."),
      ("On which mountains did Noah's ark rest?", ["Sinai", "Carmel", "Olives", "Ararat"], "The ark rested on the mountains of Ararat.")),
    Q("q_damasco_1", "location", "damasco", "investigator", "B", "Hechos 9:3",
      ("¿Camino a qué ciudad cambió la vida de Pablo?", ["Roma", "Damasco", "Corinto", "Atenas"], "Pablo tuvo su encuentro con Jesús camino a Damasco."),
      ("On the road to which city did Paul's life change?", ["Rome", "Damascus", "Corinth", "Athens"], "Paul had his encounter with Jesus on the road to Damascus.")),

    # ---- EVENTS ----
    Q("q_mar_rojo_1", "event", "mar_rojo", "explorer", "A", "Éxodo 14:21",
      ("¿Qué milagro ocurrió en el Mar Rojo?", ["El mar se abrió", "Cayó fuego", "Se secó un río", "Apareció maná"], "El mar se abrió para que Israel cruzara en seco."),
      ("What miracle happened at the Red Sea?", ["The sea opened", "Fire fell", "A river dried", "Manna appeared"], "The sea opened so Israel could cross on dry ground.")),
    Q("q_jerico_evt_1", "event", "jerico", "investigator", "C", "Josué 6:4",
      ("¿Qué usaron los israelitas al rodear Jericó?", ["Espadas", "Escaleras", "Trompetas", "Fuego"], "Tocaron trompetas y las murallas cayeron."),
      ("What did the Israelites use while marching around Jericho?", ["Swords", "Ladders", "Trumpets", "Fire"], "They blew trumpets and the walls fell.")),
    Q("q_carmelo_evt_1", "event", "carmelo", "investigator", "B", "1 Reyes 18:38",
      ("En el Monte Carmelo, ¿qué demostró el fuego del cielo?", ["Que llovería", "Que el Señor es Dios", "Que habría guerra", "Que vendría un rey"], "El fuego mostró que el Señor era el Dios verdadero."),
      ("On Mount Carmel, what did the fire from heaven prove?", ["That it would rain", "That the Lord is God", "That there would be war", "That a king would come"], "The fire showed that the Lord was the true God.")),
    Q("q_daniel_leones_1", "event", "daniel_leones", "explorer", "D", "Daniel 6:22",
      ("¿Cómo protegió Dios a Daniel entre los leones?", ["Los durmió", "Los sacó", "Envió lluvia", "Cerró sus bocas"], "Dios cerró la boca de los leones y Daniel no sufrió daño."),
      ("How did God protect Daniel among the lions?", ["Put them to sleep", "Removed them", "Sent rain", "Shut their mouths"], "God shut the lions' mouths and Daniel was unharmed.")),
    Q("q_diluvio_1", "event", "diluvio", "investigator", "A", "Génesis 7:17",
      ("¿Qué construyó Noé antes del Diluvio?", ["Un arca", "Una torre", "Un altar", "Un pozo"], "Noé construyó un arca para salvar a su familia y a los animales."),
      ("What did Noah build before the Flood?", ["An ark", "A tower", "An altar", "A well"], "Noah built an ark to save his family and the animals.")),
    Q("q_david_goliat_1", "event", "david_goliat", "explorer", "C", "1 Samuel 17:49",
      ("¿Con qué venció David a Goliat?", ["Una espada", "Un arco", "Una honda", "Una lanza"], "David venció a Goliat con una honda y una piedra."),
      ("With what did David defeat Goliath?", ["A sword", "A bow", "A sling", "A spear"], "David defeated Goliath with a sling and a stone.")),
    Q("q_jesus_tormenta_1", "event", "jesus_tormenta", "investigator", "B", "Marcos 4:39",
      ("¿Dónde calmó Jesús la tormenta?", ["En el río Nilo", "En el mar de Galilea", "En el Mar Rojo", "En un pozo"], "Jesús calmó la tormenta sobre el mar de Galilea."),
      ("Where did Jesus calm the storm?", ["On the Nile river", "On the Sea of Galilee", "On the Red Sea", "In a well"], "Jesus calmed the storm on the Sea of Galilee.")),
    Q("q_tres_hebreos_1", "event", "tres_hebreos", "archaeologist", "D", "Daniel 3:27",
      ("¿Qué les pasó a los tres hebreos en el horno?", ["Se quemaron", "Escaparon corriendo", "Se escondieron", "Salieron ilesos"], "Salieron del horno sin siquiera olor a fuego."),
      ("What happened to the three Hebrews in the furnace?", ["They burned", "They ran away", "They hid", "They came out unharmed"], "They came out of the furnace without even the smell of fire.")),
    Q("q_jonas_1", "event", "jonas", "explorer", "A", "Jonás 1:17",
      ("¿Qué se tragó a Jonás en el mar?", ["Un gran pez", "Una ola", "Un barco", "Una red"], "Un gran pez se tragó a Jonás por tres días."),
      ("What swallowed Jonah in the sea?", ["A great fish", "A wave", "A boat", "A net"], "A great fish swallowed Jonah for three days.")),
    Q("q_ultima_cena_1", "event", "ultima_cena", "investigator", "C", "Lucas 22:19",
      ("¿Qué compartió Jesús en la Última Cena?", ["Peces y panes", "Agua y sal", "Pan y copa", "Frutas"], "Jesús compartió el pan y la copa con sus discípulos."),
      ("What did Jesus share at the Last Supper?", ["Fish and loaves", "Water and salt", "Bread and cup", "Fruit"], "Jesus shared the bread and the cup with his disciples.")),

    # ---- GENERAL (for private-clue rolls) ----
    Q("q_gen_1", "general", None, "explorer", "B", "Josué 1:1",
      ("¿Quién dirigió a Israel después de Moisés?", ["Samuel", "Josué", "David", "Aarón"], "Josué tomó el liderazgo de Israel después de Moisés."),
      ("Who led Israel after Moses?", ["Samuel", "Joshua", "David", "Aaron"], "Joshua took leadership of Israel after Moses.")),
    Q("q_gen_2", "general", None, "explorer", "C", "Génesis 1:1",
      ("¿Con qué libro comienza la Biblia?", ["Éxodo", "Salmos", "Génesis", "Juan"], "La Biblia comienza con el libro de Génesis."),
      ("With which book does the Bible begin?", ["Exodus", "Psalms", "Genesis", "John"], "The Bible begins with the book of Genesis.")),
    Q("q_gen_3", "general", None, "investigator", "A", "Éxodo 20:1",
      ("¿Cuántos mandamientos recibió Moisés en el monte?", ["Diez", "Siete", "Doce", "Cinco"], "Moisés recibió los Diez Mandamientos en el monte Sinaí."),
      ("How many commandments did Moses receive on the mountain?", ["Ten", "Seven", "Twelve", "Five"], "Moses received the Ten Commandments on Mount Sinai.")),
    Q("q_gen_4", "general", None, "investigator", "D", "Mateo 2:1",
      ("¿Quiénes buscaron al niño Jesús siguiendo una estrella?", ["Pastores", "Soldados", "Sacerdotes", "Los magos"], "Los magos siguieron una estrella hasta el niño Jesús."),
      ("Who searched for the child Jesus following a star?", ["Shepherds", "Soldiers", "Priests", "The wise men"], "The wise men followed a star to the child Jesus.")),
    Q("q_gen_5", "general", None, "archaeologist", "B", "Génesis 37:3",
      ("¿A quién le hizo su padre una túnica de muchos colores?", ["Benjamín", "José", "Judá", "Rubén"], "Jacob le hizo a José una túnica especial de colores."),
      ("To whom did his father make a coat of many colors?", ["Benjamin", "Joseph", "Judah", "Reuben"], "Jacob made Joseph a special colorful coat.")),
    Q("q_gen_6", "general", None, "archaeologist", "C", "1 Reyes 3:9",
      ("¿Qué le pidió Salomón a Dios principalmente?", ["Riquezas", "Larga vida", "Sabiduría", "Victoria"], "Salomón pidió sabiduría para gobernar al pueblo."),
      ("What did Solomon mainly ask God for?", ["Riches", "Long life", "Wisdom", "Victory"], "Solomon asked for wisdom to govern the people.")),
]
